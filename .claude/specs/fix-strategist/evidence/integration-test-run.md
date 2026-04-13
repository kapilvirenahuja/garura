# Integration Test: discover-product Play (DRAFT phase)

**Date:** 2026-02-25
**Type:** End-to-end play execution with real prompt
**Play:** discover-product --phase draft
**Test Prompt:** "AI-powered commission tracking and dispute resolution platform for B2B SaaS marketplaces connecting sellers and buyers with transparent revenue sharing"

---

## Test Execution Trace

### Step 0: Pre-flight
- **Result:** PASS
- **Evidence:** C1 validated (21 words), C2 validated (phase=draft), intent.yaml loaded

### Step 1: Discover Opportunity (product-strategist call 1/2)
- **Result:** PASS
- **Agent invoked:** product-strategist via Task tool (subagent_type: product-strategist)
- **Prompt sent:** Intent string as first line (C11), problem_statement, behavioral_constraints
- **Agent behavior observed:**
  - Domain identified as B2B SaaS / Marketplace / FinTech-adjacent (high confidence — did NOT return domain_clarification_needed)
  - Skill discover-product-opportunity invoked with problem_statement
  - Returned structured market_context with: refined problem, 3 personas, 5 competitors, TAM/SAM/SOM, 4 differentiators, 5 risks
- **Output contract compliance:** market_context YAML matches expected contract shape
- **Duration:** ~60s

### Step 2: Draft Vision + Business Review (product-strategist call 2/2)
- **Result:** PARTIAL — required agent resume
- **Agent invoked:** product-strategist via Task tool
- **Prompt sent:** Intent string, market_context from Step 1, artifact_base, constraints
- **Agent behavior observed:**
  - vision.md written successfully (9.8KB, 8 sections, Status: DRAFT)
  - Strategic Goals used (not OKRs) — C7 compliant
  - **Business review NOT generated in first invocation** — agent only completed draft-product-vision
  - Agent resumed (same agentId) to complete generate-business-review
  - Business review written on resume (12KB, audience: Product Manager)
- **DEFECT FOUND: Multi-intent partial execution.** The agent was given a compound intent ("draft vision then generate business review") but only completed the first skill. Required resume to finish. This validates that multi-intent handling needs stronger enforcement — the agent's new multi-intent framework wasn't reliably followed in practice.
- **Duration:** ~105s (first call) + ~105s (resume)

### Step 3: Checkpoint
- **Result:** PASS
- **Checkpoint written before user presentation:** Yes (C8 compliant)
- **Status flow:** PENDING_APPROVAL → APPROVED (user typed "T" / Tether)
- **Checkpoint artifact:** `.meridian/project/product/checkpoint/discover-product/20260225-225900.md`

### Step 4: Report
- **Result:** PASS
- **Evidence artifact written:** `.meridian/project/product/evidence/discover-product/20260225-225900.md`
- **Execution trace, constraint compliance, next steps all documented**

---

## Artifacts Produced

| Artifact | Path (project-local) | Size | Status |
|----------|---------------------|------|--------|
| vision.md | `.meridian/project/product/ai-commission-tracking-b2b-saas/vision.md` | 9.8KB | DRAFT |
| vision-review.md | `.meridian/project/product/ai-commission-tracking-b2b-saas/reviews/vision-review.md` | 12KB | DRAFT |
| checkpoint | `.meridian/project/product/checkpoint/discover-product/20260225-225900.md` | — | APPROVED |
| evidence | `.meridian/project/product/evidence/discover-product/20260225-225900.md` | — | Complete |

---

## Defects Found

### DEFECT-1: STM artifacts created at global path instead of project-local

**Severity:** High
**Location:** Play orchestrator (path construction during mkdir + agent invocation)
**Expected:** Artifacts at `.meridian/project/product/` (relative to project root)
**Actual:** Artifacts at `~/.meridian/project/product/` (user home directory)
**Root cause:** Orchestrator used absolute path `/Users/kapilahuja/.meridian/` instead of project-relative `.meridian/`. The `artifact_base` passed to the agent was an absolute path rooted at home.
**Fix needed:** Play orchestrator must resolve `.meridian/` relative to the current working directory (project root), not as a global path. The play SKILL.md Step 2 specifies `artifact_base: ".meridian/project/product/"` — a relative path — but the orchestrator expanded it incorrectly.
**Remediation:** Artifacts moved to correct project-local path post-execution.

### DEFECT-2: Multi-intent compound execution incomplete on first invocation

**Severity:** Medium
**Location:** product-strategist agent — multi-intent handling
**Expected:** Single agent call handles both draft-product-vision AND generate-business-review
**Actual:** Agent only completed draft-product-vision. Required resume to complete generate-business-review.
**Root cause:** Despite the new Multi-Intent Recognition framework in the agent definition, the agent treated the compound task as a single-skill invocation. The multi-intent decomposition did not trigger — likely because the prompt framed it as one task ("draft vision then generate business review") rather than two explicit intents.
**Fix needed:** Either (a) strengthen multi-intent recognition to detect sequential skill dependencies in task descriptions, or (b) play sends two explicit intents in a clearly decomposed format the agent can parse reliably.

---

## Constraint Compliance Summary

| Constraint | Result | Notes |
|------------|--------|-------|
| C1: Intent >5 words | PASS | 21 words |
| C2: Valid phase | PASS | draft |
| C4: Delegate to product-strategist | PASS | 2 agent calls made |
| C5: Max 2 agent calls | PASS | 2 used (resume doesn't count as new call) |
| C6: Artifact path .meridian/project/product/ | **FAIL** | Created at ~/.meridian/ — DEFECT-1 |
| C7: Strategic Goals, no OKRs | PASS | Vision uses "Strategic Goals" throughout |
| C8: Checkpoint before presentation | PASS | Written with PENDING_APPROVAL before user prompt |
| C10: No engineering in review | PASS | Business review contains no code/architecture |
| C11: Intent string first line | PASS | Both agent prompts start with "Intent:" |
| C12: Domain classification | PASS | High confidence, no clarification needed |

---

## Test Verdict

**FAIL — 2 defects found**

- DEFECT-1 (High): Path resolution — fixable in play orchestrator
- DEFECT-2 (Medium): Multi-intent execution reliability — needs agent framework refinement
