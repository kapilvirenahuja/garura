/**
 * API Route: /api/checklists/execute
 *
 * Thin compatibility shim that delegates to the shared play-execution
 * bridge at {@link spawnPlay}. Retained so existing clients (checklist
 * step CTAs, wiki-tag runner) keep working unchanged; it now inherits
 * command whitelisting, argument sanitization, process tracking,
 * execution timeouts, cancellation, and the global concurrent limit
 * from `play-executor`.
 *
 * Request body (JSON): `{ playName: string, prompt?: string, timeoutMs?: number }`.
 * Response: `text/event-stream` (see play-executor.ts for event schema).
 *
 * Fulfills: VAL-CHECK-020, VAL-ACTION-009 — VAL-ACTION-016, VAL-ACTION-029,
 *           VAL-ACTION-030.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ConcurrentLimitError,
  InvalidCommandError,
  InvalidPlayNameError,
  InvalidPromptError,
  spawnPlay,
} from '@/lib/play-executor';
import { resolveRepoRoot } from '@/lib/config';

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
  const sessionId = body.sessionId;
  const userResponse = body.userResponse;
  const execution =
    typeof body.execution === 'object' && body.execution !== null
      ? (body.execution as Record<string, unknown>)
      : undefined;
  const rawTimeout = body.timeoutMs;
  const timeoutMs =
    typeof rawTimeout === 'number' && Number.isFinite(rawTimeout) ? rawTimeout : undefined;

  try {
    const result = spawnPlay({
      playName: typeof playName === 'string' ? playName : '',
      prompt: typeof prompt === 'string' ? prompt : undefined,
      sessionId: typeof sessionId === 'string' ? sessionId : undefined,
      userResponse: typeof userResponse === 'string' ? userResponse : undefined,
      execution:
        execution &&
        (execution.runner === 'garura' || execution.runner === 'claude-headless')
          ? {
              runner: execution.runner,
              prompt: typeof execution.prompt === 'string' ? execution.prompt : undefined,
            }
          : undefined,
      workingDirectory: resolveRepoRoot(),
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
