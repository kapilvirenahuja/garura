# Evidence Recording Rule

**Self-development reference only — not deployed via /install-garura.**

---

## Superseded — see the canonical standard

The canonical evidence-recording rule now lives at
`core/components/memory/standards/rules/evidence-recording.md` (the D1
auto-build rule, #434). That file is the single source of truth for **who**
records run evidence, **when**, and **how it is switched on or off**. Defer to
it; this grounding note only records what changed since the original prototype.

## What survives

- The **`evidence.record`** config key survives: a boolean under the
  `evidence:` section of `.garura/core/config.yaml`, default `true` when
  absent. Plays resolve it in pre-flight (e.g. `commit-change`'s pre-flight
  returns `evidence_record` among its facts) and gate the machine-readable
  evidence write (the `C1` slot of the Standard Play Close) on it.
- The user-facing delivery report (`C2` of the Standard Play Close) is a UX
  surface and is **never** gated by the flag — see
  `standards/rules/play-close.md`.

## What changed from the original prototype

This note originally documented the `commit-code` play as the prototype:
`create-commit` read the flag and returned `skip_commits_yaml`,
`repo-orchestrator` skipped the `commits.yaml` write, and the play skipped its
delivery record and status file in Step 8. That design is retired along with
the `commit-code` play (#434):

- **Evidence recording is play-only.** Only a play writes a run-evidence
  file, as the final step of its run via the Standard Play Close. Agents and
  skills never write evidence and never read the flag — a skill-level
  `skip_*` handshake like the old `create-commit` pattern no longer exists.
- The rule is compiled into **every** play by `/play-creator` (the D1
  auto-build rule), rather than being rolled out play by play from a
  prototype.
