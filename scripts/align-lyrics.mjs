#!/usr/bin/env node
// Timings from the transcription, words from lyrics.txt.
// Whisper mishears songs ("Wash and sell" for "Wash hands well"), and sometimes
// a word you wrote is not in the take at all. This script lines the two word
// lists up, keeps every timing it can, and tells you what did not match.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { CliError, cli, eolOption, main, readJson, rel, resolveExampleDir, writeText } from './lib.mjs';

const HELP = `
Usage: node scripts/align-lyrics.mjs [exampleDir] [options]

Reads lyrics.txt and a word-timed transcription, aligns them word by word
(edit distance over words), and writes transcript.json:

  [{ "text": "hands", "start": 3.14, "end": 3.84, "heard": "and" }, ...]

  text          the word from lyrics.txt (outer punctuation removed)
  start, end    seconds, taken from the transcription
  heard         present when the transcription heard a different word
  interpolated  present when the word was not heard at all; its time is
                spread between the neighbouring words. Listen to the take:
                the singer may have skipped it.

Heard words that are not in the lyrics (a hallucinated "you" after the music
ends, a breath read as a word) are dropped and listed.

Arguments:
  exampleDir        example folder (default: examples/handwash-song)

Options:
  --lyrics <file>   default: <exampleDir>/lyrics.txt
  --heard <file>    default: <exampleDir>/assets/whisper_verbose.json, or
                    <exampleDir>/assets/transcript.json when that is missing
                    (what "npx hyperframes@0.8.143 transcribe assets/song.mp3" writes).
                    Accepts OpenAI/Groq verbose_json (words[]), the
                    openai-whisper Python JSON (segments[].words[]), or a
                    HyperFrames transcript.json ([{text,start,end}]).
  --out <file>      default: <exampleDir>/transcript.json
  --dry-run         print the report, write nothing
  --eol <mode>      auto (keep the existing file's line endings), lf or crlf
  -h, --help        show this help

lyrics.txt: one sung line per line. Blank lines, lines starting with # and
section labels like [Chorus] are ignored. Sing it twice, write it twice.
`;

const { values, positionals } = cli({
  help: HELP,
  options: {
    lyrics: { type: 'string' },
    heard: { type: 'string' },
    out: { type: 'string' },
    'dry-run': { type: 'boolean' },
    eol: { type: 'string', default: 'auto' },
  },
});

// Strip punctuation around a word, keep inner apostrophes and hyphens ("That's", "x-ray").
const clean = (w) => String(w).trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
// Comparison key: lower case, letters and digits only.
const key = (w) => clean(w).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

function levenshtein(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

const GAP = 1; // a lyric word nobody heard, or a heard word that is not in the lyrics
// A substitution costs 0.5 plus twice the share of letters that differ:
// "well"/"sell" 1.0, "hands"/"and" 1.3. Unrelated words ("Wash"/"Music")
// cost more than a gap pair (2), so a stray word next to a skipped one is
// dropped instead of lending the skipped word its time.
const subCost = (a, b) => (a === b ? 0 : 0.5 + 2 * (levenshtein(a, b) / Math.max(a.length, b.length, 1)));

/** Word-level alignment. Returns ops in order: {op:'match'|'sub'|'unheard'|'extra', l?, h?}. */
function align(lyricKeys, heardKeys) {
  const n = lyricKeys.length;
  const m = heardKeys.length;
  const cost = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  const back = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1)); // 1 diag, 2 unheard, 3 extra
  for (let i = 1; i <= n; i++) { cost[i][0] = i * GAP; back[i][0] = 2; }
  for (let j = 1; j <= m; j++) { cost[0][j] = j * GAP; back[0][j] = 3; }
  const EPS = 1e-9;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const diag = cost[i - 1][j - 1] + subCost(lyricKeys[i - 1], heardKeys[j - 1]);
      const up = cost[i - 1][j] + GAP;
      const left = cost[i][j - 1] + GAP;
      let best = diag; let dir = 1;
      if (up < best - EPS) { best = up; dir = 2; }
      if (left < best - EPS) { best = left; dir = 3; }
      cost[i][j] = best;
      back[i][j] = dir;
    }
  }
  const ops = [];
  for (let i = n, j = m; i > 0 || j > 0;) {
    const dir = back[i][j];
    if (dir === 1) { ops.push({ op: lyricKeys[i - 1] === heardKeys[j - 1] ? 'match' : 'sub', l: i - 1, h: j - 1 }); i--; j--; }
    else if (dir === 2) { ops.push({ op: 'unheard', l: i - 1 }); i--; }
    else { ops.push({ op: 'extra', h: j - 1 }); j--; }
  }
  return ops.reverse();
}

function readLyrics(file) {
  if (!existsSync(file)) throw new CliError(`lyrics not found: ${rel(file)}. Write the sung words there, one line per sung line.`);
  const lines = [];
  for (const raw of readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || /^\[[^\]]*\]$/.test(line)) continue;
    const words = line.split(/\s+/).map(clean).filter(Boolean);
    if (words.length) lines.push(words);
  }
  if (!lines.length) throw new CliError(`${rel(file)} has no words.`);
  return lines;
}

function readHeard(file) {
  const j = readJson(file, 'transcription');
  let words; let kind;
  if (Array.isArray(j)) {
    words = j; kind = 'word list [{text,start,end}]';
  } else if (Array.isArray(j?.words)) {
    words = j.words; kind = 'OpenAI/Groq verbose_json';
  } else if (Array.isArray(j?.segments) && j.segments.some((s) => Array.isArray(s.words))) {
    words = j.segments.flatMap((s) => s.words ?? []); kind = 'openai-whisper segments[].words[]';
  } else if (Array.isArray(j?.transcription)) {
    throw new CliError(`${rel(file)} is whisper.cpp JSON. Convert it first: npx hyperframes@0.8.143 transcribe ${rel(file)} --dir <empty folder>, then pass that folder's transcript.json with --heard.`);
  } else {
    throw new CliError(`${rel(file)}: unrecognized transcription format. Expected verbose_json with words[], or [{text,start,end}].`);
  }
  const out = [];
  let skipped = 0;
  for (const w of words) {
    const text = clean(w.word ?? w.text ?? '');
    const start = Number(w.start);
    const end = Number(w.end);
    if (!text || !key(text) || !Number.isFinite(start) || !Number.isFinite(end)) { skipped++; continue; } // music-note symbols, empty tokens
    out.push({ text, start, end });
  }
  if (!out.length) throw new CliError(`${rel(file)} has no timed words.`);
  return { words: out, kind, skipped, duration: Number.isFinite(Number(j?.duration)) ? Number(j.duration) : null };
}

const r2 = (x) => Math.round(x * 100) / 100;
const t = (x) => x.toFixed(2).padStart(6);

main(async () => {
  const dir = resolveExampleDir(positionals[0]);
  const lyricsFile = path.resolve(values.lyrics ?? path.join(dir, 'lyrics.txt'));
  const candidates = [path.join(dir, 'assets', 'whisper_verbose.json'), path.join(dir, 'assets', 'transcript.json')];
  const heardFile = path.resolve(values.heard ?? candidates.find((f) => existsSync(f)) ?? candidates[0]);
  if (!values.heard && !existsSync(heardFile)) {
    throw new CliError(`no transcription found (looked for ${candidates.map(rel).join(' and ')}). Make one with scripts/transcribe-groq.mjs or "npx hyperframes@0.8.143 transcribe assets/song.mp3 --model medium.en", or pass --heard <file>.`);
  }
  const outFile = path.resolve(values.out ?? path.join(dir, 'transcript.json'));
  const eol = eolOption(values.eol);

  const lines = readLyrics(lyricsFile);
  const lyric = lines.flat();
  const lineOf = lines.flatMap((ws, li) => ws.map(() => li));
  const heard = readHeard(heardFile);
  const H = heard.words;

  const ops = align(lyric.map(key), H.map((w) => key(w.text)));

  // Build the transcript, remember where each dropped heard word sat.
  const result = lyric.map((text) => ({ text }));
  const extras = []; // { h, afterLyric }
  let lastLyric = -1;
  for (const o of ops) {
    if (o.op === 'match' || o.op === 'sub') {
      result[o.l].start = H[o.h].start;
      result[o.l].end = H[o.h].end;
      if (o.op === 'sub') result[o.l].heard = H[o.h].text;
      lastLyric = o.l;
    } else if (o.op === 'unheard') {
      result[o.l].interpolated = true;
      lastLyric = o.l;
    } else {
      extras.push({ h: o.h, afterLyric: lastLyric });
    }
  }
  if (result.every((w) => w.interpolated)) {
    throw new CliError('no lyric word matched the transcription. Check that lyrics.txt belongs to this audio.');
  }

  // Unheard runs: spread them over the gap between the neighbours. When the
  // neighbours touch, borrow the inner half of each neighbour.
  const PER_WORD = 0.4;
  const MIN_PER_WORD = 0.12;
  const borrowed = [];
  for (let a = 0; a < result.length; a++) {
    if (!result[a].interpolated) continue;
    let b = a;
    while (b + 1 < result.length && result[b + 1].interpolated) b++;
    const k = b - a + 1;
    const prev = a > 0 ? result[a - 1] : null;
    const next = b + 1 < result.length ? result[b + 1] : null;
    let lo; let hi;
    if (prev && next) {
      lo = prev.end; hi = next.start;
      if (hi - lo < MIN_PER_WORD * k) {
        lo = r2((prev.start + prev.end) / 2);
        hi = r2((next.start + next.end) / 2);
        prev.end = lo; next.start = hi;
        borrowed.push(a - 1, b + 1);
      }
    } else if (next) {
      hi = next.start; lo = Math.max(0, hi - PER_WORD * k);
    } else {
      lo = prev.end; hi = lo + PER_WORD * k;
      if (heard.duration !== null) hi = Math.max(lo, Math.min(hi, heard.duration));
    }
    for (let i = 0; i < k; i++) {
      result[a + i].start = r2(lo + ((hi - lo) * i) / k);
      result[a + i].end = r2(lo + ((hi - lo) * (i + 1)) / k);
    }
    a = b;
  }

  // Key order: text, start, end, heard, interpolated.
  const transcript = result.map((w) => ({
    text: w.text, start: w.start, end: w.end,
    ...(w.heard !== undefined ? { heard: w.heard } : {}),
    ...(w.interpolated ? { interpolated: true } : {}),
  }));

  for (let i = 0; i < transcript.length; i++) {
    const w = transcript[i];
    if (w.end < w.start) console.log(`warning: "${w.text}" (#${i}) ends before it starts (${w.start} -> ${w.end}).`);
    if (i > 0 && w.start < transcript[i - 1].start) console.log(`warning: "${w.text}" (#${i}) starts before the previous word. Check the transcription around ${w.start} s.`);
  }

  // ---- report ----
  const counts = { match: 0, sub: 0, unheard: 0 };
  for (const o of ops) if (o.op in counts) counts[o.op]++;
  console.log(`lyrics: ${rel(lyricsFile)} (${lines.length} lines, ${lyric.length} words)`);
  console.log(`heard:  ${rel(heardFile)} (${H.length} words, ${heard.kind}${heard.skipped ? `, ${heard.skipped} non-word tokens ignored` : ''})`);
  console.log('');

  const sungCol = lines.map((ws) => ws.join(' '));
  const heardCol = lines.map(() => []);
  const lineStart = []; // first lyric index of each line
  lineOf.forEach((li, i) => { if (lineStart[li] === undefined) lineStart[li] = i; });
  let current = 0; // a dropped word is shown in the line of the lyric word before it
  for (const o of ops) {
    if (o.op !== 'extra') current = lineOf[o.l];
    if (o.op === 'match') heardCol[current].push(H[o.h].text);
    else if (o.op === 'sub') heardCol[current].push(`[${H[o.h].text}]`);
    else if (o.op === 'unheard') heardCol[current].push('(-)');
    else heardCol[current].push(`+${H[o.h].text}`);
  }
  const w1 = Math.max(4, ...sungCol.map((s) => s.length));
  console.log(`  #    time  ${'sung'.padEnd(w1)}  heard`);
  lines.forEach((_, li) => {
    console.log(`${String(li + 1).padStart(3)}  ${t(transcript[lineStart[li]].start)}  ${sungCol[li].padEnd(w1)}  ${heardCol[li].join(' ')}`);
  });
  console.log('  [x] heard x instead   (-) not heard   +x heard, not in lyrics');
  console.log('');

  const subs = transcript.map((w, i) => ({ ...w, i })).filter((w) => w.heard !== undefined);
  const unheard = transcript.map((w, i) => ({ ...w, i })).filter((w) => w.interpolated);
  console.log(`corrected (text from lyrics, time from the transcription):${subs.length ? '' : ' none'}`);
  for (const w of subs) console.log(`  ${t(w.start)}  #${String(w.i).padEnd(3)} ${w.text.padEnd(12)} heard "${w.heard}"`);
  console.log(`not heard (time interpolated, listen to the take):${unheard.length ? '' : ' none'}`);
  for (const w of unheard) console.log(`  ${t(w.start)}  #${String(w.i).padEnd(3)} ${w.text.padEnd(12)} placed ${w.start}-${w.end} s`);
  for (const i of [...new Set(borrowed)]) console.log(`  #${i} "${transcript[i].text}" was shortened to make room: ${transcript[i].start}-${transcript[i].end} s`);
  const first = transcript[0];
  const last = transcript[transcript.length - 1];
  console.log(`dropped (heard, not in lyrics):${extras.length ? '' : ' none'}`);
  for (const e of extras) {
    const w = H[e.h];
    const where = w.start >= last.end ? `after the last sung word (${last.end} s)`
      : w.end <= first.start || e.afterLyric < 0 ? `before the first sung word (${first.start} s)`
        : `after #${e.afterLyric} "${transcript[e.afterLyric].text}"`;
    console.log(`  ${t(w.start)}  "${w.text}" ${where}`);
  }
  console.log('');
  console.log(`${lyric.length} words: ${counts.match} matched, ${counts.sub} corrected, ${counts.unheard} interpolated; ${extras.length} heard word(s) dropped`);
  console.log(`singing ${first.start} s -> ${last.end} s (${(last.end - first.start).toFixed(2)} s)`);
  const ranges = lineStart.map((s, li) => `[${s}, ${(lineStart[li + 1] ?? lyric.length) - 1}]`);
  console.log(`LINES (word index range of each lyric line): [${ranges.join(', ')}]`);
  if (counts.match < lyric.length / 2) {
    console.log(`warning: only ${counts.match} of ${lyric.length} lyric words were heard as written. Check that ${rel(lyricsFile)} belongs to this audio, or transcribe again with a larger model.`);
  }

  if (values['dry-run']) {
    console.log('dry run: nothing written');
    return 0;
  }
  const changed = writeText(outFile, JSON.stringify(transcript, null, 1), eol);
  console.log(`${changed ? 'wrote' : 'unchanged'} ${rel(outFile)}`);
  console.log('Next: node scripts/build.mjs to put it into index.html.');
  return 0;
});
