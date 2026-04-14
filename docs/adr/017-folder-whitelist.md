# ADR 017 — `.meridian/` Folder Whitelist and Play Terminology Cleanup

**Status:** Proposed
**Date:** 2026-04-14
**Supersedes:** none (partial overlap with ADR 008 issue-centric STM, ADR 013 play maturity model)
**Related:** ADR 001 (three-layer hierarchy), ADR 008 (issue-centric STM), ADR 013 (play maturity model — superseded by this ADR's "no levels" decision), ADR 016 (agent JSON contract)

## Context

Three separate frictions accumulated in Meridian's folder and play conventions as the framework matured:

1. **Folder drift under `.meridian/`.** Different plays wrote evidence, checkpoints, status files, and product artifacts to ad-hoc locations. `core/config.yaml` enumerated seven product subdirectories (`discovery/`, `roadmap/`, `architecture/`, `evidence/`, `briefs/`, `checkpoints/`, `status/`) that grew organically as plays were added. Issue STM used five keys (`spec/`, `design/`, `evidence/`, `delivery/`, `checkpoint/`) with overlapping meanings. New plays couldn't predict where their artifacts should land.

2. **Config file living outside its data.** `core/config.yaml` sat at the repo root inside `core/` — which holds the authored framework components (agents, skills, plays, memory). Its content — STM paths, product paths, review settings, project metadata — is about the `.meridian/` tree. The config's natural home is inside `.meridian/` with the state it describes.

3. **Play ceremony inflation.** ADR 013 introduced Level-1 / Level-2 plays with a "≤5 domain agent" budget. In practice the levels added compliance overhead without improving coherence — a well-shaped play fails its scenario evals if it's bloated, regardless of agent count. The "bake" terminology for play compilation (`/create-play --bake`) carried a cooking metaphor that didn't match the sports metaphor the rest of the framework uses (plays are *run*, teams are *built*).

These frictions became blocking when the product-planning pipeline (`specify-product`, `design-exp`, `build-arch`) was designed — the new plays needed a predictable folder layout, a clean config location, and terminology that matched the sports metaphor. Fixing them piecemeal would leave the framework inconsistent during the transition, so the cleanup lands as one ADR.

## Decision

### 1. Strict `.meridian/` folder whitelist

The `.meridian/` tree allows ONLY these folders. No other top-level or second-level folders are permitted anywhere under `.meridian/`:

```
.meridian/
├── core/                                     # framework state (config, synced memory)
├── product/
│   ├── product/                              # specify-product outputs (epics, scope, quality profile)
│   ├── ux/                                   # design-exp outputs (personas, screens, flows, wireframes)
│   └── arch/                                 # build-arch outputs (architecture.yaml, quality-standards.yaml)
└── project/
    └── issues/
        ├── _pending/                         # pre-issue pending artifacts
        ├── _archive/                         # archived closed issues
        └── {issue_no}/
            ├── specs/                        # plans
            ├── evidence/                     # test and eval evidence
            ├── checkpoint/                   # play approval gates
            ├── context/                      # prepare-implementation / build-arch context
            └── review/                       # review artifacts
```

**Operational artifacts for product-scoped plays** (checkpoints, status files, resume state for `/specify-product`, `/design-exp`, `/build-arch`) live INSIDE `product/`, `ux/`, or `arch/` using underscore-prefixed subfolders — e.g., `.meridian/product/product/_checkpoints/specify-product/20260414.md`. These are legal because they don't introduce new top-level siblings; they live inside the three whitelisted buckets.

**Amendment explicitly rejected:** during planning for this work, a proposal was made to add `evidence/`, `checkpoints/`, and `status/` as new siblings under `.meridian/product/`. That proposal is REJECTED. The three-bucket shape (`product/`, `ux/`, `arch/`) is the core principle. New plays that need ops files use underscore-prefixed subfolders inside the existing buckets.

### 2. Config relocation

`core/config.yaml` is MOVED to `.meridian/core/config.yaml`. The move is a `git mv` to preserve history. Every reference to `core/config.yaml` across `core/components/`, `docs/`, `CLAUDE.md`, and memory workflows is updated.

`.meridian/core/memory/` remains gitignored (per the existing pattern). `.meridian/core/config.yaml` is tracked — the gitignore entry for `.meridian/core/memory/` is scoped to that subdirectory only.

Rationale: the config describes `.meridian/` state; it belongs there. Repositioning it also makes it possible (in a follow-up) for per-project configs to diverge — each project has its own `.meridian/core/config.yaml` rather than sharing a framework-wide default.

### 3. Config content reconciliation

**`product.directories`** becomes exactly three keys:

```yaml
product:
  base-path: .meridian/product/
  directories:
    product: product/
    ux: ux/
    arch: arch/
```

The keys `discovery`, `roadmap`, `architecture`, `evidence`, `briefs`, `checkpoints`, `status` are removed. Plays that wrote to those paths are either rebuilt (if surviving) or deleted (if being deprecated).

**`stm.structure`** becomes exactly five keys:

```yaml
stm:
  base-path: .meridian/project/issues/
  pending-path: .meridian/project/issues/_pending/
  archive-path: .meridian/project/issues/_archive/
  structure:
    specs: "{issue-number}/specs/"
    evidence: "{issue-number}/evidence/{play-name}/{YYYYMMDD-HHMMSS}.md"
    checkpoint: "{issue-number}/checkpoint/{play-name}/{YYYYMMDD-HHMMSS}.md"
    context: "{issue-number}/context/"
    review: "{issue-number}/review/"
```

The keys `spec` (singular), `design`, `delivery` are removed. `spec` → `specs` (plural) is a naming normalization. `design` and `delivery` are dropped entirely — `design` was used by discover-product/plan-roadmap for draft output (now part of `specs/` or product-wide artifacts), `delivery` was used for delivery-stage artifacts (now part of `review/`).

### 4. Play levels and agent-count budgets retired

`CLAUDE.md` section 4 "Play Constraints" — the L1/L2 table with Max Agent Calls (≤2 / ≤5) — is REMOVED. Replacement text, verbatim:

> A play is just a play — coherence is enforced by the intent schema and evals, not by a level or agent-count budget.

Rationale: a well-shaped play fails its scenario evals if it's bloated, regardless of how many agents it dispatches. The level classification added compliance overhead without improving output quality. Removing it lets play authors focus on structural correctness (intent, failure conditions, scenarios) instead of counting.

ADR 013 (Play Maturity Model) is superseded by this decision for the L1/L2 portion. The rest of ADR 013 (workflow structures A/B/C, compilation gates G1-G11) remains in force.

### 5. "Bake" terminology retired — hard cut to "build"

The `/create-play --bake` and `/create-play --rebake` subcommands are renamed to `/create-play --build`. This is a HARD CUT — no alias. After this ADR lands, `/create-play --bake` fails with unknown-option.

Reasoning: the sports metaphor rest of the framework uses (build the team, run the play) is clean; "bake" was a leftover cooking metaphor from early prototypes. Build aligns with (a) the verb sequence `specify-product` → `design-exp` → `build-arch`, and (b) the natural pipeline *create → build → run*.

Every doc, agent, skill, and play that references "bake"/"baked"/"baking" in a play-compilation context is updated. User memory ("Recipe changes only through rebake") remains semantically correct — the behavior is still "never edit SKILL.md directly; update intent.yaml and rebuild" — only the verb changes.

## Consequences

### Positive

- **Predictable folder shape.** Every play, agent, and skill knows exactly where to write. New plays inherit the three-bucket layout without invention.
- **Single whitelist enforcement boundary.** The `write-evidence` skill (214.1) validates every write against the whitelist. Folder compliance is checked once, automatically, at the write boundary.
- **Config lives with its data.** Config relocation aligns `.meridian/core/config.yaml` with the `.meridian/` tree it describes.
- **Simpler mental model for plays.** No level classification, no budget bookkeeping. Authors think about intent, not ceremony.
- **Consistent sports metaphor.** Build the play, run the play. No lingering cooking references.

### Negative / Risks

- **Migration is broad.** Every reference to `core/config.yaml`, old STM/product path keys, and `--bake`/`--rebake` must be updated in one sub-issue (214.2). Missed references cause silent breakage.
- **Plays mid-execution at landing time break.** Any play with an in-progress status file using the old STM keys will fail to resume. Mitigation: users finish in-progress work or restart after landing.
- **Users with muscle memory for `--bake` hit unknown-option errors.** Mitigation: error message points to `--build`. No alias — the whole point is that transitional aliases create half-states.
- **CLAUDE.md section 4 deletion erases L1/L2 documentation.** Any existing plays that were designed against the L1/L2 table still work, but their maturity metadata becomes stale. Mitigation: those plays are either surviving (and rebuilt in 214.2 T10) or deleted (214.3).

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Amend whitelist to add `evidence/checkpoints/status/` as siblings under `.meridian/product/` | Breaks the core principle of three buckets. Ops files fit inside the buckets using underscore-prefixed subfolders. |
| Keep `core/config.yaml` at repo root | Semantic mismatch — config describes `.meridian/` state and should live there. Repo-root `core/` is for authored framework components. |
| Phase the folder migration (dual-path coexistence) | Every play would need to read both old and new paths. Dual-path bugs are easy to write and hard to find. One-shot migration is cleaner. |
| Keep L1/L2 classification as advisory | The classification was always used as a gate, not advice. "Advisory" in practice means "ignored until it blocks you". Better to delete. |
| Soft alias `--bake` during migration | Half-state creates ongoing confusion about the canonical verb. Hard cut forces consistency from day one. Users who prefer `--bake` aren't served by silently accepting it. |
| Keep the "bake" metaphor | Inconsistent with the sports metaphor the rest of the framework uses. The verb sequence `specify-product` / `design-exp` / `build-arch` works better with "build" than "bake". |

## Migration Plan (214.2)

1. **T6** — This ADR (status: Proposed).
2. **T6a** — `git mv core/config.yaml .meridian/core/config.yaml`; grep-sweep every `core/config.yaml` reference and update.
3. **T6b** — Update CLAUDE.md (remove section 4, replace with one sentence, fix bake references).
4. **T6c** — Grep repo for `--bake` / `--rebake`; rename to `--build`. Update `/create-play` skill.
5. **T7** — Rewrite `product.directories` block.
6. **T8** — Rewrite `stm.structure` block.
7. **T9** — Update path references in surviving source files (product-strategist.md, quality-check-scoped SKILL.md and reference).
8. **T10** — Rebuild affected surviving plays (briefs, review-pr, commit-code with scriber adoption). Interactive — user drives.
9. **T11** — Update `docs/components/plays.md` and `memory.md` to reflect the new paths, terminology, and whitelist.

Status flips from Proposed to Accepted when 214.2 merges to main.

## References

- Issue #214 — Build product planning and design pipeline (the umbrella issue whose planning surfaced these frictions)
- `.meridian/project/issues/214/specs/spec.md` — full specification with constraints C1–C13
- `.meridian/project/issues/214/specs/tasks.md` — T6 through T11 tasks with file-level details
- `core/components/memory/MEMORY.md` feedback entry: `feedback_meridian_folder_structure.md` (user-declared 2026-04-13)
- `core/components/memory/MEMORY.md` feedback entry: `feedback_intent_schema_purity.md` (updated 2026-04-14 with metadata permission)
