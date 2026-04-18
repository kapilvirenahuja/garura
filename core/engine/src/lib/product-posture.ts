import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import {
  PRODUCT_STATUSES,
  type ProductCapability,
  type ProductDomain,
  type ProductEvidence,
  type ProductFeature,
  type ProductInstrumentData,
  type ProductStatus,
  type ProductStatusCounts,
  type ProductSummary,
} from '@/lib/product-model';

interface RawPostureEntity {
  readonly id?: unknown;
  readonly name?: unknown;
  readonly description?: unknown;
  readonly status?: unknown;
  readonly capability_ids?: unknown;
  readonly feature_ids?: unknown;
  readonly domain_id?: unknown;
  readonly capability_id?: unknown;
  readonly evidence?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeStatus(raw: unknown): ProductStatus {
  return PRODUCT_STATUSES.includes(raw as ProductStatus) ? (raw as ProductStatus) : 'planned';
}

function normalizeEvidence(raw: unknown): ProductEvidence[] {
  return asArray<unknown>(raw)
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const kind = entry.kind;
      if (
        kind !== 'artifact-defined' &&
        kind !== 'manually-curated' &&
        kind !== 'signal-supported'
      ) {
        return null;
      }
      const label = asString(entry.label).trim();
      if (!label) return null;
      return {
        kind,
        label,
        ...(asString(entry.detail).trim() ? { detail: asString(entry.detail).trim() } : {}),
      } satisfies ProductEvidence;
    })
    .filter((entry): entry is ProductEvidence => entry !== null);
}

function readMarkdownArtifact(filePath: string): { frontmatter: Record<string, unknown>; body: string } | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(raw);
    return {
      frontmatter: isRecord(parsed.data) ? parsed.data : {},
      body: parsed.content.trim(),
    };
  } catch {
    return null;
  }
}

function readYamlFile(filePath: string): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = yaml.load(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function firstParagraph(markdown: string): string {
  return markdown
    .split(/\r?\n\r?\n/)
    .map((chunk) => chunk.replace(/^#+\s+/gm, '').trim())
    .find((chunk) => chunk.length > 40 && !chunk.startsWith('**Status:**'))
    ?.replace(/\s+/g, ' ')
    .slice(0, 240) ?? '';
}

function emptyStatusCounts(): ProductStatusCounts {
  return {
    live: 0,
    partial: 0,
    pilot: 0,
    planned: 0,
    dormant: 0,
  };
}

function tallyStatuses(statuses: ReadonlyArray<ProductStatus>): ProductStatusCounts {
  const counts: Record<ProductStatus, number> = {
    live: 0,
    partial: 0,
    pilot: 0,
    planned: 0,
    dormant: 0,
  };
  for (const status of statuses) counts[status] += 1;
  return counts;
}

export function loadProductInstrumentData(repoRoot: string, productBasePath: string): ProductInstrumentData {
  const posturePath = path.join(productBasePath, 'posture.yaml');
  const visionPath = path.join(productBasePath, 'vision.md');
  const roadmapPath = path.join(productBasePath, 'roadmap.md');
  const engineeringPath = path.join(productBasePath, 'roadmap-engineering.md');

  const rawPosture = readYamlFile(posturePath) ?? {};
  const vision = readMarkdownArtifact(visionPath);

  const productBlock = isRecord(rawPosture.product) ? rawPosture.product : {};
  const sourceArtifacts = [visionPath, roadmapPath, engineeringPath, posturePath]
    .filter((filePath) => fs.existsSync(filePath))
    .map((filePath) => path.relative(repoRoot, filePath));

  const summary: ProductSummary = {
    name:
      asString(productBlock.name).trim() ||
      asString(vision?.frontmatter.product).trim() ||
      asString(vision?.frontmatter.title).trim() ||
      'Untitled Product',
    slug:
      asString(productBlock.slug).trim() ||
      asString(vision?.frontmatter.slug).trim() ||
      'product',
    headline:
      asString(productBlock.headline).trim() ||
      'Fused product posture from curated artifacts, ready for future signal enrichment.',
    description:
      asString(productBlock.description).trim() ||
      firstParagraph(vision?.body ?? '') ||
      'No product summary is available yet. Add `.garura/product/posture.yaml` and supporting product artifacts to enrich this surface.',
    sourceArtifacts,
  };

  const features: ProductFeature[] = [];
  for (const entry of asArray<unknown>(rawPosture.features)) {
    if (!isRecord(entry)) continue;
    const rawFeature = entry as RawPostureEntity;
    const id = asString(rawFeature.id).trim();
    const name = asString(rawFeature.name).trim();
    const capabilityId = asString(rawFeature.capability_id).trim();
    if (!id || !name || !capabilityId) continue;
    features.push({
      id,
      name,
      capabilityId,
      description: asString(rawFeature.description).trim(),
      status: normalizeStatus(rawFeature.status),
      evidence: normalizeEvidence(rawFeature.evidence),
    });
  }

  const featuresByCapability = new Map<string, ProductFeature[]>();
  for (const feature of features) {
    const list = featuresByCapability.get(feature.capabilityId) ?? [];
    list.push(feature);
    featuresByCapability.set(feature.capabilityId, list);
  }

  const capabilities: ProductCapability[] = [];
  for (const entry of asArray<unknown>(rawPosture.capabilities)) {
    if (!isRecord(entry)) continue;
    const rawCapability = entry as RawPostureEntity;
    const id = asString(rawCapability.id).trim();
    const name = asString(rawCapability.name).trim();
    const domainId = asString(rawCapability.domain_id).trim();
    if (!id || !name || !domainId) continue;
    const resolvedFeatures = featuresByCapability.get(id) ?? [];
    const declaredFeatureIds = asArray<string>(rawCapability.feature_ids)
      .map((value) => asString(value).trim())
      .filter(Boolean);
    capabilities.push({
      id,
      name,
      domainId,
      description: asString(rawCapability.description).trim(),
      status: normalizeStatus(rawCapability.status),
      featureIds:
        declaredFeatureIds.length > 0
          ? declaredFeatureIds
          : resolvedFeatures.map((feature) => feature.id),
      evidence: normalizeEvidence(rawCapability.evidence),
      features: resolvedFeatures,
    });
  }

  const capabilitiesByDomain = new Map<string, ProductCapability[]>();
  for (const capability of capabilities) {
    const list = capabilitiesByDomain.get(capability.domainId) ?? [];
    list.push(capability);
    capabilitiesByDomain.set(capability.domainId, list);
  }

  const domains: ProductDomain[] = [];
  for (const entry of asArray<unknown>(rawPosture.domains)) {
    if (!isRecord(entry)) continue;
    const rawDomain = entry as RawPostureEntity;
    const id = asString(rawDomain.id).trim();
    const name = asString(rawDomain.name).trim();
    if (!id || !name) continue;
    const resolvedCapabilities = capabilitiesByDomain.get(id) ?? [];
    const declaredCapabilityIds = asArray<string>(rawDomain.capability_ids)
      .map((value) => asString(value).trim())
      .filter(Boolean);
    domains.push({
      id,
      name,
      description: asString(rawDomain.description).trim(),
      status: normalizeStatus(rawDomain.status),
      capabilityIds:
        declaredCapabilityIds.length > 0
          ? declaredCapabilityIds
          : resolvedCapabilities.map((capability) => capability.id),
      evidence: normalizeEvidence(rawDomain.evidence),
      capabilities: resolvedCapabilities,
    });
  }

  const allStatuses: ProductStatus[] = [
    ...domains.map((entry) => entry.status),
    ...capabilities.map((entry) => entry.status),
    ...features.map((entry) => entry.status),
  ];
  const coverageGaps: string[] = [];

  if (domains.length === 0) coverageGaps.push('No curated domains are defined in posture.yaml yet.');
  if (capabilities.some((entry) => !domains.some((domain) => domain.id === entry.domainId))) {
    coverageGaps.push('One or more capabilities reference a missing domain.');
  }
  if (features.some((entry) => !capabilities.some((capability) => capability.id === entry.capabilityId))) {
    coverageGaps.push('One or more features reference a missing capability.');
  }
  if (domains.some((entry) => entry.capabilities.length === 0)) {
    coverageGaps.push('At least one domain has no mapped capabilities yet.');
  }
  if (capabilities.some((entry) => entry.features.length === 0)) {
    coverageGaps.push('At least one capability has no mapped features yet.');
  }

  const evidence = [...domains, ...capabilities, ...features].flatMap((entry) => entry.evidence);
  const updatedAt = asString(rawPosture.updated_at).trim() || asString(vision?.frontmatter.last_updated).trim() || null;

  return {
    summary,
    updatedAt,
    statusCounts: tallyStatuses(allStatuses),
    domains,
    coverageGaps,
    signalsSummary: {
      artifactDefined: evidence.filter((entry) => entry.kind === 'artifact-defined').length,
      manuallyCurated: evidence.filter((entry) => entry.kind === 'manually-curated').length,
      signalSupported: evidence.filter((entry) => entry.kind === 'signal-supported').length,
      runtimeSignalsConnected: false,
      note: 'Runtime product signals are not wired yet. This surface is shaped to absorb OTEL and usage evidence later.',
    },
  };
}
