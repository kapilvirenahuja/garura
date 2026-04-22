'use strict';

/**
 * Report violations in the requested format.
 *
 * @param {{ violations: Array, summary: Object }} result
 * @param {'json'|'text'} format
 */
function report(result, format) {
  if (format === 'text') {
    for (const v of result.violations) {
      process.stdout.write(
        `${v.severity}: ${v.file}:${v.line} [${v.rule}] ${v.message}\n`
      );
    }
    process.stdout.write(
      `${result.summary.errors} errors, ${result.summary.warnings} warnings, ${result.summary.infos} infos\n`
    );
  } else {
    // Default: json
    process.stdout.write(JSON.stringify({ violations: result.violations, summary: result.summary }, null, 2) + '\n');
  }
}

module.exports = { report };
