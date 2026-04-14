---
name: generate-screen-inventory
description: For each selected capability, derive screens from the capability's success scenarios, failure scenarios, and business rules. Enumerate at least 3 states per screen. Write one Markdown file per screen to screens/{id}.md with frontmatter + structured sections.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep
---

# generate-screen-inventory

Called by `designer` during `design-exp` Stage 2. Produces one Markdown file per screen under `{product_base}experience/screens/`.

## Purpose

Turn enriched capabilities into concrete screens. Every capability maps to at least one screen. Every screen enumerates at least three states (default + loading + error minimum). The output is the input for `map-user-flows`, `generate-wireframes`, `validate-screen-coverage`, and ultimately `compile-design-spec`.

## Input

Receive from the designer agent. All paths resolve against `{product_base}` supplied by the play via the JSON contract — do not hard-code `.meridian/product/` or assume a working directory.

- `scope_path` (path, required) — typically `{product_base}scope/scope.yaml`
- `enriched_capabilities_path` (path, required) — typically `{product_base}scope/enriched-capabilities.yaml`
- `epics_dir` (path, required) — typically `{product_base}scope/epics/`
- `personas_path` (path, required) — typically `{product_base}experience/personas.md` (from Stage 1)
- `product_research_path` (path, required) — `{product_base}research/` (the product's frozen domain library per rules/product.md Rule 15 Pull-to-Product). This skill reads domain UX hints from the product's research folder ONLY — never directly from `core/components/memory/knowledge/domain/`. Passing `ltm_domain_taxonomy_path` is a structural failure (design-exp intent.yaml F13).
- `ltm_screen_inventory_schema_path` (path, required) — the schema contract (describes MD section conventions)
- `screens_dir` (string, required) — typically `{product_base}experience/screens/`

## Process

Resolve each input path by substituting `{product_base}` from the incoming JSON contract; do not re-prefix with `.meridian/product/` or assume a working directory.

### 1. Load inputs

- Parse `scope.yaml` and build the list of selected capabilities.
- Parse `enriched-capabilities.yaml` for business rules per capability.
- Glob `{epics_dir}/*.yaml` and parse each epic (we need its success_scenarios, failure_scenarios, and business_rules).
- Read `personas.md` and extract persona IDs with their capability mappings.
- For each capability, read its KB block from the relevant domain-taxonomy file (grep for the feature ID heading and parse the block — use the `Depth Spectrum` and `Signals` sections for layout hints, and the UX-flavored prose in `Tradeoffs` for component cues).

### 2. For each capability, derive screens

A capability may produce 1 to N screens depending on the depth and the number of distinct success scenarios:

- **Primary screen:** the main interaction point. Almost every capability has one.
- **Supporting screens:** error recovery, confirmation, step-by-step flows where applicable.
- **Admin or companion screens:** if a persona mapping includes an admin role and the capability has admin-level business rules.

Name screens using `SCR-{domain}-{capability-slug}-{purpose-slug}` format — e.g., `SCR-user-login-primary`, `SCR-user-login-lockout`, `SCR-user-profile-settings`.

### 3. For each screen, enumerate states

Every screen carries at least three states. At least one must be an error-adjacent state. Typical state menu:

- `default` — the normal state
- `loading` / `initial` — pre-data or pre-session-check state
- `error` — failure state
- `empty` — state when there's nothing to show (zero results, no data yet)
- `populated` — rich state with user data
- `success` — confirmation after a completed action
- `lockout` — blocked / rate-limited state
- `mfa_challenge` — MFA challenge state (only when MFA is in scope)

Pick the states that make sense for the capability. A login screen has default + loading + error + lockout + mfa_challenge. A user-profile screen has default + loading + empty + error. Choose thoughtfully; do NOT pad to meet the 3-state minimum with fake states.

### 4. Write one MD file per screen

Each file has YAML frontmatter with identity (id, capabilities, name) and Markdown body with structured sections. The `capabilities` field is a **list**, not a scalar — most screens list a single capability, but screens that legitimately exercise multiple capabilities (e.g., an `account-setup` screen covering UM-F001 + UM-F002 + UM-F003) MUST list all of them.

An optional per-screen frontmatter field `capability_classification` classifies the screen as `user_surface`, `substrate`, or `admin_only`. The default is `user_surface`. The capability-coverage rule (enforced by `validate-screen-coverage`) fires only against `user_surface` capabilities; `substrate` and `admin_only` screens are exempt from being required to cover user-facing scope.

Example layout for `screens/SCR-user-login-primary.md`:

```markdown
---
id: SCR-user-login-primary
capabilities:
  - UM-F001
name: Login
capability_classification: user_surface
---

# Login

## Purpose

Authenticate existing users and route them to their dashboard. Primary credential-entry screen for the product.

## Personas

- end-user (primary)
- admin (when signing in to admin console)

## States

### default

- Description: Ready for credential input.
- Layout: centered-card
- Data: []
- Actions: submit-credentials, forgot-password, register
- Components:
  - email-input
  - password-input (with show/hide toggle)
  - remember-me-checkbox
  - submit-button
  - forgot-password-link
  - register-link

### loading

- Description: Initial page load, checking for existing session token.
- Data: []
- Actions: []
- Components:
  - skeleton-form (replaces email/password while checking session)

### error

- Description: Invalid credentials submitted, or rate limit hit.
- Data: [error-message-text]
- Actions: retry, forgot-password
- Behavior: Inline error above form. Do NOT reveal whether the email exists in the system. Trigger rate limit only on repeated failures per (email, IP).
- Components:
  - error-banner
  - retry-button
  - forgot-password-link

### lockout

- Description: Account temporarily locked after N failed attempts.
- Data: [lockout-duration-remaining]
- Actions: forgot-password, contact-support
- Behavior: Show countdown timer. Hide the login form until the lockout expires.
- Components:
  - lockout-banner
  - countdown-timer
  - forgot-password-link
  - contact-support-link

### mfa_challenge

- Description: MFA required after successful credential check.
- Data: [mfa-method, time-remaining]
- Actions: submit-code, resend-code, use-backup-code
- Components:
  - totp-code-input
  - resend-code-button
  - use-backup-code-link

## Navigation

- Entry points: direct-url, session-expired-redirect, register-success
- Exit points:
  - success: dashboard
  - forgot_password: password-reset
  - register: registration

## Accessibility

- WCAG 2.1 AA minimum
- Keyboard navigation through all form fields
- Screen reader announcements for validation errors and lockout states
- High-contrast mode compatible for all state variations
```

The `## Wireframe` section is NOT written by this skill — it's appended later by `generate-wireframes`.

### 5. Return output contract

```yaml
screens:
  screens_dir: <path>
  file_count: <int>
  files:
    - path: <absolute>
      capabilities: [<feature ID>, ...]
      capability_classification: user_surface | substrate | admin_only
      state_count: <int>
  capability_coverage:
    capabilities_total: <int>
    capabilities_with_screens: <int>
    orphan_capabilities: []  # must be empty (user_surface only)
```

## Constraints

- NEVER leave a user-facing capability without at least one screen. Every `user_surface` scope entry gets covered.
- NEVER produce a screen with fewer than 3 states.
- NEVER pad state count with fake states. If a capability naturally has only 3 states, list only those 3.
- NEVER write generic layout descriptors (`"a form"`, `"a page"`). Layout is a named hint or a specific composition.
- NEVER invent personas. Pull from `personas.md`.
- NEVER invent capabilities. Pull from `scope.selected_capabilities`.
- NEVER write `capability:` as a scalar in frontmatter. Always emit `capabilities:` as a YAML list with at least one entry.
- NEVER write the `## Wireframe` section. That's `generate-wireframes`'s job.
- ALWAYS name components concretely (`email-input`, not `"input field"`).
- ALWAYS write one file per screen. No bundled multi-screen files.
- ALWAYS use the file format defined in `screen-inventory-schema.yaml` (Markdown with frontmatter + sections).
- ALWAYS list every capability a screen legitimately exercises in `capabilities:` — multi-capability screens (e.g., account-setup exercising UM-F001 + UM-F002) list all of them, not just the primary.
- ALWAYS set `capability_classification` explicitly when the screen is `substrate` or `admin_only`; omit or set `user_surface` otherwise.
- Read KB feature blocks selectively via grep.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | ux-design |
| Created | 2026-04-14 |
| Related | `core/components/skills/validate-screen-coverage`, `core/components/skills/generate-wireframes`, `core/components/memory/standards/schemas/screen-inventory.yaml` |
