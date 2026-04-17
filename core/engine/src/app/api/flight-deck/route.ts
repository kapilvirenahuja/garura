/**
 * GET /api/flight-deck
 *
 * Server route that:
 *   1. Discovers active epics via `discoverEpics` (git branches + STM evidence)
 *   2. Transforms discovery into Flight Deck UI data via `buildFlightDeckData`
 *
 * The response shape is the public contract consumed by the Flight Deck page
 * (see `FlightDeckData` in `@/lib/flight-deck`). Errors are surfaced on the
 * `error` field with an empty epic list so the UI always renders an empty
 * state rather than a blank screen.
 *
 * Fulfills: VAL-FLIGHT-001..VAL-FLIGHT-017 (data feed)
 */

import path from 'node:path';
import { NextResponse } from 'next/server';
import { getConfig, resolveRepoRoot } from '@/lib/config';
import { discoverEpics } from '@/lib/epic-status';
import { buildFlightDeckData } from '@/lib/flight-deck';

// Always refresh on each request — Flight Deck is a live view.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function resolveAgainstRoot(repoRoot: string, p: string): string {
  return path.isAbsolute(p) ? p : path.resolve(repoRoot, p);
}

export async function GET() {
  const repoRoot = resolveRepoRoot();
  const config = getConfig();

  const repoPath = resolveAgainstRoot(repoRoot, config.repo.path);
  const productBasePath = resolveAgainstRoot(repoRoot, config.product.basePath);
  const stmBasePath = resolveAgainstRoot(repoRoot, config.stm.basePath);

  try {
    const discovery = await discoverEpics({ repoPath, productBasePath, stmBasePath });
    const data = buildFlightDeckData(discovery, new Date());
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const empty = buildFlightDeckData({ epics: [], empty: true, error: message }, new Date());
    return NextResponse.json(empty, { status: 200 });
  }
}
