/**
 * API Route: /api/play/execute
 *
 * Primary SSE endpoint for the Playbook Reader action engine. Delegates
 * to {@link spawnPlay} for process lifecycle management and streams the
 * resulting SSE feed straight back to the browser.
 *
 * Request body (JSON):
 *   `{ playName: string, prompt?: string, timeoutMs?: number }`
 *
 * Response:
 *   - 200 + `text/event-stream` on successful spawn.
 *     The `X-Execution-Id` response header exposes the server-side
 *     execution id so the client can correlate cancellation requests
 *     before consuming the stream.
 *   - 400 for invalid JSON / invalid play name / invalid prompt.
 *   - 429 when the concurrent-execution limit is reached
 *     (`Retry-After` header suggests the client wait).
 *   - 500 for any other spawn failure.
 *
 * Fulfills:
 *   VAL-ACTION-009, VAL-ACTION-010, VAL-ACTION-011, VAL-ACTION-012,
 *   VAL-ACTION-013, VAL-ACTION-014, VAL-ACTION-016, VAL-ACTION-029,
 *   VAL-ACTION-030.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ConcurrentLimitError,
  InvalidCommandError,
  InvalidPlayNameError,
  InvalidPromptError,
  spawnPlay,
} from '@/lib/play-executor';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const playName = body.playName;
  const prompt = body.prompt;
  const rawTimeout = body.timeoutMs;
  const timeoutMs =
    typeof rawTimeout === 'number' && Number.isFinite(rawTimeout) ? rawTimeout : undefined;

  try {
    const result = spawnPlay({
      playName: typeof playName === 'string' ? playName : '',
      prompt: typeof prompt === 'string' ? prompt : undefined,
      timeoutMs,
      signal: request.signal,
    });

    return new Response(result.stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Execution-Id': result.executionId,
      },
    });
  } catch (err) {
    if (err instanceof ConcurrentLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code, limit: err.limit },
        { status: 429, headers: { 'Retry-After': '10' } },
      );
    }
    if (
      err instanceof InvalidPlayNameError ||
      err instanceof InvalidPromptError ||
      err instanceof InvalidCommandError
    ) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
