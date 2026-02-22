#!/usr/bin/env node

/**
 * Test harness for Satisfactory window focus via Win32 FFI.
 *
 * Usage:
 *   node scripts/focus-satisfactory.mjs              # live focus
 *   node scripts/focus-satisfactory.mjs --dry-run    # enumerate only
 *   node scripts/focus-satisfactory.mjs --json       # JSON output
 *   node scripts/focus-satisfactory.mjs --dry-run --json
 */

import { focusSatisfactoryWindow } from './lib/win32-focus.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const jsonOutput = args.includes('--json');

console.log('=== Focus Satisfactory Test Harness ===');
console.log(`Mode: ${dryRun ? 'DRY RUN (enumerate only)' : 'LIVE (will focus window)'}`);
console.log('');

try {
  const result = focusSatisfactoryWindow({ dryRun });

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`OK: ${result.ok}`);
    console.log('');

    console.log(`Candidates (${result.candidates.length}):`);
    for (const c of result.candidates) {
      console.log(`  - ${c.processName} (PID ${c.pid})`);
    }
    console.log('');

    console.log(`Windows (${result.windows.length}):`);
    for (const w of result.windows) {
      const width = w.rect.r - w.rect.l;
      const height = w.rect.b - w.rect.t;
      const vis = w.isVisible ? 'visible' : 'hidden';
      console.log(`  [score=${w.score}] hwnd=${w.hwnd} class="${w.className}" title="${w.title || '(empty)'}" ${width}x${height} ${vis} exStyle=${w.exStyle}`);
    }
    console.log('');

    if (result.selected.hwnd) {
      console.log(`Selected: hwnd=${result.selected.hwnd} pid=${result.selected.pid} (${result.selected.processName})`);
    } else {
      console.log('Selected: (none)');
    }
    console.log('');

    console.log('Steps:', JSON.stringify(result.steps, null, 2));

    if (result.errors.length > 0) {
      console.log('');
      console.log('Errors:');
      for (const e of result.errors) {
        const w32 = e.win32LastError !== undefined ? ` (Win32: ${e.win32LastError})` : '';
        console.log(`  [${e.step}] ${e.message}${w32}`);
      }
    }
  }

  process.exit(result.ok ? 0 : 1);
} catch (err) {
  console.error('Fatal error:', err.message);
  console.error(err.stack);
  process.exit(2);
}
