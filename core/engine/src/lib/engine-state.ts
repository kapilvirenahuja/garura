import fs from 'node:fs';
import path from 'node:path';

export type LifecycleMode = 'auto' | 'greenfield' | 'brownfield';

export interface EngineState {
  readonly lifecycleMode: LifecycleMode;
  readonly readinessCache?: {
    readonly gitHash: string | null;
    readonly artifactFingerprint: string;
    readonly lifecycle: 'greenfield' | 'brownfield';
    readonly score: number;
    readonly band: '0-30' | '30-60' | '60-80' | '80-100';
    readonly totalPlays: number;
    readonly runnablePlays: number;
    readonly breakdown: ReadonlyArray<{
      readonly area: 'Product' | 'Features' | 'Roadmap' | 'Architecture' | 'Epics';
      readonly status: 'locked' | 'missing' | 'in-progress' | 'complete';
      readonly totalPlays: number;
      readonly runnablePlays: number;
      readonly percentage: number;
    }>;
    readonly plays: ReadonlyArray<{
      readonly name: string;
      readonly area: 'Product' | 'Features' | 'Roadmap' | 'Architecture' | 'Epics';
      readonly runnable: boolean;
      readonly satisfiedPreconditions: ReadonlyArray<string>;
      readonly missingPreconditions: ReadonlyArray<string>;
    }>;
    readonly computedAt: string;
  };
}

export const DEFAULT_ENGINE_STATE: EngineState = Object.freeze({
  lifecycleMode: 'auto',
});

export function engineStatePath(repoRoot: string): string {
  return path.join(repoRoot, '.garura', 'core', 'engine-state.json');
}

export function readEngineState(repoRoot: string): EngineState {
  const statePath = engineStatePath(repoRoot);
  try {
    const raw = fs.readFileSync(statePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<EngineState> | null;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_ENGINE_STATE;
    const lifecycleMode =
      parsed.lifecycleMode === 'greenfield' ||
      parsed.lifecycleMode === 'brownfield' ||
      parsed.lifecycleMode === 'auto'
        ? parsed.lifecycleMode
        : 'auto';
    return {
      lifecycleMode,
      ...(parsed.readinessCache ? { readinessCache: parsed.readinessCache } : {}),
    };
  } catch {
    return DEFAULT_ENGINE_STATE;
  }
}

export function writeEngineState(repoRoot: string, state: EngineState): void {
  const statePath = engineStatePath(repoRoot);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}
