| Field | Value |
|-------|-------|
| **Type** | enhancement |
| **Reported From** | /fix-it #411 session (interleaved capture) |
| **Date** | 2026-05-29 |

### Problem

review-pr needs to be redesigned. The core principle: we define the rules, and then for each rule the agent finds the best way to run audits and checks to decide whether that rule is being met or not. The rules are fixed; how we verify them is something the agent figures out using whatever tooling is appropriate.

review-pr will need real tooling to do this — things like Sonar, linters, and external APIs to call — not just model reasoning over a diff.

### Expected Behavior

There should be levels of tooling, so the same rule set can be checked at different depths and costs:

- **fast** — use only the linters and tools already present on disk. No network, no cost. Quick signal.
- **full** — also call external tooling that is still free (e.g. hosted analyzers / free-tier APIs). Deeper coverage, no money spent.
- **grinding** — throw everything at it. This costs money, but it finds essentially everything in the system. Reserved for when you want maximum assurance.

The agent picks the right tooling per rule within the chosen level, runs the audits, and reports whether each rule passed.

### Impact

Today review-pr does diff-scoped reasoning without a tiered, tool-backed audit model. Moving to rule-driven audits with explicit fast / full / grinding tiers gives predictable cost/depth trade-offs and grounds the verdict in real tool output instead of model judgment alone.
