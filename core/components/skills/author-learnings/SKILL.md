---
name: author-learnings
description: 'Read a delivered unit''s real outcomes — the measure lens (baseline/target/realized), the validate verdicts and fix reports, the run lens (production actuals), and the delivered epic/slice status — against the current product model, and author the MEANING updates the delivery taught — a refined capability/functionality one_line, a raised nfr_needs level (monotonic-up), an earned status promotion, the grounding-doc sections the learning changed, and a new append-only decision per material learning. Each proposed change carries the outcome that justifies it and a confidence tier. Writes the rewritten grounding docs STRAIGHT to the live model (per-node docs only) and emits the spine meaning-field deltas and the decision records as structured data in an STM learn-manifest.yaml — never the shared model files (_spine.yaml, profile, decisions), never the tree skeleton, never a slice/epic entry. Generative artifact production for the /learn play.'
version: 0.2.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-learnings

Turns a **delivered unit's real outcomes** into the updates that keep the living product
model honest. After a unit ships, the pipeline has already produced the evidence — the measure lens
(each metric's baseline → target → realized + proof), the validate verdicts and fix reports (which
gates truly cleared; a `fix_required` is a model-was-wrong signal), the run lens (production actuals
vs planned), and the delivered epic/slice status. This skill reads that evidence against what the
model *claimed*, and authors the precise **meaning** updates the delivery taught — never the tree
skeleton, never a slice or epic entry. It is the close of the loop the old enrich gate used to be.

## Write discipline (ADR 026, direct-model-write)

This skill writes ONLY the per-node grounding docs (`capability.md`, `functionality.md`, and the
slice `lens/{measure|run|quality}.md`) — each its own file — **straight to the live model** under
`<product_base>/product-os/…`. It NEVER writes any shared model file: not `_spine.yaml`, not the
`profile` block, not a `decisions/` record. Every shared-file mutation is emitted as **structured
data in the STM `learn-manifest.yaml`** — the spine meaning-field deltas in `changes:` and the full
decision records in `decisions:` — for /learn's deterministic keyed persist (`persist_learn.py`) to
apply in place after the human checkpoint. /learn runs the shape linter and the content-quality eval
over the live docs, then the scoped-write guard over the full delta, before the checkpoint; nothing
is committed until the gate resolves.

## What it produces

The rewritten grounding docs at their live paths, plus a human-reviewable `learn-manifest.yaml`
listing every proposed change with its **outcome citation** and a **confidence** tier. Each rewritten
grounding doc conforms to its locked template (`standards/schemas/product-os/grounding/…`) and must
clear the linter (shape) and the content-quality eval (meaning). The manifest is the machine-checkable
contract `validate_learn.py` (pre-checkpoint) and `persist_learn.py` (the keyed persist) read — every
change carries an outcome, every nfr move is monotonic-up, every status promotion is earned, every
decision is a new accepted record carrying all its own fields.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `issue` | yes | The delivered unit's issue (display + decision provenance). |
| `unit` | yes | The resolved unit from `check_ready_unit` — `{issue, epics[], slices[]}`. |
| `outcomes` | yes | The outcome-evidence paths from `check_ready_unit` — `{measure_lenses[], run_lenses[], validate[], delivered_epics[], delivered_slices[]}`. Read these; they are what the delivery actually showed. |
| `spine` | yes | Path to the live spine (`product-os/_spine.yaml`) — read-only, for the current claims and the node ids. |
| `product_base` | yes | Product model root — to READ the affected nodes' grounding docs and resolve a prior decision a learning may supersede, and to WRITE the rewritten per-node grounding docs in place under `product-os/…`. |
| `manifest_path` | yes | Output path under STM for the `learn-manifest.yaml` (the proposed-change contract — spine deltas + decision records as structured data). |

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
6. **Write the live docs; emit the shared-file deltas as manifest data.** Write each rewritten
   grounding doc **straight to its live path** under `<product_base>/product-os/…` (per template) —
   these are the only files this skill writes. Emit every spine meaning-field change in the manifest's
   `changes:` block and every new decision as a full record in the manifest's `decisions:` block
   (carrying `reason`, `alternatives`, and `level` — `persist_learn.py` builds the `decisions/<id>.yaml`
   record from these). Write `learn-manifest.yaml` to `manifest_path`. NEVER write `_spine.yaml`, the
   `profile` block, or a `decisions/` record — those are the keyed persist's job.

## Output

The rewritten grounding docs, at their live paths:

```
<product_base>/product-os/{domain}/…
  capability.md | functionality.md                  # a rewritten grounding doc (only changed ones)
  slices/{slice}/lens/{measure|run|quality}.md       # a rewritten lens doc (only changed ones)
```

and the STM manifest at `manifest_path`:

`learn-manifest.yaml` — field-for-field what `validate_learn.py` and `persist_learn.py` read:

```yaml
changes:                                              # spine meaning-field changes
  - node_ref: cap-source-coverage                     # the spine node id
    node_kind: capability                             # capability | functionality | profile
    field: nfr_needs                                  # one_line | nfr_needs | status
    dimension: performance                            # required when field == nfr_needs
    from: medium                                      # current value (level for nfr_needs; state for status)
    to: high                                          # proposed value (monotonic-up for nfr; earned for status)
    outcome: "run.md: production p95 480ms vs target 150ms — performance underscoped"
    confidence: high                                  # high | low
docs:                                                 # grounding docs rewritten in place (live paths)
  - rel: product-os/token-dash/slices/slice-trusted-coverage/lens/measure.md
    outcome: "measure: coverage 100% realized; render p95 1.9s vs <2s — both confirmed"
decisions:                                            # NEW append-only decision records (full data)
  - id: dec-learn-source-coverage-perf-high
    node_ref: cap-source-coverage
    level: product                                    # product | ... (persist writes it into the record)
    title: "Source-coverage performance must be high — production load proved medium underscoped"
    reason: "Run lens recorded p95 480ms at 100 concurrent users; the profile target is 150ms. The medium level set pre-delivery did not survive real load."
    alternatives:
      - name: "keep nfr_needs.performance: medium"
        why_not: "Realized production load shows the target is unreachable at medium without an architecture change."
    supersedes:                                       # optional: the accepted decision id this overturns
    outcome: "run.md: p95 480ms at 100 users; profile target 150ms unmet without redesign"
```

`persist_learn.py` builds each `decisions/<id>.yaml` record from the manifest `decisions:` entry
(stamping `decided_by`/`date`/`status: accepted`), so `title`, `reason`, `alternatives`, and `level`
MUST be present in the manifest — there is no draft decision file to fall back on.

Return the contract with the live doc paths and the `learn-manifest.yaml` path — paths, never
inline content.

## Rules

- **Outcome-grounded.** Every proposed change, doc rewrite, and decision carries an `outcome` citation
  that traces to a real signal (measure / validate / run / delivered status). No outcome → drop it.
- **Meaning only, never the skeleton.** Propose changes ONLY to `one_line`, `nfr_needs` level,
  earned `status`, the listed grounding sections, and new decisions. NEVER rename or re-parent a
  domain/capability/functionality, NEVER rewrite a slice or epic entry, NEVER edit an accepted
  decision in place — those are rejected by `validate_learn.py` / the keyed persist.
- **Monotonic-up.** An `nfr_needs` level may only rise; a raised profile nfr (a box-move) carries a
  decision.
- **Earned status.** Promote a status only to an earned state the outcome proves; never advance a
  `fix_required` — carry it as a grounding refinement instead.
- **Append-only decisions.** Every material learning is a NEW decision (status `accepted`); a learning
  that overturns a prior decision names what it `supersedes`, never edits the old record.
- **Template-true.** Each rewritten grounding doc conforms to its locked template and must clear the
  linter + the content eval — every section self-explaining, never thinned.
- **Docs to live, shared-file deltas as manifest data.** Write ONLY the per-node grounding docs to
  their live paths; emit the spine meaning-field changes and the full decision records as structured
  data in `learn-manifest.yaml`. Never write `_spine.yaml`, the `profile` block, or a `decisions/`
  record — the keyed persist owns those.
```
