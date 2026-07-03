# Measure Lens Grounding Doc — TEMPLATE & CONTRACT

> Locked contract for a slice's `lens/measure.md` — the **deliver** measurement lens. It states
> what delivery the slice is proving and the metrics that prove it — each with a baseline, a
> target, and how it's proven — plus what is explicitly not measured. This is the seam /capture
> later harvests. The linter enforces the heading set; the content-quality eval scores it
> against `_content-standard.md`. Written by `/measure`.

## Heading contract (required, in order)

```
# Measure Lens
## Focus
## Metrics
## Out of scope
```

## Per-section guidance

- **Focus** — what delivery this slice is proving, in a paragraph: the one outcome whose
  movement tells you the slice worked.
- **Metrics** — a table: `| Metric | Baseline | Target | Proof |`. Triangle-primary where it
  applies (speed / tokens / cognition); each metric carries a current baseline, a target, and how
  it's proven. Concrete numbers, not adjectives.
- **Out of scope** — what this slice deliberately does NOT measure yet, each with its reason — so
  a missing metric reads as a choice, not an oversight.

## Gold example

```markdown
# Measure Lens

## Focus
The slice is proving one thing: that a CTO can trust the coverage view enough to stop auditing
raw logs. So we measure whether the view is honest and fast enough to be the source of truth —
coverage completeness, leak count, and time-to-render on fixtures.

## Metrics
| Metric | Baseline | Target | Proof |
|--------|----------|--------|-------|
| Coverage completeness | n/a (no view today) | 100% of expected source cells show a resolved state | Coverage fixture asserts no blank cell |
| Privacy leaks | unknown (raw logs read by hand) | 0 leaks in rendered cells | Privacy fixture over every blocked category |
| Render time (speed) | n/a | < 2s for 5,000 fixture rows on a laptop | Automated p95 timing check |

## Out of scope
- Adoption / how often the view is opened — no users yet; that's a post-launch /capture metric.
- Accuracy vs live provider data — the MVP is fixture-only by design; live reconciliation is a
  later slice, so measuring it now would prove nothing.
```
