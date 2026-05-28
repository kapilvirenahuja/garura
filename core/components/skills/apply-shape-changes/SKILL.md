---
name: apply-shape-changes
description: Assemble and write grill-me's atomic close bundle. Reads the session's accumulated state (anchor lock, all round reports, agreed resolutions, accepted gaps, code-side implications), drafts the locked shape document plus every implied target-shape edit plus the create-or-update of the now→then epic plus exactly one code follow-up issue, presents the full bundle for one human approval, and on approval writes everything in a single all-or-nothing transaction. The play's atomicity guarantee (C12) and the no-code rule (C13) live here. Used only by the grill-me play, exactly once per session, at close.
user-invocable: false
model: sonnet
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# apply-shape-changes

The atomic close of a grilling session. Turns the in-memory session state
into a concrete bundle of file edits and one issue, presents it for one
approval, and writes it as a single transaction.

This skill owns four of grill-me's load-bearing rules:

- **C7** — the locked shape document is produced here, in the right
  location, with the right structure.
- **C8** — approval is one decision on the full bundle, not per-change.
- **C12** — every impacted target-shape artefact updates atomically;
  partial writes are forbidden and rolled back.
- **C13** — code files are never written; exactly one code follow-up issue
  is filed regardless of whether code work is implied.
- **C14** — the now→then epic is created or updated as part of the bundle
  with a valid status.

It is the single write boundary for grill-me. No other skill in this play
edits product LTM, files issues, or commits.

## Purpose

Given the session's accumulated state, produce and write:

1. The **locked shape document** at the issue's STM under the grill-me
   play, with the canonical structure described below.
2. The **target-shape artefact edits** — one per impacted artefact named
   in the session state. Each edit's content is the resolved text the
   session converged on during rounds.
3. The **epic create-or-update** for the now→then journey, with status set
   in the canonical 5-point vocabulary.
4. **Exactly one code follow-up issue**, filed via `manage-issue` — its
   body either summarises the engineering work needed for current shape to
   catch up to the new target, or explicitly declares "no code changes
   required" when nothing code-side is implied.

The bundle is presented for one approval. On approval, every write happens
atomically through a transactional writer. On rejection or any single-write
failure, nothing in the bundle persists.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `anchor_lock_path` | yes | From `resolve-grill-anchor`. |
| `touchpoints_path` | yes | From `resolve-grill-anchor`. |
| `session_state_path` | yes | Path to the rolling session state YAML the play maintains — round logs, syntheses, tensions, resolutions, accepted gaps, code implications. Schema below. |
| `product_base` | yes | From config. |
| `stm_base` | yes | From config. |
| `issue` | yes | Issue number — STM root for the shape doc and the play evidence. |
| `branch` | yes | Branch name — used for the commit message context and the code follow-up issue body. |
| `approval_mode` | no | `interactive` (default — present the bundle, wait for Tether/Vanish) or `dry_run` (assemble + show, never write). |
| `code_follow_up_repo` | no | Override target repo for `manage-issue`. Defaults to the project repo from config. |

## Session state schema

The grill-me play maintains a single YAML at
`{stm_base}/{issue}/evidence/grill-me/session-state.yaml`, appended to round
by round. This skill consumes it at close.

```yaml
anchor_lock_path: <path>
register: product | technical
rounds:
  - round_id: R1
    questions: [...]
    answers: [...]
    synthesis_text: ...
    tensions_report_path: <path to per-round file from check-grill-tensions>
    resolutions:
      - tension_id: R1-T1
        resolution_text: <the resolved language agreed with the human>
        applies_to:
          - artefact_path: <relative path>
            edit_intent: <inline edit | section replace | section add | field set>
            target_locator: <heading id | yaml path | line anchor>
accepted_gaps:
  - tension_id: <id of a tension the human accepted as a gap>
    reason: <human's words>
code_implications:
  - summary: <one-paragraph engineering work item>
    cited_resolution: <which session resolution implies it>
proposed_epic:
  mode: create | update
  epic_target: <path to existing epic when update; otherwise null>
  proposed_name: <when create>
  proposed_status: planned | development | rollout | released | cleanup
  rationale: <one paragraph: why this is the now→then journey for the locked shape>
termination_reason: defensible | human_good_enough
```

The session state's `resolutions[].applies_to[]` entries are the source of
truth for which artefacts get edited and how. If the resolutions are
incomplete (a resolution agreed in conversation but never recorded as
applying to a concrete artefact), the close cannot proceed — see
**Bundle integrity gate** below.

## Process

1. **Read everything.** Anchor lock, touchpoints, session state, every
   round's tensions report. Read each artefact named in any
   `resolutions[].applies_to[].artefact_path` for its current contents.

2. **Bundle integrity gate.** Before any draft work, verify:

   - Every live tension is either resolved (`resolution_text` present) or
     accepted_gap.
   - Every resolution either has at least one `applies_to` entry, or is
     explicitly tagged as `documentation_only_in_shape_doc` in the
     session state.
   - Every `applies_to.artefact_path` is also present in the touchpoints
     inventory. (Drift between what was inventoried and what is being
     edited is suspicious — halt with `reason: touchpoint_inventory_drift`
     and let the play surface this to the human.)
   - Every `applies_to.artefact_path` resolves to a file under
     `product_base`. NEVER under any path that looks like code
     (`src/`, `lib/`, `app/`, `pkg/`, `internal/`, language-specific
     source directories). If any path looks like code, halt with
     `reason: code_path_in_bundle` (this is the F13 guard).
   - `proposed_epic` is populated and `proposed_status` is one of the
     canonical 5. Halt with `reason: missing_epic_in_bundle` or
     `reason: invalid_epic_status` otherwise (F14 guard).

3. **Draft the shape document.** Write to
   `{stm_base}/{issue}/evidence/grill-me/locked-shape.md` using the
   canonical structure below. Plain language, register matching the
   anchor lock.

4. **Draft per-artefact edits.** For each impacted artefact, produce the
   exact replacement content. Use the `applies_to.edit_intent` and
   `target_locator` to scope the edit; preserve every part of the file
   not covered by an edit. Show the edit as a unified diff in the bundle
   preview but write whole files at apply time (avoids partial-line
   edge cases).

5. **Draft the epic create-or-update.** For `mode: create`, generate a
   new epic file under `{product_base}specification/epics/` following
   the existing epic schema in the repo (read one existing epic as a
   template). For `mode: update`, prepare an Edit operation against the
   existing epic_target. In both cases, set the `status:` field to
   `proposed_status`.

6. **Draft the code follow-up issue.** Body template:

   ```
   # Code follow-up for grill-me session #{issue}

   **Anchor:** {anchor_kind} → {anchor_target_path}
   **Locked shape:** {path to locked-shape.md}
   **Branch:** {branch}

   ## Engineering work implied by the new target shape

   {if code_implications empty: "No code changes required."}
   {else: enumerate each summary}

   ## How this gets drained

   Each item below is picked up via the project's normal feature/fix
   process. The epic at {proposed_epic.path} tracks aggregate progress
   from the current shape (today's code) to the new target shape via
   its `status` field.
   ```

   Title: `Code follow-up — {anchor_kind}: {short shape descriptor}`.
   Labels: `grill-followup`, `anchor:{anchor_kind}`.

7. **Assemble the bundle preview** — a single human-facing document
   listing every part of the bundle with diffs and the issue title +
   body. Plain language summary at the top: "This session will change
   N target-shape files, {create|update} epic X with status Y, and file
   one code follow-up issue." Write to
   `{stm_base}/{issue}/evidence/grill-me/close-bundle-preview.md`.

8. **Present the bundle for approval** (unless `approval_mode: dry_run`).
   The play's orchestrator owns the actual Tether/Vanish exchange; this
   skill returns the preview path and pauses until the play passes back
   an `approval_decision`.

9. **On approval (`approved`):** write everything atomically.

   - Use git as the transaction substrate. Before any write, capture
     the current `HEAD` and the clean/dirty state of every target file.
     Stage every drafted file change with `git add`. Then perform the
     writes (Edit / Write) in the working tree. If any single write
     errors, run `git checkout --` against every target file to reset
     them, abandon the bundle, and return
     `status: failed, reason: atomic_rollback, files_rolled_back: [...]`.
     (Issue filing happens last — see step 10.)
   - On success of every file write, commit the bundle as one commit
     with message: `grill-me({anchor_kind}): apply target shape — {short
     descriptor}\n\nLocked shape: {path}\nApproved bundle: {N files,
     epic {create|update}}.`

10. **File the code follow-up issue** via `manage-issue`. This is the
    last step in the transaction because issues cannot be cleanly
    rolled back. If the file writes and commit succeeded but issue
    filing failed, return `status: partial_close, reason:
    issue_file_failed, commit_sha: <sha>` — the play surfaces this to
    the human as a known partial state (commit is in place; issue
    needs to be filed manually or the play re-invoked to retry only
    the issue step).

11. **On rejection (`vanish`) or `dry_run`:** write nothing, file no
    issue. Return the preview path and the structured reason.

## Locked shape document — canonical structure

The shape doc is plain markdown at
`{stm_base}/{issue}/evidence/grill-me/locked-shape.md`. Required sections,
in this order:

```markdown
# Locked shape — {anchor_kind}: {short descriptor}

**Session:** issue #{issue}, branch `{branch}`
**Anchor:** `{anchor_target_path}`
**Register:** {product | technical}
**Termination:** {defensible | human_good_enough}
**Bundle commit:** {sha — filled in after commit}

## The target shape

{Plain-language statement of what the product should be after this
session. Register matches the anchor. No machine jargon.}

## How we got here

{One paragraph per round: what was asked, what was answered, what
tension surfaced (citing the defended item), what resolution was
agreed.}

## Tensions and their resolutions

{Table: tension_id | cited defended item | contradiction | resolution
text | applies_to (file list).}

## Accepted gaps

{Table: tension_id | what the human chose not to resolve | their
exact words.}

## Target-shape edits in this bundle

{One sub-section per artefact: path, kind, owning_play, the resolution
text driving the edit, a diff preview.}

## Epic for the now→then journey

{Subsection: epic path, create or update, proposed status, rationale.}

## Code follow-up

{The exact body of the filed code follow-up issue, including the
explicit "no code changes required" case when applicable.}
```

## Output

**Return value (assembled, awaiting approval):**

```yaml
status: bundle_assembled
preview_path: <path to close-bundle-preview.md>
locked_shape_path: <path to locked-shape.md (drafted, not yet final)>
target_edit_count: <n>
epic_action: create | update
epic_path: <path>
proposed_epic_status: <status>
code_issue_will_be_filed: true
```

**Return value (after approval, on success):**

```yaml
status: closed
commit_sha: <sha>
locked_shape_path: <path>
target_files_written: [<paths>]
epic_path: <path>
epic_status: <status>
code_issue_number: <gh issue number>
code_issue_url: <url>
```

**Return value (after approval, on atomic rollback):**

```yaml
status: failed
reason: atomic_rollback
write_failure: <which file/operation failed>
files_rolled_back: [<paths>]
commit_made: false
issue_filed: false
```

**Return value (after partial close — commit succeeded, issue failed):**

```yaml
status: partial_close
reason: issue_file_failed
commit_sha: <sha>
target_files_written: [<paths>]
epic_path: <path>
code_issue_filed: false
remediation: "Re-invoke with skip_writes=true, file_issue_only=true to complete close."
```

## Failure Modes

| What failed | Cause | Return |
|-------------|-------|--------|
| session state unreadable / malformed | I/O or schema | `status: failed, reason: bad_session_state` |
| any `applies_to.artefact_path` resolves to a code path | C13 violation prevented | `status: failed, reason: code_path_in_bundle, path: <path>` |
| touchpoint drift (edit path not in inventory) | suspicious | `status: failed, reason: touchpoint_inventory_drift, path: <path>` |
| missing or invalid epic in bundle | C14 violation prevented | `status: failed, reason: missing_epic_in_bundle` or `invalid_epic_status` |
| any live tension neither resolved nor accepted_gap | malformed close | `status: failed, reason: unresolved_tension, tension_id: <id>` |
| any file write fails mid-transaction | I/O | `status: failed, reason: atomic_rollback` (see above) |
| issue filing fails after commit | external | `status: partial_close` (see above) |

## Conservative defaults

- **Unsure whether a touchpoint needs an edit?** Include it in the
  bundle with a no-op edit (the diff preview will show no change and
  the human can reject the bundle). Better to over-include and have
  the human prune than to silently drop a touchpoint and risk drift.
- **Edit scope ambiguous?** Default to the narrowest scope the
  `applies_to.target_locator` permits. The human sees the diff.
- **Epic status ambiguous?** Default to `planned`. Only advance the
  status when the session explicitly indicates code work is already
  underway.

## Boundaries

- Reads anchor lock, touchpoints, session state, every named artefact
  under `product_base`, and the existing epic (when updating).
- Writes only: the locked shape doc, the bundle preview, the impacted
  target-shape artefacts, the epic file. Files exactly one issue via
  `manage-issue`.
- Never writes to any code file. Never writes to any path outside
  `product_base/` and `{stm_base}/{issue}/`. Never files more than one
  issue per invocation.
- Never edits the anchor lock or the per-round tension reports.
- Never invokes other plays or skills besides `manage-issue` for the
  follow-up.
- Never asks the human anything directly — approval is mediated by the
  play's orchestrator, which calls this skill twice when needed:
  once with `approval_mode: dry_run` to get the preview, once with the
  decision attached to perform the write.
