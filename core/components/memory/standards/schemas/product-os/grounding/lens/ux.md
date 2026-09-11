# UX Lens Grounding Doc — TEMPLATE & CONTRACT

> Locked contract for a slice's `lens/ux.md` — the **functional** UX lens. It answers the two
> questions a UX researcher opens it to answer: **what the user is dealing with** (the screens,
> each naming the one object it is about) and **how a person moves through it** (the flows —
> ordered paths through those screens, with their forks, their failure path, and their exit). It
> also names the states each screen can hold and the visual core. Everything is LOW fidelity —
> described in prose, never pixel-designed. The flows are written here, not left to the build,
> and they cover the path **inside this slice's screens only**; the person's wider journey across
> the product belongs to the proposed `/story` play (#528), not to this lens. There is no separate
> information-architecture section — the "one object the user works with" line on each screen
> carries the IA. Accessibility is not in this lens; it lives in the marketing lens. The linter
> enforces the heading set, `validate_ux.py` mechanically cross-checks the flows against the
> screens, and the content-quality eval scores the doc against `_content-standard.md`. Written by
> `/ux`.

## Heading contract (required, in order)

```
# UX Lens
## Intent
## Screens
## Flows
## States
## Visual core
```

## Per-section guidance

- **Intent** — what the slice's surface is for, from the user's side: who opens it and what they
  need to see or do, and why this surface and not another. A short paragraph.

- **Screens** — one entry per screen the slice exposes. Each entry names four things, in this
  order:
  1. **The screen's name** — the name a flow step will use to refer to it.
  2. **Who opens it** — the persona or role that arrives here.
  3. **The one object the user works with there** — the single thing this screen is *about*
     (a coverage list, a fixture set, an invoice, a run record). One object per screen. This
     line is the information architecture of the slice; there is deliberately no separate IA
     section, so if a screen cannot name one object, the screen is doing two jobs and should be
     split.
  4. **A low-fidelity layout in prose** — the regions of the screen and what each region holds.
     Regions and content, never pixels, never colors, never component libraries.

  Every functionality the slice bundles must be visible on at least one screen, and every screen
  must be reached by at least one flow step below.

- **Flows** — one block per persona **and** goal. A persona chasing two different goals gets two
  blocks. Each block uses this fixed field order, so a researcher can read it as a story and an
  agent can parse it as a graph:

  - **Persona** — who is moving. Must be a persona or journey actor that already exists in the
    slice's hub; never invented here.
  - **Goal** — what they are trying to get done, in their words, not the system's.
  - **Entry** — where they start: the screen they land on and what put them there.
  - **Steps** — an ordered, numbered list. Each step names a screen **that exists in Screens**
    above, plus the action the person takes on it. One action per step.
  - **Decisions** — every fork point in the steps. For each fork, say what is being decided and
    where **each** branch goes — name the step or screen for every branch, never just the happy
    one.
  - **Failure** — what happens when a step fails: which step, what the person sees, and what
    they can do about it. At least one real failure path per flow.
  - **Exit** — where the person ends up and what they now have.

  Scope boundary: flows describe movement **within this slice's screens**. Do not write the
  person's wider journey across the whole product — arriving from another slice, or what they do
  afterwards elsewhere. That cross-product journey is the job of the proposed `/story` play
  (#528). A flow that leaves this slice's screens fails the contract.

- **States** — grouped by screen, one entry per state. A flat list of state labels fails. Each
  state names three things:
  1. **Its trigger** — what puts the screen into this state.
  2. **What the user sees** — the visible difference, in words.
  3. **What they can do next** — the action available from here, or plainly that there is none
     but wait.

  Cover the honest states, not just the happy one: loading, empty, partial, error, and blocked
  belong here whenever they can happen.

- **Visual core** — the color direction and typography direction in words (not a full design
  system), enough to keep the build coherent.

## Gold example

```markdown
# UX Lens

## Intent
The Trusted Source Coverage slice gives a CTO and their dashboard operator one place to answer
"can I trust this data?" before anyone reads a number. They open it to scan every expected source
at a glance and see, honestly, which resolved, which came back partial, and which could not be
read at all. The surface's whole job is legibility-at-a-glance and honesty — not depth, not
analysis.

## Screens

- **Source coverage view** — opened by the CTO, or by the dashboard operator preparing the
  morning review.
  - The one object: the **coverage list** — one entry per source the slice expects to read.
  - Layout: a header strip naming the loaded fixture set and its last-refresh time; below it a
    full-width table, one row per expected source, with columns for source name, resolved state,
    freshness, and privacy-trust label; a legend panel down the side explaining what each state
    label means. No drill-down in this slice — that accretes later.

- **Fixture set loader** — opened by the dashboard operator, when no fixture set is loaded yet or
  they want to swap in a different one.
  - The one object: the **fixture set** — a named folder of source files the slice reads from.
  - Layout: a single centered panel listing the fixture sets found on disk, each showing its name
    and how many records it holds; a confirm action on the selected set; a footer line naming the
    folder that was searched, so a missing set is diagnosable without leaving the screen.

## Flows

### Operator prepares the morning review

- **Persona** — the dashboard operator, the person who loads the sources and gets the review
  ready for the CTO.
- **Goal** — get a coverage picture in front of the CTO that they can trust, before the morning
  review starts.
- **Entry** — opens the dashboard link and lands on the Source coverage view.
- **Steps** — the ordered path, each step taken on a named screen:
  1. **Source coverage view** — reads the header strip to see which fixture set is loaded, if any.
  2. **Fixture set loader** — picks a fixture set from the list and confirms the load.
  3. **Source coverage view** — scans the table row by row and reads each source's resolved state.
  4. **Source coverage view** — opens the legend panel to check any state label they do not
     recognize.
- **Decisions** — the fork points, and where each branch goes:
  - After step 1 — *is a fixture set already loaded?* **No** → step 2, the Fixture set loader.
    **Yes** → skip step 2 and go straight to step 3 on the Source coverage view.
  - After step 3 — *did any source come back partial, unavailable, or privacy-blocked?* **Yes** →
    the operator stops here, copies the reason text from that row, and exits on the Source
    coverage view with the review flagged as not-ready. **No** → step 4, then exit.
- **Failure** — the chosen fixture set cannot be read at step 2. The Fixture set loader stays on
  screen, names the file it could not read and why, and keeps the list available so the operator
  can pick a different set. They are never dropped onto a coverage table built from a half-read
  set.
- **Exit** — the operator ends on the Source coverage view, with every expected source showing a
  state and no row left blank: either cleared for the review, or flagged as not-ready with a
  named reason.

## States

**Source coverage view**
- *Loading* — trigger: the view has asked for coverage and no answer has come back yet. Sees: a
  table skeleton with a "reading fixtures…" note. Next: nothing but wait; no row is actionable.
- *Empty* — trigger: no fixture set is loaded. Sees: a short prompt explaining what a fixture set
  is and that none is loaded — not a blank screen. Next: open the Fixture set loader.
- *Populated* — trigger: coverage came back and every expected source resolved cleanly. Sees: one
  row per source with its state, freshness, and privacy-trust label. Next: read the legend, or go
  back to the loader for a different set.
- *Populated with gaps* — trigger: at least one source came back partial, unavailable, or
  privacy-blocked. Sees: those rows carry their own label plus a plain-words reason — never blank,
  never silently dropped. Next: copy the reason and take it to the source owner.

**Fixture set loader**
- *Ready* — trigger: opened with at least one readable fixture set on disk. Sees: the sets listed
  with name and record count. Next: select one and confirm the load.
- *No sets found* — trigger: opened and the fixture folder holds nothing readable. Sees: the
  folder path that was searched and what a valid set looks like. Next: put a set in that folder
  and reopen the loader.
- *Load failed* — trigger: the confirmed set could not be read. Sees: the file name and the
  reason, with the list still on screen. Next: pick a different set.

## Visual core
Calm and data-first: a neutral background with one accent reserved for trust-state badges (green
resolved, amber partial, grey unavailable, red privacy-blocked). Typography: a single legible sans
for the data, with slightly heavier weight on the state badges so the honest signal reads first.
```
