## What this change does

`/shape` has always written **persona** and **journey** records into the product model.
A journey record is `persona_ref + surface_refs + steps` — a person, a surface, and the
ordered steps they take. That is a user flow.

No play ever read them. So when #548 gave the UX lens a Flows section, `/ux` invented flows
that already existed in the model.

Here is a real one, from the griffin project — the exact slice whose `ux.md` exposed this:

```yaml
journey:
  id: journey-collector-onboarding-and-upload
  persona_ref: engineer
  surface_refs: [surface-collector-cli]
  steps:
    - "Open the collector CLI and complete setup with ... token, roots, exclusions, schedule."
    - "Run preview and inspect the exact scrubbed payload and source warnings without uploading."
    - "Run collection, then check status for queue depth, source state, and the latest upload outcome."
```

Two personas, two journeys, six ordered steps — sitting there the whole time. The lens drew
five disconnected screens with no path through them.

## Scope A — personas and journeys become readable grounding

- The `/ux` **hub** now includes the slice's persona and journey records.
- The shared readiness gate (`check_ready_slice.py`, 8 copies) resolves them and **hard-fails**
  on a `persona_ref` that opens no record, or a slice surface reached by no journey. A broken
  reference is a broken hub, never an empty one — the script's existing loud-fail rule.
- Each flow **EXPANDS one journey record**. The journey supplies the persona and the ordered
  steps; `/ux` adds the screen each step happens on, plus the forks, failure path and exit.
- `validate_ux.py --readiness` resolves every flow's `journey_ref` and `persona_ref` against
  the handed-over records. An invented id fails. A journey the lens left undrawn fails too —
  every real path through the slice must be drawn.

The written `ux.md` is **unchanged**: same five sections, same seven flow fields. The journey
id travels in the manifest, so the template and the structural linter never move.

## Scope B — the persona record carries content

A persona was `id, name, description` — one prose sentence doing three jobs. It now also
carries `goals`, `cares_about` and `failure_means`. That last one is the sharpest: what a
miss looks like for that person specifically.

Additive and optional, so existing records stay valid. `/shape` must fill them, and its
validator **warns** when they are absent — warns, not errors, which is what keeps older
records working.

Why it matters beyond UX, in the issue's framing: an intent says what should be true; the
persona says for whom. ICE records already carry `context.persona` refs. Only one half of
that pair was in the model.

## How it was done

Both `/ux` and `/shape` are **intent changes** — each play's `reference/ice.md` was edited
and the play recompiled. Not a hand-patch of a compiled `SKILL.md`.

| | `/ux` | `/shape` |
|---|---|---|
| Linter | PASS, 0 gaps | PASS, 0 gaps |
| Fingerprint | matches its ICE | matches its ICE |
| Elements (C/F/S/REC) | 14/15/7/15 | 15/16/8/16 |

**No element counts moved on either play.** Every existing constraint, failure, scenario and
recovery gained a clause instead of a new one being bolted on.

## Proof, run not claimed

Against the **real griffin model**, read-only:

```
personas: engineer, platform-operator
journeys: collector-onboarding-and-upload (engineer, 3 steps)
          manage-collector-access (platform-operator, 3 steps)
```

A correct manifest passes clean — `resolved_personas: 2, resolved_journeys: 2,
flows_grounded: 2`, zero errors. A manifest naming an invented journey is caught, and so are
both journeys left undrawn.

`/shape`'s validator on griffin's three real personas: **9 warnings, 0 errors** — visible,
not breaking.

The 8 `check_ready_slice.py` edits are additive: existing output keys and exit behaviour
unchanged, so the six other lens plays sharing the script are unaffected.

## One finding, raised by the self-review and fixed

The persona schema had two sentences contradicting each other. One said nothing validates the
new fields — true when written, false once `/shape`'s validator began warning on them. Fixed
in `dfd95fd1`, then re-verified by the reviewer against the validator code rather than the
commit message.

## For the record

- Deployed copies under `.claude/` stay stale until `install-garura` runs after merge.
- Griffin was read-only throughout; its tree is clean.
- Issue #528 (the proposed `/story` play) is about **where** personas are authored. This is
  about nothing being able to read one. Deliberately separate.

## Self-review

# Self-Review — Issue #550

Branch `feature/550-persona-grounding-first-class` vs `main` — 9 commits, 24 files changed (19 source/component files + 5 `.garura/project/issues/550/context/` STM artifacts already accounted for by earlier pipeline steps).

Rules source: `core/components/memory/standards/rules/self-review.md` (base, `is_override: false` — see `resolved-rules.json`, not re-resolved).

## Verdict: PASS

Blocking findings: **0**

One finding was raised, fixed, and re-verified during this review (see below) — it is not carried forward as open.

## Scope checks

| Check | Status | Evidence |
|---|---|---|
| Matches the issue | PASS | Every changed file maps to scope A (persona/journey grounding readable by `/ux`) or scope B (persona record gains content). Work description at `.garura/project/issues/550/context/work-description.txt` matches the diff exactly. |
| No scope creep | PASS | `git diff --name-only main..HEAD` filtered against the stated scope (ux/shape plays + their skills, the 8 `check_ready_slice.py` copies, the product-os schema, `product-os-keeper.md`, STM context) leaves zero unmatched files. `lens/ux.yaml` untouched, confirmed. |
| Reasonable size | PASS | 9 commits, each a coherent concern (schema, validator, play/skill pair per scope, shared script fan-out as one commit, plus the fix commit below). Reviewable in one sitting. |
| No stray artifacts | PASS | No TODO/FIXME/debug prints/commented-out blocks introduced (diff-scanned). All 10 changed `.py` files byte-compile clean. |

## Quality checks

| Check | Status | Evidence |
|---|---|---|
| Tests present | PASS (documented rationale) | No repo-tracked test suite for these scripts (none found under the plays). Logic was traced by hand: `check_readiness()` in `validate_ux.py`, the persona/journey indexing in all 8 `check_ready_slice.py` copies, and the warning-only logic in `validate_shape.py` all read correctly against their own stated contract — flow→journey resolution, journey→persona cross-check, surface coverage, and the this-run-only warning-to-gap distinction (SE-4) are each mechanically sound. |
| Commits are clean | PASS | All 9 commits are conventional (`feat(shape): …`, `feat(ux): …`, `chore(stm): …`, `fix(product-os): …`), each a single concern, each referencing `#550`. |
| No secrets | PASS | Diff scanned for credential/token/key patterns — none. |
| Docs in step | PASS | `product-os-keeper.md`'s `author-ux-lens` row and trigger table were updated to describe the new hub (persona/journey records) and flow behavior (expands one journey). The product-os schema carries an inline migration note for the persona field addition. |
| Nothing obviously broken | PASS | See "Finding — raised and fixed" below: the one self-contradiction found in this file has been corrected and re-verified against the actual validator code. |

## Finding — raised and fixed (commit `dfd95fd1`)

1. **Stale "No validator checks them" line contradicted the migration note right below it — RESOLVED.** `core/components/memory/standards/schemas/product-os/product-os.yaml`, in the "Structured grounding" comment block directly above the `persona:` field additions, read: *"…the writing play (/understand, /shape) fills them. No validator checks them (see the migration note below)."* That was false — `validate_shape.py` does warn on a missing `goals`/`cares_about`/`failure_means` — and it contradicted the corrected migration note a few lines below it in the same file.

   Fixed in `dfd95fd1` — `fix(product-os): correct the last stale claim that nothing validates the new persona fields (#550)`. The sentence now reads: *"Nothing ERRORS on them; /shape's validator WARNS when one is missing (see the migration note below for the full validation truth)."*

   Re-verified directly, not taken on trust:
   - Read the live file at `core/components/memory/standards/schemas/product-os/product-os.yaml` (line ~64) — the false sentence is gone; the new sentence is present exactly as described, and `dfd95fd1` is confirmed on this branch (`git merge-base --is-ancestor dfd95fd1 HEAD`).
   - Checked the new sentence against `core/components/plays/shape/scripts/validate_shape.py` directly: `id`/`name` absence → `errors.append(...)` (line 108); `goals`/`cares_about`/`failure_means` absence → `warnings.append(...)` only (lines 109–114), never `errors`; `ok = not errors` and the exit code (`0 if not errors else 1`) are both driven by `errors` alone, so a missing grounding field never fails the run. `description` and `node_ref` have no check anywhere in the script. All of this matches the new sentence exactly.
   - Compared the new sentence against the migration note further down the same file — both now say the same thing (nothing errors, `/shape`'s validator warns, SE-4 gaps only on a persona this run wrote). No remaining contradiction between the two.
   - Grepped the whole repo (`.md`/`.yaml`/`.py`) for any other "no validator checks / nothing validates / nothing reads / checked by nothing" claim about these three fields. The only surviving match is the migration note's own, correctly-scoped claim that `description` and `node_ref` (not the three new fields) are checked by nothing — which is true and unrelated to the fixed sentence. No stale claim remains anywhere in the touched plays, skills, or schema.

## Points explicitly verified (not assumed)

- **ICE/SKILL fingerprints match.** `sha256:67b7f345…` for ux, `sha256:aa78eaf2…` for shape — both match the `fingerprint` line recorded in each play's `SKILL.md`.
- **`lint_play.py` — 0 gaps on both.** `core/components/plays/ux/SKILL.md` and `core/components/plays/shape/SKILL.md` both PASS all 13 lint checks (sections, failure/scenario/constraint coverage, recovery 1:1, no orphans, pipeline position, model-write position, standard close, pre-flight resolver, stop condition, fingerprint, next-command).
- **No ICE element counts moved.** ux: C14/F15/S7/REC15 — unchanged from main. shape: C15/F16/S8/REC16 — unchanged from main. Full diffs of both `reference/ice.md` files confirm only existing clauses (ux: C1, C7, F1, S3, REC1, REC15; shape: C5, F5, S1, REC5) gained language — no new numbered ID was introduced anywhere.
- **The 8 `check_ready_slice.py` edits are additive.** Every copy initializes `out` with `"personas": []` / `"journeys": []` alongside the pre-existing `ok`/`errors`/`slice_id` keys up front, before any early-exit path, so no consumer can KeyError on the new keys. The pre-existing keys and exit-code semantics (0 ready / 1 not ready / 2 usage) are untouched. Note: the grill copy carries different baseline logic (its own REALIZED-gate precondition, pre-existing on `main`) — the persona/journey addition layers on top of that baseline identically to the other 7 copies; confirmed by diffing grill's `main..HEAD` change in isolation.
- **The new checks fire correctly (logic-verified).** `check_readiness()` in `validate_ux.py` requires every manifest flow to name a resolvable journey id and persona id, cross-checks that the named persona is the one the journey record itself serves, and separately requires every resolved journey to be expanded by at least one flow (uncovered-journey case) — matching C14/F15 as written. The per-lens `check_ready_slice.py` copies index persona/journey records via a recursive glob keyed on the record's own `id` (not filename), then hard-fail on a `surface[].persona_ref` that opens nothing and on a surface reached by no journey — matching C1/F1 as written.
- **Nothing outside the stated scope was touched.** Full file-list diff against the described scope (ux/shape plays + reference/skills, 8 `check_ready_slice.py` copies, `product-os.yaml`, `product-os-keeper.md`, STM context) leaves no unaccounted file. `lens/ux.yaml` confirmed untouched.

## Project notes (recorded, not flagged as defects)

- **Migration note states the validation truth accurately, and now agrees with the inline comment above it.** The dedicated "Migration note" block in `product-os.yaml` (`# ---- Migration note: structured persona grounding (issue #550) ----`) states: `validate_shape.py` errors only on `id`/`name`; `description`/`node_ref` are checked by nothing; the three new fields are warnings only; SE-4 turns a warning into a gap only for a persona the current run wrote; nothing else reads them. This matches the actual `validate_shape.py` code exactly, and — after `dfd95fd1` — the inline comment above the fields says the same thing.
- **`lens/ux.yaml` untouched** — confirmed, not part of this diff.
- **Deployed `.claude/` copies are intentionally stale** until `install-garura` runs post-merge — not evaluated as part of this diff.
- **Hand-compiled SKILL.md, play-editor convergence still pending.** Both `ux/SKILL.md` and `shape/SKILL.md` carry an explicit in-file note that the `compiled_by` line names play-editor for provenance only — no interactive play-editor run actually occurred, and convergence between the hand-compiled SKILL and what play-editor would emit from `reference/ice.md` is unverified. This mirrors the pattern already in place for #498/#500/#467/#466 and the other plays migrated earlier on this same branch (`/vision`, `/grill`, `/learn`), so it is a pre-existing, disclosed condition of this repo's current migration state rather than something #550 introduced. `lint_play.py` passes independently of this (it checks the SKILL's internal structure, not SKILL-vs-ICE convergence), so it does not block this review, but it is the one open item the plays' own close-block notes call out as still required.

---

Closes #550
