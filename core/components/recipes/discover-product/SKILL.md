---
name: discover-product
description: Discover product vision, strategic goals, and market positioning — Phase 1 of the IDSD strategic track
user-invocable: true
model: sonnet
allowed-tools: Task, Read, Write, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# discover-product

Discover product vision, strategic goals, and market positioning as the foundation for the IDSD strategic track.

## Intent

**BEFORE executing any step, read `reference/intent.yaml`** — it defines your operational contract: intent, pre-flight constraints (C1–C3), behavioral constraints (C4–C11), and failure conditions. All constraint IDs referenced in this recipe map to that file.

## Role

You are the orchestrator. You own the workflow. You delegate domain tasks to agents — never execute directly.

**Forbidden:** `Bash`, `Grep`, `Glob`, `Edit`, `EnterPlanMode`, `ExitPlanMode`, or any direct file operations.

**Agent boundaries:**
- `product-strategist` — product domain only: market analysis, vision drafting, validation, business review
- Everything else (pre-flight checks, checkpoint writes, approval logic, artifact writes, reporting) — orchestrator owns it

## Arguments

```
/discover-product --phase <draft|validate|lock> [--artifact <path>] [intent]

Examples:
  /discover-product --phase draft "QR code activation with commission tracking for B2B SaaS"
  /discover-product --phase validate --artifact .meridian/project/product/qr-activation/vision.md
  /discover-product --phase lock --artifact .meridian/project/product/qr-activation/vision.md
```

## Phases

| Phase | Steps | Agent |
|-------|-------|-------|
| DRAFT — Pre-flight | Step 0 | orchestrator |
| DRAFT — Discover Opportunity | Step 1 | product-strategist (call 1/2) |
| DRAFT — Draft Artifacts | Step 2 | product-strategist (call 2/2) |
| DRAFT — Checkpoint | Step 3 | orchestrator |
| DRAFT — Report | Step 4 | orchestrator |
| VALIDATE — Pre-flight | Step 0 | orchestrator |
| VALIDATE — Validate Vision | Step 1 | product-strategist (call 1/1) |
| VALIDATE — Checkpoint | Step 2 | orchestrator |
| VALIDATE — Report | Step 3 | orchestrator |
| LOCK — Pre-flight | Step 0 | orchestrator |
| LOCK — Lock | Step 1 | orchestrator |
| LOCK — Report | Step 2 | orchestrator |

## Workflow

### --- DRAFT PHASE ---

### Step 0 — Pre-flight (DRAFT)

**The orchestrator owns this step entirely. Do not delegate.**

Validate directly:
- Intent argument is non-empty (C1)
- `--phase` argument is one of `draft|validate|lock` (C2)
- Intent is sufficiently specific — not just 1–2 words (orchestrator checks directly)

If C1 fails → halt immediately with C1's `halt_message` from `reference/intent.yaml`. Pre-flight failures are **hard halts**.

### Step 1 — Discover Opportunity (DRAFT)

Create task: "Discover product opportunity". Invoke `product-strategist` (agent call 1 of 2):

```yaml
---
Intent: Discover product opportunity: {intent_slug} — extract market context for vision drafting
Recipe context:
  intent: "Extract market context from the user's product intent"
  task: "Invoke discover-product-opportunity skill. Input: problem_statement={intent}, market_hints derived from intent if available. Return market_context output."
  problem_statement: "{intent}"
  behavioral_constraints: {all behavioral constraints from reference/intent.yaml}
```

**Expected output:**
```yaml
market_context:
  problem: {refined problem}
  target_users: [{persona}]
  competitors: [{name, strengths, weaknesses}]
  market_size: {TAM/SAM/SOM or null}
  differentiators: [{differentiator}]
  risks: [{risk}]
```

If agent returns structured failure → see Recovery section.

### Step 2 — Draft Artifacts (DRAFT)

Create task: "Draft vision and business review". Invoke `product-strategist` (agent call 2 of 2):

```yaml
---
Intent: Draft product vision: {intent_slug} — create vision.md with Strategic Goals and PM business review
Recipe context:
  intent: "Create vision.md artifact from market context, then generate business review"
  task: "Invoke draft-product-vision with market_context from Step 1. Then invoke generate-business-review on the resulting vision.md. Return vision path and business_review path."
  market_context: {from Step 1 output}
  artifact_base: ".meridian/project/product/"
  behavioral_constraints: {all behavioral constraints from reference/intent.yaml}
```

**Expected output:**
```yaml
vision:
  path: "{.meridian/project/product/{slug}/vision.md}"
business_review:
  path: "{.meridian/project/product/{slug}/reviews/{artifact}-review.md}"
```

If agent returns structured failure → see Recovery section.

### Step 3 — Checkpoint (DRAFT)

**The orchestrator owns this step entirely. Do not delegate.**

Write checkpoint artifact to `.meridian/project/product/checkpoint/discover-product/{YYYYMMDD-HHMMSS}.md` using `templates/checkpoint.md` with Status: `PENDING_APPROVAL`.

Present vision summary using `templates/approval-prompt.md`. Include: product name/slug, vision artifact path, key strategic goals, business review path.

Parse: `Tether`/`tether` → proceed to Step 4. `Vanish`/`vanish` → halt. Else → clarify.

**After user responds**, update the checkpoint artifact:
1. Set `Status` to `APPROVED` or `REJECTED`
2. Mark `Checkpoint approval` task as `completed`
3. Advance `Step` to `4 of 4`

### Step 4 — Report (DRAFT)

**The orchestrator owns this step entirely. Do not delegate.**

Write evidence to `.meridian/project/product/evidence/discover-product/{YYYYMMDD-HHMMSS}.md`:
- Intent and resolved slug
- `vision.md` path and status
- `business_review.md` path
- Market context summary (problem, user count, competitor count)

Present the final report using `templates/final-report.md`.

---

### --- VALIDATE PHASE ---

### Step 0 — Pre-flight (VALIDATE)

**The orchestrator owns this step entirely. Do not delegate.**

Validate directly:
- `--artifact` path is provided (C3)
- Artifact exists at the specified path
- Artifact has `Status: DRAFT` (not already LOCKED)

If any check fails → halt immediately with the appropriate `halt_message` from `reference/intent.yaml`. Pre-flight failures are **hard halts**.

### Step 1 — Validate Vision (VALIDATE)

Create task: "Validate vision completeness". Invoke `product-strategist` (agent call 1 of 1):

```yaml
---
Intent: Validate product vision: {artifact_slug} — check completeness before lock
Recipe context:
  intent: "Evaluate vision.md completeness and readiness for lock"
  task: "Invoke validate-product-vision skill with vision_path. Return validation_result."
  vision_path: "{--artifact value}"
  behavioral_constraints: {all behavioral constraints from reference/intent.yaml}
```

**Expected output:**
```yaml
validation_result:
  ready_for_lock: true|false
  completeness_score: 0-100
  issues: [{message, field, severity: blocker|warning|suggestion}]
  checklist:
    strategic_goals_defined: true|false
    target_users_identified: true|false
    success_metrics_measurable: true|false
    competitive_landscape_covered: true|false
    assumptions_listed: true|false
```

If agent returns structured failure → see Recovery section.

### Step 2 — Checkpoint (VALIDATE)

**The orchestrator owns this step entirely. Do not delegate.**

Present validation summary using `templates/approval-prompt.md` (validation variant): completeness_score, checklist status table, issues by severity.

**If `validation_result.ready_for_lock: true`:**
- Present: "Vision is ready to lock. Run `/discover-product --phase lock --artifact {path}` when ready."
- Parse: `Tether`/`tether` → write VALIDATE_PASSED checkpoint; proceed to Step 3. `Vanish`/`vanish` → halt.

**If `validation_result.ready_for_lock: false`:**
- Present validation issues. Type **Tether** to proceed anyway (with risks), or **Vanish** to cycle back for redraft.
- On `Vanish`: **cycle-back** — check iteration count (stored in checkpoint artifact).
  - If iteration count < 2: invoke `product-strategist` again with `draft-product-vision` + `feedback: {validation_result.issues}`. Increment iteration count. Return to Step 1.
  - If iteration count ≥ 2: return structured failure "Maximum cycle-back iterations reached — manual intervention required."
- On `Tether` with blockers: note risk in checkpoint, write APPROVED checkpoint.

### Step 3 — Report (VALIDATE)

**The orchestrator owns this step entirely. Do not delegate.**

Write evidence to `.meridian/project/product/evidence/discover-product/{YYYYMMDD-HHMMSS}.md`:
- Artifact path validated
- Completeness score and checklist results
- Issues found (count by severity)
- Outcome: VALIDATE_PASSED or approved with risks

Present the final report using `templates/final-report.md`.

---

### --- LOCK PHASE ---

### Step 0 — Pre-flight (LOCK)

**The orchestrator owns this step entirely. Do not delegate.**

Validate directly:
- `--artifact` path is provided and exists
- Artifact has `Status: DRAFT` (not already LOCKED)

If any check fails → halt immediately with the appropriate `halt_message` from `reference/intent.yaml`. Pre-flight failures are **hard halts**.

### Step 1 — Lock (LOCK)

**The orchestrator owns this step entirely. No agent call.**

Update `vision.md`: change `**Status:** DRAFT` to `**Status:** LOCKED`. Update Last Updated date to today.

Present: "Vision locked at `{path}`. Use `/plan-roadmap --phase draft --vision {path}` to continue the strategic track."

### Step 2 — Report (LOCK)

**The orchestrator owns this step entirely. Do not delegate.**

Write evidence to `.meridian/project/product/evidence/discover-product/{YYYYMMDD-HHMMSS}.md`:
- Artifact path locked
- Lock timestamp

Present the final report using `templates/final-report.md`.

---

## Recovery

Load recovery reasoning from: `docs/framework/intent-driven-recovery.md`

When an agent returns a structured failure (per `structured-failure-protocol.md`):
- Read `domain_assessment.responsible_domain` to identify which agent can fix it
- Invoke the responsible agent with fix context + original intent
- Max 2 retries per step. After that, halt with full failure context.

For retries, add to recipe context:
```yaml
  retry:
    previous_failure: "{what_failed}"
    fix_applied: "{what was done to fix it}"
    attempt: {N}
```

**Pre-flight failures (C1–C3) are not recoverable** — hard halt with the constraint's `halt_message`.

## References

| File | Path | Used For |
|------|------|----------|
| Intent | `reference/intent.yaml` | Operational contract — load before executing any step |
| Checkpoint | `templates/checkpoint.md` | STM artifact at `.meridian/project/product/checkpoint/discover-product/{ts}.md` |
| Approval Prompt | `templates/approval-prompt.md` | Tether/Vanish checkpoint presentation |
| Final Report | `templates/final-report.md` | Phase completion summary |

---

## Version

| Field | Value |
|-------|-------|
| Level | L1 |
| Version | 1.0.0 |
| Distinct Agents | 1 (product-strategist) |
| DRAFT Agent Calls | 2 |
| VALIDATE Agent Calls | 1 |
| LOCK Agent Calls | 0 |
| Checkpoint | Always (after DRAFT and VALIDATE) |
