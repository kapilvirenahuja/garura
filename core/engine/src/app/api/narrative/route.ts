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

import fs from 'node:fs';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { ensureConfigLoaded, getConfig, resolveRepoRoot } from '@/lib/config';
import { parseArtifacts } from '@/lib/artifact-parser';
import type { ArtifactResult, ArtifactType } from '@/lib/artifact-parser';
import { buildCrossRefGraph } from '@/lib/crossref-resolver';
import { getEpicNarrative, type ComposeContext } from '@/lib/narrative-engine';

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

function discoverStmEvidence(stmBasePath: string): Array<{ path: string; type: ArtifactType }> {
  if (!fs.existsSync(stmBasePath)) return [];
  const out: Array<{ path: string; type: ArtifactType }> = [];
  try {
    const entries = fs.readdirSync(stmBasePath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const issueDir = path.join(stmBasePath, entry.name);
      const files = fs.readdirSync(issueDir, { withFileTypes: true });
      for (const f of files) {
        if (!f.isFile()) continue;
        const full = path.join(issueDir, f.name);
        if (f.name.endsWith('.yaml') || f.name.endsWith('.yml')) {
          out.push({ path: full, type: 'stm-evidence-yaml' });
        } else if (f.name.endsWith('.md')) {
          out.push({ path: full, type: 'stm-evidence-markdown' });
        }
      }
    }
  } catch {
    // Best-effort: swallow and return what we have.
  }
  return out;
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
    const { narrative, fromCache } = getEpicNarrative(composeCtx);

    return NextResponse.json({
      narrative,
      fromCache,
      composedAt: narrative.composedAt,
    });
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
