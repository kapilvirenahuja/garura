import { NextResponse } from 'next/server';
import path from 'node:path';
import { getConfig, resolveRepoRoot } from '@/lib/config';
import { loadProductInstrumentData } from '@/lib/product-posture';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const repoRoot = resolveRepoRoot();
    const config = getConfig();
    const productBasePath = path.resolve(repoRoot, config.product.basePath);
    const data = loadProductInstrumentData(repoRoot, productBasePath);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[api/product] Error building product posture:', message);
    return NextResponse.json(
      {
        error: message,
        summary: {
          name: 'Untitled Product',
          slug: 'product',
          description: 'Unable to load product posture right now.',
          headline: 'Product posture is temporarily unavailable.',
          sourceArtifacts: [],
        },
        updatedAt: null,
        statusCounts: { live: 0, partial: 0, pilot: 0, planned: 0, dormant: 0 },
        domains: [],
        coverageGaps: ['Product posture data could not be loaded.'],
        signalsSummary: {
          artifactDefined: 0,
          manuallyCurated: 0,
          signalSupported: 0,
          runtimeSignalsConnected: false,
          note: 'Runtime product signals are not wired yet.',
        },
      },
      { status: 500 },
    );
  }
}
