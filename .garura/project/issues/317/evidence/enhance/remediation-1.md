# Remediation 1 — heading hierarchy fix

## Failing check

The tool doc `docs/agentic-methodology/tools/lint-components.md` uses H4 headings (`####`) inside the `### Structural` rule-tier subsection — specifically to break out component sub-types (Skills, Agents, Plays, Intents). This violates the heading-hierarchy constraint: H1 → H2 → H3 only, no H4 or deeper.

## Required fix

Flatten the rule-tiers section so no H4 (`####`) appears anywhere in the file. Acceptable shapes for the same content:

**Option A — table-based:** consolidate the per-component-type rule applications into a single table per tier, with columns like `Rule ID | Component Type | Severity | What it checks`. Keep H3 headings (`### Structural`, `### Semantic`, `### Cross-Reference`); replace any H4 sub-headings with rows in the tier's table.

**Option B — prose lists:** under each H3 tier subsection, use a bulleted or numbered list where each rule entry mentions its applicable component types inline. No H4 needed.

Either option preserves accuracy (each rule ID still maps to its component types and severity) without introducing H4. Pick whichever reads cleaner for the rule volume — Option A scales better when there are many rules.

## Other guidance

- Do NOT change unrelated sections. Only the rule-tiers section needs restructuring.
- Do NOT remove any rule IDs or change severities. The set of rule IDs and their severities is correct as written — the only issue is the H4 nesting.
- All other content (Overview, Install, Usage, Output, Related, cross-links) is unchanged.
- Re-verify after the rewrite: the file should have exactly one H1, several H2s, several H3s under H2s, and zero H4s or deeper. No skipped levels.
