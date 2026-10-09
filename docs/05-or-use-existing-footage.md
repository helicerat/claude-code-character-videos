# 05. Or use existing footage

The other way in. Instead of steps 2 to 4 (character, song, animation), take a clip that already exists and that you may use, with its own soundtrack or a separate one. It costs nothing, and the edit in steps 5 to 7 works the same way. All three examples in this repo were made like this, because they were made without generation credits: `examples/wing-it` cuts 30 seconds of Blender Studio's open movie WING IT! (CC BY 4.0) into a 9:16 video shot by shot ([below](#a-blender-open-movie-the-wing-it-example)), `examples/spin-count` uses an AI-generated 3D clip and a separate music track, both from Pixabay ([below](#a-pixabay-clip-and-track-the-spin-count-example)), and `examples/handwash-song` uses CDC's "Happy Handwashing Song", a public-domain cartoon with its own song.

The footage is the bottom layer. Everything else sits on top of it, so pick it first and check its license before you write any code. Prompts: [`prompts/00-brief.md`](../prompts/00-brief.md), then [`prompts/edit/01-assets.md`](../prompts/edit/01-assets.md).

## What makes a usable clip

- **One subject, long takes, big in frame.** The handwash example shows the clip in a card 1000 px wide. A character that fills the frame still reads at that size; a wide shot with a small figure does not. For a 16:9 film in a 9:16 frame, each shot needs a subject that fits a narrow window ([below](#a-blender-open-movie-the-wing-it-example)).
- **Clean picture.** Burned-in captions, watermarks and logos compete with your overlays. You can crop a strip off one edge. Anything in the middle of the frame stays.
- **Clear vocals, if the clip carries the song.** Word timings come from transcribing the audio ([06-word-timing.md](06-word-timing.md)). Music over the voice makes that harder.
- **A license you can verify** that allows editing and sharing the result.

## Where to find footage you may use

| Source | License | Conditions | Raw file in a public repo? |
|---|---|---|---|
| [Wikimedia Commons](https://commons.wikimedia.org), works of US federal agencies (NASA, CDC) | public domain | credit the agency; do not imply endorsement; agency logos are excluded (NASA: 14 CFR 1221); third-party material inside an agency video can still be under copyright | allowed, but we keep it out (see below) |
| Blender Studio open movies: [Tears of Steel](https://mango.blender.org/sharing/) (CC BY 3.0), [Wing It!](https://studio.blender.org/projects/wing-it/pages/licensing/) and [Spring](https://studio.blender.org/films/spring/pages/about) (CC BY 4.0); many are on Wikimedia Commons as full-length files | Creative Commons Attribution | credit `(CC) Blender Foundation \| studio.blender.org` (each film page gives its exact line), link the license and say what you changed; logos and trademarks are excluded. The Big Buck Bunny score is CC BY-NC-ND 3.0 ([peach.blender.org](https://peach.blender.org/about/)), so replace the music if you use that film | allowed with credit; the wing-it example keeps it out anyway ([below](#a-blender-open-movie-the-wing-it-example)) |
| [Prelinger Archives](https://archive.org/details/prelinger) on the Internet Archive | marked "Public Domain" | the mark is the uploader's claim; check the film's date and producer yourself | at your own judgment |
| [Pexels](https://www.pexels.com/license/) | Pexels License | free, no credit needed; do not redistribute on other stock platforms; do not show people in a bad light or imply they endorse something | no; ship a download link |
| [Pixabay](https://pixabay.com/service/license-summary/) | Pixabay Content License | free, commercial use included, no credit required; you may not sell or distribute the content "on a Standalone basis" (unedited); some music is registered with Content ID | no; ship a fetch script, share the edited video ([below](#a-pixabay-clip-and-track-the-spin-count-example)) |

The rows above summarize the license pages linked in each cell, read on 2026-10-09. Licenses change; read the page again before you publish.

## A five-minute license check

This is the check we ran for the handwash clip. The wing-it and spin-count sections below run the same five steps on a CC BY film and on Pixabay files.

1. **Read the file page.** [File:Happy_Handwashing_Song.webm](https://commons.wikimedia.org/wiki/File:Happy_Handwashing_Song.webm) says: public domain, a work of the Centers for Disease Control and Prevention. Author: CDC. Source: CDC's YouTube channel CDCStreamingHealth. Date: 3 March 2010.
2. **Look at what is inside the clip.** The melody is "Happy Birthday to You", public domain in the US since 2016 ([Wikipedia](https://en.wikipedia.org/wiki/Happy_Birthday_to_You)). The last 5.7 seconds (from 25.17 s) are an end card with song credits, `www.cdc.gov`, the HHS logo and the CDC logo.
3. **Read the publisher's reuse policy.** CDC's [Use of Agency Materials](https://www.cdc.gov/other/agencymaterials.html) page asks you to credit CDC, not to imply endorsement, and not to use the CDC logo; it also warns that some CDC materials were made by contractors or licensed from third parties. (cdc.gov refused connections from our machine. This summary comes from our research notes because we could not read the page ourselves, so open it yourself.)
4. **Write the credit into the video.** Our last overlay line reads: `Footage & song: CDC "Happy Handwashing Song", public domain. Edit: HTML + GSAP, rendered with HyperFrames.`
5. **Decide what goes into git.** A public-domain tag on Commons is the uploader's statement and does not amount to legal advice. This repo commits no CDC media. `scripts/fetch-assets.mjs` downloads the clip and cuts it locally, and `.gitignore` keeps `examples/*/assets/*.mp4`, `*.webm` and `*.mp3` out. GitHub also limits file sizes: a warning above 50 MiB, a hard block above 100 MiB, and 25 MiB for files added in the browser ([GitHub docs](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)).

About the end card: our crop removes most of the logo row, and the footage card hides a little more. Part of the CDC logo is still visible in the final 5.6 seconds of our render. It stays inside the original clip as part of its credits. Do not use that frame as a thumbnail, avatar or cover. The preview GIF and the still in `docs/img/` are taken from before 25.17 s for that reason ([08-render-and-qa.md](08-render-and-qa.md#8-a-preview-gif-and-a-still)). To remove the logos entirely, stop reading the source at 25.1 s and hold the last cat frame until the end (tested, gives 30.9 s and 927 frames). Run it from `examples/handwash-song`, after `npm run fetch` has downloaded the source:

```bash
ffmpeg -y -t 25.1 -i assets/Happy_Handwashing_Song.webm -an \
  -vf "crop=522:322:0:0,scale=1088:-2:flags=lanczos,fps=30,tpad=stop_mode=clone:stop_duration=5.8" \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -g 30 -keyint_min 30 \
  assets/cat.mp4
```

`-t` goes before `-i` so it limits the input; after `-i` it would cut the padded output back to 25.1 s. This replaces `assets/cat.mp4`; `npm run fetch -- --force` (from the repo root) restores the original.

## The example clip, probed

```bash
# from examples/handwash-song
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,sample_rate,channels -of compact assets/Happy_Handwashing_Song.webm
```

| Property | Value |
|---|---|
| Video | VP8, 522x360, 30 fps |
| Audio | Vorbis, 44.1 kHz, mono |
| Duration | 30.885 s |
| Burned-in captions | bottom 38 px, line by line ("Scrub with soap and water,") |
| Original upload | [upload.wikimedia.org/.../Happy_Handwashing_Song.webm](https://upload.wikimedia.org/wikipedia/commons/b/b9/Happy_Handwashing_Song.webm), 2.9 MB |

## Why we crop the captions

The karaoke layer prints every word in 88 px type and lights it up when it is sung. CDC's captions show the same words, smaller, one line at a time. Two copies of the lyrics on screen at once read as noise, so the bottom strip goes.

To find the strip, grab a frame and look at it:

```bash
# from examples/handwash-song
ffmpeg -ss 10 -i assets/Happy_Handwashing_Song.webm -frames:v 1 frame.png
```

In this clip the captions occupy rows 322 to 359, so `crop=522:322:0:0` keeps the top 322 rows. (`cropdetect` finds black bars only. It will not find captions.)

## The preprocessing, flag by flag

These are the two commands `npm run fetch` runs (from `scripts/fetch-assets.mjs`), written as you would type them in `examples/handwash-song`. Running them by hand replaces the files the script made.

```bash
# picture only -> assets/cat.mp4 (1088x672)
ffmpeg -y -i assets/Happy_Handwashing_Song.webm -an \
  -vf "crop=522:322:0:0,scale=1088:-2:flags=lanczos,fps=30" \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p \
  assets/cat.mp4

# sound only -> assets/song.mp3 (30.89 s)
ffmpeg -y -i assets/Happy_Handwashing_Song.webm -vn \
  -ac 2 -ar 44100 -c:a libmp3lame -q:a 2 \
  assets/song.mp3
```

| Flag | Why |
|---|---|
| `-an` | The video file carries picture only. The song goes into the composition as its own `<audio id="song">`, and the `<video>` is `muted`. HyperFrames lint requires every `<video>` to be `muted` or to declare `data-has-audio` ([HTML schema](https://hyperframes.heygen.com/reference/html-schema)). |
| `crop=522:322:0:0` | Drops the 38 px caption strip (see above). |
| `scale=1088:-2:flags=lanczos` | The source is 522 px wide and the card is 1000 px wide, about 2x. Lanczos keeps the cartoon's black outlines sharp at that factor. Scaling once in ffmpeg means the browser only scales down slightly at render time (1088 to 1000). 1088 and not 1080, because the width must be a multiple of 16: HyperFrames extracts video frames through a yuv420p to gbrp conversion that, in our ffmpeg 8.1.2 build, blacks out every column after the last multiple of 16, and a 1080-wide clip showed a dark band at the card's right edge ([08-render-and-qa.md](08-render-and-qa.md#5-fix-the-right-edge)). `-2` picks the height that keeps the aspect ratio and is an even number, which `yuv420p` H.264 requires: 672. |
| `fps=30` | The composition renders at 30 fps (the HyperFrames default when there is no `data-fps`). Matching rates maps each output frame to one source frame. This clip is already 30 fps; the filter matters for 25 or 29.97 fps sources. |
| `-c:v libx264 -crf 16 -preset slow` | High quality for a 31-second upscale. The file is 4.4 MB. |
| `-pix_fmt yuv420p` | The pixel format every browser and player decodes. |
| `-vn -ac 2` | Audio only, mono copied to two channels. |
| `-ar 44100` | Keeps the source rate. Writing the rate down makes the output rate a fact you can check. |
| `-c:a libmp3lame -q:a 2` | Variable-bitrate MP3, about 90 kbps for this content. HyperFrames re-encodes the final mix to AAC anyway. |

**The aspect ratio decides the card size.** After the crop the clip is 522x322, a ratio of 1.621. The card in the composition is 1000x617, also 1.621, so `object-fit: cover` cuts off almost nothing. Set the card from the clip's ratio. Picking a card size first and cropping the clip to fit throws away picture.

**Add keyframes for your own clips.** Our render printed this warning:

```
[WARN] [Compiler] WARNING: Video "footage" has sparse keyframes (max interval: 8.33s). This causes seek failures and frame freezing.
```

x264's default keyframe interval is 250 frames, 8.33 s at 30 fps. Our `cat.mp4` has keyframes at 0, 2.03, 10.37, 18.70, 19.80, 23.30 and 25.17 s. We compared the motion in a patch of the card in the final render against the same patch of the source and found no frozen stretches, so the example shipped as is. For your own clips, put a keyframe every second; it costs nothing:

```bash
ffmpeg -y -i input.webm -an \
  -vf "crop=...,scale=1088:-2:flags=lanczos,fps=30" \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p \
  -g 30 -keyint_min 30 -movflags +faststart \
  assets/footage.mp4
```

## A Pixabay clip and track: the spin-count example

`examples/spin-count` takes its footage and its music from Pixabay. The checks were the same five steps as above, with different answers.

1. **Read both pages.** [Video 313047](https://pixabay.com/videos/boy-child-kid-childhood-dancing-313047/), "Boy, Child, Kid", uploaded by TonyDias7 on 2025-10-31, 2160x3840 at 24 fps, labelled "AI generated" and tagged "3d". [Music 158822](https://pixabay.com/music/happy-childrens-tunes-funny-dancing-kids-158822/), "Funny Dancing Kids" by AudioCoffee, 2:06. Both say "Free for use under the Pixabay Content License".
2. **Read the license.** The [summary](https://pixabay.com/service/license-summary/) and the [full terms](https://pixabay.com/service/terms/) (last updated 2024-11-18), read on 2026-10-09: free use and modification, commercial use included, no credit required. Not allowed: selling or distributing the content "on a Standalone basis", meaning with no creative effort applied, left in substantially the form it has on Pixabay, including through a stock media platform. The full terms also prohibit bulk or systematic copying and automated data collection by programs or robots for unauthorised purposes. [examples/spin-count/CREDITS.md](../examples/spin-count/CREDITS.md) has the details.
3. **Look at what else is on the pages.** The music page shows "Content ID Registered": a video with this track uploaded to a platform that runs Content ID, such as YouTube, can get a claim (we have not tested an upload). Its uploader also asks to be credited in the video description, with a credit line and a link given on the page. The video page lists related clips by other uploaders, which is the likely way our first credit line went wrong: it named the uploader of some of the related clips instead of TonyDias7, who uploaded this one. Copy the name from the author box next to the Download button.
4. **Write the credit into the video.** `Footage: TonyDias7 / Pixabay · Music: AudioCoffee / Pixabay · Edit: HTML + GSAP, rendered with HyperFrames`. The license does not require it; it tells viewers where the material came from.
5. **Decide what goes into git.** Nothing from Pixabay as is: `scripts/fetch-spin-assets.mjs` downloads the two files (52,467,610 and 4,026,618 bytes, both size- and sha256-checked) into `assets/source/`, and `.gitignore` keeps them and everything cut from them out. The edited render, with the overlays on it, is shared as a release asset. The script sends a descriptive User-Agent and `Referer: https://pixabay.com/`; in our test the CDN served both files to a plain request too. If you would rather not script the download, use the Download buttons on the two pages and save the files under the names the script prints in `--help`; the script then uses your copies.

### The preprocessing

```bash
# from examples/spin-count: picture only -> assets/boy.mp4 (1080x1920, 30 fps, 19.667 s)
ffmpeg -y -i assets/source/313047_large.mp4 -an \
  -vf "scale=1080:1920:flags=lanczos,setpts=PTS/0.85,fps=30" \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p assets/boy.mp4

# the first 22 s of the track -> assets/music_cut.mp3
ffmpeg -y -i assets/source/funny-dancing-kids-158822.mp3 -vn -t 22 \
  -ac 2 -ar 44100 -c:a libmp3lame -q:a 2 assets/music_cut.mp3
```

| Flag | Why |
|---|---|
| `scale=1080:1920:flags=lanczos` | The clip is 2160x3840, exactly 2x the frame. Lanczos keeps the hair and the sweater texture sharp on the way down. The footage fills the whole frame, so there is no card and no crop. |
| `setpts=PTS/0.85` | Stretches every timestamp by 1/0.85, which plays the clip at 0.85x: 16.708 s becomes 19.667 s. Marks read in the source must be divided by 0.85 too. |
| `fps=30` | Resamples 24 fps to the composition's 30 fps after the slow-down: 401 source frames become 590 frames, with some repeated. |
| `-crf 16 -preset slow` | The same quality as the other example. On this grainy source the file is 36,389,330 bytes for 19.7 s; the encode took 40 to 44 s here. |
| `-an`, `-vn` | The clip has no audio track anyway; the music goes in as its own `<audio id="music">`. |
| `-t 22` | The composition is 21.5 s long; 22 s leaves half a second spare. |

**Width.** `boy.mp4` is 1080 wide, not a multiple of 16, so HyperFrames' frame extraction blacks out its columns 1072 to 1079 ([08-render-and-qa.md](08-render-and-qa.md#5-fix-the-right-edge)). Because the footage fills the frame, those are the same columns as the render's own strip, and the edge fix covers both. For new full-frame footage, encode 1088 wide and let `object-fit: cover` crop 4 px from each side.

**Reproducible.** Both encodes of `boy.mp4` by the fetch script on this machine, and its `music_cut.mp3`, came out byte for byte identical to the files the posted video was rendered from. x264 gives the same bytes for the same input and settings on one machine; other ffmpeg builds may not.

## A Blender open movie: the wing-it example

`examples/wing-it` takes 30 seconds of WING IT!, Blender Studio's 2023 open movie, in which a cat and a dog fly a home-made rocket, and turns them into a 9:16 video with the film's own sound. The license check is the same five steps.

1. **Read the pages.** The [licensing page](https://studio.blender.org/projects/wing-it/pages/licensing/) says the project's work "is licensed under the Creative Commons Attribution 4.0 license", that this "includes all the data we publish on this website", and gives the attribution as `(CC) Blender Foundation | studio.blender.org`. The [Commons file page](https://commons.wikimedia.org/wiki/File:WING_IT!_-_Blender_Open_Movie-full_movie.webm) gives CC BY 4.0, Blender Studio as the author, and 12 September 2023 as the date. The file is VP9 1920x1080 at 24 fps with Opus 48 kHz stereo, 237.948 s, 36,196,718 bytes.
2. **Read the license.** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): you may share and adapt the work for any purpose, commercial use included, as long as you credit the creator, link the license, say that you changed it, and do not suggest endorsement. The licensing page excludes all logos and trademarks.
3. **Look inside the clip.** The 30 seconds used (film 1:22 to 1:52) show no logo. They do carry a shouted swear at film 1:42 to 1:44, which the example turns down (below).
4. **Write the credit into the video.** `WING IT! (CC BY 4.0) Blender Foundation, studio.blender.org · Edit: HTML + GSAP, rendered with HyperFrames`, and the full attribution with the license link in the post that carries the video ([examples/wing-it/CREDITS.md](../examples/wing-it/CREDITS.md)).
5. **Decide what goes into git.** CC BY 4.0 would allow committing the film and the cut. The repo keeps them out anyway, like every other media file: `scripts/fetch-wing-assets.mjs` downloads the original from Commons with a descriptive User-Agent, checks its size and sha256, and cuts it on your machine.

### A 9:16 cut, shot by shot

A 16:9 frame is about three 9:16 windows wide, so one fixed crop loses the subject whenever it moves. The example cuts the film at its own shot changes and gives every shot its own crop.

**Find the shot changes.** ffmpeg's scene score lists the candidates in about two seconds:

```bash
# from examples/wing-it, after npm run fetch:wing; times are seconds after 82.0
ffmpeg -ss 82 -t 30 -i assets/source/WING_IT_-_Blender_Open_Movie-full_movie.webm -an \
  -vf "select='gt(scene,0.25)',showinfo" -f null - 2>&1 | grep -oE "pts_time:[0-9.]+"
# pts_time:2.042  pts_time:3.5  pts_time:6.583  pts_time:7.625  pts_time:12.208  pts_time:17.625
# pts_time:19  pts_time:20  pts_time:22.292  pts_time:25  pts_time:28.833
```

At 0.25 that gives exactly the 11 cuts inside the window, at film 84.04, 85.5, 88.58, 89.62, 94.21, 99.62, 101.0, 102.0, 104.29, 107.0 and 110.83 s. At 0.3 it misses the cut to the rocket in the barn (85.5 s, score 0.299), and lower thresholds add moments inside a shot. Treat the list as candidates and check each one on a contact sheet ([06-word-timing.md](06-word-timing.md#story-events-stepping-through-frames)).

**Pick a crop per shot.** The window is 608x1080, the 9:16 slice of a 1080 px tall frame (1080 x 9 / 16 = 607.5, rounded to an even 608). For each shot, look at a frame and write where its subject sits as a fraction of the frame width, `center_x`. The left edge of the window is then `x = clamp(center_x * 1920 - 304, 0, 1312)`, so a window never runs off the frame. [`shots.json`](../examples/wing-it/shots.json) holds all 12 shots with film start, film end, `center_x`, the resulting `x` and what each shot shows. Shot 1:

```
[0:v]trim=start=82.0:end=84.04,setpts=PTS-STARTPTS,crop=608:1080:617:0,scale=1080:1920:flags=lanczos,fps=30,setsar=1[v0];
```

**Keep a wide shot wide.** In shot 11 (film 107.0 to 110.83 s) the hull throws seven gadgets across the whole width of the frame, and any 9:16 window would cut most of them off. That shot stays 16:9, as a card in the middle of the frame over a blurred, darkened copy of itself:

```
[0:v]trim=start=107.0:end=110.83,setpts=PTS-STARTPTS,split[w10a][w10b];
[w10a]scale=-2:1920,crop=1080:1920,boxblur=20:2,eq=brightness=-0.12[bg10];
[w10b]scale=1080:608:flags=lanczos[fg10];
[bg10][fg10]overlay=0:656,fps=30,setsar=1[v10];
```

`scale=-2:1920,crop=1080:1920` scales the copy to cover the frame, `boxblur=20:2` and `eq=brightness=-0.12` push it back, and the sharp 1080x608 card sits at y 656, which centers it ((1920 - 608) / 2).

**Join the shots.** The 12 chains end in `concat=n=12:v=1:a=0[vout]`, encoded with `-c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p`: 29.967 s, 899 frames. `scripts/fetch-wing-assets.mjs` builds the whole filter graph from `shots.json` and prints the command, so a change to a shot is a change to that file plus `npm run fetch:wing -- --force`.

| Flag | Why |
|---|---|
| `trim=start=..:end=..,setpts=PTS-STARTPTS` | cuts one shot out of the film by film time and restarts its timestamps at 0, so the shots join end to end |
| `crop=608:1080:<x>:0` | the 9:16 window for that shot |
| `scale=1080:1920:flags=lanczos` | 1.78x up to the frame size; Lanczos keeps the film's outlines sharp |
| `fps=30` | the film is 24 fps; the composition renders at 30, so some frames repeat |
| `setsar=1` | square pixels on every chain, which `concat` requires |
| no `-g` | x264's default keyframes, as in the file the posted video was rendered from (17 keyframes, up to 4.67 s apart); for new footage add `-g 30 -keyint_min 30` |

**Width.** `wing_v.mp4` is 1080 wide, not a multiple of 16. As in spin-count, the footage fills the frame, so HyperFrames' black band falls on the render's own strip at x 1072 to 1079 and the edge fix covers both ([08-render-and-qa.md](08-render-and-qa.md#5-fix-the-right-edge)). For new full-frame footage, encode 1088 wide.

### Turning down a swear, and the sound

The sound is the film's own, from 82.0 s, 32.5 s long: the 30 s of footage plus 2.5 s for the outro over the last frame.

```bash
# from examples/wing-it
ffmpeg -y -ss 82 -t 32.5 -i assets/source/WING_IT_-_Blender_Open_Movie-full_movie.webm -vn \
  -af "volume=enable='between(t,19.8,22.3)':volume=0.12,afade=t=out:st=31.0:d=1.5" \
  -ac 2 -ar 48000 -c:a libmp3lame -q:a 2 assets/wing_a.mp3
```

- `volume=enable='between(t,19.8,22.3)':volume=0.12` plays 19.8 to 22.3 s of the cut (film 101.8 to 104.3 s), where a character shouts a swear, at 12 percent, about -18 dB. It is quieter, not gone. Set `volume=0` to mute the stretch, or replace it with other sound. `t` counts from the start of the cut because `-ss` sits before `-i`.
- `afade=t=out:st=31.0:d=1.5` fades the last 1.5 s, so the sound ends with the video instead of mid-scene.
- `-ar 48000` keeps the film's own rate. Probe it anyway.

### The last frame as a still

The footage ends at 29.967 s and the video at 32.5 s. The outro sits on the footage's last frame, saved as an image and shown with an `<img>` when the `<video>` ends:

```bash
ffmpeg -y -sseof -0.05 -i assets/wing_v.mp4 -frames:v 1 assets/last.jpg
```

`-sseof -0.05` seeks to 0.05 s before the end of the file, and `-frames:v 1` keeps one frame. In our run the script made `wing_v.mp4`, `wing_a.mp3` and `last.jpg` byte for byte identical to the files the posted video was rendered from, in 51 s (download 6.3 s, footage encode 43.4 s).

## Always probe sample rate and duration

An older in-house video tool on our machine had a step with a hard-coded 44100 Hz default. Fed a 48 kHz source, it wrote 48 kHz samples into a file labeled 44.1 kHz. The voice ran 8.8 percent longer (48000 / 44100 = 1.088), which is about 8 percent slower, and drifted further from the picture every second. Nothing crashed or warned. The audio simply ran longer than the video, which `ffprobe` shows in one line.

The rule for this repo: probe every input and every output, and compare durations. Never assume 44.1 kHz.

```bash
npm run probe
# or for any files:
node scripts/probe.mjs path/to/footage.mp4 path/to/song.mp3 path/to/render.mp4
```

Our output (`npm run probe`, after `npm run render`):

```
file                                                  video       size  fps  frames  audio  sample_rate  ch  duration   v_dur   a_dur
----------------------------------------------------  -----  ---------  ---  ------  -----  -----------  --  --------  ------  ------
examples/handwash-song/assets/cat.mp4                  h264   1088x672   30     925      -            -   -    30.833  30.833       -
examples/handwash-song/assets/song.mp3                    -          -    -       -    mp3        44100   2    30.893       -  30.893
examples/handwash-song/renders/handwash-song.raw.mp4   h264  1080x1920   30     924    aac        48000   2    30.800  30.800  30.800
examples/handwash-song/renders/handwash-song.mp4       h264  1080x1920   30     924    aac        48000   2    30.800  30.800  30.800
```

The render's audio is 48 kHz because HyperFrames resamples the mix. That is a real resample: the duration stays 30.800 s, equal to the video. The script warns when a sample rate is neither 44.1 nor 48 kHz, when the video and audio streams of one file differ by more than 0.1 s, and when the files differ in length from each other. Plain ffprobe works too:

```bash
ffprobe -v error -show_entries stream=codec_type,sample_rate,channels,duration:format=duration -of compact file.mp4
```

## Checklist for a new clip

1. Read the license page and look inside the clip for music, logos, people, swearing and stock inserts.
2. Probe it: size, fps, sample rate, duration.
3. Find burned-in text and decide the crop.
4. Scale to a width that is a multiple of 16 (1088 for a 1000 px card or a full 1080 px frame) with Lanczos, 30 fps, keyframe every 30 frames, no audio. For a 16:9 film in a 9:16 video, cut at the shot changes and crop each shot on its own.
5. If the clip carries the song, extract the audio separately and probe it again.
6. Size the footage card from the cropped aspect ratio.
7. Keep the raw and derived media out of git; ship a fetch script and a credit line.
