# Capture Learning: #{issue-number}

## Summary

| Field | Value |
|-------|-------|
| Issue | #{issue-number} — {title} |
| Closed | {closed_at} |
| Archive Bucket | {YYYY-MM} |

## Steps

| Step | Status | Details |
|------|--------|---------|
| Pre-flight | {completed} | Issue closed, STM exists |
| Resolve Issue | {completed} | {title} |
| Extract Learnings | **skipped** | Not yet implemented (v0.1.0) |
| Archive STM | {completed\|failed} | {source} → {target} |

## Archive Result

- **Source:** `.meridian/{issue}/`
- **Target:** `.meridian/_archive/{YYYY-MM}/{issue}/`
- **Status:** {archived: true\|false}
- **Reason:** {reason}

## Pending (Future)

- Learning extraction from STM artifacts
- LTM entry drafting and governance
- Pattern detection across completed issues
