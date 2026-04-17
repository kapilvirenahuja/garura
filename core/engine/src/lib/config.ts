/**
 * MDB Configuration System
 *
 * Reads .meridian/core/config.yaml with path resolution, sensible defaults,
 * configurable target repository path, reload without restart, and graceful
 * handling of missing/invalid config files.
 *
 * Fulfills: VAL-FOUND-069, VAL-FOUND-070, VAL-FOUND-071, VAL-FOUND-072, VAL-FOUND-073
 */

import fs from 'node:fs';
import yaml from 'js-yaml';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MdbConfig {
  /** Project metadata */
  readonly project: {
    readonly name: string;
    readonly type: string;
  };
  /** Target repository for artifact reading */
  readonly repo: {
    readonly path: string;
  };
  /** Short-Term Memory (STM) paths */
  readonly stm: {
    readonly basePath: string;
  };
  /** Product artifact paths */
  readonly product: {
    readonly basePath: string;
  };
  /** Component source directories */
  readonly components: {
    readonly skills: string;
    readonly agents: string;
  };
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG: MdbConfig = Object.freeze({
  project: Object.freeze({
    name: 'Untitled Project',
    type: '',
  }),
  repo: Object.freeze({
    path: process.cwd(),
  }),
  stm: Object.freeze({
    basePath: '.meridian/project/issues/',
  }),
  product: Object.freeze({
    basePath: '.meridian/product/',
  }),
  components: Object.freeze({
    skills: './core/components/skills/',
    agents: './core/components/agents/',
  }),
});

// ---------------------------------------------------------------------------
// Internal raw YAML shape (snake_case / kebab-case keys from YAML)
// ---------------------------------------------------------------------------

interface RawConfig {
  project?: {
    name?: string;
    type?: string;
  };
  repo?: {
    path?: string;
  };
  stm?: {
    'base-path'?: string;
  };
  product?: {
    'base-path'?: string;
  };
  components?: {
    skills?: string;
    agents?: string;
  };
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let currentConfig: MdbConfig = DEFAULT_CONFIG;
let currentConfigPath: string | null = null;

// ---------------------------------------------------------------------------
// Deep-freeze helper
// ---------------------------------------------------------------------------

function deepFreeze<T extends object>(obj: T): Readonly<T> {
  // Freeze nested objects first (bottom-up), then freeze the parent
  const clone = { ...obj } as Record<string, unknown>;
  for (const key of Object.keys(clone)) {
    const value = clone[key];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      clone[key] = deepFreeze(value as object);
    }
  }
  return Object.freeze(clone) as Readonly<T>;
}

// ---------------------------------------------------------------------------
// Merge helper — fills missing keys with defaults
// ---------------------------------------------------------------------------

function mergeWithDefaults(raw: RawConfig): MdbConfig {
  return deepFreeze({
    project: {
      name: raw.project?.name ?? DEFAULT_CONFIG.project.name,
      type: raw.project?.type ?? DEFAULT_CONFIG.project.type,
    },
    repo: {
      path: raw.repo?.path ?? DEFAULT_CONFIG.repo.path,
    },
    stm: {
      basePath: raw.stm?.['base-path'] ?? DEFAULT_CONFIG.stm.basePath,
    },
    product: {
      basePath: raw.product?.['base-path'] ?? DEFAULT_CONFIG.product.basePath,
    },
    components: {
      skills: raw.components?.skills ?? DEFAULT_CONFIG.components.skills,
      agents: raw.components?.agents ?? DEFAULT_CONFIG.components.agents,
    },
  }) as MdbConfig;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load configuration from a YAML file.
 *
 * - Falls back to defaults when the file is missing.
 * - Falls back to defaults when the YAML is malformed.
 * - Fills missing keys with sensible defaults (partial config).
 * - Logs warnings instead of crashing on errors.
 *
 * @param configPath — Absolute or relative path to config.yaml
 * @returns The resolved MdbConfig
 */
export function loadConfig(configPath: string): MdbConfig {
  currentConfigPath = configPath;

  // Check if file exists
  if (!fs.existsSync(configPath)) {
    console.warn(`[mdb-config] config file not found: ${configPath} — using defaults`);
    currentConfig = DEFAULT_CONFIG;
    return currentConfig;
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = yaml.load(raw) as RawConfig | null | undefined;

    // Empty file or null YAML → defaults
    if (!parsed || typeof parsed !== 'object') {
      currentConfig = DEFAULT_CONFIG;
      return currentConfig;
    }

    currentConfig = mergeWithDefaults(parsed);
    return currentConfig;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[mdb-config] Failed to parse config at ${configPath}: ${message} — using defaults`,
    );
    currentConfig = DEFAULT_CONFIG;
    return currentConfig;
  }
}

/**
 * Get the current configuration.
 * Returns defaults if loadConfig has not been called.
 */
export function getConfig(): MdbConfig {
  return currentConfig;
}

/**
 * Reload the configuration from the previously-loaded file path.
 * If no config has been loaded yet, this is a no-op returning defaults.
 */
export function reloadConfig(): MdbConfig {
  if (currentConfigPath) {
    return loadConfig(currentConfigPath);
  }
  return currentConfig;
}

/**
 * Reset config to defaults. Primarily used in tests.
 */
export function resetConfig(): void {
  currentConfig = DEFAULT_CONFIG;
  currentConfigPath = null;
}
