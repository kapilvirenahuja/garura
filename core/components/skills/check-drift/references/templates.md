# check-drift Output Templates

Consistent structures for all drift analysis outputs.

---

## Drift Item Template

```markdown
DRIFT-[ID]: [Title]

Type: context-drift | spec-drift | technology-drift
Severity: critical | high | medium | low
Affected artifacts: [list of spec/context files that are now wrong]

Description:
[What was specified vs what was built. Be specific — cite file, section, line if possible.]

RCA:
[Root cause — why did this drift occur? Not "we changed it" but WHY it was changed.
Was it a constraint? A discovery? A misread? A deliberate override?]

Recommendation:
[Specific action: update-spec | update-context | log-defect | update-code | product-decision-needed | no-action]
[If update: which file, which section, what change]
```

---

## ADR Template

Architecture Decision Records capture decisions made DURING implementation that changed direction from the spec. These are design decisions, not design itself.

```markdown
ADR-[ID]: [Decision Title]

Status: accepted | provisional | superseded
Date: [YYYY-MM-DD]
Related drifts: [DRIFT-xxx]

Context:
[What situation prompted this decision? What constraint or discovery triggered it?]

Decision:
[What was decided — stated as a fact, not a recommendation]

Rationale:
[Why this was chosen. What alternatives were considered and why they were rejected.]

Alternatives considered:
- [Alternative 1]: [why rejected]
- [Alternative 2]: [why rejected]

Consequences:
  Positive:
  - [benefit 1]
  Negative:
  - [cost or risk 1]
  Downstream:
  - [what this affects in future epics or decisions]
```

**Status meanings:**
- `accepted` — decision is final, no further discussion needed
- `provisional` — decision was made pragmatically but needs a product/architecture review to confirm
- `superseded` — this decision was later overridden by a newer ADR

---

## Debt Item Template

```markdown
DEBT-[ID]: [Title]

Classification: accepted | forced
Severity: critical | high | medium | low
Category: code-quality | spec-quality | architecture | testing | security | performance

Description:
[What the debt is — stated factually]

Current state:
[How it works today]

Desired state:
[How it should work]

Blast radius:
  Components affected:
  - [file or module 1]
  - [file or module 2]
  Epics affected:
  - [E3 — because ...]
  - [E4 — because ...]
  User impact:
  - [How users experience this — or "none" if internal only]
  Cascading risk:
  - [What breaks or degrades if this isn't fixed]
  - [What becomes harder to build]

Estimated effort: S | M | L
When to fix: [E3 | E4 | post-MVP | never]
```

**Classification guide:**
- `accepted` — deliberate shortcut taken with full awareness. "We chose Haiku for speed, will upgrade later."
- `forced` — caused by a constraint we didn't anticipate. "Vercel timeout killed us, had to redesign."

**Blast radius assessment method:**
1. List every file that imports from or depends on the debt-affected module
2. List every epic whose scope touches the debt-affected behavior
3. Assess user impact: does the user see wrong data, degraded performance, or nothing?
4. Assess cascading risk: if this debt compounds, what breaks first?

---

## Memory Item Template

Memory items are generalizable learnings — NOT project-specific configuration. They should be useful to ANY future epic or ANY future project on the same tech stack.

```markdown
MEM-[ID]: [Title]

Type: technical | domain | process | pattern
Scope: universal | platform-specific | project-specific

Content:
[The actual knowledge — stated as a principle, rule, or pattern.
Write it as if teaching someone who will encounter this situation for the first time.]

Why it matters:
[What goes wrong if this is forgotten? What time/money/quality is lost?]

Tags: [comma-separated searchable keywords]

LTM path: core/components/memory/knowledge/[category]/[filename].md
```

**Scope meanings:**
- `universal` — applies to any project, any stack (e.g., "spec changes need ADRs")
- `platform-specific` — applies when using a specific platform (e.g., "Supabase RLS blocks real-time")
- `project-specific` — only relevant to this project (rarely promoted to LTM)

**LTM path convention:**
Place items under `core/components/memory/knowledge/` in the appropriate subdirectory:
- `architecture/` — architectural patterns and platform knowledge
- `domain/` — domain-specific knowledge (experiment platforms, AI agents, etc.)
- `process/` — development process learnings

---

## Recommendation Templates

### Spec Recommendation

```markdown
REC-SPEC-[ID]: [Title]

Artifact: [exact file path]
Section: [section name or number]
Change: [specific change to make — not vague, executable]
Priority: P0 (blocks next epic) | P1 (should fix soon) | P2 (cosmetic)
Related drifts: [DRIFT-xxx]
```

### Code Recommendation

```markdown
REC-CODE-[ID]: [Title]

Files:
- [file path 1]
- [file path 2]
Change: [what to change — specific enough for a developer to execute]
Priority: P0 | P1 | P2
Effort: S (< 1 hour) | M (1-4 hours) | L (> 4 hours)
Related drifts: [DRIFT-xxx]
```
