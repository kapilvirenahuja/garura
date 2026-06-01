---
# Machine-readable facets — the search key. Keep keys consistent across files.
# The script reads this frontmatter to build the manifest; the model reads the
# body below to judge fit. Files whose name starts with "_" are ignored.
id: shelf/slug                      # e.g. architecture/single-user-throwaway
title: One-line title
conditions:
  stage: prototype                  # prototype | internal | public | monetized
  users: one                        # one | small-team | public
  persistence: none                 # none | some | full
  monetization: none                # none | lead-capture | paywall
  # add other condition signals as needed
evolve_when:                        # ids of the learnings to climb to next
  - shelf/other-slug
provenance: seeded                  # seeded | learned:product-or-issue
---

# {Learning title}

## Topic
What this learning is about — a domain / capability / feature, or an
architecture or product-stage question.

## Conditions
Prose elaboration of the facets above — the situation this applies to.

## Recommendation
What works best under these conditions: capabilities/features to include (or
deliberately leave out), and the architecture (stack, hosting, data, auth,
integrations).

## Rationale
The empirical why — what we learned, the evidence, why this beats the
alternatives under these conditions.

## Evolve when
The trigger that changes the conditions, and the learning to climb to next
(matches the `evolve_when` ids above, as links).

## Provenance
seeded | learned from {product / issue}
