# Spec: discover-product Rebake

## Problem

The discover-product play assumes every product has a market to discover. When the intent describes an internal library, microservice, or technical component, Step 1 (discover-product-opportunity) produces fabricated market data — fake competitors, invented personas, meaningless TAM/SAM/SOM. This pollutes the product.yaml and produces an HTML brief with empty or misleading sections.

Additionally, the validation skill has hardcoded thresholds (>=2 personas, >=2 competitors) that are meaningless for internal tools, causing libraries to fail validation on irrelevant criteria.

## Dependency

**This spec MUST be executed AFTER the `play-eval-gen` spec is complete.** When discover-product is rebaked, it should use the new compiler that wires generated evals into the VALIDATE phase. The intent.yaml changes below are written with eval generation in mind — constraints are specific enough for automated eval generation.

## Desired Outcome

discover-product handles both market-facing products and internal libraries/components through a single play. Opportunity discovery is skipped when unnecessary. Validation adapts to what is present rather than enforcing market-specific checklist items. The HTML brief renders what exists and skips empty sections.

## Scope

### In Scope
1. intent.yaml changes (2 new constraints, 1 modified constraint, 2 new failure conditions, 1 modified scenario, 1 new scenario)
2. product.yaml schema delta (new `type` field)
3. draft-product-vision skill changes (accept missing market_context, write `type` field)
4. validate-product-vision skill changes (type-aware checklist adaptation)
5. generate-product-brief skill changes (conditional tab rendering, skip empty sections)
6. discover-product SKILL.md recompilation via `/create-play --rebake`

### Out of Scope
- discover-product-opportunity skill (no changes — it just doesn't get called)
- create-play compiler changes (separate spec: `play-eval-gen`)
- New plays or agents
- Changes to downstream plays (plan-roadmap, scope-epics)

---

## Change 1: intent.yaml Delta

### New Constraint C12
```yaml
- id: C12
  rule: >
    Opportunity discovery is conditional. It is skipped when the intent
    explicitly describes an internal library, framework component, developer
    tool, or microservice with no external market. The assessment uses three
    signals: (1) the intent names specific consumers rather than market
    segments, (2) the intent describes a technical interface boundary rather
    than a user problem, (3) no market-facing end users are identifiable.
    When skipped, vision drafting receives the raw intent text directly.
```

**Rationale:** Three concrete signals make this eval-testable. An eval can check: did the orchestrator skip opportunity discovery for an intent that names "3 internal services as consumers" and describes "a shared auth SDK"? Did it NOT skip for an intent that says "B2B SaaS for restaurant owners"?

### Modified Constraint C5
```yaml
- id: C5
  rule: >
    Maximum 3 agent dispatches in DRAFT phase (2 if opportunity discovery
    is skipped per C12), 1 in VALIDATE phase, and 0 in LOCK phase.
```

### New Constraint C13
```yaml
- id: C13
  rule: >
    The product artifact type is determined from the intent and recorded
    in product.yaml as an explicit type field. Products with external
    market-facing users are type "product". Internal libraries, components,
    SDKs, developer tools, and microservices are type "library". The type
    field governs which validation criteria apply and which brief sections
    render.
```

### New Failure Condition F8
```yaml
- id: F8
  condition: >
    A type "library" product.yaml contains fabricated market data —
    invented competitors with no basis in the intent, synthetic
    TAM/SAM/SOM estimates, or persona descriptions that do not match
    the intent's stated consumers.
```

### New Failure Condition F10
```yaml
- id: F10
  condition: >
    Opportunity discovery was skipped but the product.yaml has no
    strategic goals — the vision was drafted without sufficient
    structure for downstream planning.
```

### Modified Scenario S1
```yaml
- id: S1
  persona: Founder / Product Manager / Engineering Lead
  given: >
    The vision artifact and interactive HTML brief produced by the
    DRAFT phase, presented at the checkpoint
  then: >
    Can evaluate whether the strategic goals and positioning accurately
    capture their intent — including for internal libraries where market
    sections are absent and the brief renders technical context instead.
```

### Modified Scenario S2
```yaml
- id: S2
  persona: Engineering Lead
  given: >
    A LOCKED vision artifact at
    .meridian/project/product/{slug}/product.yaml
  then: >
    Can use the locked vision as authoritative input for roadmap
    planning — strategic goals, success metrics, and scope boundaries
    are defined clearly enough to derive engineering milestones
    without ambiguity, regardless of product type.
```

**Note:** Removed "target users, competitive landscape" from S2's "then" clause — those are not load-bearing for downstream planning per handoff analysis.

### New Scenario S4
```yaml
- id: S4
  persona: Engineering Lead
  given: >
    A LOCKED vision artifact for an internal library at
    .meridian/project/product/{slug}/product.yaml with type "library"
  then: >
    Can use the locked vision as authoritative input for roadmap
    planning — strategic goals with IDs, value proposition, and
    assumptions are defined clearly enough to derive engineering
    milestones, even though market analysis sections are absent.
```

---

## Change 2: product.yaml Schema Delta

File: `core/components/skills/draft-product-vision/schemas/product.yaml`

Add after the `status` field:

```yaml
type: "product|library"  # default: product if absent. Determines validation
                         # criteria and brief rendering. Set from intent analysis.
```

All market fields remain in the schema but become effectively optional when `type: library`:
- `target_users: []` — empty list (or populated with consumers if known)
- `competitors: []` — empty list
- `market_size: null`
- `differentiators: []` — empty list (or populated with technical differentiators)
- `risks: []` — may still have technical risks

The schema itself does not change field requirements — the fields remain present but empty. The `type` field governs validation behavior.

---

## Change 3: draft-product-vision Skill

File: `core/components/skills/draft-product-vision/SKILL.md`

### Input Change
```
- market_context — (conditional) Structured output from discover-product-opportunity.
  When absent (opportunity skipped per C12), draft vision from raw intent text.
- raw_intent — (conditional) The original intent text, provided when market_context
  is absent. One of market_context or raw_intent must be present.
- product_type — (optional) "product" or "library". Default: "product". Determines
  the type field written to product.yaml.
```

### Process Changes

Step 4 (Compose product.yaml) adds branching:

**When market_context is provided (type=product, default path):**
- Existing behavior unchanged. Populate all fields from market_context.
- Set `type: "product"`

**When raw_intent is provided (type=library, opportunity skipped):**
- `problem`: Derive from raw_intent — restate as "Developers/teams who {situation} need {outcome} because {reason}"
- `target_users`: Derive consumers from intent if mentioned. May be empty list.
- `competitors`: Empty list. Do NOT fabricate competitors.
- `market_size`: null with note "Internal library — no external market"
- `differentiators`: Extract technical differentiators from intent if present. May be empty.
- `risks`: Extract technical risks (adoption risk, maintenance burden, API stability).
- `value_proposition`: Synthesize from intent — what makes this library worth building as a shared component.
- `strategic_goals`: Derive 3-5 goals from intent. These are the load-bearing field. Goals focus on adoption, API quality, developer experience.
- `success_metrics`: Derive from strategic goals.
- `assumptions`: Derive from intent.
- `out_of_scope`: Derive from intent boundaries.
- Set `type: "library"`

### Constraint Changes
- NEVER fabricate market data when type is "library" — empty fields are correct
- ALWAYS set the `type` field based on input signal (market_context present = "product", raw_intent only = "library")
- ALWAYS produce >=3 strategic goals regardless of type (load-bearing for downstream)

---

## Change 4: validate-product-vision Skill

File: `core/components/skills/validate-product-vision/SKILL.md`

### Type-Aware Checklist

Read `type` field from product.yaml. Default to "product" if absent.

**When type = "product" (existing behavior, unchanged):**
- `strategic_goals_defined`: >=3 goals with non-empty title and description
- `target_users_identified`: >=2 target_users with persona, goal, frustration
- `success_metrics_measurable`: quantifiable targets
- `competitive_landscape_covered`: >=2 competitors with name, strength, weakness
- `assumptions_listed`: >=3 non-empty assumptions

**When type = "library":**
- `strategic_goals_defined`: >=3 goals with non-empty title and description (SAME threshold — load-bearing)
- `target_users_identified`: NOT EVALUATED (omit from checklist)
- `success_metrics_measurable`: quantifiable targets (SAME)
- `competitive_landscape_covered`: NOT EVALUATED (omit from checklist)
- `assumptions_listed`: >=1 non-empty assumption (lowered threshold)

### Output Schema Change

The checklist becomes dynamic:
```yaml
# type=product checklist (5 items)
checklist:
  strategic_goals_defined: true|false
  target_users_identified: true|false
  success_metrics_measurable: true|false
  competitive_landscape_covered: true|false
  assumptions_listed: true|false

# type=library checklist (3 items)
checklist:
  strategic_goals_defined: true|false
  success_metrics_measurable: true|false
  assumptions_listed: true|false
```

For library: 3 items at ~33% each for completeness scoring. For product: 5 items at ~20% each.

### Future: Eval-Driven Validation

Once create-play supports wiring generated evals into runtime (per play-eval-gen spec), validate-product-vision may be replaced entirely by eval execution. The intent.yaml constraints (C12, C13) and failure conditions (F1, F8, F10) are written to be eval-generatable. The type-aware checklist is a bridge.

---

## Change 5: generate-product-brief Skill

File: `core/components/skills/generate-product-brief/SKILL.md`

### Tab Rendering Changes

Read `type` field from product.yaml.

**When type = "product" (existing behavior):**
- Tab 1: "Market Context" — renders all market fields
- Tab 2: "Vision" — unchanged
- Tab 3: "Scope" — unchanged
- Tab 4: "Comments" — unchanged

**When type = "library":**
- Tab 1: "Technical Context" — renders only non-empty fields:
  - Problem → renders as "Purpose" heading
  - Target Users → renders as "Consumers" if non-empty, skipped if empty
  - Competitors → skipped entirely
  - Market Size → skipped entirely
  - Differentiators → renders as "Technical Differentiators" if non-empty
  - Risks → renders as "Technical Risks" if non-empty
- Tab 2: "Vision" — unchanged
- Tab 3: "Scope" — unchanged
- Tab 4: "Comments" — unchanged

**Key rule:** Render what exists. Skip empty sections. Do not render empty cards or "No data" placeholders.

### Output metadata adapts:
```yaml
# type=product
tabs: [market_context, vision, scope, comments]

# type=library
tabs: [technical_context, vision, scope, comments]
```

No design system changes — same LifeOS Dark tokens.

---

## Change 6: Play Recompilation

The play SKILL.md is NOT hand-edited. After all skill changes are complete:
```
/create-play --rebake discover-product
```

The compiler (with play-eval-gen changes) will produce a new SKILL.md that:
1. Adds a conditional gate before Step 1 (assess whether to skip opportunity discovery per C12)
2. Modifies the Step 1 → Step 2 contract to pass either `market_context` or `raw_intent`
3. Adjusts C5 agent budget callout
4. Generates evals from F8 and F10 via evals-creator (not hand-authored)
5. Updates scenario validations with generated SCE-4 for type=library

### Expected Play Flow After Rebake

**DRAFT Phase (type=product, unchanged):**
```
Pre-flight → Assess Intent → Step 1 (discover-opportunity) → Step 2 (draft-vision with market_context) → Step 3 (generate-brief) → Checkpoint → Evidence
```

**DRAFT Phase (type=library, opportunity skipped):**
```
Pre-flight → Assess Intent [skip opportunity] → Step 2 (draft-vision with raw_intent, type=library) → Step 3 (generate-brief) → Checkpoint → Evidence
```

Agent budget when skipped: 2 dispatches (1 product-strategist for draft, 1 doc-builder for brief) + repo-orchestrator for evidence.

---

## Execution Order

1. **Update intent.yaml** — Add C12, C13, modify C5, add F8, F10, modify S1, S2, add S4
2. **Update product.yaml schema** — Add `type` field
3. **Update draft-product-vision SKILL.md** — Accept raw_intent, conditional composition, type field
4. **Update validate-product-vision SKILL.md** — Type-aware checklist, dynamic scoring
5. **Update generate-product-brief SKILL.md** — Conditional tab rendering, skip empty sections
6. **Rebake play** — `/create-play --rebake discover-product` (AFTER play-eval-gen is done)
7. **Sync** — `/sync-claude`

Steps 2-5 can be parallelized. Step 1 goes first (intent is source of truth). Step 6 depends on all previous steps AND the play-eval-gen spec being complete.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| "Orchestrator assesses sufficiency" is too vague for evals | C12 defines 3 concrete signals. Evals can test against known library/product intents. |
| type field becomes unbounded enum | Spec explicitly limits to "product" and "library". New types require intent change. |
| Validation checklist omitting fields breaks consumers | Output schema documents dynamic shape. Consumers check field presence. |
| Brief tab name change breaks external references | Tab names are display-only in self-contained HTML. No external system references them. |

## Critical Files

| File | Role |
|------|------|
| `core/components/plays/discover-product/reference/intent.yaml` | Primary: receives C12, C13, F8, F10, S4 |
| `core/components/skills/draft-product-vision/SKILL.md` | Accept raw_intent, conditional composition, type field |
| `core/components/skills/draft-product-vision/schemas/product.yaml` | Schema: type field addition |
| `core/components/skills/validate-product-vision/SKILL.md` | Type-aware checklist with dynamic field omission |
| `core/components/skills/generate-product-brief/SKILL.md` | Conditional tab rendering, skip empty sections |
