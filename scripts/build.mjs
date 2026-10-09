#!/usr/bin/env node
// build/index.template.htm + transcript.json -> index.html
// HyperFrames renders index.html as is, so the word timings are inlined into it.
// A template without the transcript placeholder, in a folder without
// transcript.json, is copied as is (examples/spin-count: its times are spin
// marks and a beat grid written into the template).
// The template ends in .htm, not .html: HyperFrames Studio writes data-hf-id
// attributes into every *.html file of a project folder it previews, and
// `hyperframes transcribe` patches transcripts into them. Neither touches .htm.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { CliError, cli, detectEol, eolOption, main, readJson, rel, resolveExampleDir, writeText } from './lib.mjs';

const PLACEHOLDER = '/*TRANSCRIPT*/[]';

const HELP = `
Usage: node scripts/build.mjs [exampleDir] [options]

Replaces ${PLACEHOLDER} in build/index.template.htm with the words from
transcript.json (text, start, end only) and writes index.html.
Edit the template, never index.html: the next build overwrites it.

A template with no ${PLACEHOLDER} placeholder, in an example folder with no
transcript.json, is copied to index.html unchanged. examples/spin-count works
this way: its times are spin marks and a beat grid written into the template.

Arguments:
  exampleDir           example folder (default: examples/handwash-song)

Options:
  --template <file>    default: <exampleDir>/build/index.template.htm
  --transcript <file>  default: <exampleDir>/transcript.json
  --out <file>         default: <exampleDir>/index.html
  --check              write nothing; exit 1 if index.html is out of date
  --eol <mode>         auto (keep the existing file's line endings), lf or crlf
  -h, --help           show this help
`;

const { values, positionals } = cli({
  help: HELP,
  options: {
    template: { type: 'string' },
    transcript: { type: 'string' },
    out: { type: 'string' },
    check: { type: 'boolean' },
    eol: { type: 'string', default: 'auto' },
  },
});

// One line, the same spacing as Python's json.dumps: [{"text": "Wash", "start": 2.98, "end": 3.14}, ...]
// "<" is escaped so a word can never close the <script> tag.
function inlineJson(words) {
  const obj = (w) => `{${Object.entries(w).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ')}}`;
  return `[${words.map(obj).join(', ')}]`.replace(/</g, '\\u003c');
}

main(async () => {
  const dir = resolveExampleDir(positionals[0]);
  const templateFile = path.resolve(values.template ?? path.join(dir, 'build', 'index.template.htm'));
  const transcriptFile = path.resolve(values.transcript ?? path.join(dir, 'transcript.json'));
  const outFile = path.resolve(values.out ?? path.join(dir, 'index.html'));
  const eol = eolOption(values.eol);

  if (!existsSync(templateFile)) {
    const legacy = path.join(dir, 'build', 'index.template.html');
    const hint = !values.template && existsSync(legacy)
      ? ` Found ${rel(legacy)}: rename it to index.template.htm. HyperFrames Studio rewrites every *.html file in the project folder when it previews.`
      : '';
    throw new CliError(`template not found: ${rel(templateFile)}.${hint}`);
  }
  const template = readFileSync(templateFile, 'utf8');
  const at = template.indexOf(PLACEHOLDER);

  // Write (or, with --check, compare) index.html.
  const emit = (html, summary) => {
    if (values.check) {
      const sep = eol === 'crlf' ? '\r\n' : eol === 'lf' ? '\n' : detectEol(outFile);
      const expected = html.replace(/\r\n/g, '\n').replace(/\n/g, sep);
      const current = existsSync(outFile) ? readFileSync(outFile, 'utf8') : null;
      if (current === expected) {
        console.log(`${rel(outFile)} is up to date (${summary}).`);
        return 0;
      }
      console.log(`${rel(outFile)} is out of date. Run: node scripts/build.mjs ${rel(dir)}`);
      return 1;
    }
    const changed = writeText(outFile, html, eol);
    console.log(`${changed ? 'wrote' : 'unchanged'} ${rel(outFile)}: ${summary}`);
    return 0;
  };

  if (at < 0 && !values.transcript && !existsSync(transcriptFile)) {
    return emit(template, `no ${PLACEHOLDER} placeholder and no transcript.json, template copied as is`);
  }
  if (at < 0) throw new CliError(`${rel(templateFile)} has no ${PLACEHOLDER} placeholder. Write it where the word array goes: const TRANSCRIPT = ${PLACEHOLDER};`);
  if (template.indexOf(PLACEHOLDER, at + 1) >= 0) throw new CliError(`${rel(templateFile)} has ${PLACEHOLDER} more than once.`);

  const raw = readJson(transcriptFile, 'transcript');
  if (!Array.isArray(raw) || raw.length === 0) throw new CliError(`${rel(transcriptFile)} must be a non-empty array of {text, start, end}. Run scripts/align-lyrics.mjs.`);
  const words = raw.map((w, i) => {
    if (typeof w?.text !== 'string' || !Number.isFinite(w.start) || !Number.isFinite(w.end)) {
      throw new CliError(`${rel(transcriptFile)} word #${i} needs text (string), start and end (numbers): ${JSON.stringify(w)}`);
    }
    return { text: w.text, start: w.start, end: w.end };
  });
  const flagged = raw.filter((w) => w.interpolated).length;

  const html = template.slice(0, at) + inlineJson(words) + template.slice(at + PLACEHOLDER.length);
  const code = emit(html, values.check ? `${words.length} words` : `${words.length} words, ${words[0].start} s -> ${words[words.length - 1].end} s`);
  if (flagged && !values.check) console.log(`note: ${flagged} word(s) in transcript.json were not heard and have interpolated times. See the align-lyrics report.`);
  return code;
});
