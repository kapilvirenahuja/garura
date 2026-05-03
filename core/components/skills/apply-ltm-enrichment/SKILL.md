---
name: apply-ltm-enrichment
description: ENRICH mode — apply APPROVED proposals from reconciliation-proposals.yaml to product LTM artifacts in place. Only writes proposals whose approval_status is "approved". Emits an enrichment-report.yaml recording every write.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Grep
---

# apply-ltm-enrichment

Model-invocable skill for ENRICH-mode LTM writes.

## Purpose

Given a human-approved `reconciliation-proposals.yaml`, apply each approved proposal to its target LTM artifact. Writes are in-place. Refuses to write for any proposal whose `approval_status` is not `approved`. Records every write in `enrichment-report.yaml`.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `reconciliation_proposals_path` | yes | Path to the proposals file with approval_status populated |
| `product_ltm_root` | yes | Root of product LTM (the write surface) |
| `output_base` | yes | Directory to write enrichment-report.yaml |
| `dry_run` | optional | If true, compute writes but do not modify disk |

## Process

1. **Read proposals.** Validate every proposal entry has `approval_status` set. Entries with `pending` or missing are skipped (and recorded as skipped).

2. **Partition.** For each approved proposal, derive the target path. Reject writes that target anywhere outside `product_ltm_root` (no core LTM writes here — core LTM requires ADR + human merge via a separate flow).

3. **Apply change.** Depending on `action`:
   - `modify` — open target, locate insertion point, apply change block preserving surrounding content
   - `add` — create the target file (with `origin: learning_extraction` provenance header)
   - `contradict_with_adr` — update target status to reflect the ADR (`SUPERSEDED_BY: ADR-NNNN`), ADR file itself is added to the ADR index

4. **Verify.** After each write, re-read the target and confirm the change is present. Any mismatch → record as `verification_failed` in the report but do not undo.

5. **Emit enrichment-report.yaml:**

   ```yaml
   sourced_from: "{reconciliation_proposals_path}"
   applied_at: "{ISO-8601}"
   dry_run: {bool}
   writes:
     - proposal_id: P-001
       target_path: "{LTM artifact}"
       action: modify | add | contradict_with_adr
       status: applied | skipped | verification_failed
       reason: "{if not applied}"
   summary:
     applied: {n}
     skipped: {n}
     failed: {n}
   ```

## Output

```yaml
enrichment_report_path: "{output_base}/garura:enrichment-report.yaml"
applied_count: {n}
skipped_count: {n}
failed_count: {n}
status: written
```

## Failure Modes

| What failed | Cause | Return |
|-------------|-------|--------|
| Proposals file missing | I/O | `status: failed`, `reason: missing_input` |
| Target path outside product_ltm_root | Scope violation | Proposal marked `skipped: out_of_scope`, continue others |
| Write error on target | I/O | Proposal marked `failed`, report continues |
| Zero approved proposals | No-op | `status: no_op`, report still written |

## Boundaries

- Only writes under `product_ltm_root`. Refuses writes elsewhere.
- Refuses to apply proposals with `approval_status != approved`.
- Never modifies STM.
- Never modifies core LTM.
