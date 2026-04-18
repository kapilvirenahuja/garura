'use client';

import { PRODUCT_STATUS_META } from '@/lib/product-status';
import type {
  ProductCapability,
  ProductDomain,
  ProductFeature,
  ProductInstrumentData,
  ProductStatus,
} from '@/lib/product-model';

const STATUS_WEIGHT: Readonly<Record<ProductStatus, number>> = {
  live: 1,
  partial: 0.76,
  pilot: 0.58,
  planned: 0.34,
  dormant: 0.14,
};

const EVIDENCE_WEIGHT: Readonly<Record<string, number>> = {
  'artifact-defined': 0.36,
  'manually-curated': 0.24,
  'signal-supported': 0.42,
};

const SVG_SIZE = 780;
const CENTER = SVG_SIZE / 2;
const DOMAIN_RING = 126;
const CAPABILITY_MIN_RING = 210;
const CAPABILITY_MAX_RING = 320;
const FEATURE_MIN_RING = 330;
const FEATURE_MAX_RING = 380;

function polarToCartesian(angleDeg: number, radius: number) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
}

function evidenceScore(
  evidence: ReadonlyArray<{
    readonly kind: string;
  }>,
) {
  return evidence.reduce((sum, entry) => sum + (EVIDENCE_WEIGHT[entry.kind] ?? 0.18), 0);
}

function featureUsage(feature: ProductFeature) {
  return Math.min(1, STATUS_WEIGHT[feature.status] * 0.62 + evidenceScore(feature.evidence) * 0.55);
}

function capabilityUsage(capability: ProductCapability) {
  const featureAverage =
    capability.features.length > 0
      ? capability.features.reduce((sum, feature) => sum + featureUsage(feature), 0) / capability.features.length
      : 0.18;
  return Math.min(
    1,
    STATUS_WEIGHT[capability.status] * 0.42 +
      featureAverage * 0.38 +
      evidenceScore(capability.evidence) * 0.3 +
      Math.min(capability.features.length / 8, 1) * 0.1,
  );
}

function domainUsage(domain: ProductDomain) {
  const capabilityAverage =
    domain.capabilities.length > 0
      ? domain.capabilities.reduce((sum, capability) => sum + capabilityUsage(capability), 0) / domain.capabilities.length
      : 0.16;
  return Math.min(
    1,
    STATUS_WEIGHT[domain.status] * 0.35 +
      capabilityAverage * 0.45 +
      evidenceScore(domain.evidence) * 0.22 +
      Math.min(domain.capabilities.length / 6, 1) * 0.08,
  );
}

function capabilityDistance(capability: ProductCapability) {
  const built = STATUS_WEIGHT[capability.status];
  return CAPABILITY_MIN_RING + (1 - built) * (CAPABILITY_MAX_RING - CAPABILITY_MIN_RING);
}

function featureDistance(feature: ProductFeature) {
  const built = STATUS_WEIGHT[feature.status];
  return FEATURE_MIN_RING + (1 - built) * (FEATURE_MAX_RING - FEATURE_MIN_RING);
}

function capabilityRadius(capability: ProductCapability) {
  return 12 + capabilityUsage(capability) * 18;
}

function featureRadius(feature: ProductFeature) {
  return 4 + featureUsage(feature) * 8;
}

function domainRadius(domain: ProductDomain) {
  return 28 + domainUsage(domain) * 22;
}

function axisAngles(count: number) {
  return Array.from({ length: count }, (_, index) => (360 / count) * index);
}

function topFeatureNames(domain: ProductDomain) {
  return domain.capabilities
    .flatMap((capability) => capability.features)
    .sort((left, right) => featureUsage(right) - featureUsage(left))
    .slice(0, 3)
    .map((feature) => feature.name)
    .join(' • ');
}

function mostBuiltCapabilityName(domain: ProductDomain) {
  const sorted = [...domain.capabilities].sort(
    (left: ProductCapability, right: ProductCapability) => STATUS_WEIGHT[right.status] - STATUS_WEIGHT[left.status],
  );
  return sorted[0]?.name ?? 'None';
}

export function ProductConstellationView({ data }: { readonly data: ProductInstrumentData }) {
  const domains = data.domains.slice(0, 6);
  const domainAngles = axisAngles(Math.max(domains.length, 3));

  return (
    <section
      data-testid="product-view-constellation"
      className="overflow-hidden rounded-[2rem] border border-violet-950/70 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.16),_transparent_26%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(5,10,24,0.99))] p-6"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-300/70">
            Constellation
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">Purple domains, capability branches, feature expansion</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            Domains anchor the constellation. Capabilities branch out from those domain nodes. Features sit farther out still.
            Distance means how built something is. Bigger nodes mean heavier inferred usage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">
            Purple = domain anchors
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            Further out = less built
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            Bigger = more used
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.28fr_0.82fr]">
        <div className="rounded-[1.8rem] border border-white/8 bg-slate-950/60 p-4">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/6 bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.16),_transparent_26%),linear-gradient(180deg,_rgba(2,6,23,0.95),_rgba(8,15,34,0.99))]">
            <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="h-[46rem] w-full">
              <defs>
                <radialGradient id="domainGlow" cx="50%" cy="50%" r="65%">
                  <stop offset="0%" stopColor="rgba(168,85,247,0.34)" />
                  <stop offset="100%" stopColor="rgba(168,85,247,0)" />
                </radialGradient>
              </defs>

              <rect x="0" y="0" width={SVG_SIZE} height={SVG_SIZE} fill="transparent" />
              <circle cx={CENTER} cy={CENTER} r={DOMAIN_RING + 20} fill="url(#domainGlow)" />
              <circle cx={CENTER} cy={CENTER} r={DOMAIN_RING} fill="none" stroke="rgba(168,85,247,0.14)" />
              <circle cx={CENTER} cy={CENTER} r={CAPABILITY_MIN_RING} fill="none" stroke="rgba(148,163,184,0.1)" strokeDasharray="4 8" />
              <circle cx={CENTER} cy={CENTER} r={FEATURE_MIN_RING} fill="none" stroke="rgba(148,163,184,0.08)" strokeDasharray="4 8" />

              {domains.map((domain, domainIndex) => {
                const domainAngle = domainAngles[domainIndex] ?? 0;
                const domainPoint = polarToCartesian(domainAngle, DOMAIN_RING);
                const domainNodeRadius = domainRadius(domain);

                return (
                  <g key={domain.id}>
                    <line
                      x1={CENTER}
                      y1={CENTER}
                      x2={domainPoint.x}
                      y2={domainPoint.y}
                      stroke="rgba(168,85,247,0.24)"
                      strokeWidth="1"
                    />

                    {domain.capabilities.map((capability, capabilityIndex) => {
                      const capabilityAngle =
                        domainAngle -
                        22 +
                        (44 / Math.max(domain.capabilities.length - 1, 1)) * capabilityIndex;
                      const capabilityPoint = polarToCartesian(capabilityAngle, capabilityDistance(capability));
                      const capabilityNodeRadius = capabilityRadius(capability);
                      const capabilityMeta = PRODUCT_STATUS_META[capability.status];

                      return (
                        <g key={capability.id}>
                          <line
                            x1={domainPoint.x}
                            y1={domainPoint.y}
                            x2={capabilityPoint.x}
                            y2={capabilityPoint.y}
                            stroke="rgba(148,163,184,0.28)"
                            strokeWidth="1.4"
                          />
                          <circle
                            cx={capabilityPoint.x}
                            cy={capabilityPoint.y}
                            r={capabilityNodeRadius}
                            fill="rgba(15,23,42,0.94)"
                            stroke={
                              capability.status === 'live'
                                ? 'rgba(52,211,153,0.9)'
                                : capability.status === 'partial'
                                  ? 'rgba(56,189,248,0.9)'
                                  : capability.status === 'pilot'
                                    ? 'rgba(168,85,247,0.9)'
                                    : capability.status === 'planned'
                                      ? 'rgba(251,191,36,0.9)'
                                      : 'rgba(148,163,184,0.72)'
                            }
                            strokeWidth="2"
                          />
                          <text
                            x={capabilityPoint.x}
                            y={capabilityPoint.y + 4}
                            fill="rgba(241,245,249,0.95)"
                            fontSize="10"
                            fontWeight="700"
                            textAnchor="middle"
                          >
                            {capability.name.split(' ')[0]}
                          </text>

                          {capability.features.slice(0, 6).map((feature, featureIndex) => {
                            const featureAngle =
                              capabilityAngle -
                              16 +
                              (32 / Math.max(capability.features.slice(0, 6).length - 1, 1)) * featureIndex;
                            const featurePoint = polarToCartesian(featureAngle, featureDistance(feature));
                            const featureNodeRadius = featureRadius(feature);

                            return (
                              <g key={feature.id}>
                                <line
                                  x1={capabilityPoint.x}
                                  y1={capabilityPoint.y}
                                  x2={featurePoint.x}
                                  y2={featurePoint.y}
                                  stroke="rgba(148,163,184,0.18)"
                                  strokeWidth="1"
                                />
                                <circle
                                  cx={featurePoint.x}
                                  cy={featurePoint.y}
                                  r={featureNodeRadius}
                                  fill={
                                    feature.status === 'live'
                                      ? 'rgba(52,211,153,0.9)'
                                      : feature.status === 'partial'
                                        ? 'rgba(56,189,248,0.88)'
                                        : feature.status === 'pilot'
                                          ? 'rgba(168,85,247,0.88)'
                                          : feature.status === 'planned'
                                            ? 'rgba(251,191,36,0.88)'
                                            : 'rgba(148,163,184,0.72)'
                                  }
                                  stroke="rgba(255,255,255,0.35)"
                                  strokeWidth="1"
                                />
                              </g>
                            );
                          })}

                          <title>{`${capability.name} · ${capabilityMeta.label}`}</title>
                        </g>
                      );
                    })}

                    <circle
                      cx={domainPoint.x}
                      cy={domainPoint.y}
                      r={domainNodeRadius}
                      fill="rgba(76,29,149,0.92)"
                      stroke="rgba(196,181,253,0.92)"
                      strokeWidth="2.5"
                    />
                    <text
                      x={domainPoint.x}
                      y={domainPoint.y - 2}
                      fill="rgba(250,245,255,0.98)"
                      fontSize="14"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {domain.name.split(' ')[0]}
                    </text>
                    <text
                      x={domainPoint.x}
                      y={domainPoint.y + 16}
                      fill="rgba(221,214,254,0.86)"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {Math.round(domainUsage(domain) * 100)} use
                    </text>
                  </g>
                );
              })}

              <circle cx={CENTER} cy={CENTER} r="26" fill="rgba(15,23,42,0.96)" stroke="rgba(255,255,255,0.08)" />
              <text x={CENTER} y={CENTER - 4} fill="rgba(255,255,255,0.95)" fontSize="13" fontWeight="700" textAnchor="middle">
                Product
              </text>
              <text x={CENTER} y={CENTER + 14} fill="rgba(148,163,184,0.9)" fontSize="11" textAnchor="middle">
                center
              </text>
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Reading rules</div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
              <p><span className="font-semibold text-violet-200">Purple nodes:</span> domains.</p>
              <p><span className="font-semibold text-white">Middle ring:</span> capabilities branching out from domains.</p>
              <p><span className="font-semibold text-white">Outer ring:</span> features extending beyond capabilities.</p>
              <p><span className="font-semibold text-white">Distance:</span> farther out means less built.</p>
              <p><span className="font-semibold text-white">Size:</span> larger means more inferred usage.</p>
            </div>
          </div>

          <div className="space-y-3">
            {domains.map((domain) => {
              const topNames = topFeatureNames(domain);
              return (
                <article key={domain.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-white">{domain.name}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {domain.capabilities.length} capabilities · {domain.capabilities.flatMap((capability) => capability.features).length} features
                      </div>
                    </div>
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">
                      {Math.round(domainUsage(domain) * 100)} usage
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/6 bg-black/20 p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Most built capability</div>
                      <div className="mt-2 text-sm font-semibold text-white">
                        {mostBuiltCapabilityName(domain)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/6 bg-black/20 p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Top feature pull</div>
                      <div className="mt-2 text-sm font-semibold text-white">{topNames || 'No features mapped'}</div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
