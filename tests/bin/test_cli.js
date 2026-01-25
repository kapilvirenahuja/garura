/**
 * Tests for Phoenix OS CLI Entry Point
 *
 * Tests follow Phoenix OS standards:
 * - Test naming: methodName_scenario_expectedResult
 * - Four-Phase pattern: Setup-Exercise-Verify-Teardown
 * - Test behavior, not implementation
 */

const { spawn } = require('child_process');
const path = require('path');

const CLI_PATH = path.join(__dirname, '../../bin/phoenix.js');
const packageJson = require('../../package.json');

/**
 * Helper function to execute CLI command
 * @param {string[]} args - Command arguments
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
function runCLI(args) {
  return new Promise((resolve) => {
    const child = spawn('node', [CLI_PATH, ...args]);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code,
      });
    });
  });
}

describe('CLI --version', () => {
  // Test: showVersion_VersionFlag_DisplaysVersion
  test('showVersion_VersionFlag_DisplaysVersion', async () => {
    // Exercise
    const result = await runCLI(['--version']);

    // Verify
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Phoenix OS version');
    expect(result.stdout).toContain(packageJson.version);
  });

  // Test: showVersion_ShortFlag_DisplaysVersion
  test('showVersion_ShortFlag_DisplaysVersion', async () => {
    // Exercise
    const result = await runCLI(['-v']);

    // Verify
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Phoenix OS version');
  });

  // Test: showVersion_VersionCommand_DisplaysVersion
  test('showVersion_VersionCommand_DisplaysVersion', async () => {
    // Exercise
    const result = await runCLI(['version']);

    // Verify
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Phoenix OS version');
  });

  // Test: showVersion_NoArgs_DisplaysVersion
  test('showVersion_NoArgs_DisplaysVersion', async () => {
    // Exercise
    const result = await runCLI([]);

    // Verify
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Phoenix OS version');
  });
});

describe('CLI --help', () => {
  // Test: showHelp_HelpFlag_DisplaysHelp
  test('showHelp_HelpFlag_DisplaysHelp', async () => {
    // Exercise
    const result = await runCLI(['--help']);

    // Verify
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('phoenix init');
    expect(result.stdout).toContain('--project-name');
    expect(result.stdout).toContain('--ai');
    expect(result.stdout).toContain('--version');
    expect(result.stdout).toContain('--help');
    expect(result.stdout).toContain('Examples:');
  });

  // Test: showHelp_ShortFlag_DisplaysHelp
  test('showHelp_ShortFlag_DisplaysHelp', async () => {
    // Exercise
    const result = await runCLI(['-h']);

    // Verify
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('phoenix init');
  });

  // Test: showHelp_HelpCommand_DisplaysHelp
  test('showHelp_HelpCommand_DisplaysHelp', async () => {
    // Exercise
    const result = await runCLI(['help']);

    // Verify
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
  });
});

describe('CLI init command', () => {
  // Test: main_UnknownCommand_ShowsError
  test('main_UnknownCommand_ShowsError', async () => {
    // Exercise
    const result = await runCLI(['unknown']);

    // Verify
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Unknown command');
  });

  // Test: main_InitWithMissingAiValue_ShowsError
  test('main_InitWithMissingAiValue_ShowsError', async () => {
    // Exercise
    const result = await runCLI(['init', 'test-project', '--ai']);

    // Verify
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('--ai flag requires a value');
  });

  // Test: main_InitWithInvalidProjectName_ShowsError
  test('main_InitWithInvalidProjectName_ShowsError', async () => {
    // Exercise
    const result = await runCLI(['init', 'my/project', '--ai', 'claude']);

    // Verify
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('ERROR');
    expect(result.stdout).toContain('invalid characters');
  });

  // Test: main_InitWithUnsupportedAI_ShowsError
  test('main_InitWithUnsupportedAI_ShowsError', async () => {
    // Exercise
    const result = await runCLI(['init', 'test-project', '--ai', 'gemini']);

    // Verify
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('ERROR');
    expect(result.stdout).toContain('Unsupported AI provider');
  });
});

describe('CLI argument parsing', () => {
  // Test: main_ParsesProjectName_Correctly
  test('main_ParsesProjectName_Correctly', async () => {
    // Exercise - use invalid AI to trigger error before creation
    const result = await runCLI(['init', 'my-test-project', '--ai', 'invalid']);

    // Verify - Should parse project name but fail on AI provider
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('Unsupported AI provider');
  });

  // Test: main_ParsesProjectNameFlag_Correctly
  test('main_ParsesProjectNameFlag_Correctly', async () => {
    // Exercise - use invalid AI to trigger error before creation
    const result = await runCLI(['init', '--project-name', 'my-test-project', '--ai', 'invalid']);

    // Verify - Should parse project name but fail on AI provider
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('Unsupported AI provider');
  });

  // Test: main_ProjectNameFlag_MissingValue_ShowsError
  test('main_ProjectNameFlag_MissingValue_ShowsError', async () => {
    // Exercise
    const result = await runCLI(['init', '--project-name', '--ai', 'claude']);

    // Verify
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('--project-name flag requires a value');
  });

  // Test: main_ProjectNameFlag_WithInvalidName_ShowsError
  test('main_ProjectNameFlag_WithInvalidName_ShowsError', async () => {
    // Exercise
    const result = await runCLI(['init', '--project-name', 'my/invalid', '--ai', 'claude']);

    // Verify
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('invalid characters');
  });

  // Test: main_ParsesAiFlag_Correctly
  test('main_ParsesAiFlag_Correctly', async () => {
    // Exercise - use invalid project name to trigger error before creation
    const result = await runCLI(['init', 'my/invalid', '--ai', 'claude']);

    // Verify - Should parse AI but fail on project name
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('invalid characters');
  });

  // Test: main_HandlesMultipleFlags_Correctly
  test('main_HandlesMultipleFlags_Correctly', async () => {
    // Exercise - use invalid name to avoid actual project creation
    const result = await runCLI(['init', '--ai', 'claude', '.invalid']);

    // Verify - Should parse correctly but fail on invalid project name
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('ERROR');
  });

  // Test: main_UnknownFlag_ShowsError
  test('main_UnknownFlag_ShowsError', async () => {
    // Exercise
    const result = await runCLI(['init', '--unknown-flag', 'value']);

    // Verify
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Unknown flag');
  });
});

describe('CLI error handling', () => {
  // Test: main_CatchesErrors_ExitsGracefully
  test('main_CatchesErrors_ExitsGracefully', async () => {
    // Exercise - invalid project name should trigger error
    const result = await runCLI(['init', 'my/invalid', '--ai', 'claude']);

    // Verify
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('ERROR');
  });

  // Test: main_InvalidFlags_ShowsUsage
  test('main_InvalidFlags_ShowsUsage', async () => {
    // Exercise
    const result = await runCLI(['--invalid-flag']);

    // Verify
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Unknown command');
  });
});
