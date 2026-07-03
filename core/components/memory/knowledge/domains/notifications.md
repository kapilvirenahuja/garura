---
id: domains/notifications
title: "Notifications: real-time, multi-channel, nudge-first — adapt the experience, not just ring a bell"
conditions:
  trigger: "the product reaches a user with a timely message — in-app, push, email, SMS — transactional or lifecycle"
  selection_keys: [presence-real-time, channel-mix, message-type, player-type-tailoring, consent-regime]
provenance: interview (#434 — Kapil)
---

# Notifications: how we build it

## Stance (non-negotiable)
**Real-time, across channels, nudge-first.** The direction we're moving: **if a
person is ON, nudge the experience — don't ring a bell.** A bell is for when they're
away; when they're present, adapt the experience in-session (hand to the
`experience` nudge layer). Notifications cover **both transactional and
marketing-type messages** — but **outbound reach / campaigns is separate** (that's
`marketing`). **Multi-channel is key.**

Content-led and intent-first: brand-tone carries into nudges, and **gamified
behaviour (player type) becomes key** — who the person is as a player shapes what
and how we nudge.

Leans on: `experience` (in-session nudges, gamified psychology, behavioural
signals), `personalization` (player type / behavioural profile),
`content-management` (brand-tone, templates), `marketing` (outbound reach — NOT here).

## The shift — nudge the experience, not a bell
The core move. Presence changes the channel:
- **Person is present (in-session)** → **nudge the experience itself** — adapt the
  glass in the moment. This is `experience`'s governed nudge layer; notifications
  routes to it rather than firing a bell.
- **Person is away** → send the channel message (push, email, SMS, in-app badge).

A bell when you could have nudged the live experience is a missed, lower-value
intervention.

## Multi-channel + templates via experience
- **Channels** — in-app, push, email, SMS (and more as needed). Multi-channel is
  the baseline, not a stretch.
- **Per-channel templates, defined via the experience layer** — one message,
  channel-appropriate renderings, authored where the experience is composed.
- **Brand-tone** — consistent voice across every channel and into nudges
  (shared with `content-management` / `ecommerce`).

## Player type — gamified behaviour tailoring
Tailor the nudge to the **player type** (gamification segmentation of behaviour) —
the same gamified-psychology thread that runs through `experience`. What motivates
one player type (progress, achievement, exploration, social) is noise to another;
the nudge adapts to it.

## Intents this domain captures (proposed — sanity-check)
**Recipient intents**
- **Be informed in time** — "tell me what I need, when it matters" → timely message/nudge.
- **Be met on the right channel** — "reach me where I am" → multi-channel routing; nudge if present.
- **Not be spammed** — "don't overload me" → frequency, fatigue control.
- **Stay in control** — "set my channels and preferences" → preference + consent.

**Operator intents**
- **Reach reliably** — "the message lands, on the right channel" → delivery + routing.
- **Nudge in-session** — "if they're here, move the experience" → route to `experience`.
- **Tailor by player type** — "make it land for who they are" → gamified tailoring.

## Capabilities
The capabilities this shelf implies, each with functionalities at baseline depth.
Read each functionality line as "include when {profile condition}". Start at the
floor; add only when a profile dimension calls for it. These serve the POV above —
they do not replace it.

- **Channel delivery** — reach the user wherever they are. Multi-channel is the
  floor, not a stretch (flat list — channels are independent, add per surface).
  - In-app — the floor; messages and badges inside the product (`shape.surfaces` includes web/mobile/desktop).
  - Push — when `shape.surfaces` includes mobile (or web with push support) and timely re-engagement matters.
  - Email — when `shape.surfaces` includes web/api and you need durable, away-from-app reach.
  - SMS — when `shape.surfaces` includes mobile and reach must not depend on app/email; add `nfr.privacy >= high` care for phone numbers.
- **Templating** — one message, channel-appropriate renderings, authored via the experience layer.
  - Per-channel templates — the floor once more than one channel exists; one message, channel-specific rendering composed where the experience is.
  - Brand-tone consistency — when `content-management` governs voice, or `shape.stage` is public/monetized so off-voice messages cost trust.
- **Nudge routing** — the differentiator: route on presence, not a blind send.
  - Level 1 — presence detection: is the person in-session right now (the floor for routing at all).
  - Level 2 — in-session experience-nudge vs channel-bell: present → hand to `experience`'s nudge layer; away → fire the channel. Add when real-time presence signals are reliable.
  - Level 3 — player-type tailoring: shape the nudge to gamified behaviour (progress/achievement/exploration/social). Add when `personalization` supplies a behavioural profile.
- **Preferences & frequency** — let the user stay in control; never spam.
  - Opt-in / opt-out — the floor; consent to be reached at all (`nfr.privacy >= medium`, or `compliance` includes GDPR).
  - Per-channel preference — when more than one channel exists, so the user picks where each message type lands.
  - Fatigue / frequency control — when message volume rises, or `shape.stage` is public/monetized; cap low-value sends to protect attention.

## Where it goes wrong
- **Fatigue & noise** — too many low-value messages; no frequency discipline.
- **Wrong channel** — bell when an in-session experience nudge would have been better;
  or a channel the user didn't want.
- **Consent & preference gaps** — ignoring opt-in/opt-out and per-channel preference.
- **Brand-tone drift** — inconsistent voice across channels.
- **One-size nudging** — ignoring player type, so motivation misfires.

## Intelligence features
**Core — real-time, content + behaviour led (ours)**
- **In-session experience nudging** — adapt the glass when present (with `experience`).
- **Player-type tailoring** — gamified-behaviour-aware nudges.
- **Channel & send-time optimisation** — right channel, right moment.
- **Brand-tone in nudges** — on-voice, generated/checked.

**Adjacent — delivery infrastructure**
- Deliverability, channel gateways, retries — necessary plumbing, not the edge.

## Non-negotiables
- **Real-time, multi-channel** — by default.
- **Nudge the experience when present; bell only when away.**
- **Templates per channel, authored via the experience layer.**
- **Brand-tone consistent** across channels and nudges.
- **Player-type aware** — tailor to gamified behaviour.
- **Consent & preference + frequency discipline** — never spam.

## Rationale
The differentiator is treating notification as a *nudge decision*, not a *send*:
when the user is live, the highest-value move is to adapt the experience, and the
channel message is the fallback for absence. Multi-channel with experience-authored
templates keeps one message coherent everywhere, and brand-tone + player-type tailor
it to land. Folding transactional and lifecycle messages together (while keeping
outbound campaigns in `marketing`) matches how a user actually experiences messages
— they don't care which system sent it, only whether it was timely, relevant, and
not noise.

## Evolve when
- Presence/real-time signals mature → push more sends into in-session experience nudges.
- New channels matter → add them to the multi-channel template set.
- Player-type modelling deepens (with `personalization`) → tailor nudges harder.
- Fatigue shows up → tighten frequency and value thresholds.

## Provenance
interview (#434 — Kapil): real-time, multi-channel, nudge-first; the "if a person is
on, nudge the experience not a bell" shift; notifications spans transactional +
marketing-type messages while outbound reach stays in `marketing`; per-channel
templates defined via the experience layer; brand-tone connects to nudges; and
gamified behaviour / player type as key tailoring. Intents proposed by Claude per
delegation — pending confirmation. NOT a generic notifications shelf.
