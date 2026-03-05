# Analysis Output

## Branch Info

- **Current Branch**: {branch_name}
- **Issue from Branch**: {issue_number or "none detected"}
- **Is Hotfix**: {yes/no}

## Change Summary

- **Total Files**: {n}
- **Staged**: {n}
- **Unstaged**: {n}
- **Untracked**: {n}

## Groups

### Group {n}: Issue #{issue_number} — {type}({scope})

- **Issue**: #{issue_number} — {issue_title}
- **Type**: {dominant commit type from LTM categories}
- **Scope**: {scope derived from the broadest area of change}
- **Subject**: {descriptive subject for the commit message}
- **Confidence**: {high/medium/low — how confident is the issue mapping}
- **Files**:
  - `{file1}` - {brief change description}
  - `{file2}` - {brief change description}

[repeat for each group — one group per issue, not per component]

## Risks Detected

### Sensitive Files
{list or "None detected"}

### Breaking Changes
{list or "None detected"}

## Recommendation

- **Checkpoint Needed**: {yes/no}
- **Reason**: {explanation}
