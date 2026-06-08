---
id: domains/marketing
title: "Marketing: how we build it — AEO/GEO/SEO for reach + campaign pages fast at scale (no martech)"
conditions:
  trigger: "the product needs reach and acquisition — discoverability for campaigns and fast campaign landing pages"
  selection_keys: [reach-channel-mix, campaign-page-velocity, attribution-need, consent-regime, omni-channel-need]
provenance: interview (#434 — Kapil)
---

# Marketing: how we build it

## Stance (non-negotiable)
We keep marketing **deliberately narrow**. It is **mostly AEO / GEO / SEO** — being
found and cited by answer, generative, and search engines — plus **one build
muscle: producing campaign pages fast and at scale.** That's it.

**We do NOT do martech here.** No campaign orchestration, no CDP, no email/push
platforms, no lifecycle automation. If a client needs the martech stack, it's out
of this domain (hand off / partner). Naming that boundary up front is the point.

Content-led, intent-first, and the funnel POV from `experience` applies: LLMs own
the top of funnel, so marketing competes on **content optimised for reach**, not on
owning a funnel stage.

## What we own — and what we don't
**Own:**
- **AEO / GEO / SEO for reach** — optimise content and pages to be discoverable and
  citable across answer, generative, and search engines for campaigns.
- **Campaign pages, fast and at scale** — stand up landing/campaign pages quickly,
  repeatably, on the MACH/drag-and-drop spine (see `content-management`).

**Don't own (out of this domain):**
- Campaign orchestration, audience/segment platforms, CDP, email/SMS/push
  delivery, lifecycle automation — the martech stack.

## The line against experience and content
AEO/GEO/SEO shows up in three domains — keep the jobs distinct:
- **`experience`** — *measures and diagnoses* discoverability (visibility,
  citability, answerability, agent-readiness) via the discovery graph.
- **`content-management`** — makes the *evergreen* product/site content discoverable.
- **`marketing` (here)** — *executes* AEO/GEO/SEO for **campaign reach** and builds
  the **campaign pages** that capture it.

Same technique, three jobs. Marketing is the acquisition/campaign application of it.

## Intents this domain captures (proposed — sanity-check)
Intent-first. (Confirm or correct.)

**Audience / visitor intents**
- **Discover the offer** — "surface the brand/offer where I'm looking" → AEO/GEO/SEO reach.
- **Land and act** — "a fast, relevant page for the thing I clicked" → campaign pages.
- **Control what I get** — "consent and opt-out respected" → consent (a current gap, below).

**Operator intents**
- **Get reach** — "be found and cited by search, answer, generative engines, agents."
- **Launch fast** — "stand up a campaign page in hours, not weeks, and scale it."
- **Know what worked** — "campaign intelligence and web-driven attribution."

## Where it goes wrong (our burns — fix these)
These are the recurring traps that have burned us; treat them as must-handle, not
optional:
- **Not handling consent & privacy** — opt-in, opt-out, suppression. Don't ship
  reach without it.
- **Ignoring omni-channel / cross-channel** — designing single-channel when the
  use case is cross-channel.
- **Unable to drive attribution via the web** — no clean path from web behaviour to
  campaign credit. Build the web-attribution path in.

## Intelligence features
**Core — campaign reach & intelligence (ours)**
- **GEO / AEO optimisation for reach** — be citable/answerable for campaigns.
- **Campaign intelligence via analytics** — read campaign performance through
  `analytics` (dwell time and similar engagement signals).
- **Send-time optimisation** — time campaign delivery for impact.

**Adjacent — martech (handed off / out of scope)**
- Predictive audiences, lifecycle automation, channel orchestration — not ours.

## Non-negotiables
- **AEO / GEO / SEO discipline** — reach is earned through content optimised for
  answer/generative/search engines.
- **Campaign-page velocity** — fast, repeatable, scalable, on the MACH spine.
- **Handle consent & privacy** — never ship reach without it.
- **Design for omni/cross-channel** — not single-channel by default.
- **Drive attribution via the web** — close the web-to-credit loop.
- **No martech sprawl** — stay in our lane; hand off the stack.

## Rationale
Marketing is scoped tight on purpose: our edge is reach (AEO/GEO/SEO) and the
ability to ship campaign pages fast at scale on the content spine — not running a
martech platform. The funnel POV from `experience` is why reach = content
optimisation. The three named burns (consent, omni-channel, web attribution) are
exactly the places a narrow "just build the page" view fails, so they're promoted
to non-negotiables rather than left implicit. Keeping AEO/GEO/SEO distinct across
experience (measure), content (evergreen), and marketing (campaign) stops three
teams from quietly rebuilding the same thing.

## Evolve when
- Answer/generative/agent reach grows → deepen GEO/AEO for campaigns.
- A client genuinely needs martech → route it out; don't absorb it here.
- Web attribution matures → wire campaign credit to real web behaviour.
- Cross-channel becomes the norm → design campaigns omni-channel from the start.

## Provenance
interview (#434 — Kapil): marketing scoped to AEO/GEO/SEO + fast, scalable campaign
pages, explicitly NO martech; the three named burns (consent/privacy, omni/cross-
channel, web attribution); and the intelligence set (campaign intelligence via
analytics, send-time optimisation, dwell-time tracking, GEO/AEO for reach). Intents
proposed by Claude per delegation — pending confirmation. NOT a generic marketing
shelf.
