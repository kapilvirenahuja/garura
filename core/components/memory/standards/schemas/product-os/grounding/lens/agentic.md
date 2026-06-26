# Agentic Lens Grounding Doc — TEMPLATE & CONTRACT

> Locked contract for a slice's `lens/agentic.md` — the **functional** agentic lens. It answers
> whether the slice is (or contains) an agent, and if so how much load it offloads and what
> controls bound it. A non-agent slice says so plainly — that is a valid, common answer; do not
> invent agentic behavior that isn't there. The linter enforces the heading set; the
> content-quality eval scores it against `_content-standard.md`. Written by `/agentic`.

## Heading contract (required, in order)

```
# Agentic Lens
## Is it an agent?
## Load weights
## Controls
```

## Per-section guidance

- **Is it an agent?** — the gate: does this slice do agentic work (decide and act on its own
  toward a goal), or is it deterministic? State the verdict AND why. "No, it's a read view" is
  a complete, valid answer.
- **Load weights** — only if it IS an agent: a table rating how much human load it offloads on
  three axes — cognitive, creative, logistical — each on a low→ultra scale, with the rationale.
  If not an agent, write "n/a — not an agent" and explain, no table.
- **Controls** — the guardrails that bound any agentic behavior and the human handoff points
  (when it must defer to a person). For a non-agent slice, the controls are the determinism
  boundaries that keep it predictable.

## Gold example

```markdown
# Agentic Lens

## Is it an agent?
No. The Trusted Source Coverage slice is deterministic: it reads fixtures, applies fixed
labeling rules, and renders states. It makes no autonomous decisions and pursues no goal of its
own — every output is a pure function of the fixture inputs and the labeling rules — so there is
no agent here, and saying so honestly matters more than manufacturing one.

## Load weights
n/a — not an agent. No cognitive, creative, or logistical load is offloaded to a model; the
labeling and coverage logic is rule-based and fully inspectable.

## Controls
The determinism boundary is the control: no model call sits in the render path, so there is
nothing to guardrail and no autonomous action to hand off. The one human-in-the-loop point is
reviewing the privacy-block rules themselves, which is a configuration decision outside this
slice's runtime.
```
