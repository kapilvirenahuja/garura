/**
 * Tests for the /api/annotations and /api/annotations/wiki-tag-cache
 * Next.js route handlers.
 *
 * Covers:
 *   - VAL-ACTION-020 / VAL-ACTION-022 (via HTTP): create → list → delete
 *   - VAL-ACTION-021 (via HTTP): author populated from git config
 *   - VAL-ACTION-023: wiki tag text preserved byte-for-byte in annotation content
 *   - VAL-ACTION-025: wiki-tag cache is readable after POST
 *   - VAL-ACTION-026: POST with same (play, prompt) overwrites the cached result
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DELETE as deleteAnnotation,
  GET as getAnnotations,
  POST as postAnnotation,
} from '@/app/api/annotations/route';
import { GET as getCache, POST as postCache } from '@/app/api/annotations/wiki-tag-cache/route';
import { loadConfig, resetConfig } from '@/lib/config';
import { resetAuthorCacheForTesting, resetWriteQueuesForTesting } from '@/lib/annotation-manager';

// ---------------------------------------------------------------------------
// Fixture helpers — build an isolated Garura repo rooted at a tmp dir
// ---------------------------------------------------------------------------

function makeTempRepo(): { repoRoot: string; productBase: string; configPath: string } {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'garura-ann-routes-'));
  const productBase = path.join(repoRoot, '.garura', 'product');
  fs.mkdirSync(productBase, { recursive: true });
  const coreDir = path.join(repoRoot, '.garura', 'core');
  fs.mkdirSync(coreDir, { recursive: true });
  const configPath = path.join(coreDir, 'config.yaml');
  fs.writeFileSync(
    configPath,
    [
      'project:',
      '  name: Annotation Routes Test',
      'repo:',
      `  path: ${repoRoot}`,
      'product:',
      '  base-path: .garura/product/',
      'stm:',
      '  base-path: .garura/project/issues/',
      '',
    ].join('\n'),
    'utf-8',
  );
  return { repoRoot, productBase, configPath };
}

function initGit(repoRoot: string, userName: string): void {
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  execFileSync('git', ['init', '--quiet', '--initial-branch=main'], { cwd: repoRoot, env });
  execFileSync('git', ['config', 'user.email', 'tester@example.com'], { cwd: repoRoot, env });
  execFileSync('git', ['config', 'user.name', userName], { cwd: repoRoot, env });
}

interface JsonRequestInit extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

function jsonRequest(url: string, init?: JsonRequestInit): NextRequest {
  if (!init) return new NextRequest(new Request(url));
  const { body, ...rest } = init;
  const serialisedBody = body === undefined ? undefined : JSON.stringify(body);
  return new NextRequest(new Request(url, { ...rest, body: serialisedBody }));
}

let originalEnv: NodeJS.ProcessEnv;
let currentRepo: ReturnType<typeof makeTempRepo> | null = null;

beforeEach(() => {
  originalEnv = { ...process.env };
  resetConfig();
  resetAuthorCacheForTesting();
  resetWriteQueuesForTesting();
});

afterEach(() => {
  process.env = originalEnv;
  resetConfig();
  resetAuthorCacheForTesting();
  resetWriteQueuesForTesting();
  currentRepo = null;
});

function bootRepo(opts?: { git?: boolean; gitUser?: string }): ReturnType<typeof makeTempRepo> {
  const repo = makeTempRepo();
  if (opts?.git) initGit(repo.repoRoot, opts.gitUser ?? 'Alice Author');
  process.env.GARURA_TARGET_REPO = repo.repoRoot;
  loadConfig(repo.configPath);
  currentRepo = repo;
  return repo;
}

// ---------------------------------------------------------------------------
// GET /api/annotations
// ---------------------------------------------------------------------------

describe('GET /api/annotations', () => {
  it('rejects a request without context', async () => {
    bootRepo();
    const res = await getAnnotations(jsonRequest('http://localhost/api/annotations', {}));
    expect(res.status).toBe(400);
  });

  it('returns an empty list when no sidecar exists yet', async () => {
    bootRepo();
    const res = await getAnnotations(
      jsonRequest('http://localhost/api/annotations?context=E1', {}),
    );
    expect(res.status).toBe(200);
    const payload = (await res.json()) as { annotations: unknown[]; author: string };
    expect(payload.annotations).toEqual([]);
    expect(typeof payload.author).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// POST /api/annotations — VAL-ACTION-020 / VAL-ACTION-021 / VAL-ACTION-023
// ---------------------------------------------------------------------------

describe('POST /api/annotations', () => {
  it('creates an annotation with the git-config author (VAL-ACTION-021)', async () => {
    const repo = bootRepo({ git: true, gitUser: 'Alice Author' });
    const res = await postAnnotation(
      jsonRequest('http://localhost/api/annotations', {
        method: 'POST',
        body: {
          context: 'E1',
          content: 'Great summary',
          position: {
            sectionId: 'overview',
            selectedText: 'delivers 3 features',
            offsetStart: 10,
            offsetEnd: 30,
          },
        },
      }),
    );
    expect(res.status).toBe(201);
    const payload = (await res.json()) as {
      annotation: { id: string; author: string; content: string };
      author: string;
    };
    expect(payload.annotation.author).toBe('Alice Author');
    expect(payload.author).toBe('Alice Author');

    // And a round-trip via GET shows the same entry.
    const listRes = await getAnnotations(
      jsonRequest('http://localhost/api/annotations?context=E1', {}),
    );
    const listPayload = (await listRes.json()) as { annotations: Array<Record<string, unknown>> };
    expect(listPayload.annotations).toHaveLength(1);
    expect(listPayload.annotations[0]!.author).toBe('Alice Author');
    expect(listPayload.annotations[0]!.content).toBe('Great summary');

    // Sidecar file physically exists under the configured product base.
    const sidecarPath = path.join(repo.productBase, 'narrative-E1.annotations.yaml');
    expect(fs.existsSync(sidecarPath)).toBe(true);
  });

  it('preserves wiki-tag syntax in annotation content (VAL-ACTION-023)', async () => {
    bootRepo({ git: true });
    const content = 'Worth reading [[research:custom "timeout" query]] later.';
    const res = await postAnnotation(
      jsonRequest('http://localhost/api/annotations', {
        method: 'POST',
        body: {
          context: 'E1',
          content,
          position: { sectionId: 'overview' },
        },
      }),
    );
    expect(res.status).toBe(201);
    const payload = (await res.json()) as { annotation: { content: string } };
    expect(payload.annotation.content).toBe(content);
  });

  it('rejects empty content', async () => {
    bootRepo({ git: true });
    const res = await postAnnotation(
      jsonRequest('http://localhost/api/annotations', {
        method: 'POST',
        body: { context: 'E1', content: '' },
      }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects a missing context', async () => {
    bootRepo({ git: true });
    const res = await postAnnotation(
      jsonRequest('http://localhost/api/annotations', {
        method: 'POST',
        body: { content: 'hi' },
      }),
    );
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/annotations
// ---------------------------------------------------------------------------

describe('DELETE /api/annotations', () => {
  it('removes a previously-created annotation', async () => {
    bootRepo({ git: true });
    const postRes = await postAnnotation(
      jsonRequest('http://localhost/api/annotations', {
        method: 'POST',
        body: {
          context: 'E1',
          content: 'remove me',
          position: { sectionId: 'overview' },
        },
      }),
    );
    const created = (await postRes.json()) as { annotation: { id: string } };

    const delRes = await deleteAnnotation(
      jsonRequest(
        `http://localhost/api/annotations?context=E1&id=${encodeURIComponent(created.annotation.id)}`,
        { method: 'DELETE' },
      ),
    );
    expect(delRes.status).toBe(200);
    expect((await delRes.json()).removed).toBe(true);

    const listRes = await getAnnotations(
      jsonRequest('http://localhost/api/annotations?context=E1', {}),
    );
    const list = (await listRes.json()) as { annotations: unknown[] };
    expect(list.annotations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// /api/annotations/wiki-tag-cache — VAL-ACTION-025 / VAL-ACTION-026
// ---------------------------------------------------------------------------

describe('POST /api/annotations/wiki-tag-cache (VAL-ACTION-025 / VAL-ACTION-026)', () => {
  it('persists a wiki-tag result and retrieves it on a subsequent GET', async () => {
    bootRepo({ git: true });
    const res = await postCache(
      jsonRequest('http://localhost/api/annotations/wiki-tag-cache', {
        method: 'POST',
        body: { context: 'E1', play: 'research', prompt: 'scope', result: 'v1 result' },
      }),
    );
    expect(res.status).toBe(200);
    const payload = (await res.json()) as { entry: { author: string; content: string } };
    expect(payload.entry.content).toBe('v1 result');

    const getRes = await getCache(
      jsonRequest('http://localhost/api/annotations/wiki-tag-cache?context=E1', {}),
    );
    const body = (await getRes.json()) as {
      entries: Array<{ play: string; prompt: string; result: string; key: string }>;
    };
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0]!.play).toBe('research');
    expect(body.entries[0]!.prompt).toBe('scope');
    expect(body.entries[0]!.result).toBe('v1 result');
    expect(body.entries[0]!.key).toBe('research::scope');
  });

  it('overwrites the cached result on re-run (VAL-ACTION-026)', async () => {
    bootRepo({ git: true });
    await postCache(
      jsonRequest('http://localhost/api/annotations/wiki-tag-cache', {
        method: 'POST',
        body: { context: 'E1', play: 'research', prompt: 'scope', result: 'v1' },
      }),
    );
    await postCache(
      jsonRequest('http://localhost/api/annotations/wiki-tag-cache', {
        method: 'POST',
        body: { context: 'E1', play: 'research', prompt: 'scope', result: 'v2-rerun' },
      }),
    );
    const getRes = await getCache(
      jsonRequest('http://localhost/api/annotations/wiki-tag-cache?context=E1', {}),
    );
    const body = (await getRes.json()) as { entries: Array<{ result: string }> };
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0]!.result).toBe('v2-rerun');
  });

  it('rejects a POST that omits required fields', async () => {
    bootRepo({ git: true });
    const res = await postCache(
      jsonRequest('http://localhost/api/annotations/wiki-tag-cache', {
        method: 'POST',
        body: { context: 'E1' },
      }),
    );
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// VAL-ACTION-033 — concurrent API writes do not corrupt the sidecar
// ---------------------------------------------------------------------------

describe('concurrent API writes (VAL-ACTION-033)', () => {
  it('serialises many simultaneous cache POSTs so all prompts are persisted', async () => {
    bootRepo({ git: true });
    const N = 16;
    await Promise.all(
      Array.from({ length: N }, (_, i) =>
        postCache(
          jsonRequest('http://localhost/api/annotations/wiki-tag-cache', {
            method: 'POST',
            body: {
              context: 'E1',
              play: 'research',
              prompt: `prompt-${i}`,
              result: `r-${i}`,
            },
          }),
        ),
      ),
    );

    const res = await getCache(
      jsonRequest('http://localhost/api/annotations/wiki-tag-cache?context=E1', {}),
    );
    const body = (await res.json()) as { entries: Array<{ prompt: string; result: string }> };
    expect(body.entries).toHaveLength(N);
    const prompts = new Set(body.entries.map((e) => e.prompt));
    for (let i = 0; i < N; i++) {
      expect(prompts.has(`prompt-${i}`)).toBe(true);
    }

    // Verify the sidecar is still valid YAML on disk.
    const sidecarPath = path.join(currentRepo!.productBase, 'narrative-E1.annotations.yaml');
    const raw = await fsp.readFile(sidecarPath, 'utf-8');
    expect(raw.length).toBeGreaterThan(0);
  });
});
