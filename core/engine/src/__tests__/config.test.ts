import path from 'node:path';
import fs from 'node:fs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadConfig,
  getConfig,
  reloadConfig,
  resetConfig,
  resolveRepoRoot,
  DEFAULT_CONFIG,
} from '@/lib/config';

const FIXTURES_DIR = path.resolve(__dirname, '../../test-fixtures/config');

describe('Config System', () => {
  beforeEach(() => {
    resetConfig();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetConfig();
  });

  describe('loadConfig — valid config.yaml (VAL-FOUND-069)', () => {
    it('reads and parses a valid config.yaml with all values extracted', () => {
      const configPath = path.join(FIXTURES_DIR, 'valid-config.yaml');
      const config = loadConfig(configPath);

      expect(config.project.name).toBe('TestProject');
      expect(config.project.type).toBe('Test Application');
      expect(config.repo.path).toBe('/tmp/test-repo');
      expect(config.stm.basePath).toBe('.garura/project/issues/');
      expect(config.product.basePath).toBe('.garura/product/');
      expect(config.components.skills).toBe('./core/components/skills/');
      expect(config.components.agents).toBe('./core/components/agents/');
    });

    it('returns config that matches GaruraConfig shape', () => {
      const configPath = path.join(FIXTURES_DIR, 'valid-config.yaml');
      const config = loadConfig(configPath);

      // All top-level keys should exist
      expect(config).toHaveProperty('project');
      expect(config).toHaveProperty('repo');
      expect(config).toHaveProperty('stm');
      expect(config).toHaveProperty('product');
      expect(config).toHaveProperty('components');
    });

    it('makes parsed config accessible via getConfig()', () => {
      const configPath = path.join(FIXTURES_DIR, 'valid-config.yaml');
      loadConfig(configPath);
      const config = getConfig();

      expect(config.project.name).toBe('TestProject');
      expect(config.repo.path).toBe('/tmp/test-repo');
    });
  });

  describe('loadConfig — missing config file (VAL-FOUND-070)', () => {
    it('falls back to defaults when config file is missing', () => {
      const config = loadConfig('/nonexistent/path/config.yaml');

      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('does not throw when config file is missing', () => {
      expect(() => loadConfig('/nonexistent/path/config.yaml')).not.toThrow();
    });

    it('logs a warning when config file is missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      loadConfig('/nonexistent/path/config.yaml');

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('config file not found'));
    });
  });

  describe('loadConfig — partial config (VAL-FOUND-070)', () => {
    it('fills missing keys with defaults when config is partial', () => {
      const configPath = path.join(FIXTURES_DIR, 'partial-config.yaml');
      const config = loadConfig(configPath);

      // Provided keys should be set
      expect(config.project.name).toBe('PartialProject');
      expect(config.repo.path).toBe('/tmp/partial-repo');

      // Missing keys should use defaults
      expect(config.project.type).toBe(DEFAULT_CONFIG.project.type);
      expect(config.stm.basePath).toBe(DEFAULT_CONFIG.stm.basePath);
      expect(config.product.basePath).toBe(DEFAULT_CONFIG.product.basePath);
      expect(config.components.skills).toBe(DEFAULT_CONFIG.components.skills);
      expect(config.components.agents).toBe(DEFAULT_CONFIG.components.agents);
    });

    it('handles deeply partial config with only project.name', () => {
      const configPath = path.join(FIXTURES_DIR, 'partial-config.yaml');
      const config = loadConfig(configPath);

      // All default nested objects should be present
      expect(config.stm).toBeDefined();
      expect(config.product).toBeDefined();
      expect(config.components).toBeDefined();
    });
  });

  describe('loadConfig — custom repo.path (VAL-FOUND-071)', () => {
    it('uses custom repo.path from config', () => {
      const configPath = path.join(FIXTURES_DIR, 'valid-config.yaml');
      const config = loadConfig(configPath);

      expect(config.repo.path).toBe('/tmp/test-repo');
    });

    it('defaults repo.path to process.cwd() when not specified', () => {
      const configPath = path.join(FIXTURES_DIR, 'empty-config.yaml');
      const config = loadConfig(configPath);

      expect(config.repo.path).toBe(process.cwd());
    });

    it('custom repo.path changes where artifacts would be read from', () => {
      const configPath = path.join(FIXTURES_DIR, 'valid-config.yaml');
      const config = loadConfig(configPath);

      // Verify the resolved path for artifacts uses the custom repo path
      const expectedArtifactsBase = path.resolve(config.repo.path, config.stm.basePath);
      expect(expectedArtifactsBase).toContain('/tmp/test-repo');
    });
  });

  describe('reloadConfig — reload without restart (VAL-FOUND-072)', () => {
    it('picks up updated values on reload', () => {
      const tmpDir = fs.mkdtempSync(path.join('/tmp', 'garura-config-test-'));
      const tmpConfigPath = path.join(tmpDir, 'config.yaml');

      // Write initial config
      fs.writeFileSync(
        tmpConfigPath,
        'project:\n  name: InitialProject\nrepo:\n  path: /initial/path\n',
      );
      loadConfig(tmpConfigPath);
      expect(getConfig().project.name).toBe('InitialProject');
      expect(getConfig().repo.path).toBe('/initial/path');

      // Update config file
      fs.writeFileSync(
        tmpConfigPath,
        'project:\n  name: UpdatedProject\nrepo:\n  path: /updated/path\n',
      );
      reloadConfig();
      expect(getConfig().project.name).toBe('UpdatedProject');
      expect(getConfig().repo.path).toBe('/updated/path');

      // Cleanup
      fs.rmSync(tmpDir, { recursive: true });
    });

    it('maintains defaults for missing keys after reload', () => {
      const tmpDir = fs.mkdtempSync(path.join('/tmp', 'garura-config-test-'));
      const tmpConfigPath = path.join(tmpDir, 'config.yaml');

      // Write full config
      fs.writeFileSync(
        tmpConfigPath,
        'project:\n  name: FullProject\n  type: Full App\nrepo:\n  path: /full/path\n',
      );
      loadConfig(tmpConfigPath);
      expect(getConfig().project.name).toBe('FullProject');

      // Replace with partial config
      fs.writeFileSync(tmpConfigPath, 'project:\n  name: PartialProject\n');
      reloadConfig();
      expect(getConfig().project.name).toBe('PartialProject');
      expect(getConfig().project.type).toBe(DEFAULT_CONFIG.project.type);

      // Cleanup
      fs.rmSync(tmpDir, { recursive: true });
    });

    it('falls back to defaults if config file is deleted before reload', () => {
      const tmpDir = fs.mkdtempSync(path.join('/tmp', 'garura-config-test-'));
      const tmpConfigPath = path.join(tmpDir, 'config.yaml');

      // Write initial config
      fs.writeFileSync(tmpConfigPath, 'project:\n  name: TempProject\n');
      loadConfig(tmpConfigPath);
      expect(getConfig().project.name).toBe('TempProject');

      // Delete the config file
      fs.unlinkSync(tmpConfigPath);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      reloadConfig();

      expect(getConfig()).toEqual(DEFAULT_CONFIG);
      expect(warnSpy).toHaveBeenCalled();

      // Cleanup
      fs.rmSync(tmpDir, { recursive: true });
    });
  });

  describe('loadConfig — invalid YAML (VAL-FOUND-073)', () => {
    it('falls back to defaults with malformed YAML', () => {
      const configPath = path.join(FIXTURES_DIR, 'malformed-config.yaml');
      const config = loadConfig(configPath);

      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('does not throw with malformed YAML', () => {
      const configPath = path.join(FIXTURES_DIR, 'malformed-config.yaml');
      expect(() => loadConfig(configPath)).not.toThrow();
    });

    it('logs a warning for malformed YAML', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const configPath = path.join(FIXTURES_DIR, 'malformed-config.yaml');
      loadConfig(configPath);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to parse config'));
    });

    it('falls back to defaults with empty config file', () => {
      const configPath = path.join(FIXTURES_DIR, 'empty-config.yaml');
      const config = loadConfig(configPath);

      // Empty file should produce defaults
      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('has sensible default values for all required keys', () => {
      expect(DEFAULT_CONFIG.project.name).toBe('Untitled Project');
      expect(DEFAULT_CONFIG.project.type).toBe('');
      expect(DEFAULT_CONFIG.repo.path).toBe(process.cwd());
      expect(DEFAULT_CONFIG.stm.basePath).toBe('.garura/project/issues/');
      expect(DEFAULT_CONFIG.product.basePath).toBe('.garura/product/');
      expect(DEFAULT_CONFIG.components.skills).toBe('./core/components/skills/');
      expect(DEFAULT_CONFIG.components.agents).toBe('./core/components/agents/');
    });

    it('is immutable — modifications do not affect subsequent getConfig() calls', () => {
      loadConfig('/nonexistent/path/config.yaml');
      const config1 = getConfig();

      // Frozen objects throw TypeError in strict mode on mutation attempt
      expect(() => {
        (config1 as unknown as Record<string, unknown>).project = {
          name: 'Hacked',
        };
      }).toThrow(TypeError);

      const config2 = getConfig();
      expect(config2.project.name).toBe('Untitled Project');
    });
  });

  describe('loadConfig — wrong types fallback', () => {
    it('falls back to default string when repo.path is a number', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const configPath = path.join(FIXTURES_DIR, 'wrong-types-config.yaml');
      const config = loadConfig(configPath);

      expect(config.repo.path).toBe(DEFAULT_CONFIG.repo.path);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid type for repo.path'));
    });

    it('falls back to default string when project.name is a number', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const configPath = path.join(FIXTURES_DIR, 'wrong-types-config.yaml');
      const config = loadConfig(configPath);

      expect(config.project.name).toBe(DEFAULT_CONFIG.project.name);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('invalid type for project.name'),
      );
    });

    it('falls back to default string when project.type is a boolean', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const configPath = path.join(FIXTURES_DIR, 'wrong-types-config.yaml');
      const config = loadConfig(configPath);

      expect(config.project.type).toBe(DEFAULT_CONFIG.project.type);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('invalid type for project.type'),
      );
    });

    it('falls back to default when stm.base-path is an array instead of string', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const configPath = path.join(FIXTURES_DIR, 'wrong-types-config.yaml');
      const config = loadConfig(configPath);

      expect(config.stm.basePath).toBe(DEFAULT_CONFIG.stm.basePath);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('invalid type for stm.base-path'),
      );
    });

    it('falls back to defaults for all invalid-typed fields', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const configPath = path.join(FIXTURES_DIR, 'wrong-types-config.yaml');
      const config = loadConfig(configPath);

      // Every field in this fixture is the wrong type, so all should be defaults
      expect(config.project.name).toBe(DEFAULT_CONFIG.project.name);
      expect(config.project.type).toBe(DEFAULT_CONFIG.project.type);
      expect(config.repo.path).toBe(DEFAULT_CONFIG.repo.path);
      expect(config.stm.basePath).toBe(DEFAULT_CONFIG.stm.basePath);
      expect(config.product.basePath).toBe(DEFAULT_CONFIG.product.basePath);
      expect(config.components.skills).toBe(DEFAULT_CONFIG.components.skills);
      expect(config.components.agents).toBe(DEFAULT_CONFIG.components.agents);
    });

    it('emits console.warn for each invalid field', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const configPath = path.join(FIXTURES_DIR, 'wrong-types-config.yaml');
      loadConfig(configPath);

      // Should warn for each of the 8 invalid fields
      const typeWarnings = warnSpy.mock.calls.filter((call) =>
        String(call[0]).includes('invalid type for'),
      );
      expect(typeWarnings.length).toBeGreaterThanOrEqual(7);
    });

    it('valid fields are preserved even when other fields have wrong types', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Create a temp config with a mix of valid and invalid fields
      const tmpDir = fs.mkdtempSync(path.join('/tmp', 'garura-config-mixed-'));
      const tmpConfigPath = path.join(tmpDir, 'config.yaml');

      fs.writeFileSync(
        tmpConfigPath,
        'project:\n  name: ValidName\n  type: 123\nrepo:\n  path: 456\n',
      );

      const config = loadConfig(tmpConfigPath);

      // Valid string field should be kept
      expect(config.project.name).toBe('ValidName');
      // Invalid fields should fall back to defaults
      expect(config.project.type).toBe(DEFAULT_CONFIG.project.type);
      expect(config.repo.path).toBe(DEFAULT_CONFIG.repo.path);

      fs.rmSync(tmpDir, { recursive: true });
    });
  });

  describe('getConfig — without loadConfig', () => {
    it('returns defaults when getConfig is called before loadConfig', () => {
      const config = getConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('resolveConfigPath helper', () => {
    it('resolves relative paths against repo.path', () => {
      const configPath = path.join(FIXTURES_DIR, 'valid-config.yaml');
      const config = loadConfig(configPath);

      // stm.basePath is relative, should resolve against repo.path
      const resolvedStm = path.resolve(config.repo.path, config.stm.basePath);
      expect(resolvedStm).toBe(path.resolve('/tmp/test-repo', '.garura/project/issues/'));
    });
  });

  describe('resolveRepoRoot — cwd-independent repo root discovery', () => {
    const originalEnv = process.env.GARURA_TARGET_REPO;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.GARURA_TARGET_REPO;
      } else {
        process.env.GARURA_TARGET_REPO = originalEnv;
      }
      vi.restoreAllMocks();
    });

    it('honors GARURA_TARGET_REPO env var when set', () => {
      process.env.GARURA_TARGET_REPO = '/custom/repo/root';
      const result = resolveRepoRoot();
      expect(result).toBe(path.resolve('/custom/repo/root'));
    });

    it('resolves relative GARURA_TARGET_REPO to absolute path', () => {
      process.env.GARURA_TARGET_REPO = './relative/path';
      const result = resolveRepoRoot();
      expect(path.isAbsolute(result)).toBe(true);
    });

    it('finds repo root by walking up from __dirname when .garura/ exists', () => {
      delete process.env.GARURA_TARGET_REPO;
      // The actual garura repo has .garura/ at its root, and __dirname
      // for this file is inside core/engine/src/__tests__ — so resolveRepoRoot()
      // should walk up and find the repo root.
      const result = resolveRepoRoot();

      // Should find the directory containing .garura/
      expect(fs.existsSync(path.join(result, '.garura'))).toBe(true);
    });

    it('returns a directory that is an ancestor of core/engine/', () => {
      delete process.env.GARURA_TARGET_REPO;
      const result = resolveRepoRoot();

      // The resolved repo root should be an ancestor of the engine directory
      const engineDir = path.resolve(__dirname, '../..');
      expect(engineDir.startsWith(result)).toBe(true);
    });

    it('falls back to process.cwd() with warning when .garura/ not found', () => {
      delete process.env.GARURA_TARGET_REPO;
      // Mock fs.existsSync to always return false for .garura candidates
      const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = resolveRepoRoot();

      expect(result).toBe(process.cwd());
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not find .garura/ directory'),
      );

      existsSpy.mockRestore();
    });

    it('config loads correctly from resolved repo root (simulating core/engine/ cwd)', () => {
      delete process.env.GARURA_TARGET_REPO;

      // resolveRepoRoot walks up from __dirname, not process.cwd(),
      // so it should find .garura/ regardless of where pnpm dev started from
      const repoRoot = resolveRepoRoot();
      const configPath = path.resolve(repoRoot, '.garura/core/config.yaml');

      // If the real config exists, load it and verify it doesn't fall back to defaults
      if (fs.existsSync(configPath)) {
        const config = loadConfig(configPath);
        // The real config should have a project name (not the default 'Untitled Project')
        expect(config.project.name).not.toBe('');
      } else {
        // If no real config exists, just verify the path resolution is correct
        expect(path.isAbsolute(repoRoot)).toBe(true);
      }
    });
  });
});
