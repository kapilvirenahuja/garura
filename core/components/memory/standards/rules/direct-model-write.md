# Direct Model Write

Canonical contract for how a model-writing play changes the product model. It is the
single source of truth for all thirteen model-writing plays (vision, understand, shape,
grill, measure, roadmap, arch, ux, quality, agentic, run, marketing, learn) and for the
`/play-editor` compiler, so a hand edit and a recompile converge on the same shape.

Authority: ADR 026. This rule is the mechanical expression of that decision.

## The rule in one line

A model-writing play edits the real product model in place on the feature branch. There
is no `draft/` model copy and no `apply_<play>.py` promotion step. Review is the branch
git diff and the end-sequence PR.

## What every model-writing play does

1. **Write target is the live model.** All model writes go to
   `{product.base-path}product-os/` directly — the spine `_spine.yaml`, the grounding
   docs, `profile.yaml`, and `decisions/`. The enrichment/build skill that a play
   invokes writes its docs straight to the live tree. There is no `<working>/draft/`
   and no `<working>/draft/product-os/`.

2. **STM holds no model copy.** Short-term memory keeps only its non-model artifacts
   (evidence, checkpoint records, context, routing, roll-up reports) per ADR 008/017.
   The `draft/product-os/` tree is gone from STM entirely.

3. **The LLM writes only per-node doc files; a keyed script owns every shared file.**
   This is the containment split, and it is mandatory. The enrichment/build skill (the
   LLM) writes ONLY per-node grounding docs — `capability.md`, `functionality.md`, and
   the like — each its own file, straight to the live tree. It does **not** write any
   shared model file. Every mutation of a shared file — the spine `_spine.yaml`, the
   `profile.yaml`, the `decisions/` — is performed by the play's deterministic keyed
   script, in place on the live model, reading the skill's manifest (an STM,
   non-model artifact) for what to apply. That script keeps the node-level key the old
   `apply_<play>.py` had (e.g. `--capability-ref`) and refuses to touch any node outside
   it inside the shared file. Because the LLM never writes a shared file, the file-level
   scoped guard (step 4) is sufficient: the LLM's blast radius is confined to separate
   doc files, and node-level containment inside the shared spine/profile is preserved by
   the keyed script — not by the guard.

   Migration consequence: this is not a path re-point. Any enrich/build skill that today
   writes a draft `_spine.yaml` delta must stop writing the spine and instead emit that
   delta as **structured data in its manifest** — the same entry fields it already
   computes (the target node's `detail`/`nfr_needs`/`compliance_needs`, the new child
   entries), just written to the manifest (a non-model STM artifact) rather than to a
   draft spine file. The keyed persist script reads the manifest and applies those fields
   to the live spine in place, node-keyed. The old doc-copy step and the before/after
   verify (`check_apply.py`) are removed.

4. **Containment is a post-write scoped guard.** After the writes and before the
   checkpoint, the play runs the shared scoped-write guard (below). It fails the run if
   any model path was changed outside the run's declared write scope, and on
   `--restore` reverts the out-of-scope paths. This carries forward the guarantee that
   `apply_<play>.py --capability-ref` enforced by construction — now enforced as
   detect-and-revert at the run boundary.

5. **Change-shape reads the working-tree diff.** The conditional-gate classifier
   (`classify_change.py`, #467) derives its change-shape from the working-tree git diff
   of the model paths (dirty tree vs `HEAD`) instead of a draft-vs-live directory
   comparison. Its axes and shape keys are unchanged, so the learned gate policy and
   ledger keep working.

6. **Checkpoint cancel reverts the working tree.** When the human rejects the
   checkpoint, the play runs `git restore` over the model paths and `git clean` over
   new model files — cancel means "revert what was written," not "nothing was written."
   Approve means proceed; the writes are already on disk and are what the PR will carry.

7. **Clean model tree in, committed model delta out.** `--base-ref HEAD` is only a
   correct "what this play changed" reference if the model tree is clean when the play
   starts. So:

   - **Entry (pre-flight, hard):** assert the product-os tree is clean
     (`git status --porcelain -- <product_base>product-os` is empty). If it is dirty,
     the play halts — it will not classify against, guard against, or revert a tree that
     already carries someone else's uncommitted model edits.
   - **Persist (after checkpoint approval):** the play commits its own model delta on the
     branch — `feat(model): <what changed> (#<issue>)` — scoped to the product-os paths
     it wrote. This is a lightweight persist step, NOT the Standard Play Close ceremony: a
     middle play (understand, shape) that injects no close still makes this commit. The
     writes were already on disk; the commit makes them durable and advances `HEAD` so the
     next play in the pipeline sees a clean tree and a correct base. (Mirrors start-change
     committing its own STM context, C7.) A rejected checkpoint commits nothing — the tree
     was already restored in step 6.

   This makes the strategy pipeline (vision → understand → shape … on one branch) safe:
   each play enters clean, writes its delta, and commits it, so no play ever sees or
   reverts another play's work. `commit-change` at the end of the pipeline handles only
   what remains uncommitted (STM evidence, ADRs), not the model deltas the plays already
   committed.

## The shared scoped-write guard

Canonical script: `play-creator/references/scoped_write_guard.py`, stamped into each
model-writing play's `scripts/` (same convention as `preflight.py`, `session_stamp.py`,
`classify_change.py`). `/play-creator` emits it so direct edits and rebuilds converge.

Interface (ratified by the /understand reference implementation, issue #498):

```
python3 scripts/scoped_write_guard.py \
    --product-base <product_base> \
    --base-ref HEAD \
    --allow <glob> [--allow <glob> ...] \        # paths this run MAY change
    [--add-only <glob> ...] \                    # paths that may be ADDED but not modified
    [--restore] \                                # revert violations instead of only reporting
    [--out <report.json>]
```

Behavior:

- Compute the set of model paths changed vs `--base-ref` (tracked modifications +
  untracked additions) under `<product_base>product-os/`.
- A path is **in scope** iff it matches an `--allow` glob; a path matching an
  `--add-only` glob is in scope only when it is a new file (added), and a violation
  when it is a modification of an existing file.
- Without `--restore`: exit non-zero and list every out-of-scope path (the play halts).
- With `--restore`: `git restore` each out-of-scope tracked path and remove each
  out-of-scope untracked file, then exit zero (the checkpoint-cancel path reuses this to
  revert the whole model change by passing an empty allow set).

Each play declares its own `--allow`/`--add-only` scope — that is the per-play policy the
old `apply_<play>.py` encoded (e.g. understand: the target capability's docs +
`_spine.yaml` + `profile.yaml` + its decisions; vision: `--add-only` over grounding docs
so it never overwrites an existing one). The guard is the shared mechanism; the scope is
the play's.

## classify_change git mode

`classify_change.py` gains a git-diff source and keeps its axis math untouched:

```
python3 scripts/classify_change.py --play <play> \
    --product-base <product_base> --base-ref HEAD [--out shape.json]
```

It builds the `(path, old_lines, new_lines)` pairs from the working-tree diff — `new` is
the current file, `old` is the file at `--base-ref` (empty for an added file) — and feeds
them through the existing `classify_pair` logic. The `--draft`/`--live` directory mode is
removed.

Note on shape keys: git mode diffs the **full** new spine against the **full** old spine,
whereas the old draft mode diffed a **partial** draft-delta spine against the full live
spine, so the two modes need not produce identical shape keys. This is not a relearning
risk here: `.garura/core/gate-policy.yaml` and `gate-evals.jsonl` are absent — no #467
policy has been learned yet — so the ledger simply starts accumulating under git mode.
Any repo that HAS learned a policy before this migration must reset it (the shape keys it
learned against no longer map), which is a one-time note, not per-play work.

## Lint anchors (converge-and-lint)

`lint-components` fails a model-writing play when any of these hold, so a stale draft
pattern cannot survive a rebuild or a hand edit:

- L-DMW-1: the play's `SKILL.md` or scripts reference a `draft/product-os`,
  `draft_dir`, `apply-manifest`, or an `apply_<play>.py`/`check_apply.py` write path.
- L-DMW-2: the play invokes `classify_change.py` with `--draft`/`--live` instead of
  `--product-base`/`--base-ref`.
- L-DMW-3: the play has a checkpoint but bundles no `scoped_write_guard.py`, or its
  checkpoint step does not run the guard before the gate and a restore on cancel.
- L-DMW-4: the play does not assert a clean product-os tree at pre-flight, or has no
  model-delta commit at close.
- L-DMW-5: the play's enrichment/build skill is described as writing a shared model file
  (`_spine.yaml`, `profile.yaml`, `decisions/`) — shared files are written only by the
  play's deterministic keyed script.

## Why this is an intent change

Removing the draft alters the write path, the containment guarantee, and the
checkpoint's cancel semantics — all things a play *decides or guarantees*. Per the play
pipeline boundary rule this is an intent change: edit each play's `reference/ice.md` and
recompile with `/play-editor`. The shared close/guard scaffolding (this rule, the guard
script) is the converge-and-lint layer beneath that, mirroring `play-close.md`.
