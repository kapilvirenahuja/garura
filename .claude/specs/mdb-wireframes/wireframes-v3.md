# MDB v3 — Meridian Artifact Browser: Aircraft Cockpit Wireframes

> Three instruments in one cockpit. The user is a pilot flying a software project.
> No sidebar. No artifact grid. No journey map. No graph visualization.

---

## Design Principles

| Principle                   | Description                                                                     |
|-----------------------------|---------------------------------------------------------------------------------|
| Three Instruments           | Checklists · Flight Deck · Playbook Reader. That's it.                          |
| Cockpit Metaphor            | Readiness score = altimeter. Checklists = pre-flight. Flight Deck = radar.      |
| Reading Context Preservation| Never lose your place. Expansions are additive, not navigational.               |
| Generative Composition      | The AI reads YAML and composes narratives. You never see raw artifacts.         |
| Progressive Disclosure      | Click a cross-ref → it expands inline below. No page navigation.               |
| Minimal for Greenfield      | Readiness 0 = one checklist, one action. Not a skeleton of empty instruments.   |

---

## Visual Legend

```
┌─────────────────────┐     Solid border   = Static shell (always present, deterministic)
│  Static Component   │
└─────────────────────┘

┊─────────────────────┊     Dashed border  = 🤖 Generative region (AI-composed from context)
┊ 🤖 Generative       ┊
┊─────────────────────┊

╔═════════════════════╗     Double border  = CTA / Action button (maps to a Meridian play)
║  Action Button      ║
╚═════════════════════╝

[F1] [SC-AUTH-001]          Bracketed IDs  = Clickable CrossRefTokens (expand inline)

[[research:...]]            Wiki tags      = Inline action triggers (execute plays)

● Done  ◐ In Progress  ○ Pending  ◌ Locked     Checklist item states

▰▰▰▰▱▱▱▱▱▱  45/100         Readiness bar
```

---

## Persistent Top Bar (All Screens)

The top bar is the cockpit frame. The instrument switcher is the primary navigation.
The readiness mini-gauge is always visible — clicking it always returns to Checklists.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                              │
│  ◈ MDB  TaskFlow                                                                   ▰▰▰▰▱▱▱▱▱▱ 45          │
│                                                                                     ▔▔▔▔▔▔▔▔▔▔▔▔           │
│  ┌──────────────────┬──────────────────┬──────────────────┐    ┌──────────────────────────────────┐          │
│  │   ☑ Checklists   │  ✈ Flight Deck   │  📖 Playbook     │    │  🔍 Search artifacts...          │          │
│  └──────────────────┴──────────────────┴──────────────────┘    └──────────────────────────────────┘          │
│                                                                                                              │
│  🏠 Home › Checklists                                                                                       │
│                                                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
```

**Static elements:** Logo, project name, instrument switcher tabs, search bar, breadcrumb.
**Reactive element:** Readiness mini-gauge (always visible, clickable → Checklists).
**Active instrument** is highlighted in the tab bar with a bottom border/accent.

---

## Screen 1: Checklists — Greenfield (Readiness: 0)

*Just installed Meridian. Nothing exists. One checklist. One action. Inviting, not overwhelming.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                              │
│  ◈ MDB  TaskFlow                                                                   ▰▱▱▱▱▱▱▱▱▱  0           │
│                                                                                     ▔▔▔▔▔▔▔▔▔▔▔▔           │
│  ┌━━━━━━━━━━━━━━━━━━┬──────────────────┬──────────────────┐    ┌──────────────────────────────────┐          │
│  │   ☑ Checklists   │  ✈ Flight Deck   │  📖 Playbook     │    │  🔍 Search artifacts...          │          │
│  └━━━━━━━━━━━━━━━━━━┴──────────────────┴──────────────────┘    └──────────────────────────────────┘          │
│                                                                                                              │
│  🏠 Home › Checklists                                                                                       │
│                                                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                              │
│                                                                                                              │
│                              ┌──────────────────────────────────────────┐                                    │
│                              │                                          │                                    │
│                              │               ╭──────────╮               │                                    │
│                              │              │           │               │                                    │
│                              │              │     0     │               │                                    │
│                              │              │   ─────   │               │                                    │
│                              │              │    100    │               │                                    │
│                              │              │           │               │                                    │
│                              │               ╰──────────╯               │                                    │
│                              │                                          │                                    │
│                              │       Your project isn't flying yet.     │                                    │
│                              │       Complete the checklist below        │                                    │
│                              │       to get airborne.                    │                                    │
│                              │                                          │                                    │
│                              └──────────────────────────────────────────┘                                    │
│                                                                                                              │
│                                                                                                              │
│         ┌────────────────────────────────────────────────────────────────────────────────────┐                │
│         │                                                                                    │                │
│         │  ☑ GETTING STARTED: ONBOARD YOUR PROJECT                              0 / 5 done  │                │
│         │  ─────────────────────────────────────────────────────────────────────────────────  │                │
│         │                                                                                    │                │
│         │  ╔══════════════════════════════════════════════════════════════════════════════╗   │                │
│         │  ║  1.  📝 Provide your project brief                           → specify-product ║   │                │
│         │  ║      Describe what you're building — market, users, goals.                  ║   │                │
│         │  ║      This is your departure clearance.                                      ║   │                │
│         │  ╚══════════════════════════════════════════════════════════════════════════════╝   │                │
│         │                                                                                    │                │
│         │     ◌  2.  Review market analysis                                                  │                │
│         │         AI analyzes competitors, TAM/SAM, and positioning.                         │                │
│         │         ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈                                │                │
│         │                                                                                    │                │
│         │     ◌  3.  Lock product spec                                                       │                │
│         │         Review and approve the generated product definition.                       │                │
│         │         ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈                                │                │
│         │                                                                                    │                │
│         │     ◌  4.  Define features & scope                                                 │                │
│         │         Structure capabilities, scenarios, and quality constraints.                │                │
│         │         ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈                                │                │
│         │                                                                                    │                │
│         │     ◌  5.  Plan roadmap                                                            │                │
│         │         Sequence epics into a time-phased delivery plan.                           │                │
│         │         ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈                                │                │
│         │                                                                                    │                │
│         └────────────────────────────────────────────────────────────────────────────────────┘                │
│                                                                                                              │
│                                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Transitions — Screen 1

| Action                          | Destination                                        |
|---------------------------------|----------------------------------------------------|
| Click item 1 CTA                | Executes `specify-product` play; progress streams into a ContentSlot below the item |
| Click readiness gauge            | Already on Checklists — no-op / scroll to top      |
| Switch to Flight Deck tab        | Flight Deck (empty state — "No epics in flight")   |
| Switch to Playbook tab           | Playbook Reader (empty state — "Nothing to read yet") |

### Design Notes

- Items 2–5 are **locked** (◌) — visually muted, not clickable. They unlock sequentially as prior steps complete.
- Only ONE checklist is shown. No empty checklists, no skeleton sections. Greenfield = maximum focus.
- The readiness gauge is large and central — it's the hero element. Score of 0 is not alarming, it's a starting point.
- The checklist title uses aviation language ("departure clearance") to reinforce the cockpit metaphor subtly.

---

## Screen 2: Checklists — Mid-Project (Readiness: 45)

*Multiple checklists active. Some progress made. The pilot has multiple procedures to follow.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                              │
│  ◈ MDB  TaskFlow                                                                   ▰▰▰▰▱▱▱▱▱▱ 45          │
│                                                                                     ▔▔▔▔▔▔▔▔▔▔▔▔           │
│  ┌━━━━━━━━━━━━━━━━━━┬──────────────────┬──────────────────┐    ┌──────────────────────────────────┐          │
│  │   ☑ Checklists   │  ✈ Flight Deck   │  📖 Playbook     │    │  🔍 Search artifacts...          │          │
│  └━━━━━━━━━━━━━━━━━━┴──────────────────┴──────────────────┘    └──────────────────────────────────┘          │
│                                                                                                              │
│  🏠 Home › Checklists                                                                                       │
│                                                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐      │
│   │                                                                                                   │      │
│   │    ╭──────────╮                                                                                   │      │
│   │   │           │     READINESS  45 / 100                                                          │      │
│   │   │    45     │     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                 │      │
│   │   │   ─────   │     ▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱                                                       │      │
│   │   │    100    │                                                                                   │      │
│   │   │           │     Product: ●  Features: ●  Roadmap: ●  Architecture: ○  Epics: ◐              │      │
│   │    ╰──────────╯     ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔                │      │
│   │                     Locked    Locked   Locked    Missing    In progress                           │      │
│   │                                                                                                   │      │
│   └───────────────────────────────────────────────────────────────────────────────────────────────────┘      │
│                                                                                                              │
│                                                                                                              │
│  ┊─────────────────────────────────────────────────────────────────────────────────────────────────────┊     │
│  ┊ 🤖 Generative Region: Checklist Selection                                                          ┊     │
│  ┊ Three checklists are relevant to your project right now. Ordered by impact on readiness.            ┊     │
│  ┊─────────────────────────────────────────────────────────────────────────────────────────────────────┊     │
│                                                                                                              │
│                                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐         │
│   │                                                                                                │         │
│   │  ☑ PREPARE E1: AUTHENTICATION FOR IMPLEMENTATION                               3 / 5 done ◐  │         │
│   │  ──────────────────────────────────────────────────────────────────────────────────────────── │         │
│   │                                                                                                │         │
│   │     ● 1.  Lock features for E1                                          ✓ completed            │         │
│   │     ● 2.  Design experience (screens, flows)                            ✓ completed            │         │
│   │     ● 3.  Build architecture package                                    ✓ completed            │         │
│   │                                                                                                │         │
│   │     ╔════════════════════════════════════════════════════════════════════════════════╗          │         │
│   │     ║  4.  🔧 Prepare epic — generate LLD, scenarios, task plan       → prepare-epic ║          │         │
│   │     ║      Produces tech.yaml, scenarios.yaml, and plan.yaml for E1.               ║          │         │
│   │     ╚════════════════════════════════════════════════════════════════════════════════╝          │         │
│   │                                                                                                │         │
│   │     ◌ 5.  Begin implementation                                          locked                 │         │
│   │                                                                                                │         │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘         │
│                                                                                                              │
│                                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐         │
│   │                                                                                                │         │
│   │  ☑ ADDRESS QUALITY GAP IN E2: PAYMENTS                                         0 / 3 done ○  │         │
│   │  ──────────────────────────────────────────────────────────────────────────────────────────── │         │
│   │                                                                                                │         │
│   │     ╔════════════════════════════════════════════════════════════════════════════════╗          │         │
│   │     ║  1.  🔍 Run quality check on E2                              → quality-check   ║          │         │
│   │     ║      Identify gaps in scenario coverage, architecture drift, tech debt.       ║          │         │
│   │     ╚════════════════════════════════════════════════════════════════════════════════╝          │         │
│   │                                                                                                │         │
│   │     ◌ 2.  Review quality report and address findings                                           │         │
│   │     ◌ 3.  Re-validate and confirm resolution                                                   │         │
│   │                                                                                                │         │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘         │
│                                                                                                              │
│                                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐         │
│   │                                                                                                │         │
│   │  ☑ ONBOARD NEW EPIC E7: NOTIFICATIONS                                         1 / 4 done ◐  │         │
│   │  ──────────────────────────────────────────────────────────────────────────────────────────── │         │
│   │     ▸ Click to expand                                                                          │         │
│   │                                                                                                │         │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘         │
│                                                                                                              │
│                                                                                                              │
│   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐         │
│     COMPLETED                                                                                                │
│   │                                                                                               │         │
│     ✓ Getting Started: Onboard Your Project  ·  ✓ Define Features & Scope  ·  ✓ Plan Roadmap                │
│   │                                                                                               │         │
│   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘         │
│                                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Transitions — Screen 2

| Action                                   | Destination                                                      |
|------------------------------------------|------------------------------------------------------------------|
| Click item 4 CTA in E1 checklist         | Executes `prepare-epic`; progress streams into ContentSlot below the item |
| Click item 1 CTA in E2 checklist         | Executes `quality-check`; progress streams into ContentSlot      |
| Click "E1: Authentication" text           | Playbook Reader → Epic Overview for E1 (Screen 4)               |
| Click "E7: Notifications" expand          | Expands checklist inline to show all 4 steps                     |
| Click a completed checklist               | Expands to show completed steps (read-only, historical)          |
| Switch to Flight Deck tab                 | Flight Deck — Active Operations (Screen 3)                       |
| Click readiness gauge                     | Scroll to top / already on Checklists                            |

### Design Notes

- Checklists are **generatively selected** — the 🤖 region above the checklists explains why these three are relevant now.
- The readiness breakdown shows artifact-level status at a glance: what's locked, missing, in progress.
- Third checklist (E7) is **collapsed** — showing that checklists can be expanded/collapsed to manage density.
- Completed checklists are **collapsed at the bottom** in a muted row — they don't clutter the active view.
- Each checklist has exactly ONE actionable CTA (the next step). Steps beyond it are locked.

---

## Screen 3: Flight Deck — Active Operations

*The orchestrator's live view. What's in motion, who's working, what needs attention.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                              │
│  ◈ MDB  TaskFlow                                                                   ▰▰▰▰▱▱▱▱▱▱ 45          │
│                                                                                     ▔▔▔▔▔▔▔▔▔▔▔▔           │
│  ┌──────────────────┬━━━━━━━━━━━━━━━━━━┬──────────────────┐    ┌──────────────────────────────────┐          │
│  │   ☑ Checklists   │  ✈ Flight Deck   │  📖 Playbook     │    │  🔍 Search artifacts...          │          │
│  └──────────────────┴━━━━━━━━━━━━━━━━━━┴──────────────────┘    └──────────────────────────────────┘          │
│                                                                                                              │
│  🏠 Home › Flight Deck                                                                                      │
│                                                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                              │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                    │
│   │  EPICS IN FLIGHT  │  │  ACTIVE DEVS     │  │  PLAYS TODAY     │  │  OPEN ISSUES     │                    │
│   │       3           │  │       2           │  │       7          │  │       4           │                    │
│   └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘                    │
│                                                                                                              │
│                                                                                                              │
│  ── NEEDS ATTENTION ─────────────────────────────────────────────────────────────────────────────────        │
│                                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐         │
│   │                                                                                                │         │
│   │  🔴  E2: PAYMENTS                                                                              │         │
│   │  ──────────────────────────────────────────────────────────────────────────────────────────── │         │
│   │                                                                                                │         │
│   │  Developer     kapil           (branch: feat/e2-payments)                                      │         │
│   │  Stage         Implementation  (tech.yaml ● · scenarios.yaml ● · plan.yaml ● · code ◐)       │         │
│   │  Last Activity 2h ago          commit: "fix payment gateway timeout handling"                  │         │
│   │  Issues        2 open          #142 flaky test, #145 timeout regression                        │         │
│   │                                                                                                │         │
│   │  ┊────────────────────────────────────────────────────────────────────────────────────────┊    │         │
│   │  ┊ 🤖 Quality check failed 2h ago — 3 scenarios regressed. Payment webhook handler       ┊    │         │
│   │  ┊    has uncovered edge case in idempotency logic.                                       ┊    │         │
│   │  ┊────────────────────────────────────────────────────────────────────────────────────────┊    │         │
│   │                                                                                                │         │
│   │  ╔═══════════════════╗  ╔═══════════════════╗  ╔═══════════════════╗                           │         │
│   │  ║  📖 Open in Reader ║  ║  🔍 Run QA Check  ║  ║  🐛 View Issues   ║                           │         │
│   │  ╚═══════════════════╝  ╚═══════════════════╝  ╚═══════════════════╝                           │         │
│   │                                                                                                │         │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘         │
│                                                                                                              │
│                                                                                                              │
│  ── ON TRACK ────────────────────────────────────────────────────────────────────────────────────────        │
│                                                                                                              │
│   ┌──────────────────────────────────────────┐  ┌──────────────────────────────────────────┐                 │
│   │                                          │  │                                          │                 │
│   │  🟢  E1: AUTHENTICATION                  │  │  🟡  E5: SEARCH                          │                 │
│   │  ────────────────────────────────────── │  │  ────────────────────────────────────── │                 │
│   │                                          │  │                                          │                 │
│   │  Developer     arjun                     │  │  Developer     priya                     │                 │
│   │               (feat/e1-auth)             │  │               (feat/e5-search)           │                 │
│   │  Stage         Implementation            │  │  Stage         Preparing                  │                 │
│   │               (code ◐ — 60%)             │  │               (tech.yaml drafting)        │                 │
│   │  Last Activity 15m ago                   │  │  Last Activity 1h ago                     │                 │
│   │                                          │  │                                          │                 │
│   │  ╔═══════════════════╗                   │  │  ╔═══════════════════╗                   │                 │
│   │  ║  📖 Open in Reader ║                   │  │  ║  📖 Open in Reader ║                   │                 │
│   │  ╚═══════════════════╝                   │  │  ╚═══════════════════╝                   │                 │
│   │                                          │  │                                          │                 │
│   └──────────────────────────────────────────┘  └──────────────────────────────────────────┘                 │
│                                                                                                              │
│                                                                                                              │
│  ── RECENT PLAY ACTIVITY ────────────────────────────────────────────────────────────────────────────        │
│                                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐         │
│   │  Time       Play                   Epic              Status    Duration                        │         │
│   │  ─────────  ──────────────────── ────────────────  ────────  ──────────                       │         │
│   │  14:23      quality-check          E2: Payments      ✗ FAIL    2m 34s                          │         │
│   │  14:01      implement-epic         E1: Auth           ● DONE    12m 07s                         │         │
│   │  13:45      prepare-epic           E5: Search         ● DONE    4m 12s                          │         │
│   │  12:30      validate-epic          E1: Auth           ● PASS    1m 58s                          │         │
│   │  11:15      check-drift            E2: Payments       ⚠ WARN   3m 22s                          │         │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘         │
│                                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Transitions — Screen 3

| Action                                   | Destination                                                      |
|------------------------------------------|------------------------------------------------------------------|
| Click "Open in Reader" on any epic        | Playbook Reader → Epic Overview (Screen 4)                       |
| Click "Run QA Check" on E2                | Executes `quality-check` play; stays on Flight Deck, status updates in-place |
| Click "View Issues" on E2                 | Playbook Reader → context: "E2 open issues"                      |
| Click a play in the activity log          | Playbook Reader → context: play execution details                |
| Click readiness gauge                     | Switch to Checklists                                             |
| Switch to Checklists tab                  | Checklists — Mid-Project (Screen 2)                              |

### Design Notes

- Epic cards are **spatially arranged by attention priority**: "Needs Attention" section is prominent at top, "On Track" section is compact below.
- The "Needs Attention" card (E2) is **expanded** — showing the AI's diagnostic summary in a generative region. On-track cards are compact.
- Summary metrics at top are **aggregate counters**, not charts or graphs. Quick glance numbers.
- The play activity log at bottom shows **recent execution history** — what happened, where, and whether it passed.
- This is NOT a list of all epics. Only **active work** appears. Completed and not-yet-started epics are invisible here.
- The 🟢🟡🔴 indicators provide instant triage: green = on track, yellow = slow/stalled, red = needs intervention.

---

## Screen 4: Playbook Reader — Epic Overview (AI-Composed)

*User clicked "E1: Authentication" from the Flight Deck. The AI composes a narrative from the artifact graph.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                              │
│  ◈ MDB  TaskFlow                                                                   ▰▰▰▰▱▱▱▱▱▱ 45          │
│                                                                                     ▔▔▔▔▔▔▔▔▔▔▔▔           │
│  ┌──────────────────┬──────────────────┬━━━━━━━━━━━━━━━━━━┐    ┌──────────────────────────────────┐          │
│  │   ☑ Checklists   │  ✈ Flight Deck   │  📖 Playbook     │    │  🔍 Search artifacts...          │          │
│  └──────────────────┴──────────────────┴━━━━━━━━━━━━━━━━━━┘    └──────────────────────────────────┘          │
│                                                                                                              │
│  🏠 Home › Playbook › E1: Authentication                                                                    │
│                                                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                              │
│  ┊━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┊      │
│  ┊ 🤖 GENERATIVE NARRATIVE — Reading: E1 Authentication                                             ┊      │
│  ┊                                                                                                   ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  E1: AUTHENTICATION                                                                               ┊      │
│  ┊  ═══════════════════                                                                              ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  Authentication is the foundational epic for TaskFlow, covering user identity,                    ┊      │
│  ┊  session management, and access control. It contains 12 features organized across                 ┊      │
│  ┊  three capability domains: OAuth login [F1] [F2] [F3], session lifecycle [F4] [F5],              ┊      │
│  ┊  and role-based access control [F6] [F7] [F8] [F9] [F10] [F11] [F12].                           ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  The architecture uses JWT tokens with RSA-256 signing, stored in a Redis-backed                  ┊      │
│  ┊  session cache. Authentication state flows through a middleware chain defined in                   ┊      │
│  ┊  the physical architecture [ARCH-AUTH-MW]. The design pattern is Gateway + Strategy               ┊      │
│  ┊  [DP-AUTH-01], allowing multiple OAuth providers without modifying core auth logic.               ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ── Coverage ──────────────────────────────────────────────────────────────────                    ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  34 scenarios are specified across the 12 features. Breakdown:                                    ┊      │
│  ┊    • Login flows:        14 scenarios  [SC-AUTH-001] through [SC-AUTH-014]                        ┊      │
│  ┊    • Session management:  8 scenarios  [SC-AUTH-015] through [SC-AUTH-022]                        ┊      │
│  ┊    • RBAC enforcement:   12 scenarios  [SC-AUTH-023] through [SC-AUTH-034]                        ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  Current validation status: 28/34 scenarios passing (82%). Six failures are                       ┊      │
│  ┊  concentrated in session timeout edge cases [SC-AUTH-016] [SC-AUTH-017] [SC-AUTH-019]             ┊      │
│  ┊  and RBAC inheritance [SC-AUTH-029] [SC-AUTH-031] [SC-AUTH-033].                                  ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ── Architecture Decisions ────────────────────────────────────────────────────                    ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  Three key decisions shape this epic:                                                             ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  1. JWT over opaque tokens — chosen for stateless horizontal scaling. Trade-off:                  ┊      │
│  ┊     token revocation requires a deny-list in Redis [ADR-003].                                     ┊      │
│  ┊  2. Redis session cache with 15-minute sliding window — balances security with                    ┊      │
│  ┊     UX. Hard ceiling at 24h regardless of activity [NFR-SEC-01].                                  ┊      │
│  ┊  3. RBAC over ABAC — simpler model sufficient for V1 scope. Migration path to                    ┊      │
│  ┊     ABAC documented in [ADR-007] for future consideration.                                        ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ── Implementation Status ─────────────────────────────────────────────────────                    ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  Implementation is 60% complete. The task plan [PLAN-E1] has 18 tasks across                      ┊      │
│  ┊  3 milestones. Milestone 1 (OAuth login) is complete. Milestone 2 (session mgmt)                  ┊      │
│  ┊  is in progress — 4/6 tasks done. Milestone 3 (RBAC) is pending.                                 ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  Active branch: feat/e1-auth (arjun). Last commit: 15 minutes ago.                               ┊      │
│  ┊                                                                                                   ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ── Actions ───────────────────────────────────────────────────────────────────                    ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ╔══════════════════════════╗  ╔══════════════════════════╗                                       ┊      │
│  ┊  ║  🔧 Run prepare-epic     ║  ║  🔍 Run quality-check    ║                                       ┊      │
│  ┊  ╚══════════════════════════╝  ╚══════════════════════════╝                                       ┊      │
│  ┊                                                                                                   ┊      │
│  ┊━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┊      │
│                                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Transitions — Screen 4

| Action                                        | Destination                                                    |
|-----------------------------------------------|----------------------------------------------------------------|
| Click any [F1]–[F12] CrossRefToken             | Inline expansion below the token (Screen 5 pattern)            |
| Click any [SC-AUTH-xxx] CrossRefToken           | Inline expansion with scenario detail (Screen 5)               |
| Click [ADR-003], [ADR-007]                      | Inline expansion with decision record                          |
| Click "Run prepare-epic" CTA                    | Play executes; ContentSlot appears below CTA with streaming output |
| Click "Run quality-check" CTA                   | Play executes; ContentSlot appears below CTA with streaming output |
| Click "Explain" (on text selection)              | AI composes deeper narrative, inserted below selection          |
| Search bar                                       | Search Results (Screen 7)                                      |
| Switch instrument tabs                           | Checklists / Flight Deck                                       |

### Design Notes

- The **entire main content area** is a 🤖 generative region. The AI composed this narrative by tracing across features.yaml, scenarios.yaml, architecture.yaml, plan.yaml, and STM evidence.
- CrossRefTokens like [F1], [SC-AUTH-001], [ADR-003] are **inline clickable elements** — they don't navigate away. They expand below (see Screen 5).
- The narrative is **structured but readable** — headings organize the content, but it reads like a document, not a data table.
- CTAs at the bottom are **contextual** — the AI determined which plays are relevant given the epic's current state.
- There are no tabs, no raw YAML, no artifact grid. Just composed text with interactive tokens.

---

## Screen 5: Playbook Reader — Progressive Disclosure

*Same as Screen 4, but the user clicked [SC-AUTH-001]. An expansion appeared inline below the clicked reference. A second expansion (previously opened, now collapsed) is also shown.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                              │
│  ◈ MDB  TaskFlow                                                                   ▰▰▰▰▱▱▱▱▱▱ 45          │
│                                                                                     ▔▔▔▔▔▔▔▔▔▔▔▔           │
│  ┌──────────────────┬──────────────────┬━━━━━━━━━━━━━━━━━━┐    ┌──────────────────────────────────┐          │
│  │   ☑ Checklists   │  ✈ Flight Deck   │  📖 Playbook     │    │  🔍 Search artifacts...          │          │
│  └──────────────────┴──────────────────┴━━━━━━━━━━━━━━━━━━┘    └──────────────────────────────────┘          │
│                                                                                                              │
│  🏠 Home › Playbook › E1: Authentication                                                                    │
│                                                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                              │
│  ┊━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┊      │
│  ┊ 🤖 GENERATIVE NARRATIVE — Reading: E1 Authentication                                             ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  E1: AUTHENTICATION                                                                               ┊      │
│  ┊  ═══════════════════                                                                              ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  Authentication is the foundational epic for TaskFlow, covering user identity,                    ┊      │
│  ┊  session management, and access control. It contains 12 features organized across                 ┊      │
│  ┊  three capability domains: OAuth login [F1] [F2] [F3], session lifecycle [F4] [F5],              ┊      │
│  ┊  and role-based access control [F6] [F7] [F8] [F9] [F10] [F11] [F12].                           ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐       ┊      │
│  ┊    ▾ [F1] OAuth Login via Google                                              [collapse] │       ┊      │
│  ┊  │  Previously expanded — now collapsed. Click to re-open.                               │       ┊      │
│  ┊  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘       ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  The architecture uses JWT tokens with RSA-256 signing, stored in a Redis-backed                  ┊      │
│  ┊  session cache. Authentication state flows through a middleware chain defined in                   ┊      │
│  ┊  the physical architecture [ARCH-AUTH-MW]. The design pattern is Gateway + Strategy               ┊      │
│  ┊  [DP-AUTH-01], allowing multiple OAuth providers without modifying core auth logic.               ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ── Coverage ──────────────────────────────────────────────────────────────────                    ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  34 scenarios are specified across the 12 features. Breakdown:                                    ┊      │
│  ┊    • Login flows:        14 scenarios  [SC-AUTH-001] through [SC-AUTH-014]                        ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ┌────────────────────────────────────────────────────────────────────────────────────────┐       ┊      │
│  ┊  │  ▾ EXPANDED: [SC-AUTH-001]                                                [× close]   │       ┊      │
│  ┊  │  ════════════════════════════════════════════════════════════════════════════════════   │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  Scenario: Google OAuth Happy Path                                                    │       ┊      │
│  ┊  │  ─────────────────────────────────────                                                │       ┊      │
│  ┊  │  Given a user with a valid Google account                                             │       ┊      │
│  ┊  │  When they click "Sign in with Google" and authorize                                  │       ┊      │
│  ┊  │  Then a JWT is issued, session is created in Redis, and user lands on dashboard       │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  Pass Criteria:                                                                       │       ┊      │
│  ┊  │    • JWT contains correct claims (sub, email, role, exp)                              │       ┊      │
│  ┊  │    • Session TTL = 15 minutes sliding, 24h hard max                                   │       ┊      │
│  ┊  │    • Redirect completes in < 2s after Google callback                                 │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  Status: ● PASSING                                                                    │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  ── Connections ──                                                                    │       ┊      │
│  ┊  │  Parent feature:    [F1] OAuth Login via Google                                       │       ┊      │
│  ┊  │  Architecture:      [ARCH-AUTH-MW] Auth Middleware Chain                               │       ┊      │
│  ┊  │  NFR dependency:    [NFR-SEC-01] Session hard ceiling 24h                              │       ┊      │
│  ┊  │  Implementation:    Task 3 in Milestone 1 [PLAN-E1-M1-T3]                             │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  ╔═════════════════════╗                                                              │       ┊      │
│  ┊  │  ║  🔎 Explain further  ║                                                              │       ┊      │
│  ┊  │  ╚═════════════════════╝                                                              │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  └────────────────────────────────────────────────────────────────────────────────────────┘       ┊      │
│  ┊                                                                                                   ┊      │
│  ┊    • Session management:  8 scenarios  [SC-AUTH-015] through [SC-AUTH-022]                        ┊      │
│  ┊    • RBAC enforcement:   12 scenarios  [SC-AUTH-023] through [SC-AUTH-034]                        ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  Current validation status: 28/34 scenarios passing (82%). Six failures are                       ┊      │
│  ┊  concentrated in session timeout edge cases ...                                                   ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  (narrative continues below as in Screen 4)                                                       ┊      │
│  ┊                                                                                                   ┊      │
│  ┊━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┊      │
│                                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Transitions — Screen 5

| Action                                    | Destination                                                    |
|-------------------------------------------|----------------------------------------------------------------|
| Click [× close] on SC-AUTH-001 expansion   | Expansion collapses; narrative re-flows. Reading position preserved. |
| Click collapsed [F1] expansion             | Re-expands the F1 detail section                                |
| Click "Explain further" in SC-AUTH-001     | AI composes deeper trace (inline below the button). E.g., traces through implementation code, test results, and architecture rationale. |
| Click any other [SC-xxx] or [Fnn] token    | New expansion opens below that token. Multiple expansions can coexist. |
| Click [ARCH-AUTH-MW] in Connections         | Expansion for the architecture component appears inline          |
| Scroll up/down                              | Reading position is stable — content only grows downward from expansion points |

### Design Notes

- **Two expansion states visible**: [F1] is collapsed (previously opened, user closed it), [SC-AUTH-001] is open. This demonstrates the pattern: open, read, close, move on.
- The expansion appears **directly below the clicked token** within the narrative flow. Content below is pushed down, not replaced.
- The expansion has a **solid border** (it's structured data from the artifact) but lives within the generative narrative.
- "Connections" section in the expansion shows the **cross-reference graph** in a readable format — not a graph visualization, just labeled links.
- "Explain further" triggers another **generative composition** — the AI would trace SC-AUTH-001 deeper through code, tests, and architecture.
- **Multiple expansions can be open simultaneously** — the user controls which are open/closed.

---

## Screen 6: Playbook Reader — Wiki Tag + CTA in Action

*User is in a composed view. Three action states are visible: one running, one completed, one ready to trigger.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                              │
│  ◈ MDB  TaskFlow                                                                   ▰▰▰▰▱▱▱▱▱▱ 45          │
│                                                                                     ▔▔▔▔▔▔▔▔▔▔▔▔           │
│  ┌──────────────────┬──────────────────┬━━━━━━━━━━━━━━━━━━┐    ┌──────────────────────────────────┐          │
│  │   ☑ Checklists   │  ✈ Flight Deck   │  📖 Playbook     │    │  🔍 Search artifacts...          │          │
│  └──────────────────┴──────────────────┴━━━━━━━━━━━━━━━━━━┘    └──────────────────────────────────┘          │
│                                                                                                              │
│  🏠 Home › Playbook › E2: Payments › RCA Investigation                                                      │
│                                                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                              │
│  ┊━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┊      │
│  ┊ 🤖 GENERATIVE NARRATIVE — Reading: E2 Payments — Quality Investigation                           ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  E2: PAYMENTS — WHY ARE SCENARIOS FAILING?                                                        ┊      │
│  ┊  ═════════════════════════════════════════                                                        ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  The quality check from 14:23 today flagged 3 regressed scenarios in the payment                 ┊      │
│  ┊  webhook handler. The root issue appears to be in the idempotency key validation —               ┊      │
│  ┊  duplicate webhook deliveries from Stripe are not being de-duplicated when they                   ┊      │
│  ┊  arrive within the same Redis TTL window.                                                         ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  I wanted to understand how Stripe handles webhook retries in edge cases, so:                     ┊      │
│  ┊                                                                                                   ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ── Completed Research ────────────────────────────────────────────────────────                    ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  [[research: Stripe webhook retry behavior and idempotency best practices]]                       ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐       ┊      │
│  ┊    ✓ Research complete                                                       [▾ expand] │       ┊      │
│  ┊  │ Stripe retries up to 3x over 72h with exponential backoff. Idempotency keys         │       ┊      │
│  ┊    should use event ID, not payment intent ID. Our implementation uses payment...       │       ┊      │
│  ┊  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘       ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  Based on this, the fix is clear: switch the idempotency key from payment_intent.id              ┊      │
│  ┊  to event.id in the webhook handler. But first, let me check if there are similar                ┊      │
│  ┊  patterns in our other integrations:                                                              ┊      │
│  ┊                                                                                                   ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ── Live Research ─────────────────────────────────────────────────────────────                    ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  [[research: How do our other webhook handlers (email, notifications) handle idempotency?]]       ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ┌────────────────────────────────────────────────────────────────────────────────────────┐       ┊      │
│  ┊  │  ◐ Researching...                                                                     │       ┊      │
│  ┊  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▱▱▱▱▱▱▱▱▱▱                                  │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  ┊──────────────────────────────────────────────────────────────────────────────┊      │       ┊      │
│  ┊  │  ┊ 🤖 Streaming output:                                                        ┊      │       ┊      │
│  ┊  │  ┊                                                                              ┊      │       ┊      │
│  ┊  │  ┊ Found 2 other webhook handlers in the codebase:                              ┊      │       ┊      │
│  ┊  │  ┊ • email-service/webhooks/sendgrid.ts — uses event.id ✓ (correct)             ┊      │       ┊      │
│  ┊  │  ┊ • notification-service/webhooks/twilio.ts — uses message.sid ⚠               ┊      │       ┊      │
│  ┊  │  ┊   (investigating if this has the same vulnerability...)                      ┊      │       ┊      │
│  ┊  │  ┊ █                                                                            ┊      │       ┊      │
│  ┊  │  ┊──────────────────────────────────────────────────────────────────────────────┊      │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  └────────────────────────────────────────────────────────────────────────────────────────┘       ┊      │
│  ┊                                                                                                   ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ── Recommended Action ────────────────────────────────────────────────────────                    ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  Once the research above completes, run RCA to produce a formal root cause                        ┊      │
│  ┊  analysis with a fix plan:                                                                        ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ╔══════════════════════════════════════════════════════════════════════════════════════╗          ┊      │
│  ┊  ║  🐛 Run RCA: Analyze idempotency regression in E2 webhook handler      → fix-it    ║          ┊      │
│  ┊  ╚══════════════════════════════════════════════════════════════════════════════════════╝          ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ┌────────────────────────────────────────────────────────────────────────────────────────┐       ┊      │
│  ┊  │  ContentSlot: RCA output will appear here when play is triggered.                      │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │       ┊      │
│  ┊  └────────────────────────────────────────────────────────────────────────────────────────┘       ┊      │
│  ┊                                                                                                   ┊      │
│  ┊━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┊      │
│                                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Transitions — Screen 6

| Action                                    | Destination                                                    |
|-------------------------------------------|----------------------------------------------------------------|
| Click [▾ expand] on completed research     | Expands to show full research results inline                    |
| Wait for live research to complete         | Streaming output fills in, then status changes to ✓             |
| Click "Run RCA" CTA                        | Executes `fix-it` play; streaming output fills ContentSlot below |
| Scroll up                                   | Original narrative context is still above — never lost          |

### Design Notes — Three Action States

This screen demonstrates the **action engine within the reader** — three distinct states visible simultaneously:

1. **Completed wiki tag** (top): Research is done. Results are collapsed to a summary with an expand control. The user got the answer and moved on — it doesn't dominate the view.

2. **Running wiki tag** (middle): Research is actively streaming. A progress bar shows it's working. Output appears in a generative streaming region — the user can watch it fill in or scroll past and come back.

3. **Ready CTA** (bottom): The "Run RCA" button is a play trigger. Below it is an **empty ContentSlot** — a reserved space that will fill with the play's output when triggered. The dashed placeholder communicates "something will go here."

- All three states coexist in the narrative. The user's reading flow is unbroken.
- Wiki tags `[[research:...]]` are **inline** in the narrative — they feel like natural parts of the investigation, not UI widgets bolted on.
- The ContentSlot pattern keeps play output **in context** rather than opening a new page or modal.

---

## Screen 7: Search Results

*User searched for "authentication timeout" from the search bar.*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                              │
│  ◈ MDB  TaskFlow                                                                   ▰▰▰▰▱▱▱▱▱▱ 45          │
│                                                                                     ▔▔▔▔▔▔▔▔▔▔▔▔           │
│  ┌──────────────────┬──────────────────┬━━━━━━━━━━━━━━━━━━┐    ┌──────────────────────────────────┐          │
│  │   ☑ Checklists   │  ✈ Flight Deck   │  📖 Playbook     │    │  🔍 authentication timeout       │          │
│  └──────────────────┴──────────────────┴━━━━━━━━━━━━━━━━━━┘    └──────────────────────────────────┘          │
│                                                                                                              │
│  🏠 Home › Playbook › Search: "authentication timeout"                                                      │
│                                                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                              │
│  ┊━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┊      │
│  ┊ 🤖 GENERATIVE RESULTS — 4 results for "authentication timeout"                                   ┊      │
│  ┊                                                                                                   ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ┌────────────────────────────────────────────────────────────────────────────────────────┐       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  1.  SESSION TIMEOUT SCENARIOS (E1: Authentication)                                   │       ┊      │
│  ┊  │      ──────────────────────────────────────────────                                   │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  Three scenarios govern session timeout behavior in the auth epic.                    │       ┊      │
│  ┊  │  [SC-AUTH-016] tests the 15-minute sliding window expiry — currently FAILING          │       ┊      │
│  ┊  │  because the Redis TTL refresh races with the JWT validation middleware.              │       ┊      │
│  ┊  │  [SC-AUTH-017] tests the 24-hour hard ceiling — also FAILING.                        │       ┊      │
│  ┊  │  [SC-AUTH-019] tests timeout behavior during active WebSocket connections.            │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  Source: scenarios.yaml (E1)  ·  nfr-spec.yaml  ·  STM evidence                      │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  └────────────────────────────────────────────────────────────────────────────────────────┘       ┊      │
│  ┊                                                                                                   ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ┌────────────────────────────────────────────────────────────────────────────────────────┐       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  2.  ARCHITECTURE DECISION: SESSION TTL STRATEGY [ADR-003]                            │       ┊      │
│  ┊  │      ────────────────────────────────────────────────────                              │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  ADR-003 chose a 15-minute sliding window with 24-hour hard ceiling over              │       ┊      │
│  ┊  │  fixed-duration tokens. The decision was driven by [NFR-SEC-01] (security)            │       ┊      │
│  ┊  │  and [NFR-UX-03] (minimize re-authentication friction). Trade-off: requires           │       ┊      │
│  ┊  │  Redis for TTL management, adding an infrastructure dependency.                       │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  Source: logical-architecture.yaml  ·  nfr-spec.yaml                                  │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  └────────────────────────────────────────────────────────────────────────────────────────┘       ┊      │
│  ┊                                                                                                   ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ┌────────────────────────────────────────────────────────────────────────────────────────┐       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  3.  NFR: SESSION HARD CEILING [NFR-SEC-01]                                           │       ┊      │
│  ┊  │      ─────────────────────────────────────                                            │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  Non-functional requirement specifying maximum session duration of 24 hours            │       ┊      │
│  ┊  │  regardless of activity. Derived from security quality profile. Verified by            │       ┊      │
│  ┊  │  [SC-AUTH-017]. Currently FAILING — the hard ceiling is not enforced when              │       ┊      │
│  ┊  │  the sliding window keeps refreshing.                                                  │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  Source: nfr-spec.yaml  ·  quality-vision.yaml                                        │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  └────────────────────────────────────────────────────────────────────────────────────────┘       ┊      │
│  ┊                                                                                                   ┊      │
│  ┊                                                                                                   ┊      │
│  ┊  ┌────────────────────────────────────────────────────────────────────────────────────────┐       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  4.  QUALITY CHECK FAILURE LOG (E2: Payments — related)                               │       ┊      │
│  ┊  │      ─────────────────────────────────────────────────                                │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  The payment webhook handler has a timeout-related regression where Stripe             │       ┊      │
│  ┊  │  webhook retries arrive after the idempotency key TTL expires, causing                 │       ┊      │
│  ┊  │  duplicate processing. While this is in E2 (Payments), the timeout pattern             │       ┊      │
│  ┊  │  is architecturally similar to the auth session timeout issue.                         │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  │  Source: STM evidence (quality-check run 14:23)                                       │       ┊      │
│  ┊  │                                                                                       │       ┊      │
│  ┊  └────────────────────────────────────────────────────────────────────────────────────────┘       ┊      │
│  ┊                                                                                                   ┊      │
│  ┊━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┊      │
│                                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Transitions — Screen 7

| Action                                  | Destination                                                      |
|-----------------------------------------|------------------------------------------------------------------|
| Click result 1                           | Playbook Reader → E1 context, narrative focused on timeout scenarios |
| Click result 2                           | Playbook Reader → E1 context, narrative focused on ADR-003        |
| Click result 3                           | Playbook Reader → E1 context, narrative focused on NFR-SEC-01     |
| Click result 4                           | Playbook Reader → E2 context, narrative focused on quality failure |
| Click any [SC-xxx], [ADR-xxx], [NFR-xxx] | Enters Playbook Reader at that specific context                   |
| Refine search query                      | Results update in place                                           |

### Design Notes

- Search results are **NOT file paths**. They are AI-composed contextual snippets that explain the match in context.
- Results are **grouped by relevance**, not by source file. Result 1 aggregates information from scenarios.yaml, nfr-spec.yaml, and STM evidence into one coherent result card.
- Each result card shows a **"Source:" line** listing which artifacts contributed to the snippet — this provides provenance without exposing raw file structure.
- CrossRefTokens within results are **clickable** — they take you into the Playbook Reader at that context.
- Result 4 shows **cross-epic relevance** — the search found a related pattern in E2 even though the query was about authentication. The AI understood the semantic connection.
- The entire results area is generative — the AI composed these summaries, they're not regex matches.

---

## Transition Map (Complete)

```
                                    ┌─────────────────────┐
                                    │    TOP BAR          │
                                    │  (always visible)   │
                                    └─────┬───────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
          ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
          │   CHECKLISTS    │   │   FLIGHT DECK   │   │    PLAYBOOK     │
          │  (Screens 1-2)  │   │   (Screen 3)    │   │ (Screens 4-6)  │
          └────────┬────────┘   └────────┬────────┘   └────────┬────────┘
                   │                     │                     │
    ┌──────────────┼──────────┐          │          ┌──────────┼──────────┐
    │              │          │          │          │          │          │
    ▼              ▼          ▼          ▼          ▼          ▼          ▼
 Click step    Click epic   Switch   Click epic  CrossRef   Wiki tag   CTA
    │          reference    tabs     "Open in     expand     execute    play
    │              │                  Reader"      │          │          │
    ▼              │                     │         ▼          ▼          ▼
 Play runs         │                     │      Inline     Streaming  ContentSlot
 in-place          └─────────────────────┴──→ expansion    output     fills below
 (ContentSlot                                 (stays on    (stays on   (stays on
  below step)                                  page)       page)       page)

                                    ┌─────────────────────┐
                                    │      SEARCH         │
                                    │    (Screen 7)       │
                                    └─────────┬───────────┘
                                              │
                                        Click result
                                              │
                                              ▼
                                     Playbook Reader
                                    (at that context)

  Key principle: You NEVER leave a page involuntarily.
  Expansions, streaming, and ContentSlots all operate WITHIN the current view.
  The only navigation is: instrument switching (tabs) and entering Playbook Reader from a reference.
```

---

## Component Reference

| Component            | Type     | Description                                                                |
|----------------------|----------|----------------------------------------------------------------------------|
| InstrumentSwitcher   | Static   | Tab bar: Checklists / Flight Deck / Playbook. One active at a time.        |
| ReadinessGauge       | Reactive | Mini gauge in top bar (always). Large gauge on Checklists screen.          |
| Checklist            | Static   | Ordered steps with sequential unlocking. One CTA active at a time.         |
| ChecklistItem        | Static   | Step within checklist: icon, description, mapped play, status.             |
| EpicCard             | Static   | Compact card on Flight Deck: name, dev, stage, activity, nudge CTA.       |
| PlayLog              | Static   | Table of recent play executions with status and duration.                  |
| CrossRefToken        | Static   | Inline clickable ID like [F1], [SC-AUTH-001]. Triggers inline expansion.   |
| InlineExpansion      | Mixed    | Expanded detail below a CrossRefToken. Solid border, close control.        |
| ContentSlot          | Static   | Reserved area below a CTA. Fills with play output when triggered.          |
| WikiTag              | Static   | `[[research:...]]` inline trigger. Three states: ready, running, done.     |
| StreamingOutput      | Reactive | Live output area within ContentSlot or WikiTag while play runs.            |
| SearchResult         | 🤖       | AI-composed contextual snippet with source provenance and inline tokens.   |
| NarrativeView        | 🤖       | AI-composed readable narrative from artifact graph. The core innovation.   |
| SummaryMetrics       | Static   | Aggregate counters on Flight Deck (epics, devs, plays, issues).            |

---

## What This Design Avoids

| Rejected Pattern         | Why                                                    | What We Do Instead                     |
|--------------------------|--------------------------------------------------------|----------------------------------------|
| Sidebar file tree        | Exposes file structure; wrong mental model              | Instrument tabs + search               |
| Artifact grid            | Cognition-killing card soup; no narrative               | AI-composed narrative in Playbook      |
| Journey map / lifecycle  | Implies linear progression; reality is non-linear       | Checklists (procedural) + Flight Deck (live) |
| Graph visualization      | Pretty but useless for decision-making                  | Inline cross-ref expansion             |
| Raw YAML rendering       | Unreadable for humans; defeats the purpose              | AI composes narratives from YAML       |
| Multi-page navigation    | Lose reading context; cognitive load of page-hopping    | Progressive disclosure — expand inline |
| Dashboard metrics        | Vanity metrics without actionability                    | Readiness score → checklists → action  |
