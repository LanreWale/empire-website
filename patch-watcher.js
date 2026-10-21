#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node patch-watcher.js <directory>');
  process.exit(1);
}

const absDir = path.resolve(dir);
if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
  console.error(`Not a directory: ${absDir}`);
  process.exit(1);
}

// ── OLD BLOCK ──────────────────────────────────────────────────────────
// Matches from "var successTimer = setInterval" through the trailing
// "}, 60000);" — including the setTimeout that kills the watcher.
const OLD_BLOCK_RE =
  /var successTimer = setInterval\(function\(\)\{[\s\S]*?\}, 500\);\s*setTimeout\(function\(\)\{ clearInterval\(successTimer\); \}, 60000\);/;

// ── NEW BLOCK ──────────────────────────────────────────────────────────
const NEW_BLOCK = `/* ─── EmailOctopus success watcher ─── */
  /* No timeout — survives long offer-completion delays (5+ min). */
  /* Watches for the success message to have real text content. */
  var emailSuccessFired = false;

  function checkEmailSuccess() {
    if (emailSuccessFired) return;
    var embed = document.getElementById('emailoctopus-embed');
    if (!embed) return;
    var successEl = embed.querySelector('.emailoctopus-success-message');
    if (successEl && successEl.textContent.trim().length > 0) {
      emailSuccessFired = true;
      if (typeof window.empireOnEmailSuccess === 'function') {
        window.empireOnEmailSuccess();
      }
      if (typeof window.empireTrack === 'function') {
        window.empireTrack('email_form_submitted', { provider: 'emailoctopus' });
      }
    }
  }

  var emailSuccessTimer = setInterval(checkEmailSuccess, 1000);`;

const VERSION_OLD = 'empire-offers.js?v=9';
const VERSION_NEW = 'empire-offers.js?v=11';

function countMatches(str, re) {
  const m = str.match(new RegExp(re.source, 'g'));
  return m ? m.length : 0;
}

const files = fs.readdirSync(absDir).filter(f => f.toLowerCase().endsWith('.html')).sort();

if (files.length === 0) {
  console.error(`No .html files found in ${absDir}`);
  process.exit(1);
}

console.log(`Scanning ${files.length} HTML file(s) in ${absDir}\n`);

let patched = 0, skipped = 0, errored = 0;
const skipLog = [];

for (const file of files) {
  const full = path.join(absDir, file);
  let html;
  try {
    html = fs.readFileSync(full, 'utf8');
  } catch (e) {
    console.error(`✗ ${file} — read error: ${e.message}`);
    errored++;
    continue;
  }

  const blockCount = countMatches(html, OLD_BLOCK_RE);
  const versionCount = (html.match(new RegExp(VERSION_OLD.replace(/[.?]/g, '\\$&'), 'g')) || []).length;

  if (blockCount !== 1 || versionCount !== 1) {
    const reasons = [];
    if (blockCount !== 1) reasons.push(`old watcher block matched ${blockCount}× (need 1)`);
    if (versionCount !== 1) reasons.push(`${VERSION_OLD} matched ${versionCount}× (need 1)`);
    console.warn(`⊘ ${file} — SKIPPED: ${reasons.join('; ')}`);
    skipLog.push({ file, reasons });
    skipped++;
    continue;
  }

  const patchedHtml = html
    .replace(OLD_BLOCK_RE, NEW_BLOCK)
    .replace(VERSION_OLD, VERSION_NEW);

  // Sanity: new block must be present, old timeout must be gone
  if (!patchedHtml.includes('var emailSuccessTimer = setInterval(checkEmailSuccess, 1000);') ||
      patchedHtml.includes('clearInterval(successTimer)); }, 60000)') ||
      !patchedHtml.includes(VERSION_NEW)) {
    console.error(`✗ ${file} — post-patch sanity check FAILED, file not written`);
    errored++;
    continue;
  }

  fs.writeFileSync(full, patchedHtml, 'utf8');
  console.log(`✓ ${file}`);
  patched++;
}

console.log(`\n──────────────────────────────────────────`);
console.log(`Patched: ${patched}`);
console.log(`Skipped: ${skipped}`);
console.log(`Errored: ${errored}`);
console.log(`──────────────────────────────────────────`);

if (skipLog.length) {
  console.log('\nSkipped files (inspect manually — no changes written):');
  for (const { file, reasons } of skipLog) {
    console.log(`  • ${file}`);
    for (const r of reasons) console.log(`      - ${r}`);
  }
  process.exitCode = 2;
}

if (patched === 0) {
  console.log('\nNothing was patched. Check the directory and the exact source of the 19 files.');
  process.exitCode = 1;
}
