'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProductConstellationView } from '@/components/product-constellation-view';
import { ProductStoryCanvasView } from '@/components/product-story-canvas-view';
import { ProductStatusChip } from '@/components/product-status-chip';
import { PRODUCT_STATUSES, type ProductConcept, type ProductInstrumentData } from '@/lib/product-model';

const PRODUCT_CONCEPT_STORAGE_KEY = 'mdb:product:concept';

const CONCEPT_OPTIONS: ReadonlyArray<{ id: ProductConcept; label: string }> = [
  { id: 'constellation', label: 'Constellation' },
  { id: 'story-canvas', label: 'Story Canvas' },
] as const;

function ProductView({
  concept,
  data,
}: {
  readonly concept: ProductConcept;
  readonly data: ProductInstrumentData;
}) {
  switch (concept) {
    case 'story-canvas':
      return <ProductStoryCanvasView data={data} />;
    default:
      return <ProductConstellationView data={data} />;
  }
}

export default function ProductPage() {
  const [data, setData] = useState<ProductInstrumentData | null>(null);
  const [concept, setConcept] = useState<ProductConcept>('constellation');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PRODUCT_CONCEPT_STORAGE_KEY);
      if (saved === 'constellation' || saved === 'story-canvas') {
        setConcept(saved);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PRODUCT_CONCEPT_STORAGE_KEY, concept);
    } catch {
      /* localStorage unavailable */
    }
  }, [concept]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/product');
        if (!res.ok) {
          throw new Error(`Failed to load product posture: ${res.status}`);
        }
        const payload = (await res.json()) as ProductInstrumentData;
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalEntities = useMemo(() => {
    if (!data) return 0;
    return PRODUCT_STATUSES.reduce((sum, status) => sum + data.statusCounts[status], 0);
  }, [data]);

  return (
    <div data-testid="product-view" className="space-y-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/70">
              Product Instrument
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">
              {data?.summary.name ?? 'Product'}
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-300">
              {data?.summary.description ??
                'Read-only posture lens over the product hierarchy, designed to absorb live signals later.'}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {data?.summary.headline ?? 'Loading product posture...'}
            </p>
          </div>

          <div className="w-full max-w-xl rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-wrap gap-2">
              {CONCEPT_OPTIONS.map((option) => {
                const isActive = option.id === concept;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setConcept(option.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                      isActive
                        ? 'border-amber-400/50 bg-amber-400/15 text-amber-100'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                    data-testid={`product-concept-${option.id}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(data?.summary.sourceArtifacts ?? []).map((artifact) => (
                <span
                  key={artifact}
                  className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400"
                >
                  {artifact}
                </span>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 px-6 py-16 text-center text-slate-400">
            Loading product posture…
          </div>
        ) : error ? (
          <div className="rounded-[1.75rem] border border-red-800 bg-red-950/20 px-6 py-12 text-center text-red-300">
            {error}
          </div>
        ) : data ? (
          <>
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Product posture
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">{totalEntities} mapped entities</div>
                  </div>
                  {data.updatedAt ? (
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Updated {data.updatedAt}
                    </div>
                  ) : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {PRODUCT_STATUSES.map((status) => (
                    <div key={status} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                      <ProductStatusChip status={status} />
                      <div className="mt-3 text-2xl font-semibold text-white">{data.statusCounts[status]}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Signal lane
                </div>
                <div className="mt-3 text-2xl font-semibold text-white">
                  {data.signalsSummary.runtimeSignalsConnected ? 'Connected' : 'Reserved'}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{data.signalsSummary.note}</p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Artifact</div>
                    <div className="mt-2 text-xl font-semibold text-white">{data.signalsSummary.artifactDefined}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Curated</div>
                    <div className="mt-2 text-xl font-semibold text-white">{data.signalsSummary.manuallyCurated}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Signals</div>
                    <div className="mt-2 text-xl font-semibold text-white">{data.signalsSummary.signalSupported}</div>
                  </div>
                </div>
              </div>
            </div>

            {data.coverageGaps.length > 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-amber-700/40 bg-amber-950/10 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/70">
                  Coverage gaps
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.coverageGaps.map((gap) => (
                    <span key={gap} className="rounded-full border border-amber-700/40 px-3 py-1 text-sm text-amber-100">
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <ProductView concept={concept} data={data} />
          </>
        ) : null}
      </section>
    </div>
  );
}
