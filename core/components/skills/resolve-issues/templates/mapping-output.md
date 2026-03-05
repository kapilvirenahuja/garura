# Issue Mapping

## Branch Signal

- **Branch**: {branch_name}
- **Issue Reference**: {issue_number or "none detected"}

## Mappings

### Group {n}: {type}({scope})

- **Mapped Issue**: #{issue_number} — {issue_title}
- **Confidence**: {high|medium|low|none}
- **Signals**:
  - Branch: {match|no match|N/A}
  - Semantic: {signal description}
  - Proximity: {signal description}
- **Reasoning**: {why this mapping was chosen}

[repeat for each group]

## Unmapped Groups

{list of groups with confidence "none", or "All groups mapped"}

## Conflicts

{list of detected conflicts, or "No conflicts detected"}

## Summary

- **Total Groups**: {n}
- **High Confidence**: {n}
- **Medium Confidence**: {n}
- **Low Confidence**: {n}
- **Unmapped**: {n}
- **Approval Recommended**: {yes/no — yes if any low confidence or conflicts}
