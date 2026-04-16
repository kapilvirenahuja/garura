# Context: Issue #243 — Canonical Glossary of Meridian Core Concepts

## Purpose

Grounding document for implementing `core/grounding/glossary.md` — the canonical, exhaustive glossary of every Meridian concept. This is a self-development artifact (how Meridian is built), not a deployable component.

---

## 1. Concept Inventory

Every distinct Meridian concept found across the codebase, with its current definition location.

### 1.1 Three-Layer Hierarchy

| Concept | Current Definition Location(s) | Notes |
|---------|--------------------------------|-------|
| **Play** | `docs/philosophy/architecture.md` §Three-Layer Hierarchy, `docs/components/plays.md` §Philosophy, `docs/adr/001-three-layer-hierarchy.md`, `docs/adr/013-play-maturity-model.md` | "Human-invocable workflow defining order of operations." Play levels (L1/L2) retired per ADR 017. |
| **Sub-play** | `core/components/plays/ship/SKILL.md` §Role, `docs/components/plays.md` §Two Play Patterns | Plays that chain other plays (e.g., `ship` chains `commit-code → create-pr → merge-pr`). |
| **Atomic Play** | `docs/philosophy/architecture.md` §Atomic Plays | Standalone play producing one artifact; never chains others. |
| **High-Order Play** | `docs/philosophy/architecture.md` §High-Order Plays | Chains ≤5 atomic plays. Human-only invocable. |
| **Agent** | `docs/philosophy/architecture.md` §Agents, `docs/components/agents.md` §Philosophy, `docs/adr/004-agent-naming.md` | Autonomous decision-maker with one domain of expertise. Named `{domain}-{role}`. |
| **Domain Agent** | `docs/components/agents.md` §Available Agents, `core/components/plays/enhance/SKILL.md` §Role | Agent that performs domain work (tech-designer, code-builder, etc.). Counts toward agent budget. |
| **Utility Agent** | `core/components/plays/enhance/SKILL.md` §Role, `docs/components/agents.md` §Available Agents | Agent performing infrastructure work (repo-orchestrator, scriber). Exempt from agent budget. |
| **Skill** | `docs/philosophy/architecture.md` §Skills, `docs/components/skills.md`, `docs/adr/005-skills-as-capabilities.md` | Model-invocable bounded capability. Invoked only by agents. Each has a SKILL.md with input/output contracts. |
| **Play-scoped sub-role** | `docs/components/agents.md` §Granularity Principle | Context-isolated sub-role within a specific play (e.g., `test-writer` in implement-epic). Not a standalone agent. |

### 1.2 Memory Architecture

| Concept | Current Definition Location(s) | Notes |
|---------|--------------------------------|-------|
| **LTM (Long-Term Memory)** | `docs/philosophy/architecture.md` §Memory Architecture, `docs/components/memory.md` §Long-Term Memory | Persists across sessions. Contains standards, formats, knowledge. Two sub-types: Core LTM and Product LTM. |
| **Core LTM** | `docs/components/memory.md` §LTM Organization, `AGENTS.md` §Architecture, `CLAUDE.md` §Architecture | Framework-wide organizational knowledge. Authored at `core/components/memory/`. Deployed to `~/.meridian/core/memory/` (global) or `.meridian/core/memory/` (project). |
| **Product LTM** | `core/components/plays/capture-learning/SKILL.md` §Pre-flight, `core/components/agents/knowledge-extractor.md` §ANALYZE Mode | Project-specific product knowledge. Lives at the path resolved from `product_base` in `.meridian/core/config.yaml`. Organized by SDLC stage. |
| **STM (Short-Term Memory)** | `docs/philosophy/architecture.md` §Short-Term Memory, `docs/components/memory.md` §Short-Term Memory, `docs/adr/008-issue-centric-stm-and-nwwi.md` | Per-issue artifacts produced during play execution. Lives at `.meridian/project/issues/{N}/`. Persists forever (audit trail). |
| **KB (Knowledge Base)** | `docs/components/memory.md` §KB Capability Catalog, `core/components/memory/standards/rules/_index.md` | Capability catalog in `core/components/memory/knowledge/domain-taxonomy/`. Used in product planning pipeline (`specify-product` / `design-exp` / `build-arch`). |
| **Standards** | `core/components/memory/standards/rules/_index.md` | Rules, conventions, quality criteria. Lives in `core/components/memory/standards/`. Deployed to `~/.meridian/core/memory/standards/`. |
| **Formats** | `docs/components/memory.md` §LTM Organization | Templates and output shapes. Lives in `core/components/memory/standards/templates/` and `formats/`. |
| **Knowledge** | `docs/components/memory.md` §LTM Organization, `core/components/memory/knowledge/_index.md` | Searchable reference material. Lives in `core/components/memory/knowledge/`. Organized by arch/domain/product/quality sub-domains. |
| **Context baseline** | `core/components/plays/capture-learning/SKILL.md` §Pre-flight, `core/components/agents/knowledge-extractor.md` §ANALYZE Mode | Snapshot of what `prepare-epic` knew at planning time. Stored in `{stm_base}/{issue}/context/`. Input to reconciliation. |
| **Evidence** | `docs/philosophy/architecture.md` §STM Folder Structure, `docs/adr/012-evidence-self-commit.md` | Proof of work quality. Written to `.meridian/{issue}/evidence/{play-name}/`. |
| **Resolution trace** | `core/components/memory/standards/rules/resolution.md` §Resolution Trace Output | Per-decision trace written to STM by agents following R1–R4. Path: `{stm_base}/{issue}/evidence/{play}/resolution-trace.yaml`. |

### 1.3 Execution Model

| Concept | Current Definition Location(s) | Notes |
|---------|--------------------------------|-------|
| **JSON Contract** | `docs/philosophy/architecture.md` §JSON Contract Pattern, `docs/adr/016-agent-json-contract.md`, `docs/components/plays.md` §JSON Contract | Primary communication mechanism in task-driven plays. Single JSON object enriched by each agent invocation. Fields: `intent_path`, `stm_base`, `stm.input`, `stm.output`, `task_id`, `notes`, `step_failure`. |
| **Intent** | `docs/philosophy/architecture.md` §Intent Crafting, `docs/philosophy/idsd.md` §Two-Layer Intent Model | Goal, constraints, and failure conditions in `reference/intent.yaml`. "The why." Two layers: business intent (user) and SDLC intent (framework author). |
| **Four Crafts Architecture** | `docs/philosophy/architecture.md` §Four Crafts Architecture | Intent Crafting + Prompt Crafting + Context Crafting + Spec Crafting. |
| **Intent Crafting** | `docs/philosophy/architecture.md` §Intent Crafting | Framework author produces `reference/intent.yaml` with goal, constraints, failure conditions, scenarios. |
| **Prompt Crafting** | `docs/philosophy/architecture.md` §Prompt Crafting | Play passes ONLY the JSON contract to agents — no extra instructions. |
| **Context Crafting** | `docs/philosophy/architecture.md` §Context Crafting, `docs/components/agents.md` §Four Crafts: Where Agents Fit | Agent discovers LTM paths, reads STM artifacts, assembles what the skill needs. Agent's primary responsibility. |
| **Spec Crafting** | `docs/philosophy/architecture.md` §Spec Crafting | Skill reads templates from LTM, fills them with content, writes artifacts to STM. |
| **Checkpoint** | `docs/philosophy/architecture.md` §Auto-Approval Logic, `docs/adr/008-issue-centric-stm-and-nwwi.md` §Mandatory Checkpoint Schema | Approval gate in plays. Status lifecycle: `PENDING_APPROVAL` → `APPROVED` / `REJECTED`. Written to `.meridian/{issue}/checkpoint/{play}/`. |
| **Tether / Vanish** | `CLAUDE.md` §Explicit Approvals, `AGENTS.md` §Explicit Approvals | User response at checkpoints. Tether = proceed. Vanish = cancel. |
| **Auto-approval** | `docs/philosophy/architecture.md` §Auto-Approval Logic | Play skips human checkpoint when all low-risk criteria are met. |
| **Signals** | `docs/philosophy/idsd.md` §IDD → Meridian Mapping | User CLI invocations (e.g., `/ship`, `/enhance`). All signals enter via plays. IDD Element 2. |
| **NWWI (No Work Without an Issue)** | `docs/adr/008-issue-centric-stm-and-nwwi.md` §Decision | All work that produces checkpoints must be linked to a GitHub issue. Enforced at `commit-code`. |
| **Two-phase write** | `docs/adr/008-issue-centric-stm-and-nwwi.md` §Two-Phase Write for Bootstrap | `start-feature` writes first to `_pending/` then moves to `{issue}/` once the issue number is known. |
| **Evidence self-commit** | `docs/adr/012-evidence-self-commit.md` | Every play commits its own STM artifacts at the end (Stage 7) via `repo-orchestrator`. Non-blocking. |
| **Agent-first pattern** | `CLAUDE.md` §Execution Model, `AGENTS.md` §Execution Model | Plays delegate domain tasks to agents; plays never execute domain work directly with tools. |
| **Pause / Resume** | `docs/philosophy/architecture.md` §Checkpoint Artifact Status Lifecycle, `core/components/plays/enhance/SKILL.md` §Pause and Resume | Plays can be interrupted and resumed. Status file at `{issue}/status/{play}.json` tracks step completion. |
| **Status file** | `core/components/plays/enhance/SKILL.md` §Pause and Resume, `core/components/plays/ship/SKILL.md` §Pause and Resume | JSON file at `{stm_base}/{issue}/status/{play}.json` tracking play execution state. |
| **Structured failure protocol** | `docs/framework/structured-failure-protocol.md` | Standardized failure return format for agents. Fields: `what_failed`, `why`, `domain_assessment`, `suggested_fix`. |
| **Recovery protocol** | `docs/framework/intent-driven-recovery.md`, `docs/philosophy/architecture.md` §Recovery Protocol | Up to 2 retry cycles per agent. Play invokes responsible agent with fix context + original intent. |
| **Context isolation** | `core/components/plays/enhance/SKILL.md` §Step 10, `core/components/agents/knowledge-extractor.md` §What You MUST NOT Do | Certain agents (judge, eval-generator) must NOT see implementation code or prior outputs. Preserved by strict contract separation. |
| **Scriber** | `docs/components/agents.md` §Scriber dispatch pattern | Utility agent (haiku model). Writes evidence/checkpoint/status artifacts to `.meridian/` whitelist. Runs in background (`run_in_background: true`). |
| **write-evidence skill** | `docs/components/agents.md` §Scriber dispatch pattern | Single chokepoint enforcing `.meridian/` folder whitelist at write boundary. |
| **Whitelist** | `docs/adr/017-folder-whitelist.md`, `docs/components/memory.md` §Folder whitelist | Strict list of allowed folders under `.meridian/`. Enforced by write-evidence skill. |

### 1.4 Reconciliation Concepts (knowledge-extractor domain)

| Concept | Current Definition Location(s) | Notes |
|---------|--------------------------------|-------|
| **Reconciliation** | `core/components/plays/capture-learning/SKILL.md`, `core/components/agents/knowledge-extractor.md` | Comparing context baseline (what prepare-epic knew) against implementation outcomes (what happened) to update product LTM. |
| **Tier** (reconciliation classification) | `core/components/agents/knowledge-extractor.md` §Tier 1, §Tier 2, §Tier 3 | Three-level classification of reconciliation findings. |
| **Tier 1 — Foundational** | `core/components/agents/knowledge-extractor.md` §Step 4 | Check-only; ADR required if foundational artifact changed. Applies to: project-profile, logical/physical-architecture, nfr-spec, quality-vision, design-patterns. |
| **Tier 2 — Enrichment** | `core/components/agents/knowledge-extractor.md` §Step 5 | Update existing product LTM artifacts. Applies to: research/{domain}.md Experiential, epic post_implementation, enriched-capabilities, quality-profile. |
| **Tier 3 — Addition** | `core/components/agents/knowledge-extractor.md` §Step 6 | Create new product LTM artifacts for content with no current home. |
| **Enrichment** | `core/components/agents/knowledge-extractor.md` §ENRICH Mode | The Tier 2 operation: writing approved enrichment content to existing product LTM artifacts. |
| **Mode** (knowledge-extractor) | `core/components/agents/knowledge-extractor.md` §Operating Modes | `ANALYZE` (produce proposals), `ENRICH` (write approved proposals), `FAST` (lightweight post-merge analysis). |
| **ANALYZE mode** | `core/components/agents/knowledge-extractor.md` §ANALYZE Mode | Requires context/ baseline from prepare-epic. Produces tiered reconciliation proposals. |
| **ENRICH mode** | `core/components/agents/knowledge-extractor.md` §ENRICH Mode | Writes approved proposals to product LTM. Requires approved reconciliation-proposals.yaml. |
| **FAST mode** | `core/components/agents/knowledge-extractor.md` §FAST Mode | Post-merge lightweight analysis from PR diff + issue STM only. No context/ required. Max 1–2 proposals. |
| **ADR (Architecture Decision Record)** | `docs/adr/` (all 17 ADRs), `core/components/agents/knowledge-extractor.md` §Tier 1 | Formal record of architectural decisions. Written when Tier 1 artifacts change. |
| **Impact assessment** | `core/components/agents/knowledge-extractor.md` §Step 4 | Required alongside every Tier 1 ADR. Fields: affected_artifacts, affected_epics, risk_level, recommended_action. |
| **Reconciliation proposals** | `core/components/agents/knowledge-extractor.md` §Step 7, `core/components/plays/capture-learning/SKILL.md` §Step 4 | YAML artifact listing tiered findings. Written to `{stm_base}/{issue}/evidence/capture-learning/reconciliation-proposals.yaml`. |
| **Trinity** | `core/components/agents/knowledge-extractor.md` §Step 2 | Implicit term for the implement-epic + validate-epic execution cycle. Referenced as "trinity execution" in the knowledge-extractor. |
| **check-drift** | `core/components/plays/capture-learning/SKILL.md` §Step 2, `core/components/agents/knowledge-extractor.md` §Step 3 | Play that detects spec drift. Its `spec-correction-manifest.yaml` is consumed by knowledge-extractor to avoid re-derivation. |

### 1.5 LTM Resolution Protocol

| Concept | Current Definition Location(s) | Notes |
|---------|--------------------------------|-------|
| **LTM Resolution Protocol (R1–R4)** | `core/components/memory/standards/rules/resolution.md`, `docs/adr/015-ltm-resolution-protocol.md` | Four-step hierarchy for agent domain decisions. R1: identify domains. R2: project LTM. R3: core LTM. R4: LLM fallback. |
| **LOCKED artifact** | `core/components/memory/standards/rules/resolution.md` §R2 | Project-scoped LTM artifact in `ltm_context.locked_artifacts`. Authoritative — stops resolution (no further descent). |
| **DRAFT artifact** | `core/components/memory/standards/rules/resolution.md` §R2 | Advisory only. Descend to next layer for confirmation. |
| **LLM fallback** | `core/components/memory/standards/rules/resolution.md` §R4 | Domain question with no LTM answer. Flagged as `resolved_from: "llm"`. Primary candidate for `learn` play. |
| **ltm_context** | `docs/adr/015-ltm-resolution-protocol.md` §Contract Schema Extension, `docs/adr/016-agent-json-contract.md` | Optional contract field. Fields: `project_base`, `core_base`, `query_domains`, `locked_artifacts`. When present, agent follows R1–R4 |

### 1.6 Play Maturity Model

| Concept | Current Definition Location(s) | Notes |
|---------|--------------------------------|-------|
| **Play maturity levels (L1–L5)** | `docs/adr/013-play-maturity-model.md` | Five levels from "structured non-deterministic" (L1) to "dark factory" (L5). Current target: L2 (compiled, intent-driven). |
| **Level 2 (Compiled, Intent-Driven)** | `docs/adr/013-play-maturity-model.md` §Level 2 | Current operating level. SKILL.md is compiled from intent.yaml by `/create-play`. Hash-locked. Same input → same execution path. |
| **intent.yaml** | `docs/philosophy/architecture.md` §Intent Crafting, all play `reference/intent.yaml` files | The user contract for a play. Contains goal, constraints (C-N), failure conditions (F-N), scenarios (S-N). Authored once; hash-locked in compiled play. |
| **Compiled play** | `docs/adr/013-play-maturity-model.md` §Level 2, CLAUDE.md §Play Pipeline Rules | SKILL.md produced by `/create-play --build` from `reference/intent.yaml`. Never edited directly. |
| **/create-play** | `CLAUDE.md` §Play Pipeline Rules, `core/components/plays/create-play/SKILL.md` | The tool that compiles intent.yaml into a SKILL.md. Workflow: `intent.yaml` → `/create-play --build` → `SKILL.md`. |
| **Workflow structure (A/B/C)** | `core/components/plays/enhance/SKILL.md` §Compilation Metadata, `core/components/plays/ship/SKILL.md` §Role | Classification of compiled play structure. Structure A = full linear with checkpoints. Structure C = chaining sub-plays. |
| **Step eval (SE)** | All play SKILL.md files | Per-step evaluation criterion. Labeled SE-N. |
| **Scenario eval (SCE)** | All play SKILL.md files | End-to-end scenario evaluation. Labeled SCE-N. |

### 1.7 Product Planning Pipeline

| Concept | Current Definition Location(s) | Notes |
|---------|--------------------------------|-------|
| **Capability** | `docs/components/memory.md` §KB Capability Catalog | Product feature unit in the KB. Named `{PREFIX}-F001` (e.g., UM-F001). Part of Domain → Capability → Intent Epic hierarchy. |
| **Domain** (KB) | `docs/components/memory.md` §KB Capability Catalog | Knowledge taxonomy domain. E.g., user-management, commerce, payments. One file per domain in `domain-taxonomy/`. |
| **Intent Epic** | `docs/components/memory.md` §KB Capability Catalog, `core/components/memory/standards/schemas/intent-epic.yaml` | Structured unit of work generated per capability by `specify-product`. Conforms to intent-epic.yaml schema. |
| **Product planning pipeline** | `docs/components/memory.md` §KB Capability Catalog | `specify-product` → `design-exp` → `build-arch`. Stage-centric pipeline. |
| **context bundle** | `docs/philosophy/idsd.md` §IDD → Meridian Mapping | ≤12K token assembled context for skill invocations. Agent's responsibility to assemble. |
| **Blast radius** | `core/components/agents/knowledge-extractor.md` §Step 1, `core/components/plays/enhance/SKILL.md` §Scope Gate | Scope of impact of a change. Documented in `{issue}/context/blast-radius/`. |
| **DRAFT → VALIDATE → LOCKED lifecycle** | `docs/philosophy/idsd.md` §IDD → Meridian Mapping | Artifact state lifecycle in generation-verification loops. |
| **Scope gate** | `core/components/plays/enhance/SKILL.md` §Scope Gate | Enhance play assessment: is this enhancement right-sized? Thresholds: files ≤15, domains ≤2, effort ≤1 day. |

### 1.8 Runtime / Deployment Concepts

| Concept | Current Definition Location(s) | Notes |
|---------|--------------------------------|-------|
| **Global mode** | `CLAUDE.md` §Source of Truth, `AGENTS.md` §Source of Truth | Default deployment. Components go to `~/.claude/` (Claude Code) or `~/.factory/` (Factory Droid). Memory to `~/.meridian/core/memory/`. |
| **Project mode** | `CLAUDE.md` §Source of Truth, `AGENTS.md` §Source of Truth | Ephemeral local deployment (gitignored). Components to `.claude/` or `.factory/`. Memory to `.meridian/core/memory/`. |
| **/sync-claude** | `CLAUDE.md` §Source of Truth | Tool deploying `core/components/` to `~/.claude/` and memory to `~/.meridian/core/memory/`. |
| **/sync-droids** | `AGENTS.md` §Source of Truth | Factory Droid equivalent of /sync-claude. Transforms Claude Code agents to Factory Droid format. |
| **core/grounding/** | `discovery.md` Q&A, Issue body | NEW directory (does not exist yet). For Meridian self-development documents. Distinct from `core/components/` (what gets deployed). |
| **IDD (Intent-Driven Development)** | `docs/philosophy/intent-driven-development.md` | Foundational paradigm. "Intent in → Quality out." Tool-agnostic. |
| **IDSD (Intent-Driven Software Development)** | `docs/philosophy/idsd.md` | Methodology operationalizing IDD in Meridian. "IDD is to IDSD as Agile is to Scrum." |
| **Intent primacy** | `docs/philosophy/architecture.md` §Intent Primacy and Play Evolution | "Intent is primary. Plays are scaffolding." Plays exist for determinism; intent will eventually replace them. |

---

## 2. Existing Definitions

Where concepts are already defined, partial or full.

### Fully defined (single authoritative source):
- **Tether/Vanish**: Both CLAUDE.md and AGENTS.md have identical explicit approval sections.
- **NWWI**: ADR 008 is the single authoritative source.
- **Evidence self-commit**: ADR 012 is the single authoritative source.
- **R1–R4 Resolution Protocol**: `core/components/memory/standards/rules/resolution.md` is the canonical rules file; ADR 015 provides rationale.
- **Commit categorization**: `core/components/memory/standards/rules/commits.md` is the single source.
- **Whitelist**: ADR 017 is the single authoritative source.
- **ADR (Architecture Decision Record)**: defined by example across `docs/adr/` (17 ADRs).

### Partially defined (scattered across multiple sources):
- **Play** — defined in architecture.md, plays.md, ADR 001, ADR 013, ADR 017. Levels retired but not consolidated.
- **LTM / STM** — defined in architecture.md and memory.md but split across Core LTM / Product LTM without a unified entry.
- **KB** — referenced in memory.md, rules/_index.md, but the "KB" acronym is used inconsistently (sometimes "Knowledge Base", sometimes just "knowledge").
- **JSON Contract** — defined in architecture.md and ADR 016, but the canonical schema is only in ADR 016.
- **Context** — overloaded across: context bundle (token budget), Context Crafting (Four Crafts), context baseline (prepare-epic artifact), ltm_context (contract field).
- **Tier** — only defined in knowledge-extractor.md. No top-level documentation.
- **Mode** (ANALYZE/ENRICH/FAST) — only defined in knowledge-extractor.md. No cross-play reference.
- **Trinity** — used informally in knowledge-extractor.md ("trinity execution") but never formally defined.
- **Scriber** — defined in docs/components/agents.md §Scriber dispatch pattern, but not in the agents list in architecture.md.

### Not yet defined (implicit/scattered):
- **grounding** — the concept of `core/grounding/` as a self-development layer. Only in discovery.md Q&A.
- **Trinity** (formal) — referenced in context of implement-epic + validate-epic cycle but never formally defined.
- **Context bundle** (≤12K) — mentioned in idsd.md mapping table but not explained as a standalone concept.
- **FAST mode** — only in knowledge-extractor.md.
- **play-scoped sub-role** — only in docs/components/agents.md.

---

## 3. CLAUDE.md / AGENTS.md Integration Points

Both files have identical structures. The natural integration point is the `## Reference` section at the bottom of each.

### Current `## Reference` section (both files):
```
- `.meridian/core/config.yaml` — Paths and settings
- `docs/adr/` — Architecture Decision Records (8 ADRs)
- `docs/philosophy/` — Core architecture philosophy
- `docs/components/` — Agent, skill, play, memory documentation
```

### Proposed addition to both files:
Add as the FIRST entry in the `## Reference` section (agents read this first):
```
- `core/grounding/glossary.md` — Canonical definitions of every Meridian concept
```

### Rationale:
- Developers working on Meridian internals encounter terms from the first paragraph of the overview section
- Placing it first in `## Reference` signals that it is the primary vocabulary document
- `core/grounding/` is distinct from `core/components/` (deployable) — the directory name communicates this

---

## 4. File Conventions

### Style from `core/components/memory/standards/rules/`:

All rules files follow this consistent pattern:

**Header:**
```
# {Title}

{One-line description of what this file defines}

{Referenced by:} {agent/skill list}
```

**Structure:**
- H2 sections for each major topic
- Tables with `|` format for structured data (3 columns typical: concept | definition | notes/examples)
- Code blocks for examples, YAML, JSON
- "Related" section at end with cross-references

**Table format:**
```markdown
| Concept | Definition | Examples / Notes |
|---------|------------|-----------------|
```

**Example from resolution.md:**
- No frontmatter
- Plain H1 title
- Short description + consumers
- H2 sections numbered (R1, R2, etc.)
- Code blocks for schemas
- Formal language (definitive statements, not advisory)

**Example from commits.md:**
- No frontmatter
- H1 title
- Short intro + consumers
- H2 numbered parts (Part 1, Part 2, Part 3)
- Tables throughout with ID / Priority / Item / Verification columns
- "Related" section at end

### Glossary-specific conventions to adopt:

The `core/grounding/glossary.md` file should:
1. Use **H2 sections** organized by concept group (matching the issue body's listed groups)
2. Use **definition tables** with columns: `Concept | Definition | Examples | Relationships | Anti-definition`
3. No frontmatter (grounding files are not deployed; no YAML header needed)
4. Cross-reference format: `see: {ConceptName}` in the Relationships column
5. Anti-definitions use format: "NOT: {common conflation}" — matching the issue body requirement
6. No "to be expanded" stubs — per Q&A, the glossary must be exhaustive at creation

---

## 5. Key File Paths

### Files to create:
| File | Action | Why |
|------|--------|-----|
| `core/grounding/glossary.md` | **Create** | The glossary itself. New file in new directory. |

### Files to modify:
| File | Change | Location in file |
|------|--------|-----------------|
| `CLAUDE.md` | Add `- \`core/grounding/glossary.md\` — Canonical definitions of every Meridian concept` | `## Reference` section, first entry |
| `AGENTS.md` | Same addition as CLAUDE.md | `## Reference` section, first entry |

### Files NOT to modify (scope boundary):
- `core/components/memory/standards/rules/` — glossary is NOT a rules file (it's grounding, not enforcement)
- `docs/adr/` — no new ADR needed (this is a grounding document, not an architectural decision)
- `docs/philosophy/` — these define concepts for external readers; glossary is for internal Meridian developers
- Any deployed component (agents, skills, plays) — grounding is self-development tooling, not runtime

---

## 6. Concept Groups for Glossary Structure

Recommended H2 organization for `glossary.md`, matching the issue body's enumeration:

1. **Three-Layer Hierarchy** — play, agent, skill (including sub-types)
2. **Memory Architecture** — LTM, STM, KB, Core LTM, Product LTM, context baseline, evidence, resolution trace
3. **Execution Model** — JSON contract, Four Crafts, checkpoint, Tether/Vanish, agent-first, NWWI
4. **Reconciliation** — tiers (1/2/3), ANALYZE/ENRICH/FAST modes, trinity, enrichment, reconciliation proposals
5. **Protocols** — R1–R4 resolution, recovery protocol, structured failure, LOCKED/DRAFT authority
6. **Play Compilation** — intent.yaml, compiled play, step eval, scenario eval, workflow structures
7. **Self-Development** — grounding (core/grounding/), IDD, IDSD, intent primacy

---

## 7. Key Cross-Cutting Findings

1. **"Context" is the most overloaded term in the codebase** — it means: (a) context bundle (≤12K tokens), (b) Context Crafting (Four Crafts step), (c) context baseline (prepare-epic snapshot in `{issue}/context/`), and (d) `ltm_context` (contract field). The glossary must disambiguate all four explicitly.

2. **"Tier" has two distinct meanings** — (a) reconciliation tier (Tier 1/2/3 in knowledge-extractor) and (b) audience separation tier in context bundles (mentioned in idsd.md). These must not be conflated.

3. **"Knowledge" vs "KB" vs "Core LTM"** — used interchangeably in some places but they refer to different things: KB = capability catalog in domain-taxonomy; Core LTM = the entire `~/.meridian/core/memory/` tree; Knowledge (LTM sub-category) = the `knowledge/` folder within Core LTM.

4. **"Trinity" is never formally defined** — it appears in knowledge-extractor.md as "trinity execution" but is not defined anywhere as a standalone concept. The glossary is the first place to formally define it as the implement-epic → validate-epic execution cycle.

5. **Play levels (L1/L2) are transitional** — per ADR 017 they are retired, but they appear in older ADRs (001, 002, 003). The glossary should define them as historical context with a "superseded by" note.
