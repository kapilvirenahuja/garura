# Self-Review — Issue #552 (`feature/552-ux-design-po-can-see`)

Rules source: `core/components/memory/standards/rules/self-review.md` (base, not overridden —
see `resolved-rules.json`).

Diff reviewed: `git diff main...HEAD`, 12 files changed (7 source files for the feature + 5 STM
context files from `start-change`/`commit-change`). Three commits, all reference `#552`,
conventional format (`feat(ux)`, `chore(stm)` x2).

## Scope checks

- **Matches the issue.** PASS. All seven source files map directly to the five children
  (#554–#558) plus the #563 fence fix, applied as one change set through a single ICE
  recompile of the `/ux` play. No file touches the deliberately-out-of-scope items (a
  product-wide surface map, or tracing a slice's outcome to its journeys — #561).
- **No scope creep.** PASS. Every changed file is one of: the ICE source, its compiled
  `SKILL.md`, the stop-condition it declares, the two scripts it runs, the `ux` grounding
  schema, and the `author-ux-lens` skill it calls. Nothing unrelated riding along.
- **Reasonable size.** PASS with justification already present. ~1,580 insertions is large for
  one sitting, but it is five features plus a fix compiled through one recompile of a single
  play — that's the natural unit here, and the commit history and `SKILL.md`'s own changelog
  section explain the shape.
- **No stray artifacts.** PASS. No commented-out code, no debug prints, no scratch files.

## Quality checks

- **Tests present.** PASS by this repo's own pattern. `/ux` doesn't carry pytest-style unit
  tests for its scripts; correctness is proved by the play's step/scenario evals (SE-15 checks
  `render_wireframes.py` exits 0 on both the render and `--check` passes; SE-14 checks
  `validate_ux.py`'s new cross-checks) and by `lint_play.py`, which is the standard verification
  surface for a garura play. Consistent with how other plays in this repo are proven.
- **Commits are clean.** PASS. Conventional format, each commit coherent, `#552` referenced in
  all three.
- **No secrets.** PASS. Diff scanned for key/token/password/PEM patterns — no hits.
- **Docs in step.** PASS. The interface change (visual-core meaning) is itself the doc —
  `core/components/memory/standards/schemas/product-os/grounding/lens/ux.md` — and it's part of
  this diff.
- **Nothing obviously broken.** PASS, verified mechanically, not asserted:
  - `python3 core/components/plays/play-editor/scripts/lint_play.py core/components/plays/ux/SKILL.md`
    → **VERDICT: PASS (0 gaps)** — all 13 checks pass, including failure coverage, scenario
    coverage, constraint coverage, recovery 1:1, no orphans, and fingerprint present.
  - ICE/SKILL fingerprint: `shasum -a 256 core/components/plays/ux/reference/ice.md` →
    `dbb1f8b843e0073517523349f95b137aa777005e89514311c05ea2818daa8474`, matches the value recorded
    in `SKILL.md`'s Compilation Metadata exactly. Source and compiled output agree.
  - Scoped-write guard containment: the allowlist at Step 4 (`--allow lens/ux.md`, `--allow
    lens/screens.yaml`, `--allow lens/wireframes.html`, `--add-only decisions/*`) covers every
    path the play writes to the product model, including the new `wireframes.html`. The
    script's `--report` output for `render_wireframes.py` goes to the STM working directory, not
    the model tree, so it's correctly outside the guard's scope rather than an omission.
  - #563 fence fix confirmed: `author-ux-lens/SKILL.md` had 5 code-fence markers on `main`
    (odd — unmatched) and has 4 on this branch (even — matched).

## Code-level findings

**F1 — non-blocking.** `core/components/plays/ux/scripts/validate_ux.py`, `ROLE_HEAD_VERBS`
(~line 537–541). The invented-role heuristic only flags a generic role word as a role when the
token right after it is punctuation, end-of-line, or one of a ~30-word curated verb list. Common
action verbs a persona would plausibly take — "clicks", "submits", "selects", "confirms",
"approves", "requests", "reviews", "creates" — aren't in that list, so `"the reviewer approves"`
or `"an admin submits"` silently pass the prose scan uncaught. This is a false-negative gap, not
a false-positive one: the heuristic under-detects rather than over-flagging real content, which
is the safer failure direction for a hard-fail check layered on top of the authoritative
structured checks (`opened by`, flow `Persona` field) that this prose scan only supplements. Not
blocking, but worth widening the verb list or switching to a closed-class POS heuristic (function
word set) if false negatives show up in practice.

**F2 — non-blocking.** Same file, `render_markup`/escaping in `render_wireframes.py` was
reviewed for injection risk: `esc()` (HTML-escape) runs before the `[[tone:text]]` markup regex
is applied, so a literal `<`/`&` in authored frame content can't produce HTML, and the markup
delimiters themselves aren't literal text a screen author could smuggle in after escaping. No
finding — noting the order was checked deliberately since this is the one place user-authored
text reaches an HTML page.

No blocking findings.

## Summary

- Blocking findings: 0
- Non-blocking findings: 1 (heuristic verb-list gap in `validate_ux.py`'s role-prose check)
- Lint (`lint_play.py`): PASS, 0 gaps
- Fingerprint check: matches
- Verdict: clean — ready to raise
