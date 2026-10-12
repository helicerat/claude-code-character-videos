# spin-count

A spin counter over a stock clip of an animated 3D boy hopping and turning in front of a gradient backdrop. Each spin gets a giant number that flies into one of ten counter pills, plus a sticker, while the title pulses on every second beat of the music. An outro card asks how many you counted.

| | |
|---|---|
| Video | [spin-count.mp4](https://github.com/helicerat/cuecut/releases/download/v0.1.0/spin-count.mp4), 21.5 s, 1080x1920, 30 fps, with sound |
| Source | a Pixabay clip labelled AI generated, played at 0.85x, and a Pixabay music track |
| Timed by | spin marks read from frames, and a beat grid |
| Pipeline steps | 5 to 7 (timings, edit, render); steps 2 to 4 are replaced by stock files |

## Rebuild

You need Node 22 or newer, ffmpeg and ffprobe on PATH, and network access on the first run (npm, the Pixabay CDN, Google Fonts, the Chrome download, and jsDelivr if `examples/handwash-song/assets/gsap.min.js` is not there yet).

One-time setup, from the repo root:

```bash
export HYPERFRAMES_NO_TELEMETRY=1          # PowerShell: $env:HYPERFRAMES_NO_TELEMETRY = "1"
npx hyperframes@0.8.143 browser ensure     # downloads Chrome Headless Shell
```

Then:

```bash
npm run fetch:spin    # download the clip, the music and GSAP, make boy.mp4 and music_cut.mp3
npm run build:spin    # copy build/index.template.htm to index.html
npm run lint:spin     # expect 0 errors, 1 warning
npm run render:spin   # render, then fix the right edge -> examples/spin-count/renders/spin.mp4
```

The fetch takes about a minute, most of it the `boy.mp4` encode. The render and the edge fix take about two minutes. The one lint warning, `nested_structure_needs_subcomposition`, is harmless for a single-file composition.

- **The downloads.** The fetch script downloads two files from Pixabay, the 2160x3840 clip (52,467,610 bytes) and the music track (4,026,618 bytes), and checks the size and sha256 of each. To download them by hand, open the [clip's page](https://pixabay.com/videos/boy-child-kid-childhood-dancing-313047/) and the [track's page](https://pixabay.com/music/happy-childrens-tunes-funny-dancing-kids-158822/), download the clip at 2160x3840 and the track, and save them as `assets/source/313047_large.mp4` and `assets/source/funny-dancing-kids-158822.mp3`. The script then uses them. Behind a proxy, set `HTTPS_PROXY` and `NODE_USE_ENV_PROXY=1`.
- **The right edge.** `render:spin` runs `scripts/fix-right-edge.mjs` after HyperFrames, which repairs the 8 px black strip that ffmpeg 8.1.2 leaves at the right edge ([details](../../docs/08-render-and-qa.md#5-fix-the-right-edge)).
- **Edit the template, not `index.html`.** `build.mjs` copies the template unchanged: it has no `/*TRANSCRIPT*/[]` placeholder and the folder has no `transcript.json`. HyperFrames Studio (`npm run preview:spin`) writes `data-hf-id` attributes into `index.html`; `npm run build:spin` puts it back.

<details>
<summary>The commands behind the npm scripts</summary>

```bash
node scripts/fetch-spin-assets.mjs examples/spin-count
node scripts/build.mjs examples/spin-count
npx hyperframes@0.8.143 lint examples/spin-count
npx hyperframes@0.8.143 render examples/spin-count -q delivery -o examples/spin-count/renders/spin.raw.mp4
node scripts/fix-right-edge.mjs examples/spin-count/renders/spin.raw.mp4 examples/spin-count/renders/spin.mp4
```

The two ffmpeg commands the fetch script runs:

```bash
# from examples/spin-count: picture only, 1080x1920, slowed to 0.85x, 30 fps -> assets/boy.mp4 (19.667 s)
ffmpeg -y -i assets/source/313047_large.mp4 -an \
  -vf "scale=1080:1920:flags=lanczos,setpts=PTS/0.85,fps=30" \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p assets/boy.mp4

# the first 22 s of the track -> assets/music_cut.mp3
ffmpeg -y -i assets/source/funny-dancing-kids-158822.mp3 -vn -t 22 \
  -ac 2 -ar 44100 -c:a libmp3lame -q:a 2 assets/music_cut.mp3
```

</details>

## How the timings were made

There are no lyrics and no transcript. The times come from two places:

- **Spin marks.** Ten moments with his back to the camera, read by eye from frames of the clip, each counted as one spin ([method](../../docs/06-word-timing.md#timings-without-words-beats-and-visual-marks)). They are in [`spins.json`](spins.json) and, as the same numbers, in the `SPINS` constant of the template. A mark `t` is a time in `boy.mp4`: the source time divided by 0.85.
- **A beat grid.** `npx hyperframes@0.8.143 beats` found 69 beats in the music, one every 0.3191 s on average (188 bpm). The template keeps the grid as two constants, `BEAT0 = 0.22` and `BEAT = 0.3185`. The raw output is committed as [`beats/assets/music_cut.mp3.json`](beats/assets/music_cut.mp3.json).

To redo the beat grid, run `npx hyperframes@0.8.143 beats examples/spin-count`. It analyzes the composition's music track (the only `<audio>`, marked `data-timeline-role="music"`), prints `Wrote 69 beats → beats/assets/music_cut.mp3.json (bpm 188, high)` and leaves `index.html` and the template alone.

## What happens on screen

| Time (s) | Event |
|---|---|
| 0 to 0.4 | a dark shade fades in behind the top of the frame |
| 0.1 to 0.9 | ten empty pills pop in, 0.05 s apart |
| 0.35 to 0.94 | "Count the spins!" pops up word by word; the subline "he doesn't stop for 20 seconds" follows at 0.9 |
| 0.22, then every 0.637 s until 19.33 | the title pulses to 104.5 percent, on every second beat of the grid (31 pulses) |
| `t` - 0.12 | the next number pops over him in 400 px type, from scale 0 and -12 degrees |
| `t` - 0.05 to `t` + 0.75 | a sticker for this spin pops in and out at the bottom: SPIN!, AGAIN!, WHOOSH!, SPIN!, NO WAY, SPIN!, KEEP GOING, SPIN!, ALMOST, TEN! |
| `t` + 0.22 to `t` + 0.64 | the number flies into its pill and shrinks to 17 percent |
| `t` + 0.64 | the pill turns yellow and bumps to 130 percent and back |
| 2.24, 4.94, 7.18, 8.71, 10.35, 11.88, 13.88, 16.47, 17.76, 19.06 | the ten values of `t` |
| 19.36 | title and subline fade out |
| 19.51 | the outro card fades in over the footage, which ends at 19.66 |
| 19.71 to 20.26 | "10", "spins in 20 seconds" and "how many did you count?" come in; the pills bounce one by one from 20.16 |
| 21.5 | end |

A progress bar fills across the whole 21.5 s, and the credit line stays at the bottom until the outro card covers it.

## Files

| Path | In git | What it is |
|---|---|---|
| `build/index.template.htm` | yes | the composition, 132 lines; the file to edit |
| `index.html` | yes | copied from the template by `scripts/build.mjs`; do not edit |
| `spins.json` | yes | the ten spin marks (source time, time in `boy.mp4`, notes on the two that land mid-turn) and the two back views without a mark |
| `beats/assets/music_cut.mp3.json` | yes | raw output of `npx hyperframes@0.8.143 beats`: 69 beats with a strength each |
| `assets/source/313047_large.mp4`, `assets/source/funny-dancing-kids-158822.mp3` | no | the Pixabay downloads |
| `assets/boy.mp4`, `assets/music_cut.mp3`, `assets/gsap.min.js` | no | made or copied by `scripts/fetch-spin-assets.mjs` |
| `renders/`, `snapshots/` | no | `renders/spin.raw.mp4` from HyperFrames, `renders/spin.mp4` after the edge fix |
| `CREDITS.md` | yes | sources, license, what may be shared |

<details>
<summary>Media specs</summary>

| | |
|---|---|
| Source clip | [Pixabay video 313047](https://pixabay.com/videos/boy-child-kid-childhood-dancing-313047/), "Boy, Child, Kid", uploaded by TonyDias7, labelled AI generated: H.264 2160x3840, 24 fps, 401 frames, 16.708 s, no audio, 52,467,610 bytes |
| `assets/boy.mp4` | scaled to 1080x1920 (lanczos), slowed to 0.85x (`setpts=PTS/0.85`), 30 fps, H.264 CRF 16, no audio: 19.667 s, 590 frames, 36,389,330 bytes |
| Source music | [Pixabay music 158822](https://pixabay.com/music/happy-childrens-tunes-funny-dancing-kids-158822/), "Funny Dancing Kids" by AudioCoffee: MP3 256 kbit/s, 44.1 kHz stereo, 125.832 s, 4,026,618 bytes |
| `assets/music_cut.mp3` | the first 22 s, MP3 VBR (`-q:a 2`), 44.1 kHz stereo, 602,674 bytes |
| Beat grid | 69 beats from 0.224 s to 21.926 s, mean spacing 0.3191 s (188 bpm) |
| Composition | 1080x1920, 30 fps, `data-duration` 21.5 s, 645 frames, GSAP 3.14.2; the footage element runs 19.66 s |
| Raw render | H.264 1080x1920 30 fps plus AAC 48 kHz stereo, 21.500 s, 645 frames; an 8 px black strip at x 1072 to 1079 in every frame |
| Edge fix | `--mode auto` picks smear: the gradient and the boy reach the edge, where a flat fill would show a seam |
| Final file | `spin.mp4`: 645 frames, 21.500 s, audio copied, about 33 MB (CRF 16 on a grainy 4K source makes a large file) |
| Preview | `docs/img/demo-spin.gif`: 1.0 to 8.4 s of the render (title, spins 1 to 3), 360x640, 12 fps, 89 frames, 128 colors |

</details>

## Known issues

- **`check` fails on contrast.** `npx hyperframes@0.8.143 check examples/spin-count` flags the ten unlit pill numbers (1.89:1 to 1.95:1; grey on white until counted, by design) and the credit line (2.91:1). It also reports the giant numbers overlapping the title as they fly past, and the credit line hidden under the outro card. Runtime and motion pass.
- **Ten is a judgment call.** Two of the ten marks (1 and 4) land on a profile frame a few frames away from the back view. A second pass at 4 and then 12 frames per second of the source found two more moments with his back to the camera that have no mark, at about 1.35 s and 13.3 s in the source (1.59 s and 15.65 s in `boy.mp4`). Each is separated from the nearest marked back view by frames that show his face, so by the rule in the template comment the clip has 12. The outro's question, "how many did you count?", stands. `spins.json` lists the two under `unmarked`.
- **The beat grid drifts a little.** The template's beat step, 0.3185 s, is 0.0006 s shorter than the beat file's mean spacing, so the title pulses run ahead of the beat by up to 0.043 s, about one frame.
- **The track is registered with Content ID.** A video with this track uploaded to a platform that runs Content ID, such as YouTube, may get a claim.
- **`boy.mp4` is 1080 wide**, not a multiple of 16, against the rule in [docs/08-render-and-qa.md](../../docs/08-render-and-qa.md#5-fix-the-right-edge). HyperFrames' frame extraction blacks out its columns 1072 to 1079, but the footage fills the frame, so that band lands on the render's own 8 px strip and the edge fix covers both. For new full-frame footage, encode 1088 wide.
- `boy.mp4` keeps x264's default keyframe placement (0.83 to 1.0 s apart in this clip, from scene-cut detection) and a timecode track (`tmcd`) from the source. Neither causes a warning in lint or the render log.

## Make your own

The same edit works for any clip with a repeated, countable move: jumps, claps, kicks, a ball bounce.

1. Mark the moments ([docs/06-word-timing.md](../../docs/06-word-timing.md#timings-without-words-beats-and-visual-marks)).
2. Put them in `SPINS` and `spins.json`.
3. Change the outro number, the stickers and the colors to fit.
4. Build, lint and snapshot.

How the layers work: [docs/07-the-edit.md](../../docs/07-the-edit.md#the-spin-count-edit).

## Credits

Footage: "Boy, Child, Kid" by TonyDias7. Music: "Funny Dancing Kids" by AudioCoffee. Both from Pixabay under the Pixabay Content License. The credit the music's uploader asks for, and what may be shared: [CREDITS.md](CREDITS.md).
