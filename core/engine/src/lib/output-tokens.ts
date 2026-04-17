/**
 * Output token parser — extracts `[REFID]` patterns from plain text
 * streamed from play executions so ContentSlot can render them as
 * interactive CrossRefTokens that navigate to the Playbook Reader.
 *
 * This is the shared parser used by the checklists ContentSlot and the
 * Playbook Reader's CTA ContentSlot. It ensures that when a play writes
 * output like `"Created F1 (Task Inbox) and SC-AUTH-001"` the user can
 * click on each token to drill into the corresponding narrative context
 * (VAL-CROSS-002).
 *
 * The regex is intentionally conservative: it only matches uppercase
 * alphanumeric IDs with optional hyphens/digits (e.g. `F1`, `SC-AUTH-001`,
 * `EPIC-E1`, `ADR-003`, `NFR-SEC-01`). It does NOT attempt to validate
 * against the known cross-reference graph — dangling references are handled
 * by the CrossRefToken component itself when `dangling=true` is passed.
 *
 * Example:
 *   parseOutputTokens("Created [F1] (Inbox) and [SC-AUTH-001]")
 *   → [
 *       { type: 'text', text: 'Created ' },
 *       { type: 'token', refId: 'F1' },
 *       { type: 'text', text: ' (Inbox) and ' },
 *       { type: 'token', refId: 'SC-AUTH-001' },
 *     ]
 *
 * Fulfills: VAL-CROSS-002
 */

export type OutputSegment =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'token'; readonly refId: string };

/**
 * Matches `[ID]` where ID starts with an uppercase letter and contains
 * uppercase letters, digits, and hyphens. The minimum ID length is 2
 * characters so things like `[A]` (single-letter bracket) are NOT treated
 * as tokens — they're too easy to hit by accident in free-form prose.
 *
 * Captured group: the refId without the brackets.
 */
const OUTPUT_TOKEN_RE = /\[([A-Z][A-Z0-9-]{1,})\]/g;

/**
 * Split a string into text and token segments. Returns an empty array
 * for an empty input; non-empty input always returns at least one
 * segment. Consecutive matches are separated by (possibly empty) text
 * segments to preserve the original spacing in re-joined output.
 */
export function parseOutputTokens(input: string): OutputSegment[] {
  if (!input) return [];
  const segments: OutputSegment[] = [];
  let lastIndex = 0;

  // Reset the shared regex's `lastIndex` so a prior `hasOutputTokens`
  // call (or any other `.test()` / `.exec()` on the same regex) does
  // not cause `matchAll` to start scanning past the first match.
  OUTPUT_TOKEN_RE.lastIndex = 0;

  // `matchAll` requires the /g flag (set above). Each match exposes
  // `match.index` (start) and `match[0].length` for the consumed span.
  for (const match of input.matchAll(OUTPUT_TOKEN_RE)) {
    const start = match.index ?? 0;
    const refId = match[1];
    if (!refId) continue;

    if (start > lastIndex) {
      segments.push({ type: 'text', text: input.slice(lastIndex, start) });
    }
    segments.push({ type: 'token', refId });
    lastIndex = start + match[0].length;
  }

  if (lastIndex < input.length) {
    segments.push({ type: 'text', text: input.slice(lastIndex) });
  }

  return segments.length === 0 ? [{ type: 'text', text: input }] : segments;
}

/**
 * Convenience — does `input` contain at least one recognised token?
 * Useful for callers that want to short-circuit expensive rendering
 * when no tokenization is needed.
 */
export function hasOutputTokens(input: string): boolean {
  if (!input) return false;
  OUTPUT_TOKEN_RE.lastIndex = 0;
  return OUTPUT_TOKEN_RE.test(input);
}
