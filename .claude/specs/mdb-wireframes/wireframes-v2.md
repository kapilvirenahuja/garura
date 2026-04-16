# MDB v2 — Meridian Artifact Browser: Generative UX Wireframes

> Complete redesign from v1. Three discrete levels — **Project Cockpit**, **Journey Map**,
> **Artifact Detail** — with clear transitions. No sidebar file tree. Pages are generatively
> composed from a component library based on project context.

---

## Design Principles

| Principle                | Description                                                                  |
|--------------------------|------------------------------------------------------------------------------|
| Three Levels             | Cockpit → Journey → Detail. Never more than 3 clicks to any artifact.        |
| Generative UX            | AI composes page layouts from a component library; pages adapt to context.   |
| No Sidebar               | No persistent file tree. Navigation via breadcrumbs, cards, and search.      |
| Progressive Disclosure   | Aggregate first (3 epics in progress), drill on demand.                      |
| Minimal for Greenfield   | Empty projects see ONE action, not a skeleton of empty sections.             |

## Visual Legend

```
┌─────────────────────┐     Solid border   = Static component (always present, deterministic)
│  Static Component   │
└─────────────────────┘

┊─────────────────────┊     Dashed border  = 🤖 Generative region (AI-composed from context)
┊ 🤖 Generated        ┊
┊─────────────────────┊

╔═════════════════════╗     Double border  = CTA / Action button (maps to a Meridian play)
║  Action Button      ║
╚═════════════════════╝

◉━━━━━━━━━━━━━━━━━━━━━     Thick line     = Journey stage connector

[F1] [SG1] [SC-AUTH-001]   Bracketed IDs  = Clickable CrossRefTokens

● LOCKED  ◐ DRAFT  ◑ VALIDATED  ○ MISSING    Status badges
```

## Persistent Top Bar (All Screens)

The top bar is a static shell, always present. The readiness gauge updates reactively.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ◈ MERIDIAN   TaskFlow                          ┌──────────────────┐   ◉ 45/100   ⚙ Settings           │
│                                                  │ 🔍 Search...     │   ▔▔▔▔▔▔▔                         │
│                                                  └──────────────────┘                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  🏠 Home  ›  ...breadcrumb context...                                                                   │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Static elements:** Logo, project name, search bar, settings icon, breadcrumb bar.
**Reactive element:** Readiness mini-gauge (always shows current score, clickable → cockpit).

---

## Screen 1: Project Cockpit — Greenfield (Readiness: 0)

*Just installed Meridian. No artifacts, no code detection. Maximum simplicity.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ◈ MERIDIAN   My New Project                    ┌──────────────────┐   ◉ 0/100    ⚙ Settings            │
│                                                  │ 🔍 Search...     │   ▔▔▔▔▔▔                          │
│                                                  └──────────────────┘                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  🏠 Home                                                                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                          │
│                          ┌────────────────────────────────────────────┐                                   │
│                          │                                            │                                   │
│                          │           ┌──────────────┐                 │                                   │
│                          │           │              │                 │                                   │
│                          │           │    0 / 100   │                 │                                   │
│                          │           │              │                 │                                   │
│                          │           └──────────────┘                 │                                   │
│                          │         ReadinessGauge [static]            │                                   │
│                          │                                            │                                   │
│                          └────────────────────────────────────────────┘                                   │
│                                                                                                          │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                   ┊  🤖 GENERATIVE: Welcome Message                          ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊  Welcome to Meridian.                                    ┊                            │
│                   ┊  Let's get your project started.                         ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊  Meridian guides you from idea to implementation         ┊                            │
│                   ┊  through structured product thinking. Start by           ┊                            │
│                   ┊  describing what you want to build.                      ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                                                                                                          │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                   ┊  🤖 GENERATIVE: Primary Action                           ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊  ╔══════════════════════════════════════════════════╗     ┊                            │
│                   ┊  ║  📝  Provide Your Project Brief                 ║     ┊                            │
│                   ┊  ║                                                  ║     ┊                            │
│                   ┊  ║  Describe your product idea. Meridian will       ║     ┊                            │
│                   ┊  ║  extract market context, users, and scope.      ║     ┊                            │
│                   ┊  ║                                          → Start ║     ┊                            │
│                   ┊  ╚══════════════════════════════════════════════════╝     ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                                                                                                          │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                   ┊  🤖 GENERATIVE: What Happens Next                        ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊  1. You describe your idea in plain language              ┊                            │
│                   ┊  2. Meridian researches the market & competition          ┊                            │
│                   ┊  3. A structured product spec is generated                ┊                            │
│                   ┊  4. You review and lock the spec                          ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                                                                                                          │
│                                                                                                          │
│  ── Journey ──────────────────────────────────────────────────────────────────────                        │
│  ┌──────────────────┐                                                                                    │
│  │ View Full Journey │ →  (navigates to Screen 4)                                                        │
│  └──────────────────┘                                                                                    │
│                                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Static components:** Top bar, ReadinessGauge shell, breadcrumb, "View Full Journey" link.
**Generative regions:** Welcome message (adapts to project type), primary action card (play selection
based on what's missing), "What happens next" explanation (adapts to detected project profile).

### Transitions from Screen 1:
- `[Click "→ Start"]` → Triggers `specify-product` play; stays on cockpit, ContentSlot appears below action card
- `[Click "View Full Journey"]` → Screen 4 (Journey Map)
- `[Click Readiness Gauge]` → Scrolls to readiness breakdown (same page)

---

## Screen 2: Project Cockpit — Brownfield (Readiness: 0, code exists)

*Existing codebase detected. No Meridian artifacts yet. Generative engine adapts messaging.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ◈ MERIDIAN   acme-dashboard                    ┌──────────────────┐   ◉ 0/100    ⚙ Settings            │
│                                                  │ 🔍 Search...     │   ▔▔▔▔▔▔                          │
│                                                  └──────────────────┘                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  🏠 Home                                                                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                          │
│                          ┌────────────────────────────────────────────┐                                   │
│                          │           ┌──────────────┐                 │                                   │
│                          │           │    0 / 100   │                 │                                   │
│                          │           └──────────────┘                 │                                   │
│                          │         ReadinessGauge [static]            │                                   │
│                          └────────────────────────────────────────────┘                                   │
│                                                                                                          │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                   ┊  🤖 GENERATIVE: Welcome Message (brownfield variant)     ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊  We detected an existing codebase.                       ┊                            │
│                   ┊  Let's onboard it to Meridian.                           ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                                                                                                          │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                   ┊  🤖 GENERATIVE: Project Detection Summary                ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊  ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐  ┊                            │
│                   ┊  │ TypeScript      │ │ React 19        │ │ 142 files  │  ┊                            │
│                   ┊  │ Primary lang    │ │ + Next.js 15    │ │ 28k LOC    │  ┊                            │
│                   ┊  └─────────────────┘ └─────────────────┘ └────────────┘  ┊                            │
│                   ┊  ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐  ┊                            │
│                   ┊  │ PostgreSQL      │ │ Jest + Cypress  │ │ 67% test   │  ┊                            │
│                   ┊  │ via Prisma ORM  │ │ Testing stack   │ │ coverage   │  ┊                            │
│                   ┊  └─────────────────┘ └─────────────────┘ └────────────┘  ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                                                                                                          │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                   ┊  🤖 GENERATIVE: Primary Action (brownfield variant)      ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊  ╔══════════════════════════════════════════════════╗     ┊                            │
│                   ┊  ║  🔍  Analyze & Onboard Your Project             ║     ┊                            │
│                   ┊  ║                                                  ║     ┊                            │
│                   ┊  ║  Meridian will scan your codebase, infer        ║     ┊                            │
│                   ┊  ║  architecture, detect patterns, and create      ║     ┊                            │
│                   ┊  ║  a project profile. Then we'll guide you        ║     ┊                            │
│                   ┊  ║  through specifying what you're building.       ║     ┊                            │
│                   ┊  ║                                       → Onboard ║     ┊                            │
│                   ┊  ╚══════════════════════════════════════════════════╝     ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                                                                                                          │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                   ┊  🤖 GENERATIVE: Onboarding Explanation                   ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊  During onboarding, Meridian will:                        ┊                            │
│                   ┊  • Map your project structure and dependencies            ┊                            │
│                   ┊  • Detect architectural patterns (React SPA, REST API)   ┊                            │
│                   ┊  • Identify existing quality signals (67% test coverage) ┊                            │
│                   ┊  • Create a project profile for future recommendations   ┊                            │
│                   ┊                                                          ┊                            │
│                   ┊──────────────────────────────────────────────────────────┊                            │
│                                                                                                          │
│  ── Journey ──────────────────────────────────────────────────────────────────────                        │
│  ┌──────────────────┐                                                                                    │
│  │ View Full Journey │ →  (navigates to Screen 4)                                                        │
│  └──────────────────┘                                                                                    │
│                                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Static components:** Top bar, ReadinessGauge, breadcrumb, "View Full Journey" link.
**Generative regions:** Welcome message (brownfield-specific), project detection summary (MetricTiles
composed from codebase scan — languages, frameworks, size, coverage), primary action (different play
and copy vs greenfield), onboarding explanation (references detected specifics like "67% test coverage").

### Transitions from Screen 2:
- `[Click "→ Onboard"]` → Triggers onboard play; stays on cockpit, ContentSlot streams analysis below
- `[Click "View Full Journey"]` → Screen 4 (Journey Map)
- `[Click MetricTile]` → Expands detail (inline, same page)

---

## Screen 3: Project Cockpit — Mid-Journey (Readiness: ~45)

*Product specified, some epics scoped, one epic in implementation. The cockpit is the richest.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ◈ MERIDIAN   TaskFlow                          ┌──────────────────┐   ◉ 45/100   ⚙ Settings            │
│                                                  │ 🔍 Search...     │   ▔▔▔▔▔▔▔                         │
│                                                  └──────────────────┘                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  🏠 Home                                                                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                          │
│  ┌─ Readiness ──────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                                                   │    │
│  │       ┌──────────────┐     Breakdown:                                                             │    │
│  │       │              │     ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  Product Vision    100%  ●                        │    │
│  │       │   45 / 100   │     ▓▓▓▓▓▓▓▓░░░░░░░░░░░░  Features          80%  ●                        │    │
│  │       │              │     ▓▓▓▓▓▓░░░░░░░░░░░░░░░  Roadmap           60%  ◐                        │    │
│  │       └──────────────┘     ▓▓▓▓░░░░░░░░░░░░░░░░░  Experience        40%  ◐                        │    │
│  │      ReadinessGauge        ▓▓░░░░░░░░░░░░░░░░░░░  Architecture      20%  ◐                        │    │
│  │       [static]             ░░░░░░░░░░░░░░░░░░░░░  Implementation     0%  ○                        │    │
│  │                                                                                                   │    │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                          │
│  ┊── 🤖 GENERATIVE: Project Health ─────────────────────────────────────────────────────────────────┊    │
│  ┊                                                                                                   ┊    │
│  ┊  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           ┊    │
│  ┊  │  6 Epics         │  │  12 Artifacts     │  │  3 Plays Run     │  │  1 Blocking      │           ┊    │
│  ┊  │  total scoped    │  │  total produced   │  │  this week       │  │  issue found     │           ┊    │
│  ┊  │                  │  │  ↑ 4 this week    │  │                  │  │  ⚠ quality gap   │           ┊    │
│  ┊  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘           ┊    │
│  ┊                                                                                                   ┊    │
│  ┊───────────────────────────────────────────────────────────────────────────────────────────────────┊    │
│                                                                                                          │
│  ┊── 🤖 GENERATIVE: Recommended Actions ────────────────────────────────────────────────────────────┊    │
│  ┊                                                                                                   ┊    │
│  ┊  ╔══════════════════════════════╗  ╔══════════════════════════════╗  ╔══════════════════════════╗  ┊    │
│  ┊  ║ 🏗️  Prepare E1: Auth        ║  ║ 📐 Design E3: Dashboards   ║  ║ 🔍 Review E2: Billing   ║  ┊    │
│  ┊  ║                              ║  ║                              ║  ║                          ║  ┊    │
│  ┊  ║ Architecture is locked.      ║  ║ Features specified but no   ║  ║ Scenarios need review    ║  ┊    │
│  ┊  ║ Ready to generate task       ║  ║ experience design yet.      ║  ║ before implementation    ║  ┊    │
│  ┊  ║ plan and scenarios.          ║  ║ Run design-exp next.        ║  ║ can begin.               ║  ┊    │
│  ┊  ║                              ║  ║                              ║  ║                          ║  ┊    │
│  ┊  ║  /prepare-epic     → Start   ║  ║  /design-exp       → Start  ║  ║  /validate-epic → Start  ║  ┊    │
│  ┊  ╚══════════════════════════════╝  ╚══════════════════════════════╝  ╚══════════════════════════╝  ┊    │
│  ┊                                                                                                   ┊    │
│  ┊───────────────────────────────────────────────────────────────────────────────────────────────────┊    │
│                                                                                                          │
│  ┌─ Epic Summary ───────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                                                   │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │    │
│  │  │ Specified   │  │ Designed    │  │ Architected │  │ Prepared    │  │ Implementing│             │    │
│  │  │     3       │  │     1       │  │     1       │  │     0       │  │     1       │             │    │
│  │  │ E3 E4 E5    │  │ E2          │  │ E1          │  │ —           │  │ E6          │             │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │    │
│  │       ↓ click any bucket to filter journey map                                                    │    │
│  │                                                                                                   │    │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                          │
│  ┊── 🤖 GENERATIVE: Recent Activity ────────────────────────────────────────────────────────────────┊    │
│  ┊                                                                                                   ┊    │
│  ┊  ┌──────────────────────────────────────────────────────────────────────────────────────────┐      ┊    │
│  ┊  │  14 min ago   /build-arch completed for E1: Authentication         ● LOCKED              │      ┊    │
│  ┊  │  2 hrs ago    /specify-product updated features.yaml for E3        ◐ DRAFT               │      ┊    │
│  ┊  │  yesterday    /implement-epic milestone 2/4 passed for E6          ◑ VALIDATED            │      ┊    │
│  ┊  │  2 days ago   /design-exp produced screen inventory for E2         ● LOCKED               │      ┊    │
│  ┊  └──────────────────────────────────────────────────────────────────────────────────────────┘      ┊    │
│  ┊                                                                                                   ┊    │
│  ┊───────────────────────────────────────────────────────────────────────────────────────────────────┊    │
│                                                                                                          │
│  ── Navigation ─────────────────────────────────────────────────────────────────────────────              │
│  ┌──────────────────┐                                                                                    │
│  │ View Full Journey │ →  (navigates to Screen 4)                                                        │
│  └──────────────────┘                                                                                    │
│                                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Static components:** Top bar, ReadinessGauge (with static breakdown structure), Epic Summary
buckets (static aggregation bins), breadcrumb, "View Full Journey" link.

**Generative regions:**
- **Project Health** — MetricTiles chosen by AI based on what matters for this project state.
  A project with quality issues shows a "Blocking issue" tile; a project with no issues might
  show "Avg epic velocity" instead. The AI selects 3-5 most relevant MetricTiles.
- **Recommended Actions** — Top 3 ActionCards ranked by impact on readiness score. The AI
  picks which epics need attention most and maps to the correct play. Different projects
  see different recommendations.
- **Recent Activity** — AI-curated feed of last N significant events, filtered for relevance
  (not every file save — only play completions, status changes, artifact locks).

### Transitions from Screen 3:
- `[Click ActionCard "→ Start"]` → Triggers play; ContentSlot appears below the card showing progress
- `[Click Epic bucket (e.g., "Specified: 3")]` → Screen 4 (Journey Map) filtered to that stage
- `[Click epic label in bucket (e.g., "E3")]` → Screen 5 (Epic View for E3)
- `[Click activity row]` → Screen 6 (Document View for that artifact)
- `[Click "View Full Journey"]` → Screen 4 (Journey Map)

---

## Screen 4: Journey Map

*Horizontal journey progression. Shows where every epic sits in the Meridian lifecycle.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ◈ MERIDIAN   TaskFlow                          ┌──────────────────┐   ◉ 45/100   ⚙ Settings            │
│                                                  │ 🔍 Search...     │   ▔▔▔▔▔▔▔                         │
│                                                  └──────────────────┘                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  🏠 Home  ›  Journey Map                                                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                          │
│  ┊── 🤖 GENERATIVE: Journey Stages (composed from installed plays) ─────────────────────────────────┊   │
│  ┊                                                                                                   ┊   │
│  ┊  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐                ┊   │
│  ┊  │ DISCOVER │     │ SPECIFY  │     │  DESIGN  │     │ARCHITECT │     │ PREPARE  │                ┊   │
│  ┊  │          │     │          │     │          │     │          │     │          │                ┊   │
│  ┊  │  ● Done  │ ━━▶ │  ◐ Active│ ━━▶ │  ◐ Active│ ━━▶ │  ◐ Active│ ━━▶ │  ○ Locked│                ┊   │
│  ┊  │          │     │          │     │          │     │          │     │          │                ┊   │
│  ┊  │ 1 artifact│    │ 3 artfcts│     │ 2 artfcts│     │ 5 artfcts│     │ 0 artfcts│                ┊   │
│  ┊  └──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘                ┊   │
│  ┊                                                                                                   ┊   │
│  ┊       ┌──────────┐     ┌──────────┐                                                               ┊   │
│  ┊       │IMPLEMENT │     │  LEARN   │                                                               ┊   │
│  ┊       │          │     │          │                                                               ┊   │
│  ┊       │  ◐ Active│ ━━▶ │  ○ Locked│                                                               ┊   │
│  ┊       │          │     │          │                                                               ┊   │
│  ┊       │ 1 artfct │     │ 0 artfcts│                                                               ┊   │
│  ┊       └──────────┘     └──────────┘                                                               ┊   │
│  ┊                                                                                                   ┊   │
│  ┊───────────────────────────────────────────────────────────────────────────────────────────────────┊   │
│                                                                                                          │
│  ── Stage Detail (expanded: SPECIFY) ────────────────────────────────────────────────────────────────    │
│                                                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │  SPECIFY  ◐ Active                                                                                │    │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────────     │    │
│  │  Plays available:  /specify-product  /configure-capabilities  /generate-intent-epics              │    │
│  │  Artifacts:        features.yaml (● LOCKED)  scope.yaml (● LOCKED)  quality-profile.yaml (◐)     │    │
│  │                                                                                                   │    │
│  │  ── Epics at this stage ──────────────────────────────────────────────────────────────────        │    │
│  │                                                                                                   │    │
│  │  ┌────────────────────────────────┐  ┌────────────────────────────────┐                            │    │
│  │  │  E3: Dashboard Analytics       │  │  E4: Notification Engine       │                            │    │
│  │  │  ◐ DRAFT   │  Features: 8     │  │  ◐ DRAFT   │  Features: 5     │                            │    │
│  │  │  Last: 2 hrs ago              │  │  Last: 1 day ago               │                            │    │
│  │  │  Next: /design-exp            │  │  Next: /design-exp             │                            │    │
│  │  │                       → View  │  │                        → View  │                            │    │
│  │  └────────────────────────────────┘  └────────────────────────────────┘                            │    │
│  │                                                                                                   │    │
│  │  ┌────────────────────────────────┐                                                               │    │
│  │  │  E5: Team Management           │                                                               │    │
│  │  │  ◐ DRAFT   │  Features: 6     │                                                               │    │
│  │  │  Last: 3 days ago             │                                                               │    │
│  │  │  Next: /design-exp            │                                                               │    │
│  │  │                       → View  │                                                               │    │
│  │  └────────────────────────────────┘                                                               │    │
│  │                                                                                                   │    │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                          │
│  ── Other Stages (collapsed) ────────────────────────────────────────────────────────────────────────    │
│                                                                                                          │
│  ┌──────────────────────────────────────────┐                                                            │
│  │  DISCOVER  ● Done     │  No epics here   │  (project-level, not epic-scoped)                          │
│  ├──────────────────────────────────────────┤                                                            │
│  │  DESIGN    ◐ Active   │  1 epic: E2      │  → click to expand                                        │
│  ├──────────────────────────────────────────┤                                                            │
│  │  ARCHITECT ◐ Active   │  1 epic: E1      │  → click to expand                                        │
│  ├──────────────────────────────────────────┤                                                            │
│  │  IMPLEMENT ◐ Active   │  1 epic: E6      │  → click to expand                                        │
│  ├──────────────────────────────────────────┤                                                            │
│  │  PREPARE   ○ Locked   │  No epics yet    │  (unlocks after architecture)                              │
│  ├──────────────────────────────────────────┤                                                            │
│  │  LEARN     ○ Locked   │  No epics yet    │  (unlocks after implementation)                            │
│  └──────────────────────────────────────────┘                                                            │
│                                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Static components:** Top bar, breadcrumb, stage detail expansion frame, collapsed stage list structure.

**Generative regions:**
- **Journey Stages** — The stages themselves are generatively composed from the plays installed in
  the system. If a project doesn't use `design-exp`, the DESIGN stage doesn't appear. The AI reads
  the play registry and constructs the journey progression dynamically.
- **Epic clustering** — Which EpicSummary cards appear under which stage is determined by artifact
  analysis. The AI maps each epic's current state to the appropriate stage.

### Transitions from Screen 4:
- `[Click Stage Box (e.g., SPECIFY)]` → Expands stage detail (stays on journey map, scroll to expanded)
- `[Click Epic Card "→ View" (e.g., E3)]` → Screen 5 (Epic View for E3)
- `[Click collapsed stage row]` → Expands that stage, collapses current
- `[Breadcrumb: 🏠 Home]` → Screen 3 (Cockpit)

---

## Screen 5: Artifact Detail — Epic View

*Drilled into E1: Authentication. Shows all artifacts, cross-references, and contextual actions.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ◈ MERIDIAN   TaskFlow                          ┌──────────────────┐   ◉ 45/100   ⚙ Settings            │
│                                                  │ 🔍 Search...     │   ▔▔▔▔▔▔▔                         │
│                                                  └──────────────────┘                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  🏠 Home  ›  Journey  ›  E1: Authentication                                                            │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                          │
│  ┌─ Epic Header ────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                                                   │    │
│  │  E1: Authentication & Authorization                                              ● LOCKED         │    │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────         │    │
│  │  Stage: Architect  │  Features: 12  │  Scenarios: 34  │  Readiness: 68%  │  Last: 14 min ago      │    │
│  │                                                                                                   │    │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                          │
│  ┊── 🤖 GENERATIVE: Contextual Actions ─────────────────────────────────────────────────────────────┊   │
│  ┊                                                                                                   ┊   │
│  ┊  ╔═══════════════════════════════════╗  ╔═══════════════════════════════════╗                      ┊   │
│  ┊  ║ 🏗️  Prepare for Implementation   ║  ║ 📊 Run Quality Check             ║                      ┊   │
│  ┊  ║                                   ║  ║                                   ║                      ┊   │
│  ┊  ║ Architecture is locked. Generate  ║  ║ Validate all artifacts for this   ║                      ┊   │
│  ┊  ║ task plan and scenarios.          ║  ║ epic against quality standards.   ║                      ┊   │
│  ┊  ║                                   ║  ║                                   ║                      ┊   │
│  ┊  ║  /prepare-epic           → Start  ║  ║  /quality-check          → Start  ║                      ┊   │
│  ┊  ╚═══════════════════════════════════╝  ╚═══════════════════════════════════╝                      ┊   │
│  ┊                                                                                                   ┊   │
│  ┊───────────────────────────────────────────────────────────────────────────────────────────────────┊   │
│                                                                                                          │
│  ── Artifact Grid ──────────────────────────────────────────────────────────────────────────────────     │
│                                                                                                          │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
│  │  📄 features.yaml            │  │  📄 scenarios.yaml            │  │  📄 plan.yaml                │    │
│  │  ● LOCKED                    │  │  ● LOCKED                    │  │  ○ MISSING                   │    │
│  │                              │  │                              │  │                              │    │
│  │  Features: 12               │  │  Scenarios: 34               │  │  Not yet generated           │    │
│  │  Invariants: 4              │  │  Feature gates: 12           │  │                              │    │
│  │  Updated: 2 days ago        │  │  Updated: 1 day ago          │  │  ╔════════════════════╗      │    │
│  │                              │  │                              │  │  ║ Generate → Start   ║      │    │
│  │                     → Open   │  │                     → Open   │  │  ╚════════════════════╝      │    │
│  └──────────────────────────────┘  └──────────────────────────────┘  └──────────────────────────────┘    │
│                                                                                                          │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
│  │  📄 logical-architecture.yaml│  │  📄 physical-architecture    │  │  📄 design-patterns.yaml     │    │
│  │  ● LOCKED                    │  │  ● LOCKED                    │  │  ● LOCKED                    │    │
│  │                              │  │                              │  │                              │    │
│  │  Components: 8              │  │  Stack picks: 14             │  │  Patterns: 9                 │    │
│  │  Bounded contexts: 3        │  │  Deploy targets: 2           │  │  Layers covered: 4           │    │
│  │  Updated: 14 min ago        │  │  Updated: 14 min ago         │  │  Updated: 14 min ago         │    │
│  │                              │  │                              │  │                              │    │
│  │                     → Open   │  │                     → Open   │  │                     → Open   │    │
│  └──────────────────────────────┘  └──────────────────────────────┘  └──────────────────────────────┘    │
│                                                                                                          │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐                                      │
│  │  📄 nfr-spec.yaml            │  │  📄 quality-vision.yaml      │                                      │
│  │  ● LOCKED                    │  │  ● LOCKED                    │                                      │
│  │                              │  │                              │                                      │
│  │  NFRs: 11                   │  │  Characteristics: 6          │                                      │
│  │  Verified: 9/11             │  │  Target level: Production    │                                      │
│  │  Updated: 14 min ago        │  │  Updated: 14 min ago         │                                      │
│  │                              │  │                              │                                      │
│  │                     → Open   │  │                     → Open   │                                      │
│  └──────────────────────────────┘  └──────────────────────────────┘                                      │
│                                                                                                          │
│  ┊── 🤖 GENERATIVE: Cross-Reference Summary ────────────────────────────────────────────────────────┊   │
│  ┊                                                                                                   ┊   │
│  ┊  IDs from this epic referenced elsewhere:                                                         ┊   │
│  ┊                                                                                                   ┊   │
│  ┊  [F1] Auth Login          → referenced in E3 (dashboard gating), E6 (API middleware)              ┊   │
│  ┊  [F4] Role-Based Access   → referenced in E2 (billing permissions), E4 (notification routing)     ┊   │
│  ┊  [SC-AUTH-001] JWT Token  → referenced in E1 physical-architecture, E6 nfr-spec                   ┊   │
│  ┊  [SG1] Reduce switching   → referenced in product.yaml, E2 features                              ┊   │
│  ┊                                                                                                   ┊   │
│  ┊  8 total cross-references across 4 other epics                                                    ┊   │
│  ┊                                                                                                   ┊   │
│  ┊───────────────────────────────────────────────────────────────────────────────────────────────────┊   │
│                                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Static components:** Top bar, breadcrumb, epic header (always shows name, status, key stats),
artifact grid structure (cards in a grid layout).

**Generative regions:**
- **Contextual Actions** — AI selects ActionCards based on what the epic needs next. An epic with
  locked architecture sees "Prepare for Implementation." An epic missing features would see
  "Specify Features" instead. The AI never shows irrelevant actions.
- **Cross-Reference Summary** — AI traces all CrossRefTokens from this epic's artifacts and shows
  where they're referenced. Different epics show different cross-ref patterns.

### Transitions from Screen 5:
- `[Click ArtifactCard "→ Open" (e.g., features.yaml)]` → Screen 6 (Document View for that artifact)
- `[Click ActionCard "→ Start"]` → Triggers play; ContentSlot appears below showing progress
- `[Click CrossRefToken (e.g., [F1])]` → Screen 6 (Document View) scrolled to that ID's definition
- `[Click "Generate → Start" on missing artifact]` → Triggers generating play; card updates on completion
- `[Breadcrumb: 🏠 Home]` → Screen 3 (Cockpit)
- `[Breadcrumb: Journey]` → Screen 4 (Journey Map)

---

## Screen 6: Artifact Detail — Document View (features.yaml for E1)

*The actual artifact rendered with rich interactive elements. Layout is generatively composed.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ◈ MERIDIAN   TaskFlow                          ┌──────────────────┐   ◉ 45/100   ⚙ Settings            │
│                                                  │ 🔍 Search...     │   ▔▔▔▔▔▔▔                         │
│                                                  └──────────────────┘                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  🏠 Home  ›  Journey  ›  E1: Auth  ›  features.yaml                                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                          │
│  ┌─ Document Header ────────────────────────────────────────────────────────────────────────────────┐    │
│  │  📄 features.yaml                                                            ● LOCKED            │    │
│  │  E1: Authentication & Authorization                                                               │    │
│  │  Last updated: 2 days ago  │  12 features  │  4 invariants  │  Author: /specify-product           │    │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                          │
│  ┌─ Features ──┬─ Invariants ──┬─ Scope ──┬─ Identity ──┬─ Comments (3) ────────────────────────────┐    │
│  │  ◆ active   │               │          │             │                                            │    │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                          │
│  ┊── 🤖 GENERATIVE: Document Layout (composed for features.yaml type) ──────────────────────────────┊   │
│  ┊                                                                                                   ┊   │
│  ┊  ── Feature List ─────────────────────────────────────────────────────────────  │ ── Margin ──    ┊   │
│  ┊                                                                                │                  ┊   │
│  ┊  [F1] Login Flow                                                    ● LOCKED   │  💬 3 comments  ┊   │
│  ┊  ──────────────────────────────────────────────────────────────────             │                  ┊   │
│  ┊  Intent: Allow users to authenticate via email/password or OAuth 2.0           │  📎 linked to   ┊   │
│  ┊  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │  [SC-AUTH-001]   ┊   │
│  ┊  ┃AnnotationHighlight: "OAuth 2.0" — reviewer note:               ┃│  [SC-AUTH-002]   ┊   │
│  ┊  ┃ "Consider PKCE flow for SPA. See [SC-AUTH-003]"                 ┃│                  ┊   │
│  ┊  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │                  ┊   │
│  ┊  Constraints:                                                                  │                  ┊   │
│  ┊    • Session timeout: 30 min idle, 24 hr absolute                              │                  ┊   │
│  ┊    • Max 5 failed attempts before lockout                                      │                  ┊   │
│  ┊    • MFA required for admin roles → links to [F4]                              │                  ┊   │
│  ┊  Success scenarios: 4   Failure scenarios: 3                                   │                  ┊   │
│  ┊                                                                                │                  ┊   │
│  ┊  [F2] Session Management                                           ● LOCKED   │                  ┊   │
│  ┊  ──────────────────────────────────────────────────────────────────             │                  ┊   │
│  ┊  Intent: Maintain user sessions with secure token refresh                      │  📎 linked to   ┊   │
│  ┊  Constraints:                                                                  │  [F1]            ┊   │
│  ┊    • Refresh tokens rotate on use                                              │                  ┊   │
│  ┊    • Concurrent session limit: 3 devices                                       │                  ┊   │
│  ┊  Success scenarios: 3   Failure scenarios: 2                                   │                  ┊   │
│  ┊                                                                                │                  ┊   │
│  ┊  [F3] Password Recovery                                            ● LOCKED   │                  ┊   │
│  ┊  ──────────────────────────────────────────────────────────────────             │                  ┊   │
│  ┊  Intent: Self-service password reset via email verification                    │                  ┊   │
│  ┊  Constraints:                                                                  │                  ┊   │
│  ┊    • Reset link expires in 15 minutes                                          │                  ┊   │
│  ┊    • Rate limit: 3 resets per hour per email                                   │                  ┊   │
│  ┊  Success scenarios: 2   Failure scenarios: 3                                   │                  ┊   │
│  ┊                                                                                │                  ┊   │
│  ┊  [F4] Role-Based Access Control                                    ● LOCKED   │  📎 linked to   ┊   │
│  ┊  ──────────────────────────────────────────────────────────────────             │  E2 [F-BILL-2]  ┊   │
│  ┊  Intent: Enforce permission boundaries based on user roles                     │  E4 [F-NOTIF-1] ┊   │
│  ┊  Constraints:                                                                  │                  ┊   │
│  ┊    • Roles: admin, manager, member, viewer                                     │                  ┊   │
│  ┊    • Permission inheritance: viewer ⊂ member ⊂ manager ⊂ admin                │                  ┊   │
│  ┊    • Role changes audit-logged                                                 │                  ┊   │
│  ┊  Success scenarios: 5   Failure scenarios: 4                                   │                  ┊   │
│  ┊                                                                                │                  ┊   │
│  ┊  ... (8 more features below, scrollable) ...                                   │                  ┊   │
│  ┊                                                                                │                  ┊   │
│  ┊───────────────────────────────────────────────────────────────────────────────────────────────────┊   │
│                                                                                                          │
│  ┊── 🤖 GENERATIVE: Contextual CTAs ────────────────────────────────────────────────────────────────┊   │
│  ┊                                                                                                   ┊   │
│  ┊  ╔═══════════════════════════════╗   ╔═══════════════════════════════╗                             ┊   │
│  ┊  ║ 📋 Generate Scenarios         ║   ║ 🔍 Validate Features         ║                             ┊   │
│  ┊  ║ /draft-verification-scenarios ║   ║ /validate-intent-epics       ║                             ┊   │
│  ┊  ║                      → Start  ║   ║                      → Start  ║                             ┊   │
│  ┊  ╚═══════════════════════════════╝   ╚═══════════════════════════════╝                             ┊   │
│  ┊                                                                                                   ┊   │
│  ┊  ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐   ┊   │
│  ┊  ┊  ContentSlot: Play output appears here when a CTA is triggered                            ┊   ┊   │
│  ┊  ┊  (initially hidden, expands when play runs)                                               ┊   ┊   │
│  ┊  └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┘   ┊   │
│  ┊                                                                                                   ┊   │
│  ┊───────────────────────────────────────────────────────────────────────────────────────────────────┊   │
│                                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Static components:** Top bar, breadcrumb, document header, tab navigation structure.

**Generative regions:**
- **Document Layout** — The way features are rendered (which fields shown, how much detail, margin
  annotations) is AI-composed based on data density. A features.yaml with 3 features shows full
  detail inline. One with 60 features shows a summary table with expandable rows. The AI picks
  the rendering strategy.
- **Margin annotations** — CrossRefTokens, linked items, and comment counts in the margin gutter
  are generatively placed based on which features have external references.
- **AnnotationHighlight** — Reviewer notes and highlights are positioned inline by the AI based
  on where they're most relevant.
- **Contextual CTAs** — Actions available for this specific artifact type and state. A LOCKED
  features.yaml shows "Generate Scenarios." A DRAFT one would show "Validate" instead.
- **ContentSlot** — Dashed region that expands when a play is triggered from a CTA.

### Transitions from Screen 6:
- `[Click CrossRefToken (e.g., [SC-AUTH-001])]` → Screen 6 for scenarios.yaml scrolled to that ID
- `[Click margin link (e.g., "E2 [F-BILL-2]")]` → Screen 6 for E2's features.yaml at that feature
- `[Click CTA "→ Start"]` → Triggers play; ContentSlot expands with streaming output
- `[Click tab (e.g., "Invariants")]` → Same page, switches to invariants section
- `[Breadcrumb: E1: Auth]` → Screen 5 (Epic View for E1)
- `[Breadcrumb: Journey]` → Screen 4 (Journey Map)
- `[Breadcrumb: 🏠 Home]` → Screen 3 (Cockpit)

---

## Screen 7: Artifact Detail — Document View with Active Wiki Tag

*Same document view but showing WikiTag lifecycle: pending → running → complete.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ◈ MERIDIAN   TaskFlow                          ┌──────────────────┐   ◉ 45/100   ⚙ Settings            │
│                                                  │ 🔍 Search...     │   ▔▔▔▔▔▔▔                         │
│                                                  └──────────────────┘                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  🏠 Home  ›  Journey  ›  E1: Auth  ›  physical-architecture.yaml                                       │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                          │
│  ┌─ Document Header ────────────────────────────────────────────────────────────────────────────────┐    │
│  │  📄 physical-architecture.yaml                                               ● LOCKED            │    │
│  │  E1: Authentication & Authorization                                                               │    │
│  │  Last updated: 14 min ago  │  14 stack picks  │  2 deploy targets  │  Author: /build-arch         │    │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                          │
│  ┌─ Stack ──┬─ Deployment ──┬─ Data Stores ──┬─ Decisions ──┬─ Comments (1) ────────────────────────┐    │
│  │  ◆ active│               │                │              │                                        │    │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                          │
│  ┊── 🤖 GENERATIVE: Document Layout ────────────────────────────────────────────────────────────────┊   │
│  ┊                                                                                                   ┊   │
│  ┊  ── Technology Stack ──────────────────────────────────────────────────  │ ── Margin ──           ┊   │
│  ┊                                                                         │                         ┊   │
│  ┊  Runtime: Node.js 22 LTS                                               │                         ┊   │
│  ┊  Framework: Express.js 5                                                │                         ┊   │
│  ┊  Auth Library: Passport.js + @auth/core                                 │                         ┊   │
│  ┊                                                                         │                         ┊   │
│  ┊  ── Completed WikiTag ─────────────────────────────────────────────     │                         ┊   │
│  ┊                                                                         │                         ┊   │
│  ┊  ┌──────────────────────────────────────────────────────────────────┐   │                         ┊   │
│  ┊  │  [[research:Compare Passport.js vs Auth.js for OAuth 2.0]]      │   │                         ┊   │
│  ┊  │  ✅ COMPLETE                                          ▼ Expand  │   │  ◀ WikiTag              ┊   │
│  ┊  └──────────────────────────────────────────────────────────────────┘   │    [complete]           ┊   │
│  ┊  ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐   │                         ┊   │
│  ┊  ╎  ContentSlot (collapsed — click ▼ Expand to show)               ╎   │                         ┊   │
│  ┊  ╎  Summary: Passport.js recommended for Express compat. Auth.js   ╎   │                         ┊   │
│  ┊  ╎  better for Next.js. Decision: Passport.js (Express stack).     ╎   │                         ┊   │
│  ┊  └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘   │                         ┊   │
│  ┊                                                                         │                         ┊   │
│  ┊  Token Strategy: JWT with RSA-256 signing                               │                         ┊   │
│  ┊  Session Store: Redis 7 (see [SC-AUTH-001])                             │  📎 [SC-AUTH-001]      ┊   │
│  ┊                                                                         │                         ┊   │
│  ┊  ── Active WikiTag (RUNNING) ──────────────────────────────────────     │                         ┊   │
│  ┊                                                                         │                         ┊   │
│  ┊  ┌──────────────────────────────────────────────────────────────────┐   │                         ┊   │
│  ┊  │  [[research:Compare React 19 vs Svelte 5 for dashboard apps]]   │   │                         ┊   │
│  ┊  │  🔄 RUNNING                                          ◷ 12s...   │   │  ◀ WikiTag              ┊   │
│  ┊  └──────────────────────────────────────────────────────────────────┘   │    [running]            ┊   │
│  ┊  ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐   │                         ┊   │
│  ┊  ╎  ContentSlot (streaming — live output from play)                ╎   │                         ┊   │
│  ┊  ╎                                                                 ╎   │                         ┊   │
│  ┊  ╎  Researching React 19 features...                               ╎   │                         ┊   │
│  ┊  ╎  ▸ Server Components — built-in, reduces client bundle          ╎   │                         ┊   │
│  ┊  ╎  ▸ Actions — form handling without client JS                    ╎   │                         ┊   │
│  ┊  ╎                                                                 ╎   │                         ┊   │
│  ┊  ╎  Researching Svelte 5 features...                               ╎   │                         ┊   │
│  ┊  ╎  ▸ Runes — fine-grained reactivity, smaller bundles             ╎   │                         ┊   │
│  ┊  ╎  ▸ ████████████░░░░░░░░  streaming...                          ╎   │                         ┊   │
│  ┊  ╎                                                                 ╎   │                         ┊   │
│  ┊  └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘   │                         ┊   │
│  ┊                                                                         │                         ┊   │
│  ┊  ── CTA with Content Slot ─────────────────────────────────────────     │                         ┊   │
│  ┊                                                                         │                         ┊   │
│  ┊  ╔═══════════════════════════════════════════════════════════════╗       │                         ┊   │
│  ┊  ║  🔬 Run RCA: Analyze auth failure cascade                    ║       │  ◀ CTAButton           ┊   │
│  ┊  ║  Trace how auth token expiry propagates through microservices ║       │                         ┊   │
│  ┊  ║                                                     → Start   ║       │                         ┊   │
│  ┊  ╚═══════════════════════════════════════════════════════════════╝       │                         ┊   │
│  ┊  ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐   │                         ┊   │
│  ┊  ┊  ContentSlot: RCA output appears here when triggered           ┊   │                         ┊   │
│  ┊  ┊  (hidden until "→ Start" is clicked)                           ┊   │                         ┊   │
│  ┊  └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┘   │                         ┊   │
│  ┊                                                                         │                         ┊   │
│  ┊───────────────────────────────────────────────────────────────────────────────────────────────────┊   │
│                                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Static components:** Top bar, breadcrumb, document header, tab navigation.

**Generative regions (everything below tabs is generative):**
- **Document Layout** — Same as Screen 6, AI-composed based on artifact type.
- **Completed WikiTag** — Shows `✅ COMPLETE` state with collapsed ContentSlot containing the
  research summary. User can expand to see full results.
- **Running WikiTag** — Shows `🔄 RUNNING` state with a live-streaming ContentSlot. The progress
  bar and streaming text update in real-time as the play executes.
- **CTA Button** — "Run RCA" is a contextually placed action. The AI decides where in the document
  flow it makes sense to offer RCA (near auth cascade discussion). Below it, a hidden ContentSlot
  will expand when triggered.

### WikiTag Lifecycle Visualized:

```
  ┌─ PENDING ─────────────────────────────────────────────────────┐
  │  [[research:Compare X vs Y]]                                   │
  │  ⏳ PENDING                                          → Run     │
  └────────────────────────────────────────────────────────────────┘
                              │
                              │  (user clicks → Run)
                              ▼
  ┌─ RUNNING ─────────────────────────────────────────────────────┐
  │  [[research:Compare X vs Y]]                                   │
  │  🔄 RUNNING                                          ◷ 12s... │
  ├────────────────────────────────────────────────────────────────┤
  │  ContentSlot: streaming output...                              │
  │  ▸ Finding 1...                                                │
  │  ▸ Finding 2...                                                │
  │  ████████████░░░░░░░░                                          │
  └────────────────────────────────────────────────────────────────┘
                              │
                              │  (play completes)
                              ▼
  ┌─ COMPLETE ────────────────────────────────────────────────────┐
  │  [[research:Compare X vs Y]]                                   │
  │  ✅ COMPLETE                                        ▼ Expand  │
  ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
  ╎  ContentSlot (collapsed): Summary of findings...               ╎
  └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
```

### Transitions from Screen 7:
- `[Click "▼ Expand" on completed WikiTag]` → Expands ContentSlot with full research results (same page)
- `[Click "→ Run" on pending WikiTag]` → Transitions tag to RUNNING state, ContentSlot streams
- `[Click "→ Start" on CTA]` → Triggers play, ContentSlot expands with streaming output
- `[Click CrossRefToken (e.g., [SC-AUTH-001])]` → Screen 6 for scenarios.yaml at that ID
- `[Breadcrumb: E1: Auth]` → Screen 5 (Epic View)
- `[Breadcrumb: Journey]` → Screen 4 (Journey Map)
- `[Breadcrumb: 🏠 Home]` → Screen 3 (Cockpit)

---

## Complete Transition Map

```
                    ┌─────────────────────────────────────────────────────────────────┐
                    │                                                                 │
                    │   SCREEN 1/2/3: PROJECT COCKPIT                                │
                    │   (Greenfield / Brownfield / Mid-Journey)                       │
                    │                                                                 │
                    │   Entry point. Readiness score + generative content.            │
                    │                                                                 │
                    └───────┬──────────────────┬──────────────────┬───────────────────┘
                            │                  │                  │
                  [View Journey]        [Click Epic          [Click Action
                            │           in Summary]           Card → Start]
                            │                  │                  │
                            ▼                  │          Triggers play;
                    ┌───────────────┐          │          stays on cockpit,
                    │               │          │          ContentSlot shows
                    │  SCREEN 4:    │          │          progress inline
                    │  JOURNEY MAP  │          │
                    │               │          │
                    │  Stages +     │          │
                    │  epic clusters│          │
                    │               │          │
                    └───┬───────────┘          │
                        │                      │
              [Click Epic              ┌───────┘
               in Stage]               │
                        │              │
                        ▼              ▼
                    ┌─────────────────────────┐
                    │                         │
                    │  SCREEN 5:              │
                    │  ARTIFACT DETAIL        │
                    │  (EPIC VIEW)            │
                    │                         │
                    │  Artifact grid +        │
                    │  cross-refs + CTAs      │
                    │                         │
                    └───────┬─────────────────┘
                            │
                  [Click Artifact
                   Card → Open]
                            │
                            ▼
                    ┌─────────────────────────┐
                    │                         │
                    │  SCREEN 6/7:            │
                    │  ARTIFACT DETAIL        │
                    │  (DOCUMENT VIEW)        │
                    │                         │          [Click CrossRefToken]
                    │  Rich rendered content  │ ─────────────────────────────┐
                    │  + WikiTags + CTAs      │                              │
                    │  + ContentSlots         │ ◀────────────────────────────┘
                    │                         │    (navigates to different
                    └─────────────────────────┘     document, same screen type)


    ── Breadcrumb Navigation (always available, all screens) ──

    🏠 Home  ›  Journey  ›  E1: Auth  ›  features.yaml
       │           │           │
       │           │           └──→ Screen 5 (Epic View)
       │           └──────────────→ Screen 4 (Journey Map)
       └──────────────────────────→ Screen 1/2/3 (Cockpit)
```

---

## Component Library Usage Summary

| Component            | Screen 1 | Screen 2 | Screen 3 | Screen 4 | Screen 5 | Screen 6 | Screen 7 |
|----------------------|----------|----------|----------|----------|----------|----------|----------|
| ReadinessGauge       |    ✓     |    ✓     |    ✓*    |          |          |          |          |
| ActionCard           |    ✓     |    ✓     |    ✓     |          |    ✓     |    ✓     |          |
| ArtifactCard         |          |          |          |          |    ✓     |          |          |
| JourneyStage         |          |          |          |    ✓     |          |          |          |
| CrossRefToken        |          |          |          |          |    ✓     |    ✓     |    ✓     |
| StatusBadge          |          |          |    ✓     |    ✓     |    ✓     |    ✓     |    ✓     |
| MetricTile           |          |    ✓     |    ✓     |          |          |          |          |
| EpicSummary          |          |          |    ✓     |    ✓     |          |          |          |
| WikiTag              |          |          |          |          |          |          |    ✓     |
| CTAButton            |    ✓     |    ✓     |    ✓     |          |    ✓     |    ✓     |    ✓     |
| AnnotationHighlight  |          |          |          |          |          |    ✓     |          |
| ContentSlot          |          |          |          |          |          |    ✓     |    ✓     |
| SearchBar            |    ✓     |    ✓     |    ✓     |    ✓     |    ✓     |    ✓     |    ✓     |
| Breadcrumb           |    ✓     |    ✓     |    ✓     |    ✓     |    ✓     |    ✓     |    ✓     |

`*` Screen 3 uses ReadinessGauge with breakdown (expanded variant)

---

## Generative vs Static Boundary Rules

### Always Static (deterministic, same for every project):
1. Top bar shell (logo, project name slot, search bar, settings, readiness mini-gauge)
2. Breadcrumb bar structure
3. ReadinessGauge visualization (the gauge itself; breakdown categories come from data)
4. Tab navigation structure on document views
5. Artifact grid layout on epic views
6. Journey stage connector lines

### Always Generative (AI-composed from context):
1. Welcome/onboarding message text (adapts to greenfield vs brownfield vs mid-journey)
2. Project detection summary (MetricTiles selected based on scan results)
3. Recommended actions (ActionCards ranked by readiness impact)
4. Project health metrics (MetricTiles selected based on project state)
5. Recent activity feed (filtered for significance)
6. Journey stage names and groupings (composed from installed plays)
7. Document layout within artifact views (rendering strategy based on data density)
8. Margin annotations (CrossRefTokens and links based on dependency graph)
9. Contextual CTAs on document views (based on artifact type and state)
10. WikiTag content slots (streaming output from play execution)

### Conditionally Generative (static structure, generative content):
1. Epic Summary buckets on cockpit (static bins, generative assignment of epics to bins)
2. Stage detail on journey map (static expansion frame, generative epic clustering)
3. Cross-reference summary on epic view (static section, generative tracing of IDs)
