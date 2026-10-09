# spin-count

A 21.5 second vertical video (1080x1920, 30 fps). The footage is a Pixabay clip of an animated 3D boy hopping and turning in front of a gradient backdrop, played at 0.85x speed; the clip's Pixabay page labels it AI generated. The music is a Pixabay track. On top of both sits an edit written as HTML + GSAP in one file that counts his spins: ten counter pills, a giant number for each spin that flies into its pill, a sticker for each spin, a title that pulses on every second beat, and an outro card.

This was the repo's hero example until [`wing-it`](../wing-it/README.md) took its place; its GIF is in the main README under wing-it. Unlike [`handwash-song`](../handwash-song/README.md) it has no lyrics and no transcript. Its times come from two places:

- **Spin marks.** Ten moments with his back to the camera, read by eye from frames of the clip, each counted as one spin (a later check found two more; see Known issues). They are in [`spins.json`](spins.json) and, as the same numbers, in the `SPINS` constant of the template.
- **A beat grid.** `npx hyperframes@0.8.143 beats` found 69 beats in the music, one every 0.3191 s on average (188 bpm). The template keeps the grid as two constants, `BEAT0 = 0.22` and `BEAT = 0.3185`, and the raw output is committed as [`beats/assets/music_cut.mp3.json`](beats/assets/music_cut.mp3.json).

Steps 2 to 4 of the pipeline (character, song, animation) are skipped: the clip and the music are existing stock files. Steps 5 to 7 (timings, the edit, the render) run in full.

## Reproduce

You need Node 22 or newer, ffmpeg and ffprobe on PATH, and network access on the first run (npm for HyperFrames, the Pixabay CDN, Google Fonts, the Chrome download, and jsDelivr if `examples/handwash-song/assets/gsap.min.js` is not there yet).

One-time setup, from the repo root:

```bash
export HYPERFRAMES_NO_TELEMETRY=1          # PowerShell: $env:HYPERFRAMES_NO_TELEMETRY = "1"
npx hyperframes@0.8.143 browser ensure     # downloads Chrome Headless Shell
```

Then five commands (the same as `npm run fetch:spin`, `build:spin`, `lint:spin` and `render:spin`):

```bash
node scripts/fetch-spin-assets.mjs examples/spin-count   # download the clip, the music and GSAP, make boy.mp4 + music_cut.mp3, probe
node scripts/build.mjs examples/spin-count               # copies build/index.template.htm to index.html
npx hyperframes@0.8.143 lint examples/spin-count         # expect 0 errors, 1 warning
npx hyperframes@0.8.143 render examples/spin-count -q delivery -o examples/spin-count/renders/spin.raw.mp4
node scripts/fix-right-edge.mjs examples/spin-count/renders/spin.raw.mp4 examples/spin-count/renders/spin.mp4
```

The fetch script downloads two files from Pixabay: the 2160x3840 clip (52,467,610 bytes) and the music track (4,026,618 bytes). It checks the size and sha256 of each, then runs the two ffmpeg commands below. If you would rather download by hand, open the [clip's page](https://pixabay.com/videos/boy-child-kid-childhood-dancing-313047/) and the [track's page](https://pixabay.com/music/happy-childrens-tunes-funny-dancing-kids-158822/), download the clip at 2160x3840 and the track, and save them as `assets/source/313047_large.mp4` and `assets/source/funny-dancing-kids-158822.mp3`; the script then uses them. Behind a proxy, set `HTTPS_PROXY` and `NODE_USE_ENV_PROXY=1`.

```bash
# from examples/spin-count: picture only, 1080x1920, slowed to 0.85x, 30 fps -> assets/boy.mp4 (19.667 s)
ffmpeg -y -i assets/source/313047_large.mp4 -an \
  -vf "scale=1080:1920:flags=lanczos,setpts=PTS/0.85,fps=30" \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p assets/boy.mp4

# the first 22 s of the track -> assets/music_cut.mp3
ffmpeg -y -i assets/source/funny-dancing-kids-158822.mp3 -vn -t 22 \
  -ac 2 -ar 44100 -c:a libmp3lame -q:a 2 assets/music_cut.mp3
```

`build.mjs` copies the template unchanged here: the template has no `/*TRANSCRIPT*/[]` placeholder and the folder has no `transcript.json`. Keep editing the template, not `index.html`, as in the other example. HyperFrames Studio (`npm run preview:spin`) writes `data-hf-id` attributes into `index.html`; `npm run build:spin` puts it back.

To redo the beat grid: `npx hyperframes@0.8.143 beats examples/spin-count`. It analyzes the composition's music track (the only `<audio>`, marked `data-timeline-role="music"`); in our run it took 4 s, printed `Wrote 69 beats → beats/assets/music_cut.mp3.json (bpm 188, high)` and wrote a file identical to the committed one. It did not touch `index.html` or the template.

## What happens on screen

Every spin mark `t` below is a time in `boy.mp4`: the source time divided by 0.85.

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
| `renders/`, `snapshots/` | no | outputs: `renders/spin.raw.mp4` (HyperFrames), `renders/spin.mp4` (after the edge fix) |
| `CREDITS.md` | yes | sources, license, what may be shared |

## The numbers

| | |
|---|---|
| Source clip | [Pixabay video 313047](https://pixabay.com/videos/boy-child-kid-childhood-dancing-313047/), "Boy, Child, Kid", uploaded by TonyDias7, labelled AI generated: H.264 2160x3840, 24 fps, 401 frames, 16.708 s, no audio, 52,467,610 bytes |
| `assets/boy.mp4` | scaled to 1080x1920 (lanczos), slowed to 0.85x (`setpts=PTS/0.85`), 30 fps, H.264 CRF 16, no audio: 19.667 s, 590 frames, 36,389,330 bytes, 14.8 Mbit/s |
| Source music | [Pixabay music 158822](https://pixabay.com/music/happy-childrens-tunes-funny-dancing-kids-158822/), "Funny Dancing Kids" by AudioCoffee: MP3 256 kbit/s, 44.1 kHz stereo, 125.832 s, 4,026,618 bytes |
| `assets/music_cut.mp3` | the first 22 s, MP3 VBR (`-q:a 2`), 44.1 kHz stereo, 602,674 bytes |
| Fetch | 8.8 s and 0.7 s for the two downloads, 44.1 s for the `boy.mp4` encode (40.0 s on a second run), 56 s for all of `npm run fetch:spin`. `boy.mp4` and `music_cut.mp3` came out byte for byte identical to the files the posted video was rendered from (same sha256); a second encode of `boy.mp4` gave the same bytes again |
| Spin marks | 10, at 2.24 to 19.06 s in `boy.mp4`, read by eye. Checked afterwards by extracting the frame at each mark: 8 show his back, marks 1 and 4 catch him in profile, mid-turn. Two further back views have no mark (Known issues) |
| Beat grid | 69 beats from 0.224 s to 21.926 s, mean spacing 0.3191 s (188 bpm). The template's grid (0.22 s plus multiples of 0.3185 s) runs 0.004 s early at the first title pulse and 0.043 s early at the last, about one frame |
| Composition | 1080x1920, 30 fps, `data-duration` 21.5 s, 645 frames, GSAP 3.14.2; the footage element runs 19.66 s |
| Composition source | `build/index.template.htm`, 132 lines. It differs from the file the posted video was rendered from in the credit line, the pill bump (below) and three comments |
| Lint | 0 errors, 1 warning (`nested_structure_needs_subcomposition`, harmless for a single-file composition) |
| Render time | 94.2 s for `-q delivery` by HyperFrames' summary line (screenshot capture, hardware GPU), re-rendered from this repo on 2026-10-09 on the same machine, plus 35.8 s for the right-edge fix. Raw 42,024,651 bytes, fixed 33,169,040 bytes |
| Raw render | H.264 1080x1920 30 fps plus AAC 48 kHz stereo, 21.500 s, 645 frames, 42,056,090 bytes, video 15.4 Mbit/s; an 8 px black strip at x 1072 to 1079 in every frame |
| Right-edge fix | `--mode auto` picked smear: the two columns left of the strip vary by 68 to 76 luma levels down the frame (the gradient and the boy), where a flat fill would show a seam. 35.6 s. Filled columns within 3 luma levels and 4 chroma levels of column 1071 in 22 frames, one per second. Untouched columns 0 to 1071: 50.7 dB PSNR on average against the raw render, 47.7 dB for the worst frame. Decoded audio identical, 1,008 of 1,008 audio frames |
| Final file | `renders/spin.mp4`: 645 frames, 21.500 s, video 12.2 Mbit/s, audio copied, 33,237,084 bytes for the posted render. The repo's `fix-right-edge.mjs` gave the same 645 frames (framemd5) as the crop, pad and smear command used for the post, in a file 312 bytes larger (metadata) |
| `check` | fails on contrast: the ten unlit pill numbers (1.89:1 to 1.95:1; grey on white until counted, by design) and the credit line (2.91:1). It also reports the giant numbers overlapping the title as they fly past, and the credit line hidden under the outro card. Runtime and motion pass |
| Preview | `docs/img/demo-spin.gif`: 1.0 to 8.4 s of the corrected render (title, spins 1 to 3), 360x640, 12 fps, 89 frames, 128 colors, 4,048,679 bytes |

Measured on Windows 10 Pro, Intel i7-4790 (8 threads), 16 GB RAM, GTX 1650 4 GB, Node 24.18.0, ffmpeg 8.1.2 (gyan.dev full build), hyperframes 0.8.143.

The final file is 33 MB, over GitHub's 10 MB limit for video attachments on free plans, so the README links it as a release asset. CRF 16 on a grainy 4K source makes a large file.

## Known issues

- **An early render credited the wrong uploader.** Its credit line named the uploader of other clips listed on the same Pixabay page. The clip's page names TonyDias7 as the uploader (checked 2026-10-09). The template's credit line is corrected, and the GIF preview and the release video come from the corrected render.
- **The posted render flashes the pills.** In its first 4 frames all ten pills show at full size; then each one drops to a dot and pops in, the last at 0.55 s. The bump that each pill does when counted was a `fromTo` from `scale: 1`, and GSAP applied that from-state when the timeline was built, over the intro's `scale: 0`. The template now uses a plain `to` for the bump; snapshots at 0 and 0.05 s show no pills, and at 3.0 s the first pill still bumps. The GIF preview starts at 1.0 s, after the flash.
- `boy.mp4` is 1080 wide, not a multiple of 16, against the rule in [docs/08-render-and-qa.md](../../docs/08-render-and-qa.md#5-fix-the-right-edge). HyperFrames' frame extraction blacks out its columns 1072 to 1079, but the footage fills the frame, so that band lands exactly on the render's own 8 px strip and the edge fix covers both. For new full-frame footage, encode 1088 wide.
- **Ten is a judgment call.** The marks are as good as a reading by eye: two of the ten land on a profile frame a few frames away from the back view. A second pass for this guide, at 4 and then 12 frames per second of the source, found two more moments with his back to the camera that have no mark, at about 1.35 s and 13.3 s in the source (1.59 s and 15.65 s in `boy.mp4`). Each is separated from the nearest marked back view by frames that show his face, so by the rule in the template comment the clip has 12. The outro's question, "how many did you count?", stands. `spins.json` lists the two under `unmarked`.
- The template's beat step, 0.3185 s, is 0.0006 s shorter than the beat file's mean spacing, so the title pulses drift ahead of the beat by up to 0.043 s.
- The music page carries a "Content ID Registered" label. A video with this track uploaded to a platform that runs Content ID, such as YouTube, may get a claim. We have not tested an upload.
- `boy.mp4` has x264's default keyframe placement (keyframes 0.83 to 1.0 s apart in this clip, from scene-cut detection) and a timecode track (`tmcd`) carried over from the source. Neither caused a warning in lint or the render log.

## Make your own

The same edit works for any clip with a repeated, countable move: jumps, claps, kicks, a ball bounce. Mark the moments ([docs/06-word-timing.md](../../docs/06-word-timing.md#timings-without-words-beats-and-visual-marks)), put them in `SPINS` and `spins.json`, change the outro number, the stickers and the colors to fit, then build, lint and snapshot. How the layers work: [docs/07-the-edit.md](../../docs/07-the-edit.md#the-spin-count-edit). Sources and their terms: [CREDITS.md](CREDITS.md).
