# Self-Review — Issue #546

Rules source: `/Users/kapilahuja/.garura/core/memory/standards/rules/self-review.md` (base, `is_override: false` — no project override in force; see `resolved-rules.json`).

Branch: `feature/546-install-full-scope-excludes-meta-plays` vs `main` (4 commits ahead, tree clean, not yet pushed).

## Scope checks

- **Matches the issue.** PASS. Issue #546 is: `full` install scope ships garura's four meta harness plays (play-creator, play-editor, install-garura, uninstall-garura) into every target project, when it shouldn't. The diff adds `META_PLAYS` and `resolve_scope()` to `install.py` so `full` is computed at run time as "every play on disk minus `META_PLAYS`", teaches both host adapters (`claude.py`, `codex.py`) to treat a per-kind `None` inside the `allow` dict as "install every component of that kind" (needed because `resolve_scope()` now leaves `skills`/`agents` unfiltered but gives `plays` an explicit set), and updates `SKILL.md` prose plus adds the required `#546` direct-edit deviation note. This is exactly the fix the issue describes, nothing more.
- **No scope creep.** PASS. Four code/doc files touched, all inside `core/components/plays/install-garura/`, all load-bearing for the one fix. The remaining six changed files are STM workspace evidence under `.garura/project/issues/546/context/` — standard pipeline output (issue.json, branch.json, commits.yaml, analysis.yaml, work-description.txt, porcelain.txt), not scope creep.
- **Reasonable size.** PASS. +194/-21 across 4 code-bearing files; small, single-concern, reviewable in one sitting.
- **No stray artifacts.** PASS. No commented-out code, no debug prints, no scratch files. `porcelain.txt` and the other context files are the play's own STM run records, expected by the pipeline, not accidental commits.

## Quality checks

- **Tests present.** REVIEW. No automated test file changed — this repo's install path is verified by scripted end-to-end installs, not a unit-test suite. The author reports (and this reviewer takes as author-verified evidence, not independently re-run): Claude-tool install into a temp dir (4 meta plays absent, 26/30 plays installed), Codex-tool install into a temp dir with isolated `CODEX_HOME` (4 meta plays absent), harness-scope install into a temp dir (play-creator and play-editor still present, 18 skills), and a real install into `~/cto/nagarro/offering-scorer`. That covers both adapters and both scopes. Static review of the code (below) confirms the logic matches those claims. Flagging REVIEW rather than PASS only because this reviewer did not re-execute the installs itself — not because evidence is missing.
- **Commits are clean.** PASS. `ed5417f7 fix(install-garura): exclude meta harness plays from the full install scope (#546)` is the single behavior commit, conventional format, references the issue. The three `chore(stm): record ... (#546)` commits are the pipeline's own evidence commits, also conventional and issue-referenced.
- **No secrets.** PASS. Diff scanned; no credentials, tokens, keys, or `.env`/`.pem` content. `analysis.yaml`'s own SE-5 gate independently confirms the same.
- **Docs in step.** PASS. `SKILL.md` description and the `--scope` help text were both updated to say `full` now means "every component except the meta harness plays," and a `Direct-edit deviation note (#546)` was added per this repo's play-pipeline rule (non-intent surface-prose edit to a compiled play — not an ICE rebuild, correctly handled as a direct edit with a footer).
- **Nothing obviously broken.** PASS, with one non-blocking observation. `resolve_scope()` builds the `plays` allow-set with a raw `set(os.listdir(plays_dir))` — it does not apply the `common.skippable()` filter (dotfiles, `_`-prefixed templates, `.bak` files) that the adapters themselves apply when walking the same directory. This is not a correctness bug: both adapters' `lay_components()` loops check `common.skippable(name)` **before** consulting the `allow` set, so any such junk entry that slipped into the `plays` allow-set would still be filtered out at the point of actual use. It is a minor precision gap (the allow-set can contain names that would never be installed anyway) rather than a functional defect. Not blocking.

## Verdict

**CLEAN.** No blocking findings. One non-blocking observation noted above (the `resolve_scope()` listdir not pre-filtering skippable names) — it does not change behavior because the adapters re-check `skippable()` independently, so it is left as-is rather than requested as a fix.
