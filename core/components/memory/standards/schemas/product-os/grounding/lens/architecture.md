# Architecture Lens Grounding Doc — TEMPLATE & CONTRACT

> Locked contract for a slice's `lens/architecture.md` — the **non-functional** architecture
> lens. It names the components the slice needs, their contracts, the stack with versions, and
> how this one slice is built end-to-end through them. The linter enforces the heading set; the
> content-quality eval scores it against `_content-standard.md`. Written by `/arch`.

## Heading contract (required, in order)

```
# Architecture Lens
## Intent
## Components
## Stack
## Vertical build
```

## Per-section guidance

- **Intent** — the architectural shape of this slice in a paragraph: the layers it spans and the
  one boundary that keeps it clean.
- **Components** — each component the slice needs, in its layer, with its contract (what it takes
  and gives). Prose per component on its job and why it's separate.
- **Stack** — a table: `| Component | Technology | Version |` — concrete choices with pinned
  versions.
- **Vertical build** — how this one slice is built end-to-end through the components, top to
  bottom, so a builder sees the whole path for this increment.

## Gold example

```markdown
# Architecture Lens

## Intent
The Trusted Source Coverage slice is a thin vertical: fixture files in, a small read pipeline, a
read-only API, and a browser view. The boundary that matters is that the view reads only the
labeled fact set through the API and never reaches back to a raw fixture — which is what keeps
privacy enforced in exactly one place.

## Components
- **Fixture reader** (data layer) — contract: takes a fixture path, yields normalized usage
  records. Separate so each source format is isolated behind one shape.
- **Trust labeler** (data layer) — contract: takes a record, returns it stamped with privacy and
  fidelity state. The single privacy gate.
- **Coverage computer** (domain layer) — contract: takes labeled records, returns per-source
  coverage states. Pure, no I/O.
- **Read API** (interface layer) — contract: serves the coverage states read-only over local HTTP.
- **Coverage view** (surface layer) — contract: calls the API, renders the table and states.

## Stack
| Component | Technology | Version |
|-----------|------------|---------|
| Read API | FastAPI (Python) | 0.111 |
| Local server | Uvicorn | 0.30 |
| Coverage view | React + Vite | 18 / 5 |

## Vertical build
Load fixtures → fixture reader normalizes → trust labeler stamps each record → coverage computer
derives per-source states → read API exposes them → the coverage view renders the table. The
whole slice runs on a laptop with no external services.
```
