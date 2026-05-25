---
name: normalize-proposals-for-enrichment
description: Read a native proposals.yaml staged in an issue's STM by distill, reap, codify, or decode, detect which extractor produced it, and emit a normalized reconciliation-proposals.yaml ready for reviewer approval and downstream LTM writes by apply-ltm-enrichment. Used exclusively by the enrich play. Per-source mapping logic lives here.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep
---

# normalize-proposals-for-enrichment

Model-invocable skill that owns the per-source mapping inside the `enrich` play.

## Purpose

The Learning Pipeline has four extractors — `distill` (L1, per-PR), `reap` (L2, per-epic), `codify` (L3, brownfield bootstrap), and `decode` (brownfield behavior extraction) — and each writes proposals into STM in its own native shape. `enrich` is the sole LTM write boundary, and before any write happens it needs every proposal in one consistent form so the downstream review gate and the `apply-ltm-enrichment` writer can stay simple.

This skill is that boundary. It detects which extractor produced a given proposals.yaml, runs the appropriate per-source mapping, validates the two-level taxonomy contract, and emits a `reconciliation-proposals.yaml` with every entry initialized to `approval_status: pending`. The native source file is never modified — STM stays a faithful record of what each extractor said.

The play itself owns the reviewer interaction (T1 per-proposal, T2/T3 batch-with-diff). This skill ends at "ready for review."

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `proposals_path` | yes | Path to the native proposals.yaml in STM (e.g., `{stm_base}/{issue}/evidence/reap/proposals.yaml`) |
| `issue_id` | yes | Issue number — recorded in output provenance |
| `output_path` | yes | Where to write `reconciliation-proposals.yaml` (typically `{stm_base}/{issue}/evidence/enrich/reconciliation-proposals.yaml`) |

## Process

### 1. Detect source

Determine which extractor produced the proposals file:

| Path matches | Source |
|--------------|--------|
| `evidence/distill/` | `distill` |
| `evidence/reap/` | `reap` |
| `evidence/codify/` | `codify` |
| `evidence/decode/` | `decode` |

If no path segment matches, fall back to a top-level `source:` field in the proposals.yaml itself. If neither resolves, return:

```yaml
status: failed
reason: source_undetectable
```

The source matters because the four extractors emit different field shapes — fields like `proposed_content` (distill), `change` + `from_finding` + `adr_draft_path` (reap), or master-index entries with `meta` blocks (codify / decode). Knowing the source up front lets later steps pick the right mapper without guessing per-entry.

### 2. Validate the taxonomy contract

For every entry in the source proposals, check that all three taxonomy fields are present and non-empty:

- `learning_category`
- `sub_category` (may be `null` only for flat parents `domain` and `product` — null is valid there, missing is not)
- `taxonomy_justification` — required when `learning_category_proposed` or `sub_category_proposed` is true; carried through verbatim when present

Entries failing the contract are NOT dropped. They are emitted into the output as rejected entries with `status: rejected, reason: missing_taxonomy` so the reviewer sees what was excluded and why. The play needs visibility into the full source shape; silent drops would hide drift.

### 3. Map to reconciliation shape (per-source)

The output entry shape consumed by `apply-ltm-enrichment` is:

```yaml
proposal_id: "..."
source_play: distill | reap | codify | decode
source_proposal_id: "..."        # original id from the source
tier: 1 | 2 | 3
learning_category: "..."
sub_category: "..."              # or null for flat parents
learning_category_proposed: bool
sub_category_proposed: bool
taxonomy_justification: { ... }  # passthrough when present
target_path: "..."               # LTM artifact path
action: modify | add | contradict_with_adr
change: |
  ...
adr_draft_path: "..."            # only when action == contradict_with_adr
impact:
  downstream_artifacts: [...]
  plays_affected: [...]
  risk: low | medium | high
approval_status: pending          # always initialized to pending
```

Mapping rules per source:

#### reap

reap proposals (authored by `draft-enrichment-proposals`) are already close to the target shape. Pass through `tier`, `target_path`, `action`, `change`, `impact`, and the taxonomy fields directly. Carry `adr_draft_path` as-is when present (T1 with ADR draft). `proposal_id` becomes a stable identifier of the form `enrich-{issue_id}-{source_proposal_id}`.

#### distill

distill proposals carry `confidence`, `proposed_content`, and `evidence_diff_reference`. distill emits L1 hunches without a pre-decided LTM target, so:

- `tier` defaults to 2 (enrichment of an existing artifact) unless the proposal explicitly carries a tier field.
- `target_path` derivation: if the distill proposal names a target file, use it. Otherwise, search `.garura/product/` (using Grep / Glob over taxonomy and topic keywords from `proposed_content`) and take the best match. If no plausible target is found, emit the entry as rejected with `reason: target_unresolved` — the reviewer should see what couldn't be placed.
- `action` defaults to `modify` for tier 2.
- `change` is the `proposed_content` block, lightly reshaped to fit the target artifact's section structure when obvious. Don't invent content.
- `impact` is constructed minimally: `risk: low` (distill proposals are PR-scoped hunches), `downstream_artifacts: []`, `plays_affected: []` unless the source carries them.

#### codify

codify proposals come through `aggregate-codify-proposals` as a master index with `proposals: [...]` entries, each carrying a `meta` block (`source_type: inferred_from_code`, `evidence`, `confidence`, `learning_category`, `sub_category`, `tier`, optional `adr_draft_path`, optional `impact`, optional `taxonomy_justification`).

- Tier and taxonomy come from the `meta` block.
- `target_path` is the LTM-relative destination already recorded in the master index entry.
- `action`: determined by target-path existence in `product_ltm_root` — `add` when `{product_ltm_root}/{target_path}` does not exist on disk, `modify` when it does. Tier 1 remains `contradict_with_adr` (unchanged). Tier 3 is always `add` (experience/* is never pre-seeded). For tier 2, the mapper checks existence before assigning action — aligning with the decode mapper's pattern.
- `change` is the file content the inference produced. For YAML proposals, this is the file body. For markdown, the body sans frontmatter.
- `impact` carries through; default `risk: medium` if absent (codify writes large surface).
- `adr_draft_path` carries through when present.

#### decode

decode proposals come through `aggregate-decode-proposals` as a master index pointing at behavior specs, flow specs, aspect specs, and generated tests.

- `target_path` lives under `.garura/product/experience/` (flows, screens) or `.garura/product/specification/behaviors/` (behavior specs) — use the path the master index emits.
- `action` is `add` for new specs, `modify` for updates to existing.
- `tier` is typically 3 for new behavior/flow/aspect specs, 2 when overlaying onto an existing surface.
- Generated tests are NOT promoted into product LTM — if the source entry's target is under a tests/ path, emit it as rejected with `reason: out_of_scope_target` (tests live in the repo, not in product LTM).
- `change` is the spec content the extractor produced.

### 4. Validate target path scope

For every successfully mapped entry, confirm the resolved `target_path` is under one of:

- `.garura/product/` — product LTM root (the bulk of writes)
- `docs/adr/` — ADR archive (only valid for `action: contradict_with_adr` entries with an `adr_draft_path`)

Anything else is a scope violation. Emit such entries as rejected with `reason: out_of_scope_target` and continue. This is a defensive check; sources should not produce out-of-scope targets, but if one does, the reviewer needs to see it rather than have it silently leak.

### 5. Initialize approval status

Every successfully mapped entry gets `approval_status: pending`. The play sets this to `approved` or `rejected` after the reviewer interaction; `apply-ltm-enrichment` only writes entries marked `approved`.

### 6. Write the reconciliation file

Write the output to `output_path`:

```yaml
sourced_from: "{proposals_path}"
detected_source: distill | reap | codify | decode
issue_id: "{issue_id}"
generated_at: "{ISO-8601}"
proposals:
  - proposal_id: "..."
    # ... (full entry as in step 3)
rejected:
  - source_proposal_id: "..."
    reason: missing_taxonomy | target_unresolved | out_of_scope_target | unmapped_action
    detail: "..."
summary:
  normalized: N
  rejected: M
```

The `rejected` list captures everything that didn't make it through. The reviewer (and the play's evidence record) sees both.

## Output

```yaml
reconciliation_proposals_path: "{output_path}"
detected_source: distill | reap | codify | decode
normalized_count: N
rejected_count: M
status: written | failed
reason: "..."   # only when status: failed
```

## Failure Modes

| What failed | Cause | Return |
|-------------|-------|--------|
| Proposals file missing | I/O | `status: failed, reason: missing_input` |
| Proposals file malformed YAML | Parse | `status: failed, reason: malformed_input` |
| Source undetectable from path or `source:` field | Detection | `status: failed, reason: source_undetectable` |
| Output path unwritable | I/O | `status: failed, reason: output_write_error` |
| All entries rejected (zero normalized) | Source quality | `status: written` with `normalized_count: 0` — not a failure; the play handles the empty case |

Hard failures halt processing entirely. Per-entry rejections (missing_taxonomy, target_unresolved, out_of_scope_target) are recorded in the output and processing continues — they are observable, not fatal.

## Boundaries

- Reads `proposals_path` (the native source) and may Grep / Glob `.garura/product/` to resolve target paths for `distill` entries. Both are read-only.
- Writes ONLY to `output_path`. Never writes to `.garura/product/`, `docs/adr/`, `~/.garura/core/memory/`, or back into `evidence/{distill,reap,codify,decode}/`.
- Never invokes `apply-ltm-enrichment`, `promote-adr-draft`, `archive-issue-stm`, or any other LTM-touching skill — those are the play's calls to make.
- Stateless across calls. The play decides which proposals files to feed in, in what order.
- Does NOT classify or re-classify taxonomy. The two-level taxonomy is taken verbatim from the source. This skill validates it, doesn't author it.
