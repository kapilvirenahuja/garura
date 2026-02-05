# Phoenix OS

**Your OS for intent-driven development** - An agentic system that defines how to build software deterministically for enterprise-grade delivery.

## What is Fluidic SDLC

**Fluidic SDLC** is a philosophy that prioritizes adaptive execution over rigid workflows. Unlike traditional methodologies that prescribe specific tools and rigid processes, Fluidic SDLC adapts to available tools, contexts, and constraints while maintaining deterministic outcomes.

### Core Philosophy

Traditional approach: `Tool Required → Process Fails if Unavailable → Developer Blocked`

Fluidic approach: `Start with intent → Agentic System selects method → Workflows adapt to needs → Consistent memory and context → Deliver consistent outcomes`

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

Read more: [`docs/philosophy/index.md`](docs/philosophy/index.md)

## What is Phoenix OS

Phoenix OS is an agentic framework that implements Fluidic SDLC principles for intent-driven development. It orchestrates specialized AI agents through cognitive flows to deliver enterprise-grade code generation.

### Key Features

- **Native Plugin Format**: Works as a Claude Code plugin with skills, commands, and agents
- **Adaptive Execution**: Works with your existing tools (GitHub CLI, MCP servers, direct APIs)
- **Specialized Agents**: AI agents with defined roles following naming conventions (domain-keepers, SDLC roles, specialists)
- **Dual Memory System**: Short-Term Memory (STM) for task context and Long-Term Memory (LTM) for organizational knowledge
- **Deterministic Outcomes**: Consistent, predictable results through explicit rules and abstracted implementation

### Core Components

Phoenix OS uses a **three-layer hierarchy** for deterministic workflows:

```
┌─────────────────────────────────────────────────────────────┐
│                      COMMANDS                               │
│  User-invocable workflows that orchestrate agents           │
│  /commit-code, /create-pr                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                    Command → invokes agents
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      AGENTS                                 │
│  Autonomous decision-makers with domain expertise           │
│  repo-orchestrator: commits, branches, PRs                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SKILLS                                 │
│  Learned capabilities (model invocable only)                │
│  analyze-changes, analyze-pr, create-commit, submit-pr      │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**

- **Commands**: User-invocable workflows that orchestrate agents (`/phoenix-os:commit-code`, `/phoenix-os:create-pr`)
- **Agents**: Domain experts that make decisions, discover skills on the fly
- **Skills**: Self-contained capabilities with local references (model invocable only)
- **Memory**: Repository standards and conventions (consolidated in `skills/memory/`)

### Plugin Structure

```
phoenix-os/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest
├── skills/                   # Model-invocable capabilities
│   ├── analyze-changes/      # Analyze uncommitted changes
│   ├── analyze-pr/           # Analyze PR readiness
│   ├── create-commit/        # Create commits
│   ├── submit-pr/            # Submit pull requests
│   └── memory/               # Repository standards & conventions
├── commands/                 # User-invocable workflows
│   ├── commit-code.md        # Commit workflow
│   └── create-pr.md          # PR creation workflow
├── agents/                   # Domain experts
│   └── repo-orchestrator.md  # Repository operations
├── CLAUDE.md                 # Claude Code configuration
└── README.md                 # This file
```

## Installation

Phoenix OS is a Claude Code plugin. To use it:

### Option 1: Clone and Use Directly

```bash
# Clone the repository
git clone https://github.com/nagarro-digital/phoenix-os.git

# Use with Claude Code by navigating to the directory
cd phoenix-os
claude
```

### Option 2: Use as a Plugin in Your Project

Copy the plugin structure to your project:

```bash
# Copy plugin files to your project
cp -r phoenix-os/.claude-plugin your-project/
cp -r phoenix-os/skills your-project/
cp -r phoenix-os/commands your-project/
cp -r phoenix-os/agents your-project/
```

### Available Commands

Once installed, the following commands are available in Claude Code:

- `/phoenix-os:commit-code` - Commit code changes with conventional commit messages
- `/phoenix-os:create-pr` - Create pull request with context-aware quality checklist

## SDLC Phases Supported

Phoenix OS supports multiple development scenarios:

### Greenfield Development
Starting new projects from scratch with full intent-driven approach:
- Requirements analysis and technical design
- Interface-first development with TDD
- Feature breakdown into vertical slices
- Automated test suite generation

### Brownfield Development
Working with existing codebases:
- Code analysis and architecture understanding
- Incremental refactoring with safety
- Legacy test coverage addition
- Pattern extraction and documentation

### Prototyping
Rapid proof-of-concept development:
- Quick iteration on ideas
- Minimal viable implementation
- Validation-focused testing
- Path to production-ready code

## Documentation

### Architecture
- **Philosophy**: [`docs/philosophy/architecture.md`](docs/philosophy/architecture.md)
- **ADRs**: [`docs/adr/`](docs/adr/)

### Components
- **Commands**: [`docs/components/commands.md`](docs/components/commands.md)
- **Agents**: [`docs/components/agents.md`](docs/components/agents.md)
- **Skills**: [`docs/components/skills.md`](docs/components/skills.md)
- **Memory**: [`docs/components/memory.md`](docs/components/memory.md)

## Contributing

We welcome contributions to Phoenix OS! Whether you're fixing bugs, improving documentation, or proposing new features, check out our [Contributing Guide](CONTRIBUTING.md) to get started.

### Quick Start for Contributors

1. Read our [Code of Conduct](CODE_OF_CONDUCT.md)
2. Check the [Contributing Guide](CONTRIBUTING.md) for development setup
3. Browse [good first issues](https://github.com/nagarro-digital/phoenix-os/labels/good-first-issue)
4. Submit your first pull request!

## Contributors

Phoenix OS is built by a growing community of contributors. See our [Contributors](CONTRIBUTORS.md) page to learn about our Phoenix badge system and recognize those who help make this project better.

### Core Team

- **Phoenix Eternal** (Owners)
  - **[Kapil Viren Ahuja](https://github.com/kapilvirenahuja)** - Primary Maintainer
  - **[Nitesh Soni](https://github.com/niteshsoni11)** - Core Owner

- **Phoenix Rising** (Elite Contributors)
  - **[Karry Reddy](https://github.com/karri-reddy-nagarro)** - Elite Contributor
  - **[Madhur Madan](https://github.com/madhurmadan)** - Core Contributor

Your contributions help Phoenix OS rise stronger! Start your journey from Spark to Phoenix today.

## Maintainers

- **Kapil Viren Ahuja** - Primary maintainer
- **Madhur Madan** - Core contributor
- **Vinay Singh** - Core contributor

## License

MIT License

Copyright (c) 2025 Nagarro Digital

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

For issues and questions, please visit: https://github.com/nagarro-digital/phoenix-os/issues
