#!/usr/bin/env node
// Check every relative link in the repo's Markdown files: the target file
// exists, a #heading anchor matches a heading in the target (GitHub's slug
// rules), and a #L10-L20 anchor stays inside the target file.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, cli, main, rel } from './lib.mjs';

const HELP = `
Usage: node scripts/check-links.mjs [dir] [--verbose]

Finds every Markdown file under dir (default: the repo root; skips .git,
node_modules and dot-folders) and checks the relative links in it:

  [text](path), ![alt](path), <a href="path">, <img src="path">
  - the file or folder exists
  - path#heading: a heading in the target Markdown file has that slug
    (lower case, punctuation dropped, spaces to hyphens, -1, -2 for repeats)
  - path#L10 or path#L10-L20: the target has at least that many lines

Links in fenced code blocks and inline code are ignored, and so are
http(s), mailto and other absolute URLs. Exit code 1 when any link is broken.

Options:
  --verbose      list every link checked
  -h, --help     show this help
`;

const { values, positionals } = cli({ help: HELP, options: { verbose: { type: 'boolean' } } });

function markdownFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...markdownFiles(p));
    else if (entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

/** The text with fenced code blocks and inline code blanked out, line breaks kept. */
function stripCode(text) {
  const lines = text.split(/\r?\n/);
  let fence = null;
  return lines.map((line) => {
    const m = /^\s*(```+|~~~+)/.exec(line);
    if (fence) {
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null;
      return '';
    }
    if (m) { fence = m[1]; return ''; }
    return line.replace(/(`+)[^`]*?\1/g, '');
  }).join('\n');
}

/** GitHub's heading anchors for one Markdown file. */
const slugCache = new Map();
function slugs(file) {
  if (slugCache.has(file)) return slugCache.get(file);
  const seen = new Map();
  const out = new Set();
  const text = stripCode(readFileSync(file, 'utf8'));
  for (const line of text.split('\n')) {
    const m = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const plain = m[1]
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]+>/g, '');
    const base = plain.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    out.add(n ? `${base}-${n}` : base);
  }
  // Raw HTML anchors count too.
  for (const m of text.matchAll(/<a\s+(?:name|id)="([^"]+)"/g)) out.add(m[1]);
  slugCache.set(file, out);
  return out;
}

function links(text) {
  const found = [];
  const lines = stripCode(text).split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) found.push({ target: m[1], line: i + 1 });
    for (const m of line.matchAll(/\b(?:href|src)="([^"]+)"/g)) found.push({ target: m[1], line: i + 1 });
  });
  return found;
}

main(async () => {
  const root = path.resolve(positionals[0] ?? REPO_ROOT);
  const files = markdownFiles(root);
  const broken = [];
  let checked = 0;
  for (const file of files) {
    for (const { target, line } of links(readFileSync(file, 'utf8'))) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) continue;
      checked++;
      const [rawPath, anchor] = target.split('#');
      const p = rawPath ? path.resolve(path.dirname(file), decodeURIComponent(rawPath)) : file;
      let problem = null;
      if (!existsSync(p)) {
        problem = 'file not found';
      } else if (anchor !== undefined && anchor !== '') {
        const lineAnchor = /^L(\d+)(?:-L(\d+))?$/.exec(anchor);
        if (lineAnchor && statSync(p).isFile() && !p.endsWith('.md')) {
          const body = readFileSync(p, 'utf8');
          const count = body.split(/\r?\n/).length - (body.endsWith('\n') ? 1 : 0);
          const last = Number(lineAnchor[2] ?? lineAnchor[1]);
          if (last > count) problem = `line ${last} is past the end (${count} lines)`;
        } else if (p.endsWith('.md')) {
          if (!slugs(p).has(decodeURIComponent(anchor).toLowerCase())) problem = `no heading with anchor #${anchor}`;
        }
      }
      if (values.verbose) console.log(`${problem ? 'BROKEN' : 'ok    '} ${rel(file)}:${line} ${target}${problem ? ` (${problem})` : ''}`);
      if (problem) broken.push(`${rel(file)}:${line}: ${target} (${problem})`);
    }
  }
  if (broken.length) {
    console.log(`${broken.length} broken of ${checked} relative links in ${files.length} Markdown files:`);
    for (const b of broken) console.log(`  ${b}`);
    return 1;
  }
  console.log(`all ${checked} relative links in ${files.length} Markdown files resolve.`);
  return 0;
});
