# Discovery — Issue #311 (reap)

## Issue Body (verbatim)

**Title:** reap: refactor capture-learning into post-epic build-trinity extraction (Learning Pipeline L2)

`capture-learning` is being decomposed as part of the Learning Pipeline redesign. Its ANALYZE half becomes **reap** (this issue); its ENRICH half becomes the **enrich** play (separate issue). The current capture-learning play attempts to do both extraction and LTM promotion in a single run — reap separates the extraction concern cleanly.

### Learning Pipeline Architecture (April 2026 redesign)

| Play | Level | Persona | Reads | Writes to | Status |
|------|-------|---------|-------|-----------|--------|
| **distill** | L1 | Dev (auto in ship) | PR diff + STM | STM only | Built |
| **reap** | L2 | Dev (post-epic) | build trinity (prepare→implement→validate) | STM only | **This issue** |
| **codify** | L3 | PM/PO (brownfield) | existing codebase | STM only | #241 |
| **enrich** | — | Stakeholder-gated | STM proposals from L1/L2/L3 | LTM | Needs building |

**Key principle:** All extraction plays write proposals to STM only. **enrich** is the single LTM write boundary.

### Refactoring map

| capture-learning component | Destination |
|---------------------------|-------------|
| Pre-flight checks (issue closed, STM exists, context/ exists) | **reap** |
| Phase 1: Verify issue state | **reap** |
| Phase 2: ANALYZE mode (diff baseline vs outcomes, produce proposals) | **reap** |
| Phase 3: ENRICH mode (write approved proposals to LTM) | **enrich** (separate play) |
| Phase 4: Archive STM | remains as `archive-issue-stm` skill |
| Evidence commit via repo-orchestrator | **reap** |

### Acceptance criteria (from issue)

- New play `reap` exists, compiled from intent.yaml via /create-play
- capture-learning play is deprecated/removed
- reap reads build trinity artifacts (prepare context, implement evidence, validate verdicts)
- reap produces tiered proposals to `{stm_base}/{issue}/evidence/reap/proposals.yaml`
- reap NEVER writes to product LTM — STM only
- Proposals are consumable by the **enrich** play
- knowledge-extractor ANALYZE mode works unchanged (agent refactoring is minimal)
- Evidence self-commit via repo-orchestrator

## Q&A — Recorded Exchange

### Q1 (Claude): Build-trinity input paths — canonical or discovered?
**Status:** Deferred to context assembly (T4). The user's framing reframes this question — what matters less is *paths*, more *what we extract from them*.

### Q2 (Claude): capture-learning disposal — delete / shim / leave-skill?
**Status:** Open. To be answered as part of approach design after context assembly informs the trade-off.

### Q3 (Claude): Trigger model — manual or auto from ship?
**Status:** Open. Issue says "post-epic" which suggests manual; tentative default is `/reap <issue>` manual invocation.

### Q4 (Claude): Intent → /create-play workflow — does this enhance also build the compiled SKILL.md?
**Status:** Implicit yes — CLAUDE.md is explicit: new plays go through `intent.yaml` → `/create-play --build`. The enhance deliverable will include both the authored intent.yaml and the compiled play.

### Critical reframe (User, 2026-04-22)

> What's most important are learnings around architecture, domain, tech, design patterns, etc. The evidence is going to give you something — but what we need to capture is what makes our LTM and KB richer. For example, if we enhanced something, there is definitely something that must be missing earlier in our domain or feature. While KB may have it, the LTM may not. Same thing for technology — if we are deploying on servers, rules, policies, ports, etc.

**Interpretation locked in:**

reap's output is **semantic learning extraction**, not mechanical diff:

- The question reap answers: *what did this epic reveal that was missing or incomplete in our LTM/KB?*
- For each enhancement, surface concrete LTM/KB gaps:
  - **Architecture learnings** → ADR-worthy decisions, principles emerged
  - **Domain learnings** → entities, rules, invariants discovered (gap between feature-level KB and LTM domain model)
  - **Technology learnings** → infra config, ports, policies, deployment specifics
  - **Design pattern learnings** → patterns applied (new or reused), with classification
- Tier 1/2/3 classification must distinguish learning *types* (arch / domain / tech / design) AND maturity (foundational / enrichment / addition)
- Proposals must be structured for downstream consumption by `enrich` play

### Q5 (Claude → User, pending): Does the existing tier system capture these learning categories, or does reap need to define a new taxonomy?

**Status:** User instructed to "work with this" — proceed with context assembly to discover existing taxonomy. If the existing tier system encodes these categories, reuse. If not, propose extension.

## Decision Boundaries (locked at discovery)

1. **No LTM writes** — reap is extraction only. enrich is the LTM write boundary.
2. **STM-only output** — `{stm_base}/{issue}/evidence/reap/proposals.yaml`.
3. **Proposals must be semantic, not mechanical** — extracted as architecture / domain / tech / design-pattern learnings, not diff summaries.
4. **knowledge-extractor agent reuse** — minimal refactor; existing ANALYZE mode is the substrate.
5. **Compiled-play workflow** — author intent.yaml, run /create-play --build reap.
6. **Mid-checkpoint required** — user has instructed: do not implement until shape is agreed.
