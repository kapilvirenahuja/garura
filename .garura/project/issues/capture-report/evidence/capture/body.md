| Field | Value |
|-------|-------|
| **Type** | enhancement |
| **Reported From** | human (via /capture) |
| **Date** | 2026-05-28 |

### Problem

The arch play currently uses the doc-builder agent to produce HTML artifacts. This capability is not needed. The HTML build step adds work and surface area without serving a real consumer of the arch output. Remove the doc-builder invocation from the arch play and drop any arch-specific scaffolding that exists only to feed it.
