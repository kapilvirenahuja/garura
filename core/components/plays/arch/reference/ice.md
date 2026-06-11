# arch — ICE source

The clean ICE triple this play is compiled from. Update this and recompile via
play-creator; never hand-edit the compiled SKILL.md.

## Intent

Given one shaped **slice** — a vertical product increment from /shape, the thing you actually
deliver — write its **architecture lens**: the shape of the software that delivers the slice.
The slice is the unit of realization: you pick a slice and run quality → ux → agentic → arch
→ run on it, then ship it. A slice has no ICE of its own — its hub is the union of its
functionalities' ICE (which may span several capabilities) plus the product profile.

The lens is three things and only three: the **components** the slice threads — the
horizontal platforms/tiers (experience/channel, process, domain, cross-cutting like
security/cache/data) the slice's logic and data flow through; the **contracts** — the seams
crossed between those components, each carrying the data model that flows across it; and the
**stack** — the technology picked per component, with versions. A component is a HORIZONTAL
(a platform or tier shared across the product); the slice is a VERTICAL that threads
top-to-down through them — and the build is that vertical, end-to-end through these
components: end-to-end or the story failed. Components are SELECTED, not invented — each one
is a system the slice's functionalities talk to (their ICE `context.systems`) or a surface
the product exposes (the profile's `shape.surfaces`), placed in a layer. Contracts are the
seams those components must cross to serve the slice's functionalities. The stack picks are
deliberate technology choices, sized by the profile box (its NFR levels and gates) and
recorded as decisions the product references. Nothing is invented: the system-level shape and
the material technology picks are grounded in the KB's architecture/technology shelves — the
patterns that have worked for products in this situation, found via kb-search — or, where the
KB does not cover one, recorded as a KB-learning-gap proposal for review. It writes only the
architecture lens (and a decision for any material choice) — never the slice record, the
functionalities' ICE, the profile, another lens, structure, status, personas, journeys, or
other slices. One slice per run; one human checkpoint before anything persists.

Pipeline position: **none**. /arch is a MIDDLE play of the slice pipeline (quality → ux → agentic → arch → run → grill): it expects to run on the branch /quality already started, injects no head and no close, stops when its lens is written, and leaves the branch as-is for the next play. The close belongs to /grill. It writes the persistent product model directly, on the already-started branch. By convention fourth in the realize sequence — but takes **no** dependency on the quality, ux, or agentic lens: it reads the hub (the slice's functionalities' ICE + the profile box) only; never another lens. The NFRs it sizes the stack against come from the profile box directly, not the quality lens. (#437)

### Constraints

- C1 — One slice per run, and only a ready one: the slice exists (shaped by /shape), every
  functionality it bundles resolves to a rich ICE, and the product profile is firmed (`set`).
  If not, halt — /arch realizes a shaped slice; it does not shape one.
- C2 — Writes only this slice's architecture lens (and any decision), in the slice's lens
  folder. Never the slice record, the functionalities' ICE, the profile, another lens
  (quality/ux/agentic/run), node structure or status, personas, journeys, or other slices.
- C3 — architecture content only, and only the three blocks, per the architecture lens
  schema: `content` carries `components` (name, layer, kind, part), `contracts` (between,
  interface, data) and `stack` (component, tech, version) — and no other key. Concrete
  technology and versions live in `stack`; `components` name the horizontal platform/tier and
  the part the slice occupies, never a product or version.
- C4 — Every element is grounded — never invented. Each component traces to a system named in
  the slice's functionalities' ICE (`context.systems`) or to a surface in the profile
  (`shape.surfaces`), placed in a layer; each contract traces to a seam two of those
  components must cross to serve one of the slice's functionalities; each stack pick is a
  deliberate technology choice, sized by the profile box where it bears. (The decision
  requirement for material picks lives in C8.)
- C5 — Just enough, and coherent: every component has a layer, a kind, and the part the slice
  occupies in it; every contract names its interface and the data that crosses; every stack
  entry names a component, its tech, and a version. It anchors the architecture shape — it
  does not over-specify (no exhaustive resource sizing, no wire-level detail; that is the
  build's job off this lens).
- C6 — Vertical-build coverage, acyclic seams. Every functionality the slice bundles threads
  end-to-end through the components — there is a path across contracts from a surface/entry
  component to the component that serves it; no functionality is left un-threaded and no
  component is an orphan (in the lens but on no functionality's path). The directed graph of
  components and their contracts is acyclic; a cycle is broken (by removing a seam, splitting
  a component, or introducing an async boundary) before the lens is coherent.
- C7 — Reads the hub only: /arch derives from the slice's functionalities' ICE and the
  profile box — never from another realize lens (quality/ux/agentic/run). The quality bar it
  sizes the stack against is the profile box, read directly.
- C8 — Material architecture choices are decisions: the component set the slice threads, the
  system-level shape (monolith / modular-monolith / microservices / serverless), and each
  significant technology pick are deliberate choices recorded as slice-level decisions (ADRs)
  the product references — not re-invented per slice.
- C9 — Additive and non-destructive: the run changes only the architecture lens (and any new
  decision); every other product-model file — the slice record, the ICE, the profile, the
  other lenses, the other slices — is byte-unchanged. Re-running re-derives the architecture
  lens against the current hub; accepted decisions are superseded by new records, never edited
  in place.
- C10 — Schema conformance: the architecture lens and any decision validate against their v1
  schemas (lens v1, decision v1).
- C11 — Exactly one human checkpoint, presenting the proposed components (with layers),
  contracts, and stack, plus any decision, before anything is written. Nothing persists before
  approval.
- C12 — Material pattern choices are KB-grounded: the system-level shape (monolith /
  modular-monolith / microservices / serverless) and each significant technology pick trace to a
  best-fit learning on the KB's architecture or technology shelf (matched to the product's
  conditions via kb-search), or to a recorded KB-learning-gap proposal — never the model's taste
  alone. C8 still requires each such choice to be recorded as a decision; C12 requires it to be
  grounded in a known-good pattern (the decision says what we chose; the KB grounding says it is
  proven, not invented).

### Failure conditions

- F1 — /arch ran on an unready slice — the slice is absent, a functionality's ICE does not
  resolve or is not rich, or the profile is not firmed.
- F2 — A write touched something other than this slice's architecture lens or a decision (the
  slice record, a functionality's ICE, the profile, another lens, structure, status, a
  persona, a journey, or another slice).
- F3 — The architecture lens carries content outside the three blocks (resource sizing,
  wire-level detail, gates, screens, environments), is not the components/contracts/stack
  shape, or smears concrete tech/versions into `components` instead of `stack`.
- F4 — An element is invented — a component that is neither a system in the slice's
  functionalities' ICE nor a profile surface, a contract that no functionality requires, or a
  stack pick with no recorded decision.
- F5 — The lens over- or under-specifies — a component missing its layer, kind, or part; a
  contract missing its interface or data; a stack entry missing its tech or version.
- F6 — A functionality of the slice is not threaded end-to-end through the components, a
  component is an orphan (on no functionality's path), OR the component/contract graph
  contains a cycle that no async boundary breaks.
- F7 — /arch read or depended on another lens (quality/ux/agentic/run).
- F8 — A material architecture choice (the component set, the system-level shape, or a
  significant technology pick) was made with no decision recorded.
- F9 — A product-model file other than the architecture lens or a new decision changed, or an
  accepted decision was edited in place rather than superseded.
- F10 — The architecture lens or a decision violates its v1 schema.
- F11 — The architecture lens was persisted before the human approved the checkpoint.
- F12 — A material architecture pattern choice (the system-level shape or a significant
  technology pick) rests on neither a matched KB learning nor a recorded KB-learning-gap
  proposal — it was invented from the model's taste.

## Expectation

### Success scenarios

- S1 — (architect, first run) Given a shaped slice whose functionalities have rich ICE and a
  firmed profile, when /arch runs and the checkpoint is approved, then the architecture lens
  is written as grounded components, contracts, and stack — and nothing else changes. Measure:
  `slices/{slice}/lens/architecture.yaml` exists with `type: architecture`, a `slice_ref`, and
  non-empty `content.components`, `content.contracts`, and `content.stack`; every other
  product-model file is byte-identical before and after; the lens validates against lens v1.
- S2 — (platform engineer, grounded) Given the lens is drafted, when inspected, then every
  component, contract, and stack pick traces back to a hub source, the profile box, or a
  decision. Measure: the run's grounding map names, for every component, the ICE
  `context.systems` entry or profile surface it came from; for every contract, the
  functionality whose seam it is; and for every stack pick, the profile target or decision that
  grounds it; none ungrounded.
- S3 — (architect, vertical build) Given the components and contracts, when traced, then every
  functionality of the slice threads end-to-end across them and no component is an orphan, and
  the graph has no cycle. Measure: each functionality has a path from a surface/entry component
  to the component that serves it; every component lies on at least one such path; the
  component/contract graph is acyclic.
- S4 — (architect, hub-only) Given /arch runs, when the model is checked, then it read no other
  lens and wrote none. Measure: no quality/ux/agentic/run lens of the slice is touched; only
  this slice's `architecture.yaml` (and any decision) is in the written set; no element's
  grounding source is another lens.
- S5 — (product owner, re-run) Given /arch already ran on the slice, when it runs again, then
  it re-derives the architecture lens and changes nothing else; existing decisions are
  superseded, not edited. Measure: only the slice's `architecture.yaml` (and possibly a new
  decision) differ; the slice record, the other lenses, the ICE, and the profile are
  byte-identical; no accepted decision file is edited in place.
- S6 — (reviewer, the checkpoint) Given the lens is ready, when the checkpoint is shown, then
  it presents the proposed components (with layers), contracts, and stack, plus any decision,
  before any write. Measure: the checkpoint shows the three blocks and decisions inline; no
  product-model file is written before approval.
- S7 — (platform engineer, clean split) Given the lens, when read, then the horizontal
  platforms sit in `components` and the concrete technology with versions sits only in `stack`.
  Measure: no `components` entry names a product or version; every `stack` entry carries a
  component, a tech, and a version; the lens validates v1.
- S8 — (architect, KB-grounded) Given the lens is drafted, when inspected, then the system-level
  shape and every material technology pick trace to a KB learning or a recorded proposal.
  Measure: the manifest's `choices` block lists the shape and each material tech pick, each
  grounded in an `architecture/*` or `technology/*` learning that resolves on a shelf, or a
  proposal file that exists; `check_kb_grounding.py` is clean.

### Recovery (one per failure condition)

- REC1 (F1) — trigger: the slice is absent, a functionality's ICE does not resolve or is not
  rich, or the profile is not firmed. direction: halt and route to /shape (to shape the slice)
  or /understand (to enrich + firm) before /arch runs. handoff: human.
- REC2 (F2) — trigger: a write touched something beyond this slice's architecture lens or a
  decision. direction: revert the out-of-scope write; /arch writes only the slice's
  architecture lens (and decisions). handoff: autonomous.
- REC3 (F3) — trigger: the lens carries content outside the three blocks, the wrong shape, or
  tech/versions smeared into `components`. direction: strip it back to the
  components/contracts/stack shape and move concrete tech/versions into `stack`. handoff:
  autonomous.
- REC4 (F4) — trigger: an invented/ungrounded element — a component that is neither a system
  nor a surface, a contract no functionality requires, or a stack pick with no decision.
  direction: drop it, or re-tie the component to an ICE system / profile surface, the contract
  to the functionality whose seam it is, and the stack pick to a recorded decision; never keep
  an invented element. handoff: autonomous.
- REC5 (F5) — trigger: an over- or under-specified element — a component missing layer/kind/
  part, a contract missing interface/data, or a stack entry missing tech/version. direction:
  complete the missing fields, or trim the over-specification back to what anchors the shape.
  handoff: autonomous.
- REC6 (F6) — trigger: a functionality not threaded end-to-end, an orphan component, or a cycle
  in the component/contract graph. direction: add the missing component/contract to thread the
  functionality, drop the orphan, or break the cycle (remove a seam, split a component, or
  introduce an async boundary). handoff: autonomous.
- REC7 (F7) — trigger: /arch read or depended on another lens. direction: remove the
  dependency; /arch derives only from the slice's hub and the profile box. handoff: autonomous.
- REC8 (F8) — trigger: a material architecture choice with no decision recorded. direction:
  record the slice-level decision for the choice (component set, system-level shape, or
  technology pick) before persisting. handoff: autonomous.
- REC9 (F9) — trigger: a non-lens/non-decision file changed, or an accepted decision was edited
  in place. direction: restore it and re-apply only the architecture lens (and the new
  decision), after a human confirms the restore. handoff: human.
- REC10 (F10) — trigger: the lens or a decision fails v1 schema validation. direction: re-emit
  the failing artifact to conform before the play completes. handoff: autonomous.
- REC11 (F11) — trigger: the architecture lens was persisted before the checkpoint was
  approved. direction: revert the premature write and re-present the checkpoint; persist only
  after the human approves. handoff: human.
- REC12 (F12) — trigger: a material architecture pattern choice with no KB learning and no
  recorded proposal. direction: search the KB's architecture/technology shelves via kb-search
  for the best-fit learning and ground the choice in it, or raise a KB-learning-gap proposal (a
  candidate architecture/technology learning); never keep a taste-only choice. handoff:
  autonomous.
