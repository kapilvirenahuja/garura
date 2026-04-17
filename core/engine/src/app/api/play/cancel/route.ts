/**
 * API Route: /api/play/cancel
 *
 * Cancel a running play execution by id. Sends SIGTERM to the child
 * process, marks the execution record `cancelled`, and lets the SSE
 * stream's abort handler emit the terminal `cancelled` event.
 *
 * Request body: `{ executionId: string }`.
 * Response: `{ cancelled: boolean }`. `cancelled=false` means the id
 * was unknown or already terminal.
 *
 * Fulfills: VAL-ACTION-015.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cancelExecution } from '@/lib/play-executor';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { executionId } = body;
  if (typeof executionId !== 'string' || executionId.length === 0) {
    return NextResponse.json({ error: 'executionId is required' }, { status: 400 });
  }

  const cancelled = cancelExecution(executionId, 'cancelled');
  return NextResponse.json({ cancelled });
}
