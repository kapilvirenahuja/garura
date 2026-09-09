## Harness verdict (gate off per `gates.plays.review-change`): **APPROVE**

Decided by the harness, not a human. `gates.plays.review-change` resolves `off` (the #467
Batch C ruling), so the computed recommendation is recorded verbatim as the decision. A
reject here would stand exactly as a human reject would.

**Reason:** no P1 findings; confidence acceptable (0.9, threshold 0.5).
**Counts:** P1 0 · P2 0 · P3 0 · P4 1.

### Categories assessed (derived from the diff, not presumed)

| Category | Design-bearing | Layers run |
|---|---|---|
| harness — the play's SKILL.md and its three scripts | yes | structural linters, then design-grounding |
| code — the same three Python files, judged as executable source | no | standards linter |
| stm_run_records — this run's own pipeline paperwork | no | none (no playbook on the shelf) |

Absent, so skipped rather than failed: decision records, docs, memory, config maps, tests.

### Principles grounded, and where they came from

All four were reconstructed from committed sources at base `main` — never from content this
branch added.

| Principle | Result | Committed source |
|---|---|---|
| A bootstrap meta-play with no ICE source changes by direct edit, and must carry a deviation-note footer | conforms | `main:CLAUDE.md` Play Pipeline Rules; the play's own #434 / #478 notes on `main` |
| The orchestrator decides scope; the adapter applies the filter and lays components down | conforms | `main:install.py` components-step comment; the `allow` docstring in both adapters on `main` |
| Uninstall is manifest-driven only — it reverses exactly what the manifest records | conforms | `main:uninstall-garura/SKILL.md`, "Manifest-driven only" |
| `skippable()` is the single definition of what counts as a real component | **violation (P4)** | `main:adapters/common.py` `skippable()`, and its use at every traversal site |

### The one finding

**F-546-01 · P4 · `scripts/install.py`** — `resolve_scope()`'s `full` branch reads the plays
folder with a bare `os.listdir()` and never applies `common.skippable()`, which every other
traversal of a components directory does apply.

Nothing installs wrongly today: the plays folder holds no dotfile or `_`-prefixed entries,
and both adapters re-apply `skippable()` before writing anything. The cost is that "what
counts as a real component" now has a second, quieter definition outside the one place meant
to own it. Drop a `_scratch` or `.template` folder under `plays/` later and `full` would
compute an allow-set carrying a phantom entry.

Basis: `main:core/components/plays/install-garura/scripts/adapters/common.py`. Raised
independently by the design-grounding pass and by the author's own self-review.

### Checks actually executed

`ruff check` on the three changed files — pass. `resolve_scope()` run against the real
component tree — behaves as documented. AST parse of all three files — pass. Install runs
into throwaway targets for `--tool claude`, `--tool codex` and `--scope harness` — the four
meta plays absent under `full`, `play-creator` and `play-editor` still present under
`harness`.

### Recorded, deliberately not held against this PR

Each of these was checked against `main` and found unchanged by this diff.

- `lint_play.py` and `lint-components` both fail on this play. They fail identically on
  `main`, this diff added and removed zero section headings, and the untouched sister play
  `uninstall-garura` fails the same three ways. The gap belongs to the hand-authored
  bootstrap meta-play class, repo-wide.
- `fetch_pr_context.py` binds the review shelf to a path that does not exist on disk. The
  config's own `standards_order` puts the global shelf first, which is what was used.
  Pre-existing, outside this diff.
- The severity taxonomy classifies everything under `core/components/**` as prose, so its
  grep-based security rules could not fire on three files that are real executable Python.
  The linter compensated with `ruff` and a manual data-safety trace.
- `stm_run_records` has no playbook on the review shelf — the same gap issue #500 hit. A
  follow-up to write one, or to record an explicit no-design/no-linter ruling, is unfiled.
