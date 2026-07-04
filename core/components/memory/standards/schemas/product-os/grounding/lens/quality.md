# Quality Lens Grounding Doc — TEMPLATE & CONTRACT

> Locked contract for a slice's `lens/quality.md` — the **non-functional** quality lens.
> It states the bar the slice's intent must pass: the gates, drawn from the product
> profile's NFR gates that apply plus the slice's ICE constraints/failures made
> checkable. How to test, coverage, and environments are NOT here (that is the build's
> job; /validate checks these gates independently). The linter enforces the heading set;
> the content-quality eval scores it against `_content-standard.md`. Written by `/quality`.

## One lens, two artifacts (#462)

The quality lens follows the run-lens precedent: `quality.md` is the human-readable
narrative (this contract), and `quality-gates.yaml` is its machine sibling — the per-gate
binding a runner executes (schema: `standards/schemas/product-os/lens/quality-gates.yaml`).
Every Gates-table row carries exactly one binding card: `owner: machine` with the demanded
tooling, command, and pass rule for the deterministic slice (linters, tests, types,
architecture rules, coverage), or `owner: human` naming the edge that judges it (design,
UX, security judgment are never runner-owned). The binding is authored in the same pass as
the table — the prose-gate → tool-command mapping is design-time judgment, never re-inferred
at run time. A card is a demand, not an assumption: absent tooling surfaces as a
missing-tool finding, never a silent pass.

## Heading contract (required, in order)

```
# Quality Lens
## Intent
## Gates
```

## Per-section guidance

- **Intent** — what "good" means for THIS slice in one short paragraph: the quality the
  slice has to hit to be trustworthy, and why that bar and not a looser one. Not a restating
  of the gates — the reason they exist.
- **Gates** — a table of the checkable bars: `| Dimension | Bar | How checked |`. Each gate
  is concrete and verifiable (a value or a standard), drawn from the profile's NFR gates that
  apply to this slice and the slice's constraints/failures made checkable. Prose under the
  table may explain any non-obvious gate.

## Gold example

```markdown
# Quality Lens

## Intent
For the Trusted Source Coverage slice, "good" means a CTO can believe the coverage view
without auditing it: every source's state is shown honestly, nothing private leaks, and the
numbers are traceable to records. The bar is high on privacy and explainability because the
whole product's credibility rests on this first screen — a single leaked prompt or a
silently-dropped source here poisons trust in everything downstream.

## Gates
| Dimension | Bar | How checked |
|-----------|-----|-------------|
| Privacy | No raw prompt, path, secret, or client/project name appears in any rendered cell | Privacy fixture covering every blocked category renders with 0 leaks |
| Explainability | Every coverage state on screen resolves to the source records behind it | Trace-back check: pick any cell, resolve it to its source records |
| Source honesty | Every expected source shows a resolved state (full/partial/estimated/unavailable) — none missing | Coverage fixture asserts no expected source cell is blank |
| Reliability | One unreadable fixture never aborts the view; the gap is shown, not hidden | Fault-injection fixture: one bad source, the view still renders with that source marked unavailable |
```
