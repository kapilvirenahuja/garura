| Field | Value |
|-------|-------|
| **Type** | enhancement |
| **Reported From** | review of `/specify` → `generate-intent-epics` against the ICE model |
| **Date** | 2026-05-27 |

### Problem

The framework's play layer has fully migrated to the ICE model (Intent = clean triple of goal + constraints + failure conditions; Expectation = a separate file with success scenarios + recovery; Context = tech, design, standards). The product layer has not. The skill `core/components/skills/generate-intent-epics/SKILL.md` and its schema `core/components/memory/standards/schemas/intent-epic.yaml` still bundle everything — problem statement, intent, boundaries, success scenarios, failure scenarios, NFR constraints, business rules, hypothesis, dependencies, mocks — into a single epic artifact. This is the same shape ICE just removed at the play layer. The product layer should follow the same split so the two layers talk the same language.

A second alignment gap: today the epic schema and the skill assume one `intent` field per epic (one end-state sentence). In practice, a real epic often carries more than one user-observable outcome that hangs together as one vertical slice. The product layer should allow multiple intents inside a single epic, not force a 1:1 split that fragments the slice.

### Specific Issues

1. **Scenarios live inside the intent file.** `generate-intent-epics` writes `success_scenarios` and `failure_scenarios` directly into the epic, in the same pass as the intent. ICE requires those to live in a separate expectation artifact, generated from the intent and vetted at a human checkpoint. There is no expectation file, no vetted.status, no Tether.

2. **No recovery bucket.** ICE pairs each failure condition with exactly one recovery entry routed autonomous or human. The epic schema has `failure_scenarios[].mitigation` — a loose sentence inside the outcome, not a directional handoff plan with a routing call. The 1:1 failure-to-recovery rule is absent.

3. **"Intent" is overloaded.** At the play layer, `intent` is a triple. At the epic layer, `intent` is a single end-state sentence (one field). Same word, two shapes. Razor 5 (Naming clarity) — fix the overload.

4. **"Constraints" is overloaded.** Play constraints bound the goal (what the work must respect). Epic `constraints` are NFR slots — performance, security, accessibility, compliance. Different concept, same label.

5. **Failure language doesn't match.** Plays use "failure conditions" (catch-net, paired with recovery). Epics use "failure_scenarios" (impact + mitigation). A reader cannot reason about epic failures the same way they reason about play failures.

6. **No expectation-crafter equivalent at the product layer.** Plays have `expectation-crafter` + `draft-play-expectation` to generate the expectation from the intent and stop at a Tether. The epic layer has no analogue — the skill writes intent and outcomes in one pass with no separation and no vetting checkpoint.

7. **Schema is single-file.** No `intent-epic.yaml` (triple) + `epic-expectation.yaml` (success_scenarios + recovery) split. Compare with the play-layer split that was just shipped.

8. **One intent per epic is too rigid.** An epic representing one vertical slice may legitimately carry more than one user-observable outcome (e.g., "user can register" and "user can log in" both belong to the same auth slice). The schema and the skill currently assume one `intent` field; this forces over-fragmentation. The schema should allow `intents: [...]` (a list), and the skill should populate accordingly. Rules in `epics.md` (vertical slice, actor test, observable outcome) must apply to every intent in the list, not to a single field.

### Expected Behavior

The fix lands in two places, in this order.

a) **Fix the schema.** `core/components/memory/standards/schemas/intent-epic.yaml` is split into two artifacts that match the play-layer ICE pattern:

- `intent-epic.yaml` — the clean triple, lifted to the product layer: `intents` (list of goal sentences passing the actor + observable-outcome tests), `constraints` (renamed or re-scoped so it does not collide with NFR slots), `failure_conditions` (catch-net, replacing the current `failure_scenarios`). Plus identity, boundaries (`in_scope`, `anti_goals`, `must_not_break`, `cross_cutting_justification`), business rules, KB traceability, dependencies (`depends_on`, `foundation_investment`), mock tracking. NFR-style fields (performance, security, accessibility, compliance) need a clear home — either renamed (e.g., `nfr` block) or moved out to keep the "constraints" term unambiguous.
- `epic-expectation.yaml` — `success_scenarios` (binary-testable, one per intent at minimum) and `recovery` (one entry per failure condition, with `handoff: autonomous | human`). Carries `vetted.status` so it can be gated at a Tether.

b) **Fix the skill.** `core/components/skills/generate-intent-epics/SKILL.md` is rewritten to produce the intent file only. A new skill (mirroring `draft-play-expectation`) generates the epic expectation from the intent at runtime, and a crafter agent (mirroring `expectation-crafter`) drives the Tether. The `/specify` play wires these together. Validators (`validate-intent-epics`, `epics.md` rules) are updated to read from both files and to enforce the rules per-intent in the new list-shaped `intents` field.

The acceptance test: after the fix, an epic produced by `/specify` carries an intent triple in one file and a vetted expectation in another, exactly matching the shape of a play. An epic that bundles three related vertical outcomes (e.g., register + log in + view profile) lives in one epic with `intents: [...]` of three, each passing the actor and observable-outcome tests.

### Impact

This is the open product-layer ICE migration noted in `project_ice_refactor.md` ("OPEN DECISION (separate, larger initiative): whether ICE applies to the PRODUCT layer (intent-epic schema, generate-intent-epics, specify→design→arch). Not needed to migrate framework plays."). Without it, the product layer and the play layer speak different dialects of the same model — and the multi-intent rigidity will keep forcing reviewers to over-split slices that belong together.
