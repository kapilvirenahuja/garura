# /enhance deviations — #388

Recorded at run-start so SE-2 and the evidence trail explain why two compiled steps did not fire as written.

## Deviation 1 — branch convention

**Compiled rule (C2):** branch should be `enhance/{issue}-{slug}`, created from main.
**Actual:** staying on `feature/388-update-intent-doctrine` from the prior /start-feature + /craft-ice runs.
**Why:** The branch already carries two commits (start-feature evidence + craft-ice ICE spec). Spawning a fresh enhance/ branch from main would orphan those commits or require cherry-pick. The user explicitly chose to stay on the existing branch.
**Recovery if needed:** rename to `enhance/388-update-intent-doctrine` later via `git branch -m`; no work is lost.

## Deviation 2 — Steps 3, 4, 6 reuse instead of re-derive

**Compiled steps:**
- Step 3 (Q&A Discovery → `evidence/enhance/discovery.md`)
- Step 4 (Context Assembly → `context/understanding.md`)
- Step 6 (Approach Design → `evidence/enhance/approach.yaml`, tech-designer dispatch)

**Actual:** Steps 3 and 4 skipped (the equivalents already exist from /craft-ice at `context/discovery.md` and `context/context-bundle.md`). Step 6's tech-designer dispatch is replaced by an orchestrator-direct compile of `approach.yaml` from the approved ICE spec (`specs/intent.yaml` + `specs/expectation.yaml` + `context/context-bundle.md`).
**Why:** /craft-ice just produced the canonical Intent + Context + approved Expectation for this work. Re-running Q&A and a tech-designer pass would re-derive (and possibly drift) artifacts that are already vetted. The ICE architectural contract is that craft-ice is the spec doorway; enhance consumes the spec.
**SE compliance impact:**
- SE-4 (`discovery.md`) — alternative artifact at `context/discovery.md` covers the same role. Approach design does not run before discovery exists.
- SE-5 (`understanding.md`) — alternative artifact at `context/context-bundle.md` covers the same role; orchestrator will pass it as the `understanding` input wherever the play expects understanding.md.
- SE-7 (approach.yaml shape) — fully met by the orchestrator-direct compile (all nine fields produced from the spec).
**Recovery if needed:** symlink `context/context-bundle.md` to `context/understanding.md` if any downstream agent strictly checks the literal filename.
