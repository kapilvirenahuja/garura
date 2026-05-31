#!/usr/bin/env python3
"""check_milestone_cap.py — prepare play structural check (C41, F30).

A milestone is a human-validation checkpoint, not a unit of work breakdown.
prepare must author at least one milestone (the epic acceptance gate, on the
final feature phase) and no more than the configured cap
(prepare.max-milestones-per-epic, default 2). This script counts the milestone
phases in a plan.yaml and asserts the count falls in [1, cap].

A milestone phase is a top-level task_dag entry carrying a non-empty
`milestone_id`. Feature phases without `milestone_id` are ordinary task
groupings and are not counted.

Usage:   check_milestone_cap.py <plan.yaml> <cap>
Exit:    0 = count in [1, cap]; 1 = out of range (F30); 2 = could not read/parse.
"""
import sys

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml not available", file=sys.stderr)
    sys.exit(2)


def main():
    if len(sys.argv) != 3:
        print("usage: check_milestone_cap.py <plan.yaml> <cap>", file=sys.stderr)
        sys.exit(2)

    plan_path, cap_arg = sys.argv[1], sys.argv[2]
    try:
        cap = int(cap_arg)
    except ValueError:
        print(f"ERROR: cap '{cap_arg}' is not an integer", file=sys.stderr)
        sys.exit(2)
    if cap < 1:
        print(f"ERROR: cap {cap} is below 1 — a plan needs at least one milestone",
              file=sys.stderr)
        sys.exit(2)

    try:
        with open(plan_path) as fh:
            plan = yaml.safe_load(fh)
    except (OSError, yaml.YAMLError) as exc:
        print(f"ERROR: cannot read/parse {plan_path}: {exc}", file=sys.stderr)
        sys.exit(2)

    task_dag = (plan or {}).get("task_dag", [])
    if not isinstance(task_dag, list):
        print("ERROR: plan.yaml has no task_dag list", file=sys.stderr)
        sys.exit(2)

    milestones = [p for p in task_dag
                  if isinstance(p, dict) and p.get("milestone_id")]
    count = len(milestones)
    ids = [p.get("milestone_id") for p in milestones]

    if count < 1:
        print(f"FAIL (F30): plan has 0 milestones — no epic acceptance gate, so "
              f"validate never runs. Designate the final feature phase as a milestone.",
              file=sys.stderr)
        sys.exit(1)
    if count > cap:
        print(f"FAIL (F30): plan has {count} milestones ({ids}) — exceeds the cap of "
              f"{cap}. Merge or remove surplus milestones; keep only genuine "
              f"human-validation points (plus the final epic gate).", file=sys.stderr)
        sys.exit(1)

    print(f"OK: {count} milestone(s) {ids} — within [1, {cap}].")
    sys.exit(0)


if __name__ == "__main__":
    main()
