import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductPage from '@/app/product/page';

const mockPathname = vi.fn<() => string>().mockReturnValue('/product');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => mockPathname(),
  useSearchParams: () => new URLSearchParams(),
}));

const PRODUCT_RESPONSE = {
  summary: {
    name: 'Garura',
    slug: 'garura',
    description: 'Product posture for AI-assisted engineering.',
    headline: 'Curated product posture',
    sourceArtifacts: ['.garura/product/vision.md', '.garura/product/posture.yaml'],
  },
  updatedAt: '2026-04-18',
  statusCounts: { live: 2, partial: 3, pilot: 1, planned: 4, dormant: 0 },
  coverageGaps: ['At least one capability has no mapped features yet.'],
  signalsSummary: {
    artifactDefined: 5,
    manuallyCurated: 7,
    signalSupported: 0,
    runtimeSignalsConnected: false,
    note: 'Signals are reserved for OTEL later.',
  },
  domains: [
    {
      id: 'context',
      name: 'Context Continuity',
      description: 'Durable memory and session awareness.',
      status: 'partial',
      capabilityIds: ['memory'],
      evidence: [],
      capabilities: [
        {
          id: 'memory',
          name: 'Project Memory',
          description: 'Project and issue memory surfaces.',
          status: 'partial',
          featureIds: ['ltm', 'stm'],
          evidence: [],
          features: [
            {
              id: 'ltm',
              name: 'LTM Store',
              capabilityId: 'memory',
              description: '',
              status: 'live',
              evidence: [],
            },
            {
              id: 'stm',
              name: 'STM Store',
              capabilityId: 'memory',
              description: '',
              status: 'pilot',
              evidence: [],
            },
          ],
        },
      ],
    },
  ],
};

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(global, 'fetch').mockImplementation((input: string | URL | Request) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url === '/api/product') {
      return Promise.resolve(
        new Response(JSON.stringify(PRODUCT_RESPONSE), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProductPage', () => {
  it('renders the product instrument with fetched posture data', async () => {
    render(<ProductPage />);
    expect(screen.getByTestId('product-view')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Garura')).toBeInTheDocument();
    });
    expect(screen.getByTestId('product-view-constellation')).toBeInTheDocument();
  });

  it('switches concepts inline without changing the underlying data', async () => {
    render(<ProductPage />);
    await waitFor(() => {
      expect(screen.getByText('Garura')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('product-concept-story-canvas'));
    expect(screen.getByTestId('product-view-story-canvas')).toBeInTheDocument();
  });

  it('persists the selected concept in localStorage', async () => {
    render(<ProductPage />);
    await waitFor(() => {
      expect(screen.getByText('Garura')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('product-concept-story-canvas'));
    expect(window.localStorage.getItem('mdb:product:concept')).toBe('story-canvas');
  });
});
