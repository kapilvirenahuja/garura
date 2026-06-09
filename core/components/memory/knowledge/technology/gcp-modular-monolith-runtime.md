---
id: technology/gcp-modular-monolith-runtime
title: "Modular-monolith runtime on GCP: Cloud Run + Cloud SQL Postgres, cache only when it earns it, secure by default"
conditions:
  architecture: modular-monolith
  cloud: gcp
  stage: early-or-growth        # prototype | early | growth | scale
  persistence: some-to-full
  datastore: postgresql
evolve_when: []
provenance: "documented (Kapil, #434 — preferred runtime for a modular monolith)"
---

# Modular-monolith runtime on GCP: Cloud Run + Cloud SQL Postgres, cache only when it earns it, secure by default

## Topic
How a modular monolith is deployed and run on GCP — the deploy target, the datastore,
the caching stance, the environments/rollout, migrations, and the security baseline. This
is the operational lens (`/run`) for a product whose architecture is a modular monolith.

## Conditions
A modular monolith (one deployment, enforced module boundaries) at early-to-growth stage,
running on GCP, with real persistence. The default before the scale conditions that earn
microservices (see `architecture/microservices`).

## Recommendation
- **Deploy target.** Run the monolith as a container on **Cloud Run** — managed, scales on
  demand (to zero when idle), and gives gradual traffic shifting between revisions for free.
  Reach for GKE only when you genuinely outgrow Cloud Run (long-lived connections, complex
  networking, sidecars); don't start there.
- **Datastore.** **Cloud SQL for PostgreSQL** is the default store. Postgres is the
  preferred database — one relational store until a proven need forces another. Connect over
  the private path (Cloud SQL connector / private IP), never a public address.
- **Caching — only when it earns it.** Do **not** cache by default. Read straight from
  Postgres. Add a cache only for a *proven* high-performance hot path: prefer a lightweight
  in-process cache first, then Memorystore (Redis) if it must be shared across instances.
  Every cache entry is a deliberate decision with an invalidation story — an un-earned cache
  is a correctness bug waiting to happen.
- **Environments + rollout.** Promote dev → staging → prod. Roll out with Cloud Run
  revisions and **gradual traffic** (start small, watch, ramp) — not a hard cutover.
- **Migrations.** Data changes are **expand-contract** and reversible: add the new shape,
  backfill, switch reads, then remove the old — never an in-place destructive cutover.
- **Security baseline (non-negotiable).** No public database. Private networking between
  Cloud Run and Cloud SQL. **Secrets in Secret Manager, never in the repo or an image.**
  Least-privilege service accounts (one per service, only the grants it needs). TLS
  everywhere. Lock ingress and ports to the minimum the service actually needs — close
  everything else by default.

## Rationale
Cloud Run + Cloud SQL is the lowest-operations way to run a modular monolith with real data
on GCP: managed runtime, managed Postgres, built-in gradual rollout, scale-to-zero economy.
Postgres-by-default avoids premature datastore sprawl. The "cache only when earned" rule is
the hard-won one — caches added "for performance" without evidence are the top source of
stale-data bugs; the database is fast enough until proven otherwise. Expand-contract
migrations and gradual rollout keep every change reversible, which is what makes a single
deployment safe to ship often. Secrets-in-manager + least-privilege + closed ingress is the
floor that prevents the most common production incidents.

## Evolve when
Scale, team size, or independent-deploy pressure crosses the line where one deployment holds
the product back → climb to a microservices runtime (each service its own deploy + store).
See `architecture/microservices`.

## Provenance
documented (Kapil, #434).
