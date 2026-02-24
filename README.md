# Meridian

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

## What is Meridian

Meridian is an agentic framework that implements Intent-Driven Software Development principles. It orchestrates specialized AI agents through cognitive flows to deliver enterprise-grade code generation.

### Key Features

- **Adaptive Execution**: Works with your existing tools (GitHub CLI, MCP servers, direct APIs)
- **Specialized Agents**: AI agents with defined roles following naming conventions (domain-keepers, SDLC roles, specialists)
- **Dual Memory System**: Short-Term Memory (STM) for task context and Long-Term Memory (LTM) for organizational knowledge
- **AI-Native SDLC**: 5-step workflow (Discover → Specify → Design → Build → Run) for structured development
- **Deterministic Outcomes**: Consistent, predictable results through explicit rules and abstracted implementation

### AI-Native SDLC

Meridian follows a 5-step AI-Native SDLC for all development workflows:

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

Meridian uses a **three-layer hierarchy** for deterministic workflows:

```
┌─────────────────────────────────────────────────────────────┐
│                      RECIPES                                │
│  L2: Complex workflows, human only, chains L1s              │
│  L1: Atomic activities, human OR model, artifact+checkpoint │
└─────────────────────────────────────────────────────────────┘
                              │
                    L1 → invokes agents (≤2 calls)
                    L2 → chains L1s (with guardian checkpoints)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      AGENTS                                 │
│  Autonomous decision-makers with domain expertise           │
│  Discover skills on the fly based on intent                 │
│  2 agents: project-orchestrator, repo-orchestrator          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SKILLS                                 │
│  Learned capabilities (model invocable only)                │
│  Self-contained with local references                       │
│  Technology/methodology specific knowledge                  │
└─────────────────────────────────────────────────────────────┘
        ▲ deployment sync
        │ (overrides)
┌─────────────────────────────────────────────────────────────┐
│                      MEMORY                                 │
│  LTM (authoring): core/components/memory/                   │
│  LTM (runtime): ~/.meridian/core/memory/ (global default) │
│  STM: Artifacts per issue (.meridian/{issue}/)            │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**

- **L2 Recipes**: High-order workflows (human only), chain L1s with guardian checkpoints
- **L1 Recipes**: Atomic activities (human OR model), always produce artifact + checkpoint
- **Agents**: Domain experts that make decisions, discover skills on the fly
- **Skills**: Self-contained capabilities with local references (model invocable only)
- **Memory**: LTM (skill overrides, synced at deployment) + STM (per-issue artifacts)

### Agent Roles

Meridian agents follow the `{domain}-{role}` naming pattern:

| Agent | Domain | Role | Responsibility |
|-------|--------|------|----------------|
| `project-orchestrator` | project | orchestrator | Issues, tracking, project coordination |
| `repo-orchestrator` | repo | orchestrator | Git operations, commits, branches |

**Total: 2 agents**

### Memory System

Meridian uses a dual memory architecture:

- **Short-Term Memory (STM)**: Issue-specific artifacts stored in `.meridian/{issue}/` with subdirectories for `docs/`, `evidence/`, and `checkpoint/` (see ADR 008)
- **Long-Term Memory (LTM)**: Organizational knowledge — authored in `core/components/memory/`, synced to `~/.meridian/core/memory/` (global) or `.meridian/core/memory/` (project). Contains skill overrides, standards, templates, practices.

**Skill-Memory Pattern**: Skills embed their own references locally. LTM contains overrides that are synced to skills at deployment time. Skills never read from LTM at runtime — they are self-contained.


## Supported AI Agents

Meridian is designed to work with multiple AI agent platforms:

- **Claude Code**: Anthropic's official CLI for Claude
- **Factory Droids**: Factory.AI Droid platform

## Installation

### Prerequisites

- **Claude Code CLI** (for AI-assisted development)
- **GitHub CLI** (`gh`) — [Install from cli.github.com](https://cli.github.com)
- **curl** (pre-installed on macOS/Linux)

### Install into an Existing Project

Run the installer in your project directory:

```bash
cd /path/to/your-project
curl -fsSL https://raw.githubusercontent.com/kapilvirenahuja/meridian/main/installer/install.sh | bash
```

Optionally specify a project name:

```bash
curl -fsSL https://raw.githubusercontent.com/kapilvirenahuja/meridian/main/installer/install.sh | bash -s -- --project-name my-app
```

This scaffolds the following structure in your project:

```
your-project/
├── .meridian/
│   ├── core/
│   │   ├── config.yaml    # Project configuration (customizable)
│   │   └── memory/        # LTM: practices, templates, standards (gitignored ephemeral copy)
│   └── project/
│       └── specs/         # Project artifacts (STM)
├── src/                   # Source code directory
└── CLAUDE.md              # AI instructions (customizable)
```

**Note:** Skills, agents, and recipes deploy to `~/.claude/` (global, shared across all projects) by default. The `.claude/` directory is no longer tracked in git.

**After installation:**

1. Review and customize `CLAUDE.md` for your project
2. Update `.meridian/core/config.yaml` with your repository details
3. Start developing with Claude Code

### Upgrade an Existing Installation

Run the same installer again — it detects the existing installation and performs a non-destructive upgrade:

```bash
curl -fsSL https://raw.githubusercontent.com/kapilvirenahuja/meridian/main/installer/install.sh | bash
```

**What gets upgraded (overwritten):**
- `~/.claude/agents/` — Agent definitions (global deployment)
- `~/.claude/skills/` — Skills and recipes (global deployment)
- `~/.meridian/core/memory/` — Memory (practices, templates, global)

**What gets preserved:**
- `.meridian/project/` — Your project artifacts
- `.meridian/core/config.yaml` — Your config (new version written as `config.yaml.new`)
- `CLAUDE.md` — Your AI instructions (new version written as `CLAUDE.md.new`)
- `.claude/settings.json` — Your Claude settings

Review the `.new` files and merge any changes you want to keep.

### Install from Source (for Contributors)

If you want to develop Meridian itself:

```bash
# Clone the repository
git clone https://github.com/kapilvirenahuja/meridian.git
cd meridian

# Sync components to .claude/ directory
claude /sync-claude
```

## Repository Structure

```
meridian/
├── installer/
│   └── install.sh             # Curl-based installer script
├── core/
│   ├── components/            # Source of truth (agents, skills, recipes, memory)
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
│   │   │   ├── submit-pr/
│   │   │   └── sync-claude/
│   │   ├── recipes/           # L1 recipes (atomic activities)
│   │   │   ├── commit-code/
│   │   │   ├── create-pr/
│   │   │   ├── start-feature/
│   │   │   └── start-planned-feature/
│   │   └── memory/            # Long-Term Memory (LTM)
│   │       ├── practices/     # Workflows, quality gates, standards
│   │       ├── quality-gates/
│   │       ├── references/
│   │       └── templates/     # Output templates
│   └── config.yaml            # Configuration
├── .claude/                   # NO LONGER IN REPO (gitignored, use ~/.claude/ global deployment)
│   ├── agents/                # Use ~/.claude/agents/ (via /sync-claude)
│   ├── skills/                # Use ~/.claude/skills/ (via /sync-claude)
│   └── plans/                 # Planning artifacts
├── docs/
│   ├── adr/                   # Architecture Decision Records
│   ├── philosophy/            # Core architecture philosophy
│   ├── components/            # Component-level documentation
│   └── usage/                 # Usage guides and recipes
├── CLAUDE.md                  # Project configuration
└── README.md                  # This file
```

## Documentation

### Architecture
- **Philosophy**: [`docs/philosophy/architecture.md`](docs/philosophy/architecture.md)
- **ADRs**: [`docs/adr/`](docs/adr/)

### Components
- **Recipes**: [`docs/components/recipes.md`](docs/components/recipes.md)
- **Agents**: [`docs/components/agents.md`](docs/components/agents.md)
- **Skills**: [`docs/components/skills.md`](docs/components/skills.md)
- **Memory**: [`docs/components/memory.md`](docs/components/memory.md)

## Contributing

We welcome contributions to Meridian! Whether you're fixing bugs, improving documentation, or proposing new features, please submit pull requests to the main branch.

### Guidelines for Contributors

1. Follow the existing code style and patterns
2. Create feature branches with descriptive names
3. Include tests for new functionality
4. Submit your pull request with a clear description of changes


## Maintainers

- **Kapil Viren Ahuja** - Primary maintainer

## License

MIT License

Copyright (c) 2026 Meridian Contributors

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

For issues and questions, please visit: https://github.com/kapilvirenahuja/meridian/issues
