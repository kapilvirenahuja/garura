#!/usr/bin/env python3
"""
persist_run.py — /run's deterministic keyed persist, in place on the live model (ADR 026).

Direct-model-write successor of the old apply_run.py (standards/rules/direct-model-write.md).
There is NO draft tree and NO doc copy: the LLM authoring skill (author-run-lens) already wrote
the per-node narrative grounding doc `lens/run.md` straight to the live model. This script owns
the structured/shared files this slice's run lens carries and merges the manifest's structured
deltas into the live model IN PLACE, keyed to --slice-ref and --target-env:

  1. the machine-readable `lens/run.yaml` — the per-environment definition (`content` envelope:
     slice-level rollout/migrations/cicd/tco, written once + carried forward, plus an ordered
     `environments` list). This run MERGES exactly the ONE target environment (keyed by name):
     an environment whose name matches --target-env is REPLACED (re-derive), a new target name is
     APPENDED, and every OTHER already-defined environment is preserved byte-for-value. It REFUSES
     a manifest whose `environment.name` is not the target — this is the one-environment-per-call
     containment (C9/F9) the file-level scoped guard cannot see inside run.yaml.
  2. decision records — `<slice>/decisions/*.yaml`, skip-if-exists (an accepted decision is never
     edited in place; a re-run adds only new ones).

It refuses any slice_ref that is not the target and any environment that is not the target — this
is the node-level containment the file-level scoped_write_guard.py cannot provide. It does NOT
touch `run.md` (the skill wrote it to the live model already), the spine, the profile, the slice
record, or any other lens or slice. Layer rule: pure file writes from disk inputs; no git/gh/network.

    python3 persist_run.py --manifest <run-manifest.yaml> \
        --product-base <product_base> --slice-ref <domain>/<slice-id> \
        --target-env <name> --decided-by /run --date <YYYY-MM-DD> \
        --out-manifest <persist-manifest.json>

The manifest carries the run.yaml delta as structured data under a `run:` block:
`slice_ref`, `lens_rel` (run.yaml path relative to product_base), `target_env`,
`slice_level` ({rollout, migrations, cicd, tco}), `environment` (the one target env dict), and
`decisions` (records to write, skip-if-exists). Persist-manifest JSON:
{applied, written[], changed{environment, slice_level, decisions[]}, target_env, preserved_envs[]}.
Exit 0 applied, 1 refused (containment), 2 usage/parse error.
"""

import argparse
import json
import os
import sys

try:
    import yaml
except ImportError:
    sys.stderr.write("persist_run.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)


def load(path):
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def run_yaml_content(doc):
    """The `content` envelope from a run.yaml doc (tolerant of a nested `lens` wrapper)."""
    return doc.get("content") or (doc.get("lens") or {}).get("content") or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keyed in-place persist of a run lens (ADR 026).")
    ap.add_argument("--manifest", required=True,
                    help="run-manifest.yaml (STM, non-model) — carries the run.yaml delta")
    ap.add_argument("--product-base", required=True)
    ap.add_argument("--slice-ref", required=True,
                    help="the ONLY slice this run may write (<domain>/<slice-id>)")
    ap.add_argument("--target-env", required=True,
                    help="the ONE environment this call may define or edit")
    ap.add_argument("--decided-by", default="/run")
    ap.add_argument("--date", required=True, help="decision date (play passes it; never auto-generated)")
    ap.add_argument("--out-manifest", required=True)
    args = ap.parse_args(argv)

    live_root = os.path.join(args.product_base, "product-os")
    if not os.path.isfile(args.manifest):
        sys.stderr.write(f"persist_run.py: missing manifest {args.manifest}\n")
        return 2
    man = (load(args.manifest).get("run") or {})
    target = args.target_env.strip().lower()

    written, refused = [], []
    changed = {"environment": None, "slice_level": False, "decisions": []}

    # --- containment: the manifest must be about the target slice + the target env only ------
    man_slice = str(man.get("slice_ref") or "")
    if args.slice_ref not in man_slice:
        refused.append(f"manifest slice_ref '{man_slice}' is not the target slice "
                       f"'{args.slice_ref}' — refusing (containment)")
    env = man.get("environment") or {}
    env_name = str(env.get("name") or "").strip().lower()
    if not env:
        refused.append("manifest carries no target environment — refusing an empty persist")
    elif env_name != target:
        refused.append(f"manifest environment '{env_name}' is not the target '{target}' — /run "
                       f"defines exactly one environment per call (refusing)")

    lens_rel = man.get("lens_rel")
    if not lens_rel:
        refused.append("manifest carries no lens_rel (path to run.yaml) — cannot persist")

    if refused:
        out = {"applied": False, "written": [], "refused": refused,
               "changed": {"environment": None, "slice_level": False, "decisions": []},
               "target_env": target, "preserved_envs": []}
        os.makedirs(os.path.dirname(os.path.abspath(args.out_manifest)), exist_ok=True)
        json.dump(out, open(args.out_manifest, "w"), indent=2)
        print(json.dumps(out, indent=2))
        return 1

    # --- 1. merge the run.yaml content envelope, keyed to the target environment -------------
    run_yaml_path = os.path.join(args.product_base, lens_rel)
    content = run_yaml_content(load(run_yaml_path))

    # slice-level design: written once + carried forward. Set only the fields the manifest carries.
    slice_level = man.get("slice_level") or {}
    for field in ("rollout", "migrations", "cicd", "tco"):
        if field in slice_level and slice_level[field] is not None:
            content[field] = slice_level[field]
            changed["slice_level"] = True

    envs = content.get("environments")
    if not isinstance(envs, list):
        envs = []
    by_name = {str(e.get("name")).strip().lower(): i
               for i, e in enumerate(envs) if isinstance(e, dict) and e.get("name")}
    preserved = sorted(n for n in by_name if n != target)
    if target in by_name:
        envs[by_name[target]] = env          # re-derive the target (replace)
    else:
        envs.append(env)                      # add the new target; every other env untouched
    envs.sort(key=lambda e: e.get("tier", 0) if isinstance(e, dict) else 0)
    content["environments"] = envs
    changed["environment"] = target

    out_doc = {"schema": {"name": "lens", "type": "run"}, "content": content}
    os.makedirs(os.path.dirname(run_yaml_path), exist_ok=True)
    with open(run_yaml_path, "w", encoding="utf-8") as fh:
        yaml.safe_dump(out_doc, fh, sort_keys=False, allow_unicode=True)
    written.append(f"lens:run.yaml:{target}")

    # --- 2. decision records (slice-local; skip-if-exists) -----------------------------------
    slice_dir = os.path.dirname(os.path.dirname(run_yaml_path))   # .../slices/<slice>
    dec_dir = os.path.join(slice_dir, "decisions")
    for dec in man.get("decisions") or []:
        did = dec.get("id")
        if not did:
            continue
        os.makedirs(dec_dir, exist_ok=True)
        dpath = os.path.join(dec_dir, f"{did}.yaml")
        if os.path.exists(dpath):
            continue                          # never edit an accepted decision in place
        record = {"decision": {
            "id": did, "node_ref": dec.get("node_ref") or args.slice_ref,
            "level": dec.get("level", "product"),
            "title": dec.get("title"), "reason": dec.get("reason"),
            "alternatives": dec.get("alternatives", []),
            "status": "accepted", "superseded_by": None,
            "supersedes": dec.get("supersedes"),
            "metadata": {"decided_by": args.decided_by, "date": args.date, "version": 1},
        }}
        with open(dpath, "w", encoding="utf-8") as fh:
            yaml.safe_dump(record, fh, sort_keys=False, allow_unicode=True)
        written.append(f"decision:{did}")
        changed["decisions"].append(did)

    out = {"applied": True, "written": written, "refused": [],
           "changed": changed, "target_env": target, "preserved_envs": preserved}
    os.makedirs(os.path.dirname(os.path.abspath(args.out_manifest)), exist_ok=True)
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
