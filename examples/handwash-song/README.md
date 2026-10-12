# handwash-song

Karaoke over CDC's "Happy Handwashing Song", a public-domain cartoon in which a cat washes its paws while singers perform a four-line verse to the tune of Happy Birthday, twice through. Every word lights up when it is sung, the four action words fly into a board, and a timer counts the seconds of singing. The idea in one line: count the 20 seconds the song takes.

| | |
|---|---|
| Video | [handwash-song.mp4](https://github.com/helicerat/cuecut/releases/download/v0.1.0/handwash-song.mp4), 30.8 s, 1080x1920, 30 fps, with sound |
| Source | CDC "Happy Handwashing Song", public domain |
| Timed by | word timestamps, aligned to the lyrics |
| Pipeline steps | 1 and 5 to 7 (idea, timings, edit, render); steps 2 to 4 are replaced by the cartoon |

## Rebuild

You need Node 22 or newer, ffmpeg and ffprobe on PATH, and network access on the first run (npm, Wikimedia Commons, jsDelivr, Google Fonts and the Chrome download). The transcription output is committed, so no API key is needed.

One-time setup, from the repo root:

```bash
export HYPERFRAMES_NO_TELEMETRY=1          # PowerShell: $env:HYPERFRAMES_NO_TELEMETRY = "1"
npx hyperframes@0.8.143 browser ensure     # downloads Chrome Headless Shell
```

Then:

```bash
npm run fetch     # download the CDC clip and GSAP, make cat.mp4 and song.mp3
npm run align     # whisper_verbose.json + lyrics.txt -> transcript.json
npm run build     # template + transcript -> index.html
npm run lint      # expect 0 errors, 2 warnings
npm run render    # render, then fix the right edge -> examples/handwash-song/renders/handwash-song.mp4
```

The render and the edge fix take about a minute and a half. The two lint warnings, `nested_structure_needs_subcomposition`, are harmless for a single-file composition.

- **The right edge.** `render` runs `scripts/fix-right-edge.mjs` after HyperFrames, which repairs the 8 px black strip that ffmpeg 8.1.2 leaves at the right edge ([details](../../docs/08-render-and-qa.md#5-fix-the-right-edge)). With no strip it copies the file unchanged.
- **Preview rewrites `index.html`.** `npm run preview` opens HyperFrames Studio (Ctrl+C to stop; if it runs in the background, add `--stop` to the same command). Studio writes `data-hf-id` attributes into `index.html`, so run `npm run build` afterwards and check `git diff` before you commit. The template, `build/index.template.htm`, is safe because Studio only scans `*.html` files.
- **Proxy.** Set `NODE_USE_ENV_PROXY=1` so Node's built-in `fetch` uses `HTTPS_PROXY`.

<details>
<summary>The commands behind the npm scripts</summary>

```bash
node scripts/fetch-assets.mjs examples/handwash-song
node scripts/align-lyrics.mjs examples/handwash-song
node scripts/build.mjs examples/handwash-song
npx hyperframes@0.8.143 lint examples/handwash-song
npx hyperframes@0.8.143 render examples/handwash-song -q delivery -o examples/handwash-song/renders/handwash-song.raw.mp4
node scripts/fix-right-edge.mjs examples/handwash-song/renders/handwash-song.raw.mp4 examples/handwash-song/renders/handwash-song.mp4
```

</details>

## How the timings were made

1. **Lyrics.** [`lyrics.txt`](lyrics.txt) holds the words as sung, 8 lines, taken from the captions burned into the source video.
2. **Transcription.** Groq `whisper-large-v3` returned 39 words with timestamps, saved raw as [`assets/whisper_verbose.json`](assets/whisper_verbose.json). It heard "and sell" for "hands well" on both passes, and an extra "you" at 30.16 s after the music ended.
3. **Alignment.** `scripts/align-lyrics.mjs` keeps the timings and takes the words from `lyrics.txt`. The result is [`transcript.json`](transcript.json): 38 words, first word at 2.98 s, last word ending at 24.48 s.
4. **Build.** `scripts/build.mjs` inlines the transcript into the template. Every time on screen is a fixed intro time or a word's `start` or `end` plus an offset.

To redo the transcription, set `GROQ_API_KEY` and run the command below before `npm run align`. It uploads `song.mp3` to Groq and overwrites the committed `whisper_verbose.json`; without `--force` the script refuses to replace an existing file.

```bash
node scripts/transcribe-groq.mjs examples/handwash-song/assets/song.mp3 examples/handwash-song/assets/whisper_verbose.json --force
```

Method and alternatives: [docs/06-word-timing.md](../../docs/06-word-timing.md).

## What happens on screen

All times come from `transcript.json`, except the intro, which runs before the first sung word.

| Time (s) | Event |
|---|---|
| 0.05 to 1.7 | kicker "THE 20-SECOND RULE", headline "Sing it twice. That's 20 seconds." revealed word by word, footage card, timer ring and four empty board slots come in |
| 1.93 | giant "1" and "first time through" (1.05 s before the first word) |
| 2.98 | first sung word "Wash": timer starts, "WASH" pops over the footage and flies into slot 1 |
| 8.70 / 9.52 / 10.44 | "SCRUB", "SOAP", "WATER" fly into slots 2 to 4 |
| 13.61 | giant "2" and "second time through" (0.75 s before the second pass) |
| 14.36 / 19.72 / 20.48 / 21.42 | each slot gets an "x2" badge when its word is sung again |
| 24.48 | last word ends, timer stops at 21 (21.5 s of singing, shown rounded down) |
| 25.08 | outro "2 times through / 21 seconds of singing" |
| 25.16 | music stops, and the source cuts to its credits card (scene cut at 25.17) |
| 30.8 | end |

Through the whole song, one lyric line is on screen at a time; each word darkens and scales up at its start and a soap bubble pops above it. A progress bar runs across the full 30.8 s.

## Files

| Path | In git | What it is |
|---|---|---|
| `lyrics.txt` | yes | the lyric as sung, 8 lines, taken from the captions burned into the source video |
| `assets/whisper_verbose.json` | yes | raw Groq `whisper-large-v3` output with word timestamps |
| `transcript.json` | yes | 38 aligned words `[{text,start,end,heard?}]`, made by `scripts/align-lyrics.mjs` |
| `build/index.template.htm` | yes | the composition, 216 lines; the file to edit (`.htm` so that HyperFrames Studio does not rewrite it) |
| `index.html` | yes | generated by `scripts/build.mjs` (transcript inlined); do not edit |
| `assets/cat.mp4`, `assets/song.mp3`, `assets/gsap.min.js`, the source `.webm` | no | made by `scripts/fetch-assets.mjs` |
| `renders/`, `snapshots/` | no | `renders/handwash-song.raw.mp4` from HyperFrames, `renders/handwash-song.mp4` after the edge fix |
| `CREDITS.md` | yes | sources, licenses, song credits |

<details>
<summary>Media specs</summary>

| | |
|---|---|
| Source | [Commons file](https://commons.wikimedia.org/wiki/File:Happy_Handwashing_Song.webm): 522x360 VP8 30 fps, Vorbis 44.1 kHz mono, 30.885 s, 2,938,051 bytes; captions burned into the bottom 38 px |
| `assets/cat.mp4` | crop 522x322 from the top, scaled to 1088x672 (lanczos; the width is a multiple of 16), H.264 CRF 16, 30 fps, no audio, 30.83 s, 925 frames, 4,425,784 bytes |
| `assets/song.mp3` | MP3 stereo 44.1 kHz, 30.89 s, 350 KB |
| Composition | 1080x1920, 30 fps, `data-duration` 30.8 s, 924 frames, GSAP 3.14.2 |
| Raw render | H.264 1080x1920 30 fps plus AAC 48 kHz stereo, 30.800 s, 924 frames, about 9.7 MB; an 8 px black strip at x 1072 to 1079 in every frame |
| Edge fix | `--mode auto` finds a flat page next to the strip and fills it with `#f2ece4`, the page color as the render encodes it. `--mode smear` would stretch the "x2" badge into a blue bar at the edge for 3 frames around 21.6 s |
| Final file | `handwash-song.mp4`: 924 frames, 30.800 s, audio copied, about 7 MB |
| Sync check | music stops at 25.160 s in both `song.mp3` and the final render (`ffmpeg -i <file> -vn -af silencedetect=n=-35dB:d=0.25 -f null -`; the time depends on the threshold) |
| Determinism | two renders differ invisibly in some frames (lowest PSNR 51.6 dB); decoded audio is identical |
| Preview | `docs/img/demo.gif`: 1.8 s to 9.5 s of the render, 360x640, 20 fps, 154 frames. `docs/img/hero.png`: frames at 3.4, 9.1 and 22.3 s, 1248x712 |

</details>

## Known issues

- **`check` fails on contrast.** `npx hyperframes@0.8.143 check examples/handwash-song` flags the timer label ("SECONDS", 3.72:1) and the credit line (2.64:1), below WCAG AA's 4.5:1. It also warns about the grey unlit words (by design) and about two lyric lines overlapping for a fraction of a second while one fades out and the next fades in. `lint` passes.
- **Sparse keyframes.** `cat.mp4` is encoded without a fixed keyframe interval, and the HyperFrames compiler warns about sparse keyframes (max interval 8.33 s). ffmpeg `freezedetect` on the footage region of the render finds the same still stretches as `cat.mp4` itself, so nothing freezes. For your own footage, add `-g 30 -keyint_min 30`.
- **The footage is 1088 wide on purpose.** HyperFrames runs the same buggy ffmpeg conversion on the footage when it extracts frames. A 1080-wide `cat.mp4` gets a dark band at x 1033 to 1039, the right edge of the footage card.
- **The CDC and HHS logos appear at the end.** From 25.17 s the source shows its credits card with both logos, and it stays visible in the footage card during the outro. The preview GIF and still in `docs/img/` stop before it. See [CREDITS.md](CREDITS.md).

## Make your own

Use the prompts in [`prompts/`](../../prompts/README.md) or the [`character-video`](../../skills/character-video/SKILL.md) skill, with your own footage and song or with a generated character. For a video without words, timed to visible moments and the beat, start from [`spin-count`](../spin-count/README.md). How the layers of this edit work: [docs/07-the-edit.md](../../docs/07-the-edit.md#the-handwash-song-edit).

## Credits

Footage and song: CDC "Happy Handwashing Song", public domain. Not endorsed by CDC or HHS. Details and what may be shared: [CREDITS.md](CREDITS.md).
