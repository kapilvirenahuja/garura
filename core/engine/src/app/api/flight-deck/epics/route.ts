/**
 * API Route: /api/flight-deck/epics
 *
 * Returns the discovered epics for the Flight Deck, along with each epic's
 * inferred stage, developer, last commit, and STM evidence summary.
 *
 * Fulfills: VAL-FLIGHT-001, VAL-FLIGHT-002, VAL-FLIGHT-003, VAL-FLIGHT-004
 */

import { NextResponse } from 'next/server';
import path from 'node:path';
import { getConfig, resolveRepoRoot } from '@/lib/config';
import { discoverEpics } from '@/lib/epic-status';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = getConfig();
    const repoRoot = resolveRepoRoot();
    const productBasePath = path.resolve(repoRoot, config.product.basePath);
    const stmBasePath = path.resolve(repoRoot, config.stm.basePath);

    const result = await discoverEpics({
      repoPath: repoRoot,
      productBasePath,
      stmBasePath,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[api/flight-deck/epics] Error discovering epics:', message);
    // Return a safe fallback — empty epic list with the error surfaced.
    return NextResponse.json(
      {
        epics: [],
        empty: true,
        error: message,
      },
      { status: 500 },
    );
  }
}
