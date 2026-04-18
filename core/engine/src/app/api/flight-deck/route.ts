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
import { ensureConfigLoaded, getConfig, resolveRepoRoot } from '@/lib/config';
import { discoverEpics } from '@/lib/epic-status';
import { buildFlightDeckData, type ActivePlayExecutionRecord } from '@/lib/flight-deck';
import { getProcessTracker } from '@/lib/play-executor';

// Always refresh on each request — Flight Deck is a live view.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function resolveAgainstRoot(repoRoot: string, p: string): string {
  return path.isAbsolute(p) ? p : path.resolve(repoRoot, p);
}

export async function GET() {
  // Ensure config is loaded — layout.tsx's module-level loadConfig does not
  // necessarily run before an API route in Next.js dev, so routes must
  // self-initialise to honour GARURA_TARGET_REPO.
  ensureConfigLoaded();

  const repoRoot = resolveRepoRoot();
  const config = getConfig();

  const repoPath = resolveAgainstRoot(repoRoot, config.repo.path);
  const productBasePath = resolveAgainstRoot(repoRoot, config.product.basePath);
  const stmBasePath = resolveAgainstRoot(repoRoot, config.stm.basePath);

  // Active in-memory play executions (triggered from Playbook wiki tags,
  // CTAs, or Checklists) surface into the play log immediately so the
  // Flight Deck shows concurrent activity across instruments without
  // waiting for STM evidence to be written (VAL-CROSS-020).
  const activeRecords: ActivePlayExecutionRecord[] = Array.from(getProcessTracker().values()).map(
    (r) => ({
      executionId: r.executionId,
      playName: r.playName,
      startTime: r.startTime,
      status: r.status,
    }),
  );

  try {
    const discovery = await discoverEpics({ repoPath, productBasePath, stmBasePath });
    const data = buildFlightDeckData(discovery, new Date(), activeRecords);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const empty = buildFlightDeckData(
      { epics: [], empty: true, error: message },
      new Date(),
      activeRecords,
    );
    return NextResponse.json(empty, { status: 200 });
  }
}
