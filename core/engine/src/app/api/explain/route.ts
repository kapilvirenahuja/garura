/**
 * API Route: GET /api/explain?refId=<id>
 *
 * Composes a deeper "explain further" narrative for a cross-reference ID.
 * Traces the entity through the artifact graph and produces a multi-paragraph
 * prose block that can be inserted inline below the "Explain further" button
 * of an open expansion.
 *
 * Response shape:
 *   {
 *     refId: string,
 *     paragraphs: string[],
 *     source: 'deterministic' | 'ai',
 *   }
 *
 * Fulfills: mdb-progressive-disclosure — "Explain further" button.
 */

import fs from 'node:fs';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { ensureConfigLoaded, getConfig, resolveRepoRoot } from '@/lib/config';
import { parseArtifacts } from '@/lib/artifact-parser';
import type { ArtifactResult, ArtifactType } from '@/lib/artifact-parser';
import { buildCrossRefGraph } from '@/lib/crossref-resolver';
import { composeExplainFurther } from '@/lib/entity-expansion';

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
    // best-effort
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

export async function GET(req: NextRequest): Promise<NextResponse> {
  ensureConfigLoaded();
  const refId = req.nextUrl.searchParams.get('refId');
  if (!refId || refId.trim() === '') {
    return NextResponse.json(
      { error: 'Missing required query parameter: refId', paragraphs: [], source: 'deterministic' },
      { status: 400 },
    );
  }

  try {
    const repoRoot = resolveRepoRoot();
    const config = getConfig();
    const productBasePath = resolveAgainstRoot(repoRoot, config.product.basePath);
    const stmBasePath = resolveAgainstRoot(repoRoot, config.stm.basePath);

    const artifacts = loadAllArtifacts(productBasePath, stmBasePath);
    const graph = buildCrossRefGraph(artifacts, null);

    const { paragraphs, source } = composeExplainFurther(refId.trim(), artifacts, graph);
    return NextResponse.json({ refId: refId.trim(), paragraphs, source });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/explain] compose failed:', message);
    return NextResponse.json(
      { error: message, paragraphs: [], source: 'deterministic' },
      { status: 500 },
    );
  }
}
