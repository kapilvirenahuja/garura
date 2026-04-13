# G-012: Play Constraint Updated

**Gate:** intent.yaml has C12 constraint for domain context handling + "domain unresolvable" failure condition.
**Mandatory:** Yes
**Result:** PASS

## Test

**Prompt:** `grep "C12|Domain unresolvable" core/components/plays/discover-product/reference/intent.yaml`

**Output:**
```
32:    - id: C12
38:  - "Domain unresolvable — user rejects all proposed domains and provides no alternative"
```

## Content verification (manual read)

**C12 (line 32-33):**
```yaml
- id: C12
  rule: "Product-strategist MUST attempt domain classification before skill invocation. If classification is ambiguous, return domain_clarification_needed to play. Play handles user interaction and re-invokes with confirmed domain."
```

**Failure condition (line 38):**
```
"Domain unresolvable — user rejects all proposed domains and provides no alternative"
```

**Verdict:** C12 constraint and failure condition both present. Gate passes.
