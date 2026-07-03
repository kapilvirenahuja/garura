# Domain Grounding Doc — TEMPLATE & CONTRACT

> Locked contract for a domain's `domain.md`. A domain reads as a **theme /
> initiative** — the broadest level. The linter enforces the heading set below
> (present, ordered, no extras, none empty). The content-quality eval scores each
> section against `_content-standard.md`. Fill every section to the depth of the gold
> example: each item is a complete, self-explaining statement a stranger understands
> cold. Written by `/vision`.

## Heading contract (required, in order)

```
# Theme: <Domain Name>
## Intent
## Business goal
## Guiding rules
## Capabilities
## Scope (In / Out)
```

## Per-section guidance

- **Intent** — what this domain is for, in plain terms: the outcome it exists to
  produce and the line it will not cross. A short paragraph, not a label.
- **Business goal** — the concrete question a leader can answer once this domain
  works, and why that matters.
- **Guiding rules** — the laws that hold across *every* capability in the domain.
  Each rule states the rule and the reason it exists. These are what make this domain
  itself and not another.
- **Capabilities** — each candidate capability with one explained line on what it
  owns and why it is a distinct capability. (Narrative companion to the spine, which
  holds the ids.)
- **Scope (In / Out)** — what the domain covers now and what it deliberately does
  not, each with enough reason that a reader understands the cut.

## Gold example

```markdown
# Theme: Token Dash

## Intent
Give engineering leaders a trustworthy picture of how AI coding tools and the
agentic harness are actually used — tokens, time, and effectiveness — without ever
exposing private data or turning usage into individual productivity scoring. The
domain exists to make AI-spend and harness-effectiveness legible and defensible;
it explicitly refuses to become a surveillance or ranking tool.

## Business goal
A CTO can answer "where is our AI spend going, and is our harness actually making us
better?" from one dashboard, backed by numbers they can trust and explain to their
own leadership — not a black box they have to take on faith.

## Guiding rules
- Privacy first — raw prompts, paths, secrets, and client/project names never reach
  a shared view. The product is useless to its buyer the moment it leaks a client's
  data, so privacy is a precondition, not a feature.
- No people-ranking — usage informs operating decisions; it never becomes an
  individual productivity score, because the moment people believe they are being
  ranked by token burn, they game it and the data dies.
- Source honesty — the availability and fidelity of every source are always visible.
  A hidden gap reads as "no usage" and silently corrupts every total above it.
- Explainable — every number can name the records and rules behind it, because a
  leader cannot act on a figure they cannot defend.

## Capabilities
- Data Gathering — the front door: it reads tool and harness sessions into one clean,
  labeled, privacy-safe fact set. Distinct because all trust starts here; nothing
  downstream re-reads raw sessions.
- Usage Rollups — aggregates the fact set into team/track, SDLC-pipe, and tool/agent
  views. Distinct because it only ever computes from collected facts, never recollects.
- Harness Intelligence — judges harness effectiveness against a defined harness model.
  Distinct because it interprets usage against a quality bar, which is a different
  concern from gathering or aggregating it.

## Scope (In / Out)
- In: a local-fixture-first MVP across Codex and Claude Code, with GitHub Copilot
  shown as a labeled source state. We prove the trust and collection model on a
  laptop before taking on real integrations.
- Out: production cloud deployment, live provider credentials, and enterprise RBAC —
  all real, all later; pulling them into the MVP would trade the thing we are trying
  to prove (the model works) for integration plumbing.
```
