export const PRODUCT_STATUSES = ['live', 'partial', 'pilot', 'planned', 'dormant'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type ProductEvidenceKind = 'artifact-defined' | 'manually-curated' | 'signal-supported';
export type ProductConcept = 'constellation' | 'story-canvas';

export interface ProductEvidence {
  readonly kind: ProductEvidenceKind;
  readonly label: string;
  readonly detail?: string;
}

export interface ProductFeature {
  readonly id: string;
  readonly name: string;
  readonly capabilityId: string;
  readonly description: string;
  readonly status: ProductStatus;
  readonly evidence: ReadonlyArray<ProductEvidence>;
}

export interface ProductCapability {
  readonly id: string;
  readonly name: string;
  readonly domainId: string;
  readonly description: string;
  readonly status: ProductStatus;
  readonly featureIds: ReadonlyArray<string>;
  readonly evidence: ReadonlyArray<ProductEvidence>;
  readonly features: ReadonlyArray<ProductFeature>;
}

export interface ProductDomain {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: ProductStatus;
  readonly capabilityIds: ReadonlyArray<string>;
  readonly evidence: ReadonlyArray<ProductEvidence>;
  readonly capabilities: ReadonlyArray<ProductCapability>;
}

export interface ProductStatusCounts {
  readonly live: number;
  readonly partial: number;
  readonly pilot: number;
  readonly planned: number;
  readonly dormant: number;
}

export interface ProductSignalsSummary {
  readonly artifactDefined: number;
  readonly manuallyCurated: number;
  readonly signalSupported: number;
  readonly runtimeSignalsConnected: boolean;
  readonly note: string;
}

export interface ProductSummary {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly headline: string;
  readonly sourceArtifacts: ReadonlyArray<string>;
}

export interface ProductInstrumentData {
  readonly summary: ProductSummary;
  readonly updatedAt: string | null;
  readonly statusCounts: ProductStatusCounts;
  readonly domains: ReadonlyArray<ProductDomain>;
  readonly coverageGaps: ReadonlyArray<string>;
  readonly signalsSummary: ProductSignalsSummary;
}
