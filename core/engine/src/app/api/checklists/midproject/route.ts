/**
 * API Route: /api/checklists/midproject
 *
 * Returns checklists selected and ordered for the mid-project state (readiness > 0).
 * Active checklists are ordered by their impact on readiness score (highest first).
 * Completed checklists are separated for display at the bottom.
 * Includes a selection rationale for the generative region.
 *
 * Fulfills: VAL-CHECK-012 (multiple checklists),
 *           VAL-CHECK-015 (completed at bottom),
 *           VAL-CHECK-016 (ordered by impact),
 *           VAL-CHECK-017 (selection rationale)
 */

import { NextResponse } from 'next/server';
import path from 'node:path';
import { getConfig, resolveRepoRoot } from '@/lib/config';
import { getBuiltInChecklists } from '@/lib/checklist-loader';
import { computeReadinessFromPath } from '@/lib/readiness';
import { selectChecklists } from '@/lib/checklist-engine';
import { createGitIntegration } from '@/lib/git-integration';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = getConfig();
    const repoRoot = resolveRepoRoot();
    const productBasePath = path.resolve(repoRoot, config.product.basePath);

    // Get current git hash for readiness computation
    const git = createGitIntegration(repoRoot);
    const changeResult = await git.detectChanges();
    const gitHash = 'changed' in changeResult ? changeResult.currentHash : null;

    // Compute readiness to determine project state and ordering
    const readinessResult = computeReadinessFromPath(productBasePath, gitHash);

    // Load all built-in checklists
    const { checklists: allChecklists } = getBuiltInChecklists();

    // Select, order, and categorize checklists for mid-project view
    // TODO: Wire step completion state from a persistence layer (e.g., local JSON file
    // or SQLite). Currently passing an empty map as placeholder — all checklists will
    // appear as not-started until persistence is implemented.
    const stepCompletions = new Map<
      string,
      ReadonlyArray<{ readonly stepId: string; readonly completed: boolean }>
    >();
    const selection = selectChecklists(allChecklists, readinessResult, stepCompletions);

    return NextResponse.json({
      active: selection.active,
      completed: selection.completed,
      selectionRationale: selection.selectionRationale,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[api/checklists/midproject] Error:', message);

    return NextResponse.json(
      {
        active: [],
        completed: [],
        selectionRationale: 'Unable to determine checklist selection.',
        error: message,
      },
      { status: 500 },
    );
  }
}
