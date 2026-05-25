# Agent audit — enrich rebuild (#381)

The #381 intent delta (new archive-gate guarantee + sharpened failure wording)
changes the play's archival DECISION, which is orchestrator-owned. It does not
change any agent's domain, contract, or skill assignment. No new agents. The
three agents below are unchanged since the play's last successful compile (which
required P1-P11 pass), so this is a re-confirmation, not a fresh derivation.

## knowledge-extractor (ENRICH mode) — domain agent — PASS
- Exists (G5). Declares the three enrich skills it dispatches:
  normalize-proposals-for-enrichment, apply-ltm-enrichment, promote-adr-draft (G6 PASS).
- Domain (normalization, LTM writes, ADR promotion) untouched by #381.

## repo-orchestrator — utility agent — PASS with pre-existing observation
- Exists (G5). Owns archive moves + evidence self-commit in the play.
- G6 observation (PRE-EXISTING, not introduced by #381): the play's Step 5 names
  repo-orchestrator as invoking `archive-issue-stm`, but that skill is absent from
  repo-orchestrator's "Available Skills" table (which lists analyze-changes,
  create-commit, analyze-pr, submit-pr, setup-branch, merge-pr). The archival is a
  directory move + commit (a git/repo operation), so ownership is sensible; the gap
  is the missing inventory entry. Orthogonal to #381 — flagged for a separate fix,
  not addressed in this rebuild.

## project-orchestrator — utility agent — PASS
- Exists (G5). Sweep-mode enumeration only. Untouched by #381.

## Conclusion
No agent changes required for #381. One pre-existing G6 inventory gap on
repo-orchestrator surfaced for separate resolution.
