# #434 — Phase D + delivery-pipeline plays — progress

Status as of this session. Source of plan: `specs/realignment-plan.md`.

## Done

### Compiler consolidation (prereq)
- Deleted garura's old `create-play` play.
- Brought the sudarshan harness `create-play`/`edit-play` into garura as
  **play-creator** / **play-editor** (garura-native; sud framing stripped).
- Swept live references (CLAUDE.md, standards, glossary) create-play → play-creator.
- Deployed play-creator to `.claude/skills/` (frontmatter normalized: flat description,
  no `model:` line).

### D1 — Evidence rule
- `standards/rules/evidence-recording.md` — evidence is play-only (never agents/skills);
  fires on `evidence.record`; tunable per play via `evidence.plays.<name>`.
- `play-close.md` updated to resolve the per-play + global flag (mechanism).
- No compiler change needed — plays emit evidence via the referenced Standard Play Close.

### D2 — Pipeline-position rule
- `standards/rules/pipeline-position.md` — a play declares `position: start | end | both |
  none`. start → inject `start-change`; end → inject the sequence
  `commit-change → propose-change → review-change → merge-change`; both → bracket; none →
  nothing. Members are exempt from self-injection. Explicit named sub-play steps.
- play-creator taught it (step **4b** + hard rule + required-section note).

### Delivery-pipeline plays (built via play-creator, all lint-clean)
- **start-change** (position start) — issue + branch + optional worktree + STM.
- **commit-change** (position end, 1st) — commit grouped by concern, no push.
- **propose-change** (position end, 2nd) — self-review (from `standards/rules/self-review.md`,
  overrideable per project) + push + open PR.
- **review-change** (position end, 3rd) — diff-scoped review, severity taxonomy,
  approve/reject verdict posted to PR. Supersedes review-pr.
- **merge-change** (position end, 4th) — merge + sync main + delete branch.
- Each reuses existing skills; each carries the Standard Play Close (D1) and a `position`
  frontmatter field (D2).

### Lint enforcement
- `lint_play.py` gained D1 (Standard Play Close anchors) and D2 (valid `position`
  frontmatter) checks. Synced to play-creator (source + deployed) and play-editor.

### Retired
- Deleted plays: start-feature, review-pr, merge-pr (play), ship, commit-code (source +
  deployed).
- Kept worker skills: submit-pr, merge-pr (skill), create-commit, analyze-changes,
  resolve-issues, manage-issue — reused by the new plays.

## Harness-led scripting sweep (post-Phase-D audit)

Audited the five plays for "mechanical work → called script." Result, layer-correct:
- **Durable home:** play-creator step 3 now mandates the discipline with two hard rules —
  (1) a script computes/asserts over already-captured state, NEVER shells out to git/gh
  (live VCS/host work stays in skills via agents); (2) deterministic logic (thresholds,
  precedence, table classification, counts) is a script, never an LLM agent. So rebuilds
  reproduce it and Phase E inherits it.
- **New pure scripts:** `propose-change/scripts/resolve_standard.py` (standards-file
  precedence) and `review-change/scripts/compute_verdict.py` (verdict over the
  already-classified findings). Both smoke-tested. `start-change/scripts/init_stm.py`
  already covered its mechanical bit.
- **Reuse found:** `quality-check-scoped` already resolves standards and classifies by the
  no-LLM `pr.md` taxonomy — so review-change's redundant re-classify step and its
  `tech-designer` agent were dropped (domain agents 2 → 1; verdict now a script).
- **Left in the worker layer (correct, not a gap):** checks needing live git/gh state
  (HEAD==remote, open-PR count, worktree presence, branch base) stay with the skill/agent
  that captures the state — not bolted into a script.
- Fingerprints unchanged (no `ice.md` edits); all five still lint PASS. Direct-edit
  deviation notes added to propose-change and review-change.

## Config
- `start-change.worktree: false` (default) added to `.garura/core/config.yaml`.
- New standards: `self-review.md` (base, overrideable).

## Phase E started — first consumer play

- **create-pr** (old play) — **retired** (deleted source + both deployed copies). Superseded
  by propose-change. The `create-pr` *verb* in platform-adapter/submit-pr is unrelated and
  stays.
- **fix-it** (old play) — **rebuilt as `fix-bug`** (Phase E11, the `/fix` command; user chose
  the name `fix-bug`, a divergence from the plan's `/fix` label). First **consumer** play of
  the D2 pipeline (`position: both`): start-change injected at the head; commit-change →
  propose-change → review-change → merge-change as the closing chain. The play now owns only
  its defect-resolution core (validate-open → RCA & design + failing regression test →
  inline checkpoint → implement → independent verify, retry cap 2). Dropped from the old
  intent: branch creation, the `ship` sub-play, partial-ship failure — all now pipeline-owned.
  Source: `core/components/plays/fix-bug/` (ice.md + SKILL.md + scripts/check_scope.py).
  Lint PASS; check_scope.py smoke-tested. Old fix-it folder deleted.

## Build/meta plays brought into garura (self-hosting)

- **install-garura** + **uninstall-garura** — ported from the sudarshan harness
  (`Sudarshan/chakra/harness/src/skills/sud-{install,uninstall}`) into
  `core/components/plays/{install-garura,uninstall-garura}/` as bootstrap meta-plays (like
  play-creator/play-editor: hand-authored SKILL.md + bundled script, no ice.md). Sud framing
  stripped: dropped the `modules/` submodule indirection, `--modules`, the recipe registry;
  source is now the garura checkout itself. install copies garura's core/components into a
  target's `.claude/` (skills + plays + agents) + `.garura/` (config + STM scaffold), shared
  memory to `--memory-dest` (default `~/.garura/core/memory`). Two correctness adds over the
  sud original: (1) `--memory-dest` override so tests never touch the real machine KB; (2)
  frontmatter normalize on deploy — strips the `model:` sentinel (132 source files carry it;
  Claude Code can't read `model: best`). uninstall is manifest-driven, preserves STM + shared
  memory unless `--purge`. The sud-install SKILL.md prose describes an adapter the script does
  not use — ignored; the script is ground truth. Full round-trip tested 2026-06-09 (install →
  verify → default uninstall preserving STM → re-install → `--purge` against a temp memory
  dir; real `~/.garura/core/memory` untouched).
- This confirms the #434 direction: build/meta plays are garura-NATIVE, not `/sud:`-owned.

## Pre-flight resolver — harness-led (2026-06-09)

Closed a harness-led gap: the member plays resolved pre-flight (config tokens, branch, issue,
evidence flag, changeset, on-default-branch) by orchestrator inference instead of a script.

- **Canonical resolver** `play-creator/references/preflight.py` — dependency-free
  (indent-aware config parse, no PyYAML), pure: the orchestrator passes the two live reads
  (`git branch --show-current`, `git status --porcelain`) in; the script never shells to
  git/gh (layer rule). Emits one JSON of facts. Fixture-tested (nested `evidence.plays.<name>`
  override, `<play>.worktree`, issue regex, default-branch/changes flags).
- **Facts vs policy split:** the script returns facts; each play's Pre-flight **table keeps
  the halt policy** (same fact, opposite action across plays — e.g. `changes_present==false`
  is a graceful exit for commit-change but a clean-tree precondition for propose-change).
- **play-creator taught it:** step 4 + a hard rule + the step-6 output note now require
  stamping `scripts/preflight.py` (copied from `references/preflight.py`) and wiring
  Pre-flight to call it. `lint_play.py` gained a non-breaking check (if a SKILL references
  `scripts/preflight.py`, the file must exist); synced to play-editor's copy.
- **Back-filled all 5 member plays** by direct edit (recompile would clobber propose/review's
  sweep scripts): preflight.py bundled in each `scripts/`, Pre-flight wired, deviation notes
  added, metadata script-counts bumped. All 5 lint PASS; each bundled resolver runs.
- Redeployed the changed plays (play-creator, play-editor, and the 5 member plays) into
  local `.claude/` with frontmatter normalized.

## Open / follow-ups
- **Local deployable surface (`.claude/`) trimmed 2026-06-09.** `.claude/skills/` now holds
  exactly the build/meta plays (play-creator, play-editor, install-garura, uninstall-garura)
  + the 5 orchestration plays (start-change, commit-change, propose-change, review-change,
  merge-change) + the 10 helper skills those orchestration plays call (analyze-changes,
  analyze-pr, create-commit, manage-issue, merge-pr, platform-adapter, quality-check-scoped,
  resolve-issues, setup-branch, submit-pr). `.claude/agents/` trimmed to the 3 those plays
  use (project-orchestrator, repo-orchestrator, quality-auditor). `model:` sentinel stripped
  on deploy. `.claude/` is gitignored (ephemeral, machine-local) — not committed.
- **fix-bug is intentionally NOT in the local deployable set** — the garura repo's runnable
  surface is the build + orchestration plays only; consumer plays like fix-bug deploy into a
  product via install-garura, not here.
- The reused worker skills (draft-rca, draft-fix-design, author-regression-test) still say
  "the fix-it play" in their description/prose — stale now that fix-it is fix-bug. Paths flow
  through the contract so function is unaffected; prose cleanup pending.
- **ship** deleted — its post-merge **distill** (learning) trigger is now orphaned; rewire
  into merge-change or the future /learn play.
- **ship** also referenced review-pr only in its bypass=false path (now gone); n/a while
  `review-pr.bypass: true`.
- Phase E status moved to its own section below (audited 2026-06-09).

## Phase E — ProductOS command plays (audited 2026-06-09)

The model is 21 commands (was 20 before the 2026-06-09 maintenance reshape; /operate
dropped, /enhance + /find-drift added — see realignment-plan decision 17). Two groups are complete; strategy + realization are partway;
maintenance/navigation barely started. Build state below is by what is actually on disk
(a new ProductOS play = compiled `SKILL.md` + `reference/ice.md` + `scripts/`). The
`/realize` command (old E6) is superseded by the five-lens split locked in
`realize-split-design.md`: build order `quality → ux → agentic → arch → run`.

### Built (14 command plays)
- **Git / delivery pipeline (E16–E20) — DONE, this was Phase D.** start-change (/start),
  commit-change (commit-code), propose-change (/raise), review-change (/review),
  merge-change (/merge). All five compiled, lint PASS, deployed.
- **Strategy (E1–E4) — DONE.** vision (43b1545), understand (43b1545), shape (7f43545),
  roadmap (6d8064f). E5 /learn NOT built.
- **Realization lenses — ALL 5 of 5 DONE and SLICE-SCOPED.** quality, ux, agentic, arch, run.
  quality/ux/agentic built and reworked to a **slice**; arch rebuilt onto the slice (90c451a);
  run built KB-grounded with the lines-up + stamp duties (see the /run section below). All lint
  PASS; apply round-trip green. (KB grounding is wired on /run now; arch/ux/agentic retrofit is
  the tracked follow-up below.)
- **Maintenance E11 /fix — DONE** as fix-bug (Phase E11 section above). First consumer play
  of the D2 pipeline.
- **Realization E7 /grill — DONE (2026-06-11).** Cuts ONE realized slice (the /run stamp is
  the gate) into user-testable epics — the grain is user-testability (`user_check`: open, do,
  verify), NOT the functionality; epic schema reshaped to v2 (slice-level home
  `{domain}/slices/{slice-id}/epics/`, `functionality_refs` plural, `user_check`, `order`,
  deferrals.yaml). Steelman grilling rounds with cited push-back (check-cut-tensions skill —
  every tension cites source + verbatim quote; zero live tensions gate the write); lens
  defects routed back to their lens play, never patched. position none; 1 domain agent
  (product-os-keeper) + 2 new skills (author-epics, check-cut-tensions); 6 scripts
  (preflight, check_ready_slice [byte-identical reuse], check_realized, validate_epics,
  apply_epics [all-or-none, refuses to clobber in_delivery epics], check_epics). Lint PASS
  (10 gates); full smoke round-trip green (happy path + every guard fires). **grill-me
  RETIRED** (deleted): play + check-grill-tensions + resolve-grill-anchor +
  apply-shape-changes skills + grill-anchor-resolver + shape-applier agents — all were
  grill-me-exclusive (verified by sweep). product-os-keeper registered the two new skills.
  Same session: kb-search + author-run-lens (the /run + retrofit gap) also registered in
  product-os-keeper's tables — the agent file is current again.
- **Codex adapter hardened + installer rename (2026-06-11, found deploying to
  token-burn-dash).** Codex HARD-CAPS skill `description` at 1024 chars and silently
  refuses to load past it — /run (grew past the cap with #435's TCO change) and /grill
  (the two longest) were the only skills Codex would not load. Fix lives in the ADAPTER
  (its job: absorb tool differences): `_cap_description` truncates at a word boundary on
  emit; documented as Codex difference #4 in codex.py's header. Second adapter bug fixed:
  `frontmatter_value` stripped quotes without unescaping `''`, so re-quoting doubled every
  apostrophe (corrupt text + inflated length). Both smoke-tested. Also converged the
  naming drift: source play `sud-install-garura` → **install-garura** (folder, frontmatter
  name, manifest `installer` string, prose; uninstall never matches on the string — safe);
  garura's own `.claude/skills/install-garura` redeployed from the renamed source (was a
  stale pre-adapter copy with no `--tool`). token-burn-dash re-installed for codex: all 67
  skills ≤1024 + clean YAML (grill 1018, run 1020); the 6 stale grill-me leftovers from
  the prior install deleted (installer lays down, never retires — diffed disk vs fresh
  manifest).
- **/grill hardened against forged grilling (#436, P1, 2026-06-11).** The write-gate
  accepted agent-self-resolved tensions — citations + no-live was checkable, the human
  loop was not. Fixed intent-first via play-editor (C12/C13, F11/F12, S7/S8, REC11/12;
  fingerprint recomputed): a tension closes ONLY on a typed human answer, and the round
  record proves it (pushback.shown_to_human + text, human_response in the human's words,
  human-derived resolution_directive / resolution_reason); unresolved delivery-method
  choices that shape an epic become cited `decision_questions` — asked plainly, ONE AT A
  TIME, no recommendations/option menus (Kapil's directive); checkpoint shows the full
  grilling record. Framing added to the ICE: grilling draws the BOX from realized slice
  (A) to epics (B) — declared intents are the box, no drift outside it; where the box has
  no wall, only the human draws one. Enforced in validate_epics.py (regression fixtures:
  forged resolution / unshown push-back / unanswered question all fail; honest record
  passes); check-cut-tensions emits questions separately and NEVER fills the evidence
  fields. Lint PASS.

### Realize reworked: the SLICE is the unit (2026-06-09)
- The realize lenses run **one slice per run**, not one capability — the slice is the
  deliverable; you pick one and run quality → ux → agentic → arch → run on it, then ship it.
- Lenses live ON the slice: `{domain}/slices/{slice-id}/lens/{type}.yaml` (+ `decisions/`),
  beside the flat slice record. Shared envelope key is now `slice_ref`. /shape + /roadmap
  untouched (their slice globs don't see the lens subfolder — Option L).
- New shared script `check_ready_slice.py` resolves the slice + every functionality `ice_ref`
  (the hub, may span capabilities) and **fails loud** on an unresolved ref. apply/check work
  on the slice folder unchanged; the slice record is never written (apply allowlist + a `cmp`
  guard).
- **agentic redefined** (how garura thinks about agentic): an `is_agent` gate by how much
  load to offload, then five axes on one **low/medium/high/xhigh/ultra** scale — three
  weights (cognitive/creative/logistical = degree of offload) + two controls (guardrails,
  handoff). No "none" (the gate handles it). Schema `lens/agentic.yaml` rewritten.
- Verified against the live token-burn-dash model (real slice spanning two capabilities).

### Realize lens 5 of 5 — /run — DONE + KB-GROUNDED (2026-06-09)
- **/run built** (`core/components/plays/run/`): SKILL.md + reference/ice.md + 8 scripts; lint
  PASS (all 10 gates); full smoke round-trip green (happy path + every guard fires). The five
  realize lenses are now complete: quality → ux → agentic → arch → run.
- **Two duties beyond the arch template, both verified:**
  - **Lines-up gate** (`check_lines_up.py`, two phases): pre-flight asserts the architecture
    lens is present (run deploys arch's parts — hard halt if absent); the gate asserts all five
    lens files exist + every arch component has a run target + no dangling target.
  - **The done stamp** — /run is the ONE realize lens that writes the slice record. On lines-up
    it flips `slice.status → realized` (surgical writer `stamp_slice.py`; only status+metadata;
    `check_run.py` semantic-compares composition). Schema touches: `slice.yaml` status gains
    `realized` (proposed → planned → realized) + a `/run` fill-rule; `lens/run.yaml` gains a
    per-component `targets` block (the seam to arch, so "every part has a run target" is
    checkable).
- **KB grounding wired (the big change this session, at Kapil's direction).** The realize
  lenses must ground choices in the KB — what works for us, not LLM taste — the way /vision
  does. /run grounds every operational choice (rollout/migration/environment/cicd/runtime + each
  target) in a best-fit `architecture/` or `technology/` learning via the **kb-search** skill
  (un-deprecated this session — it is the condition-search engine over those two shelves, distinct
  from `search-kb`/`kb.py` which only routes to a domain). Uncovered choices become recorded
  `propose-kb-node` gaps; `grounding_check.py` fails the run on anything ungrounded. No new KB
  shelves: architecture + technology serve run, ux, agentic, and arch (Kapil's call).
- **author-run-lens** skill added (models author-architecture-lens; reads hub + arch lens + KB;
  calls kb-search + propose-kb-node).

### Retrofit KB grounding onto arch / ux / agentic — DONE (2026-06-09)
All three already-built lenses now ground their PATTERN choices in the KB, the way /run and
/vision do — search the architecture/technology shelves via kb-search, ground each choice in a
matched learning, record a KB-learning-gap proposal for anything uncovered, and enforce with a
shared `check_kb_grounding.py` (byte-identical across all three plays). Intent-first: each
play's `reference/ice.md` gained a KB-grounding constraint + failure + recovery + scenario, the
SKILL was recompiled (new Draft KB-search step, a Grounding-check step, agent boundary +=
kb-search, fingerprint recomputed), and each author skill (author-architecture-lens / -ux-lens /
-agentic-lens) gained a KB-search step + a `choices` manifest block. All three lint PASS;
fingerprints match ice.md; grounding script smoke-tested.

What grounds in the KB, per lens (the product-specific content stays ICE-grounded as before):
- **arch** — the system-level shape (monolith/microservices/...) + each material tech pick.
- **ux** — the visual core (palette + typography), the navigation pattern, the responsive
  strategy. Screens stay ICE-grounded.
- **agentic** — the control approach (guardrail tightness + handoff cadence), and only on an
  agentic slice; the weights + axis levels stay hub/load-grounded, and an is_agent=false slice
  has no controls so the grounding check is not run.

NOTE: the KB has only architecture/ + technology/ shelves (Kapil's call: these serve all the
realize lenses — no ux/agentic shelves needed). The deprecated `kb-search` skill was
un-deprecated (it is the condition-search engine over those two shelves; distinct from
`search-kb`/`kb.py` which only routes to a domain).

### KB seeded to fill the run / agentic / ux gaps — 2026-06-09
The gap audit (KB was web-product build-time only — nothing on running, agents, or UX patterns)
was closed by seeding 15 learnings (all on the existing architecture/ + technology/ shelves, no
new structure — content growth is the sanctioned "grows over time" path, not a locked-design
change). KB went 21 → 36 learnings; `kb_search.py index` lists all 36; grounding resolves the
new ids. This makes /run, /agentic, /ux genuinely groundable instead of proposal-heavy
(agentic especially — it now matches real learnings).

- **run (1):** `technology/gcp-modular-monolith-runtime` — Kapil's stance: Cloud Run + Cloud SQL
  Postgres, cache only on proven hot paths, secure-by-default (private DB, Secret Manager, least
  privilege, locked ingress), gradual rollout + expand-contract migrations.
- **agentic (8), on Bedrock + GCP/Vertex (Kapil's platforms):**
  - build — `technology/agent-building-blocks`, `architecture/agent-orchestration-patterns`,
    `technology/agent-model-selection`
  - control — `architecture/agent-assistive` → `architecture/agent-supervised-autonomous`
    (autonomy ladder) + `architecture/agentic-guardrails-baseline` (the floor)
  - run — `technology/agent-platform-bedrock-gcp`, `technology/agent-deploy-dev-uat-prod`
    (dev→uat→prod, promotion gated on an EVAL suite not just tests, canary model/prompt changes)
- **ux (6):** `technology/ux-{responsive-default-adaptive-on-evidence, navigation-by-shape,
  accessibility-floor, state-and-feedback, design-system-tokens, forms-and-validation}`.
  responsive-default-adaptive-on-evidence + accessibility-floor encode Kapil's POV; a11y floor
  grounds the profile's a11y NFR.

Provenance on each file records seeded/documented + Kapil/#434. `/learn` (E5, not built) is the
play that will keep these growing from real outcomes.

### Not built (8 command plays remaining)
- **E5 /learn** — also absorbs the orphaned post-merge distill trigger (see ship note above).
- **E9 /implement, E10 /validate** — engineering.
- **E12 /refactor, E13 /enhance, E13b /find-drift** — maintenance.
  - /enhance: extends/changes behavior of an existing slice (slice grain, vs /shape's
    capability grain; vs /refactor which holds behavior).
  - /find-drift: detects drift between implementation and the slice/shape it was built
    from. Build on the existing `core/components/skills/check-drift` skill.
- **E14 /status, E15 /next** — navigation.
- (E8 /groom DROPPED; /operate DROPPED 2026-06-09 — day-to-day running is not a Garura command.)

### Old plays to retire (collision risk)
These carry the old SDLC pipeline, no `ice.md`, old `garura:` namespace — NOT the new
ProductOS plays. Retire each as the new play supersedes it (per realignment-plan: "as each
new play lands, delete the old play(s) it supersedes"):
- `arch` (`garura:arch`) → superseded by realize lens /arch
- `implement` (`garura:implement`) → superseded by E9 /implement
- `validate` (`garura:validate`) → superseded by E10 /validate
- `refactor` (`garura:refactor`) → superseded by E12 /refactor
- ~~`grill-me`~~ → RETIRED 2026-06-11 (superseded by E7 /grill; play + 3 exclusive skills + 2 exclusive agents deleted)
- `define`, `design`, `enhance` (`garura:*`) → old SDLC shaping, superseded by vision/understand/shape
- Also still present from the old pipeline: start-feature-planning, plus the learning plays
  (capture, codify, decode, distill, reap, enrich, craft-ice, algorithm, prepare) — review
  for retirement vs. fold-into-/learn when E5 is built.
