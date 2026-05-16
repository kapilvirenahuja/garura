# distill — status

- **Issue:** 370
- **Branch:** fix/370-define-surfaced-for-review-hitl-break
- **Commits in scope:** 3e51291 (fix), 1635132 (evidence)
- **Outcome:** skipped (graceful)
- **Reason:** `evidence.record=false` in `.garura/core/config.yaml`

Per the distill play contract pre-flight gate: when `evidence.record` is
`false`, distill returns immediately without invoking knowledge-extractor
and without writing `proposals.yaml`. This is a configured, intentional
skip — not an error. No learning proposals were generated.

Return struct:
```json
{ "status": "skipped", "reason": "evidence.record=false", "proposals_path": null }
```
