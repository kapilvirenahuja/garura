# Workflow Selection — /arch rebuild (#403)

Mode: Rebake. Prior workflow: Structure A (Full checkpoint flow). Assessment: structure still fits.

The new /arch has six stage checkpoints (one per stage), where the prior version had five. Structure A maps cleanly — Pre-flight → Preparation (per-stage derive) → Checkpoint → Execution / next stage → Evidence. The 6-stage flow uses Structure A end-to-end with six checkpoint blocks (one per stage). Stages 1 and 2 may run in either order or in parallel (per C3) but each still produces its own checkpoint.

Decision: **Structure A**. No switch.

## Pre-flight character

The new intent's C1 is a **soft** pre-flight — missing or DRAFT /specify or /design artifacts do NOT hard-halt; the play asks the user the equivalent questions at the relevant stage and writes the answers to stand-in files. This is unusual for Structure A's prior pre-flight pattern (which was hard-halt). The compiled pre-flight section will document the probe + question-fallback flow rather than a list of hard-halt checks.
