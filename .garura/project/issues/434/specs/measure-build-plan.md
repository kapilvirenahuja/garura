# /measure build plan — next steps

**STATUS: COMPLETE (2026-06-12).** All seven steps done — schema + agentic data block,
KB seeded (3 learnings), author-measure-lens, the /measure play (lint PASS, 12/12 smoke),
the six-lens ripple (8 scripts + prose), the position split + read-widening (5 plays
recompiled ICE-first, fingerprints verified), all 9 plays lint PASS, gates smoke-verified.
Outstanding from "standing reminders": token-burn-dash re-install; Hub-level analytics at
end of phase; existing realized slices need /measure before their next /grill//implement.

Captured 2026-06-11. Grounded in: `slice-trinity-model.md` (decisions 23+24),
realignment-plan decision 19 (lens set is six) + the widened lens-count ripple, and
the Explore sweep of lens-set hard-asserts (recorded in phase-d-progress.md).

Intent (Kapil's words): measure calls out the benefits the TEAM gets while delivering
this slice — which delivery metrics we are improving or want to improve. Per metric: a
BASELINE, a TARGET, and the proof source; /capture later proves the improvement.
Delivery-pipe only (DORA, Flow, SPACE, DX); product outcomes stay with strategy.
Position: middle of the FOUNDATION pipeline (arch → measure → run). Reads: slice hub +
all three lens-trinity files (trinity read rule).

## Steps, in order

1. **Design the `lens/measure.yaml` schema** — per-metric claim blocks
   (framework / metric / why-this-slice / baseline / target / proof source = the seam
   /capture harvests), plus the `agentic.yaml` data-substrate block in the same batch
   (decision: "when next touched"). Checkpoint: schema draft approved before it lands
   in `core/components/memory/standards/schemas/product-os/lens/`.
2. **Measurement interview → seed the KB.** KB has ZERO delivery-measurement learnings
   (verified). Interview Kapil for his POV: which DORA/Flow/SPACE/DX metrics matter,
   sane targets, where numbers come from (GitHub/CI/agent logs), and what DX means
   when agents do the building. Seed learnings on the existing architecture/ +
   technology/ shelves (content growth, no new shelves — standing rule).
3. **Build the `author-measure-lens` skill** (models author-architecture-lens: reads
   slice hub + the three lens files + KB; calls kb-search + propose-kb-node; emits the
   choices manifest for the grounding check). Register in product-os-keeper.
4. **Build the `/measure` play with play-creator** — SKILL.md + reference/ice.md +
   scripts (preflight, check_ready_slice reuse, validate_measure with the trinity
   read rule, apply_measure, check_measure, check_kb_grounding reuse). Position: none
   + foundation-middle exception.
5. **Six-lens ripple sweep** — the 8 scripts that hard-code the lens set (3 gates:
   run check_lines_up, grill check_realized, implement check_ready_epic; 5 isolation
   constants: validate_{quality,ux,agentic,arch,run}.py), plus lens/_index.md
   ("the five realize lenses"), slice.yaml comments, the pipeline strings in 5 lens
   SKILLs + 3 ICEs, author-epics ("all five lenses"), product-os-keeper prose.
6. **Apply the trinity read-widening + position split (decision 24), ICE-first:**
   arch (none→START; reads widen to hub + 3 lens files), run (none→END + close chain;
   reads widen the same; loses "fifth and LAST" framing but keeps last-lens duties:
   lines-up + realized stamp), agentic (none→END + close chain), grill (end→BOTH,
   self-contained — confirmed), quality stays start, ux + measure stay middles.
   Recompiles via play-editor; fingerprints recomputed.
7. **Lint all touched plays (10 gates incl. D2b) + smoke round-trip** — happy path +
   every guard, like the /run and /grill builds.

## Standing reminders attached to this work
- Hub-level ANALYTICS (business measurement; slice-drift signals) is NOT this — it
  goes at the END of this phase. Remind Kapil when measure lands.
- token-burn-dash re-install (codex) needed after the build so the new/changed plays
  deploy there.
