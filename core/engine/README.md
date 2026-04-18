# Garura Engine

AI-powered engineering cockpit built on Next.js 15 App Router. Reads Garura product artifacts (YAML/Markdown) from local repositories and presents them through three instruments: Checklists, Flight Deck, and Playbook Reader.

## Instruments

**Checklists** — Readiness score (0–100) derived from play precondition satisfaction, with guided step-by-step procedures mapped to Garura plays.

**Flight Deck** — Live view of epics in flight, developer mapping, play execution status, and project metrics.

**Playbook Reader** — AI-composed contextual narrative views from the artifact graph. Supports progressive disclosure, wiki tags (`[[play:prompt]]` → interactive execution), and text-selection annotations.

## Key Capabilities

- **Artifact Parser** — Reads YAML/MD files from `.garura/` directories with frontmatter extraction
- **Cross-Reference Resolver** — Builds in-memory link graph from convention-based IDs (`[F1]`, `[SC-AUTH-001]`, `[EPIC-*]`, etc.)
- **Search Index** — MiniSearch-backed full-text search with field boosting and git-hash cache invalidation
- **Readiness Engine** — Scores 0–100 based on play precondition satisfaction across locked artifact stages
- **Wiki Tag Parser** — Parses `[[play:prompt]]` syntax into interactive execution triggers
- **Play Execution Bridge** — Spawns Factory CLI / Claude CLI via `child_process.spawn`, streams output via SSE
- **Annotation System** — YAML sidecar files for text-selection annotations (source artifacts are never modified)
- **Narrative Engine** — AI-composed views using Vercel AI SDK tool calls that map to React components

## Tech Stack

| Library | Purpose |
|---------|---------|
| Next.js 15 | App Router framework (RSC for filesystem access) |
| React 19 | UI rendering |
| TypeScript (strict) | Type safety |
| Tailwind CSS v4 | Utility-first styling |
| MiniSearch | Full-text search with field boosting, fuzzy, prefix |
| simple-git | Git operations (log, status, rev-parse, cache invalidation) |
| js-yaml / gray-matter | YAML parsing and frontmatter extraction |
| Vitest + React Testing Library | Testing (1200+ tests across 51 files) |

## Setup

```bash
# Install dependencies
pnpm install

# Start dev server (port 3200)
pnpm dev

# Point at a specific project repo
GARURA_TARGET_REPO=/path/to/repo pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 3200 |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm test` | Run tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint + Prettier check |
| `pnpm lint:fix` | Auto-fix lint/format issues |

## Project Structure

```
core/engine/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes (narrative, search, expansion, etc.)
│   │   ├── checklists/         # Checklists instrument page
│   │   ├── flight-deck/        # Flight Deck instrument page
│   │   ├── playbook/           # Playbook Reader instrument page
│   │   ├── layout.tsx          # Root layout (app shell, top bar, instrument switcher)
│   │   └── page.tsx            # Landing page
│   ├── components/             # React component library
│   │   ├── checklist-card.tsx   # Checklist display with step items
│   │   ├── epic-card.tsx        # Epic status cards
│   │   ├── narrative-view.tsx   # AI-composed narrative rendering
│   │   ├── content-slot.tsx     # Progressive disclosure container
│   │   ├── wiki-tag.tsx         # Inline play execution trigger
│   │   ├── annotation-layer.tsx # Text-selection annotation overlay
│   │   ├── search-bar.tsx       # Search input with results
│   │   └── ...                  # ReadinessGauge, StatusBadge, etc.
│   ├── hooks/                  # React hooks
│   ├── lib/                    # Core logic
│   │   ├── artifact-parser.ts   # YAML/MD artifact parsing
│   │   ├── crossref-resolver.ts # Cross-reference link graph
│   │   ├── search-index.ts      # MiniSearch indexing + git-hash invalidation
│   │   ├── readiness.ts         # Readiness score calculation
│   │   ├── checklist-engine.ts  # Checklist evaluation logic
│   │   ├── narrative-engine.ts  # AI narrative composition
│   │   ├── play-executor.ts     # CLI bridge for play execution
│   │   ├── wiki-tag-parser.ts   # Wiki tag syntax parsing
│   │   ├── annotation-manager.ts # Annotation YAML sidecar I/O
│   │   ├── flight-deck.ts       # Flight deck data aggregation
│   │   ├── epic-status.ts       # Epic status tracking
│   │   ├── git-integration.ts   # Git operations wrapper
│   │   └── config.ts            # Runtime configuration
│   ├── checklist-defs/         # Checklist definition files
│   └── __tests__/              # Test suites (51 files)
├── test-fixtures/              # Test fixture data
├── vitest.config.ts            # Vitest configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

## Invariants

- Source YAML artifacts are **never modified** — annotations use sidecar files
- Play execution is restricted to a **command whitelist** (factory/claude CLI only)
- Progressive disclosure is **additive** — expansions push content down, never replace
- All filesystem paths are **validated against known artifact types** — no raw user paths reach `fs` calls
- Search index rebuilds **only when git HEAD changes** — hash-based cache invalidation
