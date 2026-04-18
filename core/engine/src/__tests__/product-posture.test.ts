import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadProductInstrumentData } from '@/lib/product-posture';

const tempDirs: string[] = [];

function makeProductDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'garura-product-posture-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('loadProductInstrumentData', () => {
  it('loads posture hierarchy and nests domains, capabilities, and features', () => {
    const productDir = makeProductDir();
    fs.writeFileSync(
      path.join(productDir, 'posture.yaml'),
      `
product:
  name: Garura
  slug: garura
  headline: Product posture lens
domains:
  - id: orchestration
    name: Workflow Orchestration
    status: pilot
    capability_ids: [plays]
capabilities:
  - id: plays
    domain_id: orchestration
    name: Play Engine
    status: partial
    feature_ids: [headless-run]
features:
  - id: headless-run
    capability_id: plays
    name: Headless discover-product
    status: live
updated_at: 2026-04-18
`,
    );
    fs.writeFileSync(
      path.join(productDir, 'vision.md'),
      `---
product: Garura
slug: garura
last_updated: 2026-04-16
---

# Vision

Garura turns product artifacts into a reusable operating layer for AI-assisted engineering.
`,
    );

    const data = loadProductInstrumentData(productDir, productDir);

    expect(data.summary.name).toBe('Garura');
    expect(data.domains).toHaveLength(1);
    expect(data.domains[0]?.capabilities).toHaveLength(1);
    expect(data.domains[0]?.capabilities[0]?.features).toHaveLength(1);
    expect(data.statusCounts.live).toBe(1);
    expect(data.statusCounts.partial).toBe(1);
    expect(data.statusCounts.pilot).toBe(1);
  });

  it('falls back safely when statuses are invalid and reports coverage gaps', () => {
    const productDir = makeProductDir();
    fs.writeFileSync(
      path.join(productDir, 'posture.yaml'),
      `
domains:
  - id: strategy
    name: Strategy
    status: not-real
capabilities:
  - id: roadmap
    domain_id: missing-domain
    name: Roadmap Synthesis
    status: unknown
features:
  - id: engineering-view
    capability_id: roadmap
    name: Engineering View
    status: wrong
`,
    );

    const data = loadProductInstrumentData(productDir, productDir);

    expect(data.domains[0]?.status).toBe('planned');
    expect(data.coverageGaps).toContain('One or more capabilities reference a missing domain.');
    expect(data.statusCounts.planned).toBeGreaterThanOrEqual(3);
  });
});
