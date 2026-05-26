# Context Bundle — Issue #388
# Update Intent doctrine: 5 elements → 3, move Success Scenarios to Expectations

**Source issue:** [#388](https://github.com/kapilvirenahuja/garura/issues/388)
**Purpose:** Ground the Expectation generator for this issue in the current state of every surface that defines or enforces the Intent doctrine. Every section below is a summary with back-link so SE-4 can trace the claim to its source.

---

## 1. Doctrine documents

### 1.1 `docs/philosophy/intent-driven-development.md`

**Source:** `/Users/kapilahuja/cto/builder/garura/docs/philosophy/intent-driven-development.md`

The file is the canonical IDD paradigm document. It currently describes a **five-element** intent model in prose and tables. The ICE framing appears early in the document and is already written for the three-element intent — this is where the doctrine is already partially updated.

**What it says today about Intent (the parts that matter for #388):**

The ICE section (near the top, "The ICE Structure") is fully aligned with the new three-element model. It explicitly says:

- Intent = goal, constraints, failure conditions. Nothing else lives here.
- Success scenarios and recovery are NOT authored into Intent; they are generated into the Expectation layer.
- The builder receives: goal + constraints + all of Context + success scenarios. It never receives failure conditions or the evals.

Element 1 ("Intent Layer") in the Eight Elements section is also aligned. It names exactly three elements, has the routing table for compartmented evaluation (goal → builder, constraints → builder, failure conditions → validator), and explicitly states why success is not in Intent.

The IDD Principles section (P1 through P8) does not use the word "scenarios" as a slot inside intent. All four of the named principles that define the constraint-failure partition (P1, P2, P3, P4) are already three-element-clean.

**What still says five:**

The document does not say "five elements" of Intent anywhere explicitly. The five-element framing existed in an older version. The current document already names three. The main risk is that other documents (agents, skills, KB rules) still reference a `scenarios:` block in the intent schema or talk about success scenarios as part of intent.

**Key rules established in P1-P4 that this work must preserve:**

- P1: intents declare outcomes, not instructions. Two-implementations test.
- P2: constraints are unconditional boundaries. If crossing it is sometimes acceptable, it is a preference, not a constraint.
- P3: failure conditions are binary and observable. A validator can check them without asking a human.
- P4: builders and validators must not share context. The Constraint-Failure Classification Rule: "Would knowing this change how the builder writes code? Yes → constraint. No → failure condition."

### 1.2 Other `docs/philosophy/` files

No other file in `docs/philosophy/` defines or redefines what Intent contains. The ICE model and the eight elements are documented only in `intent-driven-development.md`. The `idsd.md` references ICE and routes readers to the main file; it does not re-define intent slots independently.

### 1.3 `core/grounding/glossary.md`

**Source:** `/Users/kapilahuja/cto/builder/garura/core/grounding/glossary.md`

The glossary carries canonical definitions for ICE-related terms. The current state:

- **Intent** (in the Execution Model table): defined as "the clean triple — goal, constraints, and failure conditions." Explicitly states "Success scenarios and recovery are NOT in Intent — they live in the Expectation layer." This is already correct.
- **ICE**: defined correctly as three artifacts (Intent = goal/constraints/failure_conditions, Context = assembled from memory, Expectation = generated + vetted). This is already correct.
- **Expectation**: defined as "the generated spec layer of ICE. Two parts: success scenarios and recovery." Explicitly states "NOT part of Intent. Scenarios/success/recovery are never hand-authored into intent.yaml." This is already correct.
- **intent.yaml** (in Play Compilation): defined as "the clean triple: goal, constraints (C-N), and failure conditions (F-N). Success scenarios and recovery live in the separate Expectation artifact, not here." This is already correct.

**Summary:** The glossary is fully aligned with the new three-element model. It does not need updates from this issue. What it confirms for the Expectation generator: the canonical term for the third element is "failure conditions" (not scenarios, not failure scenarios).

---

## 2. Agent prompts

### 2.1 `core/components/agents/intent-crafter.md`

**Source:** `/Users/kapilahuja/cto/builder/garura/core/components/agents/intent-crafter.md`

This agent interviews users to produce intent.yaml. Its current state:

**Already aligned with three-element model:**
- The schema it produces has no `scenarios:` block — only `intent`, `constraints`, and `failure_conditions`.
- It explicitly states: "It does NOT carry scenarios. Success scenarios and recovery are the Expectation layer — generated from this intent by `expectation-crafter` (via `draft-play-expectation`) and human-validated at the create-play checkpoint. Your job ends at the triple."
- The interview Category 4 ("Consumers") explicitly says: "Fold the answers into a sharper goal statement. The consumer signal becomes input to expectation generation later; you do not write scenarios."
- Scenarios gate: "Scenarios — not authored here. Success scenarios are NOT part of the intent and not validated by you. They are generated into the Expectation layer by `expectation-crafter` from this intent, then human-validated at the create-play checkpoint. Do not interview for, author, or gate scenarios."

**Already uses correct schema:**
```yaml
intent: <string>
constraints:
  - id: <string>   # C1, C2, ...
    rule: <string>
failure_conditions:
  - id: <string>   # F1, F2, ...
    condition: <string>
```
No scenarios block.

**Current status:** `intent-crafter` is fully migrated. No changes needed from this issue.

### 2.2 `core/components/agents/intent-resolver.md`

**Source:** `/Users/kapilahuja/cto/builder/garura/core/components/agents/intent-resolver.md`

This agent translates intent.yaml into executable task DAGs for play execution.

**Where it currently references scenarios inside Intent:**

The intent-resolver's input processing explicitly reads `scenarios` from intent.yaml:
- Step 1 says: "Read intent.yaml at `intent_path`. Extract: goal, constraints, failure conditions, and scenarios."
- The intent decomposition method (Step 2) says: "**Scenarios** become Stage 6 (Scenario Validation) tasks owned by `'play'`. Each scenario maps to one task with the scenario criteria in the description."

This is the **primary alignment gap** the Expectation generator should flag. After the doctrine update, intent-resolver should read scenarios from the Expectation artifact, not from intent.yaml. The resolution will be:
- Remove `scenarios` from the list of fields extracted in Step 1.
- Add an `expectation_path` input field so the resolver can read `success_scenarios` from the Expectation artifact for Stage 6 task generation.

The fix is a direct edit to the resolver's SKILL.md (non-intent change — it changes where the resolver reads scenarios from, not what it decides or guarantees).

---

## 3. Schema and validator skills

### 3.1 `author-intent-yaml` — what fields it currently emits

**Source:** `/Users/kapilahuja/cto/builder/garura/core/components/skills/author-intent-yaml/SKILL.md`

This skill writes the intent.yaml artifact. Its current output schema is the clean triple:
```yaml
intent: >
  {intent_statement}
constraints:
  - id: C1
    rule: >
      {rule text}
failure_conditions:
  - id: F1
    condition: >
      {condition text}
version: {version}
```

No `scenarios:` block. Scenarios are explicitly excluded as an input field ("Scenarios are NOT an input — the intent is the clean triple."). The skill also enforces a deny-list that rejects any constraint or failure_condition text containing play, agent, skill, or tool names.

**Current status:** `author-intent-yaml` is fully aligned. No changes needed.

### 3.2 `validate-intent-epics` — what it accepts/rejects for the intent block

**Source:** `/Users/kapilahuja/cto/builder/garura/core/components/skills/validate-intent-epics/SKILL.md`

This skill validates intent epics (not `reference/intent.yaml` files — it validates the product-planning pipeline's `intent-epic.yaml` artifacts). It checks:
- Mandatory fields: `id`, `domain`, `capability`, `problem_statement`, `intent`, `appetite`, `in_scope`, `anti_goals`, `must_not_break`, `success_scenarios`, `failure_scenarios`, `business_rules`, `hypothesis`, etc.

The epic schema **does** include a `success_scenarios` field — but this is in the context of an intent epic (a product-planning artifact), not in the context of a `reference/intent.yaml` play intent. These are two different document types. The `success_scenarios` in an intent epic is a planning-level acceptance criterion, not the same as the ICE Expectation layer.

**For the doctrine update:** The validator does not currently scan `reference/intent.yaml` files at all — it operates on `{epics_output_dir}/*.yaml`. So no direct change to `validate-intent-epics` is needed for this issue. The scope of #388 is doctrine + agent prompts + the `author-intent-yaml` schema. The intent-epics validator is a separate concern.

### 3.3 `generate-intent-epics` — does it write success_scenarios into intent?

**Source:** `/Users/kapilahuja/cto/builder/garura/core/components/skills/generate-intent-epics/SKILL.md`

This skill generates product-planning epics, not play intents. It writes `success_scenarios` and `failure_scenarios` into epic YAML files. These are planning artifacts, not ICE intent artifacts. The skill does not touch `reference/intent.yaml` files.

**For the doctrine update:** No change needed. The `success_scenarios` in epic YAML is a planning concept (acceptance criteria at the capability level), not the ICE Expectation layer.

### 3.4 `validate-abstraction-layer` — does it scan Intent blocks for implementation tokens?

**Source:** `/Users/kapilahuja/cto/builder/garura/core/components/skills/validate-abstraction-layer/SKILL.md`

This skill scans product-stage artifacts under `.garura/product/research/`, `.garura/product/specification/`, and `.garura/product/scope/` for implementation-binding tokens. It does NOT scan `reference/intent.yaml` files (play intents).

The deny-list covers database engines, SDK method names, framework identifiers, programming language type signatures, wire-level protocol identifiers, cryptographic constructions, and model version strings.

**Relationship to Intent doctrine:** The skill enforces abstraction at the product-planning stage. The intent-crafter agent and `author-intent-yaml` skill enforce the same principle for play intents through a different mechanism (deny-list on agent/skill/tool names). The two mechanisms are parallel, not integrated.

**For the doctrine update:** No change to `validate-abstraction-layer`. The scope of #388 is the framework's own doctrine surfaces, not the product-planning pipeline linter.

---

## 4. KB / memory rule references

**Source:** `/Users/kapilahuja/cto/builder/garura/core/components/memory/standards/rules/`

### 4.1 `expectation-generation.md`

Governs how the `draft-play-expectation` skill generates a play's Expectation from its Intent triple. Key rules:

- Input shapes: "Migrated intent — the clean triple (intent, constraints, failure_conditions), no scenarios." and "Legacy intent — still carries a `scenarios:` block (pre-migration). For legacy intent, lift the existing scenarios as the basis for success scenarios."
- Success scenarios: derived from the intent goal and the personas implied by the play's consumers.
- Recovery: one entry per failure condition. The handoff rule (autonomous vs human) is defined here.
- Provenance: `vetted.status: pending` until a human approves at the create-play checkpoint.

**What this confirms:** The rule already handles both migrated (triple) and legacy (with scenarios) intents. After all plays migrate, the legacy path becomes dead code. This file is aligned with the new doctrine.

### 4.2 `feature-expectation-generation.md`

Governs how the `generate-feature-expectation` skill generates a feature's Expectation from its Intent triple and a Context bundle. The play case and the feature case are separate generators with separate rules.

Key difference from the play case: Context is a first-class input. Personas are grounded in the Context bundle (real actors who use the capability at runtime), not derived from the intent alone.

**What this confirms:** The feature Expectation generator already uses the clean triple as input. The `vetted.status: pending` rule and the HITL configuration rule are both present. This file is aligned with the new doctrine.

### 4.3 Other relevant rules in `standards/rules/`

- `resolution.md`: governs R1-R4 LTM resolution protocol. Not directly affected by #388.
- `product.md`: governs the product-planning pipeline. Contains Rule 14 (Abstraction-Layer Boundary). Not directly affected by #388.
- No rule file defines the shape of `reference/intent.yaml` beyond what `author-intent-yaml` and `intent-crafter` already enforce.

---

## 5. Already-migrated plays — confirming the clean-triple pattern is stable

The following plays have `reference/intent.yaml` files with the clean triple (no `scenarios:` block). This was verified by searching all play `reference/intent.yaml` files for the `scenarios:` key — none were found.

All 26 plays with a `reference/intent.yaml` use the clean triple. Representative examples:

- **`craft-ice`** — intent + constraints (C1-C6) + failure_conditions (F1-F6). No scenarios.
- **`fix-it`** — intent + constraints (C1-C19) + failure_conditions (F1-F10). No scenarios.
- **`start-feature`** — intent + constraints (C1-C10) + failure_conditions (F1-F8). No scenarios.

The clean triple is already the universal pattern for compiled plays. The migration concern is not the play `reference/intent.yaml` files (already done) — it is the agent prompts, schema documentation, and KB text that still describes or references the five-element model.

---

## 6. Compartmentation hooks in existing plays

Migrated plays enforce the builder-validator information barrier through explicit JSON contract field selection. Two cited examples:

**`fix-it` C17 (contract-level test isolation):**
> "The code-builder JSON contract MUST include the source-file paths to modify (via design.yaml affected_files) and the regression-test file path in read_only_files. It MUST NOT include the test file content, test assertion text, or eval entries inline. Only the path reference is permitted in the builder contract."

This enforces P4 at the contract level: the builder sees paths but not assertions. The validator (quality-auditor) sees the full regression-test content.

**`fix-it` C8 (checkpoint isolation):**
> "The implementation agent reads design artifacts from STM paths. It MUST NOT receive or read the checkpoint brief content."

The checkpoint brief is the human-facing summary that includes RCA findings. The builder never reads it; it only reads the structured STM artifacts (design.yaml, affected_files). This is the same principle: the builder sees only what shapes its design choices, not the human-facing narrative.

These patterns are already implemented and stable. The Expectation generator for #388 can assert that new plays implementing the three-element doctrine will follow the same contract-level isolation pattern: builder contract includes `intent_path` (for goal + constraints) and `context_bundle_path`; validator contract includes `expectation_path` (for success_scenarios) and `failure_conditions` compiled into evals.

---

## 7. The originating article

**Source:** `~/cto/StormCaller/Content/articles/standalone/an-intent-is-three-things-the-goal.md` (commit `b21b586`)

**Load-bearing claims:**

**The three-element definition:**
Intent is exactly goal, constraints, failure conditions. The article tests the three against a coding example (microservice) and a consumer outcome (shoe purchase) and concludes: "Same anatomy, different domain. The goal is the outcome. The constraints are the qualities. The failure conditions are the binary checks."

**The two-implementations test for the goal:**
"Can two completely different implementations both satisfy this? If yes, you wrote a goal. If only one implementation could possibly satisfy it, you wrote a spec and called it a goal."

**Why scenarios move to Expectations (reward-hacking):**
"When we tried both [keeping success scenarios in intent], the builder over-fit to the scenarios and the validator did not know which side of the line they were on. So I split them... The reason that move is non-negotiable is that LLMs reward-hack. If you hand the builder the same scenarios the validator will check on, the builder games them. Compartmenting is the only structural defense."

**Why Connections leaves the inline slot:**
Connections are real (an intent that connects to two upstream systems is different from one that connects to none). But making Connections a fourth inline slot caused the line between Connections and Context to become unsharp: "For every team that already had a service mesh, the slot bled straight into Context." So Connections stay part of Intent in the model but managed on a different surface. That surface is not designed yet — it is a separate follow-on.

**The decision rule:**
"Would knowing this change how the builder writes code? Yes, it is a constraint; the builder needs it to make the design call. No, it is a failure condition; the validator catches it after."

**The waterfall trap:**
"The temptation is to write every requirement you know about into the intent in the name of completeness. That is how 1,300-line specs are born." When intent grows beyond three slots, the method slides back into being a spec.

---

## 8. Out-of-scope reminder

The Expectation generator for this issue MUST NOT invent failure conditions about:

1. **Migrating `reference/intent.yaml` fixtures.** All 26 play intent files already use the clean triple. Fixture migration is complete and is not in scope.
2. **Unmigrated plays.** There are no unmigrated plays with scenarios in `reference/intent.yaml`. Do not generate scenarios about play rebuilds or `/create-play --rebuild` runs.
3. **Connections design.** The article explicitly defers Connections to a separate issue. This work says nothing about Connections beyond "a one-line pointer that its surface is defined by a future issue." Do not generate failure conditions about Connections placement.
4. **New runtime validator agents.** Scope decision #4 from the discovery: doctrine + soft check only. Agent contracts state the rule; SE evals catch drift. No new validator agent is built in this work.
5. **Global HITL configuration changes.** Scope decision #3: mirror the existing per-play HITL config. When HITL is on, human approves. When HITL is off, system auto-approves and records it. This work does NOT force a global behavior change.

The affected surfaces are: philosophy docs, intent-crafter/intent-resolver agent prompts, `author-intent-yaml` schema, `validate-intent-epics` (only if it references intent schema directly), KB references under `core/components/memory/`, and the abstraction-layer linter (only if it currently scans intent blocks for implementation tokens — confirmed it does not, so no change needed there either).

The primary code change is `intent-resolver.md` — it currently reads `scenarios:` from intent.yaml and maps them to Stage 6 tasks. After the doctrine update, it should read `success_scenarios` from the Expectation artifact instead.
