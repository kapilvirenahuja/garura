# Formats

Templates and output shapes for artifacts produced by the system.

Agents and skills query this category when they need to know: **"What does the output look like?"**

## Contents

| Path | Description | Consumers |
|------|-------------|-----------|
| `github-issue.md` | GitHub issue body template and field derivation rules | manage-issue |

## When to Add Here

A file belongs in `formats/` if:
- It defines the shape/structure of an output artifact
- It would be customized by an adopter to match their tooling preferences
- It answers "what should this look like?" or "what fields go where?"
