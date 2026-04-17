# Understanding — Issue #250: Risk Classification in Enhance Play

## Issue Summary

The enhance play's approach design outputs risks with a flat schema (`description` + `mitigation` only). Issue #250 requests:
1. **Classification** — every risk gets a `type` field: `technical | business | architectural`
2. **Action-driven handling** — every risk gets an `action` field: `eval-driven | approval-required | monitor-only`
3. **LTM/KB consultation** during classification to ground the type assignment

The edit strategy: **intent.yaml only** — do NOT edit SKILL.md directly. Recompilation via `/create-play --build enhance` is a separate follow-up step.

---

## 1. Current intent.yaml Structure

**File:** `core/components/plays/enhance/reference/intent.yaml`

### Risk-Related Constraints

| Constraint | Text (summarized) | Risk relevance |
|------------|-------------------|----------------|
| **C7** | Approach design MUST produce `approach.yaml` with `risks` as a required field | Defines that risks exist in approach.yaml |
| **C8** | At least one `alternatives_considered` with rejection reason | Not directly risk-related, but pairs with C7 in the approach design step |
| **C9** | Mid-checkpoint configurable (default OFF); `--approve-plan` flag triggers it | When ON, risks are surfaced in the mid-checkpoint display (Step 7) |
| **C10** | If user Vanishes at mid-checkpoint, halt | Risk display at Step 7 could trigger Vanish if risks are unacceptable |
| **C13** | Self-eval runs against evals from approach.yaml | Evals guard quality; risk handling via `eval-driven` would need evals linked to risks |
| **C14/C15** | Judge rates 0–1 confidence; if < 0.6 → pause for human approval | This is the existing implicit "high risk" gate — judge confidence |

### Risk-Related Failure Conditions

| Condition | Text (summarized) | Risk relevance |
|-----------|-------------------|----------------|
| **F8** | Mid-checkpoint configured ON but skipped | Approval-required risks that miss the checkpoint = F8 analog |
| **F9** | approach.yaml missing `alternatives_considered` or `evals` | Currently `risks` field is required but no quality enforcement on its schema |

### Risk-Related Scenarios

| Scenario | Text (summarized) | Risk relevance |
|----------|-------------------|----------------|
| **S4** | Developer with risky enhancement — judge rates < 0.6 → play pauses | The existing "risky" scenario is judge-confidence-driven, not risk-type-driven |
| **S5** | Developer using `--approve-plan` — mid-checkpoint shows risks | Current S5 displays risks uniformly; no typed handling |

### Key Observation

The word "risk" appears only in **C7** (as a required field in approach.yaml) and in the **Step 7 mid-checkpoint display** template (risks listed as one section alongside tasks, evals, alternatives). There is **no constraint** governing risk schema, risk classification, or how risk type should alter play behavior. This is exactly the gap issue #250 targets.

---

## 2. Current Risk Handling in SKILL.md

**File:** `core/components/plays/enhance/SKILL.md`

### Step 6 — Approach Design (where risks are produced)

The tech-designer agent receives:
- Input: `discovery.md` + `context/understanding.md`
- Output: `approach.yaml`

C7 mandates approach.yaml contains `risks`. The contract to tech-designer says "produces `approach.yaml` with ALL fields per C7." The SKILL.md does not define the risk schema beyond naming the field.

### Step 7 — Mid-Checkpoint (where risks are displayed)

When `--approve-plan` is set, the mid-checkpoint presents risks as a single undifferentiated section:

```markdown
### Risks
{risks}
```

No type labeling. No action-driven routing. All risks are displayed identically — the user sees them but the play takes no type-specific action.

### Step 9 — Self-Evaluation (evals gate)

Self-eval runs against the `evals` field from approach.yaml. If evals are linked to risks (e.g., an eval that checks a technical risk was mitigated), they would fire here. Currently no structural linkage between `risks` and `evals` in the schema.

### Step 14 — PR Checkpoint (always fires)

The PR checkpoint surfaces "Technical Decisions" which includes `risks` from approach.yaml. Again, risks are displayed as a block — no typed handling, no routing based on type.

### Key Observation

Risks currently flow through the play as **passive documentation**. They appear at:
1. **Step 7** (mid-checkpoint, if `--approve-plan`) — displayed in the approval prompt
2. **Step 14** (PR checkpoint, always) — displayed in technical decisions

Neither step routes behavior based on risk type. The only implicit "risk gate" is the judge confidence threshold (C15/F2), which is orthogonal to the risk field in approach.yaml.

---

## 3. Current approach.yaml Risk Schema

**Reference:** `.meridian/project/issues/240/evidence/enhance/approach.yaml`

```yaml
risks:
  - description: |
      <what the risk is — 2-4 sentences>
    mitigation: |
      <how to prevent or handle it — 2-4 sentences>
```

**Schema fields (current):**
- `description` (string) — what could go wrong
- `mitigation` (string) — how to prevent/handle

**Missing fields (what #250 requires):**
- `type` — `technical | business | architectural`
- `action` — `eval-driven | approval-required | monitor-only`

**Example from #240 (4 risks):**
1. Direct edit to ship SKILL.md creates version drift → mitigated by intent.yaml sync + Compilation Metadata note
2. knowledge-extractor FAST mode low-signal proposals when STM absent → mitigated by diff-only path with confidence: "low"
3. Large PR diffs (>500 lines) causing slow analysis → mitigated by git stat summary above 500 lines
4. Confusing resume if capture-learning-fast marked "failed" vs "skipped" → mitigated by using "skipped" status

None of these risks in #240 carry a `type` or `action` field — this is the current state.

---

## 4. Integration Points for Risk Classification

Four integration points exist in the enhance play where risk classification would take effect:

### 4a. intent.yaml: New constraint on risk schema (primary target)

**Where to add:** After C7 (approach design constraint), add a new constraint (e.g., C19) defining:
- Required fields on each risk entry: `type`, `action`
- `type` taxonomy: `technical | business | architectural`
- `action` taxonomy: `eval-driven | approval-required | monitor-only`
- LTM/KB consultation requirement during classification (grounding rule)

**What C19 governs:**
- tech-designer MUST classify each risk by type using LTM/KB lookup
- tech-designer MUST assign an action based on type:
  - `technical` risks → default `eval-driven` (covered by evals in approach.yaml)
  - `architectural` risks → default `approval-required` (trigger checkpoint)
  - `business` risks → default `monitor-only` (document, no blocking gate)
- Override with justification allowed

### 4b. intent.yaml: Conditional checkpoint for approval-required risks

**Where to add:** New constraint (e.g., C20) or extend C9, governing Step 7 behavior:
- When `--approve-plan` is OFF and any risk has `action: approval-required` → a lightweight risk-focused checkpoint fires
- This is SEPARATE from the full `--approve-plan` mid-checkpoint
- Shows ONLY the `approval-required` risks and their context (per discovery.md Q&A answer)
- Full approach review still requires `--approve-plan`

**What C20 governs:**
- Distinguish between: "user requested full plan review" (`--approve-plan`) vs. "play auto-triggers because high-risk"
- Failure condition for missing this: analogous to F8 (mid-checkpoint skipped when ON)

### 4c. intent.yaml: New failure condition

**New F-N:** `approval-required risks detected but risk-focused checkpoint was skipped`
- Mirrors F8 but for the auto-triggered risk gate
- Non-configurable (fires whenever `approval-required` risk detected, regardless of `--approve-plan` flag)

### 4d. intent.yaml: New scenario

**New S-N (S8 candidate):** "Developer with approval-required risk"
- Given: approach.yaml contains a risk with `action: approval-required` and `--approve-plan` is NOT set
- Then: a lightweight risk-focused checkpoint fires showing only approval-required risks; user Tethers to proceed or Vanishes to redesign

---

## 5. LTM Standards Relevant to Risk Classification

**No existing LTM standard in `core/components/memory/standards/rules/` directly governs risk classification in the enhance play.** The existing rules cover:
- `architecture.md` — architectural decision drivers (C1–C9 rules for build-arch artifacts)
- `design.md` — design-exp output rules (personas, screens, flows)
- `resolution.md` — R1–R4 LTM resolution protocol
- `commits.md`, `git.md`, `pr.md` — operational rules

**Relevant principles to ground risk type taxonomy:**

From `architecture.md` Rule 1 (Every Architectural Decision Has a Driver): architectural risks in approach.yaml should trace to architecture-level concerns (component boundaries, service splits, quality attribute tradeoffs). This aligns with the `architectural` type in the proposed taxonomy.

From `architecture.md` Rule 8 (No Premature Distribution): architectural risks specifically flag splits without quality-profile drivers — this is exactly the kind of risk that warrants `approval-required` action.

**LTM fallback (R4):** The risk type taxonomy itself (`technical | business | architectural`) is an LLM fallback decision — no existing LTM standard defines these categories for enhance play risks. This is a knowledge gap that the new C19 constraint will close by making the taxonomy explicit in intent.yaml.

---

## 6. Glossary Concepts That Apply

From `core/grounding/glossary.md`:

- **Blast radius** — "measures scope/spread, not probability or severity of failure." Technical risks often have a large blast radius (many files/domains affected). This connects to scope gate (C6) signals — a large blast radius can surface technical risks.

- **Scope gate** — "Thresholds: files ≤15, domains ≤2, effort ≤1 day." When scope gate passes but blast radius is high within the allowed range, technical risks capture what the scope gate doesn't block.

- **Context isolation** — "Judge receives ONLY approach.yaml + project codebase." The judge independently rates solution confidence. Architectural risks flagged in approach.yaml may influence judge confidence scoring even today.

- **Intent primacy** — "Plays are scaffolding." The constraint on risk classification lives in intent.yaml; the SKILL.md is compiled from it. No direct SKILL.md edit is needed for this issue.

- **No glossary entry for "risk type" or "risk classification"** — this confirms there is no existing canonical definition. The new constraints in intent.yaml will establish the first canonical schema for enhance risks.

---

## 7. Key File Paths

| File | Role | Edit for #250? |
|------|------|----------------|
| `core/components/plays/enhance/reference/intent.yaml` | Source of truth — add C19 (risk schema), C20 (auto-checkpoint), new F-N, new S-N | **YES — primary edit target** |
| `core/components/plays/enhance/SKILL.md` | Compiled artifact — DO NOT edit | No — recompile later via `/create-play --build enhance` |
| `.meridian/project/issues/240/evidence/enhance/approach.yaml` | Reference: current risk schema (description + mitigation only, no type/action) | No — read-only reference |
| `core/components/memory/standards/rules/_index.md` | LTM standards index — no risk classification rule exists | No |
| `core/grounding/glossary.md` | Canonical definitions — no risk type entry exists | No |

---

## 8. Change Summary for intent.yaml

The approach for #250 requires adding to `core/components/plays/enhance/reference/intent.yaml`:

1. **New constraint C19** (after C7): Risk schema enforcement — `type` and `action` fields required on every risk; type taxonomy `technical | business | architectural`; action taxonomy `eval-driven | approval-required | monitor-only`; LTM consultation grounding rule.

2. **New constraint C20** (after C9/C10): Auto-triggered risk checkpoint — when any risk has `action: approval-required` and `--approve-plan` is OFF, a focused checkpoint fires showing only approval-required risks. This is NOT the full plan review — it's lighter and specific to high-risk entries.

3. **New failure condition F11** (after F10): "Approval-required risks present but risk-focused checkpoint was skipped — implementation proceeds without human review of blocking risks."

4. **New scenario S8**: "Developer with approval-required risk — given approach.yaml contains `action: approval-required` risks and `--approve-plan` is NOT set, then a risk-focused checkpoint fires before implementation with only those risks shown; Tether proceeds, Vanish halts."

5. **Update S5** (existing): Mid-checkpoint scenario should reflect that typed risks are now displayed with their `type` and `action` labels, not as undifferentiated text.

No changes to C1–C18 (except C7 may be extended to enumerate all required fields explicitly including the new `type` and `action` fields). No changes to F1–F10.
