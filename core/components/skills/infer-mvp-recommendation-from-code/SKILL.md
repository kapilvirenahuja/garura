---
name: infer-mvp-recommendation-from-code
description: Infer the MVP recommendation from scan-index.json during /codify by reverse-engineering what the shipped codebase ALREADY treats as v1 — primary use cases evidenced by release history, entry points, churn, and README — plus deferred capabilities evidenced by thin/scaffold-only code. Output is Markdown with YAML frontmatter. Used exclusively by product-keeper in the /codify play.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
---

# infer-mvp-recommendation-from-code

Called by `product-keeper` during /codify. Produces `scope/mvp-recommendation.md` at `{stm_base}/{issue}/evidence/codify/proposals/scope/mvp-recommendation.md`.

## Purpose

In greenfield /specify, `recommend-mvp` narrows a brief's use cases into a v1 plan — "what SHOULD the MVP be". In brownfield /codify, the MVP has already shipped. This skill inverts the semantics: it reconstructs "what IS the MVP" from the codebase itself.

The shipped MVP is evidenced by three reinforcing signals: (a) what has been released (git tags), (b) what is actively maintained (churn), and (c) what is exposed to users (entry points + README feature enumeration). Capabilities that appear in the tree but lack these signals — empty modules, commented-out routes, TODO-heavy files, `v0`-prefixed paths — are deferred capabilities: wired but not part of the shipped MVP.

This skill does NOT make product recommendations the user has not committed to. It observes what is in the codebase and surfaces it for review at the /codify checkpoint. Every primary use case traces to concrete evidence paths in `scan-index.json`; every deferred capability traces to a thin-code signature.

## Input

Receive from product-keeper via JSON contract.

- `scan_index_path` (path, required) — `scan-index.json` produced by scan-codebase.
- `stm_base` (path, required) — STM root resolved from `.garura/core/config.yaml` `stm.base-path`.
- `issue` (str, required) — issue number driving /codify.
- `output_path` (path, required) — `{stm_base}/{issue}/evidence/codify/proposals/scope/mvp-recommendation.md`.
- `decision_manifest_path` (path, required) — `decision-manifest-infer-mvp-recommendation-from-code.yaml` alongside the artifact.
- `ltm_context` (block, required) — `{product_base, core_base, query_domains, locked_artifacts}`. Presence triggers the Resolution Protocol.
- `resolution_trace_path` (path, required) — where `resolution-trace.yaml` is written.

## Process

1. **Validate inputs.** Confirm `scan_index_path` exists and parses as JSON. Confirm `stm_base` exists. Create `output_path` and `decision_manifest_path` parent directories if missing. Missing/malformed scan-index → structured failure `scan_index_missing`.

2. **Execute LTM Resolution Protocol (R1 → R2 → R3 → R4)** per `core/components/memory/standards/rules/resolution.md`. Domains: `product`, `scope`. R2 explicitly checks `{product_base}scope/mvp-recommendation.md` — if an authoritative MVP recommendation already exists in product LTM, halt and write a resolution trace noting `existing_artifact_found: true`; /codify's orchestrator decides whether to skip or overwrite. Write the trace to `resolution_trace_path`.

3. **Extract shipped-MVP signals from scan-index.**
   - **Release history** — `git.tags_recent`. Each tag is a shipped milestone. If empty, mark the milestone axis `insufficient` and carry a meta warning.
   - **Entry points** — `entry_points`. The user-facing surface: CLI bins, server routes, exposed main modules, frontend pages.
   - **Churn top** — `git.churn_top` (top ~20 files). Hot paths indicate active core functionality.
   - **README feature enumeration** — `docs.readme_preview`. Extract the "Features" / "What it does" / "Capabilities" bullet list when present. This is often the MVP in the product's own words.
   - **Trees** — `trees` top-level modules. Each is a candidate capability.
   - **Co-change** — `git.co_change_top`. Pairs of files that change together reveal capability cohesion; use to collapse signals into a single use case.

4. **Group signals into primary use cases.** For each candidate capability (top-level module or README-named feature), compute three signal flags:
   - `has_churn` — at least one file under the capability's path appears in `git.churn_top`.
   - `has_entry_point` — at least one file under the capability's path is in `entry_points`.
   - `has_readme_mention` — the capability name (or its path-derived slug) appears in the extracted README feature list.

   **Classification heuristic — explicit:**
   - **primary use case** — `(has_churn AND has_entry_point)` OR `(has_readme_mention AND (has_churn OR has_entry_point))`. Confidence: `high` when all three flags, `medium` when two, `low` when one of the OR arms fires alone.
   - **deferred capability** — the capability is present in `trees` but fails primary classification AND at least one thin-code signature applies:
     - empty module (no `.*` files under the path, or only `__init__.py` / `index.ts` with zero exports in scan-index evidence),
     - commented-out routes (`entry_points` entries tagged disabled, or README mentions with no matching entry point),
     - TODO-heavy files (scan-index TODO/FIXME density signal when present),
     - version-0-prefixed paths (`v0`, `experimental`, `wip`, `draft` in the capability path).
   - **uncertain** — fails primary classification but also fails every thin-code signature. Record in the manifest at `confidence: low`; do NOT force a primary/deferred classification. The user resolves at the checkpoint.

   Collapse co-changing capabilities into a single use case when `git.co_change_top` links their paths above the scan-index's declared threshold. The resulting use-case `id` is kebab-case (`auth-signup`, `catalog-browse`); the `name` is a short human label; `description` is one sentence.

5. **Author the artifact.** Markdown with YAML frontmatter. The frontmatter is the meta block; the body carries the sections product-keeper and the user read at the checkpoint.

   Body sections, in order:
   - `# Primary Use Cases` — numbered list. Each item: id, name, one-sentence description, evidence paths (modules / routes / churn), confidence, signal flags.
   - `# Deferred Capabilities` — numbered list. Each item: id, name, `defer_reason` (which thin-code signature triggered), `v1_1_trigger` (a named observable signal that would justify promotion — "appears in churn_top for 2 consecutive scans", "README feature-list mention added", "entry point activated"), evidence path.
   - `# Evidence Table` — tabular summary: capability | path | has_churn | has_entry_point | has_readme_mention | classification | confidence.
   - `# Confidence Notes` — plain-English summary of where the inference is strong, where it is weak, and any `insufficient` axes (e.g., empty tag history, missing README feature list). Note any `uncertain` capabilities and the questions the user must answer at the checkpoint.

6. **Write decision manifest.** One entry per classified capability:
   ```yaml
   decisions:
     - capability_id: "{id}"
       tier: 2
       grounding_source: "scan-index:<json-path>"
       classification: "primary | deferred | uncertain"
       signal_flags: {has_churn, has_entry_point, has_readme_mention}
       recommendation: "v1-primary | v1.1-deferred | needs-user-grounding"
       alternatives_considered: [ ... ]
       confidence: "high | medium | low"
   ```
   For every `uncertain` or `low`-confidence entry, `alternatives_considered` MUST be non-empty — at minimum the opposite classification with its rationale.

7. **Write resolution trace** per `core/components/memory/standards/rules/resolution.md` schema to `resolution_trace_path`.

## Output

Primary artifact at `output_path` (Markdown with YAML frontmatter):

```markdown
---
meta:
  source_type: "inferred_from_code"
  evidence:
    - "scan-index.json#/git/tags_recent"
    - "scan-index.json#/entry_points"
    - "scan-index.json#/git/churn_top"
    - "scan-index.json#/docs/readme_preview"
    - "scan-index.json#/trees"
    - "scan-index.json#/git/co_change_top"
  confidence: "high" | "medium" | "low"
  learning_category: "product"
  sub_category: null
  tier: 2
  scan_status_warning: null
---

# Primary Use Cases
...

# Deferred Capabilities
...

# Evidence Table
...

# Confidence Notes
...
```

Decision manifest at `decision_manifest_path` (schema above).

Resolution trace at `resolution_trace_path` per resolution.md schema.

No product LTM writes. All output is under STM.

## Failure Modes

- `scan_index_missing` — `scan_index_path` does not exist or is not valid JSON.
- `ltm_resolution_failed` — Resolution Protocol raised an error; halt and return the trace path for triage.
- `insufficient_signal` — empty `git.tags_recent` AND empty `git.churn_top` AND empty `docs.readme_preview` feature section (e.g., brand-new repo with no release history or README). Proceed with `meta.confidence: low`, set `scan_status_warning: "insufficient git/readme signal — MVP inferred from trees + entry_points only"`, and record every capability at `confidence: low` in the manifest. Do NOT fabricate a primary classification without at least one reinforcing signal.
- `output_parent_missing` — `output_path` parent cannot be created; return structured failure.

## Boundaries

- Read-only against the codebase. The scan-index is the sole input — this skill does NOT open source files directly.
- Signals not listed in step 3 MUST NOT be invented. If scan-index lacks a signal, the corresponding axis is recorded as `insufficient` and confidence lowers accordingly.
- No writes outside `{stm_base}/{issue}/evidence/codify/proposals/scope/` and the two companion files (decision manifest, resolution trace).
- Never classify a capability as `primary` without at least one evidence path. Never classify a capability as `deferred` without at least one thin-code signature. Ambiguity is `uncertain`, not a guess.
