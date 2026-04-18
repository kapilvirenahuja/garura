/**
 * Garura — Play Execution Bridge
 *
 * Server-side module that spawns Garura plays (Droid / Claude CLI) as
 * child processes and surfaces them to the browser over Server-Sent
 * Events. This module is the single enforcement point for five
 * invariants defined in the feature contract:
 *
 *   1. **Command whitelist (VAL-ACTION-010).** Only the binaries listed
 *      in {@link ALLOWED_COMMANDS} may ever be spawned. Any other
 *      command is rejected before `spawn` is called.
 *   2. **Play-name allowlist (VAL-ACTION-010).** The play being run must
 *      match the strict character class and, optionally, the static play
 *      registry. Unknown or malformed names are rejected.
 *   3. **Argument sanitization / no shell injection (VAL-ACTION-011).**
 *      Arguments are always passed through `child_process.spawn` as an
 *      `argv` array. `spawn(cmd, argv)` does not invoke a shell, so
 *      shell metacharacters inside `prompt` (e.g. `; rm -rf /`) are
 *      passed to the child process verbatim and cannot break out of the
 *      argument boundary. A length cap provides a small DoS defense.
 *   4. **Execution tracking (VAL-ACTION-013).** Every spawn creates a
 *      {@link PlayExecutionRecord} keyed by a server-generated
 *      `executionId`. Records capture PID, start time, play name, and
 *      status, and are live-updated as the process progresses.
 *   5. **Concurrent execution limit (VAL-ACTION-030).** At most
 *      {@link MAX_CONCURRENT_EXECUTIONS} plays may be running at once.
 *      The fourth attempt throws {@link ConcurrentLimitError}; the caller
 *      is expected to surface a user-facing message (the API route
 *      responds with HTTP 429).
 *
 * SSE event shape (all events are JSON payloads encoded as
 * `data: <json>\n\n`):
 *
 *   `{ type: "start", executionId, playName, startTime, pid }`
 *   `{ type: "output", content }`
 *   `{ type: "complete", executionId, exitCode }`
 *   `{ type: "error", executionId, message, exitCode? }`
 *   `{ type: "timeout", executionId, message }`
 *   `{ type: "cancelled", executionId, message }`
 *
 * Fulfills:
 *   VAL-ACTION-009, VAL-ACTION-010, VAL-ACTION-011, VAL-ACTION-012,
 *   VAL-ACTION-013, VAL-ACTION-014, VAL-ACTION-015, VAL-ACTION-016,
 *   VAL-ACTION-029, VAL-ACTION-030.
 */

import { spawn as nodeSpawn, type ChildProcess, type SpawnOptions } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { isValidPlay } from './play-registry';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** CLI binaries the bridge is permitted to spawn (VAL-ACTION-010). */
export const ALLOWED_COMMANDS = ['factory', 'claude'] as const;
export type AllowedCommand = (typeof ALLOWED_COMMANDS)[number];

/** Default CLI binary when the caller does not override. */
export const DEFAULT_CLI_COMMAND: AllowedCommand = 'factory';

/** Maximum concurrent play executions (VAL-ACTION-030). */
export const MAX_CONCURRENT_EXECUTIONS = 3;

/** Default play execution timeout — 5 minutes (VAL-ACTION-014). */
export const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

/** Upper bound on accepted prompt length (defense-in-depth against DoS). */
export const MAX_PROMPT_LENGTH = 8000;

/**
 * Shell metacharacters and control codes that are disallowed in a play
 * *name* and surfaced by {@link findDangerousShellCharacters}. Note the
 * list deliberately does NOT reject these characters inside a *prompt* —
 * `spawn` is called with an argv array so the child process receives the
 * prompt verbatim, without shell interpretation.
 */
export const DANGEROUS_SHELL_CHARS: ReadonlyArray<string> = [
  ';',
  '|',
  '&',
  '$',
  '`',
  '\n',
  '\r',
  '>',
  '<',
  '(',
  ')',
  '\\',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Lifecycle status of a single play execution. */
export type ExecutionStatus = 'running' | 'complete' | 'error' | 'cancelled' | 'timeout';

/** Record held in the process tracker for one spawned play. */
export interface PlayExecutionRecord {
  readonly executionId: string;
  readonly playName: string;
  readonly prompt: string;
  readonly startTime: number;
  /** PID of the spawned process, or null if the spawn failed. */
  pid: number | null;
  /** Current lifecycle status (mutated as the process progresses). */
  status: ExecutionStatus;
  /** Exit code — populated on completion/error. */
  exitCode?: number | null;
  /** Human-readable error message — populated on error/timeout. */
  errorMessage?: string;
}

/** Options accepted by {@link spawnPlay}. */
export interface SpawnPlayOptions {
  /** Garura play name — must satisfy {@link validatePlayName}. */
  readonly playName: string;
  /** Optional prompt to forward to the play. Preserved verbatim. */
  readonly prompt?: string;
  /** Optional resumable session id for headless Claude flows. */
  readonly sessionId?: string;
  /** Optional user reply for continuing a paused headless Claude flow. */
  readonly userResponse?: string;
  /** Optional execution override for steps that should run via Claude headlessly. */
  readonly execution?: {
    readonly runner: 'garura' | 'claude-headless';
    readonly prompt?: string;
  };
  /** Working directory for the spawned child process. */
  readonly workingDirectory?: string;
  /** Execution timeout in milliseconds. Defaults to 5 minutes. */
  readonly timeoutMs?: number;
  /** CLI binary to spawn (must be whitelisted). Defaults to `factory`. */
  readonly cliCommand?: AllowedCommand;
  /** Abort signal — aborting cancels the spawned process and closes SSE. */
  readonly signal?: AbortSignal;
  /**
   * Skip the registry check and only apply the strict character-class
   * validation. Used by tests that inject a mock `spawnFn` and do not
   * need the real Garura registry.
   */
  readonly skipRegistryCheck?: boolean;
  /** Inject a mock `spawn` implementation (testing hook). */
  readonly spawnFn?: typeof nodeSpawn;
}

/** Result returned by {@link spawnPlay}. */
export interface SpawnPlayResult {
  readonly executionId: string;
  readonly record: PlayExecutionRecord;
  readonly stream: ReadableStream<Uint8Array>;
}

interface ClaudeInteractionSignal {
  readonly kind: 'question' | 'approval';
  readonly title: string;
  readonly summary: string;
  readonly details: string;
  readonly prompt: string;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Error subclass carrying a stable `code` for HTTP error mapping. */
abstract class CodedError extends Error {
  abstract readonly code: string;
}

export class InvalidCommandError extends CodedError {
  readonly code = 'INVALID_COMMAND';
  constructor(command: string) {
    super(`Command is not in the whitelist: ${command}`);
    this.name = 'InvalidCommandError';
  }
}

export class InvalidPlayNameError extends CodedError {
  readonly code = 'INVALID_PLAY_NAME';
  constructor(name: string) {
    super(`Invalid or unknown play: ${name}`);
    this.name = 'InvalidPlayNameError';
  }
}

export class InvalidPromptError extends CodedError {
  readonly code = 'INVALID_PROMPT';
  constructor(reason: string) {
    super(`Invalid prompt: ${reason}`);
    this.name = 'InvalidPromptError';
  }
}

export class ConcurrentLimitError extends CodedError {
  readonly code = 'CONCURRENT_LIMIT_EXCEEDED';
  readonly limit: number;
  constructor(limit: number) {
    super(
      `Maximum concurrent plays reached (${limit}) — please wait for one to finish before starting another.`,
    );
    this.name = 'ConcurrentLimitError';
    this.limit = limit;
  }
}

// ---------------------------------------------------------------------------
// Process tracker (module-level singletons)
// ---------------------------------------------------------------------------

const tracker = new Map<string, PlayExecutionRecord>();
const activeProcesses = new Map<string, ChildProcess>();

/**
 * Module-level `spawn` reference used by {@link spawnPlay} when no
 * `spawnFn` option is passed explicitly. Tests can swap this out via
 * {@link setSpawnImplForTesting} to avoid invoking real child processes
 * from HTTP-level tests without having to mock `node:child_process`
 * (which collides with Vitest's own tinypool IPC).
 */
let defaultSpawn: typeof nodeSpawn = nodeSpawn;

/**
 * Override the `spawn` implementation used by {@link spawnPlay}.
 *
 * Pass `null` to restore the real `node:child_process.spawn`. Tests
 * should ensure they restore the default in an `afterEach` hook.
 */
export function setSpawnImplForTesting(spawnFn: typeof nodeSpawn | null): void {
  defaultSpawn = spawnFn ?? nodeSpawn;
}

/** Read-only view of the process tracker. */
export function getProcessTracker(): ReadonlyMap<string, PlayExecutionRecord> {
  return tracker;
}

/** Fetch a single record from the tracker. */
export function getExecutionRecord(executionId: string): PlayExecutionRecord | undefined {
  return tracker.get(executionId);
}

/** Number of executions currently in the `running` state. */
export function getRunningCount(): number {
  let count = 0;
  for (const r of tracker.values()) if (r.status === 'running') count++;
  return count;
}

/**
 * Cancel a currently-running execution. Returns true when a SIGTERM was
 * dispatched, false if the execution id is unknown or already terminal.
 */
export function cancelExecution(
  executionId: string,
  reason: 'cancelled' | 'timeout' = 'cancelled',
): boolean {
  const record = tracker.get(executionId);
  if (!record) return false;
  if (record.status !== 'running') return false;

  record.status = reason;
  const child = activeProcesses.get(executionId);
  if (child) {
    try {
      child.kill('SIGTERM');
    } catch {
      // process already gone — status update is still authoritative
    }
  }
  return true;
}

/**
 * Test-only reset. Kills any lingering processes and clears the tracker.
 * NEVER call this from production code paths.
 */
export function resetExecutorForTesting(): void {
  for (const [, child] of activeProcesses) {
    try {
      child.kill('SIGKILL');
    } catch {
      /* ignore */
    }
  }
  activeProcesses.clear();
  tracker.clear();
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Return the list of dangerous shell characters found in `s`. An empty
 * array means the string is considered shell-safe by *this* heuristic.
 */
export function findDangerousShellCharacters(s: string): string[] {
  const found: string[] = [];
  for (const ch of DANGEROUS_SHELL_CHARS) {
    if (s.includes(ch)) found.push(ch);
  }
  return found;
}

/**
 * Strict play-name validation:
 *   - must be a string
 *   - length 1..100
 *   - only `[A-Za-z0-9_-]`
 *   - (optional) must appear in the Garura play registry
 *
 * The registry check is enabled by default and gated off for tests that
 * inject a synthetic spawn — see {@link SpawnPlayOptions.skipRegistryCheck}.
 */
export function validatePlayName(name: unknown, checkRegistry = true): name is string {
  if (typeof name !== 'string') return false;
  if (name.length === 0 || name.length > 100) return false;
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) return false;
  if (checkRegistry && !isValidPlay(name)) return false;
  return true;
}

/**
 * Sanitize a prompt string.
 *
 * Because `spawn` is invoked with an argv array (never a shell command
 * string), shell metacharacters cannot escape the argument boundary —
 * the OS hands the exact bytes to the child's `argv[n]`. Sanitization is
 * therefore limited to a length cap that prevents a single request from
 * pinning arbitrary amounts of memory.
 *
 * Throws {@link InvalidPromptError} if `prompt` is not a string or
 * exceeds {@link MAX_PROMPT_LENGTH}.
 */
export function sanitizePrompt(prompt: unknown): string {
  if (prompt === undefined || prompt === null) return '';
  if (typeof prompt !== 'string') {
    throw new InvalidPromptError('prompt must be a string');
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new InvalidPromptError(
      `prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`,
    );
  }
  return prompt;
}

function buildClaudeArgs(options: {
  readonly playName: string;
  readonly sessionId?: string;
  readonly userResponse?: string;
  readonly promptOverride?: string;
  readonly workingDirectory?: string;
}): string[] {
  const {
    playName,
    sessionId,
    userResponse,
    promptOverride,
    workingDirectory,
  } = options;
  const prompt =
    sessionId && userResponse
      ? [
          `Continue the /${playName} workflow using this user response:`,
          userResponse,
          '',
          'If you still need user input or approval, emit the same <garura-signal> block and wait.',
        ].join('\n')
      : buildClaudeInitialPrompt(playName, promptOverride, workingDirectory);

  const args = [
    '-p',
    '--verbose',
    '--output-format',
    'stream-json',
    '--include-partial-messages',
    '--permission-mode',
    'auto',
  ];

  if (sessionId) {
    args.push('--resume', sessionId);
  } else if (workingDirectory) {
    args.push('--add-dir', workingDirectory);
  }

  args.push(prompt);
  return args;
}

function buildClaudeInitialPrompt(
  playName: string,
  promptOverride?: string,
  workingDirectory?: string,
): string {
  const slashCommand = promptOverride && promptOverride.trim().length > 0 ? promptOverride.trim() : `/${playName}`;
  return [
    'You are running inside Garura Engine in a headless Claude Code session.',
    workingDirectory
      ? `Operate on the repository in the current working directory: ${workingDirectory}`
      : 'Operate on the repository in the current working directory.',
    `Run the Garura play ${slashCommand}.`,
    'If you need user input, stop and emit exactly this XML shape:',
    '<garura-signal type="question" title="Short title"><summary>One short sentence.</summary><details>Concrete context for the user.</details><prompt>The exact question for the user.</prompt></garura-signal>',
    'If you need explicit user approval, emit the same shape with type="approval".',
    'After emitting a <garura-signal> block, end your turn and wait for the next user message.',
    'Do not ask follow-up questions outside that block.',
  ].join('\n');
}

function extractClaudeInteractionSignal(output: string): ClaudeInteractionSignal | null {
  const match = output.match(
    /<garura-signal\s+type="(question|approval)"\s+title="([^"]+)">([\s\S]*?)<\/garura-signal>/i,
  );
  if (!match) return null;
  const [, rawKind = 'question', rawTitle = 'Question', inner = ''] = match;
  const readTag = (tag: string): string => {
    const tagMatch = inner.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return tagMatch ? tagMatch[1]!.trim() : '';
  };
  const kind = rawKind === 'approval' ? 'approval' : 'question';
  return {
    kind,
    title: rawTitle.trim(),
    summary: readTag('summary'),
    details: readTag('details'),
    prompt: readTag('prompt') || 'Reply to continue.',
  };
}

function handleClaudeJsonEvent(
  event: Record<string, unknown>,
  helpers: {
    readonly executionId: string;
    readonly safeSend: (data: Record<string, unknown>) => void;
    readonly onText: (content: string) => void;
  },
): void {
  const { executionId, safeSend, onText } = helpers;
  const type = typeof event['type'] === 'string' ? (event['type'] as string) : '';

  if (type === 'system' && event['subtype'] === 'init' && typeof event['session_id'] === 'string') {
    safeSend({ type: 'session', executionId, sessionId: event['session_id'] });
    return;
  }

  if (type === 'stream_event') {
    const inner = event['event'];
    if (!inner || typeof inner !== 'object') return;
    const innerRecord = inner as Record<string, unknown>;
    const innerType =
      typeof innerRecord['type'] === 'string'
        ? (innerRecord['type'] as string)
        : '';

    if (innerType === 'content_block_delta') {
      const delta = innerRecord['delta'];
      if (!delta || typeof delta !== 'object') return;
      const deltaRec = delta as Record<string, unknown>;
      if (deltaRec['type'] === 'text_delta' && typeof deltaRec['text'] === 'string') {
        onText(deltaRec['text']);
      }
      return;
    }

    if (innerType === 'content_block_start') {
      const block = innerRecord['content_block'];
      if (!block || typeof block !== 'object') return;
      const blockRec = block as Record<string, unknown>;
      if (blockRec['type'] === 'tool_use' && typeof blockRec['name'] === 'string') {
        const input = blockRec['input'];
        const description =
          input && typeof input === 'object' && typeof (input as Record<string, unknown>)['description'] === 'string'
            ? ((input as Record<string, unknown>)['description'] as string)
            : '';
        const label = description
          ? `${blockRec['name']}: ${description}`
          : `Claude invoked ${blockRec['name']}`;
        safeSend({ type: 'activity', executionId, label });
      }
      return;
    }
  }

}

// ---------------------------------------------------------------------------
// Core — spawnPlay
// ---------------------------------------------------------------------------

/**
 * Spawn a Garura play and return an SSE-ready `ReadableStream` that emits
 * the process's stdout/stderr plus lifecycle events. See the module
 * header for the event schema.
 *
 * This function does not `await` the child process — the stream drives
 * the lifecycle. All synchronous validation errors
 * ({@link InvalidCommandError}, {@link InvalidPlayNameError},
 * {@link InvalidPromptError}, {@link ConcurrentLimitError}) are thrown
 * before the process is spawned, so the caller can map them to HTTP
 * status codes cleanly.
 */
export function spawnPlay(options: SpawnPlayOptions): SpawnPlayResult {
  const {
    playName,
    prompt = '',
    sessionId,
    userResponse,
    execution,
    workingDirectory,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cliCommand = DEFAULT_CLI_COMMAND,
    signal,
    skipRegistryCheck = false,
    spawnFn,
  } = options;
  const effectiveSpawn = spawnFn ?? defaultSpawn;
  const resolvedCommand =
    execution?.runner === 'claude-headless' ? ('claude' as AllowedCommand) : cliCommand;

  // 1. Command whitelist
  if (!ALLOWED_COMMANDS.includes(resolvedCommand)) {
    throw new InvalidCommandError(String(resolvedCommand));
  }

  // 2. Play name validation
  if (!validatePlayName(playName, !skipRegistryCheck)) {
    throw new InvalidPlayNameError(String(playName));
  }

  // 3. Prompt sanitization (throws InvalidPromptError on failure)
  const sanitized = sanitizePrompt(prompt);

  // 4. Concurrency limit — gate on the active child-process map, not on
  //    logical `status`. `status` transitions to `cancelled` / `timeout`
  //    the moment cancellation is *requested*, but the OS process is
  //    still alive until SIGTERM (or SIGKILL) is delivered and the
  //    `close` event fires. Using the active process map means a slot
  //    is only freed once the child has actually exited, preventing
  //    more than `MAX_CONCURRENT_EXECUTIONS` live children at a time.
  if (activeProcesses.size >= MAX_CONCURRENT_EXECUTIONS) {
    throw new ConcurrentLimitError(MAX_CONCURRENT_EXECUTIONS);
  }

  const executionId = randomUUID();
  const startTime = Date.now();
  const record: PlayExecutionRecord = {
    executionId,
    playName,
    prompt: sanitized,
    startTime,
    pid: null,
    status: 'running',
  };
  tracker.set(executionId, record);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

      const safeSend = (data: Record<string, unknown>) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* controller already closed */
        }
      };

      const safeClose = () => {
        if (closed) return;
        closed = true;
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      // Build the argv array. `spawn(cmd, argv)` is not invoked through
      // a shell, so every element of `args` is passed verbatim — that
      // is the invariant we rely on for VAL-ACTION-011.
      const args =
        execution?.runner === 'claude-headless'
          ? buildClaudeArgs({
              playName,
              sessionId,
              userResponse,
              promptOverride: execution.prompt ?? sanitized,
              workingDirectory,
            })
          : ['run', playName, ...(sanitized.length > 0 ? [sanitized] : [])];

      const spawnOptions: SpawnOptions = {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: workingDirectory,
        env: {
          ...process.env,
          CI: 'true',
          FORCE_COLOR: '0',
        },
      };

      let claudeStdoutBuffer = '';
      let claudeRawOutput = '';

      let child: ChildProcess;
      try {
        child = effectiveSpawn(resolvedCommand, args, spawnOptions);
      } catch (err) {
        // Synchronous spawn failures (rare) — translate to an error
        // event and close the stream. The record remains in the
        // tracker with status `error` for observability.
        const msg = err instanceof Error ? err.message : String(err);
        record.status = 'error';
        record.errorMessage = msg;
        safeSend({ type: 'error', executionId, message: msg });
        safeClose();
        return;
      }

      record.pid = child.pid ?? null;
      activeProcesses.set(executionId, child);

      // 5. Emit the `start` event with PID so the client can correlate
      //    cancellation requests.
      safeSend({
        type: 'start',
        executionId,
        playName,
        startTime,
        pid: record.pid,
      });

      // 6. Timeout (VAL-ACTION-014). `timeoutMs <= 0` disables.
      if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
        timeoutHandle = setTimeout(() => {
          if (record.status !== 'running') return;
          record.status = 'timeout';
          record.errorMessage = `Play "${playName}" exceeded timeout of ${timeoutMs}ms`;
          try {
            child.kill('SIGTERM');
          } catch {
            /* ignore */
          }
          safeSend({
            type: 'timeout',
            executionId,
            message: record.errorMessage,
          });
          // Hard-kill if SIGTERM is ignored for more than 1s.
          const hardKill = setTimeout(() => {
            try {
              child.kill('SIGKILL');
            } catch {
              /* ignore */
            }
          }, 1000);
          hardKill.unref?.();
        }, timeoutMs);
      }

      // 7. Abort / cancellation (VAL-ACTION-015, VAL-ACTION-029).
      const onAbort = () => {
        if (record.status !== 'running') return;
        record.status = 'cancelled';
        record.errorMessage = 'Execution cancelled by client';
        try {
          child.kill('SIGTERM');
        } catch {
          /* ignore */
        }
        safeSend({
          type: 'cancelled',
          executionId,
          message: record.errorMessage,
        });
        safeClose();
      };
      if (signal) {
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
      }

      child.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        if (execution?.runner !== 'claude-headless') {
          safeSend({ type: 'output', content: text });
          return;
        }

        claudeStdoutBuffer += text;
        const lines = claudeStdoutBuffer.split(/\r?\n/);
        claudeStdoutBuffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const event = JSON.parse(trimmed) as Record<string, unknown>;
            handleClaudeJsonEvent(event, {
              executionId,
              safeSend,
              onText: (content) => {
                claudeRawOutput += content;
                safeSend({ type: 'output', content });
              },
            });
          } catch {
            claudeRawOutput += `${line}\n`;
            safeSend({ type: 'output', content: `${line}\n` });
          }
        }
      });
      child.stderr?.on('data', (data: Buffer) => {
        safeSend({ type: 'output', content: data.toString() });
      });

      child.on('close', (code) => {
        activeProcesses.delete(executionId);
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
        // If we already transitioned due to timeout / cancel, emit the
        // terminal event (idempotent — safeSend no-ops after close) and
        // close the stream. This handles the case where
        // `cancelExecution` was called externally (no AbortSignal) —
        // the onAbort branch has not fired, so the `cancelled` SSE
        // event is emitted here instead.
        if (record.status === 'cancelled') {
          safeSend({
            type: 'cancelled',
            executionId,
            message: record.errorMessage ?? 'Execution cancelled',
          });
          safeClose();
          return;
        }
        if (record.status === 'timeout') {
          // `timeout` event already emitted by the timeout handler.
          safeClose();
          return;
        }
        if (execution?.runner === 'claude-headless' && claudeStdoutBuffer.trim().length > 0) {
          try {
            const event = JSON.parse(claudeStdoutBuffer.trim()) as Record<string, unknown>;
            handleClaudeJsonEvent(event, {
              executionId,
              safeSend,
              onText: (content) => {
                claudeRawOutput += content;
                safeSend({ type: 'output', content });
              },
            });
          } catch {
            claudeRawOutput += claudeStdoutBuffer;
            safeSend({ type: 'output', content: claudeStdoutBuffer });
          }
        }

        if (code === 0 || code === null) {
          record.status = 'complete';
          record.exitCode = code;
          if (execution?.runner === 'claude-headless') {
            const signal = extractClaudeInteractionSignal(claudeRawOutput);
            if (signal) {
              safeSend({
                type: signal.kind === 'approval' ? 'needs_approval' : 'needs_input',
                executionId,
                title: signal.title,
                summary: signal.summary,
                details: signal.details,
                prompt: signal.prompt,
              });
              safeClose();
              return;
            }
          }
          safeSend({ type: 'complete', executionId, exitCode: code });
        } else {
          record.status = 'error';
          record.exitCode = code;
          record.errorMessage = `Play "${playName}" exited with code ${code}`;
          safeSend({
            type: 'error',
            executionId,
            exitCode: code,
            message: record.errorMessage,
          });
        }
        safeClose();
      });

      child.on('error', (err: Error) => {
        activeProcesses.delete(executionId);
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
        if (record.status === 'cancelled' || record.status === 'timeout') {
          safeClose();
          return;
        }
        // Only ENOENT (CLI missing) is allowed to degrade gracefully
        // into a simulated-complete execution for developer UX —
        // that preserves the fallback behaviour the prior
        // /api/checklists/execute route provided when the Factory /
        // Claude CLI is not installed on a dev box. All other child
        // errors (EACCES, EPERM, spawn crashes, unexpected I/O
        // failures, …) must surface as genuine execution failures
        // rather than being silently swallowed as "complete".
        const errnoCode = (err as NodeJS.ErrnoException).code;
        if (errnoCode === 'ENOENT') {
          record.errorMessage = err.message;
          safeSend({
            type: 'output',
            content: `[garura] CLI "${resolvedCommand}" not available. Simulating play execution.\n`,
          });
          safeSend({
            type: 'output',
            content: `[garura] Play "${playName}" — this would execute the Garura play.\n`,
          });
          safeSend({
            type: 'output',
            content: `[garura] Error: ${err.message}\n`,
          });
          record.status = 'complete';
          record.exitCode = null;
          safeSend({ type: 'complete', executionId, exitCode: null });
          safeClose();
          return;
        }

        // Non-ENOENT errors → genuine failure. Mark the record as
        // `error`, emit a structured `error` SSE event so the client
        // can surface the failure, and close the stream.
        record.status = 'error';
        record.exitCode = null;
        record.errorMessage = err.message;
        safeSend({
          type: 'error',
          executionId,
          message: err.message,
        });
        safeClose();
      });
    },
    cancel() {
      // Consumer (e.g. browser navigation) closed the stream —
      // treat it as a cancellation to free the process.
      cancelExecution(executionId, 'cancelled');
    },
  });

  return { executionId, record, stream };
}
