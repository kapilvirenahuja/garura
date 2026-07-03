# Review knowledge — how each category of change is reviewed

This shelf is the durable knowledge `/review-change` consults. The play itself holds **no**
category list and **no** review treatment — it assesses, every run, what kinds of work a PR
contains, then reads the matching playbook here to learn how that kind of work is reviewed.

Two things live on this shelf:

- **The category playbooks** (one file per category) — for a kind of work, who reviews it,
  which review layers apply, which linter runs, and whether design-grounding is required.
- **Pointers to the linters** — each playbook names the actual mechanical linter for its
  category (an existing script/skill, or an explicit gap to be built). The linters are
  durable, committed artifacts; the playbook is the knowledge about *when and how* to use
  them.

## The two review layers

Every category is reviewed through up to two layers. A playbook says which apply.

- **Layer 1 — linters.** Mechanical, objective checks that are true or false without
  judgement (structure, schema, spelling, dead links, language lint, path existence). No
  human grounding needed because the rules are objective and committed.
- **Layer 2 — design-grounding + conformance.** For design-bearing categories only. The
  reviewer reconstructs the design's principles **from committed/external sources** (base
  ref, decision records, memory) — never from the branch's own new content — and then checks
  the changed artifacts for conformance to those principles. This is what breaks the
  circular "the branch agrees with itself" review.

## Applicability is universal

A PR rarely contains every category, and a category rarely needs every layer. The assessor
runs only what applies. A category that is absent has its playbook skipped — that is the
expected path, not a failure.

## The category catalog (v1 — seeded #443)

The assessor is not limited to this list; it derives categories from the actual diff and may
find new ones (write a new playbook when it does). These are the seeded categories:

| Category | What it is | Playbook |
|---|---|---|
| Decision records | Architectural decisions (ADRs) | [adrs.md](adrs.md) |
| Documentation | Human-facing prose | [docs.md](docs.md) |
| Harness | The MD-defined "code": plays, skills, agents, grounding | [harness.md](harness.md) |
| Memory | The knowledge base the agents read | [memory.md](memory.md) |
| Executable code | Real source (py/js/ts/…) | [code.md](code.md) |
| Config maps | Files that wire the system together by path | [config-maps.md](config-maps.md) |
| Tests | Automated tests | [tests.md](tests.md) |

## How a playbook is shaped

Each file follows the knowledge-shelf template, with review-specific facets:

- **frontmatter `conditions`** — the signals that suggest this category is present (path and
  content hints). These guide the assessor; they do **not** mechanically presume the
  category — the assessor judges.
- **Reviewer** — human, the tool, or both.
- **Layers** — which of Layer 1 / Layer 2 run.
- **Linter** — the concrete mechanical check (existing tool or a named gap).
- **Design-grounding** — yes/no, and where the principles are grounded from when yes.
- **Rubric** — what "right" means for this category.

## Provenance

Seeded #443 (review-change redesign). Categories adapted from the PR Review Approach spec to
garura's own structure. The shelf grows as we learn — `/review-change` and `/learn` write
new playbooks and sharpen existing ones.
