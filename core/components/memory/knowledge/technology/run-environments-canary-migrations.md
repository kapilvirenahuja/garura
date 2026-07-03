---
id: technology/run-environments-canary-migrations
title: "Release discipline for a modular monolith: fixture-only local, sanitized staging, cohort canary, flags as rollback, additive migrations"
conditions:
  architecture: modular-monolith
  users: team-to-org            # ~100–1,000 known users, not anonymous mass public
  stage: internal-or-early
  cloud: any
evolve_when: []
provenance: "documented (Kapil — run-lens checkpoint of a live deployment, Token data spine slice, 2026-06-11) + assistant"
---

# Release discipline for a modular monolith: fixture-only local, sanitized staging, cohort canary, flags as rollback, additive migrations

## Topic
How a modular monolith for a known population (a team to an org, roughly 100–1,000 people)
moves from a developer's machine to production — the environment ladder, the rollout shape,
the rollback story, the migration rule, the config/secrets split, and the CI/CD gate list.
This is the release-mechanics complement to `technology/gcp-modular-monolith-runtime`
(which owns the runtime stack); it is cloud-agnostic. Not enterprise software, not
microservices — one deployment, shipped often, to people you can name.

This is the **default decision-maker** for the run lens at this profile, and its stance is
deliberately **light**: a lightweight web app that needs to move fast carries the fewest
practices that keep releases from breaking — not too many things, but nothing broken.
Every practice below earns its place by preventing breakage; anything beyond this list
needs evidence before it's added.

## Conditions
A modular monolith serving a known user population in the hundreds to low thousands —
an internal product or an early external one with identifiable cohorts (teams). If users
are anonymous mass public, canary-by-cohort stops working and you canary by traffic share
instead; if the architecture is microservices, per-service pipelines change the picture
(see `architecture/microservices`).

## Recommendation
- **Proportionality first.** This is the whole list. Don't add release process beyond it
  without a failure that demands it — at this scale, extra ceremony costs shipping speed
  and buys nothing. Equally, don't drop below it: each item below maps to a real way
  releases break.
- **Three environments, each with a distinct data stance.**
  - **local** — fixtures only. No real data on a developer machine, ever; fixtures double
    as the test bed for the CI gates.
  - **staging** — sanitized production-shaped data, and the place where **migration dry
    runs** happen before any release that touches the schema.
  - **prod** — the central server; the only place real data, scheduled jobs, and
    user-facing surfaces live.
- **Canary by cohort, not by percentage.** Because the population is known, ramp in named
  steps: staging dry run → one configured team → everyone. A cohort gives you real users,
  a real owner to ask "anything weird?", and a clean blast-radius boundary — better signal
  than an anonymous traffic slice at this scale.
- **Feature flags sit on the risky seams.** Flag the boundaries where data enters, leaves,
  or gets exposed — ingestion per source, exports/digests, privacy-affecting behavior.
  Not every feature needs a flag; every irreversible-looking seam does, because the flags
  are the rollback mechanism.
- **Rollback flips flags, never deletes data.** Rolling back disables the risky behaviors
  but keeps everything already stored — accumulated records, histories, corrections —
  intact. A rollback that loses user data is worse than the incident it fixes.
- **Migrations are additive-only per release.** A release may add tables/columns/shapes;
  the destructive half (drop, rename-in-place) ships in a *later* release after reads have
  moved. Same expand-contract stance as the runtime learning, stated as a release rule:
  no destructive schema change rides in the same release that introduces its replacement.
- **Config and secrets are different things.** Behavior that legitimately varies — per-team
  toggles, formula/logic versions, cache policy, export scope — is versioned config.
  Credentials and provider keys live only in secrets management, never in the repo or the
  config files.
- **The CI/CD gate list mirrors the risky seams.** Build + schema validation on every
  ingested source, fixture suites for each judgment-bearing module (calculations, privacy,
  taxonomy/config), a migration dry run, a staging smoke run of the real pipeline, a
  privacy scan on anything exported, and a coverage check in prod. The principle: every
  seam that got a flag also gets a gate, and gates run on fixtures, not live data.
- **Every architecture component has a run target.** Nothing in the architecture lens is
  unplaced — each component is explicitly a central service/module, a managed datastore,
  or a provider-managed boundary you don't operate. Unplaced components are where "works
  on my machine" hides.

## Rationale
At 100–1,000 known users you have something mass-market products don't: addressable
cohorts. Canary-by-team exploits that — one team absorbs a bad release, tells you, and the
blast radius is a conversation, not an incident report. Flags-as-rollback plus
additive-only migrations together make every release reversible in seconds without data
loss, which is what lets a small team ship a monolith frequently without fear. The
local/staging/prod data stances (fixtures / sanitized / real) keep real data out of the
two places it leaks from most — laptops and test environments. And gating CI on the same
seams that carry the flags means the pipeline tests exactly the things the rollback plan
worries about, instead of a generic test pile. The discipline is intentionally a floor,
not a program: a small team moving fast keeps exactly the practices that stop breakage
and refuses the rest — that refusal is itself the practice.

## Evolve when
The population grows anonymous (cohorts stop being nameable) → switch the canary unit to
traffic share with automated rollback triggers. Independent deploy cadences or scale split
the monolith → per-service pipelines and per-service migration discipline
(`architecture/microservices`).

## Provenance
documented (Kapil — run-lens checkpoint of a live deployment, "Token data spine" slice,
2026-06-11) + assistant.
