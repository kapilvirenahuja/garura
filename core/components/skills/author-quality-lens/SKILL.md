---
name: author-quality-lens
description: Draft /quality's quality lens for one capability — turn the profile targets that apply and the capability's own ICE constraints/failures into a grounded, checkable list of pass/fail gates, plus a decision for any material choice. Writes a draft only (the quality lens + a grounding manifest in STM), never the live model. The generative work for the /quality play; the first realize lens, so it reads only the ICE + profile, never another lens.
version: 0.1.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-quality-lens

Turns one shaped capability's intent and its quality targets into the **quality lens**:
a flat list of gates the capability must pass. A gate is a pass/fail check — "p99 <
150ms", "no user enumeration", "WCAG 2.1 AA", "lockout after 5 failed attempts". It
draws every gate from one of two places and nowhere else:

- a **profile target** that applies to this capability (the box's NFR gates), or
- one of the capability's **ICE constraints or failures**, made checkable.

It writes a draft only — /quality's checkpoint and apply step persist it. It is the
**first** realize lens, so it reads the capability's ICE and the profile and never
another lens.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `capability_path` | yes | The capability folder in the live model, e.g. `{product_base}/product-os/order-management/checkout`. |
| `profile_path` | yes | The product `profile.yaml`. Read-only — the source of the applicable targets. |
| `draft_dir` | yes | Output folder under STM for the draft lens + manifest. |
| `stm_base` | yes | From config. |

## Procedure

The gate wording and which targets apply are your judgment; grounding and shape are
non-negotiable.

1. **Read the capability + the box.** Load the capability `node.yaml` + rich `ice.yaml`
   (intent constraints + failures, context, expectations, nfr_needs) and the profile
   box. Do NOT read another lens — quality is first.

2. **Pull the applicable targets.** From the profile box, take the NFR gates that apply
   to this capability (speed, uptime, security, accessibility, and the like). Each
   becomes a gate, stated as a pass/fail with its value (e.g. "p99 < 150ms").

3. **Make the ICE rules checkable.** For each relevant ICE constraint or failure, write
   the gate that proves it holds — e.g. failure "user enumeration is possible" → gate
   "no user enumeration on login or reset".

4. **Keep it concrete.** Every gate is a clear pass/fail. Where the dimension has a
   number, the gate carries it. No bare adjectives ("fast", "secure"). No how-to-test,
   no coverage, no environments — that is the builder's and /validate's job, not this
   lens.

5. **Record a decision for a material choice.** When you pick a specific level the box
   left open (e.g. ASVS L2 rather than L1), draft a capability-level decision (ADR)
   naming the choice and why.

6. **Write the draft + manifest.** Write `lens/quality.yaml` (the v1 lens envelope with
   `type: quality`, `content.gates`) under `draft_dir`, mirroring the live relative
   path, plus any decisions, plus a `quality-manifest.yaml` that grounds **every gate**
   to its source so the play's validate step is mechanical:

```yaml
quality:
  capability: <capability id>
  gates:
    - gate: "p99 < 150ms"
      source_type: profile          # profile | ice
      source: "speed.p99 target"
    - gate: "no user enumeration on login or reset"
      source_type: ice
      source: "intent.failures[2]"
    - gate: "OWASP ASVS L2; no P1/P2"
      source_type: profile
      source: "security target (level left open)"
      material: true                # a choice the box left open
      decision: <decision-id>       # the ADR that records it
  decisions: [<decision-id>, ...]    # ids of any decisions drafted
```

## Output — the draft

```
{draft_dir}/
  product-os/<capability-path>/
    lens/quality.yaml
    decisions/<decision-id>.yaml      # only if a material choice was made
  quality-manifest.yaml
```

## Boundaries

### NEVER
- Read or reference another lens (ux/architecture/run/agentic) — quality is first.
- Write the ICE, the profile, another lens, or node structure/status — draft only the
  quality lens (+ decisions).
- Invent a gate with no profile target and no ICE rule behind it.
- Put how-to-test, coverage, or environments in the lens — gates only.
- Emit a vague gate — every gate is a concrete pass/fail.

### ALWAYS
- Ground every gate in the manifest to a profile target or an ICE constraint/failure.
- Keep `content` to the single `gates` key per the quality lens schema.
- Return the draft paths, not the contents.
