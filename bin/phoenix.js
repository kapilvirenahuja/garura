#!/usr/bin/env node

'use strict';

const path = require('path');
const { version } = require('../package.json');
const installer = require('../lib/installer');

const USAGE = `
Phoenix OS v${version}
Agentic framework for intent-driven, deterministic AI-assisted development.

Usage:
  phoenix init [options]    Initialize Phoenix OS in the current directory
  phoenix --version         Show version
  phoenix --help            Show this help

Init Options:
  --project-name <name>     Project name (default: directory name)

Examples:
  phoenix init
  phoenix init --project-name my-app
`.trim();

function parseArgs(args) {
  const parsed = { command: null, options: {} };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--version' || arg === '-v') {
      parsed.command = 'version';
    } else if (arg === '--help' || arg === '-h') {
      parsed.command = 'help';
    } else if (arg === '--project-name' && i + 1 < args.length) {
      parsed.options.projectName = args[++i];
    } else if (!arg.startsWith('-')) {
      parsed.command = arg;
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  return parsed;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(USAGE);
    process.exit(0);
  }

  const { command, options } = parseArgs(args);

  switch (command) {
    case 'version':
      console.log(`Phoenix OS version ${version}`);
      break;

    case 'help':
      console.log(USAGE);
      break;

    case 'init':
      await installer.init(process.cwd(), options);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "phoenix --help" for usage information.');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
