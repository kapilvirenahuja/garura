| Field | Value |
|-------|-------|
| **Type** | bug |
| **Date** | 2026-05-07 |

### Problem

There are two `distill` components in the framework — one as a play (`core/components/plays/distill/`) and one as a skill (`core/components/skills/distill/`). They share the same directory name, causing the sync-claude script to overwrite the skill with the play on every sync (plays are copied after skills into `~/.claude/skills/`). The investigation needs to determine: (1) why both exist, (2) which one should be kept, and (3) what is calling each — the play vs the skill — so the correct one survives and the other is removed.
