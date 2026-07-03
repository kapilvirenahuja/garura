---
id: review/config-maps
title: "Reviewing config maps"
conditions:
  recognises: "the PR changes a file that wires the system together by path"
  signals: ["CLAUDE.md", "AGENTS.md", "COPILOT.md", ".garura/core/config.yaml", "files whose job is to point at other files/dirs by path"]
provenance: "seeded:#443"
---

# Reviewing config maps

## Topic
How to review the files that wire everything together by path — the config maps that tell a
host tool where the skills, agents, memory, and paths live.

## Recognise
The diff changes a file whose job is to *point* at other files or directories: the host config
map (`CLAUDE.md`, `AGENTS.md`), or `config.yaml` path keys (`ltm.source`, `stm.base-path`,
`standards_order`, evidence/target paths). The risk is a pointer that aims at something that
does not exist.

## Treatment
- **Reviewer:** human, by name. The human reads the named changes directly.
- **Layers:** Layer 1 (a narrow existence check) — the human owns the judgement.
- **Linter:** a path-existence check — every path the config map references resolves to a real
  file or directory; no key points at a moved or deleted target. **Gap:** no committed
  config-map linter in-repo yet; to be built (small). Until then the tool resolves each
  referenced path and reports any that miss.
- **Design-grounding:** no.

## Rationale
A config map that points at a non-existent directory is a blocker — the whole system loads the
wrong thing or nothing. The objective check is "do the pointers resolve"; the substance ("is
this the right wiring") is a human call, so the tool only surfaces the named changes and the
broken pointers.

## Provenance
seeded #443 — adapted from the PR Review Approach spec (category F).
