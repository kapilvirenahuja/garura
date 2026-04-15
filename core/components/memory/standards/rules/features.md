# Feature Rules

Canonical rules governing the content of intent epics — the WHAT/WHY layer of a feature. Every skill that generates or validates epic content loads this file.

Consumers: `generate-intent-epics`, `validate-intent-epics`, `feature-steward`.

## Rule 1: Mandatory Fields Are Non-Empty

**Every intent epic must carry every field from `intent-epic-schema.yaml`.**

No empty strings. No null. No `TBD` / `unclear` / `???` / `to be determined`. Every mandatory field must hold substantive content or a RESOLVED-audited placeholder.

Required fields:
- `id`, `domain`, `capability`
- `problem_statement` (≥80 chars, specific)
- `intent` (≥20 chars, contains a measurable word or number)
- `appetite` (matches `/\d+\s*(week|day|month)s?/`)
- `in_scope` (≥1 entry, each ≥15 chars)
- `anti_goals` (≥1 entry)
- `must_not_break` (required; "None — foundational epic" is acceptable for foundation work)
- `success_scenarios` (≥2 entries; each with `scenario` and `evidence`)
- `failure_scenarios` (≥2 entries; each with `scenario`, `impact`, `mitigation`)
- `constraints` (performance, security, accessibility, compliance — all quantified)
- `business_rules` (≥1 entry)
- `hypothesis` (contains "We believe that", "result in", "We will know this is true when")
- `assumptions_requiring_validation` (≥1 entry)
- `dependencies` (may be empty list; key must be present)
- `depends_on` (may be empty list; key must be present)
- `foundation_investment` (boolean)
- `kb_source.capability`, `kb_source.rules_applied`

**Enforcement:** `validate-intent-epics` check category `missing_field` — any zero-count exits with status `failed`.

## Rule 2: Constraints Are Quantified

**Every entry in `constraints` must contain a number, a named standard, or a specific regulation.**

Vague constraint values ("fast", "secure", "reliable") collapse the contract. The validator enforces quantification by regex:

| Field | Regex / Match |
|-------|---------------|
| `performance` | Must contain `\d+\s*(ms\|s\|rps\|%\|qps\|MB\|GB\|ops)` (case insensitive) |
| `security` | Must name a standard: `OWASP`, `NIST`, `PCI-DSS`, `SOC2`, `ISO 27001`, `bcrypt`, `argon2`, `SAML`, `OAuth2`, `AES-256`, `TLS 1.2/1.3`, `FIDO2`, `WebAuthn` |
| `accessibility` | Must match `WCAG\s*\d+(\.\d+)?\s*(A\|AA\|AAA)` |
| `compliance` | List; each entry names a regulation (`GDPR`, `HIPAA`, `PCI-DSS`, `SOC2`, `CCPA`, `SOX`, `ISO 27001`, `FERPA`, `GLBA`, etc.) OR list may be empty |

**Enforcement:** `validate-intent-epics` check category `unquantified_constraint`.

## Rule 3: Hypothesis Uses Commander's Intent Format

**Every hypothesis must explicitly declare what is being tested, for whom, and how success will be measured.**

Required format: "We believe that {action} for {persona} will result in {outcome}. We will know this is true when {measurable signal}."

All three phrases — "We believe that", "result in", "We will know this is true when" — must appear in the field. Paraphrases fail the check.

**Enforcement:** `validate-intent-epics` check category `hypothesis_format`.

## Rule 4: Success and Failure Scenarios Mirror Each Other

**Every epic must have ≥2 success_scenarios AND ≥2 failure_scenarios.**

Success scenarios describe the happy path with quantified evidence. Failure scenarios describe the unhappy path with impact and mitigation. An epic with 5 success scenarios and 0 failure scenarios is a validation failure — happy-path-only thinking is the leading cause of production surprises.

Success-scenario sub-fields: `scenario`, `evidence` (the quantified signal).
Failure-scenario sub-fields: `scenario`, `impact`, `mitigation`.

**Enforcement:** `validate-intent-epics` check category `scenario_count_below_min`.

## Rule 5: KB Traceability Is Exact

**Every epic's `kb_source.capability` must equal its top-level `capability` field AND resolve to a real feature block in the referenced domain file.**

The validator loads every domain file — both LTM (`core/components/memory/knowledge/domain/*.md`) and STM research (`{product_base}/research/*.md`) — and extracts every feature ID. Any epic whose `kb_source.capability` does not match a loaded feature ID is a dangling reference and fails.

Epics whose source lives in STM research carry `kb_source.provisional: true`. The validator allows this flag and still requires the ID to resolve against the STM source.

**Enforcement:** `validate-intent-epics` check category `dangling_kb_source`.

## Rule 6: Problem Statements Carry Evidence

**Every `problem_statement` must be specific enough to cite.**

Not: "Users need better login."
Yes: "Enterprise customers average 14 days to first value because onboarding requires 23 manual configuration steps (source: market brief)."

The validator checks length (≥80 characters) as a proxy for specificity. A one-liner problem statement is almost always too vague to drive architectural decisions downstream.

**Enforcement:** `validate-intent-epics` length check on `problem_statement`.

## Rule 7: Intent Uses Measurable End-States

**The `intent` field is a one-sentence Commander's Intent with a target number.**

Not: "Improve the login experience."
Yes: "Reduce enterprise time-to-first-value from 14 days to 5 days."

The intent must contain a measurable word (number, percentage, time unit, count) so that the end-state is verifiable. Without a number, every downstream review becomes subjective.

**Enforcement:** `validate-intent-epics` regex on `intent` requiring `\d` or a measurable word.

## Rule 8: Provenance Tracking

**Every capability and every epic field must carry a provenance tag that identifies its source.**

The pipeline takes inputs from three very different places: (a) the user's brief (authoritative), (b) the project profile (user-provided during pre-flight), (c) the KB catalog (curated but generic). Without tracking which field came from which source, reviewers cannot tell what the user asked for versus what the pipeline inferred. Inferences that look like facts lead to hallucination.

**Required per capability:**
```yaml
provenance:
  source: brief_explicit | brief_inferred | rule_derived | research_supplemental | profile_default | assumption
  source_quote: "<verbatim brief text, or 'none' if source != brief_*>"
  confidence: high | medium | low
```

| Source | Meaning | Confidence | Goes into |
|--------|---------|------------|-----------|
| `brief_explicit` | The brief directly names this capability or says it's needed | high | scope body as fact |
| `brief_inferred` | The brief implies this capability via concrete language but does not name it (e.g., "users store API keys" → secrets vault) | medium | scope body + surfaced at checkpoint |
| `rule_derived` | Cross-tree constraint fired (e.g., CTC-004 B2C → social login) | high | scope body + rule citation |
| `research_supplemental` | Authored by a within-domain research pass (Rule 10) | medium | scope body + surfaced at checkpoint |
| `profile_default` | Derived from a project profile field (e.g., nfr_security >= 3 → argon2id) | high | scope body + profile field citation |
| `assumption` | Pipeline had no source — this is a guess | **low** | `assumptions_requiring_validation` + surfaced for user grounding; NEVER silent in the scope body |

**Enforcement:** `validate-intent-epics` check category `missing_provenance` — every capability and every epic field lacking a `provenance` block fails. `unconfirmed_inference` — any capability tagged `assumption` that appears in the scope body (not in `assumptions_requiring_validation`) fails.

## Rule 9: Constraint Justification

**Every quantified constraint must cite its source — the user's brief, the project profile, a named KB default, or an explicit assumption.**

A numeric constraint without a source is a hallucination dressed up as a fact. Boilerplate-grade numbers pulled from KB Success Criteria sections (e.g., "p95 login < 500ms at 10K concurrent sessions") are not facts unless the current product's profile justifies them. On a solo-founder `nfr_scale=2` product, 10K concurrent is a fabrication no matter how clean the language looks.

**Required per constraint entry:**
```yaml
constraints:
  performance:
    value: "p95 login < 500ms at ??? concurrent sessions"
    source_for_quantification:
      source: brief | profile_nfr | kb_default | assumption
      source_reference: "<brief quote OR profile.nfr_scale=2 OR kb.user-management.UM-F001.success_criteria[0] OR 'needs user grounding'>"
```

Values tagged `kb_default` or `assumption` are **surfaced at the capability-configuration checkpoint** for user confirmation. They cannot proceed to intent epic generation without explicit user grounding (Tether = "yes, this number is in scope", Orbit = "use this value instead", Vanish = "drop this constraint").

**Profile-mismatch detection:** the validator cross-checks numeric constraints against the profile. Example failures:
- `nfr_scale=2` (low-to-mid) but constraint targets `10K concurrent sessions` → flags `profile_scale_mismatch`
- `team_size=solo` but constraint targets `99.999% uptime` → flags `profile_team_mismatch`
- `nfr_compliance=1` (none) but constraint names HIPAA controls → flags `profile_compliance_mismatch`

**Enforcement:** `validate-intent-epics` check categories `unsourced_constraint` (no source block) and `profile_mismatch` (numeric value contradicts profile field). Both are blocking.

## Related Rules

- `epics.md` — epic structure (vertical slice with the Rule 1 actor + outcome tests, single module, dependencies, foundation)
- `scenarios.md` — success / failure scenario format and language
- `product.md` — KB-grounded selection, Rule 11 inference surfacing
- `schemas/intent-epic.yaml` — the schema that carries `provenance` + `source_for_quantification` fields
