# Scenario Evals — start-feature-planning — Issue #214

**Date:** 2026-04-14
**Play:** start-feature-planning
**Issue:** #214

## SCE-1 (S1): Developer can begin T1 without further planning

**Artifact:** `.meridian/project/issues/214/specs/tasks.md`

**Check:** Does T1 contain enough detail that a developer can start implementation immediately?

**T1 review:**
- **Title:** "Design scriber agent intent"
- **Files:** Exact path `.meridian/project/issues/214/context/scriber-design.md`
- **Details:** Concrete — document scriber's role, dispatch contract (JSON), what counts as evidence vs inline, failure semantics
- **Depends on:** none
- **Expected Outcome:** reviewable design note
- **Verification:** design note exists and distinguishes blocking vs non-blocking
- **Rollback plan:** delete the file

**Assessment:** PASS. T1 is a design note that has no upstream dependencies, concrete file path, concrete content requirements, and clear success criteria. A developer could start it today.

**Spot check on T6a (harder task):** config move task specifies `git mv` for history preservation, enumerates the exact files to update (`test-engineer.md`, `project-orchestrator.md`, etc.), specifies the grep pass, and has a verifiable rollback. PASS.

**Spot check on T15 (deletion task):** specifies the exact directories to delete, confirms pattern capture prerequisite, cross-checks grep for remaining references, and has a git-restore rollback. PASS.

**Result: PASS**

---

## SCE-2 (S2): Tech Lead can make informed Tether/Vanish decision

**Artifact:** `.meridian/project/issues/214/specs/spec.md`

**Check:** Does spec.md contain strategy, alternatives, and risks with enough depth for a Tech Lead to decide?

**Content check:**
- **Strategy section:** Present. 2-paragraph narrative covers: new plays from canonical intent.yaml, KB extension via existing markdown, scriber ships first, old plays deleted after pattern capture, no amendments to whitelist, config move, no levels/budgets.
- **Key design decisions:** 12 decisions documented, each with Why + Rejected alternative. Covers: scriber ordering, config relocation, capture-then-delete, KB encoding, cross-tree constraint evaluation, fresh vs coexist, spec-arch rename, whitelist strictness, no levels/budgets, intent metadata shape, "run the play" terminology, schema enforcement, wireframes, agents.
- **Alternatives Considered table:** 15 rejected alternatives with reasons (coexistence, delete-without-capture, whitelist amendment, config-at-repo-root, keep levels, keep bake, parallel YAML tree, convert markdown to YAML, in-place arch update, scriber-in-214.5, scriber-last, monolithic PR, SAT solver, mega-agent, MCP wireframes).
- **Risks table:** 12 risks with mitigation and severity. 3 High (none — corrected: 1 High, 7 Medium, 3 Low, 1 — the deletion risk is High).

**Tech Lead assessment:** Can a Tech Lead decide with this? Yes. They can see the chosen path, the options considered, why each option was rejected, and the residual risks with mitigations. The estimate (22-32 days across 7 PRs) is visible. The dependency chain is clear.

**Result: PASS**

---

## SCE-3 (S3): Verify.md is unambiguous

**Artifact:** `.meridian/project/issues/214/specs/verify.md`

**Check:** Does verify.md have specific acceptance criteria, verification steps, and edge cases with no ambiguity?

**Content check:**
- **Acceptance criteria per sub-issue:** 7 sub-issue sections, each with 5-15 bulleted criteria. Each criterion is testable (contains a specific file check, grep check, or runtime check).
- **Verification Steps table:** 18 rows, each with Step / Method / Expected Outcome — concrete commands and outputs.
- **Scenario Coverage table:** 6 acceptance scenarios from the issue body, each mapped to specific verification artifacts.
- **Edge Cases table:** 13 edge cases with expected behaviors — specific enough to be testable.
- **Folder Structure Compliance:** Exhaustive enumeration of allowed directories + 6 grep/yq checks to confirm compliance.

**Spot check on sub-issue 214.5 criteria:** "Running `/plan-product '...'` produces: market-brief.md, scope.yaml, ≥5 intent epics (each with all mandatory fields filled, ≥2 success scenarios, ≥2 failure scenarios, quantified constraints), quality-profile.yaml — all under `.meridian/product/`." — Specific paths, specific counts, specific field requirements. Unambiguous.

**Spot check on edge cases:** "Screen has exactly 2 states" → "validate-screen-coverage rejects with 'minimum 3 states required'" — specific input, specific expected behavior. Unambiguous.

**Result: PASS**

---

## SCE-4 (S4): Dependency graph enables PM scope / critical-path assessment

**Artifact:** `.meridian/project/issues/214/specs/tasks.md` dependency graph + phasing table

**Check:** Can a PM read the dependency graph and assess scope and critical path?

**Content check:**
- **Dependency Graph (ASCII):** 7 parallel chains, one per sub-issue, with linear arrows showing task ordering. Cross-chain arrows show sub-issue dependencies (214.1 → 214.2 → 214.3 → 214.4 → 214.5 → 214.6 → 214.7).
- **Phasing table:** 7 rows with Sub-issue / Title / Tasks / Depends on / Size. Each row shows the sub-issue's size estimate (M / L / XL) and its dependency.
- **Critical path:** Visible by following the sub-issue dependencies — 214.1 → 214.2 → 214.3 → 214.4 → 214.5 → 214.6 → 214.7. The critical path is the entire sequence (strict sequencing); no parallelism between sub-issues.
- **Scope totals:** Stated as "Total estimate: 22-32 days across 7 reviewable PRs."

**PM assessment:** Can a PM assess scope and critical path? Yes. They can see the total time estimate, the sub-issue breakdown, which sub-issues block others, and which sub-issue is the largest (214.5 at XL/5-7 days). They can identify 214.5 as the longest lever for risk and parallelize planning around it.

**One observation (not a blocker):** The graph is strictly sequential — no parallelism between sub-issues. A PM might ask "can 214.1 and 214.2 run in parallel since scriber is independent of folder migration?". The spec doesn't explicitly answer this, but the dependency graph makes the strict ordering visible so the question can be asked.

**Result: PASS**

---

## Summary

| Eval | Result |
|------|--------|
| SCE-1 | PASS |
| SCE-2 | PASS |
| SCE-3 | PASS |
| SCE-4 | PASS |

**All scenario evals passed.** Planning artifacts meet their intent: tasks are actionable from T1, spec supports Tech Lead decision, verify is unambiguous, and the dependency graph enables PM assessment.
