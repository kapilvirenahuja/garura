# Epic Grounding Doc — TEMPLATE & CONTRACT

> Locked contract for an epic's `epic.md`. An epic is the **vertical delivery slice**
> cut at user-testable grain — the handoff to the execute pipeline. Because it goes
> to build, it must be **self-contained and ICE-complete**: intent, constraints,
> failures, expectations/success, and context, plus its delivery parts. The
> functionalities it delivers are **linked** to real spine nodes. The linter enforces
> the heading set and the link integrity; the eval scores depth and self-explanation
> against `_content-standard.md`. Written by `/grill`.

## Heading contract (required, in order)

```
# Epic: <Epic Title>
## Intent (goals)
## Constraints
## Failures
## Expectations / success
## Context (persona / systems / scope)
## Outcome
## User check
## Surface
## Delivers — functionalities (linked)
## Acceptance criteria
```

## Per-section guidance

- **Intent (goals)** — what this epic is trying to achieve, each goal explained.
- **Constraints** — the boundaries it must respect, each with the reason it exists.
- **Failures** — what must not happen, each with the consequence that makes it matter.
- **Expectations / success** — the success conditions in plain terms (the narrative
  of "good"); the testable form lives in Acceptance criteria.
- **Context** — persona, systems, and scope, carried so the execute pipeline is
  self-contained and needs nothing outside this doc.
- **Outcome** — one paragraph: the end-to-end behavior a user gets.
- **User check** — the concrete manual verification: open X, do Y, verify Z.
- **Surface** — type (web_dashboard | server_api | cli | library | service_read_model),
  human run target, and the artifacts that must open. Declared at cut, never re-derived.
- **Delivers — functionalities (linked)** — the functionality spine nodes this epic
  delivers; each must resolve, or the linter rejects the epic.
- **Acceptance criteria** — Given / When / Then; done when these pass.

## Gold example

```markdown
# Epic: See trusted usage coverage from local fixtures

## Intent (goals)
- A CTO can confirm, from local fixtures alone, that usage data is being collected,
  labeled, and privacy-safe — before trusting any rollup built on top of it.
- Prove source honesty end to end: every unavailable or blocked state is visible
  rather than hidden, so the coverage view itself is evidence the model works.

## Constraints
- The MVP runs entirely from local fixture files for Codex and Claude Code. It must
  not call live provider APIs or use real credentials — at this stage we are proving
  the collection and trust model on a developer laptop, not integrating real accounts.
  Anything that would need a live credential is out of this epic.
- The coverage screen is built only from the already-collected fact set that Data
  Gathering produced. It must never reach back into raw tool sessions to render the
  view, because that would bypass the privacy labeling and break the promise that
  every number on screen traces to a stored, labeled record.

## Failures
- An expected source or tool cell silently disappears from the view instead of
  showing a labeled state. This is the worst failure: a missing cell reads as "no
  usage" when the truth may be "we couldn't collect it", which quietly poisons trust
  in every other number on the page.
- A raw private value — a prompt, a path, a secret, a client name — renders anywhere
  in the coverage view. Even one leak means the privacy gate failed and the whole
  dashboard becomes unshareable.
- Copilot renders as blank or missing rather than a labeled "unavailable". A blank
  cell hides the gap; the label tells the truth about it.

## Expectations / success
- The coverage page lists every source/tool cell we expect, each showing a resolved
  trust state — no blank cells, nothing dropped — so a reader sees at a glance what
  is and isn't trustworthy.
- A field seeded with private content renders as privacy-blocked, with the reason
  shown and the raw value never displayed, proving the gate works on real-looking data.
- Copilot renders as a labeled "unavailable" source, proving the dashboard reports
  gaps honestly instead of faking coverage it does not have.

## Context (persona / systems / scope)
- Persona: CTO, dashboard operator, privacy reviewer.
- Systems: Codex adapter, Claude Code adapter, Copilot state adapter, privacy scanner,
  local server API.
- Scope: coverage and trust only — no rollups, no live credentials.

## Outcome
A CTO opens the dashboard, loads Codex and Claude Code fixtures, and sees source
coverage with trust labels — including a visibly blocked private example and a
visibly labeled unavailable source — without any live provider credentials.

## User check
Open the dashboard → load the fixture set → open Source Coverage → verify each source
shows a fidelity/evidence/privacy state, the Copilot row reads "unavailable" (not
missing), and the seeded private field reads "privacy-blocked".

## Surface
- Type: web_dashboard
- Human run target: http://localhost:<port>/coverage
- Must open: "Source coverage page", "Trust-label legend"

## Delivers — functionalities (linked)
- collect/source-usage-ingest
- collect/privacy-trust-labeling
- collect/source-coverage-freshness

## Acceptance criteria
- Given the fixture set, when ingest runs, then every expected cell shows a resolved
  state and none disappears.
- Given a seeded private field, when coverage renders, then it shows privacy-blocked
  with a reason and no raw value.
- Given Copilot has no reliable source, when coverage renders, then it shows a
  labeled "unavailable" state.
```
