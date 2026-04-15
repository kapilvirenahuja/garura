# Deprecated Play Patterns — Capture for 214.5/214.6/214.7

This file captures valuable patterns from four plays deleted in Meridian OS 214.3 and 214.7:
- `discover-product` (deleted 214.3)
- `plan-roadmap` (deleted 214.3)
- `discover-product-opportunity` skill (deleted 214.3)
- `prepare-architecture` (deleted 214.7)

The new plays `specify-product`, `design-exp`, and `build-arch` consult this file
during intent crafting so field-tested patterns are not lost in the rewrite.

Source: extracted by 214.3 T12-T13 task. Reading scope was the four plays' intent.yaml
and SKILL.md plus the SKILL.md files of every skill they delegate substantive logic to
(draft-product-vision, validate-product-vision, scope-roadmap-epics, assess-feasibility,
draft-roadmap, validate-roadmap, draft-technical-approach, draft-quality-standards,
validate-architecture-design).

---

## From `discover-product`

### Pattern 1: Three-signal library/product type assessment with budget bifurcation

**Summary.** Before any agent dispatch, the play classifies the intent as type `product`
or type `library` based on three explicit signals, then changes both its workflow shape
and its agent budget accordingly. Library-type intents skip the entire opportunity
discovery step.

**Why it mattered.** Running market-context discovery on an internal SDK or microservice
produced fabricated competitors and TAM/SAM/SOM estimates (failure F8). Forcing the
classification upfront, before agent invocation, prevented fabricated market data and
saved 1 agent dispatch. The library path also raised the cycle-back budget from 1 to 2,
because library specs need more iteration on technical scope than market positioning.

**How it worked.**
The three signals (intent.yaml C12, evaluated by the play in Step 1):
1. The intent names **specific consumers** rather than market segments
2. The intent describes a **technical interface boundary** rather than a user problem
3. **No market-facing end users** are identifiable

If all three match → `product_type = "library"`, `skip_opportunity = true`. The play's
domain agent budget then becomes:
- Product: 3 base (discover + draft + validate) + 1 cycle-back = 5 max
- Library: 2 base (draft + validate) + 2 cycle-backs = 4 max

The type field is written into product.yaml itself and governs which validation
checklist applies (`validate-product-vision` skips `target_users_identified` and
`competitive_landscape_covered` for library type, lowers `assumptions_listed` from
≥3 to ≥1, and keeps strategic_goals threshold at ≥3).

**How to absorb.** `specify-product`. The new play must inherit both the three-signal
classifier and the type-conditional budget. The `validate-product-spec` (or whatever
replaces validate-product-vision) must keep type-aware checklists. The fabricated-data
failure (F8) must remain a hard halt — the new play should reproduce the constraint
"NEVER fabricate market data when type is library" in `draft-product-vision` (currently
captured at line 136 of that skill).

---

### Pattern 2: Pre-lock resolution gate with three branches and no accept-risk bypass

**Summary.** After validation runs, but before lock executes, the play scans the
artifact for THREE classes of unresolved item: (a) blocker-severity validation issues,
(b) warning-severity validation issues, and (c) placeholder field values. If any are
present, the user gets a structured RESOLVED-keyword interview that produces an audit
artifact. The blocker branch has NO bypass — RESOLVED or Vanish are the only exits.

**Why it mattered.** Without this gate, agents would lock product.yamls containing
literal "TBD", "unclear", "?", and "to be determined" string values that downstream
plays would then read as if they were specifications. The non-bypassable blocker
branch (C15 + F12) was the second key innovation: previous designs offered an
"accept risk and proceed" path, which became the default and silently let bad
artifacts into the locked corpus.

**How it worked.**
The play (Step 6) computes:
```
blockers      = [i for i in validation.issues if i.severity == "blocker"]
warnings      = [i for i in validation.issues if i.severity == "warning"]
placeholders  = scan_yaml_values(product, pattern=/\bTBD\b|unclear|to be determined|\?$/i)
unresolved    = blockers + warnings + placeholders
```

Three branches:
- **Branch A — Clean path.** `validation.ready_for_lock == true` AND `unresolved` empty.
  Auto-proceed. No user pause. No interview.
- **Branch B — Warnings or placeholders, no blockers.** Write checkpoint, present a
  resolution interview listing each warning and each placeholder field individually
  in numbered tables. User responds with `RESOLVED` followed by numbered answers, or
  `Vanish`. RESOLVED writes `pre-lock-resolutions.yaml` and proceeds to Step 7 (Lock)
  WITHOUT re-running validation — the user's resolution is the resolution.
- **Branch C — Blockers present (C15: hard block).** Write checkpoint. Present
  interview with explicit "Lock blocked" framing. RESOLVED writes resolutions YAML AND
  re-invokes the judge to re-validate; lock only proceeds if re-validation now reports
  `ready_for_lock: true` with no blockers. If still blockers, re-present (counts
  against C9 cycle-back limit). Vanish triggers cycle-back to Step 3 (re-draft).
  **No third option exists.** No "accept risk", no "proceed despite blockers".

The resolutions YAML schema:
```yaml
pre_lock_resolutions:
  slug: "{slug}"
  resolved_at: "{ISO-8601 timestamp}"
  items:
    - id: 1
      type: "blocker|warning|placeholder"
      item: "{issue message or field path}"
      resolution: "{user answer in their own words}"
```

**How to absorb.** `specify-product`. Carry forward all three branches. The placeholder
scanner regex `/\bTBD\b|unclear|to be determined|\?$/i` is field-tested and must not
be relaxed. The non-bypass property (C15, F12) must remain a hard constraint with an
eval — losing it is the kind of regression that takes months to detect. Branch B
(warning-only) is the most forgiving path: do NOT re-validate on warning RESOLVED,
because re-validation will keep flagging the same warning forever (warnings are by
definition non-blocking content gaps that the user has just acknowledged). Branch C
MUST re-validate.

This pattern is **cross-cutting** — see plan-roadmap Pattern 3 and prepare-architecture
Pattern 6 for the same gate with different trigger sources.

---

### Pattern 3: Three-axis profile derivation cascade (PP → NFR → QP)

**Summary.** During vision drafting, the play (via the `draft-product-vision` skill)
derives all three project profiles in a strict sequential cascade — Product Profile
first, then NFR Profile defaulted from PP, then Quality Profile defaulted from PP+NFR.
The user does not author profiles; the agent derives initial values from the BRD/intent
and presents them as adjustable knobs. Profile dimensions are read from canonical LTM
files; the agent is forbidden from inventing dimensions.

**Why it mattered.** This is the single most load-bearing pattern in the entire IDSD
pipeline. Profiles characterize WHAT KIND of project this is across 21 dimensions
(7 PP, 7 NFR, 7 QP), and every downstream play (plan-roadmap, prepare-architecture,
prepare-implementation, implement-epic) reads them. Without the profiles section,
prepare-architecture cannot derive concrete NFR requirements (Pattern 4 in that
section), draft-quality-standards cannot map QP levels to tooling, and
scope-roadmap-epics cannot calibrate epic depth. The "knobs not questions" framing
is what makes profile derivation usable — asking a user "what is your NFR-3 level?"
gets blank stares; presenting "I think your performance level is 3 because of the
following intent text" lets the user say "no, it's 4" in seconds.

**How it worked.**
The cascade lives in `draft-product-vision/SKILL.md` Step 5, called from the play
in Step 3. Inputs:
- `profile_knowledge_path` — the LTM directory `~/.meridian/core/memory/knowledge/product/`
- The BRD/intent text
- (For NFR) PP values just derived
- (For QP) PP and NFR values just derived

Cascade steps:
1. **PP-1 .. PP-7 from BRD/intent.** Each dimension gets a level (1-5) and a rationale
   string. Mappings: PP-1 from target_users sophistication, PP-2 from UX ambition,
   PP-3 from persona count and diversity, PP-4 from geography signals, PP-5 from
   integration mentions, PP-6 from explicit MVP/POC/enterprise signals, PP-7 from
   industry/domain signals.
2. **NFR-1 .. NFR-7 defaulted from PP.** The agent reads `nfr-profile.md` AND the
   "NFR Guidance" section in `product-profile.md`, applies guidance-table defaults
   (e.g., PP-7 ≥ 4 → NFR-5 ≥ 3), THEN refines based on explicit NFR signals in the
   BRD ("99.99% uptime" → NFR-4 = 4). Each dimension records a rationale referencing
   PP-derived reasoning.
3. **QP-1 .. QP-7 defaulted from PP+NFR.** The agent reads `quality-profile.md` and
   its "PP+NFR Guidance" section, applies defaults (e.g., PP-6 ≥ 3 → QP-1 ≥ 3,
   NFR-2 ≥ 4 → QP-7 ≥ 4), then refines for explicit signals ("WCAG AA" → QP-6 = 3).
   Each dimension records a rationale referencing PP/NFR-derived reasoning.

The play (Step 3b) then **presents all 21 dimensions** in three ordered tables to
the user with `dimension | level | label | rationale` columns and accepts adjustments
in the format `PP-1=4, NFR-3=2, QP-5=3`. Adjustments are written back to product.yaml
BEFORE the vision review checkpoint, so the user is reviewing the final adjusted
profiles, not the raw derived ones.

**Critical eval (SE-17, derived from F14):** Profile dimension keys must match the
canonical set EXACTLY:
- PP: `pp1_user_sophistication, pp2_ux_maturity, pp3_persona_complexity, pp4_geographic_scope, pp5_integration_density, pp6_delivery_ambition, pp7_industry_vertical`
- NFR: `nfr1_risk, nfr2_security, nfr3_performance, nfr4_availability, nfr5_compliance, nfr6_scalability, nfr7_data_sensitivity`
- QP: `qp1_testing_depth, qp2_code_quality, qp3_documentation, qp4_ci_cd_maturity, qp5_observability, qp6_accessibility, qp7_security_testing`

If the agent invents dimensions or skips reading LTM, F14 fires.

**Library type note.** Profiles are still derived for libraries, but PP-6 (Delivery
Ambition) drives the cascade hard: a library at PP-6 = 1 (POC) defaults all NFR and
QP to 1.

**How to absorb.** `specify-product`. This pattern MUST be preserved end-to-end:
- The cascade order is non-negotiable — it's what makes "knobs not questions" work
- LTM dimension definitions are the source of truth — the new spec play MUST read
  them and the agent MUST be forbidden from inventing dimensions
- The 21 dimensions must remain canonical (changing them is a breaking change for
  every downstream play)
- The user-validation step (presentation as adjustable tables) must happen BEFORE
  the spec-review checkpoint, not as a separate pause
- The `DIM=level` adjustment grammar is field-tested — keep it
- Every dimension MUST carry a `rationale` field at lock time (F13 will fire otherwise)

Consider extracting the cascade into a stand-alone skill (`derive-project-profiles`)
that `specify-product` calls and that other plays can also invoke if needed.

---

### Pattern 4: Source-fidelity preservation with `decision_points` for conflicts

**Summary.** When the source document (BRD, PRD, user intent) explicitly defers,
excludes, or marks a capability as out-of-scope for the current phase, the drafting
agent MUST place it in `scope.out_of_scope` and is forbidden from reinterpreting it
as in-scope. When the agent's own reasoning (risk-based, UX-based, strategic) would
change a source requirement, the conflict is recorded as a `decision_point` for
explicit user resolution rather than applied silently.

**Why it mattered.** Agents tend to "improve" source documents — converting "mandatory
auto-recording" into "optional with consent" because they think it's safer, dropping
capabilities they don't understand, or merging deferred items into the main scope
because the deferral seemed soft. This silently mutates the user's expressed intent.
The decision_points pattern surfaces every such mutation as an explicit user choice.

**How it worked.**
Two complementary constraints (C18 + C19) and two failure conditions (F15 + F16):
- **C18 (deferral fidelity):** Capabilities the source defers/excludes go to
  `scope.out_of_scope`. Ambiguous deferral status is surfaced as a `decision_point`,
  not silently resolved.
- **C19 (conflict surfacing):** Risk-based, UX-based, or strategic reasoning that
  would change a requirement must be recorded as a `decision_point` rather than
  applied silently.

The `decision_points` schema embedded in product.yaml:
```yaml
decision_points:
  - id: dp1
    field: "{which product.yaml field this decision affects}"
    original_requirement: "{verbatim from the source document}"
    proposed_alternative: "{the agent's proposed change}"
    rationale: "{the agent's reasoning for proposing the change}"
    resolution: null  # set by user at vision review checkpoint
```

At the vision review checkpoint (Step 4), the user reads product.yaml directly,
sees each decision_point, and resolves it. The play does not auto-apply any
decision_point; the user's choice becomes the artifact.

**Evals (SE-19, SE-20):** The judge's reverse-coverage check (Step 3a) cross-references
every capability in the source against the artifact and flags `dropped`, `partial`,
`drifted`, and silent overrides as failures.

**How to absorb.** `specify-product`. This is the discipline that makes IDSD-driven
specs trustworthy. The `decision_points` schema (`field`, `original_requirement`,
`proposed_alternative`, `rationale`) is minimal but load-bearing — keep it. The
new play must:
- Forbid silent reinterpretation of source-document scope
- Forbid silent override of source requirements with agent reasoning
- Record every conflict as a decision_point with verbatim original text
- Present decision_points at the spec-review checkpoint
- Not auto-resolve decision_points

The reverse-coverage check that detects silent overrides should be carried over as
a context-isolated judge call (see Pattern 7 below).

---

### Pattern 5: Vision locking lifecycle with hard re-discovery block

**Summary.** product.yaml has a status field that transitions DRAFT → VALIDATED → LOCKED.
LOCKED is sticky — the play is forbidden from re-discovering an already-LOCKED product.
There is no "unlock" command; the user must manually drop status back to DRAFT to
re-enter the play.

**Why it mattered.** This protects locked artifacts from accidental overwrite by a
second invocation. It also makes "LOCKED" mean something downstream — every other
play in the pipeline can read product.yaml and trust that the content will not change
mid-flight.

**How it worked.**
- Pre-flight check: if `.meridian/product/discovery/product.yaml` exists with
  `status == LOCKED`, hard-halt with F7. Re-discovery is not permitted.
- Lock step (Step 7): reads product.yaml, sets `status: LOCKED`, updates
  `updated_at` timestamp, writes the file. No agent call. No human approval at
  this step (approval already happened at the pre-lock gate).
- Manual unlock: not provided by the play. The user must edit product.yaml directly
  to set status back to DRAFT before re-running.

**How to absorb.** `specify-product`. Keep the hard re-discovery block. Keep manual
unlock as the only path back to DRAFT — having a play-driven unlock would defeat
the protection. The lock step itself is trivial (read, mutate status, write) and
should NOT be delegated to an agent — orchestrator owns it.

---

### Pattern 6: Reverse-coverage check (context-isolated judge)

**Summary.** After the artifact is drafted but before the user sees it, a separate
judge agent receives ONLY the input (problem_statement) and the output (product.yaml),
and verifies that every facet of the input is reflected in the output. The judge has
no access to drafting context, market research, or any intermediate reasoning from
the drafting agent. Status values: covered, partial, dropped, drifted.

**Why it mattered.** Drafting agents drop facets — they latch onto a few salient
features and forget the rest. The drafting agent itself cannot detect this because
it doesn't remember what it dropped. A context-isolated judge with only input/output
in its context window catches these drops before the user wastes time reviewing a
half-built spec.

**How it worked.**
Step 3a contract (the entire prompt to the judge):
```json
{
  "intent_path": "...",
  "stm_base": ".meridian/product/",
  "mode": "check-input-output-coverage",
  "artifact_paths": {
    "input_path":  "{problem_statement source or product.yaml input section}",
    "output_path": "{product.yaml}"
  },
  "check_type": "problem-to-vision",
  "config": {
    "problem_statement": "{original intent text from pre-flight}",
    "market_context_path": "{if Step 2 ran, else null}"
  },
  "stm": {
    "output": { "coverage_check_path": "{...}/coverage-check.yaml" }
  },
  "task_id": "check-coverage"
}
```

Notice what is **NOT** in the prompt: drafting notes from product-strategist, the
LTM files consulted, the iteration history, market research transcripts, agent
reasoning traces. The judge has only `problem_statement` and `product.yaml`.

The judge extracts facets (target users, risks, differentiators, problem dimensions)
from the input and verifies each one against the output. Per-facet status:
- `covered` — strategic goal, value proposition, or scope element traces to this facet
- `partial` — facet acknowledged but not reflected in goals or metrics
- `dropped` — input facet has no representation in the output
- `drifted` — output contains content that doesn't trace to any input facet

**On dropped facets.** Logged in evidence and flagged at the next checkpoint, but
NOT a hard halt — the user gets to see the drop and decide whether to re-draft or
proceed. The judge cannot decide unilaterally that a drop is fatal.

**How to absorb.** `specify-product` (and applicable to all three new plays — context
isolation is cross-cutting). The contract template is reusable across plays — only
`check_type`, `input_path`, and `output_path` change. Consider extracting into a
shared skill `check-input-output-coverage` that all three new plays invoke. The
"flag, don't halt" semantics on dropped facets is field-tested — drops are
sometimes intentional, and the user must adjudicate.

---

### Pattern 7: Two-pause checkpoint structure with audit trail before the prompt

**Summary.** The play has at most two user-facing pauses: vision review (Step 4) and
pre-lock resolution (Step 6). Before EACH pause, a checkpoint .md artifact is written
to STM with `Status: PENDING_APPROVAL`. This artifact must exist BEFORE the user is
prompted, providing an audit trail that the play tried to gate even if the user
abandons the session.

**Why it mattered.** Without the pre-prompt write, "pause for approval" leaves no
trace if the user doesn't respond — there's no record that the play offered a
checkpoint. Writing the artifact first creates the audit row, then the prompt is
just a UI-level message that resolves the artifact's status.

**How it worked.**
Status lifecycle of each checkpoint .md:
- Created with `status: PENDING_APPROVAL` BEFORE the user prompt
- On `Tether` → `status: APPROVED`, play proceeds
- On `Vanish` → `status: REJECTED`, play halts
- On feedback text (without Tether/Vanish) → stored for cycle-back, status remains PENDING

Path: `.meridian/product/checkpoints/discover-product/{YYYYMMDD-HHMMSS}.md`

The review surface in the prompt is **the product.yaml file path** — not an HTML
brief, not a summary. Briefs are opt-in (`/briefs`) and explicitly NOT part of this
play. The reasoning: if the user can read YAML, they can review the spec; if they
can't, an HTML brief that paraphrases the YAML is itself a regression risk (the
brief might say things the YAML doesn't). The play presents the YAML path and lets
the user open it in their editor.

**How to absorb.** `specify-product`. Inherit:
- Write checkpoint artifact BEFORE prompting
- Use `Tether` / `Vanish` keywords (not `yes` / `no`)
- Review surface is the YAML file path, not a derived view
- Briefs remain opt-in

This is also cross-cutting — see plan-roadmap Pattern 5 and prepare-architecture
Pattern 7 for the same structure with different artifact paths.

---

### Pattern 8: Type-conditional cycle-back with hard iteration limits

**Summary.** When validation finds blockers and the user requests a re-draft via
Vanish, the play increments an iteration counter and re-invokes drafting. The
maximum cycle-backs is type-dependent: 1 for product, 2 for library. Hitting the
limit halts the play (F5) and requires re-invocation.

**Why it mattered.** Without a hard limit, a stubborn blocker becomes an infinite
cycle. The type-dependent limit reflects the asymmetry: market-facing products need
the user to re-think the brief between iterations (so 1 iteration is enough to
expose problems before the user steps away), while library/SDK specs are more
mechanical and benefit from a second pass.

**How it worked.**
Status file tracks `iteration_count`. On Vanish from a blocker interview:
1. Read `iteration_count`
2. Check against limit (1 product, 2 library)
3. If within limit: increment, re-invoke `product-strategist` for `draft-product-vision`
   with feedback from validation issues, return to Step 3
4. If at limit: halt with F5 ("Maximum cycle-back iterations reached")

C5 budgets are designed so cycle-backs fit within the agent budget:
- Product: 3 base + 1 cycle-back = 4 (within ≤5)
- Library: 2 base + 2 cycle-backs = 4 (within ≤5)

**How to absorb.** `specify-product`. Carry forward:
- `iteration_count` in the play status file
- Type-dependent limits
- Pre-counted budget so cycle-backs don't blow the agent ceiling
- F5 hard halt at the limit (no soft warning, no extension)

---

### Pattern 9: Domain clarification loop exempt from agent budget

**Summary.** When the discover-opportunity agent cannot determine the product domain
(e.g., "B2B SaaS" vs "consumer mobile" vs "developer tooling"), it returns a
structured `domain_clarification_needed` response. The play presents candidate
domains to the user, parses the response, and re-invokes the same agent. This
re-invocation does NOT count against the C5 domain-agent budget.

**Why it mattered.** Domain ambiguity is the agent's failure to resolve, not the
user's failure to specify. Counting clarification re-invocations against the budget
would penalize the user for the agent's confusion. Treating clarification as a
"continue the same task" round trip is correct.

**How it worked.**
1. Step 2 invokes `product-strategist` with the intent
2. If the agent returns `domain_clarification_needed: true` with `candidate_domains: [...]`,
   the play presents the candidates to the user
3. User responds with one candidate (or "other: ..." with their own)
4. Play re-invokes `product-strategist` with `confirmed_domain` set
5. Re-invocation is exempt from C5 budget
6. If user rejects all candidates AND provides no alternative, hard halt (F2)

**How to absorb.** `specify-product`. Inherit the pattern but generalize: any
"please clarify X" round trip from an agent should be exempt from the budget,
not just domain. Consider a structured agent return type `clarification_needed`
that the orchestrator handles uniformly across all agents.

---

## From `plan-roadmap`

### Pattern 1: Epic IDD scoping with strategic-goal tracing and natural epic count

**Summary.** Each epic must trace to a named strategic goal from the locked product.yaml
via `strategic_goal_ref: "SG1"`. The number of epics is a **natural outcome** of the
strategic goals, profile, and matched domain taxonomy — NEVER a target. Each epic
gets full IDD treatment: 14 fields total (10 scoping + 4 IDD).

**Why it mattered.** Two failure modes were rampant in earlier designs:
1. **Orphan epics** — epics that didn't trace to any strategic goal, often invented
   by the agent because they "seemed like a good idea." These created scope creep.
2. **Forced epic counts** — agents were told "aim for 5-8 epics" and would either
   pad with task-level work or merge unrelated capabilities to hit the count.

The natural-count rule combined with strategic-goal tracing gives a clean test:
"Does every epic trace to a goal? Does every goal have at least one epic? Stop."

**How it worked.**
Epic schema (lives in `core/components/skills/scope-roadmap-epics/reference/epic-schema.md`):

Scoping fields (10):
| Field | Type | Valid Values |
|-------|------|-------------|
| `id` | string | E1, E2, ... (E-prefix; F-prefix reserved for features.yaml) |
| `name` | string | Short noun-phrase |
| `strategic_goal_ref` | string | Must match `strategic_goals[].id` in product.yaml |
| `description` | string | 2-3 sentences |
| `bucket` | string | `near` \| `mid` \| `long` (lowercase only) |
| `priority` | string | `P1` \| `P2` \| `P3` |
| `effort` | string | `S` \| `M` \| `L` \| `XL` |
| `depends_on` | list | E-IDs of epics that must complete first |
| `foundation_investment` | boolean | true if shared infrastructure |
| `github_issue_ref` | string | "TBD" — set later |

IDD fields (4):
- `intent`: object with three FULL paragraphs `{p1, p2, p3}` — p1 is the problem
  today, p2 is the outcome after this ships (NOT a feature list), p3 is the
  strategic connection
- `constraints`: object `{in_scope, out_of_scope, must_not_break}` — naming
  specific scope creep risks
- `success_scenarios`: list, minimum 2, given/when/then format, binary testable
- `failure_conditions`: list, 2-4 items, each an observable outcome

Prohibited fields (presence is a schema violation): `horizon`, `dependencies`,
`success_metrics`, `idd_core`, `user_bet`, `intent_model`, `signal_flow`,
`technical_context`, `blast_radius`, `kpis`, `risks`, `acceptance_criteria`.

The 7 enforced rules from `epic-management-rules.md`:
1. **Vertical Slice** — each epic delivers end-to-end testable user value, not a
   horizontal layer
2. **Single Module Scope** — each epic owned by exactly one domain taxonomy module;
   if it spans modules, split it (with a documented exception for cross-cutting)
3. **Mocks as phased delivery** — mocks introduced must be replaced in a subsequent
   epic
4. **Scope boundaries** — in_scope/out_of_scope/must_not_break are mandatory
5. **Success verifiability** — scenarios must be binary testable, no "should" language
6. **Dependency discipline** — depends_on uses E-IDs only, no circular dependencies
7. **Foundation investments** — shared infrastructure marked `foundation_investment: true`,
   placed in `near` bucket with P1 priority

**How to absorb.** `design-exp` (this play absorbs scope-roadmap-epics' job).
Critical to preserve:
- The 14-field schema exactly (changing it breaks every downstream play)
- The natural-count rule with explicit "NEVER target a specific count" constraint
- E-ID convention (E-prefix for epics, F-prefix reserved for features)
- The 7 epic management rules
- Strategic-goal tracing as a hard halt eval
- Three-paragraph intent depth (p1/p2/p3 with full prose, not bullets)

The new play should consider whether to compile the epic schema into the play's
intent.yaml (as a referenced file) or keep it bundled with the scope-epics skill.

---

### Pattern 2: Time-bucketing logic (near/mid/long) derived from sequencing

**Summary.** Epics are placed into one of three time horizons (`near`, `mid`, `long`)
based on dependency sequencing, not on calendar dates or user input. Foundation
investments default to `near` with P1 priority.

**Why it mattered.** Calendar-based bucketing ("everything for Q1 goes in near")
breaks the moment dates slip. Dependency-based bucketing reflects the actual
delivery order: anything that doesn't depend on anything else goes in near; anything
that depends on near-epics goes in mid; anything that depends on mid-epics goes in
long. This stays correct even when timelines change.

**How it worked.**
The bucketing logic lives in `draft-roadmap`'s timeline composition (Process Step 4):
1. Read epics.yaml — extract `bucket` field if the scoping agent set it
2. If bucket field absent, derive from `depends_on`:
   - Epics with empty `depends_on` → `near`
   - Epics whose `depends_on` references near-epics only → `mid`
   - Epics whose `depends_on` references mid-epics → `long`
3. Foundation investments (`foundation_investment: true`) override to `near`/P1
   regardless of dependency depth, because they unblock everything else

Each timeline entry in roadmap.yaml has `horizon`, `label`, and `epic_refs`:
```yaml
timeline:
  - horizon: "near"
    label: "Foundation and core capabilities (next 3 months)"
    epic_refs: ["E1", "E2", "E3"]
  - horizon: "mid"
    label: "Expansion (3-6 months)"
    epic_refs: ["E4", "E5"]
```

`bucket` values are LOWERCASE only — `Near`, `Mid`, `Far`, or `horizon` are schema
violations.

**How to absorb.** `design-exp`. The dependency-driven bucketing is sound and
should survive the rewrite. Two refinements to consider:
- The current rule ("epics with no deps go near") doesn't account for cases where
  ALL initial epics could fit in near, leaving mid/long empty. The new play should
  decide if "balance horizons" is desirable or if empty horizons are fine.
- Foundation override is critical — without it, foundation epics get scheduled by
  their own dependency depth (which is usually shallow but not always near).

---

### Pattern 3: Pre-lock resolution gate for critical_blockers and open_questions

**Summary.** Same shape as discover-product Pattern 2, but the trigger sources are
different: this play scans `feasibility.yaml` for non-empty `critical_blockers[]`
and `open_questions[]` arrays after the human-review checkpoint approves but before
roadmap.yaml is composed.

**Why it mattered.** The feasibility assessment surfaces unresolved technical
questions and hard blockers that need human input before the roadmap can commit.
Without this gate, the roadmap would be composed with these items still open,
creating a planning artifact built on TBD foundations.

**How it worked.**
Step 5b (after Step 5 Tether):
```
feasibility = read_yaml(stm.feasibility_path)
critical_blockers = feasibility.critical_blockers
open_questions = feasibility.open_questions

if both empty: auto-proceed
else: present resolution interview
```

Resolution interview format identical to discover-product Pattern 2 — RESOLVED
keyword, numbered answers, structured pre-lock-resolutions.yaml audit. The interview
presents critical_blockers and open_questions in separate tables:

```markdown
### Critical Blockers ({count})
| # | Blocker | Epic | Recommendation |
|---|---------|------|----------------|
| 1 | {description} | {epic_ref} | {recommendation} |

### Open Questions ({count})
| # | Question | Impact |
|---|----------|--------|
| 1 | {question} | {impact} |
```

Resolution YAML adds `epic_ref` and `recommendation` fields in addition to the base
schema:
```yaml
pre_lock_resolutions:
  slug: "{slug}"
  resolved_at: "{timestamp}"
  critical_blockers:
    - blocker: "{description}"
      epic_ref: "E1"
      recommendation: "{from feasibility}"
      resolution: "{user decision}"
  open_questions:
    - question: "{from feasibility}"
      answer: "{user answer}"
```

There is NO re-validation step here (unlike discover-product Branch C) — the user's
resolution is final, because the items being resolved are by definition not validation
issues but planning unknowns.

**How to absorb.** `design-exp`. The trigger schema (critical_blockers +
open_questions in feasibility) is the differentiator from the discover-product
gate. The feasibility intermediate artifact must keep these two arrays as distinct
top-level fields so the gate has unambiguous triggers.

---

### Pattern 4: Per-epic feasibility model (NOT RICE)

**Summary.** Each epic gets a feasibility entry containing risk_level (low/medium/high),
technical_risks (each with severity and mitigation), blockers, sequencing_constraints,
and architecture_impact. Plus open_questions at the play level. There is no RICE,
no scoring threshold, no weighted impact-effort grid.

**Why it mattered.** RICE-style scoring forces an artificial precision (numeric scores
for impact, confidence, effort) that doesn't survive contact with the actual technical
investigation. The flat feasibility model lets the tech-designer report what they
actually found — these specific risks, this specific mitigation, this specific
sequencing constraint — without forcing it into a decimal score the user has to
interpret.

**How it worked.**
Feasibility per epic (lives in `assess-feasibility/SKILL.md` Process Step 4):
```yaml
feasibility:
  slug: "{slug}"
  assessed_at: "{ISO-8601}"
  epics:
    - epic_ref: "E1"
      epic_name: "{name}"
      risk_level: "low|medium|high"
      technical_risks:
        - risk: "{description}"
          severity: "low|medium|high"
          affected_systems: "{systems impacted}"
          mitigation: "{how to mitigate}"
      blockers: ["{blocker description, or empty list}"]
      sequencing_constraints: "{technical sequencing rationale}"
      architecture_impact: "{systems and patterns affected}"
  open_questions:
    - question: "{unresolved technical question}"
      affected_epics: ["E1", "E2"]
  summary:
    total_epics: {integer}
    high_risk_count: {integer}
    medium_risk_count: {integer}
    blocker_count: {integer}
    foundation_epics: ["E1"]
```

**Profile-driven calibration.** When product.yaml has profiles, the feasibility
agent calibrates risk levels using NFR/QP values:
- High NFR values not addressed by the feature scope → raise risk_level
- QP gaps (no testing, no observability) when QP targets demand them → raise risk_level
- High PP-3 (persona complexity) or PP-5 (integration density) → raise risk_level

Profile-architecture misalignment is also flagged: features requiring infrastructure
beyond what profiles suggest indicate scope creep or profile miscalibration.

**Constraint:** EVERY epic has at least one technical risk, even low-risk ones
(low-risk doesn't mean zero considerations). Open_questions has at least one entry
if any genuinely exist; empty list only if there are truly none.

**How to absorb.** `design-exp` (or `build-arch` if feasibility moves later in
the pipeline). Critical:
- Keep the flat schema; do NOT add RICE
- Keep profile-driven risk calibration
- Keep "every epic has at least one technical risk"
- Keep `open_questions` as a separate top-level array (it's the trigger for the
  pre-lock gate)
- Keep `foundation_epics` as a derived list in `summary` (used by risk_summary in
  roadmap.yaml)

---

### Pattern 5: Verbatim transcription from upstream (no regeneration in roadmap)

**Summary.** The roadmap composition step (`draft-roadmap` skill) reads three locked
upstream YAMLs (product.yaml, epics.yaml, feasibility.yaml) and copies content
VERBATIM into roadmap.yaml. It does not re-derive thesis, narrative, or any field
from the source intent. Eval F7 hard-halts if any field differs from upstream.

**Why it mattered.** Earlier designs let the roadmap-drafting agent "re-synthesize"
content from the source intent, leading to thesis statements that subtly contradicted
the locked product.yaml. The verbatim rule eliminates this drift: if the user wants
to change exclusions, they must re-open product.yaml and re-lock; the roadmap cannot
be the seam where content quietly mutates.

**How it worked.**
Composition rules (`draft-roadmap` Process Step 4):
- `thesis`: 1-2 sentences composed from product.yaml `strategic_goals` only —
  summarize the strategic bet the goals express. Do NOT invent goals.
- `narrative`: 3-4 paragraphs composed from product.yaml `vision` + `strategic_goals`
  + epic sequencing implied by epics.yaml + feasibility sequencing_constraints.
- `timeline`: derived from epics.yaml/feasibility per Pattern 2 above.
- `feasibility`: COPIED VERBATIM from feasibility.yaml — preserve ordering, do not
  re-assess.
- `critical_blockers`: COPIED VERBATIM from feasibility.yaml.
- `open_questions`: COPIED VERBATIM from feasibility.yaml.
- `risk_summary`: computed deterministically from feasibility data.
- `exclusions`: COPIED VERBATIM from product.yaml `scope.out_of_scope`.
- `assumptions`: COPIED VERBATIM from product.yaml `assumptions`.

F7 fires if any of these differ from the locked upstream — that's evidence of
regeneration rather than transcription.

**Eval SE-8** explicitly checks: read all four files (product.yaml, epics.yaml,
feasibility.yaml, roadmap.yaml) and verify exclusions, assumptions, feasibility
entries, and timeline epic_refs all match.

**How to absorb.** `design-exp`. The verbatim rule must survive — it's the
guarantee that downstream plays can read roadmap.yaml without worrying about drift
from product.yaml. Two refinements:
- The new play might collapse roadmap.yaml and feasibility.yaml into a single
  artifact; if so, the verbatim rule still applies to product.yaml derivatives.
- Consider adding the F7 check as a stand-alone validation step (not just an eval),
  so cross-artifact verification runs on every save.

---

### Pattern 6: Confidence assessment by context-isolated judge (NOT self-assessment)

**Summary.** After scope-roadmap-epics writes epics.yaml, a SEPARATE judge agent
receives ONLY the epics.yaml path and product.yaml path and scores each epic's
confidence (high/medium/low) with rationale. The judge has no access to the
product-strategist's drafting notes, market context, or any intermediate reasoning.
This is independent assessment, not self-grading.

**Why it mattered.** Self-assessment is meaningless — the same agent that drafted
the epic will rationalize its own choices. A context-isolated judge can spot
weak coverage, vague scenarios, and falsifiability problems without rationalizing.
F10 fires if the confidence assessment is performed by the same agent that scoped
the epics.

**How it worked.**
Step 2b contract (the entire prompt):
```json
{
  "intent_path": "...",
  "stm_base": ".meridian/product/",
  "mode": "score-epic-confidence",
  "artifact_paths": {
    "epics_yaml_path": "{stm.epics_path}",
    "product_yaml_path": "{stm.product_yaml_path}"
  },
  "stm": {
    "output": {
      "confidence_report_path": ".meridian/product/roadmap/confidence-report.yaml"
    }
  },
  "task_id": "score-confidence"
}
```

The judge produces per-epic confidence scoring:
```yaml
confidence_report:
  assessed_by: "judge"
  epics:
    - epic_ref: "E1"
      confidence: "high|medium|low"
      rationale: "{why}"
      scenario_metric_coverage: "full|partial|weak"
      falsifiability: "strong|moderate|weak"
      coverage_gaps: ["{gap}"]
  summary:
    high_count: ...
    medium_count: ...
    low_count: ...
```

Eval SE-11 checks `assessed_by == "judge"` and verifies the contract has only
artifact paths.

**How to absorb.** `design-exp`. The four assessment dimensions (confidence,
scenario_metric_coverage, falsifiability, coverage_gaps) are all useful — keep
them. The `assessed_by` field is the integrity check that catches self-assessment
regressions.

---

### Pattern 7: Dual coverage enforcement (orphaned_scope + deferred_violation)

**Summary.** After epics are scoped, a context-isolated judge runs a coverage check
that cross-references EVERY product.yaml `scope.in_scope` item against epics.yaml.
Two new failure statuses are enforced as hard halts:
- `orphaned_scope` — an in_scope item that has no owning epic
- `deferred_violation` — an epic claims an item that's in product.yaml `scope.out_of_scope`
  or marked deferred

**Why it mattered.** Without coverage enforcement, epics silently dropped in_scope
items (they were "absorbed as implementation details") and silently claimed
deferred items (because the deferred capability sounded useful). Both failures
mean the epic plan diverges from the product plan and the product owner cannot
trust either artifact.

**How it worked.**
Coverage check statuses in `coverage-check.yaml`:
- `covered` — strategic goal / in_scope item is explicitly claimed by an epic
- `partial` — facet acknowledged but not fully reflected
- `dropped` — facet has no representation
- `drifted` — epic content doesn't trace to any input facet
- `orphaned_scope` (NEW, C16) — in_scope item with no owning epic; HARD HALT
- `deferred_violation` (NEW, C17) — epic in_scope contains a deferred item; HARD HALT

The cross-cutting capability exception: if an in_scope item naturally spans multiple
domain modules and would violate single-module-scope (Rule 2), the scoping agent
has two choices:
1. Create a horizontal epic with `cross_cutting_justification` documenting why
   single-module-scope doesn't apply
2. Explicitly assign each fragment of the capability to a named epic whose in_scope
   field claims that fragment

Silent absorption is forbidden — every fragment must have an owner.

**How to absorb.** `design-exp`. The two new statuses (`orphaned_scope`,
`deferred_violation`) are the two most valuable enforcement gates in the entire
play. They MUST survive the rewrite. The cross-cutting exception (with
`cross_cutting_justification`) is also field-tested and prevents the alternative
failure mode (everything becomes a horizontal epic).

---

## From `discover-product-opportunity` (skill)

### Pattern 1: Market context extraction schema

**Summary.** Free-text problem statement → structured market_context object with
six required fields (problem, target_users, competitors, market_size,
differentiators, risks). Returns structured data only — no file writes.

**Why it mattered.** Earlier designs let the agent write a free-form market
context document, which downstream consumers then had to parse. The structured
schema gives a stable contract that draft-product-vision can consume mechanically.

**How it worked.**

Output schema:
```yaml
market_context:
  problem: "{refined one-sentence problem statement}"
  target_users:
    - persona: "{name/role}"
      goal: "{primary goal}"
      frustration: "{key pain}"
      context: "{when/where they use this}"
  competitors:
    - name: "{competitor name}"
      strengths: ["{strength 1}", "{strength 2}"]
      weaknesses: ["{weakness 1}", "{weakness 2}"]
  market_size:
    tam: "{estimate or null}"
    sam: "{estimate or null}"
    som: "{estimate or null}"
    note: "{derivation note or 'requires research'}"
  differentiators: ["{differentiator 1}", "{differentiator 2}"]
  risks: ["{market risk 1}", "{market risk 2}"]
```

Constraints:
- ALWAYS include at least 2 target user personas
- Each competitor entry has name, strengths (list), weaknesses (list)
- ≥2 risks
- 2-4 differentiators

Optional `market_hints` input enrichment:
- `industry` (e.g., "B2B SaaS", "retail", "healthcare")
- `geography` (e.g., "North America", "APAC")
- `target_segment` (e.g., "SMB", "enterprise", "consumer")

**How to absorb.** `specify-product`. The new play absorbs market context extraction
into its draft phase. The 6-field schema is minimal but complete — keep it intact.
The "structured data only, no file writes" pattern is correct for a sub-skill;
the parent draft-product-vision skill is the one that writes the consolidated
artifact.

---

### Pattern 2: Problem restatement template

**Summary.** The first process step is to read the problem statement and restate
it in a standardized one-sentence template: "Users who {situation} need {outcome}
because {reason}." This forces the agent to identify the user, the desired outcome,
and the underlying reason as three distinct elements.

**Why it mattered.** Raw problem statements often confuse the problem with the
solution ("I need a tool that exports CSVs"). The restatement template separates
the user, the outcome, and the cause, surfacing whether the agent actually
understood the problem.

**How it worked.**
Process Step 1 explicitly says:
> Read `problem_statement`. Identify the core problem being solved vs. the product
> being built. Restate in one sentence: "Users who {situation} need {outcome}
> because {reason}."

The output's `problem` field is this restated sentence — not the raw input. The
agent must distinguish "the product being built" from "the underlying user
problem" before writing the field.

**How to absorb.** `specify-product`. This is a two-line constraint that has
disproportionate value. Carry it forward verbatim. The new play should put this
pattern in the draft skill's process steps, not the play orchestrator.

---

### Pattern 3: TAM/SAM/SOM nullable estimation with explicit "requires research"

**Summary.** Market size is estimated as TAM/SAM/SOM strings. If the agent cannot
derive a credible estimate from the available context, the entire `market_size`
object is null with a `note` field explaining why ("Market size estimate requires
domain-specific research"). The skill is forbidden from guessing.

**Why it mattered.** Agents will fabricate market sizes if asked — they'll
estimate "$1.2B TAM, $300M SAM, $50M SOM" with confidence and zero basis. The
nullable schema with a mandatory note field gives the agent an honest "I don't
know" path that downstream consumers can trust.

**How it worked.**
Constraint: "NEVER guess at market data — if unknown, use null with a note."

Three nullable scalars + one required note string:
```yaml
market_size:
  tam: "{estimate or null}"
  sam: "{estimate or null}"
  som: "{estimate or null}"
  note: "{derivation note or 'requires research'}"
```

For library-type intents, market_size is always null (the type bifurcation pattern
in discover-product Pattern 1 prevents fabrication of market data for libraries).

**How to absorb.** `specify-product`. Carry forward the nullable schema and the
forbidden-fabrication constraint. The note field is the audit trail for why
estimates are missing — it MUST remain non-null even when TAM/SAM/SOM are null.

---

## From `prepare-architecture`

### Pattern 1: Inline `decisions[]` array with structured ADR-style records

**Summary.** Architecture decisions are recorded as an inline `decisions[]` array
inside `architecture.yaml` — NOT as separate ADR files in `docs/adr/`. Each
decision is a structured record with question, answer, drivers, reasons (with
driver attribution), picked technologies, and rejected alternatives.

**Why it mattered.** Free-standing ADR files create discoverability problems
(where do they live? who maintains them?), version-control friction (the ADR
is in a file, the architecture is in another), and audit gaps (a decision in
ADR-007 might contradict the current architecture.yaml). Inline decisions live
in the same file as the architecture, version with it, and validate alongside it.

**How it worked.**
Schema (C12):
```yaml
decisions:
  - question: "{the design question asked}"
    answer: "{the chosen solution}"
    drivers:                              # array of driver tags
      - "budget"
      - "ltm"
      - "profile"
      - "user-decision"
    reasons:                              # tagged reasoning trail
      - driver: "profile"
        text: "{NFR-2 level 4 requires MFA + RBAC + encryption-in-transit}"
      - driver: "ltm"
        text: "{LTM auth.md recommends Auth0 for enterprise SSO}"
    picked:                               # selected technologies/approaches
      - "Auth0"
      - "MFA via TOTP"
    rejected:                             # alternatives not chosen with rationale
      - option: "Cognito"
        reason: "Lower customization for SSO federations"
      - option: "Custom OAuth"
        reason: "Maintenance burden exceeds team capacity (PP-6 = 2)"
```

Driver vocabulary is FIXED to four values:
- `budget` — cost constraint drove the decision
- `ltm` — LTM architecture knowledge recommended this
- `profile` — a profile dimension (PP/NFR/QP) drove the decision
- `user-decision` — explicit user choice during planning

C13 enforces driver traceability: every `reasons[]` entry MUST have a `driver` field
with one of the four allowed values. Eval SE-7 hard-halts on any reason without a
valid driver.

C12 enforces structural completeness: each entry must have all required fields
(question, answer, drivers, reasons, picked, rejected — though rejected may be
empty list).

F8 fires if `decisions[]` is absent, empty, or contains entries without driver
traceability.

**Why driver tagging matters.** A reviewer can filter decisions by driver:
"Show me all profile-driven decisions" → all the places where the project's
character forced a choice. "Show me all budget-driven decisions" → all the
places where cost constraints overrode the ideal. "Show me all LTM-driven
decisions" → all the places where institutional knowledge was applied. This
makes architecture review tractable instead of grovelling through prose.

**How to absorb.** `build-arch`. THIS IS THE HIGHEST-VALUE PATTERN IN THE ENTIRE
prepare-architecture PLAY. Carry it forward unchanged:
- Inline in architecture.yaml (do NOT migrate to free-standing ADR files)
- 6 required fields per decision (question, answer, drivers, reasons, picked, rejected)
- 4-value driver vocabulary (budget, ltm, profile, user-decision)
- Driver-tagged reasons (every reason has a driver field)
- Eval enforcement (SE-6, SE-7)
- F8 hard halt on missing/empty decisions

The new play's intent.yaml should restate C12 and C13 verbatim. SCE-6 (Decision
Reviewer scenario) is the smoke test — the new play should keep an equivalent
scenario.

---

### Pattern 2: NFR Profile → concrete measurable requirements mapping

**Summary.** Every entry in `architecture.yaml` `nfrs` section must be DERIVED FROM
an NFR Profile dimension level in product.yaml, and every requirement's rationale
must reference the dimension and level it traces from. Vague NFRs ("should be fast")
are forbidden.

**Why it mattered.** NFRs without traceability become wish lists — engineers ignore
them because they don't know which constraint forced the requirement. Profile
traceability gives every NFR a "why" the engineer can verify: NFR-3 = 4 means
"sub-100ms responses for critical paths" because that's the level the user chose
during spec lock.

**How it worked.**
Mapping rules (lives in `draft-technical-approach/SKILL.md`, applied when
`profiles_ref` is provided):

| Profile dimension | Level | Concrete requirement example |
|-------------------|-------|------------------------------|
| NFR-1 (Risk) | 3 | Monitoring and alerting for all customer-facing endpoints |
| NFR-2 (Security) | 3 | MFA, RBAC, encryption in transit, API key management |
| NFR-3 (Performance) | 4 | Sub-100ms API responses for critical paths |
| NFR-4 (Availability) | 3 | 99.9% uptime, automated failover, blue-green deployments |
| NFR-5 (Compliance) | 3 | GDPR compliance, privacy by design, consent management |
| NFR-6 (Scalability) | 3 | Horizontal scaling, load balancing, designed for 10x growth |
| NFR-7 (Data Sensitivity) | 3 | PII encryption at rest, access logging |

Each requirement carries a rationale referencing the dimension and level
("NFR-3 level 4 → API response < 100ms at p95"). Eval SE-4 (C4, F2) verifies
that EVERY nfrs entry has profile-traceable rationale; FAIL hard-halts.

The schema:
```yaml
nfrs:
  performance:
    - requirement: "{measurable target — e.g. API response time < 200ms at p95}"
      priority: "must|should|nice-to-have"
  scalability: ...
  security: ...
  availability: ...
  compliance: ...
```

Each NFR section has at least performance and security entries (mandatory). Each
entry has `requirement` (the concrete target) and `priority` (must/should/nice-to-have).

**How to absorb.** `build-arch`. Carry forward the mapping discipline. The level→
requirement table is field-tested and should be embedded as guidance in the
draft skill (or in the LTM project-profiling files). The "every requirement has
profile-traceable rationale" eval is a hard halt and must remain a hard halt.

---

### Pattern 3: QP Profile → concrete tooling mapping (per-dimension)

**Summary.** Every Quality Profile dimension level (QP-1 through QP-7) maps to
specific named tools, frameworks, and processes in `quality-standards.yaml`.
Vague references like "use a linter" are forbidden — every entry must name a
real tool ("ESLint 9", "Pytest", "Datadog APM").

**Why it mattered.** A quality standards document with vague directives ("use
appropriate testing") is unenforceable. A document with named tools is testable:
either the project uses ESLint or it doesn't. The QP→tool mapping makes "technical
debt = gap between target QP and current implementation" measurable.

**How it worked.**
Per-dimension mapping (lives in `draft-quality-standards/SKILL.md` Process Step 6):

**QP-1 (Testing Depth) → standards.testing**
- `qp_level`, `strategy`, `test_types` (unit/integration/e2e/contract/performance/property-based),
  `frameworks` (named: Jest, Pytest, Playwright), `coverage_target`, `automation`

**QP-2 (Code Quality) → standards.code_quality**
- `qp_level`, `linter` (ESLint 9 / Ruff), `formatter` (Prettier / Black),
  `static_analysis` (SonarQube / CodeClimate or null), `review_process`,
  `conventions`, `design_patterns`

**QP-3 (Documentation) → standards.documentation**
- `qp_level`, `api_docs` (OpenAPI 3.1 + swagger-jsdoc), `architecture_docs`
  (ADRs in docs/adr/, C4 via Structurizr), `runbooks`, `onboarding`

**QP-4 (CI/CD Maturity) → standards.ci_cd**
- `qp_level`, `pipeline` (GitHub Actions / GitLab CI), `environments`
  (dev/staging/prod), `deployment_strategy` (blue-green/rolling/canary/manual),
  `feature_flags` (LaunchDarkly / Unleash or null), `infrastructure_as_code`
  (Terraform / Pulumi or null)

**QP-5 (Observability) → standards.observability**
- `qp_level`, `logging` (Pino → Datadog Logs), `monitoring` (Datadog APM with
  metric list), `alerting` (PagerDuty with thresholds), `tracing` (OpenTelemetry
  → Jaeger or null)

**QP-6 (Accessibility) → standards.accessibility**
- `qp_level`, `standard` (WCAG 2.1 AA or "none"), `testing` (axe-core in CI +
  manual screen reader), `audit_cadence` (quarterly / annual or "none")

**QP-7 (Security Testing) → standards.security_testing**
- `qp_level`, `dependency_scanning` (Dependabot / Snyk), `sast` (CodeQL / Semgrep
  or null), `dast` (OWASP ZAP or null), `pen_testing` (annual third-party or
  "none"), `secret_scanning` (GitHub Secret Scanning + detect-secrets)

Stack alignment: when `architecture_yaml_path` is provided, the agent picks
language-native tools (TypeScript projects get TypeScript-native linters and test
frameworks; Python projects get Python-native equivalents).

**How to absorb.** `build-arch`. The 7-dimension mapping is the full charter for
quality-standards.yaml — keep all of it. Critical: every concrete tooling field
must be NAMED, not categorized. The eval SE-8 hard-halts if `qp_level` mismatches
or if any required tooling field is null.

---

### Pattern 4: debt_baseline initialization for technical-debt measurement

**Summary.** quality-standards.yaml includes a `debt_baseline` section with one
entry per QP dimension (QP-1 through QP-7), each with `target_level` (from the QP
profile), `current_level: null`, `gap: null`, `remediation: null`. This is the
zero-state baseline for measuring technical debt as the gap between target and
actual.

**Why it mattered.** Technical debt without a baseline is just complaining. With
a baseline, debt is calculable: "QP-1 target = 4, current = 2, gap = -2 levels"
becomes the actionable input for a debt remediation plan. Initializing the
baseline at architecture-lock time means every project starts with a known
quality target, even before any code is written.

**How it worked.**
Schema:
```yaml
debt_baseline:
  measured_at: "{ISO-8601 timestamp}"
  dimensions:
    - qp_dimension: "QP-1"
      target_level: 3                # from product.yaml profiles.quality_profile
      current_level: null            # measured post-implementation
      gap: null                      # calculated post-measurement
      remediation: null              # planned post-measurement
    - qp_dimension: "QP-2"
      target_level: 3
      current_level: null
      gap: null
      remediation: null
    # ... QP-3 through QP-7
```

All 7 dimensions must be present at architecture-lock time. `target_level` must
match the product.yaml `quality_profile` level for that dimension exactly (eval
SE-8 enforces this). `current_level`, `gap`, and `remediation` are null at
initialization and populated later by separate measurement workflows (e.g.,
the `check-drift` skill).

Eval SCE-5 (S5 — Quality Lead scenario) verifies that all 7 dimensions are
present and properly initialized.

**How to absorb.** `build-arch`. This is a two-step pattern:
1. At lock time: write the 7 baseline entries with `current_level: null`
2. Later (out of scope for this play): a separate measurement workflow fills
   `current_level`, computes `gap`, and proposes `remediation`

The new play should initialize the baseline as part of quality-standards.yaml
output. The measurement workflow is downstream's job.

---

### Pattern 5: Codebase-scan-before-architecture (greenfield exception)

**Summary.** Before the architecture is drafted, the play scans the codebase for
existing technology decisions — ADRs, package manifests, framework choices,
infrastructure configurations. These findings INFORM architecture selection but
do NOT override it. If the codebase is greenfield (no existing decisions), the
context report explicitly states "greenfield."

**Why it mattered.** Architecting in a vacuum produces specifications that conflict
with existing code, forcing rewrites or ignored architecture documents. Scanning
first gives the agent the actual technical landscape to reason about. The
"inform, not override" rule prevents the inverse failure: architectural lock-in
where existing choices are blindly preserved even when they're wrong.

**How it worked.**
Step 2 (`scan-codebase-ltm`):
- The tech-designer agent uses Glob, Grep, and Read to scan for:
  - ADR files (often in `docs/adr/` or `architecture/decisions/`)
  - Package manifests (`package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`)
  - Framework configuration files (`next.config.js`, `Dockerfile`, `tsconfig.json`)
  - Infrastructure configurations (`terraform/`, `.github/workflows/`)
  - Existing code structure

- Findings are written to `context-report.yaml` along with LTM architecture knowledge
  references (see Pattern 6 below).

- Eval SE-1 (C10): the report must contain at least 1 codebase finding OR explicitly
  state greenfield. The greenfield exception is the only clean pass without findings.

The constraint: codebase findings INFORM the architecture but DO NOT OVERRIDE it.
If existing code uses Express but the profile-driven analysis suggests FastAPI,
the architecture can choose FastAPI with a decision record explaining the migration.

**How to absorb.** `build-arch`. The scan-before-draft pattern is essential and
should be preserved. Two refinements:
- The greenfield exception path needs a clean way to declare "no existing code" —
  the new play should encode this as an explicit input flag rather than a
  scan-result interpretation
- The "inform, not override" rule should be encoded as a constraint in the new
  play's intent.yaml (it's currently implicit in C10)

---

### Pattern 6: LTM architecture knowledge matching (When-to-Choose / When-to-Avoid)

**Summary.** Before any technology selection, the play reads LTM architecture
knowledge from `~/.meridian/core/memory/knowledge/arch/`. Each architecture
file follows a structured template with "When to Choose" and "When to Avoid" prose
that the agent matches against the project's profile values (PP, NFR, QP) to
inform pattern, stack, platform, and data-store selection.

**Why it mattered.** Without LTM consultation, agents reach for whatever they
"know" from training data, which is biased toward popular but not necessarily
appropriate technologies. The LTM files encode the team's institutional knowledge:
"For consumer-facing products with high performance needs, choose React + Next.js
because... Avoid for content-heavy sites because..." The agent reasons over this
prose using profile values as the matching key.

**How it worked.**
LTM directory structure (`core/components/memory/knowledge/arch/`):
- `_index.md` — categorical index of all architecture files
- `patterns/` — modular-monolith, microservices, serverless, event-driven,
  cqrs-event-sourcing, evolutionary-scaling
- `agentic/` — rag-vector, rag-graph, rag-hybrid, agent-orchestration,
  llm-infrastructure
- `stacks/` — frontend-{react-nextjs, vue-nuxt, angular, svelte}, mobile-{react-native, flutter},
  backend-{nodejs, python-fastapi, go, java-spring, dotnet}
- `platforms/` — aws, gcp, azure, vercel, railway-render, self-hosted
- `data/` — relational, nosql-document, nosql-keyvalue, vector-databases,
  messaging-queues, search-engines
- `operations/` — ci-cd, containerization, observability, security-infrastructure, iac

Each architecture file has these required sections:
- **When to Choose** — prose describing conditions (NOT conditional rules)
- **When to Avoid** — anti-conditions in prose
- **Scale Profile** — team size, user count, data volume sweet spot
- **Key Components** — concrete technologies within this category
- **Reference Architecture** — directory structure, configuration, opinionated setup
- **Evolution Paths** — migration to/from this approach
- **Tradeoffs** — cost, velocity, complexity, operational burden
- **Anti-Patterns** — common mistakes

The agent reasons over the PROSE — it does not parse conditional rules. This is
deliberate: prose handles nuance ("consumer-facing products with high performance
needs") that conditional rules ("PP-1 >= 4 AND NFR-3 >= 3") cannot.

Eval SE-2 (C2, F4): the context report must list at least 3 LTM architecture
knowledge files as consulted. F4 fires if the play produced architecture artifacts
without reading LTM.

**How to absorb.** `build-arch`. This is load-bearing for the entire architecture
phase. Critical:
- The LTM directory structure (patterns/agentic/stacks/platforms/data/operations)
  is the canonical organization — keep it
- The "When to Choose / When to Avoid" prose template is field-tested — keep it
- The "reason over prose, not rules" principle MUST be preserved (rules-based
  matching becomes brittle as profiles evolve)
- Eval SE-2 (≥3 LTM files consulted) is the integrity check — keep it

Consider whether the new play should also pass profile values as explicit input
to the LTM-matching step, so the agent has the structured profile context AND
the prose to reason against.

---

### Pattern 7: Pre-lock resolution gate for high-severity risks and quality gaps

**Summary.** Same shape as discover-product Pattern 2 and plan-roadmap Pattern 3,
but the trigger sources are: (a) `architecture.yaml` `technical_risks[]` entries
with `severity: high`, and (b) `quality-standards.yaml` entries where any required
tooling field is null. The gate runs after artifact-review checkpoint approval but
before the lock step.

**Why it mattered.** Architecture artifacts can be approved by a reviewer who
didn't notice that the `technical_risks` section has a high-severity item, or
that QP-4 has a null `pipeline` field. The pre-lock gate catches both before
the artifact transitions to LOCKED.

**How it worked.**
Step 5b (after Step 5 Tether):
```
high_risks = [r for r in architecture.technical_risks if r.severity == "high"]
quality_gaps = [s_name for s_name, s in quality_standards.standards.items()
                if any required tooling field is null]
```

If both empty → auto-proceed.
If non-empty → present resolution interview with two tables:
```markdown
### High-Severity Technical Risks ({count})
| # | Risk | Affected Features | Mitigation |
|---|------|-------------------|------------|
| 1 | {risk} | {affected_features} | {mitigation} |

### Quality Standard Gaps ({count})
| # | Section | Gap |
|---|---------|-----|
| 1 | {section} | {gap description} |
```

RESOLVED writes a pre-lock-resolutions.yaml with two top-level arrays
(`high_risks` and `quality_gaps`), each containing the resolution. No
re-validation step (resolutions are accepted as final).

**How to absorb.** `build-arch`. Inherit the trigger sources (high-severity
technical_risks, null required tooling fields). The two-table presentation is
clearer than a single combined list because the items have different action
profiles.

---

### Pattern 8: ISO-25010-adjacent quality dimensions (NFR section coverage)

**Summary.** The architecture.yaml `nfrs` section is organized around five
quality areas that map closely to ISO/IEC 25010 quality characteristics:
performance, scalability, security, availability, compliance. Each area has
at least one explicit requirement when the area is relevant.

**Why it mattered.** ISO 25010 is the gold standard for software quality
characteristics, but applying it directly produces 8+ characteristics with
sub-characteristics that overwhelm the architecture artifact. The five-area
collapse keeps the structure usable while still covering the load-bearing
ISO 25010 dimensions.

**How it worked.**
Schema:
```yaml
nfrs:
  performance:                    # ISO 25010: Performance Efficiency
    - requirement: "{e.g. API response time < 200ms at p95}"
      priority: "must|should|nice-to-have"
  scalability:                    # ISO 25010: Performance Efficiency (capacity sub-char)
    - requirement: "{e.g. handle 10K concurrent users}"
      priority: "must|should|nice-to-have"
  security:                       # ISO 25010: Security
    - requirement: "{e.g. all data encrypted at rest and in transit}"
      priority: "must|should|nice-to-have"
  availability:                   # ISO 25010: Reliability (availability sub-char)
    - requirement: "{e.g. 99.9% uptime SLA}"
      priority: "must|should|nice-to-have"
  compliance:                     # NOT in ISO 25010 — added because regulatory matters
    - requirement: "{e.g. GDPR data residency}"
      priority: "must|should|nice-to-have"
```

Mapping to ISO 25010 (the one not present is intentional — see "Patterns
intentionally NOT captured" below):
- Performance Efficiency → `performance` + `scalability`
- Reliability → `availability`
- Security → `security`
- Compliance → `compliance` (extension)

Quality dimensions that ISO 25010 includes but this schema does NOT explicitly
section are handled via the Quality Profile (testing, observability,
maintainability) and the architecture itself (functional suitability,
compatibility, usability, portability).

**Constraint:** the `nfrs` section MUST have at least `performance` and `security`
entries. The other three sections are conditional on the project having relevant
requirements.

Each requirement has `priority: must | should | nice-to-have` (also adapted from
RFC 2119 and not from ISO 25010 directly).

**How to absorb.** `build-arch`. Keep the five-area collapse — it's pragmatic and
covers the load-bearing ISO 25010 characteristics without overwhelming the
artifact. The mandatory `performance` + `security` minimum is correct.

---

## Cross-cutting observations

### Context isolation is the load-bearing trust mechanism

All three plays use **context-isolated judges** for validation and verification.
The pattern is identical:
- A separate agent receives ONLY the artifact paths and the validation skill name
- It does NOT receive drafting context, intermediate reasoning, or LTM references
  used during drafting
- Its contract is small enough to enforce by inspection — drafting context cannot
  hide in the contract

Five context-isolated judge invocations across the three plays:
1. `discover-product` Step 3a — reverse-coverage (problem → vision)
2. `discover-product` Step 5 — validate-product-vision
3. `plan-roadmap` Step 2a — reverse-coverage (product → epics)
4. `plan-roadmap` Step 2b — score-epic-confidence
5. `plan-roadmap` Step 6b-val — validate-roadmap
6. `prepare-architecture` Step 5c — validate-architecture-design

This pattern MUST survive into all three new plays. The eval that catches context
isolation regressions is "the contract has only artifact_paths and validation_skill"
(SE-11 pattern). Carry this eval forward — it's a structural integrity check that
runs in milliseconds.

### Pre-lock resolution gate is a shared shape with three trigger sources

The pre-lock resolution gate appears in three forms across the four plays:
| Play | Trigger sources |
|------|-----------------|
| discover-product | blocker issues + warning issues + placeholder field values |
| plan-roadmap | critical_blockers + open_questions (from feasibility) |
| prepare-architecture | high-severity technical_risks + null required tooling fields |

The MECHANICS are identical:
1. Compute unresolved items
2. If empty → auto-proceed
3. Else → write checkpoint, present numbered tables, accept RESOLVED + numbered
   answers, write pre-lock-resolutions.yaml, proceed (or re-validate, depending on
   branch)
4. Vanish escapes (cycle-back or halt)
5. NO accept-risk bypass for blockers (discover-product specifically forbids it)

This is begging to be extracted as a shared skill. The new pipeline should consider
a `enforce-pre-lock-gate` skill that takes:
- A list of unresolved items (with type, description, optional metadata)
- A boolean: should-revalidate-after-resolution
- A boolean: allow-cycle-back

And produces:
- The pre-lock-resolutions.yaml audit
- A continue/halt/cycle-back signal

If extracted, the three new plays each invoke the skill once, and the gate
mechanics live in one place that all three depend on.

### Locked-status hard halt is the commitment device

All three plays hard-halt in pre-flight if their primary artifact is already
LOCKED. This is the commitment device that lets downstream plays trust upstream
artifacts:
- `discover-product` halts on LOCKED product.yaml
- `plan-roadmap` halts if product.yaml is NOT LOCKED (inverse — requires upstream lock)
- `prepare-architecture` halts if product.yaml AND roadmap.yaml are not both LOCKED

The new pipeline should preserve both directions:
1. A play that PRODUCES an artifact must hard-halt if its output is already LOCKED
2. A play that CONSUMES an upstream artifact must hard-halt if the upstream is not LOCKED

There is no soft mode. There is no "force" flag. Manual unlock (editing the YAML)
is the only escape hatch, and that's deliberate — it forces the user to make an
explicit choice rather than a CLI typo.

### "Knobs not questions" is the user-experience innovation

The three-axis profile derivation (discover-product Pattern 3) and the
structured RESOLVED interviews (cross-cutting pre-lock gate pattern) share a
common UX philosophy: the agent does the work, the user validates.

- Profiles are derived, then presented as adjustable tables — not asked as
  cold questionnaires
- Validation issues are presented as numbered items with proposed structure,
  not as open-ended prose

This pattern is what makes IDSD usable for non-experts. The new plays should
extend the principle: any time the user is asked to provide input, the play
should derive the input first and present it as a knob rather than a question.

### Briefs are opt-in (review surface is the YAML path)

All three plays explicitly set the review surface to the YAML file path, not
an HTML brief. Briefs are opt-in via the separate `/briefs` skill and are
explicitly NOT mandated by any of the four deprecated plays.

The reasoning: an HTML brief that paraphrases the YAML is a regression risk
(the brief might say things the YAML doesn't). The plays present the YAML
path and let the user open it in their editor. Briefs exist for users who
prefer rendered output but are never the source of truth.

The new plays should preserve this:
- Review surface in checkpoints = YAML file path
- Briefs remain opt-in (no play depends on a brief being generated)
- The lock decision is made on the YAML, not on a brief

### Slug derivation and project STM scoping

All three plays derive a `slug` early (in pre-flight) and use it as the project
identifier for STM paths:
- `discover-product`: derives slug from intent text via `slugify()`
- `plan-roadmap`: derives slug from product.yaml frontmatter
- `prepare-architecture`: derives slug from product.yaml

STM is project-scoped under `.meridian/product/`, NOT per-issue. This is
intentional: product-level artifacts (vision, roadmap, architecture) span
many issues and live at the product level. Per-issue STM (under `.meridian/{issue}/`)
is for feature-level work.

The new pipeline should preserve project-scoped STM for product/design/architecture
artifacts and per-issue STM for feature implementation.

---

## Patterns intentionally NOT captured

- **RICE scoring (Reach, Impact, Confidence, Effort).** The task brief asked for
  "RICE/feasibility scoring format and thresholds," but RICE is not used anywhere
  in the four plays. The actual feasibility model is a flat per-epic structure
  (risk_level + technical_risks + blockers + sequencing_constraints +
  architecture_impact) plus play-level open_questions. I captured the actual model
  under plan-roadmap Pattern 4. The new plays should explicitly NOT introduce RICE
  unless there's new evidence it adds value over the flat model.

- **Boilerplate intent.yaml shape.** The "intent / constraints / failure_conditions
  / scenarios" structure is universal to all Meridian plays. Not a pattern, just
  the convention.

- **Standard pre-flight checks (intent provided, slug derivable, status file
  present).** Universal Meridian convention.

- **`repo-orchestrator` self-commit step (ADR 012).** Universal Meridian
  convention; explicitly excluded by the task brief.

- **`Tether` / `Vanish` keywords for approval.** Universal Meridian convention.

- **Status file structure with task-level pause/resume.** Universal Meridian
  convention; the executor loop and resume logic are identical across all plays.

- **Agent budget enforcement (C5 ≤ 5 domain agent dispatches).** Universal
  Meridian convention enforced at the play-level via the Four Crafts architecture.

- **Brief generation step.** Explicitly NOT part of these plays (briefs are
  opt-in via `/briefs`).

- **The `repo-orchestrator` as a utility agent exempt from the budget.** Universal
  Meridian convention.

- **Generic "evidence directory" structure.** The task brief explicitly excludes
  conventional evidence directories.

- **ISO 25010 maintainability, portability, compatibility, functional-suitability,
  usability sections of the nfrs structure.** The deprecated prepare-architecture
  collapses these into the architecture itself (e.g., maintainability is in the
  Quality Profile, usability is in PP-2, portability is in deployment_units). The
  five-section nfrs schema (performance/scalability/security/availability/compliance)
  is the field-tested compromise — see prepare-architecture Pattern 8. I captured
  the compromise but did NOT propose adding the missing ISO 25010 sections to the
  new play, because the deprecated play deliberately omitted them and they did not
  produce field complaints.

- **The `--phase draft|validate|lock` argument from the original discover-product
  spec.** This was an early design that was replaced by the single-invocation
  flow with inline checkpoints. The single-invocation flow is what the deprecated
  plays actually used. The new plays should follow the single-invocation flow.

- **doc-builder agent.** Replaced by opt-in `/briefs` and not used by any of
  the four deprecated plays in their current form.

- **GitHub issue creation as part of epic scoping.** scope-roadmap-epics
  explicitly forbids creating GitHub issues — `github_issue_ref` is set to "TBD"
  and resolved later by a separate workflow. Not a pattern, just a constraint.

- **Per-step "depends_on" documentation in SKILL.md.** The dependency graph is
  encoded by Step ordering and the explicit `Depends on:` headers. The new plays
  should follow the same convention but it's not a pattern to capture.
```

# === END OF FILE BODY ===

---

## Final summary

**Output:** I cannot write the file (read-only mode), so the full markdown content of `core/components/memory/knowledge/deprecated-play-patterns.md` is contained in the section between the `# === FILE BODY BELOW ===` and `# === END OF FILE BODY ===` markers above. Please copy it verbatim into that path.

**Pattern counts:**
- discover-product: 9 patterns
- plan-roadmap: 7 patterns
- discover-product-opportunity (skill): 3 patterns
- prepare-architecture: 8 patterns
- Cross-cutting observations: 6 sections
- Patterns intentionally not captured: 13 items with reasons

**Critical patterns the advisor flagged that I made sure to capture:**
- Pre-lock resolution gate captured separately for each play (each has a different trigger source) AND noted as cross-cutting in the observations section
- C15 "no accept-risk bypass" captured as part of discover-product Pattern 2 (it is discover-product-specific because the other plays only have RESOLVED/Vanish; discover-product is the one that explicitly forbids a third path)
- RICE excluded with rationale ("not present in any of the four plays")
- Context isolation explicitly noted as cross-cutting

**Absorber assignments made (per advisor):**
- specify-product: Patterns 1-9 of discover-product, all 3 of discover-product-opportunity
- design-exp: Patterns 1-7 of plan-roadmap
- build-arch: Patterns 1-8 of prepare-architecture

**Borderline inclusions:**
- Three-axis profile derivation cascade lives in `draft-product-vision` (the skill, not the play). Captured under discover-product because the play orchestrates it. Flagged in open questions whether the new specify-product should keep it inside the draft skill or extract a stand-alone `derive-project-profiles` skill.
- Time-bucketing schema lives in `epic-schema.md`, not in plan-roadmap intent.yaml. Captured because it is load-bearing for plan-roadmap and would be lost if not.
- Library vs product type bifurcation included even though it could look like Meridian boilerplate — the budget changes and validation criteria change in non-trivial ways.

**Key open questions for new-play intent crafting (5 items in the report):**
1. Should `decision_points` be generated by the drafting agent or by a separate diff skill?
2. Should profile derivation move out of draft-product-vision into a stand-alone skill?
3. Should the pre-lock resolution gate be extracted as a shared `enforce-pre-lock-gate` skill?
4. Should feasibility.yaml stay separate or collapse into roadmap.yaml?
5. Should architecture decisions migrate to free-standing ADR files or stay inline in architecture.yaml?

**Critical files I read for this task (absolute paths):**
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/plays/discover-product/reference/intent.yaml`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/plays/discover-product/SKILL.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/plays/plan-roadmap/reference/intent.yaml`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/plays/plan-roadmap/SKILL.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/discover-product-opportunity/SKILL.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/plays/prepare-architecture/reference/intent.yaml`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/plays/prepare-architecture/SKILL.md`

Plus dependent skills consulted to understand delegated logic:
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/draft-product-vision/SKILL.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/draft-product-vision/schemas/product.yaml`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/validate-product-vision/SKILL.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/scope-roadmap-epics/SKILL.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/scope-roadmap-epics/reference/epic-schema.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/assess-feasibility/SKILL.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/draft-roadmap/SKILL.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/validate-roadmap/SKILL.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/draft-technical-approach/SKILL.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/draft-technical-approach/schemas/architecture.yaml`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/draft-technical-approach/schemas/quality-standards.yaml`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/draft-quality-standards/SKILL.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/skills/validate-architecture-design/SKILL.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/memory/knowledge/product/_index.md`
- `/Users/kapilahuja/cto/builder/meridian-os/core/components/memory/knowledge/arch/_index.md`

### Critical Files for Implementation
The 5 most critical files for the parent agent to absorb when writing this pattern capture file (and when crafting intent for the three new plays):
- /Users/kapilahuja/cto/builder/meridian-os/core/components/plays/discover-product/reference/intent.yaml
- /Users/kapilahuja/cto/builder/meridian-os/core/components/plays/plan-roadmap/reference/intent.yaml
- /Users/kapilahuja/cto/builder/meridian-os/core/components/plays/prepare-architecture/reference/intent.yaml
- /Users/kapilahuja/cto/builder/meridian-os/core/components/skills/scope-roadmap-epics/reference/epic-schema.md
- /Users/kapilahuja/cto/builder/meridian-os/core/components/skills/draft-product-vision/SKILL.md

