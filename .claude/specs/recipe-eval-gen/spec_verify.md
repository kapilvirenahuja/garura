# Verification Scenarios: recipe-eval-gen

Each scenario is independently testable with clear pass/fail criteria.

---

## V1: evals-creator accepts constraint_classifications input

**What:** The modified evals-creator skill accepts the new `constraint_classifications` input field and only generates evals for `artifact-verifiable` constraints.

**Setup:** Invoke evals-creator with ship's intent.yaml and a constraint_classifications list where C1 is `pre-flight`, C3/C5/C6 are `structural`, and any artifact-verifiable constraints are tagged.

**Pass criteria:**
- evals-creator produces an `evals.yaml` output file
- The output contains `step_evals` and `scenario_evals` sections
- No eval references a constraint classified as `pre-flight` or `structural`
- Every eval for an artifact-verifiable constraint has a non-null `constraint_id`

**Fail criteria:**
- evals-creator errors on the new input format
- Output contains evals for pre-flight or structural constraints
- Output is missing the `constraint_id` field on constraint-sourced evals

---

## V2: evals-creator output includes coverage summary

**What:** The evals-creator output includes a `coverage` section listing covered and uncovered items.

**Setup:** Run evals-creator against discover-product's intent.yaml (11 constraints, 7 failure conditions, 3 scenarios) with all constraints classified.

**Pass criteria:**
- Output contains `coverage.failure_conditions_covered` and `coverage.failure_conditions_uncovered` lists
- Output contains `coverage.constraints_covered` and `coverage.constraints_uncovered` lists (artifact-verifiable only)
- Output contains `coverage.scenarios_covered` and `coverage.scenarios_uncovered` lists
- The union of covered + uncovered for each category equals the total count from intent.yaml
- `failure_conditions_uncovered` is empty (every F-n has at least one eval)
- `scenarios_uncovered` is empty (every S-n has at least one SCE)

**Fail criteria:**
- Coverage section is missing from output
- Any failure condition or scenario appears in `uncovered`
- Counts don't add up to intent totals

---

## V3: Generated evals use intent language, not invented thresholds

**What:** The fidelity rule is enforced — generated eval language derives from the intent's own text.

**Setup:** Run evals-creator against discover-product's intent.yaml. Inspect generated evals for F1 ("fewer than 3 strategic goals, or no target audience is identifiable").

**Pass criteria:**
- The generated eval for F1 uses language like "strategic goals count is not fewer than 3" or "at least one target audience is identifiable" — mirroring F1's own words
- No eval contains a numeric threshold not present in the corresponding constraint or failure condition text
- Specifically: no eval says ">=2 personas" unless the intent itself specifies "2 personas"

**Fail criteria:**
- An eval introduces a threshold like ">=2 competitors" when the intent says "competitive landscape covered" (qualitative)
- An eval reformulates the intent language into a different semantic meaning
- An eval for F2 (domain unresolvable) tests something other than domain resolution (the current SE-3 misalignment bug)

---

## V4: Every eval has source traceability

**What:** Every generated eval cites its source ID — no orphan evals.

**Setup:** Run evals-creator against ship's intent.yaml (6 constraints, 6 failure conditions, 2 scenarios).

**Pass criteria:**
- Every `step_eval` has a non-null `failure_condition_id` and/or `constraint_id`
- Every `scenario_eval` has a non-null `scenario_id`
- Every referenced ID (F-n, C-n, S-n) exists in the intent.yaml
- No eval has both `failure_condition_id: null` and `constraint_id: null`

**Fail criteria:**
- An eval exists with no source ID
- An eval references an ID that doesn't exist in intent.yaml (e.g., F7 when intent only has F1-F6)

---

## V5: create-recipe Step 6a classifies all constraints

**What:** The new constraint classification sub-step assigns every constraint to exactly one category.

**Setup:** Run create-recipe compilation against discover-product (11 constraints).

**Pass criteria:**
- Every constraint C1-C11 appears in the `constraint_classifications` list
- Each has exactly one category: `pre-flight`, `artifact-verifiable`, or `structural`
- No constraint is unclassified
- No constraint appears in more than one category
- Classification is reasonable: C1 (input validation) → pre-flight; C4 (delegate to agent) → structural; C7 (terminology) → artifact-verifiable

**Fail criteria:**
- A constraint is missing from the list
- A constraint has no category or multiple categories
- Obvious misclassification (e.g., C7 "Strategic Goals terminology" classified as structural)

---

## V6: Coverage matrix is complete — zero gaps

**What:** The compiled recipe includes a coverage matrix with every intent item mapped.

**Setup:** Run create-recipe compilation against discover-product. Inspect the coverage matrix in the evidence output.

**Pass criteria:**
- Coverage matrix has one row per intent item (all C-n, F-n, S-n)
- Every row has a non-empty "Covered By" column
- Pre-flight constraints map to pre-flight checks
- Structural constraints map to structural elements (agent boundary table, compilation rules)
- Artifact-verifiable constraints map to SE-n evals
- All failure conditions map to SE-n evals
- All scenarios map to SCE-n evals
- No row has "Covered By: none" or empty

**Fail criteria:**
- Any intent item has no coverage mapping
- Coverage matrix is missing from evidence output
- A pre-flight constraint is mapped to an eval (wrong category)
- A failure condition has no eval coverage

---

## V7: Compiled SKILL.md embeds evals at correct positions

**What:** The compiled recipe places evals immediately after the steps they validate.

**Setup:** Run create-recipe compilation against ship. Read the output SKILL.md.

**Pass criteria:**
- Step evals appear immediately after the step they reference (e.g., evals for merge-pr's skill appear after Step 2)
- Scenario evals appear in the Scenario Validation phase
- Eval text is verbatim from evals.yaml — no reformulation in the compiled output
- Eval format matches: `**SE-X (F-n/C-n):** {check}`

**Fail criteria:**
- Evals appear in wrong positions (e.g., Step 1 eval after Step 3)
- Eval text differs from evals.yaml (compiler reformulated)
- Evals are missing from the compiled output despite being in evals.yaml

---

## V8: Validation Gate 1 — discover-product rebake improves coverage

**What:** Rebaking discover-product with the new pipeline produces better evals than the current hand-authored ones.

**Setup:** Rebake discover-product. Diff generated evals vs current evals (9 step evals, 3 scenario evals).

**Pass criteria:**
- Generated evals cover all 11 constraints (currently 5+ are uncovered) — net coverage increase
- SE-3 now correctly maps to F2 (domain unresolvable) instead of testing persona count
- No generated eval is semantically weaker than the hand-authored version it replaces
- The diff evidence file is written to STM with old evals, new evals, and assessment

**Fail criteria:**
- Coverage decreases (fewer constraints covered than before)
- Any previously-covered failure condition loses its eval
- Generated evals are vague or untestable ("check that the artifact is good")
- SE-3 / F2 misalignment persists in generated output

---

## V9: Validation Gate 2 — commit-code rebake produces equivalent quality

**What:** Rebaking commit-code with the new pipeline produces evals of equal or better quality.

**Setup:** Rebake commit-code. Diff generated evals vs current hand-authored evals (8 step evals, 5 scenario evals).

**Pass criteria:**
- Every currently-covered failure condition still has eval coverage
- Generated evals are at least as specific as hand-authored ones
- No regression — no eval that was previously clear becomes vague
- Coverage matrix shows zero gaps
- The diff evidence file is written to STM

**Fail criteria:**
- A failure condition that had eval coverage loses it
- Generated evals are measurably less specific than hand-authored versions
- Coverage gaps appear that didn't exist before

---

## V10: Model upgrade to opus is applied

**What:** The evals-creator skill uses opus model for eval generation.

**Setup:** Read the modified evals-creator SKILL.md frontmatter.

**Pass criteria:**
- Frontmatter contains `model: opus` (not `sonnet`)
- When invoked during compilation, the skill runs on the opus model

**Fail criteria:**
- Frontmatter still says `model: sonnet` or model field is absent
- Skill runs on a non-opus model

---

## V11: Compilation halts on coverage gap

**What:** If evals-creator returns uncovered items, compilation does not silently proceed.

**Setup:** Simulate by providing an intent with a constraint that evals-creator cannot generate an eval for (e.g., a highly abstract structural constraint misclassified as artifact-verifiable).

**Pass criteria:**
- The compiler detects the uncovered item from the coverage summary
- Compilation halts with an error identifying the uncovered constraint/failure-condition
- No SKILL.md is written with incomplete coverage

**Fail criteria:**
- Compilation succeeds silently despite uncovered items
- SKILL.md is written with gaps in the coverage matrix
- Error message doesn't identify which item is uncovered
