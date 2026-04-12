# Tech Debt Quality Standards

Tech debt quality covers the practices that make technical debt visible, classified, governed, and resolvable. These files provide the assessment checklist items (DEBT-01 through DEBT-24) used by the quality-check skill. The classification framework is Martin Fowler's tech debt quadrant — the key differentiator of this category.

## Files

- [fowler-quadrant.md](fowler-quadrant.md) — Fowler quadrant classification framework: deliberate vs inadvertent, reckless vs prudent; assessment heuristics | Patterns: tech debt, deliberate, inadvertent, reckless, prudent, debt quadrant, debt classification
- [debt-register-governance.md](debt-register-governance.md) — Debt register existence and governance: owner, timeline, blast radius, velocity, review cadence; grep patterns for unregistered debt | Patterns: debt register, TODO, FIXME, HACK, WORKAROUND, TEMPORARY, sprint allocation, debt velocity
- [accepted-vs-unaccepted.md](accepted-vs-unaccepted.md) — Acceptance criteria matrix, invariant violations (never acceptable), deliberate-prudent acceptance protocol, decision audit trail | Patterns: debt acceptance, invariant violation, security debt, acceptance protocol, blast radius, decision trace
