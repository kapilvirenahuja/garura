# ADR 023 — Execution Is Three Trinities: Epics, Defects, Amendments

**Status:** Accepted
**Date:** 2026-07-03
**Supersedes:** the single-execute-pipe taxonomy (grill → implement → validate → launch as one "Execute" block, with /fix and /refactor as loose "anytime" commands)
**Related:** ADR 019 (epics kept when delivered), ADR 024 (the amendment record), issues #444–#451

## Context

The ProductOS command model (#434) shipped with one execution pipe — /grill → /implement
→ /validate → /launch — plus standalone "anytime" commands (/fix, /refactor). That shape
answers "build a planned epic" well and answers everything else badly. On a product that
is live, most incoming work is not a planned epic:

- **A bug is found.** /fix exists, but it requires "an existing open defect issue" — there
  is no intake step. Someone who spots a bug mid-flight must either start fixing
  immediately or let it evaporate.
- **A small improvement is wanted** ("add a saved-amount line to the checkout summary").
  There is no unit below the epic and no lane between /fix and the full epic trinity, so
  small-but-real work either abuses the epic ceremony or ships outside the model — a
  drift machine.
- **Epic-grain work arrives on an existing slice.** The only documented cut was the full
  first-time /grill; the every-day case (slice realized, already cut, half delivered, one
  more epic needed) had no door.

Working these cases through end to end surfaced a repeating shape: every healthy lane has
the same three beats — **capture the unit, build it, check it** — with ceremony sized to
the grain of the unit. The epic lane already had it (grill captures, implement builds,
validate + launch check). The other lanes were missing beats, not missing pipelines.

Two placement errors in the taxonomy fell out of the same review: /grill was drawn
*inside* execute although it is the bridge that turns product model into delivery units
(a splitter, not a build step), and /learn was filed under maintenance next to /fix and
/refactor although it ships no code — it reads what happened and retunes the model, the
same class as /next.

## Decision

**Execution is three trinities, one per grain of work. Same three beats every time;
ceremony scales with the grain.**

| Trinity | Capture | Build | Check |
|---------|---------|-------|-------|
| **Epics** | /grill (cuts a realized slice; incremental mode adds one epic to a cut slice) | /implement | /validate + /launch (full independent re-run + HITL acceptance) |
| **Defects** | /record (capture-and-leave intake; /fix stays a pure fixer) | /fix | /accept (light: re-run touched checks + one human yes/no) |
| **Amendments** | /amend (anchored small improvement — ADR 024) | /enhance | /accept (shared with defects) |

1. **The trinity is the invariant.** Capture → build → check at every grain. New lanes,
   if ever needed, follow the same shape rather than inventing one.
2. **/accept is one shared play**, not two — validate-plus-launch compressed to a single
   sitting for the two light lanes. Phase 1 serves amendments; /fix keeps its embedded
   verification until /accept has proven itself (#447).
3. **/grill stands as the bridge**, between the product model and the trinities — not
   inside execute. Its incremental mode (#449) opens the add-one-epic door while keeping
   the full intent guard and measure gates.
4. **/next and /learn are orchestration**, not maintenance. Neither ships code: /next
   routes the line, /learn trues the model after any lane closes — including stamping
   amendments and watching for slow accretion (#450).
5. **Entry rule between lanes:** strategy (vision/understand/shape) for new domain,
   capability, or feature; realize per new slice; epic trinity for epic-grain work on a
   realized slice; amendment trinity for anchorable small improvements; defect trinity
   for bugs. The anchor test (ADR 024) is the classifier between "amendment" and "new
   capability in disguise."

Implementation is tracked as issues #444–#448 (amendment schema and the four new plays),
#449 (incremental grill), #450 (learn wiring), #451 (taxonomy redraw and /next routing).

## Consequences

### Positive

- **Live-product work has a right-sized front door at every grain** — no more choosing
  between epic ceremony and shipping outside the model.
- **The model stays true on the light lanes**: every lane ends in a check and closes
  through /learn, so nothing ships model-blind.
- **One idea, three instances.** The repeated capture → build → check shape is easier to
  teach, to lint, and to extend than three bespoke pipelines.
- **Intake is decoupled from work** (/record, /amend): items can be captured and left to
  be picked, which is how real teams operate.

### Negative / Risks

- **Four new plays plus a schema** (#444–#448) before the light lanes exist — real build
  cost.
- **Lane-picking errors**: work routed to /enhance that should have gone top-down. The
  anchor test guards this mechanically, but only if /amend enforces it hard.
- **/accept could drift into a rubber stamp** — its check is deliberately light. Mitigated
  by the binary human check being on the one thing that changed, and by /validate
  remaining the bar for epic grain.

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Keep one execute pipe; force all work through epics | The epic ceremony is wrong-sized for small work; in practice small work then ships outside the model (drift) or stalls. |
| A single /enhance command that skips the model | A drift machine: after ten enhances the model lies, and every downstream play inherits the lie. |
| Point commands (fix, enhance, refactor) as free-floating "anytime" tools | Loses the capture and check beats; no intake, no verdict, no /learn closure — the same drift by another route. |
| Reopen delivered epics for small changes instead of a new unit | Rewrites as-delivered history (ADR 019); rejected in ADR 024. |

## References

- ADR 024 — the amendment record (the unit the third trinity works on)
- Issues #444–#451 — the implementation set
- Issue #452, #454 — pipeline defects found while wrapping #434 (context for the check beats)
- `docs/command-chain.html` — supply-chain diagram to be redrawn under #451
- `core/components/memory/standards/rules/pipeline-next.md` — successor map to be extended under #451
