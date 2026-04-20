# Discovery — Issue #307

## Issue body
See issue-read.yaml. Judge agent rated #305 at 0.74 and soft-passed three downstream-pipeline-breaking concerns as "follow-ups". User flagged: contract mismatches at skill boundaries + intent-propagation breaks must be blockers that cap confidence below the C15 0.6 gate.

## Q&A

**Q1: Judge edit surface — single prompt or skill?**
A: Read judge.md to understand. Current prompt has rules + examples; we need a composed agentic assessment approach. Can be a skill.

**Q2: Blocker taxonomy — extend existing or author fresh?**
A: No taxonomy yet.

**Q3: Confidence mechanism — mechanical cap or reasoning directive?**
A: Emergent.

**Q4: Scope boundary — judge only, or also enhance play gate?**
A: Only judge. No changes to play.

**Q5: Verification — replay #305 or synthetic case?**
A: Read commits, produce assessments, user grades, use grades as inputs.

## Assessments graded by user (severity-framing rubric derivation)
User accepted the 3 blocker rules after analysis:
1. Contract mismatch at delivered handoff (producer/consumer disagree on required field).
2. Intent-propagation break (dispatch chain stated in issue is not wired end-to-end).
3. Stale boundary contradicting new rule (agent/skill absolute directly blocks new behavior).

## Design decisions (user-locked during discovery)
- Judge is an **eval executor**, not a multi-mode agent with rubrics. Rubrics live in evals the play supplies.
- Judge never generates evals (reward-hacking prevention).
- Artifact diff (ex-Mode 4) becomes its own non-user-invocable skill `diff-artifacts`.
- Epic scoring (ex-Mode 3) has no carveout — any play wanting it supplies evals + paths + prompt.
- Existing implement/validate dispatches must work unchanged (no contract breakage).
- Severity-framing evals for enhance are **authored static artifacts**, not generator output.
