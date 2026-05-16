# Play Compiled: define (rebuild — issue #370)

**Mode:** rebake (`/create-play --rebuild define`)
**Workflow:** Structure A (unchanged)
**Intent hash:** sha256:a1398e860f0c6568269734b1f235dd8f9bd4623456d1b65d8514037c6b0f3e5d

## Files

- `core/components/plays/define/reference/intent.yaml` (source — C17 + F11 added by the #370 fix)
- `core/components/plays/define/SKILL.md` (recompiled — new Step 5.0 and Step 9.0 decision-surfacing steps, SE-13 embedded at Phase 5 and Phase 9, Compilation Metadata updated)

## Pipeline result

- Deep read (R1): semantic map written (play-analysis.md).
- Intent gate: intent-crafter verified C17/F11 coherent, schema-valid, no drift; gate discharged by upstream fix-it Tether (no second prompt for identical approved content).
- Skill inventory: all existing, zero new/modified (skill-manifest.yaml).
- Agent audit: project-orchestrator PASS, repo-orchestrator PASS, product-keeper FAIL on P7+P10 — pre-existing drift unrelated to #370, captured as follow-up issue #373; gate discharged via skill's present-options → proceed path (agent-audit-decision.md).
- Workflow: Structure A retained (workflow-selection.md).
- Compile & verify: constraint-classifications.yaml (C17 → artifact-verifiable); evals.yaml regenerated (13 SE incl. new SE-13 for C17/F11, 6 SCE); SKILL.md recompiled; coverage-matrix.md PASS — no intent item uncovered.
- Post-compile regression spot-check: 9/9 assertions GREEN; intent.yaml valid YAML.

**Agents:** all PASS except pre-existing product-keeper drift (tracked separately as #373).
**Evals:** 13 step, 6 scenario.

Deployment note: `/sync-claude` deploys source → ~/.claude. Out of scope for the #370 fix-it ship (which delivers the source change to main); flagged for the user.
