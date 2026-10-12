# wing-it

A pre-flight checklist laid over 30 seconds of WING IT!, Blender Studio's 2023 open movie in which a cat and a dog fly a home-made rocket. Six chips tick green or cross red as the story reaches each item, with a 3-2-1 countdown, an altitude meter, blinking warnings, a gadget counter, a BIRD STRIKE tape and a score card over the last frame. The footage is cut into its 12 shots, each cropped to 9:16 around its subject, and the sound is the film's own.

| | |
|---|---|
| Video | [wing-it.mp4](https://github.com/helicerat/cuecut/releases/download/v0.1.0/wing-it.mp4), 32.5 s, 1080x1920, 30 fps, with sound |
| Source | WING IT! (Blender Studio, 2023), film 1:22 to 1:52, CC BY 4.0 |
| Timed by | story events read from frames |
| Pipeline steps | 5 to 7 (timings, edit, render); steps 2 to 4 are replaced by the film |

## Rebuild

You need Node 22 or newer, ffmpeg and ffprobe on PATH, and network access on the first run (npm, Wikimedia Commons, Google Fonts, the Chrome download, and jsDelivr if no other example has `assets/gsap.min.js` yet).

One-time setup, from the repo root:

```bash
export HYPERFRAMES_NO_TELEMETRY=1          # PowerShell: $env:HYPERFRAMES_NO_TELEMETRY = "1"
npx hyperframes@0.8.143 browser ensure     # downloads Chrome Headless Shell
```

Then:

```bash
npm run fetch:wing    # download the film and GSAP, make wing_v.mp4, wing_a.mp3, last.jpg
npm run build:wing    # copy build/index.template.htm to index.html
npm run lint:wing     # expect 0 errors, 1 warning
npm run render:wing   # render, then fix the right edge -> examples/wing-it/renders/wing-it.mp4
```

The fetch takes about a minute, most of it the footage encode. The render and the edge fix take two to three minutes. The one lint warning, `nested_structure_needs_subcomposition`, is harmless for a single-file composition.

- **The download.** The fetch script downloads one file, the film's original upload on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:WING_IT!_-_Blender_Open_Movie-full_movie.webm) (36,196,718 bytes), and checks its size and sha256. If you already have it, pass `--source <file>`. To download it by hand, save it as `assets/source/WING_IT_-_Blender_Open_Movie-full_movie.webm`. Behind a proxy, set `HTTPS_PROXY` and `NODE_USE_ENV_PROXY=1`.
- **Reference bytes.** The script prints whether `wing_v.mp4`, `wing_a.mp3` and `last.jpg` match the files the release video was rendered from. Another ffmpeg build can give other bytes for the same frames.
- **`npm run probe:wing` warns about length.** The footage ends at 29.97 s and the outro holds its last frame to 32.5 s, so the files differ in length by design.
- **The right edge.** `render:wing` runs `scripts/fix-right-edge.mjs` after HyperFrames, which repairs the 8 px black strip that ffmpeg 8.1.2 leaves at the right edge ([details](../../docs/08-render-and-qa.md#5-fix-the-right-edge)).
- **Edit the template, not `index.html`.** `build.mjs` copies the template unchanged. HyperFrames Studio (`npm run preview:wing`) writes `data-hf-id` attributes into `index.html`; `npm run build:wing` puts it back.

<details>
<summary>The commands behind the npm scripts</summary>

```bash
node scripts/fetch-wing-assets.mjs examples/wing-it
node scripts/build.mjs examples/wing-it
npx hyperframes@0.8.143 lint examples/wing-it
npx hyperframes@0.8.143 render examples/wing-it -q delivery -o examples/wing-it/renders/wing-it.raw.mp4
node scripts/fix-right-edge.mjs examples/wing-it/renders/wing-it.raw.mp4 examples/wing-it/renders/wing-it.mp4
```

</details>

<details>
<summary>The ffmpeg commands the fetch script runs</summary>

From `examples/wing-it`. The footage is one filter graph with one chain per shot; the script prints the full command. A cropped shot, here shot 1:

```text
[0:v]trim=start=82.0:end=84.04,setpts=PTS-STARTPTS,crop=608:1080:617:0,scale=1080:1920:flags=lanczos,fps=30,setsar=1[v0];
```

The one wide shot, 11, where the hull throws gadgets across the whole width of the frame:

```text
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

</details>

## How the timings were made

There are no lyrics, no transcript and no beat grid. Every time comes from two files:

- **The cut.** [`shots.json`](shots.json) lists the 12 shots: film start, film end and where to center the crop. The fetch script reads it and builds the footage.
- **The story events.** [`events.json`](events.json) lists every moment the edit reacts to: six checklist items, seven gadgets, the countdown, shakes, cards and the outro. They were read by eye from frames of the cut footage, then checked with frame grabs ([method](../../docs/06-word-timing.md#story-events-stepping-through-frames)). The template holds the same numbers in `ITEMS`, `GADGETS` and the cue times. Change both together.

## What happens on screen

Times are seconds into the video; the film time is 82.0 s more.

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
| `renders/`, `snapshots/` | no | `renders/wing-it.raw.mp4` from HyperFrames, `renders/wing-it.mp4` after the edge fix |
| `CREDITS.md` | yes | the film, its license, the credit, what may be shared |

<details>
<summary>Media specs</summary>

| | |
|---|---|
| Source | [WING IT!](https://commons.wikimedia.org/wiki/File:WING_IT!_-_Blender_Open_Movie-full_movie.webm): VP9 1920x1080, 24 fps, Opus 48 kHz stereo, 237.948 s, 36,196,718 bytes |
| `assets/wing_v.mp4` | film 82.0 to 112.0 s, 12 shots, 11 cropped to 608x1080 and one kept whole as a 1080x608 card, scaled to 1080x1920 (lanczos), 30 fps, H.264 CRF 16, no audio: 29.967 s, 899 frames, 20,582,343 bytes |
| `assets/wing_a.mp3` | film 82.0 to 114.5 s, ducked to 12 percent from 19.8 to 22.3 s, faded out from 31.0 s, MP3 VBR (`-q:a 2`), 48 kHz stereo: 32.500 s, 762,289 bytes |
| `assets/last.jpg` | the last frame of `wing_v.mp4`, 1080x1920, 56,351 bytes |
| Composition | 1080x1920, 30 fps, `data-duration` 32.5 s, 975 frames, GSAP 3.14.2; the footage element runs 29.96 s, the sound 32.5 s |
| Raw render | H.264 1080x1920 30 fps plus AAC 48 kHz stereo, 32.500 s, 975 frames; an 8 px black strip at x 1072 to 1079 in every frame |
| Edge fix | `--mode auto` picks smear, because the footage reaches the edge |
| Final file | `wing-it.mp4`: 975 frames, 32.500 s video and audio, audio copied, 27,310,022 bytes |
| Preview | `docs/img/demo-wing.gif`: 2.6 to 9.6 s of the render, 360x640, 12 fps, 84 frames, 128 colors ([command](../../docs/08-render-and-qa.md#8-a-preview-gif-and-a-still)) |

</details>

## Known issues

- **`check` fails.** `npx hyperframes@0.8.143 check examples/wing-it` reports the empty chip dots as `text_not_painted`: they hold their tick or cross in a transparent color until the event, by design. Contrast is short for the white tick on green (2.74:1), the RESULT label on the red card (2.07:1) and the credit line (4.27:1). Runtime and motion pass.
- **The altitude number is written by a callback.** `onUpdate` sets `#alt-num` from a plain object as it tweens from 0 to 12,000. This breaks the repo's rule for counters, though this render passed HyperFrames' drawElement check. For a new edit, put " FT" in its own element and tween the number's `textContent` with `snap`: [docs/07-the-edit.md](../../docs/07-the-edit.md#the-wing-it-edit).
- **Four marks sit on a cut or after the action.** IGNITION (3.5 s) lands on the cut to the rocket, which sits still until it jolts at 4.0. LIFTOFF (5.0 s) lands about 0.4 s after the rocket has gone through the roof (between 4.5 and 4.6). PARACHUTE (22.0 s) lands 0.2 to 0.4 s after the umbrella flips. AIRSPACE (28.83 s) lands on the cut to the cockpit, about 0.37 s before the rooster comes through the windshield. ALTITUDE (10.5 s) is a moment picked inside the climb, not an event. `events.json` says what each frame shows.
- **The swear is ducked, not removed.** At 12 percent volume (about -18 dB) it is quiet but still there. To remove it, set the volume to 0 or replace that stretch.
- **`wing_v.mp4` keeps x264's default keyframes**, 17 of them, up to 4.67 s apart. For your own footage, add `-g 30 -keyint_min 30`.
- **The footage is 1080 wide**, not a multiple of 16, against the rule in [docs/08-render-and-qa.md](../../docs/08-render-and-qa.md#5-fix-the-right-edge). The footage fills the frame, so HyperFrames' black band falls on the render's own 8 px strip and the edge fix covers both.
- **Symbols come from a fallback font.** The warning sign, the tick and the cross are not in Poppins, so Chrome draws them from a system font, which differs between systems.
- **The credit line wraps** onto a second line ("HyperFrames") at 20 px in its 960 px box, which ends close to the bottom edge of the frame.

## Make your own

The same edit works for any clip that tells a short story with clear beats: a plan, then what actually happens.

1. Step through the frames and write down each event ([docs/06-word-timing.md](../../docs/06-word-timing.md#story-events-stepping-through-frames)).
2. Put the times in `events.json` and in `ITEMS`, `GADGETS` and the cue times of the template.
3. Change the chip labels, the warnings and the outro.
4. For other footage, list your shots in `shots.json` and change the `FILM` entry in `scripts/fetch-wing-assets.mjs`, or cut the footage with the same ffmpeg chains by hand.

How the layers work: [docs/07-the-edit.md](../../docs/07-the-edit.md#the-wing-it-edit).

## Credits

Footage and sound: WING IT! (CC) Blender Foundation | studio.blender.org, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), cut to 9:16 and edited. The attribution to use when you post, and what may be shared: [CREDITS.md](CREDITS.md).
