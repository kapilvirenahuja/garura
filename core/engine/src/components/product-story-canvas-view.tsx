'use client';

import { ProductStatusChip } from '@/components/product-status-chip';
import type { ProductCapability, ProductDomain, ProductInstrumentData, ProductStatus } from '@/lib/product-model';

interface PersonaLens {
  readonly name: string;
  readonly canDo: string;
  readonly effectivenessLabel: string;
  readonly effectivenessScore: number;
}

const STATUS_WEIGHTS: Readonly<Record<ProductStatus, number>> = {
  live: 1,
  partial: 0.76,
  pilot: 0.58,
  planned: 0.34,
  dormant: 0.14,
};

function personaForDomain(domain: ProductDomain, index: number) {
  const slug = `${domain.id} ${domain.name}`.toLowerCase();
  if (slug.includes('foundation') || slug.includes('setup')) return 'Experiment Operator';
  if (slug.includes('execution')) return 'Night Shift Conductor';
  if (slug.includes('intelligence') || slug.includes('story')) return 'Product Strategist';
  if (slug.includes('ecosystem') || slug.includes('platform')) return 'Platform Architect';
  return ['Product Owner', 'Ops Lead', 'Growth Lead', 'Platform Lead'][index % 4] ?? 'Product Owner';
}

function chapterTitle(index: number) {
  return ['Act I', 'Act II', 'Act III', 'Act IV', 'Act V'][index] ?? `Act ${index + 1}`;
}

function narrativeForDomain(domain: ProductDomain) {
  const liveNames = domain.capabilities
    .filter((item) => item.status === 'live' || item.status === 'partial')
    .map((item) => item.name)
    .slice(0, 2);
  const nextNames = domain.capabilities
    .filter((item) => item.status === 'planned' || item.status === 'pilot')
    .map((item) => item.name)
    .slice(0, 2);

  return {
    now: liveNames.length > 0 ? liveNames.join(' + ') : 'Posture still forming',
    next: nextNames.length > 0 ? nextNames.join(' + ') : 'No major expansion queued',
  };
}

function secondaryPersonaForDomain(domain: ProductDomain, index: number) {
  const slug = `${domain.id} ${domain.name}`.toLowerCase();
  if (slug.includes('foundation') || slug.includes('setup')) return 'Metrics Curator';
  if (slug.includes('execution')) return 'Autonomy Supervisor';
  if (slug.includes('intelligence') || slug.includes('story')) return 'Growth Analyst';
  if (slug.includes('ecosystem') || slug.includes('platform')) return 'Integration Builder';
  return ['Product Analyst', 'Release Manager', 'Research Lead', 'Systems Designer'][index % 4] ?? 'Product Analyst';
}

function effectivenessForCapabilities(capabilities: ReadonlyArray<ProductCapability>) {
  if (capabilities.length === 0) return { effectivenessScore: 22, effectivenessLabel: 'Blocked' };
  const weighted =
    capabilities.reduce((sum, capability) => sum + STATUS_WEIGHTS[capability.status], 0) / capabilities.length;
  const effectivenessScore = Math.round(weighted * 100);

  if (effectivenessScore >= 74) return { effectivenessScore, effectivenessLabel: 'Effective' };
  if (effectivenessScore >= 50) return { effectivenessScore, effectivenessLabel: 'Emerging' };
  return { effectivenessScore, effectivenessLabel: 'Blocked' };
}

function capabilityActionSummary(capabilities: ReadonlyArray<ProductCapability>) {
  return capabilities
    .slice(0, 2)
    .map((capability) => capability.name)
    .join(' + ');
}

function personaDeckForDomain(domain: ProductDomain, index: number): ReadonlyArray<PersonaLens> {
  const primaryName = personaForDomain(domain, index);
  const secondaryName = secondaryPersonaForDomain(domain, index);
  const liveAdjacent = domain.capabilities.filter(
    (capability) => capability.status === 'live' || capability.status === 'partial',
  );
  const futureAdjacent = domain.capabilities.filter(
    (capability) => capability.status === 'pilot' || capability.status === 'planned',
  );

  const primaryCapabilities = liveAdjacent.length > 0 ? liveAdjacent : domain.capabilities.slice(0, 2);
  const secondaryCapabilities = futureAdjacent.length > 0 ? futureAdjacent : domain.capabilities.slice(1, 3);

  const primaryEffectiveness = effectivenessForCapabilities(primaryCapabilities);
  const secondaryEffectiveness = effectivenessForCapabilities(secondaryCapabilities);

  return [
    {
      name: primaryName,
      canDo: capabilityActionSummary(primaryCapabilities) || 'Anchor the current operating posture',
      ...primaryEffectiveness,
    },
    {
      name: secondaryName,
      canDo: capabilityActionSummary(secondaryCapabilities) || 'Shape the next delivery wave',
      ...secondaryEffectiveness,
    },
  ];
}

function roleFocusForCapability(capability: ProductCapability, domain: ProductDomain, index: number) {
  const primaryPersona = personaForDomain(domain, index);
  const secondaryPersona = secondaryPersonaForDomain(domain, index);
  if (capability.status === 'planned' || capability.status === 'pilot') return secondaryPersona;
  return primaryPersona;
}

function effectivenessClasses(label: string) {
  if (label === 'Effective') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (label === 'Emerging') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
}

export function ProductStoryCanvasView({ data }: { readonly data: ProductInstrumentData }) {
  return (
    <section
      data-testid="product-view-story-canvas"
      className="rounded-[2rem] border border-amber-900/40 bg-[linear-gradient(135deg,_rgba(36,26,19,0.99),_rgba(12,18,29,0.98)),radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_34%)] p-6"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/70">Story Canvas</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Who this product serves, what story it is telling, what chapter comes next</h3>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-300">
          This concept should read like an editorial spread for product owners: protagonist, tension, delivered beats, next chapter, and the roles carrying the product forward.
        </p>
      </div>

      <div className="space-y-6">
        {data.domains.map((domain, index) => {
          const narrative = narrativeForDomain(domain);
          const personas = personaDeckForDomain(domain, index);
          const chapter = chapterTitle(index);

          return (
            <article
              key={domain.id}
              className={`grid gap-5 rounded-[1.9rem] border p-6 lg:grid-cols-[0.8fr_1.35fr] ${
                index % 2 === 0
                  ? 'border-amber-800/50 bg-amber-950/20'
                  : 'border-sky-900/40 bg-sky-950/20'
              }`}
            >
              <aside className="flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">{chapter}</div>
                  <h4 className="mt-3 text-3xl font-semibold text-white">{domain.name}</h4>
                  <p className="mt-4 text-base leading-relaxed text-stone-300">{domain.description}</p>
                </div>

                <div className="mt-6 space-y-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Persona deck</div>
                    <div className="mt-3 space-y-3">
                      {personas.map((persona) => (
                        <div key={persona.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-base font-semibold text-white">{persona.name}</div>
                              <div className="mt-2 text-sm leading-relaxed text-stone-300">Can do: {persona.canDo}</div>
                            </div>
                            <div
                              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${effectivenessClasses(persona.effectivenessLabel)}`}
                            >
                              {persona.effectivenessLabel}
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-stone-500">
                              <span>Persona effectiveness</span>
                              <span>{persona.effectivenessScore}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-black/30">
                              <div
                                className={`h-2 rounded-full ${
                                  persona.effectivenessLabel === 'Effective'
                                    ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                                    : persona.effectivenessLabel === 'Emerging'
                                      ? 'bg-gradient-to-r from-amber-300 to-orange-300'
                                      : 'bg-gradient-to-r from-rose-400 to-pink-300'
                                }`}
                                style={{ width: `${persona.effectivenessScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Delivered now</div>
                    <div className="mt-2 text-sm leading-relaxed text-stone-200">{narrative.now}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Next chapter</div>
                    <div className="mt-2 text-sm leading-relaxed text-stone-200">{narrative.next}</div>
                  </div>
                  <div className="pt-1">
                    <ProductStatusChip status={domain.status} />
                  </div>
                </div>
              </aside>

              <div className="space-y-4">
                {domain.capabilities.map((capability, capabilityIndex) => (
                  <section key={capability.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                          Scene {capabilityIndex + 1}
                        </div>
                        <div className="mt-2 text-xl font-semibold text-white">{capability.name}</div>
                        <p className="mt-2 text-sm leading-relaxed text-stone-300">{capability.description}</p>
                        <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-stone-300">
                          Best handled by {roleFocusForCapability(capability, domain, index)}
                        </div>
                      </div>
                      <ProductStatusChip status={capability.status} />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[0.75fr_1.25fr]">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Role focus</div>
                        <div className="mt-2 text-base font-semibold text-white">
                          {capability.features[0]?.name ?? 'Feature detail needed'}
                        </div>
                        <p className="mt-2 text-sm text-stone-300">
                          {capability.features[0]?.description || 'This scene still needs its first visible beat.'}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Supporting beats</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {capability.features.slice(1, 6).map((feature) => (
                            <div
                              key={feature.id}
                              className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-stone-100"
                            >
                              {feature.name}
                            </div>
                          ))}
                          {capability.features.length <= 1 ? (
                            <div className="rounded-full border border-dashed border-white/10 px-3 py-2 text-sm text-stone-400">
                              Supporting beats still unwritten
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
