# Coverage Matrix — /decode Compile

## Pre-flight Constraints (5/5 covered in pre-flight table)

| ID | Coverage | Location |
|----|----------|----------|
| C0 | Issue resolution | Pre-flight row: `Resolve issue number per C0` |
| C1 | Feature selector mandatory | Pre-flight row: `Confirm at least one feature selector supplied` |
| C2 | features.yaml resolvable | Pre-flight row: `Resolve features.yaml per C2 order` |
| C26 | TEST_HARNESS detection | Pre-flight row: `Detect TEST_HARNESS (framework + runner command + runnability)` |
| C30 | Tech playbook presence | Pre-flight row: `Verify every detected stack has a playbook...` |

## Structural Constraints (16/16 covered by play structure)

| ID | Coverage | Location |
|----|----------|----------|
| C3 | Write-boundary | Pre-flight + STM path structure; Role forbidden list |
| C13 | tech-architect single extraction owner | Agent boundary table |
| C14 | test-engineer scope | Agent boundary table |
| C15 | test-runner isolation | Agent boundary table + Step 18 critical discipline note |
| C17 | Two-phase checkpoint | Steps 20, 21 |
| C18 | Non-blocking evidence commit | Step 23 note |
| C19 | Decision surfacing discipline | Step 20 description |
| C20 | proposals.yaml fields | Step 19 + aggregate-decode-proposals skill contract |
| C21 | LTM Resolution Protocol | Every JSON contract's ltm_context block |
| C22 | Per-unit resumability | Pause and Resume section + status file schema |
| C23 | Tests hard requirement | Steps 15–18 are non-conditional; no --with-tests flag |
| C27 | Scenario coverage metric | aggregate-decode-proposals records baseline_green per scenario |
| C28 | Tech-agnostic play | Role section: play compiles no tech-specific skills |
| C29 | Runtime tech-skill synthesis | Phase: Scan & Detection — Step 6 |
| C31 | Temp skills location | Step 6 output path + cleanup step |
| C32 | Cleanup trigger | Step 22 |

## Artifact-verifiable Constraints (17/17 covered by step evals)

| ID | Step Eval(s) |
|----|--------------|
| C4 | SE-28 |
| C4a | SE-29 |
| C4b | SE-30 |
| C4c | SE-31 |
| C4d | SE-16 |
| C5 | SE-5, SE-6, SE-7 (three streams) |
| C6 | SE-8 |
| C7 | SE-32 |
| C8 | SE-10 |
| C9 | SE-9 |
| C10 | SE-22 |
| C11 | SE-33 |
| C12 | SE-34 |
| C16 | SE-35 |
| C24 | SE-36, SE-37, SE-38 (one per tier) |
| C25 | SE-13 |
| C33 | SE-39 |

## Failure Conditions (25/25 covered by step evals)

| ID | Step Eval(s) |
|----|--------------|
| F0 | SE-1 |
| F1 | SE-2 |
| F2 | SE-3 |
| F3 | SE-4 |
| F4 | SE-5, SE-6, SE-7 |
| F5 | SE-8 |
| F6 | SE-9 |
| F7 | SE-10 |
| F8 | SE-11 |
| F9 | SE-12 |
| F10 | SE-13 |
| F11 | SE-14 |
| F12 | SE-15 |
| F13 | SE-16 |
| F14 | SE-17 |
| F15 | SE-18 |
| F16 | SE-19 |
| F17 | SE-20 |
| F18 | SE-21 |
| F19 | SE-22 |
| F20 | SE-23 |
| F21 | SE-24 |
| F22 | SE-25 |
| F23 | SE-26 |
| F24 | SE-27 |

## Scenarios (11/11 covered by scenario evals)

| ID | Scenario Eval |
|----|---------------|
| S1  | SCE-1 |
| S2  | SCE-2 |
| S3  | SCE-3 |
| S4  | SCE-4 |
| S5  | SCE-5 |
| S6  | SCE-6 |
| S7  | SCE-7 |
| S8  | SCE-8 |
| S9  | SCE-9 |
| S10 | SCE-10 |
| S11 | SCE-11 |

## Verdict

- **38/38 constraints covered** — 5 pre-flight + 16 structural + 17 artifact-verifiable.
- **25/25 failure conditions covered** by step evals.
- **11/11 scenarios covered** by scenario evals.
- **39 step evals + 11 scenario evals = 50 total evals.**
- **Required sections** in compiled SKILL.md: Frontmatter ✓, Header ✓, Compiled From ✓, Role + Agent Boundaries ✓, Pre-flight ✓, Task DAG ✓, Workflow ✓, Scenario Validation ✓, Evidence & Close ✓, Pause and Resume ✓, Compilation Metadata ✓.
- **Intent hash drift:** none (compiled in this run; hash matches current intent.yaml).
- **Coverage status:** **PASS** — ready to ship.
