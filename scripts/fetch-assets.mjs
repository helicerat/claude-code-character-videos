#!/usr/bin/env node
// Download the public-domain source clip and GSAP, then cut the clip into
// assets/cat.mp4 (picture, no sound) and assets/song.mp3 (sound only).

import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import {
  cli, download, ffmpeg, main, mediaInfo, probeReport, proxyPreflightNote, rel, replaceFile, resolveExampleDir, sha256File,
} from './lib.mjs';

const HELP = `
Usage: node scripts/fetch-assets.mjs [exampleDir] [--force]

Fetches everything the handwash-song example needs that is not in git:

  1. CDC "Happy Handwashing Song" (public domain, Wikimedia Commons)
     -> assets/Happy_Handwashing_Song.webm
  2. GSAP 3.14.2 from jsDelivr -> assets/gsap.min.js
  3. ffmpeg: crop off the burned-in captions, scale to 1088 wide (a multiple
     of 16, see below), 30 fps, H.264, no audio -> assets/cat.mp4
  4. ffmpeg: audio only, stereo, 44.1 kHz MP3 -> assets/song.mp3
  5. ffprobe every file and print size, fps, sample rate and duration.

Files that already exist are skipped. The source clip is downloaded only
when cat.mp4 or song.mp3 has to be made.

Arguments:
  exampleDir     example folder (default: examples/handwash-song)

Options:
  --force        download and convert everything again
  -h, --help     show this help

Why 1088 and not 1080: HyperFrames 0.8.143 turns every video into frames with
an ffmpeg filter that converts yuv420p to gbrp, and ffmpeg 8.1.2 (gyan.dev
build, x86) leaves every column after the last multiple of 16 black in that
conversion. A 1080-wide clip got a black band at the right edge of the card.

Needs ffmpeg and ffprobe on PATH. Behind a proxy, set HTTPS_PROXY and
NODE_USE_ENV_PROXY=1: Node's built-in fetch ignores HTTPS_PROXY otherwise.

Source page: https://commons.wikimedia.org/wiki/File:Happy_Handwashing_Song.webm
Credit CDC as the source. Do not imply CDC endorsement or use the CDC logo.
`;

// Wikimedia asks API and upload clients to send a descriptive User-Agent.
const USER_AGENT = `cuecut-fetch/0.1 (https://github.com/helicerat/cuecut; downloads one public-domain example clip) node/${process.versions.node}`;

const SOURCE = {
  url: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Happy_Handwashing_Song.webm',
  file: 'Happy_Handwashing_Song.webm',
  // The revision the example's word timings were made from (30.885 s, 522x360).
  sha256: '9b5c584cdde29757c282ad8effcdaee11c79abc3be501e048118a211d5761780',
};
const GSAP = {
  url: 'https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js',
  file: 'gsap.min.js',
  sha256: 'c174bfce53a729418d57a8ad8625e7247c793a22fef8e2851e3cfa3de9cd8280',
};

// The bottom 38 px of the 522x360 source are burned-in captions: keep the top 322 px.
// Scale to 1088 wide, a multiple of 16: with a 1080-wide clip, HyperFrames' frame
// extraction (yuv420p -> gbrp in ffmpeg 8.1.2) blacked out columns 1072-1079.
const VIDEO_ARGS = (src, out) => [
  '-y', '-i', src, '-an',
  '-vf', 'crop=522:322:0:0,scale=1088:-2:flags=lanczos,fps=30',
  '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p',
  out,
];
const AUDIO_ARGS = (src, out) => [
  '-y', '-i', src, '-vn',
  '-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '2',
  out,
];

const quote = (s) => (/[\s"]/.test(s) ? `"${s}"` : s);

const { values, positionals } = cli({ help: HELP, options: { force: { type: 'boolean' } } });

main(async () => {
  const dir = resolveExampleDir(positionals[0]);
  const assets = path.join(dir, 'assets');
  const force = Boolean(values.force);
  const p = (name) => path.join(assets, name);
  const warnings = [];

  const needVideo = force || !existsSync(p('cat.mp4'));
  const needAudio = force || !existsSync(p('song.mp3'));
  const needSource = (needVideo || needAudio) && (force || !existsSync(p(SOURCE.file)));
  const needGsap = force || !existsSync(p(GSAP.file));

  console.log(`example: ${rel(dir)}`);
  const note = needSource || needGsap ? proxyPreflightNote() : null;
  if (note) console.log(note);

  for (const [item, needed, label] of [[SOURCE, needSource, 'source clip'], [GSAP, needGsap, 'GSAP']]) {
    const dest = p(item.file);
    if (needed) {
      console.log(`download ${label}: ${item.url}`);
      const t0 = Date.now();
      await download(item.url, dest, { userAgent: USER_AGENT });
      console.log(`  saved ${rel(dest)} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    } else if (existsSync(dest)) {
      console.log(`skip ${label}: ${rel(dest)} exists`);
    } else {
      console.log(`skip ${label}: not needed, cat.mp4 and song.mp3 already exist`);
      continue;
    }
    const hash = await sha256File(dest);
    if (hash === item.sha256) {
      console.log(`  sha256 ok`);
    } else if (item === GSAP) {
      warnings.push(`${rel(dest)} has sha256 ${hash}, expected ${item.sha256}. It is not the GSAP 3.14.2 build this example was tested with. Delete it and run again with --force.`);
    } else {
      warnings.push(`${rel(dest)} has sha256 ${hash}, expected ${item.sha256}. Commons may have a newer revision of the clip. The word timings in transcript.json were made from the old one: re-run transcription and scripts/align-lyrics.mjs.`);
    }
  }

  const src = p(SOURCE.file);
  if (needVideo || needAudio) {
    const info = await mediaInfo(src);
    if (info.width !== 522 || info.height !== 360) {
      warnings.push(`source is ${info.width}x${info.height}, the crop assumes 522x360. Check assets/cat.mp4 for leftover captions or black bars and adjust crop= in scripts/fetch-assets.mjs.`);
    }
  }
  for (const [needed, name, args] of [[needVideo, 'cat.mp4', VIDEO_ARGS], [needAudio, 'song.mp3', AUDIO_ARGS]]) {
    const out = p(name);
    if (!needed) {
      console.log(`skip ${name}: ${rel(out)} exists`);
      continue;
    }
    // Write to a temporary name first so a failed run never leaves a file that looks finished.
    const tmp = p(name.replace(/\.(\w+)$/, '.partial.$1'));
    const a = args(src, tmp);
    console.log(`ffmpeg ${a.map((x) => (x === src || x === tmp ? quote(rel(x)) : x)).join(' ')}`);
    const t0 = Date.now();
    try {
      await ffmpeg(a);
    } catch (e) {
      rmSync(tmp, { force: true });
      throw e;
    }
    replaceFile(tmp, out);
    console.log(`  wrote ${rel(out)} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }

  console.log('');
  const files = [src, p('cat.mp4'), p('song.mp3')].filter((f) => existsSync(f));
  const report = await probeReport(files, { label: (f) => path.basename(f) });
  warnings.push(...report.warnings);
  const byName = Object.fromEntries(report.infos.map((i) => [path.basename(i.file), i]));
  const cat = byName['cat.mp4'];
  const song = byName['song.mp3'];
  if (cat && (cat.width !== 1088 || cat.height !== 672 || Math.round(cat.fps) !== 30)) {
    warnings.push(`cat.mp4 is ${cat.width}x${cat.height} at ${cat.fps} fps, expected 1088x672 at 30 fps. An older cat.mp4 (1080x666) renders with a black band at the right edge of the card: delete assets/cat.mp4 and run this script again.`);
  }
  if (song && (song.sampleRate !== 44100 || song.channels !== 2)) {
    warnings.push(`song.mp3 is ${song.sampleRate} Hz, ${song.channels} ch, expected 44100 Hz, 2 ch.`);
  }

  console.log('');
  if (warnings.length) {
    for (const w of warnings) console.log(`warning: ${w}`);
    return 1;
  }
  console.log('assets ready. Next: npm run align, npm run build, npm run lint, then npm run render.');
  return 0;
});
