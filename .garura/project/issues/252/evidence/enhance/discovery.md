# Discovery — Issue #252: Component Linting for Garura Components

## Issue Body

There is no validation layer for authored Garura components (plays, agents, skills). Structural and semantic errors — missing frontmatter fields, inconsistent agent boundary declarations, broken cross-references between skills and plays, constraint ID collisions — are only caught downstream when something breaks at runtime or during PR review.

Example: knowledge-extractor agent extended with FAST mode, but Boundaries section not updated. No lint caught this — surfaced only at PR review.

### What Needs Linting

**Structural (per-file):**
- Frontmatter completeness: required fields present (`name`, `description`, `user-invokable`, `model`, `allowed-tools`)
- Required sections present (Purpose/Input/Process/Output/Constraints/Version for skills; Role/Pre-flight/Workflow/Pause-and-Resume/Compilation-Metadata for plays)
- YAML validity in intent.yaml files
- Constraint/scenario ID uniqueness within a file

**Semantic (cross-file):**
- Agent boundaries consistent with operating modes
- Skills referenced in plays actually exist at the declared path
- Agents referenced in plays exist and have required mode/capability
- Intent.yaml constraints covered by SKILL.md steps (no orphaned constraints)
- Template files referenced in Output sections exist

**Cross-reference integrity:**
- Ship sub-play chain matches declared sub_plays in Compilation Metadata
- Status file JSON schema matches declared task entries in Workflow
- Scenario IDs in intent.yaml correspond to SCE-N entries in SKILL.md

### Context from issue
- `create-play` is the existing build step (intent.yaml → SKILL.md compilation)
- Linting is a separate concern from compilation — invocable standalone, in CI, or as pre-compile gate
- The quality-check step in enhance runs build/lint/typecheck/tests, but currently all pass trivially because there's no lint tooling

## Q&A

**Q1: Scope — all three tiers or just structural for MVP?**
A: All three tiers in scope. No phasing — deliver full structural + semantic + cross-reference linting.

**Q2: What form should the linter take?**
A: (B) Fully deterministic Node.js script, exposed as a Tool that agents/skills can invoke via Bash. Not model-driven.

**Q3: Targets — core/components only or also deployed artifacts?**
A: `core/components/**` only. Source of truth.

**Q4: Invocation surfaces?**
A: Build as a skill (`lint-components`) that wraps the Node tool. Skill is reusable from enhance, review, PR, ship pipelines. Not wired into create-play right now.

**Q5: Failure policy?**
A: Structural lint output is deterministic (list of violations). Severity mapping (error/warn/block) is agentic — the skill reads the project's quality profile to derive what's a blocker vs. a warning. Non-deterministic part is intentional.

**Q6: Language?**
A: Node.js. Files are mostly Markdown + YAML.

## Terminology
- Components are **Garura** components (not Meridian). Update any references.
