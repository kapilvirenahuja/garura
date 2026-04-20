---
name: list-product-state
description: Render the current product state — domain → capability → feature tree with per-feature status, IDs, and GitHub issue links — from the authoritative features.yaml catalog. Use this skill whenever the user asks about product status, feature status, project status, where things stand, what's built vs planned, or any natural-language question that wants a snapshot of where the product is right now. Read-only; no network, no guessing — data comes only from features.yaml.
user-invocable: false
model: sonnet
allowed-tools: Read, Glob
---

# list-product-state

Model-invocable skill that reads the product feature catalog and renders a hierarchical status tree. Deterministic, read-only, no network.

## When to use

Triggers on natural-language status queries — "show me product status", "status of features", "what's the project status", "where are we on the product", "what's built vs planned". The user does not need to say "list-product-state" or reference `features.yaml` by name; the intent to see the current product state is enough.

## Input

- `features_path` (path, required) — path to the feature catalog YAML. Canonical location in this repo is `.garura/product/scope/features.yaml`. Always resolve against the caller's working directory; never hardcode.
- `ltm_rules_feature_catalog_path` (path, required) — path to `core/components/memory/standards/rules/feature-catalog.md`. Defines the authoring schema (3-tier hierarchy, ID regex, 5-point status enum, required fields). This skill is read-only with respect to the catalog, but it relies on this file to know what shape to expect.
- `ltm_template_feature_tree_path` (path, required) — path to `core/components/memory/standards/templates/feature-tree-output.md`. The output render template.

No other inputs. No flags. No summary toggles.

## Output

A single Markdown block rendered from the LTM template. The tree walks `domains[] → capabilities[] → features[]` in the order they appear in the YAML — order is preserved, not sorted. Indentation is 2 spaces per level.

Row formats:

- **Domain row** — the domain `slug` only. No status on this line.
- **Capability row** — the capability `slug` only. No status on this line.
- **Feature row** — `[feature-id] : [#issue] short-description [status]`.
  - The `: [#issue]` slot is **omitted entirely** when the feature has no `issue` field. No empty brackets, no placeholder.
  - `short-description` = the first sentence of the feature's `notes` field. If `notes` is absent or empty, fall back to the feature's `name`. Strip trailing whitespace; a sentence ends at the first `.`, `!`, or `?` followed by whitespace or end-of-string.
  - `status` = the feature's `status` field verbatim, wrapped in brackets. If missing, render `[unknown]`.

Empty branches:

- Capability with no features → one child row reading `(no features yet)`.
- Domain with no capabilities (e.g., L4 / L5 placeholders) → one child row reading `(no capabilities yet)`.

No summary line. No totals. No commentary. The tree is the entire output.

## Process

1. **Load the rules and the template first.** Read `ltm_rules_feature_catalog_path` and `ltm_template_feature_tree_path`. These LTM files are the source of truth for authoring conventions and render format. If the narrative in this SKILL.md ever drifts from them, the LTM files win.
2. Read `features_path`. If the file is missing or unreadable, return a single error line and stop — do not fabricate a tree.
3. Walk `domains[]` in document order. For each domain, emit the domain row, then walk its `capabilities[]`.
4. For each capability, emit the capability row, then walk its `features[]`. Apply the empty-branch rules above when a level has no children.
5. For each feature, compute `short-description` per the rule above, include the `: [#issue]` slot iff the feature has an `issue` field (integer — canonical form `issue: 283`), and append the status bracket.
6. Render the final output by filling the slots in the LTM template loaded in step 1.

## Hard rules

- **No network.** Never call `gh`, never make HTTP requests, never look anything up. The GitHub issue link comes only from the feature's `issue` field in YAML. No feature currently carries this field — the slot is a forward-compatibility placeholder.
- **No guessing.** If a feature lacks `status`, render `[unknown]` — do not infer from capability or domain.
- **No mutation.** This skill reads; it never writes.
- **Verbatim passthrough.** Status strings render exactly as written in YAML. Slugs render exactly as written. Do not rewrap, title-case, or "clean up" anything.

## References

- Authoring rules (LTM): `core/components/memory/standards/rules/feature-catalog.md` — canonical schema and authoring rules.
- Render template (LTM): `core/components/memory/standards/templates/feature-tree-output.md` — the output shape.
- Canonical input schema (producer): `core/components/skills/manage-features/SKILL.md`.
