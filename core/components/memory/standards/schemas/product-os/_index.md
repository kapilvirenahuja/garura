# Product-OS Schemas — v1

The persistent data model for the ProductOS Command Model. These schemas define
the three things ProductOS keeps forever — structure, intent, decisions — plus
the two delivery artifacts that ride on top.

| Schema | Keeps | Lifecycle |
|--------|-------|-----------|
| `product-os.yaml` | the Domain → Capability → Functionality tree, personas, journeys | permanent |
| `ice.yaml` | Intent / Context / Expectations on a node (the build unit at functionality level) | permanent |
| `decision.yaml` | decision records (ADRs) at any level | permanent |
| `lens/` (one file per type) | the 5 realize lenses (ux, architecture, run, quality, agentic) | permanent |
| `slice.yaml` | a vertical product increment — functionalities (across capabilities of one domain) bundled into a usable increment; written by /shape, planned by /roadmap | permanent |
| `epic.yaml` | a vertical slice of a functionality — the delivery/issue grain | temporary (deleted on merge) |
| `product-profile.yaml` | the NFR + shape posture of a product; the vocabulary the KB matches conditions against | permanent |

Two "vertical slice" terms, deliberately distinct: a **slice** (`slice.yaml`) is the
product-increment level — whole functionalities bundled into a usable increment, from
/shape, planned by /roadmap. An **epic** (`epic.yaml`) is the engineering grain — one
functionality cut end-to-end through its components, from /grill inside a chosen slice.

Storage tiers (see `product-os.yaml` storage layout):
- **Permanent** (product-os): structure, ICE, decisions, the 5 lenses.
- **Temporary** (product-os): epics — survive the /grill → /implement boundary, deleted on merge.
- **STM only**: stories, tests, build detail produced by /implement.

Schema evolution is parked for v1: a dedicated schema-evolution play will own it
later, and it implies migrating existing records to the new shape.

Created under issue #434 (Realign Garura to the ProductOS Command Model), Phase B.
