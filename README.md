# Garura

**Your OS for intent-driven development** - An agentic system that defines how to build software deterministically for enterprise-grade delivery.

## What is Intent-Driven Software Development

**Intent-Driven Software Development (IDSD)** is a philosophy that prioritizes adaptive execution over rigid workflows. Unlike traditional methodologies that prescribe specific tools and rigid processes, IDSD adapts to available tools, contexts, and constraints while maintaining deterministic outcomes.

### Core Philosophy

Traditional approach: `Tool Required → Process Fails if Unavailable → Developer Blocked`

IDSD approach: `Start with intent → Agentic System selects method → Workflows adapt to needs → Consistent memory and context → Deliver consistent outcomes`

### Three Core Tenets

1. **Intent-Driven, Tool-Agnostic Execution**: Focus on outcomes, adapt to available tools and existing toolchains. Teams work with what they have, not what's prescribed.

2. **Context-Aware Decision Making**: Behavior adapts based on environment (dev, staging, prod), available tools (CLI, API, manual), user expertise, and time constraints.

3. **Agentic System Architecture**: Specialized AI agents collaborate autonomously to deliver deterministic outcomes through distributed expertise and self-correction.

### Goals

- Transform AI copilots from non-deterministic to deterministic for enterprise viability
- Ship quality code on the first try, not the fifth
- Remove tooling blockers through adaptive execution
- Enable consistent outcomes despite varying contexts
- Scale collaboration without rigid coordination

Read more: [`docs/philosophy/architecture.md`](docs/philosophy/architecture.md)

## What is Garura

Garura is an agentic framework that implements Intent-Driven Software Development principles. It orchestrates specialized AI agents through cognitive flows to deliver enterprise-grade code generation.

### Key Features

- **Adaptive Execution**: Works with your existing tools (GitHub CLI, MCP servers, direct APIs)
- **Specialized Agents**: AI agents with defined roles following naming conventions (domain-keepers, SDLC roles, specialists)
- **Dual Memory System**: Short-Term Memory (STM) for task context and Long-Term Memory (LTM) for organizational knowledge
- **AI-Native SDLC**: 5-step workflow (Discover → Specify → Design → Build → Run) for structured development
- **Deterministic Outcomes**: Consistent, predictable results through explicit rules and abstracted implementation

### AI-Native SDLC

Garura follows a 5-step AI-Native SDLC for all development workflows:

```
DISCOVER ──► SPECIFY ──► DESIGN ──► BUILD ──► RUN
```

| Step | Purpose |
|------|---------|
| **Discover** | Prototype ideas and validate concepts before formal specification |
| **Specify** | Define functional requirements, NFRs, and validation criteria |
| **Design** | Create UX and technical design (security, performance, accessibility) |
| **Build** | TDD implementation, testing, quality gates, documentation, PR workflow |
| **Run** | Deploy to production, monitor, alert, and respond to incidents |

### Core Components

Garura uses a **three-layer hierarchy** for deterministic workflows:

```
┌─────────────────────────────────────────────────────────────┐
│                      PLAYS                                │
│  Compiled, intent-driven workflows (built via play-creator) │
│  A play is just a play — no levels or agent-count budgets   │
└─────────────────────────────────────────────────────────────┘
                              │
                    Plays invoke agents via the Task tool
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      AGENTS                                 │
│  Autonomous decision-makers with domain expertise           │
│  Discover skills on the fly based on intent                 │
│  18 agents: project-orchestrator, repo-orchestrator, …      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SKILLS                                 │
│  Learned capabilities (model invocable only)                │
│  Behavior embedded locally; org standards read from LTM     │
│  Technology/methodology specific knowledge                  │
└─────────────────────────────────────────────────────────────┘
        ▲ runtime reads
        │ (organizational standards)
┌─────────────────────────────────────────────────────────────┐
│                      MEMORY                                 │
│  LTM (authoring): core/components/memory/                   │
│  LTM (runtime): ~/.garura/core/memory/ (global default) │
│  STM: Artifacts per issue (.garura/project/issues/{issue}/) │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**

- **Plays**: Compiled, intent-driven workflows that produce artifacts and stop at checkpoints — a play is just a play, with no level classification or agent-count budgets (see ADR 017)
- **Agents**: Domain experts that make decisions, discover skills on the fly
- **Skills**: Capabilities with behavior embedded locally (model invocable only); organizational standards are read from LTM at runtime
- **Memory**: LTM (organizational standards, read at runtime) + STM (per-issue artifacts)

### Agent Roles

Garura agents follow the `{domain}-{role}` naming pattern. Examples:

| Agent | Domain | Role | Responsibility |
|-------|--------|------|----------------|
| `project-orchestrator` | project | orchestrator | Issues, tracking, project coordination |
| `repo-orchestrator` | repo | orchestrator | Git operations, commits, branches |

**Total: 18 agents** — see `core/components/agents/` for the full set

### Memory System

Garura uses a dual memory architecture:

- **Short-Term Memory (STM)**: Issue-specific artifacts stored in `.garura/project/issues/{issue}/` with subdirectories for `specs/`, `evidence/`, `checkpoint/`, `context/`, and `review/` (see ADR 008 and ADR 017)
- **Long-Term Memory (LTM)**: Organizational knowledge — authored in `core/components/memory/`, synced to `~/.garura/core/memory/` (global) or `.garura/core/memory/` (project). Contains skill overrides, standards, templates, practices.

**Skill-Memory Pattern**: Skill behavior (process steps, output format, constraints) stays embedded in the skill. Organizational standards (commit categories, templates, quality rules) live in LTM and are read by skills at runtime via stable paths (see ADR 009).


## Supported AI Agents

Garura is designed to work with multiple AI agent platforms:

- **Claude Code**: Anthropic's official CLI for Claude
- **OpenAI Codex CLI**: via `install-garura --tool codex`

## Installation

### Prerequisites

- **Claude Code CLI** (for AI-assisted development)
- **GitHub CLI** (`gh`) — [Install from cli.github.com](https://cli.github.com)
- **curl** (pre-installed on macOS/Linux)

### Install into an Existing Project

Run the installer in your project directory:

```bash
cd /path/to/your-project
curl -fsSL https://raw.githubusercontent.com/kapilvirenahuja/garura/main/installer/install.sh | bash
```

Optionally specify a project name:

```bash
curl -fsSL https://raw.githubusercontent.com/kapilvirenahuja/garura/main/installer/install.sh | bash -s -- --project-name my-app
```

This scaffolds the following structure in your project:

```
your-project/
├── .claude/
│   ├── agents/            # Deployed agent definitions
│   └── skills/            # Deployed skills + plays
├── .garura/
│   ├── core/
│   │   └── config.yaml    # Project configuration (customizable)
│   └── project/
│       └── specs/         # Project artifacts (STM)
├── src/                   # Source code directory
└── CLAUDE.md              # AI instructions (customizable)
```

**Note:** Memory (LTM) deploys to the machine-global `~/.garura/core/memory/`, shared across all projects. The `.claude/` directory is a deployed copy, not tracked source.

**After installation:**

1. Review and customize `CLAUDE.md` for your project
2. Update `.garura/core/config.yaml` with your repository details
3. Start developing with Claude Code

### Upgrade an Existing Installation

Run the same installer again — it detects the existing installation and performs a non-destructive upgrade:

```bash
curl -fsSL https://raw.githubusercontent.com/kapilvirenahuja/garura/main/installer/install.sh | bash
```

**What gets upgraded (overwritten):**
- `.claude/agents/` — Agent definitions
- `.claude/skills/` — Skills and plays
- `~/.garura/core/memory/` — Memory (standards, knowledge — machine-global)

**What gets preserved:**
- `.garura/project/` — Your project artifacts
- `.garura/core/config.yaml` — Your config (new version written as `config.yaml.new`)
- `CLAUDE.md` — Your AI instructions (new version written as `CLAUDE.md.new`)
- `.claude/settings.json` — Your Claude settings

Review the `.new` files and merge any changes you want to keep.

### Install from Source (for Contributors)

If you want to develop Garura itself:

```bash
# Clone the repository
git clone https://github.com/kapilvirenahuja/garura.git
cd garura

# Deploy components into a target project via the install-garura play
claude "/install-garura --target /path/to/your-project"
```

## Repository Structure

```
garura/
├── installer/
│   └── install.sh             # Curl-based installer script
├── core/
│   ├── components/            # Source of truth (agents, skills, plays, memory)
│   │   ├── agents/            # Agent definitions
│   │   │   ├── code-builder.md
│   │   │   ├── project-orchestrator.md
│   │   │   ├── repo-orchestrator.md
│   │   │   └── tech-designer.md
│   │   ├── skills/            # Skills (self-contained capabilities)
│   │   │   ├── analyze-changes/
│   │   │   ├── analyze-pr/
│   │   │   ├── create-commit/
│   │   │   ├── manage-issue/
│   │   │   ├── setup-branch/
│   │   │   └── submit-pr/
│   │   ├── plays/           # Plays (compiled workflows)
│   │   │   ├── commit-change/
│   │   │   ├── play-creator/
│   │   │   ├── propose-change/
│   │   │   └── start-change/
│   │   └── memory/            # Long-Term Memory (LTM)
│   │       ├── knowledge/     # Searchable reference material (KB)
│   │       ├── standards/     # Rules, schemas, formats, templates
│   │       └── tools/         # Shared tooling
│   └── grounding/             # Canonical glossary and concepts
├── .garura/
│   └── core/
│       └── config.yaml        # Configuration (tracked)
├── .claude/                   # NO LONGER IN REPO (gitignored; deployed into targets via install-garura)
├── docs/
│   ├── adr/                   # Architecture Decision Records
│   ├── philosophy/            # Core architecture philosophy
│   ├── components/            # Component-level documentation
│   └── usage/                 # Usage guides and plays
├── CLAUDE.md                  # Project configuration
└── README.md                  # This file
```

## Documentation

### Architecture
- **Philosophy**: [`docs/philosophy/architecture.md`](docs/philosophy/architecture.md)
- **ADRs**: [`docs/adr/`](docs/adr/)

### Components
- **Plays**: [`docs/components/plays.md`](docs/components/plays.md)
- **Agents**: [`docs/components/agents.md`](docs/components/agents.md)
- **Skills**: [`docs/components/skills.md`](docs/components/skills.md)
- **Memory**: [`docs/components/memory.md`](docs/components/memory.md)

## Contributing

We welcome contributions to Garura! Whether you're fixing bugs, improving documentation, or proposing new features, please submit pull requests to the main branch.

### Guidelines for Contributors

1. Follow the existing code style and patterns
2. Create feature branches with descriptive names
3. Include tests for new functionality
4. Submit your pull request with a clear description of changes


## Maintainers

- **Kapil Viren Ahuja** - Primary maintainer

## License

MIT License

Copyright (c) 2026 Garura Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Support

For issues and questions, please visit: https://github.com/kapilvirenahuja/garura/issues
