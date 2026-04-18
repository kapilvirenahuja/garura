---
name: audit-spec-gaps
description: Identify gaps, ambiguities, and open questions in YAML implementation artifacts that could block implementation. Use this skill before starting implementation, when reviewing artifacts for readiness, when onboarding to a new project's design docs, or when the user says "what's missing", "gaps", "blockers", "spec review", or "implementation readiness".
user-invocable: true
model: sonnet
allowed-tools: Read, Glob, Grep
category: analysis
version: 2.0.0
---

# audit-spec-gaps

Scan a project's YAML implementation artifacts for gaps, ambiguities, and unresolved questions that would block or derail implementation.

## Why This Exists

Implementation stalls when specs leave things unsaid — undefined edge cases, scenarios without implementation guidance, conflicting requirements across documents, or external dependencies nobody accounted for. This skill surfaces those problems *before* a developer hits them mid-build, when the cost of discovery is 10x higher.

## Discovery

Find YAML artifacts by scanning these locations in order (stop at first hit per category):

| Category | Search paths (relative to CWD) |
|----------|-------------------------------|
| Features & identity | `.meridian/product/roadmap/features.yaml`, `specs/features*` |
| Architecture | `.meridian/product/architecture/architecture.yaml`, `specs/architecture*` |
| Low-level design | `.meridian/product/architecture/tech.yaml`, `specs/tech*` |
| Verification | `.meridian/product/architecture/scenarios.yaml`, `specs/scenarios*` |
| Execution plan | `.meridian/product/roadmap/plan.yaml`, `specs/plan*` |
| Product & roadmap | `.meridian/product/discovery/product.yaml`, `.meridian/product/roadmap/roadmap.yaml` |
| Project context | `CLAUDE.md`, `README.md`, `.claude/agents/*.md` |
| Config/paths | `.garura/core/config.yaml`, `**/config.yaml`, `**/config.yml` |

Also scan broadly for any `.yaml` files under `.meridian/product/` — artifact filenames should match the standard names above, but discover flexibly and categorize by content if needed.

If a product slug is provided as input, narrow the search to that slug's directory. Otherwise, scan all slugs found under `.meridian/`.

If zero specification artifacts are found, report that clearly and stop — there is nothing to audit.

**Do NOT look for old artifact names:** `vision.md`, `product-spec.md`, `technical-approach.md`, `lld.md`, `scenarios.md`, `scenario-mapping.md`, `epics.yaml`, `market-context.yaml`, `feasibility.yaml`. Those are superseded. If found, note their presence as a housekeeping item but do not audit them.

## Analysis Process

Read every discovered YAML artifact, then perform these checks. Each check produces specific findings, not summaries.

### 1. Requirements Completeness

For each feature in `features.yaml`:
- Does the feature have a complete IDD structure? Flag any feature missing `intent.p1`, `intent.p2`, `intent.p3`, `constraints`, `success_scenarios`, or `failure_conditions`.
- Are `behaviors` defined with `description`, `interaction`, and `observable_outcome`? Flag behaviors missing any of the three.
- Is `blast_radius` present? Flag any feature where the field is entirely absent (null/empty is acceptable).
- Are there TODOs, TBDs, placeholders, or template-placeholder text (e.g., `{description}`, `{short noun-phrase}`)? Extract each one verbatim with its YAML path.

For `architecture.yaml`:
- Does every `stack` entry have a concrete, named technology (not a category description)?
- Does every `deployment` entry name a specific hosting platform?
- If `agentic` is present, do all four PCAM sub-sections exist with at least one entry?

For `tech.yaml`:
- Does `project_structure` have at least one directory or key_file entry with a real path?
- Does every `libraries` entry have a `version`?
- Does every `components` entry have `interfaces` and `key_files`?

### 2. Cross-Artifact Consistency

Compare claims across artifacts — this is where the highest-value bugs hide:

- **features → scenarios:** Does every feature in `features.yaml` have at least one scenario in `scenarios.yaml` that carries a `feature_ref` back to it? Flag features with zero scenario coverage.
- **features → plan:** Does every feature ID in `features.yaml` appear in `plan.yaml.execution_order`? Flag features that exist but are not scheduled.
- **features → architecture:** Do `architecture.yaml.platforms[*].features_served` and `integrations[*].features_served` reference only feature IDs that exist in `features.yaml`? Flag broken references.
- **scenarios → plan:** Does every scenario ID in `scenarios.yaml` appear in exactly one `plan.yaml.execution_order[*].scenario_gate.scenario_ids`? Flag scenarios not assigned to any plan gate.
- **tech → features:** Does `tech.yaml.feature_mapping` have an entry for every feature in `features.yaml`? Flag unmapped features.
- **Naming consistency:** Flag cases where the same concept uses different names across documents (e.g., a component called "api-server" in tech.yaml but "backend-service" in architecture.yaml).
- **Path and config consistency:** Compare file paths across `tech.yaml.project_structure`, `tech.yaml.components[*].key_files`, and `plan.yaml.execution_order[*].scope[*].key_files`. Flag path format inconsistencies or contradictions.
- **Referenced-but-missing artifacts:** If any YAML references another artifact by path (e.g., `features_ref`, `architecture_ref`), verify that path exists. Missing referenced files are implementation blockers.

### 3. Scenario-to-Implementation Coverage

If both `scenarios.yaml` and `plan.yaml` exist:
- Flag any scenario whose `feature_ref` points to a feature not present in `plan.yaml.execution_order` — the scenario has no plan to build the thing it's testing.
- Flag any scenario missing `pass_criteria` or with only one criterion (generally insufficient for binary pass/fail verification).
- Flag `hybrid` scenarios missing a `manual_element` description.
- Flag `scenarios.yaml.coverage.uncovered_features` and `uncovered_behaviors` if non-empty.

If scenarios do NOT exist but features are defined, flag this as a top-level gap — every feature needs at least one scenario before implementation.

### 4. External Dependencies

Scan `architecture.yaml.integrations` and `architecture.yaml.platforms`:
- Flag any integration missing `auth_method` or with a vague `auth_method` value.
- Flag any integration or platform where API contract details or SDK versions are absent.
- Flag `architecture.yaml.technical_risks` entries with `severity: high` that have no mitigation.

Scan `tech.yaml.libraries`:
- Flag libraries with missing or wildcard versions (e.g., `*`, `latest`, `^x`).

### 5. Ambiguity and Assumption Detection

Across all artifacts:
- Flag conditional language that hides decisions: "should", "might", "could", "optionally", "ideally", "if possible", "TBD", "TODO", "FIXME".
- Flag schema template placeholders left unfilled: strings matching `{...}` pattern.
- Flag `status: DRAFT` on an artifact that is referenced as an approved dependency by a downstream artifact (e.g., `plan.yaml` exists but `scenarios.yaml` is still DRAFT — the plan cannot be validated against unapproved scenarios).
- Flag `open_questions` in `roadmap.yaml` that are unanswered — these may carry forward as implementation blockers.

## Output

Write the report to `{discovery_root}/gap-analysis.md` where `discovery_root` is the directory containing the discovered artifacts (e.g., `.meridian/product/`). If artifacts span multiple directories, write to the most specific common parent.

Also print a concise summary to the conversation.

### Report Structure

```markdown
# Spec Gap Analysis — {project/slug name}

**Artifacts reviewed:** {list each file path}
**Date:** {ISO date}

## (a) Missing or Unclear Requirements
{Numbered list — each item is ONE line: what's missing + which artifact + blocking question}

## (b) Cross-Artifact Conflicts or Risks
{Numbered list — each item is ONE line: the conflict + both sources + risk}

## (c) Scenario Coverage Gaps
{Numbered list — each item is ONE line: uncovered scenario or untested feature + artifact ref}

## (d) External Dependency Risks
{Numbered list — each item is ONE line: dependency + what's unspecified + blocking risk}

## Summary
{2-3 sentences: total gap count, highest-risk items, recommended next action}
```

### Word Budget

The report MUST be ≤450 words. This is a hard limit, not a target. The reason: this report is a planning input that gets read alongside other artifacts. A 1000-word report defeats the purpose — the reader could have just read the specs themselves.

**How to stay under 450 words:**
1. Analyze everything first. Collect all findings internally.
2. Rank findings by implementation-blocking severity (blocks phase start > blocks feature > improves quality).
3. Keep only the top findings that fit in 450 words. Each finding should be 1-2 lines max — state the gap, cite the source, and ask the question. No explanations, no recommendations, no context paragraphs.
4. If findings were cut, end the Summary with: "+N lower-priority items omitted."

Think of each finding as a row in a defect tracker, not a paragraph in an essay. The artifact header and section headings consume ~50 words, so you have ~400 words for actual findings. At ~25 words per finding, that's roughly 16 findings max.

### Constraints

- **Actionable items only.** Every finding must be a specific question or a specific missing element — not "the spec could be more detailed."
- **≤450 words.** Hard limit. Count before writing. If over, cut lowest-severity items.
- **Read-only.** Never modify any artifact.
- **No false positives.** If a requirement is genuinely clear and complete, do not flag it. Err on the side of fewer, higher-confidence findings over exhaustive nitpicking.
- **New artifact names only.** Audit `features.yaml`, `architecture.yaml`, `tech.yaml`, `scenarios.yaml`, `plan.yaml`, `product.yaml`, `roadmap.yaml`. Do not audit old-format `.md` artifacts.
