# KB Extension Conventions — `domain-taxonomy/*.md`

**Status:** Active (214.4, 2026-04-14)
**Consumers:** `specify-product` / `design-exp` / `build-arch` plays during capability configuration + UX derivation + architecture derivation; `validate-kb-extension` skill.

## Purpose

`core/components/memory/knowledge/domain/*.md` files are Garura's feature catalog — `user-management.md`, `commerce.md`, `payments.md`, `personalization.md`, `search.md`. Each file enumerates features with IDs like `UM-F001`, `CM-F001`, `PY-F001`, `PS-F001`, `SR-F001`. These feature IDs function as **capability identifiers** for the product-planning pipeline.

Each feature in the catalog carries a rich prose description — `When It Matters`, `Depth Spectrum`, `Signals`, `Tradeoffs`. This prose is human-readable and captures nuance, but it lacks the structure a programmatic pipeline needs to:

- Decide whether a feature is **mandatory** or **optional** in a given project profile
- Check that every intent epic traces to measurable **success criteria**
- Ensure **failure modes** are thought through before implementation
- Apply **cross-tree constraints** like `HighSecurity ⇒ MFA`
- Grow **experiential** knowledge over time via `/capture-learning` → `/promote-to-kb`

This document defines five new Markdown sections that **every feature must carry** so the pipeline can read them programmatically while humans keep reading the prose.

## Required sections (under every feature heading)

For every feature (e.g. `### UM-F001: Login / Authentication`), the prose sections (`When It Matters`, `Depth Spectrum`, `Signals`, `Tradeoffs`) stay as-is. The following **five new sections** are appended in this order after `Tradeoffs` and before the next feature heading (`---` separator or next `###`):

### 1. `### Inclusion`

Describes whether and when this feature is included in a selected capability set.

```markdown
### Inclusion
- Default: **optional** | **mandatory** | **conditional**
- Mandatory when: <condition on project profile — e.g., "any user-facing product">
- Conditional when: <condition — e.g., "project_profile.security_level in ['high', 'critical']">
- Exclude when: <condition — e.g., "project_profile.audience == 'internal'">
```

Rules:
- Exactly one `Default` value.
- `Mandatory when` and `Exclude when` are optional; include if there's a rule.
- Conditions reference `project_profile.*` fields defined in `intent-epic-schema.yaml`.

### 2. `### Success Criteria`

Measurable outcomes that define "done well" for this feature.

```markdown
### Success Criteria
- {metric or scenario}: {target}
- Example: Login success rate > 95% on first attempt
- Example: p95 login latency < 500ms
```

Rules:
- Minimum 2 entries.
- Each entry must be **quantified** — numeric target, percentage, or specific threshold. Vague entries like "fast" or "secure" are invalid.

### 3. `### Failure Scenarios`

Things that can go wrong, their impact, and how to mitigate.

```markdown
### Failure Scenarios
- Scenario: {what happens}
  - Impact: {who is hurt, what is lost}
  - Mitigation: {how the new pipeline addresses it}
```

Rules:
- Minimum 2 entries.
- Each entry must have all three sub-fields: Scenario, Impact, Mitigation.
- This is THE most important section — it's what the product-planning pipeline uses to prevent "sounds good, means nothing" shallow outputs.

### 4. `### Cross-Tree Refs`

References to constraint rules in `_cross-tree-constraints.yaml` that involve this feature.

```markdown
### Cross-Tree Refs
- CTC-001 (High security profiles require MFA) — this feature is IMPLIED
- CTC-007 (Tight timeline excludes custom integrations) — this feature is EXCLUDED
```

Rules:
- Each entry references a `CTC-NNN` ID from `_cross-tree-constraints.yaml`.
- The ID must exist in the constraints file — the `validate-kb-extension` linter catches dangling refs.
- "Implied" means this feature gets auto-included when the constraint fires.
- "Excluded" means this feature gets auto-excluded.
- Empty list `(none)` is allowed if no cross-tree constraints involve this feature.

### 5. `### Experiential`

Grows over time via `/capture-learning` and a future `/promote-to-kb`. Starts empty for new features.

```markdown
### Experiential
- Usage count: <integer>  (bootstrap value: 0)
- Scenarios observed:
  - profile: <profile slug>
    outcome: success | partial | failure
    learnings: <one-line lesson>
- Common mistakes:
  - <one-line anti-pattern>
- Last promoted: <ISO-8601 timestamp> (bootstrap: never)
```

Rules:
- At minimum, carries `Usage count` and `Last promoted` fields (both can be bootstrap values).
- `Scenarios observed` and `Common mistakes` are optional lists.
- This is the ONLY section that agents writing capability enrichment may touch during the `/capture-learning` → `/promote-to-kb` lifecycle. All other sections are owned by humans (or intent-crafter during 214.4 bootstrap).

## Parsing rules

The `specify-product` pipeline's `configure-capabilities` skill parses these sections from Markdown. The parser rules:

- Each feature starts with `### <FEATURE-ID>: <name>` (e.g., `### UM-F001: Login / Authentication`).
- The five new sections are H3 headings (`###`) nested under the feature.
- Section content is captured until the next `###` heading or `---` separator.
- Bullet lists under each section are parsed item-by-item.
- Sub-fields (Impact, Mitigation) are recognized via the `  - <Key>: <value>` indent pattern.

## Validator

`validate-kb-extension` (skill, created in 214.4 T22) walks every feature in every domain-taxonomy file and asserts all five sections are present with non-empty content. Returns structured failure with per-feature error details if any violation is found. Invoked by the `specify-product` pipeline's pre-flight to ensure the KB is internally consistent before a run begins.

## Why inside the existing markdown files, not a parallel YAML tree

Two reasons:

1. **No knowledge fragmentation.** The existing prose sections (`When It Matters`, `Depth Spectrum`, `Signals`, `Tradeoffs`) carry valuable human-readable context that the pipeline also consults. Splitting structured data into parallel YAML files would force agents to reconcile two sources every time they need information about a feature.

2. **One editable surface.** Humans edit Markdown; agents parse the structured sections. The `_cross-tree-constraints.yaml` file is the only new artifact in this design — a single flat YAML list of constraint rules that references feature IDs defined in the Markdown catalog.

## Example — UM-F001 Login with the five new sections

(Shows what a single feature looks like after 214.4 T20.)

```markdown
### UM-F001: Login / Authentication

Core user authentication — email/password, session management, identity verification.

**When It Matters:**
Login is table stakes for any application with user accounts. [...existing prose...]

**Depth Spectrum:**
- **Basic:** Email/password with session cookies. [...]
- **Standard:** Password strength validation, [...]
- **Advanced:** Social login, [...]
- **Enterprise:** SSO/SAML integration, [...]

**Signals:**
Any application with user accounts. PP-1 (User Sophistication) determines depth: [...]

**Tradeoffs:**
Including at higher depth: better security posture, enterprise readiness, [...]

### Inclusion
- Default: **mandatory** for any user-facing product; **optional** for internal tools
- Mandatory when: `project_profile.audience in ['B2C', 'B2B', 'B2B2C']`
- Exclude when: `project_profile.audience == 'internal' and project_profile.security_level == 'low'`

### Success Criteria
- Login success rate > 95% on first attempt
- p95 login latency < 500ms
- Account recovery completion rate > 80%

### Failure Scenarios
- Scenario: Account lockout with no visible recovery path
  - Impact: User abandons product, contacts support
  - Mitigation: Always show forgot-password and support-contact links on the locked-out screen
- Scenario: Session expires mid-form submission
  - Impact: Data loss and user frustration
  - Mitigation: Auto-save form state in localStorage; restore after re-authentication

### Cross-Tree Refs
- CTC-001 (High security profiles require MFA) — this feature is IMPLIED

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Skipping rate limiting on login endpoint
  - Not handling concurrent session limits
- Last promoted: never

---
```

## Migration impact

Files to update in 214.4 T20 / T21:
- `user-management.md` (features UM-F001 through UM-F00N)
- `commerce.md` (features CM-F001 through CM-F00N)
- `payments.md` (features PY-F001 through PY-F00N)
- `personalization.md` (features PS-F001 through PS-F00N)
- `search.md` (features SR-F001 through SR-F00N)

Each feature gets its five new sections appended. Existing prose is NOT modified. The `---` feature separator stays between features.

After T21, `_cross-tree-constraints.yaml` is created with ≥5 bootstrap constraint entries, each referencing real feature IDs from the above files.
