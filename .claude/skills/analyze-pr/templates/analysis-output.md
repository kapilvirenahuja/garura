# PR Analysis Output

## Branch Info

- **Current Branch**: {branch_name}
- **Base Branch**: {base_branch}
- **Branch Pattern**: {branch_pattern} (feature/hotfix/release/experiment/other)

## Change Summary

- **Commits**: {commit_count}
- **Files Changed**: {file_count}
- **Additions**: +{additions}
- **Deletions**: -{deletions}

## Suggested PR Title

```
{suggested_title}
```

## Context Detected

### File Patterns Matched

| Pattern | Files |
|---------|-------|
| {pattern_name} | {file_count} files |

### Commit Types Found

| Type | Count | Examples |
|------|-------|----------|
| {type} | {count} | {first_commit_subject} |

## Quality Checklist

### Must-Have (Blocking)

| Item | Trigger | Status | Evidence |
|------|---------|--------|----------|
| {item_description} | {trigger_reason} | {PASS/FAIL/REVIEW} | {evidence_or_requirement} |

### Nice-to-Have (Optional)

| Item | Trigger | Status | Evidence |
|------|---------|--------|----------|
| {item_description} | {trigger_reason} | {PASS/FAIL/REVIEW} | {evidence_or_requirement} |

## Blocking Issues

{List of must-have items with FAIL status, or "None - ready to create PR"}

- **{item}** — {reason} ({trigger})

## Readiness Assessment

- **Ready**: {yes/no}
- **Blocking Count**: {count}
- **Review Required**: {count}
- **Recommendation**: {Create PR / Fix issues first}

---

## YAML Output

```yaml
analysis:
  branch: {branch_name}
  base: {base_branch}
  branch_pattern: {pattern}
  commits: {count}
  changes:
    files: {count}
    additions: {count}
    deletions: {count}
  suggested_title: "{title}"

  context:
    file_patterns_matched:
      - name: "{pattern_name}"
        files: {count}
        trigger: "{glob_pattern}"
    commit_types:
      - type: "{type}"
        count: {count}
    branch_modifiers:
      - "{modifier description}"

  checklist:
    must_have:
      - id: "{rule_id}"
        item: "{description}"
        trigger: "{why this applies}"
        status: "{PASS|FAIL|REVIEW}"
        evidence: "{verification result or requirement}"
    nice_to_have:
      - id: "{rule_id}"
        item: "{description}"
        trigger: "{why this applies}"
        status: "{PASS|FAIL|REVIEW}"
        evidence: "{verification result or requirement}"

  blocking_issues:
    - item: "{item}"
      reason: "{why blocking}"
      trigger: "{rule trigger}"

  ready: {true|false}
  recommendation: "{Create PR|Fix issues first}"
```
