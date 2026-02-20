# Agent IDD Awareness — Tasks

## Dependency Graph

```
T1 (structured failure protocol LTM) ──┐
                                        ├── T3 (repo-orchestrator)
T2 (recovery section template) ────────┤── T4 (project-orchestrator)
                                        ├── T5 (code-builder)
                                        └── T6 (tech-designer)

T7 (intent propagation template) ────── T8 (update commit-code recipe)

T3, T4, T5, T6, T8 ────────────────── T9 (verify all gates)
```

## Tasks

### T1: Create Structured Failure Protocol LTM
- **Agent**: inline / tech-designer
- **Description**: Create `~/.phoenix-os/core/memory/practices/structured-failure-protocol.md`. Defines the structured failure return format that all agents use when escalating cross-domain failures. Includes the YAML schema (`what_failed`, `why`, `domain_assessment`, `suggested_fix`), examples per agent role, and guidance on when to self-recover vs. escalate.
- **Depends on**: nothing
- **Parallel**: yes (can run alongside T2 and T7)

### T2: Design Agent Recovery Section Template
- **Agent**: tech-designer (or inline)
- **Description**: Create a standard template for the `## Memory` and `## Recovery` sections to add to each agent definition. Template must cover:
  - LTM loading pattern
  - Self-recovery: when and how (varies by role)
  - Escalation: structured failure return format
  - Retry awareness: agent knows it might be retried with updated context
  - Template varies by role (orchestrator full, builder limited, designer moderate)
- **Depends on**: T1 (needs failure protocol to reference)
- **Parallel**: yes (can run alongside T7)

### T3: Update repo-orchestrator
- **Agent**: code-builder
- **Description**: Add `## Memory` section (LTM loading), `## Recovery` section per template from T2. Self-recovery examples: branch exists → checkout existing, commit fails → stash/stage first, push rejected → check remote state. Escalation examples: no git repo → structured failure, CI check fails → structured failure with domain_assessment pointing to quality-validator.
- **Depends on**: T2
- **Parallel**: yes (T3, T4, T5, T6 can run in parallel)

### T4: Update project-orchestrator
- **Agent**: code-builder
- **Description**: Add `## Memory` section (LTM loading), `## Recovery` section per template from T2. Self-recovery examples: issue not found → search broader, creation fails → retry with different labels. Escalation examples: issue references non-existent repo component → structured failure pointing to tech-designer.
- **Depends on**: T2
- **Parallel**: yes

### T5: Update code-builder
- **Agent**: code-builder
- **Description**: Add `## Memory` section (read-only LTM awareness), `## Recovery` section per template from T2. Limited self-recovery: can retry within plan boundaries (e.g., adjust import path, fix syntax). Escalation: design gap → structured failure to tech-designer, test failures it can't fix → structured failure with evidence, missing dependency → structured failure to recipe.
- **Depends on**: T2
- **Parallel**: yes

### T6: Update tech-designer
- **Agent**: code-builder
- **Description**: Add `## Memory` section (read-only LTM awareness), `## Recovery` section per template from T2. Moderate self-recovery: broaden search patterns, try alternate analysis angles, explore different entry points. Escalation: codebase in unexpected state → structured failure, analysis requires runtime data it can't access → structured failure to recipe.
- **Depends on**: T2
- **Parallel**: yes

### T7: Design Intent Propagation Template
- **Agent**: tech-designer (or inline)
- **Description**: Define a standard lightweight pattern for how recipes pass intent context to agents in invocation prompts. Must include: recipe intent, relevant constraints, and (for retries) the structured failure from the previous attempt. Keep it concise — agents shouldn't be overwhelmed with context.
- **Depends on**: nothing
- **Parallel**: yes (can run alongside T1, T2)

### T8: Update commit-code Recipe for Recovery Conversation
- **Agent**: code-builder
- **Description**: Update commit-code's agent invocation instructions to:
  1. Include intent propagation per template from T7
  2. Handle structured failures from agents (if repo-orchestrator or project-orchestrator returns a failure, reason about cross-domain recovery)
  3. Document the retry pattern for this specific recipe
- **Depends on**: T7, T3, T4 (needs updated agents + intent template)
- **Parallel**: no

### T9: Verify All Gates
- **Agent**: explore / inline
- **Description**: Run all verification gates from spec_verify.md (G1-G8). Collect evidence for each gate. Report pass/fail with evidence links.
- **Depends on**: T3, T4, T5, T6, T8
- **Parallel**: no (final step)
