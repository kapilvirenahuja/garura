# G-011: Play Handles Domain Clarification

**Gate:** discover-product/SKILL.md has a sub-flow for handling `domain_clarification_needed` structured return from agent.
**Mandatory:** Yes
**Result:** PASS

## Test

**Prompt:** `grep "domain_clarification_needed" core/components/plays/discover-product/SKILL.md`

**Output:**
```
87:If the agent returns `domain_clarification_needed` instead of `market_context`:
```

## Sub-flow verification (manual read, lines 87-93)

```markdown
If the agent returns `domain_clarification_needed` instead of `market_context`:
1. Present the candidate domains to the user
2. Parse user response — map to one of the candidates or accept a custom domain
3. Re-invoke the same agent call with confirmed domain injected into play context
4. This re-invocation does NOT count against the agent call limit (C5)
5. If user rejects all candidates and provides no alternative → halt with failure condition
```

All 5 sub-flow steps present: user presentation, response parsing, re-invocation, call limit exemption, failure path.

**Verdict:** Domain clarification sub-flow complete. Gate passes.
