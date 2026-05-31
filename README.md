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
│  High-order: Complex workflows, human only, chains plays    │
│  Atomic: Atomic activities, human OR model, artifact+chkpt  │
└─────────────────────────────────────────────────────────────┘
                              │
                    Atomic → invokes agents (≤2 calls)
                    High-order → chains plays (with guardian checkpoints)
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
│  LTM (runtime): ~/.garura/core/memory/ (global default) │
│  STM: Artifacts per issue (.garura/{issue}/)            │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**

- **High-Order Plays**: High-order workflows (human only), chain plays with guardian checkpoints
- **Atomic Plays**: Atomic activities (human OR model), always produce artifact + checkpoint
- **Agents**: Domain experts that make decisions, discover skills on the fly
- **Skills**: Self-contained capabilities with local references (model invocable only)
- **Memory**: LTM (skill overrides, synced at deployment) + STM (per-issue artifacts)

### Agent Roles

Garura agents follow the `{domain}-{role}` naming pattern:

| Agent | Domain | Role | Responsibility |
|-------|--------|------|----------------|
| `project-orchestrator` | project | orchestrator | Issues, tracking, project coordination |
| `repo-orchestrator` | repo | orchestrator | Git operations, commits, branches |

**Total: 2 agents**

### Memory System

Garura uses a dual memory architecture:

- **Short-Term Memory (STM)**: Issue-specific artifacts stored in `.garura/{issue}/` with subdirectories for `docs/`, `evidence/`, and `checkpoint/` (see ADR 008)
- **Long-Term Memory (LTM)**: Organizational knowledge — authored in `core/components/memory/`, synced to `~/.garura/core/memory/` (global) or `.garura/core/memory/` (project). Contains skill overrides, standards, templates, practices.

**Skill-Memory Pattern**: Skills embed their own references locally. LTM contains overrides that are synced to skills at deployment time. Skills never read from LTM at runtime — they are self-contained.


## Supported AI Agents

Garura is designed to work with multiple AI agent platforms:

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
curl -fsSL https://raw.githubusercontent.com/kapilvirenahuja/garura/main/installer/install.sh | bash
```

Optionally specify a project name:

```bash
curl -fsSL https://raw.githubusercontent.com/kapilvirenahuja/garura/main/installer/install.sh | bash -s -- --project-name my-app
```

This scaffolds the following structure in your project:

```
your-project/
├── .garura/
│   ├── core/
│   │   ├── config.yaml    # Project configuration (customizable)
│   │   └── memory/        # LTM: practices, templates, standards (gitignored ephemeral copy)
│   └── project/
│       └── specs/         # Project artifacts (STM)
├── src/                   # Source code directory
└── CLAUDE.md              # AI instructions (customizable)
```

**Note:** Skills, agents, and plays deploy to `~/.claude/` (global, shared across all projects) by default. The `.claude/` directory is no longer tracked in git.

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
- `~/.claude/agents/` — Agent definitions (global deployment)
- `~/.claude/skills/` — Skills and plays (global deployment)
- `~/.garura/core/memory/` — Memory (practices, templates, global)

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

# Deploy components to .claude/ via the sudarshan meta-play
claude /sud:install
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
│   │   ├── plays/           # plays (atomic activities)
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
│   ├── agents/                # Use ~/.claude/agents/ (via /sud:install)
│   ├── skills/                # Use ~/.claude/skills/ (via /sud:install)
│   └── plans/                 # Planning artifacts
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
