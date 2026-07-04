## Harness verdict (gate off per gates.plays.review-change): APPROVE

Reviewed against committed sources (ADR 025 determinism, the tool-first rule, #484's acceptance) — not the branch's own content.

**Categories:** harness plays (4 ICE recompiles + 1 audit), harness scripts (adapter + 6 operation scripts), harness compiler (play-creator), tests.

**Objective layer:** all 5 chain plays lint clean with valid fingerprints; 62 tests pass; `platform_adapter.py`, `fetch_pr_context.py`, `read_merge_state.py`, `submit_pr.py` live-verified against real PRs (this PR was opened by `submit_pr.py`).

**Design-grounding:**
- **Tool-first + ADR 025 — holds.** Every converted operation is a fixed command sequence with zero judgment, now in a bundled script; agent dispatch remains only for genuine judgment (grouping, self-review, category assessment, design-grounding). The judgment-vs-mechanical split is now the compiler's rule, so it is durable.
- **Guarantees preserved — holds.** Each recompile changed only the executor; no approval/mergeable/branch/verdict/coverage guarantee moved. Fingerprints recomputed over the edited ICE; lint confirms coverage.
- **Injection safety — improved.** The adapter builds argv lists, not shell strings — stricter than the prose it replaces.

**Findings:**
- P4 / informational — GitLab verb paths are encoded from the reference but untested here (GitHub repo); flagged in the adapter docstring, config-switchable. No action.
- P4 / informational — the `quality-check-scoped` grep partial from #484 is deferred as its own judgment-bearing chunk; noted, not in scope.

**Blocking findings:** none. The land to main stays a pinned human gate.
