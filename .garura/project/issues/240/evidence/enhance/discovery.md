# Discovery — Issue #240: capture-learning Mode 1

## Issue Summary

capture-learning currently requires manual invocation after epic completion (Mode 2). Quick learnings from individual commits, bug fixes, and PR merges are systematically missed. Mode 1 implements lightweight post-merge learning extraction as a non-blocking final step in the ship play.

## Issue Body

capture-learning currently requires manual invocation after epic completion (Mode 2). Quick learnings from individual commits, bug fixes, and PR merges are systematically missed because no one remembers to run a separate play after every merge.

Three modes identified in #236:
1. Mode 1 (this issue) — Fast. Single issue/commit/PR. Surgical learnings. 1-2 product LTM artifacts max.
2. Mode 2 (#236) — Middle. Full prepare→implement→validate trinity reconciliation.
3. Mode 3 (separate) — Full codebase bootstrap.

Approach: Post-merge step in ship play. Non-blocking, fire-and-forget. Stages proposals to STM. No human gate inline.

Enrichment targets: research/{domain}.md, architecture/*.yaml, scope/epics/{epic-id}.yaml.

Acceptance criteria:
- Mode 1 skill exists and is invocable from ship
- Ship play updated with post-merge Mode 1 step (non-blocking)
- Trivial PRs produce no output
- Learning proposals staged to STM, not auto-written to product LTM
- Extraction failure does not block or fail the ship play

## Q&A

### Q1: Integration point — new skill or embedded in ship?
**Answer:** New skill invoked by ship play as a final step. Mode 1 will be a standalone skill (`capture-learning-fast` or similar) that the ship play invokes after merge completes.

### Q2: Format dependency on #236?
**Answer:** Define a lightweight Mode 1-specific format. Align with #236's format later when Mode 2 lands. Mode 1 is free to define its own STM proposal format.

### Q3: Trivial PR detection mechanism?
**Answer:** Let the extraction agent decide based on diff content. No hardcoded heuristic — the knowledge-extractor agent analyzes the diff and STM artifacts to determine if there are learnings worth extracting.
