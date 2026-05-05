# Garura OS — Defects

## DEF-001: Hardcoded paths in play pre-flight sections

**Severity:** High
**Affected plays:** `implement-epic`, `prepare-implementation`, `start-feature`, `commit-code`
**Reported from:** Phoenix project (first external consumer)
**Date:** 2026-04-10

### Problem

Multiple plays hardcode `.garura/` directory paths in their pre-flight bash snippets instead of reading them from the project's `.garura/core/config.yaml`. This breaks when a project's directory structure doesn't match the hardcoded assumptions.

### Specific issues

**1. Config path resolution**
- Plays reference `.garura/core/config.yaml` but the actual location is `.garura/core/config.yaml`
- No play reads a `product.base-path` from config — `product_base` is hardcoded

**2. Product base path hardcoded**
- `implement-epic` hardcodes `product_base=".garura/product"`
- Actual Phoenix layout: `.garura/project/product/phoenix`
- The play should read `product.base-path` from `.garura/core/config.yaml`

**3. Subdirectory assumptions**
- `implement-epic` expects `{product_base}/architecture/architecture.yaml` and `{product_base}/roadmap/epics/{id}/`
- Phoenix uses a flat layout: `architecture.yaml` and `epics/{id}/` directly under the product base — no `architecture/` or `roadmap/` subdirectories

**4. STM base path**
- `start-feature` greps `.garura/core/config.yaml` for `stm.base-path` — correct approach, but the config file path itself is wrong (should be `.garura/core/config.yaml`)

### Expected behavior

All plays should:
1. Resolve config from `.garura/core/config.yaml` (project-local)
2. Read `product.base-path` from config instead of hardcoding
3. Read `stm.base-path` from config (already done, but via wrong config path)
4. Not assume subdirectory structure — use paths as declared in config

### Impact

`/implement-epic` will fail at pre-flight on any project that doesn't match the hardcoded layout. This is the first external consumer (Phoenix) and the paths don't align.

---

## DEF-002: `prepare-implementation` generates scope items without cross-epic data contracts

**Severity:** Critical
**Affected play:** `prepare-implementation` (Step 13 — tech-designer drafts plan.yaml)
**Reported from:** Phoenix project — E1→E2 integration gap
**Date:** 2026-04-11

### Problem

When `prepare-implementation` generates plan.yaml scope items, it describes what each file **does** but not what data it must **produce for the next epic**. There is no cross-epic data contract in the scope items.

### Evidence

E1 plan.yaml scope item for the config loader said: "resolve promptFile path relative to YAML file location. Verify the .md file exists." It never said "read .md content and store it as a field on AgentConfig for downstream consumption." As a result, the E1 loader validates the file exists but discards the content. E2's agent executor then had no pre-loaded prompt available and was forced to accept `systemPrompt` as a raw caller parameter — breaking the design principle that prompts are config-driven (TP1).

### Root cause

The tech-designer agent drafting plan.yaml focuses on what each scope item delivers **within that epic**. It has no mechanism to specify: "This scope item produces output X that epic N+1 will consume through interface Y." Cross-epic data flow is implicit in the architecture but never made explicit in scope items.

### Expected behavior

When a scope item in epic N produces output consumed by epic N+1, the scope item must specify:
1. The output shape (e.g., "AgentConfig includes `promptContent: string` field with loaded .md content")
2. Where it's stored (e.g., "available via `registry.getAgent(name).promptContent`")
3. The consumer (e.g., "consumed by E2 agent executor at runtime")

### Impact

Any cross-epic data handoff will silently fail. The implementation will pass all within-epic evals but break at integration time. This is not detectable by the current eval or drift systems.

---

## DEF-003: `implement-epic` eval generator has no cross-epic integration evals

**Severity:** Critical
**Affected play:** `implement-epic` (Step 4 — eval-generator)
**Reported from:** Phoenix project — E2 evals missed loader→executor handoff
**Date:** 2026-04-11

### Problem

The eval generator (Step 4) reads features.yaml and scenarios.yaml scoped to **this feature only**. It generates evals that verify the feature works in isolation. It has no mechanism to generate evals that verify: "Does this feature correctly consume what a prior epic produced?"

### Evidence

E1 evals tested: config loads, invalid YAML throws, missing .md throws, AgentConfig has promptFile. E2 evals tested: executeAgent returns a response, errors are wrapped, model defaults work. No eval across either epic tested: "After init(), the agent executor resolves its system prompt from the registry's pre-loaded config, not from a caller-provided parameter."

The eval generator's input contract (`stm.input`) contains only `features_yaml_path`, `scenarios_yaml_path`, `epic_id`, `phase_num`, and `plan_exit_gate`. It has no access to prior epic artifacts, prior epic exit gates, or the integration interface between epics.

### Root cause

The eval generator is context-isolated by design (C4) — it receives only specs, never implementation. But this isolation also prevents it from seeing the **integration contract** between the current feature and prior features. Integration evals require knowledge of both sides of the interface.

### Expected behavior

The eval generator should receive one additional input: **prior epic's exit gate outputs and interface contracts** (not implementation code — just the published interface). From this, it generates at least one "integration handoff eval" per cross-epic dependency:
- "Feature X consumes the output of Feature Y through interface Z"
- "The runtime data flow matches the design's data flow"

### Impact

Every cross-epic boundary will lack eval coverage. The judge will report 100% pass while critical integration paths are untested. This is the highest-risk gap in the play system — the first place where "all evals pass but the system doesn't work" can occur.

---

## DEF-004: `check-drift` classifies data flow breaks as cosmetic signature changes

**Severity:** High
**Affected skill:** `check-drift`
**Reported from:** Phoenix project — drift report classified broken handoff as "medium, defensible"
**Date:** 2026-04-11

### Problem

The drift checker compares spec vs implementation at the **shape level** (function signatures, type definitions, file structure). When it finds a divergence, it classifies severity based on whether the change is "defensible." It does not trace **data provenance** — where does each parameter's value come from at runtime?

### Evidence

Drift report DRIFT-3 found that all three E2 executors use flat parameter signatures instead of the spec's structured input objects. It classified this as "medium severity — defensible for TDD ergonomics" and produced an ADR. But it missed the critical implication: if `executeAgent` takes `systemPrompt` as a raw string parameter (instead of resolving it from a configured agent), then nothing in the system reads .md prompt content from config. The config-driven design (TP1) is broken.

The drift checker saw the **shape** change but not the **data flow** break.

### Root cause

The drift analysis algorithm (Step 2 in check-drift) compares "what was specified" vs "what was built" at the interface level. It does not ask: "For each parameter in the built interface, where does this value originate at runtime? Does that match the spec's data flow?" Tracing data provenance requires reading both the implementation AND the config system, then verifying the runtime wiring matches the design.

### Expected behavior

For each function signature drift, the drift checker should:
1. Identify parameters that represent **configured data** (prompts, models, schemas) vs **runtime data** (messages, input)
2. Trace configured data to its source: does it come from config loaded at init(), or is the caller constructing it?
3. If the spec says "config-driven" but the implementation says "caller-provided" → classify as **critical** (design break), not medium (cosmetic)

### Impact

Data flow breaks — the most architecturally significant type of drift — are systematically underclassified. The drift report gives false confidence that the implementation aligns with the design when the integration wiring is actually broken.
