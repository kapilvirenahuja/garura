# arch — Domain Research

origin: learning_extraction
provenance: enrich play, issue #341, proposal enrich-341-P-001
created_at: 2026-05-04T00:00:00Z

---

## Experiential

When a play must produce N independent commits (rather than one), use a
per-commit green gate: after each commit, run the full test suite (plus
type-check and lint) and fail the step — not the play — if any check is red.
The refactor play (garura:refactor, issue #341) established this pattern.
Each commit is one atomic move; the gate between commits prevents compounding
failures and makes each commit independently revertable. Characterization test
commits (`test:` prefix) precede refactor commits (`refactor:` prefix) when
baseline coverage is thin — this ordering is enforced as a constraint, not a
convention.

Evidence: core/components/plays/refactor/SKILL.md — Step 2 SE-11 eval, C5 and C11;
core/components/plays/refactor/reference/intent.yaml — constraints C4, C5, C11,
failure conditions F7, F11.

---

### Runtime tech-skill synthesis pattern (decode play — C28–C33)

/decode introduced a runtime tech-skill synthesis pattern where plays remain
tech-agnostic at compile time: no stack-specific skills are baked into the
compiled play. At runtime, physical-architecture.yaml is read to enumerate
stacks; for each stack a matching tech playbook at
core/components/memory/knowledge/tech/{stack}.md is consumed by
synthesize-tech-skill-from-playbook (deterministic template substitution,
no LLM reasoning) to produce an ephemeral SKILL.md in STM at
{stm_base}/{issue}/evidence/decode/temp-skills/. Temp skills are symlinked
into .claude/skills/decode-temp-{name}/ for Skill tool dispatch and cleaned
up on final Tether. Missing playbook for a detected stack is a hard halt —
there is no generic fallback.

Pattern implication: any play with stack-varying extraction work should follow
this playbook-at-runtime model rather than embedding stack names in compiled
play artifacts.

Evidence: source_play=distill, source_issue=322, proposal=enrich-322-P-001,
applied_at=2026-05-04T00:00:00Z
