# ADR 024 — The Amendment: An Append-Only Change Record Below the Epic

**Status:** Accepted
**Date:** 2026-07-03
**Supersedes:** nothing — no unit below the epic existed
**Related:** ADR 019 (epics kept when delivered), ADR 023 (three execution trinities), issues #444–#447, #450

## Context

ADR 019 made delivered epics permanent: they stay on the slice as the as-delivered
record and are never deleted. That guarantee has a corollary that surfaced the moment a
live product needed a small improvement: **delivered epics also cannot be reopened.**
Grafting a new story onto a delivered epic rewrites what the record says was shipped and
when — the as-delivered history starts lying.

But the product model has no unit smaller than an epic. So a small improvement to shipped
work ("add a saved-amount line to the checkout summary that epic X delivered") had no
honest home: too small for a new epic's ceremony, forbidden from editing an old one, and
shipping it outside the model turns the model into a liar one small change at a time.

The stories inside /implement's plan are not a substitute — they live in working memory
and the tracked issue, not in the product model, and they exist only while an epic is in
delivery.

## Decision

**A new record type: the amendment. An append-only entry, anchored to the delivered epic
(or surface) it improves — like an adjusting entry in accounting: past entries are never
edited; a new entry references the old one.**

1. **Anchored, always.** Every amendment names the delivered epic (or surface) it
   improves. The anchor is also the classifier: if no anchor can be named, the change is
   new capability in disguise and belongs to the top-down path (understand → shape →
   realize → grill). /amend refuses unanchorable changes.
2. **Append-only.** The delivered epic is never touched. The amendment says "epic X as
   shipped, plus this change." **A slice's current truth = its epics + their
   amendments.** As-delivered history stays intact.
3. **Boxed by the slice's declared intent.** An amendment cannot step outside the slice's
   intent — the same box /grill enforces for epics, applied at smaller grain. An
   amendment that stretches the slice routes up to the top-down path.
4. **Epic-shaped lifecycle at smaller grain:** `created` (by /amend) → `in_delivery` (by
   /enhance) → `delivered` (stamped only after /accept passes). Kept in place when
   delivered, mirroring ADR 019.
5. **/learn closes the loop** — reconciles the model so the amendment is part of slice
   truth, and watches for slow accretion: when a slice has taken N increments since its
   lenses were last solved, it is flagged for a re-realize look (#450). Gates catch
   single changes; only accumulation-watching catches erosion.
6. **Schema decided on paper first** (#444) — home on the slice beside the epics it
   anchors to, fields (intent of the change, anchor reference, the one user-visible
   check, delivered stamp), states as above — before any dependent play is compiled,
   because once amendments accumulate the shape is expensive to change.

## Consequences

### Positive

- **Small improvements get a first-class, model-honest home** at a fraction of epic
  ceremony (the amendment trinity: /amend → /enhance → /accept, ADR 023).
- **As-delivered history stays true** — nothing shipped is ever edited, only appended to.
- **The anchor test resolves lane ambiguity mechanically** — "can you point at what this
  improves?" needs no judgment call.
- **Auditability**: the ledger reads like books — what shipped, then what was adjusted,
  in order.

### Negative / Risks

- **Accretion.** Many amendments on one slice leave its lens designs solved for a product
  that has quietly grown. No single amendment crosses the line; the accumulation does.
  Mitigated by the /learn accretion signal (#450) — a re-realize flag, threshold from
  config.
- **A second record type to maintain** — schema, states, lint, and /next routing all grow
  a case. Accepted as the price of a truthful model below epic grain.
- **Reading slice truth now takes two record types** (epics + amendments). Tooling that
  renders a slice must compose them.

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Reopen delivered epics and add stories | Rewrites as-delivered history — the epic no longer describes what was delivered when it says it was (breaks ADR 019's purpose). |
| Model small changes as tiny epics | Wrong-sized ceremony (full grill cut, validate + launch) drives small work out of the model in practice. |
| Ship small changes with no model record, let /learn back-fill | /learn would be reconstructing intent after the fact instead of stamping a declared record — weaker guarantee, and nothing boxes the change to the slice's intent while it is being built. |
| A free-form "notes" field on the slice | No anchor, no states, no guard, no /accept gate — a diary, not a record; nothing downstream can trust or route on it. |

## References

- ADR 019 — epic persistence (the permanence that makes append-only necessary)
- ADR 023 — the three execution trinities (the amendment trinity consumes this record)
- Issue #444 — the amendment schema (the paper-first decision this ADR mandates)
- Issues #445–#447 — /amend, /enhance, /accept
- Issue #450 — /learn wiring: delivered stamping + the accretion signal
