| Field | Value |
|-------|-------|
| **Type** | enhancement |
| **Reported From** | /enrich sweep — issue #343 distill proposal |
| **Date** | 2026-05-04 |

### Problem

A new play-orchestration principle was extracted from issue #343 (commit-code short-circuit pattern). It belongs in the global KB at `core/components/memory/standards/rules/play-orchestration.md` but could not be written there directly via `/enrich` due to the write boundary constraint (#351). The content is ready and reviewed — it needs to be added to the KB.

### Evidence

Extracted by `distill` from PR #344. Reviewed and approved during `/enrich` sweep on 2026-05-04. Currently staged at `.garura/product/research/standards/play-orchestration.md` as a workaround.

### Specific Issues

New file to create: `core/components/memory/standards/rules/play-orchestration.md`

Content:

```markdown
# Play Orchestration Principles

Guidelines for orchestrators when deciding whether to spawn an agent vs. short-circuit.

## Short-Circuit Agent Dispatch on Deterministic Context

When an agent's sole purpose is to resolve a value that is already
deterministically derivable from an environment signal (branch name, file path,
config key, etc.), skip the agent invocation and synthesize the expected output
artifact inline.

**Rule:** If the answer can be extracted with a regex or config lookup at the
orchestrator level with high confidence, do not spawn the agent.

**Requirement:** The synthesized artifact must be contract-compatible with what
the agent would have produced — downstream steps must not know or care whether
resolution was real or synthetic.

**Example (commit-code, issue #343):**
- `project-orchestrator` is normally spawned to fetch open issues and
  semantically score issue-to-change-group mappings.
- When the branch name encodes the issue number (e.g. `feature/95-slug`),
  the issue is resolved via regex with `confidence: high`.
- The play writes a synthetic `issue-mappings.yaml` with `auto_resolved: true`
  and `source: branch-name` and skips the agent entirely.
- This eliminates one `gh` API call and one LLM semantic-scoring step from the
  hot path without any change to downstream contracts.

**Scope:** Applies to any agent whose primary output is a resolved scalar or
simple mapping derivable from pre-execution context signals.
```

### Expected Behavior

File created at `core/components/memory/standards/rules/play-orchestration.md` with the content above. Entry added to `core/components/memory/standards/rules/_index.md` if one exists.
