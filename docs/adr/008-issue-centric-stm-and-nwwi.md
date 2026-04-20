# ADR 008: Issue-Centric STM Structure and NWWI Principle

## Status

Accepted

## Date

2026-02-06

## Context

ADR 002 established the L1 checkpoint model: every play produces an artifact and stops at a checkpoint for human approval. It defined STM locations as `.garura/project/issues/{issue}/docs/` and `.garura/project/issues/{issue}/evidence/`.

However, the actual implementation diverged. Checkpoints were stored at:

```
.garura/project/checkpoints/{play}/{timestamp}.md
```

This created several problems:

1. **No issue traceability** — Timestamp-named files have no connection to the triggering issue. You must open a file to understand what it relates to.
2. **Orphaned data** — Checkpoint files with `PENDING_APPROVAL` status are never updated. No mechanism links them back to the workflow that created them.
3. **No resumability** — Checkpoints capture what was proposed and decided, but not enough state to resume a play after session loss.
4. **Contradicts ADR 002** — ADR 002 specifies `.garura/project/issues/{issue}/` as STM location, but checkpoints bypass this structure entirely.
5. **Issue-agnostic** — The structure enables working without an issue, undermining traceability and audit requirements.

Additionally, long-running plays and cross-session workflows need a mechanism to checkpoint execution state and resume later — potentially from a different tool or session.

## Decision

### 1. NWWI Principle: No Work Without an Issue

All play work that produces checkpoints **must** be associated with a GitHub issue. The directory structure enforces this by requiring an issue number as the top-level organizer.

**Enforcement point:** `commit-code` is the hard gate. No commit can proceed without an issue ID. This means:

- Work **can start** without an issue (exploration, prototyping)
- Work **cannot ship** without an issue (commits, PRs require issue linkage)
- At commit time, all unlinked work must be associated with an issue — either by creating one or linking to an existing one

### 2. Issue-Centric STM Structure

All STM artifacts are organized under `.garura/project/issues/{issue-number}/`:

```
.garura/project/issues/{issue-number}/
├── docs/                          # Specs, designs, RCA
│   ├── spec.md
│   ├── tech-design.md
│   └── rca.md
├── evidence/                      # Proof of work quality
│   ├── changes.md
│   ├── tests.md
│   └── validation.md
└── checkpoint/                    # Play execution state
    └── {play-name}/
        └── {timestamp}.md
```

**Example — full lifecycle of issue #37:**

```
.garura/project/issues/37/
├── docs/
│   └── tech-design.md
├── evidence/
│   └── validation.md
└── checkpoint/
    ├── start-feature/
    │   └── 20260206-190000.md     # Branch created
    ├── commit-code/
    │   ├── 20260206-191000.md     # Rejected (wrong grouping)
    │   └── 20260206-192000.md     # Approved, committed
    └── create-pr/
        └── 20260206-193000.md     # Approved, PR created
```

### 3. Three STM Categories

| Category | Path | Purpose | Producer |
|----------|------|---------|----------|
| **docs** | `{issue}/docs/` | Specifications, designs, analysis | `tech-designer` agent |
| **evidence** | `{issue}/evidence/` | Test results, validation, change proof | `quality-validator` agent |
| **checkpoint** | `{issue}/checkpoint/{play}/` | Play execution state for approval and resumption | Play orchestrator |

### 4. Two-Phase Write for Bootstrap

The `start-feature` play creates the issue — but needs working space before the issue number exists. This is resolved with a two-phase write:

1. **Phase 1:** Write to `_pending/` temporary location while issue is being created
2. **Phase 2:** Move to `.garura/project/issues/{issue}/` once the issue number is known (within the same play run)

```
.garura/project/issues/
├── _pending/                      # Temporary, pre-issue
│   └── {timestamp}/
│       └── checkpoint/
│           └── start-feature/
│               └── {timestamp}.md
└── 37/                            # Permanent, post-issue
    └── ...
```

`_pending/` is a transient location. Its contents must be migrated to an issue directory before the play completes. Orphaned `_pending/` entries indicate failed or abandoned play runs.

### 5. Mandatory Checkpoint Schema

Every checkpoint file must include these structural elements, regardless of the play:

```markdown
# {Play Name} Checkpoint

## Metadata
- **Issue:** #{issue-number}
- **Play:** {play-name}
- **Step:** {current-step} of {total-steps}
- **Created:** {YYYY-MM-DD HH:MM:SS}
- **Status:** {PENDING_APPROVAL|APPROVED|REJECTED}

## Task List
| Task | Status | Agent |
|------|--------|-------|
| {task} | {pending|completed|skipped} | {agent-name} |

## Completed Outputs
{Structured results from completed steps — agent outputs, artifacts produced, decisions made}

## Current Step
{What the play was doing when it checkpointed}

## Inputs Needed to Continue
{What the next step requires — parameters, decisions, approvals}
```

**Mandatory fields:**
- **Metadata** — Issue, play, step position, timestamp, status
- **Task list** — What was planned, what's done, what remains
- **Completed outputs** — Agent results from prior steps
- **Inputs needed to continue** — What's required to resume

Plays define additional fields specific to their domain on top of this base schema.

### 6. Checkpoint Resumption

A `/resume` skill provides the resumption interface:

- **Input:** Issue ID (required)
- **Behavior:**
  1. Scans `.garura/project/issues/{issue}/checkpoint/` for all play checkpoints
  2. Identifies the most recent pending checkpoint
  3. If multiple pending checkpoints exist, presents a list for user selection
  4. Loads the checkpoint context and re-enters the play at the recorded step

**Design properties:**
- User only needs to know the issue ID — `/resume 37`
- No dependency on remembering which play or step
- Enables cross-session continuity (start in one session, resume in another)
- Enables async review (checkpoint created → user reviews offline → resumes later)

### 7. Tool-Agnostic Design

The checkpoint format is plain markdown. Any tool that can read and write markdown files can participate:

- **Claude Code CLI** — Creates and resumes checkpoints
- **Claude Desktop** — Can review and approve checkpoints
- **GitHub** — Checkpoints are committed, reviewable in PRs
- **CI/CD** — Automation can read checkpoints and trigger workflows
- **Custom tooling** — Parse markdown, update status, trigger resume

No tool-specific contracts or APIs are defined. The file format is the interface.

### 8. Retention

Checkpoint artifacts **persist forever**. They are version controlled and committed to the repository as a permanent audit trail. Storage cost is negligible (small markdown files). This provides:

- Complete decision history per issue
- Audit trail of approvals and rejections
- Evidence of workflow execution for compliance

## Consequences

### Positive

- **Full traceability** — Path alone tells you: which issue, which play, when
- **NWWI enforced** — Structure requires issue context; commit-code is the hard gate
- **Resumable workflows** — Mandatory schema captures enough state to resume plays
- **Cross-session/cross-tool** — Plain markdown enables async review and tool handoff
- **Token management** — Long-running plays can checkpoint and release context
- **Clean audit trail** — One directory per issue with complete lifecycle history
- **Consistent with ADR 002** — Restores the issue-centric STM that ADR 002 specified but was never implemented

### Negative

- **Ceremony for ad-hoc work** — Quick fixes require eventual issue creation before commit. Mitigation: enforcement is at commit time, not at work start. Exact ad-hoc flow is deferred for real-world validation.
- **Migration required** — Existing timestamp-based checkpoints must be deprecated. All plays need updating.
- **Checkpoint schema overhead** — Every checkpoint must include mandatory fields even for simple plays. Mitigation: schema is minimal; plays add specifics only as needed.
- **`_pending/` complexity** — Two-phase write adds a temporary directory and migration logic. Mitigation: only applies to `start-feature`; other plays have issue context upfront.

### Supersedes

This ADR **supersedes the checkpoint location model** in ADR 002. Specifically:

- ADR 002's artifact locations (`.garura/project/issues/{issue}/docs/` and `/evidence/`) remain unchanged
- ADR 002's checkpoint model (artifact + checkpoint) remains unchanged
- The checkpoint **storage path** changes from `.garura/project/checkpoints/{play}/{timestamp}.md` to `.garura/project/issues/{issue}/checkpoint/{play}/{timestamp}.md`
- A new **mandatory checkpoint schema** is introduced
- A new `/resume` skill is introduced

ADR 002's core principle — every play produces an artifact and stops at a checkpoint — is preserved and strengthened.

## Open Items (Deferred)

These items are acknowledged but intentionally deferred for real-world validation:

| Item | Reason for Deferral |
|------|-------------------|
| Ad-hoc work flow details | Needs to be seen in action before designing |
| `/resume` skill implementation | Checkpoint schema must stabilize first |
| Guardian integration with new checkpoints | Depends on play development |
| Checkpoint cleanup policy | Retention is "persist forever" for now; revisit if storage becomes a concern |

## Related ADRs

- [ADR 001: Three-Layer Hierarchy](./001-three-layer-hierarchy.md)
- [ADR 002: L1 Checkpoint Model](./002-l1-checkpoint-model.md) — Superseded (checkpoint location only)
- [ADR 003: Guardian Approval Model](./003-guardian-approval.md)

## References

- GitHub Issue: [#7 — feat(stm): issue-centric artifact structure with checkpoint-based play resumption](https://github.com/kapilvirenahuja/meridian/issues/7)
