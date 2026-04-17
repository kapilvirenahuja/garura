/**
 * useStepExecution Hook — Per-Checklist Concurrent Execution Tests
 *
 * Tests the hook's internal Map-based state management for per-checklist
 * execution tracking, ensuring:
 * - Different checklists CAN execute concurrently
 * - Within a single checklist, only one step can execute at a time
 * - Abort controllers are per-checklist
 * - isChecklistExecuting and getExecution helpers work correctly
 *
 * Fulfills: VAL-CHECK-024 (one CTA active per checklist at a time),
 *           VAL-CHECK-033 (concurrent ContentSlots render independently)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useStepExecution } from '@/hooks/use-step-execution';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

/**
 * Creates a mock fetch response that streams SSE events.
 */
function createMockSSEResponse(
  events: Array<{ type: string; content?: string; message?: string }>,
) {
  const sseLines = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('');
  const encoder = new TextEncoder();
  const encoded = encoder.encode(sseLines);

  let consumed = false;
  const stream = new ReadableStream({
    pull(controller) {
      if (!consumed) {
        consumed = true;
        controller.enqueue(encoded);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Basic API shape
// ============================================================================
describe('useStepExecution — API shape', () => {
  it('returns activeExecutions as a Map', () => {
    const { result } = renderHook(() => useStepExecution());
    expect(result.current.activeExecutions).toBeInstanceOf(Map);
    expect(result.current.activeExecutions.size).toBe(0);
  });

  it('returns isExecuting false when no executions', () => {
    const { result } = renderHook(() => useStepExecution());
    expect(result.current.isExecuting).toBe(false);
  });

  it('returns isChecklistExecuting as a function', () => {
    const { result } = renderHook(() => useStepExecution());
    expect(typeof result.current.isChecklistExecuting).toBe('function');
    expect(result.current.isChecklistExecuting('any-id')).toBe(false);
  });

  it('returns getExecution as a function', () => {
    const { result } = renderHook(() => useStepExecution());
    expect(typeof result.current.getExecution).toBe('function');
    expect(result.current.getExecution('any-id')).toBeNull();
  });

  it('returns backward-compat activeExecution as null when idle', () => {
    const { result } = renderHook(() => useStepExecution());
    expect(result.current.activeExecution).toBeNull();
  });
});

// ============================================================================
// Per-checklist execution guard
// ============================================================================
describe('useStepExecution — Per-Checklist Guard', () => {
  it('allows execution to start on a checklist', async () => {
    // Mock a long-running response (never resolves)
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useStepExecution());

    act(() => {
      result.current.executeStep('checklist-a', 'step-1', 'discover-product');
    });

    // Execution should be tracked for checklist-a
    expect(result.current.activeExecutions.size).toBe(1);
    expect(result.current.activeExecutions.has('checklist-a')).toBe(true);
    expect(result.current.isExecuting).toBe(true);
    expect(result.current.isChecklistExecuting('checklist-a')).toBe(true);

    const exec = result.current.getExecution('checklist-a');
    expect(exec).not.toBeNull();
    expect(exec?.checklistId).toBe('checklist-a');
    expect(exec?.stepId).toBe('step-1');
    expect(exec?.playName).toBe('discover-product');
    expect(exec?.status).toBe('running');
  });

  it('allows concurrent execution on DIFFERENT checklists', async () => {
    // Both fetch calls return promises that never resolve (keep running)
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useStepExecution());

    act(() => {
      result.current.executeStep('checklist-a', 'step-1', 'discover-product');
    });

    act(() => {
      result.current.executeStep('checklist-b', 'step-1', 'research-market-opportunity');
    });

    // Both should be tracked
    expect(result.current.activeExecutions.size).toBe(2);
    expect(result.current.activeExecutions.has('checklist-a')).toBe(true);
    expect(result.current.activeExecutions.has('checklist-b')).toBe(true);

    expect(result.current.isChecklistExecuting('checklist-a')).toBe(true);
    expect(result.current.isChecklistExecuting('checklist-b')).toBe(true);

    const execA = result.current.getExecution('checklist-a');
    expect(execA?.playName).toBe('discover-product');

    const execB = result.current.getExecution('checklist-b');
    expect(execB?.playName).toBe('research-market-opportunity');

    // fetch should have been called twice (one per checklist)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('blocks concurrent execution on the SAME checklist', async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useStepExecution());

    act(() => {
      result.current.executeStep('checklist-a', 'step-1', 'discover-product');
    });

    // Try to start another execution on the same checklist
    act(() => {
      result.current.executeStep('checklist-a', 'step-2', 'research-market-opportunity');
    });

    // Should still only have one execution for checklist-a
    expect(result.current.activeExecutions.size).toBe(1);
    const exec = result.current.getExecution('checklist-a');
    expect(exec?.stepId).toBe('step-1');
    expect(exec?.playName).toBe('discover-product');

    // fetch should have been called only once
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('isChecklistExecuting returns false for non-executing checklist', async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useStepExecution());

    act(() => {
      result.current.executeStep('checklist-a', 'step-1', 'discover-product');
    });

    expect(result.current.isChecklistExecuting('checklist-a')).toBe(true);
    expect(result.current.isChecklistExecuting('checklist-b')).toBe(false);
    expect(result.current.isChecklistExecuting('nonexistent')).toBe(false);
  });
});

// ============================================================================
// Backward compatibility
// ============================================================================
describe('useStepExecution — Backward Compatibility', () => {
  it('activeExecution returns first running execution', async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useStepExecution());

    act(() => {
      result.current.executeStep('checklist-a', 'step-1', 'discover-product');
    });

    // activeExecution should point to the running execution
    expect(result.current.activeExecution).not.toBeNull();
    expect(result.current.activeExecution?.checklistId).toBe('checklist-a');
    expect(result.current.activeExecution?.status).toBe('running');
  });

  it('completedCounts and getCompletedCount work as before', () => {
    const { result } = renderHook(() => useStepExecution());

    expect(result.current.getCompletedCount('any-id')).toBe(0);

    act(() => {
      result.current.initCompletedCounts(new Map([['cl-1', 3]]));
    });

    expect(result.current.getCompletedCount('cl-1')).toBe(3);
    expect(result.current.getCompletedCount('cl-2')).toBe(0);
  });
});

// ============================================================================
// SSE streaming and completion per-checklist
// ============================================================================
describe('useStepExecution — Per-Checklist SSE Completion', () => {
  it('completes execution for one checklist without affecting another', async () => {
    // Checklist A completes immediately, checklist B keeps running
    const responseA = createMockSSEResponse([
      { type: 'output', content: 'A done' },
      { type: 'complete' },
    ]);
    const neverResolveB = new Promise(() => {});

    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(responseA);
      return neverResolveB;
    });

    const { result } = renderHook(() => useStepExecution());

    // Start checklist A
    await act(async () => {
      result.current.executeStep('checklist-a', 'step-1', 'discover-product');
      // Let the SSE stream process
      await new Promise((r) => setTimeout(r, 50));
    });

    // Start checklist B
    act(() => {
      result.current.executeStep('checklist-b', 'step-1', 'research-market-opportunity');
    });

    // After A completes, its step count should be incremented
    expect(result.current.getCompletedCount('checklist-a')).toBe(1);

    // B should still be running
    expect(result.current.isChecklistExecuting('checklist-b')).toBe(true);
    expect(result.current.getExecution('checklist-b')?.status).toBe('running');
  });

  it('error on one checklist does not affect another running checklist', async () => {
    const responseA = createMockSSEResponse([
      { type: 'output', content: 'A output' },
      { type: 'error', message: 'Play failed' },
    ]);
    const neverResolveB = new Promise(() => {});

    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(responseA);
      return neverResolveB;
    });

    const { result } = renderHook(() => useStepExecution());

    // Start checklist A (will error)
    await act(async () => {
      result.current.executeStep('checklist-a', 'step-1', 'discover-product');
      await new Promise((r) => setTimeout(r, 50));
    });

    // Start checklist B
    act(() => {
      result.current.executeStep('checklist-b', 'step-1', 'research-market-opportunity');
    });

    // A should be in error state
    const execA = result.current.getExecution('checklist-a');
    expect(execA?.status).toBe('error');
    expect(execA?.error).toBe('Play failed');

    // B should still be running, unaffected
    expect(result.current.isChecklistExecuting('checklist-b')).toBe(true);
    expect(result.current.getExecution('checklist-b')?.status).toBe('running');

    // A's step should NOT be marked complete (VAL-CHECK-037)
    expect(result.current.getCompletedCount('checklist-a')).toBe(0);
  });
});
