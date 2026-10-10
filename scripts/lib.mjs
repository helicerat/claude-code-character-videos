// Shared helpers for the scripts in this folder.
// Node built-ins only. ffmpeg and ffprobe are called as child processes.

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_EXAMPLE = path.join(REPO_ROOT, 'examples', 'handwash-song');

/** An expected failure: print the message, no stack trace. */
export class CliError extends Error {}

/**
 * Parse argv with node:util parseArgs, print `help` on --help, and turn
 * unknown flags into a readable error.
 */
export function cli({ help, options = {}, minNode = 22 }) {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < minNode) {
    console.error(`error: Node ${minNode} or newer is required, found ${process.version}. Install the current LTS from https://nodejs.org and run the command again.`);
    process.exit(1);
  }
  let parsed;
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      options: { help: { type: 'boolean', short: 'h' }, ...options },
      allowPositionals: true,
      strict: true,
    });
  } catch (e) {
    console.error(`error: ${e.message}\nRun with --help to see the options.`);
    process.exit(2);
  }
  if (parsed.values.help) {
    console.log(help.trim());
    process.exit(0);
  }
  return parsed;
}

/** Run an async main and print errors the same way in every script. */
export function main(fn) {
  fn().then(
    (code) => { if (typeof code === 'number') process.exitCode = code; },
    (err) => {
      if (err instanceof CliError) console.error(`error: ${err.message}`);
      else console.error(err);
      process.exitCode = 1;
    },
  );
}

export function rel(p) {
  const r = path.relative(process.cwd(), p);
  return r && !r.startsWith('..') && !path.isAbsolute(r) ? r.split(path.sep).join('/') : p;
}

const INSTALL_HINTS = {
  ffmpeg: 'Install FFmpeg (it ships ffprobe too): Windows `winget install Gyan.FFmpeg`, macOS `brew install ffmpeg`, Debian/Ubuntu `sudo apt install ffmpeg`. Open a new terminal afterwards so PATH is refreshed.',
};
INSTALL_HINTS.ffprobe = INSTALL_HINTS.ffmpeg;

/** Spawn a process without a shell. Resolves with { code, stdout, stderr }. */
export function run(cmd, args, { inherit = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const out = [];
    const err = [];
    child.stdout?.on('data', (d) => out.push(d));
    child.stderr?.on('data', (d) => err.push(d));
    child.on('error', (e) => {
      if (e.code === 'ENOENT') reject(new CliError(`\`${cmd}\` was not found on PATH. ${INSTALL_HINTS[cmd] ?? ''}`.trim()));
      else reject(e);
    });
    child.on('close', (code) => resolve({
      code,
      stdout: Buffer.concat(out).toString('utf8'),
      stderr: Buffer.concat(err).toString('utf8'),
    }));
  });
}

/** Run ffmpeg and throw a readable error with its stderr on failure. */
export async function ffmpeg(args) {
  const r = await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', ...args]);
  if (r.code !== 0) throw new CliError(`ffmpeg failed (exit ${r.code}):\n  ffmpeg ${args.join(' ')}\n${r.stderr.trim()}`);
  return r;
}

export async function ffprobeJson(file) {
  if (!existsSync(file)) throw new CliError(`file not found: ${file}`);
  const r = await run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]);
  if (r.code !== 0) throw new CliError(`ffprobe could not read ${file}:\n${r.stderr.trim()}`);
  return JSON.parse(r.stdout);
}

function num(x) {
  const n = Number(x);
  return x === undefined || x === null || x === 'N/A' || !Number.isFinite(n) ? null : n;
}

function rate(fraction) {
  if (!fraction || fraction === '0/0') return null;
  const [a, b] = String(fraction).split('/').map(Number);
  return b ? a / b : num(a);
}

function tagDuration(stream) {
  // Matroska/WebM keeps per-stream length in a tag like "00:00:30.885000000".
  const t = stream?.tags?.DURATION ?? stream?.tags?.duration;
  const m = t && /^(\d+):(\d+):(\d+(?:\.\d+)?)$/.exec(t);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
}

/** Flatten ffprobe output to the numbers the scripts care about. */
export async function mediaInfo(file) {
  const j = await ffprobeJson(file);
  const streams = j.streams ?? [];
  const v = streams.find((s) => s.codec_type === 'video' && !s.disposition?.attached_pic);
  const a = streams.find((s) => s.codec_type === 'audio');
  return {
    file,
    videoCodec: v?.codec_name ?? null,
    width: v?.width ?? null,
    height: v?.height ?? null,
    fps: v ? rate(v.avg_frame_rate) ?? rate(v.r_frame_rate) : null,
    frames: v ? num(v.nb_frames) : null,
    audioCodec: a?.codec_name ?? null,
    sampleRate: a ? num(a.sample_rate) : null,
    channels: a?.channels ?? null,
    duration: num(j.format?.duration),
    videoDuration: v ? num(v.duration) ?? tagDuration(v) : null,
    audioDuration: a ? num(a.duration) ?? tagDuration(a) : null,
  };
}

const fixed = (x, d = 3) => (x === null || x === undefined ? '-' : x.toFixed(d));
const trimNum = (x) => (x === null || x === undefined ? '-' : String(Number(x.toFixed(3))));

export function printTable(header, rows) {
  const all = [header, ...rows].map((r) => r.map((c) => String(c)));
  const widths = header.map((_, i) => Math.max(...all.map((r) => r[i].length)));
  const line = (r) => r.map((c, i) => (i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join('  ');
  console.log(line(all[0]));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  for (const r of all.slice(1)) console.log(line(r));
}

// 48000/44100 = 1.0884: the length ratio you get when samples recorded at one
// rate are labelled with the other. The margin is tight on purpose: wing-it's
// 29.967 s footage and 32.5 s sound (ratio 1.0845) differ by design.
function rateMixup(a, b) {
  const r = Math.max(a, b) / Math.min(a, b);
  return Math.abs(r - 48000 / 44100) < 0.002
    ? ' The ratio is 48000/44100: audio at one sample rate was probably labelled as the other.'
    : '';
}

/**
 * Probe files, print one table row each, return warnings:
 * audio not at 44.1/48 kHz, streams inside a file that differ by more than
 * `tolerance` seconds, and files whose durations differ by more than `tolerance`.
 */
export async function probeReport(files, { tolerance = 0.1, label = rel } = {}) {
  const infos = [];
  for (const f of files) infos.push(await mediaInfo(f));
  printTable(
    ['file', 'video', 'size', 'fps', 'frames', 'audio', 'sample_rate', 'ch', 'duration', 'v_dur', 'a_dur'],
    infos.map((i) => [
      label(i.file),
      i.videoCodec ?? '-',
      i.width ? `${i.width}x${i.height}` : '-',
      trimNum(i.fps),
      i.frames ?? '-',
      i.audioCodec ?? '-',
      i.sampleRate ?? '-',
      i.channels ?? '-',
      fixed(i.duration),
      fixed(i.videoDuration),
      fixed(i.audioDuration),
    ]),
  );
  const warnings = [];
  for (const i of infos) {
    if (i.sampleRate && i.sampleRate !== 44100 && i.sampleRate !== 48000) {
      warnings.push(`${label(i.file)}: audio is ${i.sampleRate} Hz. Resample to 44100 or 48000 Hz (ffmpeg -ar 48000) before using it.`);
    }
    if (i.videoDuration !== null && i.audioDuration !== null && Math.abs(i.videoDuration - i.audioDuration) > tolerance) {
      warnings.push(`${label(i.file)}: video stream is ${fixed(i.videoDuration)} s, audio stream is ${fixed(i.audioDuration)} s (differ by ${fixed(Math.abs(i.videoDuration - i.audioDuration))} s).${rateMixup(i.videoDuration, i.audioDuration)}`);
    }
  }
  const timed = infos.filter((i) => i.duration !== null);
  if (timed.length > 1) {
    const lo = timed.reduce((m, i) => (i.duration < m.duration ? i : m));
    const hi = timed.reduce((m, i) => (i.duration > m.duration ? i : m));
    if (hi.duration - lo.duration > tolerance) {
      warnings.push(`durations differ by ${fixed(hi.duration - lo.duration)} s: ${label(lo.file)} is ${fixed(lo.duration)} s, ${label(hi.file)} is ${fixed(hi.duration)} s.${rateMixup(lo.duration, hi.duration)}`);
    }
  }
  return { infos, warnings };
}

export function sha256File(file) {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(file).on('error', reject).on('data', (d) => h.update(d)).on('end', () => resolve(h.digest('hex')));
  });
}

/** Explain why fetch() may have failed behind a proxy. Never prints the proxy URL. */
export function proxyHint() {
  const proxySet = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy'].some((k) => process.env[k]);
  const enabled = process.env.NODE_USE_ENV_PROXY === '1' || process.execArgv.includes('--use-env-proxy');
  if (proxySet && !enabled) {
    return [
      'HTTPS_PROXY is set, but Node\'s built-in fetch ignores it unless NODE_USE_ENV_PROXY=1 is set.',
      'Run the same command again with it set, for example:',
      '  bash/zsh:    NODE_USE_ENV_PROXY=1 npm run fetch',
      '  PowerShell:  $env:NODE_USE_ENV_PROXY=1; npm run fetch',
    ].join('\n');
  }
  if (!proxySet) return 'If you are behind a proxy, set HTTPS_PROXY and NODE_USE_ENV_PROXY=1, then run again.';
  return 'NODE_USE_ENV_PROXY=1 is set, so fetch goes through HTTPS_PROXY. Check that the proxy is running and reachable.';
}

/** Note printed before the first request when a proxy is set but fetch will ignore it. */
export function proxyPreflightNote() {
  const proxySet = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy'].some((k) => process.env[k]);
  const enabled = process.env.NODE_USE_ENV_PROXY === '1' || process.execArgv.includes('--use-env-proxy');
  return proxySet && !enabled
    ? 'note: HTTPS_PROXY is set but NODE_USE_ENV_PROXY is not, so fetch will connect directly. Set NODE_USE_ENV_PROXY=1 if direct connections are blocked.'
    : null;
}

/**
 * Download `url` to `dest` through a .part file, so a broken download never looks finished.
 * `headers` adds request headers (a Referer, for example). Resolves with the byte count.
 */
export async function download(url, dest, { userAgent, headers = {}, timeoutMs = 180_000 } = {}) {
  mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.part`;
  let res;
  try {
    res = await fetch(url, {
      headers: { ...(userAgent ? { 'User-Agent': userAgent } : {}), ...headers },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const why = e.name === 'TimeoutError' ? `no answer in ${timeoutMs / 1000} s` : (e.cause?.code ?? e.cause?.message ?? e.message);
    throw new CliError(`could not download ${url} (${why}).\n${proxyHint()}`);
  }
  if (!res.ok) {
    let hint = '';
    if (res.status === 403 || res.status === 429) {
      hint = '\nThe server refused or rate-limited the request. Wait a minute and run again, or download the file in a browser and put it at the path above.';
    }
    throw new CliError(`${url} answered HTTP ${res.status} ${res.statusText}.${hint}`);
  }
  try {
    await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
  } catch (e) {
    rmSync(tmp, { force: true });
    throw new CliError(`download of ${url} broke off (${e.cause?.code ?? e.message}).\n${proxyHint()}`);
  }
  const bytes = statSync(tmp).size;
  replaceFile(tmp, dest);
  return bytes;
}

/** Move a finished temp file over the real one; explain the usual Windows lock. */
export function replaceFile(tmp, dest) {
  try {
    renameSync(tmp, dest);
  } catch (e) {
    if (e.code === 'EPERM' || e.code === 'EBUSY' || e.code === 'EACCES') {
      // Media lives in <exampleDir>/assets/, and preview --stop needs the example folder.
      const parent = path.dirname(dest);
      const exampleDir = path.basename(parent) === 'assets' ? rel(path.dirname(parent)) : '<exampleDir>';
      throw new CliError(`cannot replace ${rel(dest)}: it is open in another program (${e.code}). Stop the preview (npx hyperframes@0.8.143 preview ${exampleDir} --stop) or close the player, then run again. The new file is at ${rel(tmp)}.`);
    }
    throw e;
  }
}

/** Line ending of an existing text file, or LF when the file does not exist yet. */
export function detectEol(file) {
  if (!existsSync(file)) return '\n';
  return readFileSync(file, 'utf8').includes('\r\n') ? '\r\n' : '\n';
}

/**
 * Write text with a chosen line ending. `eol` is 'lf', 'crlf' or 'auto'
 * (keep whatever the file being replaced uses, LF for a new file).
 * Returns true when the bytes on disk changed.
 */
export function writeText(file, text, eol = 'auto') {
  const sep = eol === 'crlf' ? '\r\n' : eol === 'lf' ? '\n' : detectEol(file);
  const lf = text.replace(/\r\n/g, '\n');
  const out = Buffer.from(sep === '\n' ? lf : lf.replace(/\n/g, '\r\n'), 'utf8');
  if (existsSync(file) && readFileSync(file).equals(out)) return false;
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, out);
  return true;
}

export function eolOption(value) {
  if (!['auto', 'lf', 'crlf'].includes(value)) throw new CliError(`--eol must be auto, lf or crlf (got "${value}").`);
  return value;
}

export function readJson(file, what = 'file') {
  if (!existsSync(file)) throw new CliError(`${what} not found: ${rel(file)}`);
  try {
    return JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  } catch (e) {
    throw new CliError(`${rel(file)} is not valid JSON: ${e.message}`);
  }
}

export function resolveExampleDir(arg) {
  const dir = path.resolve(arg ?? DEFAULT_EXAMPLE);
  if (!existsSync(dir)) throw new CliError(`example folder not found: ${dir}`);
  return dir;
}
