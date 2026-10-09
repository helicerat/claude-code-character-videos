# handwash-song

A 30.8 second vertical video (1080x1920, 30 fps). The footage and song are CDC's "Happy Handwashing Song", a public-domain cartoon in which a cat washes its paws while singers perform a four-line verse to the tune of Happy Birthday, twice through. Everything on top of the footage is an edit written as HTML + GSAP in one file and rendered to MP4 with HyperFrames 0.8.143.

Every word lights up when it is sung, and the four action words fly into a board. This example was made without generation credits, so it skips steps 2 to 4 of the pipeline (character, song, animation) and uses existing public-domain footage instead. Step 1, the idea, was a one-liner: count the 20 seconds the song takes. Steps 5 to 7 (word timings, the edit, the render) run in full. The transcription output is committed, so reproducing it costs nothing.

## Reproduce

You need Node 22 or newer, ffmpeg and ffprobe on PATH, and network access on the first run (npm for HyperFrames, Wikimedia Commons, jsDelivr, Google Fonts, and the Chrome download).

One-time setup, from the repo root:

```bash
export HYPERFRAMES_NO_TELEMETRY=1          # PowerShell: $env:HYPERFRAMES_NO_TELEMETRY = "1"
npx hyperframes@0.8.143 browser ensure     # downloads Chrome Headless Shell
```

Then six commands (the same as `npm run fetch`, `align`, `build`, `lint` and `render`):

```bash
node scripts/fetch-assets.mjs examples/handwash-song    # download the CDC clip and GSAP, make cat.mp4 + song.mp3, probe
node scripts/align-lyrics.mjs examples/handwash-song    # whisper_verbose.json + lyrics.txt -> transcript.json
node scripts/build.mjs examples/handwash-song           # template + transcript -> index.html
npx hyperframes@0.8.143 lint examples/handwash-song     # expect 0 errors, 2 warnings
npx hyperframes@0.8.143 render examples/handwash-song -q delivery -o examples/handwash-song/renders/handwash-song.raw.mp4
node scripts/fix-right-edge.mjs examples/handwash-song/renders/handwash-song.raw.mp4 examples/handwash-song/renders/handwash-song.mp4
```

The last command repairs an 8 px black strip at the right edge that every render on our machine has, from an FFmpeg 8.1.2 conversion bug that HyperFrames triggers ([docs/08-render-and-qa.md](../../docs/08-render-and-qa.md#5-fix-the-right-edge)). With no strip it copies the file unchanged.

To watch it in the browser instead of rendering: `npx hyperframes@0.8.143 preview examples/handwash-song` (Ctrl+C to stop; if it runs in the background, add `--stop` to the same command). Studio writes `data-hf-id` attributes into `index.html` when it opens the project, so run `node scripts/build.mjs examples/handwash-song` afterwards to regenerate it, and check `git diff` before you commit. The template, `build/index.template.htm`, is not touched because Studio only scans `*.html` files.

`assets/whisper_verbose.json` is committed, so step 2 works without an API key. To redo the transcription yourself, set `GROQ_API_KEY` and run this before step 2. It uploads `song.mp3` to Groq and overwrites the committed `whisper_verbose.json`; without `--force` the script refuses to replace an existing file.

```bash
node scripts/transcribe-groq.mjs examples/handwash-song/assets/song.mp3 examples/handwash-song/assets/whisper_verbose.json --force
```

Behind a proxy, set `NODE_USE_ENV_PROXY=1` so Node's built-in `fetch` uses `HTTPS_PROXY` (tested on Node 24.18.0; older Node 22 releases may not support it).

## What happens on screen

All times below come from `transcript.json`, except the intro, which runs before the first sung word.

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
| `build/index.template.htm` | yes | the composition; the file to edit (`.htm` so that HyperFrames Studio does not rewrite it) |
| `index.html` | yes | generated by `scripts/build.mjs` (transcript inlined); do not edit |
| `assets/cat.mp4`, `assets/song.mp3`, `assets/gsap.min.js`, the source `.webm` | no | made by `scripts/fetch-assets.mjs` |
| `renders/`, `snapshots/` | no | outputs: `renders/handwash-song.raw.mp4` (HyperFrames), `renders/handwash-song.mp4` (after the edge fix) |
| `CREDITS.md` | yes | sources, licenses, song credits |

## The numbers

| | |
|---|---|
| Source | [Commons file](https://commons.wikimedia.org/wiki/File:Happy_Handwashing_Song.webm): 522x360 VP8 30 fps, Vorbis 44.1 kHz mono, 30.885 s, 2,938,051 bytes; captions burned into the bottom 38 px |
| `assets/cat.mp4` | crop 522x322 from the top, scaled to 1088x672 (lanczos; the width is a multiple of 16, see Known issues), H.264 CRF 16, 30 fps, no audio, 30.83 s, 925 frames, 4,425,784 bytes |
| `assets/song.mp3` | MP3 stereo 44.1 kHz, 30.89 s, 350 KB |
| Transcription | Groq `whisper-large-v3`, word timestamps: 39 words. Heard "and sell" for "hands well" on both passes, and an extra "you" at 30.16 s after the music ended |
| Aligned transcript | 38 words, 8 lines, first word 2.98 s, last word ends 24.48 s |
| Composition | 1080x1920, 30 fps, `data-duration` 30.8 s, 924 frames, GSAP 3.14.2 |
| Composition source | `build/index.template.htm`, 216 lines |
| Lint | 0 errors, 2 warnings (`nested_structure_needs_subcomposition`, harmless for a single-file composition) |
| Render time | 64.6 s for `-q delivery` in the latest run (HyperFrames' summary line, drawElement capture, all four self-checks passed at 52.6, 49.8, 49.0 and 49.0 dB), 86.8 s wall clock for all of `npm run render`; 55.3 s for a second render with the extracted frames cached. With the earlier callback counter, renders fell back to screenshot capture and took 109 to 133 s; a separate 5 s test composition took 29 s (earlier session) |
| Determinism | latest pair of delivery renders: 530 of 924 frames identical (ffmpeg framemd5), the rest (frames 92 to 249 and 264 to 499) differ invisibly, lowest PSNR 51.6 dB; decoded audio identical, 1,444 of 1,444. Earlier pairs with the callback counter: 520 to 529 of 924; two renders of the 5 s test: 150 of 150 (earlier session, files not kept) |
| Raw render | H.264 1080x1920 30 fps plus AAC 48 kHz stereo, 30.800 s, 924 frames, 9,666,279 bytes (9.67 MB), video 2.34 Mbit/s. HyperFrames prints the size in MiB (`9.2 MB`); the byte count changes by a few KB between renders (9,670,431 bytes for the second render of the pair) |
| Right-edge fix | a strip of 8 px at x 1072 to 1079 in all 5 sampled frames (mean luma 0.0). `--mode auto` measured 4 luma levels of spread in the two columns left of it, a flat page, and filled the strip with `#f2ece4`, the page color as the render encodes it; 11.7 s in the latest run, about 11 to 25 s in general. Filled columns within 3 luma levels of column 1071 in 31 frames, one per second (the card's soft shadow reaches the edge). Untouched columns 0 to 1071: 53.1 dB PSNR on average against the raw render, 48.7 dB for the worst frame; decoded audio identical. Earlier runs used `--mode smear`, which repeats column 1071 instead; it also stretched the "x2" badge into a blue bar at the edge for 3 frames around 21.6 s |
| Final file | `renders/handwash-song.mp4`: 924 frames, 30.800 s, video 1.66 Mbit/s, audio copied, 7,037,382 bytes (7.04 MB; changes by a few KB between renders) |
| Sync check | music stops at 25.160 s in both `song.mp3` and the final render (`ffmpeg -i <file> -vn -af silencedetect=n=-35dB:d=0.25 -f null -`; the time depends on the threshold); mean level -28.3 dB in both |
| Preview | `docs/img/demo.gif`: 1.8 s to 9.5 s of the smear-fixed render (it differs from the current final file only in columns 1072 to 1079), 360x640, 20 fps, 154 frames, 1,934,912 bytes. `docs/img/hero.png`: frames at 3.4, 9.1 and 22.3 s, 1248x712, 460,949 bytes |

Measured on Windows 10 Pro, Intel i7-4790 (8 threads), 16 GB RAM, GTX 1650 4 GB, Node 24.18.0, ffmpeg 8.1.2 (gyan.dev full build), hyperframes 0.8.143. On this machine HyperFrames tried its draw-element capture, passed its self-check and used it ("drawelement capture" in the summary line).

The final file is under 10 MB, GitHub's limit for video attachments on free plans ([GitHub docs](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)). The repo's README links it as a release asset and shows the GIF.

## Known issues

- `npx hyperframes@0.8.143 check examples/handwash-song` fails on contrast: the timer label ("SECONDS", 3.72:1) and the credit line (2.64:1) are below WCAG AA's 4.5:1. It also warns about the grey unlit words (by design) and about two lyric lines overlapping for a fraction of a second while one fades out and the next fades in. `lint` passes.
- `cat.mp4` is encoded without a fixed keyframe interval, and the HyperFrames compiler warns about sparse keyframes (max interval 8.33 s). ffmpeg `freezedetect` on the footage region of the render finds the same still stretches as `cat.mp4` itself, so nothing froze, but for your own footage add `-g 30 -keyint_min 30`.
- Every frame of the raw render has an 8 px black strip at the right edge (columns 1072 to 1079). It is an FFmpeg 8.1.2 bug that HyperFrames triggers: ffmpeg's x86 SIMD conversion from yuv420p to gbrp blacks out every column after the last multiple of 16, and HyperFrames converts every captured frame that way. Snapshots skip ffmpeg and do not show it. `scripts/fix-right-edge.mjs` (run by `npm run render`) repairs it.
- The same conversion runs on the footage when HyperFrames extracts its frames. With `cat.mp4` 1080 wide, the render had a dark band at x 1033 to 1039, the right edge of the footage card. `scripts/fetch-assets.mjs` now makes it 1088 wide. If your `cat.mp4` is 1080x666 from an earlier run, delete it and run `npm run fetch` again.
- From 25.17 s the source shows its credits card, which carries the CDC and HHS logos, and it stays visible in the footage card during the outro. The preview GIF and still in `docs/img/` stop before it. See `CREDITS.md`.

## Make your own

Use the prompts in [`prompts/`](../../prompts/README.md) or the [`character-video`](../../skills/character-video/SKILL.md) skill, with your own footage and song or with a generated character. For a video without words, timed to visible moments and the beat, start from [`examples/spin-count`](../spin-count/README.md). The pipeline is explained step by step in [`docs/`](../../docs/00-how-it-works.md).
