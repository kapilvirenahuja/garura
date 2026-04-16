# Context Understanding — Issue #240
# capture-learning Mode 1: lightweight post-merge learning extraction in ship

Assembled: 2026-04-16  
Intent path: core/components/plays/enhance/reference/intent.yaml  
Issue: #240 — lightweight post-merge learning extraction as non-blocking final step in ship

---

## Relevant Architecture

### Ship Play Structure

**File:** `core/components/plays/ship/SKILL.md`  
**Compiled from:** `core/components/plays/ship/reference/intent.yaml`

Ship is a **Structure C play** — it chains sub-plays in sequence and never invokes agents directly. The orchestrator's role is strictly to chain sub-plays:

| Step | Sub-play | What It Does | Conditional |
|------|----------|--------------|-------------|
| 1 | `commit-code` | Commit all changes grouped by concern, push | always |
| 2 | `create-pr` | Create PR with quality checklist | always |
| 2.5 | `review-pr` | Diff-scoped quality gate; emits confidence + routing | only when `review-pr.bypass == false` |
| 3 | `merge-pr` | Merge PR, switch to main, pull latest, delete branch | always (gated by 2.5 verdict) |
| 4 | Scenario Validation | SCE-1, SCE-2, SCE-3 evals inline | always |
| 5 | Evidence & Close | Write evidence, self-commit | always |

**Key architectural constraint from ship SKILL.md:**
> Forbidden: Direct git commands. Direct gh/glab/bb commands. Direct agent invocations for domain work. All domain work is delegated to sub-plays.

**Design implication for Mode 1:** The fire-and-forget post-merge step cannot be a raw skill invocation from ship's orchestrator. It must be wrapped as a sub-play (`capture-learning-fast`) that ship chains after Step 3 (`merge-pr`) as a new Step 4, with existing Scenario Validation shifting to Step 5.

**Status tracking:** `{stm_base}/{issue}/status/ship.json` — the new step must be added as a task entry (`"capture-learning-fast": { "status": "pending" }`).

**Resume logic:** Ship checks status file on startup; if `capture-learning-fast` is already `completed`, it skips. If `in_progress`, it resets to pending and re-runs. This means Mode 1 must be idempotent (safe to re-run).

**Modification route:** Ship SKILL.md is a compiled artifact. To add Mode 1:
1. Update `core/components/plays/ship/reference/intent.yaml`
2. Recompile: `/create-play --build ship` → regenerates `core/components/plays/ship/SKILL.md`

### How Sub-Plays Are Invoked

From ship's workflow, sub-plays are invoked via the Skill tool. Example from ship:
```
Skill: commit-code
Context: approval_override: "auto-proceed"
```

For Mode 1, the invocation would be:
```
Skill: capture-learning-fast
Context:
  stm_base: {stm_base}
  issue: {issue}
  product_base: {product_base}
```

Non-blocking handling: ship invokes Mode 1, then regardless of outcome, continues to Scenario Validation. Failure is logged in the evidence file, not surfaced as a hard halt.

---

## Existing Patterns

### Capture-learning Mode 2 (Full Reconciliation)

**File:** `core/components/plays/capture-learning/SKILL.md`  
**Compiled from:** `core/components/plays/capture-learning/reference/intent.yaml`

Mode 2 is a deep, multi-step play requiring:
- Issue in **CLOSED** state (enforced by project-orchestrator)
- `{stm_base}/{issue}/context/` directory (from prepare-epic baseline)
- Full milestone/verdict/arbiter evidence from the implement+validate trinity
- Human approval gate before any product LTM writes (mandatory Tether at Step 4)

Mode 2 uses a **3-tier analysis model**:
- **Tier 1:** Foundational artifact checks → ADR required if changed
- **Tier 2:** Enrichment proposals (Experiential section, epic post_implementation, quality-profile)
- **Tier 3:** Addition proposals (new domains, screens, flows)

Mode 2 workflow:
1. project-orchestrator → verify issue closed
2. Inline check for check-drift manifest
3. knowledge-extractor (ANALYZE mode) → produce reconciliation-proposals.yaml
4. Human review checkpoint (Tether/Vanish)
5. knowledge-extractor (ENRICH mode) → write approved proposals
6. repo-orchestrator → archive STM
7. Scenario evals + evidence

**Critical difference from Mode 1:** Mode 2 requires context/ from prepare-epic. Mode 1 has no such prerequisite — it reads the PR diff and whatever STM exists for the issue (may be minimal: specs/, evidence/ from ship itself).

### Knowledge-extractor Agent

**File:** `core/components/agents/knowledge-extractor.md`

Two modes: ANALYZE and ENRICH. The ANALYZE mode's input contract:
```json
{
  "context_base": "{stm_base}/{issue}/context/",
  "evidence_base": "{stm_base}/{issue}/",
  "product_base": "{product_base}",
  "drift_manifest_path": null,
  "epic_id": "{epic ID}"
}
```

The existing ANALYZE mode reads: `context/understanding/`, `context/blast-radius/`, `context/design/` (locked artifacts from prepare-epic), milestone verdicts, arbiter verdicts, e2e results. These are **unavailable in ship context** (prepare-epic was not run, no trinity, no milestones).

**Adaptation required:** The knowledge-extractor must be extended with a `"fast"` mode for Mode 1. Fast mode input contract would be lighter:
```json
{
  "mode": "fast",
  "pr_diff": "{diff content or path}",
  "stm_base": "{stm_base}/{issue}/",
  "product_base": "{product_base}",
  "issue_body": "{issue description}"
}
```

The agent analyzes: PR diff (what changed), issue STM evidence (any RCA, design artifacts from enhance/fix-it), product LTM (current state). It decides: are there learnings? If yes → produces lightweight proposals (1-2 max). If no → returns no-op.

---

## Integration Points

### Where in Ship to Insert Mode 1

**Insertion point:** After Step 3 (`merge-pr`), before current Step 4 (Scenario Validation).

New ship flow after Mode 1 is added:
| Step | Sub-play | Notes |
|------|----------|-------|
| 1 | `commit-code` | unchanged |
| 2 | `create-pr` | unchanged |
| 2.5 | `review-pr` | unchanged, conditional |
| 3 | `merge-pr` | unchanged |
| **4** | **`capture-learning-fast`** | **NEW — non-blocking, fire-and-forget** |
| 5 | Scenario Validation | was Step 4 |
| 6 | Evidence & Close | was Step 5; evidence file should record Mode 1 outcome |

**Why after merge, not before?** Mode 1 reads the merged PR diff. The merge must be complete before the diff is stable and available.

### Non-blocking Pattern

Ship must wrap Mode 1 invocation with explicit failure handling:
```
Invoke: capture-learning-fast
On success: continue to Scenario Validation
On failure or timeout: log warning in evidence, continue to Scenario Validation — DO NOT halt
```

This differs from other sub-play invocations (commit-code, create-pr, merge-pr) where failure immediately halts ship.

### How Mode 1 Reads the PR Diff

The PR diff is available post-merge via:
```bash
git diff main~1 main --name-only  # or git show HEAD --stat
```

Or from `{stm_base}/{issue}/evidence/` — create-pr writes PR number to STM; Mode 1 can fetch diff via `gh pr diff {pr_number}`.

The PR number is available from create-pr's STM output:
- Path: `{stm_base}/{issue}/evidence/create-pr/` (create-pr writes evidence there)

### Proposal Staging (No Inline Write)

Mode 1 NEVER writes directly to product LTM. It stages proposals only:
- **Proposals path:** `{stm_base}/{issue}/evidence/capture-learning-fast/proposals.yaml`
- **User notification:** After ship completes, summary printed: `N learning candidates staged — run /capture-learning --review to approve`
- **Zero-findings case:** Prints `no learnings detected` — no STM artifact created

---

## Conventions

### Skill File Format

Based on `core/components/skills/analyze-changes/SKILL.md` and `core/components/skills/archive-issue-stm/SKILL.md`:

```markdown
---
name: {skill-name}
description: {one-line description}
user-invocable: false
model: sonnet | haiku | opus
allowed-tools: Bash, Read, Write, Grep, Glob
---

# {skill-name}

{One-sentence description of what it does.}

## Purpose

{What the skill does. What it does NOT do (decision vs. action boundary).}

## Input

{What the calling agent passes in.}

## Process

{Numbered steps with bash code blocks where applicable.}

## Output

Produce output using template: `templates/{name}-output.md`

IMPORTANT: This skill produces {X}. The calling agent receives this output
and decides what to do next. Do NOT instruct the agent to return or stop.

## Constraints

{Rules the skill must never violate.}

## Version

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Category | analysis | operations |
```

**Key conventions:**
- `user-invocable: false` for skills called by plays/agents
- Model choice: `haiku` for simple ops, `sonnet` for analysis, `opus` for deep reconciliation
- Output always references a template file in `templates/`
- End with Version table
- Strong "decision boundary" statement — skill analyzes/acts; it does NOT decide what to do with results

### Play File Format (Compiled)

Plays have a different structure. The `SKILL.md` for a compiled play starts with:
```markdown
---
name: {play-name}
description: ...
user-invokable: true
---

# {play-name}

## Compiled From
...
Do NOT edit this file manually — it is a compiled artifact.
```

Plays have: Role, Pre-flight, Workflow (phases with steps), Pause and Resume, Compilation Metadata.

### STM Artifact Naming

- Evidence files: `{stm_base}/{issue}/evidence/{play-name}/{YYYYMMDD-HHMMSS}.md`
- Status files: `{stm_base}/{issue}/status/{play-name}.json`
- Context: `{stm_base}/{issue}/context/`
- Proposals: `{stm_base}/{issue}/evidence/{play-name}/proposals.yaml` (for structured data)

### Skill Invocation from Sub-play Context

Skills are invoked by agents within a sub-play. When ship chains `capture-learning-fast` as a sub-play, that sub-play's orchestrator invokes the `knowledge-extractor` agent (or directly uses the skill). The sub-play is responsible for handling failure and reporting back to ship.

---

## Domain Knowledge

### Product LTM Structure

**Root:** `.meridian/product/`  
**Config key:** `product.base-path`

Relevant enrichment targets for Mode 1 (per issue #240):

| Target | Path | What Mode 1 Would Write |
|--------|------|------------------------|
| Research / Experiential | `.meridian/product/research/{domain}.md` | Bug patterns, failure modes, fix approaches |
| Architecture annotations | `.meridian/product/architecture/*.yaml` | Decision validation notes |
| Epic delivery status | `.meridian/product/scope/epics/{epic-id}.yaml` | Delivery status field updates |

**Current product LTM state for this project:** `.meridian/product/meridian-os/` contains `roadmap.md`, `roadmap-engineering.md`, `vision.md`. No `architecture/`, `research/`, or `scope/epics/` directories exist. This means:
- Mode 1 must handle the case where product LTM targets don't exist (skip gracefully, same as Mode 2's `tiers_skipped` logic in knowledge-extractor)
- Mode 1 proposals are still staged to STM even if product LTM is sparse — the user may create the target artifacts later

### Enrichment Format (Experiential Section)

From knowledge-extractor.md, the Experiential section of `research/{domain}.md` follows a KB extension format:
```yaml
# Experiential Section
usage_count: N
scenarios_observed:
  - {description}
common_mistakes:
  - {description}
```

Mode 1's lightweight proposals for this target should follow this format for forward-compatibility with Mode 2.

### Trivial PR Detection

Per Q&A discovery (Q3): No hardcoded heuristics. The knowledge-extractor (fast mode) analyzes diff + STM to determine significance. Heuristics the agent may apply:
- Diff only touches documentation, version numbers, or formatting → likely trivial
- No STM evidence of RCA or design decisions → likely trivial
- Diff touches core logic + STM has enhance/fix-it evidence → likely has learnings

---

## Key File Paths

### Files to Create

| File | Purpose |
|------|---------|
| `core/components/skills/capture-learning-fast/SKILL.md` | New Mode 1 skill |
| `core/components/skills/capture-learning-fast/templates/proposals-output.md` | Output template for proposals |
| `core/components/plays/capture-learning-fast/SKILL.md` | Minimal wrapper play (if ship requires sub-play, not raw skill) |
| `core/components/plays/capture-learning-fast/reference/intent.yaml` | Intent for the wrapper play (if compiled play approach chosen) |

### Files to Modify

| File | What Changes |
|------|-------------|
| `core/components/plays/ship/reference/intent.yaml` | Add Mode 1 step: new constraint (C8?), new scenario (S4 — post-merge learning), non-blocking step after merge-pr |
| `core/components/plays/ship/SKILL.md` | **Compiled — do NOT edit directly.** Regenerated by `/create-play --build ship` after intent.yaml update. |
| `core/components/agents/knowledge-extractor.md` | Add `fast` operating mode with lighter input contract (PR diff + issue STM, no context/ required) |

### Key Reference Files (Read-Only)

| File | Role |
|------|------|
| `core/components/plays/ship/SKILL.md` | Current ship workflow to understand insertion point |
| `core/components/plays/capture-learning/SKILL.md` | Mode 2 structure for format alignment |
| `core/components/agents/knowledge-extractor.md` | Agent to extend with fast mode |
| `.meridian/core/config.yaml` | STM paths, product_base |
| `core/components/plays/ship/reference/intent.yaml` | Ship constraints to extend |

### STM Paths for Mode 1 Runtime

| Path | What It Is |
|------|-----------|
| `.meridian/project/issues/{issue}/evidence/capture-learning-fast/proposals.yaml` | Staged learning proposals (written by Mode 1) |
| `.meridian/project/issues/{issue}/status/ship.json` | Ship status file (must add `capture-learning-fast` task entry) |
| `.meridian/project/issues/{issue}/evidence/ship/{YYYYMMDD-HHMMSS}.md` | Ship evidence file (must include Mode 1 outcome) |

---

## Design Decisions Requiring Resolution

### Decision 1: Sub-play vs Direct Skill

**Context:** Ship's architecture forbids direct agent/skill invocations ("All domain work is delegated to sub-plays"). Mode 1 is described in discovery as a "new skill invoked by ship play."

**Options:**
1. **Create `capture-learning-fast` as a compiled sub-play** (wraps knowledge-extractor in fast mode) → update ship's intent.yaml to chain it → strictest conformance to ship's structure
2. **Update ship's architecture** to allow non-blocking skill invocations for fire-and-forget steps → requires ship intent.yaml update to relax C2's "sub-play only" rule

**Recommended:** Option 1 — create a minimal `capture-learning-fast` play. The play is thin: pre-flight + single agent invocation (knowledge-extractor fast mode) + write proposals to STM. No human gate. Failure returns gracefully.

### Decision 2: Knowledge-extractor Fast Mode vs New Skill

**Context:** The existing knowledge-extractor ANALYZE mode requires context/ from prepare-epic. Mode 1 doesn't have this.

**Options:**
1. **Extend knowledge-extractor** with a `fast` mode that takes PR diff + issue STM (lighter inputs)
2. **Implement Mode 1 analysis directly in the capture-learning-fast skill** (no agent delegation)

**Recommended:** Option 1 — extending knowledge-extractor keeps all LTM reconciliation logic in one place and enables future alignment with Mode 2's format. The `fast` mode would be a distinct code path that skips context/ reading and goes directly to diff analysis.

### Decision 3: Proposal Format

**Context:** Discovery Q&A says "Define a lightweight Mode 1-specific format. Align with #236's format later when Mode 2 lands."

**Recommendation:** Define a minimal `proposals.yaml` schema that captures:
- `issue`, `pr_number`, `analyzed_at`
- `proposals` array: each with `target` (enrichment target path), `section`, `proposed_content`, `evidence_diff_reference`
- `total_proposals`, `no_learnings: true/false`

Keep it forward-compatible with knowledge-extractor's `reconciliation-proposals.yaml` structure (same top-level keys) for easy migration when Mode 2 alignment happens.
