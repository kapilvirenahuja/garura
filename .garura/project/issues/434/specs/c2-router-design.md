# C2 — The KB Router, behind a tool (design v2)

Issue: #434, Phase C2
Depends on: C1 (the 10 domain shelves, each a Domain → Capability → Functionality
tree with profile conditions) — DONE, committed `1ca3bc0`.
Status: design v2 (tool spine), pending review. Build not started.

> v2 supersedes the skill-only v1. The router is no longer "a skill that reasons
> over markdown files." The KB goes **behind a tool**; skills call the tool.

## 1. What C2 is

From the realignment plan: *"Make the KB act as a search/router: for any piece of
work it answers which domain, which capability, and which functionality it belongs
to."* C1 built the map; C2 builds the thing that reads it.

## 2. The spine — the KB behind a tool (opacity boundary)

The knowledge base moves **behind a tool**. The tool is the only door:

- You call it with **search / keywords** and get **results**.
- Nobody — end user or consumer — gets to **open the KB and read what's inside**.
  The KB is the asset (the POV, the shelves); the tool lets *answers* out, not the
  *contents*.
- Anyone with access to the tool/API gets the capability; the asset stays hidden.

This is the established pattern, not an invention: in `~/cto/stormcaller`, pageindex
is a CLI and the `pageindex-search` skill just invokes it (`--query`/`--navigate`/
`--read`); garura's own `platform-adapter` is "a stable verb interface" over CLIs.
We apply that shape, and add the opacity rule on top.

## 3. The flow — an inference sandwich

Reasoning lives in the **calling skill**, on both sides of the tool. The tool itself
is a deterministic search engine over the hidden store — no LLM inside it.

```
piece of work
   │
   ▼  (inference #1)  skill turns the work into questions / keywords
   ▼
 TOOL: search the hidden KB  →  candidate results (nodes + conditions, not the KB)
   │
   ▼  (inference #2)  skill reasons over the results → placement + decision + why
   ▼
routing result
```

So: keyword search is the tool's **retrieval** step (the door); the **decision** is
the skill's reasoning. That is why "reasoning is the core capability" and "you call
it through search/keywords" are both true and not in conflict.

## 4. The tool

A CLI now (skills invoke it over the shell and parse JSON), with verbs designed to
lift cleanly to an HTTP API later. Working name `productos`.

Consumer verbs (the door):
- `rebuild` — regenerate the hidden index from the shelves (deterministic, no LLM).
- `search "<keywords>"` — return candidate nodes (domain/capability/functionality)
  matching the query, each with its summary + profile conditions. **Returns query-
  relevant slices only — never the whole KB.**
- `eval <node> --profile <p>` — evaluate a node's conditions against a profile
  (selection mode, §6). Returns a verdict, not the KB.

Internal / authoring verbs (NOT on the consumer surface — would break opacity):
- `get <node>` / reverse-read — browse a subtree. For authoring and trusted plays
  only; gated, not part of the public door.

Behind the verbs: the hidden index + the shelves + (later) rules, standards, profile,
decisions. The verbs are the stable seam; the store behind them can change freely.

## 5. The hidden index (the tool's internal structure)

The tool owns a derived index — a light "table of contents" generated from the
shelves so search is fast and the tool never loads ~1,500 lines per call. It is
**internal to the tool**; callers never see it. Per node:

```json
{
  "id": "user-management.account-recovery.multi-channel-support",
  "type": "functionality",
  "name": "Multi-channel support",
  "parent": "user-management.account-recovery",
  "level": 3,
  "maturity": null,
  "trigger": ["accounts","login","roles","access control"],
  "selection_keys": ["shape.users","nfr.security","compliance"],
  "conditions": "when `shape.surfaces` spans more than one, or `shape.users: public`",
  "summary": "recover across channels (email, SMS, etc.)",
  "source": { "file": "domains/user-management.md", "line": 62 }
}
```

Built by a deterministic, **section-scoped** parser: read frontmatter → domain node;
find the `## Capabilities` section (the `- **Name** —` shape is shared with the
Intents section, so scope to Capabilities); top bullet → capability; indented bullet
→ functionality; detect `Level N —` ladders; lift the backticked condition tokens
(`shape.*`/`nfr.*`/`compliance`, or "the floor"). Shelves are **source of truth**;
the index is derived and regenerated on demand / pre-commit (no rebuild daemon).

## 6. Two operations — placement vs selection

- **Placement (primary).** Where does this work *belong*? Semantic, profile-free.
  The tool's `search` + the skill's reasoning produce it. Never reject a placement
  because a condition fails — the asker already decided to build it.
- **Selection (secondary).** *Should this product include it?* Only with a profile;
  the `eval` verb checks the node's conditions. This is what `/shape` / `/vision`
  do; the router returns conditions as metadata and only evaluates on request.

## 7. The routing-result shape (lightweight — NOT an ADR)

A routing trace is a transient lookup, not an architectural decision; `decision.yaml`
is for ADRs (immutable once accepted). So:

```yaml
routing_result:
  work: "add SMS password reset"
  placements:
    - domain: user-management
      capability: account-recovery
      functionality: [password-reset, multi-channel-support]
      confidence: high            # high | medium | low
      why: "credential recovery via a non-default channel"
  selection:                      # only when a profile was supplied
    - node: multi-channel-support
      condition: "shape.surfaces spans more than one, or shape.users: public"
      verdict: include
  spans_multiple_domains: false
  unmatched: false                # true → triggers §8
```

## 8. Nothing-fits escalation

When `search` returns nothing usable (`unmatched: true`), the **skill** (not the
tool) escalates:
1. LLM + **web research** as a tool to understand the work.
2. Draft a generic node on the shelf template + functionality baseline.
3. Optional short user interview for POV.
4. **Always** a user-review checkpoint — nothing is written into a shelf and
   re-indexed until approved. The new node then lives behind the tool like the rest.

## 9. What C2 deliberately does NOT do

- No browsing/dumping the KB from the consumer surface — the store is hidden.
- No LLM inside the tool — the tool searches; the skill reasons.
- No embeddings / vectors; no rebuild daemon.
- No rewrite of the approved shelves (index is derived; shelves are truth).
- No rejecting a placement on a failed condition (that is selection).
- No routing traces in `decision.yaml`.

## 10. Where the tool lives + the abstraction guarantee (DECIDED)

**The tool is the standalone spine — it sits on a server.** It is the core; garura
is a **content provider** (the KB now, and more later) and a consumer. The engine is
generic: it searches any product's shelves; it is not garura-specific. It is NOT
hosted inside garura.

**Local CLI is only the first transport.** We run the spine as a local CLI today,
but that is an implementation detail behind an abstraction, not the architecture.

**The abstraction guarantee (the whole point).** The `play → agent → skill` chain in
garura NEVER talks to the CLI or the server directly. It talks to a thin,
transport-agnostic **adapter** (a client) that exposes the tool's verbs. The adapter
is the ONLY thing that knows the transport:

```
play → agent → skill → KB adapter (stable verbs) → [ local CLI today | HTTP server later ]
```

So when the spine moves from local CLI to a remote server, **only the adapter
changes — zero change to any play, agent, or skill in garura.** The verb contract is
transport-agnostic by construction; the adapter swaps `exec(productos …)` for
`POST /productos/…` and nothing upstream notices. This mirrors `platform-adapter`
(stable verbs, swappable backend) — here the swap is local-vs-remote rather than
gh-vs-glab.

## 11. Build plan (sequenced → tasks)

- **B0 (T31)** — Define the tool verb contract + the opacity boundary (which verbs
  are public vs internal; "no KB dump" rule).
- **B1 (T23)** — Confirm the Capabilities-section convention across all 10 shelves.
- **B2 (T24)** — Build the `productos` CLI tool: the hidden index + `rebuild` +
  `search` + `eval` (+ gated `get`). Deterministic, no LLM.
- **B3 (T25)** — The routing-result shape.
- **B3b (T32)** — The garura-side **KB adapter** (transport-agnostic client over the
  tool verbs; local-CLI transport today, swappable to HTTP with zero upstream change).
- **B4 (T26)** — The calling skill: keyword extraction (inference #1) → invoke the
  tool **via the adapter** → reason over results (inference #2) → routing result.
- **B5 (T27)** — Nothing-fits escalation (research → draft → interview → review).
- **B6 (T28)** — Reverse-read as a gated internal/authoring verb (not public).
- **B7 (T29)** — Test/eval on sample work items (reuse the storefront + login
  worked instances in STM).
- **B8 (T30)** — Wire into plays + document.

## 12. Open decisions (resolve before/at build)

- Index location behind the tool; confidence threshold for `unmatched`.
- The spine's eventual home (its own repo/service vs developed under the harness) —
  it is standalone either way; decide when we stand up the server.
- Resolved: tool = standalone spine on a server (garura = content provider); local
  CLI first behind a transport-agnostic adapter so the server move is zero-change.

## 13. Decisions captured (with Kapil)

- SPINE: the KB goes **behind a tool**; query in, results out; the **KB stays
  hidden** (no one sees its contents).
- FLOW: inference sandwich — skill makes keywords → tool searches → skill reasons
  over results. Reasoning in the skill; the tool is deterministic search.
- HOW: reasoning + inference is the core capability; keyword search is the tool's
  retrieval step, not the decision.
- WHAT: domain + capability + functionality, with the decision and the why.
- NOTHING-FITS: research → draft a generic node → maybe interview → always user
  review before it joins the (hidden) KB.
- PATTERN: same as pageindex (CLI) + platform-adapter (verb interface), plus the
  opacity rule.
- HOME: tool is the **standalone spine on a server**; garura is a **content
  provider** (KB now, more later), not the host.
- ABSTRACTION GUARANTEE: play→agent→skill call a transport-agnostic **adapter**;
  local CLI today, server later; moving to the server changes **only the adapter**,
  zero change to garura's plays/agents/skills.
