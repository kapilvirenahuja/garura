# Spec: prepare-implementation TDD-First Redesign

**Issues:** #183 (soft inputs), #184 (LLD-level artifacts)
**Branch:** fix/183-prepare-implementation-soft-inputs
**Date:** 2026-03-31
**Updated:** 2026-04-01 (v2 — inconsistency fixes applied)

## Problem

prepare-implementation is the heavyweight preparation play — the entry point for all serious development work. If this play gets context right, implement-epic becomes mechanical execution.

Today it has three critical flaws:

1. **Hard-halts on missing upstream artifacts** — Requires locked product.yaml, roadmap.yaml, architecture.yaml, quality-standards.yaml. This blocks brownfield projects and any project that hasn't run the full upstream pipeline. This is SDD behavior — IDD should never halt the user when context can be derived.

2. **Shallow context resolution** — Scans for "what frameworks exist" but doesn't understand the system deeply enough to know what the proposed change will break. The codebase scan finds libraries and ports but misses semantic relationships between components, design patterns, logical architecture.

3. **High-level output** — Produces features.yaml, tech.yaml, scenarios.yaml, plan.yaml at component-level abstraction. Missing: task-level DAG, file-level change specifications, code templates, interface before/after diffs. The implementation agent gets "what to build" but not "exactly how to change each file."

## Design Philosophy

**The system is specified by its tests.** To prepare for implementation, you must first understand the system — and the most precise specification of system behavior is its test suite. Tests define contracts, boundary conditions, error paths, and integration points. A codebase scan tells you what frameworks exist; tests tell you what the system actually does.

**Blast radius through test impact.** The completeness signal isn't "did I find all the libraries?" — it's "do I know every test that would break if I make this change?" If the answer is yes, the context is complete. If any impacted code has no test coverage, that's a gap that must be filled before changes are planned.

**TDD-first preparation.** Before planning what to change, ensure the current behavior is fully tested in the impact zone. Baseline tests establish the contract. Only then can you plan changes with confidence that you know what "working" looks like.

**Implementation should be mechanical.** If prepare-implementation does its job, the implementation agent executes a task DAG where each task specifies exact files, exact changes, exact assertions. No codebase scanning, no LTM reading, no design decisions at build time.

**Never halt the user.** IDD is about helping users, not blocking them. When upstream artifacts are missing, derive what you can, discover what you must, and work with the user to fill genuine gaps. Halting is SDD behavior.

**Architecture and quality are essential context.** While product.yaml and roadmap.yaml are nice-to-have, architecture.yaml and quality-standards.yaml represent critical context. When they don't exist as locked artifacts, the play must discover/infer this information from the codebase and work with the user to establish it — not skip it.

## Pipeline Position

```
One-time setup (done once per project):
  /discover-product → /plan-roadmap → /prepare-architecture

Per-feature (lightweight — small bugs, high confidence):
  /start-feature-planning → /implement-epic

Per-feature (heavyweight — full context, blast radius, TDD):
  /prepare-implementation → /implement-epic
```

prepare-implementation is the heavyweight path. start-feature-planning is the lightweight alternative for changes where the blast radius is obviously small and the developer is confident.

## Entry Resolution

The play accepts work from multiple sources — no single entry point is required:

| Source | Detection | Resolution |
|--------|-----------|------------|
| `--epic E1` | Explicit flag | Epic from locked roadmap → full dependency chain applies |
| Issue from branch | Branch name `feat/183-...` → #183 | Issue body + linked specs define the work |
| Issue from STM | `{stm_base}/{issue}/` exists | Same as above |
| None | No epic, no issue | **HALT** — nothing to scope the work against |

When an epic is provided AND a roadmap exists, the full dependency chain (C15) applies.
When only an issue is provided, the issue body defines the scope. No roadmap dependency enforcement.
Both paths converge on the same downstream flow after entry resolution.

## Context Resolution (Replaces Hard-Halt Pre-Flight)

For each upstream artifact, follow the resolution hierarchy:

```
Locked artifact exists? → READ (authoritative, confidence: locked)
    ↓ no
Project LTM has relevant knowledge? → READ (advisory, confidence: ltm)
    ↓ no  
Codebase reveals the information? → DERIVE (confidence: derived)
    ↓ no
Mark as gap → address via user interview with targeted questions
```

### Product + Roadmap (nice-to-have)

| Artifact | What it provides | Derivation source when missing |
|----------|-----------------|-------------------------------|
| product.yaml | Strategic goals, users, scope | Issue body, repo README, prior epic features.yaml |
| roadmap.yaml | Epic ordering, depends_on | Issue body IS the epic. No ordering needed for single-issue work |

When missing, the play proceeds with what's available. No discovery session needed.

### Architecture + Quality (essential — discover if missing)

| Artifact | What it provides | When missing |
|----------|-----------------|-------------|
| architecture.yaml | Tech selections, platforms, design patterns, logical architecture | **Must be discovered.** Codebase scan + LTM + user interview to establish. Play works with user to build this understanding before proceeding. |
| quality-standards.yaml | QP levels, testing, CI/CD, coverage | **Must be discovered.** Toolchain detection + LTM + user interview to establish quality gates. |

When architecture.yaml or quality-standards.yaml are missing, the play doesn't halt — but it doesn't skip either. It enters a **discovery mode** where it derives what it can from the codebase and works with the user to fill gaps. The goal is that by the end of context resolution, the play has equivalent understanding to what these files would have provided.

Output: `{stm_base}/{issue}/evidence/prepare-implementation/context-assembly.yaml`

## Data Collection Architecture

**Play orchestrates, agents collect, STM stores, paths flow.**

Sub-agents cannot call other sub-agents. Therefore, the play is responsible for:
1. Dispatching each data collection agent in parallel where possible
2. Receiving output paths from each agent
3. Storing all collected data in STM on disk
4. Passing STM paths to downstream agents that need the data

```
Play dispatches in parallel:
  ├── tech-architect agent → STM: architecture-inference.md
  ├── test-engineer agent → STM: test-surface.yaml
  ├── tech-architect agent → STM: dependency-graph.yaml
  └── git-historian → STM: commit-history-analysis.md
      
Play collects all STM paths, passes to next phase:
  └── tech-architect agent (blast radius) ← reads all STM paths
```

All work is issue-mapped. Even when working on an epic, there must be an issue (via /start-feature). All intermediate data lives in `{stm_base}/{issue}/evidence/prepare-implementation/`. There is no `{epic_base}` path — the play always uses `{stm_base}/{issue}/`.

## Phase 1: Codebase Understanding (Deep Scan)

This is NOT "find what frameworks exist." This is "understand the system."

All Phase 1 steps can run in parallel — they're independent data collection tasks orchestrated by the play.

### Step 1A — Architecture Inference
**Agent: tech-architect** (new agent — tech-designer continues for other plays)

Read the codebase to understand:
- Module/package structure and boundaries
- Service definitions (entry points, ports, configs)
- Data flow: who calls whom, how data moves between modules
- External dependencies: APIs, databases, message queues, file systems
- Configuration layers: env files, config objects, feature flags
- **Design patterns in use** (MVC, CQRS, event-driven, repository pattern, etc.)
- **Framework conventions** (Spring Boot structure, Next.js app router vs pages, Express middleware chain, etc.)
- **Logical architecture** — how the system is structured conceptually, not just physically
- **Low-level design patterns** — dependency injection, error handling strategy, logging approach, state management

Output: `architecture-inference.md` (rich markdown with diagrams/sketches) + `architecture-inference.yaml` (contract fields for downstream agents)

The MD file is the primary artifact — it captures the nuanced understanding that YAML can't express. The YAML is the machine-readable contract that other agents consume.

### Step 1B — Test Surface Mapping
**Agent: test-engineer** (separate from tech-architect — testing is its own domain)

Identify ALL test files and what they cover:
```yaml
test_surface:
  summary:
    total_test_files: N
    total_test_cases: N
    frameworks: ["jest", "pytest", ...]
    types:
      unit: N
      integration: N
      e2e: N
  
  tests:
    - file: "src/auth/__tests__/middleware.test.ts"
      type: unit
      framework: jest
      subjects:
        - file: "src/auth/middleware.ts"
          functions: ["validateToken", "refreshToken"]
          assertions:
            - "returns 401 for expired tokens"
            - "returns 403 for invalid scope"
            - "refreshes token when within refresh window"
      fixtures: ["mock-jwt-provider"]
      
    - file: "tests/integration/auth-flow.test.ts"
      type: integration
      subjects:
        - flow: "login → token → protected-resource"
          services: ["auth-service", "api-gateway"]
```

Output: `test-surface.yaml`

### Step 1C — Dependency Graph
**Agent: tech-architect**

Build a dependency graph of the codebase:
- File A imports File B → A depends on B
- Module X calls Module Y's API → X depends on Y
- Service P sends messages to Service Q → P depends on Q

Output: `dependency-graph.yaml` + `dependency-graph.md` (visual representation)

### Step 1D — Git History Analysis (NEW — parallel with 1A-1C)
**Agent: tech-architect**

Read git commit history to understand:
- What areas of the codebase change together (co-change analysis)
- Recent changes that might be relevant to the current issue
- Who has been working on what (knowledge distribution)
- Commit message patterns that reveal design intent
- PR descriptions and review comments (if accessible)

```yaml
git_history:
  relevant_commits:
    - sha: "abc123"
      message: "feat(auth): add token refresh with sliding window"
      date: "2026-03-15"
      files_changed: ["src/auth/middleware.ts", "src/auth/token-store.ts"]
      relevance: "Directly related — auth middleware is in our change surface"
  
  co_change_patterns:
    - files: ["src/auth/middleware.ts", "src/auth/config.ts", "tests/auth/middleware.test.ts"]
      frequency: 8  # changed together 8 times
      implication: "These files are tightly coupled — changing one likely requires changing others"
  
  recent_activity:
    - area: "src/auth/"
      last_modified: "2026-03-28"
      commits_last_30_days: 12
      primary_contributors: ["alice", "bob"]
```

Output: `commit-history-analysis.md` + `commit-history-analysis.yaml`

Good commit history is a treasure trove — it reveals intent, coupling patterns, and recent context that static analysis misses.

### Step 1E — LTM Consultation
**Agent: tech-architect**

Read LTM at `~/.Garura/core/memory/` for:
- Architectural standards and decisions
- Implementation patterns and conventions
- Prior learnings from related work
- Quality standards and testing patterns

Output: `ltm-findings.yaml`

## Phase 2: Test-Driven Blast Radius Analysis

This is the core innovation. Given the issue/epic + codebase understanding, determine exactly what's impacted.

### Step 2A — Change Surface Identification
**Agent: tech-architect**

Given the issue description + all Phase 1 outputs (paths passed by play):
- What files need to change? (CREATE / MODIFY / DELETE)
- What functions/methods/classes are affected?
- What interfaces change? (function signatures, API contracts, data schemas)
- What data models change?
- Co-change patterns from git history → additional files likely affected

```yaml
change_surface:
  issue: 183
  description: "Remove hard-halt on missing upstream artifacts in prepare-implementation"
  
  files:
    - path: "core/components/plays/prepare-implementation/reference/intent.yaml"
      action: MODIFY
      what_changes: "Constraints C1, C14, C15, C21, C22 — remove hard-halt, add resolution hierarchy"
      confidence: high
      source: "direct — this is the intent file for the play being changed"
      
    - path: "core/components/agents/tech-designer.md"
      action: MODIFY
      what_changes: "Expand codebase understanding capabilities"
      confidence: high
      source: "dependency graph — agent is dispatched by the play"
      
    - path: "core/components/agents/quality-auditor.md"
      action: MODIFY
      what_changes: "May need test surface mapping capabilities"
      confidence: medium
      source: "co-change pattern — quality-auditor changed with prepare-implementation 4 times"
  
  interfaces_changed:
    - name: "prepare-implementation pre-flight contract"
      before: "Hard-halt on missing product.yaml, roadmap.yaml, architecture.yaml, quality-standards.yaml"
      after: "Resolution hierarchy — derive from available sources, no halt"
      
  data_models_changed: []
```

Output: `change-surface.yaml`

### Step 2B — Blast Radius Computation
**Agent: test-engineer**

Intersect change surface with test surface using the dependency graph:

```yaml
blast_radius:
  directly_impacted:
    - test_file: "tests/plays/prepare-implementation.test.ts"
      test_name: "halts on missing product.yaml"
      tests_what: "Pre-flight hard-halt behavior"
      would_break: true
      reason: "We are removing this hard-halt"
      action: "MODIFY test to expect resolution hierarchy instead of halt"
      
  transitively_impacted:
    - test_file: "tests/integration/pipeline-flow.test.ts"
      test_name: "full pipeline produces locked artifacts"
      dependency_chain: "pipeline-flow → prepare-implementation → pre-flight"
      would_break: false
      reason: "Test provides all upstream artifacts — resolution still finds them"
      action: "KEEP as-is — regression safety net"

  coverage_gaps:
    - file: "core/components/plays/prepare-implementation/SKILL.md"
      area: "Context resolution from codebase scan"
      current_behavior: "Not tested — pre-flight halts before reaching this path"
      risk: high
      baseline_test_needed: true
      
  regression_surface:
    - test_file: "tests/plays/prepare-implementation.test.ts"
      test_name: "produces locked artifacts from epic"
      risk_level: low
      reason: "Epic path unchanged — should still pass"

  summary:
    total_tests_impacted: N
    tests_that_would_break: N
    coverage_gaps: N
    regression_risk: "low|medium|high"
    baseline_tests_needed: N
```

Output: `blast-radius.yaml`

### Step 2C — Baseline Test Specification
**Agent: test-engineer** (testing is test-engineer's domain, not tech-architect's)

For each coverage gap where `baseline_test_needed: true`:

```yaml
baseline_tests:
  - id: BT-001
    coverage_gap_ref: "context-resolution-from-scan"
    target:
      file: "core/components/plays/prepare-implementation/SKILL.md"
      area: "Context resolution when architecture.yaml missing"
    current_behavior: |
      Play halts with "Hard halt — run /prepare-architecture first"
    test_spec:
      type: "integration"
      setup: |
        - Create a project with package.json (express 4.18, jest 29)
        - Create jest.config.js with coverage settings
        - Do NOT create architecture.yaml
      action: |
        - Invoke prepare-implementation context resolution
      assert: |
        - Play does NOT halt
        - context-assembly.yaml has architecture.status = "derived"
        - architecture section includes express 4.18 from package.json
    priority: high
    reason: "Core new behavior — must be tested before we can plan changes"
```

Output: `baseline-tests.yaml`

**Completeness signal:** When every code path in the change surface has either:
- An existing test that we understand, OR
- A new baseline test specified in baseline-tests.yaml

Then the blast radius is fully characterized. **This is when we know we've covered everything.**

### Checkpoint: Blast Radius Approval

Present to user:
```markdown
## Blast Radius — #{issue}: {title}

**Change surface:** N files (N create, N modify, N delete)
**Tests impacted:** N direct, N transitive
**Tests that would break:** N
**Coverage gaps:** N (baseline tests specified)
**Regression risk:** low/medium/high

### Tests That Would Break
| Test | What it tests | Why it breaks | Proposed action |
|------|--------------|---------------|-----------------|
| ... | ... | ... | MODIFY/DELETE/KEEP |

### Coverage Gaps (Baseline Tests Needed)
| Gap | Area | Baseline Test | Priority |
|-----|------|--------------|----------|
| ... | ... | BT-001 | high |

---
Type **Tether** to approve blast radius and proceed to design.
Type **Vanish** to halt.
Type **Orbit** with feedback to revise change surface.
```

## Phase 3: Design Artifacts (Enhanced)

After blast radius approval, produce the design artifacts. Format principle: **YAML for contract (machine-readable), MD for rich content (human-readable with diagrams).**

### features.yaml + features.md
- Product behaviors and invariants — same as today
- Informed by deep codebase understanding
- For brownfield: features describe the CHANGE, not the entire product

### tech.yaml + tech.md (enhanced — LLD-level)
**Agent: tech-architect** (architecture and LLD are tech-architect's domain)

New sections beyond current:
```yaml
# Current sections remain: project_structure, libraries, data_models, components, feature_mapping

# NEW: File-level change specifications
file_changes:
  - path: "src/auth/middleware.ts"
    action: MODIFY
    changes:
      - location: "validateToken function, line 42-58"
        before: |
          if (!config.auth.provider) {
            throw new Error('Auth provider not configured');
          }
        after: |
          const provider = config.auth.provider ?? inferProvider(codebaseContext);
          if (!provider) {
            logger.warn('No auth provider configured or inferred');
            return fallbackAuth(req);
          }
        reason: "Replace hard-halt with resolution hierarchy"
        
  - path: "src/auth/inference.ts"
    action: CREATE
    template: |
      export function inferProvider(context: CodebaseContext): AuthProvider | null {
        // Resolution: package.json deps → env files → LTM patterns → null
      }
    reason: "New file for resolution hierarchy"

# NEW: Interface changes (before/after)
interface_changes:
  - name: "prepareImplementation config"
    before:
      signature: "function validatePreFlight(config: StrictConfig): void"
      behavior: "Throws on missing upstream artifacts"
    after:
      signature: "function resolveContext(config: FlexibleConfig): ContextAssembly"
      behavior: "Returns assembled context, never throws for missing artifacts"
```

The `tech.md` companion contains:
- Logical architecture diagrams
- Design pattern explanations
- Data flow sketches
- Component interaction diagrams
- Anything that doesn't fit in YAML

### scenarios.yaml (enhanced — three tiers)
**Agent: test-engineer** (scenarios are verification — test-engineer's domain)

```yaml
# Tier 1: Baseline scenarios (from blast radius Phase 2C)
baseline_scenarios:
  - id: BS-001
    source: "BT-001"
    description: "Current pre-flight halts on missing architecture.yaml"
    expected_behavior: "Play throws hard-halt error"
    pass_criteria: "Error message contains 'run /prepare-architecture first'"
    automation: automated
    
# Tier 2: New scenarios (from features)
new_scenarios:
  - id: NS-001
    feature_ref: "F1"
    description: "Play resolves architecture from codebase when architecture.yaml missing"
    expected_behavior: "context-assembly.yaml contains derived architecture"
    pass_criteria: "architecture.status == 'derived' AND technology entries present"
    automation: automated

# Tier 3: Regression scenarios (from blast radius)
regression_scenarios:
  - id: RS-001
    source: "blast-radius/transitively-impacted/pipeline-flow"
    description: "Full pipeline with all locked artifacts still produces locked output"
    pass_criteria: "All 4 output artifacts have status: LOCKED"
    automation: automated

feature_gates:
  F1:
    baseline: [BS-001, BS-002]
    new: [NS-001, NS-002, NS-003]
    regression: [RS-001]
    total: 6
```

### plan.yaml + plan.md (enhanced — task-level DAG)
**Agent: tech-architect** (execution planning is architectural)

```yaml
task_dag:
  - id: T-000
    name: "Phase 0: Baseline Tests"
    tasks:
      - id: T-000-1
        name: "Implement baseline test BT-001"
        file_changes:
          - path: "tests/plays/context-resolution.test.ts"
            action: CREATE
        exit_gate: "Test passes on current codebase"
        depends_on: []
        
      - id: T-000-GATE
        name: "Verify all baseline tests pass"
        exit_gate: "All BT-* tests green on unmodified codebase"
        depends_on: [T-000-1, T-000-2]
        scenario_gate:
          ids: [BS-001, BS-002]
          count: 2

  - id: T-001
    name: "Feature 1: Context Resolution Hierarchy"
    depends_on: [T-000-GATE]
    tasks:
      - id: T-001-1
        name: "Add inferProvider function"
        file_changes:
          - path: "src/auth/inference.ts"
            action: CREATE
            template_ref: "tech.yaml/file_changes[1]"
        exit_gate: "Function exists, unit test passes"
        depends_on: [T-000-GATE]
        
      - id: T-001-GATE
        name: "Feature 1 complete"
        exit_gate: "All NS-001..NS-003 pass, all RS-* still pass"
        depends_on: [T-001-3]
        scenario_gate:
          ids: [NS-001, NS-002, NS-003, RS-001]
          count: 4
```

## Agent Allocation

**No budget limit for this play.** This is the heavyweight — it must get context right. Use as many agents and dispatches as needed.

| Agent | Domain | Phases |
|-------|--------|--------|
| **tech-architect** | Architecture inference, design patterns, logical architecture, LLD, dependency graph, change surface, tech.yaml, plan.yaml | Phase 1A, 1C, 1D, 1E, 2A, 3 (Tech + Plan) |
| **test-engineer** | Test surface mapping, blast radius computation, baseline test specs, scenarios.yaml | Phase 1B, 2B, 2C, 3 (Scenarios) |
| **product-strategist** | features.yaml, cross-validation | Phase 3 (Features), Validate |
| **doc-builder** | HTML briefs at each checkpoint | All checkpoints (utility) |
| **repo-orchestrator** | Evidence self-commit | Evidence (utility) |

Key principle: **keep testing and architecture sub-agents separate.** The tech-architect understands the system's design. The test-engineer understands how to verify it. These are different skills and mixing them produces worse output.

The tech-architect agent is new (separate from tech-designer, which continues to serve other plays). It needs:
- Deep codebase reading capability
- Design pattern recognition
- Logical architecture inference
- LLD production
- Git history analysis
- Diagram/sketch generation (mermaid, ASCII, etc.)

The test-engineer agent is new (separate from quality-auditor, which continues to serve build/lint/coverage checks). It needs:
- Test file analysis
- Coverage gap identification
- Blast radius computation (using dependency graph from tech-architect)
- Baseline test specification
- Three-tier scenario authoring

## Completeness Signal

**How do you know you've covered everything?**

The blast radius analysis IS the completeness signal:

1. Every file in the change surface is mapped
2. Every test that touches the change surface is identified (test-engineer)
3. Every impacted test's break/no-break status is assessed
4. Every code path with NO test has a baseline test specified
5. The dependency graph ensures transitive impacts are caught
6. Git co-change patterns reveal coupling the dependency graph might miss

When `coverage_gaps == 0` (all gaps have baseline tests) AND `directly_impacted + transitively_impacted` is fully enumerated → **context is complete.**

## Greenfield Handling

For new projects with no existing code:
- Test surface: empty → no blast radius to compute
- Change surface: everything is CREATE → no existing behavior to test
- Baseline tests: N/A → skip Phase 2C and 2D
- Design artifacts: produced from context assembly only

The TDD phases add zero overhead for greenfield. They only activate when there's existing code to understand.

## Output Format Principle

**YAML for contract, MD for rich content — but only where rich content adds value.**

Artifacts that benefit from diagrams, sketches, and narrative explanation get dual format:
- `{name}.yaml` — machine-readable contract fields. Other agents consume this.
- `{name}.md` — rich human-readable content with diagrams, sketches, explanations. Users review this.

Artifacts that are purely structured data stay YAML-only.

### Dual format (YAML + MD):
| Artifact | Why MD adds value |
|----------|-------------------|
| `architecture-inference` | Logical architecture diagrams, design pattern explanations, framework convention sketches |
| `dependency-graph` | Visual graph representation (mermaid/ASCII), module relationship diagrams |
| `commit-history-analysis` | Narrative context, co-change pattern explanations, timeline visualization |
| `tech` | LLD diagrams, data flow sketches, component interaction diagrams, interface diffs |
| `plan` | Task DAG visualization, phase flow diagrams, dependency chain visualization |

### YAML-only (structured data, no diagrams needed):
| Artifact | Why YAML-only |
|----------|---------------|
| `context-assembly` | Key-value context fields with confidence levels — pure data |
| `test-surface` | List of test files, subjects, assertions — tabular data |
| `change-surface` | List of files, actions, what_changes — tabular data |
| `blast-radius` | Lists of impacted tests, gaps, regression surface — tabular data |
| `baseline-tests` | Test specifications with setup/action/assert — structured data |
| `features` | Product behaviors and invariants — structured IDD fields (briefs/ handle rich presentation) |
| `scenarios` | Three-tier scenario specs — structured data (briefs/ handle rich presentation) |

## Checkpoint Structure

| # | Phase | What user approves |
|---|-------|--------------------|
| 0 | Context Assembly | Architecture + quality discovery results, derived context, confidence levels |
| 1 | Blast Radius | Change surface, test impact, baseline test specs, coverage assessment |
| 2 | Features | Product behaviors and invariants |
| 3 | Tech Design + LLD | File-level change specs, interface diffs, code templates, logical architecture |
| 4 | Scenarios + Plan | Three-tier scenarios, task DAG with dependencies |

5 checkpoints total. Each is Tether/Vanish/Orbit.

## Intent Changes Required

### Constraints to modify
- **C1:** Product.yaml and roadmap.yaml are nice-to-have. When present and locked, they're authoritative. When absent, play proceeds with issue context. No halt.
- **C10:** Update "three checkpoints" → "five checkpoints" (context assembly, blast radius, features, tech+LLD, scenarios+plan).
- **C14:** `--epic` optional. Auto-resolve issue from branch/STM. Halt only when neither epic nor issue available.
- **C15:** Epic dependency enforcement only when roadmap exists. Not applicable for issue-driven entry.
- **C21:** Architecture.yaml is essential context but not a hard-halt. When absent, play enters discovery mode — derives from codebase scan + LTM + user interview to establish equivalent understanding. Works with user to build this context.
- **C22:** Quality-standards.yaml is essential context but not a hard-halt. Same discovery mode as C21.

### New constraints
- **C23:** Resolution hierarchy — locked → LTM → codebase → user interview. Each source has authority level (authoritative/advisory/derived/collected).
- **C24:** Test-driven blast radius analysis required before design artifact generation. Change surface must be fully characterized through test impact.
- **C25:** Baseline tests must be specified for every coverage gap in the change surface. No design proceeds with uncharacterized code paths in the impact zone.
- **C26:** plan.yaml must contain a task-level DAG with explicit `depends_on` chains, per-task file lists with change type (CREATE/MODIFY/DELETE), and per-task exit gates.
- **C27:** tech.yaml must contain file-level change specifications: for MODIFY files, exact location and before/after; for CREATE files, content template.
- **C28:** scenarios.yaml must contain three tiers: baseline (existing behavior), new (from features), regression (from blast radius). Feature gates must reference all three tiers.
- **C29:** Git commit history must be analyzed as a parallel data source during codebase understanding. Co-change patterns, recent activity, and commit messages inform the change surface and blast radius.
- **C30:** All intermediate data collected by agents must be stored in STM on disk. The play orchestrates by passing STM paths between agents — never by passing data through memory or conversation context.
- **C31:** Artifacts that benefit from diagrams and narrative use dual format (YAML + MD): architecture-inference, dependency-graph, commit-history-analysis, tech, plan. Pure data artifacts stay YAML-only: context-assembly, test-surface, change-surface, blast-radius, baseline-tests, features, scenarios.
- **C32:** Testing and architecture agent work must be separated. The tech-architect understands the system's design; the test-engineer understands how to verify it. These are different domains with different agents.

### Failure conditions to modify
- **F2:** Update "contradicts locked architecture.yaml" → "contradicts established architecture context" (covers both locked artifacts and discovery-mode derived context).
- **F18:** Remove (was hard-halt on missing architecture/quality-standards)

### New failure conditions
- **F19:** Play proceeded with no issue AND no epic — nothing to scope against
- **F20:** Design artifacts produced without blast radius analysis completing
- **F21:** Coverage gaps exist in change surface without baseline test specifications
- **F22:** plan.yaml tasks lack `depends_on` chains or per-task file lists
- **F23:** tech.yaml MODIFY entries lack before/after change specifications
- **F24:** Baseline test specification doesn't cover every coverage gap in blast radius
- **F25:** Architecture context missing and play didn't enter discovery mode
- **F26:** Intermediate agent data not stored in STM — passed through memory instead

### Existing scenarios to update
- **S2:** Update "locked architecture.yaml" → "established architecture context (locked or discovery-derived)" to cover both paths.
- **S7:** Update "dependency resolution report" → "context assembly + blast radius report" to match new artifact names.
- **S8:** Update "locked upstream architecture.yaml" → "established architecture context" to cover discovery mode.
- **S9:** Update "five design artifacts" → "four epic-scoped artifacts" (architecture may be derived, not a lockable artifact in discovery mode).

### Scenarios to add
- **S10:** (Engineer) Given the blast radius report, can verify every impacted test is identified, every coverage gap has a baseline test, and the change surface is fully characterized — including co-change patterns from git history
- **S11:** (Implementation Agent) Given the task DAG in plan.yaml, can execute tasks in dependency order where each task specifies exact files, exact changes, and exact exit gate — no design decisions at build time
- **S12:** (Quality Lead) Given three-tier scenarios.yaml, can verify baseline tests pass on current code, new tests define the target behavior, and regression tests ensure nothing else breaks
- **S13:** (Architect) Given architecture-inference.md and tech.md, can review logical architecture, design patterns, and LLD with diagrams — not just YAML fields

## Model and Reasoning Configuration

Per user direction: all agents in prepare-implementation should run on the best available model with maximum reasoning effort. This play is make-or-break — thoroughness over speed, always.

- All agent dispatches: highest-capability model, maximum reasoning
- No token economy constraints
- No agent budget limits — use as many calls as the work demands
