
# Spec: `briefs` Recipe

## What It Does

Scans the product directory for YAML artifacts, checksums each one, regenerates the corresponding HTML brief for any that changed, and rebuilds hub.html. Derives context from the current branch to scope to the right product and epic.

## Behavior

- No flags. Context-aware — figures out what to regenerate from where you are.
- Derives epic scope from branch/issue context when available
- On main or no epic context → scans product-level + all epics with YAMLs on disk
- Checksums YAMLs against `{slug}/briefs/.checksums.json` — only regenerates what changed
- Calls doc-builder for the changed set, writes updated checksums, reports hub.html path
- Halts cleanly if no product directory exists

## Implementation

Run `/create-recipe briefs` — the compiler handles everything:
1. Interviews for intent (goal, constraints, failure conditions, scenarios)
2. Identifies needed skills and agents (doc-builder)
3. Audits agents
4. Selects workflow structure
5. Compiles the deterministic SKILL.md
6. `/sync-droids` to deploy
