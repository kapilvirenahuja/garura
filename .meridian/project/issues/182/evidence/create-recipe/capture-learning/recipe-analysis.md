# Recipe Analysis: capture-learning (Rebake)

## Current State

**Compiled SKILL.md:** Structure B (Fast execution), 2 agents (project-orchestrator, repo-orchestrator), 5 steps — all archival only.

**Intent.yaml:** Defines TWO phases:
1. **Archival** (C1-C4, F1-F5, S1-S2) — COMPILED
2. **Extraction** (C5-C13, F6-F11, S3-S6) — NOT COMPILED

## Gap: Extraction Phase Missing

The compiled recipe has ZERO steps for the extraction phase. Constraints C5-C13, failure conditions F6-F11, and scenarios S3-S6 are defined in intent.yaml but have no corresponding compiled steps, evals, or agent contracts.

### What extraction requires (from intent + knowledge-extractor agent):

1. **Read resolution traces** from archived STM (C5: read-only, C12: resolved_from=llm is primary signal)
2. **Synthesize patterns** from individual decisions (C13: 3-5 patterns, not 10-20 records)
3. **Classify** each candidate as project or core scope with reasoning (C10)
4. **Deduplicate** against existing LTM (C6)
5. **Ensure metadata** per knowledge-file-template.md (C7)
6. **Stage candidates** in STM for human review (C11: no LTM write without approval)
7. **Human approval** checkpoint
8. **Write approved candidates** to LTM (C8: no traceability links, C9: holistic organization)
9. **Update _index.md** for every written file

### Agents needed:

| Agent | Phase | Role |
|-------|-------|------|
| project-orchestrator | Archival | Verify issue closed |
| repo-orchestrator | Archival + Evidence | Archive STM, commit evidence |
| knowledge-extractor | Extraction | EXTRACT mode → WRITE mode |

### Skills needed:

| Skill | Agent | Exists? |
|-------|-------|---------|
| manage-issue | project-orchestrator | Yes |
| archive-issue-stm | repo-orchestrator | Yes |
| create-commit | repo-orchestrator | Yes |
| (none — agent IS the executor) | knowledge-extractor | N/A — agent has Read/Write/Glob/Grep |

### Workflow structure assessment:

Current Structure B is insufficient. Extraction requires human approval checkpoint (C11). **Structure A** is more appropriate:
- Pre-flight → Execution (archival) → Execution (extraction) → Checkpoint (human reviews candidates) → Execution (write approved) → Evidence

### Constraint classification (preliminary):

| ID | Category | Current Coverage |
|----|----------|-----------------|
| C1 | pre-flight | Covered (Step 1 eval) |
| C2 | artifact-verifiable | Covered (SE-1, SE-4) |
| C3 | artifact-verifiable | Covered (SE-2) |
| C4 | artifact-verifiable | Covered (SE-3) |
| C5 | structural | NOT COVERED |
| C6 | artifact-verifiable | NOT COVERED |
| C7 | artifact-verifiable | NOT COVERED |
| C8 | artifact-verifiable | NOT COVERED |
| C9 | structural | NOT COVERED |
| C10 | artifact-verifiable | NOT COVERED |
| C11 | structural | NOT COVERED |
| C12 | structural | NOT COVERED |
| C13 | artifact-verifiable | NOT COVERED |

| ID | Current Coverage |
|----|-----------------|
| F6-F11 | NOT COVERED |
| S3-S6 | NOT COVERED |
