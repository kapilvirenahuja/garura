/**
 * API Route: /api/play/status
 *
 * Read-only snapshot of the process tracker. Returns the current list of
 * tracked executions (running + recent terminal) with their PID, start
 * time, play name, and status. Used by the Flight Deck and tests to
 * observe live play activity.
 *
 * Fulfills: VAL-ACTION-013.
 */

import { NextResponse } from 'next/server';
import { getProcessTracker, getRunningCount, MAX_CONCURRENT_EXECUTIONS } from '@/lib/play-executor';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const tracker = getProcessTracker();
  const records = Array.from(tracker.values()).map((r) => ({
    executionId: r.executionId,
    playName: r.playName,
    pid: r.pid,
    startTime: r.startTime,
    status: r.status,
    exitCode: r.exitCode ?? null,
    errorMessage: r.errorMessage ?? null,
  }));

  return NextResponse.json({
    running: getRunningCount(),
    limit: MAX_CONCURRENT_EXECUTIONS,
    records,
  });
}
