# Implementation Context — Issue #324

## Solution summary

Rename `core/components/plays/scope/` to `core/components/plays/define/` via `git mv`, update `reference/intent.yaml` `name:` field from `garura:scope` to `garura:define`, run `/create-play --rebuild define` to regenerate `SKILL.md` with the correct frontmatter and intent_hash, edit `docs/design/playbook-catalog.md` to replace the five `/scope` slash-command occurrences with `/define`, add `define` to AM-F001 `plays_inventory` in `.garura/product/scope/features.yaml`, and finally run `/sync-claude` to wipe and redeploy so `~/.claude/skills/scope/` is gone and `~/.claude/skills/define/` is live.

## Files to modify

### 1. Directory rename — `core/components/plays/scope/` → `core/components/plays/define/`

Operation: `git mv core/components/plays/scope core/components/plays/define`

This MUST be the first operation. Git tracks the rename and preserves history. Verify with `git status` showing `renamed:` (not `deleted:` + `new file:`).

After the mv, `core/components/plays/scope/` no longer exists.

### 2. `core/components/plays/define/reference/intent.yaml`

Change:
```yaml
name: garura:scope
```
to:
```yaml
name: garura:define
```

This is the ONLY manual edit to this file. All other content (intent, constraints, failure_conditions, scenarios) is unchanged. Must be done AFTER the git mv so git sees the file at its new path.

### 3. `core/components/plays/define/SKILL.md`

DO NOT edit directly. This is a compiled artifact. After step 2, run:

```
/create-play --rebuild define
```

This regenerates SKILL.md with:
- frontmatter: `name: garura:define`
- intent_path references: `core/components/plays/define/reference/intent.yaml`
- compiled_by: `/create-play --build define`
- fresh `intent_hash`: SHA-256 of the updated intent.yaml

### 4. `docs/design/playbook-catalog.md`

Direct edit (free-form prose, no rebuild). Replace `/scope` with `/define` on these five lines:

| Line | Before | After |
|------|--------|-------|
| 3   | `...into a scope/domain via `\`/scope\``.` | `...via `\`/define\``.` |
| 24  | `...into `\`/scope\`` when...` | `...into `\`/define\`` when...` |
| 340 | ``When `/scope` picks this up...`` | ``When `/define` picks this up...`` |
| 361 | ``Not a replacement for `/scope`.`` | ``Not a replacement for `/define`.`` |
| 370 | ``4. Run `/scope` with this...`` | ``4. Run `/define` with this...`` |

### 5. `.garura/product/scope/features.yaml`

Add `define` to the `plays_inventory:` list under AM-F001 (Plays). Insert `- define` in alphabetical order (between `decode` and `design-exp`). The current list is around line 155-176. No entry for `scope` exists in this list — this is a pure addition.

## Connections

- `core/components/plays/define/reference/intent.yaml` **compiles-to** `core/components/plays/define/SKILL.md` via `/create-play --rebuild define`. The `intent_hash` in SKILL.md must be sha256 of the current intent.yaml byte-for-byte.

- `core/components/plays/define/SKILL.md` **deploys-to** `~/.claude/skills/define/SKILL.md` via `/sync-claude`. The sync script does `rm -rf ~/.claude/skills/*` before copying, so the stale `~/.claude/skills/scope/` is automatically removed — no manual deletion needed.

- `docs/design/playbook-catalog.md` **references** `core/components/plays/define/` via 5 prose mentions of the slash command form. Free-form documentation — direct edit only.

- `.garura/product/scope/features.yaml` **catalogs** `core/components/plays/define/` via the AM-F001 `plays_inventory` list.

- `core/components/plays/arch/SKILL.md` contains the string "scope-stage" — this refers to the `/specify` pipeline's scope artifact stage (the `product/scope/` directory), NOT the `/scope` play. **Leave completely untouched.** Do not pattern-match on the word "scope" and edit arch.

## Tasks

### T1 — Rename directory via `git mv`

```
git mv core/components/plays/scope core/components/plays/define
```

This must be the FIRST operation so git tracks the rename in history (not as delete+add). Verify with `git status` that the rename is staged.

**Exit gate:** `git status` shows `renamed: core/components/plays/scope -> core/components/plays/define` and `core/components/plays/scope/` no longer exists on disk.

### T2 — Update intent.yaml `name:` field

Edit `core/components/plays/define/reference/intent.yaml`. Change `name: garura:scope` to `name: garura:define`. No other content changes.

Depends on: T1.

**Exit gate:** `grep "^name:" core/components/plays/define/reference/intent.yaml` returns exactly `name: garura:define`.

### T3 — Rebuild SKILL.md via `/create-play --rebuild define`

Run `/create-play --rebuild define`. This regenerates `core/components/plays/define/SKILL.md` with the updated frontmatter, intent_path references pointing to `core/components/plays/define/reference/intent.yaml`, `compiled_by: /create-play --build define`, and a fresh intent_hash.

Do NOT manually edit SKILL.md.

Depends on: T2.

**Exit gate:**
- `grep "^name:" core/components/plays/define/SKILL.md` returns `name: garura:define`.
- `grep "garura:scope" core/components/plays/define/SKILL.md` returns 0 lines.
- `grep "intent_path" core/components/plays/define/SKILL.md` shows paths containing `define/`.

### T4 — Run lint-components on the renamed play

Run the `lint-components` skill against `core/components/plays/define/` to verify structural integrity after rebuild. The current scope play lints with 0 errors and 0 warnings — the renamed play must achieve the same baseline.

Depends on: T3.

**Exit gate:** `lint-components` reports 0 errors and 0 warnings for `core/components/plays/define/`.

### T5 — Update `docs/design/playbook-catalog.md`

Replace the 5 occurrences of `/scope` with `/define` per the table in section "Files to modify > 4". Direct edit — no rebuild required.

Depends on: T1.

**Exit gate:**
- `grep -n '/scope' docs/design/playbook-catalog.md` returns 0 lines.
- `grep -n '/define' docs/design/playbook-catalog.md` returns exactly 5 lines.

### T6 — Add `define` to `plays_inventory` in features.yaml

Edit `.garura/product/scope/features.yaml`. Locate AM-F001 `plays_inventory:` block (around line 155). Add `- define` in alphabetical position (between `- decode` and `- design-exp`). No entry for `scope` exists in this list — addition only.

Depends on: T1.

**Exit gate:** `grep` of `.garura/product/scope/features.yaml` AM-F001 block contains a line matching `- define`.

### T7 — Run `/sync-claude` to deploy globally

Run `/sync-claude`. The sync script does `rm -rf ~/.claude/skills/*` before copying, automatically removing the stale `~/.claude/skills/scope/`. It then copies `core/components/plays/define/` into `~/.claude/skills/define/`. This is the LAST step — all source edits and the rebuild must be complete before sync runs.

Depends on: T3, T4, T5, T6.

**Exit gate:**
- `~/.claude/skills/scope/` does not exist.
- `~/.claude/skills/define/SKILL.md` exists with `name: garura:define` in frontmatter.

## Hard constraints

- The git mv (T1) MUST happen before the intent.yaml edit (T2). Editing first then moving causes git to see delete+add, breaking history.
- Do NOT edit `core/components/plays/define/SKILL.md` directly. Always go through intent.yaml + `/create-play --rebuild define`.
- Do NOT touch `core/components/plays/arch/SKILL.md`, any `product/scope/scope.yaml` reference, or any "scope" occurrence in other plays — these refer to capability scope, not the play.
- Do NOT touch historical STM evidence under `.garura/project/issues/*/evidence/scope/` — historical record stays.
