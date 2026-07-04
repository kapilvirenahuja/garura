---
name: run-quality-gates
description: Execute a quality lens's binding cards — the machine sibling quality-gates.yaml — against a project and emit one verdict per gate. Runs every machine-owned card's command through the project's own tools (linters, tests, type checks, coverage, custom check scripts), reads declared measures against thresholds, and normalizes outcomes to pass | fail | error | missing-tool | human. A card whose demanded tooling is absent is a missing-tool FINDING the build loop consumes as provisioning work — never a silent pass. Human-owned cards are visibly skipped, never judged. Verdicts feed the run's evidence file (Gate Outcomes) and, downstream, the loop's stop condition. Use whenever a play or loop needs the quality gates actually executed — "run the gates", "check the quality gates", "execute the lens". Purely mechanical: the script does the work; no inference.
version: 0.1.0
user-invocable: false
model: haiku
allowed-tools: Read, Bash, Glob
---

# run-quality-gates

Executes the quality lens's binding cards (#462). The lens says what "good" means
(`quality.md`) and how a machine checks it (`quality-gates.yaml`, one card per gate —
schema: `standards/schemas/product-os/lens/quality-gates.yaml`). This skill is the
executor: the whole run is one script call; the skill adds no judgment.

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `gates_file` | yes | Path to the lens's `quality-gates.yaml`. |
| `project_root` | yes | The project the commands run against. |
| `out` | yes | Path for the outcomes JSON (typically under the run's STM). |
| `provision` | no | Attempt each missing card's `requires.install` once before declaring missing-tool. Default off — reporting demands is the runner's job; provisioning is the build loop's decision. |

## Process

Run the bundled script — it is the entire skill:

```
python3 scripts/run_quality_gates.py \
    --gates {gates_file} --project-root {project_root} --out {out} [--provision]
```

Per card it emits exactly one outcome:

| Status | Meaning |
|--------|---------|
| `pass` | Command ran, exit 0, threshold (when declared) met |
| `fail` | Command ran; non-zero exit or threshold unmet |
| `error` | Card invalid, command timed out, or measure unreadable — tooling present but no verdict |
| `missing-tool` | The card's demanded tooling is absent. A finding for the build loop, never a silent pass — "a check that didn't run is not a check that passed" (the validate-runner rule, reused) |
| `human` | `owner: human` — visibly skipped; the card's `review` line names the edge that judges it |

Exit code: 0 when every machine card passes (human skips do not fail a run), 1 on any
fail or missing-tool, 2 on any error.

## Output

`{out}` — one JSON document: per-card outcomes (id, status, summary, command, exit,
measure/value/threshold, demanded tool, log tail), a status count map, and an overall
`ok`. Callers map outcomes into the evidence file's **Gate Outcomes** table
(`standards/templates/evidence-file.md`) — one row per card, nothing dropped: a skipped
or unmeasured gate is a visible row, not an omission.

## Consumers

- **Build loop** (implement, #465+): the pass set is the checker wall; `missing-tool`
  findings are provisioning work; the full set feeds the stop condition (#464).
- **validate / review plays**: independent re-execution of the same cards — same script,
  same contract, no re-inference.

## Constraints

- Local build/test/scan tools only — never git/gh, never remote systems.
- The script decides every verdict mechanically; no outcome is authored by inference.
- Never edit the gates file — cards are authored by the lens (author-quality-lens), fixed
  at design time.
- A card that cannot produce a verdict is `error`/`missing-tool` — never `pass`.

## Version

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Category | operations |
