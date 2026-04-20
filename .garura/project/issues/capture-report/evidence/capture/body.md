| Field | Value |
|-------|-------|
| **Type** | defect |
| **Severity** | Medium |
| **Reported From** | User observation while reviewing play artifacts |
| **Date** | 2026-04-20 |

### Problem

Several compiled plays still carry the legacy `meridian:` prefix in their frontmatter `name`, H1 header, and internal references. The framework was renamed to Garura; the only play using the correct `garura:` prefix is `capture`. Remaining references must be dropped or switched to `garura:`.

### Evidence

Confirmed via grep `meridian:` under `core/components/plays/**/SKILL.md`:

- `core/components/plays/fix-it/SKILL.md` — `name: "meridian:fix-it"`, H1 `# meridian:fix-it`, status file `"play": "meridian:fix-it"` (line 526)
- `core/components/plays/review-pr/SKILL.md` — `name: meridian:review-pr`, plus `meridian:quality-check-scoped` skill invocation references (lines 161, 165, 452)
- `core/components/plays/report-issue/SKILL.md` — `name: "meridian:report-issue"` (deprecated alias, still present)
- `core/components/plays/distill/SKILL.md` — `name: meridian:distill`

### Specific Issues

1. Frontmatter `name` field uses wrong namespace — breaks consistency with `capture` (which uses `garura:`).
2. H1 headers in SKILL.md use `# meridian:fix-it` — appears in all evidence/docs copied from compiled output.
3. Status file `play` fields write `"meridian:fix-it"` — leaks into runtime state artifacts.
4. `review-pr` still invokes `meridian:quality-check-scoped` by that qualified name even though the skill itself is under `core/components/skills/quality-check-scoped/` with no meridian prefix.

### Expected Behavior

All plays either:
- Use the `garura:` prefix consistently with `capture`, OR
- Drop the prefix entirely (simple play name only — `fix-it`, `review-pr`, `distill`, etc.).

Either convention is fine, but it must be uniform across every play. Status files, H1 headers, frontmatter `name`, and inter-play skill invocation references must all match.

### Impact

- Cosmetic inconsistency visible wherever compiled plays are read (including issue comments, STM evidence files, and LLM context).
- Runtime status file schema drift — `"play"` field value varies by play, complicating resume-logic and introspection.
- Confuses new contributors about the framework name (Meridian vs. Garura).
- Low runtime risk — plays still execute — but every leaked `meridian:` string is a papercut.

### Fix path

Update `reference/intent.yaml` for each affected play, then `/create-play --build <play>` to regenerate SKILL.md. Do not edit SKILL.md directly (per CLAUDE.md rule).
