# Context Isolation as Security Invariant
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Designing or configuring eval-generator agents, judge agents, or any agent whose outputs are used to assess the quality of another agent's work.
**When this does NOT apply:** Domain agents that produce primary artifacts (not evaluations); agents that must share context to collaborate on a single output.
**Search patterns:** context isolation, eval isolation, judge agent, eval-generator, test-case optimization, evaluation independence, security invariant
**Provenance:** Issue #182 — learn play dry run
**Created:** 2026-03-31

## Content

Eval-generator and judge agents must receive NO organizational knowledge and NO implementation context beyond their strictly defined inputs. Concretely:

**Eval-generator isolation contract:**
- Input: task specification, acceptance criteria, output schema
- NOT in input: LTM content, prior agent outputs, implementation approach, file paths
- Rationale: if the generator knows how the solution was built, it generates tests that confirm the implementation rather than tests that verify the requirement

**Judge agent isolation contract:**
- Input: evaluation criteria (from eval-generator), artifact under review, rubric
- NOT in input: who produced the artifact, what approach was used, what the producer intended
- Rationale: judges that know the intent can rationalize away failures ("the intent was right even if the output is wrong")

**Enforcement mechanism:** The play that invokes eval-generator and judge agents is responsible for filtering context before passing it. The play does NOT pass its full STM or LTM context. It passes only the explicitly listed input fields.

**This is a security invariant, not a convenience tradeoff.** When isolation is relaxed "just this once" for speed, the evaluation result becomes unreliable. A contaminated eval that passes is worse than no eval — it creates false confidence.

**Observable violation:** An eval that was written after implementation is complete and matches the implementation's structure (same edge cases, same variable names, same data shapes) is likely contaminated.

## Why It Matters

The entire value of automated evaluation is independence from the producer. A builder that can see the evaluation criteria will optimize for passing evals rather than producing correct outputs. A judge that knows the producer's intent will rationalize borderline failures. Both failures are invisible — the eval appears to pass, the quality signal is corrupted, and the system loses its verification capability without any visible error.

## Applicability Boundaries

**In scope:** Any pipeline where one agent evaluates the output of another agent, including CI-integrated quality gates, self-critique loops, and peer review agents.
**Out of scope:** Collaborative agents working toward a shared output where sharing context is necessary for coherence.

## Rationale

Evaluation independence is a foundational principle in testing (tests should not know implementation details), peer review (reviewers should not know the author's identity in double-blind review), and quality assurance. Its application to agent pipelines follows the same logic. This is not Meridian-specific; any multi-agent system with quality gates should enforce it.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
