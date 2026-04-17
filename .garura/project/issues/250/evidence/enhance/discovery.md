# Discovery — Issue #250: Risk Classification in Enhance Play

## Issue Summary

The enhance play's approach design flags risks but treats them uniformly — passive documentation. Risks should be classified (technical/business/architectural) with action-driven handling (eval-driven, approval-required, monitor-only). LTM/KB should be consulted during classification.

## Q&A

### Q1: Edit strategy for compiled artifacts
**Answer:** Update intent.yaml only — do NOT directly edit SKILL.md. Recompilation via `/create-play --build enhance` happens later as a separate step. This enhance only updates the intent contract.

### Q2: Checkpoint scope for approval-required risks
**Answer:** Focused checkpoint — only show approval-required risks and their context, not the full approach review. The full approach review remains gated by --approve-plan. The risk-triggered checkpoint is a lighter, risk-focused gate.
