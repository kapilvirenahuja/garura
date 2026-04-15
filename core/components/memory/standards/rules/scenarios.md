# Scenario Rules

Canonical rules governing verification scenarios — success and failure — across intent epics, flows, and test specs. Every skill that authors or validates scenarios loads this file.

Consumers: `generate-intent-epics`, `validate-intent-epics`, `map-user-flows`, `test-engineer`.

## Rule 1: Given / When / Then Format

**Every scenario uses the given/when/then structure explicitly.**

- `given` — the precondition / context the actor is in
- `when` — the action the actor takes (or event that occurs)
- `then` — the observable outcome

A scenario missing any of the three is invalid. Paraphrases ("the user tries to log in and it works") are rejected — the format is mandatory because it forces the author to separate precondition from action from outcome.

**Enforcement:** `validate-intent-epics` schema check on `success_scenarios[]` and `failure_scenarios[]`.

## Rule 2: Binary Testable Outcomes

**Every `then` clause is something a reviewer can observe and call pass or fail without debate.**

Correct: "then they see their profile dashboard within 2 seconds"
Incorrect: "then the login experience is smooth"

Forbidden words in `then` clauses (automatic fail):
- `should`
- `smooth`
- `intuitive`
- `seamless`
- `better`
- `improved` (without a measurement)
- `fast` (without a number)
- `user-friendly`

These words describe feelings, not observable outcomes. A reviewer can never point at a screen and say "this is seamless" with confidence — which means it can't be verified, which means the scenario doesn't work.

**Enforcement:** `validate-intent-epics` check category `should_language`. Grep every `then` clause for the blacklist and fail on match.

## Rule 3: Success Scenarios Carry Evidence

**Every success scenario declares the `evidence` sub-field — the quantified signal that proves the outcome happened.**

Evidence examples:
- "p95 latency < 500ms measured via OTel span `login.complete`"
- "90% of users complete signup within 60 seconds (funnel analytics event `signup.submit`)"
- "Stripe webhook `payment.succeeded` received within 5s of checkout submit"

Evidence without a measurement method is weak. The field is not optional.

**Enforcement:** `validate-intent-epics` requires non-empty `evidence` on every success scenario entry.

## Rule 4: Failure Scenarios Carry Impact AND Mitigation

**Every failure scenario declares three sub-fields: `scenario`, `impact`, and `mitigation`.**

- `scenario` — what goes wrong, in given/when/then form
- `impact` — who is hurt and how (user, business, compliance)
- `mitigation` — how the epic / architecture / code addresses the failure mode

A failure scenario without a mitigation is a defect, not a scenario. The validator rejects missing or empty mitigations.

**Enforcement:** `validate-intent-epics` requires all three sub-fields non-empty.

## Rule 5: Minimum Count Per Epic

**Every intent epic has ≥2 success scenarios AND ≥2 failure scenarios.**

One scenario per category is too few to cover the realistic space. Two forces the author to think about variation — different personas, different pre-conditions, different error modes.

Architects and testers downstream rely on this minimum to generate meaningful test suites. An epic with 1 failure scenario produces a test suite with 1 negative case — inadequate for anything beyond a POC.

**Enforcement:** `validate-intent-epics` check category `scenario_count_below_min`.

## Rule 6: Happy Path Is Not Enough

**An epic with N success scenarios and 0 failure scenarios is a failure.**

Happy-path-only thinking is the leading cause of production surprises. The enforcement of Rule 5 (minimum 2 failure scenarios) exists specifically because teams under time pressure skip failure thinking. The rule is non-negotiable.

Common failure categories to cover:
- Input validation (invalid / missing / malformed data)
- Authentication / authorization (wrong user, expired session, missing permission)
- External dependency (third-party API down, rate limited, schema changed)
- Concurrency (two users editing same record, double-submit, race)
- Data state (record not found, stale cache, partial migration)

An epic covering a payment flow with no concurrency scenario is incomplete. An epic covering a data write with no partial-failure scenario is incomplete.

## Rule 7: Flow Scenarios Reference Epic Scenarios

**Every flow file in `design-exp` output declares a frontmatter `source_scenario: <epic-id>:<scenario-id>` referencing the intent-epic scenario it implements.**

A flow without a source_scenario is orphaned — no one knows why it exists. The `map-user-flows` skill must not produce flows without this reference. The cross-check validator must fail any flow missing it.

Every success_scenario AND failure_scenario across all epics must be referenced by at least one flow. Uncovered scenarios produce a coverage gap.

**Enforcement:** `map-user-flows` validator — `success_scenarios_with_flow == success_scenarios_total` and `failure_scenarios_with_recovery == failure_scenarios_total`.

## Related Rules

- `epics.md` — Rule 5 (success verifiability) repeats the should-language check for clarity
- `features.md` — Rule 4 (scenarios mirror each other) repeats the minimum count for clarity
- `design.md` — Rule 5 (flows trace to scenarios) depends on this format
