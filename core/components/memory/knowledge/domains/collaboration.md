---
id: domains/collaboration
title: "Collaboration: people working together on shared things — real-time, presence, co-editing"
conditions:
  trigger: "more than one person works on the same content/object — comments, sharing, presence, co-editing"
  selection_keys: [real-time-need, co-edit-depth, sharing-permission-model, presence-need, scale]
provenance: Claude-drafted while Kapil away, reviewed and accepted (#434)
---

# Collaboration: how we build it

> **Claude-drafted while Kapil was away; reviewed and accepted by Kapil (#434).**
> Leaned toward this practice's themes (real-time, the experience layer, content,
> brand-tone). Accepted as the working shelf.

## Stance (proposed)
Collaboration is **more than one person working on the same thing** — content,
a document, a design, an object. The spine I'd propose, consistent with this
practice: **real-time and presence-first**, on the same experience/content layer
we already lead with. When people are present together, the experience should show
it and let them act together live — the same "nudge the live experience" instinct
from `notifications` and `experience`, applied to co-presence.

Leans on: `user-management` (identity, roles, permissions), `content-management`
(the shared content being worked on), `notifications` (mentions, activity alerts —
nudge in-session when present), `experience` (real-time presence on the glass).

Likely **not the practice's core strength** — may be a productivity-product
capability you build only when the product is collaborative, or a hand-off. Confirm.

## Intents this domain captures (proposed — sanity-check)
**Collaborator intents**
- **Work together live** — "edit/act on the same thing at once without clobbering" → co-editing, presence.
- **Discuss in place** — "comment and resolve where the work is" → comments, threads, annotations.
- **Get someone's attention** — "pull a person in" → mentions (routes to `notifications`).
- **Share & control access** — "let the right people in, at the right level" → sharing + permissions.
- **See what changed** — "who did what, and roll back" → activity feed, history, versioning.

**Operator intents**
- **Govern access** — "who can see/do what" → permission model (with `user-management`).
- **Keep an audit trail** — "a record of who changed what" → history/audit.

## Capabilities
- **Presence** — who's here now, where their cursor/focus is.
  - Online/last-seen status — who's on the object now or recently — when `shape.users: small-team`/`public` and people share work.
  - Live cursors & focus — where each person's cursor/selection is, live — only when concurrent editing is genuinely needed (real-time path).
- **Real-time co-editing** — concurrent edits without conflict (CRDT/OT-class) —
  the hard, high-value core when real-time is genuinely needed.
  - Level 1 — async first: one editor at a time, comments/handoff cover the rest — the floor; most products stop here.
  - Level 2 — soft locking / check-out: lock the object or section while one person edits, others see it's busy — when `shape.users: small-team` and edit collisions actually happen.
  - Level 3 — true concurrent co-editing (CRDT/OT): many people edit live without clobbering — only when concurrent editing is a genuine requirement and `nfr.reliability >= high`.
- **Comments & annotations** — threaded, resolvable, anchored to the object.
  - Threaded comments — discuss in place, reply, resolve — the floor for any shared object.
  - Anchored annotations — pin a comment to a region/selection of the object — when the work is spatial (design, doc) and `shape.users: small-team`/`public`.
- **Mentions** — @-people; routes through `notifications` (nudge if present).
  - @-mention — pull a named person in; delivery routes through `notifications` — the floor once comments exist and users have identities.
- **Sharing & permissions** — share links, roles, granular access (with `user-management`).
  - Level 1 — private + explicit invite: owner shares to named people — the floor.
  - Level 2 — role-based access (view/comment/edit): tiers on the shared object — when `shape.users: small-team`.
  - Level 3 — share links / public access: link-based or open sharing — when `shape.users: public`; tighten when `nfr.privacy >= high` or `compliance` includes GDPR/SOC2.
- **Activity feed & history** — what changed, by whom; versioning and rollback.
  - Activity feed — chronological "who did what" on the object — the floor whenever more than one person touches it.
  - Version history & rollback — snapshots with restore — when concurrent or frequent editing happens; required when `nfr.reliability >= high` or `compliance` includes SOC2/GDPR (audit trail).

## Where it goes wrong (proposed)
- **Real-time when you didn't need it** — co-editing infra (CRDT/OT) is expensive;
  don't take it on unless concurrent editing is a real requirement. Async comments
  cover most cases.
- **Permission model bolted on late** — sharing/access designed after the fact
  leaks data; model it up front with `user-management`.
- **Notification noise** — every collaboration event paged out; route through
  `notifications`' frequency/nudge discipline instead.
- **No history/rollback** — concurrent edits with no audit or undo path.

## Intelligence features (proposed)
**Core — content/experience-connected**
- **Presence-aware experience** — adapt the glass to who's collaborating live.
- **Smart mention/notify routing** — nudge in-session vs notify when away (with `notifications`).
- **Summarise activity / changes** — AI digest of what happened while you were away.

**Adjacent**
- Conflict-resolution tooling, advanced merge — infrastructure, likely handed off.

## Non-negotiables (proposed)
- **Don't build real-time co-editing unless it's truly needed** — async comments first.
- **Model sharing & permissions up front** — with `user-management`.
- **Route collaboration alerts through `notifications`** — no separate noise channel.
- **Keep history & rollback** — concurrent work needs an audit/undo path.

## Rationale
The expensive decision in collaboration is real-time co-editing: it carries serious
infrastructure (conflict-free concurrent editing) and should only be taken on when
concurrent editing is a genuine requirement — async commenting and presence cover
most products. Beyond that, collaboration is mostly composition of capabilities this
practice already owns: identity/permissions from `user-management`, the shared
content from `content-management`, in-session presence from `experience`, and
mentions/activity through `notifications`. That's why I've drawn it as a
presence-first, real-time-when-needed domain rather than a heavy standalone build.

## Evolve when
- Concurrent editing becomes a real need → invest in real-time co-editing (CRDT/OT).
- Teams/orgs grow → deepen the sharing/permission model with `user-management`.
- Activity volume rises → add AI activity summaries and smarter mention routing.

## Provenance
Claude-drafted while Kapil away, reviewed and accepted (#434). Built on the locked
shelf template, leaned toward the practice's real-time/experience/content themes.
Treated as a productivity-product capability / likely hand-off unless the product is
inherently collaborative.
