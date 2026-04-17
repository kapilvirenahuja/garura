| Field | Value |
|-------|-------|
| **Severity** | High |
| **Affected Component** | `core/components/plays/fix-it/` (SKILL.md + intent.yaml) |
| **Reported From** | Audit of fix-it play's tech-designer invocation contract vs resolution protocol and product LTM |
| **Date** | 2026-04-16 |

### Problem

The fix-it play invokes tech-designer for its critical RCA & Design step (Step 3) without passing `ltm_context` in the agent contract. This means the tech-designer falls back to its Step 3-4 behavior (ad-hoc LTM search via Grep/Glob on `~/.meridian/core/memory/`) instead of following the R1-R4 resolution protocol.

The consequence: RCA and fix design for defects are not grounded in the product's locked architecture decisions, technology stack, domain knowledge, or established patterns. The tech-designer operates on general reasoning and whatever it happens to find via keyword search, rather than systematically resolving against the product's knowledge layers.

The core flow (RCA → design → checkpoint → implement → ship) should NOT change. The fix is surgical: add `ltm_context` to the Step 3 contract so tech-designer follows R1-R4 and produces a resolution trace, which also feeds the downstream capture-learning and check-drift loops.

### Evidence

#### The gap: no ltm_context in Step 3 contract

Fix-it's Step 3 contract to tech-designer:

```json
{
  "intent_path": "core/components/plays/fix-it/reference/intent.yaml",
  "stm_base": "{stm_base}",
  "stm": {
    "input": {
      "issue_read": "{stm_base}/{issue}/evidence/fix-it/issue-read.yaml"
    },
    "output": {
      "rca": "{stm_base}/{issue}/evidence/fix-it/rca.yaml",
      "design": "{stm_base}/{issue}/evidence/fix-it/design.yaml"
    }
  },
  "task_id": "rca-and-design"
}
```

No `ltm_context` field. Compare to prepare-epic's contract to tech-architect (Step 1E):

```json
{
  "task_id": "1E-ltm-consultation",
  "ltm_context": {
    "core_base": "~/.meridian/core/memory/",
    "query_domains": ["architecture", "implementation-patterns", "quality-standards", "testing-patterns"]
  }
}
```

Or create-pr's contract to repo-orchestrator:

```json
{
  "ltm_context": {
    "project_base": "{product_base}architecture/",
    "core_base": "~/.meridian/core/memory/",
    "query_domains": ["git", "pr-standards"],
    "locked_artifacts": []
  }
}
```

fix-it is the only play that invokes tech-designer for substantive technical analysis without passing ltm_context.

#### What this means in practice

The tech-designer's behavior when ltm_context is present vs absent:

| With ltm_context (R1-R4) | Without ltm_context (current fix-it) |
|---|---|
| Identifies decision domains from task intent + query_domains | Guesses what domains are relevant |
| Searches product LTM for project-specific architecture, patterns, conventions | No product LTM consultation |
| Searches core LTM via `_index.md` files with keyword matching | Ad-hoc Grep/Glob on `~/.meridian/core/memory/` — may miss files, may load irrelevant files |
| Records every decision resolution in resolution-trace.yaml | No resolution trace — gaps are invisible to downstream plays |
| LOCKED artifacts stop descent — authoritative decisions are respected | No awareness of which architecture decisions are locked vs draft |
| LLM fallbacks are flagged explicitly | LLM reasoning happens silently — no signal for capture-learning |

#### Real impact — issue #195 RCA

Looking at the actual RCA from issue #195 (capture-learning zero extraction):

The RCA correctly identifies the root cause (hardcoded `find` command matching only `resolution-trace.yaml`). But the design choices — broadening the scan to include multiple artifact types, extending knowledge-extractor's EXTRACT mode — were made without consulting:

- The product's architecture (`product/architecture/`) for how evidence artifacts are structured
- The resolution protocol (`standards/rules/resolution.md`) for how extraction should work
- Domain knowledge about the knowledge lifecycle
- Existing patterns for multi-format artifact parsing

The tech-designer's Step 3 "Selective LTM Search" says it searches `~/.meridian/core/memory/` using Glob and Grep, but this is:
1. Ad-hoc — no structured domain identification (R1)
2. Keyword-dependent — misses files whose search_patterns don't match the query terms
3. Untracked — no resolution trace, so no one knows what was consulted and what was missed
4. Core-only — never reads product LTM, so project-specific architecture and conventions are invisible

#### The resolution trace gap feeds downstream

Without a resolution trace from fix-it's tech-designer invocation:
- **capture-learning** (#236) cannot extract what domain questions fell to LLM during the RCA — the learning signal is lost
- **check-drift** (#237) cannot compare the fix design against locked specs — it doesn't know which specs the design was supposed to respect
- **Future fix-it runs** for similar bugs can't benefit from prior RCA patterns — the knowledge gap is invisible

#### What product LTM should ground

For a fix-it run against a product with established product LTM, the tech-designer should consult:

| LTM layer | What it provides for RCA/design | Path |
|---|---|---|
| Locked architecture | Which tech decisions are authoritative — don't propose a fix that contradicts the locked physical architecture | `{product_base}architecture/physical-architecture.yaml` |
| Design patterns | Established patterns for this product — fixes should follow them | `{product_base}architecture/design-patterns.yaml` |
| NFR spec | Quality constraints the fix must respect (performance, security thresholds) | `{product_base}architecture/nfr-spec.yaml` |
| Domain research | Domain-specific context that might explain why the code works the way it does | `{product_base}research/{domain}.md` |
| Core standards | Universal coding standards, architecture patterns, quality rules | `~/.meridian/core/memory/standards/`, `~/.meridian/core/memory/knowledge/` |
| Epic scope (if traceable) | What the original epic intended — helps determine if the bug is a spec gap vs implementation error | `{product_base}scope/epics/{id}.yaml` |

### Expected Behavior

Step 3's contract should include `ltm_context` so tech-designer follows R1-R4:

```json
{
  "intent_path": "core/components/plays/fix-it/reference/intent.yaml",
  "stm_base": "{stm_base}",
  "stm": {
    "input": {
      "issue_read": "{stm_base}/{issue}/evidence/fix-it/issue-read.yaml"
    },
    "output": {
      "rca": "{stm_base}/{issue}/evidence/fix-it/rca.yaml",
      "design": "{stm_base}/{issue}/evidence/fix-it/design.yaml",
      "resolution_trace": "{stm_base}/{issue}/evidence/fix-it/resolution-trace.yaml"
    }
  },
  "task_id": "rca-and-design",
  "ltm_context": {
    "project_base": "{product_base}architecture/",
    "core_base": "~/.meridian/core/memory/",
    "query_domains": ["architecture", "design-patterns", "quality-standards", "domain-context"],
    "locked_artifacts": []
  }
}
```

The `locked_artifacts` list should be populated from the product's architecture lock state. If the product has locked architecture artifacts, they should be listed here so tech-designer treats them as authoritative during RCA.

The resolution trace output (`resolution_trace` in stm.output) feeds downstream plays:
- capture-learning reads it to extract LLM-fallback decisions
- check-drift reads it to verify the fix design respected locked specs

### Impact

- **RCA quality**: Without architecture grounding, the tech-designer may propose fixes that contradict locked architecture decisions or violate established patterns. The fix works but introduces architectural drift.
- **Resolution trace gap**: No resolution trace means capture-learning (#236) and check-drift (#237) have no signal from fix-it runs. The majority of closed issues in this project are defect fixes — these are the issues capture-learning would run on most often, and they produce zero resolution traces.
- **Pattern blindness**: When LTM contains patterns relevant to the bug (e.g., "this is the third time an agent-contract field was added but the play didn't pass it"), the tech-designer doesn't see them. The same class of bug gets fixed differently each time instead of converging on a consistent approach.
- **NFR violations**: Without consulting `nfr-spec.yaml`, a fix might introduce a performance regression or security weakness that violates the product's quality constraints.

### Fix Plan

**Core flow is unchanged.** The 9-step workflow (validate → branch → RCA/design → brief → checkpoint → implement → ship → scenario evals → evidence) stays exactly as-is.

**Phase 1: Add ltm_context to intent.yaml**

Add a new constraint:

```yaml
- id: C11
  rule: >
    The RCA and design agent contract must include ltm_context with
    project_base pointing to the product's architecture directory and
    core_base pointing to the core memory. The agent follows the R1-R4
    resolution protocol from standards/rules/resolution.md. The
    resolution trace is written to STM evidence and included in the
    output contract.
```

Add a corresponding failure condition:

```yaml
- id: F8
  condition: >
    The tech-designer's RCA or design is produced without consulting
    product LTM when product architecture artifacts exist at
    product_base. The resolution trace is missing or empty when
    ltm_context was provided.
```

**Phase 2: Update Step 3 contract in SKILL.md**

Add `ltm_context` to the Step 3 JSON contract (see Expected Behavior section above). Add `resolution_trace` to `stm.output`. This is a 3-line diff to the contract JSON.

Add a new step eval:

```
SE-9 (C11/F8): When ltm_context was provided, resolution-trace.yaml
exists at the output path with at least one entry. If product_base
architecture artifacts exist, at least one entry resolves from
"project" source.
```

**Phase 3: Pre-flight resolution of product_base**

Add `product_base` resolution to pre-flight (alongside existing `stm_base` resolution):

```bash
product_base=$(grep -A1 '^product:' .meridian/core/config.yaml | grep 'base-path' | awk '{print $2}')
```

If `product_base` directory doesn't exist or has no architecture artifacts, `ltm_context.project_base` is omitted from the contract and the tech-designer falls back to core-only resolution (R3 → R4). This maintains backward compatibility with projects that haven't run the product pipeline.

**Phase 4: Populate locked_artifacts**

Scan `{product_base}architecture/` for artifacts with `status: LOCKED` metadata. Pass their paths in `ltm_context.locked_artifacts` so tech-designer treats them as authoritative during R2.

If no locked artifacts exist, pass empty list — tech-designer treats everything as DRAFT (advisory).

**Phase 5: Rebuild via /create-play --build fix-it**

After intent.yaml changes, rebuild the compiled SKILL.md.

### Relationship to #236 and #237

This is the third piece of the product LTM feedback loop:

1. **fix-it** (this issue) — produces resolution traces during RCA, feeding signals to downstream plays
2. **check-drift** (#237) — compares what was built vs specified, writes spec corrections back to product LTM
3. **capture-learning** (#236) — extracts domain/technology/PM learnings and enriches product LTM

fix-it's resolution traces are a primary signal source for both check-drift and capture-learning. Without them, defect fixes (the most common issue type) are invisible to the learning loop.

The fix here is minimal (add ltm_context to one contract + one new constraint + one new eval) and doesn't change the core flow. It's the lowest-effort, highest-signal improvement across the three issues.
