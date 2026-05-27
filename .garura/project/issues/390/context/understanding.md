# Context — #390 Align product-layer epics with ICE

## LTM Resolution Trace

- Core LTM resolved from `~/.garura/core/memory/` — ICE pattern drawn from play-layer
  artifacts (fix-it + draft-play-expectation + expectation-crafter).
- Product LTM at `.garura/product/architecture/` does not exist for this project.
  Approach design proceeds with core LTM only.

---

## 1. Reference Files — Key Paths and Ranges

### Current schema
`core/components/memory/standards/schemas/intent-epic.yaml`

The whole file is the contract. Key structural points:
- Top-level fields (lines 15–355): `id`, `domain`, `capability`, `provenance`, `problem_statement`,
  `intent` (singular string), `appetite`, `in_scope`, `anti_goals`, `must_not_break`,
  `success_scenarios`, `failure_scenarios`, `constraints`, `business_rules`, `hypothesis`,
  `assumptions_requiring_validation`, `dependencies`, `depends_on`, `foundation_investment`,
  `uses_mocks`, `demock_epic_ref`, `kb_source`, `post_implementation`.
- `failure_scenarios` (lines 101–105): carries `scenario`, `impact`, `mitigation` per entry.
  This field name will change in the new shape (split into expectation block's `recovery`-style entries).
- Validation rules comment block (lines 212–322): hardcodes field names the validator checks.
  Every field name referenced here is a coupling point — renaming `failure_scenarios` or
  `intent` (singular) to `intents` (list) breaks these.
- `post_implementation` block (lines 330–355): written by capture-learning post-ship.
  Must not be disturbed by the reshape.

### Current generate skill
`core/components/skills/generate-intent-epics/SKILL.md`

Key sections:
- Input contract (lines 22–32): receives `ltm_intent_epic_schema_path`,
  `ltm_rules_epics_path/features_path/scenarios_path`, `enriched_capabilities_path`,
  `project_profile_path`, `market_brief_path`, `epics_output_dir`, `decision_manifest_path`.
- Step 2b (lines 57–73): component-to-parent merge. Produces `in_scope`, `business_rules_applied`,
  `failure_scenarios`, `experiential_warnings` merged into parent vertical.
- Step 3 OUTCOMES block (lines 95–98): `success_scenarios` and `failure_scenarios` — these
  field names are authored inline here. In the new shape the skill stops at the intent block;
  `failure_scenarios` generation moves to `draft-epic-expectation`.
- Output contract (lines 171–186): returns `epics.files[]`, `quantification_coverage`.
  Needs a new field pointing to the expectation block's generation status after handoff.
- Decision manifest (lines 128–163): records `D-gie-001` through `D-gie-006`.
  `D-gie-004` (success_scenarios phrasing) moves to the new expectation skill's manifest.

### Mirror skill to copy structure from
`core/components/skills/draft-play-expectation/SKILL.md`

The new `draft-epic-expectation` mirrors this. Key structural invariants to preserve:
- Input: `intent_path`, `output_path`, `rules_path` (optional override).
- Process: reads rules → detects input shape (migrated triple vs legacy) → generates
  `success_scenarios` (one per distinct consumer/outcome) → generates `recovery` (one per
  failure condition) → stamps `vetted.status: pending` → writes file.
- Output shape (lines 64–83): `name`, `generated_from.intent`, `vetted.status`,
  `success_scenarios[].{id, persona, given, then, measure}`, `recovery[].{id, for_failure,
  trigger, direction, handoff, derivable_at_l4}`.
- The `handoff` field is `autonomous | human`. The epic expectation skill must apply the
  same autonomous-vs-human test from `expectation-generation.md`.

### Mirror agent to copy structure from
`core/components/agents/expectation-crafter.md`

The new `epic-expectation-crafter` mirrors this. Key invariants:
- Frontmatter (lines 1–13): `name`, `domain`, `role`, `description`, `model`, `tools`.
  Mirror agent should use `domain: epic-expectation`, `role: crafter`.
- Case selection (lines 25–30): play case vs feature case selected by presence of
  `stm.input.context`. The epic crafter has no such split — it always handles epics.
  The case-detection logic is dropped; it always invokes `draft-epic-expectation`.
- Skill pool (lines 83–87): lists the matching generator. New agent's pool is just
  `draft-epic-expectation`.
- NEVER set `vetted.status: approved` — invariant preserved in epic crafter.
- Output contract (lines 121–128): `expectation_crafted.{path, success_scenario_count,
  recovery_count, vetted_status, status}`.

### Validator
`core/components/skills/validate-intent-epics/SKILL.md`

Key coupling to old shape:
- Step 3 mandatory fields (lines 46–63): `intent` (singular string), `success_scenarios` (≥2),
  `failure_scenarios` (≥2 with `scenario`, `impact`, `mitigation`).
- Step 3 per-epic checks (lines 64–77): quantification regex applied to `constraints` — not
  affected by the shape change.
- Step 4 cross-epic checks (lines 79–120): `vertical slice` test greps `intent` field
  as singular string (line 49). With `intents: [...]` list, this check must loop per-intent.
- `should_language` scan (line 108): greps `success_scenarios[].scenario`. In the new shape,
  `success_scenarios` lives in the expectation block. Validator must read both blocks.
- Output summary (lines 125–173): `by_category` counters — no structural change needed,
  but the new shape requires per-intent violation tagging (e.g., `intent[1].subsystem_actor`).

### Epics rules
`core/components/memory/standards/rules/epics.md`

Rules 1–7 (entire file). Key threading for per-intent application:
- Rule 1 actor test (lines 18–48): currently written for `intent` (singular). With
  `intents: [...]`, the rule must state that EVERY entry in the list passes the actor test
  and outcome test independently.
- Rule 5 (lines 109–119): success_scenarios language — now lives in the expectation block.
  The rule text refers to `success_scenarios[].then`; it may need a note that this is in
  the expectation block after the reshape.
- Schema fields table (lines 161–173): maps each rule to a field. `intent` entry must
  change to `intents[]`.

### /specify play — invocation section
`core/components/plays/specify/SKILL.md`, lines 455–524 (Stage 5 JSON contract)

- Step 9 dispatches `generate-intent-epics` to `product-keeper`. The contract passes
  `enriched_capabilities_path`, schema, and 3 rules files. After the reshape, this step
  still runs — it emits only the intent block.
- Steps 9a–10: decision surfacing then validate. New step between 9a and 10: invoke
  `epic-expectation-crafter` (via a new `product-keeper` sub-task) to generate the
  expectation block before validation runs. Validation now reads both blocks.
- SCE-1 and SCE-4 (line 645, 651): specify's scenario evals assert `failure_scenarios`
  by name. These must be updated to assert the expectation block's `recovery` field.

### Sample existing epic
`.garura/product/scope/epics/epic-agentic-methodology-l3-intent-driven-001.yaml`

Shape as-is: single `intent` string (line 53), `success_scenarios` (line 161), `failure_scenarios`
(line 182) at the top level alongside all other fields. No `intents:` list, no separate
expectation block, no `vetted` section. The 9 epics on disk must be rewritten to the new shape
in this change.

This epic also has an `intent_lock` field (lines 56–65) and a `features` list (lines 91–153) —
non-standard fields not in the schema. These will need to carry through or be placed appropriately
in the new shape.

### Play-layer ICE reference
`core/components/plays/fix-it/reference/intent.yaml` — the clean triple.
`core/components/plays/fix-it/reference/expectation.yaml` — the generated expectation with
`vetted.status: approved`, `success_scenarios[].{id, persona, given, then, measure}`,
`recovery[].{id, for_failure, trigger, direction, handoff, derivable_at_l4}`.

---

## 2. Existing Patterns to Mirror (Play-Layer ICE Invariants)

These are the rules being replicated at the epic layer. The approach must preserve every one.

**Clean intent triple.** The intent file/block carries: `intent` (or `intents: [...]`),
`constraints`, `failure_conditions`. Nothing else about outcomes or recovery lives here.
`failure_scenarios` (the old epic field name) is the epic analog of `failure_conditions` in
plays — it will move into the intent block renamed to `failure_conditions`.

**Generated expectation, never hand-authored.** The expectation block is always produced by
a skill (`draft-epic-expectation`) from the intent block. It is never written by hand.
`vetted.status: pending` until a human Tethers at the single checkpoint.

**One recovery entry per failure condition.** `recovery[]` in the expectation has exactly one
entry per `failure_conditions[]` item. No more, no fewer.

**`handoff: autonomous | human`.** Each recovery entry routes by this flag. The
`autonomous-vs-human` test from `expectation-generation.md` applies to epics too.

**`measure` is binary-testable.** Every `success_scenarios[].measure` must be observable and
binary. The scenario eval is compiled from it.

**Single Tether covers both blocks.** The crafter agent presents intent + expectation together.
The user sees one checkpoint, not two separate approvals.

**`vetted.status: pending` → `approved`.** Only a human sets `approved` at the checkpoint.
The skill always writes `pending`. The play promotes it after Tether.

---

## 3. Integration Points

**Who calls `generate-intent-epics` today:**
- `/specify` play, Step 9, via `product-keeper`. The JSON contract is at
  `core/components/plays/specify/SKILL.md` lines 451–472.
- The skill is invoked once per specify run, after enrichment, before validation.

**Who reads epic output (and how):**
- `validate-intent-epics` — reads every field in every epic YAML by name. Heavy coupling
  to field names. Any rename is a breaking change here.
- `derive-quality-profile-from-epics` — reads `failure_scenarios[].mitigation` by field name
  (`SKILL.md` line 69). Rename to `failure_conditions` in the intent block changes the path.
- `map-user-flows` — reads `success_scenarios` and `failure_scenarios` by name
  (`SKILL.md` lines 37, 49, 141, 180–183). Both field names are hardcoded.
- `generate-screen-inventory` — reads `success_scenarios`, `failure_scenarios`, `business_rules`
  by name (`SKILL.md` line 40).
- `/specify` scenario evals SCE-1 and SCE-4 — assert `failure_scenarios` by name at line 645, 651.
- `infer-epics-from-code` — reads `success_scenarios` and `failure_scenarios` by name
  (its output template, `SKILL.md` lines 154).

**Who reads the schema:**
- `validate-intent-epics` — loads schema as mandatory-field source of truth.
- `generate-intent-epics` — loads schema to understand required shape.
- Manual/editorial references in the epic files themselves (comment headers).

---

## 4. Conventions

**Skill frontmatter.** YAML block at lines 1–8: `name`, `description`, `user-invocable`,
`model`, `allowed-tools`. The new `draft-epic-expectation` skill follows the same block.
`user-invocable: false` since it is model-invocable only.

**Agent frontmatter.** YAML block: `name`, `domain`, `role`, `description`, `model`, `tools`.
Confirmed in `expectation-crafter.md` lines 1–13.

**Schema file structure.** Comment-annotated YAML. Section dividers use `# ────` lines.
Each field carries inline comments explaining type, enumeration, and examples.
Enforcement note is in a comment block at the bottom (lines 212–322).

**`vetted` block.** From `fix-it/reference/expectation.yaml` lines 11–14:
```yaml
vetted:
  status: approved          # pending on generation, approved after human Tether
  approved_by: <actor>
  approved_at: <ISO-8601>
```
The epic expectation block must carry the same structure. `draft-epic-expectation` writes
`status: pending`; the crafter agent's output contract returns the path; the play (or the
single-Tether checkpoint) promotes it to `approved`.

**Source attribution on constraints.** `source_for_quantification` with `source` enum
(`brief | profile_nfr | kb_default | assumption`) is already in the schema
(`intent-epic.yaml` lines 119–141). This is the intent block's constraints mechanism.
It stays unchanged in the new shape — constraints remain in the intent block.

**Decision manifest.** `generate-intent-epics` emits `decision-manifest-generate-intent-epics.yaml`.
The new `draft-epic-expectation` should emit its own decision manifest or share the existing one.
The `/specify` play's Step 9a surfaces the combined manifest (line 491). Clarification needed
for approach design: does the expectation skill add entries to the existing manifest, or emit
a separate `decision-manifest-draft-epic-expectation.yaml` with a new Step 9b surface step?

---

## 5. Risks Visible From the Codebase

**`failure_scenarios` field name is hardcoded across 6+ consumers.**
`map-user-flows`, `generate-screen-inventory`, `derive-quality-profile-from-epics`,
`infer-epics-from-code`, `/specify` SCE evals, `validate-intent-epics`, and the schema
comment block all reference `failure_scenarios` by exact name. If the new shape renames
this to `failure_conditions` inside the intent block (to match play-layer naming), every
one of these consumers breaks silently — they will find an empty list and pass without
error. This is the highest-risk rename in the change.

**`intent` (singular string) → `intents: [...]` list.**
The validator's actor test (Step 4, subsystem-actor check) greps a single `intent` string.
With a list, the check must iterate. The validator's mandatory-field check also asserts
`intent` (length ≥ 20). Both must be updated. The `enrich-capabilities` skill may also
depend on the `intent` field shape; grep confirms it references `intent` indirectly through
the schema.

**Single-file constraint creates merge-write complexity.**
The discovery decision is one file per epic, with intent block and expectation block side by
side. `generate-intent-epics` writes the file first (intent block only). `draft-epic-expectation`
must then append or update the same file with the expectation block. This requires either:
(a) `generate-intent-epics` emits a placeholder expectation section that the new skill
fills in, or (b) `draft-epic-expectation` reads the existing file and writes a merged version.
Either approach needs a clear file-locking or atomic-write pattern to avoid partial writes.
This is an open design question flagged in `discovery.md` line 45.

**`validate-intent-epics` loads schema as source of truth for mandatory fields.**
The schema's validation-rules comment block (lines 212–322) lists exact field names.
After the reshape, this comment block must be rewritten to reflect the new shape —
if it still lists `failure_scenarios` as mandatory, the validator will reject all migrated
epics with no `failure_scenarios` at the top level.

**9 existing epics have non-schema fields.**
`epic-agentic-methodology-l3-intent-driven-001.yaml` carries `intent_lock` and `features[]`
fields that are not in the schema. The validator does not error on unknown fields today
(it checks presence, not exclusivity). These fields must be placed in the new shape without
being mistaken for schema-mandated blocks.

**`/specify` SCE-1 and SCE-4 assert `failure_scenarios` by name.**
These scenario evals (lines 645, 651 of specify SKILL.md) will pass on old epics and fail
on new ones unless updated. They are compiled evals — changing them requires a SKILL.md
edit to the specify play (which is a compiled artifact from its intent). This is a
non-intent change and is a direct edit to SKILL.md per the play pipeline rules.

**`enrich-capabilities` output feeds `generate-intent-epics` Step 2b.**
Step 2b's component-merge logic reads `failure_scenarios` from the enriched record
(`SKILL.md` lines 68). If `enrich-capabilities`'s output shape stays unchanged
(it produces `failure_scenarios` from KB data), the merge step carries that name into the
epic intent block. In the new shape, these become `failure_conditions` (or remain
`failure_scenarios` in the intent block — depends on design decision). Either way, the
merge step and the expectation generation skill must agree on the field name.

**`derive-quality-profile-from-epics` reads `failure_scenarios[].mitigation`.**
If `failure_scenarios` is renamed or moved into the expectation block's `recovery[]`,
this skill will silently get an empty list and skip risk population. Not a crash — a silent
data loss. Must be updated alongside the epic reshape.
