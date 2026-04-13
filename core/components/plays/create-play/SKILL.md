---
name: create-play
description: Compile a new play from intent — interview for intent, identify skills and agents, select workflow, compile a deterministic SKILL.md. Use when building a new play, re-baking an existing one, or reviewing a play for gaps.
user-invokable: true
---

# create-play

The play compiler. Takes an intent.yaml (existing or newly crafted) and produces a compiled, deterministic play as a single SKILL.md file. Workflow structure, task ordering, eval criteria, and pre-flight checks are baked into the compiled output.

## Maturity Level Guards

**BEFORE doing anything, determine what the user is asking to build.**

| Level | Action | Response |
|-------|--------|----------|
| L1 | REJECT | Plays at this level are structureless — no constraints, no evals, no checkpoints. Define constraints, failure conditions, and scenarios to make it L2. |
| L2 | BUILD | Proceed with compilation. |
| L3 | DEFER | L3 puts workflow structure into intent. The compiler doesn't support it yet. Build as L2 now? |
| L4 | DEFER | L4 is runtime resolution. We're at L2. Build as compiled play instead? |
| L5 | DEFER | L5 is the dark factory. Start with intent.yaml and we'll compile a solid L2. |

## Role

You are the **play compiler** and **architectural gatekeeper**. You own the pipeline. You delegate domain tasks to specialized tools — never execute their work directly.

**Build-time tools:**
- `intent-crafter` agent — interviews user, produces intent.yaml
- `evals-creator` skill — generates step and scenario evals
- `/skill-creator` — builds new skills, modifies existing skills

**Runtime agents (declared by user, audited by compiler):** These are the domain agents the compiled play will use. Audited against `reference/audit-checklist.md` (P1-P10).

**Reference artifacts:**
- `reference/audit-checklist.md` — P1-P10 agent compliance checklist
- `reference/compiled-example.md` — target output format for compiled plays
- `docs/adr/016-agent-json-contract.md` — universal JSON contract schema
- `docs/adr/013-play-maturity-model.md` — L2 design elements and workflow structures

## Compilation Pipeline

### Step 1 — Gate & Identity

Ask the user for the **play name**. Check if `core/components/plays/{play-name}/reference/intent.yaml` and `SKILL.md` already exist.

| Existing Files | Flag | Mode |
|---------------|------|------|
| Neither | — | **New** — build from scratch |
| intent.yaml only | — | **New** — intent exists, build play |
| Both | `--rebake` | **Rebake** — rebuild play from existing intent |
| Both | `--review` | **Review** — diagnose gaps, no modifications |

Create STM directory at `{stm_base}/{issue}/evidence/create-play/{play-name}/`.

#### New mode

Move to Step 2.

#### Rebake mode

Perform the deep read (same as Review mode Step R1 below), then move to Step 2.

#### Review mode

Review is diagnostic only — it reads everything, finds gaps, and reports. It NEVER modifies files. If the user wants to fix gaps, they run `--rebake` afterward.

**Step R1 — Deep Read**

Read the entire play graph:

1. **Play:** Read `SKILL.md` — understand compiled structure, phases, steps, agent contracts, evals, pre-flight checks.
2. **Intent:** Read `reference/intent.yaml` — constraints, failure conditions, scenarios.
3. **Reference files:** Read everything in `reference/` — templates, examples, audit checklists.
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
| **G3 — Scenario Coverage** | Every scenario ID in intent.yaml is covered by at least one scenario eval | Scenario ID not referenced by any SCE-* eval |
| **G4 — Skill Existence** | Every skill referenced in play step contracts exists at `core/components/skills/{name}/SKILL.md` | Skill referenced but file missing |
| **G5 — Agent Existence** | Every agent in the play's agent boundary table exists at `core/components/agents/{name}.md` | Agent declared but definition missing |
| **G6 — Skill-Agent Alignment** | Every skill a play step assigns to an agent is listed in that agent's skill inventory | Play assigns skill X to agent Y, but agent Y doesn't declare skill X |
| **G7 — Contract Schema** | JSON contracts in play steps contain required fields: `intent_path`, `stm_base`, `stm`, `task_id` | Required contract field missing |
| **G8 — Template References** | Skills/plays that reference templates point to files that exist (now bundled with the owning skill/play under its own `templates/` or `reference/` directory) | Template path referenced but file missing |
| **G9 — Intent Hash Drift** | Compiled intent_hash in SKILL.md matches current SHA-256 of intent.yaml | Hash mismatch — intent changed since last compilation |
| **G10 — Required Sections** | Compiled SKILL.md contains all required sections: Frontmatter, Header, Compiled From, Role, Pre-flight, Workflow, Scenario Validation, Pause and Resume, Compilation Metadata | Section missing from compiled play |
| **G11 — Skill LTM Input Coverage** | For every skill a play step invokes, each required/recommended LTM input in the skill's Input section has a corresponding discovery instruction in the play step text (e.g., "agent must glob X and pass as Y") | Skill declares LTM input (e.g., `epic_rules_path`, `domain_taxonomy_paths`) but the play step has no instruction for the agent to discover and pass it |

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
| G10 Required Sections | PASS/GAP | {which sections are missing} |
| G11 Skill LTM Input Coverage | PASS/GAP | {which skill LTM inputs lack discovery instructions in play steps} |

**Summary:** {X}/11 PASS, {Y} GAPs found

{If GAPs > 0:}
Run `/create-play --rebake {play-name}` to fix identified gaps.
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

#### Rebake mode

Invoke `intent-crafter` agent with existing intent and play analysis as context:

```yaml
Task: "Review existing intent.yaml against play analysis. Find gaps in constraints, failure conditions, and scenarios."
Context:
  play_name: "{play-name}"
  existing_intent_path: "core/components/plays/{play-name}/reference/intent.yaml"
  play_analysis_path: "{stm_base}/{issue}/evidence/create-play/{play-name}/play-analysis.md"
  output_path: "core/components/plays/{play-name}/reference/intent.yaml"
  mode: "rebake"
```

The crafter reads the play analysis from STM — the full mapping of agents, skills, contracts, and constraint coverage — and checks the existing intent against it. It identifies gaps: missing constraints, uncovered failure modes, scenarios that don't match real usage.

#### Gate

intent.yaml must exist and conform to schema:
- `intent` field present and implementation-agnostic
- At least 1 constraint with id and rule
- At least 1 failure condition with id and condition
- At least 1 scenario with id, persona, given, then

Present intent.yaml to user:

```markdown
## Intent Definition

{intent.yaml content}

---

Type **Tether** to approve or **Vanish** to revise.
```

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

**Gate:** ALL agents pass ALL 11 principles. No exceptions.

### Step 5 — Workflow Selection

Reference: `docs/adr/013-play-maturity-model.md` — L2 workflow structures.

#### New mode

Present the three structures:

```
Structure A — Full checkpoint flow:
  Pre-flight → Preparation → Checkpoint (skippable) → Execution → Evidence
  Best for: multiple agents, confidence-gated review

Structure B — Fast execution flow:
  Pre-flight → Execution → Approval
  Best for: simpler work, single-agent, low-risk

Structure C — Higher-order L2 (chained plays):
  Pre-flight → Play-1 → STM handoff → Play-2 → ... → Evidence
  Best for: composing existing plays
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

The compiler MUST NOT hand-author any evals. All evals come from evals-creator's output file. The compiler copies eval language verbatim when embedding into the compiled SKILL.md — no reformulation, no added thresholds.

#### 6c. Compile SKILL.md

Read `reference/compiled-example.md` for the target output format. Read `docs/adr/016-agent-json-contract.md` for contract schema.

Compute intent hash:
```bash
intent_hash=$(shasum -a 256 core/components/plays/{play-name}/reference/intent.yaml | awk '{print $1}')
```

Write `core/components/plays/{play-name}/SKILL.md` with ALL required sections:

| Section | Content |
|---------|---------|
| Frontmatter | name, description, user-invokable (standard fields only) |
| Header | One-paragraph operational description |
| Compiled From | Notice: compiled artifact, edit intent.yaml and re-run /create-play |
| Role + Agent Boundaries | Orchestrator role, agent table with domains and phases |
| Pre-flight | Baked checks with constraint IDs, bash logic, resume check |
| Workflow | Sequential steps organized by phase, each with: owner, depends-on, JSON contract (per ADR 016), skill invoked, step eval criteria |
| Scenario Validation | E2E scenario evals from intent.yaml |
| Evidence & Close | Write evidence, self-commit (ADR 012), non-blocking |
| Pause and Resume | Status file format, resume logic |
| Compilation Metadata | intent_hash, compiled_by, compiled_at, maturity, workflow_structure, agent count, eval counts |

**Eval embedding rules:**
- Step evals from evals.yaml are embedded immediately after the step they validate
- The compiler reads `skill` field on each eval to determine placement
- Eval text is copied verbatim from evals.yaml — no reformulation, no added thresholds
- Each eval shows its source ID: `**SE-X (F-n/C-n):** {check}`
- Scenario evals are embedded in the Scenario Validation section: `**SCE-X (S-n — {persona}):** {check}`

**Compilation rules (from ADR 013 L2):**
- Workflow steps are sequential with named phases — not abstract stage numbers
- Each agent dispatch includes the full JSON contract template with `stm` paths (per ADR 016)
- Step evals appear immediately after the step they validate
- Critical rule for Structure A: execution phase agents read STM data, NEVER the checkpoint brief
- No runtime DAG — task ordering is baked into SKILL.md
- No runtime intent resolution — everything the play needs is compiled in
- Intent hash in Compilation Metadata section (end of file) for drift detection — NOT in frontmatter
- **Checkpoint review surface:** Human checkpoints present the YAML artifact file paths as the review surface by default. Domain agents produce artifacts → play presents the artifact paths for human review (Tether/Vanish/Orbit). Users may run `/briefs` separately on demand to generate HTML renderings. Do NOT insert a `doc-builder` step before checkpoints unless intent.yaml explicitly mandates brief generation as a constraint. Briefs are opt-in, not mandatory.
- **Agent budget — domain vs utility:** The ≤5 agent call limit applies to domain agents only. Utility agents (`repo-orchestrator` for commits/evidence, and `doc-builder` when a play explicitly opts into brief generation) are exempt. Compilation Metadata must list domain and utility agents separately.

**Pause and Resume (baked into compiled play):**
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
- Every scenario has >= 1 SCE-n from evals-creator output
- Every `pre-flight` constraint appears in the pre-flight table of the compiled SKILL.md
- Every `structural` constraint has a verifiable structural element (agent boundary table, compilation rule, budget statement)
- All required sections present in the compiled SKILL.md
- Agent contracts match ADR 016 schema
- Every skill's required LTM input fields have a corresponding agent discovery instruction in the play step that invokes it (G11)

If ANY intent item has zero coverage → compilation fails. The compiler must either re-invoke evals-creator with additional context, reclassify the constraint, or halt and report the gap.

Write coverage matrix to `{stm_base}/{issue}/evidence/create-play/{play-name}/coverage-matrix.md`.

### Step 7 — Summary

```markdown
## Play Compiled: {play-name}

**Maturity:** L2 | **Workflow:** Structure {A|B|C} | **Intent hash:** {sha256}

**Files:**
- `core/components/plays/{play-name}/SKILL.md` (compiled)
- `core/components/plays/{play-name}/reference/intent.yaml` (source)
- {any new skills created}
- {any agents created or upgraded}

**Agents:** {list — all PASS} | **Evals:** {step count} step, {scenario count} scenario

Run `/sync-claude` to deploy.
```

## Constraints

- NEVER build structureless plays — reject with explanation
- NEVER produce a play with runtime DAG or runtime intent resolution — L2 is compiled
- NEVER ship intent-resolver as a runtime dependency — it does not exist in L2
- NEVER skip intent definition, eval generation, or agent audit
- NEVER assemble a play missing any required section from Step 6b
- NEVER do agent or skill domain work directly — delegate to intent-crafter, /skill-creator, evals-creator
- ALWAYS compute intent_hash and include compiled metadata in Compilation Metadata section at end of file — NOT in frontmatter
- ALWAYS present intent for user approval before proceeding
- ALWAYS audit every agent against all 11 principles
- ALWAYS re-audit after upgrading an agent
- ALWAYS write analysis artifacts to STM
- ALWAYS reference ADR 013 for L2 design elements
- For L3-L5 requests — acknowledge and defer, do not reject
- NEVER modify any file in review mode — review is read-only diagnostic
- ALWAYS write the review report to STM even if all checks pass
