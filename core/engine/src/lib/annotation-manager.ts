/**
 * Garura — Annotation Manager
 *
 * Server-side module that persists narrative annotations as YAML "sidecar"
 * files alongside the source product artifacts. The sidecar is the single
 * durable record for:
 *
 *   1. User comments anchored to selected narrative text
 *      (VAL-ACTION-020, VAL-ACTION-022).
 *   2. Cached wiki-tag results so a completed `[[play:prompt]]` does not
 *      re-execute on subsequent page renders (VAL-ACTION-025) and can be
 *      overwritten on explicit re-run (VAL-ACTION-026).
 *
 * Invariants:
 *   - **Source artifacts are never modified.** The sidecar lives next to
 *     `features.yaml` etc. but is a separate `*.annotations.yaml` file
 *     (AGENTS.md: "annotations go to sidecar files only").
 *   - **Atomic, serialized writes.** Every mutation goes through a
 *     per-path mutex and a `write-temp → fs.rename` pattern so two
 *     simultaneous SSE completions cannot corrupt the sidecar
 *     (VAL-ACTION-033).
 *   - **Author from `git config user.name`** — resolved once per process
 *     via simple-git, cached in memory, with graceful fallbacks for
 *     non-git environments (VAL-ACTION-021).
 *   - **Graceful on missing/malformed files** — matching the broader
 *     parser contract, a missing/malformed sidecar returns an empty list
 *     instead of throwing.
 *
 * Sidecar schema (version 1):
 *
 *   version: 1
 *   context: E1
 *   annotations:
 *     - id: "ann-<uuid>"
 *       type: "comment"
 *       content: "Needs clarification [[research:scope]]"
 *       author: "Alice"
 *       timestamp: "2026-04-18T10:00:00.000Z"
 *       position:
 *         sectionId: "overview"
 *         selectedText: "encompasses 3 features"
 *         offsetStart: 42
 *         offsetEnd: 66
 *     - id: "wtc-research-abc123"
 *       type: "wiki-tag-cache"
 *       content: "Result text captured from SSE stream."
 *       author: "Alice"
 *       timestamp: "2026-04-18T10:05:12.000Z"
 *       position:
 *         play: "research"
 *         prompt: "scope"
 *
 * Fulfills: VAL-ACTION-020, VAL-ACTION-021, VAL-ACTION-022 (storage layer),
 *           VAL-ACTION-025, VAL-ACTION-026, VAL-ACTION-033.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import yaml from 'js-yaml';
import { simpleGit } from 'simple-git';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnnotationType = 'comment' | 'wiki-tag-cache';

/** Position reference anchoring an annotation within the narrative view. */
export interface AnnotationPosition {
  /** Narrative section id this annotation is anchored to (if any). */
  readonly sectionId?: string;
  /** Cross-reference id this annotation is anchored to (if any). */
  readonly refId?: string;
  /** Literal text selected by the user at the time of annotation. */
  readonly selectedText?: string;
  /** Character offset of the start of the selection within the section. */
  readonly offsetStart?: number;
  /** Character offset of the end of the selection within the section. */
  readonly offsetEnd?: number;
  /** Play name — present only on `wiki-tag-cache` annotations. */
  readonly play?: string;
  /** Prompt — present only on `wiki-tag-cache` annotations. */
  readonly prompt?: string;
}

export interface Annotation {
  /** Stable identifier (UUID for comments, derived hash for wiki-tag cache). */
  readonly id: string;
  readonly type: AnnotationType;
  /** User-entered comment OR captured wiki-tag result text. */
  readonly content: string;
  /** Resolved via `git config user.name` at write time. */
  readonly author: string;
  /** ISO-8601 timestamp. */
  readonly timestamp: string;
  readonly position: AnnotationPosition;
}

export interface SidecarFile {
  readonly version: 1;
  readonly context: string;
  readonly annotations: ReadonlyArray<Annotation>;
}

// ---------------------------------------------------------------------------
// Sidecar path resolution
// ---------------------------------------------------------------------------

/**
 * Derive the absolute path to the annotation sidecar for a given narrative
 * context. Sidecars live under `{productBasePath}/narrative-{context}.annotations.yaml`
 * so they are filesystem-adjacent to the source product artifacts — matching
 * the "YAML sidecar files alongside source artifacts" contract in
 * VAL-ACTION-020 without ever touching the source files themselves.
 *
 * The context is normalised to a filesystem-safe slug — letters, digits,
 * dashes and underscores only — so odd URL values can never produce
 * traversal paths (e.g. `../../etc/passwd`).
 */
export function sidecarPathForContext(productBasePath: string, context: string): string {
  const safe = sanitizeContextSlug(context);
  return path.join(productBasePath, `narrative-${safe}.annotations.yaml`);
}

/** Normalise an arbitrary context identifier into a filesystem-safe slug. */
export function sanitizeContextSlug(context: string): string {
  const trimmed = context.trim();
  if (trimmed.length === 0) return 'default';
  const slug = trimmed
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug.length > 0 ? slug : 'default';
}

// ---------------------------------------------------------------------------
// Author resolution (VAL-ACTION-021)
// ---------------------------------------------------------------------------

let cachedAuthor: string | null = null;
let cachedAuthorRoot: string | null = null;

/**
 * Resolve the annotation author from `git config user.name`.
 *
 * Resolution order:
 *   1. `git config user.name` via simple-git at `repoRoot`.
 *   2. `GARURA_ANNOTATION_AUTHOR` env override (test hook).
 *   3. `USER` / `USERNAME` env vars.
 *   4. Literal `"Anonymous"` fallback.
 *
 * The resolved value is cached per repo root for the lifetime of the
 * process — re-resolving on every annotation write would add tens of
 * milliseconds to every mutation without benefit because a worker's git
 * identity does not change mid-session. Tests can reset the cache via
 * {@link resetAuthorCacheForTesting}.
 */
export async function resolveAuthor(repoRoot: string): Promise<string> {
  // Explicit test/env override beats cache — lets a test change identity
  // without needing to poke private state.
  const envOverride = process.env.GARURA_ANNOTATION_AUTHOR;
  if (envOverride && envOverride.trim().length > 0) {
    return envOverride.trim();
  }

  if (cachedAuthor !== null && cachedAuthorRoot === repoRoot) {
    return cachedAuthor;
  }

  let resolved: string | null = null;
  try {
    const git = simpleGit(repoRoot);
    const isRepo = await git.checkIsRepo();
    if (isRepo) {
      const value = (await git.raw(['config', 'user.name'])).trim();
      if (value.length > 0) resolved = value;
    }
  } catch {
    // Ignore — fall through to env vars.
  }
  if (!resolved) {
    const fromEnv = process.env.USER ?? process.env.USERNAME;
    if (fromEnv && fromEnv.trim().length > 0) resolved = fromEnv.trim();
  }
  if (!resolved) resolved = 'Anonymous';

  cachedAuthor = resolved;
  cachedAuthorRoot = repoRoot;
  return resolved;
}

/** Test-only hook to reset the cached author. */
export function resetAuthorCacheForTesting(): void {
  cachedAuthor = null;
  cachedAuthorRoot = null;
}

// ---------------------------------------------------------------------------
// Read path
// ---------------------------------------------------------------------------

/**
 * Read and parse a sidecar file. Missing / empty / malformed files all
 * resolve to a fresh empty container so callers never have to branch on
 * the `"does the sidecar exist yet?"` question.
 */
export async function readSidecar(sidecarPath: string, context: string): Promise<SidecarFile> {
  try {
    const raw = await fsp.readFile(sidecarPath, 'utf-8');
    if (raw.trim().length === 0) return emptySidecar(context);
    const parsed = yaml.load(raw) as unknown;
    return normaliseSidecar(parsed, context);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException | null)?.code;
    if (code === 'ENOENT') return emptySidecar(context);
    // Malformed YAML / other unexpected read error → treat as empty so
    // the UI stays usable; the failure is logged for operators.
    console.warn(
      `[annotation-manager] failed to read sidecar ${sidecarPath}: ${
        err instanceof Error ? err.message : String(err)
      } — treating as empty`,
    );
    return emptySidecar(context);
  }
}

function emptySidecar(context: string): SidecarFile {
  return { version: 1, context, annotations: [] };
}

function normaliseSidecar(raw: unknown, context: string): SidecarFile {
  if (!raw || typeof raw !== 'object') return emptySidecar(context);
  const obj = raw as Record<string, unknown>;
  const rawAnns = Array.isArray(obj.annotations) ? obj.annotations : [];
  const annotations: Annotation[] = [];
  for (const entry of rawAnns) {
    const ann = coerceAnnotation(entry);
    if (ann) annotations.push(ann);
  }
  const ctx = typeof obj.context === 'string' && obj.context.length > 0 ? obj.context : context;
  return { version: 1, context: ctx, annotations };
}

function coerceAnnotation(raw: unknown): Annotation | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === 'string' ? obj.id : '';
  const typeStr = typeof obj.type === 'string' ? obj.type : '';
  const type: AnnotationType =
    typeStr === 'wiki-tag-cache' ? 'wiki-tag-cache' : typeStr === 'comment' ? 'comment' : 'comment';
  const content = typeof obj.content === 'string' ? obj.content : '';
  const author = typeof obj.author === 'string' ? obj.author : 'Anonymous';
  const timestamp = typeof obj.timestamp === 'string' ? obj.timestamp : new Date().toISOString();
  if (!id) return null;
  const pos = (obj.position ?? {}) as Record<string, unknown>;
  const position: AnnotationPosition = {
    sectionId: typeof pos.sectionId === 'string' ? pos.sectionId : undefined,
    refId: typeof pos.refId === 'string' ? pos.refId : undefined,
    selectedText: typeof pos.selectedText === 'string' ? pos.selectedText : undefined,
    offsetStart: typeof pos.offsetStart === 'number' ? pos.offsetStart : undefined,
    offsetEnd: typeof pos.offsetEnd === 'number' ? pos.offsetEnd : undefined,
    play: typeof pos.play === 'string' ? pos.play : undefined,
    prompt: typeof pos.prompt === 'string' ? pos.prompt : undefined,
  };
  return { id, type, content, author, timestamp, position };
}

// ---------------------------------------------------------------------------
// Write path — serialized + atomic (VAL-ACTION-033)
// ---------------------------------------------------------------------------

/**
 * Per-path mutex map. Each sidecar path has its own promise chain; a new
 * write awaits the tail of the chain before touching disk, so simultaneous
 * callers are serialised into a well-defined order. Using an in-memory
 * promise chain (rather than a filesystem lockfile) is safe because the
 * MDB dev server is a single Node process — there is no cross-process
 * writer competing with us.
 */
const writeQueues = new Map<string, Promise<unknown>>();

function enqueueWrite<T>(sidecarPath: string, task: () => Promise<T>): Promise<T> {
  const prev = writeQueues.get(sidecarPath) ?? Promise.resolve();
  // Chain the new task after the current tail, but swallow any error from
  // the previous task so our new task always runs.
  const next = prev.catch(() => undefined).then(task);
  // Store the sanitised tail so a rejected task does not permanently
  // poison the queue for later callers.
  writeQueues.set(
    sidecarPath,
    next.catch(() => undefined),
  );
  return next;
}

/**
 * Write the full sidecar file atomically:
 *   1. Serialise YAML.
 *   2. Write to a unique sibling temp file.
 *   3. `fs.rename` the temp file over the target — POSIX-atomic.
 *
 * Rename is atomic on the same filesystem, so readers never see a
 * partially-written file regardless of timing.
 */
async function writeSidecarAtomic(sidecarPath: string, data: SidecarFile): Promise<void> {
  const dir = path.dirname(sidecarPath);
  await fsp.mkdir(dir, { recursive: true });
  const body = yaml.dump(
    {
      version: data.version,
      context: data.context,
      annotations: data.annotations.map((a) => ({
        id: a.id,
        type: a.type,
        content: a.content,
        author: a.author,
        timestamp: a.timestamp,
        position: pruneUndefined({ ...a.position }),
      })),
    },
    { lineWidth: 120, noRefs: true, sortKeys: false },
  );
  const tmp = `${sidecarPath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fsp.writeFile(tmp, body, 'utf-8');
  try {
    await fsp.rename(tmp, sidecarPath);
  } catch (err) {
    // Clean up temp if rename failed.
    try {
      await fsp.unlink(tmp);
    } catch {
      /* ignore */
    }
    throw err;
  }
}

function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Public mutation API
// ---------------------------------------------------------------------------

/** Input for {@link appendAnnotation}. */
export interface AppendAnnotationInput {
  readonly sidecarPath: string;
  readonly context: string;
  readonly content: string;
  readonly author: string;
  readonly position: AnnotationPosition;
  /** Optional explicit id — defaults to `ann-<uuid>`. */
  readonly id?: string;
  /** Optional explicit timestamp — defaults to `new Date().toISOString()`. */
  readonly timestamp?: string;
  /** Annotation type — defaults to `comment`. */
  readonly type?: AnnotationType;
}

/**
 * Append a new annotation to a sidecar. Safe to call concurrently — the
 * per-path write queue guarantees serialised application of mutations
 * (VAL-ACTION-033).
 */
export async function appendAnnotation(input: AppendAnnotationInput): Promise<Annotation> {
  const ann: Annotation = {
    id: input.id ?? `ann-${crypto.randomUUID()}`,
    type: input.type ?? 'comment',
    content: input.content,
    author: input.author,
    timestamp: input.timestamp ?? new Date().toISOString(),
    position: input.position,
  };
  await enqueueWrite(input.sidecarPath, async () => {
    const current = await readSidecar(input.sidecarPath, input.context);
    const next: SidecarFile = {
      version: 1,
      context: current.context,
      annotations: [...current.annotations, ann],
    };
    await writeSidecarAtomic(input.sidecarPath, next);
  });
  return ann;
}

/** Input for {@link upsertWikiTagCache}. */
export interface UpsertWikiTagCacheInput {
  readonly sidecarPath: string;
  readonly context: string;
  readonly play: string;
  readonly prompt: string;
  readonly result: string;
  readonly author: string;
  readonly sectionId?: string;
}

/**
 * Stable id for a wiki-tag cache entry. Two completions of the *same*
 * `(context, play, prompt)` target the same entry so a re-run physically
 * overwrites the prior record rather than appending a duplicate row
 * (VAL-ACTION-025 / VAL-ACTION-026).
 */
export function wikiTagCacheId(context: string, play: string, prompt: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(context + '\0' + play + '\0' + prompt);
  return `wtc-${hash.digest('hex').slice(0, 24)}`;
}

/**
 * Persist (or overwrite) a cached wiki-tag result in the sidecar. Returns
 * the stored annotation so the caller can echo the canonical record back
 * to the client.
 */
export async function upsertWikiTagCache(input: UpsertWikiTagCacheInput): Promise<Annotation> {
  const id = wikiTagCacheId(input.context, input.play, input.prompt);
  const ann: Annotation = {
    id,
    type: 'wiki-tag-cache',
    content: input.result,
    author: input.author,
    timestamp: new Date().toISOString(),
    position: {
      play: input.play,
      prompt: input.prompt,
      sectionId: input.sectionId,
    },
  };
  await enqueueWrite(input.sidecarPath, async () => {
    const current = await readSidecar(input.sidecarPath, input.context);
    const withoutPrior = current.annotations.filter((a) => a.id !== id);
    const next: SidecarFile = {
      version: 1,
      context: current.context,
      annotations: [...withoutPrior, ann],
    };
    await writeSidecarAtomic(input.sidecarPath, next);
  });
  return ann;
}

/**
 * Delete an annotation by id. Missing ids are a no-op so repeated delete
 * requests are idempotent. Returns true when an annotation was removed.
 */
export async function deleteAnnotation(
  sidecarPath: string,
  context: string,
  id: string,
): Promise<boolean> {
  let removed = false;
  await enqueueWrite(sidecarPath, async () => {
    const current = await readSidecar(sidecarPath, context);
    const filtered = current.annotations.filter((a) => a.id !== id);
    if (filtered.length === current.annotations.length) return;
    removed = true;
    const next: SidecarFile = {
      version: 1,
      context: current.context,
      annotations: filtered,
    };
    await writeSidecarAtomic(sidecarPath, next);
  });
  return removed;
}

// ---------------------------------------------------------------------------
// View helpers — consumed by API routes and components
// ---------------------------------------------------------------------------

/** Extract the subset of annotations that are user comments. */
export function selectComments(sidecar: SidecarFile): ReadonlyArray<Annotation> {
  return sidecar.annotations.filter((a) => a.type === 'comment');
}

/** Build a `{play}::{prompt}` → result lookup map for wiki-tag hydration. */
export function buildWikiTagCacheLookup(
  sidecar: SidecarFile,
): ReadonlyMap<string, { annotation: Annotation; result: string }> {
  const out = new Map<string, { annotation: Annotation; result: string }>();
  for (const ann of sidecar.annotations) {
    if (ann.type !== 'wiki-tag-cache') continue;
    const { play, prompt } = ann.position;
    if (typeof play !== 'string' || typeof prompt !== 'string') continue;
    out.set(wikiTagCacheLookupKey(play, prompt), { annotation: ann, result: ann.content });
  }
  return out;
}

/** The shared `{play}::{prompt}` key used for wiki-tag cache lookup. */
export function wikiTagCacheLookupKey(play: string, prompt: string): string {
  return `${play}::${prompt}`;
}

// ---------------------------------------------------------------------------
// Test-only helpers
// ---------------------------------------------------------------------------

/** Clear all in-memory write queues. Useful in test setup/teardown. */
export function resetWriteQueuesForTesting(): void {
  writeQueues.clear();
}

/** Synchronously read a sidecar — used by tests to inspect on-disk state. */
export function readSidecarSync(sidecarPath: string, context: string): SidecarFile {
  try {
    if (!fs.existsSync(sidecarPath)) return emptySidecar(context);
    const raw = fs.readFileSync(sidecarPath, 'utf-8');
    if (raw.trim().length === 0) return emptySidecar(context);
    const parsed = yaml.load(raw) as unknown;
    return normaliseSidecar(parsed, context);
  } catch {
    return emptySidecar(context);
  }
}
