---
name: create-recipe
description: Compile a new L2 recipe from intent — interview for intent, identify skills and agents, select workflow, compile a deterministic SKILL.md. Use when building a new recipe, re-baking an existing one, or reviewing a recipe for gaps.
user-invokable: true
---

# create-recipe

The recipe compiler. Takes an intent.yaml (existing or newly crafted) and produces a compiled, deterministic L2 recipe as a single SKILL.md file. Workflow structure, task ordering, eval criteria, and pre-flight checks are baked into the compiled output.

## Maturity Level Guards

**BEFORE doing anything, determine what the user is asking to build.**

| Level | Action | Response |
|-------|--------|----------|
| L1 | REJECT | L1 recipes are structureless — no constraints, no evals, no checkpoints. Define constraints, failure conditions, and scenarios to make it L2. |
| L2 | BUILD | Proceed with compilation. |
| L3 | DEFER | L3 puts workflow structure into intent. The compiler doesn't support it yet. Build as L2 now? |
| L4 | DEFER | L4 is runtime resolution. We're at L2. Build as compiled recipe instead? |
| L5 | DEFER | L5 is the dark factory. Start with intent.yaml and we'll compile a solid L2. |

## Role

You are the **recipe compiler** and **architectural gatekeeper**. You own the pipeline. You delegate domain tasks to specialized tools — never execute their work directly.

**Build-time tools:**
- `intent-crafter` agent — interviews user, produces intent.yaml
- `evals-creator` skill — generates step and scenario evals
- `/skill-creator` — builds new skills, modifies existing skills

**Runtime agents (declared by user, audited by compiler):** These are the domain agents the compiled recipe will use. Audited against `reference/audit-checklist.md` (P1-P10).

**Reference artifacts:**
- `reference/audit-checklist.md` — P1-P10 agent compliance checklist
- `reference/compiled-example.md` — target output format for compiled recipes
- `core/components/memory/standards/agent-contract.md` — universal JSON contract schema
- `docs/adr/013-recipe-maturity-model.md` — L2 design elements and workflow structures

## Compilation Pipeline

### Step 1 — Gate & Identity

Ask the user for the **recipe name**. Check if `core/components/recipes/{recipe-name}/reference/intent.yaml` and `SKILL.md` already exist.

| Existing Files | Flag | Mode |
|---------------|------|------|
| Neither | — | **New** — build from scratch |
| intent.yaml only | — | **New** — intent exists, build recipe |
| Both | `--rebake` | **Rebake** — rebuild recipe from existing intent |
| Both | `--review` | **Review** — diagnose gaps, no modifications |

Create STM directory at `{stm_base}/{issue}/evidence/create-recipe/{recipe-name}/`.

#### New mode

Move to Step 2.

#### Rebake mode

Perform the deep read (same as Review mode Step R1 below), then move to Step 2.

#### Review mode

Review is diagnostic only — it reads everything, finds gaps, and reports. It NEVER modifies files. If the user wants to fix gaps, they run `--rebake` afterward.

**Step R1 — Deep Read**

Read the entire recipe graph:

1. **Recipe:** Read `SKILL.md` — understand compiled structure, phases, steps, agent contracts, evals, pre-flight checks.
2. **Intent:** Read `reference/intent.yaml` — constraints, failure conditions, scenarios.
3. **Reference files:** Read everything in `reference/` — templates, examples, audit checklists.
4. **Agents:** For every agent the recipe declares, read its definition from `core/components/agents/{name}.md`.
5. **Skills:** For every skill each agent invokes, read its contract from `core/components/skills/{name}/SKILL.md`.
6. **Workflow:** Identify the workflow structure (A/B/C) the recipe uses.

Build a semantic map: recipe → phases → steps → agent dispatches → skill invocations → intent constraint mappings → eval coverage.

**Step R2 — Gap Analysis**

Run these checks against the semantic map. Each check produces a PASS or GAP result with details.

| Check | What it validates | GAP condition |
|-------|-------------------|---------------|
| **G1 — Constraint Coverage** | Every constraint ID in intent.yaml appears in at least one pre-flight check or step eval in SKILL.md | Constraint ID not referenced anywhere in compiled recipe |
| **G2 — Failure Condition Coverage** | Every failure condition ID in intent.yaml is covered by at least one step eval | FC ID not referenced by any SE-* eval |
| **G3 — Scenario Coverage** | Every scenario ID in intent.yaml is covered by at least one scenario eval | Scenario ID not referenced by any SCE-* eval |
| **G4 — Skill Existence** | Every skill referenced in recipe step contracts exists at `core/components/skills/{name}/SKILL.md` | Skill referenced but file missing |
| **G5 — Agent Existence** | Every agent in the recipe's agent boundary table exists at `core/components/agents/{name}.md` | Agent declared but definition missing |
| **G6 — Skill-Agent Alignment** | Every skill a recipe step assigns to an agent is listed in that agent's skill inventory | Recipe assigns skill X to agent Y, but agent Y doesn't declare skill X |
| **G7 — Contract Schema** | JSON contracts in recipe steps contain required fields: `intent_path`, `stm_base`, `stm`, `task_id` | Required contract field missing |
| **G8 — Template References** | Skills that reference LTM templates point to files that exist in `core/components/memory/standards/templates/` | Template path referenced but file missing |
| **G9 — Intent Hash Drift** | Compiled intent_hash in SKILL.md matches current SHA-256 of intent.yaml | Hash mismatch — intent changed since last compilation |
| **G10 — Required Sections** | Compiled SKILL.md contains all required sections: Frontmatter, Header, Compiled From, Role, Pre-flight, Workflow, Scenario Validation, Pause and Resume, Compilation Metadata | Section missing from compiled recipe |

**Step R3 — Gap Report**

Write report to STM at `{stm_base}/{issue}/evidence/create-recipe/{recipe-name}/review-report.md`.

Present to user:

```markdown
## Recipe Review: {recipe-name}

| Check | Status | Details |
|-------|--------|---------|
| G1 Constraint Coverage | PASS/GAP | {which constraints are uncovered} |
| G2 FC Coverage | PASS/GAP | {which FCs are uncovered} |
| G3 Scenario Coverage | PASS/GAP | {which scenarios are uncovered} |
| G4 Skill Existence | PASS/GAP | {which skills are missing} |
| G5 Agent Existence | PASS/GAP | {which agents are missing} |
| G6 Skill-Agent Alignment | PASS/GAP | {which skill-agent mappings are broken} |
| G7 Contract Schema | PASS/GAP | {which contracts have missing fields} |
| G8 Template References | PASS/GAP | {which templates are missing} |
| G9 Intent Hash Drift | PASS/GAP | {hash comparison} |
| G10 Required Sections | PASS/GAP | {which sections are missing} |

**Summary:** {X}/10 PASS, {Y} GAPs found

{If GAPs > 0:}
Run `/create-recipe --rebake {recipe-name}` to fix identified gaps.
```

**Review mode terminates here.** No Steps 2-7. No modifications to any files.

### Step 2 — Intent

#### New mode

Invoke `intent-crafter` agent:

```yaml
Task: "Interview user and produce intent.yaml for the {recipe-name} recipe"
Context:
  recipe_name: "{recipe-name}"
  recipe_purpose: "{purpose — ask user}"
  output_path: "core/components/recipes/{recipe-name}/reference/intent.yaml"
```

The crafter runs a detailed interview: goal, constraints, failure conditions, acceptance scenarios.

#### Rebake mode

Invoke `intent-crafter` agent with existing intent and recipe analysis as context:

```yaml
Task: "Review existing intent.yaml against recipe analysis. Find gaps in constraints, failure conditions, and scenarios."
Context:
  recipe_name: "{recipe-name}"
  existing_intent_path: "core/components/recipes/{recipe-name}/reference/intent.yaml"
  recipe_analysis_path: "{stm_base}/{issue}/evidence/create-recipe/{recipe-name}/recipe-analysis.md"
  output_path: "core/components/recipes/{recipe-name}/reference/intent.yaml"
  mode: "rebake"
```

The crafter reads the recipe analysis from STM — the full mapping of agents, skills, contracts, and constraint coverage — and checks the existing intent against it. It identifies gaps: missing constraints, uncovered failure modes, scenarios that don't match real usage.

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

Identify what skills the recipe needs based on the approved intent.

1. Analyze the intent — what domain work needs to happen? What artifacts need to be produced?
2. List available skills from `core/components/skills/`.
3. Map needed capabilities to existing skills. Identify gaps.
4. For each gap: does an existing skill need modification, or is a new skill needed?

For new or modified skills, invoke `/skill-creator`.

Write skill manifest to STM at `{stm_base}/{issue}/evidence/create-recipe/{recipe-name}/skill-manifest.yaml`:

```yaml
recipe: "{recipe-name}"
skills:
  - name: "{skill-name}"
    path: "core/components/skills/{skill-name}/SKILL.md"
    status: existing | modified | new
```

**Gate:** All needed skills exist with valid SKILL.md contracts.

### Step 4 — Agent Declaration & Audit

Identify which domain agents the recipe needs. This follows from skills — agents are the context engineers that invoke skills.

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

Write audit to `{stm_base}/{issue}/evidence/create-recipe/{recipe-name}/agent-audit-{agent-name}.md`.

For agents with failures, present options:
1. **Upgrade** — modify existing agent to pass. Show proposed changes, get Tether/Vanish, re-audit.
2. **Create new** — build a new compliant agent.
3. **Skip** — proceed without (user must handle that domain differently).

For new agents: interview user for name, domain, skills it needs. Build definition at `core/components/agents/{name}.md` following all 11 principles. Audit to confirm.

**Gate:** ALL agents pass ALL 11 principles. No exceptions.

### Step 5 — Workflow Selection

Reference: `docs/adr/013-recipe-maturity-model.md` — L2 workflow structures.

#### New mode

Present the three structures:

```
Structure A — Full checkpoint flow:
  Pre-flight → Preparation → Checkpoint (skippable) → Execution → Evidence
  Best for: multiple agents, confidence-gated review

Structure B — Fast execution flow:
  Pre-flight → Execution → Approval
  Best for: simpler work, single-agent, low-risk

Structure C — Higher-order L2 (chained recipes):
  Pre-flight → Recipe-1 → STM handoff → Recipe-2 → ... → Evidence
  Best for: composing existing L2 recipes
```

User selects.

#### Rebake mode

Read current workflow structure from the recipe. Assess:
- Did intent changes (new constraints, new agents) affect which structure fits?
- Does the current structure still match the recipe's complexity?

Present assessment with recommendation. User confirms or switches.

#### Pre-flight derivation

Analyze intent constraints to derive pre-flight checks. Each constraint that represents an environmental precondition becomes a pre-flight check with an action-on-failure (hard halt, graceful exit, or hard block).

### Step 6 — Compile & Verify

This is the compilation step. All inputs are ready: intent, skills, agents (all passing), workflow structure, pre-flight checks.

#### 6a. Generate Evals

Invoke `evals-creator` skill with all skill contracts:

```yaml
Input:
  intent_path: "core/components/recipes/{recipe-name}/reference/intent.yaml"
  skill_contracts:
    - skill_name: "{skill-1}"
      contract_path: "core/components/skills/{skill-1}/SKILL.md"
    - skill_name: "{skill-2}"
      contract_path: "core/components/skills/{skill-2}/SKILL.md"
  output_path: "{stm_base}/{issue}/evidence/create-recipe/{recipe-name}/evals.yaml"
```

#### 6b. Compile SKILL.md

Read `reference/compiled-example.md` for the target output format. Read `core/components/memory/standards/agent-contract.md` for contract schema.

Compute intent hash:
```bash
intent_hash=$(shasum -a 256 core/components/recipes/{recipe-name}/reference/intent.yaml | awk '{print $1}')
```

Write `core/components/recipes/{recipe-name}/SKILL.md` with ALL required sections:

| Section | Content |
|---------|---------|
| Frontmatter | name, description, user-invokable (standard fields only) |
| Header | One-paragraph operational description |
| Compiled From | Notice: compiled artifact, edit intent.yaml and re-run /create-recipe |
| Role + Agent Boundaries | Orchestrator role, agent table with domains and phases |
| Pre-flight | Baked checks with constraint IDs, bash logic, resume check |
| Workflow | Sequential steps organized by phase, each with: owner, depends-on, JSON contract (per agent-contract.md), skill invoked, step eval criteria |
| Scenario Validation | E2E scenario evals from intent.yaml |
| Evidence & Close | Write evidence, self-commit (ADR 012), non-blocking |
| Pause and Resume | Status file format, resume logic |
| Compilation Metadata | intent_hash, compiled_by, compiled_at, maturity, workflow_structure, agent count, eval counts |

**Compilation rules (from ADR 013 L2):**
- Workflow steps are sequential with named phases — not abstract stage numbers
- Each agent dispatch includes the full JSON contract template with `stm` paths (per agent-contract.md)
- Step evals appear immediately after the step they validate
- Critical rule for Structure A: execution phase agents read STM data, NEVER the checkpoint brief
- No runtime DAG — task ordering is baked into SKILL.md
- No runtime intent resolution — everything the recipe needs is compiled in
- Intent hash in Compilation Metadata section (end of file) for drift detection — NOT in frontmatter
- **Brief before checkpoint (Structure A):** Every human checkpoint MUST be preceded by a `doc-builder` brief generation step. The pattern is: domain agents produce artifacts → `doc-builder` generates HTML brief → recipe presents brief for human review (Tether/Vanish/Orbit). `doc-builder` is a utility agent — it does NOT count against the ≤5 domain agent budget. If the recipe has no brief generation skill for its domain, the compiler must flag this as a gap and create one via `/skill-creator`.
- **Agent budget — domain vs utility:** The ≤5 agent call limit applies to domain agents only. Utility agents (`doc-builder` for briefs, `repo-orchestrator` for commits/evidence) are exempt. Compilation Metadata must list domain and utility agents separately.

**Pause and Resume (baked into compiled recipe):**
1. Issue detection in pre-flight (extract from branch name or user input)
2. Status file at `{stm_base}/{issue}/status/{recipe-name}.json`
3. Write status after every step completion
4. On resume: skip completed steps, reset `in_progress` to pending
5. No re-planning — the compiled steps are the execution state

#### 6c. Verify

Before finalizing, validate:
- Every constraint referenced in at least one pre-flight check or step eval
- Every failure condition covered by at least one step eval
- Every scenario covered by at least one scenario eval
- All required sections present in the compiled SKILL.md
- Agent contracts match agent-contract.md schema

### Step 7 — Summary

```markdown
## Recipe Compiled: {recipe-name}

**Maturity:** L2 | **Workflow:** Structure {A|B|C} | **Intent hash:** {sha256}

**Files:**
- `core/components/recipes/{recipe-name}/SKILL.md` (compiled)
- `core/components/recipes/{recipe-name}/reference/intent.yaml` (source)
- {any new skills created}
- {any agents created or upgraded}

**Agents:** {list — all PASS} | **Evals:** {step count} step, {scenario count} scenario

Run `/sync-claude` to deploy.
```

## Constraints

- NEVER build L1 recipes — reject with explanation
- NEVER produce a recipe with runtime DAG or runtime intent resolution — L2 is compiled
- NEVER ship intent-resolver as a runtime dependency — it does not exist in L2
- NEVER skip intent definition, eval generation, or agent audit
- NEVER assemble a recipe missing any required section from Step 6b
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
