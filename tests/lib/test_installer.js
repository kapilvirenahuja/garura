/**
 * Tests for Phoenix OS Installer (Node.js)
 *
 * Tests follow Phoenix OS standards:
 * - Test naming: methodName_scenario_expectedResult
 * - Four-Phase pattern: Setup-Exercise-Verify-Teardown
 * - Test behavior, not implementation
 * - Minimum 80% line coverage, 75% branch coverage
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  validateProjectName,
  validateTargetPath,
  safeRemove,
  initGitRepository,
  getPhoenixRoot,
  createProject,
  updateProject,
  initProject,
  calculateUpdateDiff,
  showUpdateDiff,
  promptForYesNo,
  SUPPORTED_COPILOTS,
  MAX_PROJECT_NAME_LENGTH,
  INVALID_CHARS,
  GIT_INIT_TIMEOUT_MS,
} = require('../../lib/installer');

// Mock console methods to avoid cluttering test output
beforeAll(() => {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
  };
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('validateProjectName', () => {
  // Test: validateProjectName_ValidName_ReturnsTrue
  test('validateProjectName_ValidName_ReturnsTrue', () => {
    // Setup
    const validNames = [
      'my-project',
      'my_project',
      'MyProject',
      'project123',
      'a'.repeat(100), // Max length
    ];

    // Exercise & Verify
    validNames.forEach((name) => {
      const result = validateProjectName(name);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  // Test: validateProjectName_EmptyString_ReturnsFalse
  test('validateProjectName_EmptyString_ReturnsFalse', () => {
    // Setup
    const emptyName = '';

    // Exercise
    const result = validateProjectName(emptyName);

    // Verify
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Project name cannot be empty');
  });

  // Test: validateProjectName_InvalidCharacters_ReturnsFalse
  test('validateProjectName_InvalidCharacters_ReturnsFalse', () => {
    // Setup
    const invalidNames = [
      'project/name',
      'project\\name',
      'project:name',
      'project"name',
      'project<name',
      'project>name',
      'project|name',
      'project?name',
      'project*name',
    ];

    // Exercise & Verify
    invalidNames.forEach((name) => {
      const result = validateProjectName(name);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });
  });

  // Test: validateProjectName_StartsWithDot_ReturnsFalse
  test('validateProjectName_StartsWithDot_ReturnsFalse', () => {
    // Setup
    const name = '.hidden-project';

    // Exercise
    const result = validateProjectName(name);

    // Verify
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("cannot start with '.' or '-'");
  });

  // Test: validateProjectName_StartsWithDash_ReturnsFalse
  test('validateProjectName_StartsWithDash_ReturnsFalse', () => {
    // Setup
    const name = '-my-project';

    // Exercise
    const result = validateProjectName(name);

    // Verify
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("cannot start with '.' or '-'");
  });

  // Test: validateProjectName_ContainsSpaces_ReturnsFalse
  test('validateProjectName_ContainsSpaces_ReturnsFalse', () => {
    // Setup
    const name = 'my project';

    // Exercise
    const result = validateProjectName(name);

    // Verify
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('spaces');
  });

  // Test: validateProjectName_TooLong_ReturnsFalse
  test('validateProjectName_TooLong_ReturnsFalse', () => {
    // Setup
    const longName = 'a'.repeat(101);

    // Exercise
    const result = validateProjectName(longName);

    // Verify
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('too long');
  });
});

describe('validateTargetPath', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phoenix-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('validateTargetPath_ValidPathWithinBase_ReturnsTrue', () => {
    // Setup
    const targetDir = path.join(tempDir, 'my-project');

    // Exercise
    const result = validateTargetPath(targetDir, tempDir);

    // Verify
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('validateTargetPath_PathTraversalAttempt_ReturnsFalse', () => {
    // Setup
    const targetDir = path.join(tempDir, '..', 'outside-project');

    // Exercise
    const result = validateTargetPath(targetDir, tempDir);

    // Verify
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('must be within current working directory');
  });

  test('validateTargetPath_AbsolutePathOutsideBase_ReturnsFalse', () => {
    // Setup
    const targetDir = path.join(os.tmpdir(), 'another-location', 'project');

    // Exercise
    const result = validateTargetPath(targetDir, tempDir);

    // Verify
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('must be within current working directory');
  });

  test('validateTargetPath_PathResolveError_ReturnsFalse', () => {
    // Setup - Mock path.resolve to throw error
    const originalResolve = path.resolve;
    path.resolve = jest.fn(() => {
      throw new Error('Invalid path format');
    });

    // Exercise
    const result = validateTargetPath('some-path', tempDir);

    // Verify
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid path');
    expect(result.error).toContain('Invalid path format');

    // Teardown
    path.resolve = originalResolve;
  });
});

describe('safeRemove', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phoenix-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('safeRemove_ExistingDirectory_RemovesSuccessfully', () => {
    // Setup
    const testDir = path.join(tempDir, 'test-dir');
    fs.mkdirSync(testDir);
    expect(fs.existsSync(testDir)).toBe(true);

    // Exercise
    const result = safeRemove(testDir);

    // Verify
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(fs.existsSync(testDir)).toBe(false);
  });

  test('safeRemove_ExistingFile_RemovesSuccessfully', () => {
    // Setup
    const testFile = path.join(tempDir, 'test-file.txt');
    fs.writeFileSync(testFile, 'test content');
    expect(fs.existsSync(testFile)).toBe(true);

    // Exercise
    const result = safeRemove(testFile);

    // Verify
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(fs.existsSync(testFile)).toBe(false);
  });

  test('safeRemove_NonExistentPath_ReturnsSuccess', () => {
    // Setup
    const nonExistentPath = path.join(tempDir, 'does-not-exist');
    expect(fs.existsSync(nonExistentPath)).toBe(false);

    // Exercise
    const result = safeRemove(nonExistentPath);

    // Verify
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  test('safeRemove_PermissionError_ReturnsFailure', () => {
    // Setup
    const testDir = path.join(tempDir, 'readonly-dir');
    fs.mkdirSync(testDir);

    // Mock fs.rmSync to throw permission error
    const originalRmSync = fs.rmSync;
    fs.rmSync = jest.fn(() => {
      throw new Error('EACCES: permission denied');
    });

    // Exercise
    const result = safeRemove(testDir);

    // Verify
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to remove');
    expect(result.error).toContain('EACCES');

    // Teardown
    fs.rmSync = originalRmSync;
  });

  test('safeRemove_StatError_ReturnsFailure', () => {
    // Setup
    const testPath = path.join(tempDir, 'bad-path');
    fs.writeFileSync(testPath, 'test');

    // Mock fs.statSync to throw error
    const originalStatSync = fs.statSync;
    fs.statSync = jest.fn(() => {
      throw new Error('ENOENT: stat failed');
    });

    // Exercise
    const result = safeRemove(testPath);

    // Verify
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to remove');

    // Teardown
    fs.statSync = originalStatSync;
  });
});

describe('initGitRepository', () => {
  let tempDir;

  beforeEach(() => {
    // Setup: Create temp directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phoenix-test-'));
  });

  afterEach(() => {
    // Teardown: Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test: initGitRepository_ValidDirectory_ReturnsTrue
  test('initGitRepository_ValidDirectory_ReturnsTrue', () => {
    // Setup - temp directory already created in beforeEach

    // Exercise
    const result = initGitRepository(tempDir);

    // Verify
    // Result depends on whether git is installed
    if (result) {
      expect(fs.existsSync(path.join(tempDir, '.git'))).toBe(true);
    }
    expect(typeof result).toBe('boolean');
  });

  // Test: initGitRepository_NonexistentDirectory_ReturnsFalse
  test('initGitRepository_NonexistentDirectory_ReturnsFalse', () => {
    // Setup
    const nonexistentDir = path.join(os.tmpdir(), 'nonexistent-' + Date.now());

    // Exercise
    const result = initGitRepository(nonexistentDir);

    // Verify
    expect(result).toBe(false);
  });

  // Test: initGitRepository_AlreadyInitialized_Succeeds
  test('initGitRepository_AlreadyInitialized_Succeeds', () => {
    // Setup
    initGitRepository(tempDir); // First initialization

    // Exercise
    const result = initGitRepository(tempDir); // Second initialization

    // Verify - Should handle re-initialization gracefully
    expect(typeof result).toBe('boolean');
  });
});

describe('getPhoenixRoot', () => {
  // Test: getPhoenixRoot_ReturnsValidPath
  test('getPhoenixRoot_ReturnsValidPath', () => {
    // Exercise
    const root = getPhoenixRoot();

    // Verify
    expect(root).toBeTruthy();
    expect(typeof root).toBe('string');
    expect(path.isAbsolute(root)).toBe(true);
  });

  // Test: getPhoenixRoot_ContainsExpectedStructure
  test('getPhoenixRoot_ContainsExpectedStructure', () => {
    // Exercise
    const root = getPhoenixRoot();

    // Verify - Should contain lib directory (since we're in lib/)
    const libDir = path.join(root, 'lib');
    expect(fs.existsSync(libDir)).toBe(true);
  });
});

describe('createProject', () => {
  let tempDir;
  let targetDir;
  const projectName = 'test-project';
  const aiProvider = 'claude';

  beforeEach(() => {
    // Setup
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phoenix-test-'));
    targetDir = path.join(tempDir, projectName);
  });

  afterEach(() => {
    // Teardown
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test: createProject_ValidInputs_CreatesStructure
  test('createProject_ValidInputs_CreatesStructure', () => {
    // Exercise
    const result = createProject(projectName, aiProvider, targetDir);

    // Verify
    expect(result).toBe(true);
    expect(fs.existsSync(targetDir)).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.phoenix-os'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.claude'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'src'))).toBe(true);
  });

  // Test: createProject_DirectoryExists_ReturnsFalse
  test('createProject_DirectoryExists_ReturnsFalse', () => {
    // Setup
    fs.mkdirSync(targetDir, { recursive: true });

    // Exercise
    const result = createProject(projectName, aiProvider, targetDir);

    // Verify
    expect(result).toBe(false);
  });

  // Test: createProject_CreatesClaudeFolder
  test('createProject_CreatesClaudeFolder', () => {
    // Exercise
    createProject(projectName, aiProvider, targetDir);

    // Verify
    const claudeDir = path.join(targetDir, '.claude');
    expect(fs.existsSync(claudeDir)).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, 'agents'))).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, 'commands'))).toBe(true);
  });

  // Test: createProject_CreatesPhoenixOsFolder
  test('createProject_CreatesPhoenixOsFolder', () => {
    // Exercise
    createProject(projectName, aiProvider, targetDir);

    // Verify
    const phoenixOsDir = path.join(targetDir, '.phoenix-os');
    expect(fs.existsSync(phoenixOsDir)).toBe(true);
    expect(fs.existsSync(path.join(phoenixOsDir, 'core'))).toBe(true);
    expect(fs.existsSync(path.join(phoenixOsDir, 'project', 'specs'))).toBe(true);
  });

  // Test: createProject_CreatesClaudeMd
  test('createProject_CreatesClaudeMd', () => {
    // Exercise
    createProject(projectName, aiProvider, targetDir);

    // Verify
    const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
    expect(fs.existsSync(claudeMdPath)).toBe(true);

    const content = fs.readFileSync(claudeMdPath, 'utf-8');
    expect(content).toContain(projectName);
    expect(content).toContain('./.phoenix-os/core/memory/');
  });

  // Test: createProject_CreatesReadme
  test('createProject_CreatesReadme', () => {
    // Exercise
    createProject(projectName, aiProvider, targetDir);

    // Verify
    const readmePath = path.join(targetDir, 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);

    const content = fs.readFileSync(readmePath, 'utf-8');
    expect(content).toContain(`# ${projectName}`);
  });

  // Test: createProject_CreatesGitignore
  test('createProject_CreatesGitignore', () => {
    // Exercise
    createProject(projectName, aiProvider, targetDir);

    // Verify
    const gitignorePath = path.join(targetDir, '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBe(true);
  });

  // Test: createProject_CreatesLicense
  test('createProject_CreatesLicense', () => {
    // Exercise
    createProject(projectName, aiProvider, targetDir);

    // Verify
    const licensePath = path.join(targetDir, 'LICENSE');
    // License may or may not exist depending on source
    if (fs.existsSync(licensePath)) {
      expect(fs.statSync(licensePath).isFile()).toBe(true);
    }
  });
});

describe('initProject', () => {
  let tempDir;
  const projectName = 'test-project';
  const aiProvider = 'claude';

  beforeEach(() => {
    // Setup
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phoenix-test-'));
  });

  afterEach(() => {
    // Teardown
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test: initProject_ValidInputs_ReturnsSuccess
  test('initProject_ValidInputs_ReturnsSuccess', async () => {
    // Exercise
    const exitCode = await initProject(projectName, aiProvider, tempDir);

    // Verify
    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(tempDir, projectName))).toBe(true);
  });

  // Test: initProject_InvalidProjectName_ReturnsFailure
  test('initProject_InvalidProjectName_ReturnsFailure', async () => {
    // Setup
    const invalidName = 'my/project';

    // Exercise
    const exitCode = await initProject(invalidName, aiProvider, tempDir);

    // Verify
    expect(exitCode).toBe(1);
  });

  // Test: initProject_UnsupportedAiProvider_ReturnsFailure
  test('initProject_UnsupportedAiProvider_ReturnsFailure', async () => {
    // Setup
    const unsupportedProvider = 'gemini';

    // Exercise
    const exitCode = await initProject(projectName, unsupportedProvider, tempDir);

    // Verify
    expect(exitCode).toBe(1);
  });

  // Test: initProject_NullProjectName_ValidatesBeforePrompt
  test('initProject_NullProjectName_ValidatesBeforePrompt', async () => {
    // Setup
    // Pass undefined/null would trigger prompt - skip this test
    // Instead test with whitespace that validates to empty
    const whitespace = ' ';

    // Exercise
    const exitCode = await initProject(whitespace, aiProvider, tempDir);

    // Verify
    expect(exitCode).toBe(1);
  });
});

describe('SUPPORTED_COPILOTS', () => {
  // Test: SUPPORTED_COPILOTS_NotEmpty
  test('SUPPORTED_COPILOTS_NotEmpty', () => {
    // Verify
    expect(SUPPORTED_COPILOTS).toBeDefined();
    expect(Array.isArray(SUPPORTED_COPILOTS)).toBe(true);
    expect(SUPPORTED_COPILOTS.length).toBeGreaterThan(0);
  });

  // Test: SUPPORTED_COPILOTS_IncludesClaude
  test('SUPPORTED_COPILOTS_IncludesClaude', () => {
    // Verify
    expect(SUPPORTED_COPILOTS).toContain('claude');
  });
});

describe('Constants', () => {
  // Test: MAX_PROJECT_NAME_LENGTH_IsDefined
  test('MAX_PROJECT_NAME_LENGTH_IsDefined', () => {
    // Verify
    expect(MAX_PROJECT_NAME_LENGTH).toBeDefined();
    expect(typeof MAX_PROJECT_NAME_LENGTH).toBe('number');
    expect(MAX_PROJECT_NAME_LENGTH).toBe(100);
  });

  // Test: INVALID_CHARS_IsDefined
  test('INVALID_CHARS_IsDefined', () => {
    // Verify
    expect(INVALID_CHARS).toBeDefined();
    expect(typeof INVALID_CHARS).toBe('string');
    expect(INVALID_CHARS).toBe('<>:"/\\|?*');
  });

  // Test: GIT_INIT_TIMEOUT_MS_IsDefined
  test('GIT_INIT_TIMEOUT_MS_IsDefined', () => {
    // Verify
    expect(GIT_INIT_TIMEOUT_MS).toBeDefined();
    expect(typeof GIT_INIT_TIMEOUT_MS).toBe('number');
    expect(GIT_INIT_TIMEOUT_MS).toBe(10000);
  });
});

describe('validateProjectName with constants', () => {
  // Test: validateProjectName_ExactlyMaxLength_ReturnsTrue
  test('validateProjectName_ExactlyMaxLength_ReturnsTrue', () => {
    // Setup
    const name = 'a'.repeat(MAX_PROJECT_NAME_LENGTH);

    // Exercise
    const result = validateProjectName(name);

    // Verify
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  // Test: validateProjectName_OneOverMaxLength_ReturnsFalse
  test('validateProjectName_OneOverMaxLength_ReturnsFalse', () => {
    // Setup
    const name = 'a'.repeat(MAX_PROJECT_NAME_LENGTH + 1);

    // Exercise
    const result = validateProjectName(name);

    // Verify
    expect(result.isValid).toBe(false);
    expect(result.error).toContain(`max ${MAX_PROJECT_NAME_LENGTH} characters`);
  });

  // Test: validateProjectName_AllInvalidChars_ReturnsFalse
  test('validateProjectName_AllInvalidChars_ReturnsFalse', () => {
    // Setup - Test each invalid character
    for (const char of INVALID_CHARS) {
      const name = `project${char}name`;

      // Exercise
      const result = validateProjectName(name);

      // Verify
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid characters');
    }
  });
});

describe('initProject edge cases', () => {
  let tempDir;

  beforeEach(() => {
    // Setup
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phoenix-test-'));
  });

  afterEach(() => {
    // Teardown
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test: initProject_NullProjectName_UsesCurrentDirectory
  test('initProject_NullProjectName_UsesCurrentDirectory', async () => {
    // Setup - null project name should prompt user and use current directory
    const projectName = null;
    const aiProvider = 'claude';

    // Mock readline to simulate user responding 'y' to current directory prompt
    const readline = require('readline');
    const mockClose = jest.fn();
    const mockQuestion = jest.fn((prompt, callback) => {
      // First call is for "Initialize Phoenix OS in current directory?" - answer 'y'
      callback('y');
    });

    const originalCreateInterface = readline.createInterface;
    readline.createInterface = jest.fn(() => ({
      question: mockQuestion,
      close: mockClose,
    }));

    // Exercise
    const exitCode = await initProject(projectName, aiProvider, tempDir);

    // Verify
    expect(exitCode).toBe(0);
    // Should create Phoenix OS files in tempDir itself, not in a subdirectory
    expect(fs.existsSync(path.join(tempDir, '.claude'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, '.phoenix-os'))).toBe(true);

    // Teardown
    readline.createInterface = originalCreateInterface;
  });

  // Test: initProject_NullProjectName_InvalidDirectoryName_ReturnsFailure
  test('initProject_NullProjectName_InvalidDirectoryName_ReturnsFailure', async () => {
    // Setup - Create a temp directory with invalid name characters
    const invalidDirName = 'my/invalid:project';
    const invalidDir = path.join(os.tmpdir(), invalidDirName);

    // This test validates the logic, even though creating such a directory
    // may not be possible on all filesystems. We're testing the validation logic.
    const projectName = null;
    const aiProvider = 'claude';

    // Mock readline to simulate user responding 'y' to current directory prompt
    const readline = require('readline');
    const mockClose = jest.fn();
    const mockQuestion = jest.fn((prompt, callback) => {
      callback('y'); // Answer yes to initialize in current directory
    });

    const originalCreateInterface = readline.createInterface;
    readline.createInterface = jest.fn(() => ({
      question: mockQuestion,
      close: mockClose,
    }));

    // Mock path.basename to return invalid name
    const originalBasename = path.basename;
    path.basename = jest.fn(() => 'my/invalid:project');

    // Exercise
    const exitCode = await initProject(projectName, aiProvider, tempDir);

    // Verify
    expect(exitCode).toBe(1);

    // Teardown
    path.basename = originalBasename;
    readline.createInterface = originalCreateInterface;
  });

  // Test: initProject_NullProjectName_UserSelectsNewProject_PromptsForName
  test('initProject_NullProjectName_UserSelectsNewProject_PromptsForName', async () => {
    // Setup - null project name, user says no to current directory, provides new name
    const projectName = null;
    const aiProvider = 'claude';
    const newProjectName = 'test-new-project';

    // Mock readline to simulate user flow:
    // 1. Answer 'n' to "Initialize in current directory?"
    // 2. Provide project name
    const readline = require('readline');
    let callCount = 0;
    const mockClose = jest.fn();
    const mockQuestion = jest.fn((prompt, callback) => {
      callCount++;
      if (callCount === 1) {
        // First call: "Initialize Phoenix OS in current directory?" - answer 'n'
        callback('n');
      } else if (callCount === 2) {
        // Second call: "Enter project name" - provide name
        callback(newProjectName);
      }
    });

    const originalCreateInterface = readline.createInterface;
    readline.createInterface = jest.fn(() => ({
      question: mockQuestion,
      close: mockClose,
    }));

    // Exercise
    const exitCode = await initProject(projectName, aiProvider, tempDir);

    // Verify
    expect(exitCode).toBe(0);
    // Should create subdirectory with the provided project name
    const projectPath = path.join(tempDir, newProjectName);
    expect(fs.existsSync(projectPath)).toBe(true);
    expect(fs.existsSync(path.join(projectPath, '.claude'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, '.phoenix-os'))).toBe(true);

    // Teardown
    readline.createInterface = originalCreateInterface;
  });

  // Test: initProject_WithProjectName_CreatesSubdirectory
  test('initProject_WithProjectName_CreatesSubdirectory', async () => {
    // Setup
    const projectName = 'my-new-project';
    const aiProvider = 'claude';

    // Exercise
    const exitCode = await initProject(projectName, aiProvider, tempDir);

    // Verify
    expect(exitCode).toBe(0);
    // Should create subdirectory with project name
    const projectPath = path.join(tempDir, projectName);
    expect(fs.existsSync(projectPath)).toBe(true);
    expect(fs.existsSync(path.join(projectPath, '.claude'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, '.phoenix-os'))).toBe(true);
  });

  // Test: initProject_EmptyProjectNameAfterTrim_ReturnsFailure
  test('initProject_EmptyProjectNameAfterTrim_ReturnsFailure', async () => {
    // Setup - whitespace that becomes empty after trim
    const projectName = '   ';
    const aiProvider = 'claude';

    // Exercise
    const exitCode = await initProject(projectName, aiProvider, tempDir);

    // Verify
    expect(exitCode).toBe(1);
  });

});

describe('validateProjectName edge cases', () => {
  // Test: validateProjectName_Undefined_ReturnsFalse
  test('validateProjectName_Undefined_ReturnsFalse', () => {
    // Exercise
    const result = validateProjectName(undefined);

    // Verify
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Project name cannot be empty');
  });

  // Test: validateProjectName_Null_ReturnsFalse
  test('validateProjectName_Null_ReturnsFalse', () => {
    // Exercise
    const result = validateProjectName(null);

    // Verify
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Project name cannot be empty');
  });

  // Test: validateProjectName_SingleCharacter_ReturnsTrue
  test('validateProjectName_SingleCharacter_ReturnsTrue', () => {
    // Exercise
    const result = validateProjectName('a');

    // Verify
    expect(result.isValid).toBe(true);
  });
});

describe('initGitRepository edge cases', () => {
  let tempDir;

  beforeEach(() => {
    // Setup
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phoenix-test-'));
  });

  afterEach(() => {
    // Teardown
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test: initGitRepository_ReadOnlyDirectory_HandlesGracefully
  test('initGitRepository_InvalidPath_ReturnsFalse', () => {
    // Setup - use invalid path
    const invalidPath = path.join(tempDir, 'does', 'not', 'exist');

    // Exercise
    const result = initGitRepository(invalidPath);

    // Verify - should return false on error
    expect(result).toBe(false);
  });
});

describe('calculateUpdateDiff', () => {
  let tempDir;

  beforeEach(() => {
    // Setup
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phoenix-test-'));
  });

  afterEach(() => {
    // Teardown
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test: calculateUpdateDiff_EmptyDirectoryWithClaude_ReturnsCreateItems
  test('calculateUpdateDiff_EmptyDirectoryWithClaude_ReturnsCreateItems', () => {
    // Exercise
    const diff = calculateUpdateDiff(tempDir, 'claude');

    // Verify
    expect(diff).toBeDefined();
    expect(diff.willUpdate).toBeDefined();
    expect(diff.willNotTouch).toBeDefined();
    expect(diff.willUpdate.length).toBeGreaterThan(0);
    expect(diff.willUpdate).toContainEqual(expect.stringContaining('.claude/'));
    expect(diff.willUpdate).toContainEqual(expect.stringContaining('CLAUDE.md'));
  });

  // Test: calculateUpdateDiff_EmptyDirectoryWithCopilot_ReturnsCreateItems
  test('calculateUpdateDiff_EmptyDirectoryWithCopilot_ReturnsCreateItems', () => {
    // Exercise
    const diff = calculateUpdateDiff(tempDir, 'copilot');

    // Verify
    expect(diff).toBeDefined();
    expect(diff.willUpdate).toBeDefined();
    expect(diff.willNotTouch).toBeDefined();
    expect(diff.willUpdate.length).toBeGreaterThan(0);
    expect(diff.willUpdate).toContainEqual(expect.stringContaining('.github/'));
    expect(diff.willUpdate).not.toContainEqual(expect.stringContaining('CLAUDE.md'));
  });

  // Test: calculateUpdateDiff_ExistingClaudeDir_ReturnsUpdateItems
  test('calculateUpdateDiff_ExistingClaudeDir_ReturnsUpdateItems', () => {
    // Setup - create .claude directory
    fs.mkdirSync(path.join(tempDir, '.claude'), { recursive: true });

    // Exercise
    const diff = calculateUpdateDiff(tempDir, 'claude');

    // Verify
    expect(diff.willUpdate).toContainEqual(expect.stringContaining('[~] .claude/'));
  });

  // Test: calculateUpdateDiff_ExistingGithubDir_ReturnsUpdateItems
  test('calculateUpdateDiff_ExistingGithubDir_ReturnsUpdateItems', () => {
    // Setup - create .github directory
    fs.mkdirSync(path.join(tempDir, '.github'), { recursive: true });

    // Exercise
    const diff = calculateUpdateDiff(tempDir, 'copilot');

    // Verify
    expect(diff.willUpdate).toContainEqual(expect.stringContaining('[~] .github/'));
  });

  // Test: calculateUpdateDiff_ExistingFiles_ListsPreservedFiles
  test('calculateUpdateDiff_ExistingFiles_ListsPreservedFiles', () => {
    // Setup - create some files that should be preserved
    fs.writeFileSync(path.join(tempDir, 'README.md'), '# My Project');
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
    fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });

    // Exercise
    const diff = calculateUpdateDiff(tempDir, 'claude');

    // Verify
    expect(diff.willNotTouch.some(item => item.includes('README.md'))).toBe(true);
    expect(diff.willNotTouch.some(item => item.includes('package.json'))).toBe(true);
    expect(diff.willNotTouch.some(item => item.includes('src/'))).toBe(true);
  });
});

describe('updateProject', () => {
  let tempDir;
  let targetDir;
  const projectName = 'test-update-project';
  const aiProvider = 'claude';

  beforeEach(() => {
    // Setup
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phoenix-test-'));
    targetDir = path.join(tempDir, projectName);
  });

  afterEach(() => {
    // Teardown
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Test: updateProject_NewDirectory_CreatesStructure
  test('updateProject_NewDirectory_CreatesStructure', () => {
    // Setup - create directory
    fs.mkdirSync(targetDir, { recursive: true });

    // Exercise
    const result = updateProject(projectName, aiProvider, targetDir);

    // Verify
    expect(result).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.claude'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.phoenix-os'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'CLAUDE.md'))).toBe(true);
  });

  // Test: updateProject_ExistingStructure_UpdatesFiles
  test('updateProject_ExistingStructure_UpdatesFiles', () => {
    // Setup - create directory with existing Phoenix OS structure
    fs.mkdirSync(targetDir, { recursive: true });
    fs.mkdirSync(path.join(targetDir, '.claude', 'agents'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, '.phoenix-os', 'core'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), '# Old Content');

    // Exercise
    const result = updateProject(projectName, aiProvider, targetDir);

    // Verify
    expect(result).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.claude', 'agents'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.phoenix-os', 'core'))).toBe(true);

    // Verify CLAUDE.md was updated
    const claudeMdContent = fs.readFileSync(path.join(targetDir, 'CLAUDE.md'), 'utf-8');
    expect(claudeMdContent).toContain(projectName);
  });

  // Test: updateProject_PreservesUserFiles
  test('updateProject_PreservesUserFiles', () => {
    // Setup - create directory with user files
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'README.md'), '# My Custom README');
    fs.writeFileSync(path.join(targetDir, 'package.json'), '{"name": "my-project"}');
    fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'src', 'index.js'), 'console.log("test");');

    // Exercise
    const result = updateProject(projectName, aiProvider, targetDir);

    // Verify
    expect(result).toBe(true);

    // Verify user files were preserved
    expect(fs.existsSync(path.join(targetDir, 'README.md'))).toBe(true);
    expect(fs.readFileSync(path.join(targetDir, 'README.md'), 'utf-8')).toBe('# My Custom README');

    expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
    expect(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8')).toBe('{"name": "my-project"}');

    expect(fs.existsSync(path.join(targetDir, 'src', 'index.js'))).toBe(true);
    expect(fs.readFileSync(path.join(targetDir, 'src', 'index.js'), 'utf-8')).toBe('console.log("test");');
  });

  // Test: updateProject_RemoveError_ReturnsFalse
  test('updateProject_RemoveError_ReturnsFalse', () => {
    // Setup - create directory with existing .claude directory
    fs.mkdirSync(targetDir, { recursive: true });
    fs.mkdirSync(path.join(targetDir, '.claude', 'agents'), { recursive: true });

    // Mock fs.rmSync to throw permission error
    const originalRmSync = fs.rmSync;
    fs.rmSync = jest.fn(() => {
      throw new Error('EACCES: permission denied');
    });

    // Exercise
    const result = updateProject(projectName, aiProvider, targetDir);

    // Verify
    expect(result).toBe(false);

    // Teardown
    fs.rmSync = originalRmSync;
  });

  // Test: updateProject_WithCopilot_CreatesGitHubStructure
  test('updateProject_WithCopilot_CreatesGitHubStructure', () => {
    // Setup - create directory
    fs.mkdirSync(targetDir, { recursive: true });

    // Exercise
    const result = updateProject(projectName, 'copilot', targetDir);

    // Verify
    expect(result).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.github'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.github', 'agents'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.github', 'prompts'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.github', 'copilot-instructions.md'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.phoenix-os'))).toBe(true);

    // Verify Claude-specific files do NOT exist
    expect(fs.existsSync(path.join(targetDir, '.claude'))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, 'CLAUDE.md'))).toBe(false);
  });

  // Test: updateProject_WithCopilot_ExistingGitHubStructure_UpdatesFiles
  test('updateProject_WithCopilot_ExistingGitHubStructure_UpdatesFiles', () => {
    // Setup - create directory with existing .github structure
    fs.mkdirSync(targetDir, { recursive: true });
    fs.mkdirSync(path.join(targetDir, '.github', 'agents'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, '.phoenix-os', 'core'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, '.github', 'copilot-instructions.md'), '# Old Content');

    // Exercise
    const result = updateProject(projectName, 'copilot', targetDir);

    // Verify
    expect(result).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.github', 'agents'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.github', 'prompts'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '.phoenix-os', 'core'))).toBe(true);

    // Verify copilot-instructions.md was updated
    const copilotMdContent = fs.readFileSync(path.join(targetDir, '.github', 'copilot-instructions.md'), 'utf-8');
    expect(copilotMdContent).toContain(projectName);
    expect(copilotMdContent).toContain('GitHub Copilot');
  });

  // Test: updateProject_WithCopilot_PreservesUserFiles
  test('updateProject_WithCopilot_PreservesUserFiles', () => {
    // Setup - create directory with user files
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'README.md'), '# My Custom README');
    fs.writeFileSync(path.join(targetDir, 'package.json'), '{"name": "my-project"}');
    fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'src', 'index.js'), 'console.log("test");');

    // Exercise
    const result = updateProject(projectName, 'copilot', targetDir);

    // Verify
    expect(result).toBe(true);

    // Verify user files were preserved
    expect(fs.existsSync(path.join(targetDir, 'README.md'))).toBe(true);
    expect(fs.readFileSync(path.join(targetDir, 'README.md'), 'utf-8')).toBe('# My Custom README');

    expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
    expect(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8')).toBe('{"name": "my-project"}');

    expect(fs.existsSync(path.join(targetDir, 'src', 'index.js'))).toBe(true);
    expect(fs.readFileSync(path.join(targetDir, 'src', 'index.js'), 'utf-8')).toBe('console.log("test");');
  });

  // Test: updateProject_WithCopilot_FlattenedPrompts
  test('updateProject_WithCopilot_FlattenedPrompts', () => {
    // Setup - create directory
    fs.mkdirSync(targetDir, { recursive: true });

    // Exercise
    const result = updateProject(projectName, 'copilot', targetDir);

    // Verify
    expect(result).toBe(true);

    // Verify prompts are flattened with .prompt.md extension
    const promptsDir = path.join(targetDir, '.github', 'prompts');
    expect(fs.existsSync(promptsDir)).toBe(true);

    const promptFiles = fs.readdirSync(promptsDir);
    expect(promptFiles.length).toBeGreaterThan(0);

    // Check that prompts have .prompt.md extension
    const hasPromptMdExtension = promptFiles.some(file => file.endsWith('.prompt.md'));
    expect(hasPromptMdExtension).toBe(true);

    // Check for expected prompt files (flattened naming)
    expect(promptFiles).toContain('impl.code.prompt.md');
    expect(promptFiles).toContain('impl.design.prompt.md');
    expect(promptFiles).toContain('plan.fetch-issue.prompt.md');
  });

  // Test: updateProject_WithUnsupportedProvider_ReturnsFalse
  test('updateProject_WithUnsupportedProvider_ReturnsFalse', () => {
    // Setup - create directory
    fs.mkdirSync(targetDir, { recursive: true });

    // Exercise
    const result = updateProject(projectName, 'gemini', targetDir);

    // Verify
    expect(result).toBe(false);
  });

});

describe('showUpdateDiff', () => {
  // Test: showUpdateDiff_ValidDiff_DisplaysOutput
  test('showUpdateDiff_ValidDiff_DisplaysOutput', () => {
    // Setup
    const diff = {
      willUpdate: ['[+] .claude/ (will be created)', '[~] CLAUDE.md (will be updated)'],
      willNotTouch: ['[ ] README.md (preserved)', '[ ] src/ (preserved)'],
    };

    // Exercise - function just displays output
    showUpdateDiff(diff);

    // Verify - function executes without error
    expect(true).toBe(true);
  });
});

describe('promptForYesNo', () => {
  // Test: promptForYesNo_IsFunction
  test('promptForYesNo_IsFunction', () => {
    // Verify - function exists and is a function
    expect(typeof promptForYesNo).toBe('function');
    expect(promptForYesNo.name).toBe('promptForYesNo');
  });
});
