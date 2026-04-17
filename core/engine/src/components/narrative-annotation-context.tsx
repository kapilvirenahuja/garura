'use client';

/**
 * Narrative Annotation Context
 *
 * Shared React context that carries the annotation + wiki-tag-cache state
 * for a single narrative render. Consumers:
 *
 *   - `AnnotationLayer`  — renders the per-section comment list and the
 *                          "Add comment" composer.
 *   - `WikiTagRunner`    — seeds its initial lifecycle state from the
 *                          cache so previously-completed tags render as
 *                          `complete` without re-executing the play
 *                          (VAL-ACTION-025).
 *                          It also calls {@link NarrativeAnnotationApi.recordWikiTagResult}
 *                          on completion so a fresh execution is persisted
 *                          to the sidecar and picked up on the next render.
 *                          Re-runs POST with the same (play, prompt) so
 *                          the server physically overwrites the prior entry
 *                          (VAL-ACTION-026).
 *
 * A missing provider returns a no-op API — this keeps the `WikiTagText`
 * component usable from places that do not carry a narrative context
 * (e.g. legacy sample views, isolated tests) without crashing.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnnotationPositionShape {
  sectionId?: string;
  refId?: string;
  selectedText?: string;
  offsetStart?: number;
  offsetEnd?: number;
  play?: string;
  prompt?: string;
}

export interface AnnotationRecord {
  id: string;
  type: 'comment' | 'wiki-tag-cache';
  content: string;
  author: string;
  timestamp: string;
  position: AnnotationPositionShape;
}

export interface WikiTagCacheEntry {
  play: string;
  prompt: string;
  result: string;
  author: string;
  timestamp: string;
}

export interface NarrativeAnnotationApi {
  /** Narrative context id (e.g. `E1`). */
  context: string;
  /** Resolved author from git config — used to render the local "me" label. */
  author: string;
  /** All annotations (comments + cache) sorted as loaded. */
  annotations: ReadonlyArray<AnnotationRecord>;
  /** Just the comment annotations, for the AnnotationLayer. */
  comments: ReadonlyArray<AnnotationRecord>;
  /** Wiki-tag cache keyed by `{play}::{prompt}`. */
  wikiTagCache: ReadonlyMap<string, WikiTagCacheEntry>;
  /**
   * Whether the initial annotation fetch is still in flight. Useful for
   * SSR / first-paint guards; the UI can hide the AnnotationLayer until
   * loaded to avoid a flash of "no annotations".
   */
  loading: boolean;
  /** Add a user comment anchored at the given position. */
  addComment: (input: {
    content: string;
    position: AnnotationPositionShape;
  }) => Promise<AnnotationRecord | null>;
  /**
   * Persist a completed wiki-tag result. Same (play, prompt) on a re-run
   * overwrites the previous entry.
   */
  recordWikiTagResult: (input: {
    play: string;
    prompt: string;
    result: string;
    sectionId?: string;
  }) => Promise<void>;
  /** Refresh the annotation set from the server. */
  refresh: () => Promise<void>;
}

const noopApi: NarrativeAnnotationApi = {
  context: '',
  author: 'Anonymous',
  annotations: [],
  comments: [],
  wikiTagCache: new Map(),
  loading: false,
  async addComment() {
    return null;
  },
  async recordWikiTagResult() {
    /* no-op */
  },
  async refresh() {
    /* no-op */
  },
};

const NarrativeAnnotationContext = createContext<NarrativeAnnotationApi>(noopApi);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface NarrativeAnnotationProviderProps {
  context: string;
  children: ReactNode;
  /** Override the `/api/annotations` base path — used by tests. */
  apiBase?: string;
}

function cacheKey(play: string, prompt: string): string {
  return `${play}::${prompt}`;
}

export function NarrativeAnnotationProvider({
  context,
  children,
  apiBase = '/api/annotations',
}: NarrativeAnnotationProviderProps) {
  const [annotations, setAnnotations] = useState<ReadonlyArray<AnnotationRecord>>([]);
  const [wikiTagCache, setWikiTagCache] = useState<ReadonlyMap<string, WikiTagCacheEntry>>(
    new Map(),
  );
  const [author, setAuthor] = useState<string>('Anonymous');
  const [loading, setLoading] = useState<boolean>(true);
  // Guard against setState after unmount / context change.
  const aliveRef = useRef(true);

  const fetchEverything = useCallback(async () => {
    if (!context) return;
    setLoading(true);
    try {
      const [annRes, cacheRes] = await Promise.all([
        fetch(`${apiBase}?context=${encodeURIComponent(context)}`, { cache: 'no-store' }),
        fetch(`${apiBase}/wiki-tag-cache?context=${encodeURIComponent(context)}`, {
          cache: 'no-store',
        }),
      ]);
      if (!aliveRef.current) return;
      if (annRes.ok) {
        const body = (await annRes.json()) as {
          annotations?: AnnotationRecord[];
          author?: string;
        };
        setAnnotations(body.annotations ?? []);
        if (typeof body.author === 'string' && body.author.length > 0) {
          setAuthor(body.author);
        }
      }
      if (cacheRes.ok) {
        const body = (await cacheRes.json()) as {
          entries?: Array<WikiTagCacheEntry & { key?: string }>;
        };
        const map = new Map<string, WikiTagCacheEntry>();
        for (const entry of body.entries ?? []) {
          map.set(cacheKey(entry.play, entry.prompt), {
            play: entry.play,
            prompt: entry.prompt,
            result: entry.result,
            author: entry.author,
            timestamp: entry.timestamp,
          });
        }
        setWikiTagCache(map);
      }
    } catch {
      // Network errors are non-fatal — the UI keeps the prior state.
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, [apiBase, context]);

  useEffect(() => {
    aliveRef.current = true;
    fetchEverything();
    return () => {
      aliveRef.current = false;
    };
  }, [fetchEverything]);

  const addComment = useCallback<NarrativeAnnotationApi['addComment']>(
    async ({ content, position }) => {
      if (!context) return null;
      try {
        const res = await fetch(apiBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context, content, position }),
        });
        if (!res.ok) return null;
        const body = (await res.json()) as { annotation: AnnotationRecord; author?: string };
        if (body.author) setAuthor(body.author);
        setAnnotations((prev) => [...prev, body.annotation]);
        return body.annotation;
      } catch {
        return null;
      }
    },
    [apiBase, context],
  );

  const recordWikiTagResult = useCallback<NarrativeAnnotationApi['recordWikiTagResult']>(
    async ({ play, prompt, result, sectionId }) => {
      if (!context) return;
      try {
        const res = await fetch(`${apiBase}/wiki-tag-cache`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context, play, prompt, result, sectionId }),
        });
        if (!res.ok) return;
        const body = (await res.json()) as {
          entry: {
            author: string;
            timestamp: string;
            content: string;
            position: { play?: string; prompt?: string };
          };
        };
        setWikiTagCache((prev) => {
          const next = new Map(prev);
          next.set(cacheKey(play, prompt), {
            play,
            prompt,
            result: body.entry.content,
            author: body.entry.author,
            timestamp: body.entry.timestamp,
          });
          return next;
        });
      } catch {
        // Non-fatal — the UI still shows the live result.
      }
    },
    [apiBase, context],
  );

  const comments = useMemo(() => annotations.filter((a) => a.type === 'comment'), [annotations]);

  const value = useMemo<NarrativeAnnotationApi>(
    () => ({
      context,
      author,
      annotations,
      comments,
      wikiTagCache,
      loading,
      addComment,
      recordWikiTagResult,
      refresh: fetchEverything,
    }),
    [
      context,
      author,
      annotations,
      comments,
      wikiTagCache,
      loading,
      addComment,
      recordWikiTagResult,
      fetchEverything,
    ],
  );

  return (
    <NarrativeAnnotationContext.Provider value={value}>
      {children}
    </NarrativeAnnotationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

export function useNarrativeAnnotations(): NarrativeAnnotationApi {
  return useContext(NarrativeAnnotationContext);
}

/** Exposed for tests that want to assert against the key format. */
export function cacheKeyForWikiTag(play: string, prompt: string): string {
  return cacheKey(play, prompt);
}
