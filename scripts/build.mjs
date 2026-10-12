#!/usr/bin/env node
// build/index.template.htm + transcript.json (+ marks.json) -> index.html
// HyperFrames renders index.html as is, so the word timings are inlined into it.
// A /*MARKS*/[] placeholder is filled from marks.json the same way (the
// starter project from scripts/new-project.mjs uses it).
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
const MARKS_PLACEHOLDER = '/*MARKS*/[]';

const HELP = `
Usage: node scripts/build.mjs [exampleDir] [options]

Replaces ${PLACEHOLDER} in build/index.template.htm with the words from
transcript.json (text, start, end only) and writes index.html.
Edit the template, never index.html: the next build overwrites it.

A template with no ${PLACEHOLDER} placeholder, in an example folder with no
transcript.json, is copied to index.html unchanged. examples/spin-count works
this way: its times are spin marks and a beat grid written into the template.

A ${MARKS_PLACEHOLDER} placeholder is replaced with the "marks" array of
marks.json ({ t, label } per mark, t in seconds of the composition). A
template without it ignores marks.json.

Arguments:
  exampleDir           example folder (default: examples/handwash-song)

Options:
  --template <file>    default: <exampleDir>/build/index.template.htm
  --transcript <file>  default: <exampleDir>/transcript.json
  --marks <file>       default: <exampleDir>/marks.json
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
    marks: { type: 'string' },
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
  let template = readFileSync(templateFile, 'utf8');
  const marksNote = [];
  const mAt = template.indexOf(MARKS_PLACEHOLDER);
  if (mAt >= 0) {
    if (template.indexOf(MARKS_PLACEHOLDER, mAt + 1) >= 0) throw new CliError(`${rel(templateFile)} has ${MARKS_PLACEHOLDER} more than once.`);
    const marksFile = path.resolve(values.marks ?? path.join(dir, 'marks.json'));
    const data = readJson(marksFile, 'marks');
    const list = Array.isArray(data) ? data : data?.marks;
    if (!Array.isArray(list) || list.length === 0) throw new CliError(`${rel(marksFile)} needs a non-empty "marks" array of { t, label }.`);
    const marks = list.map((m, i) => {
      if (!Number.isFinite(m?.t) || m.t < 0 || (m.label !== undefined && typeof m.label !== 'string')) {
        throw new CliError(`${rel(marksFile)} mark #${i} needs t (seconds, a number >= 0) and an optional label (string): ${JSON.stringify(m)}`);
      }
      return m.label === undefined ? { t: m.t } : { t: m.t, label: m.label };
    });
    for (let i = 1; i < marks.length; i++) {
      if (marks[i].t < marks[i - 1].t) throw new CliError(`${rel(marksFile)} marks must be in time order: #${i} (${marks[i].t} s) comes before #${i - 1} (${marks[i - 1].t} s).`);
    }
    template = template.slice(0, mAt) + inlineJson(marks) + template.slice(mAt + MARKS_PLACEHOLDER.length);
    marksNote.push(`${marks.length} marks`);
  }
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
    return emit(template, marksNote.length ? marksNote[0] : `no ${PLACEHOLDER} placeholder and no transcript.json, template copied as is`);
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
  const summary = values.check ? `${words.length} words` : `${words.length} words, ${words[0].start} s -> ${words[words.length - 1].end} s`;
  const code = emit(html, [summary, ...marksNote].join(', '));
  if (flagged && !values.check) console.log(`note: ${flagged} word(s) in transcript.json were not heard and have interpolated times. See the align-lyrics report.`);
  return code;
});
