# KB Design — empirical learnings bank

Decided under #434 Phase C. This is the reference for how the KB works.

## What the KB is

A bank of **empirical learnings**, not a catalog. Each learning answers a
conditional question: *given the conditions a product is in, what capabilities
and what architecture work best — and when should that evolve?* Agents search it
while building context; it is the beacon that turns intent into a productive
build, and it grows as we learn what actually worked.

## The durable / swappable split

The search **engine is disposable**; the **content and the contract are not**.
Design the content and the contract for the intelligent end-state, and let V1 be
a crude implementation of that same contract. Done this way, no V1 work is wasted
when the server arrives.

### Durable — build once, survives every version

- **Content** — markdown learnings, one template (`_TEMPLATE.md`). YAML
  frontmatter carries the machine-readable facets (id, title, conditions,
  evolve_when, provenance); the body carries the human/model prose (Topic,
  Conditions, Recommendation, Rationale, Evolve when, Provenance).
- **Query** — a condition profile (stage, scale, persistence, monetization,
  intent), read from the product's own ProductOS, plus optional free text.
- **Response** — ranked best-fit learnings, each with recommendation, rationale,
  provenance, and evolve-when pointers.
- **Skill interface** — agents call one `kb-search` capability with the query
  and get the response. This never changes.

### Swappable — the engine behind the skill

- **V1 (now)** — a script. Builds a manifest from the frontmatter; the **model**
  does the matching by reasoning over each candidate's Conditions; grep narrows
  candidates only when the manifest is large; the script returns the chosen
  learnings. On disk, editable. The intelligence in V1 is the model reading
  conditions — real, just not scalable.
- **Final** — a server behind a `kb` CLI, called the way garura already calls
  `gh` / `git` / `gcloud`. **Not MCP** (too expensive per call). Structured
  matching on the facets + ranking by empirical weight; semantic search added
  only if structured proves too rigid. Hosted and hidden from product users. The
  script swaps grep for `kb` CLI calls; the skill and the agents above it do not
  change.

### Graduation trigger

Not a date — a signal: the manifest gets too big to read cheaply, model
selection starts missing, or the KB must be genuinely hidden. Any one → move to
the server.

## The loop

Agent building context reads the product's conditions from ProductOS → queries
the KB → gets best-fit learnings → applies them (e.g. `/realize` uses them for
the architecture intent). `/learn` writes new learnings back.

## The real risk (where to invest)

Not grep-vs-semantic. **Content quality and contradiction.** Overlapping or
conflicting learnings return mush regardless of engine. So the investment that
protects capability is template discipline plus a reconciliation step in
`/learn` that dedupes and supersedes conflicting learnings — the way accepted
decisions supersede rather than pile up. That pays off in V1 and final equally;
invest there before the engine.

## Why structured-first, not semantic-first

The conditions are already structured facets. Matching on those + ranking by
empirical weight is precise, explainable, and free. Semantic is an enhancement
for when query language diverges from learning language — added later, not led
with.
