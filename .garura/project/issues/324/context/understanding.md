# Context: Understanding — Issue #324 (Rename /scope → /define)

## 1. Architecture: How Plays Are Authored and Deployed

### 1.1 Source of Truth

Every play lives in `core/components/plays/{name}/`. A play directory contains exactly two
canonical files:

```
core/components/plays/scope/
  SKILL.md                    ← compiled artifact (DO NOT edit directly)
  reference/
    intent.yaml               ← source of truth (edit this)
```

`reference/intent.yaml` is the authoritative definition. It carries:
- `name:` field — the skill ID in `garura:{name}` form
- `description:` field
- `version:` and `checksum:` (computed by the compiler)
- `intent:` — implementation-agnostic goal
- `constraints:` (C1–Cn)
- `failure_conditions:` (F1–Fn)
- `scenarios:` (S1–Sn)

The current scope intent.yaml begins with:
```yaml
name: garura:scope
```
After the rename this becomes `name: garura:define`.

### 1.2 Compilation: /create-play --rebuild

`SKILL.md` is a compiled artifact produced by `/create-play --build {name}` (new) or
`/create-play --rebuild {name}` (existing intent, regenerate play).

The `--rebuild` mode (Step 1, "Rebake mode" in create-play/SKILL.md):
1. Performs a deep read of the existing `SKILL.md` and `reference/intent.yaml`.
2. Re-runs `intent-crafter` to identify any gaps in constraints/failure-conditions/scenarios.
3. Re-generates evals via `evals-creator`.
4. Recompiles `SKILL.md`, computing a fresh `intent_hash`:
   ```bash
   intent_hash=$(shasum -a 256 core/components/plays/{play-name}/reference/intent.yaml | awk '{print $1}')
   ```
5. Embeds the hash in the Compilation Metadata section at the end of SKILL.md — NOT in frontmatter.

After rebuild, `SKILL.md` carries:
```
compiled_by: /create-play --build define
```
and all `intent_path` fields in JSON contracts inside `SKILL.md` reference
`core/components/plays/define/reference/intent.yaml`.

**Key rule from `create-play/SKILL.md`:** "The stored intent_hash matches shasum -a 256 of the
current intent.yaml byte-for-byte. If intent.yaml changes, re-run /create-play --rebuild."

**Key rule from `CLAUDE.md` (Play Pipeline Rules):** "When modifying plays, always go through the
intent.yaml → /create-play --build workflow if there are changes to intent.yaml."

The MEMORY.md hard rule (feedback_recipe_changes_via_rebake) adds: "NEVER edit SKILL.md directly.
Update intent.yaml → /create-play --rebuild. Always."

### 1.3 Deployment: /sync-claude

`/sync-claude` runs `core/components/skills/sync-claude/scripts/sync.sh`.

The sync script (global mode, the default):
```
Step 1: mkdir -p ~/.claude/skills ~/.claude/agents
        rm -rf ~/.claude/skills/* ~/.claude/agents/*    ← full wipe first
Step 2: cp -R core/components/skills/* ~/.claude/skills/
Step 3: cp -R core/components/plays/* ~/.claude/skills/  ← plays land in skills/
Step 4: cp core/components/agents/*.md ~/.claude/agents/
Step 5: wipe and re-copy core/components/memory/* → ~/.garura/core/memory/
```

**Stale entry handling:** The script does `rm -rf ~/.claude/skills/*` BEFORE copying — this is a
full wipe-and-replace, not a merge. This means:

- If `core/components/plays/scope/` is renamed to `core/components/plays/define/` before
  `/sync-claude` is run, the sync will deploy `~/.claude/skills/define/` and the stale
  `~/.claude/skills/scope/` will be gone (wiped in Step 1).
- No manual removal of `~/.claude/skills/scope/` is needed — the wipe handles it automatically.
- However, if `/sync-claude` is run BEFORE the directory rename (e.g., mid-flight), `scope/`
  survives. The rename must be complete in `core/components/` before sync is run.

### 1.4 lint-components

`lint-components` runs the Node.js linter at `core/tools/lint-components/index.js` against
`core/components/`. It checks structural validity of SKILL.md frontmatter, required sections,
and schema conformance. A lint run on the current `core/components/plays/scope/` returns
zero violations (verified). After rename, the same linter will run on
`core/components/plays/define/` and will check the renamed frontmatter
(`name: garura:define`) and section structure.

---

## 2. The CLAUDE.md Rule and Cross-Reference Analysis

### 2.1 The Rule

CLAUDE.md Play Pipeline Rules state:
> "When modifying plays, always go through the intent.yaml → /create-play --build workflow
> **if there are changes to intent.yaml**. else we can edit the files directly."

MEMORY.md hard rule adds the absolute form:
> "NEVER edit SKILL.md directly. Update intent.yaml → /create-play --rebuild. Always."

**Implication for the rename:**
- For `core/components/plays/scope/` itself: intent.yaml IS changing (`name:` field). Therefore the
  correct flow is: update intent.yaml → `/create-play --rebuild define`. The new SKILL.md is
  produced by the compiler, not hand-edited.
- For OTHER plays/skills whose SKILL.md mentions `/scope`: the question is whether those references
  came from their own intent.yaml or are free-form prose injected during compilation.

### 2.2 Cross-Reference Origin Analysis: prepare as the Test Case

The task asked for a side-by-side comparison of `prepare/SKILL.md` and
`prepare/reference/intent.yaml` for `/scope` references.

**In `prepare/SKILL.md`:**
All `/scope` and `scope/` appearances in prepare/SKILL.md are path references to product artifacts:
```
.../product/scope/epics/...
.../product/scope/scope.yaml
```
These are domain-noun "scope" (the product scope stage directory, not the play name).
There is no appearance of `/scope` as a slash command, `garura:scope` as a skill ID, or
"scope play" as a named reference.

**In `prepare/reference/intent.yaml`:**
The only "scope" occurrences are the same product-directory path references:
```yaml
{product_base}scope/epics/{epic_id}.yaml
{product_base}scope/scope.yaml
```
These also refer to the product stage directory, not the play.

**Conclusion:** `prepare`'s SKILL.md contains no reference to the `/scope` play as a slash
command or `garura:scope` skill ID. Its "scope" occurrences are path literals that refer to
the `product.directories.scope` config key — which is locked and untouched per decision A5.

### 2.3 What the grep survey found

Running targeted searches across `core/components/` for the play-reference forms (`garura:scope`,
`run /scope`, `ready for /scope`, `→ /scope`, "scope play", "scope-stage" as a play reference)
yielded:

| File | Occurrence | Origin |
|------|-----------|--------|
| `core/components/plays/scope/SKILL.md` | `name: garura:scope` in frontmatter | Compiled from intent.yaml — regenerated by rebuild |
| `core/components/plays/scope/SKILL.md` | Multiple `intent_path: core/components/plays/scope/reference/intent.yaml` | Compiled from intent.yaml — regenerated by rebuild |
| `core/components/plays/scope/SKILL.md` | `compiled_by: /create-play --build scope` in metadata | Compiled — regenerated by rebuild |
| `core/components/plays/arch/SKILL.md` | `scope-stage` in pre-flight prose (`/specify scope-stage artifacts LOCKED`) | **Free-form prose injected during compilation** — NOT in arch/reference/intent.yaml |
| `docs/design/playbook-catalog.md` | Four occurrences of `/scope` as slash command | Free-form document — direct edit required |

**arch/reference/intent.yaml** contains only product-path references to `product/scope/*.yaml`.
The string "scope-stage" at line 63 of arch/SKILL.md is compiler-authored prose about the
`/specify` pipeline, not about the `/scope` play. It reads:
```
/specify scope-stage artifacts LOCKED at {product_base}scope/
```
"scope-stage" here refers to the specify pipeline's scope stage (product artifact stage), not the
play. This is not a reference to `/scope` play and does NOT need to change.

**Skills audit:** None of the cross-referenced skills (`aggregate-decode-proposals`,
`infer-features-from-code`, `infer-epics-from-code`, `manage-features`) contain `garura:scope`
or `/scope` as a slash command. Their "scope" occurrences are all `product/scope/` path literals.

**discovery.md confirmed cross-references** in other plays' SKILL.md (`prepare`, `decode`,
`specify`, `arch`) turn out to be product-path references (`product/scope/...`), not play-name
references. After grep verification, no other play's SKILL.md references the `/scope` play by
name as a slash command or `garura:scope` as a skill ID.

### 2.4 Are cross-references in other plays' SKILL.md derived from intent.yaml or free-form?

Based on the prepare side-by-side: the content in prepare/SKILL.md mirrors what is in
prepare/reference/intent.yaml for path references. The compiler faithfully propagates path tokens.
For free-form prose additions (like "scope-stage" in arch), those are compiler-generated
descriptions that embed the source intent's language but are NOT derived from the arch intent.yaml.

**Implication:** If a file's SKILL.md cross-reference to `/scope` (as a play name) is free-form
prose added during compilation, it must be fixed in intent.yaml and the play rebuilt.
If it is entirely absent from intent.yaml, it is compiler prose and must be tracked as such.
In practice, no other play's intent.yaml or SKILL.md names `/scope` as a slash command.

---

## 3. Integration Points: Complete File Map

Every file that needs to change, classified by change type:

### (a) Renamed via directory move

| From | To |
|------|----|
| `core/components/plays/scope/` (entire directory) | `core/components/plays/define/` |

This is a `git mv core/components/plays/scope core/components/plays/define` operation.
It carries both files: `SKILL.md` and `reference/intent.yaml`.

### (b) Edit intent.yaml → then rebuild

| File | Change | How |
|------|--------|-----|
| `core/components/plays/define/reference/intent.yaml` | `name: garura:scope` → `name: garura:define` | Direct edit to intent.yaml, then `/create-play --rebuild define` regenerates SKILL.md |

The rebuild regenerates `core/components/plays/define/SKILL.md` with:
- Frontmatter `name: garura:define`
- All `intent_path:` fields updated to `core/components/plays/define/reference/intent.yaml`
- `compiled_by: /create-play --build define`
- Fresh `intent_hash` (SHA-256 of the updated intent.yaml)

### (c) Directly edited (free-form prose — no rebuild cycle)

| File | Line(s) | Change |
|------|---------|--------|
| `docs/design/playbook-catalog.md` | Lines 3, 24, 340, 361, 370 | Replace `/scope` (slash-command form) with `/define` |

These are plain documentation files, not compiled artifacts. CLAUDE.md rule permits direct edits
when there are no intent.yaml changes involved. No rebuild needed.

No other play's SKILL.md or intent.yaml contains a reference to the `/scope` play by name.
The "scope-stage" in arch/SKILL.md refers to the `/specify` pipeline's scope artifact stage —
it is not a reference to the `/scope` play and must NOT be changed.

### (d) Catalog edit

| File | Change |
|------|--------|
| `.garura/product/scope/features.yaml` | Add `define` to `AM-F001.plays_inventory` list |

The current `plays_inventory` under AM-F001 (lines 155–176) does not contain `define` or `scope`.
`scope` was never listed (the AM-F001 inventory uses friendly names like `specify-product`,
not the raw play filenames for all plays). Adding `define` follows decision A4.

---

## 4. Conventions in Meridian

### 4.1 Play naming convention

Play names use **lowercase kebab-case** as the directory name, matching the slash-command form:

| Directory | Slash command | Skill ID |
|-----------|--------------|----------|
| `core/components/plays/scope/` | `/scope` | `garura:scope` |
| `core/components/plays/define/` | `/define` | `garura:define` |
| `core/components/plays/create-play/` | `/create-play` | `create-play` (no prefix — framework-internal) |
| `core/components/plays/fix-it/` | `/fix-it` | `garura:fix-it` |

The directory name IS the slash-command suffix IS the skill name (without the `garura:` prefix for
user-invocable product plays). The `garura:` prefix in intent.yaml `name:` field marks the skill as
belonging to the Garura framework namespace.

### 4.2 Slash-command form

The slash command `/define` is how users invoke the play in Claude Code. It maps to
`~/.claude/skills/define/SKILL.md` after sync (because plays are copied into the `skills/`
target directory during sync).

### 4.3 garura:NAME skill ID convention

The `name:` field in intent.yaml frontmatter follows the pattern `garura:{slug}` where `{slug}`
matches the directory name. This is the identifier Claude Code uses to locate the skill.
Confirmed from current scope intent.yaml:
```yaml
name: garura:scope
```
Post-rename:
```yaml
name: garura:define
```

---

## 5. Risks Specific to This Rename

### Risk 1 — Stale deployed skill at ~/.claude/skills/scope/

**Scenario:** If `/sync-claude` was run before the rename completes (e.g., partial state),
`~/.claude/skills/scope/` persists and `/scope` remains invocable in Claude Code.

**Mitigation:** The sync script does a full `rm -rf ~/.claude/skills/*` wipe before copying.
As long as the rename in `core/components/plays/` is complete before `/sync-claude` is run,
the stale entry is automatically removed. The implementation must sequence:
1. Rename directory in source
2. Update intent.yaml
3. Run `/create-play --rebuild define`
4. Run `/sync-claude`
Only in that order does the wipe-and-copy eliminate the stale entry.

### Risk 2 — References in compiled SKILL.md drifting from intent.yaml after rebuild

**Scenario:** The compiler embeds `intent_path: core/components/plays/define/reference/intent.yaml`
inside every JSON contract in the compiled SKILL.md. If the directory is renamed but
intent.yaml's `name:` field is not updated before rebuild, or the rebuild is skipped, the
SKILL.md will contain stale `intent_path` values pointing to the old location or old name.

**Mitigation:** The G9 gap check in `/create-play --review` detects intent_hash drift. The
implementation plan must include a post-rebuild lint and review step. Specifically:
- Update intent.yaml `name:` field BEFORE running rebuild.
- After rebuild, the compiler recomputes the hash against the updated intent.yaml.
- A post-rebuild `lint-components` run on `core/components/plays/define/` verifies structural
  integrity. The current scope play lints clean (0 errors, 0 warnings), so the baseline is set.

### Risk 3 — lint-components validation on the renamed play

**Scenario:** After rename, `lint-components` could flag a mismatch between the directory name
(`define`) and some frontmatter field it validates.

**Assessment:** The linter checks `core/components/` structurally — frontmatter validity, required
sections, schema. The `name: garura:define` frontmatter post-rebuild will be consistent with
the directory name. Since the current play lints clean, the renamed play should also lint clean
after a proper rebuild. The risk is LOW if rebuild precedes lint.

### Risk 4 — docs/design/playbook-catalog.md left with stale /scope references

**Scenario:** The catalog is free-form prose. It is not compiled, not linted, and has no
automated drift detection. References to `/scope` on lines 3, 24, 340, 361, 370 would become
stale documentation.

**Mitigation:** Direct edit of those five lines during implementation. No rebuild needed.
Must be included in the same commit as the source rename.

### Risk 5 — AM-F001 plays_inventory not updated

**Scenario:** `.garura/product/scope/features.yaml` AM-F001 plays_inventory is a hand-maintained
list. Missing the `define` addition means the dogfooded catalog is stale.

**Mitigation:** Direct edit to features.yaml — add `define` to the inventory. Note: `scope` does
not currently appear in the inventory (verified at lines 155–176), so there is no entry to remove,
only an addition.

---

## 6. Key Findings Summary

1. **No cross-reference in other plays' intent.yaml or SKILL.md names the /scope play as a slash
   command.** The grep survey found zero occurrences of `garura:scope`, `run /scope`, or `/scope`
   as a play invocation in any file outside the scope directory itself and docs/design/.

2. **"scope-stage" in arch/SKILL.md is NOT a reference to the /scope play.** It describes the
   `/specify` pipeline's scope artifact stage. Leave untouched.

3. **sync.sh performs a full wipe before copy.** Stale `~/.claude/skills/scope/` is automatically
   removed as long as the rename in source is complete before sync runs.

4. **CLAUDE.md rule applies narrowly:** "if there are changes to intent.yaml" → rebuild required.
   Direct edits to docs and features.yaml are permitted without a rebuild cycle.

5. **AM-F001 plays_inventory currently lacks both `scope` and `define`.** This is an addition-only
   change.

6. **The scope play directory contains exactly 2 files:** `SKILL.md` and `reference/intent.yaml`.
   The rename is a single `git mv`, followed by intent.yaml edit and `/create-play --rebuild define`.
