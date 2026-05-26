# Tester Context — #388

Issue: #388 — Update Intent doctrine: 5 elements → 3, move Success Scenarios to Expectations.

Black-box verification. This file is the tester's ONLY source. The tester DOES NOT see file paths from the implementer's plan, does not see the solution summary, does not see the connections analysis. The tester reads code on disk and checks the evals below.

## Behavioral expectations (what the work, when complete, must achieve)

1. The framework gains a single canonical surface that codifies the three-element Intent model and the compartmentation contract between builder and validator. This surface explicitly states that the builder never sees success scenarios, names the per-play HITL configuration as the governor of Expectation vetting, and carries the constraint-vs-failure-condition decision rule with a worked example.

2. The runtime intent resolver no longer reads success scenarios from `intent.yaml`. Instead, it reads them from the play's Expectation artifact, addressed via an optional input field. When that input is not provided, the resolver produces zero Stage 6 tasks rather than inventing any.

3. The agent prompts that author and consume Intent are discoverably linked to the new canonical rule surface.

4. The scope of this work is the doctrine layer only. No compiled play `SKILL.md` is rebuilt; no `reference/intent.yaml` fixture is modified. Connections doctrine is not expanded beyond a single pointer line. No global "human must approve" rule for Expectation vetting is introduced.

## Evals — execute each against the codebase on disk

### E1 — canonical rule surface exists with all required sections

**Pass:** A new rule file exists at `core/components/memory/standards/rules/builder-isolation.md`. The file is non-empty. The file contains all six required sections, each non-empty:

1. The three-element Intent model (names goal, constraints, failure_conditions explicitly)
2. The compartmentation contract between builder and validator (explicitly states the builder never sees success_scenarios)
3. The per-play HITL configuration as the Expectation-vetting governor (names `hitl` as the governing setting; states that no global "human must approve" rule applies)
4. The constraint-vs-failure-condition decision rule, stated as the literal question "Would knowing this change how the builder writes code?", with at least one worked example walking the rule through a borderline item
5. A one-line Connections pointer (exactly one line; refers Connections to a future issue)
6. A provenance footer referencing issue #388

**Fail:** The file does not exist, or any of the six required sections is missing or empty.

### E2 — intent-resolver no longer reads scenarios from intent.yaml; reads from Expectation instead

**Pass:** In `core/components/agents/intent-resolver.md`:
- No sentence names `intent.yaml` as the source of `scenarios` or `success_scenarios`. (Grep the file for the word "scenarios" and verify every match either refers to the Expectation artifact, refers to scenarios as a historical concept, or appears in the "NEVER" boundaries section as a prohibition.)
- The Input Contract section includes an `expectation_path` field with type string, marked optional, with a description that names the Expectation artifact as the source for success_scenarios.
- Step 1's "Read Inputs" reads `success_scenarios` from `expectation_path` when provided; treats success_scenarios as empty when not provided.
- Step 2's classification rules source Stage 6 tasks from the Expectation artifact, not from `intent.yaml`.

**Fail:** Any sentence in `intent-resolver.md` still names `intent.yaml` as the source for scenarios; OR `expectation_path` is absent from the Input Contract; OR Step 1 still extracts scenarios from `intent.yaml`; OR Step 2 still sources Stage 6 tasks from intent.

### E3 — cross-references from both Intent agents to the canonical rule surface

**Pass:** Both of these are true:
- `core/components/agents/intent-resolver.md` contains a "See also" line (or equivalent cross-reference) pointing to `core/components/memory/standards/rules/builder-isolation.md`.
- `core/components/agents/intent-crafter.md` contains an equivalent cross-reference to the same file.

**Fail:** Either agent file is missing the cross-reference.

### E4 — scope guardrail: no compiled play and no intent fixture is modified

**Pass:** A check of the working tree against the branch's merge-base with `main` shows:
- Zero modifications under `core/components/plays/*/SKILL.md`
- Zero modifications under `core/components/plays/*/reference/intent.yaml`

Use `git diff --name-only main...HEAD` (or equivalent) to enumerate changed paths and confirm none match either pattern.

**Fail:** Any file matching either pattern appears in the diff.

### E5 — scope guardrail: Connections doctrine appears at most once and only as a pointer

**Scope of this eval — doctrine surfaces only.** Doctrine surfaces are files that teach the framework's rules to humans and runtime agents: anything under `docs/philosophy/`, `core/grounding/`, `core/components/agents/`, `core/components/skills/*/SKILL.md`, and `core/components/memory/standards/rules/`. STM artifacts under `.garura/project/issues/**` are NOT doctrine — they are per-issue spec and work artifacts where discussing Connections as a scope decision is expected and legitimate.

**Pass:** Within the doctrine surfaces listed above, the word "Connections" appears at most once across the entire diff, and that single appearance is a one-line pointer that the surface where Connections lives is the subject of a future issue. No paragraph-level description of Connections is added on any doctrine surface.

Operational check: enumerate doctrine-surface files in the diff via
`git diff --name-only main...HEAD -- 'docs/philosophy/**' 'core/grounding/**' 'core/components/agents/**' 'core/components/skills/**/SKILL.md' 'core/components/memory/standards/rules/**'`
and grep those files only for "Connections".

**Fail:** "Connections" appears more than once across doctrine surfaces in the diff, OR any single doctrine-surface appearance is longer than one line.

### E6 — no global "human must approve" rule introduced

**Pass:** The new rule file's text on Expectation vetting explicitly names the per-play HITL configuration as the governor; explicitly notes that HITL-off plays auto-approve and record it; and does NOT state, imply, or require that a human must approve every generated Expectation regardless of configuration.

**Fail:** The rule file states or implies a global human-approval requirement for Expectation vetting.

## Verification procedure

For each eval, record:
- `status: PASS` or `status: FAIL`
- `evidence:` a short note of what was checked and what was observed (file paths, grep hits, diff stats, quoted lines)

Do not infer pass from implementer intent. Verify against observed state only.
