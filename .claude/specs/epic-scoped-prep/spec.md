# Spec: Epic-Scoped Prepare-Implementation

## Problem

prepare-implementation operates on an entire product. After the first epic ships, there's no way to prepare a single epic without regenerating everything. No dependency resolution. No codebase awareness. No LTM consultation. Output is not vertically testable per epic.

## Design Thesis

prepare-implementation becomes epic-scoped. Always scans codebase. Always reads LTM. Resolves two-dimensional dependencies (epic + technology). Produces a dependency resolution report for user approval before generating artifacts. No greenfield vs brownfield distinction — first epic just finds nothing in the scan.

## Design Decisions

**DD1: No greenfield/brownfield.** Always scan. First epic finds nothing. After first epic ships, everything is brownfield.

**DD2: Two-dimensional dependencies.** Epic ordering from roadmap + technology dependencies from codebase. Both resolved before artifact generation.

**DD3: Halt + show order for all cases.** Unmet epic dependencies = halt with recommended order. Even within a single multi-epic module.

**DD4: Existing artifacts are read-only inputs.** Prior-epic architecture.yaml is READ, not overwritten. Each epic gets own artifacts under `epics/{epic_id}/`.

**DD5: Epic-scoped artifact directory.** `{product_base}/epics/{epic_id}/` per epic. Product-wide artifacts stay at product base.

**DD6: Dependency resolution report = approval gate.** User validates context BEFORE artifacts are generated. Prevents non-deterministic context reads.

**DD7: Pipeline restructure compatible.** Works with current pipeline (5 artifacts) and restructured pipeline per Issue #106 (scenarios + plan only).

**DD8: Iterative refinement expected.** 5-15 runs to find determinism. Eval criteria tighten over time.

## Input

```
/prepare-implementation --epic E1
```

`--epic` is required. References an epic ID from locked roadmap.yaml.

## Intent Changes

**C1 (modified):** Requires locked roadmap.yaml and locked product.yaml. Raw product intent is no longer sufficient.

**New constraints:**
- **C_DEP_EXIST:** Target epic must exist in locked roadmap.yaml
- **C_DEP_RESOLVED:** All epic dependencies (roadmap depends_on) must be prepared (artifacts LOCKED) or built (found in codebase). Halt if unmet.
- **C_CODEBASE_SCAN:** Must scan codebase for technology dependencies before producing artifacts: services, ports, frameworks, libraries, testing patterns, quality gates, ADRs, conventions.
- **C_LTM_READ:** Must read LTM for standards, patterns, decisions, learnings. Document findings AND gaps.
- **C_APPROVAL_GATE:** Dependency resolution report requires Tether before artifact generation.
- **C_READ_ONLY_PRIOR:** Prior-epic artifacts are read-only inputs, not modification targets.

## New Phase: Context Resolution (before DRAFT)

### Step 0.1 — Read Locked Upstream Artifacts
Read product.yaml (LOCKED) and roadmap.yaml (LOCKED). Locate target epic. Extract name, description, strategic goal ref, dependencies, priority.

### Step 0.2 — Resolve Epic Dependency Chain
For each dependency in roadmap depends_on:
- Check for prepared artifacts: `{product_base}/epics/{dep_id}/plan.yaml` exists and LOCKED
- Check for built implementations: codebase contains the dependency's implementation
- If neither: mark as missing (halt condition)

### Step 0.3 — Scan Codebase for Technology Dependencies
Always runs. Discovers:
- **Services:** entry points, API routes, running services
- **Ports:** from configs, docker-compose, env files
- **Frameworks/libraries:** package.json, requirements.txt, go.mod, etc.
- **Dev patterns:** testing framework, mocking approach, fixture patterns
- **Quality gates:** linting config, type checking, coverage thresholds, CI config
- **ADRs:** docs/adr/ or equivalent
- **Conventions:** .editorconfig, .prettierrc, tsconfig.json, etc.

### Step 0.4 — Read LTM
Read from `~/.meridian/core/memory/`:
- `standards/` — architectural standards, coding standards, templates
- `knowledge/` — architectural patterns, design decisions, prior learnings
- `formats/` — documentation formats
- `workflows/` — execution patterns

Document findings AND gaps. Gaps tell the implementation agent what organizational knowledge is missing.

### Step 0.5 — Produce Dependency Resolution Report
Write `dependency-resolution-report.yaml`:

```yaml
epic_id: "E1"
epic_name: "{name}"
strategic_goal_ref: "SG1"

epic_dependencies:
  - epic_id: "E0"
    status: "prepared|built|missing"
    evidence: "{what was found}"

technology_dependencies:
  services: [{name, port, framework, entry_point}]
  libraries: [{name, version, source}]
  patterns:
    testing_framework: "..."
    mocking_approach: "..."
    quality_gates: {linter, type_checker, coverage, ci_config}
  adrs: [{id, title, path, relevance}]
  conventions: [{name, source, detail}]

ltm_findings:
  standards_found: [{path, summary, applies_to}]
  patterns_found: [{path, summary, applies_to}]
  gaps: [{category, impact}]

halt_conditions:
  has_unmet_dependencies: true|false
  recommended_order: [{epic_id, rationale}]
```

### Step 0.6 — User Approval
Present report. Tether to proceed, Vanish to halt. Cannot Tether past unmet dependencies.

## Epic-Scoped Artifact Output

Directory: `{product_base}/epics/{epic_id}/`

| Artifact | Scope | Reads from prior epics |
|----------|-------|----------------------|
| features.yaml | THIS epic's features only | Product-wide features.yaml if exists |
| architecture.yaml | New decisions + references to prior | Prior-epic architecture.yaml |
| tech.yaml | New components + technology deps | Prior-epic tech.yaml, codebase scan |
| scenarios.yaml | THIS epic's features only | Nothing (compartmentalized) |
| plan.yaml | THIS epic's execution order | Codebase state, dependency report |

### Context Completeness Rule

Output artifacts must contain EVERYTHING the implementation agent needs:
- Port numbers (explicit, not "pick available")
- Service endpoints (explicit, not "see prior epic")
- Dev patterns (documented, not "follow conventions")
- Quality gates (documented, not "run the linter")
- File paths (NEW vs MODIFIED distinguished)
- ADR references (which apply, why)
- LTM standards (which apply, which are missing)

The implementation agent reads ONLY these artifacts. No codebase scanning, no LTM reading, no dependency resolution at implementation time.

## Eval Engineering

### E1: Dependency Graph Correctness
- Epic dependencies from roadmap correctly identified
- Technology dependencies from codebase correctly identified
- Halt fires on unmet dependencies, doesn't fire when met
- Recommended order is topologically valid

### E2: Technology Dependency Resolution
- All services discovered, all ports found
- Framework/library versions match actual manifests
- Testing patterns correctly identified
- Quality gates read from actual config files

### E3: ADR Reuse
- Existing ADRs found, relevant ones identified, referenced in architecture.yaml

### E4: LTM Consultation
- All LTM categories scanned, findings documented with specificity, gaps identified

### E5: Context Completeness
- Implementation agent can work from artifacts alone
- No implicit "go look at the codebase" in any artifact
- Ports, endpoints, patterns, gates all explicit

### E6: Vertical Testability
- Epic's scenarios can run independently
- Epic's features are independently verifiable
- No scenario depends on features from a different epic

### Iteration Strategy
- Runs 1-5: E1 + E2 (structural, verifiable against codebase)
- Runs 6-10: E5 (give output to simulated implementation agent, check what questions it asks)
- Runs 11-15: E6 (run scenarios in isolation)

## Agent Boundaries

| Agent | New Responsibilities |
|-------|---------------------|
| tech-designer | Codebase scanning, technology dependency extraction, LTM reading, ADR identification, prior-epic artifact reading |
| product-strategist | Epic-scoped feature extraction, epic-scoped scenarios |
| doc-builder | Brief generation per epic (unchanged) |
| repo-orchestrator | Evidence self-commit (unchanged) |

## Execution

1. Update intent.yaml with new constraints
2. `/create-play --rebake prepare-implementation`
3. `/sync-claude`
4. Test with a real epic — iterate on eval criteria
