# Play Analysis — specify-product (rebake for D6/D7/D8/D9)

**Mode:** `/create-play --rebake specify-product`
**Intent hash (new):** `sha256:a2c724a1eff3c7d7b85328c41dd71d003dae954b667ebbcad2dd838818b632e5`
**Date:** 2026-04-14
**STM base:** `.meridian/project/issues/214/evidence/create-play/specify-product/`

## 1. Purpose of this rebake

The intent.yaml was updated to land 4 defects tracked as D6, D7, D8, D9:

- **D6** — MVP recommendation artifact required; narrows the capability walk.
- **D7** — Abstraction-layer boundary for product-stage artifacts (no DB engines, SDK methods, frameworks, etc.).
- **D8** — Pull-to-product: KB-sourced domain content is copied into `.meridian/product/research/` at Stage 2; Stage 3+ read exclusively from there.
- **D9** — MVP recommendation location is under `scope/`, not `specification/`.

Intent now carries three new constraints (C15, C16, C17) and one new failure condition (F13). Rules/product.md now carries matching Rules 13, 14, 15. The configure-capabilities skill was updated in-place to enforce pre-flight (Rule 13) and single-read-path (Rule 15), and to reject abstraction-layer deny-list tokens on output (Rule 14).

## 2. Semantic map of the current compiled SKILL.md

### Phases → Steps → Owners → Skills

| Phase | Step | Owner | Skill invoked | Writes |
|-------|------|-------|---------------|--------|
| Pre-flight | — | play | validate-kb-extension | — |
| Preparation — Market Intel | 1 Market Research | market-analyst | research-market-opportunity | specification/market-brief.md |
| Checkpoint 1 — Market Review | 2 | play + scriber | — | _checkpoints/specify-product/stage-1-market-*.md |
| Preparation — Domain Selection | 3 Select domains | product-keeper | (domain selection inline in agent context) | specification/domain-selection.yaml |
| Checkpoint 2 — Domain Review | 4 | play + scriber | — | _checkpoints/specify-product/stage-2-domains-*.md |
| Execution — Capability Config | 5 Configure capabilities | product-keeper | configure-capabilities | scope/scope.yaml + user-provided/grounding-questions.md |
| Checkpoint 3 — Capability Review | 6 | play + scriber | — | _checkpoints/specify-product/stage-3-configure-*.md |
| Execution — Enrichment | 7 Enrich capabilities | product-keeper | enrich-capabilities | scope/enriched-capabilities.yaml |
| Execution — Epic Gen + Validate | 8 Generate epics | product-keeper | generate-intent-epics | scope/epics/*.yaml |
| Execution — Epic Gen + Validate | 9 Validate epics | product-keeper | validate-intent-epics | scope/validation-intent-epics.yaml |
| Pre-Lock Resolution Gate | 10 | play | — | _evidence/specify-product/resolution-gate-*.md |
| Checkpoint 4 — Epic Review | 11 | play + scriber | — | _checkpoints/specify-product/stage-5-epics-*.md |
| Execution — Quality Profile | 12 Derive quality profile | product-keeper | derive-quality-profile-from-epics | specification/quality-profile.yaml |
| Scenario Validation | — | play | — | — |
| Evidence & Close | 13 Evidence + commit | play + scriber + repo-orchestrator | — | _evidence/specify-product/*.md |

**Domain agents:** market-analyst, product-keeper, judge (3 — within ≤5 budget).
**Utility agents:** scriber, repo-orchestrator (exempt).
**Workflow structure:** A (full checkpoint flow with 4 gates).

## 3. Intent coverage in the current SKILL.md

### Constraints coverage (current state pre-rebake)

| ID | Rule subject | Currently covered by |
|----|-------------|----------------------|
| C1 | product description word count | Pre-flight table + bash |
| C2 | project profile completeness | Pre-flight table + bash |
| C3 | KB catalog consistency | Pre-flight table (validate-kb-extension) |
| C4 | capability is real feature ID | SE-5 (F6 / C4) on configure-capabilities output |
| C5 | every CTC walked explicitly | SE-6, SE-7 on constraint_trace |
| C6 | mandatory epic fields | SE-9..SE-14, SE-14a..SE-14h |
| C7 | quantified constraints | SE-11 |
| C8 | kb_source.capability equals capability | SE-14 |
| C9 | quality profile aggregation | SE-16, SE-17 |
| C10 | ADR 017 whitelist | Structural agent boundary + SE-19 |
| C11 | domain delegation to agents | Structural role section + SE-3, SE-8 |
| C12 | 4 checkpoints mandatory | Structural phases + SE-18 |
| C13 | three-layer hierarchy | Structural (no Theme/Feature/Story layer) + SE-4 |
| C14 | pre-lock resolution gate | SE-15 + Step 10 gate |
| **C15** | **MVP recommendation required** | **NOT COVERED (new)** |
| **C16** | **abstraction-layer boundary** | **NOT COVERED (new)** |
| **C17** | **pull-to-product read path** | **NOT COVERED (new)** |

### Failure condition coverage (current state pre-rebake)

| ID | Failure | Currently covered by |
|----|---------|----------------------|
| F1 | zero intent epics | SE-1, SE-9 |
| F2 | empty mandatory fields | SE-10, SE-14a |
| F3 | unquantified constraint values | SE-2, SE-11, SE-12 |
| F4 | <2 success/failure scenarios | SE-13, SE-14d |
| F5 | dangling kb_source.capability | SE-14 |
| F6 | scope has non-real capability | SE-5 |
| F7 | missing constraint_trace | SE-6, SE-7 |
| F8 | missing/empty quality profile | SE-16 |
| F9 | missing checkpoint artifact | SE-18 |
| F10 | locked despite unresolved blockers | SE-15 |
| F11 | write outside ADR 017 whitelist | SE-19 |
| F12 | monolithic scope needs phasing | SE-20 (warning) |
| **F13** | **implementation-specific token in product artifact** | **NOT COVERED (new)** |

### Scenarios (S1-S8)

All 8 scenarios currently covered by SCE-1 through SCE-8. No changes needed in the scenario set.

## 4. Delta needed in the rebake

### A. New Stage 2.75 — MVP Recommendation

**Phase name:** `Preparation — MVP Recommendation`
**Position:** Between `Checkpoint 2 — Domain Review` (current Step 4) and `Execution — Capability Configuration` (current Step 5).
**Owner:** play (not a domain agent — pre-flight check for an artifact the user authors between stages).
**Step content:**
- Verify `{product_base}/scope/mvp-recommendation.md` exists and is non-empty.
- If missing, present the expected path and required sections to the user, halt until the file is authored. (Full automation via a future `recommend-mvp` skill is explicitly deferred — see Defect 6 follow-up notes.)
- Once present, parse for primary use cases / deferred use cases / architecture direction (this is a description in the step text; the actual parsing happens inside configure-capabilities Step 0 per the updated skill).

**Checkpoint placement — my decision:** fold the MVP recommendation review into the existing Checkpoint 2 (Domain Review) artifact rather than introducing a new Checkpoint 2.5. Rationale: the domain-review checkpoint is already where the user has a natural chance to review "which domains are in play for v1", and the MVP recommendation is a scope-narrowing decision that belongs to the same mental model. Adding a 5th checkpoint would drift from C12 (4 checkpoints mandatory — not a strict cap, but the intent prefers 4). The rebaked Step 4 checkpoint artifact will list BOTH the selected domains AND the MVP recommendation path for user review; Stage 2.75 is a gate (file exists?) rather than a gate-with-review.

### B. Pull-to-product copy logic in Step 3 (Select domains)

After domain-selection.yaml is written, for each selected domain that exists in the KB (`source: kb`), the agent must copy `core/components/memory/knowledge/domain/{domain}.md` into `{product_base}/research/{domain}.md` with a provenance header:

```
<!-- Provenance
origin: kb
kb_source_path: core/components/memory/knowledge/domain/{domain}.md
copied_at: <ISO-8601>
kb_sha_at_copy: <shasum of source>
editable: false
-->
```

For domains that do NOT exist in the KB, leave them for the upstream DD-1 research-then-promote flow (not in scope for this rebake — handled by a future Stage 2.5 research step).

### C. Stage 3 JSON contract updates (Step 5 Configure capabilities → new Step 6)

Add to `stm.input`:
- `mvp_recommendation_path: "{product_base}/scope/mvp-recommendation.md"` (required, new — per C15)
- `product_domain_library_path: "{product_base}/research/"` (required, new — per C17)

Keep (but demote):
- `ltm_domain_taxonomy_path: "core/components/memory/knowledge/domain/"` (keep with comment: "Stage-2-only, consumed by the copy step in Stage 2 Step 3; configure-capabilities does NOT read from here")

### D. New pre-flight check for C15

Add a new row to the Pre-flight table: **"MVP recommendation exists and is non-empty"** → hard halt if missing. Bash: `test -s {product_base}/scope/mvp-recommendation.md`. This runs BEFORE Stage 3 starts, which in execution order means it runs after Step 4's Tether response, not at the beginning of the play — but it is documented in the pre-flight table because it is a hard-gate structural check before capability configuration.

**Design note:** the pre-flight table in the rebaked SKILL.md will split into two visual groups: "Play-start pre-flight" (C1, C2, C3, C10, C11) and "Stage-3 pre-flight" (C15). Both are halt-on-fail; only the timing differs. This preserves the single pre-flight table in the compiled example while keeping the semantics clear.

### E. Step numbering decision

Insertion of Stage 2.75 as a new step bumps every subsequent step by 1. The current Step 5 (Configure capabilities) becomes Step 6; current Step 13 (Evidence + commit) becomes Step 14. The JSON task_ids update accordingly: e.g., `specify-product-stage-3-configure` stays (the stage numbering is a workflow label, not a step counter — D1 and this rebake preserve the `stage-N` naming for human readability, but the step number in the SKILL.md file body increments).

### F. New step evals (C15, C16, C17, F13)

- C15 — pre-flight; NOT eval-generated (per evals-creator rules, pre-flight constraints are enforced by play structure not by SE evals). Coverage: pre-flight table row.
- C16 — artifact-verifiable; generate SE via evals-creator. Eval pattern: scan every file produced by this play under `research/`, `specification/`, `scope/` and assert absence of deny-list tokens.
- C17 — structural; NOT eval-generated. Coverage: play structure (Stage 2 Step 3 performs the copy; Stage 3 Step 6 JSON contract reads from `product_domain_library_path` only). The structural element is the JSON contract + step text.
- F13 — failure condition; generate SE via evals-creator. Overlaps with C16.

Constraint classification for evals-creator:

| ID | Category | Enforcement |
|----|---------|-------------|
| C1 | pre-flight | pre-flight table |
| C2 | pre-flight | pre-flight table |
| C3 | pre-flight | pre-flight table |
| C4 | artifact-verifiable | SE |
| C5 | artifact-verifiable | SE |
| C6 | artifact-verifiable | SE |
| C7 | artifact-verifiable | SE |
| C8 | artifact-verifiable | SE |
| C9 | artifact-verifiable | SE |
| C10 | structural | agent boundary table + pre-flight |
| C11 | structural | agent boundary table + pre-flight |
| C12 | structural | 4 checkpoint phases |
| C13 | structural | 3-layer hierarchy (no Theme/Feature/Story) |
| C14 | artifact-verifiable | SE (pre-lock gate output) |
| C15 | pre-flight | pre-flight table (Stage-3 pre-flight) |
| C16 | artifact-verifiable | SE (deny-list scan) |
| C17 | structural | JSON contract + step text |

## 5. Intent-crafter skip decision

The intent.yaml update is already complete and correct (D6/D7/D8/D9 landed directly). There is no gap in the intent that needs crafter review. Per the task brief, skipping Step 2 crafter invocation.

## 6. Agent audit status

Agents already exist and were audited in prior runs. No new agents. No changes in this rebake to agent skill inventories — configure-capabilities is modified in place; product-keeper already dispatches it. market-analyst, product-keeper, judge all remain within the ≤5 domain-agent budget. Re-audit is not triggered by a skill modification that does not add or remove agent capabilities.

## 7. Workflow structure

Structure A preserved. Adds one new workflow step (Stage 2.75 MVP Recommendation) within the existing structure. No structure change.

## 8. Open questions / deliberations

None. All four defects land cleanly in the existing Structure A with the analysis above.
