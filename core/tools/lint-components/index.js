#!/usr/bin/env node
'use strict';

const path = require('path');
const discover = require('./lib/discover');
const structural = require('./lib/rules/structural');
const semantic = require('./lib/rules/semantic');
const crossReference = require('./lib/rules/cross-reference');
const reporter = require('./lib/reporter');

function parseArgs(argv) {
  const args = {
    target: 'core/components',
    output: 'json',
    validateTemplates: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--target' && argv[i + 1]) {
      args.target = argv[++i];
    } else if (arg.startsWith('--target=')) {
      args.target = arg.slice('--target='.length);
    } else if (arg === '--output' && argv[i + 1]) {
      args.output = argv[++i];
    } else if (arg.startsWith('--output=')) {
      args.output = arg.slice('--output='.length);
    } else if (arg === '--validate-templates') {
      args.validateTemplates = true;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  // Resolve target relative to cwd
  const targetDir = path.resolve(process.cwd(), args.target);

  // Step 1: Discover all components
  const components = discover(targetDir);

  // Steps 2-4: Run rule sets, collect violations
  let violations = [];

  violations = violations.concat(structural.check(components));
  violations = violations.concat(semantic.check(components));
  violations = violations.concat(crossReference.check(components));

  // Step 5: Build summary
  const summary = {
    errors: violations.filter((v) => v.severity === 'error').length,
    warnings: violations.filter((v) => v.severity === 'warning').length,
    infos: violations.filter((v) => v.severity === 'info').length,
  };

  // Step 6: Report
  reporter.report({ violations, summary }, args.output);

  // Step 7: Exit code
  process.exit(summary.errors > 0 ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write('Fatal error: ' + err.message + '\n');
  process.exit(2);
});
