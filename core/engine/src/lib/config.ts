/**
 * Garura Configuration System
 *
 * Reads .garura/core/config.yaml with path resolution, sensible defaults,
 * configurable target repository path, reload without restart, and graceful
 * handling of missing/invalid config files.
 *
 * Fulfills: VAL-FOUND-069, VAL-FOUND-070, VAL-FOUND-071, VAL-FOUND-072, VAL-FOUND-073
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GaruraConfig {
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

export const DEFAULT_CONFIG: GaruraConfig = Object.freeze({
  project: Object.freeze({
    name: 'Untitled Project',
    type: '',
  }),
  repo: Object.freeze({
    path: process.cwd(),
  }),
  stm: Object.freeze({
    basePath: '.garura/project/issues/',
  }),
  product: Object.freeze({
    basePath: '.garura/product/',
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
// Repo root resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the repository root directory independently of process.cwd().
 *
 * Resolution order:
 * 1. `GARURA_TARGET_REPO` env var — explicit override
 * 2. Walk up from this file's directory (__dirname) looking for the nearest
 *    directory containing a `.garura/` subdirectory.
 * 3. Fall back to `process.cwd()` with a warning when `.garura/` cannot be
 *    found anywhere in the ancestor chain.
 */
export function resolveRepoRoot(): string {
  // 1. Explicit env var override
  const envRoot = process.env.GARURA_TARGET_REPO;
  if (envRoot) {
    return path.resolve(envRoot);
  }

  // 2. Walk up from __dirname to find nearest .garura/
  let current = __dirname;
  const root = path.parse(current).root;

  while (current !== root) {
    const candidate = path.join(current, '.garura');
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break; // safety: reached filesystem root
    current = parent;
  }

  // 3. Fallback to cwd with warning
  console.warn(
    '[garura-config] Could not find .garura/ directory in any ancestor of ' +
      `${__dirname} — falling back to process.cwd() (${process.cwd()})`,
  );
  return process.cwd();
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let currentConfig: GaruraConfig = DEFAULT_CONFIG;
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
// Type validation helper
// ---------------------------------------------------------------------------

/**
 * Validate that a config value is of the expected type.
 * Returns the value if valid, otherwise logs a warning and returns the default.
 */
function validateField<T>(
  value: unknown,
  expectedType: string,
  fieldPath: string,
  defaultValue: T,
): T {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value !== expectedType) {
    console.warn(
      `[garura-config] invalid type for ${fieldPath}: expected ${expectedType}, got ${typeof value} — using default`,
    );
    return defaultValue;
  }
  return value as T;
}

// ---------------------------------------------------------------------------
// Merge helper — fills missing keys with defaults + type validation
// ---------------------------------------------------------------------------

function mergeWithDefaults(raw: RawConfig): GaruraConfig {
  return deepFreeze({
    project: {
      name: validateField(raw.project?.name, 'string', 'project.name', DEFAULT_CONFIG.project.name),
      type: validateField(raw.project?.type, 'string', 'project.type', DEFAULT_CONFIG.project.type),
    },
    repo: {
      path: validateField(raw.repo?.path, 'string', 'repo.path', DEFAULT_CONFIG.repo.path),
    },
    stm: {
      basePath: validateField(
        raw.stm?.['base-path'],
        'string',
        'stm.base-path',
        DEFAULT_CONFIG.stm.basePath,
      ),
    },
    product: {
      basePath: validateField(
        raw.product?.['base-path'],
        'string',
        'product.base-path',
        DEFAULT_CONFIG.product.basePath,
      ),
    },
    components: {
      skills: validateField(
        raw.components?.skills,
        'string',
        'components.skills',
        DEFAULT_CONFIG.components.skills,
      ),
      agents: validateField(
        raw.components?.agents,
        'string',
        'components.agents',
        DEFAULT_CONFIG.components.agents,
      ),
    },
  }) as GaruraConfig;
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
 * @returns The resolved GaruraConfig
 */
export function loadConfig(configPath: string): GaruraConfig {
  currentConfigPath = configPath;

  // Check if file exists
  if (!fs.existsSync(configPath)) {
    console.warn(`[garura-config] config file not found: ${configPath} — using defaults`);
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
      `[garura-config] Failed to parse config at ${configPath}: ${message} — using defaults`,
    );
    currentConfig = DEFAULT_CONFIG;
    return currentConfig;
  }
}

/**
 * Get the current configuration.
 * Returns defaults if loadConfig has not been called.
 */
export function getConfig(): GaruraConfig {
  return currentConfig;
}

/**
 * Reload the configuration from the previously-loaded file path.
 * If no config has been loaded yet, this is a no-op returning defaults.
 */
export function reloadConfig(): GaruraConfig {
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
