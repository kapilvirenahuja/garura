# Architecture Inference — meridian-os
**Task:** 1A-architecture-inference  
**Mode:** Discovery (no locked architecture.yaml)  
**Date:** 2026-03-31  
**Issue:** #183 — prepare-implementation should not hard-block on product.yaml and roadmap.yaml

---

## Summary

Meridian is an **agentic meta-framework** implementing Intent-Driven Software Development (IDSD). It is not a deployed application — it is a framework of compiled plays, domain agents, and skills that run inside Claude Code (claude.ai/code). There are no servers, ports, or HTTP APIs. The "product" is the set of `.md` files deployed to `~/.claude/` that Claude Code executes as workflows.

The codebase is composed entirely of structured text: YAML schemas, Markdown agent/play/skill definitions, and ADR documentation. The primary "runtime" artifact is the compiled SKILL.md play file. The primary "database" is the file system — STM (per-issue `.meridian/project/issues/{issue}/`) and LTM (`~/.meridian/core/memory/`).

---

## Logical Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  HUMAN DOMAIN                                                        │
│                                                                      │
│  intent.yaml ──► /create-play (compiler) ──► SKILL.md (deployed)  │
│  User invokes: /play-name                                          │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ Claude Code executes SKILL.md
┌────────────────────────────▼─────────────────────────────────────────┐
│  ORCHESTRATION LAYER (Plays)                                       │
│                                                                      │
│  High-Order Play ──► chains atomic plays OR dispatches domain agents         │
│  Atomic Play ──► dispatches ≤2 domain agents via JSON contracts        │
│                                                                      │
│  pre-flight → [parallel agent dispatch] → checkpoint → evidence      │
└───────┬──────────────────────────────────┬───────────────────────────┘
        │ JSON contract (task_id, stm.*)   │
┌───────▼──────────────────────────────────▼───────────────────────────┐
│  AGENT LAYER                                                         │
│                                                                      │
│  tech-architect  product-strategist  repo-orchestrator  code-builder │
│  tech-designer   test-engineer       quality-auditor    doc-builder  │
│  project-orchestrator  knowledge-extractor              eval-generator│
│                                                                      │
│  Each agent: reads STM inputs → domain reasoning → invokes skills    │
│              → writes STM outputs → returns updated JSON contract    │
└───────┬──────────────────────────────────────────────────────────────┘
        │ Skill tool invocation
┌───────▼──────────────────────────────────────────────────────────────┐
│  SKILL LAYER                                                         │
│                                                                      │
│  draft-lld  draft-implementation-plan  draft-technical-approach      │
│  draft-product-spec  draft-verification-scenarios  assess-feasibility│
│  scope-roadmap-epics  validate-implementation-design  create-commit  │
│  research-domain-context  (34 skills total)                          │
│                                                                      │
│  Each skill: reads STM paths → produces artifact → writes to STM    │
│              → returns path in output contract                       │
└───────┬──────────────────────────────────────────────────────────────┘
        │ File I/O (Phoenix Architecture)
┌───────▼──────────────────────────────────────────────────────────────┐
│  MEMORY LAYER                                                        │
│                                                                      │
│  STM: .meridian/project/issues/{issue}/                              │
│    ├── evidence/{play}/{artifact}.yaml  (agent outputs)            │
│    ├── checkpoint/{play}/{timestamp}.md (human approval state)     │
│    └── status/{play}.json               (crash recovery state)     │
│                                                                      │
│  LTM (project): .meridian/product/                                   │
│    ├── discovery/product.yaml    (LOCKED = authoritative)            │
│    ├── roadmap/roadmap.yaml      (LOCKED = authoritative)            │
│    └── architecture/architecture.yaml  (LOCKED = authoritative)     │
│                                                                      │
│  LTM (core): ~/.meridian/core/memory/                                │
│    ├── standards/  (agent-contract, resolution-protocol, git, etc.)  │
│    └── knowledge/  (architecture, domain-taxonomy, project-profiling)│
└──────────────────────────────────────────────────────────────────────┘
```

---

## Module Boundaries

```
core/
├── config.yaml                    ← Single config source of truth (all path resolutions)
└── components/
    ├── agents/                    ← Domain experts (15 agents)
    │   ├── tech-architect.md      ← Architecture inference, LLD, plan DAG
    │   ├── tech-designer.md       ← RCA, feature analysis, feasibility
    │   ├── product-strategist.md  ← Product vision, roadmap, features.yaml
    │   ├── code-builder.md        ← Source code implementation
    │   ├── repo-orchestrator.md   ← Git, commits, branches, PRs
    │   ├── quality-auditor.md     ← Test validation, quality gates
    │   ├── test-engineer.md       ← Test surface, blast radius, scenarios
    │   ├── knowledge-extractor.md ← LTM extraction and promotion
    │   └── ...10 more agents
    │
    ├── plays/                   ← Compiled workflows (15 plays)
    │   ├── prepare-implementation/
    │   │   ├── SKILL.md           ← Compiled play (runtime artifact)
    │   │   └── reference/
    │   │       ├── intent.yaml    ← Source of truth (C1-C32, F1-F26, S1-S13)
    │   │       └── evals.yaml
    │   └── ...14 more plays
    │
    ├── skills/                    ← Capabilities (34 skills)
    │   ├── draft-lld/
    │   │   ├── SKILL.md
    │   │   └── schemas/tech.yaml
    │   └── ...33 more skills
    │
    └── memory/                    ← LTM source
        ├── standards/             ← Rules agents must follow
        │   ├── agent-contract.md  ← Universal JSON contract schema
        │   ├── resolution-protocol.md  ← R1-R4 hierarchy
        │   └── ...4 more standards
        ├── knowledge/             ← Reference material
        │   ├── architecture/      ← 20+ architecture files (patterns, stacks, platforms, data, ops, agentic)
        │   ├── domain-taxonomy/   ← 5 domain files
        │   └── project-profiling/ ← PP, NFR, QP profiles
        └── formats/               ← Output format references
```

---

## Design Patterns In Depth

### 1. Three-Layer Hierarchy (ADR-001)

```
High-Order Play (human-only, ≤5 agents)
    └─► chains atomic plays
    └─► dispatches domain agents

Atomic Play (human or model, ≤2 agents)
    └─► dispatches ≤2 domain agents
    └─► always produces artifact
    └─► always checkpoints for human approval

Skill (model-only, invoked by agents)
    └─► produces specific artifact
    └─► writes to STM
    └─► returns path in contract
```

**Evidence:** `AGENTS.md`, `CLAUDE.md`, `docs/adr/001-three-layer-hierarchy.md`

### 2. Compiled Intent Pattern (ADR-013, Level 2 Maturity)

```
intent.yaml (source)
    ─► /create-play (compiler — build time only)
    ─► SKILL.md (compiled binary — runtime artifact)
    
intent.yaml is NOT read at runtime.
SKILL.md is self-contained — all constraints baked in.
Hash-locked: SKILL.md frontmatter stores sha256(intent.yaml).
```

**Evidence:** Every play has `reference/intent.yaml` + `SKILL.md` pair. SKILL.md contains `## Compiled From` header referencing intent.

### 3. Phoenix Architecture / STM Data Transport (ADR-011)

```
❌ Wrong: agent returns {data: {...}}
             ↓ play holds in context
             ↓ next agent receives data in context (loses fidelity)

✅ Right:  agent writes → .meridian/.../artifact.yaml
           agent returns → {artifact_path: ".meridian/.../artifact.yaml"}
           play passes path to next agent
           next agent: Read tool call to artifact_path
```

**Evidence:** All skill output contracts return paths, not data. `agent-contract.md` standard defines `stm.input` and `stm.output` as path maps.

### 4. R1-R4 LTM Resolution Protocol (ADR-015)

```
When ltm_context present in input contract:

R1: Identify decision domains from task + ltm_context.query_domains

R2: Search project_base (.meridian/product/)
    ├── File exists + section + LOCKED → authoritative, stop
    ├── File exists + section + DRAFT  → advisory, continue
    └── No match                       → descend to R3

R3: Search core_base (~/.meridian/core/memory/)
    ├── Check _index.md for category listings
    ├── Match search_patterns headers
    └── All core files = advisory (authority: draft)

R4: No answer from R2/R3
    └── LLM reasoning, flag resolved_from: "llm"

Output: resolution-trace.yaml to STM
```

**Evidence:** `core/components/memory/standards/rules/resolution.md`, `docs/adr/015-ltm-resolution-protocol.md`, agent definitions for tech-designer/product-strategist/repo-orchestrator.

### 5. Scenario Compartmentalization

```
features.yaml   → PM audience (behaviors, invariants, NO technology)
scenarios.yaml  → Validator audience (pass/fail criteria, COMPARTMENTALIZED)
tech.yaml       → Implementer audience (file paths, before/after, templates)
plan.yaml       → Implementer + Quality Lead (task DAG, scenario IDs ONLY — never content)

                    code-builder
                        |
                   sees: tech.yaml
                         plan.yaml (IDs only)
                         NEVER: scenarios.yaml content
```

**Evidence:** `prepare-implementation/reference/intent.yaml` C9, C11.

---

## Data Flow: prepare-implementation

```
Step 0: Read available upstream artifacts
    ├── architecture.yaml → present? LOCKED mode : discovery mode
    ├── product.yaml → present? use : derive from codebase
    └── roadmap.yaml → present? use : skip dependency enforcement

Step 1 (conditional): Resolve epic dependency chain [only if --epic + roadmap exist]

Steps 2-6 (PARALLEL dispatch — all independent):
    ├─► tech-architect: architecture-inference.yaml + .md
    ├─► test-engineer:  test-surface.yaml
    ├─► tech-architect: dependency-graph.yaml + .md
    ├─► tech-architect: commit-history-analysis.yaml + .md
    └─► tech-architect: ltm-findings.yaml

Step 7: tech-architect assembles context (reads all 5 outputs)
    └─► context-assembly.yaml

Checkpoint 0: Human reviews context assembly (Tether/Vanish)

Steps 8-10 (PARALLEL dispatch — after checkpoint 0):
    ├─► tech-architect: change-surface.yaml
    ├─► test-engineer:  blast-radius.yaml
    └─► test-engineer:  baseline-tests.yaml

Checkpoint 1: Human reviews blast radius (Tether/Vanish)

DRAFT Stage 1:
    └─► product-strategist: features.yaml

DRAFT Stage 2:
    └─► tech-architect: tech.yaml + tech.md

DRAFT Stage 3:
    ├─► test-engineer: scenarios.yaml
    └─► tech-architect: plan.yaml + plan.md

Steps 18-20: Structural validation → open question interview → auto-lock

Step 22: repo-orchestrator: evidence self-commit
```

---

## LLD Patterns

### Dependency Injection via Contract Threading

There is no DI container. The play is the injector. It wires outputs to inputs explicitly in the compiled workflow:

```json
// Step 2 produces:
{
  "stm": {
    "output": {
      "architecture_inference_yaml": ".meridian/.../architecture-inference.yaml"
    }
  }
}

// Step 7 receives:
{
  "stm": {
    "input": {
      "architecture_inference_yaml": ".meridian/.../architecture-inference.yaml",
      "dependency_graph_yaml": ".meridian/.../dependency-graph.yaml",
      "commit_history_yaml": ".meridian/.../commit-history.yaml",
      "test_surface_yaml": ".meridian/.../test-surface.yaml",
      "ltm_findings_yaml": ".meridian/.../ltm-findings.yaml"
    }
  }
}
```

### Error Handling Pattern

```
Agent encounters error
    ├── Self-recovery attempt 1 (broaden search, try alternate entry point)
    ├── Self-recovery attempt 2 (if first failed)
    └── Escalation via structured failure:
        {
          failure: {
            what_failed: "{step name}",
            why: "{expected vs found}",
            domain_assessment: { within_my_domain: false, suggested_agent: "..." },
            context: { intent_received: "...", self_recovery_attempted: true },
            suggested_fix: "..."
          }
        }
```

### Crash Recovery Pattern

```
Play startup:
    1. Check {stm_base}/{issue}/status/{play}.json
    2. If exists: read completed_steps[]
    3. Skip completed steps
    4. Reset in_progress steps to pending
    5. Continue from first incomplete step
```

### Artifact Lifecycle Pattern

```
DRAFT creation
    → structural validation (validate-* skills)
    → open questions interview (if open_questions[] present)
    → high-risk resolution (if risks severity: "high" present)
    → write pre-lock-resolutions.yaml (audit trail)
    → LOCKED state (authoritative for downstream work)
```

---

## Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Execution environment | Claude Code (claude.ai/code) | Runs plays, provides tools (Bash, Read, Write, Edit, Grep, Glob, Task, Skill, WebSearch, WebFetch) |
| LLM (complex reasoning) | Claude Opus 4+ | tech-architect, product-strategist, tech-designer, knowledge-extractor |
| LLM (implementation) | Claude Sonnet | code-builder, repo-orchestrator, quality-auditor, test-engineer, doc-builder |
| Version control | git + GitHub (gh CLI) | Issue tracking, PRs, version history, evidence commits |
| Artifact format | YAML + Markdown | All structured artifacts (YAML for machine consumption, MD for human review) |
| Storage | File system (STM/LTM) | All state persistence — no database |
| Deployment | /sync-claude | Copies core/components/ to ~/.claude/ (global) or .claude/ (project) |

---

## Key Structural Observations for Issue #183

The issue asks prepare-implementation to not hard-block on product.yaml and roadmap.yaml. The architecture inference confirms:

**1. The play already supports discovery mode (by design).**  
Constraints C1, C21, C22, C23 in intent.yaml explicitly state that product.yaml, roadmap.yaml, architecture.yaml, and quality-standards.yaml are all "nice-to-have upstream inputs." The compiled SKILL.md Step 0 checks for their presence and sets status flags — it does NOT halt on absence.

**2. The hard-halt condition is F19 (no issue AND no epic).**  
This is the only legitimate hard halt. Without an issue or epic, there is no scope for the work. All other upstream artifacts are gracefully absent: the play enters discovery mode.

**3. The context resolution hierarchy (C23) maps discovery sources:**
- Locked YAML artifact (authoritative)
- Project LTM at .meridian/product/ (advisory)
- Codebase scan (derived — architecture inference step IS this)
- User interview (collected — targeted interview fills gaps)

**4. Any change to prepare-implementation requires rebaking from intent.yaml.**  
SKILL.md is the compiled artifact. To change behavior, update reference/intent.yaml and run `/create-play --rebake prepare-implementation`.

---

## Discovery Mode: How Architecture is Derived Without architecture.yaml

When `architecture.yaml` is absent, the play enters discovery mode:

```
Step 2 (tech-architect, discovery_mode=true):
    ├── Scan codebase: module structure, file naming, entry points
    ├── Read config files: package.json, pyproject.toml, pom.xml, go.mod, etc.
    ├── Identify framework conventions: Next.js app router, Spring Boot project structure, etc.
    ├── Detect design patterns: MVC, event-driven, repository, CQRS, DI approach
    ├── Trace data flow: how requests/data move through the system
    ├── Consult LTM via R1-R4: architecture knowledge for detected technology stack
    └── Targeted user interview: fill gaps that codebase scan cannot answer
        (e.g., "Is this monolith or microservices?", "What's the deployment target?")

Produces: architecture-inference.yaml + architecture-inference.md
These artifacts REPLACE the missing architecture.yaml for all downstream steps.

context-assembly.yaml records: architecture_source: "derived" (not "locked")
```

The distinction between `discovery_mode=true` (no locked architecture.yaml) and the standard run is only in the inputs. The outputs — architecture-inference artifacts — are equivalent in structure and authority for the purposes of this play run. Downstream agents (tech.yaml producer, plan.yaml producer) treat discovery-derived architecture understanding identically to a locked architecture.yaml.
