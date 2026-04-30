# Test Context — Issue #317

You are verifying a documentation enhancement that adds two new docs covering a Node.js component linter: one for CLI users, one for skill consumers. Run each eval below against the rendered files. Report PASS / FAIL for each with evidence.

## Behavioral expectations

- Two new documentation files should exist at the expected paths under the docs tree.
- The CLI-audience doc should explain how to install the tool, invoke it from the command line, what flags it accepts, what exit codes it returns, what the output looks like, and what rule tiers it enforces.
- The skill-audience doc should explain how to invoke the lint-components skill via JSON contract, what fields the contract takes, what the output artifact looks like, and how violation severities map to classifications.
- The two docs should cross-link to each other.
- The CLI doc should be honest about features that are not yet implemented or have unstated requirements — fabricated specifications are not acceptable.

## Evals

### E1 — Tool doc exists at the agentic-methodology pillar path

```bash
test -f docs/agentic-methodology/tools/lint-components.md && echo PASS || echo FAIL
```

Expected: `PASS`. Note the exact path: pillar directory must be `agentic-methodology` (matching the features.yaml domain slug), not a shorthand like `methodology`.

### E2 — Skill doc exists at the usage/skills path

```bash
test -f docs/usage/skills/lint-components.md && echo PASS || echo FAIL
```

Expected: `PASS`.

### E3 — Tool doc shows how to install (npm install code block)

```bash
grep -B1 -A1 "npm install" docs/agentic-methodology/tools/lint-components.md | head -10
```

Expected: at least one match, and the match should appear within a fenced code block (look for ``` markers nearby).

### E4 — Tool doc shows how to invoke the CLI

```bash
grep "node core/tools/lint-components/index.js" docs/agentic-methodology/tools/lint-components.md
```

Expected: at least one line matches.

### E5 — Skill doc shows the JSON contract input fields

```bash
grep "project_root" docs/usage/skills/lint-components.md
```

Expected: `project_root` (the input field name) appears in the doc, indicating the JSON contract example is included.

### E6 — Skill doc includes a sample report excerpt

```bash
grep "classification" docs/usage/skills/lint-components.md
```

Expected: the field name `classification` appears (this field is in the sample report excerpt — its presence confirms the excerpt is shown).

### E7 — Tool doc covers all three rule tiers

```bash
grep -i -E "structural|semantic|cross-reference" docs/agentic-methodology/tools/lint-components.md | wc -l
```

Expected: count is at least 3 (one match per tier, often many more).

### E8 — Severity-to-classification mapping is documented

```bash
grep -l "blocker" docs/agentic-methodology/tools/lint-components.md docs/usage/skills/lint-components.md
```

Expected: at least one of the two files contains the word `blocker`.

### E9 — `--validate-templates` is either omitted or explicitly noted as not-implemented

```bash
file=docs/agentic-methodology/tools/lint-components.md
if grep -q "validate-templates" "$file"; then
  # if mentioned, it must be flagged as unimplemented within the same line or nearby
  grep -B2 -A2 "validate-templates" "$file" | grep -iE "not yet|no effect|no current|unimplemented|not wired" >/dev/null && echo PASS || echo FAIL
else
  echo PASS  # omitted entirely is acceptable
fi
```

Expected: `PASS`. Reasoning: the flag is parsed by the CLI but no rule module reads it. Doc must either omit it or honestly note it's a no-op.

### E10 — Node version: cited only if package.json engines exists, else flagged as unstated

```bash
file=docs/agentic-methodology/tools/lint-components.md
node_version_claim=$(grep -iE "node [0-9]|node >|node v[0-9]" "$file" | head -1)
engines_in_pkg=$(grep -c '"engines"' core/tools/lint-components/package.json)
if [ -n "$node_version_claim" ] && [ "$engines_in_pkg" = "0" ]; then
  echo "FAIL — claims node version but package.json has no engines field"
else
  echo PASS
fi
```

Expected: `PASS`. Reasoning: the doc must not fabricate a Node version requirement that isn't in package.json.

### E11 — Both docs cross-link to each other

```bash
grep "usage/skills/lint-components" docs/agentic-methodology/tools/lint-components.md && \
grep "agentic-methodology/tools/lint-components" docs/usage/skills/lint-components.md && echo PASS || echo FAIL
```

Expected: `PASS` (bidirectional).

### E12 — No fabricated rule IDs

```bash
# Extract every rule-ID-shaped string from both docs
extracted=$(grep -hoE "(structural|semantic|cross-ref|cross-reference)/[a-z][a-z-]*" \
  docs/agentic-methodology/tools/lint-components.md \
  docs/usage/skills/lint-components.md 2>/dev/null | sort -u)

# Build the set of rule IDs that exist in source
source_ids=$(grep -hoE "(structural|semantic|cross-ref|cross-reference)/[a-z][a-z-]*" \
  core/tools/lint-components/lib/rules/*.js 2>/dev/null | sort -u)

# Every extracted ID must appear in source_ids
fail=0
while IFS= read -r id; do
  [ -z "$id" ] && continue
  echo "$source_ids" | grep -qx "$id" || { echo "FAIL: fabricated id '$id' not in source"; fail=1; }
done <<< "$extracted"
[ $fail = 0 ] && echo PASS
```

Expected: `PASS`. Any rule ID that appears in either doc but not in `core/tools/lint-components/lib/rules/*.js` is a fabrication failure.

### E13 — Tool doc heading hierarchy is consistent (no skipped levels)

Read `docs/agentic-methodology/tools/lint-components.md` and confirm:
- Exactly one H1 at the top of the file
- H2 used for major sections
- H3 used only inside H2 sections
- No H4 or deeper
- No skipped levels (H1 → H3 directly is a violation)

This is a manual read check. Open the file and verify the heading structure.

Expected: heading hierarchy is consistent.

## Notes for the tester

- For E12, if the extracted-vs-source comparison feels noisy due to formatting, a manual cross-check is acceptable — the principle is "no rule ID in the docs is missing from the source files."
- E13 is a read-and-judge check, not a regex. Use the file as a human reader.
- All other evals are deterministic shell-runnable checks.
