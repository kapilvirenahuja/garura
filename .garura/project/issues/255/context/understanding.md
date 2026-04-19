# Context Understanding — Issue #255
## Configurable Evidence Recording (commit-code only)

**Source of truth for design decisions:** `.garura/project/issues/255/evidence/enhance/discovery.md`
**Note:** The issue body proposes all-play scope and uses `evidence.commit`. The discovery.md (conversation-resolved design) narrows scope to commit-code only and uses `evidence.record`. This document follows discovery.md.

---

## 1. Config.yaml — Current Structure and Where `evidence.record` Fits

**File:** `.garura/core/config.yaml`

Current top-level sections (in order):
- `project` — name and type
- `platform` — github
- `github` — repo URL
- `components` — source-of-truth paths for skills, plays, agents, memory
- `claude` / `global-claude` / `factory` / `global-factory` — sync target paths
- `ltm` — long-term memory source and deployment targets
- `stm` — base-path, pending-path, archive-path, structure templates (lines 49–58)
- `standards` — per-play standards references (line 62–63)
- `review-pr` — play-specific configuration: bypass, confidence_threshold, reviewer_count, etc. (lines 65–70)
- `product` — product artifact paths (lines 90–99)

**Where to add `evidence.record`:**

Insert a new top-level `evidence` section after the `review-pr` block and before the `product` section comment (after line 70). This follows the `review-pr` pattern: a named behavioral-configuration section at the top level.

```yaml
# Evidence recording — when false, non-essential STM artifacts in commit-code are skipped
evidence:
  record: true
```

Default `true` is required: existing behavior must be unchanged unless explicitly set to `false`.

**Contrast with issue body:** The issue body used key `evidence.commit`. The discovery.md resolution uses `evidence.record`. Use `evidence.record`.

---

## 2. create-commit Skill — Full Current Content and What It Writes

**File:** `core/components/skills/create-commit/SKILL.md`

The skill is model-invocable only (not user-invocable), runs on haiku. Three process steps:

1. **Stage Files** — `git add` for explicitly provided files only. Never `git add .` or `git add -A`.
2. **Create Commit** — conventional commit message: `type(scope): subject\n\nbody\n\nIssue: #N`
3. **Get Hash** — `git rev-parse --short HEAD`

**Output:** Returns using template `templates/commit-output.md` — an in-context markdown response to the calling agent. The template contains: Success (true/false), Hash, Full Hash, Type, Scope, Subject, Issue, Files Committed, Full Message.

**The create-commit skill does NOT write files to disk.** The template response is returned to the calling agent (repo-orchestrator), which then writes the aggregate commit record (`commits.yaml`) to STM via write-evidence.

**commit-code Step 5 contract shows this clearly:**
```json
"output": {
  "commit_record": "{stm_base}/{issue}/evidence/commit-code/commits.yaml"
}
```

The `commits.yaml` file is written by `repo-orchestrator` accumulating create-commit responses, not by create-commit directly.

**What must change for issue #255:**

Per discovery.md, the flag check lives in `create-commit` skill before writing output (commits.yaml). Since create-commit itself doesn't write commits.yaml, the practical interpretation is: the skill should add a flag check step and, when `evidence.record: false`, return a signal to the caller to skip the write-evidence call for commits.yaml. The most direct implementation is adding a process step to the skill:

```
4. Check evidence flag
   Read evidence.record from .garura/core/config.yaml.
   If false: do not signal write-evidence for commits.yaml. Return commit output only.
   If true (or absent): proceed normally — caller writes commits.yaml to STM.
```

**Edit path for create-commit SKILL.md:** Direct edit. Skills do not have `reference/intent.yaml` and are not compiled via `/create-play`. Direct SKILL.md edits are correct for skills.

---

## 3. commit-code Play — Evidence & Close Phase

**File:** `core/components/plays/commit-code/SKILL.md`

### Phase: Evidence & Close (Step 8)

Full text of Step 8:
```
Step 8 — Write Evidence
Owner: play
Depends on: Step 7

Write evidence to `{stm_base}/{issue}/evidence/commit-code/{YYYYMMDD-HHMMSS}.md`.
Present summary to user.

Invoke `repo-orchestrator` to self-commit evidence files (ADR 012). Non-blocking on failure.
```

### What gets written in commit-code and when

**Always written (never skipped — required for play to function):**
- `analysis.yaml` — `{stm_base}/{issue}/evidence/commit-code/analysis.yaml` (Step 1, via repo-orchestrator)
- `issue-mappings.yaml` — `{stm_base}/{issue}/evidence/commit-code/issue-mappings.yaml` (Step 2, via project-orchestrator)

**Skippable when `evidence.record: false`:**
- `commits.yaml` — `{stm_base}/{issue}/evidence/commit-code/commits.yaml` (Step 5, written by repo-orchestrator accumulating create-commit responses)
- `{YYYYMMDD-HHMMSS}.md` — delivery record (Step 8, written directly by play)
- `commit-code.json` — status file at `{stm_base}/{issue}/status/commit-code.json` (written throughout, final write in Step 8)

### What must change in commit-code Step 8

When `evidence.record: false`:
1. Skip writing the delivery record (`{YYYYMMDD-HHMMSS}.md`)
2. Skip writing the status file (`commit-code.json`)
3. Skip invoking `repo-orchestrator` for evidence self-commit (no files to commit)
4. Still present summary to user (always)

When `evidence.record: true` (or absent): current behavior is unchanged.

**Flag read pattern (follows pre-flight bash convention already in commit-code):**
```bash
evidence_record=$(yq '.evidence.record // true' .garura/core/config.yaml)
```
Or without yq:
```bash
evidence_record=$(grep -A1 '^evidence:' .garura/core/config.yaml | grep 'record:' | awk '{print $2}')
evidence_record=${evidence_record:-true}
```

---

## 4. commit-code Intent.yaml — Edit Path

**File:** `core/components/plays/commit-code/reference/intent.yaml` — **EXISTS**

The commit-code SKILL.md header states explicitly:
```
## Compiled From
This play was compiled from `reference/intent.yaml` by `/create-play`.
To modify this play, update intent.yaml and re-run `/create-play --build commit-code`.
Do NOT edit this file manually — it is a compiled artifact.
```

**Per CLAUDE.md and this header: SKILL.md must NOT be edited directly.**

Current constraints in intent.yaml: C1 through C9.
- C8 covers evidence artifact delegation to scriber agent
- The new constraint for `evidence.record` flag belongs as `C10`

**Correct edit path for commit-code:**
1. Add `C10` to `core/components/plays/commit-code/reference/intent.yaml` describing the evidence flag behavior
2. Run `/create-play --build commit-code` to recompile SKILL.md from the updated intent

**Contrast with create-commit:** `create-commit` is a skill with no `reference/intent.yaml`. Skills are directly editable. Plays compiled from intent.yaml are not.

---

## 5. Grounding Directory Structure

**Current `core/grounding/` contents:**
```
core/grounding/
└── glossary.md
```

`core/grounding/rules/` does NOT exist. It must be created with the first file.

**After this issue:**
```
core/grounding/
├── glossary.md          — existing (canonical Meridian concept definitions)
└── rules/
    └── evidence.md      — new (behavioral rule: evidence recording policy)
```

**Nature of `core/grounding/`** (from glossary.md):
> "A directory in the Meridian repository for self-development documents — artifacts used by agents working on Meridian itself, not deployed with the runtime. Distinct from `core/components/` (deployable components) and `docs/` (external reader documentation). First populated by this glossary."

Files in `core/grounding/` are **NOT** deployed by `/sync-claude` or `/sync-droids`. They stay in the repo as self-development references only.

**Note on sync behavior:** The existing understanding.md (prior run) claims `core/grounding/` deploys to `~/.garura/core/memory/`. This contradicts the glossary's explicit anti-definition: "Files in `core/grounding/` are NOT deployed by `/sync-claude` or `/sync-droids`." The glossary is authoritative. No sync step is needed for `evidence.md`.

**What `core/grounding/rules/evidence.md` should document:**
- The `evidence.record` flag and its location (`.garura/core/config.yaml`)
- What it controls: non-essential STM artifact writes in commit-code play and create-commit skill
- Which artifacts are skipped when false: `commits.yaml`, delivery record `.md`, status file `.json`
- Which artifacts are never skipped: `analysis.yaml`, `issue-mappings.yaml`
- How plays read the flag (config key: `evidence.record`, default `true`)
- Scope: commit-code is the prototype; other plays addressed in separate issues

---

## 6. Integration Points and Conventions

### Config key convention

`review-pr:` is the direct precedent — a named top-level section with behavioral configuration for plays. `evidence:` follows the same pattern with a single `record` subkey (boolean).

### Scope is surgical — commit-code only

Discovery.md explicitly states: "commit-code as the first play. Other plays follow in separate issues." The prior understanding.md in this file listed 16+ plays to modify. That scope is WRONG for this issue. Only commit-code and create-commit are in scope.

### ADR 012 and evidence self-commit

When `evidence.record: false`:
- No STM files are written in Step 8 (delivery record, status file skipped)
- The `repo-orchestrator` self-commit invocation is also skipped (nothing to commit)
- This is intentional behavior, not a failure — no warning or log entry needed

### Pause/Resume interaction

The status file (`commit-code.json`) enables Pause/Resume. When `evidence.record: false`, the status file is not written and Pause/Resume is implicitly disabled for that run. Discovery.md does not call out special handling — skip is the complete behavior. This is acceptable for the development/speed use case.

### Summary of edit workflow

| Component | Edit Path | Notes |
|-----------|-----------|-------|
| `.garura/core/config.yaml` | Direct edit | Add `evidence:\n  record: true` after `review-pr` block |
| `core/grounding/rules/evidence.md` | Create new file + new directory | Not deployed via /sync-claude |
| `core/components/skills/create-commit/SKILL.md` | Direct edit | Add flag check to Process section |
| `core/components/plays/commit-code/reference/intent.yaml` | Edit intent — add C10 | Required before recompiling |
| `core/components/plays/commit-code/SKILL.md` | Recompile via `/create-play --build commit-code` | After intent edit; never edit directly |

---

## 7. Key Facts Summary

| Question | Answer |
|----------|--------|
| Flag key name | `evidence.record` (not `evidence.commit`) |
| Where does flag live? | `.garura/core/config.yaml`, new `evidence:` top-level section |
| Default value | `true` (backward compatible) |
| Scope of this issue | commit-code play + create-commit skill only |
| What does create-commit write? | In-context commit-output.md template response; commits.yaml is written by repo-orchestrator |
| Is create-commit SKILL.md directly editable? | Yes — skills have no intent.yaml compilation pipeline |
| Is commit-code SKILL.md directly editable? | No — compiled artifact; must update intent.yaml → /create-play --build |
| Does commit-code reference/intent.yaml exist? | Yes — at `core/components/plays/commit-code/reference/intent.yaml` |
| Next constraint ID to add in commit-code intent | C10 (current range is C1–C9) |
| Does `core/grounding/rules/` exist? | No — must be created |
| Does `core/grounding/` deploy via /sync-claude? | No — self-development docs only, not deployed |
| What artifacts are NEVER skipped? | `analysis.yaml` and `issue-mappings.yaml` |
| What artifacts ARE skipped when flag=false? | `commits.yaml`, delivery record `.md`, status file `.json` |
| Where does flag check live in commit-code? | Step 8 Evidence & Close, before writing delivery record and status file |
| Where does flag check live in create-commit? | After step 3 (Get Hash), before signaling commits.yaml write |
