# Rebake Summary — briefs recipe

**Date:** 2026-03-26
**Issue:** #171
**Intent hash:** sha256:46f527205df169967fdb9c78d96cb424b09d89d70b4421bb9de44bec3d81b122

## What Changed

### intent.yaml
- **C8 updated:** "inlined into static HTML templates from brief-common.css during template assembly" changed to "delivered via external brief-common.css referenced by each HTML template through a <link> tag". Added "Space Grotesk typography" replacing "rounded fonts".
- **C12 added:** SPA chapter navigation — chapters hidden by default, only active chapter visible via sidebar click, no scroll-spy.
- **C13 added:** Tab sub-navigation — chapters with multiple sub-items render horizontal tab bars via renderTabBar()/renderStaticTabs().
- **C14 added:** Shared asset co-location — every briefs directory with HTML must also contain brief-common.css and brief-render.js.
- **F10 added:** Briefs directory contains HTML but is missing brief-common.css or brief-render.js.
- **F11 added:** Brief HTML references external CSS/JS via relative paths but files don't exist.
- **S1 updated:** Added SPA navigation, tab bars, and shared asset verification.
- **S2 updated:** Added shared asset verification across all briefs directories.
- **S5 added:** Shared asset integrity verification scenario.

### SKILL.md
- Compiled From section updated: C1-C14, F1-F11, S1-S5
- Step 3.4 description expanded with constraint references (C8, C12, C13, C14) and failure condition references (F10, F11)
- Step 3.4 now includes descriptive paragraph about what brief-common.css and brief-render.js deliver
- Step 3.5 updated with C8 reference and dependency note on 3.4
- SE-8 updated to reference external CSS delivery instead of inlined
- SE-15 through SE-19 added (5 new step evals)
- SCE-1 and SCE-2 updated with SPA navigation and shared asset verification
- SCE-5 added for shared asset integrity
- Compilation metadata updated: new intent hash, rebaked_at date, 19 step evals, 5 scenario evals

## Files Modified
- `core/components/recipes/briefs/reference/intent.yaml`
- `core/components/recipes/briefs/SKILL.md`

## Evidence Written
- `.meridian/project/issues/171/evidence/create-recipe/briefs/intent-updated.yaml`
- `.meridian/project/issues/171/evidence/create-recipe/briefs/coverage-matrix.md`
- `.meridian/project/issues/171/evidence/create-recipe/briefs/rebake-summary.md`
