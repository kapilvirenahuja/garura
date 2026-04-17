/**
 * Tests for STM evidence discovery.
 *
 * Covers recursive ingestion of nested STM evidence directories (the bug
 * fixed in fix-narrative-stm-recursive). Prior to the fix, the narrative
 * route only read the top-level files under each issue directory and missed
 * deeper layouts such as `evidence/checkpoint/planning/run-01.yaml`.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { discoverStmEvidence } from '@/lib/stm-discovery';

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'garura-stm-discovery-test-'));
}

function removeTempDir(dirPath: string): void {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function writeFile(p: string, content: string): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf-8');
}

describe('discoverStmEvidence', () => {
  let stmRoot: string;

  beforeEach(() => {
    stmRoot = createTempDir();
  });

  afterEach(() => {
    removeTempDir(stmRoot);
  });

  it('returns an empty array when the STM base path does not exist', () => {
    const missing = path.join(stmRoot, 'does-not-exist');
    const result = discoverStmEvidence(missing);
    expect(result).toEqual([]);
  });

  it('returns an empty array when the STM base path has no issue subdirectories', () => {
    // Only loose files at the root — should be ignored.
    writeFile(path.join(stmRoot, 'stray.yaml'), 'status: ok\n');
    const result = discoverStmEvidence(stmRoot);
    expect(result).toEqual([]);
  });

  it('discovers flat YAML and Markdown evidence in issue subdirectories', () => {
    const issueDir = path.join(stmRoot, 'E1-auth');
    writeFile(path.join(issueDir, 'plan.yaml'), 'status: complete\n');
    writeFile(path.join(issueDir, 'notes.md'), '# Notes\n');

    const result = discoverStmEvidence(stmRoot);
    const yamlHits = result.filter((r) => r.type === 'stm-evidence-yaml');
    const mdHits = result.filter((r) => r.type === 'stm-evidence-markdown');

    expect(yamlHits.map((r) => path.basename(r.path))).toEqual(['plan.yaml']);
    expect(mdHits.map((r) => path.basename(r.path))).toEqual(['notes.md']);
  });

  it('recursively ingests nested STM evidence subdirectories (fix-narrative-stm-recursive)', () => {
    // Layout under a single issue:
    //
    //   E1-auth/
    //     evidence/
    //       checkpoint/
    //         planning/
    //           run-01.yaml
    //         design/
    //           run-02.yml
    //     quality-check/
    //       run-03.yaml
    //     validation/
    //       result.md
    //     top-level.yaml
    const issueDir = path.join(stmRoot, 'E1-auth');
    writeFile(
      path.join(issueDir, 'evidence/checkpoint/planning/run-01.yaml'),
      'status: complete\nplay: plan\n',
    );
    writeFile(
      path.join(issueDir, 'evidence/checkpoint/design/run-02.yml'),
      'status: running\nplay: design\n',
    );
    writeFile(path.join(issueDir, 'quality-check/run-03.yaml'), 'status: pass\nissues: []\n');
    writeFile(path.join(issueDir, 'validation/result.md'), '# Validation\n');
    writeFile(path.join(issueDir, 'top-level.yaml'), 'status: ok\n');

    const result = discoverStmEvidence(stmRoot);
    const paths = result.map((r) => path.relative(stmRoot, r.path));

    // Every nested YAML/YML and Markdown file must appear.
    expect(paths).toEqual(
      expect.arrayContaining([
        path.join('E1-auth', 'evidence', 'checkpoint', 'planning', 'run-01.yaml'),
        path.join('E1-auth', 'evidence', 'checkpoint', 'design', 'run-02.yml'),
        path.join('E1-auth', 'quality-check', 'run-03.yaml'),
        path.join('E1-auth', 'validation', 'result.md'),
        path.join('E1-auth', 'top-level.yaml'),
      ]),
    );

    // Types are correctly classified.
    for (const hit of result) {
      if (hit.path.endsWith('.md')) {
        expect(hit.type).toBe('stm-evidence-markdown');
      } else {
        expect(hit.type).toBe('stm-evidence-yaml');
      }
    }
  });

  it('ignores non-YAML/non-Markdown files at any depth', () => {
    const issueDir = path.join(stmRoot, 'E2-payments');
    writeFile(path.join(issueDir, 'evidence/log.txt'), 'noise\n');
    writeFile(path.join(issueDir, 'evidence/nested/screenshot.png'), 'noise\n');
    writeFile(path.join(issueDir, 'evidence/nested/run.yaml'), 'status: complete\n');

    const result = discoverStmEvidence(stmRoot);
    expect(result.map((r) => path.basename(r.path))).toEqual(['run.yaml']);
    expect(result[0]?.type).toBe('stm-evidence-yaml');
  });

  it('walks multiple issue directories independently', () => {
    writeFile(path.join(stmRoot, 'E1-auth/evidence/a/first.yaml'), 'status: complete\n');
    writeFile(path.join(stmRoot, 'E2-payments/evidence/b/second.yaml'), 'status: complete\n');

    const result = discoverStmEvidence(stmRoot);
    const relPaths = result.map((r) => path.relative(stmRoot, r.path)).sort();
    expect(relPaths).toEqual(
      [
        path.join('E1-auth', 'evidence', 'a', 'first.yaml'),
        path.join('E2-payments', 'evidence', 'b', 'second.yaml'),
      ].sort(),
    );
  });
});
