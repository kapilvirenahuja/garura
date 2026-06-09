---
name: author-roadmap
description: Draft /roadmap's value ordering — read each active and proposed feature's ICE goals and outcomes and order the features by value within each tier, with a one-line reason per feature, plus the un-rankable list. Writes a draft only (value-order.yaml in STM), never the live model and never the final priority numbers. The value judgment for the /roadmap play; the structural ranking (tiers, dependencies, integers) is the play's compute_ranking.py, not this skill.
version: 0.1.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-roadmap

Reads the features the model already holds and produces the one thing the ranking
needs that a script cannot: a **value judgment**. For each tier — active features and
proposed features — it orders the features from most to least worth building, judged
from each feature's ICE goals and expected outcomes against the product's goals, and
writes a one-line reason for each.

It writes a **draft only** (`value-order.yaml`). It does NOT assign priority numbers,
does NOT enforce the tier rule, and does NOT resolve dependencies — those are
deterministic and belong to the play's `compute_ranking.py`. This skill supplies the
preference; the script turns preference into a coherent, dependency-correct ranking.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `snapshot_path` | yes | The `snapshot.json` the play captured — the feature set with id, status, ice_ref, and `ice_present`. Use it as the authoritative list of what to order. |
| `product_base` | yes | From config — to resolve each feature's `ice.yaml` for its goals + outcomes. |
| `out_path` | yes | Where to write `value-order.yaml` under STM. |
| `stm_base` | yes | From config. |

## Procedure

The value preference is yours; the data discipline is non-negotiable.

1. **Read the feature set.** From `snapshot.json`, take every functionality node with
   status `active` or `proposed` and `ice_present: true`. A feature with
   `ice_present: false` is **un-rankable** — list it, never order it.

2. **Read each feature's value.** For each rankable feature, open its `ice.yaml`
   (resolve from the node's folder under `product_base/product-os/...`) and read
   `intent.goals` and `expectations.outcomes`. That — what the feature delivers and the
   outcome it targets — is the basis for value. Do not read or weigh status here; the
   two tiers are ranked separately and the tier rule is the script's job.

3. **Order within each tier.** Produce two ordered lists, `active` and `proposed`,
   most-valuable first. Judge value on outcome impact against the product's goals, not
   on effort or dependency order (dependencies are the script's concern). Order the two
   tiers independently — never interleave them.

4. **Write a one-line reason per feature.** For every rankable feature, a single
   sentence saying why it sits where it does in value terms. These reasons surface at
   the play's checkpoint, so they must read as plain product rationale.

5. **Write the draft.** Emit `value-order.yaml` at `out_path` in exactly this shape:

```yaml
value_order:
  active:                    # ordered, most valuable first — ids only
    - <feature-id>
    - <feature-id>
  proposed:                  # ordered, most valuable first — ids only
    - <feature-id>
  reasons:                   # one per rankable feature, any order
    - id: <feature-id>
      reason: <one sentence, value terms>
  unrankable:                # active|proposed features with no ICE
    - <feature-id>
```

## Boundaries

### NEVER
- Assign a priority number, enforce the tier rule, or reorder for dependencies — that
  is `compute_ranking.py`'s deterministic job.
- Order a feature with no ICE — it is un-rankable; list it and move on.
- Interleave active and proposed features — they are two separate ordered lists.
- Write the live model, or anything other than `value-order.yaml` at `out_path`.
- Judge value from effort, branch, or implementation detail — value is outcome impact
  read from ICE goals + expectations.

### ALWAYS
- Cover every rankable feature in both its tier list and the `reasons` list.
- Keep reasons to one plain sentence, readable at a human checkpoint.
- Return the draft path, not its contents.
