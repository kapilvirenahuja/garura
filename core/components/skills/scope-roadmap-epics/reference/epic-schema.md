# Epic Schema

This file defines the canonical schema for scoped epics. Every epic MUST conform to this schema exactly. Deviations are constraint violations.

## Required Fields

Every epic MUST contain exactly these fields — no more, no fewer:

### Scoping Fields

| Field | Type | Valid Values | Notes |
|-------|------|-------------|-------|
| `id` | string | `"E1"`, `"E2"`, ... | Sequential, E-prefix (epic IDs) |
| `name` | string | Free text | Short, noun-phrase epic title |
| `strategic_goal_ref` | string | `"SG1"`, `"SG2"`, ... | Must match a strategic_goals[].id in product.yaml |
| `description` | string | 2–3 sentences | What this epic delivers and why |
| `bucket` | string | `near` \| `mid` \| `long` | Time horizon — lowercase only |
| `priority` | string | `P1` \| `P2` \| `P3` | P1 = product cannot function without; P2 = significant value; P3 = nice-to-have |
| `effort` | string | `S` \| `M` \| `L` \| `XL` | S < 1mo; M = 1-2mo; L = 2-4mo; XL > 4mo |
| `depends_on` | list | Epic IDs or `[]` | IDs of epics (E1, E2, etc.) that must complete before this one starts |
| `foundation_investment` | boolean | `true` \| `false` | true if shared infrastructure enabling multiple other epics |
| `github_issue_ref` | string | `"TBD"` | Leave as TBD — set later by issue workflow |
| `ltm_citations` | list | File paths or `[]` | LTM/memory files consulted when deriving this epic (domain taxonomy, profile knowledge, architecture patterns) |

### IDD Fields

These fields define the epic's intent, boundaries, and success/failure criteria. They must be written at reviewer-grade depth — full prose, not bullet outlines. A reviewer reading these fields should understand the epic without needing any other document.

| Field | Type | Structure | Notes |
|-------|------|-----------|-------|
| `intent` | object | `p1`, `p2`, `p3` (strings) | Three paragraphs. P1: what problem or gap exists today. P2: what the user can do after this ships that they cannot do now (outcome-focused). P3: why this matters strategically and how it connects to the product's goals. |
| `constraints` | object | `in_scope`, `out_of_scope`, `must_not_break` (strings) | In scope: what this epic explicitly delivers. Out of scope: what is excluded to prevent scope creep. Must not break: existing capabilities this cannot regress. |
| `success_scenarios` | list | Minimum 2 items, each a string | Given/when/then format. Binary testable — a reviewer must be able to say pass or fail. |
| `failure_conditions` | list | 2–4 items, each a string | Observable outcomes that signal the epic failed its intent. Not risks — outcomes a reviewer can point to. |

## Count Constraint

- **Minimum:** 3 epics
- **Maximum:** 6 epics

If the vision warrants more than 6, consolidate by merging related deliverables into larger epics. Never exceed 6.

## Prohibited Fields

These fields MUST NOT appear in any epic. Their presence is a schema violation:

- `horizon` — use `bucket` instead
- `dependencies` — use `depends_on` instead
- `success_metrics` — use `success_scenarios` instead
- `idd_core` — IDD fields are top-level in the epic, not nested
- `user_bet` — not part of the epic schema
- `intent_model` — not part of the epic schema
- `signal_flow` — not part of the epic schema
- `technical_context` — belongs in feasibility, not the epic
- `blast_radius` — belongs in feasibility, not the epic
- `kpis` — not part of the epic schema
- `risks` — not part of the epic schema
- `acceptance_criteria` — use `success_scenarios` instead

## YAML Structure

```yaml
slug: "{product slug from product.yaml}"
product_yaml_path: "{path to product.yaml}"
time_horizon: "12 months"
generated_at: "{YYYY-MM-DD}"

epics:
  - id: "E1"
    name: "{epic name}"
    strategic_goal_ref: "SG1"
    description: "{2-3 sentences}"
    bucket: "near"
    priority: "P1"
    effort: "M"
    depends_on: []
    foundation_investment: true
    github_issue_ref: "TBD"
    ltm_citations:
      - "~/.meridian/core/memory/knowledge/domain-taxonomy/{domain}.md"
      - "~/.meridian/core/memory/knowledge/project-profiling/quality-profile.md"
    intent:
      p1: "{What problem or gap exists today. What is broken, missing, or inefficient for the user right now. Full paragraph.}"
      p2: "{What the user can do after this epic ships that they cannot do today. Outcome-focused, not a feature list. Full paragraph.}"
      p3: "{Why this matters for the product's direction. Connect the strategic_goal to the broader product thesis. Full paragraph.}"
    constraints:
      in_scope: "{What this epic explicitly delivers. Be specific — what capabilities, interactions, or outputs are included.}"
      out_of_scope: "{What is explicitly excluded to keep this epic bounded. Name the natural scope creep risks.}"
      must_not_break: "{Existing product capabilities this epic cannot regress. If foundational with no prior epics: 'None at this stage — foundational epic.'}"
    success_scenarios:
      - "Given {context}, when {action}, then {observable outcome}."
      - "Given {context}, when {action}, then {observable outcome}."
    failure_conditions:
      - "{Observable state that a reviewer can point to and say this epic did not deliver.}"
      - "{Second failure condition.}"
```

## Validation Checklist

Before writing `epics.yaml`, verify:

- [ ] Epic count is between 3 and 6 (inclusive)
- [ ] Every epic has ALL 11 scoping fields AND ALL 4 IDD fields (15 total)
- [ ] No epic has any prohibited field
- [ ] `bucket` values are lowercase: `near`, `mid`, or `long` — NOT `Near`, `Mid`, `Far`, `horizon`
- [ ] `depends_on` is a list — NOT `dependencies`
- [ ] `foundation_investment` is a boolean — NOT a string
- [ ] Every `strategic_goal_ref` maps to a strategic_goals[].id in product.yaml (SG1, SG2, etc.)
- [ ] `depends_on` lists only valid epic IDs (E1, E2, etc.) within the same file
- [ ] `ltm_citations` is a list of LTM file paths consulted during derivation (may be empty if no LTM was relevant)
- [ ] `intent` has exactly 3 paragraphs (`p1`, `p2`, `p3`) — each is a full paragraph, not a sentence
- [ ] `constraints` has exactly 3 fields (`in_scope`, `out_of_scope`, `must_not_break`)
- [ ] `success_scenarios` has at least 2 items in given/when/then format
- [ ] `failure_conditions` has 2–4 items, each an observable outcome
