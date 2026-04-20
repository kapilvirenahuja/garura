| Field | Value |
|-------|-------|
| **Type** | defect |
| **Severity** | Medium |
| **Reported From** | /scope compilation (#301) |
| **Date** | 2026-04-20 |

### Problem

Two issues surfaced in `/create-play` while compiling `/scope` for #301.

**(1) Templates not enforced.** The compiler produced `core/components/plays/scope/SKILL.md` with zero references to LTM templates under `core/components/memory/standards/templates/`. User-facing surfaces (checkpoint files, approval prompts, delivery reports, evidence files) were emitted as inline prose. Other plays (`fix-it`, `review-pr`, `start-feature-planning`) DO reference these templates — the house pattern exists but `/create-play`'s compiler doesn't synthesize template references unless intent.yaml explicitly names them. This produces drift between plays and bloats every compiled SKILL.md with duplicated prose.

**(2) Compilation metadata at top of SKILL.md burns tokens.** The `Compiled From`, `Role`, intent hash, `compiled_by`, `compiled_at`, `workflow_structure`, agent counts, eval counts — all sit near the top of every compiled SKILL.md. Claude loads this text into context on every play invocation but it has zero runtime value — it's build metadata for humans auditing drift. Should move to the end of SKILL.md or to a sibling `reference/compilation.yaml` / `reference/compilation.md` that is NOT loaded by the Skill tool.

### Evidence

- `/scope` SKILL.md: zero grep hits for `standards/templates`, `checkpoint.md`, `approval-prompt.md`, `delivery-report.md`, `evidence-file.md`.
- House pattern exists: `fix-it/SKILL.md`, `review-pr/SKILL.md`, `start-feature-planning/SKILL.md` reference templates.
- `manage-issue` already loads `github-issue.md` at line 46 of its SKILL.md — template loading works end-to-end when wired.
- Every compiled play under `core/components/plays/*/SKILL.md` starts with a `Compiled From` + metadata block.

### Expected Behavior

**(1)** `/create-play` compiler should automatically synthesize template references for every user-facing surface. Either via a built-in compiler rule ("if play has a checkpoint phase, emit template reference to checkpoint.md") or by requiring intent.yaml to declare a template_map and rejecting compilation if the map is missing for surfaces the play produces.

**(2)** Compiled SKILL.md should start with frontmatter + Header + Role (what Claude needs at runtime) and push build metadata to the bottom of the file, or to a sibling `reference/compilation.yaml` / `reference/compilation.md` not loaded by the Skill tool.

### Impact

- **(1)** Format drift across plays — each compiler run produces slightly different inline prose for the same conceptual surface. Users see inconsistent checkpoint layouts, and template updates don't propagate.
- **(2)** Every play invocation burns tokens on metadata the runtime doesn't need. Across 20+ plays this is a measurable context cost with zero execution value.

Both issues apply to the generic `/create-play` — fixes benefit every compiled play in the repo.
