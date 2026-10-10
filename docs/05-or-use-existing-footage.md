# 05. Or use existing footage

Steps 2 to 4 (character, song, animation) are the paid part. The other way in is a clip that already exists and that you may use. It costs nothing, and steps 5 to 7 (timings, edit, render) work the same way. All three examples are built like this:

| Example | Footage | Sound | License |
|---|---|---|---|
| [`wing-it`](../examples/wing-it) | 30 s of Blender Studio's open movie WING IT!, recut to 9:16 | the film's own | CC BY 4.0 |
| [`spin-count`](../examples/spin-count) | an AI-generated 3D clip from Pixabay | a Pixabay track | Pixabay Content License |
| [`handwash-song`](../examples/handwash-song) | CDC's "Happy Handwashing Song" cartoon | its own song | public domain |

Pick the footage first and check its license before you write any code. Prompts: [`prompts/00-brief.md`](../prompts/00-brief.md), then [`prompts/edit/01-assets.md`](../prompts/edit/01-assets.md).

## What makes a usable clip

- **One subject, big in frame.** A small figure in a wide shot does not read in a 1000 px card or a narrow 9:16 window.
- **Clean picture.** A caption strip along one edge can be cropped off. A logo in the middle stays.
- **Clear vocals**, if the clip carries the song. Word timings come from transcribing it ([06-word-timing.md](06-word-timing.md)).
- **A license you can verify** that allows editing and sharing the result.

## Where to find footage you may use

| Source | License | Caveats | Raw file in a public repo |
|---|---|---|---|
| [Wikimedia Commons](https://commons.wikimedia.org), works of US federal agencies (NASA, CDC) | public domain | credit the agency; no implied endorsement; agency logos excluded (NASA: 14 CFR 1221); third-party material inside can still be under copyright | allowed |
| Blender Studio open movies: [Tears of Steel](https://mango.blender.org/sharing/) (CC BY 3.0), [Wing It!](https://studio.blender.org/projects/wing-it/pages/licensing/) and [Spring](https://studio.blender.org/films/spring/pages/about) (CC BY 4.0) | Creative Commons Attribution | credit `(CC) Blender Foundation \| studio.blender.org`, link the license, say what you changed; logos and trademarks excluded. The Big Buck Bunny score is CC BY-NC-ND 3.0 ([peach.blender.org](https://peach.blender.org/about/)): replace the music | allowed with credit |
| [Prelinger Archives](https://archive.org/details/prelinger) | marked "Public Domain" | the mark is the uploader's claim; check the date and producer | your judgment |
| [Pexels](https://www.pexels.com/license/) | Pexels License | no credit needed; no redistribution on stock platforms; do not show people in a bad light or imply endorsement | no; link to it |
| [Pixabay](https://pixabay.com/service/license-summary/) | Pixabay Content License | no credit required; no distributing the content "on a Standalone basis" (unedited); some music is registered with Content ID | no; ship a fetch script |

The examples commit no media at all, whatever the license allows. Licenses change, so read the page again before you publish.

## A five-minute license check

The answers in italics are the handwash clip's.

1. **Read the file page.** A public-domain tag there is the uploader's statement, not legal advice. *[Commons](https://commons.wikimedia.org/wiki/File:Happy_Handwashing_Song.webm): public domain, a work of the Centers for Disease Control and Prevention, 3 March 2010.*
2. **Look inside the clip** for music, logos, people, swearing and stock inserts. *The melody is "Happy Birthday to You", public domain in the US since 2016 ([Wikipedia](https://en.wikipedia.org/wiki/Happy_Birthday_to_You)). From 25.17 s an end card shows song credits, `www.cdc.gov`, the HHS logo and the CDC logo.*
3. **Read the publisher's reuse policy.** *CDC's [Use of Agency Materials](https://www.cdc.gov/other/agencymaterials.html): credit CDC, do not imply endorsement, do not use the CDC logo. Some CDC materials come from contractors or third-party licenses.*
4. **Put a credit line in the video.** *`Footage & song: CDC "Happy Handwashing Song", public domain. Edit: HTML + GSAP, rendered with HyperFrames.`*
5. **Keep media out of git** and ship a fetch script. GitHub blocks files above 100 MiB ([docs](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)). *`scripts/fetch-assets.mjs` downloads and cuts the clip locally; `.gitignore` covers media under `examples/*/assets/`.*

**The CDC end card.** The crop and the card hide most of the logo row, but part of the CDC logo shows in the last 5.6 s of the render. Do not use that frame as a thumbnail or cover; the handwash GIF and still in `docs/img/` come from before 25.17 s. To drop the logos, stop reading at 25.1 s and hold the last frame (30.9 s, 927 frames). From `examples/handwash-song`, after `npm run fetch`:

```bash
ffmpeg -y -t 25.1 -i assets/Happy_Handwashing_Song.webm -an \
  -vf "crop=522:322:0:0,scale=1088:-2:flags=lanczos,fps=30,tpad=stop_mode=clone:stop_duration=5.8" \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -g 30 -keyint_min 30 \
  assets/cat.mp4
```

`-t` goes before `-i` so it limits the input, not the padded output. `npm run fetch -- --force` restores the original.

## Crop burned-in captions

The handwash source is VP8 522x360, 30 fps, Vorbis 44.1 kHz mono, 30.885 s, with CDC's captions burned into the bottom 38 px. The karaoke layer already prints every word, and two copies of the lyrics read as noise, so the strip goes. Find it on a frame grab:

```bash
# from examples/handwash-song
ffmpeg -ss 10 -i assets/Happy_Handwashing_Song.webm -frames:v 1 assets/frame.png
```

The captions fill rows 322 to 359, so `crop=522:322:0:0` keeps the top 322. `cropdetect` finds black bars only, not captions.

## The preprocessing, flag by flag

`npm run fetch` runs these two commands (from `examples/handwash-song`):

```bash
# picture only -> assets/cat.mp4 (1088x672)
ffmpeg -y -i assets/Happy_Handwashing_Song.webm -an \
  -vf "crop=522:322:0:0,scale=1088:-2:flags=lanczos,fps=30" \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p \
  assets/cat.mp4

# sound only -> assets/song.mp3
ffmpeg -y -i assets/Happy_Handwashing_Song.webm -vn \
  -ac 2 -ar 44100 -c:a libmp3lame -q:a 2 \
  assets/song.mp3
```

| Flag | Why |
|---|---|
| `-an` | The song goes in as its own `<audio>`. HyperFrames lint requires every `<video>` to be `muted` or declare `data-has-audio` ([HTML schema](https://hyperframes.heygen.com/reference/html-schema)). |
| `scale=1088:-2:flags=lanczos` | About 2x for a 1000 px card; Lanczos keeps outlines sharp. Width a multiple of 16: HyperFrames 0.8.143 with ffmpeg 8.1.2 (gyan.dev Windows build) blacks out every column after the last multiple of 16 ([08-render-and-qa.md](08-render-and-qa.md#5-fix-the-right-edge)). `-2` keeps the aspect with an even height. |
| `fps=30` | The composition's rate, one output frame per source frame. Matters for 25 or 29.97 fps sources. |
| `-crf 16 -preset slow`, `-pix_fmt yuv420p` | High quality, decodable everywhere. |
| `-ac 2 -ar 44100` | Mono to stereo at the source rate, written down so you can check it. |

**Size the card from the clip.** The cropped clip is 522x322 (1.621). The card is 1000x617, the same ratio, so `object-fit: cover` cuts almost nothing.

**Add a keyframe every second** with `-g 30 -keyint_min 30 -movflags +faststart`. x264's default interval is 8.33 s at 30 fps, and HyperFrames warns:

```text
[WARN] [Compiler] WARNING: Video "footage" has sparse keyframes (max interval: 8.33s). This causes seek failures and frame freezing.
```

## A Pixabay clip and track: the spin-count example

| Check | Answer |
|---|---|
| Pages | [Video 313047](https://pixabay.com/videos/boy-child-kid-childhood-dancing-313047/), "Boy, Child, Kid", by TonyDias7, 2160x3840, 24 fps, labelled "AI generated". [Music 158822](https://pixabay.com/music/happy-childrens-tunes-funny-dancing-kids-158822/), "Funny Dancing Kids" by AudioCoffee, 2:06 |
| License | [Pixabay Content License](https://pixabay.com/service/license-summary/): free use and modification, commercial included, no credit required. The [terms](https://pixabay.com/service/terms/) forbid "Standalone" redistribution, bulk or systematic copying, and automated data collection by programs or robots for unauthorised purposes |
| Watch for | The music is "Content ID Registered": an upload to a platform that runs Content ID can get a claim. The uploader asks for a credit line and link in the description. The video page lists related clips by other uploaders, so copy the name from the author box next to Download |
| Credit | `Footage: TonyDias7 / Pixabay · Music: AudioCoffee / Pixabay · Edit: HTML + GSAP, rendered with HyperFrames` |
| Fetch | `scripts/fetch-spin-assets.mjs` downloads both files to `assets/source/` with a descriptive User-Agent and `Referer: https://pixabay.com/`, then checks size (52,467,610 and 4,026,618 bytes) and sha256. Files you download by hand under the names in `--help` pass the same check |

More in [CREDITS.md](../examples/spin-count/CREDITS.md). The cut:

```bash
# from examples/spin-count: picture only -> assets/boy.mp4 (1080x1920, 30 fps, 19.667 s)
ffmpeg -y -i assets/source/313047_large.mp4 -an \
  -vf "scale=1080:1920:flags=lanczos,setpts=PTS/0.85,fps=30" \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p assets/boy.mp4

# the first 22 s of the track -> assets/music_cut.mp3
ffmpeg -y -i assets/source/funny-dancing-kids-158822.mp3 -vn -t 22 \
  -ac 2 -ar 44100 -c:a libmp3lame -q:a 2 assets/music_cut.mp3
```

- `scale=1080:1920` halves the 2160x3840 source. The footage fills the frame: no card, no crop.
- `setpts=PTS/0.85` plays the clip at 0.85x (16.708 s becomes 19.667 s). Marks read in the source must be divided by 0.85 too.
- `boy.mp4` is 1080 wide, so its black columns (1072 to 1079) fall on the render's own strip and the edge fix covers both. For new full-frame footage, encode 1088 wide and let `object-fit: cover` crop 4 px a side.

## A Blender open movie: the wing-it example

The example takes film 1:22 to 1:52 of WING IT! (Blender Studio, 2023: a cat and a dog fly a home-made rocket) and keeps the film's sound.

| Check | Answer |
|---|---|
| Pages | The [licensing page](https://studio.blender.org/projects/wing-it/pages/licensing/) puts all published project data under CC BY 4.0, attribution `(CC) Blender Foundation \| studio.blender.org`. The [Commons file](https://commons.wikimedia.org/wiki/File:WING_IT!_-_Blender_Open_Movie-full_movie.webm) agrees |
| License | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): any use, commercial included, if you credit, link the license, say what changed and imply no endorsement. Logos and trademarks excluded |
| Watch for | No logo in the 30 s used. A shouted swear at film 1:42 to 1:44, turned down ([below](#turning-down-a-swear-and-the-sound)) |
| Credit | `WING IT! (CC BY 4.0) Blender Foundation, studio.blender.org · Edit: HTML + GSAP, rendered with HyperFrames`, plus the full attribution in the post ([CREDITS.md](../examples/wing-it/CREDITS.md)) |
| Fetch | `scripts/fetch-wing-assets.mjs` downloads the original from Commons (VP9 1920x1080, 24 fps, Opus 48 kHz, 36,196,718 bytes) with a descriptive User-Agent and checks size and sha256. `--source <file>` uses a copy you already have |

### A 9:16 cut, shot by shot

A 16:9 frame is about three 9:16 windows wide, so one fixed crop loses a moving subject. The example cuts at the film's own shot changes and crops each shot on its own.

**Find the cuts** with ffmpeg's scene score:

```bash
# from examples/wing-it, after npm run fetch:wing; times are seconds after 82.0
ffmpeg -ss 82 -t 30 -i assets/source/WING_IT_-_Blender_Open_Movie-full_movie.webm -an \
  -vf "select='gt(scene,0.25)',showinfo" -f null - 2>&1 | grep -oE "pts_time:[0-9.]+"
```

At 0.25 it lists exactly the 11 cuts in the window. At 0.3 it misses one (score 0.299); lower values add false cuts. Check each candidate on a contact sheet ([06-word-timing.md](06-word-timing.md#story-events-stepping-through-frames)).

**Crop each shot.** The window is 608x1080 (1080 x 9 / 16, rounded to even). For each shot, note the subject's position as a fraction of the width, `center_x`. The left edge is `x = floor(min(max(center_x * 1920 - 304, 0), 1312))`. [`shots.json`](../examples/wing-it/shots.json) holds all 12 shots. Shot 1:

```text
[0:v]trim=start=82.0:end=84.04,setpts=PTS-STARTPTS,crop=608:1080:617:0,scale=1080:1920:flags=lanczos,fps=30,setsar=1[v0];
```

**Keep a wide shot wide.** In shot 11 seven gadgets fly across the whole frame. It stays 16:9, as a card over a blurred, darkened copy of itself:

```text
[0:v]trim=start=107.0:end=110.83,setpts=PTS-STARTPTS,split[w10a][w10b];
[w10a]scale=-2:1920,crop=1080:1920,boxblur=20:2,eq=brightness=-0.12[bg10];
[w10b]scale=1080:608:flags=lanczos[fg10];
[bg10][fg10]overlay=0:656,fps=30,setsar=1[v10];
```

The card sits at y 656, centered: (1920 - 608) / 2.

**Join the shots** with `concat=n=12:v=1:a=0[vout]` (29.967 s, 899 frames). `setsar=1` on every chain is what `concat` needs. The fetch script builds the whole graph from `shots.json`, so to change a shot, edit the file and run `npm run fetch:wing -- --force`.

### Turning down a swear, and the sound

```bash
# from examples/wing-it: film sound from 82.0 s, 32.5 s (30 s of footage + 2.5 s of outro)
ffmpeg -y -ss 82 -t 32.5 -i assets/source/WING_IT_-_Blender_Open_Movie-full_movie.webm -vn \
  -af "volume=enable='between(t,19.8,22.3)':volume=0.12,afade=t=out:st=31.0:d=1.5" \
  -ac 2 -ar 48000 -c:a libmp3lame -q:a 2 assets/wing_a.mp3
```

- `volume=...:volume=0.12` plays the swear (cut 19.8 to 22.3 s) at 12 percent, about -18 dB. Use `volume=0` to mute it. `t` counts from the start of the cut because `-ss` sits before `-i`.
- `afade` fades the last 1.5 s so the sound ends with the video.

### The last frame as a still

The footage ends at 29.967 s and the video at 32.5 s. The outro sits on the last frame, shown as an `<img>` after the `<video>` ends:

```bash
ffmpeg -y -sseof -0.05 -i assets/wing_v.mp4 -frames:v 1 assets/last.jpg
```

## Always probe sample rate and duration

A tool that writes 48 kHz samples into a file labelled 44.1 kHz makes the audio 8.8 percent longer (48000 / 44100). It drifts further off the picture every second, and nothing warns. The only sign is a duration mismatch. Probe every input and output and never assume 44.1 kHz:

```bash
npm run probe   # the handwash files
node scripts/probe.mjs path/to/footage.mp4 path/to/song.mp3 path/to/render.mp4
ffprobe -v error -show_entries stream=codec_type,sample_rate,channels,duration:format=duration -of compact file.mp4
```

`probe.mjs` warns on a sample rate other than 44.1 or 48 kHz and on durations that differ by more than 0.1 s. A HyperFrames render carries 48 kHz audio because HyperFrames resamples the mix; its duration still matches the video.

## Checklist for a new clip

1. Read the license page. Look inside the clip for music, logos, people, swearing and stock inserts.
2. Probe it: size, fps, sample rate, duration.
3. Find burned-in text and decide the crop.
4. Scale with Lanczos to a width that is a multiple of 16 (1088 for a 1000 px card or a full 1080 px frame), 30 fps, a keyframe every 30 frames, no audio. For a 16:9 film, crop each shot on its own.
5. If the clip carries the song, extract the audio separately and probe it again.
6. Size the footage card from the cropped aspect ratio.
7. Keep media out of git. Ship a fetch script and a credit line.
