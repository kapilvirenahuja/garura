# G-002: Intent Structure in Core Principle

**Gate:** Core Principle section must reference two levels of intent: goal and constraints. Must not treat intent as monolith.
**Mandatory:** Yes
**Result:** PASS

## Test

**Prompt:** `grep "Intent.*—.*goal\|Constraints.*—.*boundaries" core/components/agents/product-strategist.md`

**Output:**
```
31:1. **Intent** — the goal: what the caller wants to achieve (e.g., "discover market opportunity for X")
32:2. **Constraints** — the boundaries: conditions that shape HOW you execute (e.g., "DRAFT phase only", "audience: PM", "max 2 agent calls")
```

**Verdict:** Two-level structure present at lines 31-32. Intent = goal, Constraints = boundaries. Not monolithic. Gate passes.
