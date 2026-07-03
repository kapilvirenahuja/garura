---
name: plan-validation-checks
description: Author /validate's check manifest for one EPIC — the toolchain plan the run_checks orchestrator executes. Detects the product's stack(s) from the slice's architecture lens tech picks plus the repository's own manifests (package.json, pom.xml, *.csproj, migrations), then resolves each stack to its tooling — build, test runner, linter, scanner, dependency audit — as KB-GROUNDED choices via kb-search; anything the KB does not cover becomes a recorded KB-learning-gap proposal, never a silent pick. Scopes the regression checks to the resolved blast radius (recorded change claims, narrowing per fix round) and maps the slice's quality-lens gates and the profile's benchmarks to concrete checks. Emits checks.yaml (one entry per check: runner class, tool, command, install hint, class) + a choices manifest for the grounding gate. Plans only — runs nothing, writes no model file. The planning work for the /validate play.
version: 0.1.0
user-invocable: false
model: best
allowed-tools: Read, Write, Bash, Glob, Grep
---

# plan-validation-checks

Turns one built epic into the **check manifest** /validate executes: which checks run,
with which tools, against which scope. The plan is the seam between judgment and
mechanics — everything downstream (run_checks.py, the runners, the gates, the verdict)
is deterministic, so every judgment call lands HERE, grounded.

Three sources decide the plan:

- **The stack(s).** The slice's architecture lens names the tech picks; the repository
  confirms them (a `package.json`, a `pom.xml`, a `*.csproj`, a migrations folder). One
  product can carry several stacks — each gets its checks. A stack the arch lens names
  but the repo doesn't show (or vice versa) is flagged in the plan's notes, not silently
  resolved.
- **The bars.** The slice's quality-lens gates each map to a concrete check (the gate's
  id becomes the check_id, or the gate names its check). The profile's benchmarks tell
  the plan which measures must come back (coverage, vulnerabilities, scores) so the
  right tools run with the right flags — green is the entry, the profile floor is the
  bar (`technology/validation-floor-profile-benchmarks`).
- **The scope.** The blast-radius file (from resolve_blast_scope.py) bounds the
  regression checks — scoped, never full-suite by default, narrowing per fix round
  (`architecture/regression-by-blast-radius`).

**Every tool choice grounds in the KB, never in taste.** Search the shelves via
kb-search (the one-shot-cleanliness learning names the standing scanners: SonarQube,
Snyk-class dependency audit, PageSpeed, a11y). An uncovered choice — a stack with no
recorded tooling stance — becomes a KB-learning-gap proposal the play surfaces; the
plan still names the tool it proposes, marked `grounds: proposal`.

Security checks are CODE-LEVEL only: static analysis, lint, dependency scanning —
never penetration-style probing of running systems.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `epic_file` | yes | The epic record (read-only) — context.systems, acceptance. |
| `quality_lens` | yes | The slice's quality lens (read-only) — the gates to map. |
| `profile_path` | yes | The product profile (read-only) — the benchmarks/floors. |
| `arch_lens` | yes | The slice's architecture lens (read-only) — the tech picks. |
| `scope_file` | yes | The resolved blast-radius scope (scope.json). |
| `repo_root` | yes | The product repository root — stack detection, read-only. |
| `round` | yes | Which validate round this is (scoped re-run planning). |
| `kb_search` | yes | Path to kb-search's `scripts/kb_search.py`. |
| `kb_root` | yes | The `knowledge/` dir for resolvable learning ids. |
| `out_dir` | yes | Output folder under STM for the manifest + choices + proposals. |

## Procedure

1. **Detect the stacks.** Read the arch lens's tech picks; confirm against the repo
   (Glob for `package.json`, `pom.xml`, `build.gradle`, `*.csproj`, `*.sln`,
   migration/SQL dirs, lockfiles). Record each detected stack and any
   lens-vs-repo mismatch in `notes`.

2. **Search the KB.** `python3 {kb_search} index`, then `get` the verification
   learnings (`technology/validation-floor-profile-benchmarks`,
   `architecture/regression-by-blast-radius`,
   `technology/delivery-one-shot-cleanliness`) plus any stack-tooling learnings whose
   conditions match. Ground every tool pick; write a gap proposal under
   `{out_dir}/proposals/` for any stack the shelves don't cover.

3. **Plan the checks.** One entry per check into `checks.yaml`:

   ```yaml
   checks:
     - check_id: tests-node          # quality-gate ids keep the gate's id
       runner: node                  # node|java|dotnet|frontend|sql|lint|sonar
       tool: npm
       tool_bins: [npm]
       command: "npm test -- --coverage"
       class: tests                  # tests|coverage|lint|scan|build|audit|gate
       install: ""                   # how to ensure the tool, when known
       timeout: 1800
   notes: []
   ```

   Cover, per stack: build/compile, the epic's tests, the scoped regression set (use
   the scope file — name the scoped test paths/filters in the command), lint/static
   analysis, dependency audit, and the scanners the bars demand (a coverage benchmark
   forces a coverage-reporting test command; a sonar gate forces the sonar runner).
   Every quality-lens gate maps to exactly one check_id. On round > 1, plan only
   what the prior report's findings and the narrowed scope require (`--only` set).

4. **Write the choices manifest** (`{out_dir}/check-choices.yaml`) — one entry per tool
   pick and per scoping decision, each grounded in a KB learning id or a proposal path,
   so the play's grounding gate is mechanical:

   ```yaml
   validate:
     choices:
       - aspect: "tooling:node-tests"
         value: "npm test with coverage"
         grounds: [{source_type: kb, source: "technology/delivery-one-shot-cleanliness"}]
       - aspect: "scope:regression"
         value: "scoped to scope.json round 2"
         grounds: [{source_type: kb, source: "architecture/regression-by-blast-radius"}]
   ```

## Output

```
{out_dir}/
  checks.yaml            # the toolchain manifest run_checks.py executes
  check-choices.yaml     # every judgment grounded — the grounding gate's input
  proposals/<gap>.yaml   # any KB-learning-gap proposal
```

## Boundaries

### NEVER
- Run a check, install a tool, or touch the repository — plan only; run_checks.py
  and the runners execute.
- Pick a tool on taste — every pick grounds in a KB learning or a recorded proposal.
- Plan a penetration-style or remote-probing check — code-level only.
- Plan full-suite regression when a scope file bounds it — scoped, narrowing per round.
- Leave a quality-lens gate or a profile benchmark unmapped — every bar gets its check,
  or the gap is named in `notes` (an unmeasured bar will fail the gates check, honestly).
- Write the product model, the epic, or anything outside `out_dir`.

### ALWAYS
- One check_id per quality-lens gate, keeping the gate's id.
- Make benchmark-carrying checks emit their measures (coverage flags, audit JSON).
- Record lens-vs-repo stack mismatches in `notes`.
- Return paths, not contents.
