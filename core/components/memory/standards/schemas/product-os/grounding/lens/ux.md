# UX Lens Grounding Doc — TEMPLATE & CONTRACT

> Locked contract for a slice's `lens/ux.md` — the **functional** UX lens. It describes the
> screens the slice exposes, their states, and the visual core — at LOW fidelity (named and
> described in prose, never pixel-designed). Flows are derived by the build; accessibility now
> lives in the marketing lens. The linter enforces the heading set; the content-quality eval
> scores it against `_content-standard.md`. Written by `/ux`.

## Heading contract (required, in order)

```
# UX Lens
## Intent
## Screens
## States
## Visual core
```

## Per-section guidance

- **Intent** — what the slice's surface is for, from the user's side: who opens it and what
  they need to see or do, and why this surface and not another. A short paragraph.
- **Screens** — each screen the slice exposes: its name, who opens it, and a LOW-FIDELITY
  layout in prose (the regions and what each holds). Never pixel-perfect design. One per
  surface the slice names.
- **States** — the states each screen can be in (loading, empty, error, partial, populated)
  and what the user sees in each — so no state is an afterthought.
- **Visual core** — the color direction and typography direction in words (not a full design
  system), enough to keep the build coherent.

## Gold example

```markdown
# UX Lens

## Intent
The Trusted Source Coverage slice gives a CTO one screen to answer "can I trust this data?"
before reading any number. They open it to scan every source at a glance and see, honestly,
which resolved, which are partial, and which couldn't be read — so the surface's whole job is
legibility-at-a-glance and honesty, not depth.

## Screens
- **Source coverage view** — opened by the CTO or dashboard operator. Layout: a header strip
  with the loaded fixture set and last-refresh time; a full-width table, one row per expected
  source, with columns for source name, resolved state, freshness, and privacy-trust label; a
  legend panel explaining each state. No drill-down on this slice — that accretes later.

## States
- Loading — a table skeleton with a "reading fixtures…" note.
- Populated — every expected source as a row with its resolved state and labels.
- Partial — a source that read some records shows "partial" with read/skipped counts.
- Unavailable — a source that couldn't be read shows "unavailable" with a reason, never blank,
  never dropped.
- Empty — no fixtures loaded yet: a prompt to load the fixture set, not a blank screen.

## Visual core
Calm and data-first: a neutral background with one accent reserved for trust-state badges
(green resolved, amber partial, grey unavailable, red privacy-blocked). Typography: a single
legible sans for the data, slightly heavier weight on the state badges so honesty reads first.
```
