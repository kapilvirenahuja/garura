/**
 * Garura — Wiki Tag Parser
 *
 * Detects `[[play-name:prompt]]` patterns in arbitrary text and produces a
 * mixed stream of plain-text and wiki-tag segments. The parser is used by
 * the Playbook Reader narrative renderer to convert literal wiki-tag syntax
 * into interactive `WikiTag` components with a pending → running → complete
 * lifecycle.
 *
 * Invariants:
 *   1. Malformed patterns (`[[play:]]`, `[[]]`, `[[play` with no closing
 *      brackets, missing colon, illegal characters in the play name) must
 *      render as plain text — NEVER produce a broken interactive element
 *      and NEVER throw. See VAL-ACTION-027.
 *   2. Special characters inside the prompt (quotes, angle brackets, shell
 *      metacharacters, unicode) are preserved byte-for-byte in the parsed
 *      output, and are only escaped at the CLI boundary via
 *      {@link escapePromptForCli}. See VAL-ACTION-034.
 *   3. Wiki-tag state transitions are *forward-only*:
 *        pending → running, pending → complete (cache short-circuit), or
 *        running → complete. Any attempt to revert a complete tag is
 *        rejected. See VAL-ACTION-005.
 *
 * Fulfills: mdb-wiki-tag-parser (pattern detection + state lifecycle).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single wiki tag extracted from text. */
export interface ParsedWikiTag {
  /** Original literal text including the `[[` / `]]` delimiters. */
  readonly raw: string;
  /** Play name — matches `[a-zA-Z0-9_-]+`, never empty. */
  readonly play: string;
  /** Prompt string — preserved byte-for-byte from the source. */
  readonly prompt: string;
}

/** A segment produced by {@link parseWikiTagSegments}. */
export type WikiTagSegment =
  | { readonly type: 'text'; readonly text: string }
  | {
      readonly type: 'wikitag';
      readonly raw: string;
      readonly play: string;
      readonly prompt: string;
    };

/** WikiTag lifecycle states — monotonically advancing. */
export type WikiTagState = 'pending' | 'running' | 'complete';

// ---------------------------------------------------------------------------
// Pattern
// ---------------------------------------------------------------------------

/**
 * Wiki tag regex.
 *
 * Structure:
 *   `\[\[`      — literal opening double-bracket
 *   `([a-zA-Z0-9_-]+)`  — play name capture group (non-empty, no whitespace)
 *   `:`          — literal colon separator
 *   `([^\]]+(?:\](?!\])[^\]]*)*)`  — prompt: one or more non-`]` characters,
 *                                     allowing single `]` but never `]]`
 *   `\]\]`       — literal closing double-bracket
 *
 * The prompt sub-expression requires at least one character so `[[play:]]`
 * is rejected (caller treats malformed tags as plain text per VAL-ACTION-027).
 */
const WIKI_TAG_PATTERN = /\[\[([a-zA-Z0-9_-]+):([^\]]+(?:\](?!\])[^\]]*)*)\]\]/g;

/** Anchored single-tag variant of {@link WIKI_TAG_PATTERN}. */
const SINGLE_WIKI_TAG_PATTERN = /^\[\[([a-zA-Z0-9_-]+):([^\]]+(?:\](?!\])[^\]]*)*)\]\]$/;

// ---------------------------------------------------------------------------
// Public API — parsing
// ---------------------------------------------------------------------------

/**
 * Parse a string that is *expected* to be a single wiki tag.
 *
 * Returns the structured tag on success or `null` if the string is not a
 * syntactically valid tag. Callers that also need to handle surrounding
 * prose should use {@link parseWikiTagSegments} instead.
 */
export function parseSingleWikiTag(input: string): ParsedWikiTag | null {
  const match = SINGLE_WIKI_TAG_PATTERN.exec(input);
  if (!match) return null;
  const [, play, prompt] = match;
  if (!play || !prompt) return null;
  return { raw: input, play, prompt };
}

/**
 * Parse arbitrary prose into an ordered list of text and wiki-tag segments.
 *
 * The output preserves the original character order; concatenating every
 * segment's text reproduces the input exactly. Malformed patterns are
 * emitted as plain text segments — never as wiki tags — matching the
 * "render malformed tags as plain text" contract (VAL-ACTION-027).
 */
export function parseWikiTagSegments(input: string): WikiTagSegment[] {
  if (input.length === 0) return [];
  const segments: WikiTagSegment[] = [];
  // `lastIndex` is copy-local per call, so the global regex is safe across
  // concurrent invocations (Node/React both run JS single-threaded, but the
  // captured literal above is shared state).
  const pattern = new RegExp(WIKI_TAG_PATTERN.source, 'g');
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) {
    const raw = match[0];
    const play = match[1];
    const prompt = match[2];
    const start = match.index;
    // Both capture groups are guaranteed non-empty by the pattern, but the
    // TS inference is loose around `RegExpExecArray` so we narrow defensively.
    if (!play || !prompt) continue;
    if (start > cursor) {
      segments.push({ type: 'text', text: input.slice(cursor, start) });
    }
    segments.push({ type: 'wikitag', raw, play, prompt });
    cursor = start + raw.length;
  }
  if (cursor < input.length) {
    segments.push({ type: 'text', text: input.slice(cursor) });
  }
  return segments;
}

// ---------------------------------------------------------------------------
// Public API — CLI escaping
// ---------------------------------------------------------------------------

/**
 * Escape an arbitrary prompt string for safe use as a single POSIX shell
 * argument.
 *
 * Strategy — wrap in single quotes and replace every literal `'` inside the
 * prompt with the sequence `'\''` (close quote, literal single quote,
 * re-open quote). This is the canonical POSIX-safe quoting strategy; the
 * resulting string contains no interpretable metacharacters and therefore
 * cannot be used for command injection regardless of the prompt contents.
 *
 * The `spawn`-based execution path in `/api/checklists/execute` passes
 * arguments as a JS array (never via a shell), so CLI injection is already
 * prevented at that boundary. {@link escapePromptForCli} is provided for
 * any future code path that constructs shell command strings (e.g.
 * debugging output, subprocess wrappers, log lines) and must quote the
 * prompt defensively.
 *
 * See VAL-ACTION-034.
 */
export function escapePromptForCli(prompt: string): string {
  // Replace every ' with '\'' and wrap the result in single quotes.
  const escaped = prompt.split("'").join("'\\''");
  return `'${escaped}'`;
}

// ---------------------------------------------------------------------------
// State machine — forward-only transitions (VAL-ACTION-005)
// ---------------------------------------------------------------------------

/**
 * Adjacency map describing permitted forward transitions for the wiki tag
 * lifecycle. Any destination not listed here is rejected by
 * {@link canTransitionWikiTag}. Same-state transitions are always permitted
 * (idempotent no-op), reflecting that setting a state back to itself should
 * never throw or cause a spurious regression.
 */
const WIKI_TAG_FORWARD_TRANSITIONS: Readonly<Record<WikiTagState, readonly WikiTagState[]>> = {
  pending: ['pending', 'running', 'complete'],
  running: ['running', 'complete'],
  complete: ['complete'],
};

/**
 * Return `true` when the transition `from → to` is permitted by the
 * forward-only wiki tag lifecycle. Used by callers that want to assert
 * validity before mutating state (tests, UI guards).
 */
export function canTransitionWikiTag(from: WikiTagState, to: WikiTagState): boolean {
  return WIKI_TAG_FORWARD_TRANSITIONS[from].includes(to);
}

/**
 * Apply a state transition and return the resulting state.
 *
 * Valid transition → returns the new state.
 * Invalid transition (e.g. complete → running) → silently returns the
 * current state (no-op). The caller can check the returned value against
 * `to` or call {@link canTransitionWikiTag} first if it needs to detect
 * rejected transitions explicitly.
 *
 * This is the single enforcement point for the "forward-only, irreversible"
 * lifecycle invariant (VAL-ACTION-005).
 */
export function transitionWikiTag(from: WikiTagState, to: WikiTagState): WikiTagState {
  return canTransitionWikiTag(from, to) ? to : from;
}
