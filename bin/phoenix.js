#!/usr/bin/env node

/**
 * Phoenix OS CLI Entry Point
 *
 * This is the main entry point for the Phoenix OS CLI when installed via npm.
 */

const { initProject } = require('../lib/installer');
const fs = require('fs');
const path = require('path');

// Try to read version from package.json, fallback to hardcoded
let VERSION = '0.1.0';
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = require(packageJsonPath);
    VERSION = packageJson.version;
  }
} catch (error) {
  // Fallback to hardcoded version
}

/**
 * Display version information
 */
function showVersion() {
  console.log(`Phoenix OS version ${VERSION}`);
}

/**
 * Display help information
 */
function showHelp() {
  const helpText = `Phoenix OS - Agentic Framework for Intent-Driven Development

Usage:
  phoenix init [OPTIONS]                         Initialize Phoenix OS
  phoenix --version, -v                          Show version
  phoenix --help, -h                             Show this help

Options:
  --project-name <name>       Create new project with specified name
  --ai <copilot>              Specify AI copilot (supported: claude, copilot)

Examples:
  # Create new project in subdirectory
  phoenix init --project-name my-project --ai claude
  phoenix init my-project --ai copilot           Positional project name also supported

  # Initialize in current directory (existing project)
  cd my-project
  phoenix init --ai claude

  # Interactive mode
  phoenix init                                   Prompts for project setup

For more information, visit: https://github.com/nagarro-digital/phoenix-os
`;
  console.log(helpText);
}

/**
 * Main function
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Handle version command
  if (args.length === 0 || (args.length > 0 && ['--version', '-v', 'version'].includes(args[0]))) {
    showVersion();
    process.exit(0);
  }

  // Handle help command
  if (['--help', '-h', 'help'].includes(args[0])) {
    showHelp();
    process.exit(0);
  }

  // Handle init command
  if (args[0] !== 'init') {
    console.error('Error: Unknown command');
    console.error('Usage: phoenix init [OPTIONS]');
    console.error("Try 'phoenix --help' for more information.");
    process.exit(1);
  }

  // Parse init command arguments
  let projectName = null;
  let aiProvider = null;

  let i = 1; // Start after 'init'
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--project-name') {
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        projectName = args[i + 1];
        i += 2;
      } else {
        console.error('Error: --project-name flag requires a value');
        process.exit(1);
      }
    } else if (arg === '--ai') {
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        aiProvider = args[i + 1];
        i += 2;
      } else {
        console.error('Error: --ai flag requires a value');
        process.exit(1);
      }
    } else if (!arg.startsWith('--')) {
      // Support old style positional argument for backward compatibility
      projectName = arg;
      i += 1;
    } else {
      console.error(`Error: Unknown flag: ${arg}`);
      process.exit(1);
    }
  }

  // Get current working directory
  const currentDir = process.cwd();

  // Initialize the project
  try {
    const exitCode = await initProject(projectName, aiProvider, currentDir);
    process.exit(exitCode);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
