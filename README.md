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

- **Adaptive Execution**: Works with your existing tools (GitHub CLI, MCP servers, direct APIs)
- **Specialized Agents**: AI agents with defined roles following naming conventions (domain-keepers, SDLC roles, specialists)
- **Dual Memory System**: Short-Term Memory (STM) for task context and Long-Term Memory (LTM) for organizational knowledge
- **AI-Native SDLC**: 5-step workflow (Discover → Specify → Design → Build → Run) for structured development
- **Deterministic Outcomes**: Consistent, predictable results through explicit rules and abstracted implementation

### AI-Native SDLC

Phoenix OS follows a 5-step AI-Native SDLC for all development workflows:

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

Phoenix OS uses a **three-layer hierarchy** for deterministic workflows:

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
│  6 agents: code-builder, quality-validator, tech-designer,  │
│  project-orchestrator, repo-orchestrator, workflow-guardian │
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
│  LTM: Skill overrides, standards (core/memory/)             │
│  STM: Artifacts per issue (.phoenix-os/{issue}/)            │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**

- **L2 Recipes**: High-order workflows (human only), chain L1s with guardian checkpoints
- **L1 Recipes**: Atomic activities (human OR model), always produce artifact + checkpoint
- **Agents**: Domain experts that make decisions, discover skills on the fly
- **Skills**: Self-contained capabilities with local references (model invocable only)
- **Memory**: LTM (skill overrides, synced at deployment) + STM (per-issue artifacts)

### Agent Roles

Phoenix OS agents follow the `{domain}-{role}` naming pattern:

| Agent | Domain | Role | Responsibility |
|-------|--------|------|----------------|
| `code-builder` | code | builder | Write code, implement features, fix bugs |
| `quality-validator` | quality | validator | Test, review, validate, quality gates |
| `tech-designer` | tech | designer | Technical design, RCA, architecture |
| `project-orchestrator` | project | orchestrator | Issues, tracking, project coordination |
| `repo-orchestrator` | repo | orchestrator | Git operations, commits, branches |
| `workflow-guardian` | workflow | guardian | Validates approval bypass in L2 recipes |

**Total: 6 agents** (5 SDLC roles + 1 special purpose)

### Memory System

Phoenix OS uses a dual memory architecture:

- **Short-Term Memory (STM)**: Task-specific context stored in `.phoenix-os/project/work/` - created per branch/worktree
- **Long-Term Memory (LTM)**: Organizational knowledge in `core/memory/` - skill overrides, standards

**Skill-Memory Pattern**: Skills embed their own references locally. LTM contains overrides that are synced to skills at deployment time. Skills never read from LTM at runtime — they are self-contained.

## What is Vanguard

[To be added]

## Supported AI Agents

Phoenix OS is designed to work with multiple AI agent platforms:

- **Claude Code**: Anthropic's official CLI for Claude
- **GitHub Copilot**: GitHub's AI pair programmer
- **Cursor**: AI-first code editor
- **Codex**: OpenAI's code generation models
- **[Additional platforms as support expands]**

## Installation Instructions

> **Note:** This is a private GitHub repository. Installation requires GitHub authentication via GitHub CLI.

### Prerequisites

- Node.js 14.0 or higher
- npm (comes with Node.js)
- GitHub CLI (`gh`) - [Install from cli.github.com](https://cli.github.com)
- Access to the `nagarro-digital/phoenix-os` repository

### GitHub CLI Authentication (One-time Setup)

Before installing, authenticate with GitHub:

```bash
# Login to GitHub CLI
gh auth login

# Follow the prompts:
# 1. Select "GitHub.com"
# 2. Select "HTTPS" or "SSH" (your preference)
# 3. Authenticate via browser or paste token

# Verify authentication
gh auth status
```

### Install Phoenix OS

#### Method 1: Install from GitHub Release (Recommended)

##### macOS / Linux

```bash
# Download and install the latest stable release
gh release download v2.0.6 -R nagarro-digital/phoenix-os -p "*.tgz" --clobber && npm install -g phoenix-os-*.tgz

# Cleanup (optional)
rm phoenix-os-*.tgz

# Verify installation
phoenix --version
```

##### Windows (Command Prompt)

```cmd
# Download and install the latest stable release
gh release download v2.0.6 -R nagarro-digital/phoenix-os -p "*.tgz" --clobber && npm install -g phoenix-os-2.0.6.tgz

# Cleanup (optional)
del phoenix-os-2.0.6.tgz

# Verify installation
phoenix --version
```

##### Windows (PowerShell)

```powershell
# Download and install the latest stable release
gh release download v2.0.6 -R nagarro-digital/phoenix-os -p "*.tgz" --clobber; npm install -g (Get-Item phoenix-os-*.tgz).FullName

# Cleanup (optional)
Remove-Item phoenix-os-*.tgz

# Verify installation
phoenix --version
```

Replace `v2.0.5` with the desired version. Visit the [Releases page](https://github.com/nagarro-digital/phoenix-os/releases) to find all available versions.

**Benefits:**
- Pre-built and tested package
- Works across all platforms (Windows, macOS, Linux)
- Uses your existing GitHub authentication

#### Method 2: Install from GitLab (Public Mirror)

For users without GitHub access, Phoenix OS is also available on GitLab:

```bash
# Install directly from GitLab (no authentication required)
npm install -g "https://git.nagarro.com/api/v4/projects/8154/packages/generic/phoenix-os/2.0.6/phoenix-os-2.0.6.tgz"

# Verify installation
phoenix --version
```

**Benefits:**
- No authentication required
- Direct URL installation
- Works across all platforms

#### Method 3: Install from Source

For development or testing specific branches:

**Prerequisites (additional):**
- Git
- SSH access to GitHub (SSH keys configured)

```bash
# 1. Clone the repository using SSH
git clone git@github.com:nagarro-digital/phoenix-os.git
cd phoenix-os

# 2. Checkout specific branch if needed (optional)
git checkout branch-name

# 3. Pack and install globally
npm pack
npm install -g phoenix-os-2.0.6.tgz

# 4. Verify installation
phoenix --version
```

This will install the `phoenix` command globally on your system.

**Note**: Direct installation via `npm install -g git+...` has known issues on Windows due to npm's handling of git repositories with symlinks and complex directory structures. The `npm pack` + `npm install -g` approach is the recommended method.

### Initialize a New Project

Once installed, you can create a new Phoenix OS powered project:

```bash
# Create new project in subdirectory
phoenix init --project-name <project-name> --ai <copilot>

# Initialize in current directory
cd my-existing-project
phoenix init --ai <copilot>
```

**Example:**
```bash
# Create new project
phoenix init --project-name my-awesome-app --ai claude

# Or use backward compatible syntax
phoenix init my-awesome-app --ai claude

# Interactive mode
phoenix init
# 1. Prompts for AI copilot
# 2. Asks: Initialize in current directory or create new project?
# 3. If new project: prompts for project name
```

**Currently Supported AI Copilots:**
- `claude` - Claude Code (Anthropic)
- More copilots coming soon (GitHub Copilot, Cursor, etc.)

### What Gets Created

The `phoenix init` command creates a new project with the following structure:

```
my-awesome-app/
├── .claude/                    # Claude Code configuration
│   ├── agents/                # Phoenix OS agents
│   └── commands/              # Phoenix commands
│
├── .phoenix-os/               # Phoenix OS framework
│   ├── core/                 # Core memory, templates, practices
│   └── project/              # Project-specific data
│       └── specs/            # Specification files
│
├── src/                       # Your source code
│
├── CLAUDE.md                  # AI copilot configuration (updated paths)
├── README.md                  # Project documentation
├── LICENSE                    # License file
└── .gitignore                 # Git ignore rules
```

**Key Components:**

- **`.claude/`**: Contains agents and commands for Claude Code integration
- **`.phoenix-os/core/`**: Framework files (memory, templates, best practices)
- **`.phoenix-os/project/specs/`**: Your project specifications
- **`CLAUDE.md`**: Configuration file with updated paths for your project
- **`src/`**: Your application source code

### Getting Started with Your Project

After initialization:

```bash
# Navigate to your project
cd my-awesome-app

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit with Phoenix OS"

# Start developing with your AI copilot
# Open in Claude Code, Cursor, or your preferred editor
```

### Updating an Existing Project

If you already have a project and want to add or update Phoenix OS files:

```bash
# Navigate to your project directory
cd my-existing-project

# Run init command without project name
phoenix init --ai claude
```

**What happens:**
1. Phoenix detects the directory exists and prompts: "Update Phoenix OS files in existing project? (y/n)"
2. If you choose 'y', it shows a diff of what will be updated
3. You confirm the update
4. Phoenix updates only `.claude/`, `.phoenix-os/`, and `CLAUDE.md`
5. Your existing code in `src/`, `README.md`, `package.json`, etc. is **preserved**

**Update Mode Behavior:**
- ✅ Updates: `.claude/`, `.phoenix-os/`, `CLAUDE.md`
- ❌ Preserves: `src/`, `README.md`, `LICENSE`, `.gitignore`, `package.json`, all other files

This allows you to:
- Upgrade Phoenix OS to the latest version
- Add Phoenix OS to an existing project
- Refresh Phoenix OS files without losing your code

### Verification

To verify Phoenix OS is installed correctly:

```bash
# Check if phoenix command is available
phoenix --version

# Or try the help command
phoenix --help
```

### Updating Phoenix OS

#### Update from GitHub Release (Recommended)

##### macOS / Linux

```bash
# Update to the latest version
gh release download v2.0.6 -R nagarro-digital/phoenix-os -p "*.tgz" --clobber && npm install -g phoenix-os-*.tgz

# Cleanup (optional)
rm phoenix-os-*.tgz

# Verify update
phoenix --version
```

##### Windows (Command Prompt)

```cmd
# Update to the latest version
gh release download v2.0.6 -R nagarro-digital/phoenix-os -p "*.tgz" --clobber && npm install -g phoenix-os-2.0.6.tgz

# Cleanup (optional)
del phoenix-os-2.0.6.tgz

# Verify update
phoenix --version
```

##### Windows (PowerShell)

```powershell
# Update to the latest version
gh release download v2.0.6 -R nagarro-digital/phoenix-os -p "*.tgz" --clobber; npm install -g (Get-Item phoenix-os-*.tgz).FullName

# Cleanup (optional)
Remove-Item phoenix-os-*.tgz

# Verify update
phoenix --version
```

#### Update from Source

```bash
# 1. Navigate to the cloned repository
cd phoenix-os
git pull origin main

# 2. Pack and reinstall
npm pack
npm uninstall -g phoenix-os
npm install -g phoenix-os-2.0.6.tgz

# 3. Verify update
phoenix --version
```

### Uninstall

To remove Phoenix OS:

```bash
npm uninstall -g phoenix-os
```

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

## Repository Structure

```
phoenix-os/
├── core/
│   ├── commands/           # Recipes (entry points)
│   │   └── phoenix/
│   │       ├── l1/         # L1 recipes (atomic activities)
│   │       ├── l2/         # L2 recipes (high-order workflows)
│   │       ├── meta/       # Meta-skills for Phoenix OS development
│   │       ├── impl/       # Implementation recipes (legacy)
│   │       ├── plan/       # Planning recipes (legacy)
│   │       └── bug/        # Bug analysis recipes (legacy)
│   ├── agents/             # Agent definitions (6 agents)
│   │   ├── code-builder.md
│   │   ├── quality-validator.md
│   │   ├── tech-designer.md
│   │   ├── project-orchestrator.md
│   │   ├── repo-orchestrator.md
│   │   └── workflow-guardian.md
│   ├── memory/             # Long-Term Memory (LTM)
│   │   ├── practices/      # Workflows, quality gates, standards
│   │   ├── templates/      # Output templates
│   │   └── tools/          # Tool-specific patterns
│   └── templates/          # Output templates (specs, designs, RCA)
├── docs/
│   ├── adr/                # Architecture Decision Records
│   ├── philosophy/         # Core architecture philosophy
│   └── components/         # Component-level documentation
├── CLAUDE.md               # Configuration
└── README.md               # This file
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

### Reference
- **GitHub Integration**: [`core/memory/tools/github/`](core/memory/tools/github/)

## 🤝 Contributing

We welcome contributions to Phoenix OS! Whether you're fixing bugs, improving documentation, or proposing new features, check out our [Contributing Guide](CONTRIBUTING.md) to get started.

### Quick Start for Contributors

1. Read our [Code of Conduct](CODE_OF_CONDUCT.md)
2. Check the [Contributing Guide](CONTRIBUTING.md) for development setup
3. Browse [good first issues](https://github.com/nagarro-digital/phoenix-os/labels/good-first-issue)
4. Submit your first pull request!

## 🔥 Contributors

Phoenix OS is built by a growing community of contributors. See our [Contributors](CONTRIBUTORS.md) page to learn about our Phoenix badge system and recognize those who help make this project better.

### Core Team

- **🔥 Phoenix Eternal** (Owners)
  - **[Kapil Viren Ahuja](https://github.com/kapilvirenahuja)** - Primary Maintainer
  - **[Nitesh Soni](https://github.com/niteshsoni11)** - Core Owner

- **🌟 Phoenix Rising** (Elite Contributors)
  - **[Karry Reddy](https://github.com/karri-reddy-nagarro)** - Elite Contributor
  - **[Madhur Madan](https://github.com/madhurmadan)** - Core Contributor

Your contributions help Phoenix OS rise stronger! Start your journey from Spark 🔥 to Phoenix today.

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
