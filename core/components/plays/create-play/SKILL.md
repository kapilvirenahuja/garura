---
name: create-play
description: Compile a new play from intent — interview for intent, identify skills and agents, select workflow, compile a deterministic SKILL.md. Use when building a new play, rebuilding an existing one, or reviewing a play for gaps.
user-invocable: true
---

# create-play

The play compiler. Takes an intent.yaml (existing or newly crafted) and produces a compiled, deterministic play as a single SKILL.md file. Workflow structure, task ordering, eval criteria, and pre-flight checks are built into the compiled output.

## Structural Gate

**BEFORE doing anything, determine if the requested play has enough structure to compile.**

A play is compilable when its intent defines — at minimum — constraints and failure conditions, AND it has an **Expectation** (`reference/expectation.yaml`: success_scenarios + recovery). Under ICE the intent is the clean triple (intent, constraints, failure conditions); success scenarios and recovery live in expectation.yaml. **Backward compatibility:** a legacy play whose intent still carries a `scenarios:` block and has no expectation.yaml still compiles — its scenarios are used directly until it is migrated. A play with no failure conditions and no scenarios anywhere is structureless and rejected with a prompt to define them first. Ideas that describe runtime DAGs, dynamic intent resolution, or self-assembling workflows are deferred — the compiler produces deterministic, compiled plays only. In every case, the answer is the same: go back to intent.yaml, pin down what the play guarantees, and re-run this skill.

## Role

You are the **play compiler** and **architectural gatekeeper**. You own the pipeline. You delegate domain tasks to specialized tools — never execute their work directly.

**Build-time tools:**
- `intent-crafter` agent — interviews user, produces intent.yaml (the clean triple)
- `expectation-crafter` agent — generates expectation.yaml (success_scenarios + recovery) from the intent, for human validation
- `evals-creator` skill — generates step and scenario evals
- `/skill-creator` — builds new skills, modifies existing skills

**Runtime agents (declared by user, audited by compiler):** These are the domain agents the compiled play will use. Audited against `reference/audit-checklist.md` (P1-P11).

**Reference artifacts:**
- `reference/audit-checklist.md` — P1-P11 agent compliance checklist
- `reference/compiled-example.md` — target output format for compiled plays
- `docs/adr/016-agent-json-contract.md` — universal JSON contract schema
- `docs/adr/013-play-maturity-model.md` — design elements and workflow structures

## Compilation Pipeline

### Step 1 — Gate & Identity

Ask the user for the **play name**. Check if `core/components/plays/{play-name}/reference/intent.yaml` and `SKILL.md` already exist.

| Existing Files | Flag | Mode |
|---------------|------|------|
| Neither | — | **New** — build from scratch |
| intent.yaml only | — | **New** — intent exists, build play |
| Both | `--build` | **Rebake** — rebuild play from existing intent |
| Both | `--review` | **Review** — diagnose gaps, no modifications |

Create STM directory at `{stm_base}/{issue}/evidence/create-play/{play-name}/`.

#### New mode

Move to Step 2.

#### Rebake mode

Perform the deep read (same as Review mode Step R1 below), then move to Step 2.

#### Review mode

Review is diagnostic only — it reads everything, finds gaps, and reports. It NEVER modifies files. If the user wants to fix gaps, they run `--build` afterward.

**Step R1 — Deep Read**

Read the entire play graph:

1. **Play:** Read `SKILL.md` — understand compiled structure, phases, steps, agent contracts, evals, pre-flight checks.
2. **Intent:** Read `reference/intent.yaml` — constraints, failure conditions (and, for un-migrated legacy plays, scenarios).
3. **Expectation:** Read `reference/expectation.yaml` if present — `success_scenarios`, `recovery`. Migrated plays have this file; legacy plays do not yet (their scenarios still live in intent.yaml).
4. **Reference files:** Read everything in `reference/` — templates, examples, audit checklists.
4. **Agents:** For every agent the play declares, read its definition from `core/components/agents/{name}.md`.
5. **Skills:** For every skill each agent invokes, read its contract from `core/components/skills/{name}/SKILL.md`.
6. **Workflow:** Identify the workflow structure (A/B/C) the play uses.

Build a semantic map: play → phases → steps → agent dispatches → skill invocations → intent constraint mappings → eval coverage.

**Step R2 — Gap Analysis**

Run these checks against the semantic map. Each check produces a PASS or GAP result with details.

| Check | What it validates | GAP condition |
|-------|-------------------|---------------|
| **G1 — Constraint Coverage** | Every constraint ID is classified (pre-flight, artifact-verifiable, structural) and covered by its category-appropriate mechanism: pre-flight constraints in pre-flight table, artifact-verifiable constraints in step evals, structural constraints in play structure | Constraint ID not covered by its category-appropriate mechanism |
| **G2 — Failure Condition Coverage** | Every failure condition ID in intent.yaml is covered by at least one step eval | FC ID not referenced by any SE-* eval |
| **G3 — Scenario Coverage** | Every success_scenario ID in expectation.yaml (or, for legacy plays, every scenario ID in intent.yaml) is covered by at least one scenario eval | Scenario ID not referenced by any SCE-* eval |
| **G3b — Recovery Coverage** | (Migrated plays) Every failure condition in intent.yaml has exactly one recovery entry in expectation.yaml, and every recovery entry references a real failure condition | A failure condition has no recovery entry, or a recovery entry's `for_failure` resolves to nothing |
| **G4 — Skill Existence** | Every skill referenced in play step contracts exists at `core/components/skills/{name}/SKILL.md` | Skill referenced but file missing |
| **G5 — Agent Existence** | Every agent in the play's agent boundary table exists at `core/components/agents/{name}.md` | Agent declared but definition missing |
| **G6 — Skill-Agent Alignment** | Every skill a play step assigns to an agent is listed in that agent's skill inventory | Play assigns skill X to agent Y, but agent Y doesn't declare skill X |
| **G7 — Contract Schema** | JSON contracts in play steps contain required fields: `intent_path`, `stm_base`, `stm`, `task_id` | Required contract field missing |
| **G8 — Template References** | Skills/plays that reference templates point to files that exist (now bundled with the owning skill/play under its own `templates/` or `reference/` directory) | Template path referenced but file missing |
| **G9 — Intent Hash Drift** | Compiled intent_hash in SKILL.md matches current SHA-256 of intent.yaml | Hash mismatch — intent changed since last compilation |
| **G10 — Required Sections** | Compiled SKILL.md contains all required sections: Frontmatter, Header, Compiled From, Role, Pre-flight, Task DAG, Workflow, Scenario Validation, Recovery (migrated plays only), Evidence & Close, Pause and Resume, Compilation Metadata | Section missing from compiled play |
| **G11 — Skill LTM Input Coverage** | For every skill a play step invokes, each required/recommended LTM input in the skill's Input section has a corresponding discovery instruction in the play step text (e.g., "agent must glob X and pass as Y") | Skill declares LTM input (e.g., `epic_rules_path`, `domain_taxonomy_paths`) but the play step has no instruction for the agent to discover and pass it |
| **G12 — Standard Play Close** | The Evidence & Close section contains the canonical Standard Play Close block — the opener and closer anchor comment lines defined verbatim in `standards/rules/play-close.md` (that file is the single source of the exact strings; do NOT re-quote them here), exactly one pair, opener before closer, with C1 (evidence-file.md, `evidence.record`-gated) and C2 (delivery-report.md, always) | Anchor pair missing/altered/duplicated, or close emitted as hand-authored prose instead of the standard block |

**Step R3 — Gap Report**

Write report to STM at `{stm_base}/{issue}/evidence/create-play/{play-name}/review-report.md`.

Present to user:

```markdown
## Play Review: {play-name}

| Check | Status | Details |
|-------|--------|---------|
| G1 Constraint Coverage | PASS/GAP | {which constraints are uncovered, with category classification} |
| G2 FC Coverage | PASS/GAP | {which FCs are uncovered} |
| G3 Scenario Coverage | PASS/GAP | {which scenarios are uncovered} |
| G4 Skill Existence | PASS/GAP | {which skills are missing} |
| G5 Agent Existence | PASS/GAP | {which agents are missing} |
| G6 Skill-Agent Alignment | PASS/GAP | {which skill-agent mappings are broken} |
| G7 Contract Schema | PASS/GAP | {which contracts have missing fields} |
| G8 Template References | PASS/GAP | {which templates are missing} |
| G9 Intent Hash Drift | PASS/GAP | {hash comparison} |
| G10 Required Sections | PASS/GAP | {which sections are missing — Task DAG is now required} |
| G11 Skill LTM Input Coverage | PASS/GAP | {which skill LTM inputs lack discovery instructions in play steps} |

**Summary:** {X}/11 PASS, {Y} GAPs found

{If GAPs > 0:}
Run `/create-play --build {play-name}` to fix identified gaps.
```

**Review mode terminates here.** No Steps 2-7. No modifications to any files.

### Step 2 — Intent

#### New mode

Invoke `intent-crafter` agent:

```yaml
Task: "Interview user and produce intent.yaml for the {play-name} play"
Context:
  play_name: "{play-name}"
  play_purpose: "{purpose — ask user}"
  output_path: "core/components/plays/{play-name}/reference/intent.yaml"
```

The crafter runs a detailed interview: goal, constraints, failure conditions, acceptance scenarios.

#### Rebuild mode

Invoke `intent-crafter` agent with existing intent and play analysis as context:

```yaml
Task: "Review existing intent.yaml against play analysis. Find gaps in constraints, failure conditions, and scenarios."
Context:
  play_name: "{play-name}"
  existing_intent_path: "core/components/plays/{play-name}/reference/intent.yaml"
  play_analysis_path: "{stm_base}/{issue}/evidence/create-play/{play-name}/play-analysis.md"
  output_path: "core/components/plays/{play-name}/reference/intent.yaml"
  mode: "rebuild"
```

The crafter reads the play analysis from STM — the full mapping of agents, skills, contracts, and constraint coverage — and checks the existing intent against it. It identifies gaps: missing constraints, uncovered failure modes, scenarios that don't match real usage.

#### Gate

intent.yaml must exist and conform to the triple schema:
- `intent` field present and implementation-agnostic
- At least 1 constraint with id and rule
- At least 1 failure condition with id and condition

Expectation gate — `reference/expectation.yaml` (migrated play) must contain:
- At least 1 `success_scenario` with id, persona, given, then, measure
- Exactly one `recovery` entry per failure condition (id, for_failure, trigger, direction, handoff)

**Backward compatibility:** if expectation.yaml is absent AND intent still carries a `scenarios:` block, accept the legacy scenarios in place of expectation — the play is not yet migrated. A play with neither expectation nor legacy scenarios is rejected.

Present intent.yaml to user:

```markdown
## Intent Definition

{intent.yaml content}

---

Type **Tether** to approve or **Vanish** to revise.
```

### Step 2.5 — Expectation (generate + validate)

After the intent triple is approved, generate the play's **Expectation**
(`success_scenarios` + `recovery`). Expectation is GENERATED from the intent, never
hand-authored — hand-authoring is the SDD pattern IDD rejects.

Invoke the `expectation-crafter` agent:

```json
{
  "intent_path": "core/components/plays/{play-name}/reference/intent.yaml",
  "stm_base": "{stm_base}",
  "stm": {
    "input": { "rules_path": "core/components/memory/standards/rules/expectation-generation.md" },
    "output": { "expectation": "core/components/plays/{play-name}/reference/expectation.yaml" }
  },
  "task_id": "craft-expectation"
}
```

The agent invokes `draft-play-expectation`, which derives the success scenarios and
exactly one recovery entry per failure condition (routing each `handoff` autonomous
vs human per the rules) and writes `expectation.yaml` with `vetted.status: pending`.

**Migration ordering (generate-before-strip):** when building a LEGACY play under ICE
for the first time, run this step BEFORE removing the `scenarios:` block from
intent.yaml, so the generator lifts the authored scenarios (and adds each `measure`).
After the expectation is approved, strip the scenarios from intent.yaml — the
expectation now owns them. Skipping this order makes the generator reinvent success
scenarios from the goal and lose the authored ones.

**Human validation checkpoint:** present the generated expectation:

```markdown
## Generated Expectation — {play-name}

{expectation.yaml content}

Success scenarios: {n} | Recovery entries: {n} (one per failure condition)

---

Type **Tether** to approve (sets `vetted.status: approved`) or **Vanish** to revise.
```

Nothing downstream consumes a `pending` expectation. On Tether, set
`vetted.status: approved`. On Vanish, the crafter regenerates or you adjust the
intent and re-run.

**Gate:** `expectation.yaml` exists, `vetted.status: approved`, and there is exactly
one recovery entry per failure condition (G3b).

### Step 3 — Skill Inventory

Identify what skills the play needs based on the approved intent.

1. Analyze the intent — what domain work needs to happen? What artifacts need to be produced?
2. List available skills from `core/components/skills/`.
3. Map needed capabilities to existing skills. Identify gaps.
4. For each gap: does an existing skill need modification, or is a new skill needed?

For new or modified skills, invoke `/skill-creator`.

Write skill manifest to STM at `{stm_base}/{issue}/evidence/create-play/{play-name}/skill-manifest.yaml`:

```yaml
play: "{play-name}"
skills:
  - name: "{skill-name}"
    path: "core/components/skills/{skill-name}/SKILL.md"
    status: existing | modified | new
```

**Gate:** All needed skills exist with valid SKILL.md contracts.

### Step 4 — Agent Declaration & Audit

Identify which domain agents the play needs. This follows from skills — agents are the context engineers that invoke skills.

1. From the skill manifest, determine which agents are needed to orchestrate those skills.
2. Check if each agent exists in `core/components/agents/`.
3. For every agent (existing or new), audit against `reference/audit-checklist.md` (P1-P11).

**Audit report per agent:**

```markdown
## Agent Audit: {agent-name}

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS/FAIL | {finding} |
| P2 STM Path Handoff | PASS/FAIL | {finding} |
| P3 Intent Awareness | PASS/FAIL | {finding} |
| P4 Structured Failure | PASS/FAIL | {finding} |
| P5 No Direct User Interaction | PASS/FAIL | {finding} |
| P6 Output Contract Discipline | PASS/FAIL | {finding} |
| P7 Skill Delegation | PASS/FAIL/N-A | {finding} |
| P8 Recovery and Escalation | PASS/FAIL | {finding} |
| P9 Domain Boundaries | PASS/FAIL | {finding} |
| P10 Task Graph Participation | PASS/FAIL | {finding} |
| P11 Context Sufficiency | PASS/FAIL/EXEMPT | {finding} |
```

Write audit to `{stm_base}/{issue}/evidence/create-play/{play-name}/agent-audit-{agent-name}.md`.

For agents with failures, present options:
1. **Upgrade** — modify existing agent to pass. Show proposed changes, get Tether/Vanish, re-audit.
2. **Create new** — build a new compliant agent.
3. **Skip** — proceed without (user must handle that domain differently).

For new agents: interview user for name, domain, skills it needs. Build definition at `core/components/agents/{name}.md` following all 11 principles. Audit to confirm.

**Short-circuit check (pre-declaration):** Before declaring an agent, ask: "Is this agent's sole output a value derivable deterministically from context — branch name, file path, config key, or another environment signal?" If yes, the play should short-circuit rather than spawn the agent. Write a synthetic output artifact inline at the orchestrator level. Only declare the agent if the output genuinely requires LLM reasoning or external system calls that cannot be avoided.

**Gate:** ALL agents pass ALL 11 principles. No exceptions.

### Step 5 — Workflow Selection

Reference: `docs/adr/013-play-maturity-model.md` — workflow structures. Canonical workflow phase definitions live in `reference/workflows/` alongside this skill.

#### New mode

Present the three structures:

```
Structure A — Full checkpoint flow:
  Pre-flight → Preparation → Checkpoint (skippable) → Execution → Evidence
  Best for: multiple agents, confidence-gated review
  Canonical phases: reference/workflows/readiness-brief-generation.yaml

Structure B — Fast execution flow:
  Pre-flight → Execution → Approval → Evidence
  Best for: simpler work, single-agent, low-risk
  Canonical phases: reference/workflows/direct-generation.yaml

Structure C — Higher-order flow (chained plays):
  Pre-flight → Play-1 → STM handoff → Play-2 → ... → Evidence
  Best for: composing existing plays
  (No dedicated phase file yet — derived from the chained plays' own structures)

Structure readiness-only — Analysis-only flow:
  Pre-flight → Preparation → Scenario Validation → Evidence
  Best for: feasibility checks, validation, audits (no generation step)
  Canonical phases: reference/workflows/readiness-only.yaml
```

User selects.

#### Rebake mode

Read current workflow structure from the play. Assess:
- Did intent changes (new constraints, new agents) affect which structure fits?
- Does the current structure still match the play's complexity?

Present assessment with recommendation. User confirms or switches.

#### Pre-flight derivation

Analyze intent constraints to derive pre-flight checks. Each constraint that represents an environmental precondition becomes a pre-flight check with an action-on-failure (hard halt, graceful exit, or hard block).

### Step 6 — Compile & Verify

This is the compilation step. All inputs are ready: intent, skills, agents (all passing), workflow structure, pre-flight checks.

#### 6a. Classify Constraints

Before invoking evals-creator, classify every constraint in intent.yaml into exactly one category:

| Category | Definition | Enforcement Mechanism |
|----------|-----------|----------------------|
| `pre-flight` | Environmental precondition checkable before domain work | Pre-flight check in compiled play |
| `artifact-verifiable` | Observable property of a skill's output artifact | Eval (SE-n) generated by evals-creator |
| `structural` | Process/architectural rule about the play itself | Play structure (agent boundary table, compilation rules) |

Classification heuristics:
- Constraints mentioning "must not run when", "must be provided", "must exist", "is required" → likely `pre-flight`
- Constraints mentioning artifact content, terminology, format, specific fields, output properties → likely `artifact-verifiable`
- Constraints mentioning "delegated to agent", "maximum N dispatches", "never directly", "budget" → likely `structural`

Produce `constraint_classifications` list — one entry per constraint with `id` and `category`.

#### 6b. Generate Evals

Invoke `evals-creator` skill with all skill contracts AND the constraint classifications:

```yaml
Input:
  intent_path: "core/components/plays/{play-name}/reference/intent.yaml"
  expectation_path: "core/components/plays/{play-name}/reference/expectation.yaml"   # migrated plays; omit for legacy
  skill_contracts:
    - skill_name: "{skill-1}"
      contract_path: "core/components/skills/{skill-1}/SKILL.md"
    - skill_name: "{skill-2}"
      contract_path: "core/components/skills/{skill-2}/SKILL.md"
  constraint_classifications:
    - id: "C1"
      category: "pre-flight"
    - id: "C7"
      category: "artifact-verifiable"
    - id: "C4"
      category: "structural"
  output_path: "{stm_base}/{issue}/evidence/create-play/{play-name}/evals.yaml"
```

The compiler MUST NOT hand-author any evals. All evals come from evals-creator's output file. The compiler copies eval language verbatim when embedding into the compiled SKILL.md — no reformulation, no added thresholds. For migrated plays, evals-creator sources scenario evals (SCE-*) from `expectation.yaml` `success_scenarios` (and their `measure`); for legacy plays it falls back to intent.yaml scenarios. Step evals (SE-*) still derive from constraints + failure conditions either way.

#### 6c. Compile SKILL.md

Read `reference/compiled-example.md` for the target output format. Read `docs/adr/016-agent-json-contract.md` for contract schema.

Compute intent hash (and expectation hash for migrated plays — drift in EITHER requires rebuild):
```bash
intent_hash=$(shasum -a 256 core/components/plays/{play-name}/reference/intent.yaml | awk '{print $1}')
expectation_hash=$(test -f core/components/plays/{play-name}/reference/expectation.yaml && shasum -a 256 core/components/plays/{play-name}/reference/expectation.yaml | awk '{print $1}')
```

Write `core/components/plays/{play-name}/SKILL.md` with ALL required sections:

| Section | Content |
|---------|---------|
| Frontmatter | name, description, user-invokable (standard fields only) |
| Header | One-paragraph operational description |
| Compiled From | Notice: compiled artifact, edit intent.yaml and re-run /create-play |
| Role + Agent Boundaries | Orchestrator role, agent table with domains and phases |
| Pre-flight | Baked checks with constraint IDs, bash logic, resume check |
| Task DAG | TaskCreate calls for ALL steps with blockedBy, ownership rule, TaskUpdate protocol |
| Workflow | Sequential steps organized by phase, each with: owner, depends-on, JSON contract (per ADR 016), skill invoked, step eval criteria, TaskUpdate calls |
| Scenario Validation | E2E scenario evals from expectation.yaml `success_scenarios` (legacy plays: intent.yaml scenarios) |
| Recovery (migrated plays) | Recovery handoff entries from expectation.yaml `recovery` — per failure condition: the symptom trigger, the directional fix, and the `autonomous`\|`human` handoff routing |
| Evidence & Close | The canonical **Standard Play Close** block emitted verbatim per `standards/rules/play-close.md` (C1 evidence-file.md gated by `evidence.record` + C2 delivery-report.md always, the exact lint-anchor comment pair, `started_at` precedence, `parent_run_id` sub-play rule). Substitute only `{play-name}` and the project/product scope line. NEVER hand-author close prose. A play with bespoke evidence content (e.g. ship's C9 sweep) keeps that content as the C1 slot fill, wrapped by the standard block. |
| Pause and Resume | Status file format, resume logic |
| Compilation Metadata | intent_hash, expectation_hash (migrated plays), compiled_by, compiled_at, maturity, workflow_structure, agent count, eval counts (incl. recovery entry count) |

**Eval embedding rules:**
- Step evals from evals.yaml are embedded immediately after the step they validate
- The compiler reads `skill` field on each eval to determine placement
- Eval text is copied verbatim from evals.yaml — no reformulation, no added thresholds
- Each eval shows its source ID: `**SE-X (F-n/C-n):** {check}`
- Scenario evals are embedded in the Scenario Validation section: `**SCE-X (S-n — {persona}):** {check}` — sourced from expectation.yaml `success_scenarios` (legacy: intent.yaml scenarios)
- (Migrated plays) Recovery entries are embedded in a `## Recovery` section — per failure condition: the symptom trigger, the directional handoff plan, and the `autonomous`/`human` routing, copied verbatim from expectation.yaml `recovery`

**Compilation rules (from ADR 013):**
- Workflow steps are sequential with named phases — not abstract stage numbers
- Each agent dispatch includes the full JSON contract template with `stm` paths (per ADR 016)
- Step evals appear immediately after the step they validate
- Critical rule for Structure A: execution phase agents read STM data, NEVER the checkpoint brief
- No runtime DAG — task ordering is built into SKILL.md
- No runtime intent resolution — everything the play needs is compiled in
- Intent hash in Compilation Metadata section (end of file) for drift detection — NOT in frontmatter
- **Checkpoint review surface:** Human checkpoints present the YAML artifact file paths as the review surface by default. Domain agents produce artifacts → play presents the artifact paths for human review (Tether/Vanish/Orbit). Do NOT insert a `doc-builder` step before checkpoints unless intent.yaml explicitly mandates brief generation as a constraint. Briefs are opt-in, not mandatory.
- **Agent budget — domain vs utility:** The ≤5 agent call limit applies to domain agents only. Utility agents (`repo-orchestrator` for commits/evidence, and `doc-builder` when a play explicitly opts into brief generation) are exempt. Compilation Metadata must list domain and utility agents separately.
- **Standard Play Close (mandatory, non-negotiable):** The Evidence & Close section MUST be the canonical Standard Play Close block from `standards/rules/play-close.md`, emitted verbatim with only `{play-name}` and the project/product scope line substituted. This converges hand edits and rebuilds — a play whose close was direct-edited to the block is reproduced identically by the next `/create-play --build`, never clobbered. It is enforced by gate G12. Bespoke per-play evidence content is preserved as the C1 slot fill inside the block, not as a replacement for it.

**Task DAG rules (compiled into every play):**
- The compiled play MUST include a `## Task DAG` section immediately after Pre-flight
- The Task DAG section contains a `TaskCreate` call for EVERY compiled step, with `blockedBy` encoding the dependency order (not the ID sequence)
- Each task title starts with a sequential ID matching the compiled step: `[T1] Step name`, `[T2] Step name`, etc.
- Every compiled step in the Workflow section MUST include a `Task:` line: `TaskUpdate [Tn] → in_progress` before dispatch, `TaskUpdate [Tn] → completed` after eval passes
- The play is the SOLE owner of the task DAG — agents MUST NOT call `TaskUpdate` on play-level tasks; they MAY call `TaskCreate` for discovered sub-work with `addBlockedBy` pointing to the current step
- On resume: call `TaskList` to see state; skip completed tasks; reset `in_progress` to `pending`

**Pause and Resume (built into compiled play):**
1. Issue detection in pre-flight (extract from branch name or user input)
2. Status file at `{stm_base}/{issue}/status/{play-name}.json`
3. Write status after every step completion
4. On resume: skip completed steps, reset `in_progress` to pending
5. No re-planning — the compiled steps are the execution state

#### 6d. Verify Coverage

Before finalizing, produce and validate a coverage matrix:

| Intent Item | Type | Category | Covered By | Location |
|-------------|------|----------|------------|----------|
| C1 | constraint | pre-flight | Pre-flight check | Pre-flight table |
| C4 | constraint | structural | Play structure | Agent boundary table |
| C7 | constraint | artifact-verifiable | SE-1 | Step 2 Eval |
| F1 | failure_condition | — | SE-1, SE-2 | Step 2 Eval |
| S1 | scenario | — | SCE-1 | Scenario Validation |

Verification rules:
- Every `artifact-verifiable` constraint has >= 1 SE-n from evals-creator output
- Every failure condition has >= 1 SE-n from evals-creator output
- Every success_scenario (migrated) or legacy scenario has >= 1 SCE-n from evals-creator output
- (Migrated plays) Every failure condition has exactly one recovery entry, embedded in the Recovery section
- Every `pre-flight` constraint appears in the pre-flight table of the compiled SKILL.md
- Every `structural` constraint has a verifiable structural element (agent boundary table, compilation rule, budget statement)
- All required sections present in the compiled SKILL.md
- Agent contracts match ADR 016 schema
- Every skill's required LTM input fields have a corresponding agent discovery instruction in the play step that invokes it (G11)

If ANY intent item has zero coverage → compilation fails. The compiler must either re-invoke evals-creator with additional context, reclassify the constraint, or halt and report the gap.

Write coverage matrix to `{stm_base}/{issue}/evidence/create-play/{play-name}/coverage-matrix.md`.

### Step 7 — Standard Play Close

create-play closes with the canonical Standard Play Close. Its compilation
summary IS the delivery report. (See `standards/rules/play-close.md`.)

```bash
# --- Standard Play Close (canonical; see standards/rules/play-close.md) ---
# create-play is PROJECT-scoped:
#   evidence_base="{stm_base}/{issue}/evidence/create-play/{play-name}/"  ;  slug="{play-name}"
# Resolve ltm_project_target from .garura/core/config.yaml if not already resolved.
```

**C2 — Delivery report (ALWAYS; skip only when `parent_run_id` present).**
Fill `delivery-report.md` and output to the user:

```markdown
## Play Compiled: {play-name}

**Workflow:** Structure {A|B|C} | **Intent hash:** {sha256}

**Pipeline Steps** (create-play Step 1–7 DAG): Gate &amp; Identity, Intent,
Skill Inventory, Agent Declaration &amp; Audit, Workflow Selection, Compile
&amp; Verify — each PASS/SKIP.

**Artifacts Produced:**
- `core/components/plays/{play-name}/SKILL.md` (compiled)
- `core/components/plays/{play-name}/reference/intent.yaml` (source)
- {any new skills created}
- {any agents created or upgraded}

**Agents:** {list — all PASS} | **Evals:** {step count} step, {scenario count} scenario

**Next Steps:** Run `/sud:install` to deploy.
```

**C1 — Evidence file (gated by `evidence.record`).** When true (or absent),
write the compile evidence (coverage matrix, gate G1–G12 results, agent audit
outcomes, intent hash) to
`{stm_base}/{issue}/evidence/create-play/{play-name}/{YYYYMMDD-HHMMSS}.md`.
When false, skip the write and note `evidence skipped (record=false)` in the
C2 Next Steps line. C2 is emitted regardless.

```bash
# --- end Standard Play Close ---
```

## Constraints

- NEVER build structureless plays — reject with explanation
- NEVER produce a play with runtime DAG or runtime intent resolution — compiled plays are deterministic
- NEVER ship intent-resolver as a runtime dependency — it does not exist in compiled plays
- NEVER skip intent definition, eval generation, or agent audit
- NEVER assemble a play missing any required section from Step 6b
- NEVER do agent or skill domain work directly — delegate to intent-crafter, /skill-creator, evals-creator
- ALWAYS compute intent_hash and include compiled metadata in Compilation Metadata section at end of file — NOT in frontmatter
- ALWAYS present intent for user approval before proceeding
- ALWAYS audit every agent against all 11 principles
- ALWAYS re-audit after upgrading an agent
- ALWAYS write analysis artifacts to STM
- ALWAYS reference ADR 013 for design elements
- For requests describing runtime DAGs, dynamic intent resolution, or self-assembling workflows — acknowledge and defer, do not reject
- NEVER modify any file in review mode — review is read-only diagnostic
- ALWAYS write the review report to STM even if all checks pass

**Direct-edit deviation note (play-close standardization, #371):** create-play has no `intent.yaml` (it is the compiler bootstrap), so all changes to it are direct edits by definition. Step 7 was restructured into the canonical Standard Play Close block (its compilation summary is the C2 delivery report; C1 writes compile evidence). The compiler-side convergence (the Evidence & Close required-section spec, gate G12, the compilation rule, and `reference/compiled-example.md`) was added in the same change so every play create-play compiles now reproduces the standard block. Non-intent format change.

**Direct-edit deviation note (user-facing-voice compiler-strip, #386):** The original #385 work added a mandatory `## User-Facing Voice` section, the G13 gate, a compilation rule, and a required-sections row so every compiled play carried the canonical block. The follow-on experiment (#386) to extend that scope to artifact templates was dropped, and the block-paste mechanism was reverted along with it: the section, the gate, the compilation rule, and the row in the required-sections table have been removed from this compiler, and the block has been stripped from every compiled play. The rule file at `standards/rules/user-facing-voice.md` is retained as guidance (the principle stays — the play-block enforcement does not). The rule's "Enforced" claim and "The block" paste mechanism are now stale relative to this compiler; future cleanup of that file is a separate, optional follow-up. Non-intent format change.
