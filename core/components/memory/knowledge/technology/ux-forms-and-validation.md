---
id: technology/ux-forms-and-validation
title: "Forms: inline validation, progressive disclosure, autosave, plain-language recovery"
conditions:
  surface: web-app-or-site
  has-forms: true
  stage: any
evolve_when: []
provenance: "seeded (assistant, #434 — accepted by Kapil)"
---

# Forms: inline validation, progressive disclosure, autosave, plain-language recovery

## Topic
How forms and user input are designed — the single most error-prone, abandonment-prone
surface in most products. A `/ux` pattern for any slice that collects input.

## Conditions
Any surface with forms — sign-up, checkout, settings, data entry, anything the user types
into.

## Recommendation
- **Inline, real-time validation.** Validate per field as the user leaves it, with the error
  next to the field — not a wall of errors on submit. Confirm valid input quietly too.
- **Progressive disclosure.** Ask for the minimum up front; reveal further fields only as
  they become relevant. Don't show a 30-field form when 5 will start the job.
- **Autosave / preserve input.** Never lose what the user typed — autosave drafts for long
  forms, and on a failed submit keep every field filled. Losing a half-filled form is the
  fastest way to lose the user.
- **Plain-language error recovery.** Errors say what's wrong and how to fix it, in plain
  words ("Card expired — try another card"), never a code or a blame. Point to the field and
  keep the rest intact.
- **Sensible input affordances** — right input types/keyboards, clear labels (not just
  placeholders), forgiving formats (accept the phone number however they type it).

## Rationale
Forms are where conversion and trust are won or lost. Submit-time-only validation makes users
fix errors blind; lost input on a failed submit causes abandonment; a long undifferentiated
form scares people off before they start. Inline validation + progressive disclosure +
preserved input directly attack the three biggest causes of form abandonment, and
plain-language errors turn a dead-end into a recoverable step. These are well-established
conversion findings, cheap to apply, and easy to skip — so they're worth pinning as a
pattern.

## Evolve when
A flow grows into many steps or high-stakes data (multi-step onboarding, payments, regulated
input) → add a step pattern (a wizard with a progress indicator, save-and-resume) and tighten
validation/confirmation, rather than stretching a single long form.

## Provenance
seeded (assistant, #434 — accepted by Kapil).
