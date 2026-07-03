# Defect + design: /shape gives structure, /roadmap plans — vertical slices

Issue: #434. Source: bug filed from the token-burn-dash product (using garura).
Status: design agreed 2026-06-09; build pending.

## The bug (as filed)

`/shape` says it selects "what to build," but its output is only grouped by
capability — a scope map, not a build plan. It does not say what order to build, and
it does not define the buildable units that cross capabilities. This misleads teams
into finishing one capability fully before starting the next (horizontal completion),
which delays usable product value.

Observed shape output (token-burn-dash, ai-usage-intelligence domain):

- Tool Burn Accounting → AI Tool Source Ingest, Source Token Reconciliation
- Team Taxonomy Configuration → Taxonomy Profile Management, Taxonomy Rule Resolution
- Team Usage Attribution → Usage Attribution Roll-ups, Corrections & Prune-safe History

A valid product map — but the team wanted the buildable, cross-capability units and the
order. They hand-wrote what they wanted:

1. Token data spine — source ingest + token reconciliation + shared trust contract
2. People/Team Usage v1 — taxonomy + rule resolution + usage roll-ups + dashboard view
3. Corrections & history — corrections + prune-safe history + trust labels + dashboard
4. Harness Usage v1 — run reconstruction + autonomy scoring + dashboard view
5. Sharing — privacy scan + shareable digest

Each item is a **vertical slice**: a bundle of functionalities that may cross
capabilities and together produce a usable increment.

## The decision (agreed)

The bug is really two needs landing in the wrong place. The fix splits them cleanly
across the two plays — and this is exactly why /roadmap earns its place.

### /shape — structure, one domain at a time

Shape stays one-domain-per-run (clean, agile: build a domain, move to the next). For
its domain it produces:

- the scope map: domain → capability → functionality
- the functionality ICE files
- **the vertical slices for that domain** — each slice names the functionalities it
  bundles and **references their ICE files** (never duplicates ICE; the functionality
  ICE stays the single source of truth).

Shape stops there. You can pick a slice, open its ICE, and build it. Shape does NOT
order the slices, size them, or reach across domains.

Slices may cross capabilities **within the domain** (shape sees the whole domain).
Cross-domain slices are out of shape's reach by design — that view belongs to roadmap.

### /roadmap — the plan, across all domains

Roadmap is the planner over everything shaped so far. It takes the slices from every
shaped domain and produces the build plan:

- the **order** — what to build first
- the **dependencies** — within and across domains
- the **effort** — sizing each slice

This is roadmap's reason to exist: shape hands you a pile of buildable slices with no
order; roadmap turns the pile into a plan. (Supersedes roadmap's earlier "flat feature
ranking" design — the unit is now the slice, and the job is order + dependencies +
effort.)

### /grill — unchanged, below roadmap

Roadmap says "build the token data spine next"; grill takes that slice's functionalities
and cuts the engineering epics (slice of a capability through its components).

## The vertical-slice artifact (per the bug spec)

A new artifact shape writes (home: product-os, per domain). Each slice:

- slice id
- slice name
- outcome
- ordered functionality references (within the slice)
- mapped functionality ICE paths (references, NOT copies)
- dependency notes
- acceptance intent for the slice
- whether each functionality is fully delivered or partially used in this slice

A functionality may appear in more than one slice (deepened over time). Every selected
functionality must appear in at least one slice OR an explicit later/deferred bucket.

## Acceptance criteria (combined)

Shape:
- output clearly separates the scope map from the slices; checkpoint shows the slices,
  not just capability groupings.
- checkpoint language no longer calls the output a "build plan" — it is the scope map
  + slices; sequencing/effort comes from roadmap.
- every selected functionality appears in a slice or the deferred bucket; validation
  fails if a selected functionality ICE exists but is mapped to neither.
- slices reference ICE, never duplicate it.

Roadmap:
- takes the slices across shaped domains and outputs a plan: order + dependencies +
  effort.
- a slice's dependencies (within and across domains) are respected in the order.

## Build order

1. Slice artifact schema (this defines what shape writes and roadmap reads).
2. Shape intent change — emit slices + the every-functionality-mapped rule + wording.
3. Roadmap intent change — slice planner (order + dependencies + effort).
4. Redeploy to token-burn-dash for testing.
