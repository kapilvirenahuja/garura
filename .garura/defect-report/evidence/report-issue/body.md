| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Affected Component** | `core/components/plays/report-issue/` (play + intent.yaml + SKILL.md) |
| **Reported From** | specify-product run on Garura (Apr 2026) |
| **Date** | 2026-04-18 |

### Problem

The current `report-issue` play has four limitations that block its broader usage as Garura's general-purpose issue-capture surface:

1. **Scoped to defects only.** Title prefix `[DEF]`, severity required, label hardcoded to `defect`. Callers cannot file features, epics, or bugs through the same flow.
2. **Name signals narrow scope.** `report-issue` reads as "file a defect", not "capture anything the system should know about".
3. **Runs in foreground, blocks the caller.** Every invocation holds the caller's context until GH roundtrip returns. No background mode — so invoking it mid-workflow (e.g., during a specify-product run or while coding) always interrupts flow.
4. **Confirmation is verbose.** The return payload is a markdown block with tables, labels, repo slug, etc. When the caller is an agent or a user in flow, all they need is "filed, #265, ✓" — not a multi-line confirmation.

### Expected Behavior

1. **Rename to `garura:capture`** (and update the slash surface + skill folder + intent.yaml + compiled SKILL.md). Keep `report-issue` as a deprecated alias for one release cycle.

2. **Infer issue type** from the problem text / caller context. Types supported: `feature`, `bug`, `defect`, `epic`, `enhancement`. Title prefix and labels set accordingly:
   - `[FEAT]` / label `feature` — new capability request
   - `[BUG]` / label `bug` — broken behavior in shipped code
   - `[DEF]` / label `defect` — methodology/process defect (today's default)
   - `[EPIC]` / label `epic` — multi-feature scope
   - `[ENH]` / label `enhancement` — improvement to existing capability

   Inference can be rule-based (keyword match on problem text + reported_from) with a surfaced decision the caller can override.

3. **Always run in background.** The play dispatches the GH filing step asynchronously and returns control immediately. Caller keeps working; notification fires on completion.

4. **Crisp ID-back confirmation.** On success, return a single-line confirmation:
   ```
   ✓ #265 filed
   ```
   Or on failure:
   ```
   ⚠ fallback saved → .garura/defect-report/evidence/report-issue/fallback-defect-2026-04-18.md
   ```
   Use ASCII emoji (✓ / ⚠ / ✗) or a green/yellow/red ANSI color marker that stands out. Full detail available via follow-up command (`garura:capture --show <id>`) but not in the default confirmation.

### Impact

- **Today:** contributors avoid `report-issue` for non-defects because the skill rejects them; feature requests land as ad-hoc `gh issue create` invocations that bypass the play's structured fields. Loss of consistency and auditability.
- **Flow interruption:** callers in the middle of a long-running play (e.g., specify-product) either skip filing or accept a context break. In practice, many issues go unfiled.
- **Background agents:** automation that wants to capture findings mid-run (e.g., this very specify-product run filed issue #265 via a general-purpose subagent instead of the play, because the play blocks and returns verbose confirmation). Play's own UX discourages its use.

### Evidence

- Today's run: `github.com/kapilvirenahuja/garura/issues/265` filed by a general-purpose subagent, not the `report-issue` play — precisely because the play's foreground + verbose-confirmation shape made it unsuitable for the background+parallel use case.
- Skill source: `core/components/plays/report-issue/SKILL.md` line 102 hardcodes `[DEF]` title prefix; line 239 hardcodes `labels: "defect"`.
- Caller DX today: 10+ lines of markdown return on success. No distinct color/emoji. No background mode.
