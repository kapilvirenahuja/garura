| Field | Value |
|-------|-------|
| **Type** | enhancement |
| **Reported From** | /enrich sweep — issue #343 |
| **Date** | 2026-05-04 |

### Problem

The `enrich` play enforces a write boundary: all LTM writes must target `.garura/product/` or `docs/adr/` (C1, SE-10). This is correct for product LTM promotion, but it leaves a gap: distill, reap, codify, and decode can produce proposals whose natural home is the global KB (`core/components/memory/`), not the product LTM.

When this happens today, the reviewer has two bad options:
1. **Redirect** the target to `.garura/product/research/` as a workaround — the content lands in product LTM but isn't where it belongs, and a manual KB promotion step is still required later.
2. **Reject** the proposal from enrich and author the KB file directly outside the pipeline — losing the provenance trail.

Neither option is clean. The learning pipeline has no first-class path from an extracted proposal to `core/components/memory/`.

### Evidence

Surfaced during `/enrich` sweep on 2026-05-04. Issue #343 (distill from PR #344) extracted a play-orchestration principle — "short-circuit agent dispatch on deterministic context" — and proposed writing it to `core/components/memory/standards/rules/play-orchestration.md`. The normalize step passed it through as pending because the content was valid; the apply step would have violated SE-10. The reviewer manually redirected the target to `.garura/product/research/standards/play-orchestration.md` as a workaround.

### Specific Issues

- `enrich` C1 / SE-10 blocks all writes outside `.garura/product/` and `docs/adr/` — no exception for core KB paths.
- The normalize skill has no way to signal "this proposal is KB-tier, not product-LTM-tier" — the tier field (1/2/3) covers LTM importance, not destination layer.
- No `enrich-to-kb` pathway exists; the learning pipeline terminates at product LTM.

### Expected Behavior

One of:
1. **Extended write boundary** — enrich gains an explicit KB write mode, gated by a higher reviewer confirmation bar (e.g., Tier 1 treatment regardless of original tier). Writes to `core/components/memory/` are allowed when the proposal's `target_layer: kb` is set and the reviewer explicitly approves.
2. **Separate KB promotion play** — a new play (e.g., `promote-to-kb`) accepts product LTM entries and promotes them to `core/components/memory/`, keeping enrich's boundary clean.
3. **Taxonomy signal** — normalize emits `target_layer: product_ltm | kb` on each entry; enrich routes `kb` entries to a KB queue rather than silently redirecting or rejecting.

### Impact

Low urgency but structurally significant. Every KB-level learning extracted by distill/reap/codify/decode is either lost (rejected) or misplaced (redirected to product LTM) until this is resolved. The learning pipeline's claim to be end-to-end is incomplete without a KB promotion path.
