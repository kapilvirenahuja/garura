---
id: technology/frontend-client-side-rendering
title: "Frontend: client-side rendering from static templates + JSON (no framework, no LLM)"
conditions:
  surface: review-documents       # briefs, reports, dashboards from structured data
  data-source: structured         # YAML/JSON artifacts are the source of truth
  needs: instant-deterministic-self-contained
  server: none
provenance: "learned: brief-rendering redesign (.claude/specs/brief-rendering)"
---

# Frontend: client-side rendering from static templates + JSON

## Topic
How to render structured data (YAML/JSON artifacts) into human-reviewable
documents — briefs, reports, dashboards. This is garura's own frontend approach.

## Conditions
The surface is a review document driven by structured data that already exists
(YAML artifacts). You want it instant, identical across runs, openable as a
standalone file (no server), and you do NOT want an LLM or a framework in the
render path. This is not an interactive web app.

## Recommendation
- **Keep the data as the source of truth.** Derive a JSON sibling from each YAML
  artifact (`product.yaml` → `product.json`). The JSON is disposable — re-derived
  from YAML anytime.
- **One static HTML template per artifact type**, with CSS inlined and a small
  embedded vanilla-JS renderer that fetches the JSON and builds the DOM in the
  browser. No build step, no server, no CDN, no framework — self-contained.
- **Share rendering primitives** across templates: `renderCards`, `renderTable`,
  `renderFieldGroup`, `renderText`, plus helpers (`esc`, `renderValue`,
  `badgeClass`). ~200 lines shared, ~500 lines of per-template render functions.
- **Render 1:1 with the data.** Every data key maps to a section; empty data
  renders an empty section (heading + empty container), never a hidden one. No
  "render what exists" logic — the document mirrors the artifact's true state.
- **Design system (Phoenix).** Themeable CSS tokens (dark / light / vibrant),
  sidebar navigation with active-on-scroll, a chapters layout, inline comments
  (localStorage), and Tether/Vanish/Orbit export.
- **A hub dashboard** rendered the same way from a JSON manifest (`hub.json`):
  one card per artifact with status and a summary stat.

## Rationale
The lesson came from doing it the other way first. Generating each brief by
having an LLM read the YAML and a template and emit the whole HTML took minutes
for a set of artifacts, burned tokens, and produced different output every run.
But the data→HTML mapping is mechanical — it should be code, not a model. Moving
to YAML→JSON→static-template-with-JS made generation sub-second, rendering
instant, and output pixel-identical across runs, while keeping every bit of the
UX (themes, sidebar, comments, export). The briefs directory became fully
disposable because JSON is re-derived from the durable YAML.

## Evolve when
- The surface becomes a genuinely interactive application — auth, real-time,
  complex client state, or SSR/SEO matters → reassess toward a real framework.
  For data-driven review documents, this static approach wins; don't add a
  framework you'll have to operate.

## Provenance
learned from the brief-rendering redesign — see `.claude/specs/brief-rendering/`
and the renderer/templates under `core/components/agents/doc-builder/templates/`
(`brief-render.js`, the per-artifact `*-brief.html`, `brief-common.css`).
