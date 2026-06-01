# Knowledge Base — empirical learnings bank

The KB is a bank of **empirical learnings**, not a catalog. Each learning is one
markdown file following `_TEMPLATE.md`. It answers a conditional question:
*given the conditions a product is in, what capabilities and what architecture
work best — and when should that evolve?* Agents search it while building
context; it is the beacon that turns intent into a productive build, and it
grows as we learn what actually worked.

## How it is searched

A skill calls a search script. The search engine evolves; the skill interface
does not.

**V1 (now) — script over grep'd files.** The script uses grep/cat as plumbing:
fetch the index, fetch candidate learnings. The *matching* is the model's job —
it reasons over each candidate's **Conditions** section to find the learning
that fits the product's situation, and follows **Evolve when** links to the next
rung. Grep retrieves text; the model decides relevance. This keeps V1 simple and
lets us move fast.

**Future — server + CLI.** A server hosts the KB behind a proper API with
intelligent search: structured matching on the Conditions facets, semantic
search over the prose, and ranking by empirical weight (how proven a learning
is). A `kb` CLI fronts it — agents call it the way garura already calls `gh` /
`git` / `gcloud`. Not MCP (too expensive per call). The skill swaps its script
internals from grep to `kb` CLI calls; nothing above the script changes. The
server is also where the KB becomes truly hidden from product users.

## Structure

One learning per file, grouped into shelves:

- `architecture/` — product-condition → best-fit architecture learnings
  (e.g. the simulator ladder: throwaway → internal → monetized).
- `domains/` — domain → capability → feature learnings (the stable backbone),
  with the empirical guidance for each.

Every file follows `_TEMPLATE.md`: Topic, Conditions, Recommendation, Rationale,
Evolve when, Provenance.

## Status (#434 Phase C — v1)

- Design: `_DESIGN.md`. Template: `_TEMPLATE.md` (frontmatter facets).
- Search engine v1: `core/components/skills/kb-search/` (skill + `kb_search.py`:
  index / get / grep). The model does the matching; the script serves structure.
- Seeded content: the simulator ladder under `architecture/` (throwaway →
  internal → monetized).
- Growing over time: the domain shelf and more architecture learnings, added as
  we build and as `/learn` writes them back.
