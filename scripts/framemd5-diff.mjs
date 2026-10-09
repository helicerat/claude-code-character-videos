#!/usr/bin/env node
// Are two renders the same picture, frame for frame?
// Hashes the decoded frames (ffmpeg -f framemd5), so container metadata and
// encoder timestamps do not count, only pixels.

import { existsSync } from 'node:fs';
import { CliError, cli, main, rel, run } from './lib.mjs';

const HELP = `
Usage: node scripts/framemd5-diff.mjs <a.mp4> <b.mp4> [--audio] [--show 10]

Decodes the first video stream of both files, hashes every frame with
ffmpeg's framemd5 muxer and compares the hashes in order. Files without
video (an .mp3) are compared by their decoded audio.
Prints "equal N/M frames". Exit code 0 when every frame matches, 1 otherwise.

Use it to check that a composition renders deterministically: render the
same HTML twice and compare. Two encodes of the same frames can differ as
files and still be equal here.

Options:
  --audio        compare the decoded audio as well (first audio stream)
  --show <n>     list at most n differing frames (default: 10)
  -h, --help     show this help
`;

const { values, positionals } = cli({
  help: HELP,
  options: { audio: { type: 'boolean' }, show: { type: 'string', default: '10' } },
});

async function hashes(file, stream) {
  const r = await run('ffmpeg', ['-hide_banner', '-nostdin', '-v', 'error', '-i', file, '-map', `0:${stream}:0`, '-fps_mode', 'passthrough', '-f', 'framemd5', '-']);
  if (r.code !== 0) {
    if (/matches no streams/i.test(r.stderr)) return null; // no stream of this kind
    throw new CliError(`ffmpeg could not decode ${rel(file)}:\n${r.stderr.trim()}`);
  }
  let tb = null;
  const frames = [];
  for (const line of r.stdout.split(/\r?\n/)) {
    const m = /^#tb \d+: (\d+)\/(\d+)/.exec(line);
    if (m) { tb = Number(m[1]) / Number(m[2]); continue; }
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(',').map((s) => s.trim());
    frames.push({ pts: Number(parts[2]), hash: parts[5] });
  }
  return { tb, frames };
}

function compare(label, a, b, show) {
  const total = Math.max(a.frames.length, b.frames.length);
  let equal = 0;
  const diffs = [];
  for (let i = 0; i < total; i++) {
    const fa = a.frames[i];
    const fb = b.frames[i];
    if (fa && fb && fa.hash === fb.hash) equal++;
    else diffs.push(i);
  }
  console.log(`${label}: equal ${equal}/${total} frames`);
  if (a.frames.length !== b.frames.length) console.log(`  frame count differs: ${a.frames.length} vs ${b.frames.length}`);
  for (const i of diffs.slice(0, show)) {
    const f = a.frames[i] ?? b.frames[i];
    const tb = a.frames[i] ? a.tb : b.tb;
    const at = tb && Number.isFinite(f.pts) ? ` at ${(f.pts * tb).toFixed(3)} s` : '';
    console.log(`  frame ${i}${at} differs`);
  }
  if (diffs.length > show) console.log(`  ... and ${diffs.length - show} more`);
  return diffs.length === 0;
}

main(async () => {
  if (positionals.length !== 2) throw new CliError('give exactly two files. Run with --help for usage.');
  const [fa, fb] = positionals;
  for (const f of [fa, fb]) if (!existsSync(f)) throw new CliError(`file not found: ${f}`);
  const show = Math.max(0, Number.parseInt(values.show, 10) || 0);
  console.log(`a: ${rel(fa)}\nb: ${rel(fb)}`);
  const [va, vb] = await Promise.all([hashes(fa, 'v'), hashes(fb, 'v')]);
  let same = true;
  if (va || vb) {
    if (!va || !vb) throw new CliError(`${rel(va ? fb : fa)} has no video stream, ${rel(va ? fa : fb)} has one.`);
    same = compare('video', va, vb, show);
  }
  // Audio-only files (song.mp3) are compared by their audio.
  if (values.audio || (!va && !vb)) {
    const [aa, ab] = await Promise.all([hashes(fa, 'a'), hashes(fb, 'a')]);
    if (!aa && !ab) throw new CliError('neither file has a video or an audio stream.');
    if (!aa || !ab) throw new CliError(`${rel(aa ? fb : fa)} has no audio stream, ${rel(aa ? fa : fb)} has one.`);
    same = compare('audio', aa, ab, show) && same;
  }
  return same ? 0 : 1;
});
