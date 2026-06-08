---
id: domains/experience
title: "Experience: intelligent experience — semantic front-end modeling, intent-centric, above the DXP"
conditions:
  trigger: "the product helps people find, understand, and be guided — discovery, intent, conversational/generative/agentic experience, real-time behavioural intervention"
  selection_keys: [discovery-channel-mix, intent-modelling-need, ax-surface-mix, real-time-behavioural-need, evidence-rigor]
provenance: interview (#434 — Kapil) + Nagarro "experience intelligence" reference repo (~/cto/nagarro/experience intelligence)
---

# Experience: intelligent experience

## Stance (non-negotiable)
**Intelligent experience is the domain.** It is the **diagnosis + orchestration
layer that sits ABOVE the DXP / CMS / CDP / analytics** — it does not deliver the
experience, it decides what the experience should become. "DXP delivers
experiences; Experience Intelligence decides what the experience should become."

This is **real-time, in-session** — STM-like context, not a persistent profile.
Persistent tailoring (CDP, profiles, content/experience personalization) is
`personalization`; experience *leans on* personalised context but owns the
real-time, behavioural, discovery side. The content it reasons over is
`content-management`; campaigns/GEO content production is `marketing`.

Intent-first throughout: the unit is **intent**, not the page and not the
customer's identity.

## The MOAT — semantic modeling for the front-end
The differentiator is **semantic modeling for the front-end**: an **intent-centric
ontology / experience graph** that models what people want, what content exists,
what products/channels/journeys/outcomes connect them, and where the gaps are.
**The ontology is the IP; storage is an implementation detail.** Build
ontology-first. The graph is an operating system for experience, not a dashboard —
every downstream feature (discovery, simulation, agent orchestration) hangs off it.

**Evidence-first, always.** Every node, edge, inference, and recommendation traces
to evidence (URL, snippet, timestamp, extraction method, confidence). Signals are
**hypotheses, not facts** — they carry confidence scores. No hand-wavy
recommendations.

## Funnels are the wrong lens now (POV)
We used to build search as **funnels**. With LLMs changing the entry points, the
funnel is the wrong way to look at it. Discovery has shifted from
*search → website → conversion* to *answer engine / AI agent → generated answer →
maybe website → maybe conversion*. **The top of funnel is now owned by LLMs.** You
can't optimise a funnel stage you no longer own — so **optimise the CONTENT for the
top funnel** instead, for humans *and* search, answer, generative, and agent
systems.

Measure discoverability across four distinct contexts, each its own signal set:
**SEO, AEO** (answer-engine), **GEO** (generative-engine), and **Agent
visibility**. Model **intent journeys** (research → compare → evaluate → act), not
funnel stages and not page clicks. Intent is more durable than channels and more
available than identity — often you can model what a visitor is trying to do
without knowing who they are (public-signal-first).

## Three surfaces — and agentic is orthogonal
Three experience surfaces, distinct but overlapping:
- **Conversational** — dialogue: intent inference, clarification, evidence
  retrieval, escalation. Becoming important fast.
- **Generative** — adaptive content/answers/comparisons from governed evidence.
- **Orchestrated** — coordination across tools, systems, agents, workflows.

**Agentic sits outside conversational.** A capability is agentic only if it can
**reason, plan, orchestrate, act, remember within guardrails, and escalate to
humans** — text generation alone, a recommendation alone, automation alone are NOT
agentic. Agents can *inform* a conversation (they aren't the conversation), and
agents can *live in* generative surfaces. So agentic is a pattern across all three
surfaces, not a fourth surface.

## Real-time behavioural experience (gamified psychology, in-session)
Experience holds the **gamified behavioural psychology** — read in-session
behavioural signals and intervene. Signals: hesitation, abandonment risk, rapid
backtracking, repeated comparison, unresolved loops, high-intent page depth,
frustration language, stalled journey stage.

A **nudge is a governed intervention** — trigger signal, message, channel,
confidence, expected outcome, guardrail policy — and **every nudge must be
measurable**. Allowed: progress visibility, completion cues, milestones, helpful
reminders, choice simplification, confidence-building explanations, recovery
nudges. **Forbidden: dark patterns** — deceptive urgency, hidden opt-ins,
manipulative scarcity, pressure loops, consent bypass. When confidence drops or
risk rises, **escalate to a human**. This is in-session intelligence — not CDP
personalisation.

## Intents this domain captures (proposed — sanity-check)
Intent-first. (Kapil delegated the intent list — confirm or correct.)

**Visitor intents**
- **Find** — "get me to the right thing" → search, discovery, answer.
- **Explore & compare** — "help me make sense of the space" → discovery, comparisons.
- **Be guided** — "walk me through it" → conversational / agentic assistance.
- **Be recovered** — "I'm stuck/hesitating" → behavioural nudge, real-time intervention.

**Operator intents**
- **Be discoverable** — "are we visible/citable to search, answer, generative engines, and agents?" → discovery intelligence (SEO/AEO/GEO/agent).
- **Know the intent** — "what are people trying to do, and does our content support it?" → intent intelligence + the graph.
- **Decide what to change** — "what should the experience become next?" → recommendations, simulation.
- **Govern the agents** — "see and control agents, tools, memory, guardrails, HITL" → the agent ops plane.

## Capabilities
- **Intent-centric ontology & experience graph** — the moat; the semantic model.
- **Discovery intelligence** — visibility/citability/answerability/agent-readiness
  across SEO/AEO/GEO/agent.
- **Intent intelligence** — intent capture, intent journeys, content-to-intent gaps.
- **Conversational / generative / orchestrated surfaces** — with agentic logic.
- **Behavioural signals & governed nudges** — real-time intervention, HITL escalation.
- **Experience simulation** — model what an experience change would do before shipping.
- **Search & faceted discovery** — the classic baseline still lives here (full-text,
  facets, autocomplete, relevance) but is reframed under intent + discovery above.
- **Agent ops plane (Agent Factory)** — manage agents, capabilities, tools (MCP),
  memory rules, guardrails, HITL queues, approvals, audit. Governance is
  architectural, not bolted on.

## Where it goes wrong
- **Funnel thinking** — optimising a funnel whose top LLMs now own.
- **Not handling heuristics** — shipping without the behavioural-signal heuristics
  that decide when/whether to intervene.
- **Ignoring the mobile layer** — building it static instead of leaning into
  **A2UI** (adaptive / agent-to-UI).
- **A2UI built wrongly — ignoring the DXP layer.** A2UI grounded only in local DXP
  rules, without the intent graph, discovery visibility, gap evidence and
  agent-readiness context, is locally optimised but globally wrong.
- **Recommendations without evidence** — inferences with no confidence or trace.

## Intelligence features (this domain is intelligence)
**Core — where we lead (the moat and its surfaces)**
- **Semantic front-end modeling** — the intent-centric ontology / experience graph.
- **Discovery intelligence** — SEO/AEO/GEO/agent visibility.
- **Intent intelligence** — intent capture + intent journeys + content gaps.
- **Conversational, generative, and agentic experience** — the three surfaces + the
  agentic reasoning/planning/orchestration pattern.
- **Real-time behavioural nudging** — governed, measurable, HITL-escalating.

**Adjacent — ops & neighbours**
- **Agent Factory / governance plane** — mandatory ops layer, but a platform concern.
- **Persistent personalisation** — handed to `personalization` (this domain is real-time).

## Non-negotiables
- **Ontology-first — the model is the IP**, storage is detail.
- **Evidence-first** — every inference traces to evidence with a confidence score;
  signals are hypotheses.
- **Above the DXP, not a replacement** — add the intelligence layer; don't re-deliver.
- **Real-time / in-session boundary** — persistent tailoring is `personalization`.
- **Governed nudges only — no dark patterns**, and HITL escalation when confidence
  drops or risk rises.
- **Optimise content for the LLM-owned top funnel** — funnels are the wrong lens.
- **Don't ignore mobile / A2UI, and ground A2UI in the DXP layer.**

## Rationale
The strategic bet is that experience moves from page-centric to intent-centric and
agent-mediated, so the durable asset is a semantic model of intent — the moat — not
another delivery tool. The funnel POV follows directly: if LLMs own discovery's top,
you compete on content optimised for answer/generative/agent systems, measured as
discoverability, not on owning a funnel stage. The conversational/generative/
orchestrated split keeps "agentic" honest (reasoning+planning+orchestration+memory+
escalation), so teams don't relabel a chatbot as an agent. Real-time governed
nudging is where behavioural psychology pays off without crossing into dark
patterns — and it's deliberately separated from persistent personalisation.
Evidence-first is what makes any of it defensible to a client.

## Evolve when
- Answer/generative/agent traffic grows → invest in AEO/GEO and agent-visibility
  measurement alongside SEO.
- Conversational/agentic surfaces mature → formalise the agent ops plane and HITL.
- Real-time behavioural intervention proves out → expand the governed nudge library.
- The intent graph deepens → drive simulation and "what should the experience
  become next" off it.

## Provenance
interview (#434 — Kapil): "intelligent experience" as the core, **semantic
front-end modeling = the MOAT**, the funnels-are-wrong / LLMs-own-top-of-funnel POV,
conversational vs generative vs agentic (agentic orthogonal), gamified behavioural
psychology as real-time/STM (distinct from personalisation), and the mobile/A2UI/
DXP failure modes. Fleshed out from his "experience intelligence" reference repo
(intent-centric ontology, experience graph, discovery/intent intelligence,
evidence-first, agentic experience / AX, agent factory). Intents proposed by Claude
per delegation — pending confirmation. NOT a generic search shelf.
