/**
 * API Route: /api/annotations/wiki-tag-cache
 *
 * Read / write surface for cached wiki-tag results (VAL-ACTION-025,
 * VAL-ACTION-026).
 *
 *   GET  /api/annotations/wiki-tag-cache?context=E1
 *     → {
 *         context: string,
 *         entries: Array<{ play, prompt, result, author, timestamp, id }>
 *       }
 *     Consumed by NarrativeView on mount to hydrate wiki-tag runners that
 *     already have a persisted result.
 *
 *   POST /api/annotations/wiki-tag-cache
 *     body: { context, play, prompt, result, sectionId? }
 *     → { entry: Annotation }
 *     Called by the WikiTagRunner SSE consumer when a run transitions to
 *     the `complete` state. Writes are serialised per-sidecar by the
 *     manager so a re-run reliably overwrites the previous entry.
 */

import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { ensureConfigLoaded, getConfig, resolveRepoRoot } from '@/lib/config';
import {
  buildWikiTagCacheLookup,
  readSidecar,
  resolveAuthor,
  sidecarPathForContext,
  upsertWikiTagCache,
  wikiTagCacheLookupKey,
} from '@/lib/annotation-manager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function resolveProductBasePath(): string {
  ensureConfigLoaded();
  const repoRoot = resolveRepoRoot();
  const cfg = getConfig();
  const base = cfg.product.basePath;
  return path.isAbsolute(base) ? base : path.resolve(repoRoot, base);
}

// ---------------------------------------------------------------------------
// GET — list cached wiki-tag results for a context
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  const context = req.nextUrl.searchParams.get('context')?.trim();
  if (!context) {
    return NextResponse.json(
      { error: 'Missing required query parameter: context' },
      { status: 400 },
    );
  }
  try {
    const productBase = resolveProductBasePath();
    const sidecarPath = sidecarPathForContext(productBase, context);
    const sidecar = await readSidecar(sidecarPath, context);
    const lookup = buildWikiTagCacheLookup(sidecar);
    const entries = Array.from(lookup.values()).map(({ annotation, result }) => ({
      id: annotation.id,
      play: annotation.position.play ?? '',
      prompt: annotation.position.prompt ?? '',
      result,
      author: annotation.author,
      timestamp: annotation.timestamp,
      // Include the lookup key so clients can hydrate without recomputing it.
      key: wikiTagCacheLookupKey(annotation.position.play ?? '', annotation.position.prompt ?? ''),
    }));
    return NextResponse.json({ context, entries });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — persist (or overwrite) a cached wiki-tag result
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const context = typeof body.context === 'string' ? body.context.trim() : '';
  const play = typeof body.play === 'string' ? body.play.trim() : '';
  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  const result = typeof body.result === 'string' ? body.result : '';
  const sectionId = typeof body.sectionId === 'string' ? body.sectionId : undefined;

  if (!context || !play || prompt.length === 0) {
    return NextResponse.json(
      { error: 'Missing required fields: context, play, prompt' },
      { status: 400 },
    );
  }

  try {
    const productBase = resolveProductBasePath();
    const sidecarPath = sidecarPathForContext(productBase, context);
    const author = await resolveAuthor(resolveRepoRoot()).catch(() => 'Anonymous');
    const entry = await upsertWikiTagCache({
      sidecarPath,
      context,
      play,
      prompt,
      result,
      author,
      sectionId,
    });
    return NextResponse.json({ entry });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
