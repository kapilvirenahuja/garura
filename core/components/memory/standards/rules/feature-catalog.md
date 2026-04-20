# Feature Catalog Rules

Canonical rules governing how the product feature catalog (`features.yaml`) is authored — the 3-tier domain → capability → feature structure that `specify` emits at Stage 4b. Every skill that creates, updates, or validates the catalog loads this file and enforces these rules.

Consumers: `manage-features`, `generate-intent-epics` (read-only — consumes the produced catalog), validators.

> **Note on naming.** This file governs the **product feature catalog** (the 3-tier `features.yaml`). For rules about the fields **inside an intent epic** (e.g., `problem_statement`, `hypothesis`, `constraints`), see `features.md` — a different concept with the same word in its name.

## Rule 1: 3-Tier Hierarchy Is Mandatory

**The shape is `domains[] → capabilities[] → features[]`.** Nothing else.

Features must not appear at the domain or top level. Capabilities must not appear at the feature level. Flattening the hierarchy into a single `features[]` list (or any other collapsed variant) is a structural violation and rejects the artifact at write time.

**Why:** downstream consumers — starting with `generate-intent-epics` — use the hierarchy to drive KB-ID cross-checks and domain-scoped reasoning. A flat list loses the domain/capability grouping and makes epic-to-feature traceability manual.

## Rule 2: Feature IDs Follow a Strict Regex

**`^[A-Z]{2,4}-F\d{3}$`.** The `PREFIX` (2–4 uppercase letters) must match the domain-slug abbreviation declared in the KB provenance header of the enriched capability record.

Canonical prefix mapping (Garura example; adjust per domain):
- Agentic Methodology → `AM`
- Engineering Observability → `EO`
- AI Governance → `AG`
- Work Intelligence → `WI`
- Engineering Experience → `EE`

IDs that do not match the regex are not written.

**No invented IDs.** IDs are copied verbatim from the enriched capability record's `feature_id` field. Assigning an ID that does not appear in `enriched-capabilities.yaml` is a structural violation.

## Rule 3: Feature Names Are Noun Phrases

**3–10 words, noun phrase only.** Verb phrases, imperative phrases, and single nouns are invalid.

| Valid | Invalid |
|-------|---------|
| `Profile-Based Auto-Triage` | `Triage users` (verb phrase) |
| `Vision-Anchored Priority` | `Prioritize` (single verb) |
| `Cross-Project Lint Aggregation` | `Lint` (single noun) |

**Why:** the catalog is a reference artifact read by humans and agents. Noun-phrase names read naturally in tables, briefs, and intent.yaml references. Verb phrases turn every downstream surface into awkward prose.

## Rule 4: Status Values Use the 5-Point Vocabulary

**Per-feature and per-capability status must be one of:** `planned | development | rollout | released | cleanup`.

Meaning:
- `planned` — scoped but not started.
- `development` — actively being built.
- `rollout` — built but not fully deployed; partial coverage.
- `released` — fully live in production.
- `cleanup` — shipped, now winding down / deprecating.

Any value outside this enum at the per-feature or per-capability level is a structural violation.

**Default-status rule.** On greenfield projects every feature defaults to `planned` unless the project profile overrides. On brownfield, user-declared overrides in the profile are passed through verbatim; unresolved entries default to `planned` (inferred, recorded in the decision manifest).

## Rule 5: Domain-Level Status Is Freeform

**Domain-level status is NOT validated against the 5-point enum.** Strings like `applied-and-evolving`, `partial`, or prose rollups pass through unchanged.

**Why:** domains are prose-level groupings whose rollup state reflects narrative context ("this domain is mature", "this domain is directional") that doesn't fit a build-state enum. Coercing domain status into `planned|development|…` would lose that nuance. Rule 4 only governs the leaves and the capability layer above them.

## Rule 6: Required Fields Per Feature

**Every feature entry carries four required fields: `id`, `name`, `status`, `notes`.** Missing or null on any required field is a structural violation.

Optional fields: `evidence` (list of paths or URLs), `gap_items` (list of strings), `target_milestone` (version string). Omit optional fields rather than emit them empty or `TBD`.

## Rule 7: Domain Mapping Follows the KB Provenance Header

**Each capability nests under its canonical domain per the KB provenance header on the enriched record.** Do not arbitrarily relocate capabilities across domains during catalog authoring.

If a reclassification is needed (e.g., capability semantically belongs under a different domain), that is a separate concern handled upstream (via the enrichment or configure-capabilities step), not silently fixed here.

## Rule 8: Summary Counters Match the Vocabulary

**The `summary` block exposes per-status counters using the exact 5-point keys.** Namely:

```yaml
summary:
  domains: <int>
  capabilities: <int>
  features_total: <int>
  features_planned: <int>
  features_development: <int>
  features_rollout: <int>
  features_released: <int>
  features_cleanup: <int>
```

Summary keys must not use aliases (e.g., `features_live` or `features_partial` are migrated to `features_released` / `features_rollout` in any brownfield catalog carrying legacy values).

## Rule 9: Decision Manifest For Inferred Statuses

**Every inferred status (i.e., not passed through from a project-profile override) generates a decision-manifest entry.**

Each entry:
```yaml
decisions:
  - id: D-mf-<n>
    artifact_field: "domains[<i>].capabilities[<j>].features[<k>].status"
    feature_id: "<PREFIX-Fnnn>"
    decision: "<assigned status>"
    tier: "high" | "mid" | "low"
    grounding_source: "project_profile_override" | "greenfield-default" | "brownfield-default"
    recommendation: "<short rationale>"
    alternatives: [<other 5-point values considered>]
```

Only inferences are recorded — pass-throughs from profile overrides are not. If any inference was made and the manifest is empty, it is a structural violation (F3 in the skill's intent).

## Related Rules

- `features.md` — epic-field rules (different concept; governs intent-epic content, not the catalog).
- `epics.md` — vertical slice + actor/outcome tests for intent epics.
- `product.md` — KB-grounded selection.
- `kb-extension.md` — how the KB catalog is structured.
