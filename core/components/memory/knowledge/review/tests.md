---
id: review/tests
title: "Reviewing tests"
conditions:
  recognises: "the PR changes automated tests"
  signals: ["**/{test,tests,__tests__,spec,e2e,integration,cypress,playwright}/**", "**/*.{test,spec}.*", "core/components/plays/validate/scripts/runners/**"]
provenance: "seeded:#443"
---

# Reviewing tests

## Topic
How to review automated tests — both the quality of the test code and whether the suite
actually passes.

## Recognise
The diff changes test files or test runners. In garura this includes the validate play's
runners and any `tests/` tree in a target repo.

## Treatment
- **Reviewer:** the tool.
- **Layers:** Layer 1 — and **run the suite**.
- **Linter:** a coding-best-practice linter on the test code (clear assertions, no skipped/
  disabled tests sneaking in, no test that asserts nothing), plus the `pr.md` TEST-* rows via
  `quality-check-scoped`.
- **Run, don't just read:** execute the test suite and confirm it passes. A red suite is a
  **blocker** finding. Where a runnable suite exists for the touched code, running it is part
  of the review — not optional. If no runnable suite exists for this change, say so explicitly
  (do not silently treat "not run" as "passed").
- **Design-grounding:** no.

## Rationale
Reading a test tells you it looks reasonable; running it tells you the truth. The spec's
strongest test-category rule is "run, don't just read" — a suite that fails is the cheapest
blocker to catch and the most embarrassing to miss. Executing is the review.

## Provenance
seeded #443 — adapted from the PR Review Approach spec (category G).
