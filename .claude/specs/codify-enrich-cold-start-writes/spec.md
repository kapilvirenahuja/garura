# ICE Spec — Codify→Enrich Cold-Start Writes

| Field | Value |
|-------|-------|
| name | codify-enrich-cold-start-writes |
| version | 0.1.0 |
| status | draft — awaiting approval |
| primary fix locus | `core/components/skills/normalize-proposals-for-enrichment/SKILL.md` (codify mapping) |
| change kind | non-intent skill edit (direct edit + `/sync-claude`); no play rebuild |
| optional second intent | `core/components/plays/enrich/reference/intent.yaml` (play intent change + `/create-play --build enrich`) |

This spec is written as **ICE** — Intent, Context, Expectations. Expectations are
the validation layer and are expressed in the canonical intent vocabulary:
**C** = constraints (falsifiable boundaries), **F** = failure conditions
(observable failure states), **S** = scenarios (end-to-end acceptance).

---

## I — Intent

`codify` extracts the details from a codebase and stages them in short-term
memory. When `enrich` then runs against short-term memory that holds `codify`
output, it must **either create or enrich** — per file — **the exact same set of
files** that `specify`, `design`, and `arch` generate.

"Create or enrich" is per file, decided by what is already on disk: if the target
file does not exist yet, create it; if it exists, enrich it (or supersede it when
it is a locked conflict). Either way, every approved proposal lands at its target
path. The end state is parity with the forward plays — the same relative paths
and filenames product memory uses — subject only to reviewer approval and to
frontend detection for the design files.

This holds in both directions: a cold bootstrap (nothing on disk → all created)
and a re-run over partially-populated memory (some created, some enriched). No
file in the `specify`/`design`/`arch` set may be left unwritten.

---

## C — Context

The situation the fix lives inside. These are facts about the current flow, and
the boundary the fix may not cross.

**The flow.** `codify` is the brownfield bootstrap. At the moment it runs, the
product memory tree is empty. `codify` only stages proposals into short-term
memory; `enrich` is the single gate that promotes them into product memory.

**The tier label.** Each inferred file is staged with a tier (1, 2, or 3). In
`codify`, tier classifies the **type** of artifact (architecture and profile are
tier 1; scope, features, epics, quality, research, market brief are tier 2;
experience/design files are tier 3). Tier here is a category label, not a measure
of how big a change is.

**Where it breaks.** A translator step (`normalize-proposals-for-enrichment`)
turns each proposal's tier into a write instruction, using a fixed map:
tier 3 → `add` (create), tier 2 → `modify` (patch), tier 1 →
`contradict_with_adr` (supersede). The writer (`apply-ltm-enrichment`) only
creates a new file on `add`. `modify` and `contradict_with_adr` both assume the
target already exists, and neither has a create-on-missing contract.

**The consequence on cold start.** Because product memory is empty, only the
tier-3 design files (mapped to `add`) are created. The entire structural core —
architecture, scope, features, epics, quality profile, market brief, research,
project profile — is told to patch or supersede a file that does not exist.

**Root cause.** The tier→action map carries the meaning tier has in the everyday
learning loop (`reap`), where tier reflects change magnitude against memory that
**already exists** (ADR-worthy / enrichment / addition). In `codify` that meaning
is false: on a bootstrap, nothing exists yet, so every file is a creation.

**Why it is silent.** The writer is model-executed, so a missing-target write is
not a deterministic crash — but success is not contracted either. And `enrich`'s
archive gate only blocks on `verification_failed` or `malformed` entries, not on
plain `failed` writes. So a half-populated bootstrap still archives and reports
done.

**The boundary the fix must not cross.** Two of the four proposal sources —
`distill` and `reap` — carry only a *fragment* of change, not a whole file. If
those were ever told to `add` a missing file, the fragment would be written as if
it were the entire file, corrupting it. So existence-based creation may apply
**only to sources that carry a complete file body**: `codify` (full body) and
`decode` (full spec body — already defaults to `add` for new specs). `distill`
and `reap` mapping is out of scope and must stay as-is.

---

## E — Expectations (the validation layer)

### Constraints (C)

- **C1** — For a `codify`-sourced proposal whose `target_path` does not exist
  under `product_base`, the normalized `action` is `add`.
- **C2** — For a `codify`-sourced proposal whose `target_path` exists under
  `product_base` and carries no `adr_draft_path`, the normalized `action` is
  `modify`.
- **C3** — For a `codify`-sourced proposal whose `target_path` exists under
  `product_base` and carries an `adr_draft_path`, the normalized `action` is
  `contradict_with_adr`.
- **C4** — Action selection reads target existence relative to `product_base`;
  `product_base` is a declared input of the translator skill.
- **C5** — The existence-based rule applies only to `codify`-sourced proposals.
  `distill` and `reap` action mapping is byte-for-byte unchanged by this fix.
- **C6** — The change is confined to `normalize-proposals-for-enrichment`. The
  writer's `add` / `modify` / `contradict_with_adr` semantics are not modified.

### Failure conditions (F)

- **F1** — A cold-start `codify` reconciliation file in which any
  structural-core proposal (architecture, scope, enriched-capabilities, features,
  epics, quality-profile, market-brief, mvp-recommendation, research,
  project-profile, domain-selection) carries `action: modify` or
  `action: contradict_with_adr` while its target is absent from `product_base`.
- **F2** — After `enrich` applies an all-approved cold-start `codify` run, any
  approved proposal's target file is absent from `product_base`.
- **F3** — A `distill`- or `reap`-sourced proposal targeting a missing file is
  assigned `action: add` (regression — a fragment written as a whole file).
- **F4** — The enrichment report records a `failed` write for an approved
  `codify` proposal whose target was missing (the pre-fix outcome).

### Scenarios (S)

- **S1** — *Cold bootstrap.* A maintainer runs `codify` on a brownfield repo
  with empty product memory, approves all proposals, and runs `enrich`. **Then:**
  product memory contains every inferred artifact at its `specify`/`design`/`arch`
  -equivalent path; the file set equals what the forward plays would have produced
  (minus frontend-gated design files when no frontend is detected).
- **S2** — *Incremental re-run.* A maintainer runs `codify` on a product whose
  memory already holds some files, approves all, and runs `enrich`. **Then:**
  existing files are patched or superseded as before, missing files are created,
  and no file is lost.
- **S3** — *Everyday loop unchanged.* A maintainer runs the normal learning loop
  where a `reap` proposal targets an existing artifact. **Then:** it is patched
  exactly as before — this fix changes nothing on that path.

---

## Fix shape (for implementation)

Replace the `codify` action rule in `normalize-proposals-for-enrichment`
(currently pure tier→action) with existence-based selection:

```
resolve target = product_base + target_path
if target does not exist        → action = add
else if entry has adr_draft_path → action = contradict_with_adr
else                            → action = modify
```

Add `product_base` to the skill's documented Input contract (the `enrich` play
already passes it in the Step 2 JSON contract — this only makes the dependency
explicit). The skill already holds read access to the product memory folder, so
the existence check sits inside its current boundary.

Deploy with `/sync-claude`; verify with `lint-components`.

---

## Intent 2 — Safety net (optional; decide separately)

This is a **play intent change**, not a skill edit. It touches what `enrich`
*guarantees*, so it goes through `enrich/reference/intent.yaml` →
`/create-play --build enrich`.

**Intent.** `enrich` must not archive an issue while any approved proposal failed
to land in product memory.

**Expectations.**
- **C(new)** — The archive step proceeds only when the enrichment report shows
  zero approved entries with status other than `applied` (extends the current
  gate, which blocks only on `verification_failed` and `malformed`).
- **F(new)** — The issue short-term memory is archived while the enrichment
  report records any approved proposal with `status != applied`.
- **S(new)** — A maintainer runs `enrich` and one approved write fails. **Then:**
  the issue is left in the active area, the failure is visible, and a re-run can
  retry — the issue is never silently archived half-written.

The core fix (Intent above) makes the writes succeed. This safety net guarantees
that a future silent failure can never pass unnoticed. Independent of the core
fix; ship either, both, or in sequence.
