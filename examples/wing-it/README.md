# wing-it

A 32.5 second vertical video (1080x1920, 30 fps) cut from WING IT!, Blender Studio's 2023 open movie under CC BY 4.0, in which a cat and a dog fly a home-made rocket. The footage is 30 seconds of the film (1:22 to 1:52), cut into its 12 shots, each cropped to 9:16 around its subject. The sound is the film's own. On top sits an edit written as HTML + GSAP in one file: a pre-flight checklist that the flight ignores. Six chips tick green or cross red as the story hits each item, with a 3-2-1 countdown, an altitude meter, blinking warnings, a gadget counter, a BIRD STRIKE tape, and a score card over the last frame.

This is the repo's hero example: the GIF at the top of the main README and our post on X use its render. Like [`spin-count`](../spin-count/README.md) it has no lyrics and no transcript, and unlike it there is no beat grid either. Its times come from two files:

- **The cut.** [`shots.json`](shots.json) lists the 12 shots (film start, film end, where to center the crop). `scripts/fetch-wing-assets.mjs` reads it and builds the footage.
- **The story events.** [`events.json`](events.json) lists every moment the edit reacts to: six checklist items, seven gadgets, the countdown, shakes, cards and the outro. They were read by eye from frames of the cut footage, then checked with frame grabs; the template holds the same numbers in `ITEMS`, `GADGETS` and the cue times.

Steps 2 to 4 of the pipeline (character, song, animation) are skipped: the footage and the sound come from an existing film. Steps 5 to 7 (timings, the edit, the render) run in full.

## Reproduce

You need Node 22 or newer, ffmpeg and ffprobe on PATH, and network access on the first run (npm for HyperFrames, Wikimedia Commons, Google Fonts, the Chrome download, and jsDelivr if no other example has `assets/gsap.min.js` yet).

One-time setup, from the repo root:

```bash
export HYPERFRAMES_NO_TELEMETRY=1          # PowerShell: $env:HYPERFRAMES_NO_TELEMETRY = "1"
npx hyperframes@0.8.143 browser ensure     # downloads Chrome Headless Shell
```

Then five commands (the same as `npm run fetch:wing`, `build:wing`, `lint:wing` and `render:wing`):

```bash
node scripts/fetch-wing-assets.mjs examples/wing-it   # download the film and GSAP, make wing_v.mp4, wing_a.mp3, last.jpg, probe
node scripts/build.mjs examples/wing-it               # copies build/index.template.htm to index.html
npx hyperframes@0.8.143 lint examples/wing-it         # expect 0 errors, 1 warning
npx hyperframes@0.8.143 render examples/wing-it -q delivery -o examples/wing-it/renders/wing-it.raw.mp4
node scripts/fix-right-edge.mjs examples/wing-it/renders/wing-it.raw.mp4 examples/wing-it/renders/wing-it.mp4
```

The fetch script downloads one file, the film's original upload on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:WING_IT!_-_Blender_Open_Movie-full_movie.webm) (36,196,718 bytes), and checks its size and sha256. If you already have it, pass `--source <file>`; to download it by hand, save it as `assets/source/WING_IT_-_Blender_Open_Movie-full_movie.webm`. Behind a proxy, set `HTTPS_PROXY` and `NODE_USE_ENV_PROXY=1`. In two test runs into an empty folder, the download took 6.6 and 6.3 s, the footage encode 45.7 and 43.4 s and the whole script 55 and 51 s, and both times `wing_v.mp4`, `wing_a.mp3` and `last.jpg` came out byte for byte identical to the files the posted video was rendered from. The script prints whether they do on your machine; another ffmpeg build can give other bytes for the same frames.

What it runs, from `examples/wing-it`. The footage is one filter graph with one chain per shot; the script prints the full command. A cropped shot, here shot 1:

```bash
[0:v]trim=start=82.0:end=84.04,setpts=PTS-STARTPTS,crop=608:1080:617:0,scale=1080:1920:flags=lanczos,fps=30,setsar=1[v0];
```

The one wide shot, 11, where the hull throws gadgets across the whole width of the frame:

```bash
[0:v]trim=start=107.0:end=110.83,setpts=PTS-STARTPTS,split[w10a][w10b];
[w10a]scale=-2:1920,crop=1080:1920,boxblur=20:2,eq=brightness=-0.12[bg10];
[w10b]scale=1080:608:flags=lanczos[fg10];
[bg10][fg10]overlay=0:656,fps=30,setsar=1[v10];
```

Then the 12 chains are joined and encoded, and the sound and the still are made:

```bash
# ... [v0][v1]...[v11]concat=n=12:v=1:a=0[vout], then:
#   -map "[vout]" -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p assets/wing_v.mp4

# sound: film 82.0 s to 114.5 s, the swear at film 1:42 to 1:44 at 12 percent, fade out over the last 1.5 s
ffmpeg -y -ss 82 -t 32.5 -i assets/source/WING_IT_-_Blender_Open_Movie-full_movie.webm -vn \
  -af "volume=enable='between(t,19.8,22.3)':volume=0.12,afade=t=out:st=31.0:d=1.5" \
  -ac 2 -ar 48000 -c:a libmp3lame -q:a 2 assets/wing_a.mp3

# the last frame of the footage, held under the outro
ffmpeg -y -sseof -0.05 -i assets/wing_v.mp4 -frames:v 1 assets/last.jpg
```

How the crops and the wide card work, and why the swear is ducked: [docs/05-or-use-existing-footage.md](../../docs/05-or-use-existing-footage.md#a-blender-open-movie-the-wing-it-example).

`build.mjs` copies the template unchanged here, as for spin-count. Keep editing the template, not `index.html`. HyperFrames Studio (`npm run preview:wing`) writes `data-hf-id` attributes into `index.html`; `npm run build:wing` puts it back.

## What happens on screen

Times are seconds into the video; the film time is 82.0 s more. The six checklist items and seven gadgets are the ones in `events.json`.

| Time (s) | Event |
|---|---|
| 0.15 to 0.6 | the white PRE-FLIGHT CHECKLIST card slides down; six chips follow from 0.4, 0.06 s apart; the score reads 0/6 |
| 1.5 | SEATBELTS gets a red cross: the cat is yanked upside down |
| 2.75, 3.0, 3.25 | a giant yellow 3, 2, 1 over the shouting dog |
| 3.5 | IGNITION ticks green on the cut to the rocket, with a white flash and a shake; the score turns to 1/6 |
| 5.0 to 6.4 | LIFTOFF ticks green and the frame shakes; ROOF: OPTIONAL pops at 5.2, over the hole in the barn roof |
| 6.6, 7.0 | two shakes as the dog is pressed into his seat |
| 7.6 to 12.3 | an altitude meter slides in on the right; its bar and its number run from 0 to 12,000 FT between 7.7 and 11.1 |
| 10.5 | ALTITUDE ticks green as the rocket passes the moon; 3/6 |
| 12.6, 14.0, 15.4 | red warnings MASTER CAUTION, HULL: MOSTLY TAPE, PILOT: STILL SMILING; all three blink every 0.5 s and leave at 17.5 |
| 19.0 | a dark card at the bottom: NEXT STEP / DEPLOY PARACHUTE, as a finger presses the parachute button |
| 20.6 | "...that's an umbrella" pops as the umbrella opens |
| 22.0 | PARACHUTE gets a red cross; the card turns red, RESULT / PARACHUTE: FAILED, with a shake |
| 23.2 | a giant PLAN B over the screaming cat |
| 24.8 to 28.6 | EMERGENCY GADGETS: a big counter and a chip per gadget, 1 to 7, from PLUNGER at 25.0 to BOXING GLOVE at 27.5 |
| 28.83 | AIRSPACE gets a red cross on the cut to the cockpit, with a flash, a shake and a yellow and black BIRD STRIKE tape |
| 29.92 | the last frame of the footage takes over as a still; the footage ends at 29.96 |
| 29.96 to 30.96 | a dark shade, then CHECKLIST 3/6, GADGETS 7, BIRDS 1 and "nobody told them about the umbrella" |
| 32.5 | end |

A progress bar fills across the whole 32.5 s, and the credit line stays at the bottom throughout.

## Files

| Path | In git | What it is |
|---|---|---|
| `build/index.template.htm` | yes | the composition, 227 lines; the file to edit |
| `index.html` | yes | copied from the template by `scripts/build.mjs`; do not edit |
| `shots.json` | yes | the 12 shots: film start and end, crop center, what each shows; read by the fetch script |
| `events.json` | yes | every event the edit reacts to, with the film time and what the frame shows |
| `assets/source/WING_IT_-_Blender_Open_Movie-full_movie.webm` | no | the Commons download |
| `assets/wing_v.mp4`, `assets/wing_a.mp3`, `assets/last.jpg`, `assets/gsap.min.js` | no | made or copied by `scripts/fetch-wing-assets.mjs` |
| `renders/`, `snapshots/` | no | outputs: `renders/wing-it.raw.mp4` (HyperFrames), `renders/wing-it.mp4` (after the edge fix) |
| `CREDITS.md` | yes | the film, its license, the credit, what may be shared |

## The numbers

| | |
|---|---|
| Source | [WING IT!](https://commons.wikimedia.org/wiki/File:WING_IT!_-_Blender_Open_Movie-full_movie.webm), Blender Studio, 2023, CC BY 4.0: VP9 1920x1080, 24 fps, Opus 48 kHz stereo, 237.948 s, 36,196,718 bytes |
| `assets/wing_v.mp4` | film 82.0 to 112.0 s, 12 shots, 11 cropped to 608x1080 and one kept whole as a 1080x608 card, scaled to 1080x1920 (lanczos), 30 fps, H.264 CRF 16, no audio: 29.967 s, 899 frames, 20,582,343 bytes, 5.5 Mbit/s |
| `assets/wing_a.mp3` | film 82.0 to 114.5 s, ducked to 12 percent from 19.8 to 22.3 s, faded out from 31.0 s, MP3 VBR (`-q:a 2`), 48 kHz stereo: 32.500 s, 762,289 bytes |
| `assets/last.jpg` | the last frame of `wing_v.mp4`, 1080x1920, 56,351 bytes |
| Fetch | two runs: 6.6 and 6.3 s download, 45.7 and 43.4 s footage encode, 0.6 s sound, 55 and 51 s for the whole script; all three made files byte for byte the files the posted video was rendered from, both times |
| Events | 6 checklist items and 7 gadgets read by eye from frames, then checked with frame grabs (see Known issues for the four marks that land on a cut or after the action), plus 24 cues timed from them (countdown, shakes, cards, outro) |
| Composition | 1080x1920, 30 fps, `data-duration` 32.5 s, 975 frames, GSAP 3.14.2; the footage element runs 29.96 s, the sound 32.5 s |
| Composition source | `build/index.template.htm`, 227 lines, the file the posted video was rendered from |
| Lint | 0 errors, 1 warning (`nested_structure_needs_subcomposition`, harmless for a single-file composition) |
| Render time | 1 min 43.3 s for `-q delivery` by HyperFrames' summary line (drawElement capture, hardware GPU: compile 1.8 s, extract 9.9 s, audio 1.4 s, capture 1 min 26.1 s with encoding during capture, assemble 2.6 s), 110 s wall clock |
| Raw render | H.264 1080x1920 30 fps plus AAC 48 kHz stereo, 32.500 s video and audio, 975 frames, 34,624,061 bytes (HyperFrames prints 33.0 MB), video 8.3 Mbit/s; an 8 px black strip at x 1072 to 1079 in every frame |
| Right-edge fix | `--mode auto` picked smear: the two columns left of the strip vary by 79 to 136 luma levels down the frame (median 104.5), footage that reaches the edge. 42.4 s. At 16.25 s the filled columns average 59.7 luma against 57.9 for the untouched x 1064 to 1071 |
| Final file | `wing-it.mp4` on the release: 975 frames, 32.500 s video and audio, video 6.5 Mbit/s, audio copied, 27,310,022 bytes |
| `check` | fails: the empty chip dots hold their tick or cross in a transparent color until the event (by design, reported as `text_not_painted`), and contrast is short for the white tick on green (2.74:1), the RESULT label on the red card (2.07:1) and the credit line (4.27:1 at 16.25 s). Runtime and motion pass. The run took 42 s |
| Preview | `docs/img/demo-wing.gif`: 2.6 to 9.6 s of the posted render (countdown, ignition, liftoff, the roof, the start of the climb), 360x640, 12 fps, 84 frames, 128 colors, 3,228,266 bytes; the command in [docs/08-render-and-qa.md](../../docs/08-render-and-qa.md#8-a-preview-gif-and-a-still) gives the same bytes again |

Measured on Windows 10 Pro, Intel i7-4790 (8 threads), 16 GB RAM, GTX 1650 4 GB, Node 24.18.0, ffmpeg 8.1.2 (gyan.dev full build), hyperframes 0.8.143. The render was made from the same template and the same three asset files in the folder where the edit was written; we did not render it again from the repo. Snapshots of the repo copy at 0, 0.05, 3.6, 11, 22.2, 26.3, 29.1 and 31.6 s match the posted render by eye.

The final file is 27 MB, over GitHub's 10 MB limit for video attachments on free plans, so the README links it as a release asset.

## Known issues

- **The altitude number is written by a callback.** `onUpdate` sets `#alt-num` from a plain object as it tweens from 0 to 12,000. The repo's rules forbid this (it made handwash-song fail HyperFrames' drawElement check and fall back to screenshots), and the posted render passed the check anyway. The template stays as rendered. For a new edit, put " FT" in its own element and tween the number's `textContent` with `snap`: [docs/07-the-edit.md](../../docs/07-the-edit.md#the-wing-it-edit).
- **Four marks sit on a cut or after the action.** IGNITION (3.5 s) lands on the cut to the rocket, which sits still until it jolts at 4.0. LIFTOFF (5.0 s) lands about 0.4 s after the rocket has gone through the roof (between 4.5 and 4.6). PARACHUTE (22.0 s) lands 0.2 to 0.4 s after the umbrella flips. AIRSPACE (28.83 s) lands on the cut to the cockpit, about 0.37 s before the rooster comes through the windshield. ALTITUDE (10.5 s) is a moment picked inside the climb, not an event. `events.json` says what each frame shows.
- **The swear is ducked, not removed.** At 12 percent volume (about -18 dB) it is quiet but still there. To remove it, set the volume to 0 or replace that stretch.
- **`wing_v.mp4` keeps x264's default keyframes**, 17 of them, up to 4.67 s apart, because the posted video was rendered from that file. We did not keep the full render log, so we cannot say whether HyperFrames warned about sparse keyframes, and we did not check the render frame by frame for freezes. For your own footage, add `-g 30 -keyint_min 30`.
- **The footage is 1080 wide**, not a multiple of 16, against the rule in [docs/08-render-and-qa.md](../../docs/08-render-and-qa.md#5-fix-the-right-edge). As in spin-count, the footage fills the frame, so HyperFrames' black band falls on the render's own 8 px strip and the edge fix covers both.
- **Symbols from a fallback font.** The warning sign, the tick and the cross are not in Poppins, so Chrome draws them from a system font. They may look different on another machine (not tested).
- **The credit line wraps** onto a second line ("HyperFrames") at 20 px in its 960 px box, which ends close to the bottom edge of the frame.

## Make your own

The same edit works for any clip that tells a short story with clear beats: a plan, then what actually happens. Step through the frames and write down each event ([docs/06-word-timing.md](../../docs/06-word-timing.md#story-events-stepping-through-frames)), put the times in `events.json` and in `ITEMS`, `GADGETS` and the cue times of the template, and change the chip labels, the warnings and the outro. For other footage, list your shots in `shots.json` and change the `FILM` entry in `scripts/fetch-wing-assets.mjs`, or cut the footage with the same ffmpeg chains by hand. How the layers work: [docs/07-the-edit.md](../../docs/07-the-edit.md#the-wing-it-edit). Sources and terms: [CREDITS.md](CREDITS.md).
