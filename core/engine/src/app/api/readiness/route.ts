/**
 * API Route: /api/readiness
 *
 * Returns the current readiness score, breakdown, and git hash.
 * Used by the client-side ReadinessMiniGauge and Checklists page to display
 * consistent readiness data across all views.
 */

import { NextResponse } from 'next/server';
import path from 'node:path';
import { getConfig, resolveRepoRoot } from '@/lib/config';
import { computeReadinessFromPath } from '@/lib/readiness';
import { createGitIntegration } from '@/lib/git-integration';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = getConfig();
    const repoRoot = resolveRepoRoot();
    const productBasePath = path.resolve(repoRoot, config.product.basePath);

    // Get current git hash for cache invalidation
    const git = createGitIntegration(repoRoot);
    const changeResult = await git.detectChanges();
    const gitHash = 'changed' in changeResult ? changeResult.currentHash : null;

    const result = computeReadinessFromPath(productBasePath, gitHash);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[api/readiness] Error computing readiness:', message);

    // Return a safe fallback — score 0 with no breakdown
    return NextResponse.json(
      {
        score: 0,
        totalPlays: 0,
        runnablePlays: 0,
        breakdown: [],
        plays: [],
        lastGitHash: null,
        error: message,
      },
      { status: 500 },
    );
  }
}
