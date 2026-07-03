---
id: review/harness
title: "Reviewing harness code (plays, skills, agents, grounding)"
conditions:
  recognises: "the PR changes the MD-defined 'code' of the agentic system"
  signals: ["core/components/plays/**", "core/components/skills/**", "core/components/agents/**", "core/grounding/**", ".claude/skills/**", ".claude/agents/**", ".agents/skills/**", "AGENTS.md scaffolding"]
provenance: "seeded:#443"
---

# Reviewing harness code (plays, skills, agents, grounding)

## Topic
How to review the framework's own "code" — the plays, skills, sub-agents, and grounding
written as Markdown. This is the intellectually central category.

## Recognise
The diff changes a play (`SKILL.md` + its ICE), a skill, an agent definition, or grounding
under `core/components/**` (or a deployed copy). These files *are* the system's behaviour, so
they get the deepest treatment.

## Treatment
- **Reviewer:** human (the design) + tool (conformance).
- **Layers:** Layer 1 **and** Layer 2.
- **Linter (Layer 1):** structural conformance — `lint_play.py` for plays (coverage of every
  constraint/failure/scenario by an eval, exactly one recovery per failure, required sections
  present, a real intent fingerprint, no orphan references); `lint-components` for skill/agent
  shape; the play-pipeline rules (intent change must trace to an ICE source, not a hand-edited
  compiled file). These exist in-repo.
- **Design-grounding (Layer 2):** **yes.** Reconstruct the harness design principles from
  **committed** sources — `docs/philosophy/**`, `docs/adr/**`, the standards under
  `memory/standards/rules/**` (e.g. user-facing-voice, play-close, evidence-recording), and
  the glossary — never from the branch's own new prose. Then check each changed play/skill/
  agent for conformance to those signed-off principles (agent-first delegation, JSON contracts
  over files, play orchestrates / skills produce / scripts do mechanical work, ICE-source
  discipline).
- **Rubric:** does the change keep the play→agent→skill→script wiring intact; does an intent
  change trace to its ICE source; does it hold the standards it is subject to.

## Rationale
A harness PR can be internally consistent and still wrong against the framework's design. The
only way to catch that is to ground the principles externally first, then test conformance —
otherwise the branch grades its own homework. This is the category the whole external-grounding
discipline exists for.

## Provenance
seeded #443 — adapted from the PR Review Approach spec (category C).
