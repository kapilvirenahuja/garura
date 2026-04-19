# ADR 011: STM as Inter-Skill Data Transport (Phoenix Architecture)

## Status

Accepted

## Date

2026-03-04

## Context

In multi-step plays, each step produces structured data that the next step consumes. The naive design passes this data through agent memory — a skill returns a YAML blob, the play holds it in context, and passes it as a parameter to the next agent/skill.

This design has a critical failure mode: **agent memory is unreliable for large, structured payloads**.

Observed failures in `plan-roadmap`:
1. `scope-roadmap-epics` returns `scoped_epics` (full epic list, 3–6 epics, each with 9+ fields)
2. Play context passes `scoped_epics: {from Step 1}` to `draft-roadmap-brief`
3. `draft-roadmap-brief` skill instructs the agent to "use the scoped_epics input" to generate per-epic cards
4. Agent generates HTML from training knowledge about what roadmap briefs look like, ignoring the actual epic data — because the data was compressed or lost in the memory handoff

This is not an isolated bug. It is a structural failure mode of in-memory data transport for complex, schema-bound artifacts.

**Root causes:**
- Long context compression loses structured data fidelity
- Agent "fills in" what it expects, not what was passed
- No verification that the downstream skill actually read the upstream data
- Passing large structured blobs through play context is fragile and invisible

ADR 008 established issue-centric STM as the storage model for play execution artifacts. This ADR extends that principle to **skill output data** — not just checkpoints and evidence, but intermediate artifacts that flow between skills in a play.

## Decision

### Core Principle: Skills Write to STM, Downstream Reads from STM

**Every skill that produces structured data consumed by a downstream skill MUST write that data to an STM file and return the file path — not the data itself.**

```
❌ WRONG — in-memory transport
skill_A returns: { epics: [...] }
play passes:   scoped_epics: {from Step 1}
skill_B receives: scoped_epics in context

✅ CORRECT — STM transport
skill_A writes:   .garura/project/product/{slug}/epics.yaml
skill_A returns:  { epics_path: ".garura/..." }
play passes:    epics_path: "{from Step 1}"
skill_B reads:    Read tool call to epics_path
```

### Rules

**1. Skills write, not return**

Any skill producing structured data for downstream consumption must:
- Write the full artifact to a predictable STM path
- Return only the path (and a summary like `epic_count`)
- NEVER pass the full data structure through the output contract

**2. Downstream skills read explicitly**

Any skill consuming upstream output must:
- Issue an explicit `Read` tool call to the provided path
- NOT rely on data passed through play context or agent memory
- Fail with structured error if the file is not found at the path

**3. Paths are the contract, not data shapes**

Play context passes paths between steps:
- `epics_path: ".garura/project/product/{slug}/epics.yaml"`
- `feasibility_path: ".garura/project/product/{slug}/feasibility.yaml"`

Not data blobs like `scoped_epics: {full yaml}`.

**4. STM files are addressable artifacts**

Every intermediate artifact has a canonical path pattern:
```
.garura/project/product/{slug}/{artifact-name}.yaml
```

These files are:
- Written by the producing skill using the Write tool
- Read by consuming skills using the Read tool
- Committed to version control as part of the plan-roadmap evidence
- Addressable for inspection, debugging, and resume

**5. Templates define the schema**

Each skill that writes an STM artifact MUST have a corresponding output template in its `templates/` directory (per ADR 009 — output format is skill behavior and stays local). The template defines the YAML schema — no freeform writing. Note: content templates (e.g., roadmap-brief.html) live in LTM, not skill-local.

### Applied to plan-roadmap

| Step | Skill | Writes To | Path Returned | Next Step Reads |
|------|-------|-----------|---------------|-----------------|
| Step 1 | `scope-roadmap-epics` | `{slug}/epics.yaml` | `epics_path` | Step 2, Step 3, Step 5 |
| Step 2 | tech-designer | `{slug}/feasibility.yaml` | `feasibility_path` | Step 3, Step 5 |
| Step 3 | `draft-roadmap-brief` | `{slug}/brief-{ts}.html` | `brief_path` | Step 4 (review gate) |
| Step 5a | `draft-roadmap` | `{slug}/roadmap.md` | `roadmap.path` | Step 5b |
| Step 5b | `generate-engineering-view` | `{slug}/roadmap-engineering.md` | `engineering_view.path` | — |

The checkpoint (Step 4) stores paths, not data. Resume reads paths from the checkpoint, not data from context.

### Enforcement

**In SKILL.md:** Every skill with downstream consumers MUST include:
```
- NEVER pass full {artifact} data through memory — ALWAYS write to STM and return the path
- ALWAYS write the artifact to `{path}` before returning output
```

**In play SKILL.md:** Every inter-step handoff MUST use path variables, not inline data. Play context blocks must not contain large YAML blobs.

**In downstream skill Process sections:** Step 1 MUST be a Read tool call to the provided path, with an explicit note that the data MUST come from the file, not from memory.

## Consequences

### Positive

- **Eliminates memory transport failures** — Data fidelity is preserved in files; agents cannot "fill in" from training knowledge
- **Inspectable intermediate state** — Every inter-skill artifact is a readable file; failures are debuggable
- **Resumable by design** — Checkpoints store paths; plays resume by reading files, not reconstructing memory
- **Verifiable** — A downstream skill can assert the file exists and has the expected schema before proceeding
- **Audit trail** — Intermediate artifacts are committed to version control alongside evidence
- **Cross-session continuity** — Data in files survives session resets; data in memory does not

### Negative

- **More I/O operations** — Each skill writes a file; downstream skills issue explicit Read calls. For small payloads (≤5 epics) this is overhead without technical necessity.
- **Path coupling** — Skills are coupled to path conventions; path changes require skill updates.
- **`artifact_base` threading** — Plays must pass `artifact_base` to every skill that writes; adds a new required input.

### Mitigations

- Path convention is centralized (`.garura/project/product/{slug}/`) — one place to change
- `artifact_base` is a single parameter injected once by the play and threaded through
- I/O overhead is negligible compared to the cost of context reconstruction and failure recovery

## The Phoenix Architecture

This principle — skills and agents coordinating through STM files rather than in-memory data — is a core tenet of the Phoenix Architecture. Phoenix is the operational execution model of IDD:

> **Skills produce artifacts. STM is the shared workspace. Agents navigate STM. Memory is not the pipeline.**

In Phoenix, every meaningful output is materialized to a file. The agent's context window is for reasoning, not for carrying data. Files are durable, inspectable, and shareable — context is ephemeral, compressed, and invisible.

This ADR formalizes Phoenix's data transport rule for implementation.

## Related ADRs

- [ADR 001: Three-Layer Hierarchy](./001-three-layer-hierarchy.md) — Establishes the Play → Agent → Skill hierarchy
- [ADR 009: Skill LTM Reads](./009-skill-ltm-organizational-knowledge.md) — Output templates stay skill-local (skill behavior); content templates live in LTM (organizational knowledge)
- [ADR 008: Issue-Centric STM and NWWI](./008-issue-centric-stm-and-nwwi.md) — STM directory structure; checkpoints as resumption artifacts
- [ADR 010: STM Archival](./010-stm-archival.md) — Retention and archival of STM artifacts after issue close
