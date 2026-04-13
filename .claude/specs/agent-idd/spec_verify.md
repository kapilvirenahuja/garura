# Agent IDD Awareness — Verification

## Gates

### G1: LTM Access (Mandatory)
All four agents have a `## Memory` section that references `~/.meridian/core/memory/practices/`.
- Evidence: grep agent files for memory/LTM reference
- Pass: all 4 agents have the section
- Fail: any agent missing LTM reference

### G2: Intent Propagation (Mandatory)
At least one play passes intent context in its agent invocation prompt.
- Evidence: grep play SKILL.md for intent propagation pattern in agent invocation
- Pass: commit-code play propagates intent to repo-orchestrator and project-orchestrator
- Fail: no play propagates intent

### G3: Agent Self-Recovery (Mandatory)
Orchestrator agents (repo, project) document domain-level self-recovery with concrete examples.
- Evidence: read each agent's `## Recovery` section
- Pass: at least 2 examples of self-recovery per orchestrator agent
- Fail: no self-recovery documented, or builder/designer have full self-recovery (wrong depth)

### G4: Structured Failure Protocol (Mandatory)
All four agents document the structured failure return format for cross-domain failures.
- Evidence: read each agent's recovery section for the failure return schema
- Pass: all agents return `failure:` block with `what_failed`, `why`, `domain_assessment`, `suggested_fix`
- Fail: any agent returns raw errors or unstructured failure messages

### G5: Play-Level Retry (Mandatory)
At least one play demonstrates the cross-domain recovery conversation (invoke Agent A → failure → invoke Agent B → retry Agent A).
- Evidence: read play workflow for retry logic or recovery conversation pattern
- Pass: play documents how it handles structured failures from agents
- Fail: play has no handling for structured failures

### G6: No Breaking Changes (Mandatory)
Existing agent output contracts are unchanged. Recovery adds behavior, doesn't change success interfaces.
- Evidence: diff agent files, confirm output contract sections unchanged
- Pass: output contracts identical to pre-change for success cases
- Fail: any success output contract modified

### G7: Recovery Loop Prevention (Mandatory)
Agents and plays have retry limits to prevent infinite recovery loops.
- Evidence: read agent recovery sections and play recovery handling for attempt limits
- Pass: explicit limit documented (max 2 retry cycles per agent per play execution)
- Fail: no limit specified

### G8: Cross-Domain Example (Nice-to-have)
At least one end-to-end example showing Agent A fails → play routes to Agent B → Agent B fixes → Agent A retries successfully.
- Evidence: worked example in a play or in LTM practice doc
- Pass: complete worked example with all protocol steps
- Fail: no end-to-end example
