# ADR 017 — `.garura/` Folder Whitelist and Play Terminology Cleanup

**Status:** Proposed
**Date:** 2026-04-14
**Supersedes:** none (partial overlap with ADR 008 issue-centric STM, ADR 013 play maturity model)
**Related:** ADR 001 (three-layer hierarchy), ADR 008 (issue-centric STM), ADR 013 (play maturity model — superseded by this ADR's "no levels" decision), ADR 016 (agent JSON contract)

## Context

Three separate frictions accumulated in Garura's folder and play conventions as the framework matured:

1. **Folder drift under `.garura/`.** Different plays wrote evidence, checkpoints, status files, and product artifacts to ad-hoc locations. `core/config.yaml` enumerated seven product subdirectories (`discovery/`, `roadmap/`, `architecture/`, `evidence/`, `briefs/`, `checkpoints/`, `status/`) that grew organically as plays were added. Issue STM used five keys (`spec/`, `design/`, `evidence/`, `delivery/`, `checkpoint/`) with overlapping meanings. New plays couldn't predict where their artifacts should land.

2. **Config file living outside its data.** `core/config.yaml` sat at the repo root inside `core/` — which holds the authored framework components (agents, skills, plays, memory). Its content — STM paths, product paths, review settings, project metadata — is about the `.garura/` tree. The config's natural home is inside `.garura/` with the state it describes.

3. **Play ceremony inflation.** ADR 013 introduced Level-1 / Level-2 plays with a "≤5 domain agent" budget. In practice the levels added compliance overhead without improving coherence — a well-shaped play fails its scenario evals if it's bloated, regardless of agent count. The "bake" terminology for play compilation (`/create-play --bake`) carried a cooking metaphor that didn't match the sports metaphor the rest of the framework uses (plays are *run*, teams are *built*).

These frictions became blocking when the product-planning pipeline (`specify`, `design`, `arch`) was designed — the new plays needed a predictable folder layout, a clean config location, and terminology that matched the sports metaphor. Fixing them piecemeal would leave the framework inconsistent during the transition, so the cleanup lands as one ADR.

## Decision

### 1. Strict `.garura/` folder whitelist

The `.garura/` tree allows ONLY these folders. No other top-level or second-level folders are permitted anywhere under `.garura/`:

```
.garura/
├── core/                                     # framework state (config, synced memory)
├── product/                                  # the product being built — all SDLC stages
│   ├── user-provided/                        # user inputs: project brief + notes + questions
│   ├── specification/                        # opportunity + domain shape: market-brief, project-profile,
│   │                                         # domain-selection, domain-grounding, quality-profile
│   ├── scope/                                # v1 scope contract: mvp-recommendation, scope.yaml,
│   │   ├── mvp-recommendation.md             # enriched-capabilities, validation-intent-epics, epics/
│   │   ├── scope.yaml
│   │   ├── enriched-capabilities.yaml
│   │   ├── validation-intent-epics.yaml
│   │   └── epics/                            # one YAML per intent epic
│   ├── architecture/                         # architecture-stage output (architecture play)
│   ├── experience/                           # experience-stage output (designerience play)
│   ├── research/                             # product domain library: KB copies + researched domains
│   │                                         # (Defect 8 Pull-to-Product)
│   ├── _checkpoints/                         # play-lifecycle: per-stage Tether/Vanish artifacts
│   ├── _evidence/                            # play-lifecycle: play-close self-commit files
│   └── _status/                              # play-lifecycle: resume state for paused plays
└── project/
    └── issues/
        ├── _pending/                         # pre-issue pending artifacts
        ├── _archive/                         # archived closed issues
        └── {issue_no}/
            ├── specs/                        # plans
            ├── evidence/                     # test and eval evidence
            ├── checkpoint/                   # play approval gates
            ├── context/                      # prepare / architecture context
            └── review/                       # review artifacts
```

**Stage-centric vs play-centric:** `.garura/product/` is organized by SDLC stage (user-provided → specification → scope → architecture → experience), not by play. A single stage folder may hold output from multiple plays — e.g., `specification/` holds market-brief (from specify's Stage 1 market-analyst), project-profile (user-provided during pre-flight), quality-profile (from specify's Stage 6 product-keeper). The folder name describes *what the artifact is*, not *which play produced it*.

**`research/` is the product's frozen domain library (Defect 8 Pull-to-Product).** Per `rules/product.md` Rule 15, every domain the product uses lands here at Stage 2 selection time — whether the content came from the canonical KB (`core/components/memory/knowledge/domain/`) or from fresh research. Each file carries a provenance header: `origin: kb` (with `kb_sha_at_copy`, `editable: false`) for copies, or `origin: stm_research` (editable: true, pending future `/capture-learning` promotion) for freshly-authored content. Stage 3 and every later stage (configure-capabilities, enrich-capabilities, generate-intent-epics) read from this folder ONLY — they do not read from the KB directly. This makes every product run reproducible (a KB edit does not retroactively change historical runs) and gives the product a single read path for domain content regardless of origin.

**`scope/mvp-recommendation.md` (Defect 9).** The MVP recommendation artifact is a scope-narrowing decision authored at Stage 2.75 (between domain-selection and configure-capabilities). It lives in `scope/`, not `specification/`, because it answers "what are we building for v1?" (a scope question), not "what is the opportunity?" (a specification question). Required by Rule 13 and C15. configure-capabilities reads it to narrow the capability walk to primary use cases.

**`_checkpoints/` / `_evidence/` / `_status/` are orthogonal play-lifecycle folders.** They live at the product root alongside the stage folders, not inside them. A single play writes to all three: it produces Tether artifacts in `_checkpoints/{play-name}/`, evidence at close in `_evidence/{play-name}/`, and a resume status file at `_status/{play-name}.json`. Keeping them at the root reflects that play lifecycle is orthogonal to SDLC stage — a single play can write across multiple stage folders in one run.

**Defect 1 amendment (2026-04-14):** the earlier `.garura/product/` + `ux/` + `arch/` three-bucket layout is REPLACED by the stage-centric layout above. The doubled `product/product` name was awkward in practice and the play-centric three buckets didn't extend cleanly to cross-stage artifacts. The new layout makes the SDLC visible in the folder structure: a reviewer can walk `user-provided → specification → scope → architecture → experience` and see the product take shape stage by stage.

### 2. Config relocation

`core/config.yaml` is MOVED to `.garura/core/config.yaml`. The move is a `git mv` to preserve history. Every reference to `core/config.yaml` across `core/components/`, `docs/`, `CLAUDE.md`, and memory workflows is updated.

`.garura/core/memory/` remains gitignored (per the existing pattern). `.garura/core/config.yaml` is tracked — the gitignore entry for `.garura/core/memory/` is scoped to that subdirectory only.

Rationale: the config describes `.garura/` state; it belongs there. Repositioning it also makes it possible (in a follow-up) for per-project configs to diverge — each project has its own `.garura/core/config.yaml` rather than sharing a framework-wide default.

### 3. Config content reconciliation

**`product.directories`** (updated 2026-04-14 per Defect 1) becomes exactly six stage keys:

```yaml
product:
  base-path: .garura/product/
  directories:
    user-provided: user-provided/
    specification: specification/
    scope: scope/
    architecture: architecture/
    experience: experience/
    research: research/
```

The play-lifecycle folders (`_checkpoints/`, `_evidence/`, `_status/`) are NOT listed under `directories` — they're orthogonal to the stage layout and live at the product root by convention, not by config.

The prior three-key layout (`product / ux / arch`) is superseded. The keys `discovery`, `roadmap`, `architecture`, `evidence`, `briefs`, `checkpoints`, `status` from the even-earlier seven-key layout remain removed.

**`stm.structure`** becomes exactly five keys:

```yaml
stm:
  base-path: .garura/project/issues/
  pending-path: .garura/project/issues/_pending/
  archive-path: .garura/project/issues/_archive/
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

Reasoning: the sports metaphor rest of the framework uses (build the team, run the play) is clean; "bake" was a leftover cooking metaphor from early prototypes. Build aligns with (a) the verb sequence `specify` → `design` → `arch`, and (b) the natural pipeline *create → build → run*.

Every doc, agent, skill, and play that references "bake"/"baked"/"baking" in a play-compilation context is updated. User memory ("Recipe changes only through rebake") remains semantically correct — the behavior is still "never edit SKILL.md directly; update intent.yaml and rebuild" — only the verb changes.

## Consequences

### Positive

- **Predictable folder shape.** Every play, agent, and skill knows exactly where to write. New plays inherit the three-bucket layout without invention.
- **Single whitelist enforcement boundary.** The `write-evidence` skill (214.1) validates every write against the whitelist. Folder compliance is checked once, automatically, at the write boundary.
- **Config lives with its data.** Config relocation aligns `.garura/core/config.yaml` with the `.garura/` tree it describes.
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
| Amend whitelist to add `evidence/checkpoints/status/` as siblings under `.garura/product/` | Breaks the core principle of three buckets. Ops files fit inside the buckets using underscore-prefixed subfolders. |
| Keep `core/config.yaml` at repo root | Semantic mismatch — config describes `.garura/` state and should live there. Repo-root `core/` is for authored framework components. |
| Phase the folder migration (dual-path coexistence) | Every play would need to read both old and new paths. Dual-path bugs are easy to write and hard to find. One-shot migration is cleaner. |
| Keep L1/L2 classification as advisory | The classification was always used as a gate, not advice. "Advisory" in practice means "ignored until it blocks you". Better to delete. |
| Soft alias `--bake` during migration | Half-state creates ongoing confusion about the canonical verb. Hard cut forces consistency from day one. Users who prefer `--bake` aren't served by silently accepting it. |
| Keep the "bake" metaphor | Inconsistent with the sports metaphor the rest of the framework uses. The verb sequence `specify` / `design` / `arch` works better with "build" than "bake". |

## Migration Plan (214.2)

1. **T6** — This ADR (status: Proposed).
2. **T6a** — `git mv core/config.yaml .garura/core/config.yaml`; grep-sweep every `core/config.yaml` reference and update.
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
- `.garura/project/issues/214/specs/spec.md` — full specification with constraints C1–C13
- `.garura/project/issues/214/specs/tasks.md` — T6 through T11 tasks with file-level details
- `core/components/memory/MEMORY.md` feedback entry: `feedback_meridian_folder_structure.md` (user-declared 2026-04-13)
- `core/components/memory/MEMORY.md` feedback entry: `feedback_intent_schema_purity.md` (updated 2026-04-14 with metadata permission)
