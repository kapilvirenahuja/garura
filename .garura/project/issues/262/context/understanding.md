# Understanding — Issue #262
# fix-it: lean RCA + parallel issue-update

**Assembled:** 2026-04-19
**Play:** enhance
**Issue:** [DEF][Medium] /fix-it generates heavy HTML brief instead of inline markdown RCA; missing parallel issue-update on approval

---

## 1. Current fix-it Play Shape

**Source of truth:** `core/components/plays/fix-it/reference/intent.yaml` (C1–C11, F1–F8, S1–S3)
**Compiled artifact:** `core/components/plays/fix-it/SKILL.md`

### Existing Constraints (C1–C11)

| ID | Summary | Change touch? |
|----|---------|---------------|
| C1 | Must have open issue | No |
| C2 | No run on main — fix/ branch | No |
| C3 | RCA traces to specific file/logic | No |
| C4 | Fix design: at least one alternative considered | No |
| C5 | Risk assessment with severity levels | No |
| C6 | Exactly one human checkpoint — never skippable | **Yes** — checkpoint presentation format changes |
| C7 | After Tether, all remaining steps run autonomously | **Yes** — adds parallel background dispatch on Tether |
| C8 | code-builder MUST NOT receive checkpoint brief content | No |
| C9 | ship invoked with `approval_override: auto-proceed` | No |
| C10 | All domain work delegated to agents | **Yes** — new background agent dispatch at Step 5 |
| C11 | LTM context in tech-designer contract | No |

**Net: C6, C7, C10 need new or modified constraint language. New constraints needed for: inline-only checkpoint format, parallel issue-update tracking.**

### Existing Failure Conditions (F1–F8)

| ID | Condition | Change touch? |
|----|-----------|---------------|
| F1 | Proceeds to implementation without Tether | No |
| F2 | RCA has no root cause / restates title | No |
| F3 | No alternatives_considered | No |
| F4 | Shipping partial (commits but no PR, or PR not merged) | No |
| F5 | Issue not found or not open | No |
| F6 | Implementation touches files not in design | No |
| F7 | code-builder receives checkpoint brief content | No — reinforced by removal of HTML brief |
| F8 | Resolution trace absent when ltm_context provided | No |

**New failure conditions needed:**
- F9: HTML brief generated (briefs/rca-design-brief.html produced)
- F10: No background agent dispatched on Tether to post the issue comment

### Existing Scenarios (S1–S3)

| ID | Persona | Relevant to change? |
|----|---------|---------------------|
| S1 | Developer — full happy path | **Yes** — evidence must now include issue-comment-agent.yaml |
| S2 | Tech Lead — reviews checkpoint brief | **Yes** — brief is now inline markdown, no HTML |
| S3 | QA Engineer — audits PR + evidence | **Yes** — GitHub issue should reflect RCA decision |

**S2 `then` clause needs updating:** currently satisfied by HTML brief; post-change it's satisfied by inline markdown sections. S4 (new) for audit trail: GitHub issue has RCA comment after Tether.

### Step 4 — Generate Checkpoint Brief (current)

**Declared entirely in SKILL.md** — not in intent.yaml. This is the key finding.

`intent.yaml` has no constraint naming doc-builder or HTML brief generation. The brief generation is a compiled implementation detail in SKILL.md at lines 193–226:

```
Owner: doc-builder
Contract: briefs_requested: ["rca-design"]
Output: {stm_base}/{issue}/evidence/fix-it/briefs/rca-design-brief.html
```

The intent.yaml Step 5 checkpoint section in SKILL.md (line 239–274) currently contains a `### Brief` subsection pointing to the HTML file. The inline markdown content is already present in the checkpoint template in SKILL.md — it just appends the brief link at the bottom.

**Implication:** Removing doc-builder from Step 4 does NOT require a new constraint in intent.yaml — it requires removing a step from the compiled play. However, to signal this is intentional and prevent future regression, a new constraint (C12) should be added to intent.yaml stating that the checkpoint summary is rendered inline from STM artifacts, with no HTML generation and no doc-builder invocation.

### Step 5 — Approval Gate (current)

Declared in SKILL.md lines 229–275. The play reads rca.yaml and design.yaml from STM and renders them inline. The `Tether` branch currently jumps directly to Step 6 (implement). No background dispatch.

### Evidence/Close Step — Step 9

Step 9 (SKILL.md lines 358–400) is the evidence write + self-commit. This is where background agent tracking must be surfaced:

- Read `{stm_base}/{issue}/evidence/fix-it/issue-comment-agent.yaml`
- Check `status` field; if `pending` (agent still running or timed out silently), record that in the delivery evidence
- Update `status` to `completed|failed` with `completed_at` and `error` if applicable
- If failed: record in evidence, do NOT halt, do NOT retry

The `issue-comment-agent.yaml` file is written at Step 5 dispatch time (new behavior), read at Step 9.

---

## 2. Framework Patterns Relevant to the Change

### `run_in_background: true` — Agent tool dispatch

**Only usage found in `core/components/`:**

`core/components/agents/scriber.md` line 33:
```
You are dispatched with `run_in_background: true` so the calling play does not block on your work.
```

And line 157:
```
Block the caller. You run with `run_in_background: true`. The caller expects to continue while you work.
```

No existing play in `core/components/plays/` contains an inline example of dispatching an agent with `run_in_background: true` in a compiled SKILL.md step. The scriber agent definition is the only authoritative reference for how this pattern is documented. The compiled play step will need to show:

```json
Agent tool dispatch: {
  "subagent_type": "project-orchestrator",
  "run_in_background": true,
  ...
}
```

This is a new pattern for fix-it's compiled output.

### manage-issue skill — comment posting

`core/components/skills/manage-issue/SKILL.md` defines actions: `read`, `create`, `close`, `resolve_or_create`. **There is no `comment` action.** The template confirms the mechanism is direct `gh` CLI:

```bash
gh issue comment {issue_number} --body "{rendered_template}"
```

The background agent (project-orchestrator) will need to call `manage-issue` with an extended action, OR call `gh issue comment` directly via Bash. The `issue-comment-rca-approved.md` template's CLI section says "via `manage-issue` skill or directly by the agent dispatched with `run_in_background: true`".

**Gap:** manage-issue does not have a `comment` action in its current SKILL.md. The background agent will either need to use Bash directly or the manage-issue skill will need a `comment` action added. This is a design decision for the approach step.

### Template instantiation convention

`core/components/memory/standards/templates/_index.md` defines the convention: every skill/play that produces an artifact instantiates the matching template instead of inlining its own prose.

The `issue-comment-rca-approved.md` template is already registered in `_index.md` (row added in discovery):

```
| `issue-comment-rca-approved.md` | Canonical GitHub issue comment posted on RCA approval | `fix-it`, future plays |
```

The compiled play step must reference this template path so the background agent knows where to find the shape. The field derivation rules in the template are complete.

---

## 3. New Template Already in Place

`core/components/memory/standards/templates/issue-comment-rca-approved.md` — written during discovery, registered in `_index.md`.

Shape: `## RCA & Fix Plan — Approved` header, Approved-by + timestamp + play + STM path, Root Cause, Blast Radius table, Fix Strategy (ordered), Alternatives Considered, Risks table, Confidence, PR pending marker.

Field derivation: fully specified — `@{user}` from `gh api user`, timestamp from system time, all content fields from `rca.yaml` / `design.yaml`.

Follow-up comment format also specified: `## PR Opened` with PR URL, branch, timestamp. Append-only, not edit.

Constraints in template: no empty section shells, single comment at approval time, never inline full YAML, always include Approved-by header.

---

## 4. Related Plays Cross-Check

### enhance — inline markdown checkpoint pattern

`core/components/plays/enhance/SKILL.md` Step 7 (mid-checkpoint when `--approve-plan`):

```markdown
## Approach — Issue #{issue}
### Problem Statement / Solution Summary / Files / Tasks / Eval Criteria / Risks / Alternatives
Type **Tether** to approve or **Vanish** to redesign.
```

This is the exact inline-markdown pattern fix-it should follow. No doc-builder invocation, no HTML file, all content rendered directly from approach.yaml. This confirms the pattern is already established in the framework.

### address-qa-findings — does not exist

`core/components/plays/address-qa-findings/` not found. No cross-check possible.

### doc-builder dependency scan — fix-it is isolated

Grep across `core/components/plays/` for `doc-builder`:

| Play | Usage |
|------|-------|
| `fix-it/SKILL.md` | Step 4 — Generate Checkpoint Brief (the step being removed) |
| `prepare-epic/SKILL.md` | Step 12 (LLD Brief) + Step 15 (Scenarios + Plan Briefs) |
| `review-pr/reference/intent.yaml` | Agent budget exemption mention only |
| `create-play/SKILL.md` | Compilation rule: doc-builder is opt-in, not mandatory |

**No other play consumes fix-it's HTML brief as an input.** Removing doc-builder from fix-it has zero impact on other plays. fix-it's brief was produced for presentation only, never fed as input to any downstream step.

---

## 5. Intent.yaml Schema

`core/components/memory/standards/schemas/intent.yaml` — canonical schema.

Relevant shape for this change:

- **Constraints:** `id` (string, e.g. C12) + `rule` (string, implementation-agnostic, falsifiable, no agent/skill/tool names)
- **Failure conditions:** `id` (string, e.g. F9) + `condition` (observable state in output, not an event)
- **Scenarios:** `id` + `persona` + `given` + `then` (outcome, not process)
- **Metadata zone:** `name`, `description`, `version`, `checksum` — version bumps on any content-zone semantic change

Critical crafting principle: **constraints must be implementation-agnostic** — no agent names, no skill names, no tool names. "The checkpoint summary is rendered inline from STM YAML artifacts; no standalone HTML artifact is produced" is valid. "No doc-builder invocation" is NOT valid in intent.yaml.

Checksum: recomputed by `/create-play --build` over the content zone (intent, constraints, failure_conditions, scenarios), normalized. The `version` field should also be bumped on this edit.

---

## 6. `/create-play --rebuild` Mechanics

**Location:** `core/components/plays/create-play/SKILL.md`

**CLI invocation:**
```
/create-play --build fix-it
```

**Note on flag naming:** The SKILL.md calls it `--build` (Rebuild mode), not `--rebuild`. Table at lines 41–47:
```
Both files present + --build flag → Rebake mode (rebuild play from existing intent)
```

**Rebuild mode semantics:**
1. Reads existing SKILL.md and intent.yaml
2. Invokes `intent-crafter` agent in `mode: rebuild` — reviews existing intent against play analysis, finds gaps in constraints, failure conditions, and scenarios
3. The crafter presents updated intent.yaml for Tether/Vanish approval
4. Runs evals-creator, skill inventory, audit checklist (P1-P11), compiles new SKILL.md
5. Overwrites `core/components/plays/fix-it/SKILL.md`
6. Updates `intent_hash` in Compilation Metadata

**Pre-state required:** The only documented pre-state is that `intent.yaml` must conform to schema (intent field present, at least 1 constraint with id+rule, at least 1 FC, at least 1 scenario). No clean git working tree requirement documented.

**After rebuild:** Run `/sync-claude` to deploy updated SKILL.md from `core/components/plays/fix-it/SKILL.md` to `~/.claude/skills/fix-it/SKILL.md`. Do NOT edit the deployed artifact directly.

---

## 7. Integration Points Summary

### Files to Modify

| File | Section | What Changes |
|------|---------|--------------|
| `core/components/plays/fix-it/reference/intent.yaml` | `constraints` | Add C12 (inline checkpoint, no HTML artifact), C13 (parallel issue-update tracked in STM on Tether) |
| `core/components/plays/fix-it/reference/intent.yaml` | `failure_conditions` | Add F9 (HTML brief produced), F10 (no background dispatch on Tether) |
| `core/components/plays/fix-it/reference/intent.yaml` | `scenarios` | Update S2 `then` clause (inline markdown not HTML brief); add S4 (GitHub issue has RCA comment after Tether) |
| `core/components/plays/fix-it/reference/intent.yaml` | `version` + `checksum` | Bump version; checksum recomputed by `/create-play --build` |
| `core/components/plays/fix-it/SKILL.md` | Step 4 | Replace doc-builder dispatch with inline markdown rendering from rca.yaml + design.yaml |
| `core/components/plays/fix-it/SKILL.md` | Step 5 | Add background agent dispatch block (project-orchestrator, `run_in_background: true`); add STM write for issue-comment-agent.yaml |
| `core/components/plays/fix-it/SKILL.md` | Step 5 checkpoint template | Remove `### Brief` subsection and HTML path reference |
| `core/components/plays/fix-it/SKILL.md` | Step 9 Evidence | Add: read issue-comment-agent.yaml, record final status, note failure non-blocking |
| `core/components/plays/fix-it/SKILL.md` | Agent Boundaries table | Remove doc-builder row; add background-agent row for project-orchestrator issue-comment dispatch |
| `core/components/plays/fix-it/SKILL.md` | Compilation Metadata | Update utility_agents count (remove doc-builder), add step eval SE-10/SE-11 for new FCs |
| `core/components/plays/fix-it/SKILL.md` | status file task list | Add `issue-comment-dispatch` task; remove `generate-brief` task |

### Files to Create

| File | Purpose |
|------|---------|
| (none — `issue-comment-rca-approved.md` already created) | — |

### Files NOT to Touch

| File | Reason |
|------|--------|
| `~/.claude/skills/fix-it/SKILL.md` | Deployed artifact — regenerated by `/sync-claude` after rebuild |
| `core/components/agents/doc-builder.md` | No change — just stop invoking from fix-it |
| `core/components/agents/project-orchestrator.md` | Agent already handles manage-issue; no definition change |
| `core/components/skills/manage-issue/SKILL.md` | Unless `comment` action is added — design decision for approach step |

---

## Key Findings Summary

1. **doc-builder call is in SKILL.md only, not intent.yaml.** The brief generation is a compiled implementation choice with no corresponding intent constraint. This means: intent.yaml needs a new constraint to express the inline-only requirement (without naming doc-builder), and the compiled play step is straightforwardly replaced. No existing constraint is violated — a new one is added.

2. **run_in_background pattern has one existing example (scriber.md) but no compiled play step example.** The approach step must define the exact Agent tool dispatch shape for the background agent in the compiled SKILL.md, drawing from scriber.md as the pattern authority.

3. **manage-issue has no `comment` action.** The background agent dispatched on Tether cannot invoke `manage-issue` with `action: comment` — that action does not exist. The approach must resolve this: either (a) add a `comment` action to manage-issue (preferred for consistency), or (b) the background agent posts directly via `gh issue comment` Bash. The template (`issue-comment-rca-approved.md`) documents both options.

4. **Step 5 checkpoint inline markdown is already partially there.** SKILL.md Step 5 already renders Root Cause, Blast Radius, Proposed Fix, Alternatives, Risk Assessment, and Confidence inline — the only thing being removed is the `### Brief` subsection that points to the HTML file. The actual inline rendering is not a new addition; it is already the pre-checkpoint summary that precedes the `Open {html_path}` pointer.

5. **Step 9 is the right integration point for background agent tracking.** The evidence/close step already aggregates all eval results. Adding a background agent status check here keeps the audit trail complete without adding a new step or blocking implementation.
