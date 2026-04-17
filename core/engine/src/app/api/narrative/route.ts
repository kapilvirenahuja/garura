/**
 * API Route: GET /api/narrative?context=E1
 *
 * Returns an AI-composed narrative for the given epic context. Loads every
 * Garura artifact the parser can find, builds the cross-reference graph, and
 * calls `getEpicNarrative` which either serves from cache (when the artifact
 * content hash matches) or composes a fresh narrative.
 *
 * Response shape:
 *   {
 *     narrative: Narrative,   // structured section tree, no raw YAML
 *     fromCache: boolean,     // true on cache hit (sub-100ms), false otherwise
 *     composedAt: string      // ISO timestamp when narrative was composed
 *   }
 *
 * Fulfills: mdb-narrative-engine (HTTP surface).
 */

import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { ensureConfigLoaded, getConfig, resolveRepoRoot } from '@/lib/config';
import { parseArtifacts } from '@/lib/artifact-parser';
import type { ArtifactResult, ArtifactType } from '@/lib/artifact-parser';
import { buildCrossRefGraph } from '@/lib/crossref-resolver';
import { getEpicNarrative, type ComposeContext } from '@/lib/narrative-engine';
import { discoverStmEvidence } from '@/lib/stm-discovery';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Artifact filenames the narrative engine consumes. */
const PRODUCT_ARTIFACTS: ReadonlyArray<{ name: string; type: ArtifactType }> = [
  { name: 'product.yaml', type: 'product' },
  { name: 'features.yaml', type: 'features' },
  { name: 'scenarios.yaml', type: 'scenarios' },
  { name: 'plan.yaml', type: 'plan' },
  { name: 'architecture.yaml', type: 'architecture' },
  { name: 'tech.yaml', type: 'tech' },
  { name: 'roadmap.yaml', type: 'roadmap' },
];

function resolveAgainstRoot(repoRoot: string, p: string): string {
  return path.isAbsolute(p) ? p : path.resolve(repoRoot, p);
}

function loadAllArtifacts(
  productBasePath: string,
  stmBasePath: string,
): ReadonlyArray<ArtifactResult> {
  const productFiles = PRODUCT_ARTIFACTS.map(({ name, type }) => ({
    path: path.join(productBasePath, name),
    type,
  }));
  const stmFiles = discoverStmEvidence(stmBasePath);
  return parseArtifacts([...productFiles, ...stmFiles]);
}

function buildErrorResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      error: message,
      narrative: null,
      fromCache: false,
    },
    { status: 400 },
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  ensureConfigLoaded();

  const context = req.nextUrl.searchParams.get('context');
  if (!context || context.trim() === '') {
    return buildErrorResponse('Missing required query parameter: context');
  }

  try {
    const repoRoot = resolveRepoRoot();
    const config = getConfig();
    const productBasePath = resolveAgainstRoot(repoRoot, config.product.basePath);
    const stmBasePath = resolveAgainstRoot(repoRoot, config.stm.basePath);

    const artifacts = loadAllArtifacts(productBasePath, stmBasePath);
    const graph = buildCrossRefGraph(artifacts, null);

    const composeCtx: ComposeContext = {
      epicId: context,
      artifacts,
      graph,
    };
    const composeStart = Date.now();
    const { narrative, fromCache } = getEpicNarrative(composeCtx);
    const composeMs = Date.now() - composeStart;

    // Emit cache-hit telemetry as a response header so browser-based
    // validation (VAL-PLAY-014) can assert API freshness even when the
    // total page render (React hydration + paint) is slower than the
    // 100ms threshold. The header intentionally uses ASCII values so it
    // survives intermediary proxies and `fetch().headers.get()`.
    const response = NextResponse.json({
      narrative,
      fromCache,
      composedAt: narrative.composedAt,
      composeMs,
    });
    response.headers.set('X-Cache-Hit', fromCache ? 'true' : 'false');
    response.headers.set('X-Compose-Ms', String(composeMs));
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/narrative] composition failed:', message);
    return NextResponse.json(
      {
        error: message,
        narrative: null,
        fromCache: false,
      },
      { status: 500 },
    );
  }
}
