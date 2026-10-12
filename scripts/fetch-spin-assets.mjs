#!/usr/bin/env node
// Download the Pixabay clip and music track for examples/spin-count, then make
// assets/boy.mp4 (picture only, slowed to 0.85x) and assets/music_cut.mp3 (first 22 s).

import { copyFileSync, existsSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  REPO_ROOT, cli, download, ffmpeg, main, probeReport, proxyPreflightNote, rel, replaceFile, resolveExampleDir, sha256File,
} from './lib.mjs';

const HELP = `
Usage: node scripts/fetch-spin-assets.mjs [exampleDir] [--force]

Fetches everything the spin-count example needs that is not in git:

  1. Pixabay video 313047, "Boy, Child, Kid" (uploaded by TonyDias7),
     2160x3840, 24 fps, 16.708 s, no audio
     -> assets/source/313047_large.mp4 (52,467,610 bytes)
  2. Pixabay music 158822, "Funny Dancing Kids" by AudioCoffee, 125.8 s
     -> assets/source/funny-dancing-kids-158822.mp3 (4,026,618 bytes)
  3. GSAP 3.14.2 -> assets/gsap.min.js, copied from examples/handwash-song
     when that copy is there, otherwise downloaded from jsDelivr
  4. ffmpeg: scale to 1080x1920, slow down to 0.85x, 30 fps, H.264, no
     audio -> assets/boy.mp4 (19.667 s)
  5. ffmpeg: the first 22 s, stereo, 44.1 kHz MP3 -> assets/music_cut.mp3
  6. sha256 of every download, then ffprobe every file and print a table

Files that already exist are skipped. The two Pixabay files are downloaded
only when boy.mp4 or music_cut.mp3 has to be made.

To download by hand instead: open the two pages below, download the video
at its largest size (2160x3840) and the music track, and save them under the
names in steps 1 and 2. The script then uses them and checks their sha256.

Arguments:
  exampleDir     example folder (default: examples/spin-count)

Options:
  --force        download and convert everything again
  -h, --help     show this help

Pixabay Content License (https://pixabay.com/service/license-summary/):
free to use and to modify, commercial use included, no attribution required.
You may not sell or distribute the files on a standalone basis, that is,
unedited. Keep the downloads and everything cut from them out of git; the
edited render may be shared. The music page carries a "Content ID
Registered" label.

Needs ffmpeg and ffprobe on PATH. Behind a proxy, set HTTPS_PROXY and
NODE_USE_ENV_PROXY=1: Node's built-in fetch ignores HTTPS_PROXY otherwise.

Pages:
  https://pixabay.com/videos/boy-child-kid-childhood-dancing-313047/
  https://pixabay.com/music/happy-childrens-tunes-funny-dancing-kids-158822/
`;

const USER_AGENT = `cuecut-fetch/0.1 (https://github.com/helicerat/cuecut; downloads one example clip and one music track) node/${process.versions.node}`;
// The CDN serves both files without it; it is the referer a browser would send.
const REFERER = 'https://pixabay.com/';

const VIDEO = {
  label: 'Pixabay video 313047',
  url: 'https://cdn.pixabay.com/video/2025/10/31/313047_large.mp4',
  page: 'https://pixabay.com/videos/boy-child-kid-childhood-dancing-313047/',
  file: 'source/313047_large.mp4',
  bytes: 52467610,
  sha256: '5060118bfbcbb55cab8869e2088b3d2581b382df8060380c8038ade14af00129',
};
const MUSIC = {
  label: 'Pixabay music 158822',
  url: 'https://cdn.pixabay.com/download/audio/2023/07/19/audio_0f020bf728.mp3?filename=audiocoffee-funny-dancing-kids-158822.mp3',
  page: 'https://pixabay.com/music/happy-childrens-tunes-funny-dancing-kids-158822/',
  file: 'source/funny-dancing-kids-158822.mp3',
  bytes: 4026618,
  sha256: '2b5a744047cee7352824afc0d92d127a22d7bd4bd6e2899e5cfe1d85626a60d9',
};
const GSAP = {
  url: 'https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js',
  file: 'gsap.min.js',
  sha256: 'c174bfce53a729418d57a8ad8625e7247c793a22fef8e2851e3cfa3de9cd8280',
};

// The spin marks in build/index.template.htm are source times divided by this factor.
const SLOW = 0.85;
// Scale the 2160x3840 clip to the 1080x1920 frame, stretch time by 1/0.85
// (16.708 s / 0.85 = 19.66 s), and resample 24 fps to the composition's 30 fps
// (590 frames, 19.667 s).
const VIDEO_ARGS = (src, out) => [
  '-y', '-i', src, '-an',
  '-vf', `scale=1080:1920:flags=lanczos,setpts=PTS/${SLOW},fps=30`,
  '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p',
  out,
];
// The composition runs 21.5 s; 22 s of music leaves half a second to spare.
const AUDIO_ARGS = (src, out) => [
  '-y', '-i', src, '-vn', '-t', '22',
  '-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '2',
  out,
];

const quote = (s) => (/[\s"]/.test(s) ? `"${s}"` : s);

const { values, positionals } = cli({ help: HELP, options: { force: { type: 'boolean' } } });

main(async () => {
  const dir = resolveExampleDir(positionals[0] ?? path.join(REPO_ROOT, 'examples', 'spin-count'));
  const assets = path.join(dir, 'assets');
  const force = Boolean(values.force);
  const p = (name) => path.join(assets, name);
  const warnings = [];

  const needVideo = force || !existsSync(p('boy.mp4'));
  const needAudio = force || !existsSync(p('music_cut.mp3'));
  const needGsap = force || !existsSync(p(GSAP.file));
  const sources = [[VIDEO, needVideo], [MUSIC, needAudio]];

  console.log(`example: ${rel(dir)}`);
  const anyDownload = sources.some(([s, needed]) => needed && (force || !existsSync(p(s.file)))) || needGsap;
  const note = anyDownload ? proxyPreflightNote() : null;
  if (note) console.log(note);

  for (const [src, needed] of sources) {
    const dest = p(src.file);
    if (needed && (force || !existsSync(dest))) {
      console.log(`download ${src.label}: ${src.url}`);
      const t0 = Date.now();
      const bytes = await download(src.url, dest, { userAgent: USER_AGENT, headers: { Referer: REFERER } });
      console.log(`  saved ${rel(dest)}, ${bytes.toLocaleString('en-US')} bytes, in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    } else if (existsSync(dest)) {
      console.log(`skip ${src.label}: ${rel(dest)} exists`);
    } else {
      console.log(`skip ${src.label}: not needed, ${src === VIDEO ? 'boy.mp4' : 'music_cut.mp3'} already exists`);
      continue;
    }
    const bytes = statSync(dest).size;
    const hash = await sha256File(dest);
    if (bytes === src.bytes && hash === src.sha256) {
      console.log(`  size and sha256 ok`);
    } else {
      warnings.push(`${rel(dest)} is ${bytes.toLocaleString('en-US')} bytes with sha256 ${hash}; the example was made from ${src.bytes.toLocaleString('en-US')} bytes, sha256 ${src.sha256}. Pixabay may have replaced the file. ${src === VIDEO ? 'Check the spin marks in spins.json against the new clip before rendering.' : 'Check the beat grid (BEAT0, BEAT in the template) against the new track.'} Source page: ${src.page}`);
    }
  }

  // GSAP: the same pinned file as examples/handwash-song.
  const gsapDest = p(GSAP.file);
  if (needGsap) {
    const local = path.join(REPO_ROOT, 'examples', 'handwash-song', 'assets', GSAP.file);
    if (!force && existsSync(local) && path.resolve(local) !== path.resolve(gsapDest) && (await sha256File(local)) === GSAP.sha256) {
      copyFileSync(local, gsapDest);
      console.log(`copy GSAP: ${rel(local)} -> ${rel(gsapDest)}`);
    } else {
      console.log(`download GSAP: ${GSAP.url}`);
      await download(GSAP.url, gsapDest, { userAgent: USER_AGENT });
    }
  } else {
    console.log(`skip GSAP: ${rel(gsapDest)} exists`);
  }
  const gsapHash = await sha256File(gsapDest);
  if (gsapHash === GSAP.sha256) console.log('  sha256 ok');
  else warnings.push(`${rel(gsapDest)} has sha256 ${gsapHash}, expected ${GSAP.sha256}. It is not the GSAP 3.14.2 build this example was tested with. Delete it and run again with --force.`);

  for (const [needed, name, args, src] of [[needVideo, 'boy.mp4', VIDEO_ARGS, VIDEO], [needAudio, 'music_cut.mp3', AUDIO_ARGS, MUSIC]]) {
    const out = p(name);
    if (!needed) {
      console.log(`skip ${name}: ${rel(out)} exists`);
      continue;
    }
    // Write to a temporary name first so a failed run never leaves a file that looks finished.
    const tmp = p(name.replace(/\.(\w+)$/, '.partial.$1'));
    const input = p(src.file);
    const a = args(input, tmp);
    console.log(`ffmpeg ${a.map((x) => (x === input || x === tmp ? quote(rel(x)) : x)).join(' ')}`);
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
  const files = [p(VIDEO.file), p(MUSIC.file), p('boy.mp4'), p('music_cut.mp3')].filter((f) => existsSync(f));
  // The files are meant to differ in length (16.7 s clip, 19.7 s slowed, 125.8 s track, 22 s cut),
  // so the cross-file duration check is off; the expected values are checked below.
  const report = await probeReport(files, { tolerance: Number.POSITIVE_INFINITY, label: (f) => path.relative(assets, f).split(path.sep).join('/') });
  warnings.push(...report.warnings);
  const byName = Object.fromEntries(report.infos.map((i) => [path.basename(i.file), i]));
  const boy = byName['boy.mp4'];
  const cut = byName['music_cut.mp3'];
  if (boy && (boy.width !== 1080 || boy.height !== 1920 || Math.round(boy.fps) !== 30 || Math.abs((boy.videoDuration ?? boy.duration) - 19.667) > 0.05)) {
    warnings.push(`boy.mp4 is ${boy.width}x${boy.height}, ${boy.fps} fps, ${boy.videoDuration ?? boy.duration} s; expected 1080x1920, 30 fps, 19.667 s. The spin marks assume that length.`);
  }
  if (cut && (cut.sampleRate !== 44100 || cut.channels !== 2 || Math.abs(cut.duration - 22) > 0.1)) {
    warnings.push(`music_cut.mp3 is ${cut.sampleRate} Hz, ${cut.channels} ch, ${cut.duration} s; expected 44100 Hz, 2 ch, 22 s.`);
  }

  console.log('');
  if (warnings.length) {
    for (const w of warnings) console.log(`warning: ${w}`);
    return 1;
  }
  console.log(`assets ready. Next: node scripts/build.mjs ${rel(dir)}, npx hyperframes@0.8.143 lint ${rel(dir)}, then the render (npm run render:spin).`);
  return 0;
});
