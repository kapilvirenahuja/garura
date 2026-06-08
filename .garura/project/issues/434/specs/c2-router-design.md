# C2 — The KB Router (design v3 — reused pageindex)

Issue: #434, Phase C2
Depends on: C1 (the 10 domain shelves, Domain → Capability → Functionality) — DONE,
`1ca3bc0`.
Status: building. v3 corrects v1/v2 to match what we actually built.

> **What changed from v2.** v2 described a custom standalone tool ("productos") with
> an enforced opacity boundary and a hidden index. We did NOT build that. We
> **reused the existing pageindex tool, pointed at the KB folder** (Kapil's call:
> reuse, no new tooling). This doc reflects that reality. The standalone-tool,
> server, and enforced-opacity ideas are the **future shape**, not today's build.

## 1. What C2 is

*"Make the KB act as a search/router: for any piece of work it answers which domain,
which capability, and which functionality it belongs to."* C1 built the map; C2
reads it.

## 2. The build today — reused pageindex over the KB, behind an interface

- **The tool is pageindex, reused as-is.** A copy of stormcaller's pageindex script
  sits in the KB folder (`…/knowledge/domains/.pageindex/pageindex.py`); its root
  auto-resolves to the shelves, so it indexes them with no code change. It builds a
  plain JSON index and offers keyword search (`--query`) and tree navigation
  (`--tree` / `--navigate` / `--read`). No new tool was authored.
- **An interface sits in front of it.** The `play → agent → skill` chain never calls
  the CLI directly — it calls a thin **interface/adapter** that exposes stable verbs
  and, today, shells to the local pageindex. This is the one piece still to build
  (T32) and the reason the later server move is upstream-invisible.

## 3. The flow — an inference sandwich

Reasoning lives in the **calling skill**, on both sides of the tool; the tool is
deterministic search.

```
piece of work
   │  (inference #1)  skill turns the work into questions / keywords
   ▼
 pageindex (via the interface): search / navigate the KB  →  relevant shelf sections
   │  (inference #2)  skill reasons over the sections → placement + decision + why
   ▼
routing result
```

The **tree-navigation path** (`--tree`/`--navigate`/`--read`) is the reasoning route
and the primary one. `--query` is BM25 keyword search — used only as an **entry
hint**, never as the decider (reasoning is the decider).

## 4. Granularity (an honest limit)

pageindex indexes by **markdown headers**. In our shelves, capabilities and
functionalities are **bullets** inside the `## Capabilities` section, and the domain
`trigger`/`selection_keys` live in **frontmatter** (above the first header). pageindex
reads neither directly. So:

- Retrieval lands at the **domain + section** level ("user-management → Capabilities"),
  not at the exact functionality.
- The **skill closes the gap**: it `--read`s the section and reasons down to the
  capability/functionality. This is the intended division of labour — the tool
  retrieves, the skill reasons.

Built result so far: 10 shelves → 113 section nodes. Good enough to route to the
right shelf/section; functionality resolution is the skill's job. Sharpening the
index to functionality granularity is a deferred option, not today's work.

## 5. The index

A plain JSON file in `…/domains/.pageindex/`, **derived** from the shelves by
`pageindex.py`. Regenerated on demand (re-run the build); no daemon. **Gitignored** —
it is a rebuildable artifact, not source. The shelves are the source of truth.

## 6. Two operations — placement vs selection

- **Placement (primary).** Where does this work *belong*? Semantic, profile-free.
  Search + the skill's reasoning produce it. Never reject a placement because a
  condition fails — the asker already decided to build it.
- **Selection (secondary).** *Should this product include it?* Only with a profile;
  evaluate the functionality's conditions. This is `/shape`'s / `/vision`'s job. The
  router returns conditions as metadata; it does not evaluate them itself today
  (condition-eval is skill/`/shape`-side reasoning, not a pageindex feature).

## 7. The routing-result shape (lightweight — NOT an ADR)

A routing trace is a transient lookup, not an ADR (`decision.yaml` is for immutable
architectural decisions). So:

```yaml
routing_result:
  work: "add SMS password reset"
  placements:
    - domain: user-management
      capability: account-recovery
      functionality: [password-reset, multi-channel-support]
      confidence: high            # high | medium | low
      why: "credential recovery via a non-default channel"
  spans_multiple_domains: false
  unmatched: false                # true → nothing-fits (§9)
```

## 8. The interface (the key remaining piece, T32)

The seam the chain calls. Stable verbs, transport-agnostic:
- `search "<keywords>"` → candidate shelf sections (maps to pageindex `--query`/`--tree`).
- `read <node>` → a section's text for the skill to reason over (maps to `--read`).
- `rebuild` → regenerate the index (maps to the pageindex build).

Today the interface shells to the local pageindex. When the KB later moves behind a
server, **only the interface changes** — no play, agent, or skill in garura is
touched. Verbs are the stable seam; the backend (local CLI ↔ remote server) swaps
underneath.

## 9. Nothing-fits escalation

When search returns nothing usable (`unmatched: true`), the **skill** (not the tool)
escalates: LLM + web research → draft a generic node on the shelf template +
functionality baseline → optional short user interview → **always** a user-review
checkpoint before it is written into a shelf and re-indexed.

## 10. The future shape (NOT today — recorded so we don't lose it)

These were Kapil's stated direction; we are not building them now and will "see how
it shapes up":
- **Server.** The tool becomes the standalone spine on a server; garura is a content
  provider (KB now, more later). Today it is a local CLI.
- **Opacity.** "Query in, results out; nobody sees the KB." This is **aspirational,
  not enforced today** — the local index is a readable file and `--read` returns full
  section text. Opacity becomes real only behind the server, where the door is the
  only access.
- **Functionality-level index.** If section-level retrieval proves too coarse, adapt
  the index to read bullets + frontmatter (would be new tooling — deferred).

## 11. Build status / plan

- **Done:** C1 shelves; shelf-convention confirmed (T23); verb-contract draft (T31);
  **pageindex reused over the KB, index built (T24)**.
- **Next:** the interface/adapter (T32) → the calling skill / inference sandwich
  (T26) → routing-result shape (T25) → nothing-fits (T27) → test on the storefront +
  login worked instances (T29) → wire into plays (T30). Reverse-read (T28) is already
  covered by pageindex `--navigate`/`--read` (internal use).

## 12. Decisions captured (with Kapil)

- TOOL = **reused pageindex**, pointed at the KB folder. No new tool, no new product.
- INTERFACE in front of it; transport-agnostic so a later server move is upstream-
  invisible.
- FLOW = inference sandwich; tree-nav is the reasoning path, `--query` only an entry
  hint (no BM25 as decider).
- Retrieval is **section-level**; the skill reasons down to the functionality.
- Index is derived + gitignored; shelves are source of truth.
- Server + enforced opacity + functionality-level index = **future shape**, deferred.
