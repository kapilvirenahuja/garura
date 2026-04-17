/**
 * API Route: GET /api/search?query=<query>
 *
 * Returns AI-composed generative search results for the given query.
 * Each result is a contextual prose snippet (structured NarrativeChunk
 * stream) — not a keyword-highlighted excerpt of raw YAML. Results may
 * synthesize information from multiple artifact files for the same
 * topic, and cross-epic relevance is surfaced by including the set of
 * epics each result relates to.
 *
 * Response shape:
 *   {
 *     query: string,
 *     results: GenerativeSearchResult[],
 *     hitCount: number,
 *     epics: GenerativeSearchEpicRef[],
 *     composedAt: string
 *   }
 *
 * Fulfills: mdb-generative-search (HTTP surface).
 */

import fs from 'node:fs';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { ensureConfigLoaded, getConfig, resolveRepoRoot } from '@/lib/config';
import { parseArtifacts } from '@/lib/artifact-parser';
import type { ArtifactResult, ArtifactType } from '@/lib/artifact-parser';
import { buildCrossRefGraph } from '@/lib/crossref-resolver';
import { createSearchIndex } from '@/lib/search-index';
import { composeGenerativeSearch } from '@/lib/generative-search';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

function buildErrorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json(
    {
      error: message,
      query: '',
      results: [],
      hitCount: 0,
      epics: [],
    },
    { status },
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  ensureConfigLoaded();

  const rawQuery = req.nextUrl.searchParams.get('query') ?? req.nextUrl.searchParams.get('q');
  if (!rawQuery || rawQuery.trim() === '') {
    return buildErrorResponse('Missing required query parameter: query');
  }

  try {
    const repoRoot = resolveRepoRoot();
    const config = getConfig();
    const productBasePath = resolveAgainstRoot(repoRoot, config.product.basePath);
    const stmBasePath = resolveAgainstRoot(repoRoot, config.stm.basePath);

    const artifacts = loadAllArtifacts(productBasePath, stmBasePath);
    const graph = buildCrossRefGraph(artifacts, null);

    const index = createSearchIndex();
    index.build(artifacts);

    const response = composeGenerativeSearch(rawQuery, index, artifacts, graph);

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/search] composition failed:', message);
    return buildErrorResponse(message, 500);
  }
}
