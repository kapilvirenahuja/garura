# ADR 026: Model-Writing Plays Edit the Product Model Directly

**Status:** Accepted
**Date:** 2026-07-20
**Related:** ADR 008 (issue-centric STM), ADR 011 (STM as inter-skill transport), ADR 017 (folder whitelist), ADR 022 (surface contract), ADR 025 (Level 3 skeleton), issue #498, the #467 conditional-gate work

## Context

### Where we are

Every play that writes to the product model — vision, understand, shape, grill,
measure, roadmap, arch, ux, quality, agentic, run, marketing, learn — follows the same
shape. It never edits the real product-os model while it works. It writes all of its
changes into a throwaway `draft/` folder under short-term memory, keeps the live model
read-only, presents that draft at the checkpoint, and only at the very end promotes the
draft into the live model through a play-specific `apply_<play>.py` script, checked by a
before/after verify (`check_apply.py` diffing the spine).

Around that promotion sits a fixed machinery repeated in all thirteen plays:

- a `draft/product-os/` tree (the parallel copy),
- `classify_change.py` computing a change-shape by diffing `draft` against `live`,
- `apply_<play>.py` copying the draft docs into the live model and refusing to touch
  anything outside the run's declared scope,
- an `apply-manifest.json` and a before/after spine verify.

### Why this is the wrong shape

The draft is a second copy of state that git already gives us. These plays run on a
feature branch cut by start-change. The branch working tree *is* the draft: edits made
directly to the live model are already isolated from main, already reviewable as a git
diff, and already carried to review by the end-sequence PR (`propose-change`). The
`draft/` folder duplicates that isolation and the `apply_<play>.py` scripts exist only
to copy state from the duplicate back onto the original.

Two-copy indirection is not free. It is thirteen `apply_*.py` scripts, thirteen
`classify_change.py` copies, a manifest format, and a verify step — surface that has to
be maintained, kept consistent, and reasoned about, all to move bytes from a scratch
tree to the real tree within a single run. No ADR ever recorded a decision to build it;
it accreted. Occam's razor cuts against it: writing directly to the model plus git is
fewer moving parts than draft-dir plus classify plus apply plus manifest plus verify.

### What the draft actually bought — verified against the code

The draft is redundant *except* for two properties, confirmed by reading the scripts,
that a plain `git diff` does not replace on its own:

1. **Containment.** `apply_understand.py` (and its siblings) is keyed to a scope such
   as `--capability-ref` and *refuses by construction* to mutate any entry outside it;
   `check_apply.py` verifies the allowlist held. The enrichment work is done by a
   language model, which can write outside its lane. The draft+apply+verify is a
   containment boundary against that non-determinism. A git diff lets you *see* an
   out-of-scope write after the fact; it does not *prevent* one or fail the run.

2. **Conditional-gate learning (#467).** `classify_change.py` derives a change-shape
   vector and shape key from the `draft`-vs-`live` delta. That shape feeds the learned
   auto-pass policy and ledger (`gate_eval.py`) that decides when a checkpoint may
   auto-approve — wired into eleven plays. The shape input must survive.

Both properties are achievable under direct-write, but they are the crux, not details —
removing the draft without carrying them forward would regress containment and break
gate learning.

## Decision

**Model-writing plays edit the real product-os model directly. The `draft/` folder and
the per-play `apply_<play>.py` promotion step are removed. Review happens through the
feature-branch git diff and the end-sequence PR.**

The two properties the draft carried are preserved, not dropped:

1. **Containment becomes a post-write scoped-diff guard.** After a play's writes, a
   shared guard reads `git diff` over the product-os tree and fails the run if any
   changed path falls outside the run's declared write scope, then `git restore`s
   (and `git clean`s new files) the out-of-scope paths. The guarantee moves from
   "the apply script cannot write outside scope" to "an out-of-scope write is detected
   and reverted before the run proceeds." Same guarantee at the run boundary; git is
   the mechanism.

2. **`classify_change` reads the working-tree git diff.** Its change-shape axes are
   unchanged; only its input source changes — from a `draft`-vs-`live` directory
   comparison to the working-tree diff of the model paths (dirty tree vs the branch
   base). The #467 policy and ledger keep learning against the same shape keys.

Consequent mechanics:

- **Containment split (preserves node-level containment).** The LLM enrichment/build
  skill writes ONLY per-node doc files (`capability.md`, `functionality.md`), each its
  own file. Every shared file — the spine `_spine.yaml`, `profile.yaml`, `decisions/` —
  is written solely by the play's deterministic keyed script (the surviving, in-place
  remnant of `apply_<play>.py`, still keyed to `--capability-ref` and refusing sibling
  nodes). Because the LLM never writes a shared file, the file-level scoped guard is
  enough for the LLM's blast radius, and node-level containment inside the shared spine
  is kept by the keyed script. The old doc-copy step is what disappears; the keyed
  transform stays and runs in place.
- **Clean tree in, committed delta out.** A play asserts the product-os tree is clean at
  entry and commits its own model delta at close (after the checkpoint), so `HEAD` is a
  correct base for the guard and the change-shape, and pipelined plays never see or
  revert one another's work.
- Checkpoint **cancel** means `git restore` of the model paths (and `git clean` of new
  files), not "nothing was ever written." Approve means proceed; the writes are already
  on disk and reviewable.
- The before/after spine verify (`check_apply.py`) is replaced by the scoped-diff guard.

## Scope

All thirteen model-writing plays and their scripts. Each play's intent (ICE source) is
edited to describe direct-write and recompiled with play-editor — this is an intent
change (it alters the write path, the containment guarantee, and the checkpoint's
cancel semantics), never a hand-patch of a compiled play. The `*-change` pipeline plays
(start, commit, propose, review, merge) are unaffected — they are the git/PR mechanics,
not model authoring.

## Consequences

**Positive**

- One fewer copy of product state per run; the branch working tree is the single
  editable surface.
- Thirteen `apply_<play>.py` copy-scripts and the draft/manifest/verify machinery
  collapse into direct writes plus one shared scoped-diff guard.
- Review is uniform with the rest of the repo: the model change is a normal git diff on
  the branch, carried to the PR like any other change.

**Negative / risks**

- Containment moves from compile-time impossibility to runtime detect-and-revert. A
  scoped-diff guard that is mis-scoped could let an out-of-scope write through, or
  revert a legitimate one. The guard is shared and linted so its scope rules are in one
  place, not thirteen.
- Cancel now mutates the working tree (`git restore`/`git clean`) instead of leaving it
  pristine. A play that half-writes then crashes leaves dirty state the guard or a
  resume must clean — the branch makes this recoverable, but it is real state on disk
  where before there was none.
- The #467 change-shape now depends on a correct working-tree-vs-base diff. If a play
  runs on a tree that already carries unrelated uncommitted model edits, the shape can
  be polluted; plays assume a clean model tree at entry.

**Neutral**

- STM keeps its non-model role (evidence, checkpoint records, context) per ADR 008/017;
  only the `draft/product-os/` model copy leaves it.
