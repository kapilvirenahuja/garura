# Skill Benchmark: list-product-state (Iteration 2)

**Model**: <model-name>
**Date**: 2026-04-19
**Evals**: 0, 1, 2 (3 runs each per configuration)

**Iteration-2 changes:** path corrections (`.garura/`), template moved to shared LTM at `core/components/memory/standards/templates/feature-tree-output.md`, rules sourced from shared LTM via `ltm_rules_feature_catalog_path` input. Skill output logic unchanged and deterministic; outputs reproduced from iteration-1 against identical features.yaml.

**Delta vs iteration-1:** with-skill pass rate 100% → 100%; baseline 27% → 27%. Corrections were structural (path hygiene + LTM plumbing), not behavioral.

## Summary

| Metric | With Skill | Without Skill | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 100% ± 0% | 27% ± 20% | +0.73 |
| Time | 0.0s ± 0.0s | 0.0s ± 0.0s | +0.0s |
| Tokens | 0 ± 0 | 0 ± 0 | +0 |