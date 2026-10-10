#!/usr/bin/env node
// Repair the black strip at the right edge of a render.
// HyperFrames 0.8.143 converts every captured frame with an ffmpeg filter that
// goes through the gbrp pixel format. ffmpeg 8.1.2 (seen with the gyan.dev
// Windows build) has a bug in its x86 SIMD conversion from yuv420p, yuvj420p
// or yuv422p to gbrp: every column after the last multiple of 16 comes out
// black. A 1080-wide frame loses columns 1072-1079. The picture is not shifted
// or scaled; those columns are simply replaced. This script finds such a strip
// and fills it: with a flat color when the edge is a flat background, or by
// repeating the last good column when footage or a gradient reaches the edge.

import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { CliError, cli, ffmpeg, ffprobeJson, main, mediaInfo, rel, replaceFile } from './lib.mjs';

const HELP = `
Usage: node scripts/fix-right-edge.mjs <in.mp4> [out.mp4] [options]

Looks for a near-black strip at the right edge of a video and, if there is
one, fills it:

  1. decodes a few frames spread over the video and measures the mean luma
     (0-255, full range) of each of the rightmost --scan columns
  2. counts the columns, from the right edge inward, whose mean luma stays
     below --threshold in every sampled frame
  3. picks a fill (see --mode), then ffmpeg fills those columns (an even
     number, for yuv420p), re-encodes the video (libx264 -crf 16 -preset
     slow, yuv420p, +faststart) and copies the audio as is

With no strip it re-encodes nothing: it copies <in> to <out> unchanged (when
they differ) and exits 0.

Arguments:
  in.mp4               the render to check
  out.mp4              where to write the result (default: <in>.fixed.mp4).
                       Pass the same path as <in> to replace it.

Options:
  --mode <m>           how to fill the strip:
                         auto (default)  look at the two columns just left
                                         of the strip in the sampled frames.
                                         If their luma varies down the frame
                                         by more than --flat levels, footage
                                         or a gradient reaches the edge:
                                         smear. Otherwise the edge is a flat
                                         background: fill.
                         smear           repeat the last good column into
                                         the strip (ffmpeg fillborders
                                         mode=smear). Continues gradients,
                                         shadows and footage. Anything that
                                         crosses that column for a moment
                                         (a badge, a word) is stretched into
                                         a bar to the frame edge.
                         fill            crop the strip off and pad the
                                         frame back with one flat color (see
                                         --color). On a gradient this shows
                                         as a seam. "color" is accepted as
                                         the old name of this mode.
  --color <c>          fill color: auto (default) or #rrggbb. Giving a hex
                       color without --mode selects fill. auto takes the
                       median Y'CbCr value of the two columns just left of
                       the strip in the sampled frames, which is the
                       background as the render encoded it (2 luma levels
                       darker than the page color #f3eee5 in handwash-song).
  --flat <n>           for --mode auto: the largest spread, in luma levels
                       (0-255), that still counts as a flat edge (default:
                       12). The spread is p95 minus p5 of the two columns'
                       luma over the frame height, median over the sampled
                       frames.
  --px <auto|N>        strip width: auto (measure it, default) or a number
                       of columns to fill without measuring
  --threshold <n>      mean luma below which a column counts as black
                       (default: 8)
  --scan <n>           how many columns from the right edge to measure
                       (default: 64)
  --samples <n>        how many frames to measure (default: 5)
  --dry-run            measure and report, write nothing
  -h, --help           show this help

Cause: ffmpeg 8.1.2 (gyan.dev Windows build) converts yuv420p to gbrp
with every column after the last multiple of 16 black (one-line repro:
ffmpeg -f lavfi -i "color=c=white:s=1080x64,format=yuv420p" -frames:v 1
-vf format=gbrp out.png). HyperFrames 0.8.143 runs that conversion on every
captured frame. With -cpuflags 0 the same command is correct.
`;

const { values, positionals } = cli({
  help: HELP,
  options: {
    mode: { type: 'string' },
    color: { type: 'string' },
    flat: { type: 'string', default: '12' },
    px: { type: 'string', default: 'auto' },
    threshold: { type: 'string', default: '8' },
    scan: { type: 'string', default: '64' },
    samples: { type: 'string', default: '5' },
    'dry-run': { type: 'boolean' },
  },
});

function parseColor(c) {
  if (c.trim().toLowerCase() === 'auto') return 'auto';
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(c.trim());
  if (!m) throw new CliError(`--color must be auto or look like #f3eee5 (got "${c}").`);
  const hex = m[1].length === 3 ? m[1].split('').map((ch) => ch + ch).join('') : m[1];
  return hex.toLowerCase();
}

function parseMode(mode, color) {
  const hexGiven = color !== undefined && color.trim().toLowerCase() !== 'auto';
  if (mode === undefined) return hexGiven ? 'fill' : 'auto';
  let m = mode.trim().toLowerCase();
  if (m === 'color') m = 'fill';
  if (!['auto', 'smear', 'fill'].includes(m)) throw new CliError(`--mode must be auto, smear or fill (got "${mode}").`);
  if (m === 'smear' && color !== undefined) throw new CliError('--color only applies to --mode fill.');
  if (m === 'auto' && hexGiven) throw new CliError('a hex --color means a flat fill: use --mode fill, or leave --mode out.');
  return m;
}

function positiveInt(name, v, min = 1) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min) throw new CliError(`--${name} must be a whole number of at least ${min} (got "${v}").`);
  return n;
}

/** Raw pixels of a vertical band (columns x .. x+w-1) of the frame at time `t`. */
function grab(file, t, x, w, filter) {
  return new Promise((resolve, reject) => {
    const args = [
      '-hide_banner', '-nostdin', '-v', 'error', '-ss', t.toFixed(3), '-i', file, '-frames:v', '1',
      '-vf', `crop=${w}:ih:${x}:0,${filter}`, '-f', 'rawvideo', '-',
    ];
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const out = [];
    const err = [];
    child.stdout.on('data', (d) => out.push(d));
    child.stderr.on('data', (d) => err.push(d));
    child.on('error', (e) => reject(e.code === 'ENOENT' ? new CliError('`ffmpeg` was not found on PATH.') : e));
    child.on('close', (code) => {
      const buf = Buffer.concat(out);
      if (code !== 0 || buf.length === 0) {
        reject(new CliError(`ffmpeg could not decode a frame at ${t.toFixed(2)} s of ${rel(file)}:\n${Buffer.concat(err).toString('utf8').trim()}`));
        return;
      }
      resolve(buf);
    });
  });
}

/** Per-column mean and median luma (full range, 0-255) of columns x .. x+w-1. */
async function columnLuma(file, t, x, w) {
  const buf = await grab(file, t, x, w, 'scale=out_range=full,format=gray');
  const rows = buf.length / w;
  return Array.from({ length: w }, (_, c) => {
    const col = new Uint8Array(rows);
    let sum = 0;
    for (let y = 0; y < rows; y++) { col[y] = buf[y * w + c]; sum += col[y]; }
    col.sort();
    return { mean: sum / rows, median: col[rows >> 1] };
  });
}

const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

/**
 * How much the picture varies down the frame just left of the strip: for each
 * sampled frame, the luma of columns x and x+1 (averaged per row), p95 minus p5
 * over all rows. A flat page background gives a few levels (a soft shadow);
 * footage or a gradient gives tens. Returns the per-frame spreads and their median.
 */
async function edgeSpread(file, times, x) {
  const spreads = [];
  for (const t of times) {
    const buf = await grab(file, t, x, 2, 'scale=out_range=full,format=gray');
    const rows = buf.length / 2;
    const v = Float64Array.from({ length: rows }, (_, y) => (buf[2 * y] + buf[2 * y + 1]) / 2).sort();
    const q = (p) => v[Math.round(p * (rows - 1))];
    spreads.push(q(0.95) - q(0.05));
  }
  return { spreads, median: median(spreads) };
}

// Y'CbCr <-> R'G'B' for one pixel, the way ffmpeg's pad filter converts its color.
const KR = { bt709: 0.2126, bt601: 0.299 };
const KB = { bt709: 0.0722, bt601: 0.114 };
function toYuv([r, g, b], matrix, range) {
  const kr = KR[matrix]; const kb = KB[matrix]; const kg = 1 - kr - kb;
  const y = kr * r + kg * g + kb * b;
  const cb = (b - y) / (2 * (1 - kb));
  const cr = (r - y) / (2 * (1 - kr));
  return range === 'pc'
    ? [Math.round(y), Math.round(128 + cb), Math.round(128 + cr)]
    : [Math.round(16 + (219 * y) / 255), Math.round(128 + (224 * cb) / 255), Math.round(128 + (224 * cr) / 255)];
}
function toRgb([Y, U, V], matrix, range) {
  const kr = KR[matrix]; const kb = KB[matrix]; const kg = 1 - kr - kb;
  const y = range === 'pc' ? Y : ((Y - 16) * 255) / 219;
  const cb = range === 'pc' ? U - 128 : ((U - 128) * 255) / 224;
  const cr = range === 'pc' ? V - 128 : ((V - 128) * 255) / 224;
  const r = y + 2 * (1 - kr) * cr;
  const b = y + 2 * (1 - kb) * cb;
  const g = (y - kr * r - kb * b) / kg;
  return [r, g, b].map((c) => Math.min(255, Math.max(0, Math.round(c))));
}

/**
 * The color the render encoded next to the strip: the median Y, U and V of the
 * two columns left of it in the sampled frames, turned into the RGB value that
 * the pad filter converts back to exactly that Y, U and V (when one exists).
 */
async function sampleColor(file, times, x, stream) {
  const matrix = /^(bt470bg|smpte170m|bt601)/.test(stream?.color_space ?? '') ? 'bt601' : 'bt709';
  const range = stream?.color_range === 'pc' ? 'pc' : 'tv';
  const planes = [[], [], []];
  for (const t of times) {
    const buf = await grab(file, t, x, 2, 'format=yuv420p');
    const ySize = (buf.length * 2) / 3; // 2 columns of luma, 1 column each of U and V at half height
    const cSize = ySize / 4;
    for (let i = 0; i < ySize; i++) planes[0].push(buf[i]);
    for (let i = 0; i < cSize; i++) { planes[1].push(buf[ySize + i]); planes[2].push(buf[ySize + cSize + i]); }
  }
  const target = planes.map(median);
  let rgb = toRgb(target, matrix, range);
  const same = (a, b) => a.every((v, i) => v === b[i]);
  if (!same(toYuv(rgb, matrix, range), target)) {
    search: for (let d = 1; d <= 3; d++) {
      for (let dr = -d; dr <= d; dr++) for (let dg = -d; dg <= d; dg++) for (let db = -d; db <= d; db++) {
        const c = [rgb[0] + dr, rgb[1] + dg, rgb[2] + db].map((v) => Math.min(255, Math.max(0, v)));
        if (same(toYuv(c, matrix, range), target)) { rgb = c; break search; }
      }
    }
  }
  return { hex: rgb.map((c) => c.toString(16).padStart(2, '0')).join(''), yuv: target, matrix, range };
}

async function measure(file, info, { scan, samples, threshold }) {
  const cols = Math.min(scan, info.width);
  const dur = info.videoDuration ?? info.duration;
  if (!dur) throw new CliError(`${rel(file)}: cannot read its duration.`);
  const times = Array.from({ length: samples }, (_, i) => (dur * (i + 0.5)) / samples);
  const perFrame = [];
  for (const t of times) perFrame.push(await columnLuma(file, t, info.width - cols, cols));
  // Worst case per column: the brightest that column gets in any sampled frame.
  const maxLuma = Array.from({ length: cols }, (_, x) => Math.max(...perFrame.map((f) => f[x].mean)));
  let strip = 0;
  for (let x = cols - 1; x >= 0 && maxLuma[x] < threshold; x--) strip++;
  return { cols, times, perFrame, maxLuma, strip };
}

const fmt = (x) => x.toFixed(1);

main(async () => {
  if (positionals.length < 1 || positionals.length > 2) throw new CliError('give an input file and optionally an output file. Run with --help for usage.');
  const input = path.resolve(positionals[0]);
  if (!existsSync(input)) throw new CliError(`file not found: ${positionals[0]}`);
  const output = path.resolve(positionals[1] ?? input.replace(/(\.\w+)?$/, '.fixed.mp4'));
  const requested = parseMode(values.mode, values.color);
  const color = parseColor(values.color ?? 'auto');
  const flat = Number(values.flat);
  if (!(flat >= 0 && flat < 255)) throw new CliError(`--flat must be a number of luma levels between 0 and 255 (got "${values.flat}").`);
  const threshold = Number(values.threshold);
  if (!(threshold > 0 && threshold < 255)) throw new CliError(`--threshold must be a number between 0 and 255 (got "${values.threshold}").`);
  const scan = positiveInt('scan', values.scan, 2);
  const samples = positiveInt('samples', values.samples, 1);

  const info = await mediaInfo(input);
  if (!info.width) throw new CliError(`${rel(input)} has no video stream.`);
  console.log(`input:  ${rel(input)} (${info.width}x${info.height}, ${info.frames ?? '?'} frames, ${fmt(statSync(input).size / 1e6)} MB)`);

  const m = await measure(input, info, { scan, samples, threshold });
  const x0 = info.width - m.cols;
  const tail = m.maxLuma.slice(-Math.min(12, m.cols)).map((v, i, a) => `${x0 + m.cols - a.length + i}:${fmt(v)}`).join(' ');
  console.log(`measured ${m.times.length} frame(s) at ${m.times.map((t) => t.toFixed(2)).join(', ')} s; brightest mean luma per column, rightmost 12: ${tail}`);

  let px;
  if (values.px === 'auto') {
    if (m.strip === m.cols) {
      throw new CliError(`all ${m.cols} scanned columns are near black, which looks like a dark picture with no edge strip to find. Nothing changed. Use --px N to force a width.`);
    }
    px = m.strip;
  } else {
    px = positiveInt('px', values.px, 1);
    if (px >= info.width) throw new CliError(`--px ${px} is not narrower than the frame (${info.width} px).`);
    console.log(`--px ${px} given; measured strip is ${m.strip} px.`);
  }

  if (px === 0) {
    console.log(`no near-black strip at the right edge (threshold: mean luma < ${threshold}). Nothing to fix.`);
    if (values['dry-run']) return 0;
    if (output !== input) {
      copyFileSync(input, output);
      console.log(`copied unchanged to ${rel(output)}`);
    }
    return 0;
  }

  // yuv420p stores color at half width, so keep the cut on an even column.
  const even = px % 2 === 0 ? px : px + 1;
  const keep = info.width - even;
  if (keep < 2) throw new CliError(`a ${even} px strip leaves nothing of a ${info.width} px frame.`);
  const probe = await ffprobeJson(input);
  const v = probe.streams.find((st) => st.codec_type === 'video');
  let mode = requested;
  if (mode === 'auto') {
    const s = await edgeSpread(input, m.times, keep - 2);
    mode = s.median > flat ? 'smear' : 'fill';
    console.log(`auto: luma spread of x ${keep - 2}-${keep - 1} down the frame (p5 to p95) ${s.spreads.map(fmt).join(', ')} levels in the sampled frames, median ${fmt(s.median)} ${mode === 'smear' ? '>' : '<='} --flat ${flat}: ${mode === 'smear' ? 'footage or a gradient reaches the edge, smear' : 'flat background, fill'}`);
  }
  let filter;
  let how;
  if (mode === 'smear') {
    filter = `fillborders=right=${even}:mode=smear`;
    how = `fill: smear, column ${keep - 1} repeated`;
  } else {
    const sampled = color === 'auto' ? await sampleColor(input, m.times, keep - 2, v) : null;
    const fill = sampled ? sampled.hex : color;
    filter = `crop=${keep}:ih:0:0,pad=${info.width}:ih:0:0:color=0x${fill}`;
    how = `fill: flat #${fill}${sampled ? ` (median Y'CbCr ${sampled.yuv.join('/')} of x ${keep - 2}-${keep - 1}, ${sampled.matrix} ${sampled.range} range)` : ''}`;
  }
  console.log(`strip: ${px} px (x ${info.width - px}-${info.width - 1})${even !== px ? `, widened to ${even} px for yuv420p` : ''}; ${how}`);
  if (values['dry-run']) {
    console.log('dry run: nothing written');
    return 0;
  }

  // Keep the input's color tags, so the fill and the picture use the same matrix.
  const tags = [];
  for (const [opt, key] of [['-color_range', 'color_range'], ['-colorspace', 'color_space'], ['-color_primaries', 'color_primaries'], ['-color_trc', 'color_transfer']]) {
    if (v?.[key] && v[key] !== 'unknown') tags.push(opt, v[key]);
  }

  const tmp = output.replace(/(\.\w+)?$/, '.partial.mp4');
  const args = [
    '-y', '-i', input, '-map', '0:v:0', '-map', '0:a?', '-map_metadata', '0',
    '-vf', filter,
    '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', ...tags,
    '-c:a', 'copy', '-movflags', '+faststart+use_metadata_tags', tmp,
  ];
  console.log(`ffmpeg ${args.map((a) => (a === input ? rel(input) : a === tmp ? rel(tmp) : a)).join(' ')}`);
  const t0 = Date.now();
  try {
    await ffmpeg(args);
  } catch (e) {
    rmSync(tmp, { force: true });
    throw e;
  }
  replaceFile(tmp, output);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  const outInfo = await mediaInfo(output);
  const tc = m.times[Math.floor(m.times.length / 2)];
  const band = await columnLuma(output, tc, keep - 8, even + 8);
  const avg = (a, key) => a.reduce((sum, c) => sum + c[key], 0) / a.length;
  console.log(`wrote ${rel(output)} in ${secs} s: ${outInfo.width}x${outInfo.height}, ${outInfo.frames ?? '?'} frames, ${fmt(statSync(output).size / 1e6)} MB, audio ${outInfo.audioCodec ? 'copied' : 'none'}`);
  console.log(`check at ${tc.toFixed(2)} s, mean luma per column: filled x ${keep}-${info.width - 1} ${fmt(avg(band.slice(8), 'mean'))}, untouched x ${keep - 8}-${keep - 1} ${fmt(avg(band.slice(0, 8), 'mean'))}`);
  if (outInfo.width !== info.width || outInfo.height !== info.height || (info.frames && outInfo.frames !== info.frames)) {
    console.log(`warning: the output differs from the input in size or frame count (${info.width}x${info.height}, ${info.frames} frames in; ${outInfo.width}x${outInfo.height}, ${outInfo.frames} frames out).`);
    return 1;
  }
  return 0;
});
