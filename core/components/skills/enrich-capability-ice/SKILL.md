---
name: enrich-capability-ice
description: Deepen one capability's goals-only seed ICE into a rich ICE — full intent (goals, constraints, failures), context (persona, systems, scope), expectations (outcomes), and concrete NFR + compliance needs — grounded in the capability's KB shelf. Also emits, per NFR dimension the capability touches, the required level so the profile roll-up is mechanical. Generative artifact production for the /understand play; writes a draft only, never the live model. Use when /understand needs the rich ICE authored for a seeded capability.
version: 0.1.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# enrich-capability-ice

Turns a capability's **goals-only seed ICE** (planted by /vision) into a **rich
ICE**: full intent, context, expectations, and concrete NFR + compliance needs. It
reads the capability's KB shelf so the enrichment is grounded in known practice, not
invented. It writes a draft only — /understand's checkpoint and apply step persist it.

It also emits the bridge the profile roll-up needs: for each NFR dimension the
capability touches, the **required level** (none < low < medium < high < xhigh) its
concrete need implies. That mapping is this skill's judgment; the roll-up script then
does pure `max()` against the current box. Keeping the level call here and the
threshold math in the script is the harness-led split.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `capability_path` | yes | Path to the target capability's folder in the live model (holds `node.yaml` + the seed `ice.yaml`). |
| `seed_ice_path` | yes | The capability's current (goals-only) `ice.yaml`. |
| `kb_domain` | yes | The domain shelf to ground against, e.g. `ecommerce`. Read via the KB router. |
| `draft_dir` | yes | Output folder under STM for the draft. |
| `stm_base` | yes | From config. |

## Procedure

Reasoning (writing constraints/failures, naming personas/systems/scope, setting
concrete targets, and judging the level each need implies) is yours. Schema
conformance is non-negotiable.

1. **Read the seed + the shelf.** Read the seed ICE (the goals are the anchor) and
   the capability's KB shelf via the router (`python3 $KB shelf <kb_domain>`) — pull
   its personas, systems, NFR hints, scope, and functionality baseline. Ground the
   enrichment in that material; do not reinvent what the shelf already states.

2. **Enrich the intent.** Keep the seed goals; add `intent.constraints` (the rules
   the capability must respect) and `intent.failures` (what makes it wrong).

3. **Fill the context.** `context.persona` (the actor types that can fork the build),
   `context.systems` (the software the code talks to), and `context.scope` (the rules
   and boundaries — what's in, what's out, how it behaves).

4. **Fill the expectations.** `expectations.outcomes` — an outcome paired to each
   goal.

5. **Set concrete NFR + compliance needs.** For each dimension the capability
   touches, write an `nfr_needs.<dimension>` as a concrete, measurable target **with
   a gate** (a value and how it is checked — e.g. "auth API p99 < 150ms, checked in
   load test"). List `compliance_needs` (regimes this capability triggers, e.g.
   `PCI-DSS`). A vague adjective ("fast", "secure") is not acceptable.

6. **Emit the implied levels.** For each NFR dimension you set a need on, record the
   **required level** that need implies on the none→xhigh scale. This is the input
   the roll-up script maxes against the current box. Compliance regimes are listed
   too (the roll-up unions them into the box).

7. **Write the draft + manifest.** Write the enriched `ice.yaml` and an
   `enrich-manifest.yaml` (the implied levels, compliance, and the shelf reference
   used) under `draft_dir`. Do not touch the live model.

## Output — the draft

```
{draft_dir}/
  ice.yaml                 # the enriched (rich) ICE — full intent, context,
                           # expectations, concrete nfr_needs + compliance_needs
  enrich-manifest.yaml     # the roll-up bridge + grounding provenance
```

`enrich-manifest.yaml`:

```yaml
enrich:
  capability_ref: cap-checkout
  grounded_in: "ecommerce -> Checkout"          # the shelf material used (C5)
  implied_levels:                               # dimension -> required level + gate (the roll-up input)
    performance: { level: high,  gate: "p99 < 150ms, checked in load test" }
    security:    { level: high,  gate: "OWASP ASVS L2; no P1/P2" }
    reliability: { level: high,  gate: "99.9% uptime" }
  compliance: [PCI-DSS]                         # regimes to union into the box
```

Each `implied_levels.<dimension>` carries both the **level** (what the roll-up maxes
against the box) and the **gate** (the standard that travels with the level when the
box is established or raised). Levels are on the fixed scale
`none < low < medium < high < xhigh`.

Return the enriched contract with the `draft_dir` and `enrich-manifest.yaml` path —
paths, never inline content.

## Rules

- **Grounded.** Enrichment draws on the capability's KB shelf; record which shelf
  material was used in the manifest (C5).
- **Complete.** Every ICE section is filled — intent (goals, constraints, failures),
  context (persona, systems, scope), expectations (outcomes), `nfr_needs`,
  `compliance_needs`. No empty required section (C3).
- **Concrete needs.** Every NFR need is a measurable value with a gate, never a vague
  adjective (C4).
- **ICE only.** Write the draft ICE + manifest. Never write `node.yaml`, never write
  another capability's files, never write the profile or decisions — those are the
  play's roll-up and apply steps (C2, C9).
- **Draft only.** Write under `draft_dir`; never touch the live model.
- **Schema-true.** The enriched ICE validates against the ice v1 schema.
