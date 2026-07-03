---
id: technology/quick-prototype-html-first
title: "Quick prototype: HTML-first with readable logic, then promote to Astro to share"
conditions:
  stage: prototype
  stack: html-first
  persistence: none
  audience: self-then-share
evolve_when:
  - technology/astro-content-sites
provenance: "documented (the user's preferred prototyping flow)"
---

# Quick prototype: HTML-first with readable logic, then promote to Astro to share

## Topic
The preferred way to start something fast: hand-written HTML first, with the logic
living in the code in a form anyone can read and understand — then, when it is worth
sharing, promote it to an [Astro content site](./astro-content-sites.md). The
matching architecture for the prototype stage is
[static, no backend](../architecture/single-user-throwaway.md); this learning is the
**method and stack** for that stage.

## Conditions

### When to choose
You want a usable thing in front of yourself (or one teammate) quickly — a demo, a
simulator, an idea made tangible. Nothing to persist, no users to manage, no
monetization. The point is to iterate on look and behavior fast, and to keep the
logic legible so anyone opening the file understands what it does.

### When to avoid
Anything that must persist real data, support multiple real users, or carry
production load — that is past prototyping; climb to a real
[stack](./frontend-react-nextjs.md) over a
[modular monolith](../architecture/modular-monolith.md). Also avoid over-tooling the
prototype: a build pipeline or a framework here is cost with no payoff while there
is one user and nothing to keep.

## Recommendation
- **HTML first.** Start with plain HTML/CSS/JS — no framework, no build step. The
  fastest path to something on screen.
- **Logic in the code, readable.** Keep the behavior inline and legible — clear
  names, small functions, comments where intent isn't obvious — so anyone reading
  the file can follow what it does. The prototype doubles as its own explanation.
- **Design over plumbing.** The only thing that matters at this stage is that it
  looks and behaves right; spend the effort on the design, not on infrastructure.
  No database, no backend, no auth.
- **Promote to Astro to share.** When it is ready for other eyes, move it into the
  [Astro content-site setup](./astro-content-sites.md) — file-based, live-served,
  shareable by URL, with the coauthor edit loop if others will contribute.

## Rationale
Hand-written HTML with readable inline logic is the lowest-friction way to make an
idea real and keep it understandable — there is nothing to operate and nothing to
explain separately, because the file explains itself. Deferring frameworks, builds,
and backends until there is an actual reason to add them avoids paying for
infrastructure that a one-user prototype never uses. Promoting to Astro (rather than
standing up an app) keeps the share step cheap: the prototype stays file-based and
content-led until it genuinely needs to become an application.

## Evolve when
| From | To | Trigger |
|------|----|---------|
| HTML-first prototype | [Astro content site](./astro-content-sites.md) | ready to share with others / want live editing |
| HTML-first prototype | [React + Next.js](./frontend-react-nextjs.md) app | it becomes a real product — persistence, users, load |

## Provenance
documented — the user's stated prototyping flow (HTML-first, readable logic, then
Astro to share), captured into the v1 KB.
