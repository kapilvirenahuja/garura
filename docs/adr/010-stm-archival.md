# ADR 010: STM Archival with Year-Month Bucketing

> **Historical note:** Framework later renamed to Garura. References to "Meridian" / "MDB" in this ADR are preserved verbatim for historical accuracy.


## Status

Accepted

## Date

2026-02-27

## Context

ADR 008 established issue-centric STM at `.meridian/{issue}/` with a flat directory structure. Retention was declared as "persist forever" with cleanup deferred as an open item.

At scale (100s-1000s of issues), this flat structure becomes unmanageable:

1. **Directory bloat** — Hundreds of issue directories at the same level
2. **No lifecycle signal** — No distinction between active work and completed work
3. **No temporal organization** — Historical artifacts have no time-based grouping for bulk operations

## Decision

### 1. Hybrid Active/Archive Model

Active issues remain flat at `.meridian/{issue}/` — zero path changes to plays, agents, or skills. Archived issues move to `.meridian/_archive/{YYYY-MM}/{issue}/`.

```
.meridian/
├── 62/                          # active — flat, fast lookup
├── 63/                          # active
├── _archive/
│   ├── 2026-01/
│   │   ├── 1/
│   │   └── 2/
│   └── 2026-02/
│       ├── 38/
│       └── 41/
├── _pending/                    # unchanged (ADR 008)
└── core/                        # LTM (unchanged)
```

### 2. Archival Trigger

Archival is invoked as the final step of the `capture-learning` play (IDSD phase: Learn-2-Memory). The play delegates the mechanical move to `repo-orchestrator` using the `archive-issue-stm` skill.

```
capture-learning (play)
    ├── Step 2: Extract & promote learnings (STM → LTM) ← not yet implemented
    └── Step 3: Archive STM directory ← implemented (v0.1.0)
```

Archival is appropriate when:
- The GitHub issue is closed (completed or not_planned)
- The feature branch has been merged and deleted
- No active play is using the STM directory

### 3. Year-Month Bucketing

The archive bucket is derived from the **close date** of the issue (not creation date). This groups completed work by when it was finished, which aligns with audit and retrospective needs.

Format: `{YYYY-MM}` — e.g., `2026-02` for work closed in February 2026.

### 4. Archive is Read-Only

No play reads from `_archive/` at runtime. The archive exists solely as an audit trail. Finding archived issues:

```bash
find .meridian/_archive -name "{issue}" -type d
```

### 5. Preservation Guarantee

All STM contents are preserved during the move — checkpoint, evidence, planning, spec, design, delivery. The directory structure within the issue folder is unchanged.

## Consequences

### Positive

- **Zero disruption** — Active issue paths unchanged; no play modifications needed
- **Temporal organization** — Year-month buckets enable bulk operations (delete old years, audit by month)
- **Clear lifecycle** — Active vs archived distinction at the filesystem level
- **Scalable** — Flat active directory stays manageable; history grows in organized buckets

### Negative

- **Manual trigger** — Archival must be explicitly invoked; forgotten archives accumulate in the active directory. Mitigation: integrate into delivery plays as a follow-on.
- **Close date dependency** — Requires knowing when the issue was closed. Mitigation: `gh issue view` provides `closedAt` field; skill derives bucket from this.

### Extends

This ADR extends [ADR 008: Issue-Centric STM and NWWI](./008-issue-centric-stm-and-nwwi.md). Specifically:

- ADR 008's active STM structure (`.meridian/{issue}/`) is **unchanged**
- ADR 008's `_pending/` mechanism is **unchanged**
- ADR 008's "persist forever" retention is refined: active issues persist in-place; closed issues persist in `_archive/` with year-month bucketing
- ADR 008's open item "Checkpoint cleanup policy" is partially addressed

## Related ADRs

- [ADR 008: Issue-Centric STM and NWWI](./008-issue-centric-stm-and-nwwi.md) — Extended by this ADR

## References

- GitHub Issue: [#63 — feat: archive STM directories on issue close with year-month bucketing](https://github.com/kapilvirenahuja/meridian-os/issues/63)
