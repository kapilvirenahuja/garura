# Play Review: prepare-architecture

**Reviewed:** 2026-03-25
**Intent hash (compiled):** `sha256:7eb225800685bb8952b08826081d1c0fe48650d36c817443930cb0e5a5077e30`
**Intent hash (computed):** `sha256:7eb225800685bb8952b08826081d1c0fe48650d36c817443930cb0e5a5077e30`
**Match:** ✓

## Semantic Map

```
prepare-architecture (L2, Structure A)
├── Phase: Preparation
│   ├── Step 1 — Read Upstream Context (orchestrator, no agent)
│   ├── Step 2 — Scan Codebase & Read LTM (tech-designer)
│   │   └── Evals: SE-1 (C10), SE-2 (C2)
│   ├── Step 3 — Draft Architecture (tech-designer → draft-technical-approach skill)
│   │   └── Evals: SE-3 (F1), SE-4 (C4,F2), SE-5 (F7)
│   └── Step 4 — Draft Quality Standards (tech-designer, direct work)
│       └── Evals: SE-6 (C5,F3), SE-7 (C5)
├── Phase: Checkpoint
│   ├── Step 5 — Generate Brief (doc-builder → generate-implementation-brief)
│   │   └── Evals: SE-8 (C7)
│   ├── Step 6 — Brief Review (orchestrator, Tether/Vanish)
│   └── Step 6b — Pre-Lock Resolution Gate (orchestrator)
│       └── Evals: SE-9 (C11,F5)
├── Phase: Lock
│   └── Step 7 — Lock (orchestrator)
├── Phase: Scenario Validation
│   └── Step 8 — SCE-1 (S1), SCE-2 (S2), SCE-3 (S3), SCE-4 (S4), SCE-5 (S5)
└── Phase: Evidence & Close
    └── Step 9 — Write Evidence and Report (orchestrator + repo-orchestrator)
```

**Agents:** 1 domain (tech-designer) + 2 utility (doc-builder, repo-orchestrator)
**Step evals:** 9 (SE-1 through SE-9)
**Scenario evals:** 5 (SCE-1 through SCE-5)

---

## Gap Analysis

| Check | Status | Details |
|-------|--------|---------|
| G1 Constraint Coverage | **PASS** | All 11 constraints (C1–C11) covered by category-appropriate mechanism. See breakdown below. |
| G2 FC Coverage | **PASS** | 5/7 FCs have explicit SE-* tag references. F4 substantively covered by SE-2 (tag says C2). F6 is a pre-flight condition (intent says "should halt in pre-flight") caught by pre-flight hard halt. See advisory. |
| G3 Scenario Coverage | **PASS** | All 5 scenarios (S1–S5) covered by SCE-1 through SCE-5. |
| G4 Skill Existence | **PASS** | All referenced skills exist: `draft-technical-approach`, `generate-implementation-brief`, `create-commit`. |
| G5 Agent Existence | **PASS** | All 3 agents exist: `tech-designer`, `doc-builder`, `repo-orchestrator`. |
| G6 Skill-Agent Alignment | **PASS** | `draft-technical-approach` in tech-designer's pool ✓. `generate-implementation-brief` in doc-builder's routing ✓. `create-commit` in repo-orchestrator's skills ✓. See advisory on Step 4. |
| G7 Contract Schema | **GAP** | All contracts have required fields (intent_path, stm_base, stm, task_id). However: (1) doc-builder response field mismatch — play checks `stm.architecture_brief_path` but doc-builder returns `stm.output.briefs_written[]` + `stm.output.hub_path`. (2) Tech-designer contracts use flat STM paths instead of agent-contract.md's `stm.input`/`stm.output` split. |
| G8 Template References | **PASS** | No skills reference LTM templates from `core/components/memory/standards/templates/`. No dangling references. |
| G9 Intent Hash Drift | **PASS** | Compiled hash matches computed hash: `7eb225...77e30`. No drift. |
| G10 Required Sections | **PASS** | All 9 required sections present: Frontmatter, Header, Compiled From, Role, Pre-flight, Workflow, Scenario Validation, Pause and Resume, Compilation Metadata. |

**Summary:** 9/10 PASS, 1 GAP found (G7)

---

## G1 — Constraint Coverage (Detail)

| Constraint | Category | Covered By | Status |
|------------|----------|------------|--------|
| C1 | pre-flight | Pre-flight table: product LOCKED, profiles section present, roadmap LOCKED | ✓ |
| C2 | artifact-verifiable | SE-2 (≥3 LTM files consulted) | ✓ |
| C3 | artifact-verifiable | SE-3 (every stack entry names specific technology) | ✓ |
| C4 | artifact-verifiable | SE-4 (NFR requirements traceable to NFR Profile levels) | ✓ |
| C5 | artifact-verifiable | SE-6 (qp_level matches QP profile, named tooling) + SE-7 (content consistent with level) | ✓ |
| C6 | structural | All contracts and paths use `.meridian/product/{slug}/` | ✓ |
| C7 | artifact-verifiable + structural | SE-8 (5 required tabs) + Step 5→6 checkpoint flow | ✓ |
| C8 | structural | Agent boundary table + "never execute domain work directly" in Role | ✓ |
| C9 | structural | Agent table: 1 domain (tech-designer), 2 utility exempt. Compilation Metadata confirms. | ✓ |
| C10 | artifact-verifiable | SE-1 (codebase findings referenced or greenfield stated) | ✓ |
| C11 | artifact-verifiable + structural | SE-9 (resolution gate blocks lock) + Step 6b structured interview | ✓ |

---

## G2 — Failure Condition Coverage (Detail)

| FC | Eval Tag | Status | Note |
|----|----------|--------|------|
| F1 | SE-3 (F1) | ✓ | Explicit tag |
| F2 | SE-4 (C4, F2) | ✓ | Explicit tag |
| F3 | SE-6 (C5, F3) | ✓ | Explicit tag |
| F4 | SE-2 (C2) | ⚠ | **Advisory:** SE-2 substantively covers F4 (checks ≥3 LTM files consulted, which fails when LTM not read). But SE-2 is tagged (C2), not (F4). Consider adding F4 to SE-2's tag: `SE-2 (C2, F4)`. |
| F5 | SE-9 (C11, F5) | ✓ | Explicit tag |
| F6 | Pre-flight (C1, F6) | ⚠ | **Advisory:** F6 is explicitly a pre-flight failure condition (intent says "the play should halt in pre-flight"). Covered by pre-flight hard halt. No SE-* eval needed since domain work never starts. Strict G2 reading expects an eval, but F6's own text mandates pre-flight handling. |
| F7 | SE-5 (F7) | ✓ | Explicit tag |

---

## G7 — Contract Schema (Detail)

### GAP 1: doc-builder response field mismatch

The play's Step 5 expected return says:
> "Contract with `stm.architecture_brief_path` and `stm.hub_path` populated"

But doc-builder's output contract returns:
```json
{
  "stm": {
    "output": {
      "briefs_written": ["<path>"],
      "hub_path": "<path>"
    }
  }
}
```

**Mismatches:**
- Play expects `stm.architecture_brief_path` → doc-builder returns `stm.output.briefs_written[0]`
- Play expects `stm.hub_path` → doc-builder returns `stm.output.hub_path`

This affects Step 5 return validation, SE-8 eval (reads `stm.architecture_brief_path`), and Step 8 SCE-3.

**Fix:** Update play Step 5 to read `stm.output.briefs_written[0]` for the architecture brief path and `stm.output.hub_path` for the hub path. Update SE-8 and downstream references accordingly.

### Advisory: tech-designer flat STM paths

Steps 2–4 contracts use flat STM paths:
```json
"stm": {
  "product_yaml_path": "...",
  "context_report_path": null
}
```

Agent-contract.md universal schema specifies:
```json
"stm": {
  "input": { ... },
  "output": { ... }
}
```

The flat structure matches tech-designer's own agent definition examples, so it will function correctly. However, it deviates from the universal contract standard, which could cause issues if agent-contract.md is enforced as a strict schema.

---

## G6 — Skill-Agent Alignment (Advisory)

Step 4 assigns quality-standards.yaml production to `tech-designer` without naming a skill. The tech-designer agent has `Write` tool access and can produce the artifact directly. However:

- `draft-technical-approach` is a dedicated skill for architecture.yaml
- No analogous `draft-quality-standards` skill exists for quality-standards.yaml
- The quality-standards.yaml has its own schema (`schemas/quality-standards.yaml`)

This asymmetry is functional but inconsistent. A `draft-quality-standards` skill would:
1. Own the schema conformance
2. Make the skill explicit in the contract
3. Allow independent testing/evolution of quality standards production

---

## Recommendations

| Priority | Action | Fixes |
|----------|--------|-------|
| **P1** | Fix doc-builder response field references in Step 5 expected return, validation check, SE-8, and downstream eval references | G7 GAP 1 |
| **P2** | Add F4 to SE-2's tag: `SE-2 (C2, F4)` for explicit FC traceability | G2 advisory |
| **P3** | Consider creating `draft-quality-standards` skill to match `draft-technical-approach` pattern | G6 advisory |
| **P3** | Consider aligning tech-designer contracts with agent-contract.md stm.input/stm.output schema | G7 advisory |

---

Run `/create-play --rebake prepare-architecture` to fix identified gaps.
