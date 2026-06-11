# Analysis Output — the executor contract

The analysis file this skill writes is consumed mechanically by
`commit-change/scripts/execute_commits.py`. The keys below are a hard contract:
`id` (not `name`), `commit_type` (not `type`), plain file paths (a rename lists both
sides as separate entries — never an `old -> new` string). Extra keys are tolerated
and ignored; contract keys must never be renamed or omitted.

```yaml
needs_judgment: false            # always false on output — judgment is done
branch: {branch_name}            # informational
issue: {issue_number}            # informational; per-group issue is what executes

change_groups:
  - id: {kebab-slug}             # e.g. feat-grill
    issue: {issue_number}        # bare number, no '#'
    commit_type: {type}          # feat | fix | refactor | docs | chore | test
    scope: {area}                # broadest area of change, e.g. grill, install-garura
    subject: "{imperative subject describing the change}"
                                 # NO issue suffix — the executor appends " (#issue)"
    confidence: {high|medium|low} # issue-mapping confidence (extra key, play reads it)
    files:                       # PLAIN repo-relative paths, one per line
      - {path}
      - {old-path-of-a-rename}   # renames: both sides, separate entries
      - {new-path-of-a-rename}
    risks:                       # extra keys — surfaced at the checkpoint
      sensitive_files: []
      breaking_changes: []
    notes: "{anything the reviewer should know}"

exclusions:                      # carried through from the scan, unchanged
  - path: "{path}"
    reason: "{why this is not committed}"
    blocking: false

risks:
  sensitive_files: []            # paths that must BLOCK the run; [] when clean

eval_gates:                      # the skill's own SE evidence (extra keys)
  SE-1: {status, evidence}
  SE-5: {status, evidence}
```

Rules recap: every changed file from the scan appears in exactly one group's `files`
or in `exclusions` — never both, never neither. One group per concern. The first
group in file order is committed first.
