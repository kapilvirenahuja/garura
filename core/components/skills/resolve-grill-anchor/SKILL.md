---
name: resolve-grill-anchor
description: Lock the anchor for a grilling session and inventory every target-shape artefact that references it. Resolves the anchor target (epic, feature, tech-decision, or design-decision) to a concrete LTM file, extracts the declared constraints/rules/failure-scenarios that grilling will defend against, walks the product LTM cross-reference graph to enumerate downstream touchpoints, and writes two STM artefacts the play consumes throughout the session. Halts cleanly when the anchor is unresolvable or the target has nothing to defend against. Used only by the grill-me play.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep
---

# resolve-grill-anchor

Locks the anchor for a grilling session and produces the two STM artefacts the
grill-me play reads throughout its rounds and at session close: the **anchor
lock** (what is being defended) and the **downstream touchpoints inventory**
(every target-shape artefact the locked shape might affect).

This skill exists because grill-me's central guarantee — every push-back cites
a specific declared constraint of the target — requires those declarations to
be known at session start, not discovered round-by-round. And grill-me's
atomic close bundle requires the full touchpoint set known up-front, so the
session can probe linkages mid-flight and write everything in one transaction.

The skill is deterministic — file resolution and reference walking, no LLM
reasoning. Conservative defaults wherever the inventory is ambiguous: prefer
including a touchpoint over silently dropping it.

## Purpose

Given a chosen anchor kind and target identifier, produce:

1. `anchor-lock.yaml` — what the session defends against (constraints, rules,
   failure scenarios declared on the target) and which conversational register
   downstream questioning uses.
2. `downstream-touchpoints.yaml` — every product LTM target-shape artefact
   that references the anchor and may therefore appear in the close bundle.

If the target cannot be resolved or has nothing to defend against, the skill
halts with a structured reason — grill-me uses this to exit before round one
with a plain-language explanation to the human.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `anchor_kind` | yes | One of `epic`, `feature`, `tech-decision`, `design-decision`. No other value accepted (enforces grill-me C5). |
| `anchor_target` | yes | Identifier appropriate to `anchor_kind`. See **Anchor resolution** below. |
| `product_base` | yes | Path to product LTM root, from `.garura/core/config.yaml` `product.base-path`. |
| `stm_base` | yes | STM root, from `.garura/core/config.yaml` `stm.base-path`. |
| `issue` | yes | Issue number — STM artefacts land at `{stm_base}/{issue}/evidence/grill-me/`. |

## Anchor resolution

The skill maps `anchor_kind` to a small, fixed set of candidate paths under
`product_base` and resolves `anchor_target` against them. The first match wins.
If no match is found, halt with `reason: anchor_unresolvable`.

| `anchor_kind` | `anchor_target` may be | Resolved against |
|---------------|------------------------|------------------|
| `epic` | epic id (e.g. `E-001`) or a path | `{product_base}specification/epics/*.yaml` (id match on `name:` field or filename); direct path accepted if it exists |
| `feature` | feature id or path | `{product_base}scope/features.yaml` entries (id match) for feature-spec resolution; direct path accepted |
| `tech-decision` | path | Files under `{product_base}architecture/` — `logical-architecture.yaml`, `physical-architecture.yaml`, `design-patterns.yaml`, `nfr-spec.yaml`, `quality-vision.yaml`, or an ADR under `docs/adr/` |
| `design-decision` | path | `{product_base}experience/design-system.md`, `{product_base}experience/design-spec.md`, or any file under `{product_base}experience/` |

Register is determined by anchor kind and recorded in the lock so the play's
C3 enforcement knows which vocabulary to use:

| `anchor_kind` | `register` |
|---------------|------------|
| `epic` | `product` |
| `feature` | `product` |
| `tech-decision` | `technical` |
| `design-decision` | `technical` |

## Extracting what is defended

After resolving the anchor file, read it and extract:

- **constraints** — any `constraints:` list, or any field/section explicitly
  named "constraints" / "rules" / "principles" in YAML or markdown
  frontmatter.
- **business rules** — `business_rules:`, or markdown sections titled
  "Business Rules" / "Rules" within the anchor file.
- **failure scenarios** — `failure_conditions:` / `failure_scenarios:` /
  markdown sections titled "Failure Scenarios" / "Failure Conditions" / "What
  goes wrong" / equivalent.

For epics, also lift `success_scenarios:` if present — they are part of what a
grilling session can defend against (an answer that contradicts a stated
success scenario is a tension).

If all three sets are empty after extraction → halt with
`reason: no_grillable_target`. This is the F5 / C6 enforcement.

## Inventory of downstream touchpoints

Walk the product LTM looking for cross-references to the locked anchor. Use
both YAML reference fields and markdown frontmatter / inline references. The
goal is breadth — every artefact the locked shape's edits might need to
propagate to. False positives are cheap (grill-me will skip them mid-session
if no edit is implied); false negatives are expensive (drift).

Reference patterns to search for, by anchor kind:

| Anchor kind | Search for references in | Reference patterns |
|-------------|---------------------------|---------------------|
| `epic` | `{product_base}experience/personas/*.md`, `{product_base}experience/screens/*.md`, `{product_base}experience/flows/*.md`, `{product_base}scope/features.yaml`, `{product_base}specification/epics/*.yaml` | epic id literal, epic file path, `epic:` / `epic_id:` / `epics:` frontmatter or yaml fields, `[[E-NNN]]` wiki-link style |
| `feature` | persona/screen/flow markdown, `{product_base}scope/features.yaml`, epic files | feature id literal, `feature:` / `feature_id:` fields, `[[F-NNN]]` |
| `tech-decision` | `{product_base}architecture/*.yaml`, `docs/adr/*.md`, `{product_base}specification/quality-profile.yaml` | ADR id, decision name, file basename, `decision:` / `adr:` / `supersedes:` fields |
| `design-decision` | `{product_base}experience/screens/*.md`, `{product_base}experience/flows/*.md`, `{product_base}experience/design-spec.md`, `{product_base}experience/wireframes/` | token name, design-system section heading, file basename |

For every artefact that references the anchor, record:

```yaml
- artefact_path: <relative path from repo root>
  artefact_kind: persona | screen | flow | feature_spec | epic | design_system | design_spec | logical_architecture | physical_architecture | nfr_spec | quality_vision | design_patterns | adr | other
  reference_type: <how it links — "frontmatter field", "yaml ref", "inline mention", "wiki-link", etc.>
  owning_play: <informational only — which play normally maintains this artefact: design | arch | specify | craft-ice | prepare>
```

`owning_play` is informational — grill-me itself owns every edit at close per
C12. The field exists so the close bundle's diff view can label each edit
with which play would normally have touched it.

## Process

1. **Validate `anchor_kind`** is one of the four permitted values. If not,
   halt with `reason: invalid_anchor_kind`. (Enforces C5 / F11.)
2. **Resolve `anchor_target`** to a file path per the table above. Halt with
   `reason: anchor_unresolvable` on no match.
3. **Read the anchor file.** Extract constraints, business rules, failure
   scenarios, success scenarios. Halt with `reason: no_grillable_target` if
   all empty. (Enforces C6 / F5.)
4. **Walk references.** Search the patterned paths for cross-references back
   to the anchor. Classify each hit by `artefact_kind` and `reference_type`.
5. **Write `anchor-lock.yaml`** to `{stm_base}/{issue}/evidence/grill-me/`.
6. **Write `downstream-touchpoints.yaml`** to the same directory.
7. **Return** the two paths plus counts.

## Output

**`anchor-lock.yaml`** structure:

```yaml
anchor_kind: epic | feature | tech-decision | design-decision
anchor_target_input: <verbatim input string>
anchor_target_path: <resolved relative path>
constraints_source_path: <same as anchor_target_path in v1; may diverge later>
register: product | technical
defended_constraints:
  - id: <e.g. C1>
    text: <verbatim rule text>
defended_business_rules:
  - id: <or null when source has no ids>
    text: <verbatim rule text>
defended_failure_scenarios:
  - id: <or null>
    text: <verbatim>
defended_success_scenarios:    # populated only for epic/feature anchors
  - id: <or null>
    text: <verbatim>
resolved_at: <ISO 8601 timestamp>
```

**`downstream-touchpoints.yaml`** structure:

```yaml
anchor_target_path: <same as in anchor-lock>
inventoried_at: <ISO 8601 timestamp>
touchpoints:
  - artefact_path: <relative path>
    artefact_kind: <one of the enum above>
    reference_type: <how the link was found>
    owning_play: <design | arch | specify | craft-ice | prepare>
counts:
  by_kind:
    persona: <n>
    screen: <n>
    flow: <n>
    feature_spec: <n>
    epic: <n>
    design_system: <n>
    design_spec: <n>
    logical_architecture: <n>
    physical_architecture: <n>
    nfr_spec: <n>
    quality_vision: <n>
    design_patterns: <n>
    adr: <n>
    other: <n>
  total: <n>
```

**Return value:**

```yaml
status: locked
anchor_lock_path: <path>
touchpoints_path: <path>
defended_count: <count across constraints + rules + failures + success scenarios>
touchpoint_count: <total>
register: product | technical
```

## Failure Modes

| What failed | Cause | Return |
|-------------|-------|--------|
| `anchor_kind` outside the four kinds | bad input | `status: failed, reason: invalid_anchor_kind` |
| `anchor_target` cannot be resolved to a file under `product_base` | bad input or missing artefact | `status: failed, reason: anchor_unresolvable, searched: [<paths>]` |
| anchor file unreadable | I/O | `status: failed, reason: anchor_read_error` |
| anchor file declares no constraints, rules, or failure scenarios | not grillable | `status: failed, reason: no_grillable_target, anchor_target_path: <path>` |
| STM directory unwritable | I/O | `status: failed, reason: stm_write_error` |
| `product_base` or `stm_base` missing in config | bad invocation | `status: failed, reason: missing_config_paths` |

A `failed` return is not a crash — the grill-me play translates the structured
reason into a plain-language halt message for the human (REC5 / REC11).

## Conservative defaults

- **Ambiguous reference match:** include the touchpoint; let the close bundle's
  review surface decide whether an edit is implied.
- **No `owning_play` cleanly identifiable:** record `owning_play: other` and
  continue.
- **Missing optional fields on an anchor (e.g., business rules section absent
  but constraints present):** proceed with what is present; only halt when
  ALL three (constraints, rules, failure scenarios) are empty.

## Boundaries

- Reads only `product_base`-rooted artefacts and config; writes only the two
  STM YAML files under `{stm_base}/{issue}/evidence/grill-me/`.
- Never edits any product LTM file. Never files issues. Never invokes other
  skills. Never asks the human anything.
- Never sets a register other than `product` or `technical`.
- Output is always two files written together or none — partial writes are
  not permitted (mirrors the play's atomicity rule, scoped to this skill's
  output).
