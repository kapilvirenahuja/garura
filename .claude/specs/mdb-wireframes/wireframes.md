# MDB — Meridian Artifact Browser: ASCII Wireframes

> Design document for the wiki-like artifact browser for Meridian's structured
> YAML/Markdown product lifecycle artifacts. Five scenarios covering the full
> spectrum from greenfield to dense multi-epic projects.

---

## Design Constants

| Element            | Behavior                                                         |
|--------------------|------------------------------------------------------------------|
| Sidebar            | Adaptive — grows organically as artifacts appear                 |
| Breadcrumb         | Always visible below search bar; reflects artifact tree position |
| Search             | Always accessible at top of sidebar                              |
| Cross-ref IDs      | Rendered as `[F1]` `[SG1]` `[SC-AUTH-001]` clickable tokens     |
| Status badges      | ● Draft (yellow) ● Validated (green) ● Locked (blue) ○ Missing  |
| CTA buttons        | Appear where a next artifact can be generated                    |
| Wiki tags          | `[[play:prompt]]` rendered as action chips in content            |
| Annotation HL      | Orange underline + margin comment indicator                      |

---

## Scenario 1: Greenfield — Only `product.yaml` Exists

The project just started. Only the product vision exists. The sidebar is minimal
and focused. Empty sections do NOT appear — instead, the browser shows clear
"next step" CTAs that guide the user toward specification.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌────────────────────┐  │  │  🏠 > Product Vision                                                   │ │
│  │  │ 🔍 Search...       │  │  │  ─────────────────────────────────────────────────────────────────────  │ │
│  │  └────────────────────┘  │  │                                                                        │ │
│  │                          │  │  ┌────────────────────────────────────────────────────────────────────┐  │ │
│  │  ── PRODUCT ──────────── │  │  │  TaskFlow                                          [LOCKED] 🔵    │  │ │
│  │                          │  │  │  "AI-powered project management for dev teams"                     │  │ │
│  │  📄 Product Vision  🔵   │  │  │  Updated: 2026-04-15                                               │  │ │
│  │     ├─ Market Context    │  │  └────────────────────────────────────────────────────────────────────┘  │ │
│  │     ├─ Strategic Goals   │  │                                                                        │ │
│  │     ├─ Target Users      │  │  ┌─ Market Context ─┬─ Vision & Goals ─┬─ Scope ─┬─ Comments (0) ────┐  │ │
│  │     └─ Scope             │  │  │    ◆ active       │                  │         │                   │  │ │
│  │                          │  │  └──────────────────────────────────────────────────────────────────────  │ │
│  │                          │  │                                                                        │ │
│  │  ── NEXT STEPS ───────── │  │  Problem                                                               │ │
│  │                          │  │  ──────────────────────────────────────────────────────                  │ │
│  │  ╔════════════════════╗  │  │  Dev teams lose 40% of sprint time to context-switching                 │ │
│  │  ║ 📋 Define Features ║  │  │  between PM tools, code, and communication channels.                   │ │
│  │  ║   /specify-product ║  │  │                                                                        │ │
│  │  ╚════════════════════╝  │  │  Target Users                                                          │ │
│  │                          │  │  ──────────────────────────────────────────────────────                  │ │
│  │  ╔════════════════════╗  │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │  ║ 🗺️ Plan Roadmap    ║  │  │  │  [U1] Engineering Manager                                      │   │ │
│  │  ║   /plan-roadmap    ║  │  │  │  Goal: Ship features predictably without burnout                │   │ │
│  │  ╚════════════════════╝  │  │  │  Frustration: Juggling 5 tools to track one feature             │   │ │
│  │                          │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                          │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │                          │  │  │  [U2] Senior Developer                                          │   │ │
│  │                          │  │  │  Goal: Understand what to build next without meetings            │   │ │
│  │                          │  │  │  Frustration: Specs are outdated before implementation starts    │   │ │
│  │                          │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                          │  │                                                                        │ │
│  │                          │  │  Competitors                                                           │ │
│  │                          │  │  ──────────────────────────────────────────────────────                  │ │
│  │                          │  │  ┌─────────────────────────────────────────┐                            │ │
│  │                          │  │  │  Jira        ▸ Our edge: AI-native     │                            │ │
│  │                          │  │  │  Linear      ▸ Our edge: Spec-first   │                            │ │
│  │                          │  │  │  Notion      ▸ Our edge: Structured   │                            │ │
│  │                          │  │  └─────────────────────────────────────────┘                            │ │
│  │                          │  │                                                                        │ │
│  │                          │  │  Strategic Goals                                                       │ │
│  │                          │  │  ──────────────────────────────────────────────────────                  │ │
│  │                          │  │  [SG1] Reduce context-switching by 60%                                 │ │
│  │                          │  │  [SG2] Cut spec-to-deploy cycle from 3 weeks to 3 days                 │ │
│  │                          │  │  [SG3] Zero orphaned specs after 30 days                               │ │
│  │                          │  │                                                                        │ │
│  └──────────────────────────┘  └──────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Navigation Logic — Scenario 1

- **Sidebar structure**: Only the PRODUCT section appears because that's the only
  artifact that exists. No "Epics" section, no "Experience" section — they don't
  exist yet, so the sidebar doesn't pretend they do.

- **Next Steps panel**: Below the nav tree, CTAs appear for plays that produce the
  *logically next* artifacts. Since `product.yaml` is LOCKED, the natural next steps
  are `/specify-product` (features) and `/plan-roadmap` (roadmap). These are rendered
  as prominent action cards, not grayed-out placeholders.

- **Sub-navigation**: The product page itself uses tabs (Market Context | Vision & Goals
  | Scope | Comments) mirroring the brief-principles tab structure.

- **ID tokens**: `[U1]`, `[U2]`, `[SG1]`, `[SG2]`, `[SG3]` are clickable cross-ref
  tokens. In greenfield, they resolve within the same artifact. Later, other artifacts
  will link back to these IDs.

- **Breadcrumb**: Simple `🏠 > Product Vision` — only one level deep.

---

## Scenario 2: Mid-Specification — Product + Features + Roadmap + Some Epics Scoped

Multiple artifacts exist. The sidebar has grown to show the product layer AND the
beginning of per-epic structure. Cross-references are now live across artifacts —
clicking `[F1]` in the roadmap navigates to that feature's detail.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌────────────────────┐  │  │  🏠 > Roadmap > Timeline                                               │ │
│  │  │ 🔍 Search...       │  │  │  ─────────────────────────────────────────────────────────────────────  │ │
│  │  └────────────────────┘  │  │                                                                        │ │
│  │                          │  │  ┌────────────────────────────────────────────────────────────────────┐  │ │
│  │  ── PRODUCT ──────────── │  │  │  TaskFlow Roadmap                                  [APPROVED] 🟢  │  │ │
│  │                          │  │  │  Thesis: Ship iteratively; auth first, then core PM               │  │ │
│  │  📄 Product Vision  🔵   │  │  └────────────────────────────────────────────────────────────────────┘  │ │
│  │  📄 Roadmap         🟢   │  │                                                                        │ │
│  │  📄 Features        🟡   │  │  ┌─ Strategy ─┬─ Timeline ──┬─ Feasibility ─┬─ Comments (2) ─────────┐  │ │
│  │                          │  │  │             │  ◆ active   │               │                        │  │ │
│  │  ── EPICS ────────────── │  │  └──────────────────────────────────────────────────────────────────────  │ │
│  │                          │  │                                                                        │ │
│  │  ▼ E1: Authentication    │  │  Timeline                                                              │ │
│  │    ● features.yaml  🔵   │  │  ════════════════════════════════════════════════════                    │ │
│  │    ○ scenarios.yaml       │  │                                                                        │ │
│  │    ○ plan.yaml            │  │  ┌─ NEAR (MVP) ─────────────────────────────────────────────────────┐  │ │
│  │    ○ architecture.yaml    │  │  │                                                                  │  │ │
│  │    ○ tech.yaml            │  │  │  [F1] User Authentication              [SG1] ─── Risk: low 🟢    │  │ │
│  │                          │  │  │  OAuth + session management                                      │  │ │
│  │  ▶ E2: Project Mgmt      │  │  │  Depends: none │ Foundation: ✓                                   │  │ │
│  │    ● features.yaml  🟡   │  │  │                                                                  │  │ │
│  │    ○ scenarios.yaml       │  │  │  [F2] Task Board                       [SG1] ─── Risk: med 🟡    │  │ │
│  │    ○ plan.yaml            │  │  │  Kanban + sprint views                                           │  │ │
│  │                          │  │  │  Depends: [F1] │ Foundation: ✗                                    │  │ │
│  │  ▶ E3: Analytics          │  │  │                                                                  │  │ │
│  │    ○ features.yaml        │  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                          │  │                                                                        │ │
│  │                          │  │  ┌─ MID (Post-MVP) ──────────────────────────────────────────────────┐  │ │
│  │  ── EXPERIENCE ───────── │  │  │                                                                  │  │ │
│  │   ○ Not started           │  │  │  [F3] Sprint Analytics                 [SG2] ─── Risk: med 🟡    │  │ │
│  │   ╔════════════════════╗  │  │  │  Velocity, burndown, predictions                                │  │ │
│  │   ║ 🎨 Design Exp     ║  │  │  │  Depends: [F2] │ Foundation: ✗                                   │  │ │
│  │   ║   /design-exp     ║  │  │  │                                                                  │  │ │
│  │   ╚════════════════════╝  │  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                          │  │                                                                        │ │
│  │                          │  │  ┌─ LONG (Future) ───────────────────────────────────────────────────┐  │ │
│  │  ── NEXT STEPS ───────── │  │  │                                                                  │  │ │
│  │                          │  │  │  [F4] AI Copilot                        [SG2] ─── Risk: high 🔴   │  │ │
│  │  For E1 (Auth):          │  │  │  Natural-language task decomposition                              │  │ │
│  │  ╔════════════════════╗  │  │  │  Depends: [F2],[F3] │ Foundation: ✗                               │  │ │
│  │  ║ ⚙️ Prepare Epic    ║  │  │  │                                                                  │  │ │
│  │  ║  /prepare-epic E1  ║  │  │  │  [F5] Marketplace                      [SG3] ─── Risk: high 🔴   │  │ │
│  │  ╚════════════════════╝  │  │  │  Plugin ecosystem for integrations                                │  │ │
│  │                          │  │  │  Depends: [F1],[F4] │ Foundation: ✗                               │  │ │
│  │  For E3 (Analytics):     │  │  │                                                                  │  │ │
│  │  ╔════════════════════╗  │  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │  ║ 📋 Scope Features  ║  │  │                                                                        │ │
│  │  ║  /specify-product  ║  │  │  Critical Blockers                                                    │ │
│  │  ╚════════════════════╝  │  │  ──────────────────────────────────────────────────────                  │ │
│  │                          │  │  ┌─── 🔴 ────────────────────────────────────────────────────────────┐  │ │
│  │                          │  │  │  OAuth provider selection unresolved                              │  │ │
│  │                          │  │  │  Affects: [F1]  │  Status: unresolved                            │  │ │
│  │                          │  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                          │  │                                                                        │ │
│  └──────────────────────────┘  └──────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Navigation Logic — Scenario 2

- **Sidebar has grown organically**: Three sections now exist — PRODUCT (3 artifacts),
  EPICS (per-epic trees), and EXPERIENCE (empty but acknowledged). The sidebar reflects
  reality: E1 has features locked, E2 has features in draft, E3 has nothing yet.

- **Per-epic artifact trees**: Each epic shows its artifact checklist. Present artifacts
  get a status badge (🔵 locked, 🟡 draft, 🟢 validated). Missing artifacts show as
  `○` — not errors, just "not yet." The tree collapses/expands per epic (▼/▶).

- **Cross-reference navigation**: In the main content area, `[F1]`, `[F2]`, `[SG1]`,
  `[SG2]` are clickable. Clicking `[F1]` navigates to `E1 > features.yaml > F1` detail.
  Clicking `[SG1]` navigates back to `Product Vision > Strategic Goals > SG1`.

- **Contextual Next Steps**: The sidebar CTAs are now *scoped per epic*. E1 has all
  features locked → the next step is `/prepare-epic E1`. E3 has nothing → the next
  step is `/specify-product`. CTAs are contextual, not generic.

- **Breadcrumb**: `🏠 > Roadmap > Timeline` — two levels deep.

- **Feature dependency arrows**: `Depends: [F1]` is a clickable link. The dependency
  chain is visible at a glance within each horizon card.

---

## Scenario 3: Implementation-Ready — Full Artifact Tree for One Epic

The densest navigation state. At least one epic (E1) has all artifacts: features,
scenarios, plan, architecture, tech. The user can drill from product overview all
the way down to individual scenario pass criteria.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌────────────────────┐  │  │  🏠 > E1: Auth > Features > [F1] User Authentication                   │ │
│  │  │ 🔍 Search...       │  │  │  ─────────────────────────────────────────────────────────────────────  │ │
│  │  └────────────────────┘  │  │                                                                        │ │
│  │                          │  │  ┌────────────────────────────────────────────────────────────────────┐  │ │
│  │  ── PRODUCT ──────────── │  │  │  F1: User Authentication                          [P1] [SG1]      │  │ │
│  │                          │  │  │  Status: LOCKED 🔵 │ Foundation: ✓ │ Depends: none                │  │ │
│  │  📄 Product Vision  🔵   │  │  └────────────────────────────────────────────────────────────────────┘  │ │
│  │  📄 Roadmap         🔵   │  │                                                                        │ │
│  │  📄 Features        🔵   │  │  ┌─ Intent ─┬─ Scenarios ─┬─ Blast Radius ─┬─ Behaviors ─┬ Comments ┐  │ │
│  │                          │  │  │ ◆ active │             │                │             │          │  │ │
│  │  ── E1: AUTHENTICATION ─ │  │  └──────────────────────────────────────────────────────────────────────  │ │
│  │   ◀ All artifacts ready  │  │                                                                        │ │
│  │                          │  │  Intent (IDD)                                                          │ │
│  │   📄 features.yaml  🔵   │  │  ════════════════════════════════════════════════════                    │ │
│  │   📄 scenarios.yaml 🔵   │  │                                                                        │ │
│  │   📄 plan.yaml      🔵   │  │  P1 — Problem                                                          │ │
│  │   📄 architecture   🔵   │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │   📄 tech.yaml      🔵   │  │  │  Users must create separate accounts for every dev tool,        │   │ │
│  │                          │  │  │  leading to credential fatigue and security gaps.                │   │ │
│  │   ╔════════════════════╗ │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │   ║ 🚀 Implement      ║ │  │                                                                        │ │
│  │   ║  /implement-epic   ║ │  │  P2 — Outcome                                                          │ │
│  │   ╚════════════════════╝ │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │                          │  │  │  Single OAuth login provides access to all TaskFlow features.    │   │ │
│  │  ── E2: PROJECT MGMT ── │  │  │  Sessions persist 7 days with refresh token rotation.            │   │ │
│  │   📄 features.yaml  🟡  │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │   ○ scenarios.yaml       │  │                                                                        │ │
│  │   ○ plan.yaml            │  │  P3 — Strategic Connection                                              │ │
│  │   ○ architecture.yaml    │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │   ○ tech.yaml            │  │  │  Foundation for [SG1] — every feature requires authenticated     │   │ │
│  │                          │  │  │  users. Blocking dependency for [F2], [F3], [F4].                │   │ │
│  │  ── E3: ANALYTICS ───── │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │   ○ features.yaml        │  │                                                                        │ │
│  │                          │  │  Constraints                                                            │ │
│  │  ── EXPERIENCE ───────── │  │  ──────────────────────────────────────────────────────                  │ │
│  │   📄 Personas       🔵   │  │  In scope:  OAuth (Google, GitHub) + email/password fallback            │ │
│  │   📄 Screens        🔵   │  │  Out scope: SAML/SSO enterprise federation                             │ │
│  │   📄 Flows          🔵   │  │  Must not break: [INV1] All API endpoints return <200ms p95            │ │
│  │   📄 Design Spec    🔵   │  │                                                                        │ │
│  │                          │  │  Success Scenarios                                                      │ │
│  │                          │  │  ──────────────────────────────────────────────────────                  │ │
│  │                          │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │                          │  │  │ Given: User on login page                                       │   │ │
│  │                          │  │  │ When:  Clicks "Sign in with Google"                              │   │ │
│  │                          │  │  │ Then:  Redirected to dashboard with session cookie set            │   │ │
│  │                          │  │  │        ↳ Scenarios: [SC-AUTH-001] [SC-AUTH-002]                   │   │ │
│  │                          │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                          │  │                                                                        │ │
│  │                          │  │  Failure Conditions                                                     │ │
│  │                          │  │  ──────────────────────────────────────────────────────                  │ │
│  │                          │  │  🔴 OAuth token exchange fails silently — user stuck on blank page      │ │
│  │                          │  │  🔴 Session expires mid-action — unsaved work lost                      │ │
│  │                          │  │                                                                        │ │
│  └──────────────────────────┘  └──────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Navigation Logic — Scenario 3

- **Deep sidebar tree**: E1 section is now fully populated — all 5 artifacts are present
  and LOCKED (🔵). The sidebar subtitle reads "All artifacts ready" as a visual cue
  that this epic is implementation-ready.

- **Feature-level drill-down**: Breadcrumb shows `🏠 > E1: Auth > Features > [F1]`.
  The user navigated: sidebar epic → features artifact → specific feature card. Each
  feature becomes its own sub-page with tabs (Intent | Scenarios | Blast Radius |
  Behaviors | Comments).

- **Cross-reference density**: Within F1's content, we see references to `[SG1]`,
  `[F2]`, `[F3]`, `[F4]`, `[INV1]`, `[SC-AUTH-001]`, `[SC-AUTH-002]`. Each is a
  clickable token that navigates to the target artifact and section. Scenario IDs
  navigate to `E1 > scenarios.yaml > SC-AUTH-001`.

- **CTA placement**: Since E1 is fully specified, the CTA is `/implement-epic` —
  the logical next action. This appears in the sidebar under E1's artifact list.

- **Experience section**: Now populated with 4 artifacts (Personas, Screens, Flows,
  Design Spec), all locked. These are product-level, not per-epic.

- **Multi-epic comparison**: E2 and E3 remain at earlier stages. The sidebar makes
  this instantly visible without clicking into each epic.

---

## Scenario 4: Brownfield Multi-Epic — Different Stages + STM Evidence

Multiple epics at different lifecycle stages. Some done with implementation evidence,
some in progress, some just starting. The browser shows status at a glance with an
overview dashboard and lets users drill into execution history.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌────────────────────┐  │  │  🏠 > Epic Overview                                                    │ │
│  │  │ 🔍 Search...       │  │  │  ─────────────────────────────────────────────────────────────────────  │ │
│  │  └────────────────────┘  │  │                                                                        │ │
│  │                          │  │  Epic Status Dashboard                                                  │ │
│  │  ── PRODUCT ──────────── │  │  ════════════════════════════════════════════════════                    │ │
│  │  📄 Product Vision  🔵   │  │                                                                        │ │
│  │  📄 Roadmap         🔵   │  │  ┌──────────┬───────────┬───────────┬──────────┬─────────────────────┐  │ │
│  │  📄 Features        🔵   │  │  │  Epic     │ Specified │ Designed  │ Planned  │ Implemented         │  │ │
│  │                          │  │  ├──────────┼───────────┼───────────┼──────────┼─────────────────────┤  │ │
│  │  ── EPICS ────────────── │  │  │  E1 Auth │  ✓  🔵   │  ✓  🔵   │  ✓  🔵  │ ✓ DONE  ████████░░  │  │ │
│  │                          │  │  │  E2 PM   │  ✓  🔵   │  ✓  🔵   │  ✓  🔵  │ ◐ IN PROGRESS       │  │ │
│  │  ▼ E1: Auth ✅ DONE      │  │  │  E3 Anlyt│  ✓  🟡   │  ○       │  ○       │ ○                    │  │ │
│  │    📄 features      🔵   │  │  │  E4 AI   │  ○        │  ○       │  ○       │ ○                    │  │ │
│  │    📄 scenarios     🔵   │  │  └──────────┴───────────┴───────────┴──────────┴─────────────────────┘  │ │
│  │    📄 plan          🔵   │  │                                                                        │ │
│  │    📄 architecture  🔵   │  │                                                                        │ │
│  │    📄 tech          🔵   │  │  E1: Authentication — DONE ✅                                           │ │
│  │    📂 evidence ──────┐   │  │  ──────────────────────────────────────────────────────                  │ │
│  │       📄 fix-it (2)  │   │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │       📄 commit (5)  │   │  │  │  Features: [F1] Auth  │  Scenarios: 8/8 passing ✅              │   │ │
│  │       📄 pr-review   │   │  │  │  Last activity: 2026-04-10                                      │   │ │
│  │       📄 validate    │   │  │  │  Evidence: 2 fix-its, 5 commits, 1 PR, 1 validation             │   │ │
│  │                      │   │  │  │  [View Evidence →]  [View Scenarios →]                          │   │ │
│  │  ▼ E2: Project ◐ WIP │   │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │    📄 features      🔵   │  │                                                                        │ │
│  │    📄 scenarios     🔵   │  │  E2: Project Management — IN PROGRESS ◐                                │ │
│  │    📄 plan          🔵   │  │  ──────────────────────────────────────────────────────                  │ │
│  │    📄 architecture  🔵   │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │    📄 tech          🔵   │  │  │  Features: [F2] Task Board, [F6] Notifications                  │   │ │
│  │    📂 evidence ──────┐   │  │  │  Plan: 2/4 scope items complete                                │   │ │
│  │       📄 commit (2)  │   │  │  │  Scenarios: 3/12 passing │ 9 remaining                         │   │ │
│  │       📄 enhance (1) │   │  │  │  Blockers: Websocket scaling for real-time updates              │   │ │
│  │                          │  │  │                                                                  │   │ │
│  │  ▶ E3: Analytics 🟡 SPEC │  │  │  ┌────────────────────────────────────────────────────────────┐ │   │ │
│  │    📄 features      🟡   │  │  │  │  Execution Progress                                       │ │   │ │
│  │    ○ scenarios            │  │  │  │  ═══════════════════════                                  │ │   │ │
│  │    ○ plan                 │  │  │  │  Seq 1: [F2] Task Board     ████████████░░░░  75%         │ │   │ │
│  │                          │  │  │  │  Seq 2: [F6] Notifications  ░░░░░░░░░░░░░░░░   0%         │ │   │ │
│  │  ▶ E4: AI Copilot ○ NEW │  │  │  │  Exit gate: "Users can create, move, assign tasks"         │ │   │ │
│  │    ○ features             │  │  │  └────────────────────────────────────────────────────────────┘ │   │ │
│  │                          │  │  │                                                                  │   │ │
│  │  ── EXPERIENCE ───────── │  │  │  [View Plan →] [View Evidence →] [Continue: /implement-epic E2]  │   │ │
│  │  📄 Personas        🔵   │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │  📄 Screens         🔵   │  │                                                                        │ │
│  │  📄 Flows           🔵   │  │  E3: Analytics — SPECIFYING 🟡                                         │ │
│  │  📄 Design Spec     🔵   │  │  ──────────────────────────────────────────────────────                  │ │
│  │                          │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │                          │  │  │  Features: [F3] Sprint Analytics (draft)                        │   │ │
│  │                          │  │  │  Next: Scenarios + Plan needed                                  │   │ │
│  │                          │  │  │  [Prepare Epic: /prepare-epic E3]                               │   │ │
│  │                          │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                          │  │                                                                        │ │
│  │                          │  │  E4: AI Copilot — NOT STARTED ○                                        │ │
│  │                          │  │  ──────────────────────────────────────────────────────                  │ │
│  │                          │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │                          │  │  │  No artifacts yet. Blocked by: [F2], [F3]                       │   │ │
│  │                          │  │  │  [Start: /specify-product E4]                                   │   │ │
│  │                          │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                          │  │                                                                        │ │
│  └──────────────────────────┘  └──────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Navigation Logic — Scenario 4

- **Status-at-a-glance dashboard**: The main content shows an Epic Status Dashboard
  as a table. Each epic's lifecycle stage is visible in one row: Specified → Designed
  → Planned → Implemented. Progress bars and status indicators (✅ DONE, ◐ IN PROGRESS,
  🟡, ○) make the project health instantly scannable.

- **Sidebar status labels**: Each epic in the sidebar gets a one-word status label
  after its name: ✅ DONE, ◐ WIP, 🟡 SPEC, ○ NEW. This is redundant with the
  dashboard intentionally — the sidebar is always visible.

- **Evidence subtrees**: For implemented epics (E1, E2), a collapsible `📂 evidence`
  folder appears under the artifact list. Evidence items are grouped by play type
  (fix-it, commit, enhance, pr-review, validate) with counts. Clicking navigates
  to the STM evidence detail.

- **Execution progress within cards**: E2's card shows a progress visualization —
  scope items from `plan.yaml` rendered as progress bars per sequence item. The
  scenario gate status (3/12 passing) is prominent.

- **Contextual CTAs per epic stage**:
  - E1 (done): No CTA — it's complete
  - E2 (in progress): "Continue: /implement-epic E2"
  - E3 (specifying): "Prepare Epic: /prepare-epic E3"
  - E4 (not started): "Start: /specify-product E4" + shows blockers

- **Breadcrumb**: `🏠 > Epic Overview` — this is a synthesized overview page, not
  tied to a single artifact.

---

## Scenario 5: Annotation/Action — User Interacting with Artifact Page

Shows the interaction layer: wiki tags rendered as action chips, CTA buttons with
content slots for play results, and annotation highlights with margin comments.
This wireframe focuses on a single artifact page in an interactive state.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌────────────────────┐  │  │  🏠 > E2: PM > Architecture > Stack                                    │ │
│  │  │ 🔍 Search...       │  │  │  ─────────────────────────────────────────────────────────────────────  │ │
│  │  └────────────────────┘  │  │                                                                        │ │
│  │                          │  │  ┌────────────────────────────────────────────────────────────────────┐  │ │
│  │  ── PRODUCT ──────────── │  │  │  E2 Architecture                                   [LOCKED] 🔵    │  │ │
│  │  📄 Product Vision  🔵   │  │  │  Last updated: 2026-04-14                                          │  │ │
│  │  📄 Roadmap         🔵   │  │  └────────────────────────────────────────────────────────────────────┘  │ │
│  │  📄 Features        🔵   │  │                                                                        │ │
│  │                          │  │  ┌ Architecture ┬ Stack ─────┬ Agentic ┬ Operations ┬ Comments (3) ──┐  │ │
│  │  ── E2: PROJECT MGMT ── │  │  │              │  ◆ active  │         │            │                │  │ │
│  │   📄 features       🔵   │  │  └──────────────────────────────────────────────────────────────────────  │ │
│  │   📄 scenarios      🔵   │  │                                                                        │ │
│  │   📄 plan           🔵   │  │  Technology Stack                                                      │ │
│  │  ▸📄 architecture   🔵   │  │  ════════════════════════════════════════════════════                    │ │
│  │   📄 tech           🔵   │  │                                                                        │ │
│  │                          │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │  ── E1: AUTH ✅ ──────── │  │  │  Frontend: React 19 + TypeScript 5.4                            │   │ │
│  │  (collapsed)              │  │  │  Purpose: SPA with server components for dashboard              │   │ │
│  │                          │  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │ │
│  │                          │  │  │  ╔══════════ ANNOTATION ═══════════╗   ┌─── 💬 ──────────────┐  │   │ │
│  │                          │  │  │  ║ Rationale: React 19 chosen for ║   │ @reviewer:           │  │   │ │
│  │                          │  │  │  ║ server component support and   ║   │ Should we consider   │  │   │ │
│  │                          │  │  │  ║ concurrent rendering perf.     ║   │ Svelte 5 instead?    │  │   │ │
│  │                          │  │  │  ╚════════════════════════════════╝   │ React bundle size    │  │   │ │
│  │                          │  │  │                                       │ concerns for perf.   │  │   │ │
│  │                          │  │  │                                       └──────────────────────┘  │   │ │
│  │                          │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                          │  │                                                                        │ │
│  │                          │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │                          │  │  │  Backend: Python 3.12 + FastAPI                                 │   │ │
│  │                          │  │  │  Purpose: REST API + WebSocket for real-time updates             │   │ │
│  │                          │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                          │  │                                                                        │ │
│  │                          │  │  ── Wiki Tags ──────────────────────────────────────────────────────    │ │
│  │                          │  │                                                                        │ │
│  │                          │  │  Research tag (before execution):                                      │ │
│  │                          │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │                          │  │  │  ┌──────────────────────────────────────────────────────────┐    │   │ │
│  │                          │  │  │  │ 🔬 [[research: Compare React 19 vs Svelte 5 for         │    │   │ │
│  │                          │  │  │  │    dashboard-heavy apps with real-time updates]]         │    │   │ │
│  │                          │  │  │  │                                        [▶ Run Research]  │    │   │ │
│  │                          │  │  │  └──────────────────────────────────────────────────────────┘    │   │ │
│  │                          │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                          │  │                                                                        │ │
│  │                          │  │  Research tag (during execution — spinner):                             │ │
│  │                          │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │                          │  │  │  ┌──────────────────────────────────────────────────────────┐    │   │ │
│  │                          │  │  │  │ 🔬 [[research: Compare React 19 vs Svelte 5...]]        │    │   │ │
│  │                          │  │  │  │                                      ◌ Running...  [✕]  │    │   │ │
│  │                          │  │  │  └──────────────────────────────────────────────────────────┘    │   │ │
│  │                          │  │  │  ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐    │   │ │
│  │                          │  │  │  ╎ Content slot: streaming play output appears here...     ╎    │   │ │
│  │                          │  │  │  ╎ ▌                                                       ╎    │   │ │
│  │                          │  │  │  └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘    │   │ │
│  │                          │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                          │  │                                                                        │ │
│  │                          │  │  Research tag (after execution — collapsed result):                     │ │
│  │                          │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │                          │  │  │  ┌──────────────────────────────────────────────────────────┐    │   │ │
│  │                          │  │  │  │ 🔬 [[research: Compare React 19 vs Svelte 5...]]        │    │   │ │
│  │                          │  │  │  │                                     ✅ Complete [▼ ▲]    │    │   │ │
│  │                          │  │  │  └──────────────────────────────────────────────────────────┘    │   │ │
│  │                          │  │  │  ┌──────────────────────────────────────────────────────────┐    │   │ │
│  │                          │  │  │  │  Result:                                                 │    │   │ │
│  │                          │  │  │  │  React 19 preferred for this use case. Server            │    │   │ │
│  │                          │  │  │  │  components reduce client bundle by ~40%. Svelte 5       │    │   │ │
│  │                          │  │  │  │  has smaller base but ecosystem gaps for...              │    │   │ │
│  │                          │  │  │  │  [Read full result →]                                    │    │   │ │
│  │                          │  │  │  └──────────────────────────────────────────────────────────┘    │   │ │
│  │                          │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                          │  │                                                                        │ │
│  │                          │  │  ── CTA Buttons ────────────────────────────────────────────────────    │ │
│  │                          │  │                                                                        │ │
│  │                          │  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │                          │  │  │                                                                  │   │ │
│  │                          │  │  │  ╔══════════════════════════╗  ╔══════════════════════════════╗   │   │ │
│  │                          │  │  │  ║  🔄 Regenerate Tech LLD ║  ║  📊 Run Feasibility Check    ║   │   │ │
│  │                          │  │  │  ║    /prepare-epic E2      ║  ║    /assess-feasibility E2    ║   │   │ │
│  │                          │  │  │  ╚══════════════════════════╝  ╚══════════════════════════════╝   │   │ │
│  │                          │  │  │                                                                  │   │ │
│  │                          │  │  │  Content slot (after CTA execution):                              │   │ │
│  │                          │  │  │  ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐   │   │ │
│  │                          │  │  │  ╎  Play output / result summary appears here.               ╎   │   │ │
│  │                          │  │  │  ╎  Inline or linked to full evidence file.                   ╎   │   │ │
│  │                          │  │  │  └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘   │   │ │
│  │                          │  │  │                                                                  │   │ │
│  │                          │  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                          │  │                                                                        │ │
│  └──────────────────────────┘  └──────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Navigation Logic — Scenario 5

- **Annotation system**: Text can be selected and annotated. The wireframe shows an
  annotation on the "Rationale" field of a stack entry. The highlighted text appears
  with a distinct border (`╔══ ANNOTATION ══╗`), and the comment appears in a margin
  popover (`💬`) to the right. Comments reference the reviewer and contain the feedback.

- **Wiki tag lifecycle**: Three states are shown for `[[research:prompt]]` tags:
  1. **Before execution**: The tag renders as an action chip with the prompt text
     visible and a `[▶ Run Research]` button. The user can see what research will
     be done and trigger it.
  2. **During execution**: The button changes to a spinner (`◌ Running...`) with a
     cancel button (`[✕]`). Below the tag, a dashed-border content slot appears where
     streaming output from the play is shown in real-time.
  3. **After execution**: The tag shows `✅ Complete` with a collapse toggle (`[▼ ▲]`).
     The result is shown in a solid-border content slot below, truncated with a
     `[Read full result →]` link to the complete evidence file.

- **CTA buttons**: Appear at contextually appropriate points on the page. In this case,
  two action buttons are shown — one to regenerate the tech LLD (since architecture
  was updated) and one to run feasibility. Each CTA shows:
  - An icon + action label
  - The play command it maps to
  - After execution, a content slot below for the result

- **Content slots**: Dashed-border regions (`╌╌╌`) that expand to show play output.
  These are empty until a play runs, then populate with inline results or links to
  full evidence files in STM.

- **Sidebar state**: The current artifact (`architecture`) is highlighted with `▸` in
  the sidebar. The sidebar otherwise behaves identically to Scenario 3.

---

## Component Reference

### Cross-Reference Token Rendering

```
Standard ID tokens and their visual treatment:

  Feature:     [F1]  [F2]          → blue, navigates to features.yaml#F1
  Scenario:    [SC-AUTH-001]       → blue, navigates to scenarios.yaml#SC-AUTH-001
  Strategic:   [SG1] [SG2]        → blue, navigates to product.yaml#SG1
  User:        [U1]  [U2]         → blue, navigates to product.yaml#U1
  Invariant:   [INV1]             → blue, navigates to features.yaml#INV1
  Behavior:    [F1-B1]            → blue, navigates to features.yaml#F1-B1
  Tech Princ:  [TP1]              → blue, navigates to architecture.yaml#TP1
  Design Dec:  [DD1]              → blue, navigates to tech.yaml#DD1

All tokens: rounded-rect background, --color-water text, underline on hover,
click navigates to artifact + scrolls to section. Tooltip shows preview on hover.
```

### Status Badge System

```
Badge states and their visual treatment:

  🔵  LOCKED       → blue badge, solid     "Production-ready, no changes"
  🟢  VALIDATED    → green badge, solid    "Reviewed and approved"
  🟡  DRAFT        → yellow badge, solid   "Work in progress"
  ○   NOT STARTED  → gray outline, empty   "Artifact doesn't exist yet"
  ✅  DONE         → green checkmark       "Epic fully implemented"
  ◐   IN PROGRESS  → half-fill indicator   "Implementation underway"
  🔴  BLOCKER      → red badge             "Blocked, needs attention"
```

### Sidebar Section Visibility Rules

```
Section          │ Appears when...
─────────────────┼──────────────────────────────────────────────
PRODUCT          │ Always (at minimum product.yaml exists)
EPICS            │ features.yaml exists for ≥1 epic
  └─ Epic N      │ features.yaml exists for that epic
     └─ evidence │ STM evidence directory has ≥1 file for that epic
EXPERIENCE       │ Any experience artifact exists (personas, screens, flows, design-spec)
NEXT STEPS       │ Any actionable CTA is available (always, but content varies)

Sections that have no content do NOT appear. The sidebar never shows empty sections
or placeholders — it only shows what exists, plus CTAs for what can be created next.
```

### Adaptive Sidebar Growth Progression

```
Stage 1 (Greenfield):          Stage 2 (Mid-spec):           Stage 3+ (Full):
┌────────────────────┐         ┌────────────────────┐        ┌────────────────────┐
│ PRODUCT            │         │ PRODUCT            │        │ PRODUCT            │
│  📄 Product   🔵   │         │  📄 Product   🔵   │        │  📄 Product   🔵   │
│                    │         │  📄 Roadmap   🟢   │        │  📄 Roadmap   🔵   │
│ NEXT STEPS         │         │  📄 Features  🟡   │        │  📄 Features  🔵   │
│  ╔══════════════╗  │         │                    │        │                    │
│  ║ Define Feat. ║  │         │ EPICS              │        │ EPICS              │
│  ╚══════════════╝  │         │  ▼ E1: Auth        │        │  ▼ E1: Auth ✅     │
│  ╔══════════════╗  │         │    📄 features 🔵  │        │    📄 features 🔵  │
│  ║ Plan Roadmap ║  │         │    ○ scenarios     │        │    📄 scenarios🔵  │
│  ╚══════════════╝  │         │  ▶ E2: PM          │        │    📄 plan     🔵  │
│                    │         │    📄 features 🟡  │        │    📄 arch     🔵  │
│                    │         │                    │        │    📄 tech     🔵  │
│                    │         │ EXPERIENCE         │        │    📂 evidence     │
│                    │         │  ○ Not started     │        │  ▼ E2: PM ◐       │
│                    │         │                    │        │    📄 features 🔵  │
│                    │         │ NEXT STEPS         │        │    ...             │
│                    │         │  For E1:           │        │                    │
│                    │         │  ╔══════════════╗  │        │ EXPERIENCE         │
│                    │         │  ║ Prepare Epic ║  │        │  📄 Personas  🔵   │
│                    │         │  ╚══════════════╝  │        │  📄 Screens   🔵   │
│                    │         │                    │        │  📄 Flows     🔵   │
└────────────────────┘         └────────────────────┘        │  📄 Design    🔵   │
                                                             │                    │
                                                             │ (CTAs per-epic)    │
                                                             └────────────────────┘
```

---

## Key Design Decisions

1. **No empty sections**: The sidebar and content area never show placeholders for
   artifacts that don't exist. The browser feels "complete" at every stage.

2. **CTAs are contextual**: Next-step actions are scoped to the specific epic or
   artifact level. They appear in the sidebar under "NEXT STEPS" and inline in
   content cards.

3. **Cross-references are first-class**: Every ID token (`[F1]`, `[SC-AUTH-001]`,
   `[SG1]`) is a navigable link. Hover shows a tooltip preview. Click navigates
   to the target artifact and scrolls to the section.

4. **Evidence is accessible but secondary**: STM evidence (fix-it, commit, PR, etc.)
   appears as a collapsible subfolder under its epic. It's not front-and-center
   but is always one click away.

5. **Wiki tags have three visual states**: Before (action button), during (spinner +
   streaming slot), and after (collapsed result). The content slot is a distinct
   visual element (dashed border) that only appears when relevant.

6. **Annotations live in the margin**: Selected text is highlighted with an orange
   underline/border. The comment appears in a popover to the right of the content.
   The Comments tab aggregates all annotations with their context.

7. **The dashboard is synthesized**: The Epic Overview page (Scenario 4) is not tied
   to a single YAML file — it's assembled from all epic artifacts + STM evidence.
   It's the "home page" for active projects.
