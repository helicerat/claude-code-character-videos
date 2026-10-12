#!/usr/bin/env node
// Scaffold a project folder from templates/starter: an edit that renders as
// is, with placeholder footage and silence made by ffmpeg, so a new user can
// lint, snapshot and render before they have any media of their own.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { CliError, REPO_ROOT, cli, download, ffmpeg, main, proxyPreflightNote, rel, run, sha256File, writeText } from './lib.mjs';

const TEMPLATE_DIR = path.join(REPO_ROOT, 'templates', 'starter');
const GSAP = {
  url: 'https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js',
  sha256: 'c174bfce53a729418d57a8ad8625e7247c793a22fef8e2851e3cfa3de9cd8280',
};
const USER_AGENT = `claude-code-character-videos-new/0.1 (https://github.com/helicerat/claude-code-character-videos) node/${process.versions.node}`;
const DURATION = 12;

const HELP = `
Usage: node scripts/new-project.mjs <name> [options]
       npm run new -- <name> [options]

Copies templates/starter to projects/<name> and makes it renderable:

  build/index.template.htm   the edit (an intro, one beat per mark, an outro)
  marks.json                 four placeholder marks, inlined by scripts/build.mjs
  assets/footage.mp4         ${DURATION} s placeholder, 1088x1920, 30 fps, a keyframe every second
  assets/music.mp3           ${DURATION} s of silence, 48 kHz stereo
  assets/gsap.min.js         GSAP 3.14.2 from jsDelivr, checked by sha256
  index.html                 built from the template

Media and gsap.min.js are gitignored. Nothing in the folder needs a license
beyond this repo's MIT terms until you add your own media.

Arguments:
  name                 lower case letters, digits and hyphens, e.g. my-first-short

Options:
  --dir <folder>       where to create it (default: projects/<name>)
  --no-media           skip ffmpeg and the GSAP download (offline, tests)
  --force              replace an existing folder
  -h, --help           show this help
`;

const { values, positionals } = cli({
  help: HELP,
  options: {
    dir: { type: 'string' },
    'no-media': { type: 'boolean' },
    force: { type: 'boolean' },
  },
});

// A soft moving gradient with a faint grid, so motion and the 9:16 frame are visible in a snapshot.
const FOOTAGE_ARGS = (out) => [
  '-y', '-f', 'lavfi',
  '-i', `gradients=s=1088x1920:r=30:d=${DURATION}:speed=0.02:c0=0x2d2470:c1=0x14122b:c2=0x1f6f78:nb_colors=3:seed=7`,
  '-vf', 'drawgrid=w=136:h=136:t=2:c=white@0.06,format=yuv420p',
  '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-g', '30', '-keyint_min', '30', '-sc_threshold', '0',
  out,
];
const MUSIC_ARGS = (out) => [
  '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', String(DURATION),
  '-c:a', 'libmp3lame', '-b:a', '128k',
  out,
];

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? filesUnder(p) : [p];
  });
}

main(async () => {
  const name = positionals[0];
  if (!name) throw new CliError('give the project a name: npm run new -- my-first-short');
  if (positionals.length > 1) throw new CliError(`one name only, got: ${positionals.join(' ')}`);
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name)) throw new CliError(`"${name}" is not a valid name: use lower case letters, digits and hyphens, starting with a letter or digit.`);

  const dir = path.resolve(values.dir ?? path.join(REPO_ROOT, 'projects', name));
  if (existsSync(dir) && readdirSync(dir).length > 0) {
    if (!values.force) throw new CliError(`${rel(dir)} already exists and is not empty. Pick another name or pass --force to replace it.`);
    if (!statSync(dir).isDirectory()) throw new CliError(`${rel(dir)} is not a folder.`);
    rmSync(dir, { recursive: true, force: true });
  }

  // Copy the template, filling in the name and the path from the repo root.
  mkdirSync(dir, { recursive: true });
  cpSync(TEMPLATE_DIR, dir, { recursive: true });
  const dirFromRoot = path.relative(REPO_ROOT, dir).split(path.sep).join('/') || '.';
  const rootFromDir = (path.relative(dir, REPO_ROOT).split(path.sep).join('/') || '.') + '/';
  const readme = path.join(dir, 'README.md');
  writeText(readme, readFileSync(readme, 'utf8')
    .replaceAll('{{NAME}}', name)
    .replaceAll('{{DIR}}', dirFromRoot)
    .replaceAll('](../../', `](${rootFromDir}`), 'lf');
  mkdirSync(path.join(dir, 'assets'), { recursive: true });
  console.log(`created ${rel(dir)}/ from templates/starter`);

  if (values['no-media']) {
    console.log('skip media and GSAP (--no-media)');
  } else {
    const assets = path.join(dir, 'assets');
    await ffmpeg(FOOTAGE_ARGS(path.join(assets, 'footage.mp4')));
    console.log(`  made ${rel(path.join(assets, 'footage.mp4'))} (${DURATION} s placeholder, 1088x1920)`);
    await ffmpeg(MUSIC_ARGS(path.join(assets, 'music.mp3')));
    console.log(`  made ${rel(path.join(assets, 'music.mp3'))} (${DURATION} s of silence)`);

    const gsapFile = path.join(assets, 'gsap.min.js');
    const local = filesUnder(path.join(REPO_ROOT, 'examples'))
      .find((f) => path.basename(f) === 'gsap.min.js');
    if (local && (await sha256File(local)) === GSAP.sha256) {
      cpSync(local, gsapFile);
      console.log(`  copied GSAP 3.14.2 from ${rel(local)}`);
    } else {
      const note = proxyPreflightNote();
      if (note) console.log(note);
      await download(GSAP.url, gsapFile, { userAgent: USER_AGENT });
      const hash = await sha256File(gsapFile);
      if (hash !== GSAP.sha256) throw new CliError(`${rel(gsapFile)} has sha256 ${hash}, expected ${GSAP.sha256}. Delete the folder and run again.`);
      console.log('  downloaded GSAP 3.14.2, sha256 ok');
    }
  }

  const build = await run(process.execPath, [path.join(REPO_ROOT, 'scripts', 'build.mjs'), dir]);
  if (build.code !== 0) throw new CliError(`build failed:\n${build.stderr.trim() || build.stdout.trim()}`);
  console.log(`  ${build.stdout.trim()}`);

  console.log(`
Next, from the repo root:
  export HYPERFRAMES_NO_TELEMETRY=1
  npx hyperframes@0.8.143 lint ${dirFromRoot}
  npx hyperframes@0.8.143 snapshot ${dirFromRoot} --at 0,0.05,2,4,6,8,11 --describe false
  npx hyperframes@0.8.143 preview ${dirFromRoot}

Then read ${dirFromRoot}/README.md to swap in your own footage and marks.`);
});
