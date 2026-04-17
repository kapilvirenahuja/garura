/**
 * Tests for the annotation sidecar manager.
 *
 * Covers:
 *   - VAL-ACTION-020: sidecar YAML format with all required fields
 *   - VAL-ACTION-021: author resolved from git config user.name
 *   - VAL-ACTION-025: wiki-tag cache persisted and retrievable
 *   - VAL-ACTION-026: re-run overrides previously cached result
 *   - VAL-ACTION-033: concurrent writes are serialised without corruption
 *   - Plus graceful handling of missing/malformed sidecars and delete
 *     idempotency.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import yaml from 'js-yaml';

import {
  appendAnnotation,
  buildWikiTagCacheLookup,
  deleteAnnotation,
  readSidecar,
  readSidecarSync,
  resetAuthorCacheForTesting,
  resetWriteQueuesForTesting,
  resolveAuthor,
  sanitizeContextSlug,
  selectComments,
  sidecarPathForContext,
  upsertWikiTagCache,
  wikiTagCacheId,
  wikiTagCacheLookupKey,
} from '@/lib/annotation-manager';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir(prefix = 'garura-ann-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

async function initGitRepo(dir: string, userName: string): Promise<void> {
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  execFileSync('git', ['init', '--quiet', '--initial-branch=main'], { cwd: dir, env });
  execFileSync('git', ['config', 'user.email', 'tester@example.com'], { cwd: dir, env });
  execFileSync('git', ['config', 'user.name', userName], { cwd: dir, env });
}

beforeEach(() => {
  delete process.env.GARURA_ANNOTATION_AUTHOR;
  resetAuthorCacheForTesting();
  resetWriteQueuesForTesting();
});

afterEach(() => {
  delete process.env.GARURA_ANNOTATION_AUTHOR;
  resetAuthorCacheForTesting();
  resetWriteQueuesForTesting();
});

// ---------------------------------------------------------------------------
// sanitizeContextSlug + sidecarPathForContext
// ---------------------------------------------------------------------------

describe('sanitizeContextSlug', () => {
  it('keeps safe characters intact', () => {
    expect(sanitizeContextSlug('EPIC-E1')).toBe('EPIC-E1');
    expect(sanitizeContextSlug('E1')).toBe('E1');
    expect(sanitizeContextSlug('my_context-2')).toBe('my_context-2');
  });

  it('replaces filesystem-unsafe characters with a dash', () => {
    expect(sanitizeContextSlug('../../etc/passwd')).toBe('etc-passwd');
    expect(sanitizeContextSlug('E1/../bad')).toBe('E1-bad');
  });

  it('falls back to "default" for empty or all-unsafe input', () => {
    expect(sanitizeContextSlug('')).toBe('default');
    expect(sanitizeContextSlug('  ')).toBe('default');
    expect(sanitizeContextSlug('///')).toBe('default');
  });
});

describe('sidecarPathForContext', () => {
  it('produces a path under the product base with a safe slug', () => {
    const p = sidecarPathForContext('/tmp/product', 'E1');
    expect(p).toBe(path.join('/tmp/product', 'narrative-E1.annotations.yaml'));
  });

  it('sanitises traversal attempts', () => {
    const p = sidecarPathForContext('/tmp/product', '../../etc');
    expect(p).toBe(path.join('/tmp/product', 'narrative-etc.annotations.yaml'));
  });
});

// ---------------------------------------------------------------------------
// VAL-ACTION-020: sidecar write writes YAML with all required fields
// ---------------------------------------------------------------------------

describe('appendAnnotation (VAL-ACTION-020)', () => {
  it('writes a sidecar YAML file containing the annotation with all required fields', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');

    const ann = await appendAnnotation({
      sidecarPath,
      context: 'E1',
      content: 'Needs clarification',
      author: 'Alice',
      position: {
        sectionId: 'overview',
        selectedText: 'encompasses 3 features',
        offsetStart: 42,
        offsetEnd: 66,
      },
    });

    expect(fs.existsSync(sidecarPath)).toBe(true);
    const raw = fs.readFileSync(sidecarPath, 'utf-8');
    const parsed = yaml.load(raw) as Record<string, unknown>;
    expect(parsed.version).toBe(1);
    expect(parsed.context).toBe('E1');
    expect(Array.isArray(parsed.annotations)).toBe(true);
    const entries = parsed.annotations as Array<Record<string, unknown>>;
    expect(entries).toHaveLength(1);
    const entry = entries[0]!;
    expect(entry.id).toBe(ann.id);
    expect(entry.id).toMatch(/^ann-/);
    expect(entry.type).toBe('comment');
    expect(entry.content).toBe('Needs clarification');
    expect(entry.author).toBe('Alice');
    expect(typeof entry.timestamp).toBe('string');
    expect(new Date(entry.timestamp as string).toString()).not.toBe('Invalid Date');
    const position = entry.position as Record<string, unknown>;
    expect(position.sectionId).toBe('overview');
    expect(position.selectedText).toBe('encompasses 3 features');
    expect(position.offsetStart).toBe(42);
    expect(position.offsetEnd).toBe(66);
  });

  it('appends a second annotation without clobbering the first', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');

    await appendAnnotation({
      sidecarPath,
      context: 'E1',
      content: 'first',
      author: 'Alice',
      position: { sectionId: 'overview' },
    });
    await appendAnnotation({
      sidecarPath,
      context: 'E1',
      content: 'second',
      author: 'Bob',
      position: { sectionId: 'features' },
    });

    const loaded = await readSidecar(sidecarPath, 'E1');
    expect(loaded.annotations.map((a) => a.content)).toEqual(['first', 'second']);
    expect(loaded.annotations.map((a) => a.author)).toEqual(['Alice', 'Bob']);
  });

  it('preserves wiki tag syntax in the content verbatim (VAL-ACTION-023 storage)', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');
    await appendAnnotation({
      sidecarPath,
      context: 'E1',
      content: 'Worth investigating [[research:custom query]] for details.',
      author: 'Alice',
      position: { sectionId: 'overview' },
    });
    const loaded = await readSidecar(sidecarPath, 'E1');
    expect(loaded.annotations[0]?.content).toBe(
      'Worth investigating [[research:custom query]] for details.',
    );
  });
});

// ---------------------------------------------------------------------------
// Graceful handling of missing / malformed sidecars
// ---------------------------------------------------------------------------

describe('readSidecar — resilience', () => {
  it('returns an empty sidecar when the file does not exist', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');
    const loaded = await readSidecar(sidecarPath, 'E1');
    expect(loaded.annotations).toEqual([]);
    expect(loaded.context).toBe('E1');
    expect(loaded.version).toBe(1);
  });

  it('returns an empty sidecar when the file is empty', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');
    await fsp.writeFile(sidecarPath, '', 'utf-8');
    const loaded = await readSidecar(sidecarPath, 'E1');
    expect(loaded.annotations).toEqual([]);
  });

  it('returns an empty sidecar when the file contains malformed YAML', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');
    await fsp.writeFile(sidecarPath, '::not yaml::\n  - broken [[', 'utf-8');
    const loaded = await readSidecar(sidecarPath, 'E1');
    expect(loaded.annotations).toEqual([]);
  });

  it('skips malformed entries and keeps well-formed ones', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');
    const body = yaml.dump({
      version: 1,
      context: 'E1',
      annotations: [
        { id: '' /* missing id is rejected */ },
        {
          id: 'ann-good',
          type: 'comment',
          content: 'ok',
          author: 'Alice',
          timestamp: new Date().toISOString(),
          position: { sectionId: 'overview' },
        },
      ],
    });
    await fsp.writeFile(sidecarPath, body, 'utf-8');
    const loaded = await readSidecar(sidecarPath, 'E1');
    expect(loaded.annotations.map((a) => a.id)).toEqual(['ann-good']);
  });
});

// ---------------------------------------------------------------------------
// VAL-ACTION-021: author resolution from git config
// ---------------------------------------------------------------------------

describe('resolveAuthor (VAL-ACTION-021)', () => {
  it('returns the value of `git config user.name` when running inside a git repo', async () => {
    const dir = makeTempDir();
    await initGitRepo(dir, 'Alice Author');
    const author = await resolveAuthor(dir);
    expect(author).toBe('Alice Author');
  });

  it('falls back to process.env.USER when the directory is not a git repo', async () => {
    const dir = makeTempDir();
    process.env.USER = 'fallback-user';
    const author = await resolveAuthor(dir);
    expect(author).toBe('fallback-user');
  });

  it('honours the GARURA_ANNOTATION_AUTHOR env override even inside a git repo', async () => {
    const dir = makeTempDir();
    await initGitRepo(dir, 'Committed Name');
    process.env.GARURA_ANNOTATION_AUTHOR = 'Override Name';
    const author = await resolveAuthor(dir);
    expect(author).toBe('Override Name');
  });

  it('returns "Anonymous" when no git identity and no USER/USERNAME is set', async () => {
    const dir = makeTempDir();
    const prevUser = process.env.USER;
    const prevUserName = process.env.USERNAME;
    delete process.env.USER;
    delete process.env.USERNAME;
    try {
      const author = await resolveAuthor(dir);
      expect(author).toBe('Anonymous');
    } finally {
      if (prevUser !== undefined) process.env.USER = prevUser;
      if (prevUserName !== undefined) process.env.USERNAME = prevUserName;
    }
  });
});

// ---------------------------------------------------------------------------
// VAL-ACTION-025 / VAL-ACTION-026: wiki-tag cache
// ---------------------------------------------------------------------------

describe('upsertWikiTagCache (VAL-ACTION-025 / VAL-ACTION-026)', () => {
  it('persists a wiki-tag result and hydrates it back via the lookup helper', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');
    const ann = await upsertWikiTagCache({
      sidecarPath,
      context: 'E1',
      play: 'research',
      prompt: 'scope',
      result: 'first run result',
      author: 'Alice',
    });
    expect(ann.id).toBe(wikiTagCacheId('E1', 'research', 'scope'));
    expect(ann.type).toBe('wiki-tag-cache');

    const loaded = await readSidecar(sidecarPath, 'E1');
    const lookup = buildWikiTagCacheLookup(loaded);
    expect(lookup.get(wikiTagCacheLookupKey('research', 'scope'))?.result).toBe('first run result');
  });

  it('overrides the cached result on re-run and does NOT duplicate the entry', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');
    await upsertWikiTagCache({
      sidecarPath,
      context: 'E1',
      play: 'research',
      prompt: 'scope',
      result: 'v1',
      author: 'Alice',
    });
    await upsertWikiTagCache({
      sidecarPath,
      context: 'E1',
      play: 'research',
      prompt: 'scope',
      result: 'v2 (re-run)',
      author: 'Alice',
    });
    const loaded = await readSidecar(sidecarPath, 'E1');
    const cacheEntries = loaded.annotations.filter((a) => a.type === 'wiki-tag-cache');
    expect(cacheEntries).toHaveLength(1);
    expect(cacheEntries[0]?.content).toBe('v2 (re-run)');
  });

  it('keeps wiki-tag cache entries for different (play, prompt) pairs separate', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');
    await upsertWikiTagCache({
      sidecarPath,
      context: 'E1',
      play: 'research',
      prompt: 'scope',
      result: 'scope result',
      author: 'Alice',
    });
    await upsertWikiTagCache({
      sidecarPath,
      context: 'E1',
      play: 'research',
      prompt: 'timeline',
      result: 'timeline result',
      author: 'Alice',
    });
    const loaded = await readSidecar(sidecarPath, 'E1');
    const lookup = buildWikiTagCacheLookup(loaded);
    expect(lookup.size).toBe(2);
    expect(lookup.get(wikiTagCacheLookupKey('research', 'scope'))?.result).toBe('scope result');
    expect(lookup.get(wikiTagCacheLookupKey('research', 'timeline'))?.result).toBe(
      'timeline result',
    );
  });
});

// ---------------------------------------------------------------------------
// VAL-ACTION-033: concurrent writes
// ---------------------------------------------------------------------------

describe('concurrent writes (VAL-ACTION-033)', () => {
  it('serialises many simultaneous writes without losing or corrupting entries', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');
    const N = 24;

    const writes = Array.from({ length: N }, (_, i) =>
      appendAnnotation({
        sidecarPath,
        context: 'E1',
        content: `entry-${i}`,
        author: 'Alice',
        position: { sectionId: 'overview', offsetStart: i, offsetEnd: i + 1 },
      }),
    );

    const results = await Promise.all(writes);
    expect(new Set(results.map((r) => r.id)).size).toBe(N);

    const loaded = await readSidecar(sidecarPath, 'E1');
    expect(loaded.annotations).toHaveLength(N);
    const contents = loaded.annotations.map((a) => a.content).sort();
    const expected = Array.from({ length: N }, (_, i) => `entry-${i}`).sort();
    expect(contents).toEqual(expected);

    // YAML is still parseable — no mid-file corruption.
    const onDisk = fs.readFileSync(sidecarPath, 'utf-8');
    expect(() => yaml.load(onDisk)).not.toThrow();
  });

  it('serialises interleaved appendAnnotation + upsertWikiTagCache writes', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');
    const writes: Array<Promise<unknown>> = [];
    for (let i = 0; i < 12; i++) {
      writes.push(
        appendAnnotation({
          sidecarPath,
          context: 'E1',
          content: `c-${i}`,
          author: 'Alice',
          position: { sectionId: 'overview' },
        }),
      );
      writes.push(
        upsertWikiTagCache({
          sidecarPath,
          context: 'E1',
          play: 'research',
          prompt: `p-${i}`,
          result: `r-${i}`,
          author: 'Alice',
        }),
      );
    }
    await Promise.all(writes);
    const loaded = await readSidecar(sidecarPath, 'E1');
    // 12 comments + 12 distinct wiki-tag cache entries = 24 annotations.
    expect(loaded.annotations).toHaveLength(24);
    expect(selectComments(loaded)).toHaveLength(12);
    const cacheLookup = buildWikiTagCacheLookup(loaded);
    expect(cacheLookup.size).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// deleteAnnotation
// ---------------------------------------------------------------------------

describe('deleteAnnotation', () => {
  it('removes the targeted annotation and leaves the rest in place', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');
    const a = await appendAnnotation({
      sidecarPath,
      context: 'E1',
      content: 'keep',
      author: 'A',
      position: {},
    });
    const b = await appendAnnotation({
      sidecarPath,
      context: 'E1',
      content: 'remove',
      author: 'B',
      position: {},
    });
    const removed = await deleteAnnotation(sidecarPath, 'E1', b.id);
    expect(removed).toBe(true);
    const loaded = await readSidecar(sidecarPath, 'E1');
    expect(loaded.annotations.map((x) => x.id)).toEqual([a.id]);
  });

  it('is a no-op when the id is unknown (idempotent)', async () => {
    const dir = makeTempDir();
    const sidecarPath = sidecarPathForContext(dir, 'E1');
    await appendAnnotation({
      sidecarPath,
      context: 'E1',
      content: 'keep',
      author: 'A',
      position: {},
    });
    const removed = await deleteAnnotation(sidecarPath, 'E1', 'ann-does-not-exist');
    expect(removed).toBe(false);
    const loaded = readSidecarSync(sidecarPath, 'E1');
    expect(loaded.annotations).toHaveLength(1);
  });
});
