---
name: judge-validation-results
description: Compose /validate's findings from CAPTURED results only — the judgment half of the finder's job. Reads the normalized check results (results/*.json + summary.json from run_checks) and the gates/benchmark map (gates-map.json from check_gates), and writes findings.yaml — one entry per real problem, each carrying its mechanical citation (the failing check id, the rule that fired, the gate or benchmark) and its location (file:line where the tool named one, else the raw log path). Adds judgment the scripts cannot: deduplicating one root cause reported by several tools, reading the raw logs to extract the exact failing assertion/rule/file, and flagging a result pattern that LOOKS gamed (a suspiciously emptied test set, a suppressed rule) as a finding. Runs NOTHING, fixes NOTHING, invents NOTHING — a finding it cannot cite from captured output does not exist. The judging work for the /validate play; agents fix, this names what is broken with total clarity.
version: 0.1.0
user-invocable: false
model: best
allowed-tools: Read, Write, Glob, Grep
---

# judge-validation-results

The judge half of /validate's finder/fixer split: scripts ran the mechanics and captured
everything; this skill reads ONLY those captured files and writes the findings —
super-clear, mechanically cited, directly actionable. The fix report built from these
findings is implement's exact work list, so vagueness here costs a whole loop round.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `results_dir` | yes | run_checks.py output: `results/*.json` + `summary.json` + raw `.log`s. |
| `gates_map` | yes | check_gates.py output: gate + benchmark findings already mechanical. |
| `scope_file` | yes | The blast-radius scope (context for locating regression breaks). |
| `out_findings` | yes | Where to write `findings.yaml`. |

## Procedure

1. **Read the captured set.** summary.json for the shape; every failing/errored
   result record; the gates map's findings (already cited — do not re-derive them,
   do not duplicate them).

2. **Extract the precise failure from the raw logs.** For each failed/errored check,
   open its `raw_log_path` and pull the exact failing assertion, rule id, or error —
   and the file:line the tool printed when it printed one. The citation is the tool's
   own output, quoted; the location is `file:line` when available, else the raw log
   path.

3. **Judge — the part scripts can't.**
   - **Deduplicate root causes:** one broken module failing a unit test, a lint rule,
     and the build is ONE finding citing all three check ids — implement fixes once.
   - **Spot gaming patterns:** a test count that collapsed against the plan, a newly
     suppressed rule, an emptied coverage scope — each is a finding citing the records
     that show it (the summary counts, the log lines).
   - **Stay inside the captured evidence:** no speculation about causes the logs don't
     show; a hunch without a citation is not a finding.

4. **Write `findings.yaml`:**

   ```yaml
   findings:
     - kind: check-failed            # check-failed|check-errored|regression-broken|suspect-pattern
       id: tests-node
       citation: "AssertionError: expected 402 to equal 200 (jest: api/limits.test.ts)"
       location: "src/api/limits.ts:88"
       raw_log_path: "<results>/tests-node.log"
       related_checks: [lint-node]   # when deduped
   ```

   Zero failures and zero suspect patterns → an empty findings list, honestly.

## Boundaries

### NEVER
- Run a tool, a test, a scan, or any command — the mechanics already ran; judge the
  captured output only (allowed-tools carries no Bash for a reason).
- Edit product code or any file beyond `out_findings` — agents fix in /implement,
  never here.
- Write a finding without a citation from captured output AND a location — uncited
  findings are refused downstream (compute_verdict) and waste the run.
- Duplicate the gates map's findings — they join at the verdict; this skill adds only
  what judgment sees beyond the mechanical map.
- Soften, average, or re-litigate a mechanical result — a failed check is a finding
  even when it "looks minor".

### ALWAYS
- Quote the tool's own output in the citation.
- Prefer `file:line` locations; fall back to the raw log path, never to nothing.
- Deduplicate to root causes with `related_checks`.
- Return the findings path, not the contents.
