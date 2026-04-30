---
name: promote-adr-draft
description: Promote one approved Tier 1 enrichment proposal's ADR draft into the docs/adr/ archive as a new sequentially-numbered ADR file. Used exclusively by the enrich play after a Tier 1 proposal carrying an adr_draft_path is approved by the reviewer. Closes the gap apply-ltm-enrichment leaves around ADR file creation.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Glob, Bash
---

# promote-adr-draft

Model-invocable skill that creates an ADR file in `docs/adr/` from an approved Tier 1 proposal's draft.

## Purpose

`reap` produces ADR drafts for Tier 1 proposals and stores them at `adr_draft_path` (typically under `{stm_base}/{issue}/evidence/reap/adr-drafts/`). The downstream writer `apply-ltm-enrichment` knows how to update an LTM artifact's status to point at the new ADR (e.g., `SUPERSEDED_BY: ADR-NNNN`) but does NOT actually create the ADR file. This skill closes that gap: given one approved Tier 1 proposal, read the draft, find the next sequential ADR number, and write a new ADR file.

Single-proposal scope by design. The play iterates over approved Tier 1 proposals and calls this skill once per proposal. That keeps the operation atomic — if numbering, slug derivation, or the write itself fails for one proposal, the others aren't half-applied.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `proposal_id` | yes | Identifier of the approved T1 proposal — recorded in the new ADR's frontmatter for provenance and idempotency |
| `adr_draft_path` | yes | Path to the draft markdown file emitted by `reap` (or any other extractor that emits ADR drafts) |
| `proposal_title` | optional | If provided, used as the basis for the slug. Otherwise the title is extracted from the draft itself. |
| `adr_root` | optional | Default `docs/adr/`. Override only for testing. |

## Process

### 1. Verify draft exists

```bash
test -f "{adr_draft_path}" || exit
```

Missing → `status: failed, reason: draft_missing`.

### 2. Idempotency check — has this proposal already been promoted?

Search `adr_root` for any existing ADR whose frontmatter records `sourced_from: {proposal_id}`:

```bash
grep -l "sourced_from: {proposal_id}" {adr_root}/*.md 2>/dev/null
```

If a match is found, return:

```yaml
adr_path: "{matching ADR path}"
adr_number: {N from filename}
status: already_promoted
reason: "ADR already exists for proposal {proposal_id} at {path}"
```

Do NOT write a second ADR. The play may legitimately invoke this skill more than once for the same proposal (e.g., resume after a partial run); idempotency lives here.

### 3. Determine next ADR number

List existing ADR files and parse leading digits from each filename. ADR filename convention: `NNN-{slug}.md` or `NNNN-{slug}.md` (the project may pad to 3 or 4 digits depending on history).

```bash
ls {adr_root}/*.md 2>/dev/null | sed -E 's|.*/||; s|^([0-9]+)-.*|\1|' | grep -E '^[0-9]+$' | sort -n | tail -1
```

Take max + 1 as the next number. Pad to the same width as the existing files — if existing files use 3 digits, pad to 3; if 4, pad to 4. If no ADRs exist yet, start at `001` (3-digit default).

### 4. Derive slug

Slug source order:

1. If `proposal_title` was provided, use it.
2. Otherwise read the draft and extract the first H1 (`# ` line) as the title.
3. If neither yields a title, fail with `status: failed, reason: title_missing`.

Sanitize: lowercase, replace any non-alphanumeric run with a single hyphen, strip leading/trailing hyphens, truncate at 60 characters.

### 5. Compose the ADR filename and refuse collision

`{adr_root}/{NNNN}-{slug}.md`

If the file already exists at that path, that means our numbering scan missed it (race or bug). Refuse to overwrite — return `status: failed, reason: numbering_collision` with the conflicting path. The caller can retry; idempotency at step 2 will then short-circuit if a prior partial write actually committed.

### 6. Write the ADR

The new ADR is the draft body verbatim, prefixed with a frontmatter block recording provenance:

```markdown
---
adr_number: {NNNN}
sourced_from: {proposal_id}
promoted_at: {ISO-8601}
source_path: {adr_draft_path}
status: PROPOSED
---

{draft body verbatim}
```

If the draft already has its own YAML frontmatter, merge: keep draft fields, add the four provenance fields above. Don't duplicate `status` if the draft sets it; the draft wins.

The body is preserved without modification — reviewers approved that content; this skill is not authoring or editing.

## Output

```yaml
adr_path: "{adr_root}/{NNNN}-{slug}.md"
adr_number: {NNNN}
slug: "{slug}"
status: written | already_promoted | failed
reason: "..."   # only when status != written
```

## Failure Modes

| What failed | Cause | Return |
|-------------|-------|--------|
| Draft path missing or unreadable | I/O | `status: failed, reason: draft_missing` |
| No extractable title (no `proposal_title`, no H1 in draft) | Input quality | `status: failed, reason: title_missing` |
| Numbering collision (target filename already exists, no matching `sourced_from`) | Race / bug | `status: failed, reason: numbering_collision` |
| Write error on target path | I/O | `status: failed, reason: write_error` |
| Slug sanitizes to empty string | Input quality | `status: failed, reason: slug_empty` |

## Boundaries

- Writes ONLY under `adr_root` (default `docs/adr/`). Refuses any other write target.
- Reads the draft and existing ADR filenames/frontmatter. Never reads or modifies STM, product LTM, or core LTM.
- Single-proposal scope. The caller is responsible for iterating over the approved Tier 1 proposals.
- Stateless across calls. Idempotency is enforced by reading existing ADR frontmatter — there is no in-memory or sidecar ledger.
- Never modifies the source proposal file or marks anything as applied. The play and `apply-ltm-enrichment` own those records.
