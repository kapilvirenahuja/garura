---
name: infer-experience-from-code
description: Derive structural experience artifacts (personas, screens, flows, design-system, design-spec) for a brownfield codebase from detected frontend routes, components, auth roles, and design-token configs. Short-circuits with skipped status when no repo has frontend detected. Used exclusively by designer during /codify.
version: 0.1.0
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Grep, Glob
---

# infer-experience-from-code

Called by `designer` during `/codify`, after `infer-features-from-code`,
`infer-enriched-capabilities-from-code`, and `infer-domain-selection-from-code`.
Produces multiple files under
`{stm_base}/{issue}/evidence/codify/proposals/experience/`: `personas.md`,
`screens/{screen-id}.md` (one per detected route), `flows/{flow-id}.md`
(one per detected user flow), `design-system.md`, `design-spec.md`, plus one
decision manifest and one resolution trace covering the whole invocation.

**Conditional execution.** Runs ONLY when at least one repo in `scan-index.json`
reports `frontend_detection.detected == true`. Otherwise short-circuits with
`status: "skipped: no_frontend"` and writes no artifacts.

Tier-3 inference (addition — experience is typically net-new).
`learning_category: product`, `sub_category: null`.

## Purpose

`/codify` bootstraps product LTM for a brownfield repo. When a frontend is
present, the experience trunk needs a first-cut structural map: who uses the
app (personas), which screens exist (route inventory with stub states), how
screens connect (navigation flows), and the design-token vocabulary the UI
already speaks. This skill reads code-resident signals — route files,
component naming, auth entry points, i18n configs, token configs — and emits
STRUCTURAL-only experience proposals.

**STRUCTURAL-ONLY BY DESIGN.** Wireframes, visual design, brand look-and-feel,
copy, and interaction polish are NEVER inferable from code. Output is limited
to: screen inventory with state-list stubs (default / loading / error minimum),
Mermaid flow diagrams routing between screens, JTBD persona stubs, and a
design-system token INVENTORY harvested from config. Everything visual is a
knowledge gap routed to /garura:enrich. Asserting visuals here is fabrication.

## Input

Receive from the /codify play orchestrator via JSON contract. All paths absolute.

| Field | Required | Description |
|-------|----------|-------------|
| `scan_index_path` | yes | Path to `scan-index.json` from `scan.py`. |
| `stm_base` | yes | STM root, resolved from `stm.base-path`. |
| `issue` | yes | Issue number (STM namespace). |
| `experience_output_dir` | yes | `{stm_base}/{issue}/evidence/codify/proposals/experience/`. This skill writes multiple files across nested subdirs, so `experience_output_dir` replaces a single `output_path`. |
| `decision_manifest_path` | yes | `{experience_output_dir}/decision-manifest-infer-experience.yaml`. |
| `resolution_trace_path` | yes | `{experience_output_dir}/resolution-trace-infer-experience.yaml`. |
| `ltm_context` | yes | Resolution Protocol context block from designer. |
| `related_proposal_paths` | yes | Map with absolute paths: `features_yaml`, `enriched_capabilities_yaml`, `domain_selection_yaml`. |

## Process

### 1. Validate inputs

- `scan_index_path` exists and is valid JSON — else `scan_index_missing`.
- Every path in `related_proposal_paths` exists and is valid YAML — else
  `missing_related_proposal` with `offending_path` set.
- `experience_output_dir` exists or is creatable — else `output_dir_unwritable`.

### 2. Frontend-detection short-circuit

Walk `scan_index.repos[*].frontend_detection.detected`. If NO repo reports
`true`, write the resolution trace (with R1/R2 skip entries), SKIP the
decision manifest, skip every subsequent step, and return:

```yaml
status: "skipped: no_frontend"
reason: "No repo in scan-index reports frontend_detection.detected=true."
experience_output_dir: "<path>"
artifact_paths: []
resolution_trace_path: "<path>"
```

`no_frontend` is NOT a failure — it is the expected outcome for backend-only
repos, CLI tools, and library-only monorepo members.

### 3. Resolution Protocol walk (write trace first)

Per `core/components/memory/standards/rules/resolution.md`.

- **R1 — STM.** Skipped for /codify. Reason `"codify-bootstrap"`.
- **R2 — Product LTM.** Probe `{product_base}/experience/`. If LOCKED, emit
  only non-overlapping proposals; overlaps surface as `alignment_confirmed`.
- **R3 — KB.** Read `{kb_base}/knowledge/` experience patterns (persona
  archetypes, state enumerations, flow templates) as vocabulary — never
  substitute for code evidence.
- **R4 — Web.** Not invoked. Closed-universe over scan + proposals + KB.

### 4. Enumerate screens from routes and pages

For every repo with `frontend_detection.detected == true`, walk `trees` by
framework convention — one screen per matched file:

- **Next.js Pages Router.** `pages/**/*.{tsx,jsx,ts,js}` excluding `_app`, `_document`, `api/**`.
- **Next.js App Router.** `app/**/page.{tsx,jsx,ts,js}`.
- **Nuxt.** `pages/**/*.vue`.
- **SvelteKit.** `src/routes/**/+page.svelte`.
- **React Router.** Route config files identified via `frontend_detection.signals`/`evidence_paths`; each `path`-bearing route object → one screen.

Screen id: `SCR-{repo-slug}-{route-slug}`. Dynamic segments (`[id]`, `:id`, `$id`) normalize to `-id-`.

Each screen file carries frontmatter (`meta:` + `screen:` block with id, name,
route, repo, capabilities:[] gap, capability_classification:"user_surface"),
and a body with ≥3 state stubs — `default`, `loading`, `error` — components
harvested from visible imports/JSX/template. Wireframe, detailed state copy,
navigation targets, and accessibility notes are marked `knowledge_gap: true`.

Confidence: `high` when route file exists AND ≥1 import is a recognizable
form primitive; `medium` when only the route exists; `low` on catch-all
(`[...slug]`) routes where the rendered surface is opaque.

### 5. Enumerate flows from navigation call sites

Walk route files for navigation transitions — each static target creates
`SCR-current → SCR-target`:

- **Next.js / React Router.** `router.push`, `router.replace`, `<Link href=...>`, `redirect(...)`.
- **Nuxt.** `navigateTo(...)`, `<NuxtLink to=...>`.
- **SvelteKit.** `goto(...)`, `<a href=...>` inside route components.
- **Form submit handlers.** `onSubmit` routing on success, labelled by form context.

Group transitions into flows — connected subgraphs sharing an apparent goal
(e.g., `sign-in-flow` = login → dashboard). Flow id: `FLOW-{repo-slug}-{goal-slug}`.
One Markdown file per flow under `flows/{flow-id}.md` with a Mermaid
`sequenceDiagram` under `## Diagram` (participants = detected screen ids,
arrows = detected navigation calls), a `meta:` block, and a per-flow
evidence list. `## Failure recovery` is `knowledge_gap: true` when code does
not evidence a failure-branch destination — do NOT invent recovery screens.

### 6. Derive personas from auth roles and user-facing routes

Signals: (1) distinct auth entry points (`/login` + `/admin/login` → ≥2
personas); (2) role files / RBAC (`roles.ts`, `permissions.yaml`, middleware
branching on `role === 'admin'`) — each named role is a candidate;
(3) route namespaces (`/admin/*`, `/dashboard/*`, `/public/*`) — distinct
namespaces imply distinct user groups.

Collapse candidates, author each in JTBD format:
`When {situation}, I want to {motivation}, so I can {outcome}.`
Demographic-driven personas are REJECTED. Write all to
`{experience_output_dir}/personas.md` — one section per persona with an
`evidence:` list (routes / role files / middleware) and `knowledge_gap`
markers on any primary-job detail needing stakeholder interview.

If no auth entry points, role files, or distinct namespaces exist, emit a
single `generic-user` persona with `knowledge_gap: true` on JTBD.

### 7. Harvest design tokens from config

Scan `scan_index.config_files` for token sources: `tailwind.config.*`
(`theme.colors`, `theme.extend`, `fontFamily`, `spacing`, `borderRadius`,
breakpoints); `theme.*` / `tokens.*` / `styles/theme.*` exported token
objects; `styled-components` theme providers; `stylelint.config.*` allowed
rules; CSS-variable definitions in global stylesheets referenced by
`frontend_detection.evidence_paths`; i18n configs (`next-i18next.config.*`,
`nuxt-i18n`) for locale set.

Emit `{experience_output_dir}/design-system.md` as a token INVENTORY, not a
brand system. Sections: Colors, Typography, Spacing/Radius/Breakpoints,
Internationalization, and a closing `## Knowledge gaps` listing everything
not harvestable (brand adjectives, mood, inspiration references). Every
block carries evidence + confidence.

If NO token source exists but a frontend is detected (inline CSS-in-JS
without a theme), emit a minimal file with `knowledge_gap: true` on the
whole inventory and confidence `low`.

### 8. Compose design-spec index

`{experience_output_dir}/design-spec.md` is a NAVIGATIONAL consolidator:
standard `meta:` block plus `## Personas`, `## Screens`, `## Flows`,
`## Design System` sections listing every file produced with 1-line summaries
and confidence tags. Downstream readers (arch, /garura:enrich) land here first.

### 9. Write decision manifest

Write BEFORE finalizing return so a mid-write crash preserves the audit
trail. One entry per inferred decision — screen enumeration, state-menu
selection, flow grouping, persona merging / JTBD seed text, token harvest
scope. Fields: `decision_id` (prefix `D-iefc-`), `decision_type`, `tier`
(high/mid/low per DSD — `high` only when grounding is a direct scan-index
pointer to a real file), `grounding_source`, `recommendation`,
`alternatives_considered`, `agent_reasoning_summary`.

## Output

### Artifacts under `experience_output_dir`

```
experience/
  personas.md
  screens/SCR-{repo}-{route}.md           (one per detected route)
  flows/FLOW-{repo}-{goal}.md             (one per detected flow)
  design-system.md
  design-spec.md
  decision-manifest-infer-experience.yaml
  resolution-trace-infer-experience.yaml
```

Every artifact carries YAML frontmatter:

```yaml
meta:
  source_type: "inferred_from_code"
  evidence: ["<scan-index JSON pointer or file path>"]
  confidence: "high" | "medium" | "low"
  learning_category: "product"
  sub_category: null
  tier: 3
```

### Decision manifest & resolution trace

Standard Garura shapes. Manifest: `schema_version`, `skill`, `generated_at`,
`decisions[]`. Trace: R1–R3 probes with `source`, `path`, `outcome`
(`hit | miss | skipped`), extracted payload. R4 omitted.

### Return contract (success)

```yaml
status: success
experience_output_dir: "<path>"
artifact_paths:
  personas: "<path>/personas.md"
  screens: ["<path>/screens/SCR-...md"]
  flows: ["<path>/flows/FLOW-...md"]
  design_system: "<path>/design-system.md"
  design_spec: "<path>/design-spec.md"
decision_manifest_path: "<path>"
resolution_trace_path: "<path>"
screen_count: <int>
flow_count: <int>
persona_count: <int>
overall_confidence: "high" | "medium" | "low"
```

### Return contract (no_frontend)

```yaml
status: "skipped: no_frontend"
reason: "No repo in scan-index reports frontend_detection.detected=true."
experience_output_dir: "<path>"
artifact_paths: []
resolution_trace_path: "<path>"
```

## Failure Modes

```yaml
status: failure
what_failed: "<code>"
detail: "<specific error>"
evidence:
  offending_path: "<file path if applicable>"
  offending_field: "<field name if applicable>"
```

Codes:

- `missing_related_proposal` — a related proposal is absent/unreadable.
- `scan_index_missing` — `scan_index_path` absent or invalid JSON.
- `ltm_resolution_failed` — R2 or R3 probe errored (path outside sandbox or existing experience artifact unparseable).
- `insufficient_signal` — frontend detected but NO route/page files found under any framework convention. Emits `status: "skipped: no_frontend"`-style return with reason `"frontend detected but route surface not discoverable"`, records the gap in the resolution trace. No partial screens written.
- `output_dir_unwritable` — `experience_output_dir` cannot be created.

`no_frontend` is NOT a failure code — it is the clean short-circuit from Step 2.

## Boundaries

- Read-only against `scan_index_path`, upstream proposals, `kb_base`, resolved LTM paths.
- Writes MULTIPLE files under `experience_output_dir` (nested `screens/` and `flows/`) plus one decision manifest and one resolution trace. NEVER writes to `.garura/product/experience/` in place.
- Emits STRUCTURAL stubs only — NEVER fabricates wireframes, brand tokens absent from config, persona demographics, flow failure-recovery branches, or state copy. Those are knowledge gaps routed to /garura:enrich.
- Does NOT re-run `scan.py`; stale scan-index is the orchestrator's concern.
- Does NOT promote any artifact to product LTM. Promotion is /garura:enrich's job.
- On `no_frontend` short-circuit, writes the resolution trace but NOT the decision manifest — there are no decisions to record when the skill does not execute.
