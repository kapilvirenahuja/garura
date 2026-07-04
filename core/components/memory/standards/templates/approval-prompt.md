# Approval Prompt Format

Canonical format for human-approval checkpoints that use the Tether / Orbit / Vanish response protocol. Every play that gates on user approval instantiates this format instead of inlining its own prompt text.

Consumers: `specify`, `design`, `arch`, every checkpoint-gated play.

## Shape

```markdown
## {Stage Title} — {product or issue slug}

{Brief summary — 3-7 lines. Surface what the user needs to decide on.
Include counts, names, or quantified summary data. Never paste the full
artifact here; point at the file path instead.}

**Artifacts under review:**
- `{path/to/primary-artifact}` — {one-line description}
- `{path/to/secondary-artifact}` — {one-line description}
{add more paths as needed}

{Optional context block — 3-5 lines. Call out anything that deviates from
the default path, e.g. "Orbit cycle 2 — user asked for X on previous
Tether attempt" or "2 capabilities flagged provisional STM-sourced".}

---

Type **Tether** to proceed, **Orbit** with feedback to re-run {this stage},
or **Vanish** to cancel.
```

## Field rules

| Field | Rule |
|-------|------|
| Stage title | Sentence case. Names the specific stage the user is approving (e.g. "Market Brief", "Domain Selection", "Intent Epics"). Never generic ("Review", "Checkpoint"). |
| Product / issue slug | The slug from the play's context. Appears in every checkpoint of the same run so the user can correlate. |
| Brief summary | 3-7 lines. Quantified if possible ("12 selected capabilities, 2 rejected, 4 pending"). Must NOT inline the artifact — users open the file for detail. |
| Artifact paths | Full workspace-relative paths. Each with a one-line description. Links are the review surface. |
| Context block | Optional. Use it when the current checkpoint is a retry / Orbit cycle, when validation surfaced warnings, or when the user needs to know something non-obvious. |
| Response instruction | Always the literal `Type **Tether** to proceed, **Orbit** with feedback to re-run {this stage}, or **Vanish** to cancel.` (substitute `{this stage}` only if re-run targets a specific step rather than the whole stage). |

## Response parsing

The play parses the user response with this protocol:

| Input | Meaning | Action |
|-------|---------|--------|
| `Tether` / `tether` / `t` | Approved | Update checkpoint status to `APPROVED`, proceed to next step |
| `Vanish` / `vanish` / `v` | Rejected | Update checkpoint status to `REJECTED`, invoke Vanish recovery (branch / artifact cleanup per play intent), halt |
| `Orbit` / `orbit` / `o` followed by feedback text | Cycle-back with feedback | Collect the feedback, mark the checkpoint `ORBIT_FEEDBACK`, re-dispatch the producing step(s) with the feedback as additional context |
| Anything else | Ambiguous | Clarify: "I need a Tether / Orbit / Vanish response. {re-render prompt}" |

**Do NOT use `AskUserQuestion` for checkpoints.** Output the prompt text and wait for the typed response. `AskUserQuestion` is for structured single-choice interactions, not for Tether/Orbit/Vanish gates. This is a global rule from CLAUDE.md.

## Gate switch (#466, three kinds per #467)

Before rendering, resolve the checkpoint's switch per `standards/rules/gate-config.md`
(first match wins):

0. **Pinned** (declared in the play: `class: <class>, pinned`) → always render and wait.
   No config value, policy, or ledger can turn a pinned gate off.
1. `gates.plays.<play>` — explicit per-play override.
2. **Conditional plays only** (the eleven document plays — vision, understand, shape,
   roadmap, and the seven realize lenses): consult the learned policy —
   `classify_change.py` names the change's shape key; a shape in the policy's `auto:`
   block (and not in `never_auto:`) → **auto-pass**; anything else → on. A draft
   carrying ANY blocking finding (lint gap, grounding-eval fail) → on, regardless of
   policy.
3. `gates.classes.<the class this checkpoint declares>` — each checkpoint declares its
   risk class in the compiled play (`class: docs-only | standard | one-way-door`;
   undeclared ⇒ standard).
4. `gates.default` → absent ⇒ on.

- **on** → render and wait, exactly as above. Afterwards, a conditional play appends the
  live-eval line (`gate_eval.py append`): shape, `predicted: gate`, and the human's real
  action (`approved_clean` | `approved_edited` | `rejected`).
- **auto-pass** (conditional plays) → do NOT wait: record `gate auto-passed by learned
  policy (shape: <shape-key>, policy v<version>)` as a Checkpoint Decisions row, include
  the draft's diff summary in the run record, append the ledger line
  (`predicted: auto, human: auto_pass`), and proceed. An auto-pass is always visible in
  the run record — never silent.
- **off** → do NOT wait: record `gate skipped by config (<resolution path>)` as a
  Checkpoint Decisions row in the evidence file and proceed. A skip is always visible in
  evidence — never silent.

The switch gates human checkpoints ONLY. Pre-flight halts, sensitive-file blocks,
stop-condition gates, and eval failures are machine walls and never resolve here.

## Examples

### Stage 1 market review (specify)

```markdown
## Market Brief — graveyard-crew

**TAM / SAM / SOM:** $18B / $2-3B / $15-30M (4 insufficient-data markers — category is nascent)
**Competitors mapped:** 6 (Karpathy autoresearch, Vercel Optimize, Unbounce, Jasper, Claude Projects, W&B/Comet)
**Top market gaps:** no autoresearch-for-artifacts platform, no autonomous overnight loop on artifact quality, no pluggable deterministic scoring
**Top risks:** category-creation risk, regulatory risk (minimal v1), cost risk (LLM overnight spend)

**Artifacts under review:**
- `.garura/product/specification/market-brief.md` — full brief with TAM/SAM/SOM, competitive matrix, risks, sources

---

Type **Tether** to proceed, **Orbit** with feedback to re-run Stage 1, or **Vanish** to cancel.
```

### Vanish cleanup (example — a planning-style play)

```markdown
## Plan Review — #214 build product planning and design pipeline

**Specification:** 23 tasks across 7 sub-issues, sequential execution
**Verification:** 12 acceptance criteria, 4 edge cases
**Execution:** dependency graph T1→T3, T2→T4, ...

**Artifacts under review:**
- `.garura/project/issues/214/specs/spec.md`
- `.garura/project/issues/214/specs/verify.md`
- `.garura/project/issues/214/specs/tasks.md`

---

Type **Tether** to proceed, **Orbit** with feedback to re-run planning, or **Vanish** to cancel.
```

## Related

- `checkpoint.md` — the artifact file the play writes alongside the prompt
- `delivery-report.md` — the final report a play emits at close (different from a checkpoint)
