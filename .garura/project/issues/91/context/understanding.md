# Context Assembly — Issue #91

## 1. Current State of 7 Target Files

### docs/components/agents.md
**Status:** Mostly current but incomplete roster and stale paths.
- Lists 7 agents (out of 19 in codebase): code-builder, feature-steward, project-orchestrator, repo-orchestrator, tech-architect, tech-designer, scriber
- JSON contract mode documented correctly with nested input/output shape
- Scriber dispatch pattern present (ADR 214.1)
- Four Crafts reference present
- **Defect:** Uses `.meridian/` paths throughout — should be `.garura/`
- **Defect:** Missing 12 agents from roster: designer, doc-builder, engineering-manager, eval-generator, intent-crafter, intent-resolver, judge, knowledge-extractor, market-analyst, product-keeper, quality-auditor, test-engineer

### docs/components/recipes.md
**Status:** Does not exist. Already renamed to `docs/components/plays.md`.
- No redirect stub needed — source filename does not exist

### docs/components/skills.md
**Status:** Stale roster but good structure.
- Lists 8 skills across 4 categories — actual codebase has 46 skills
- Available Plays section lists 16 plays — actual codebase has 22 plays
- **Defect:** Uses `.meridian/` paths
- Structure, naming conventions, invocation pattern, model selection rules are current

### docs/philosophy/architecture.md
**Status:** Structurally current but has critical stale details.
- Has Four Crafts section (good)
- JSON contract documented but uses **OLD FLAT shape**: `stm.vision_path`, `stm.epics_path` etc.
  - Actual plays use nested `stm.input` / `stm.output` shape
- **Defect:** Uses `.meridian/` paths
- **Defect:** Lists quality-validator and workflow-guardian as "Planned" agents — neither exists in `core/components/agents/`
- **Defect:** Memory flow diagram references skills as LTM destination (stale pre-ADR-009)

### docs/framework/recipe-structure.md
**Status:** Does not exist. Already renamed to `docs/framework/play-structure.md`.
- No redirect stub needed — source filename does not exist

### docs/components/memory.md
**Status:** Good LTM structure, stale STM structure and paths.
- LTM organization section current
- **Defect:** Uses `.meridian/` paths throughout
- **Defect:** STM Organization section shows old subfolder names: `spec/`, `design/`, `delivery/`
  - Per config.yaml and ADR 017, correct keys are: `specs/`, `evidence/`, `checkpoint/`, `context/`, `review/`
- Missing: `templates/` subdirectory under `standards/` in LTM org diagram

### docs/philosophy/idsd.md
**Status:** Mostly current, minor stale details.
- Correctly states "19 Agents"
- Has both JSON contract pattern AND YAML context bundle pattern (valid — two patterns coexist)
- **Defect:** Uses `.meridian/` paths
- Agent taxonomy table is broadly correct; agents like tech-architect, designer, quality-auditor, judge, eval-generator exist in codebase

---

## 2. Canonical Agent List (19 agents from `core/components/agents/`)

| Agent | Description |
|-------|-------------|
| code-builder | Implementation agent |
| designer | UX/design agent |
| doc-builder | Documentation agent |
| engineering-manager | Engineering management agent |
| eval-generator | Eval generation agent |
| feature-steward | Feature specification and verification agent |
| intent-crafter | Intent crafting agent |
| intent-resolver | Intent resolution agent |
| judge | Evaluation judging agent |
| knowledge-extractor | Knowledge extraction agent |
| market-analyst | Market analysis agent |
| product-keeper | Product management agent |
| project-orchestrator | Project orchestration agent |
| quality-auditor | Quality audit agent |
| repo-orchestrator | Repository operations agent |
| scriber | Utility agent (haiku) — writes .garura/ artifacts |
| tech-architect | Technical architecture agent |
| tech-designer | Technical design and RCA agent |
| test-engineer | Test engineering agent |

---

## 3. Canonical Skills List (46 skills from `core/components/skills/`)

| Skill | Category |
|-------|----------|
| analyze-changes | Repository Operations |
| analyze-pr | Repository Operations |
| archive-issue-stm | Project Management |
| assess-market-opportunity | Product/Strategy |
| build-quality-gate | Quality |
| capture-issue | Project Management |
| check-brief-quality | Product/Strategy |
| configure-capabilities | Product/Strategy |
| create-commit | Repository Operations |
| derive-epics | Product/Strategy |
| derive-nfr-spec | Architecture |
| derive-quality-vision | Architecture |
| distill | Knowledge |
| draft-architecture | Architecture |
| draft-implementation-plan | Feature/Implementation Design |
| draft-lld | Feature/Implementation Design |
| draft-product-spec | Feature/Implementation Design |
| draft-technical-approach | Feature/Implementation Design |
| draft-verification-scenarios | Feature/Implementation Design |
| evaluate-scope | Product/Strategy |
| execute-test-suite | Testing |
| generate-brief | Product/Strategy |
| generate-market-brief | Product/Strategy |
| generate-project-profile | Product/Strategy |
| generate-quality-profile | Product/Strategy |
| manage-issue | Project Management |
| plan-experience | UX/Design |
| plan-mvp | Product/Strategy |
| read-issue | Project Management |
| refine-scope | Product/Strategy |
| research-domain-context | Feature/Implementation Design |
| research-market | Product/Strategy |
| resolve-domain | Product/Strategy |
| resolve-ltm-context | Knowledge |
| scope-capabilities | Product/Strategy |
| setup-branch | Repository Operations |
| submit-pr | Repository Operations |
| sync-claude | Meta-Utility |
| validate-epic-design | Quality |
| validate-implementation-design | Feature/Implementation Design |
| validate-kb-extension | Knowledge |
| validate-scope | Product/Strategy |
| wire-ltm-context | Knowledge |
| write-evidence | Project Management |
| write-implementation | Coding |
| write-tests | Testing |

---

## 4. Canonical Plays List (22 plays from `core/components/plays/`)

| Play | Pattern | Purpose |
|------|---------|---------|
| briefs | Linear | Regenerate HTML briefs from product YAML artifacts |
| build-arch | Task-Driven | Build architecture artifacts (logical, physical, NFR, quality) |
| capture | Linear | Capture any issue type as a labeled GitHub Issue |
| capture-learning | Linear | Capture learnings to LTM |
| check-drift | Linear | Check for drift between docs and codebase |
| commit-code | Linear | Commit changes grouped by concern |
| create-play | Task-Driven | Compile a new play from an intent.yaml |
| create-pr | Linear | Create a pull request with review checklist |
| design-exp | Task-Driven | Design experience artifacts |
| distill | Task-Driven | Distill knowledge into LTM |
| enhance | Task-Driven | RCA-driven enhancement — traces root cause, designs fix, ships |
| fix-it | Task-Driven | RCA-driven defect resolution |
| implement-epic | Task-Driven | Implement a feature through eval-driven TDD loop |
| merge-pr | Linear | Merge a pull request and clean up |
| prepare-epic | Task-Driven | Produce implementation-ready design artifacts |
| report-issue | Linear | DEPRECATED — alias for capture |
| review-pr | Linear | Diff-scoped quality review for a pull request |
| ship | Linear (chains) | Deliver branch work — commit, PR, review, merge |
| specify-product | Task-Driven | Specify product from brief through scope |
| start-feature | Linear | Start a new feature branch from an issue |
| start-feature-planning | Linear | Plan a feature before implementation |
| validate-epic | Task-Driven | Cross-validate epic design artifacts |

---

## 5. Four Crafts — Definition and Evidence

The Four Crafts architecture is documented in `docs/philosophy/architecture.md` and referenced in `docs/components/agents.md` and `docs/components/plays.md`.

| Craft | What | Where |
|-------|------|-------|
| **Intent Crafting** | Define the goal, constraints, and failure conditions | `reference/intent.yaml` |
| **Prompt Crafting** | Pass the JSON contract (task-driven) or play context block (linear) as the agent prompt | `SKILL.md` workflow steps |
| **Context Crafting** | Agents collect LTM templates and STM artifact paths to ground their work | Inside agent definitions |
| **Spec Crafting** | Skills fill templates with structured content to produce artifacts | Inside skill definitions |

**Evidence sources:**
- `docs/components/plays.md` — "Four Crafts" section with table above
- `docs/components/agents.md` — "JSON Contract Mode" section references Context Crafting step
- `core/components/plays/enhance/reference/intent.yaml` — intent.yaml constraint C20: "Intent Crafting: The intent.yaml must define success precisely enough..."
- `core/grounding/glossary.md` — Section "Play Compilation" defines each craft

---

## 6. Canonical JSON Contract — Extracted from `core/components/plays/enhance/SKILL.md` Step 4

This is the **nested input/output shape** used by task-driven plays. This is the correct shape; architecture.md's flat shape (`stm.vision_path`, `stm.epics_path`) is stale.

```json
{
  "intent_path": "core/components/plays/enhance/reference/intent.yaml",
  "stm_base": "{stm_base}",
  "stm": {
    "input": {
      "discovery": "{stm_base}/{issue}/evidence/enhance/discovery.md",
      "issue_read": "{stm_base}/{issue}/evidence/enhance/issue-read.yaml"
    },
    "output": {
      "context_path": "{stm_base}/{issue}/context/understanding.md"
    }
  },
  "ltm_context": {
    "product_base": "{product_base}",
    "core_base": "~/.garura/core/memory/"
  },
  "task_id": "context-assembly"
}
```

**Core fields per `core/grounding/glossary.md`:**
- `intent_path` — path to intent.yaml (play-owned, read by agents)
- `stm_base` — base path for all STM artifacts
- `stm.input` — paths to input artifacts (populated by play at initialization)
- `stm.output` — paths to output artifacts (populated by agent after producing them)
- `task_id` — identifies which task the agent is executing
- `notes` — short findings from agent (max 3, 1 sentence each)
- `step_failure` — non-null only when agent cannot recover

**Path convention:** `core_base` uses `~/.garura/core/memory/` — NOT `~/.meridian/core/memory/`

---

## 7. Memory Structure

### LTM Source (authoring, `core/components/memory/`)

```
core/components/memory/
├── standards/
│   ├── _index.md
│   ├── rules/          # 11 files: architecture, commits, design, epics, features,
│   │                   #   git, kb-extension, pr, product, resolution, scenarios
│   ├── schemas/        # 5 files: intent-epic.yaml, intent.yaml,
│   │                   #   mvp-recommendation.yaml, pr-findings.yaml, screen-inventory.yaml
│   └── templates/      # 10 files: approval-prompt, checkpoint, commit-message,
│                       #   delivery-report, evidence-file, github-issue,
│                       #   issue-comment-rca-approved, knowledge-file, pr-body,
│                       #   pr-review-comment
└── knowledge/
    ├── _index.md
    ├── arch/           # agentic, data, operations, patterns, platforms, stacks
    ├── domain/         # 5 domain files + _cross-tree-constraints.yaml
    ├── product/        # nfr-profile, product-profile, quality-profile
    └── quality/        # arch, backend, code, data, documentation, frontend,
                        #   operations, performance, security, tech-debt, testing
```

### LTM Runtime Location
- Global mode (default): `~/.garura/core/memory/`
- Project mode: `.garura/core/memory/`

### STM Structure (from `.garura/core/config.yaml`)
```
.garura/project/issues/{N}/
├── specs/          # plans and specifications
├── evidence/       # per-play evidence: evidence/{play-name}/{YYYYMMDD-HHMMSS}.md
├── checkpoint/     # per-play checkpoints: checkpoint/{play-name}/{YYYYMMDD-HHMMSS}.md
├── context/        # prepare-epic / build-arch context artifacts
└── review/         # review artifacts
```

**Critical:** Old docs show `spec/`, `design/`, `delivery/` — these are WRONG. Config.yaml and ADR 017 define exactly 5 keys: `specs`, `evidence`, `checkpoint`, `context`, `review`.

---

## 8. Additional Stale Docs (Beyond the 7 Target Files)

### docs/components/plays.md (already-renamed target)
- **Stale:** JSON contract section uses old flat `stm.*` shape
- **Stale:** Uses `.meridian/` paths
- **In scope:** This IS one of the target files (was recipes.md, now plays.md) — no redirect stub needed since recipes.md doesn't exist

### docs/framework/play-structure.md (already-renamed target)
- **Stale:** Uses `.meridian/` paths in examples
- **In scope:** This IS one of the target files (was recipe-structure.md) — no redirect stub needed since recipe-structure.md doesn't exist

### docs/adr/ — ADR files referencing "recipes"
- ADRs 004-008 may contain "recipe" terminology — scan during rewrite pass
- Not primary targets but fix-in-place if encountered (per Q2 resolution)

### docs/philosophy/architecture.md — Agent List Defect
- Lists `quality-validator` and `workflow-guardian` as "Planned" agents
- Neither exists in `core/components/agents/` — these are phantom entries
- Must be removed or replaced with agents that exist

---

## 9. Cross-Cutting Conventions

### Path Convention (HIGHEST PRIORITY)
**All documentation uses `.meridian/` throughout, but the project uses `.garura/`.**

Every file being rewritten must:
- Replace `.meridian/project/issues/` → `.garura/project/issues/`
- Replace `~/.meridian/core/memory/` → `~/.garura/core/memory/`
- Replace `.meridian/core/` → `.garura/core/`
- Replace `.meridian/product/` → `.garura/product/`

Source of truth: `.garura/core/config.yaml` — all path keys under `stm:`, `ltm:`, `product:` use `.garura/`.

### JSON Contract Shape
- **Correct:** Nested `stm.input` / `stm.output` (from enhance/SKILL.md, prepare-epic/SKILL.md)
- **Wrong:** Flat `stm.vision_path`, `stm.epics_path` (in architecture.md)

### STM Folder Names
- **Correct:** `specs/`, `evidence/`, `checkpoint/`, `context/`, `review/`
- **Wrong:** `spec/`, `design/`, `delivery/` (in memory.md)

### Redirect Stubs
Discovery Q1 resolution said to create redirect stubs at old filenames. However:
- `docs/components/recipes.md` does not exist
- `docs/framework/recipe-structure.md` does not exist
- `docs/components/plays.md` exists (renamed target)
- `docs/framework/play-structure.md` exists (renamed target)
**Conclusion:** No redirect stubs needed. The renamed files are the actual targets.

### Agent Count
- discovery.md references "1 of 5 agents" and "10 of 18+ skills" — these numbers are wrong
- Actual: 19 agents, 46 skills, 22 plays

### Markdown Conventions (from docs/components/agents.md as reference doc)
- H1 for doc title, H2 for top-level sections, H3 for subsections
- Tables for structured comparisons (principle/description, field/purpose)
- Code blocks for directory structures, JSON/YAML examples, command-line patterns
- ADR references as inline links: `[ADR NNN: Title](../adr/NNN-slug.md)`
- "NEVER/ALWAYS" constraint pairs in tables or code blocks

---

## Integration Points

- **agents.md → plays.md:** Agents section references "JSON Contract Mode" — must be consistent with plays.md contract shape
- **plays.md → skills.md:** Play contract's `stm.output` paths become inputs to subsequent agents — skills.md must list skills that match the actual play ecosystem
- **memory.md → agents.md:** LTM access pattern in memory.md must match Context Crafting step described in agents.md
- **architecture.md → all:** JSON contract example in architecture.md is the authoritative cross-reference — must match nested shape used in actual plays
- **idsd.md:** Agent count (19) must match agents.md roster; both play patterns must be described
