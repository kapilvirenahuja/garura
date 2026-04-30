# Test Context — Issue #324

You are verifying an enhancement that renames a Meridian play. Run each eval below against the codebase as it stands on disk. Report PASS / FAIL for each with evidence (command output).

For evals labeled `(post-sync)` you may invoke `/sync-claude` once before checking.

## Behavioral expectations

- A play previously addressable as a slash command in its prior form should now be addressable in its new form.
- The renamed play's compiled artifact should carry the new identifier in its frontmatter; the old identifier should not appear anywhere in the play's source directory.
- A free-form documentation file that previously referenced the play by its old slash-command form should now reference it by the new slash-command form.
- A hand-maintained catalog list of deployed plays should include the new name.
- A globally deployed copy of the play should reflect the new name; any previously deployed copy under the old name should not exist after redeployment.
- The play should pass structural linting at the same baseline as before the rename.
- Git history should treat the move as a rename, not a delete+add.

## Evals

### E1 — Old play directory removed

```bash
test ! -d core/components/plays/scope/ && echo PASS || echo FAIL
```

Expected: `PASS`.

### E2 — New play directory exists

```bash
test -d core/components/plays/define/ && echo PASS || echo FAIL
```

Expected: `PASS`.

### E3 — Renamed intent.yaml has new name

```bash
grep -q "^name: garura:define" core/components/plays/define/reference/intent.yaml && echo PASS || echo FAIL
```

Expected: `PASS`.

### E4 — Renamed SKILL.md frontmatter has new name

```bash
grep -q "^name: garura:define" core/components/plays/define/SKILL.md && echo PASS || echo FAIL
```

Expected: `PASS`.

### E5 — No stale skill ID in the renamed play directory

```bash
test "$(grep -r 'garura:scope' core/components/plays/define/ | wc -l | tr -d ' ')" = "0" && echo PASS || echo FAIL
```

Expected: `PASS`.

### E6 — No stale skill ID anywhere in components source

```bash
test "$(grep -r 'garura:scope' core/components/ | wc -l | tr -d ' ')" = "0" && echo PASS || echo FAIL
```

Expected: `PASS`.

### E7 — Compiled SKILL.md has no old-path intent_path references

```bash
test "$(grep 'plays/scope/' core/components/plays/define/SKILL.md | wc -l | tr -d ' ')" = "0" && echo PASS || echo FAIL
```

Expected: `PASS`.

### E8 — playbook-catalog has zero `/scope` slash-command occurrences

```bash
test "$(grep -c '`/scope`' docs/design/playbook-catalog.md)" = "0" && echo PASS || echo FAIL
```

Expected: `PASS`.

### E9 — playbook-catalog has exactly 5 `/define` slash-command occurrences

```bash
count=$(grep -c '`/define`' docs/design/playbook-catalog.md); [ "$count" = "5" ] && echo PASS || echo "FAIL (count=$count)"
```

Expected: `PASS`.

### E10 — features.yaml AM-F001 plays_inventory contains `define`

```bash
awk '/id: AM-F001/,/id: AM-F002/' .garura/product/scope/features.yaml | grep -qE "^\s*- define$" && echo PASS || echo FAIL
```

Expected: `PASS`.

### E11 — Stale deployed skill removed (post-sync)

```bash
test ! -d ~/.claude/skills/scope/ && echo PASS || echo FAIL
```

Expected: `PASS`. Run `/sync-claude` first if needed.

### E12 — New deployed skill present (post-sync)

```bash
grep -q "^name: garura:define" ~/.claude/skills/define/SKILL.md && echo PASS || echo FAIL
```

Expected: `PASS`. Run `/sync-claude` first if needed.

### E13 — lint-components passes on renamed play

Run the `lint-components` skill against `core/components/plays/define/`. Confirm output reports 0 errors and 0 warnings.

Expected: 0 errors, 0 warnings.

### E14 — Git rename history preserved

```bash
git log --follow --oneline core/components/plays/define/reference/intent.yaml | head -1 | grep -qv "^$" && echo PASS || echo FAIL
```

Expected: `PASS`. (`--follow` should successfully traverse history through the rename.)
