#!/usr/bin/env python3
"""
validate_run.py — assert /run's draft is grounded and considers the slice's hub.

Run over the draft before the checkpoint. In the spine+grounding model the run lens is an
MD grounding doc (`run.md`); its SHAPE (Environments / Rollout / Migrations / Config & secrets
/ CI/CD, each substantive) is checked by `lint_grounding.py`, and its UNDERSTANDABILITY by the
content eval — both run by the play's validate step. THIS script checks what the manifest
carries, which the prose can't enforce:

  - grounded: every grounding entry names a real source — the slice's HUB (a functionality,
    persona, or journey), the profile, or the ARCHITECTURE lens (run reads architecture, and
    only architecture among the lenses). Never another lens (ux/agentic/quality/measure/marketing).
  - decisions: a grounding flagged `material: true` names a `decision` that resolves.
  - coverage: every functionality of the slice is considered by the run plan (each appears in
    the manifest grounds) — the run lens can't ignore part of the slice.

Layer rule: reads files on disk only; no git/gh/network.

    python3 validate_run.py --draft <draft_dir> --manifest <run-manifest.yaml> \
            --slice-file <live slice record .yaml>

Prints {ok, errors[], warnings[], counts} JSON. Exit 0 clean, 1 on violation, 2 usage.
"""

import argparse
import glob
import json
import os
import re
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("validate_run.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

# run reads the architecture lens; these are the lenses it must NOT ground on.
OTHER_LENSES = ("agentic", "ux", "quality", "measure", "marketing", "lens")
# allowed grounding source types for run (architecture lens included).
ALLOWED = ("profile", "ice", "functionality", "persona", "journey", "architecture")


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _blank(v):
    if v is None:
        return True
    if isinstance(v, str):
        return len(v.strip()) == 0
    if isinstance(v, (list, dict)):
        return len(v) == 0
    return False


def collect_decisions(draft_root, errors):
    ids = set()
    for d in glob.glob(os.path.join(draft_root, "**", "decisions", "*.yaml"), recursive=True):
        dec = (load(d).get("decision") or {})
        for f in ("id", "title", "reason", "status", "level"):
            if _blank(dec.get(f)):
                errors.append(f"{d}: decision missing '{f}'")
        if dec.get("id"):
            ids.add(dec["id"])
    return ids


def check_grounding(man, decision_ids, errors):
    grounded = set()
    entries = man.get("grounds")
    if _blank(entries):
        errors.append("run plan has no grounding (grounds is empty)")
        return grounded
    for e in entries:
        st = (e.get("source_type") or "").strip().lower()
        if _blank(e.get("source")) and _blank(e.get("functionality_ref")):
            errors.append("a grounding entry has no source")
            continue
        if st in OTHER_LENSES:
            errors.append(f"grounds on lens '{st}' — /run reads the hub + the architecture "
                          f"lens, never {st}")
        elif st not in ALLOWED:
            errors.append(f"source_type '{st}' is not one of {ALLOWED}")
        if st in ("ice", "functionality"):
            fr = e.get("functionality_ref")
            if not _blank(fr):
                grounded.add(fr)
        if e.get("material") is True:
            dec = e.get("decision")
            if _blank(dec):
                errors.append("a material choice has no decision recorded")
            elif dec not in decision_ids:
                errors.append(f"a material choice names decision '{dec}' with no drafted record")
    return grounded


def slice_functionalities(slice_file, errors):
    if not slice_file or not os.path.isfile(slice_file):
        errors.append(f"slice record not found at {slice_file} — cannot verify coverage")
        return set()
    sl = (load(slice_file).get("slice") or {})
    return {(f or {}).get("functionality_ref") for f in (sl.get("functionalities") or [])
            if (f or {}).get("functionality_ref")}


# --- run.yaml (the machine-readable per-env definition, #434) -----------------
REQUIRED_ENV = ("name", "tier", "type")
SECRET_KEYS = re.compile(r"(?i)(password|passwd|secret|api[_-]?key|apikey|token|private[_-]?key)")
SECRET_LITERAL = re.compile(r"[A-Za-z0-9/+_\-]{16,}")
BINDING_HINT = re.compile(r"(?i)(secret\s*manager|secretmanager|secrets-manager|vault|\$\{|"
                          r"projects/|arn:aws:secretsmanager|sm://|ref:|binding|manager|"
                          r"env:|from\s+secret|never in repo)")
PEM = re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")
AWS_KEY = re.compile(r"\bAKIA[0-9A-Z]{16}\b")


def find_lens_file(draft_root, filename):
    for path in glob.glob(os.path.join(draft_root, "**", "lens", filename), recursive=True):
        return path
    return None


def check_run_yaml_schema(content, errors):
    """Assert the run.yaml content shape; return {name: env-dict} for defined environments."""
    for f in ("rollout", "migrations", "cicd"):
        if _blank(content.get(f)):
            errors.append(f"run.yaml: slice-level '{f}' is missing or empty")
    envs = content.get("environments")
    by_name = {}
    if _blank(envs) or not isinstance(envs, list):
        errors.append("run.yaml: 'environments' is missing or empty — /run defines at least one")
        return by_name
    for e in envs:
        if not isinstance(e, dict):
            errors.append("run.yaml: an environment entry is not a mapping")
            continue
        for f in REQUIRED_ENV:
            if _blank(e.get(f)):
                errors.append(f"run.yaml: environment {e.get('name', '?')!r} missing '{f}'")
        etype = (e.get("type") or "").strip().lower()
        if etype == "local":
            if _blank((e.get("local") or {}).get("run")):
                errors.append(f"run.yaml: local env {e.get('name')!r} needs local.run (how to bring it up)")
        elif etype == "cloud":
            cloud = e.get("cloud") or {}
            for f in ("provider", "region", "compute", "networking", "security"):
                if _blank(cloud.get(f)):
                    errors.append(f"run.yaml: cloud env {e.get('name')!r} missing cloud.{f}")
        elif etype:
            errors.append(f"run.yaml: environment {e.get('name')!r} has unknown type '{etype}' (local|cloud)")
        if e.get("name"):
            by_name[e["name"]] = e
    return by_name


def cloud_components(env):
    cloud = env.get("cloud") or {}
    out = []
    for group in ("compute", "services"):
        for c in (cloud.get(group) or []):
            if isinstance(c, dict) and c.get("component"):
                out.append(c["component"])
    return out


def check_component_mapping(by_name, arch_lens, errors, warnings):
    if not arch_lens or not os.path.isfile(arch_lens):
        warnings.append("architecture lens not provided — cloud component mapping unchecked")
        return
    with open(arch_lens, encoding="utf-8") as fh:
        arch_text = fh.read().lower()
    for name, env in by_name.items():
        if (env.get("type") or "").lower() != "cloud":
            continue
        for comp in cloud_components(env):
            if comp.lower() not in arch_text:
                errors.append(f"run.yaml: cloud env {name!r} maps component {comp!r} not found in "
                              f"the architecture lens (dangling target)")


def check_md_yaml_consistency(run_md_path, by_name, errors):
    if not run_md_path or not os.path.isfile(run_md_path):
        errors.append("run.md not found in the draft — cannot check md/yaml consistency")
        return
    with open(run_md_path, encoding="utf-8") as fh:
        md = fh.read().lower()
    for name in by_name:
        if name.lower() not in md:
            errors.append(f"run.md does not mention environment {name!r} that run.yaml defines "
                          f"(md/yaml disagree)")


def check_no_secret_literals(paths, errors):
    for p in paths:
        if not p or not os.path.isfile(p):
            continue
        with open(p, encoding="utf-8") as fh:
            for i, line in enumerate(fh, 1):
                if PEM.search(line) or AWS_KEY.search(line):
                    errors.append(f"{os.path.basename(p)}:{i}: a secret literal is present — "
                                  f"bind via a secrets manager")
                    continue
                if SECRET_KEYS.search(line) and not BINDING_HINT.search(line):
                    val = line.split(":", 1)[-1] if ":" in line else line
                    if SECRET_LITERAL.search(val.strip()):
                        errors.append(f"{os.path.basename(p)}:{i}: looks like a raw secret value — "
                                      f"bind via a secrets manager, not a literal")


def check_env_preservation(draft_by_name, existing_run_yaml, target_env, errors):
    target = (target_env or "").strip().lower()
    if not target:
        errors.append("no --target-env given — cannot verify one-environment-per-call")
        return
    if target not in {n.lower() for n in draft_by_name}:
        errors.append(f"run.yaml does not define the target environment {target!r} this call")
    existing_by_name = {}
    if existing_run_yaml and os.path.isfile(existing_run_yaml):
        with open(existing_run_yaml, encoding="utf-8") as fh:
            prev = yaml.safe_load(fh) or {}
        prev_content = prev.get("content") or (prev.get("lens") or {}).get("content") or {}
        existing_by_name = {e.get("name"): e
                            for e in (prev_content.get("environments") or [])
                            if isinstance(e, dict) and e.get("name")}
    for name in existing_by_name:
        if name not in draft_by_name:
            errors.append(f"environment {name!r} was dropped — /run is additive (one env per call)")
    for name in draft_by_name:
        if name not in existing_by_name and name.lower() != target:
            errors.append(f"environment {name!r} was added but is not the target {target!r} — "
                          f"/run defines exactly one environment per call")
    for name, prev_env in existing_by_name.items():
        if name.lower() == target:
            continue
        if name in draft_by_name and draft_by_name[name] != prev_env:
            errors.append(f"previously-defined environment {name!r} was silently edited — "
                          f"only the target {target!r} may change")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate /run's draft grounding + coverage.")
    ap.add_argument("--draft", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--slice-file", required=True)
    ap.add_argument("--arch-lens", help="path to the slice's architecture.md (cloud component mapping)")
    ap.add_argument("--existing-run-yaml", help="the slice's current lens/run.yaml (env preservation)")
    ap.add_argument("--target-env", help="the environment name being defined/edited this call")
    args = ap.parse_args(argv)

    draft_root = os.path.join(args.draft, "product-os")
    if not os.path.isdir(draft_root):
        sys.stderr.write(f"validate_run.py: no draft tree at {draft_root}\n")
        return 2

    errors, warnings = [], []
    decision_ids = collect_decisions(draft_root, errors)
    try:
        man = (load(args.manifest).get("run") or {})
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"manifest unreadable: {exc}")
        man = {}

    grounded = check_grounding(man, decision_ids, errors)
    to_cover = slice_functionalities(args.slice_file, errors)
    for fid in sorted(f for f in to_cover if f):
        if fid not in grounded:
            errors.append(f"slice functionality {fid!r} is not considered by the run plan")

    # --- run.yaml: the machine-readable per-environment definition (#434) ---
    run_yaml_path = find_lens_file(draft_root, "run.yaml")
    run_md_path = find_lens_file(draft_root, "run.md")
    env_by_name = {}
    if not run_yaml_path:
        errors.append("no run.yaml in the draft — /run must produce the machine-readable definition")
    else:
        ry = load(run_yaml_path)
        content = ry.get("content") or (ry.get("lens") or {}).get("content") or {}
        env_by_name = check_run_yaml_schema(content, errors)
        check_component_mapping(env_by_name, args.arch_lens, errors, warnings)
        check_md_yaml_consistency(run_md_path, env_by_name, errors)
        check_no_secret_literals([run_yaml_path, run_md_path], errors)
        check_env_preservation(env_by_name, args.existing_run_yaml, args.target_env, errors)

    counts = {"grounds": len(man.get("grounds") or []), "decisions": len(decision_ids),
              "to_cover": len(to_cover), "grounded": len(grounded),
              "environments": len(env_by_name)}
    result = {"ok": not errors, "errors": errors, "warnings": warnings, "counts": counts}
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
