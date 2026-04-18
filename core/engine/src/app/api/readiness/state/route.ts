import { NextResponse, type NextRequest } from 'next/server';
import { resolveRepoRoot } from '@/lib/config';
import { readEngineState, writeEngineState, type LifecycleMode } from '@/lib/engine-state';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const lifecycleMode = body.lifecycleMode;
  if (lifecycleMode !== 'auto' && lifecycleMode !== 'greenfield' && lifecycleMode !== 'brownfield') {
    return NextResponse.json({ error: 'Invalid lifecycleMode' }, { status: 400 });
  }

  try {
    const repoRoot = resolveRepoRoot();
    const current = readEngineState(repoRoot);
    writeEngineState(repoRoot, {
      lifecycleMode: lifecycleMode as LifecycleMode,
      ...(current.readinessCache ? { readinessCache: current.readinessCache } : {}),
    });
    return NextResponse.json({ ok: true, lifecycleMode });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
