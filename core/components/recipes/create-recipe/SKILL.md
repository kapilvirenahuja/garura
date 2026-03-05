---
name: create-recipe
description: Create a new recipe from scratch — interview for intent, build skills, generate evals, select workflow, audit/create agents, resolve task DAG. Use when building a new recipe or rebuilding an existing one using the intent-driven framework.
user-invocable: true
model: opus
---

# create-recipe

Create a new recipe using the intent-driven framework. Orchestrates intent-crafter, skill-creator, evals-creator, and intent-resolver to produce a fully functional recipe with enforced intent. Ensures all components — including agents — comply with architectural principles before assembly.

## Role

You are the orchestrator AND the architectural gatekeeper. You own the workflow. You delegate domain tasks to agents — never execute directly. You ensure every component this recipe depends on is architecturally compliant.

**Agent boundaries:**
- `intent-crafter` — intent domain: interviews user, produces intent.yaml
- `intent-resolver` — intent domain: reads intent + workflow + agents -> task DAG JSON
- `skill-creator` — skill available at `/skill-creator` for building new skills
- Other domain agents are declared by the user during recipe definition

## Architectural Principles (The Audit Checklist)

These are the principles every domain agent used by the recipe MUST satisfy. Violation of ANY principle means the agent must be upgraded or a new agent created.

**Applicability:** These principles apply to domain agents that participate in recipe execution (Stages 2, 3, 5). They do NOT apply to infrastructure agents like `intent-crafter` (interview-based, talks to users by design) or `intent-resolver` (classifier, returns DAG not enriched contract).

### P1 — JSON Contract Communication
Agent receives a JSON contract with `intent_path` and `stm` paths. Agent returns an enriched JSON contract with updated `stm` paths. No prompt-based input/output for recipe invocations.

### P2 — STM Path Handoff
Components pass file paths from STM to each other — not prompts, not inline data. Each component reads what it needs from the paths it receives.

### P3 — Intent Awareness
Agent reads `intent.yaml` at `intent_path` from the contract. Constraints, failure conditions, and scenarios are understood from intent — not passed as prose in the prompt.

### P4 — Structured Failure Protocol
When blocked, agent returns structured failure per `docs/framework/structured-failure-protocol.md`. Never returns raw errors or unstructured text.

### P5 — No Direct User Interaction
Agent never uses `AskUserQuestion`. Returns to caller for user interaction.

### P6 — Output Contract Discipline
Agent returns ONLY the enriched JSON contract. Detailed analysis/artifacts go to STM files. No prose, tables, or explanation in the return value.

### P7 — Skill Delegation for Artifact Production
Agent delegates artifact production to skills when skills exist for that domain. Agent = context engineering (reading intent, loading context, validating). Skill = artifact production (writing structured output). If no skill exists for the agent's domain work, the agent may produce artifacts directly — but this should be noted as a gap for future skill extraction.

### P8 — Recovery and Escalation
Agent has self-recovery (max 2 attempts) and structured escalation when blocked by something outside its domain.

### P9 — Domain Boundaries
Agent stays within its declared domain. Never performs work belonging to another agent's domain.

### P10 — Task Graph Participation
Agent marks tasks as `in_progress` and `completed` via TaskUpdate. Can add new tasks via TaskCreate if it discovers additional work.

## Workflow

This recipe follows the "How to Build a Recipe" framework. Each step produces artifacts that downstream steps consume via STM paths.

### Step 1 — Capture Recipe Identity

Ask the user:
- **Recipe name** — what should this recipe be called?
- **Recipe purpose** — one sentence: what does this recipe do?
- **Target directory** — defaults to `core/components/recipes/{recipe-name}/`

Create the STM directory at `.meridian/recipe-creation/{recipe-name}/`.

### Step 2 — Define Intent (intent-crafter)

Invoke `intent-crafter` agent:

```yaml
Task: "Interview user and produce intent.yaml for the {recipe-name} recipe"
Context:
  recipe_name: "{recipe-name}"
  recipe_purpose: "{purpose from Step 1}"
  output_path: "core/components/recipes/{recipe-name}/reference/intent.yaml"
```

The crafter interviews the user about goals, constraints, failure conditions, and acceptance scenarios. It produces `intent.yaml` at the output path.

**Gate:** intent.yaml must exist and conform to the schema before proceeding. Read it and verify:
- `intent` field is present and implementation-agnostic
- At least 1 constraint with id and rule
- At least 1 failure condition with id and condition
- At least 1 scenario with id, persona, given, then

Present the intent.yaml content to the user:

```markdown
## Intent Definition

{intent.yaml content}

---

Type **Tether** to approve or **Vanish** to revise.
```

### Step 3 — Identify Required Skills

Ask the user:
- What skills does this recipe need?
- Which existing skills can be reused? (List available skills from `core/components/skills/`)
- Which skills need to be created new?

For each new skill needed, record:
- Skill name
- What it produces
- Input it needs

Write the skill manifest to STM:

```yaml
# .meridian/recipe-creation/{recipe-name}/skill-manifest.yaml
recipe: "{recipe-name}"
existing_skills:
  - name: "{skill-name}"
    path: "core/components/skills/{skill-name}/SKILL.md"
new_skills:
  - name: "{skill-name}"
    purpose: "{what it does}"
    inputs: ["{input}"]
    outputs: ["{output}"]
```

### Step 4 — Build New Skills and Per-Skill Evals

For each new skill in the manifest:

**4a. Create the skill** — invoke `/skill-creator`:

```yaml
Task: "Create skill {skill-name}: {purpose}"
Context:
  skill_name: "{skill-name}"
  target_path: "core/components/skills/{skill-name}/"
```

**4b. Generate step evals for this skill** — invoke `evals-creator`:

Step evals validate that a single skill's output satisfies the failure conditions mapped to it. These are run by the agent after invoking the skill (Stages 2, 3, 5).

```yaml
Input:
  eval_type: "step"
  intent_path: "core/components/recipes/{recipe-name}/reference/intent.yaml"
  skill_contract:
    skill_name: "{skill-name}"
    contract_path: "core/components/skills/{skill-name}/SKILL.md"
  output_path: ".meridian/recipe-creation/{recipe-name}/step-evals-{skill-name}.yaml"
```

**Gate:** Each skill SKILL.md and its step evals must exist before proceeding to the next skill.

### Step 5 — Generate Scenario Evals

Scenario evals are E2E acceptance tests — they validate the whole workflow output against the `scenarios` from intent.yaml. These are run by the recipe at Stage 6.

Invoke `evals-creator`:

```yaml
Input:
  eval_type: "scenario"
  intent_path: "core/components/recipes/{recipe-name}/reference/intent.yaml"
  skill_contracts:
    - skill_name: "{skill-1}"
      contract_path: "core/components/skills/{skill-1}/SKILL.md"
    - skill_name: "{skill-2}"
      contract_path: "core/components/skills/{skill-2}/SKILL.md"
  output_path: ".meridian/recipe-creation/{recipe-name}/scenario-evals.yaml"
```

Present generated evals to the user for review. Clearly distinguish:
- **Step evals** (per-skill, from Step 4b): {count} evals across {skill count} skills
- **Scenario evals** (E2E, from this step): {count} evals

### Step 6 — Define Workflow Pre-flight (Stage 0)

Ask the user what environmental pre-conditions must be true for this recipe to run:
- What system state is required? (e.g., clean git tree, specific files exist)
- What tools must be available?

Also analyze the intent.yaml — some constraints imply pre-flight checks (e.g., "input must be approved" implies checking for an approval artifact).

Write pre-flight checks to the recipe definition.

### Step 7 — Select Workflow Template

Read available workflows from `core/components/memory/workflows/`:

```markdown
## Available Workflows

{list each workflow name + description}

---

Which workflow fits this recipe? Or describe a new one.
```

If the user needs a new workflow, create it at `core/components/memory/workflows/{name}.yaml`.

Record the selected workflow path.

### Step 8 — Declare and Audit Agents

This is the architectural gatekeeping step. It has three phases.

#### Phase 1: Declare

Ask the user which agents this recipe will use. List existing agents from `core/components/agents/`:

```markdown
## Available Agents

{list each agent name + domain + description}

---

Which agents does this recipe need? You can pick existing ones or request new ones.
```

Record the agent list: `[{ "name": "...", "domain": "..." }]`

#### Phase 2: Audit

For EACH declared agent, read its definition from `core/components/agents/{name}.md` and audit against ALL 10 architectural principles (P1-P10).

Produce an audit report per agent:

```markdown
## Agent Audit: {agent-name}

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS/FAIL | {what was found} |
| P2 STM Path Handoff | PASS/FAIL | {what was found} |
| P3 Intent Awareness | PASS/FAIL | {what was found} |
| P4 Structured Failure | PASS/FAIL | {what was found} |
| P5 No Direct User Interaction | PASS/FAIL | {what was found} |
| P6 Output Contract Discipline | PASS/FAIL | {what was found} |
| P7 Skill Delegation | PASS/FAIL/N-A | {what was found — N/A if no skills exist for this domain yet} |
| P8 Recovery and Escalation | PASS/FAIL | {what was found} |
| P9 Domain Boundaries | PASS/FAIL | {what was found} |
| P10 Task Graph Participation | PASS/FAIL | {what was found} |
```

Write the audit report to `.meridian/recipe-creation/{recipe-name}/agent-audit-{agent-name}.md`.

#### Phase 3: Interview and Resolve

For each agent with ANY failing principle, present the audit to the user:

```markdown
## Agent Compliance: {agent-name}

{audit table}

**Failing principles:** {list}

### Options

1. **Upgrade {agent-name}** — modify the existing agent to pass all principles. This agent is also used by: {list other recipes that reference it}. The upgrade will maintain backward compatibility by supporting both JSON contract mode and legacy prompt mode.
2. **Create new agent** — build a new agent (e.g., {suggested-name}) that is fully compliant. The existing agent remains untouched.
3. **Skip** — proceed without this agent. You will need to handle its domain work differently.

---

Which option? (1/2/3) Interview me if you need more context.
```

**If the user chooses Upgrade:**
- Read the existing agent definition fully
- Identify the minimum changes needed to pass all failing principles
- Present the proposed changes to the user before applying:
  ```markdown
  ## Proposed Upgrade: {agent-name}

  **Changes:**
  {list of specific changes with before/after}

  **Backward compatibility:** {how legacy invocations still work}

  **Other recipes affected:** {list}

  ---

  Type **Tether** to apply or **Vanish** to cancel.
  ```
- Apply the changes to `core/components/agents/{name}.md`
- Re-audit to confirm all principles now pass

**If the user chooses Create New:**
- Interview the user about the new agent:
  - Agent name and domain
  - What skills it needs access to
  - What domain work it handles
- Build the agent definition at `core/components/agents/{name}.md` following ALL 10 principles from the start
- Audit the new agent to confirm compliance
- Update the recipe's agent list to reference the new agent

**Gate:** ALL agents in the recipe's list must pass ALL 10 principles before proceeding. No exceptions.

### Step 9 — Generate Task DAG (intent-resolver)

Invoke `intent-resolver` agent:

```json
{
  "intent_path": "core/components/recipes/{recipe-name}/reference/intent.yaml",
  "workflow_path": "{selected workflow path from Step 7}",
  "agents": [{agent list from Step 8}]
}
```

The resolver returns the task DAG JSON. Write it to `.meridian/recipe-creation/{recipe-name}/dag.json`.

Present the DAG to the user for review.

### Step 10 — Assemble the Recipe

Using all collected artifacts, write the recipe SKILL.md at `core/components/recipes/{recipe-name}/SKILL.md`.

The assembled recipe MUST contain all of the following sections. Missing any section means the recipe is incomplete and will drift from the architecture.

#### 10.1 — Frontmatter
```yaml
name: {recipe-name}
description: {purpose}
user-invocable: true
model: {model}
```

#### 10.2 — Intent Section
The recipe reads `reference/intent.yaml` at startup. The intent drives all downstream behavior — constraints shape agent work, failure conditions drive evals, scenarios drive E2E validation.

#### 10.3 — Role Section
Orchestrator role. Agent boundaries with name and domain for each agent.

#### 10.4 — Fixed Stages
The recipe MUST reference the fixed stage model:

| Stage | Name | Type | Owner |
|-------|------|------|-------|
| 0 | Workflow Pre-flight | Infrastructure | recipe |
| 1 | Intent Resolution | Infrastructure | intent-resolver |
| 2 | Readiness | Domain work | domain agent(s) |
| 3 | Human-Readable Brief | Domain work | domain agent |
| 4 | Human Checkpoint | Infrastructure | recipe |
| 5 | Generation | Domain work | domain agent(s) |
| 6 | Scenario Validation | Infrastructure | recipe |
| 7 | Evidence & Close | Infrastructure | recipe |

**Infrastructure stages (0, 1, 4, 6, 7) do NOT count toward the agent budget.**
**Domain work stages (2, 3, 5) count toward the budget.**

#### 10.5 — Two Core Phases
The recipe MUST document the phase boundary:

- **Readiness phase** (Stages 2, 3, 4): Analysis, scoping, content production, brief, approval. Everything needed to be ready.
- **Generation phase** (Stage 5): Produce final deliverables from approved artifacts.

Before approval: getting READY. After approval: GENERATING deliverables.

#### 10.6 — STM Data Flow Rules
The recipe MUST enforce these data flow rules:

```
Stage 2 -> Agents write STRUCTURED DATA to STM (source of truth)
Stage 3 -> Domain agent creates BRIEF from STM (VIEW for humans, skippable)
Stage 4 -> Human reviews brief, Tether/Vanish (skippable)
Stage 5 -> Agents read STM data (NOT brief) -> generate deliverables
```

**Critical rule: Stage 5 agents NEVER read the brief. They read the STM data the brief was generated from.**

#### 10.7 — Execution Section
How the recipe loads and executes the task DAG:

1. **Load DAG** — Read from `.meridian/{issue}/dag/{recipe-name}.json`
2. **Dispatch by stage + owner:**
   - Owner is an agent name -> delegate to that agent via JSON contract
   - Owner is "recipe" -> execute inline (pre-flight, checkpoint, scenario eval, evidence)
3. **Iterate in dependency order** — respect `blockedBy` edges
4. **Update task status** — mark tasks `in_progress` then `completed` as they execute

#### 10.8 — DAG Caching
The recipe MUST include caching instructions:

```
Cache location: .meridian/cache/intent-resolution/{recipe-name}.json
Invalidation: hash(intent.yaml) + hash(workflow) + hash(agents) changes
Lifetime: Permanent until invalidated
```

On recipe invocation: check cache first. If valid, load DAG directly (skip Stage 1). If stale, run resolver, update cache.

#### 10.9 — DAG Resumption
The recipe MUST support resumption:

```
DAG location: .meridian/{issue}/dag/{recipe-name}.json
Written: After Stage 1 (intent resolution)
Updated: At every checkpoint (Stage 4) — marks completed tasks
On resume: Recipe reads DAG from STM, skips completed tasks, continues from where it stopped
```

No re-planning on resume. The DAG is the execution state.

#### 10.10 — Two Eval Levels
The recipe MUST implement both eval levels:

| Level | Who | When | What | Source |
|-------|-----|------|------|--------|
| **Step evals** | Agent (self-validation) | After skill output (Stages 2, 3, 5) | Did this skill's output satisfy failure conditions mapped to this step? | `failure_conditions` mapped by resolver |
| **Scenario evals** | Recipe | Stage 6 (E2E) | Does the whole workflow output satisfy acceptance? | `scenarios` from intent.yaml |

Step evals are tasks in the DAG owned by agents. Scenario evals are tasks in the DAG owned by the recipe.

#### 10.11 — Pre-flight Section
The checks from Step 6.

#### 10.12 — Agent Declarations
Which agents with domains. L1 recipes: max 2 agent calls. L2 recipes: max 5 (ideal 3). Infrastructure stages (0, 1, 4, 6, 7) do NOT count toward this budget.

#### 10.13 — Workflow Reference
Reference the workflow template from LTM by path. Never hardcode stage sequences.

**Assembly Gate:** Before writing the final SKILL.md, verify all 13 subsections are present. If any is missing, add it before writing.

The recipe structure:

```
core/components/recipes/{recipe-name}/
├── SKILL.md              # Recipe definition
└── reference/
    └── intent.yaml       # Intent contract
```

### Step 11 — Summary

Present what was created:

```markdown
## Recipe Created: {recipe-name}

**Files:**
- `core/components/recipes/{recipe-name}/SKILL.md`
- `core/components/recipes/{recipe-name}/reference/intent.yaml`
- {any new skills created}
- {any new workflows created}
- {any agents created or upgraded, with audit status}

**Workflow:** {workflow name}
**Agents:** {agent list with compliance status — all PASS}
**Evals:** {step_eval_count} step evals across {skill_count} skills, {scenario_eval_count} scenario evals

---

Run `/sync-claude` to deploy.
```

## Constraints

- NEVER write recipe logic inline — delegate to agents
- NEVER skip the intent definition step — intent.yaml is required
- NEVER skip eval generation — both step evals (per-skill) and scenario evals (E2E) are required
- NEVER hardcode workflow stages — always reference a workflow template from LTM
- NEVER skip the agent audit — every declared agent must pass all 10 principles
- NEVER proceed past Step 8 with any agent failing any principle
- NEVER assemble a recipe missing any of the 13 required subsections (10.1-10.13)
- ALWAYS present intent.yaml for user approval before proceeding
- ALWAYS present the task DAG for user review before assembling the recipe
- ALWAYS present agent audit findings and get user decision before modifying agents
- ALWAYS write artifacts to STM during creation, final files to core/components/
- ALWAYS re-audit after upgrading an agent to confirm compliance
- ALWAYS generate step evals per-skill during Step 4, not as a batch
