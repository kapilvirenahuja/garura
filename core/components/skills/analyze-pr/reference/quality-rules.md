# PR Quality Rules

Quality rules for PR analysis in **agentic/prompting projects**.

This ruleset is designed for projects where the primary artifacts are:
- Agent definitions (`.md`)
- Skill/Play definitions (`.md`)
- Documentation and ADRs (`.md`)
- Configuration (`.yaml`)

---

## Always Apply (Universal)

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `no-conflicts` | must-have | No merge conflicts | Automated: `git merge-tree` |
| `no-secrets` | must-have | No secrets committed | Automated: pattern scan |

---

## Conditional Rules

### When: Agent Definitions Changed

**Triggers:** `**/agents/**/*.md`, `.claude/agents/*.md`

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `agent-frontmatter` | must-have | Agent has valid frontmatter | Check: name, domain, role, tools |
| `agent-boundaries` | must-have | Agent has NEVER/ALWAYS boundaries | Check for ## Boundaries section |
| `agent-naming` | nice-to-have | Agent follows `{domain}-{role}` naming | Pattern check |

### When: Skill Definitions Changed

**Triggers:** `**/skills/**/*.md`, `.claude/skills/**/SKILL.md`

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `skill-frontmatter` | must-have | Skill has valid frontmatter | Check: name, description, user-invocable, allowed-tools |
| `skill-io` | must-have | Skill defines Input and Output | Check for ## Input and ## Output sections |
| `skill-constraints` | nice-to-have | Skill has constraints | Check for ## Constraints section |

### When: Play Definitions Changed

**Triggers:** `**/plays/**/*.md`, `**/plays/**/SKILL.md`

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `play-frontmatter` | must-have | Play has valid frontmatter | Check: name, description, user-invocable, allowed-tools. Note: `level` is in `## Version` metadata, not frontmatter |
| `play-workflow` | must-have | Play defines workflow | Check for ## Workflow section |
| `play-checkpoint` | must-have | Play defines checkpoint behavior | Check for checkpoint in workflow |
| `play-agent-limit` | nice-to-have | Play respects agent call limits | L1 ≤2, L2 ≤5 |

### When: ADRs Changed

**Triggers:** `docs/adr/*.md`, `**/adr/**/*.md`

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `adr-structure` | must-have | ADR has required sections | Check: Status, Context, Decision, Consequences |
| `adr-status` | must-have | ADR has valid status | Check: Proposed, Accepted, Deprecated, Superseded |
| `adr-numbered` | nice-to-have | ADR follows numbering convention | Pattern: `NNN-*.md` |

### When: Architecture Docs Changed

**Triggers:** `docs/philosophy/*.md`, `docs/components/*.md`, `README.md`, `CLAUDE.md`

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `docs-consistent` | must-have | Documentation consistent with implementation | Manual review |
| `docs-examples` | nice-to-have | Documentation includes examples | Check for code blocks |

### When: Configuration Changed

**Triggers:** `*.yaml`, `*.yml`, `.meridian/core/config.yaml`

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `config-valid` | must-have | Configuration syntax valid | Automated: YAML lint |
| `config-documented` | nice-to-have | Configuration changes documented | Check for related docs update |

### When: Sync Required

**Triggers:** `core/components/**` changed

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `sync-claude` | must-have | Components synced with `core/components/` | Run `/sync-claude` (global) or `/sync-claude --project` |

---

## Branch Context Rules

### Hotfix Branch (`hotfix/*`, `emergency/*`)

| Rule ID | Change |
|---------|--------|
| `docs-examples` | priority: nice-to-have |
| `adr-numbered` | priority: nice-to-have |
| `skill-constraints` | priority: nice-to-have |

### Release Branch (`release/*`)

| Rule ID | Change |
|---------|--------|
| `docs-consistent` | priority: must-have |
| `adr-structure` | priority: must-have |
| ALL `nice-to-have` | priority: must-have |

---

## Commit Type Rules

### Documentation (`docs:`)

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `docs-only` | nice-to-have | No functional changes | Check only `.md` files changed |

### Refactoring (`refactor:`)

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `refactor-no-break` | must-have | No breaking changes to contracts | Check Output sections unchanged |

### New Feature (`feat:`)

| ID | Priority | Item | Verification |
|----|----------|------|--------------|
| `feat-documented` | must-have | Feature documented in README or docs | Check for docs changes |
| `feat-adr` | nice-to-have | Significant features have ADR | Check for new ADR if large change |

---

## Disabled Rules

| Rule ID | Reason |
|---------|--------|
| `tests-pass` | No automated tests in prompting projects |
| `build-succeeds` | No build step |
| `api-docs` | No API endpoints |
| `migration-tested` | No database |
| `deps-reviewed` | Minimal dependencies |
