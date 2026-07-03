---
id: review/code
title: "Reviewing executable code"
conditions:
  recognises: "the PR changes real executable source"
  signals: ["bin/**", "lib/**", "src/**", "scripts/**/*.py", "**/*.{py,js,ts,mjs,cjs,go,java,rb}", "files the runtime actually executes"]
provenance: "seeded:#443"
---

# Reviewing executable code

## Topic
How to review real executable source — the highest-risk *runtime* surface — against industry
best practice.

## Recognise
The diff changes code the runtime actually executes (a bundled script, a CLI, a library). In
garura this is mostly the python scripts inside plays/skills (`lint_play.py`, `preflight.py`,
`compute_verdict.py`, search scripts) plus any real source in a target repo.

## Treatment
- **Reviewer:** the tool, against industry best practice.
- **Layers:** Layer 1 only.
- **Linter:** the language linter (eslint / ruff / etc. per repo) **plus** the best-practice
  and severity checks `quality-check-scoped` runs against the diff using the `pr.md` taxonomy
  (SEC-*, CODE-*, ARCH-*, BE-*, PERF-*, DATA-* rows). `quality-check-scoped` + `pr.md` exist
  in-repo; the language linter is whatever the target repo commits.
- **Design-grounding:** no — the standard is industry best practice, not a garura-internal
  design. But review the data-safety and idempotency paths **hard**: a script that touches
  git, the filesystem, or external services is the place a real defect does damage.
- **Rubric:** error handling, function size, no stray debug output, no secrets, safe handling
  of destructive/irreversible operations, deterministic where it claims to be.

## Rationale
Executable code is where a mistake actually runs and can lose data, so it gets the language
linter and the mechanical severity taxonomy, with extra weight on the data-safety paths. The
standard is external (best practice + the taxonomy), so no human design-grounding is needed —
but the risk is highest, so the linting is strictest.

## Provenance
seeded #443 — adapted from the PR Review Approach spec (category E).
