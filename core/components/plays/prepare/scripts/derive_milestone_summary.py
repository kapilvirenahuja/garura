#!/usr/bin/env python3
"""derive_milestone_summary.py — prepare play Step 18b extraction (C36, C38, C39).

Deterministic extraction of the milestone summary from a locked plan.yaml into a
standalone plan-milestone-summary.yaml — the contract implement and validate read
to learn which milestones exist, what each delivers, which scenarios validate must
run, and the cumulative regression suite per milestone. No LLM reasoning: it reads
fields the plan author already wrote and re-emits them in the downstream shape.

Per milestone phase (a task_dag entry with a milestone_id), it emits:
  - milestone_id
  - delivers
  - scenario_gate.ids[]          (from the milestone phase)
  - depends_on                   (acceptance-based; from the milestone phase)
  - cumulative_scenarios[]       (running union; from the matching summary row)

cumulative_scenarios is taken from the plan.yaml summary row for that milestone
(authored as the running union). If a summary row is absent, the script falls
back to computing the running union from each milestone's scenario_gate.ids in
task_dag order, so the field is never empty.

Usage:   derive_milestone_summary.py <plan.yaml> <out.yaml>
Exit:    0 = written; 1 = no milestones found; 2 = could not read/parse/write.
"""
import sys

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml not available", file=sys.stderr)
    sys.exit(2)


def main():
    if len(sys.argv) != 3:
        print("usage: derive_milestone_summary.py <plan.yaml> <out.yaml>", file=sys.stderr)
        sys.exit(2)

    plan_path, out_path = sys.argv[1], sys.argv[2]
    try:
        with open(plan_path) as fh:
            plan = yaml.safe_load(fh) or {}
    except (OSError, yaml.YAMLError) as exc:
        print(f"ERROR: cannot read/parse {plan_path}: {exc}", file=sys.stderr)
        sys.exit(2)

    task_dag = plan.get("task_dag", [])
    summary_rows = plan.get("summary", []) or []
    summary_by_id = {r.get("milestone_id"): r for r in summary_rows
                     if isinstance(r, dict)}

    milestones = [p for p in task_dag
                  if isinstance(p, dict) and p.get("milestone_id")]
    if not milestones:
        print("FAIL: plan.yaml has no milestone phases to summarize", file=sys.stderr)
        sys.exit(1)

    running = []          # fallback running union of scenario_gate ids
    seen = set()
    out_milestones = []
    for phase in milestones:
        mid = phase.get("milestone_id")
        gate = phase.get("scenario_gate", {}) or {}
        gate_ids = gate.get("ids", []) or []

        for sid in gate_ids:
            if sid not in seen:
                seen.add(sid)
                running.append(sid)

        row = summary_by_id.get(mid, {})
        cumulative = row.get("cumulative_scenarios")
        if not cumulative:
            cumulative = list(running)   # fallback: computed running union

        out_milestones.append({
            "milestone_id": mid,
            "delivers": phase.get("delivers", row.get("delivers", "")),
            "scenario_gate": {"ids": list(gate_ids)},
            "depends_on": phase.get("depends_on", []) or [],
            "cumulative_scenarios": list(cumulative),
        })

    payload = {
        "source": "derived from plan.yaml by derive_milestone_summary.py",
        "milestone_count": len(out_milestones),
        "milestones": out_milestones,
    }

    try:
        with open(out_path, "w") as fh:
            yaml.safe_dump(payload, fh, sort_keys=False, default_flow_style=False)
    except OSError as exc:
        print(f"ERROR: cannot write {out_path}: {exc}", file=sys.stderr)
        sys.exit(2)

    print(f"OK: wrote {out_path} with {len(out_milestones)} milestone(s).")
    sys.exit(0)


if __name__ == "__main__":
    main()
