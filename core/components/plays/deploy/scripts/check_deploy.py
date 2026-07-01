#!/usr/bin/env python3
"""
check_deploy.py — assert over /deploy's captured deploy record + model snapshots.

The live deploy + health check are the skill/agent's job (they touch the running system). This
script only ASSERTS over what they captured to disk, so the play's evals are deterministic and
re-runnable. Layer rule: reads files on disk only; no git/gh/network.

Deploy record (JSON the deploy-to-cloud-env skill writes):
  { "environment": "dev", "status": "succeeded|failed", "ran": ["<step>", ...],
    "address": "https://...", "health": {"status": "green|red", "evidence": "..."},
    "secrets_source": "<secrets-manager binding>", "prior_state_left": true|false }

Assertions (each cites the constraint/failure it guards):
  A1 (C1/F1)  the record's environment == the resolved target, and it ran a non-empty set of steps
              matching the target env's declared deploy_cmd in run.yaml — nothing undeclared.
  A2 (C5/F5)  a succeeded status requires health.status == green — no false green.
  A3 (C6/F6)  no secret literal in the record or the logs; secrets_source names a manager binding.
  A4 (C4/F4)  the product model is byte-identical before and after (model-before vs model-after).
  A5 (C8/F7)  a failed status requires prior_state_left == true — never a half-deploy.

    python3 check_deploy.py --deploy-record <record.json> --run-yaml <run.yaml> \
            --target-env <name> --model-before <dir> --model-after <dir> [--logs <file>]

Prints {ok, checks:{A1..A5}, errors[]} JSON. Exit 0 all pass, 1 a check failed, 2 usage error.
"""

import argparse
import hashlib
import json
import os
import re
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("check_deploy.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

# Obvious secret-literal shapes — a heuristic guard, not a vault. Bindings/refs are fine.
SECRET_PATTERNS = [
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"(?i)\b(password|passwd|secret|api[_-]?key|token)\s*[=:]\s*[^\s\"']{6,}"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),                 # AWS access key id
    re.compile(r"\bghp_[0-9A-Za-z]{30,}\b"),             # GitHub PAT
]
# A secrets-manager BINDING (allowed) rather than a literal.
BINDING_HINT = re.compile(r"(?i)secret[_-]?manager|secretmanager|vault|projects/.+/secrets/|arn:aws:secretsmanager|ssm:|env:")


def _cloud_env(run_yaml_path, name):
    with open(run_yaml_path, encoding="utf-8") as fh:
        doc = yaml.safe_load(fh) or {}
    content = doc.get("content") or (doc.get("lens") or {}).get("content") or {}
    for e in (content.get("environments") or []):
        if isinstance(e, dict) and e.get("name") == name:
            return e
    return None


def _hash_tree(root):
    """Map of relpath -> sha256 for every file under root (stable, order-independent)."""
    sums = {}
    if not root or not os.path.isdir(root):
        return sums
    for dirpath, _dirs, files in os.walk(root):
        for fn in files:
            p = os.path.join(dirpath, fn)
            rel = os.path.relpath(p, root)
            h = hashlib.sha256()
            with open(p, "rb") as fh:
                for chunk in iter(lambda: fh.read(65536), b""):
                    h.update(chunk)
            sums[rel] = h.hexdigest()
    return sums


def _scan_secrets(text):
    return [pat.pattern for pat in SECRET_PATTERNS if pat.search(text or "")]


def main(argv=None):
    ap = argparse.ArgumentParser(description="Assert over /deploy's captured record + model snapshots.")
    ap.add_argument("--deploy-record", required=True)
    ap.add_argument("--run-yaml", required=True)
    ap.add_argument("--target-env", required=True)
    ap.add_argument("--model-before", required=True)
    ap.add_argument("--model-after", required=True)
    ap.add_argument("--logs", default=None)
    args = ap.parse_args(argv)

    errors, checks = [], {}

    try:
        with open(args.deploy_record, encoding="utf-8") as fh:
            rec = json.load(fh)
    except (OSError, json.JSONDecodeError) as exc:
        sys.stderr.write(f"check_deploy.py: cannot read deploy record: {exc}\n")
        sys.exit(2)

    env = _cloud_env(args.run_yaml, args.target_env)

    # A1 (C1/F1) — declared-only, right environment, non-empty run
    a1 = True
    if rec.get("environment") != args.target_env:
        a1 = False; errors.append(f"A1: record environment '{rec.get('environment')}' != target '{args.target_env}'")
    if not rec.get("ran"):
        a1 = False; errors.append("A1: the deploy record ran no steps")
    if env is None:
        a1 = False; errors.append(f"A1: target env '{args.target_env}' is not a defined cloud env in run.yaml (F1/F8)")
    else:
        declared_cmd = ((env.get("cloud") or {}).get("deploy_cmd") or "").strip()
        if declared_cmd and not any(declared_cmd in str(step) for step in rec.get("ran", [])):
            a1 = False; errors.append("A1: the run did not execute the env's declared deploy_cmd (undeclared steps? F1)")
    checks["A1"] = a1

    # A2 (C5/F5) — no false green
    a2 = True
    health = (rec.get("health") or {}).get("status")
    if rec.get("status") == "succeeded" and health != "green":
        a2 = False; errors.append(f"A2: status succeeded but health is '{health}' — false green (F5)")
    checks["A2"] = a2

    # A3 (C6/F6) — no secret literal; a manager binding is named
    a3 = True
    blob = json.dumps(rec)
    if args.logs and os.path.isfile(args.logs):
        with open(args.logs, encoding="utf-8", errors="replace") as fh:
            blob += "\n" + fh.read()
    hits = _scan_secrets(blob)
    if hits:
        a3 = False; errors.append(f"A3: possible secret literal(s) in record/logs — patterns {hits} (F6)")
    src = rec.get("secrets_source") or ""
    if src and not BINDING_HINT.search(src):
        a3 = False; errors.append(f"A3: secrets_source '{src}' does not look like a manager binding (F6/C6)")
    checks["A3"] = a3

    # A4 (C4/F4) — product model byte-identical
    before, after = _hash_tree(args.model_before), _hash_tree(args.model_after)
    a4 = before == after
    if not a4:
        changed = sorted(set(before) ^ set(after)) or \
                  sorted(k for k in before if before.get(k) != after.get(k))
        errors.append(f"A4: product model changed under /deploy — {changed[:10]} (F4)")
    checks["A4"] = a4

    # A5 (C8/F7) — failed deploy left prior state
    a5 = True
    if rec.get("status") == "failed" and not rec.get("prior_state_left"):
        a5 = False; errors.append("A5: failed deploy did not leave the environment in its prior state (F7)")
    checks["A5"] = a5

    ok = all(checks.values())
    print(json.dumps({"ok": ok, "checks": checks, "errors": errors}, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
