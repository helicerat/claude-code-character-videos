#!/usr/bin/env node
// Check every input and output before trusting it: duration, fps, frames, sample rate, channels.

import { CliError, cli, main, probeReport } from './lib.mjs';

const HELP = `
Usage: node scripts/probe.mjs <files...> [--tolerance 0.1] [--strict]

Prints duration, fps, frame count, sample rate and channels of each file
(via ffprobe) and warns when:
  - audio is not 44100 or 48000 Hz
  - the video and audio streams of one file differ in length
  - the files differ in length from each other
by more than the tolerance (default 0.1 s).

Run it on the footage, the song and the render. Audio labelled with the wrong
sample rate plays at the wrong speed and drifts off the picture; a duration
mismatch is how it shows up.

Options:
  --tolerance <s>  allowed duration difference in seconds (default: 0.1)
  --strict         exit 1 when there is any warning
  -h, --help       show this help

Example:
  node scripts/probe.mjs examples/handwash-song/assets/cat.mp4 examples/handwash-song/assets/song.mp3
`;

const { values, positionals } = cli({
  help: HELP,
  options: { tolerance: { type: 'string', default: '0.1' }, strict: { type: 'boolean' } },
});

main(async () => {
  if (!positionals.length) throw new CliError('give at least one media file. Run with --help for usage.');
  const tolerance = Number(values.tolerance);
  if (!(tolerance >= 0)) throw new CliError(`--tolerance must be a number of seconds (got "${values.tolerance}").`);
  const { warnings } = await probeReport(positionals, { tolerance });
  if (warnings.length) {
    console.log('');
    for (const w of warnings) console.log(`warning: ${w}`);
  }
  return warnings.length && values.strict ? 1 : 0;
});
