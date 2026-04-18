/**
 * API Route: /api/readiness
 *
 * Returns the current readiness score, breakdown, and git hash.
 * Used by the client-side ReadinessMiniGauge and Checklists page to display
 * consistent readiness data across all views.
 */

import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getConfig, resolveRepoRoot } from '@/lib/config';
import { computeReadinessFromPath, detectProjectLifecycle } from '@/lib/readiness';
import { readEngineState, writeEngineState, type LifecycleMode } from '@/lib/engine-state';
import { createGitIntegration } from '@/lib/git-integration';

export const dynamic = 'force-dynamic';

function artifactFingerprint(productBasePath: string): string {
  const files = [
    'product.yaml',
    'features.yaml',
    'scenarios.yaml',
    'plan.yaml',
    'architecture.yaml',
    'tech.yaml',
    'roadmap.yaml',
  ];

  return files
    .map((file) => {
      const fullPath = path.join(productBasePath, file);
      try {
        const stat = fs.statSync(fullPath);
        return `${file}:${stat.size}:${Math.round(stat.mtimeMs)}`;
      } catch {
        return `${file}:missing`;
      }
    })
    .join('|');
}

export async function GET() {
  try {
    const config = getConfig();
    const repoRoot = resolveRepoRoot();
    const productBasePath = path.resolve(repoRoot, config.product.basePath);
    const engineState = readEngineState(repoRoot);

    // Get current git hash for cache invalidation
    const git = createGitIntegration(repoRoot);
    const changeResult = await git.detectChanges();
    const gitHash = 'changed' in changeResult ? changeResult.currentHash : null;
    const detectedLifecycle = detectProjectLifecycle(repoRoot);
    const lifecycle =
      engineState.lifecycleMode === 'auto' ? detectedLifecycle : engineState.lifecycleMode;
    const fingerprint = artifactFingerprint(productBasePath);

    if (
      engineState.readinessCache &&
      engineState.readinessCache.gitHash === gitHash &&
      engineState.readinessCache.artifactFingerprint === fingerprint &&
      engineState.readinessCache.lifecycle === lifecycle
    ) {
      return NextResponse.json({
        ...engineState.readinessCache,
        lifecycle,
        detectedLifecycle,
        lifecycleMode: engineState.lifecycleMode,
        lastGitHash: engineState.readinessCache.gitHash,
      });
    }

    const result = computeReadinessFromPath(productBasePath, gitHash, lifecycle);
    writeEngineState(repoRoot, {
      lifecycleMode: engineState.lifecycleMode,
      readinessCache: {
        gitHash,
        artifactFingerprint: fingerprint,
        lifecycle,
        score: result.score,
        band: result.band,
        totalPlays: result.totalPlays,
        runnablePlays: result.runnablePlays,
        breakdown: result.breakdown,
        plays: result.plays,
        computedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      ...result,
      detectedLifecycle,
      lifecycleMode: engineState.lifecycleMode,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[api/readiness] Error computing readiness:', message);

    // Return a safe fallback — score 0 with no breakdown
    return NextResponse.json(
      {
        score: 0,
        band: '0-30',
        lifecycle: 'greenfield',
        detectedLifecycle: 'greenfield',
        lifecycleMode: 'auto' satisfies LifecycleMode,
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
