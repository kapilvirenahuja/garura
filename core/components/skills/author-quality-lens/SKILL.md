---
name: author-quality-lens
description: Draft /quality's quality lens for one SLICE — turn the profile targets that apply and the slice's functionalities' ICE constraints/failures into a grounded, checkable list of pass/fail gates, plus a decision for any material choice. Writes a draft only (the quality lens + a grounding manifest in STM), never the live model. The generative work for the /quality play; the first realize lens, so it reads only the slice's hub (its functionalities' ICE + the profile), never another lens.
version: 0.2.0
user-invocable: false
model: opus
allowed-tools: Read, Write, Bash, Glob
---

# author-quality-lens

Turns one shaped **slice's** hub and its quality targets into the **quality lens**: a flat
list of gates the slice must pass. A gate is a pass/fail check — "p99 < 150ms", "no user
enumeration", "WCAG 2.1 AA", "lockout after 5 failed attempts". A slice is a vertical product
increment; its **hub** is the union of its functionalities' ICE (which may span several
capabilities) plus the product profile. It draws every gate from one of two places and
nowhere else:

- a **profile target** that applies to this slice (the box's NFR gates), or
- one of the slice's functionalities' **ICE constraints or failures**, made checkable.

It writes a draft only — /quality's checkpoint and apply step persist it. It is the **first**
realize lens, so it reads the slice's hub and never another lens.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `slice_ref` | yes | The slice, `{domain}/{slice-id}`. |
| `slice_file` | yes | The slice record path (read-only). |
| `functionality_ices` | yes | The resolved ICE file paths for the slice's functionalities (the hub), from the readiness gate. |
| `profile_path` | yes | The product `profile.yaml`. Read-only — the source of the applicable targets. |
| `lens_rel` | yes | The slice's lens path to mirror in the draft, e.g. `product-os/{domain}/slices/{slice-id}/lens/quality.yaml`. |
| `draft_dir` | yes | Output folder under STM for the draft lens + manifest. |
| `stm_base` | yes | From config. |

## Procedure

The gate wording and which targets apply are your judgment; grounding and shape are
non-negotiable.

1. **Read the slice's hub + the box.** Load the slice record and every functionality ICE in
   `functionality_ices` (intent constraints + failures, context, expectations, nfr_needs) and
   the profile box. Do NOT read another lens — quality is first.

2. **Pull the applicable targets.** From the profile box, take the NFR gates that apply to
   this slice (speed, uptime, security, accessibility, and the like). Each becomes a gate,
   stated as a pass/fail with its value (e.g. "p99 < 150ms").

3. **Make the ICE rules checkable.** For each relevant ICE constraint or failure across the
   slice's functionalities, write the gate that proves it holds — e.g. failure "user
   enumeration is possible" → gate "no user enumeration on login or reset".

4. **Keep it concrete.** Every gate is a clear pass/fail. Where the dimension has a number,
   the gate carries it. No bare adjectives ("fast", "secure"). No how-to-test, no coverage,
   no environments — that is the builder's and /validate's job, not this lens.

5. **Record a decision for a material choice.** When you pick a specific level the box left
   open (e.g. ASVS L2 rather than L1), draft a slice-level decision (ADR) naming the choice
   and why.

6. **Write the draft + manifest.** Write the quality lens (the v1 lens envelope with
   `type: quality`, `slice_ref`, `content.gates`) under `draft_dir`, mirroring `lens_rel`,
   plus any decisions, plus a `quality-manifest.yaml` that grounds **every gate** to its
   source so the play's validate step is mechanical:

```yaml
quality:
  slice: <domain>/<slice-id>
  gates:
    - gate: "p99 < 150ms"
      source_type: profile          # profile | ice
      source: "speed.p99 target"
    - gate: "no user enumeration on login or reset"
      source_type: ice
      source: "func-...: intent.failures[2]"
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
  product-os/<domain>/slices/<slice-id>/
    lens/quality.yaml
    decisions/<decision-id>.yaml      # only if a material choice was made
  quality-manifest.yaml
```

## Boundaries

### NEVER
- Read or reference another lens (ux/agentic/architecture/run) — quality is first.
- Write the slice record, a functionality's ICE, the profile, another lens, or node
  structure/status — draft only the quality lens (+ decisions).
- Invent a gate with no profile target and no ICE rule behind it.
- Put how-to-test, coverage, or environments in the lens — gates only.
- Emit a vague gate — every gate is a concrete pass/fail.

### ALWAYS
- Ground every gate in the manifest to a profile target or a functionality's ICE
  constraint/failure.
- Keep `content` to the single `gates` key per the quality lens schema.
- Return the draft paths, not the contents.
