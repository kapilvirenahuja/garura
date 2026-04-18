'use client';

/**
 * AnnotationLayer
 *
 * UI surface for creating and displaying narrative annotations. Designed
 * to be rendered *below* a narrative section; it listens for text
 * selections whose range intersects the section, surfaces an "Add
 * comment" action, and renders every previously-saved comment anchored
 * to this section as a compact note.
 *
 * Contract details:
 *   - The comment composer has a Textarea + Save/Cancel buttons. Save
 *     posts to the annotation context (`addComment`). VAL-ACTION-022.
 *   - Saved comments render with author + timestamp + content, and the
 *     content is piped through {@link WikiTagText} so any embedded
 *     `[[play:prompt]]` renders as an interactive wiki tag. VAL-ACTION-023.
 *   - Existing annotations from the sidecar are merged into the view at
 *     render time — the layer only shows the comments whose
 *     `position.sectionId` matches the section it was rendered under.
 *     VAL-ACTION-024.
 *
 * The component deliberately avoids DOM selection range math — we
 * capture the literal selected text from `window.getSelection()` and
 * store it verbatim, which is enough to display the anchor later without
 * reimplementing browser selection semantics.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WikiTagText } from '@/components/wiki-tag-text';
import { useNarrativeAnnotations } from '@/components/narrative-annotation-context';

export interface AnnotationLayerProps {
  /** Narrative section id this layer is anchored to. */
  readonly sectionId: string;
  /**
   * Optional ref to the section DOM node — used to filter text selection
   * events. If omitted, any non-empty selection within the document
   * activates the "Add comment" affordance.
   */
  readonly sectionRef?: React.RefObject<HTMLElement | null>;
}

interface PendingSelection {
  readonly text: string;
  readonly offsetStart?: number;
  readonly offsetEnd?: number;
  /**
   * Best-effort anchor-node context — captured from the live selection
   * at the time the range is observed. Retained so the snapshot can
   * survive a focus change (opening the composer) which would otherwise
   * collapse `window.getSelection()` and drop the offsets.
   */
  readonly anchorContext?: string;
}

function isSelectionInside(node: HTMLElement | null | undefined): boolean {
  if (!node) return true;
  const sel = typeof window !== 'undefined' ? window.getSelection() : null;
  if (!sel || sel.rangeCount === 0) return false;
  const anchor = sel.anchorNode;
  const focus = sel.focusNode;
  return (anchor ? node.contains(anchor) : false) || (focus ? node.contains(focus) : false);
}

export function AnnotationLayer({ sectionId, sectionRef }: AnnotationLayerProps) {
  const { comments, author, loading, addComment } = useNarrativeAnnotations();
  const [selection, setSelection] = useState<PendingSelection | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  /**
   * Persisted snapshot of the most recently observed non-empty selection.
   * We read from this at save time instead of `window.getSelection()` /
   * `selection` state, because focusing the composer textarea collapses
   * the browser selection and would otherwise erase the anchor offsets
   * before the payload is posted.
   */
  const selectionSnapshotRef = useRef<PendingSelection | null>(null);
  /**
   * When the composer is open we stop updating the snapshot — the
   * textarea focus triggers a follow-up `selectionchange` that we must
   * ignore, otherwise the frozen anchor would be overwritten with a
   * collapsed selection and offsets would be lost.
   */
  const composerOpenRef = useRef(false);

  // Filter down to comments that belong to this section; annotations
  // anchored elsewhere (or globally) are rendered by whichever layer
  // owns them.
  const sectionComments = useMemo(
    () => comments.filter((c) => c.position?.sectionId === sectionId),
    [comments, sectionId],
  );

  // Listen for text selection changes on the document; the affordance
  // only appears when the anchor/focus of the selection is inside the
  // section we're anchored to. We persist the snapshot into a ref so
  // the anchor survives the textarea focus that follows opening the
  // composer (which would otherwise collapse the native selection).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const captureSnapshot = () => {
      // Once the composer is open, stop mutating the snapshot — the
      // focus-induced selection collapse would clobber the anchor and
      // we'd post a payload with no offsets.
      if (composerOpenRef.current) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }
      if (!isSelectionInside(sectionRef?.current ?? null)) {
        setSelection(null);
        return;
      }
      const text = sel.toString();
      if (text.trim().length === 0) {
        setSelection(null);
        return;
      }
      let offsetStart: number | undefined;
      let offsetEnd: number | undefined;
      let anchorContext: string | undefined;
      try {
        const range = sel.getRangeAt(0);
        offsetStart = range.startOffset;
        offsetEnd = range.endOffset;
        const anchorText = sel.anchorNode?.textContent;
        if (typeof anchorText === 'string') {
          anchorContext = anchorText.slice(0, 120);
        }
      } catch {
        /* ignore — offsets are a best-effort hint */
      }
      const snapshot: PendingSelection = { text, offsetStart, offsetEnd, anchorContext };
      selectionSnapshotRef.current = snapshot;
      setSelection(snapshot);
    };
    document.addEventListener('selectionchange', captureSnapshot);
    // `mouseup` is a belt-and-suspenders capture point — some browsers
    // fire `selectionchange` only after the mouse is released, and some
    // fire it before the range is finalised. Listening to both ensures
    // we never miss the offsets for a user-driven range.
    document.addEventListener('mouseup', captureSnapshot);
    return () => {
      document.removeEventListener('selectionchange', captureSnapshot);
      document.removeEventListener('mouseup', captureSnapshot);
    };
  }, [sectionRef]);

  const openComposer = useCallback(() => {
    // Freeze the selection snapshot *before* we flip the composer flag
    // and focus the textarea — the upcoming focus will collapse the
    // native selection, so this is our last chance to capture offsets
    // derived from the user's range. If `selection` state is populated
    // we prefer it (it's the value the user just saw in the UI);
    // otherwise we keep whatever the ref already holds.
    if (selection) {
      selectionSnapshotRef.current = selection;
    }
    composerOpenRef.current = true;
    setComposerOpen(true);
    setError(null);
    setDraft('');
    // Focus after the next render so the textarea is mounted.
    queueMicrotask(() => textareaRef.current?.focus());
  }, [selection]);

  const cancelComposer = useCallback(() => {
    composerOpenRef.current = false;
    setComposerOpen(false);
    setDraft('');
    setError(null);
    selectionSnapshotRef.current = null;
  }, []);

  const handleSave = useCallback(async () => {
    const content = draft.trim();
    if (content.length === 0) {
      setError('Comment cannot be empty.');
      return;
    }
    setSubmitting(true);
    setError(null);
    // Read the anchor from the persisted snapshot — `selection` state
    // and `window.getSelection()` are both unreliable here because the
    // composer textarea has stolen focus and the native range has been
    // collapsed. The ref is the only source that still carries the
    // offsets the user originally selected.
    const anchor = selectionSnapshotRef.current ?? selection;
    const result = await addComment({
      content,
      position: {
        sectionId,
        selectedText: anchor?.text,
        offsetStart: anchor?.offsetStart,
        offsetEnd: anchor?.offsetEnd,
      },
    });
    setSubmitting(false);
    if (result === null) {
      setError('Failed to save annotation. Please try again.');
      return;
    }
    setDraft('');
    composerOpenRef.current = false;
    setComposerOpen(false);
    setSelection(null);
    selectionSnapshotRef.current = null;
  }, [addComment, draft, sectionId, selection]);

  return (
    <div
      data-testid="annotation-layer"
      data-section-id={sectionId}
      data-comment-count={sectionComments.length}
      className="mt-3 space-y-2 border-l-2 border-indigo-900/40 pl-3"
    >
      {/* Existing comments render first so users always see merged context. */}
      {sectionComments.length > 0 ? (
        <ul className="space-y-2" data-testid="annotation-list">
          {sectionComments.map((c) => (
            <li
              key={c.id}
              data-testid="annotation-item"
              data-annotation-id={c.id}
              className="rounded border border-indigo-900/30 bg-indigo-950/20 px-3 py-2 text-xs"
            >
              <header className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-indigo-300">
                <span data-testid="annotation-author" className="font-medium text-indigo-200">
                  {c.author}
                </span>
                <time
                  data-testid="annotation-timestamp"
                  dateTime={c.timestamp}
                  className="text-indigo-400/80"
                >
                  {new Date(c.timestamp).toLocaleString()}
                </time>
                {c.position?.selectedText ? (
                  <span
                    data-testid="annotation-selection"
                    className="truncate rounded bg-indigo-900/40 px-1.5 py-0.5 text-indigo-200"
                    title={c.position.selectedText}
                  >
                    “{c.position.selectedText}”
                  </span>
                ) : null}
              </header>
              <p data-testid="annotation-content" className="whitespace-pre-wrap text-gray-200">
                <WikiTagText text={c.content} />
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Composer / add-comment affordance. */}
      {!composerOpen ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="annotation-add-button"
            onClick={openComposer}
            disabled={loading}
            className="rounded border border-indigo-700/60 bg-indigo-900/30 px-2 py-1 text-[11px] font-medium text-indigo-200 hover:bg-indigo-800/40 disabled:opacity-40"
          >
            {selection ? `Comment on “${truncate(selection.text, 48)}”` : 'Add comment'}
          </button>
          {selection ? (
            <span
              className="text-[10px] text-indigo-400/70"
              data-testid="annotation-selection-hint"
            >
              Selected {selection.text.length} char{selection.text.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      ) : (
        <div
          role="form"
          aria-label="Add annotation"
          data-testid="annotation-composer"
          className="rounded border border-indigo-700/60 bg-indigo-950/30 p-2"
        >
          {selection ? (
            <div className="mb-2 rounded bg-indigo-900/40 px-2 py-1 text-[11px] text-indigo-200">
              <span className="font-medium">Anchored to:</span> “{truncate(selection.text, 120)}”
            </div>
          ) : null}
          <textarea
            ref={textareaRef}
            data-testid="annotation-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Add a comment (supports [[play:prompt]] wiki tags)…"
            className="w-full rounded border border-indigo-900/50 bg-gray-950/60 px-2 py-1 text-xs text-gray-100 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
          />
          {error ? (
            <p
              role="alert"
              data-testid="annotation-error"
              className="mt-1 text-[11px] text-red-400"
            >
              {error}
            </p>
          ) : null}
          <footer className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-indigo-400/70">
              Posting as <span className="font-medium text-indigo-200">{author}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="annotation-cancel-button"
                onClick={cancelComposer}
                className="rounded border border-gray-700 px-2 py-1 text-[11px] text-gray-300 hover:bg-gray-800"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="annotation-save-button"
                onClick={handleSave}
                disabled={submitting || draft.trim().length === 0}
                className="rounded bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}
