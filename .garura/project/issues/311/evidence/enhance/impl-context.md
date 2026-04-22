# Implementation Context — Issue #311 (reap)

**Contract:** You are the implementer. Read this file plus `understanding.md`. No other approach artifacts are available to you.

**Golden rule:** The reap play is a **compiled play**. Author `reference/intent.yaml` as the source of truth. Use `/create-play --build reap` to compile `SKILL.md`. Never hand-edit `SKILL.md`.

---

## Solution Summary

The core design is a two-level learning taxonomy landing in the proposals schema, aligned to Garura's actual KB structure at `core/components/memory/`. Each proposal carries BOTH a top-level `learning_category` AND a `sub_category` that route it to a specific LTM path.

**Canonical taxonomy (starting point — NOT a closed enum):**

```
learning_category: arch | domain | product | quality | standards
sub_category per parent:
  arch      → agentic | data | operations | patterns | platforms | stacks
  domain    → (flat — sub_category null/empty)
  product   → (flat — sub_category null/empty)
  quality   → architecture | backend | code | data | documentation | frontend |
              operations | performance | security | tech-debt | testing
  standards → rules | schemas | templates
```

Invention is permitted but structurally constrained: if a proposal does not fit any canonical value, the play may emit a proposed new `learning_category` or `sub_category`, BUT the proposal MUST carry a `taxonomy_justification` block with (a) `evidence_path` — a specific STM artifact path, (b) `excerpt` — verbatim excerpt demonstrating the learning type, and (c) `reasoning` — why canonical taxonomy does not fit. This honors the framework rule: cite or don't invent. A reviewer can accept, remap, or reject the invention. The invention flag surfaces explicitly in proposals.yaml so reviewers never mistake a proposed-new category for a canonical one.

The field pair replaces the existing six-value `dimension` field in `diff-context-baseline` findings and carries forward into `draft-enrichment-proposals` output. The mapping from old `dimension` to new pair is content-routed (not a pure rename): `architecture→arch`, `libraries→arch+stacks`, `patterns→arch+patterns`, `invariants→domain`, `quality→quality` (with sub derived from finding content), `assumptions→domain` default.

The play scaffold follows Structure A (Pre-flight → Preparation → Checkpoint → Execution → Evidence). Pre-flight gates on `evidence/validate/` presence (NOT on GitHub issue-closed state — rationale: reap is post-validate extraction; archival requiring CLOSED state is now `archive-issue-stm`'s concern, not reap's). Preparation reads `epic_id` from `context/design/epic-spec.yaml`. The Checkpoint is human-gated: proposals are staged in STM, user reviews, Tethers to commit evidence or Vanishes to halt. Execution is `knowledge-extractor` ANALYZE mode with the updated taxonomy-aware skill chain. Evidence is self-committed via repo-orchestrator (non-blocking).

**`capture-learning` is deleted entirely** — its play directory is removed. The three skills it used (`diff-context-baseline`, `draft-enrichment-proposals`, `apply-ltm-enrichment`) remain; the `knowledge-extractor` agent remains; only the play orchestration wrapper is gone. This creates a deliberate ENRICH gap until the `enrich` play ships (separate future issue). The proposals output path is `{stm_base}/{issue}/evidence/reap/proposals.yaml` — consistent with distill's naming convention, forward-compatible with enrich consumption, within the STM folder whitelist.

---

## Files to Create

### 1. `core/components/plays/reap/reference/intent.yaml`

**Purpose:** Source of truth for the reap play. Hand-authored. Input to `/create-play --build reap`.

**Must include constraints (at least C1–C15, C7a, C7b; numbering can be adjusted):**

- **C1:** validate evidence must exist at `{stm_base}/{issue}/evidence/validate/` (at least one `milestone-verdict.yaml`). Issue state OPEN or CLOSED is accepted (break from capture-learning C1).
- **C2:** `context/` baseline must exist at `{stm_base}/{issue}/context/` (prepare must have run).
- **C3:** STM artifacts are read-only during extraction. reap reads context and evidence but does not modify any STM artifact from prior runs.
- **C4:** All output goes to `{stm_base}/{issue}/evidence/reap/`. No writes to product LTM (`{product_base}`). No writes to core LTM (`~/.garura/core/memory/`).
- **C5:** reap NEVER invokes `apply-ltm-enrichment`. ENRICH mode is the exclusive domain of the enrich play (separate future issue).
- **C6:** Three-tier analysis model inherited from capture-learning. Tier 1 (foundational check-only), Tier 2 (enrichment), Tier 3 (addition).
- **C7:** Every proposal in `proposals.yaml` MUST carry a two-level taxonomy: `learning_category` (canonical: `arch | domain | product | quality | standards`) and `sub_category` (canonical child for arch/quality/standards; null for flat parents domain/product).
- **C7a:** Proposed-new `learning_category` or `sub_category` values are permitted ONLY when the proposal includes a `taxonomy_justification` block with `evidence_path` (STM artifact), verbatim `excerpt`, and `reasoning`. Findings/proposals lacking this block when a `_proposed` flag is true must be rejected as invalid.
- **C7b:** Canonical taxonomy tree is the starting point, not a closed enum. Proposals MAY propose new categories or sub-categories but the proposal is the reviewer's signal to evolve the KB — reap does not promote proposed values to canonical.
- **C8:** check-drift `spec-correction-manifest` consumed as input when present at `{stm_base}/{issue}/evidence/check-drift/`. Not re-derived. If absent, play performs own comparison.
- **C9:** If product LTM artifacts for a tier are absent (e.g., `architecture/` directory does not exist), that tier is skipped with a warning in `proposals.yaml`. Missing product LTM is not a hard failure.
- **C10:** Human checkpoint before evidence commit. `proposals.yaml` staged in STM; user reviews; Tether to finalize and self-commit or Vanish to halt.
- **C11:** Zero-proposal exit is valid. If no learnings detected across all tiers, write `proposals.yaml` with `total_proposals: 0` and empty proposals list.
- **C12:** Primary inputs are the context baseline (`{stm_base}/{issue}/context/`) and build trinity outcomes (implement milestones + validate verdicts). `epic_id` resolved from `context/design/epic-spec.yaml`.
- **C13:** evidence self-commit via repo-orchestrator is non-blocking. Any commit failure is logged and the play exits cleanly.
- **C14:** proposals output path is `{stm_base}/{issue}/evidence/reap/proposals.yaml`.
- **C15:** `knowledge-extractor` ANALYZE mode is the extraction engine. reap is the calling play; it does not perform extraction logic inline.

**Must include at least one failure condition and at least one scenario** (author at least F1–F10 and S1–S6 commensurate with the constraints above).

**Must document the full canonical taxonomy tree** (5 top-level values with their children per parent) within a constraint rule block or an appended reference block.

**Must NOT reference `apply-ltm-enrichment` as a called component** (it may appear only within a prohibition statement).

Use the intent.yaml schema at `~/.garura/core/memory/standards/schemas/intent.yaml` (or the source-of-truth at `core/components/memory/standards/schemas/intent.yaml`).

### 2. `core/components/plays/reap/SKILL.md`

**Purpose:** Compiled play orchestration artifact. **DO NOT EDIT MANUALLY** — generated by `/create-play --build reap` from `reference/intent.yaml`.

Required sections (produced by the create-play build step, not hand-authored): frontmatter (name, description, user-invokable), header, "Compiled From" notice with `intent_hash` guard, Role + Agent Boundaries table, Pre-flight, Task DAG, Workflow (phases Pre-flight → Preparation → Checkpoint → Execution → Evidence), Scenario Validation, Evidence & Close (with repo-orchestrator self-commit per ADR 012, non-blocking), Pause and Resume (status at `{stm_base}/{issue}/status/reap.json`), Compilation Metadata (intent_hash, compiled_by, compiled_at, workflow_structure, agent counts, eval counts).

---

## Files to Modify

### `core/components/agents/knowledge-extractor.md`

Four targeted changes:

1. **Frontmatter `description` field (line 5):** Update to:
    > "Three-mode learning extraction agent. FAST mode (distill play, L1): lightweight post-PR extraction. ANALYZE mode (reap play, L2): semantic post-epic extraction from build trinity — answers what LTM/KB gap this epic revealed. ENRICH mode (enrich play, LTM write boundary): writes approved proposals to product LTM. Context-isolated: reads STM evidence and product LTM — NEVER modifies STM artifacts. ANALYZE and FAST modes write to STM only. ENRICH mode requires approved proposals and writes only to product LTM."

2. **Operating Modes table:** Update Trigger column to reflect three-play split: `ANALYZE | Trigger: reap play (L2, post-epic)` / `FAST | Trigger: distill play (L1, post-PR)` / `ENRICH | Trigger: enrich play (separate, LTM write boundary)`. Remove "Two modes: ANALYZE ... and ENRICH" language from description — it no longer reflects the full three-mode reality.

3. **ANALYZE Mode output path in Input/Output contract:** Update from `{stm_base}/{issue}/evidence/capture-learning/reconciliation-proposals.yaml` to `{stm_base}/{issue}/evidence/reap/proposals.yaml`.

4. **`intent_path` in ANALYZE/ENRICH mode Input Contract:** Update from `core/components/plays/capture-learning/reference/intent.yaml` to `core/components/plays/reap/reference/intent.yaml`.

### `core/components/skills/diff-context-baseline/SKILL.md`

Changes:

- **Frontmatter `description`:** Note that `dimension` is replaced by a two-level learning taxonomy (`learning_category` + `sub_category`) aligned to `core/components/memory/` KB structure.

- **Step 3 ("Diff by dimension"):** Rename to "Classify by learning category." Replace the six-value `dimension` enum with the canonical two-level taxonomy (5 top-level + sub-category children per the parent table in the solution summary). Add a mapping note: `architecture→arch` (sub content-routed), `libraries→arch+stacks`, `patterns→arch+patterns`, `invariants→domain`, `quality→quality` (sub content-routed), `assumptions→domain` default. Add a "Proposed new categories" subsection describing when/how the skill may emit a proposed-new value — ONLY when no canonical value fits, AND the finding MUST carry a `taxonomy_justification` block (`evidence_path`, `excerpt`, `reasoning`).

- **Output schema in Step 5 (context-diff.yaml `findings[]` block):** Replace `dimension: ...` with the full field set:

  ```yaml
  learning_category: "<canonical-or-proposed>"
  sub_category: "<canonical-or-proposed>" | null
  learning_category_proposed: false   # true iff category is not in canonical enum
  sub_category_proposed: false        # true iff sub is not in canonical children for parent
  taxonomy_justification:             # REQUIRED iff either _proposed flag is true
    evidence_path: "<path to STM artifact>"
    excerpt: "<verbatim excerpt demonstrating the learning type>"
    reasoning: "<why canonical taxonomy does not fit>"
  ```

  `learning_category` is REQUIRED. `sub_category` is required when parent has children (arch, quality, standards) and null/empty for flat parents (domain, product). Findings failing these rules must be rejected by the skill with a structured error. Document the canonical taxonomy tree explicitly in this section.

### `core/components/skills/draft-enrichment-proposals/SKILL.md`

Changes:

- **Step 6 schema (`reconciliation-proposals.yaml`):** Add the two-level taxonomy pair plus proposal/justification fields to each proposal entry:

  ```yaml
  learning_category: "<canonical-or-proposed>"
  sub_category: "<canonical-or-proposed>" | null
  learning_category_proposed: false
  sub_category_proposed: false
  taxonomy_justification:                 # REQUIRED iff either flag is true
    evidence_path: "<path to STM artifact>"
    excerpt: "<verbatim excerpt>"
    reasoning: "<why canonical does not fit>"
  ```

  All five taxonomy fields are sourced from the originating finding in `context-diff.yaml` via `from_finding` link — the skill does NOT re-classify; it faithfully carries the finding's classification forward.

  Also update the output filename from `reconciliation-proposals.yaml` to `proposals.yaml` to align with distill convention and forward-compat with enrich.

  Document the canonical 5-top-level taxonomy enum and the invention-with-justification rule explicitly.

- **Summary block (`proposals.yaml` footer):** Extend summary with:

  ```yaml
  by_learning_category:
    arch: {n}
    domain: {n}
    product: {n}
    quality: {n}
    standards: {n}
  proposed_categories:                    # distinct proposed-new learning_category values this run
    - value: "<proposed name>"
      count: {n}
      first_evidence_path: "<path>"
  proposed_sub_categories:                # distinct proposed-new sub_category values this run
    - parent: "<learning_category>"
      value: "<proposed name>"
      count: {n}
      first_evidence_path: "<path>"
  tiers_skipped: ["{list of tiers skipped due to missing artifacts}"]
  ```

  Also carry forward the existing `tier_1`/`tier_2`/`tier_3` counts.

- **Output contract:** Update `reconciliation_proposals_path` key to `proposals_path` and reflect new filename (`proposals.yaml` vs `reconciliation-proposals.yaml`).

---

## Files to Delete

**Strategy:** Full delete of `core/components/plays/capture-learning/` — play orchestration wrapper only. The three skills it used are reused and retained. The knowledge-extractor agent is retained (with the description update above).

**Files to delete:**
- `core/components/plays/capture-learning/SKILL.md`
- `core/components/plays/capture-learning/reference/intent.yaml`
- `core/components/plays/capture-learning/` (directory)

**Files to RETAIN (verify not deleted):**
- `core/components/skills/diff-context-baseline/` (reused by reap)
- `core/components/skills/draft-enrichment-proposals/` (reused by reap)
- `core/components/skills/apply-ltm-enrichment/` (reused by future enrich play)
- `core/components/agents/knowledge-extractor.md` (reused — description updated per above)

**ENRICH gap (expected):** deleting capture-learning means no LTM-write play until enrich ships (separate future issue). Proposals accumulate in STM; this is intentional per the Learning Pipeline redesign.

---

## Connections / Data Flow

```
/reap <issue>
  → Pre-flight: verify context/ exists AND validate/ evidence exists (at least one milestone-verdict.yaml)
  → Preparation: read epic_id from {stm_base}/{issue}/context/design/epic-spec.yaml
  → knowledge-extractor (ANALYZE mode)
      → diff-context-baseline skill
          reads: {stm_base}/{issue}/context/ (prepare baseline)
          reads: {stm_base}/{issue}/milestones/*/ (milestone-verdict.yaml)
          reads: {stm_base}/{issue}/evidence/implement/*/ (arbiter-verdicts, status-reports)
          reads: {stm_base}/{issue}/evidence/check-drift/spec-correction-manifest.yaml (optional)
          writes: {stm_base}/{issue}/evidence/reap/context-diff.yaml
          output fields per finding: learning_category + sub_category +
                                      *_proposed flags + taxonomy_justification
                                      (canonical arch|domain|product|quality|standards
                                       with validated children; proposed-new allowed only with
                                       evidence_path + excerpt + reasoning)
      → draft-enrichment-proposals skill
          reads: {stm_base}/{issue}/evidence/reap/context-diff.yaml
          reads: {product_base}/ (read-only, to identify proposal targets)
          writes: {stm_base}/{issue}/evidence/reap/proposals.yaml
          writes: {stm_base}/{issue}/evidence/reap/adr-drafts/*.md (Tier 1 only)
          output: full taxonomy pair + justification carried forward per proposal
                  (no re-classification — faithful pass-through from findings)
  → Checkpoint: present proposals.yaml to user (Tether/Vanish)
  → Evidence & Close (on Tether):
      repo-orchestrator self-commit (non-blocking)
      commit message: "chore(stm): record reap evidence for #{issue}"
      status file: {stm_base}/{issue}/status/reap.json
```

### proposals.yaml output schema (locked)

```yaml
sourced_from: "{context_diff_path}"
generated_at: "{ISO-8601}"
source_play: "reap"
proposals:
  - proposal_id: P-001
    from_finding: F-001
    tier: 1 | 2 | 3
    learning_category: "<canonical: arch|domain|product|quality|standards  OR  proposed-new>"
    sub_category: "<canonical child of parent  OR  proposed-new  OR  null for flat parents>"
    learning_category_proposed: false
    sub_category_proposed: false
    taxonomy_justification:
      evidence_path: "<STM artifact path>"
      excerpt: "<verbatim excerpt>"
      reasoning: "<why canonical taxonomy does not fit>"
    target_path: "{LTM artifact path}"
    action: modify | add | contradict_with_adr
    change: |
      {block or diff}
    impact:
      downstream_artifacts: [...]
      plays_affected: [...]
      risk: low | medium | high
    adr_draft_path: "{path, Tier 1 only}"
    approval_status: pending
summary:
  tier_1: {n}
  tier_2: {n}
  tier_3: {n}
  by_learning_category:
    arch: {n}
    domain: {n}
    product: {n}
    quality: {n}
    standards: {n}
  proposed_categories:
    - value: "<proposed name>"
      count: {n}
      first_evidence_path: "<path>"
  proposed_sub_categories:
    - parent: "<learning_category>"
      value: "<proposed name>"
      count: {n}
      first_evidence_path: "<path>"
  tiers_skipped: ["{list of tiers skipped due to missing artifacts}"]
```

### Gap resolution decisions (locked)

- **Issue state:** reap does NOT check GitHub issue state. Pre-flight gates on `evidence/validate/` presence (at least one `milestone-verdict.yaml`). OPEN issues are accepted post-validate. This is a deliberate break from capture-learning C1 (which required CLOSED) because archival — which required close — is no longer part of this play.

- **Schema divergence with distill:** reap keeps the reconciliation schema (tier + from_finding + impact block) rather than unifying with distill's schema (confidence + evidence_diff_reference). `learning_category` + `sub_category` + invention fields are added to both — this is the only cross-L1/L2 field alignment done in this issue. Full schema unification is deferred to a future issue when enrich is designed.

- **Drift manifest:** Preserved. knowledge-extractor ANALYZE mode behavior for consuming `spec-correction-manifest` when present is unchanged. reap's intent.yaml re-declares this constraint as C8.

---

## Tasks (ordered)

### T1 — Author intent.yaml

Author `core/components/plays/reap/reference/intent.yaml`. Contents per the Files to Create section above. At minimum one constraint, one failure condition, one scenario (you should produce many more, per the guidance above). Must contain C7, C7a, C7b covering the taxonomy contract. Must document the full canonical taxonomy tree. Must NOT reference `apply-ltm-enrichment` as a called component. Must NOT require issue-closed state — accepts OPEN or CLOSED.

**Acceptance:** File at path, required constraints present, no stray apply-ltm-enrichment invocation, taxonomy tree documented.

**Blocks:** nothing. **BlockedBy:** none.

### T2 — Compile SKILL.md via /create-play

Invoke `/create-play --build reap` against the intent.yaml from T1. Compiled `SKILL.md` must be written to `core/components/plays/reap/SKILL.md`. **Do not author SKILL.md manually.**

**Acceptance:** `SKILL.md` exists, has "Compiled From" section with intent_hash matching `sha256(reference/intent.yaml)`, contains pre-flight + Task DAG + workflow + scenario validation + evidence & close sections.

**BlockedBy:** T1.

### T3 — Update diff-context-baseline

Modify `core/components/skills/diff-context-baseline/SKILL.md` per the Files to Modify section. Replace six-value `dimension` enum with the two-level taxonomy. Add `learning_category_proposed`, `sub_category_proposed`, `taxonomy_justification` fields to `findings[]` schema. Document the canonical taxonomy tree, the dimension→taxonomy mapping, and the invention-with-justification rule. Update frontmatter description.

**Acceptance:** No `dimension:` as a schema field in output block. Canonical taxonomy tree documented with all 5 top-level values and children. Findings schema has all 5 new fields. Mapping note and invention rule present.

**BlockedBy:** none.

### T4 — Update draft-enrichment-proposals

Modify `core/components/skills/draft-enrichment-proposals/SKILL.md` per the Files to Modify section. Add the full set of taxonomy fields to `proposals[]` schema (sourced via `from_finding` — faithful pass-through, no re-classification). Extend summary block with `by_learning_category`, `proposed_categories`, `proposed_sub_categories`. Update output filename (`reconciliation-proposals.yaml` → `proposals.yaml`) and contract key (`reconciliation_proposals_path` → `proposals_path`).

**Acceptance:** All 5 taxonomy fields in proposals[] schema. Canonical 5-top-level enum documented. Summary block extended. Filename and contract key updated.

**BlockedBy:** T3.

### T5 — Update knowledge-extractor.md

Modify `core/components/agents/knowledge-extractor.md` per Files to Modify section. Four changes: frontmatter description (three-mode framing), Operating Modes table (trigger column), ANALYZE mode output path (`evidence/capture-learning/` → `evidence/reap/`), intent_path (`capture-learning` → `reap`).

**Acceptance:** Frontmatter references FAST/ANALYZE/ENRICH with their respective plays. Operating Modes table references reap as ANALYZE trigger. Output path shows `evidence/reap/proposals.yaml`. intent_path points to reap.

**BlockedBy:** T1.

### T6 — Delete capture-learning play directory

Delete `core/components/plays/capture-learning/` in full. Verify the four retained components (three skills, one agent) still exist.

**Acceptance:** `core/components/plays/capture-learning/` does not exist. `diff-context-baseline/`, `draft-enrichment-proposals/`, `apply-ltm-enrichment/`, and `knowledge-extractor.md` all still exist.

**BlockedBy:** T2, T5.

### T7 — Safety grep

`grep -r "apply-ltm-enrichment" core/components/plays/reap/` → must return empty. (This is the STM-only boundary check.)

**Acceptance:** No matches.

**BlockedBy:** T2.

### T8 — Schema carry-through verification

Verify both updated skills carry the full taxonomy fields end-to-end. Grep for `learning_category`, `sub_category`, `taxonomy_justification` in both skill files. Canonical enum in both lists all 5 values (`arch, domain, product, quality, standards`). Neither file still documents `dimension:` as an output schema field.

**Acceptance:** All five fields present in both skills. Canonical enum complete in both. No stale `dimension:` schema field.

**BlockedBy:** T3, T4.

### T9 — Intent hash guard

Confirm `sha256(reference/intent.yaml)` equals the hash embedded in the "Compiled From" section of `SKILL.md`. If intent.yaml was edited between T2 and now, rerun `/create-play --build reap`.

**Acceptance:** Hash match.

**BlockedBy:** T2, T5.

### T10 — lint-components

Run `/lint-components` (or the lint-components skill) against:
- `core/components/plays/reap/`
- `core/components/agents/knowledge-extractor.md`
- `core/components/skills/diff-context-baseline/SKILL.md`
- `core/components/skills/draft-enrichment-proposals/SKILL.md`

Fix any schema violations, missing required fields, or structural errors before declaring done.

**Acceptance:** `lint-components` reports no errors for all four target components.

**BlockedBy:** T2, T3, T4, T5.

---

## Execution order (parallel-safe groups)

1. Start: T1 and T3 can run in parallel (T1 authors intent, T3 modifies a different skill).
2. After T1: T2 (compile) and T5 (knowledge-extractor edits) can run in parallel.
3. After T3: T4 can run.
4. After T2 and T5: T6 (delete capture-learning), T7 (grep), T9 (hash guard) can run.
5. After T3 and T4: T8 (schema carry-through) can run.
6. After T2, T3, T4, T5: T10 (lint-components).

---

## Implementation notes

- The Garura KB source of truth is `core/components/memory/` (not the deployed `~/.garura/core/memory/`). When referencing canonical taxonomy in code/docs, cite the source-of-truth path.
- When editing an existing SKILL.md or agent .md, preserve all sections you are not explicitly changing. Do not reformat whole files.
- `lint-components` may flag issues that require intent.yaml changes — if so, fix intent.yaml and rerun `/create-play --build reap` (T9 will catch a missed rebuild via the hash guard).
- Task T6 (delete) is destructive but reversible via git. Confirm T2 completed cleanly first.
