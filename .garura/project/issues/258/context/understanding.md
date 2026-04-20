# Context: Issue #258 — /enhance Implementer/Tester Split

## 1. How /implement Separates Implementer from Tester

Source: `core/components/plays/implement/SKILL.md`

### The Two Agents (lines 29–47, 305–423)

**test-writer** (code-builder in sub-role) — Step 6a
- Receives: `TEST-CONTEXT-{milestone_id}.md` ONLY — behavioral descriptions, acceptance criteria, failure conditions, test framework name.
- Does NOT receive: CONTEXT.md, file paths, architecture decisions, tech choices, evals, builder output.
- Produces: physical test files on disk + `test-files-manifest.yaml`.
- JSON contract input has one field: `test_context_path`.

**code-builder** — Step 6b
- Receives: `CONTEXT-{milestone_id}.md` (derived from tech.yaml api_contracts, internal_interfaces, service_contracts) + `architecture-context.yaml`.
- Does NOT receive: test source code, test assertion text, mock data patterns, TEST-CONTEXT.md, eval IDs, eval text, judge reports, pass criteria.
- Produces: implementation code + `build-report.yaml`.
- JSON contract input has two fields: `context_path` and `architecture_context_path`.

### How /implement Avoids Cross-Contamination

The orchestrator physically derives two separate documents from different sources before any agent dispatch:
- TEST-CONTEXT.md — extracted from `epic-spec.yaml` behavioral descriptions and `scenarios.yaml` (Step 3b). Contains zero file paths, zero architecture content.
- CONTEXT.md — synthesized from `tech.yaml` contracts (Step 1, via tech-designer). Contains zero behavioral descriptions from features.yaml.

After Step 6a writes test files, the orchestrator runs tests mechanically (Step 6c) and communicates results to the builder ONLY via a spec-referenced status report that maps failures to tech.yaml contract IDs. The status report contains no test source code, no assertion text, no mock data (SKILL.md lines 427–466, C18/F15).

This is the mediation pattern: the play holds both contexts and never lets one agent see the other's artifact — it translates across a spec-contract boundary.

---

## 2. Current /enhance Structure — Step 8 and Step 9

Source: `core/components/plays/enhance/SKILL.md` lines 366–428; `reference/intent.yaml` C11, C13

### Step 8 — Single code-builder Dispatch (lines 366–395)

```
input:
  approach: {stm_base}/{issue}/evidence/enhance/approach.yaml
  context:  {stm_base}/{issue}/context/understanding.md
output:
  build_report: {stm_base}/{issue}/evidence/enhance/build-report.yaml
```

The builder receives `approach.yaml` directly. `approach.yaml` contains the full eval list with pass/fail criteria (C7, intent.yaml lines 78–90). C11 says the builder must not receive evals — but because approach.yaml physically carries the evals field, this constraint is nominal. The builder that opens approach.yaml can read evals.

### Step 9 — Play-Direct Self-Evaluation (lines 400–428)

Owner: play (not an agent). The play reads `evals` from `approach.yaml`, inspects the implementation against each criterion, and records `self-eval.yaml`. There is no agent boundary here — the same logical context that ran the builder also runs the evaluation. C13 (intent.yaml lines 169–172) assigns this to the play explicitly.

### The Problem

One agent (code-builder) receives the task spec including the eval criteria, implements, and the same play context grades it. Two failure modes follow:
- The builder can optimize its implementation to satisfy the eval criteria it already knows.
- When self-eval fails, the fix loop (Step 9a) sends `approach.yaml + context + remediation` back to code-builder — still no independent verdict, still no isolation.

---

## 3. Gap — Contract Changes Needed

### 3a. Split approach.yaml into Two Derived Artifacts

approach.yaml is the single source but must stop being the direct dispatch artifact. Before Steps 8 and 9, the orchestrator derives:

**`impl-context.md`** (new STM path: `{stm_base}/{issue}/context/impl-context.md`)
- Contains: `solution_summary`, `tasks` (ordered), `files_to_create`, `files_to_modify`, `connections`.
- Explicitly strips: `evals` list, `risks`, `alternatives_considered`.
- This is the implementer's only dispatch artifact.

**`test-context.md`** (new STM path: `{stm_base}/{issue}/context/test-context.md`)
- Contains: `evals` list (pass/fail criteria per eval ID), task behavioral descriptions.
- Explicitly strips: file paths from `files_to_create`/`files_to_modify`, architecture decisions from `connections`.
- This is the tester's only dispatch artifact.

Both derived from approach.yaml by the orchestrator inline (as Steps 3b and 3c in /implement — orchestrator work, not agent work). No new agent needed.

### 3b. Step 8 Contract Change — Implementer

Remove `approach` from `stm.input`. Replace with `impl_context_path`.

Before:
```
stm.input: { approach: ..., context: ... }
```

After:
```
stm.input: { impl_context_path: "{stm_base}/{issue}/context/impl-context.md",
              context: "{stm_base}/{issue}/context/understanding.md" }
stm.output: { build_report: ... }  ← unchanged
```

The implementer does NOT receive approach.yaml. It cannot see evals.

### 3c. New Step 8b — Tester Agent Dispatch

New JSON contract:
```
task_id: "verify"
stm.input:  { test_context_path: "{stm_base}/{issue}/context/test-context.md" }
stm.output: { verification_report: "{stm_base}/{issue}/evidence/enhance/verification-report.yaml" }
```

Agent: code-builder (sub-role: "tester"). Reads `test-context.md` (evals + behavioral descriptions only), runs the test suite, records PASS/FAIL per eval ID in `verification-report.yaml`. Does NOT receive `impl-context.md`, understanding.md, build-report.yaml, or approach.yaml.

This replaces Step 9's play-direct self-eval.

### 3d. Intent.yaml Constraint Changes

**C11 (current):** "code-builder receives approach.yaml + context ONLY."

**C11 (new):** "Implementer (code-builder) receives impl-context.md + understanding.md ONLY — approach.yaml derived with evals stripped. Tester (code-builder) receives test-context.md ONLY — no impl-context.md, no understanding.md, no build-report.yaml, no implementer output."

**C13 (current):** "After implementation, run self-evaluation using evals from approach.yaml. Record results."

**C13 (new):** "After implementation, dispatch tester agent with test-context.md only. Tester runs tests, records verification-report.yaml with per-eval PASS/FAIL. Play gates on tester verdict — never on builder self-report."

**New C22:** "Orchestrator derives impl-context.md and test-context.md from approach.yaml before any agent dispatch. impl-context.md must not contain the evals list, risks, or alternatives_considered. test-context.md must not contain file paths from files_to_create/files_to_modify or architectural connections. Derivation is orchestrator-direct — no agent performs it."

---

## 4. Files Expected to Change

| File | Role |
|------|------|
| `core/components/plays/enhance/reference/intent.yaml` | Modify C11, C13; add C22. These drive the rebuild. |
| `core/components/plays/enhance/SKILL.md` | Regenerated by `/create-play --rebuild enhance` after intent.yaml change. Manual edit forbidden. |

Only 2 source files change. SKILL.md is a compiled artifact — it reflects whatever the rebuild emits.

---

## 5. Integration Points

### Step 9 (Self-Eval) — Replaced, Not Removed

Step 9 currently: play reads approach.yaml evals, checks implementation, writes self-eval.yaml.

After: Step 9 becomes the tester dispatch (new Step 8b above). The gate entering Step 9a (fix loop) is now `verification-report.yaml` from the tester, not a play-parsed verdict. Same fix loop logic (max 3 per C12), but the implementer re-dispatch goes to: `impl-context.md + understanding.md + remediation` — no evals leak in even during fix loop iterations.

`self-eval.yaml` is renamed / replaced by `verification-report.yaml` produced by the tester agent. All downstream references to self-eval.yaml (Step 9a, evidence record in Step 17) update accordingly.

### Step 9a (Fix Loop) — Restructured Input Only

The fix loop condition stays (tester fails → builder re-dispatches). The builder's re-dispatch contract stays clean: `impl-context.md + understanding.md + remediation-{N}.md`. Remediation is derived from `verification-report.yaml` by the orchestrator — it lists failing eval IDs and their expected behaviors, not test code. Three iterations max per C12.

### Step 10 (Judge) — Unchanged

Judge receives `approach.yaml`, `project_root`, and the static eval file at `core/components/plays/enhance/reference/evals/solution-rating.yaml` (C14/C21). The tester's `verification-report.yaml` does NOT join the judge's inputs — this preserves C14/F10 isolation. The judge is an independent rater; seeing the tester's verdict would anchor its assessment.

### Step 11 (Quality-Auditor) — Unchanged

No change. Runs after judge, receives project_root and quality gates.

### Summary of Step Renumbering

| Current | After Split |
|---------|-------------|
| Step 8 — single code-builder (implementer+verifier) | Step 8 — implementer (impl-context.md only) |
| Step 9 — play-direct self-eval | Step 9 — tester agent (test-context.md only) |
| Step 9a — fix loop (self-eval failures) | Step 9a — fix loop (tester verdict failures) |
| Step 10 — judge | Step 10 — judge (unchanged) |

No steps are removed. Steps 8 and 9 change ownership/inputs.
