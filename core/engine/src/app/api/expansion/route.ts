/**
 * API Route: GET /api/expansion?refId=<id>
 *
 * Resolves a cross-reference ID to a structured expansion payload used by the
 * Playbook Reader's InlineExpansion component. Returns entity details, source
 * provenance, and connections (parent feature, architecture, NFR dependencies,
 * implementation tasks) as labelled reference IDs.
 *
 * Response shape:
 *   {
 *     expansion: EntityExpansionData,
 *   }
 *
 * Fulfills: mdb-progressive-disclosure (server HTTP surface).
 */

import fs from 'node:fs';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { ensureConfigLoaded, getConfig, resolveRepoRoot } from '@/lib/config';
import { parseArtifacts } from '@/lib/artifact-parser';
import type { ArtifactResult, ArtifactType } from '@/lib/artifact-parser';
import { buildCrossRefGraph } from '@/lib/crossref-resolver';
import { resolveEntityExpansion } from '@/lib/entity-expansion';

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
    // Best-effort
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
      { error: 'Missing required query parameter: refId', expansion: null },
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

    const expansion = resolveEntityExpansion(refId.trim(), artifacts, graph);
    return NextResponse.json({ expansion });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/expansion] resolve failed:', message);
    return NextResponse.json({ error: message, expansion: null }, { status: 500 });
  }
}
