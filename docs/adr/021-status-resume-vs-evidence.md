# ADR 021 — Status/Resume and Evidence Are Separate Mechanics

**Status:** Accepted
**Date:** 2026-06-24
**Related:** ADR 020 (advisory-play self-clean), ADR 017 (folder whitelist),
#434 (project-side `status/` declared machine-local), `evidence-recording.md`

## Context

Two distinct concerns had been tangled together in the plays: the **status file**
(a resume marker — which steps already ran, so an interrupted play picks up where
it left off) and the **evidence file** (the durable audit record, gated by
`evidence.record`).

Verified behaviour showed the tangle, and showed it was inconsistent:

- The status file is a **resume marker**. It is written as a play runs and read
  only by the same play on a later invocation; nothing else consumes it, and
  nothing reads it across machines. It is pure machine-local runtime state.
- Yet status files were being treated three different ways: gitignored in one
  place, committed (riding inside an evidence self-commit) in another, and left
  untracked-but-tracked-from-history in a third. 51 status files were sitting
  tracked in the repo from before the project-side ignore rule existed, and the
  product-side `_status/` had no ignore rule at all — which is the `/next` symptom
  fixed in ADR 020.

The question was where to handle status so it never pollutes commits. Several
heavier options were weighed — a shared cleanup standard adopted by every play, or
a deterministic cleanup script hosted in the commit/merge pipeline that decided
"interim vs end of pipe." Both add moving parts to solve a problem that a single
ignore rule dissolves: if the file is never visible to git, there is nothing to
exclude at commit time and nothing to clean up afterwards.

## Decision

**Status/resume and evidence are two separate mechanics. Neither controls the
other, and they are handled in completely different ways.**

### 1. Status / resume — always written, machine-local, gitignored, no handling

- **Always written**, independent of `evidence.record`, so resume always works.
- **Gitignored at setup** and left to sit locally. A `.garura/.gitignore` carrying
  `**/status/` and `**/_status/` covers every status location under the tree — the
  issue-scoped `status/` dirs, the nested `validate/` and `launch/` ones, the
  realize trees (`_realize/<lens>/status/`, `_grill/status/`,
  `_shaping/<play>/status/`), and the product `_status/`. Because the files are
  invisible to git, they never enter a commit, never reach a PR, and never show in
  `git status`.
- **No cleanup handling anywhere.** No per-play self-clean, no commit-change or
  merge-change cleanup script, no "interim vs end of pipe" detection. The file
  simply sits on disk; the next run overwrites it or resumes from it. Keeping it is
  free and never wrong, because git cannot see it.
- The durable record is the evidence system, never the status file (#434), now
  applied uniformly.

### 2. Evidence — config-gated; on → written and committed; off → nothing

- **Gated** by the resolved `evidence.record` (per-play override → global default →
  record when absent), exactly as `evidence-recording.md` specifies. **Not**
  gitignored — when written, it is meant to land in history.
- **On:** the evidence record is written and committed — the team that turns it on
  wants the audit trail in their repo.
- **Off:** nothing is written, so there is nothing to commit and nothing to clean.
  Fewer writes, a genuine fast path.

### Setup

The ignore rule is laid down by **install-garura** as part of the `.garura` tooling
tree it already writes, and recorded in the install manifest so **uninstall-garura**
reverses it. Garura's own checkout carries the same `.garura/.gitignore`, dogfooding
the rule. The 51 status files already tracked from history are untracked
(`git rm --cached`); their content stays on disk, it just leaves git.

### Scope

This is the model for all plays. `/next` (ADR 020) additionally self-cleans its own
working folder at close; that remains — it removes on-disk staleness for an advisory
play — but it is a bonus, not something the other plays need. With the ignore rule
in place, no other play requires any change.

## Consequences

### Positive

- **Dead simple.** One ignore file at setup replaces a shared standard, a cleanup
  script, and per-play edits. No play is touched.
- **Resume always works** — it never depended on the evidence switch and now never
  will.
- **Status never pollutes git** — not in commits, not in PRs, not in `git status`.
- **Evidence-off is a real fast path** — no writes, no commits.
- **Consistent everywhere**, replacing today's three-way divergence.

### Negative / Risks

- **Status files accumulate on disk** (ignored, so invisible to git, but present).
  They are small, overwritten on the next run, and harmless. A play that wants them
  gone can self-clean like `/next`, but it is optional.
- **A manual `git add -f` could still force one in.** Accepted — the framework's own
  flows never do that, and forcing past an ignore rule is a deliberate act.

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Cleanup script hosted in commit-change / merge-change, deciding interim vs end of pipe | More moving parts than an ignore line, and a real ordering trap: the commit happens before the merge, so post-commit cleanup cannot keep a file out of the commit, while pre-merge cleanup needs an "is this the end" heuristic. Gitignore removes the file from git entirely, so neither timing nor detection matters. |
| A shared status-cleanup standard adopted by every play (converge-and-lint) | Touches every play and adds a lint surface to enforce something an ignore rule guarantees for free. |
| Keep status committed alongside evidence | Status is runtime scratch, not a durable record; committing it churns history, and #434 already ruled the durable record is the evidence system, never the status file. |
| Exclude status at commit time without a gitignore (commit-change filters it) | Works, but leaves the files visible in `git status` as untracked noise and depends on every commit path remembering to filter. A gitignore is simpler and also cleans `git status`. |

## References

- ADR 020 — advisory, position-none plays self-clean their working files (the
  optional bonus `/next` keeps)
- #434 — project-side `status/` declared machine-local and gitignored
- `core/components/memory/standards/rules/evidence-recording.md` — the
  `evidence.record` resolution order (unchanged)
- `core/components/plays/install-garura/scripts/install.py` — lays down
  `.garura/.gitignore`
- `core/components/plays/uninstall-garura/scripts/uninstall.py` — reverses it
