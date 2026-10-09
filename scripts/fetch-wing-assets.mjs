#!/usr/bin/env node
// Download WING IT! (Blender Studio, CC BY 4.0) from Wikimedia Commons, then make
// assets/wing_v.mp4 (a 9:16 cut of film 82.0 s to 112.0 s, one crop per shot, from
// shots.json), assets/wing_a.mp3 (the sound, one swear ducked) and assets/last.jpg
// (the last frame, for the outro).

import { copyFileSync, existsSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  CliError, REPO_ROOT, cli, download, ffmpeg, main, probeReport, proxyPreflightNote, readJson, rel, replaceFile, resolveExampleDir, sha256File,
} from './lib.mjs';

const HELP = `
Usage: node scripts/fetch-wing-assets.mjs [exampleDir] [--force] [--source <file>]

Fetches everything the wing-it example needs that is not in git:

  1. WING IT! (Blender Studio, 2023), CC BY 4.0, from Wikimedia Commons,
     1920x1080, 24 fps, 237.948 s, VP9 + Opus
     -> assets/source/WING_IT_-_Blender_Open_Movie-full_movie.webm
        (36,196,718 bytes, size and sha256 checked)
  2. GSAP 3.14.2 -> assets/gsap.min.js, copied from another example when a
     copy is there, otherwise downloaded from jsDelivr
  3. ffmpeg: film 82.0 s to 112.0 s in the 12 shots of shots.json, each
     cropped to 608x1080 around its own center, scaled to 1080x1920, 30 fps;
     the one "wide" shot keeps the whole 16:9 frame as a card over a blurred
     copy of itself. H.264, no audio -> assets/wing_v.mp4 (29.967 s)
  4. ffmpeg: film 82.0 s to 114.5 s, volume 0.12 from 19.8 s to 22.3 s (a
     shouted swear), fade out over the last 1.5 s, 48 kHz stereo MP3
     -> assets/wing_a.mp3 (32.5 s)
  5. ffmpeg: the last frame of wing_v.mp4 -> assets/last.jpg (the outro
     shows it as a still after the footage ends)
  6. sha256 of the download, then ffprobe every file and print a table

Files that already exist are skipped. The film is downloaded only when
wing_v.mp4 or wing_a.mp3 has to be made. A change to shots.json takes
effect with --force (or after deleting wing_v.mp4 and last.jpg).

Arguments:
  exampleDir       example folder (default: examples/wing-it)

Options:
  --force          download and convert everything again
  --source <file>  use a copy of the film you already have instead of
                   downloading it (its sha256 is checked the same way)
  -h, --help       show this help

To download by hand instead: open the Commons file page below, download the
original file, and save it under the name in step 1. The script then uses it.

License: Creative Commons Attribution 4.0
(https://creativecommons.org/licenses/by/4.0/). Credit the film as
"WING IT! (CC BY 4.0) Blender Foundation | studio.blender.org" and say that
it was changed. Logos and trademarks are not covered by the license.

Needs ffmpeg and ffprobe on PATH. Behind a proxy, set HTTPS_PROXY and
NODE_USE_ENV_PROXY=1: Node's built-in fetch ignores HTTPS_PROXY otherwise.

Pages:
  https://commons.wikimedia.org/wiki/File:WING_IT!_-_Blender_Open_Movie-full_movie.webm
  https://studio.blender.org/projects/wing-it/pages/licensing/
`;

// Wikimedia asks API and upload clients to send a descriptive User-Agent.
const USER_AGENT = `claude-code-character-videos-fetch/0.1 (https://github.com/helicerat/claude-code-character-videos; downloads one CC BY example film) node/${process.versions.node}`;

const FILM = {
  label: 'WING IT! from Wikimedia Commons',
  url: 'https://upload.wikimedia.org/wikipedia/commons/3/38/WING_IT%21_-_Blender_Open_Movie-full_movie.webm',
  page: 'https://commons.wikimedia.org/wiki/File:WING_IT!_-_Blender_Open_Movie-full_movie.webm',
  file: 'source/WING_IT_-_Blender_Open_Movie-full_movie.webm',
  bytes: 36196718,
  // The revision the example was cut from (Commons sha1 ed4413be967c5333bb70251e3ddfdb38d42c7643).
  sha256: '393df1098a0db66e5a6cee3678762e600f085317faaf36e56636bd7a54bcfc51',
};
const GSAP = {
  url: 'https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js',
  file: 'gsap.min.js',
  sha256: 'c174bfce53a729418d57a8ad8625e7247c793a22fef8e2851e3cfa3de9cd8280',
};
// sha256 of the files the posted video was rendered from. Another ffmpeg or x264
// build can give different bytes for the same frames; that is not an error.
const REFERENCE = {
  'wing_v.mp4': 'c98d70b2b883ea9f79667ca7c16376d5fa48775dde35104e1f07999a2704c437',
  'wing_a.mp3': '615f5eeee05f8c6cd19b6c0dd2d718320985819afbfaa3ac9011916ee52e10df',
  'last.jpg': '03395dd88c910fe209fc597ae5047ea3b06d4a32dc9cb8e109033d231417a80d',
};

// The 9:16 window: 608x1080 out of the 1920x1080 frame, scaled to 1080x1920.
const SRC_W = 1920;
const CROP_W = 608;
const OUT_W = 1080;
const OUT_H = 1920;
// The wide shot: the whole frame scaled to 1080x608, at y 656 (centered) on a blurred copy.
const CARD_H = 608;
const CARD_Y = (OUT_H - CARD_H) / 2;

// Sound: 32.5 s from film 82.0 s, the composition's full length.
const AUDIO_START = 82;
const AUDIO_LEN = 32.5;
// Film 101.8 to 104.3 s carries a shouted swear: play it at 12 percent.
const DUCK = { from: 19.8, to: 22.3, volume: 0.12 };
const FADE = { start: 31.0, duration: 1.5 };

// Write numbers the way the original Python build printed them (82.0, not 82),
// so the printed command reads like the one the example was made with.
const n = (x) => (Number.isInteger(x) ? x.toFixed(1) : String(x));

function readShots(dir) {
  const file = path.join(dir, 'shots.json');
  const data = readJson(file, 'shots.json');
  const shots = data?.shots;
  if (!Array.isArray(shots) || shots.length === 0) throw new CliError(`${rel(file)} needs a non-empty "shots" array.`);
  let prev = null;
  return shots.map((s, i) => {
    const wide = s.center_x === 'wide';
    if (!Number.isFinite(s.start_s) || !Number.isFinite(s.end_s) || s.end_s <= s.start_s || (!wide && !(s.center_x >= 0 && s.center_x <= 1))) {
      throw new CliError(`${rel(file)} shot #${i + 1} needs start_s < end_s (film seconds) and center_x between 0 and 1, or "wide": ${JSON.stringify(s)}`);
    }
    if (prev !== null && Math.abs(s.start_s - prev) > 1e-9) {
      throw new CliError(`${rel(file)} shot #${i + 1} starts at ${s.start_s} s, but the shot before it ends at ${prev} s. Shots must follow each other with no gap.`);
    }
    prev = s.end_s;
    return { start: s.start_s, end: s.end_s, cx: wide ? 'wide' : s.center_x };
  });
}

// One filter graph: each shot is trimmed from the film, cropped (or made into a card)
// and scaled on its own, then the shots are joined in order.
function videoFilter(shots) {
  const parts = shots.map(({ start, end, cx }, i) => {
    const trim = `[0:v]trim=start=${n(start)}:end=${n(end)},setpts=PTS-STARTPTS`;
    if (cx === 'wide') {
      return `${trim},split[w${i}a][w${i}b];`
        + `[w${i}a]scale=-2:${OUT_H},crop=${OUT_W}:${OUT_H},boxblur=20:2,eq=brightness=-0.12[bg${i}];`
        + `[w${i}b]scale=${OUT_W}:${CARD_H}:flags=lanczos[fg${i}];`
        + `[bg${i}][fg${i}]overlay=0:${CARD_Y},fps=30,setsar=1[v${i}];`;
    }
    const x = Math.trunc(Math.min(Math.max(cx * SRC_W - CROP_W / 2, 0), SRC_W - CROP_W));
    return `${trim},crop=${CROP_W}:1080:${x}:0,scale=${OUT_W}:${OUT_H}:flags=lanczos,fps=30,setsar=1[v${i}];`;
  });
  return parts.join('') + shots.map((_, i) => `[v${i}]`).join('') + `concat=n=${shots.length}:v=1:a=0[vout]`;
}

// x264 defaults otherwise (keyframes up to 250 frames apart), as in the posted video.
const VIDEO_ARGS = (src, out, shots) => [
  '-y', '-i', src,
  '-filter_complex', videoFilter(shots),
  '-map', '[vout]',
  '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p',
  out,
];
const AUDIO_ARGS = (src, out) => [
  '-y', '-ss', String(AUDIO_START), '-t', String(AUDIO_LEN), '-i', src, '-vn',
  '-af', `volume=enable='between(t,${DUCK.from},${DUCK.to})':volume=${DUCK.volume},afade=t=out:st=${n(FADE.start)}:d=${FADE.duration}`,
  '-ac', '2', '-ar', '48000', '-c:a', 'libmp3lame', '-q:a', '2',
  out,
];
// Seek to 0.05 s before the end and keep one frame: the last frame of the footage.
const STILL_ARGS = (video, out) => ['-y', '-sseof', '-0.05', '-i', video, '-frames:v', '1', out];

const quote = (s) => (/[\s"'()[\];,]/.test(s) ? `"${s}"` : s);

const { values, positionals } = cli({
  help: HELP,
  options: { force: { type: 'boolean' }, source: { type: 'string' } },
});

main(async () => {
  const dir = resolveExampleDir(positionals[0] ?? path.join(REPO_ROOT, 'examples', 'wing-it'));
  const assets = path.join(dir, 'assets');
  const force = Boolean(values.force);
  const p = (name) => path.join(assets, name);
  const warnings = [];
  const shots = readShots(dir);

  const needVideo = force || !existsSync(p('wing_v.mp4'));
  const needAudio = force || !existsSync(p('wing_a.mp3'));
  const needStill = needVideo || !existsSync(p('last.jpg'));
  const needGsap = force || !existsSync(p(GSAP.file));
  const filmPath = values.source ? path.resolve(values.source) : p(FILM.file);
  if (values.source && !existsSync(filmPath)) throw new CliError(`--source file not found: ${filmPath}`);

  console.log(`example: ${rel(dir)}`);
  console.log(`shots: ${shots.length}, film ${n(shots[0].start)} s to ${n(shots[shots.length - 1].end)} s (${(shots[shots.length - 1].end - shots[0].start).toFixed(2)} s), from ${rel(path.join(dir, 'shots.json'))}`);
  const needFilm = needVideo || needAudio;
  const downloadFilm = needFilm && !values.source && (force || !existsSync(filmPath));
  const note = downloadFilm || needGsap ? proxyPreflightNote() : null;
  if (note) console.log(note);

  // 1. The film.
  if (downloadFilm) {
    console.log(`download ${FILM.label}: ${FILM.url}`);
    const t0 = Date.now();
    const bytes = await download(FILM.url, filmPath, { userAgent: USER_AGENT });
    console.log(`  saved ${rel(filmPath)}, ${bytes.toLocaleString('en-US')} bytes, in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  } else if (!needFilm) {
    console.log(`skip ${FILM.label}: not needed, wing_v.mp4 and wing_a.mp3 already exist`);
  } else {
    console.log(`use ${rel(filmPath)}${values.source ? ' (--source)' : ' (already downloaded)'}`);
  }
  if (needFilm || existsSync(filmPath)) {
    const bytes = statSync(filmPath).size;
    const hash = await sha256File(filmPath);
    if (bytes === FILM.bytes && hash === FILM.sha256) {
      console.log('  size and sha256 ok');
    } else {
      warnings.push(`${rel(filmPath)} is ${bytes.toLocaleString('en-US')} bytes with sha256 ${hash}; the example was cut from ${FILM.bytes.toLocaleString('en-US')} bytes, sha256 ${FILM.sha256}. Commons may have a new revision of the file. Check the shot times in shots.json and the event times in events.json against frames of the new file before rendering. File page: ${FILM.page}`);
    }
  }

  // 2. GSAP: the same pinned file as the other examples.
  const gsapDest = p(GSAP.file);
  if (needGsap) {
    const candidates = ['handwash-song', 'spin-count'].map((e) => path.join(REPO_ROOT, 'examples', e, 'assets', GSAP.file));
    let copied = false;
    if (!force) {
      for (const local of candidates) {
        if (existsSync(local) && path.resolve(local) !== path.resolve(gsapDest) && (await sha256File(local)) === GSAP.sha256) {
          copyFileSync(local, gsapDest);
          console.log(`copy GSAP: ${rel(local)} -> ${rel(gsapDest)}`);
          copied = true;
          break;
        }
      }
    }
    if (!copied) {
      console.log(`download GSAP: ${GSAP.url}`);
      await download(GSAP.url, gsapDest, { userAgent: USER_AGENT });
    }
  } else {
    console.log(`skip GSAP: ${rel(gsapDest)} exists`);
  }
  const gsapHash = await sha256File(gsapDest);
  if (gsapHash === GSAP.sha256) console.log('  sha256 ok');
  else warnings.push(`${rel(gsapDest)} has sha256 ${gsapHash}, expected ${GSAP.sha256}. It is not the GSAP 3.14.2 build this example was tested with. Delete it and run again with --force.`);

  // 3 to 5. ffmpeg. Each output goes to a temporary name first, so a failed run
  // never leaves a file that looks finished.
  const jobs = [
    [needVideo, 'wing_v.mp4', () => VIDEO_ARGS(filmPath, p('wing_v.partial.mp4'), shots), 'wing_v.partial.mp4'],
    [needAudio, 'wing_a.mp3', () => AUDIO_ARGS(filmPath, p('wing_a.partial.mp3')), 'wing_a.partial.mp3'],
    [needStill, 'last.jpg', () => STILL_ARGS(p('wing_v.mp4'), p('last.partial.jpg')), 'last.partial.jpg'],
  ];
  for (const [needed, name, args, tmpName] of jobs) {
    const out = p(name);
    if (!needed) {
      console.log(`skip ${name}: ${rel(out)} exists`);
      continue;
    }
    const tmp = p(tmpName);
    const a = args();
    const shown = a.map((x) => (path.isAbsolute(x) && (x === tmp || x === filmPath || x === p('wing_v.mp4')) ? quote(rel(x)) : quote(x)));
    console.log(`ffmpeg ${shown.join(' ')}`);
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

  // 6. Probe and compare.
  console.log('');
  const files = [filmPath, p('wing_v.mp4'), p('wing_a.mp3'), p('last.jpg')].filter((f) => existsSync(f));
  // The files are meant to differ in length (237.9 s film, 30 s cut, 32.5 s sound),
  // so the cross-file duration check is off; the expected values are checked below.
  const report = await probeReport(files, { tolerance: Number.POSITIVE_INFINITY, label: (f) => (f === filmPath && values.source ? rel(f) : path.relative(assets, f).split(path.sep).join('/')) });
  warnings.push(...report.warnings);
  const byName = Object.fromEntries(report.infos.map((i) => [path.basename(i.file), i]));
  const v = byName['wing_v.mp4'];
  const a = byName['wing_a.mp3'];
  const still = byName['last.jpg'];
  const cutLen = shots[shots.length - 1].end - shots[0].start;
  if (v && (v.width !== OUT_W || v.height !== OUT_H || Math.round(v.fps) !== 30 || Math.abs((v.videoDuration ?? v.duration) - cutLen) > 0.1)) {
    warnings.push(`wing_v.mp4 is ${v.width}x${v.height}, ${v.fps} fps, ${v.videoDuration ?? v.duration} s; expected ${OUT_W}x${OUT_H}, 30 fps, about ${cutLen.toFixed(2)} s. The event times in events.json assume the posted cut (29.967 s).`);
  }
  if (a && (a.sampleRate !== 48000 || a.channels !== 2 || Math.abs(a.duration - AUDIO_LEN) > 0.1)) {
    warnings.push(`wing_a.mp3 is ${a.sampleRate} Hz, ${a.channels} ch, ${a.duration} s; expected 48000 Hz, 2 ch, ${AUDIO_LEN} s.`);
  }
  if (still && (still.width !== OUT_W || still.height !== OUT_H)) {
    warnings.push(`last.jpg is ${still.width}x${still.height}; expected ${OUT_W}x${OUT_H}.`);
  }

  console.log('');
  const same = [];
  const differ = [];
  for (const [name, hash] of Object.entries(REFERENCE)) {
    if (!existsSync(p(name))) continue;
    ((await sha256File(p(name))) === hash ? same : differ).push(name);
  }
  if (same.length) console.log(`same bytes as the files the posted video was rendered from: ${same.join(', ')}`);
  if (differ.length) console.log(`note: ${differ.join(', ')} differ in bytes from the files the posted video was rendered from. Another ffmpeg or x264 build, or a changed shots.json, does that; compare frames with node scripts/framemd5-diff.mjs if it matters.`);

  console.log('');
  if (warnings.length) {
    for (const w of warnings) console.log(`warning: ${w}`);
    return 1;
  }
  console.log(`assets ready. Next: node scripts/build.mjs ${rel(dir)}, npx hyperframes@0.8.143 lint ${rel(dir)}, then the render (npm run render:wing).`);
  return 0;
});
