---
id: technology/astro-content-sites
title: "Astro content sites: file-based markdown, SSR on Node, with a coauthor edit loop"
conditions:
  surface: content-site
  stack: astro-ssr-node
  content: file-based-markdown
  persistence: none
  audience: readers-and-sharers
evolve_when: []
provenance: "documented (the user's StormCaller .sites-app — preferred Astro setup)"
---

# Astro content sites: file-based markdown, SSR on Node, with a coauthor edit loop

## Topic
The preferred way to ship a lightweight, content-led site — marketing pages, docs,
pitch decks, briefs, blogs — where the content is **prose, not structured data**.
Astro running SSR on Node, content as plain markdown files read live from disk, a
small registry mapping files to pages, and a built-in coauthor editor. Modeled on
the StormCaller `.sites-app/`.

## Conditions

### When to choose
The thing you are publishing is writing, not records. There is no database and no
structured data model — files are the source of truth. You want to add a page by
dropping a markdown file and registering it, deploy with no rebuild ceremony, and
optionally edit live in the browser. Ideal for content sites, internal docs, pitch
decks, and **shareable prototypes** (the natural next step from an HTML-first
[quick prototype](./quick-prototype-html-first.md)).

### When to avoid
Anything that is really an application — structured data, user accounts, write-heavy
workflows, a real domain model. That wants [React + Next.js](./frontend-react-nextjs.md)
over a [modular monolith](../architecture/modular-monolith.md), not a content-site
generator. Also avoid if the content is genuinely structured (catalogs, dashboards)
rather than prose.

### Scale profile
Sweet spot: a handful to a few dozen content-led sites/sections, authored by one or
a few people, prose-first. Stretch: many sites under one registry. Break point: the
moment "pages" become "an app" — structured data, auth-gated workflows, write-heavy
state — climb off this approach.

## Recommendation

### The setup (StormCaller `.sites-app/`)
- **SSR on Node** (`@astrojs/node`, standalone) on port **4321**. The server runs
  continuously; there is no static build artifact to publish.
- **Content lives outside the app**, read at request time from an `MD_ROOT` dir
  (dev: parent dir; prod: a mounted `/content` volume or bucket). Astro only sees
  paths — push new markdown, the next request serves it, no rebuild.
- **`sites-config.js` registry** is the single source of config: each site slug →
  `{ title, theme, source, sections[] }`, each section → `{ slug, file, title, num }`.
  A page exists only if it is registered — undefined routes 404.
- **Dynamic route** `[site]/[...pageSlug].astro` resolves a registered page;
  `lib/markdown.js` reads the file (cached by path+mtime) and `marked` renders GFM
  to HTML injected into a layout. Subsection nav is driven by a `▸` title marker.
- **Styling**: one shared `public/styles.css` + a per-site theme
  `public/themes/<name>.css` (CSS variables for palette). No per-component CSS.
- **Auth** (optional): basic-auth via `AUTH_USER`/`AUTH_PASS` middleware.
- **Deploy**: stateless Node server on Cloud Run with content on a mounted volume /
  GCS bucket; scale horizontally; no session state, no DB.

### The signature piece — the coauthor edit loop
A `/edit` page (CodeMirror + live preview) plus `api/{save,proposal,status}` give a
two-author contract over sidecar files next to each `<file>.md`:
- `.baseline` — last agreed state (human edits show red against it);
- `.proposed` — an agent's pending proposal (editor opens in REVIEW, agent
  additions shown green); finalize/discard via the proposal API;
- `.editing` — a liveness marker the editor touches every ~2s so an agent can avoid
  clobbering a live edit.
Saves carry a conflict guard (409 if the file changed since load); the editor polls
status every ~2s and auto-reloads when a new proposal lands. This human+agent
review loop is what makes the setup distinctive — it is not stock Astro.

## Rationale
Content-as-files with no ORM means publishing is "edit a file" — zero deployment
ceremony, the content readable and diffable on its own. SSR-on-Node reading from
disk keeps the stack tiny (gray-matter, marked, CodeMirror) and avoids rebuild
loops; a stateless server scales horizontally with content on a mounted volume. The
registry keeps routing explicit (no file-to-route magic to debug). The coauthor loop
makes prose a collaborative artifact between a person and an agent, with clear
attribution — the reason this is the preferred setup rather than a generic
static-site generator. The cost is that it is deliberately not an app framework:
the moment you need structured data or real write-workflows, you have outgrown it.

## Evolve when
| From | To | Trigger |
|------|----|---------|
| HTML-first [quick prototype](./quick-prototype-html-first.md) | Astro content site | ready to share with others / add light structure and editing |
| Astro content site | [React + Next.js](./frontend-react-nextjs.md) app | the "site" becomes an app — structured data, accounts, write-heavy flows |

## Provenance
documented — the user's StormCaller `.sites-app/` (the preferred Astro setup),
captured into the v1 KB. Not examined: the `.deploy/` scripts and theme-engine
internals.
