# /validate (E10) — design locked pre-build (#434)

**STATUS: BUILT (2026-06-12).** Play compiled (lint PASS, smoke green both verdict
paths + 10 guards), epic schema v2 + statuses live, KB seeded (2), implement fix-round
ripple applied (lint PASS, smoke green), old garura:validate retired. Record of the
build in phase-d-progress.md.

Locked in conversation with Kapil, 2026-06-12. Source inputs: `realignment-plan.md`
(decisions 18, 20, 24; lines 219–231), `slice-trinity-model.md` (execute group),
`implement-design.md`, old play `garura:validate` (deprecated, Phase E reference),
`implement` play seams (check_done.py, update_epic_status.py, check_box.py,
SKILL.md:396-402), `lens/quality.yaml:6`, repo-wide reference sweep (2026-06-12).

## The operating principle (Kapil, 2026-06-12)

Agents are good at FIXING things. /validate's job is to find what is NOT working
with total clarity — mechanical signals (Sonar-class scans, clear failing test
cases), never vague judgment. implement ↔ validate is EXPECTED to run a few loops;
the loop is cheap only if validate's report is super clear and directly actionable.
Finder/fixer split: validate finds, implement fixes.

## Pipeline position — MIDDLE of execute (none + exception)

- execute group: implement (start) → validate (middle) → launch (end). Decision 20/24.
- validate inherits the epic branch implement left (work intentionally uncommitted),
  does its work, stops, leaves the branch. The close chain belongs to /launch after
  evidenced human sign-off.
- validate is the deep AGENT-SIDE gate: absorbs the audit concerns — code-level
  security, the non-runnable quality-lens bars exercised in anger, cross-epic blast
  radius. The standalone audit play stays retired.

## Decisions taken (Kapil, 2026-06-12)

1. **Deploy/run allowed.** validate may compile, run, and deploy the product if its
   checks need a running system (unit-test compile, runtime probes). Deploying for
   HUMAN acceptance stays /launch's job; validate runs things only to test.
2. **New epic status is sanctioned.** The chain grows beyond
   ready → in_delivery → delivered.
3. **The status is the gate.** On failure, validate stamps the epic so /launch
   CANNOT run and implement knows it must fix. The re-entry into implement is
   LIGHTWEIGHT: no full STM rebuild, no fresh context creation — implement fixes
   exactly what validate's report names. (Ripple: implement's check_ready_epic
   eligibility and its plan flow need a fix-mode entry that accepts the validate
   report as the work list.)
4. **Skills via play-creator; judge over scripts.** New skills the play needs are
   play-creator's to identify and build. The judging itself must be deterministic
   scripts capturing results to files, with the agent only inferring over captured
   results — the run_gates.py pattern from implement, never an agent running
   mechanics.
5. **Security = code-level only; KB to seed.** Linter/Sonar-class static checks,
   dependency/code scanning. NO penetration-testing style probing. The KB has no
   learnings for this yet — seed at build (content growth on existing shelves,
   standing rule).
6. **Blast radius comes from implement's STM.** The scope of blast should already
   exist from implement's run (piece reports / changed-file claims — check_box.py
   territory). validate picks up older test cases (prior delivered epics' checks)
   against that scope. OPEN/SEPARATE: epic-level e2e test authoring is likely a
   WHOLE DIFFERENT PIPE — not folded into this play; do not design validate around
   building an e2e suite.

## Multi-stack tooling (Kapil, 2026-06-12, at the piece-map checkpoint)

The harness runs across techs — java, .net, node, frontend, sql, more. The checks
need different tooling per stack, and the play must know WHICH tools, ensure they
are INSTALLED, RUN them, and get the output back to the agent. Design response:

- **The check plan is a toolchain manifest.** plan-validation-checks detects the
  stack(s) (arch lens tech picks + repo manifests like package.json/pom.xml/
  *.csproj) and resolves stack → tooling (build, test runner, linter, scanner) as
  KB-grounded choices — tool picks go through the choices manifest + grounding
  gate like every other lens choice.
- **run_checks.py is an ORCHESTRATOR over per-tool runner scripts (Kapil's
  refinement).** The play bundles a runner family — `scripts/runners/` — one small
  adapter script per tool class (junit/maven, dotnet, node test runners, linters,
  sonar, sql, frontend audits, …), each with the SAME interface: take a target +
  config in, ensure the tool is present (install if the runner knows how), run it,
  and emit a NORMALIZED result record ({check_id, tool, command, exit, summary,
  raw_log_path}). run_checks.py reads the manifest and dispatches each check to
  its runner — it knows WHICH runners to call, never HOW any tool works. Precedent
  in-repo: platform-adapter (stable verbs, per-platform dispatch underneath).
  Growing the harness to a new stack = adding one runner script; the orchestrator
  and the play never change. The judge infers over normalized records, never raw
  tool-specific noise.
- **Missing tool ≠ silent skip.** A tool that can't be ensured is a recorded
  finding/gap, never a silently absent check.
- KB grows per-stack tooling learnings over time (content growth, existing
  shelves).

## The floor — benchmarks over green (Kapil, 2026-06-12, KB interview)

Everything green does NOT mean it passes. Tools going green is the entry condition;
the BENCHMARKS are the bar — and the benchmarks SIT IN THE PRODUCT PROFILE
(product-profile.yaml). Canonical example: all unit tests pass but coverage is 40%
— below the profile's benchmark → REJECT. So:

- validate compares normalized check results against the profile's declared
  benchmarks (coverage floor, quality bars, NFR-derived thresholds), not just
  tool exit codes. check_gates/compute_verdict take the profile's floor as input.
- A result with no applicable benchmark falls back to green/red; a benchmark with
  no captured result is a finding (the bar wasn't measured ≠ the bar passed).
- KB seed: the principle as Kapil's POV — "green is the entry, the profile floor
  is the bar"; per-product numbers stay in the profile, never the KB.

## Regression scope — blast radius, narrowing per round (Kapil, 2026-06-12)

Regression runs the checks IMPACTED BY THE BLAST RADIUS — never the full suite by
default. The scope source shifts per round:

- Round 1: blast radius of the epic's build (implement's recorded change claims).
- Round N+1: blast radius of what the agent had to FIX, based on the report the
  validator generated in the LAST run — each fix round re-verifies only what the
  fix could have touched, so the loop gets cheaper as it converges.

resolve_blast_scope.py therefore takes either implement's change claims (round 1)
or the prior validate report + the fix's change claims (later rounds) as its
scope source; F8's "invented scope" covers both.

## Derived shape (to confirm at the play-creator interview)

- Status proposal: pass → `validated` (launch's precondition); fail → a
  fix-required status (name at interview) that blocks launch and re-admits
  implement. `delivered` stays /merge's, stamped at launch's close chain.
- Verdict must be mechanical-first: every finding cites the failing check
  (test id, scan rule, gate) and where it fired — the #436 no-forged-evidence
  discipline applies to the verdict record.
- Loop cap: old validate used 3 iterations before human escalation — confirm at
  interview.
- Quality lens seam is pre-wired: `lens/quality.yaml` already declares its gates
  are checked independently by /validate.

## What carries over from old garura:validate

- KEEP (as principles): independent verification ≠ builder self-check;
  compartmentalization between eval authorship and judging; remediation routes to
  implement, never direct code edits by validate; capped fix loop; ACCEPT/REJECT
  verdict where a verdict contradicting evidence is a named failure; baseline
  regression (prior delivered work still passes) as the blast-radius ancestor.
- DROP: milestone grain, plan.yaml/scenarios.yaml inputs (prepare is retired),
  eval encryption at rest (sub-agent isolation replaced it at implement).
- MOVED to /launch: UAT/preview deploy for acceptance, manual test list from
  user_check + acceptance.

## Agents

- Old judge + feature-steward are DEPRECATED (#434 flags in their files) — the
  sweep's "shared, safe" claim was wrong. Whether to un-deprecate judge or run
  verdict-inference under an existing live agent (e.g. quality-auditor mode) is
  play-creator interview material; domain-agent budget ≤5 stands. Kapil's
  direction caps the judge's role either way: deterministic scripts do the work,
  the agent infers over results.
- evals-engineer + test-engineer are live (un-deprecated at the implement build).

## Retirements when this lands

- `garura:validate` — direct successor; delete the play folder (nothing exclusive
  to it survives: no exclusive skills, no exclusive agents).
- Doc sweep at retirement: glossary Trinity entry, playbook-catalog sequences,
  docs/components/plays.md matrix.
- `reap`'s dependency on milestone-verdict.yaml is NOT preserved — reap is on the
  retire-or-fold-into-/learn list; its seam dies with the old model.

## Ripples

- epic.yaml schema: new status value(s) + fill rules (validate writes the stamp;
  launch requires `validated`).
- implement: fix-mode re-entry (eligibility gate + lightweight plan path driven by
  the validate report).
- launch (E10b, unbuilt): its precondition is validate's pass stamp — record in its
  design when built.
- KB: seed code-level security/scan learnings (no shelves added).
