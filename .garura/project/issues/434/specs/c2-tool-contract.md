# C2 — productos tool: verb contract + opacity boundary

Issue: #434, Phase C2, build step B0 (T31).
Companion to: `c2-router-design.md`.
Status: contract locked for the local-CLI build.

The tool's verbs are the **stable, transport-agnostic seam**. The same contract is
served by the local CLI today and an HTTP server later; the garura-side adapter (T32)
swaps transport without changing inputs/outputs. JSON in, JSON out — so the HTTP
mapping is mechanical.

> **Status (reality check).** This is the **interface's target verb surface**, not
> what the local backend enforces today. Today the backend is the **reused pageindex**
> tool, whose real verbs are `--query` (BM25), `--tree`/`--navigate`/`--read` (tree
> nav), and build. The interface verbs below map onto those: `search` → `--query`/
> `--tree`, `get` → `--navigate`/`--read`, `rebuild` → build. `eval` (condition
> evaluation) is **not** a pageindex feature — it is selection-time reasoning
> (skill / `/shape`), deferred. The **opacity boundary below is aspirational** — it
> becomes real only when the KB sits behind a server. The local pageindex index is a
> readable file and `--read` returns full section text.

## Opacity boundary (the rule every verb obeys)

- **Public verbs return query-relevant slices only — never the whole KB.** No verb on
  the public surface dumps the tree, lists every node, or returns full shelf prose.
- A consumer can *ask* (search, eval) and get *answers*; it cannot *browse* or
  *export* the asset.
- Browsing the tree (reverse-read / `get`) is an **internal/authoring** verb, gated,
  not on the public surface.
- The hidden index is the tool's private structure; it is never returned wholesale.

## Surfaces

| verb        | surface           | purpose                                            |
|-------------|-------------------|----------------------------------------------------|
| `rebuild`   | internal/ops      | regenerate the hidden index from the shelves       |
| `search`    | public            | keywords → candidate nodes (the door)              |
| `eval`      | public            | check a node's conditions against a profile        |
| `get`       | internal/gated    | reverse-read a subtree (authoring / trusted plays) |

## Verb: `search` (public)

The door. Keywords in → candidate nodes out, ranked, with just enough to reason over.

CLI: `productos search "<keywords>" [--top N] [--type domain|capability|functionality]`

Input (HTTP-equivalent): `{ "query": string, "top": int=8, "type": string|null }`

Output:
```json
{
  "query": "reset password by sms",
  "candidates": [
    {
      "id": "user-management.account-recovery.multi-channel-support",
      "type": "functionality",
      "name": "Multi-channel support",
      "path": "user-management / Account Recovery / Multi-channel support",
      "summary": "recover across channels (email, SMS, etc.)",
      "conditions": "when `shape.surfaces` spans more than one, or `shape.users: public`",
      "maturity": null,
      "score": 7.4
    }
  ],
  "unmatched": false
}
```

Rules:
- Returns at most `top` candidates (default 8). Never "all nodes".
- `summary` + `conditions` are the one-line slices from the shelf — NOT the full
  prose. No `source` file/line on the public surface (that would leak the store
  layout); the adapter doesn't need it to reason.
- `unmatched: true` when nothing clears the score floor → caller runs the nothing-fits
  path (T27). `candidates` may still carry weak hints.

## Verb: `eval` (public)

Selection-time check: does a product's profile satisfy a node's conditions.

CLI: `productos eval <node-id> --profile <profile.json|->`

Input: `{ "node": string, "profile": { shape:{...}, nfr:{...}, compliance:[...] } }`

Output:
```json
{
  "node": "user-management.account-recovery.multi-channel-support",
  "condition": "shape.surfaces spans more than one, or shape.users: public",
  "verdict": "include",          // include | skip | the-floor | out-of-box
  "why": "shape.surfaces = [web, mobile] → spans more than one"
}
```

Rules: returns a verdict for ONE node, not a tree. Placement never calls this;
only selection-time callers (`/shape`, `/vision`) do.

## Verb: `rebuild` (internal/ops)

CLI: `productos rebuild [--kb <path-to-domains-dir>]`

Parses the shelves (section-scoped: the `## Capabilities` block; capability =
`- **Name** —`, functionality = `  - [Level N —] Name — what. condition`; conditions
= backticked `shape.*`/`nfr.*`/`compliance` tokens or "the floor") and writes the
hidden index. Deterministic, no LLM. Output: `{ "domains": int, "capabilities": int,
"functionalities": int, "built_at": string }`. Run on demand / pre-commit; no daemon.

## Verb: `get` (internal/gated — NOT public)

CLI: `productos get <node-id> [--depth N]` — reverse-read a subtree for authoring and
trusted plays. Gated (off the public surface) because it browses the asset. Returns
the node and its children from the index.

## Transport mapping (CLI now → HTTP later)

| contract     | local CLI                              | HTTP later                  |
|--------------|----------------------------------------|-----------------------------|
| `search`     | `productos search "q" --top 8`         | `POST /search`              |
| `eval`       | `productos eval <id> --profile -`      | `POST /eval`                |
| `rebuild`    | `productos rebuild`                    | `POST /admin/rebuild`       |
| `get`        | `productos get <id>` (gated)           | `POST /internal/get` (authz)|

The garura adapter (T32) calls these verbs; only the adapter knows which row of this
table is live. Moving from column 2 to column 3 is an adapter change, nothing else.
