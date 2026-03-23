# Verification Scenarios: discover-product-rebake

Each scenario is independently testable with clear pass/fail criteria.

---

## V1: intent.yaml has all new constraints and failure conditions

**What:** The intent.yaml contains C12, C13, modified C5, F8, F10, modified S1/S2, and new S4.

**Pass criteria:**
- C12 exists with three concrete skip signals (names consumers, technical boundary, no market-facing users)
- C13 exists defining type field as "product" or "library"
- C5 mentions "(2 if opportunity discovery is skipped per C12)"
- F8 describes fabricated market data in type "library" artifacts
- F10 describes missing strategic goals when opportunity skipped
- S1 includes "including for internal libraries where market sections are absent"
- S2 says "regardless of product type"
- S4 exists for Engineering Lead with type "library" given clause

**Fail criteria:**
- Any of the above items missing from intent.yaml
- C12 uses vague language without the 3 signals

---

## V2: product.yaml schema has type field

**What:** The schema file includes the optional type field.

**Setup:** Read `core/components/skills/draft-product-vision/schemas/product.yaml`.

**Pass criteria:**
- `type` field exists in schema with values "product" or "library"
- Default is "product" when absent
- Market fields (target_users, competitors, market_size, differentiators, risks) remain in schema

**Fail criteria:**
- type field missing
- Market fields removed from schema

---

## V3: draft-product-vision accepts raw_intent input

**What:** The skill's Input section accepts both market_context and raw_intent paths.

**Setup:** Read `core/components/skills/draft-product-vision/SKILL.md`.

**Pass criteria:**
- Input section lists `market_context` as conditional
- Input section lists `raw_intent` as conditional
- Input section lists `product_type` as optional
- Process describes branching: market_context present → standard path; raw_intent → library path
- Library path explicitly says NEVER fabricate competitors, market_size, or personas

**Fail criteria:**
- raw_intent not in input section
- No branching logic in process
- Library path allows fabricated market data

---

## V4: draft-product-vision always produces ≥3 strategic goals

**What:** Both product and library paths produce at least 3 strategic goals.

**Setup:** Read draft-product-vision SKILL.md constraints section.

**Pass criteria:**
- Constraint explicitly states "ALWAYS produce >=3 strategic goals regardless of type"
- Library path process step mentions deriving 3-5 goals from intent
- type field is set based on input signal (market_context → product, raw_intent → library)

**Fail criteria:**
- No explicit constraint about strategic goals count for libraries
- Library path allows fewer than 3 goals

---

## V5: validate-product-vision is type-aware

**What:** The validation checklist adapts based on product type.

**Setup:** Read `core/components/skills/validate-product-vision/SKILL.md`.

**Pass criteria:**
- Process reads `type` field from product.yaml
- When type="product": 5-item checklist (strategic_goals, target_users, success_metrics, competitive_landscape, assumptions)
- When type="library": 3-item checklist (strategic_goals, success_metrics, assumptions)
- target_users_identified and competitive_landscape_covered are NOT EVALUATED for libraries
- assumptions_listed threshold is >=1 for libraries (vs >=3 for products)
- strategic_goals_defined threshold stays >=3 for both types
- Completeness scoring adapts to number of active items

**Fail criteria:**
- No type-awareness in validation process
- Library uses same 5-item checklist as product
- strategic_goals threshold reduced for libraries

---

## V6: generate-product-brief renders conditional tabs

**What:** Tab 1 adapts: "Market Context" for products, "Technical Context" for libraries.

**Setup:** Read `core/components/skills/generate-product-brief/SKILL.md`.

**Pass criteria:**
- Process reads `type` field from product.yaml
- type="product" → Tab 1 is "Market Context" with all market fields
- type="library" → Tab 1 is "Technical Context" with only non-empty fields
- Empty sections are skipped (no "No data" placeholders)
- Problem renders as "Purpose" for libraries
- Competitors and Market Size skipped entirely for libraries
- Output metadata shows `tabs: [technical_context, vision, scope, comments]` for libraries

**Fail criteria:**
- No type-awareness in brief generation
- Empty sections rendered with placeholders
- Library brief shows "Market Context" tab

---

## V7: Rebaked recipe has conditional opportunity discovery gate

**What:** After rebake, the compiled SKILL.md includes a conditional gate before Step 1.

**Setup:** Rebake discover-product and read compiled SKILL.md.

**Pass criteria:**
- Pre-flight or early workflow includes intent assessment for opportunity skip
- C12's three signals are referenced in the skip logic
- When skipped, Step 2 receives raw_intent instead of market_context
- Agent budget reflects C5 adjustment (2 dispatches when skipped)
- New evals exist for F8 (fabricated data) and F10 (no goals after skip)
- SCE-4 exists for type="library" scenario

**Fail criteria:**
- No conditional gate — opportunity discovery always runs
- C12 signals not referenced
- No evals for F8 or F10

---

## V8: Generated evals cover all new intent items

**What:** The rebaked recipe's evals cover C12, C13, F8, F10, S4.

**Setup:** Read the evals from the rebaked recipe or the evals.yaml generated during rebake.

**Pass criteria:**
- C12 has at least one eval (artifact-verifiable or structural classification)
- C13 has at least one eval checking type field in product.yaml
- F8 has at least one eval checking for fabricated market data
- F10 has at least one eval checking strategic goals exist when opportunity skipped
- S4 has a scenario eval for Engineering Lead with type="library"
- Coverage matrix shows zero uncovered items

**Fail criteria:**
- Any new intent item uncovered
- Coverage matrix has gaps

---

## V9: No regressions in existing discover-product behavior

**What:** Product-type discovery (the default path) is unchanged.

**Pass criteria:**
- When type="product" (default), all 5 validation checklist items still apply
- Market Context tab still renders for products
- opportunity discovery still runs for market-facing intents
- Existing constraints C1-C11 still present and unchanged (except C5 modification)
- Existing failure conditions F1-F7, F9 still present and unchanged

**Fail criteria:**
- Any existing constraint removed or weakened
- Product-type validation loses checklist items
- Market Context tab missing for product-type artifacts
