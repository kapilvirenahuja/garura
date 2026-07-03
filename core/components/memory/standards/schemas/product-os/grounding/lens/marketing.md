# Marketing Lens Grounding Doc — TEMPLATE & CONTRACT

> Locked contract for a slice's `lens/marketing.md` — the **functional** marketing lens (NEW in
> the 7-lens taxonomy). It covers how the slice is found, reached, and measured for reach:
> discoverability (SEO / AEO / GEO), accessibility (moved here from the profile), and marketing
> analytics. Where a section doesn't apply (e.g. an internal tool behind auth), say so plainly
> with the reason — never leave it blank. The linter enforces the heading set; the
> content-quality eval scores it against `_content-standard.md`. Written by `/marketing`.

## Heading contract (required, in order)

```
# Marketing Lens
## Intent
## Discoverability
## Accessibility
## Marketing analytics
```

## Per-section guidance

- **Intent** — who needs to find or reach this slice, and why, in a paragraph. For an internal
  tool, say that plainly — it scopes the rest.
- **Discoverability** — SEO (search engines), AEO (answer engines), and GEO (generative engines):
  how the slice's surface is made findable and answerable — or why it's not applicable (behind
  auth, internal-only), with the reason.
- **Accessibility** — the accessibility bar the slice meets (e.g. WCAG level) and HOW it meets it.
  Concrete: the standard plus the specific things the slice does. (This moved here from the
  profile.)
- **Marketing analytics** — the reach and conversion signals worth capturing — or, for an
  internal tool, the usage signals — each with why it matters.

## Gold example

```markdown
# Marketing Lens

## Intent
The Trusted Source Coverage view is an INTERNAL operations tool — a CTO and their operators open
it behind auth. So discoverability is not about public search; the reach question is internal
adoption and that the view is usable by everyone on the team, including with assistive tech.

## Discoverability
- SEO / AEO / GEO: not applicable — the view sits behind auth and is never indexed or answered by
  public search, answer, or generative engines, by design.
- Internal findability: the view is linked from the dashboard's coverage nav and named plainly
  ("Source coverage") so an operator reaches it without a manual.

## Accessibility
WCAG 2.1 AA for the coverage view: trust states are never conveyed by color alone (each badge
carries a text label), the table is keyboard-navigable with proper header semantics, and the
badge contrast meets AA. Verified by an automated accessibility pass on the rendered view; this
is the bar because an operations tool a teammate can't read is a tool that doesn't get used.

## Marketing analytics
- View opens per operator per week — the internal adoption signal; tells us the view is trusted
  enough to replace hand-auditing.
- Drill attempts and time-on-view — where operators reach for more depth, feeding the next slice.
```
