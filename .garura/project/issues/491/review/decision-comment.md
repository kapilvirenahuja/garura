## Harness verdict (gate off per gates.plays.review-change): APPROVE

Reviewed against committed sources (C6 of the merge-change ICE, ADR 012, the #484 tool-first rule).

**The finding this fixes was real and recurring:** the records commit was prose, so runs left `merge-gate.json` uncommitted. The fix moves the duty into `merge_pr.py` — the same executor-move pattern the chain just adopted in #484, applied to its own last gap.

**Objective layer:** `test_merge_scripts.py` 14/14, including tree-clean-after-run in a real temp repo and an idempotent re-run; merge-change lints clean with a valid fingerprint.

**Design-grounding:** C6's guarantee (records committed on main at close, push owed to the human) is unchanged — only the executor moved from prose to script. The `records_committed` output field makes a future leftover a visible failure rather than silent litter, which strengthens F6's protection. No constraint, failure, scenario, or eval moved; the deviation note records the move; the canonical copy in `play-creator/references/` keeps rebuilds convergent.

**Blocking findings:** none. The land to main stays the pinned human gate.
