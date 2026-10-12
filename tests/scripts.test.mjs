// Fast checks with no media and no network: every script answers --help,
// every example's index.html matches its template, the Markdown links
// resolve, and the starter project builds. Run with `npm test`.

import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = (...args) => spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
const scripts = readdirSync(path.join(ROOT, 'scripts')).filter((f) => f.endsWith('.mjs') && f !== 'lib.mjs');
const examples = readdirSync(path.join(ROOT, 'examples'));

for (const s of scripts) {
  test(`${s} --help`, () => {
    const r = node(path.join('scripts', s), '--help');
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^Usage:/);
  });
}

for (const e of examples) {
  test(`examples/${e}/index.html is up to date`, () => {
    const r = node('scripts/build.mjs', `examples/${e}`, '--check');
    assert.equal(r.status, 0, r.stdout + r.stderr);
  });
}

test('Markdown links resolve', () => {
  const r = node('scripts/check-links.mjs');
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('starter project scaffolds and builds with its marks inlined', () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'ccv-'));
  const dir = path.join(tmp, 'starter-test');
  try {
    const r = node('scripts/new-project.mjs', 'starter-test', '--dir', dir, '--no-media');
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const html = readFileSync(path.join(dir, 'index.html'), 'utf8');
    assert.match(html, /const MARKS = \[\{"t": 2, "label": "the setup"\}/);
    assert.doesNotMatch(html, /\/\*MARKS\*\//);
    assert.doesNotMatch(readFileSync(path.join(dir, 'README.md'), 'utf8'), /\{\{(NAME|DIR)\}\}/);
    assert.equal(node('scripts/build.mjs', dir, '--check').status, 0);

    // A second run refuses to overwrite without --force.
    assert.equal(node('scripts/new-project.mjs', 'starter-test', '--dir', dir, '--no-media').status, 1);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('build rejects marks out of time order', () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'ccv-'));
  const dir = path.join(tmp, 'p');
  try {
    assert.equal(node('scripts/new-project.mjs', 'p', '--dir', dir, '--no-media').status, 0);
    writeFileSync(path.join(dir, 'marks.json'), JSON.stringify({ marks: [{ t: 3 }, { t: 1 }] }));
    const r = node('scripts/build.mjs', dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /time order/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('new-project rejects a bad name', () => {
  const r = node('scripts/new-project.mjs', 'Bad Name', '--no-media');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /not a valid name/);
});
