#!/usr/bin/env node
// Optional: word timestamps from Groq's hosted Whisper (whisper-large-v3).
// The example already ships the result in assets/whisper_verbose.json.

import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { CliError, DEFAULT_EXAMPLE, cli, main, proxyHint, rel, writeText } from './lib.mjs';

const ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions';

const HELP = `
Usage: node scripts/transcribe-groq.mjs [audio] [out] [--force]

Sends an audio file to Groq's speech-to-text API and saves the raw answer
with word-level timestamps (OpenAI-compatible verbose_json).

Arguments:
  audio          audio file (default: examples/handwash-song/assets/song.mp3)
  out            output JSON (default: whisper_verbose.json next to the audio)

Options:
  --model <id>       default: whisper-large-v3
  --language <code>  default: en
  --force            overwrite an existing output file
  --endpoint <url>   another OpenAI-compatible transcription endpoint
                     (default: ${ENDPOINT})
  -h, --help         show this help

The API key is read from the GROQ_API_KEY environment variable and is never
printed. Create one at https://console.groq.com/keys

  bash/zsh:    GROQ_API_KEY=... node scripts/transcribe-groq.mjs
  PowerShell:  $env:GROQ_API_KEY="..."; node scripts/transcribe-groq.mjs

Whisper mishears sung lyrics. Do not use its text directly: run
scripts/align-lyrics.mjs next, which keeps the timings and takes the words
from lyrics.txt.

This step is optional. The free local route is
  npx hyperframes@0.8.143 transcribe assets/song.mp3 --model medium.en
which writes assets/transcript.json next to the audio; align-lyrics.mjs
picks it up when there is no whisper_verbose.json. Do not pass --dir with
the example folder: HyperFrames writes transcript.json there (replacing the
corrected one) and rewrites "const TRANSCRIPT = [...]" in every .html file
under it with the raw words.
`;

const { values, positionals } = cli({
  help: HELP,
  options: {
    model: { type: 'string', default: 'whisper-large-v3' },
    language: { type: 'string', default: 'en' },
    endpoint: { type: 'string', default: ENDPOINT },
    force: { type: 'boolean' },
  },
});

const MIME = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp4': 'audio/mp4', '.ogg': 'audio/ogg', '.webm': 'audio/webm', '.flac': 'audio/flac' };

main(async () => {
  const audio = path.resolve(positionals[0] ?? path.join(DEFAULT_EXAMPLE, 'assets', 'song.mp3'));
  const out = path.resolve(positionals[1] ?? path.join(path.dirname(audio), 'whisper_verbose.json'));
  if (!existsSync(audio)) throw new CliError(`audio not found: ${rel(audio)}. Run npm run fetch first.`);
  if (existsSync(out) && !values.force) {
    throw new CliError(`${rel(out)} already exists. Pass --force to overwrite it, or give another output path.`);
  }
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new CliError('GROQ_API_KEY is not set. Create a key at https://console.groq.com/keys and set it in this terminal (see --help). This step is optional: the example already has assets/whisper_verbose.json.');
  }

  const size = statSync(audio).size;
  if (size > 25 * 1024 * 1024) {
    console.log(`note: ${rel(audio)} is ${(size / 1048576).toFixed(1)} MB. Hosted Whisper APIs cap uploads (often at 25 MB); cut or re-encode the audio if the request is refused.`);
  }

  const form = new FormData();
  const type = MIME[path.extname(audio).toLowerCase()] ?? 'application/octet-stream';
  form.append('file', new Blob([readFileSync(audio)], { type }), path.basename(audio));
  form.append('model', values.model);
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  form.append('language', values.language);

  console.log(`POST ${values.endpoint}  model=${values.model} language=${values.language} file=${rel(audio)}`);
  const t0 = Date.now();
  let res;
  try {
    res = await fetch(values.endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(300_000),
    });
  } catch (e) {
    const why = e.name === 'TimeoutError' ? 'no answer in 300 s' : (e.cause?.code ?? e.cause?.message ?? e.message);
    throw new CliError(`request failed (${why}).\n${proxyHint()}`);
  }
  const body = await res.text();
  if (!res.ok) {
    let msg = body;
    try { msg = JSON.parse(body)?.error?.message ?? body; } catch { /* not JSON */ }
    msg = String(msg).replaceAll(key, '<GROQ_API_KEY>').slice(0, 600);
    const hint = res.status === 401 ? '\nThe key was rejected. Check GROQ_API_KEY.'
      : res.status === 413 ? '\nThe file is too large for the API. Cut or re-encode it.'
        : res.status === 429 ? '\nRate limited. Wait a minute and run again.' : '';
    throw new CliError(`API answered HTTP ${res.status}: ${msg}${hint}`);
  }
  let json;
  try { json = JSON.parse(body); } catch { throw new CliError('API answered with something that is not JSON.'); }
  if (!Array.isArray(json.words) || json.words.length === 0) {
    throw new CliError('the answer has no words[] array. The endpoint must support response_format=verbose_json with timestamp_granularities[]=word.');
  }

  writeText(out, JSON.stringify(json, null, 1) + '\n', 'lf');
  const w = json.words;
  console.log(`  ${w.length} words, ${w[0].start} s -> ${w[w.length - 1].end} s, audio ${json.duration ?? '?'} s, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  console.log(`  text: ${String(json.text ?? '').trim().slice(0, 300)}`);
  console.log(`wrote ${rel(out)}`);
  console.log('Next: node scripts/align-lyrics.mjs <exampleDir> to put the real lyrics on these timings.');
});
