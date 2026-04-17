/**
 * API Route: /api/annotations
 *
 * CRUD surface for narrative annotations. Each annotation is persisted in
 * a per-context YAML sidecar file (see {@link annotation-manager}) —
 * source artifacts are never modified.
 *
 *   GET    /api/annotations?context=E1
 *     → { context, annotations: Annotation[], author: string }
 *
 *   POST   /api/annotations
 *     body: { context, content, position?, type? }
 *     → { annotation: Annotation, author: string }
 *
 *   DELETE /api/annotations?context=E1&id=ann-xxxx
 *     → { removed: boolean }
 *
 * Fulfills: VAL-ACTION-020, VAL-ACTION-021, VAL-ACTION-022 (HTTP surface),
 *           VAL-ACTION-023 (wiki tags are stored verbatim in content).
 */

import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { ensureConfigLoaded, getConfig, resolveRepoRoot } from '@/lib/config';
import {
  appendAnnotation,
  deleteAnnotation,
  readSidecar,
  resolveAuthor,
  sanitizeContextSlug,
  selectComments,
  sidecarPathForContext,
  type AnnotationPosition,
  type AnnotationType,
} from '@/lib/annotation-manager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Helpers shared by all verbs
// ---------------------------------------------------------------------------

function resolveProductBasePath(): string {
  ensureConfigLoaded();
  const repoRoot = resolveRepoRoot();
  const cfg = getConfig();
  const base = cfg.product.basePath;
  return path.isAbsolute(base) ? base : path.resolve(repoRoot, base);
}

function parseContext(req: NextRequest): string | null {
  const raw = req.nextUrl.searchParams.get('context');
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

function coercePosition(raw: unknown): AnnotationPosition {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  const pickString = (key: string): string | undefined =>
    typeof obj[key] === 'string' ? (obj[key] as string) : undefined;
  const pickNumber = (key: string): number | undefined =>
    typeof obj[key] === 'number' && Number.isFinite(obj[key]) ? (obj[key] as number) : undefined;
  return {
    sectionId: pickString('sectionId'),
    refId: pickString('refId'),
    selectedText: pickString('selectedText'),
    offsetStart: pickNumber('offsetStart'),
    offsetEnd: pickNumber('offsetEnd'),
    play: pickString('play'),
    prompt: pickString('prompt'),
  };
}

// ---------------------------------------------------------------------------
// GET — list annotations for a context
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  const context = parseContext(req);
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
    // Resolve author opportunistically so the UI can label the "me" bubble
    // even before the user writes anything; failures fall back to Anonymous.
    const author = await resolveAuthor(resolveRepoRoot()).catch(() => 'Anonymous');
    return NextResponse.json({
      context: sanitizeContextSlug(context),
      annotations: sidecar.annotations,
      comments: selectComments(sidecar),
      author,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new annotation
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const context = typeof body.context === 'string' ? body.context.trim() : '';
  if (!context) {
    return NextResponse.json({ error: 'Missing required field: context' }, { status: 400 });
  }

  const content = typeof body.content === 'string' ? body.content : '';
  if (content.trim().length === 0) {
    return NextResponse.json({ error: 'Annotation content must not be empty' }, { status: 400 });
  }
  if (content.length > 8000) {
    return NextResponse.json(
      { error: 'Annotation content exceeds maximum length of 8000 characters' },
      { status: 400 },
    );
  }

  const position = coercePosition(body.position);
  const type: AnnotationType = body.type === 'wiki-tag-cache' ? 'wiki-tag-cache' : 'comment';

  try {
    const productBase = resolveProductBasePath();
    const sidecarPath = sidecarPathForContext(productBase, context);
    const author = await resolveAuthor(resolveRepoRoot()).catch(() => 'Anonymous');

    const annotation = await appendAnnotation({
      sidecarPath,
      context,
      content,
      author,
      position,
      type,
    });

    return NextResponse.json({ annotation, author }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — remove an annotation
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const context = parseContext(req);
  const id = req.nextUrl.searchParams.get('id');
  if (!context || !id || id.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing required query parameters: context, id' },
      { status: 400 },
    );
  }

  try {
    const productBase = resolveProductBasePath();
    const sidecarPath = sidecarPathForContext(productBase, context);
    const removed = await deleteAnnotation(sidecarPath, context, id);
    return NextResponse.json({ removed });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
