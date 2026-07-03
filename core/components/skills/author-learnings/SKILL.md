---
name: author-learnings
description: 'Read a delivered unit''s real outcomes — the measure lens (baseline/target/realized), the validate verdicts and fix reports, the run lens (production actuals), and the delivered epic/slice status — against the current product model, and draft the proposed MEANING updates the delivery taught — a refined capability/functionality one_line, a raised nfr_needs level (monotonic-up), an earned status promotion, the grounding-doc sections the learning changed, and a new append-only decision per material learning. Each proposed change carries the outcome that justifies it and a confidence tier. Writes a draft learn-manifest.yaml plus the rewritten grounding docs and decision records under the STM draft dir — never the live model, never the tree skeleton, never a slice/epic entry. Generative artifact production for the /learn play.'
version: 0.1.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-learnings

Turns a **delivered unit's real outcomes** into the proposed updates that keep the living product
model honest. After a unit ships, the pipeline has already produced the evidence — the measure lens
(each metric's baseline → target → realized + proof), the validate verdicts and fix reports (which
gates truly cleared; a `fix_required` is a model-was-wrong signal), the run lens (production actuals
vs planned), and the delivered epic/slice status. This skill reads that evidence against what the
model *claimed*, and drafts the precise **meaning** updates the delivery taught — never the tree
skeleton, never a slice or epic entry. It reads the model read-only and writes a draft; /learn's
checkpoint and apply step persist it. This is the close of the loop the old enrich gate used to be.

## What it produces (the draft only)

A human-reviewable `learn-manifest.yaml` listing every proposed change with its **outcome citation**
and a **confidence** tier, plus the rewritten grounding docs and any new decision records. Each
rewritten grounding doc conforms to its locked template
(`standards/schemas/product-os/grounding/...`) and must clear the linter (shape) and the
content-quality eval (meaning) — /learn runs both over the draft before the checkpoint. The manifest
is the machine-checkable contract `validate_learn.py` (pre-checkpoint) and, after apply,
`check_apply_learn.py` assert against — every change carries an outcome, every nfr move is
monotonic-up, every status promotion is earned, every decision is a new accepted record.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `issue` | yes | The delivered unit's issue (display + decision provenance). |
| `unit` | yes | The resolved unit from `check_ready_unit` — `{issue, epics[], slices[]}`. |
| `outcomes` | yes | The outcome-evidence paths from `check_ready_unit` — `{measure_lenses[], run_lenses[], validate[], delivered_epics[], delivered_slices[]}`. Read these; they are what the delivery actually showed. |
| `spine` | yes | Path to the live spine (`product-os/_spine.yaml`) — read-only, for the current claims and the node ids. |
| `product_base` | yes | Product model root — to read the affected nodes' grounding docs (read-only) and to resolve a prior decision a learning may supersede. |
| `draft_dir` | yes | Output folder under STM for the draft (manifest + rewritten docs + decision records). |

## Procedure

Reasoning (what the outcome actually taught, and which claim it confirms or refutes) is yours.
Outcome-grounding, the allowlist, and template/eval conformance are non-negotiable.

1. **Read the outcomes.** Load each `measure.md` (did the metric move from baseline to target, with
   real proof?), each `run.md` (what production actually needed vs planned), every validate verdict +
   fix report (which gates cleared; read a `fix_required` as the model being wrong about a boundary or
   rule), and the delivered epic/slice status. Note, per signal, what it teaches.
2. **Read the claims.** Load the spine and the affected nodes' grounding docs — `capability.md`
   (benefit hypothesis, boundaries), `functionality.md` (acceptance, rules), and the slice's lens docs
   — to see what the model claimed before delivery.
3. **Diff reality against the claim.** For each gap the evidence proves, decide the smallest honest
   update on the **allowed** surface only:
   - spine `one_line` — a capability/functionality descriptor delivery showed too thin or wrong;
   - spine `nfr_needs` level — raise (monotonic-up only) when production proved a higher level needed;
     a raised *profile* nfr is a box-move and MUST carry a decision;
   - spine `status` — an EARNED promotion only (proposed → active when proven; to validated/delivered
     where the outcome earns it). NEVER advance a `fix_required` — that becomes a grounding refinement;
   - grounding sections — refresh only what the learning changed: a capability's **benefit hypothesis**
     (confirmed/refuted) and **boundaries**, a functionality's **acceptance** and **rules &
     behavior**, and the **measure / run / quality** lens docs with the real results;
   - a decision — every material learning becomes a NEW append-only decision record.
4. **Ground every change.** Each proposed change, doc rewrite, and decision carries a non-empty
   `outcome` citation naming the signal that justifies it (e.g. "measure: render p95 1.9s vs target
   <2s — confirmed"; "validate fix_required: privacy gate caught raw-log leak — boundary missed").
   A change with no outcome is dropped, not guessed.
5. **Tier by confidence.** `high` for a change a single clear outcome proves; `low` for an inferred or
   partial signal — /learn surfaces low-confidence changes one by one at the checkpoint.
6. **Write the draft.** Write the rewritten grounding docs to their lens/grounding paths under
   `draft_dir` (per template), write each decision record under `draft_dir/.../decisions/{id}.yaml`,
   and write `learn-manifest.yaml`. Drafts only — never touch the live model.

## Output — the draft

```
{draft_dir}/
  product-os/{domain}/...
    capability.md | functionality.md                 # a rewritten grounding doc (only changed ones)
    slices/{slice}/lens/{measure|run|quality}.md      # a rewritten lens doc (only changed ones)
    decisions/{decision-id}.yaml                      # a new decision record (append-only)
  learn-manifest.yaml                                 # the proposed-change contract
```

`learn-manifest.yaml` — field-for-field what `validate_learn.py` reads:

```yaml
changes:                                              # spine meaning-field changes
  - node_ref: cap-source-coverage                     # the spine node id
    node_kind: capability                             # capability | functionality | profile
    field: nfr_needs                                  # one_line | nfr_needs | status
    from: medium                                      # current value (level for nfr_needs; state for status)
    to: high                                          # proposed value (monotonic-up for nfr; earned for status)
    outcome: "run.md: production p95 480ms vs target 150ms — performance underscoped"
    confidence: high                                  # high | low
docs:                                                 # rewritten grounding docs
  - rel: product-os/token-dash/slices/slice-trusted-coverage/lens/measure.md
    outcome: "measure: coverage 100% realized; render p95 1.9s vs <2s — both confirmed"
decisions:                                            # NEW append-only decision records
  - id: dec-learn-source-coverage-perf-high
    node_ref: cap-source-coverage
    title: "Source-coverage performance must be high — production load proved medium underscoped"
    supersedes:                                       # optional: the accepted decision id this overturns
    outcome: "run.md: p95 480ms at 100 users; profile target 150ms unmet without redesign"
```

Each `decisions/{id}.yaml` record (the issue's decision model — `/learn` stamps `decided_by`/`date`):

```yaml
decision:
  id: dec-learn-source-coverage-perf-high
  node_ref: cap-source-coverage
  title: "Source-coverage performance must be high — production load proved medium underscoped"
  reason: "Run lens recorded p95 480ms at 100 concurrent users; the profile target is 150ms. The medium level set pre-delivery did not survive real load."
  alternatives:
    - name: "keep nfr_needs.performance: medium"
      why_not: "Realized production load shows the target is unreachable at medium without an architecture change."
  status: accepted
  supersedes:                                         # the accepted decision id this overturns, if any
```

Return the enriched contract with `draft_dir` and the `learn-manifest.yaml` path — paths, never
inline content.

## Rules

- **Outcome-grounded.** Every proposed change, doc rewrite, and decision carries an `outcome` citation
  that traces to a real signal (measure / validate / run / delivered status). No outcome → drop it.
- **Meaning only, never the skeleton.** Propose changes ONLY to `one_line`, `nfr_needs` level,
  earned `status`, the listed grounding sections, and new decisions. NEVER rename or re-parent a
  domain/capability/functionality, NEVER rewrite a slice or epic entry, NEVER edit an accepted
  decision in place — those are rejected by `validate_learn.py` / `check_apply_learn.py`.
- **Monotonic-up.** An `nfr_needs` level may only rise; a raised profile nfr (a box-move) carries a
  decision.
- **Earned status.** Promote a status only to an earned state the outcome proves; never advance a
  `fix_required` — carry it as a grounding refinement instead.
- **Append-only decisions.** Every material learning is a NEW decision (status `accepted`); a learning
  that overturns a prior decision names what it `supersedes`, never edits the old record.
- **Template-true.** Each rewritten grounding doc conforms to its locked template and must clear the
  linter + the content eval — every section self-explaining, never thinned.
- **Drafts only.** Write under `draft_dir`; never touch the live model.
```
