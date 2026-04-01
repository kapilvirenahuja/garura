# tech.md
# Issue: 183 — prepare-implementation should not hard-block on product.yaml and roadmap.yaml
# Generated: 2026-03-31 (simulation)
# Status: DRAFT

---

## Architecture Diagram — Meridian Recipe Neighborhood (Post-#183)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMPILATION FLOW                                                            │
│                                                                              │
│  reference/intent.yaml  ──/create-recipe──▶  SKILL.md                      │
│         (source)                              (compiled artifact)            │
│                                                                              │
│  C1-C32 constraints                          Runtime workflow                │
│  F1-F26 failure conditions                   Step 0 through Step 22         │
│  S1-S13 scenarios                            Deployed to ~/.claude/skills/  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PIPELINE TOPOLOGY (pre-#183 vs. post-#183)                                │
│                                                                              │
│  BEFORE #183:                                                                │
│  discover-product ──▶ plan-roadmap ──▶ prepare-architecture ──▶ prepare-impl│
│       │                    │                    │                   │        │
│   product.yaml         roadmap.yaml      architecture.yaml     REQUIRED     │
│  (required locked)    (required locked)  (required locked)     ALL 4        │
│                                                                              │
│  AFTER #183:                                                                 │
│  discover-product ──▶ plan-roadmap ──▶ prepare-architecture ──▶ prepare-impl│
│       │                    │                    │                   │        │
│   product.yaml         roadmap.yaml      architecture.yaml     OPTIONAL     │
│   (nice-to-have)       (nice-to-have)   (discovery mode if absent)          │
│                                                                              │
│  prepare-implementation now has two entry paths:                             │
│    Path A: Full pipeline ran → all 4 artifacts locked → authoritative mode  │
│    Path B: Fresh / issue-only → 0-4 artifacts present → discovery mode     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Phase 1: Parallel Context Collection

```
                        ┌─────────── Step 0 ────────────┐
                        │  recipe inline (not an agent)  │
                        │  Read product.yaml,            │
                        │  roadmap.yaml,                 │
                        │  architecture.yaml,            │
                        │  quality-standards.yaml        │
                        │  → set status flags (absent/   │
                        │    locked) for each            │
                        │  → set discovery_mode flags    │
                        └───────────────┬────────────────┘
                                        │
          ┌─────────────────────────────┼──────────────────────────┐
          │ Steps 2-6 dispatched in parallel (fan-out)             │
          │                                                         │
          ▼                 ▼              ▼           ▼           ▼
    ┌──────────┐     ┌─────────────┐  ┌───────┐  ┌────────┐  ┌───────┐
    │  Step 2  │     │   Step 3    │  │Step 4 │  │Step 5  │  │Step 6 │
    │  Arch    │     │  Test       │  │Dep    │  │Git     │  │LTM    │
    │ Inference│     │  Surface    │  │Graph  │  │History │  │Consult│
    │  (tech-  │     │  Mapping    │  │(tech- │  │(tech-  │  │(tech- │
    │  arch)   │     │  (test-eng) │  │ arch) │  │ arch)  │  │ arch) │
    └────┬─────┘     └──────┬──────┘  └───┬───┘  └───┬────┘  └───┬───┘
         │                  │             │           │            │
         ▼                  ▼             ▼           ▼            ▼
  arch-inference.yaml  test-surface  dep-graph    commit-hist  ltm-findings
  arch-inference.md    .yaml         .yaml        .yaml        .yaml
                                     .md          .md
          │                  │             │           │            │
          └──────────────────┴─────────────┴─────────┬─┴────────────┘
                                                      │
                                               ┌──────▼──────┐
                                               │   Step 7    │
                                               │   Context   │
                                               │  Assembly   │
                                               │  (tech-arch)│
                                               └──────┬──────┘
                                                      │
                                              context-assembly.yaml
                                              (fan-in hotspot)
```

### Phase 2: Blast Radius Analysis (after Checkpoint 0)

```
    context-assembly.yaml                    test-surface.yaml
          │                                        │
          ▼                                        │
    ┌──────────┐                                   │
    │  Step 8  │ ◄──── dependency-graph.yaml       │
    │  Change  │ ◄──── commit-history.yaml         │
    │  Surface │                                   │
    │ (tech-   │                                   │
    │  arch)   │                                   │
    └────┬─────┘                                   │
         │                                         │
  change-surface.yaml                              │
         │                                         │
         ▼                                         ▼
    ┌───────────────────────────────────────────────┐
    │                   Step 9                      │
    │           Blast Radius Computation             │
    │               (test-engineer)                  │
    │  intersects change surface × test surface      │
    │  using dependency graph                        │
    └──────────────────────┬─────────────────────────┘
                           │
                    blast-radius.yaml
                           │
                           ▼
                    ┌───────────┐
                    │  Step 10  │
                    │ Baseline  │
                    │   Tests   │
                    │  (test-   │
                    │   eng)    │
                    └─────┬─────┘
                          │
                   baseline-tests.yaml
                   (coverage completeness signal)
```

### Phase 3: Design Artifact Generation (after Checkpoint 1)

```
context-assembly.yaml ──────────────────────────────────────┐
blast-radius.yaml ──────────────────────────────────────────┤
                                                            │
         ┌──────────────────────────────────────────────────┤
         │                                                  │
         ▼                                                  ▼
   ┌────────────┐                                   ┌────────────┐
   │  Step 11   │                                   │  Step 13   │
   │  features  │                                   │    tech    │
   │   (prod-   │ ──features.yaml──▶                │   .yaml    │
   │  strat)    │                   │               │  (tech-    │
   └────────────┘                   │               │   arch)    │
                                    │               └─────┬──────┘
                                    │                     │
                                    └─────────────────────┤
                                                          │
                               features.yaml              ▼
                               tech.yaml           ┌────────────┐
                               baseline-tests.yaml │  Step 15   │
                               blast-radius.yaml   │ scenarios  │
                                    │              │  (test-    │
                                    │              │   eng)     │
                                    │              └─────┬──────┘
                                    │                    │
                                    │            scenarios.yaml
                                    │                    │
                                    ▼                    ▼
                               ┌─────────────────────────────┐
                               │           Step 16           │
                               │         plan.yaml           │
                               │        (tech-arch)          │
                               │  Reads scenarios for IDs    │
                               │  ONLY — compartmentalized   │
                               │  (C9)                       │
                               └──────────────┬──────────────┘
                                              │
                                          plan.yaml
                                          plan.md
```

---

## Component Interaction Explanation

### The Compiled Intent Pattern

Every recipe in Meridian exists in two forms: the intent source (`reference/intent.yaml`) and the compiled runtime artifact (`SKILL.md`). These always co-change — editing SKILL.md directly violates the compilation pattern. The correct change mechanism is:

1. Edit `reference/intent.yaml` (the constraints, failure conditions, scenarios)
2. Run `/create-recipe --rebake prepare-implementation`
3. SKILL.md is regenerated from the updated intent

For #183, both files were modified in this branch via exactly this pattern. The before/after in tech.yaml captures what changed in intent.yaml (at the constraint level) and what changed in SKILL.md (at the compiled behavior level).

### How Step 0 Changed the Pre-flight Contract

The old recipe had a simple pre-flight: check 4 files exist, halt if any is missing. The new recipe uses a two-phase entry:

**Pre-flight** (still halts): config.yaml resolution, issue/epic resolution
**Step 0** (never halts): upstream artifact availability check

Step 0 is an inline recipe step, not an agent dispatch. It sets four status variables (`product_status`, `roadmap_status`, `architecture_status`, `quality_status`) to either `"absent"` or `"locked"`. These flags travel to downstream agents via their input contracts, enabling each agent to adapt its behavior without needing to re-check file existence.

The critical semantic shift: `architecture_status == "absent"` does not mean "stop" — it means "enter discovery mode." Discovery mode is not a degraded path. It is a different data collection strategy: codebase scan + LTM + targeted user interview produces architecture understanding equivalent (in richness, if not in authority) to a locked architecture.yaml.

### Agent Separation: tech-architect vs. test-engineer

Prior to #183, the recipe had two domain agents (tech-designer and product-strategist). The rebake introduced a third: test-engineer. This is not cosmetic — it enforces C32, the architectural separation of concerns principle:

| Concern | Agent | Why Separated |
|---------|-------|---------------|
| What the system IS (architecture, patterns, dependencies) | tech-architect | Architecture knowledge requires different depth than testing knowledge |
| WHAT IS TESTED and what would break | test-engineer | Test domain expertise: coverage analysis, impact computation, scenario authoring |
| WHAT MUST BE BUILT (behaviors, invariants, scope) | product-strategist | Product domain must be insulated from technical framing bias |

The separation prevents the common failure mode where the same agent that designs the change also assesses what would break — a cognitive conflict of interest that tends to underestimate blast radius.

### The Fan-In Hotspot Problem

`context-assembly.yaml` is consumed by 4 downstream tasks. `blast-radius.yaml` is consumed by 5. This creates a structural risk: any error or low-confidence entry in these artifacts propagates silently into all downstream work.

The recipe addresses this with explicit Checkpoints 0 and 1 — human review gates at each fan-in point. The user reviews and approves context-assembly.yaml (Checkpoint 0) before blast radius begins, and reviews blast-radius.yaml + baseline-tests.yaml (Checkpoint 1) before design artifacts begin. Orbit handling allows in-place correction without restarting the phase.

### Scenario Compartmentalization (C9)

plan.yaml and scenarios.yaml have a carefully asymmetric relationship:

- test-engineer produces `scenarios.yaml` → consumed by quality-auditor
- tech-architect produces `plan.yaml` → consumed by code-builder

tech-architect reads scenarios.yaml during plan production — but is permitted to read only scenario IDs and counts, never scenario descriptions. The `plan.yaml` `scenario_gate` field contains IDs like `["SCE-183-01", "SCE-183-02"]` and a count integer. The implementer (code-builder) receives plan.yaml but never scenarios.yaml.

This compartmentalization forces the implementer to build correct behavior driven by features.yaml, not by reverse-engineering test expectations from scenarios.yaml.

---

## Design Rationale

### Why NOT a feature flag for the old behavior?

The hard-block behavior was not a feature — it was a design mistake. Making it optional via a flag would preserve two code paths indefinitely. Removing it entirely is correct: the new behavior (always proceed, derive context when needed) is strictly better than the old behavior (halt and require the user to run 3 other recipes first).

The only legitimate "halt" in the entry sequence is F19 (no issue and no epic — nothing to scope the work against). Every other halt was protecting against a missing artifact that the recipe can now derive on its own.

### Why discovery mode and not just "skip architecture"?

A common misunderstanding of C21/C22 is that they allow the recipe to skip architecture understanding when architecture.yaml is absent. They do not. They change the data SOURCE for architecture understanding — from a locked artifact to a codebase scan + LTM + interview.

The constraint states: "the goal is equivalent understanding, not a shortcut." This is load-bearing. tech.yaml produced in discovery mode must be as specific and as file-level precise as tech.yaml produced with a locked architecture.yaml. The only difference is the authority label in context-assembly.yaml (`"derived"` vs. `"locked"`).

### Why must recipe-dependency-protocol.md be a new file and not an extension to resolution-protocol.md?

`resolution-protocol.md` defines the R1-R4 hierarchy for AGENT-level knowledge resolution. It is invoked when `ltm_context` appears in an agent's input contract. The mechanism is: locked YAML → project LTM → core LTM → LLM reasoning.

The recipe-level soft-dependency pattern is structurally parallel but semantically distinct: it governs RECIPE pre-flight behavior, not agent cognition. The consumers are different (recipe orchestrators, not agents), the artifacts are different (SKILL.md pre-flight sections, not ltm_context blocks), and the decisions are different (halt vs. proceed decisions, not knowledge resolution decisions).

Merging them would blur a clear conceptual boundary. A cross-reference between the two files is appropriate.

### Why do pipeline recipes (discover-product, plan-roadmap, prepare-architecture) need review but not necessarily changes?

Co-change history shows that cross-cutting changes to prepare-implementation always update all four pipeline recipes simultaneously. However, "update" does not always mean "change pre-flight behavior." For the upstream recipes:

- discover-product: produces product.yaml — its strict pre-flight (if it has one) protects the quality of its own outputs. #183 does not require relaxing it.
- plan-roadmap: produces roadmap.yaml — same logic applies.
- prepare-architecture: produces architecture.yaml + quality-standards.yaml — same logic.

The required change for all three is documentation: add a pipeline topology note explaining what downstream prepare-implementation does when their outputs are absent. This makes the optional dependency explicit and helps users understand the tradeoff (run the upstream recipe → authoritative context vs. skip it → discovery mode).

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| context-assembly.yaml carries wrong authority label (e.g., "absent" instead of "derived" after discovery mode) | Critical | F25 failure condition + SE-08 eval checks status field explicitly. |
| Downstream skills (draft-lld, draft-product-spec) invoked with null input paths they don't yet handle | High | Skills need discovery_mode input path (not-yet-applied changes). Until then, passing null produces unpredictable behavior. |
| tech-architect and tech-designer used interchangeably in other recipes that weren't updated | Medium | tech-designer.md is retained. Other recipes reference tech-designer, not tech-architect. No collision currently — but a future recipe rebake could accidentally reference the wrong agent. |
| Blast radius eval conditions inverted — old evals PASS on the behavior being corrected | Critical (theoretical) | No evals currently run in meridian-os. But baseline-tests.yaml must specify the corrected eval conditions so when evals are introduced, they test the right behavior. |
| Pipeline recipe review finds that discover-product DID have a product.yaml hard-block that should be relaxed | Low | The co-change review (not-yet-applied) will surface this. It is a discovery risk, not a design risk. |

---

## Implementation Order Recommendation

The changes are logically ordered by dependency:

```
Group A — Already applied (no action needed):
  ✓ reference/intent.yaml
  ✓ SKILL.md
  ✓ tech-architect.md
  ✓ test-engineer.md

Group B — Pipeline consistency review (low risk, may be documentation-only):
  → discover-product/SKILL.md
  → plan-roadmap/SKILL.md
  → prepare-architecture/SKILL.md
  (Do these first — may reveal additional changes needed before Group C)

Group C — Skill discovery mode handling (batch, all 4 follow same pattern):
  → draft-lld/SKILL.md
  → draft-implementation-plan/SKILL.md
  → draft-product-spec/SKILL.md
  → draft-verification-scenarios/SKILL.md
  (Group B must complete before Group C — pipeline review may change skill contract requirements)

Group D — LTM standard (can be done in parallel with Group C):
  → core/components/memory/standards/recipe-dependency-protocol.md
```

Group A is done. Groups B → C → D constitute the remaining implementation surface.
