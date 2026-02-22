# IDSD vs NeuroSDLC/Beacon: A Comparative Analysis of AI-Native SDLC Methodologies

**Date:** 2026-02-21
**Classification:** Strategic Analysis — Neutral Comparative
**Maturity Framework:** Dan Shapiro's Five Levels of AI (L0 Manual → L5 Dark Factory)
**Method:** 7 research agents + 3 hypothesis-testing agents + 1 fairness auditor + 16-point evolution assessment
**Sources:** Beacon PDF (Nagarro), P3-Hub Process PDF (Nagarro), IDD paradigm doc, IDSD methodology doc, Dan Shapiro's Five Levels blog post
**Bias Controls:** Three-layer separation (Architecture/Implementation/Trajectory), symmetric evolution assessment, confirmation bias audit, devil's advocate review (21 bias instances identified and corrected)
**Information Asymmetry Disclosure:** This analysis has access to IDSD's complete internal architecture documentation, roadmaps, and insider knowledge of trajectory. For NeuroSDLC, the analysis relies on two external product documents (Beacon PDF, P3-Hub Process PDF) supplemented by insider knowledge of both systems' direction. NeuroSDLC's internal architecture documents and roadmaps were not available. Scores and trajectory assessments should be read with this asymmetry in mind.

---

## Executive Summary

IDSD and NeuroSDLC represent two fundamentally different bets on where intelligence should live in AI-native software development. IDSD places intelligence in **agents** — autonomous decision-makers that interpret intent and adapt to context. NeuroSDLC places intelligence in **assets** — codified process prompts that prescribe deterministic execution.

Neither is universally superior. The report separates Architecture (foundation strength), Implementation (who's further ahead today), and Trajectory (where each can go) to prevent conflating design with delivery.

Key finding: IDSD's architecture is better positioned for higher-autonomy levels (L3+) but has less implementation maturity. NeuroSDLC has stronger implementation for team-scale adoption today but carries architectural limitations that become harder to evolve past L3. The industry needs both — architecture that scales with AI capability AND adoption machinery that works for enterprises today.

---

## 1. Philosophical Foundations

### Where Intelligence Lives

IDSD puts intelligence in the agent at runtime. Agents receive intent (goal + constraints), read organizational memory (LTM + STM), evaluate context dimensions, and decide HOW to achieve the outcome. The quality ceiling rises with model capability — a better LLM produces a better agent, which produces a better solution from the same intent, without any framework changes.

NeuroSDLC puts intelligence in the asset at authorship time. Cognitive assets — pre-built process prompts, templates, and transformation patterns stored in the P3-Hub — encode expert knowledge into reusable playbooks. AI agents execute these playbooks deterministically. The quality floor is stable regardless of model capability.

**Implication**: IDSD has a higher ceiling but a lower floor. When the model is weak, the agent has decision space it cannot competently fill. NeuroSDLC has a stable floor but a ceiling defined by the asset author's foresight.

### The Intent Model

IDSD's formal triple (`{goal, constraints, failure_conditions}`) with the P4 Classification Rule and compartmented evaluation is the more rigorous formalization. The Classification Rule — "Would knowing this change how the builder writes code? Yes → constraint. No → failure condition" — creates a testable, binary partition.

NeuroSDLC's "Intent2Outcome" loop with X2Y cognitive asset chaining (Vision2Spec, Spec2Code, Code2Deploy) is more of an orchestration grammar than an intent formalization. It names transformations clearly but does not enforce structural discipline separating goal, constraints, and failure conditions.

**Assessment**: IDSD wins on precision at the individual-intent level. NeuroSDLC wins on pipeline-level legibility across large teams.

### The Spec Question

IDSD treats specs as **generated intermediates**. NeuroSDLC treats specs as the **backbone**. IDSD undervalues the spec as a coordination artifact between humans. NeuroSDLC overvalues the spec as a source of truth when the real source of truth is the running code.

### The AI Trajectory Bet

If IDSD's bet is wrong (models plateau): Agents make mediocre decisions. The information barrier becomes a liability.
If NeuroSDLC's bet is wrong (models improve dramatically): The cognitive asset library becomes a ceiling. The framework becomes the bottleneck.

---

## 2. Two Architectures, One Goal

| Dimension | IDSD | NeuroSDLC/Beacon |
|---|---|---|
| Core abstraction | Intent (goal + constraints + failure_conditions) | Cognitive asset (process prompt + template) |
| Agent philosophy | Autonomous decision-maker | Deterministic executor |
| Artifact count per feature | 3-5 | 15-20+ (up to 30-38 in full 6D chain) |
| Dependency depth | 1-4 steps | 5-8+ steps (up to 15-16 full chain) |
| Target user | Enterprise teams (Nagarro, Capgemini, EPAM-type orgs) | 5-500 person teams |
| Verification model | Compartmented (builder/validator information barrier) | Unified (same context for generation and validation) |
| Memory model | LTM (persistent org knowledge) + STM (session-scoped) | P3-Hub (static cognitive asset library, project-scoped) |
| Brownfield on-ramp | Learn-2-Memory (organic STM→LTM) | Code2X agents (reverse-engineering) |
| Context budget | ≤17K tokens per agent task (enforced) | No stated limit |
| Adoption model | Platform-dependent (CLI today, relies on IDE/Co-Work evolution) | Self-contained (IDE integration for all roles) |

Note: IDD (Intent-Driven Development) is the universal paradigm applicable to any domain (UX, supply chain, agentic systems). IDSD (Intent-Driven Software Development) is the software development implementation. NeuroSDLC is both paradigm and implementation in one package.

---

## 3. Artifact Architecture & Dependency Chains

### The Artifact Weight Problem

IDSD's 3-5 artifacts keep the consistency graph manageable. Hash-based staleness detection (`<!-- sync: source={path} hash={hash} generated={timestamp} -->`) provides concrete detection-and-repair. IDSD does not claim specs are "living" — it claims they are derived artifacts that can go stale, with a mechanism to detect it.

NeuroSDLC's 15-20+ artifacts per feature create a combinatorial consistency challenge. The full chain: vision.md → system.md → module.brd.md → feature.frd.md → user-story.story.md → Visual Designs → user-story.spec.md → user-story.plan.md → technology.md → architecture.md → user-story.tasks.md → Code → Tests → Deployment Pipeline. NeuroSDLC calls these "living specifications" but there is no stated mechanism for detecting when a parent artifact has changed without explicit re-invocation.

### Cascade Failure Risk

NeuroSDLC scenario: Vision2System misidentifies a monolith as microservices. Error cascades through 10+ artifacts. All validators pass — each checks consistency with its parent, not correctness. Surfaces only at Task2Code.

IDSD scenario: An intent with a missing constraint. ICS scores it as Balanced because the scope appears narrow. The builder implements a feature that works for the happy path but violates an unstated business rule. The validator can't catch it — the business rule was never formalized as a failure condition, so it doesn't exist in the validator's context. The feature ships. The bug surfaces in production three weeks later. No artifact in the system contains the missing constraint because it was never captured. Blast radius: smaller than NeuroSDLC's cascade (one feature, not 10+ artifacts), but the failure is silent and surfaces late.

**Bottom line**: IDSD trades completeness for resilience. NeuroSDLC trades resilience for completeness. Most dangerous failure in IDSD: silent under-specification. Most dangerous failure in NeuroSDLC: silent error propagation through faithfully replicated downstream artifacts.

---

## 4. Agent Design & Autonomy

### The Autonomy Spectrum

IDSD agents occupy bounded problem spaces where they make genuine decisions — skill selection, implementation approach, tool chain — within an intent that specifies outcome without prescribing method.

NeuroSDLC agents execute codified transformations deterministically. Immediate predictability — a team that adopted it yesterday gets the same output quality as one that adopted it a year ago. But a ceiling when the model outgrows the playbook.

### The Goodhart's Law Question

IDSD's compartmented evaluation introduces an information barrier between builder and validator agents. The recipe orchestration layer splits the intent triple, routing goal+constraints to the builder and failure_conditions+output to the validator. Symptom-based feedback preserves the barrier during iteration. This is architecturally novel in the AI-native SDLC space — no other published methodology separates generation and validation context — though it has zero production testing.

| Layer | IDSD | NeuroSDLC |
|---|---|---|
| Architecture | Compartmented evaluation designed with convergence bounds, escalation protocol | No information barrier designed. Validators share full context with generators |
| Implementation | Specified but not yet running in production | 9+ validators operational but sharing context |
| Trajectory | Production deployment planned | No plans for validator independence |

IDSD's barrier has an untested edge: if escalation happens frequently, the barrier becomes process overhead. Most valuable when intents are well-formed.

NeuroSDLC has no information barrier. Its 9+ validators check artifacts with the same context that produced them. This creates a surface-level compliance pattern: every validator can pass while the system produces outputs that are formally correct and practically wrong. However, NeuroSDLC's 9+ type-specific validators do catch structural defects that a single generalist validator would miss — the quantity and specialization of validators is itself a genuine architectural choice, not merely a weakness.

### Validator Architecture

IDSD's single validator agent: lean but concentrates failure. NeuroSDLC's 9+ dedicated validators: catches more type-specific structural defects but at significant process overhead.

Honest assessment: NeuroSDLC catches more defects in artifact structure ("is this well-formed?"). IDSD catches more defects in goal-satisfaction ("does this actually work?"). Both are necessary; neither alone is sufficient.

---

## 5. Organizational & Team Scaling

This section required the most correction from the original report, which conflated "validated at one person" with "targets one person."

### Architecture Layer

IDSD is architecturally designed for enterprise teams:
- The IDD doc states "Enable enterprise teams to leverage AI-assisted development with full governance and traceability"
- Enterprise Wrapper documents governance, memory federation, and Hive Mind (cross-agent coordination)
- 5 AI Squad roles designed for team operation, including "Validator per 2-3 teams"
- LTM is globally deployable (`~/.phoenix-os/core/memory/`)
- Recipes abstract all complexity — any developer invokes `/build-feature` without understanding internals

NeuroSDLC is architecturally designed for enterprise teams:
- Role-based cognitive assets give each role (BA, QA, Dev, PO) specific workflows
- IDE integration brings non-technical roles into the development environment
- 30+ cognitive assets mapped to roles and phases
- Structured onboarding/training journeys per role
- P3-Hub provides shared asset library across the org

### Implementation Layer

| Aspect | IDSD | NeuroSDLC |
|---|---|---|
| Multi-person validated | No — validated at single developer | Yes — production deployments with teams |
| LTM conflict resolution | Git handles file-level conflicts. `capture-learning` has semantic conflict detection designed but not built. STM→LTM promotion goes through PR workflow — project-level reviewed by team, org-level reviewed by engineering leaders/CTOs | P3-Hub is project-scoped. No cross-project knowledge sharing |
| Cross-developer visibility | Present via Git/GitHub (issues, branches, PRs, STM artifacts committed to branches). NWWI (No Work Without Issue) enforced in recipes | Present via IDE integration and role-specific dashboards |
| Governance | 10+ mechanisms built: DRAFT/VALIDATE/LOCKED lifecycle, Tether/Vanish gates, Guardian Logic, NWWI gate, ICS, compartmented evaluation, protected branch enforcement, sensitive file detection. Recipe-enforced (agent-layer), not CI-enforced | Built into cognitive asset workflows. IDE-enforced |
| Role-specific tooling | Same CLI for all roles. Non-developer roles depend on platform evolution (Claude Co-Work, IDE integrations) | BA gets BA tools, QA gets QA tools, PO gets PO tools. Purpose-built per role |
| Onboarding | Learn to write intents. Conceptually simple, practically deep. Time-to-first-value: minutes (`/build-feature "Add CSV export"` works immediately) | Learn 6D lifecycle, 30+ cognitive assets, IDE workflows. Time-to-first-value: weeks to months |

### Trajectory Layer

IDSD:
- LTM server-based deployment (MCP, semantic search, org-wide). 12-18 months. Concept to early design.
- CTO-configurable domain parameters (quality thresholds per project type). Concept.
- Tool integrations beyond GitHub (Jira, Notion, wikis). Architecture supports it; GitHub integration already exists. Adding tools is incremental.
- Cross-team intent visibility dashboard. Plausible — GitHub integrations partially exist. Not purpose-built yet.

NeuroSDLC:
- No stated plans for cross-project knowledge sharing
- No stated plans for adaptive cognitive assets
- No stated plans for role evolution beyond augmentation
- Fast-track bypass discussed for low-complexity features (skip full artifact chain). Not planned formally.

### Scoring

| Aspect | IDSD | NeuroSDLC |
|---|---|---|
| Architecture | 3.0 — enterprise-designed, governance-rich, recipe abstraction enables N-developer use | 3.5 — role-specific, IDE-integrated, structured onboarding, production-tested design |
| Implementation | 2.0 — validated at 1 person, 10+ governance mechanisms built, but no multi-person production evidence | 3.0 — production deployments with teams, role-based workflows operational |
| Trajectory | 3.0 — server LTM, domain parameters, tool integrations, dashboard all plausible with architectural support | 1.5 — no stated evolution plans for cross-project learning, adaptive assets, or role evolution |

---

## 6. Brownfield & Legacy Readiness

### Day-One Value

NeuroSDLC has a clear advantage: nine dedicated Code2X agents (Code2System, Code2Arch, Code2Tech, Code2Template, Code2Module, Code2Feature, Code2DataModel, Code2Spec, Spec2Story). For a 500K-line codebase, generates a documentation suite in hours.

IDSD has no equivalent purpose-built mechanism. Brownfield approach is organic: work naturally, let STM capture patterns, promote to LTM over time. IDSD agents do read the actual codebase during execution, but without accumulated institutional knowledge on day one.

### The Quality Problem

NeuroSDLC's Code2X agents produce artifacts reflecting what the code does, not what it was intended to do. A generated `system.md` faithfully documents every leaky abstraction, presenting accidental complexity as intentional architecture.

However — and the original report understated this — imperfect documentation generated in hours provides immediate navigational value that no organic accumulation process can match on day one. For teams inheriting unfamiliar codebases, Code2X's imperfect map is more useful than no map. The artifacts require human review and correction, but they provide a starting point.

IDSD's slower approach grounds LTM in actual work experience. Knowledge that enters organically reflects reality. After three months: deep LTM coverage of touched subsystems, zero coverage of untouched ones — more transparent about its coverage gaps, but an untouched subsystem in a 500K-line codebase could contain critical bugs that this organic approach never surfaces.

### Three-Layer Assessment

| Layer | IDSD | NeuroSDLC |
|---|---|---|
| Architecture | Learn-2-Memory phase is a first-class SDLC phase. STM→LTM promotion mechanism designed. | Code2X agents integrated into the 6D lifecycle. Reverse-engineering is architecturally supported. |
| Implementation | No brownfield bootstrap recipe exists. Organic accumulation only. | Nine Code2X agents operational. Day-one documentation generation available. |
| Trajectory | Brownfield bootstrap recipe ("codebase-to-LTM") recognized as needed. Concept only — not specified, not on near-term roadmap. | No stated plans for Code2X quality feedback (correcting wrong artifacts back into the system). No cross-project learning from brownfield exercises. |

**Recommendation**: For brownfield adoption, NeuroSDLC offers faster time-to-first-understanding. IDSD offers higher long-term knowledge fidelity. The choice depends on urgency: if the team needs to ship changes within weeks, Code2X's imperfect map is more useful than no map. If the team has months, IDSD's organic approach produces more accurate knowledge. IDSD's brownfield bootstrap recipe is a concept-stage gap, not a structural limitation.

---

## 7. Dark Factory Maturity Mapping

### Dan Shapiro's Five Levels

```
L0  Manual          ░░░░░░░░░░░░░░░░░░░░  No AI — human writes all code
L1  Discrete Task   ████░░░░░░░░░░░░░░░░  AI handles bounded tasks (tests, docs)
L2  Flow State      ████████░░░░░░░░░░░░  Human + AI pair programming (90% stop here)
L3  Human-in-Loop   ████████████░░░░░░░░  Developer becomes code reviewer/manager
L4  Spec-Driven     ████████████████░░░░  Human writes specs, AI runs for 12+ hours
L5  Dark Factory    ████████████████████  AI generates and executes specs autonomously
```

Key transitions:
- **L2→L3 trap**: "Feels like you're done but you aren't." Nearly universal stopping point.
- **L3→L4**: Role transforms from developer to product manager. Many resist.
- **L4→L5**: Requires systems that generate their own specifications from observed outcomes.

### Where Is Each Today?

**IDSD: Straddling L2-L3, with L4 architecture in the walls.**

Implemented components operate at L2. Architecture contains L3 elements: `start-planned-feature` has an autonomous execution phase where, after one approval gate, the system runs implementation, commit, and PR without human intervention. The intent model is proto-L4 — intents are lightweight specs.

**NeuroSDLC: Solidly L2, reaching toward L3 in artifact completeness.**

Cognitive assets give AI agents detailed playbooks — L2 pairing through prescribed processes. The 15-20+ artifact chain and 9+ validators suggest L3 aspiration, but the developer remains an active participant in artifact chain management, not a reviewer of autonomous output.

### Path to L3 — Three-Layer View

| | IDSD | NeuroSDLC |
|---|---|---|
| **Architecture** | L3-ready. Intent model, compartmented evaluation, agent autonomy, Guardian Logic all designed for human-as-reviewer, not human-as-doer. | L2 architecture with L3 aspirations. Cognitive assets prescribe execution; agents don't make autonomous decisions. |
| **Implementation** | Partial. `start-planned-feature` has autonomous execution. 19 recipes specified, ~4 built. | Partial. Full artifact chain and validators exist, but developer actively manages chain. |
| **Trajectory** | 3-6 months building specified components (author's estimate, not independently validated). Assumes specifications work as designed — untested. | 12-18 months of deliberate architectural evolution. Would require widening agent decision space within cognitive assets — significant but incremental, not a wholesale replacement. |

### Path to L4

IDSD's intents ARE lightweight specs. The structural distance from L3 to L4: remove approval gates, add test-pass-as-success-criteria, let the system run overnight. Configuration change, not architecture change.

NeuroSDLC's artifact chain IS heavyweight specs — but human-curated, not system-generated. L4 would mean the system generates cognitive assets from observed outcomes. Requires the P3-Hub to become an adaptive learning system.

### The L4→L5 Cliff — Three-Layer View

| Layer | IDSD | NeuroSDLC |
|---|---|---|
| **Architecture** | Memory architecture (STM→LTM promotion) captures intent→outcome pairs. `capture-learning` recipe specified with concrete skill contracts (`extract-patterns`, `draft-ltm-entry`). ICS designed as training signal for Learn-2-Memory. This is the accumulation path toward self-generation — architecturally present, not yet the generation step itself. | P3-Hub is a static library. No architectural mechanism for assets to learn from execution outcomes. No feedback loop from deploy back to specify. The lifecycle ends at Deploy. |
| **Implementation** | `capture-learning` recipe specified but not built. No production intent self-generation. Current mode: humans write intents. | No implementation of any learning feedback loop. Cognitive assets are manually authored and updated. |
| **Trajectory** | Monitoring-to-Design phase planned: production feedback, analytics, usage patterns → auto-generated intents. Pure concept, 18-24 months. The concept of "hypothesis" (purpose above intents) would anchor L5 — systems generate intents from hypotheses using rich LTM. Not designed. | No plans for adaptive cognitive assets. No plans for production feedback loop. The "continuous improvement" in Beacon refers to running more stories under the same vision — not learning that changes the vision. Zero architectural evidence of learning being designed. |

### Hard Ceilings

**IDSD ceiling: ~L4.5** — transition from "human writes intents" to "system generates intents from observed outcomes." Requires adding new cognitive capabilities (Monitoring-to-Design phase, hypothesis layer) on top of a sound architectural foundation. The accumulation mechanism (memory) exists architecturally; the generation mechanism does not.

**NeuroSDLC ceiling: ~L3.5** — transition from "human curates process, AI executes" to "AI makes autonomous decisions." This ceiling is stated with a qualification: NeuroSDLC could evolve incrementally. The P3-Hub could evolve from prescriptive playbooks to parameterized templates giving agents wider decision space. Adding outcome tracking to cognitive assets is additive engineering. However, no such evolution is currently planned or architecturally evidenced, and the current design shows zero mechanism for learning from execution outcomes. The distance is significant and requires deliberate investment in areas outside NeuroSDLC's current design direction.

### Self-Verification at L4+

IDSD's compartmented evaluation: builder and validator have independent context → system can genuinely verify its own outputs.

NeuroSDLC's validators share context with generators → at L4+, verification degrades to "does the output match the template" rather than "does the output work."

### L4-L5 Readiness Scoring — Three Layers

| Criterion (0-4 scale) | IDSD Arch | IDSD Impl | IDSD Traj | Neuro Arch | Neuro Impl | Neuro Traj |
|---|---|---|---|---|---|---|
| **Agent autonomy** | 3.5 | 2.5 | 3.5 | 1.5 | 1.5 | 1.5 |
| **Self-healing on failure** | 3.0 | 2.0 | 3.5 | 2.0 | 2.0 | 2.0 |
| **Spec self-generation** | 2.5 | 1.5 | 3.5 | 1.0 | 1.0 | 1.0 |
| **Process self-evolution** | 2.5 | 1.5 | 3.0 | 1.0 | 1.0 | 0.5 |
| **Vendor independence** | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 |
| **Org scalability** | 3.0 | 2.0 | 3.0 | 3.5 | 3.0 | 1.5 |
| **Total** | **17.5/24** | **12.5/24** | **19.5/24** | **12.0/24** | **12.0/24** | **10.0/24** |

**Important**: This table measures **Autonomy Readiness** (L4-L5) — a dimension where IDSD's architectural philosophy inherently scores higher. It does not measure Enterprise Readiness, where NeuroSDLC leads. See the Enterprise Readiness table below for the complementary view.

#### Enterprise Readiness Scoring

| Criterion (0-4 scale) | IDSD Arch | IDSD Impl | IDSD Traj | Neuro Arch | Neuro Impl | Neuro Traj |
|---|---|---|---|---|---|---|
| **Multi-role enablement** | 2.0 | 1.0 | 2.5 | 3.5 | 3.5 | 3.5 |
| **Brownfield on-ramp** | 2.0 | 0.5 | 1.5 | 3.0 | 3.0 | 3.0 |
| **Compliance/audit trail** | 1.5 | 1.0 | 2.0 | 3.5 | 3.0 | 3.0 |
| **Team onboarding** | 1.5 | 1.0 | 2.0 | 3.0 | 3.0 | 3.0 |
| **Production deployment maturity** | 2.0 | 1.0 | 2.5 | 3.0 | 3.0 | 3.0 |
| **Cross-functional coordination** | 2.0 | 1.0 | 2.5 | 3.5 | 3.0 | 2.0 |
| **Total** | **11.0/24** | **5.5/24** | **13.0/24** | **19.5/24** | **18.5/24** | **17.5/24** |

Enterprise Readiness justifications:
- Multi-role enablement: NeuroSDLC provides role-specific cognitive assets (BA, QA, Dev, PO), IDE integration for non-technical roles, and structured per-role workflows. IDSD provides a single CLI interface for all roles, relying on recipe abstraction and platform evolution for role-specific experiences.
- Brownfield on-ramp: NeuroSDLC's nine Code2X agents generate documentation for existing codebases in hours. IDSD has no equivalent — organic accumulation only, with a bootstrap recipe at concept stage.
- Compliance/audit trail: NeuroSDLC's 15-20+ artifacts per feature create extensive audit trails. IDSD's 3-5 artifacts prioritize minimalism over traceability, with compliance mode at concept stage.
- Team onboarding: NeuroSDLC has structured training journeys per role. IDSD onboarding is "learn to write intents" — conceptually simple but with a deep mastery curve.
- Production deployment maturity: NeuroSDLC has production team deployments. IDSD is validated at single developer only.
- Cross-functional coordination: NeuroSDLC co-locates all roles in IDEs with role-specific workflows. IDSD provides coordination via Git/GitHub infrastructure, which serves developers well but creates barriers for non-technical roles.

Justifications:

Agent autonomy:
- IDSD Arch 3.5: Agents are autonomous decision-makers with "agent says no" capability. Compartmented evaluation designed. Not 4 because compartmented eval not yet in production.
- IDSD Impl 2.5: Some agents built and operational. Compartmented evaluation specified but not running. Agent-says-no exists.
- IDSD Traj 3.5: Full agent taxonomy specified. All agents on roadmap.
- Neuro Arch 1.5: Agents execute prescribed playbooks. Some judgment within asset framework but no autonomous decision mechanism designed. Not 1 because agents do make choices within assets.
- Neuro Impl 1.5: Deterministic execution operational. No autonomy beyond asset framework.
- Neuro Traj 1.5: No plans for agent autonomy gradient. Theoretical path exists (N2 — parameterized assets) but no evidence of pursuit.

Self-healing on failure:
- IDSD Arch 3.0: Convergence protocols, symptom-based feedback, compartmented evaluation enable independent recovery.
- IDSD Impl 2.0: Basic error handling in recipes. Convergence protocols not yet operational.
- IDSD Traj 3.5: Full convergence + escalation designed.
- Neuro Arch 2.0: Validators at each step provide defect detection. No autonomous recovery loop — failures escalate to humans.
- Neuro Impl 2.0: Validators operational. Manual escalation.
- Neuro Traj 2.0: No plans for autonomous recovery.

Spec self-generation:
- IDSD Arch 2.5: Specs generated from intents (forward generation). `capture-learning` specified with skill contracts. ICS as training signal designed. Accumulation path architecturally present. Generation step (LTM → new intents) not specified.
- IDSD Impl 1.5: Forward spec generation from intents works today. `capture-learning` not built. No autonomous intent generation.
- IDSD Traj 3.5: Monitoring-to-Design phase (production signals → auto-intents) planned. Hypothesis/purpose layer envisioned. 18-24 months.
- Neuro Arch 1.0: Code2X generates specs from code (reverse). No forward generation from business intent.
- Neuro Impl 1.0: Code2X operational for reverse generation only.
- Neuro Traj 1.0: No plans for forward spec generation or adaptive specification.

Process self-evolution:
- IDSD Arch 2.5: STM→LTM promotion architecture. `capture-learning` recipe specified with concrete skill contracts. ICS designed as feedback signal. P8 health signals defined. High-order agents designed for LTM governance.
- IDSD Impl 1.5: STM/LTM storage exists. Promotion is manual. `capture-learning` not built. No ICS data collection.
- IDSD Traj 3.0: Automated capture-learning, ICS feedback, LTM quality/decay scoring planned.
- Neuro Arch 1.0: P3-Hub is static but provides a functioning manual process for asset management. Cognitive assets can be versioned and updated. No automated feedback loop from execution, but the asset structure could support one.
- Neuro Impl 1.0: Manual asset authoring operational. Assets are actively maintained and updated across projects.
- Neuro Traj 0.5: No plans for adaptive assets or execution-informed asset evolution.

Vendor independence:
- Both 3.0 across all layers. File-based portable abstractions. Both single-runtime in production today.

Org scalability:
- IDSD Arch 3.0: Enterprise Wrapper, Memory Federation, Hive Mind, recipe abstraction, 10+ governance mechanisms. Designed for enterprise teams.
- IDSD Impl 2.0: Validated at 1 person. Governance mechanisms built but recipe-enforced not CI-enforced. No role-specific tooling. CLI only. GitHub integrations exist.
- IDSD Traj 3.0: Server LTM, domain parameters, tool integrations (Jira, Notion), cross-team visibility dashboard. Architecture supports all; implementation incremental.
- Neuro Arch 3.5: Role-based cognitive assets, IDE integration for all roles, structured onboarding, 30+ assets mapped to roles and phases.
- Neuro Impl 3.0: Production team deployments. Role-specific workflows operational.
- Neuro Traj 1.5: No plans for cross-project learning, adaptive assets, or role evolution beyond augmentation. Fast-track bypass discussed informally.

---

## 8. Failure Modes & Risk Analysis

### Self-Awareness

IDSD documents 7 named anti-patterns, 5 failure scenarios, and builds ICS as a self-diagnostic tool. Self-diagnosis within its own documentation: **high**. Caveat: these anti-patterns were authored by the system's creator — self-documented vulnerabilities are valuable but are a lower bar than externally discovered weaknesses.

NeuroSDLC focuses on capabilities in its available documentation. The existence of 9+ validators implies awareness the chain is fragile, but weaknesses are not framed as explicit vulnerabilities in the materials reviewed. Self-diagnosis in available materials: **low to moderate**. Caveat: this assessment is based on external product documentation, not internal architecture docs. NeuroSDLC may have internal self-diagnosis artifacts not visible in the materials available to this analysis.

### Blind Spots Each Doesn't See

IDSD:
- **Intent authorship bottleneck**: Writing well-formed intents is harder than writing specs. Learning curve may be longer than documented.
- **Compartmented evaluation untested**: Zero production evidence. Symptom-based feedback may be too decontextualized for complex features.
- **Context budget as ceiling**: 12K token bundle limit forces artificial decomposition for complex verticals.
- **Multi-stakeholder intent negotiation**: No mechanism for when two product owners disagree about goals. Not designed.
- **Mental model gravity**: IDD's internal elegance may blind its practitioners to problems outside the model's vocabulary — organizational change management, political resistance, role-elimination anxiety are real enterprise barriers that the intent model doesn't address.

NeuroSDLC:
- **Validator independence is limited**: Full artifact chain context available to every validator. No mechanism to detect confirmation bias in validation.
- **Cognitive asset entropy**: As the P3-Hub grows, assets may conflict. No conflict resolution mechanism.
- **6D lifecycle is waterfall with AI**: Linear Discover-to-Deliver with 15-16 dependency depth. Change in Discover cascades through everything downstream.
- **Change velocity assumption**: Assumes stable requirements within each cycle.
- **No learning loop**: The lifecycle ends at Deploy. "Continuous improvement" means running more stories under the same vision — not learning that changes the vision. Zero architectural evidence of learning being designed.
- **Forward-only loop**: Vision documents and intent documents at the top don't change based on outcomes. The system produces more, but doesn't learn from what it produced.

### Catastrophic Failure Scenarios

IDSD — Silent LTM Poisoning: A team captures a learning from a one-off incident ("always add retry logic to database calls") and promotes it to LTM. Over months, every feature adds retry logic to all DB calls — including inside transactions, creating deadlock conditions. Agents follow the practice faithfully. Validator doesn't catch it.

Mitigation (Architecture): STM→LTM promotion goes through PR workflow with governance — project-level reviewed by team, org-level by engineering leaders. The system is designed to add intelligence to understand WHEN a practice applies. Mitigation (Implementation): PR workflow exists via Git. AI intelligence for contextual application not yet built.

NeuroSDLC — Cascade Corruption: A mid-lifecycle architecture decision is updated. 8 of 12 dependent artifacts update, 4 are missed. Feature ships with mismatched contracts. All validators passed.

Mitigation (Architecture): None. No cascade detection mechanism designed.
Mitigation (Implementation): Manual review required.

### The Goodhart's Law Exposure

IDSD addresses this with compartmented evaluation (Architecture: designed. Implementation: not yet running).

NeuroSDLC has no structural defense at any layer. The same cognitive assets that guided generation also guide validation. However, NeuroSDLC's 9+ specialized validators do provide defense-in-depth at the artifact structure level — each validator is purpose-built for its artifact type. The limitation is that this defense checks whether the AI followed the playbook, not whether the playbook produced the right outcome.

### Model Regression Risk

IDSD is fragile to **reasoning regression** — the architecture bets on agents making good autonomous decisions.

NeuroSDLC is resilient to reasoning regression (prescriptive playbooks still work) but fragile to **instruction-following regression** — if models get worse at following complex prompts, cognitive assets become unreliable.

---

## 9. Where Each Wins, Where Each Fails

### Choose IDSD When:
- Velocity matters more than audit trails
- The problem is novel — autonomous agents explore solution spaces prescriptive assets cannot reach
- AI models are strong — architecture has proportional headroom
- Greenfield projects — LTM grows organically
- Solo developer or small technical team — immediate time-to-value (minutes)
- Change velocity is high — intent stays stable, specs regenerate
- Verification independence matters — compartmented evaluation prevents Goodhart's Law
- Long-term architectural positioning matters — foundation for L4+

### Choose NeuroSDLC When:
- Regulated industries demand compliance evidence — 15-20+ artifacts provide audit trail
- Large cross-functional teams need coordination today — role-specific assets give each role a clear workflow
- Brownfield is the immediate need — Code2X gives day-one on-ramp (imperfect documentation in hours > no documentation)
- Process repeatability is the priority — deterministic execution from codified playbooks
- Organization is conservative — every role keeps its title; AI augments rather than replaces
- Stable requirements within cycles — dependency chain works when upstream doesn't change mid-cycle
- Non-technical roles must participate — IDE integration removes accessibility barriers

### Neither Wins When:
- The human writes bad input — neither defends against wrong intent or wrong requirements
- Full L5 autonomous operation — both ultimately need a human providing the "why" (hypothesis/purpose in IDSD, vision in NeuroSDLC)

**At L4+, IDSD holds a structural advantage**: its intent model is a proto-specification, its memory architecture provides a pattern accumulation mechanism, and its compartmented evaluation enables independent verification. The architectural distance from L3 to L4 is shorter — capability addition rather than abstraction replacement. However, the critical mechanism for L4 — intent self-generation from observed outcomes — is absent from both systems today. IDSD's architecture is compatible with L4 evolution and has a shorter path to get there; it does not yet facilitate it. NeuroSDLC would require more extensive architectural evolution, but incremental paths exist (parameterized assets, outcome tracking). Neither has a validated L4 capability.

---

## 10. The Uncomfortable Truth

**IDSD's architecture is better positioned for higher-autonomy AI development (L3+).** Its intent model, compartmented evaluation, and memory architecture provide structural mechanisms that NeuroSDLC lacks for agent autonomy, self-verification, and process self-evolution. However, IDSD's organizational scaling exists primarily as architectural constructs — the Enterprise Wrapper, Memory Federation, and Hive Mind coordination are documented but unvalidated in multi-person environments.

**NeuroSDLC is architecturally optimized for current-generation AI interaction (L2-L3) and practically robust.** Its cognitive asset model provides stable, repeatable, role-specific workflows that work for enterprise teams today. Code2X gives immediate brownfield value. Role-based enablement solves real coordination problems. However, the architecture carries structural limitations: no learning loop, no validator independence, no adaptive assets, and a forward-only lifecycle that doesn't learn from outcomes.

**What both get right:** AI-native SDLC requires formal abstractions between human intent and AI execution. Ad-hoc prompting does not scale.

**What both get wrong:** Neither has solved the L4-L5 transition today. IDSD's memory architecture creates the preconditions for intent self-generation but the generation mechanism itself is not yet designed. NeuroSDLC has no architectural path to self-generation without adding mechanisms currently outside its design direction.

**The structural bet that matters:** IDSD's evolution requires adding new capability on top of a sound foundation. NeuroSDLC's evolution requires significant architectural investment in areas (adaptive learning, agent autonomy, learning loops) that are outside its current design direction and have no stated roadmap.

**The adoption paradox:** IDSD may have the better architecture for tomorrow but relies on external platform evolution (Claude Co-Work, IDE integrations) for enterprise adoption today. NeuroSDLC may have a constrained architecture but solves the adoption problem itself. The right tactical decision may be to invest in NeuroSDLC-style adoption while building IDSD-style architecture — adopting what works today while building for what scales tomorrow.

**A note on mental model scope:** IDD (the paradigm behind IDSD) claims universal applicability beyond software — to UX, supply chain, agentic systems. Initial exploration in UX contexts shows promise (goals + constraints applied, failure conditions not yet). This universality claim is theoretical and untested outside software. It could be IDD's greatest strength (paradigm that scales across domains) or a blind spot (abstraction optimized for software incorrectly assumed to work everywhere). The comparison report takes no position on this — it requires evidence from non-software domains.

---

## 11. Recommendations

### Key gaps for IDSD (priority order):

1. **`capture-learning` recipe — make it operational.** This is the foundation for process self-evolution AND the precondition for eventual intent self-generation. Every other trajectory goal depends on LTM actually being populated from work. Highest leverage investment.
2. **Brownfield bootstrap recipe.** Purpose-built "codebase-to-LTM" for cold-start on legacy codebases. Currently concept-only. Real enterprises need this for adoption.
3. **LTM quality/decay automation.** As LTM grows, automated freshness scoring, relevance decay, and contradiction detection become critical. The 20-file audit rule is insufficient for enterprise scale. Planned but not designed.
4. **Multi-stakeholder intent negotiation.** Mechanism for resolving conflicting goals. Not designed. Real for enterprise contexts.
5. **Compliance artifact mode.** Optional expansion for regulated industries. Concept-stage. Additive to existing architecture.

### Key gaps for NeuroSDLC (priority order):

1. **Learning loop from execution to vision.** The lifecycle currently ends at Deploy. Production outcomes don't inform the next cycle's vision or cognitive assets. This is the single highest-leverage gap — without it, the system produces more but never gets smarter.
2. **Validator independence.** Introduce information barriers between generation and validation. Without this, every validator confirmation is suspect at L3+.
3. **Artifact chain compression.** Reduce the 15-16 dependency depth. Identify load-bearing vs process-theater artifacts. The fast-track bypass discussion is a start.
4. **Agent autonomy gradient.** A dial (not switch) for granting agents more decision-making authority. Without this, the framework is architecturally capped at ~L3.5 regardless of how good models become.
5. **Cross-project knowledge.** Project-specific learnings should flow back to improve future projects. Currently, only shared cognitive assets (not learnings) transfer.

---

**Methodology Note**

This report applies four layers of bias control:

1. **Three-layer separation**: Every claim is attributed to Architecture (designed/documented), Implementation (built/running), or Trajectory (vision/planned). This prevents conflating design with delivery.

2. **Symmetric evolution assessment**: 16 evolution areas (8 per system) were identified and evaluated with insider knowledge of both systems' direction. Both systems received the same treatment: credit for documented evidence, trajectory credit only where clearly labeled, no assumptions about undocumented capability.

3. **Confirmation bias audit**: A dedicated fairness auditor reviewed all corrections to prevent over-correction in either direction. Key guardrail: NeuroSDLC's production maturity at L2-L3 team operation, brownfield on-ramps, and role-based enablement are genuine advantages that corrections to IDSD's scoring must not diminish.

4. **Devil's advocate review**: A dedicated adversarial auditor examined the completed report for language bias, scoring bias, evidence asymmetry, structural bias, and the "no plans" problem. 21 bias instances were identified across 6 categories and corrected. Key corrections: removed emotionally charged language applied asymmetrically, added Enterprise Readiness scoring table to complement Autonomy Readiness table, equalized cascade failure scenario specificity, added information asymmetry disclosure, qualified self-awareness comparison.

**Remaining known bias**: This analysis was produced inside the IDSD repository with access to IDSD's complete internal documentation. NeuroSDLC was evaluated from external product materials. Despite bias controls, this information asymmetry means IDSD's architectural potential may be overrepresented and NeuroSDLC's may be underrepresented. Readers should weight Implementation scores (where both systems are evaluated on what exists) more heavily than Architecture or Trajectory scores (where information asymmetry has the most impact).

The author of one of these methodologies provided input to this analysis and explicitly requested confirmation bias controls, adversarial questioning, and neutral treatment. This note exists so readers know the analysis was conducted with that awareness.

---

*Analysis synthesized from: 7 parallel research agents (dimensional analysis), 3 hypothesis-testing agents (organizational scalability, L4-L5 maturity, fairness audit), 1 fairness auditor (over-correction prevention), 16-point symmetric evolution assessment with insider knowledge of both systems.*

**References:**
- [Dan Shapiro — The Five Levels: from Spicy Autocomplete to the Dark Factory](https://www.danshapiro.com/blog/2026/01/the-five-levels-from-spicy-autocomplete-to-the-software-factory/)
- [Simon Willison — How StrongDM's AI team builds software without looking at code](https://simonwillison.net/2026/Feb/7/software-factory/)
- [Stanford CodeX — Built by Agents, Tested by Agents, Trusted by Whom?](https://law.stanford.edu/2026/02/08/built-by-agents-tested-by-agents-trusted-by-whom/)
