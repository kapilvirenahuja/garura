# Backward Compatibility Report: Profile Guards

**Date:** 2026-03-25
**Issue:** #150 — Followup #148 reviews, evals, sync
**Goal:** Verify that all skills and plays referencing profiles degrade gracefully when profiles are absent from product.yaml.

---

## Summary

| # | File | Explicit Guard? | Guard Correct? | Action Needed? |
|---|------|----------------|----------------|----------------|
| 1 | scope-roadmap-epics/SKILL.md | ✅ Yes | ✅ Yes | None |
| 2 | assess-feasibility/SKILL.md | ⚠️ Implicit | ⚠️ Sufficient but could be clearer | Minor — add explicit fallback sentence |
| 3 | draft-technical-approach/SKILL.md | ✅ Yes (via optional input + conditional) | ✅ Yes | None |
| 4 | prepare-implementation/SKILL.md | N/A (profiles not directly consumed) | ✅ Yes | None |
| 5 | prepare-architecture/SKILL.md | ✅ Yes (HARD HALT) | ✅ Yes | None |
| 6 | plan-roadmap/SKILL.md | ✅ Yes (advisory, null-safe) | ✅ Yes | None |

**Verdict:** All 6 files handle profile absence correctly. One minor clarity improvement recommended for assess-feasibility.

---

## Detailed Analysis

### 1. scope-roadmap-epics/SKILL.md

**Guard found:** Step 2b explicitly states:
> "If profiles section is absent, proceed without profile-informed reasoning (backward compatible)."

**Assessment:** ✅ Correct. The guard is explicit and uses the exact phrase "backward compatible." Profiles enrich epic scoping (PP-7 informs domain taxonomy, PP-6 informs ambition depth, NFR/QP inform infrastructure/quality epics) but their absence does not block the workflow.

**Relevant constraint:** Step 5 also says "when profiles are available, the agent reasons about feature depth" — conditional phrasing reinforces the guard.

---

### 2. assess-feasibility/SKILL.md

**Guard found:** Implicit via conditional "When" phrasing:
- Step 4: "When profiles are available in product.yaml, calibrate risk assessment:"
- Step 5: "Profile-architecture misalignment: features that require infrastructure beyond what the profiles suggest..."
- Constraints: "WHEN profiles are available in product.yaml, USE them to calibrate risk levels and identify gaps — do not ignore profile data"

**Assessment:** ⚠️ Sufficient but could be more explicit. The "When profiles are available" conditional phrasing correctly implies that profile-based calibration is skipped when profiles are absent. However, unlike scope-roadmap-epics, there is no explicit fallback sentence like "If profiles are absent, proceed with standard risk assessment."

**Recommendation:** Add an explicit fallback line after the "When profiles are available" block in Step 4:
> "If profiles section is absent in product.yaml, proceed with standard risk assessment without profile calibration (backward compatible)."

**Risk if not addressed:** Low. The conditional "When" phrasing is unambiguous to a model — if profiles aren't available, the conditional block is skipped. No functional breakage would occur.

---

### 3. draft-technical-approach/SKILL.md

**Guard found:** Multiple layers of explicit optionality:
- Input declaration: `profiles_ref — (optional)` and `product_yaml_path — (optional)`
- Step 2: "If `profiles_ref` is provided, extract all three profile axes (PP, NFR, QP) — these are primary inputs for technology selection and NFR derivation."
- NFR section: "When `profiles_ref` is provided: NFR requirements MUST be derived from NFR Profile levels..."
- Constraints: "WHEN profiles_ref is provided, ALWAYS derive NFR requirements from NFR Profile levels with traceable rationale"

**Assessment:** ✅ Correct. The input is marked optional. The conditional "If/When provided" pattern means the skill can produce architecture.yaml with or without profile input. When profiles are absent, NFRs are still required (performance and security at minimum per constraints) but are derived from features.yaml behaviors/invariants rather than profile levels.

---

### 4. prepare-implementation/SKILL.md

**Guard found:** N/A — profiles are not a direct input to this play.

**Assessment:** ✅ Correct by design. prepare-implementation's pre-flight checks are:
- C21: Locked `architecture.yaml` exists → **Hard halt** if missing
- C22: Locked `quality-standards.yaml` exists → **Hard halt** if missing

Profiles are consumed *transitively* — they are embedded in `architecture.yaml` and `quality-standards.yaml`, which were produced by `prepare-architecture` (which DOES require profiles). Step 0 says "Extract technology selections, quality standards, and profile context from architecture.yaml and quality-standards.yaml." The play never reads profiles directly from product.yaml.

**Implication:** A product.yaml without profiles cannot reach prepare-implementation because prepare-architecture (which produces the required upstream artifacts) would hard-halt first. The transitive dependency chain correctly enforces the profile requirement where needed.

---

### 5. prepare-architecture/SKILL.md

**Guard found:** Pre-flight HARD HALT:
> "Product has `profiles` section with all 3 sub-sections (`product_profile`, `nfr_profile`, `quality_profile`) | C1, F6 | Hard halt — profiles required for profile-driven architecture"

**Assessment:** ✅ Correct. This play's entire purpose is profile-driven architecture design. Profiles are not optional here — they are the primary input that drives NFR derivation (C4), technology selection (C3), and quality standards (C5). A hard halt is the correct behavior because producing architecture without profiles would violate the play's core intent.

**Note:** This is the only play that REQUIRES profiles with a hard halt. This is intentional — prepare-architecture is the boundary where profiles become mandatory. Downstream plays (prepare-implementation) inherit the guarantee transitively.

---

### 6. plan-roadmap/SKILL.md

**Guard found:** Multiple null-safe patterns:
- Step 2 contract: `"profiles": "{profiles extracted from product.yaml if present, null otherwise}"`
- SE-9 (C12): "PASS if profiles were passed or product.yaml has no profiles section. FAIL if product.yaml has profiles but they were not passed to the agent."
- SCE-5 (S7): "PASS if epic depth correlates with profile values or product.yaml has no profiles section. FAIL if epic depth contradicts profiles."

**Assessment:** ✅ Correct. Profiles are treated as advisory in plan-roadmap. The null-safe pattern (`if present, null otherwise`) ensures the contract is always valid. C12 is explicitly described as advisory — the eval passes when profiles are absent. SCE-5 explicitly includes the "or product.yaml has no profiles section" escape clause.

**Note:** plan-roadmap runs BEFORE prepare-architecture in the workflow. Products at this stage may not yet have profiles (profiles are typically added during or after product discovery). The advisory treatment is correct for this position in the pipeline.

---

## Backward Compatibility Chain

```
product discovery → plan-roadmap → prepare-architecture → prepare-implementation
                    (profiles       (profiles REQUIRED    (profiles consumed
                     advisory,       with hard halt)       transitively via
                     null-safe)                            architecture.yaml)
```

- **Pre-profile stage** (plan-roadmap): Profiles optional, null-safe, advisory only
- **Profile gate** (prepare-architecture): Hard halt if profiles missing — this is where profiles become mandatory
- **Post-profile stage** (prepare-implementation): Profiles not directly checked — guaranteed by upstream prepare-architecture

This chain is correctly designed. Products without profiles can plan roadmaps but cannot produce architecture or implementation artifacts.

---

## Conclusion

All 6 files handle profile absence correctly. The only recommended improvement is a minor explicitness enhancement in `assess-feasibility/SKILL.md` to add a fallback sentence matching the pattern used in `scope-roadmap-epics/SKILL.md`. This is cosmetic — the current conditional phrasing is functionally correct.
