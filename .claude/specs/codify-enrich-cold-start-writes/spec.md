# ICE Spec — Codify→Enrich Cold-Start Writes

| Field | Value |
|-------|-------|
| name | codify-enrich-cold-start-writes |
| version | 0.3.0 |
| status | draft — awaiting approval |

This spec is written as **ICE** — Intent, Context, Expectation
(`docs/philosophy/intent-driven-development.md`, "The ICE Structure"). Together
the three must leave **no voids** for the agent that executes it — everything it
needs to understand the goal, the world it works in, and how done is judged. ICE
does **not** hand the agent the work or the way of working; deciding the fix and
how to build it is the agent's job.

- **Intent** — the clean triple: goal, constraints, failure conditions. What we
  want, stated so it holds regardless of how it is built.
- **Context** — the practices, standards, and documentation the agent reads to
  understand the system before working. The surround, not the solution.
- **Expectation** — two buckets only: **success scenarios** (acceptance and
  done-target merged) and **recovery** (one policy per failure condition).
  Generated from Intent + Context, vetted at a human checkpoint (see the note at
  the foot of the E section).

---

## I — Intent

### Goal

`codify` reverse-engineers a product's details from an existing codebase and
stages them for promotion. When `enrich` promotes that staged output, it must land
**the exact same set of files** that `specify`, `design`, and `arch` would have
produced — same relative paths, same filenames — creating each file that is
missing and enriching each that already exists. Every approved item reaches its
target, and any failure to land is **visible, never silent**. This holds on a cold
start (nothing yet on disk) and on a re-run over partly-built memory.

### Constraints (C)

- **C1** — The promoted file set equals what the forward plays (`specify`,
  `design`, `arch`) would produce for this repo: the same relative paths and
  filenames. No file in that set is left unwritten; no file outside it is invented.
- **C2** — Parity holds both on a cold start and on a re-run over
  partly-populated memory.
- **C3** — "What the forward plays would produce" is taken with their own
  conditions intact — for example, experience/design files exist only when the
  repo has a frontend, so their absence on a frontend-less repo is expected, not a
  gap.
- **C4** — Reviewer approval stays the only promotion gate; only approved items
  are written.

### Failure conditions (F)

- **F1** — After an all-approved cold-start run, a structural-core artifact the
  forward plays would have produced (architecture, scope, enriched-capabilities,
  features, epics, quality-profile, market-brief, mvp-recommendation, research,
  project-profile, domain-selection) is absent from product memory.
- **F2** — After an all-approved re-run over partly-populated memory, an existing
  file is lost or left un-updated, or a missing file is not created.
- **F3** — `enrich` closes out the issue while an approved item never landed in
  product memory — a half-written result reported as done.

---

## C — Context

What the agent should read and understand before working — the practices,
standards, and documentation that describe the system this work lives in. None of
it prescribes the fix; the agent builds the fix from this understanding. The aim is
no voids: enough to understand the whole path, nothing about how to write the code.

**The forward authoring path — the parity target.** Read how `/specify`,
`/design`, and `/arch` build a product's long-term memory: which artifacts they
produce and where those land. This defines the file set the work must match.
→ `core/components/plays/{specify,design,arch}/`; the product memory layout in
`.garura/core/config.yaml`.

**The brownfield mirror.** Read `/codify`: how it reconstructs that same artifact
set by inferring from an existing codebase instead of interviewing, and how it
stages what it finds for promotion.
→ `core/components/plays/codify/`.

**The promotion path.** Read `/enrich`: the terminal stage that promotes staged
work into product memory and closes out the issue afterwards.
→ `core/components/plays/enrich/`.

**The learning pipeline and its vocabulary.** Understand how the extractors feed
`enrich`, and how product memory is organised and named.
→ `core/grounding/glossary.md`; `docs/philosophy/`.

**The standards that bind the change.** The play-pipeline rules — what counts as a
change to a play's guarantee versus a change to wiring, and how each is made and
deployed — and the Garura folder structure.
→ `CLAUDE.md`; `core/components/memory/standards/`.

---

## E — Expectation

Generated from Intent + Context, vetted at a human checkpoint. This block is the
draft that would seed the play's `expectation.yaml`; its status is **pending**
until a reviewer approves it — it governs nothing before that.

### Success scenarios (S)

- **S1 — Cold bootstrap.**
  - *Persona / given:* a maintainer bootstrapping a brownfield repo with empty
    product memory runs `codify`, approves all items, runs `enrich`.
  - *Then:* product memory holds every inferred artifact at its
    `specify`/`design`/`arch`-equivalent path.
  - *Measure (binary):* the file set under product memory equals the forward-play
    file set for this repo (its own conditions, such as frontend gating, applied).

- **S2 — Incremental re-run.**
  - *Persona / given:* a maintainer re-runs `codify` on a product whose memory
    already holds some files, approves all, runs `enrich`.
  - *Then:* existing files are updated, missing files are created, nothing is lost.
  - *Measure (binary):* every approved item's target exists after `enrich`, and no
    pre-existing file is removed.

- **S3 — Everyday loop unchanged.**
  - *Persona / given:* a maintainer runs the normal day-to-day learning loop on a
    product whose memory already exists.
  - *Then:* it behaves exactly as before — no regression from this change.
  - *Measure (binary):* the everyday extract-and-promote flow produces the same
    outcome it did before the change.

- **S4 — No silent half-write.**
  - *Persona / given:* a maintainer runs `enrich` and one approved item fails to
    land.
  - *Then:* the issue stays active, the failure is visible, and a re-run can retry.
  - *Measure (binary):* the run reports the failure **and** the issue is not closed
    out.

### Recovery (one per failure condition)

- **R1 (F1 — cold-start core missing) → autonomous.** Re-run the promotion for the
  issue; the missing structural-core files should land on a correct retry.
- **R2 (F2 — re-run loss or un-update) → autonomous.** Re-run the promotion so the
  staged content is re-applied and anything missed re-lands.
- **R3 (F3 — silent half-close) → human.** Surface the false close-out to a
  maintainer — the system reported done while an approved item never landed, so a
  person reviews what was missed before the promotion is re-run; the issue must not
  close out while any approved item is unwritten.
