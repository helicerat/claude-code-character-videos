# 08. Render and QA

Step 7 of 7. Free: HyperFrames renders on your machine, with no per-render fee. Prompt: [`prompts/edit/05-render.md`](../prompts/edit/05-render.md). Output: the MP4, plus an optional GIF preview and still.

The loop: **lint, snapshot, preview, render, fix the right edge, probe, determinism check.** Lint and snapshots take seconds and catch most layout and timing mistakes, so run them after every change. Render when the snapshots look right.

All numbers on this page were measured on one machine: Windows 10 Pro, Intel i7-4790 (4 cores, 8 threads), 16 GB RAM, GTX 1650 4 GB, Node v24.18.0, ffmpeg 8.1.2, `hyperframes@0.8.143`.

## Setup, once

```bash
# 1. Node 22 or newer, FFmpeg on PATH
node --version
ffmpeg -version

# 2. HyperFrames telemetry off (PowerShell: $env:HYPERFRAMES_NO_TELEMETRY=1)
export HYPERFRAMES_NO_TELEMETRY=1

# 3. Chrome Headless Shell for rendering (cached in ~/.cache/hyperframes/chrome)
npx hyperframes@0.8.143 browser ensure

# 4. Check the environment
npx hyperframes@0.8.143 doctor

# 5. Media and index.html for the example
npm run fetch
npm run build
```

Pin the version (`hyperframes@0.8.143`) in every command. HyperFrames ships releases almost daily, and its docs disagree with each other in places (for example the default `--quality`); `--help` of the pinned version is the reference.

On our machine `doctor` passed Node, FFmpeg, FFprobe and Chrome, and listed four items as missing: `whisper-cpp` (optional, for local transcription), `TTS (Kokoro)` and `BGM (MusicGen)` (optional local voice and music), and `Docker`. None of them is needed to render the example.

## 1. Lint

```bash
npm run lint
# same as
npx hyperframes@0.8.143 lint examples/handwash-song
```

Our result: **0 errors, 2 warnings.**

```
⚠ ... nested_structure_needs_subcomposition [head]: <section id="head"> is a timeline element that contains nested <div id="kicker">. ...
⚠ ... nested_structure_needs_subcomposition [overlay]: <section id="overlay"> is a timeline element that contains nested <div id="ring">. ...
```

On `examples/spin-count` (`npm run lint:spin`) and `examples/wing-it` (`npm run lint:wing`) it reports 0 errors and 1 warning each, the same rule for their `#overlay` sections. These concern how HyperFrames Studio draws its timeline (one row per top-level element). The render is unaffected. The fix the linter suggests, moving each section into its own sub-composition file mounted with `data-composition-src`, would split this single-file example in three, so we left it.

The lint rules that matter most for this kind of video: `media_missing_id` (silent render), `video_missing_muted`, `gsap_css_transform_conflict`, `gsap_animates_clip_element`, `font_family_without_font_face`. `render --strict` refuses to render with lint errors.

Lint and the compiler's font fetch both read `font-family` declarations only. A font named only in the `font:` shorthand (`font: 600 26px Inter, sans-serif`) is neither fetched nor linted in 0.8.143, and the text silently falls back to the system sans-serif. Name fonts with `font-family`. The compile log shows what was resolved; for the example it reads `Injected deterministic @font-face rules for 2 requested font families` (Poppins and Inter).

`npx hyperframes@0.8.143 check examples/handwash-song` is a second, browser-based gate (runtime errors, layout, motion, contrast). On the example it exits with code 1: two contrast errors, `#ring-lbl` at 3.72:1 and `#credit` at 2.64:1 against the 4.5:1 that WCAG AA asks for, contrast warnings on the grey words that are not sung yet (by design), and `content_overlap` warnings for the fraction of a second when one lyric line fades out while the next fades in. Runtime and motion pass. These are the known issues listed in the [README](../README.md#faq-and-limits). On `examples/spin-count` it also exits with code 1, on contrast: the ten unlit pill numbers (1.89:1 to 1.95:1, grey on white until counted) and `#credit` (2.91:1). Its layout pass reports the giant numbers crossing the title as they fly and the credit line hidden under the outro card, both intended; runtime and motion pass. The run took 22 s. On `examples/wing-it` it exits with code 1 too: the chip glyphs are drawn in a transparent color until their events (by design, reported as `text_not_painted`), and contrast is short for the white tick on green (2.74:1), the RESULT label on the red card (2.07:1) and the credit line (4.27:1 at 16.25 s). Runtime and motion pass. That run took 42 s.

## 2. Snapshots

```bash
npx hyperframes@0.8.143 snapshot examples/handwash-song --at 0.9,2.3,3.6,9.1,11.3,14,20.6,26.5 --describe false
```

It writes `snapshots/frame-NN-at-Xs.png` for each time plus `snapshots/contact-sheet.jpg`, one grid image with all of them. `--end` defaults to true, so it may add an end-of-timeline frame: with the eight times above it also wrote `frame-08-at-29.876s.png`. Pass `--no-end` to capture only your times. This command took 14 s here for eight times, and 12.8 s for three times in the latest run, including npx startup. Each run replaced the PNGs from the previous run in `snapshots/`, so pass `-o <folder>` to keep a set.

Pick times from the transcript, so each snapshot lands on an event:

| Time | Event |
|---|---|
| 0.9 | intro, headline mid-reveal |
| 2.3 | giant "1" |
| 3.6 | first line, "hands" lit, bubble above it |
| 9.1 | SCRUB flying into the board |
| 11.3 | board full, karaoke on line 4 |
| 14 | giant "2" |
| 20.6 | "x2" badges arriving |
| 26.5 | outro |

```bash
# start times of words 0, 9, 19 and 28
node -e "const t=require('./examples/handwash-song/transcript.json'); console.log([0,9,19,28].map(i=>t[i].start).join(','))"
# 2.98,8.7,14.36,19.72
```

Look at the contact sheet for text that overlaps the footage, words cut off at the frame edge, wrong numbers and wrong text. Our first contact sheet caught the headline wrapping onto a third line under the footage card. A later review caught the outro saying "21 seconds of scrubbing" when the ring measures singing.

Useful flags: `--zoom '#ring'` crops a high-density shot of one element; `--against ref.mp4` saves the reference video's frame next to each snapshot. If `GEMINI_API_KEY` is set in your environment, `snapshot` sends frames to Gemini for a description by default; `--describe false`, used in every snapshot command in this repo, keeps them local.

## 3. Preview

```bash
npm run preview
# stop it with Ctrl+C, or, if it runs in the background:
npx hyperframes@0.8.143 preview examples/handwash-song --stop
```

Opens HyperFrames Studio in the browser with live reload. The preview can stutter on a slow machine; the render is frame-exact regardless. The HyperFrames agent skill tells Claude Code to start it with `preview --background` and to wait for your approval before rendering. Keep that habit without the skill too.

**Studio edits files.** When it opens a project, Studio 0.8.143 writes `data-hf-id` attributes into every `*.html` file in the project folder that contains `data-composition-id`, and reformats it on the way (`<!DOCTYPE html>`, meta tags without `/>`). It skips folders whose names start with `.` and `node_modules`. After a preview, `git status` shows `index.html` as modified. `npm run build` writes it back from the template byte for byte, or run `git checkout -- examples/handwash-song/index.html`. Check `git diff` before you commit. The template is `build/index.template.htm`: Studio only scans `*.html`, so the `.htm` extension keeps it untouched. Lint, snapshot, render and check do not modify files.

## 4. Render

```bash
npm run render
# same as
npx hyperframes@0.8.143 render examples/handwash-song -q delivery -o examples/handwash-song/renders/handwash-song.raw.mp4
node scripts/fix-right-edge.mjs examples/handwash-song/renders/handwash-song.raw.mp4 examples/handwash-song/renders/handwash-song.mp4
```

`npm run render` runs two scripts: `render:raw` (HyperFrames) and `fix-edge` (section 5). The raw render stays next to the final file as `renders/handwash-song.raw.mp4`.

`-q` takes `draft`, `looks` (the default, CRF 16), `delivery` (high), or `standard`/`high` (from `render --help` in 0.8.143). Use `draft` while you iterate on timing and `delivery` for the file you publish. Without `-o` the file goes to `renders/<name>.mp4`.

| Render | Time |
|---|---|
| full example, 30.8 s, 1080x1920, 30 fps, `-q delivery`, latest run | **64.6 s** (HyperFrames' summary line: "rendered in 1m 4.6s") |
| the whole `npm run render` around it (npx startup, render, edge fix) | 86.8 s wall clock |
| a second delivery render right after it, with the extracted video frames cached | 55.3 s |
| an earlier version of the template, whose counter was written by a callback (screenshot fallback, see below) | 109 to 133 s (earlier session) |
| `examples/spin-count`, 21.5 s, full-frame footage, `-q delivery` | 94.2 s by HyperFrames' summary line (screenshot capture, hardware GPU: capture 37.6 s, encode 41.3 s), re-rendered from this repo on 2026-10-09; the right-edge fix took another 35.8 s |
| `examples/wing-it`, 32.5 s, full-frame footage cut shot by shot, `-q delivery` | **1 min 43.3 s** by HyperFrames' summary line (drawElement capture, hardware GPU: compile 1.8 s, extract 9.9 s, audio 1.4 s, capture 1 min 26.1 s with encoding during capture, assemble 2.6 s), 110 s wall clock; the right-edge fix took another 42.4 s. Rendered in the folder where the edit was written, from the same template and asset files as the repo |
| 5-second test composition, 1080x1920, 30 fps | 29 s (earlier session, files not kept) |

That is about 2 seconds of rendering per second of video on this machine, including Chrome startup, video frame extraction and encoding. The latest run's summary line: compile 1.7 s, extract 8.9 s, audio 0.9 s, capture 50.7 s with encoding during capture, assemble 1.4 s.

What the log shows (latest render):

```
[initSession:screenshot] drawElement self-verify armed: 4 ground-truth frame(s) @ [231, 462, 693, 878] of 924
[INFO] [Render] drawElement self-verify passed {... "frame":231,"psnrDb":52.6}
[INFO] [Render] drawElement self-verify passed {... "frame":462,"psnrDb":49.8}
[INFO] [Render] drawElement self-verify passed {... "frame":693,"psnrDb":49}
[INFO] [Render] drawElement self-verify passed {... "frame":878,"psnrDb":49}
   drawelement capture · hardware gpu · compile 1.7s · extract 8.9s · audio 0.9s · ...
```

HyperFrames captures frames with Chrome's BeginFrame on Linux ([CLI reference](https://hyperframes.heygen.com/packages/cli)). Elsewhere it captures screenshots, and first tries a faster draw-element path where it can engage: `render --help` says "macOS + hardware-GPU browser", and our Windows machine with a GPU tried it too. Before it trusts that path, it captures four frames both ways and compares them. If one comes out below 32 dB PSNR, it logs `drawElement self-verification failed; re-rendering via screenshot` and captures the whole video again with screenshots across three Chrome workers.

**Do not write to the page from timeline callbacks.** Our first template set the timer number from an `onUpdate` callback. Every render of it failed the check at frame 693 (31.7 dB against 32 dB) and fell back to screenshots, which took 109 to 133 s. HyperFrames kept the failing pair: the reference screenshot showed the counter at 0, the draw-element frame showed 20, and nothing else differed. Tweening the element's `textContent` with `snap` instead ([07-the-edit.md](07-the-edit.md#20-second-timer-ring-and-counter)) made all four checks pass and halved the render time. The new counter shows 0, 1, 6, 11, 20 and 21 at 2.9, 3.99, 9.1, 14, 23.1 and 24.6 s in snapshots, the whole seconds of singing the old one showed.

When the check fails, HyperFrames leaves the two frames in the system temp folder (`os.tmpdir()`, `%TEMP%` on Windows) as `hf-de-verify-fail-*/frame-N-truth.jpg` and `frame-N-de.jpg`. Compare them to find the element that differs, then delete the folders: they are about 450 KB each and pile up (we had 9).

## 5. Fix the right edge

Every render on our machine comes out with an 8 px black strip at the right edge: columns 1072 to 1079 of 1080, in every frame, with screenshot capture and with draw-element capture. The picture is not shifted or scaled; those 8 columns are replaced by black. Snapshots of the same composition do not have it.

**The cause is an FFmpeg bug that HyperFrames triggers.** In ffmpeg 8.1.2 (the gyan.dev full build for Windows, which we use), the x86 SIMD code that converts yuv420p, yuvj420p or yuv422p to the planar RGB format gbrp leaves every column after the last multiple of 16 black. A one-line repro:

```bash
ffmpeg -f lavfi -i "color=c=white:s=1080x64,format=yuv420p" -frames:v 1 -vf format=gbrp out.png
```

Columns 1072 to 1079 of `out.png` are black. At width 1000 the black starts at column 992. Widths 1072, 1088, 720 and 1920 come out clean. Add `-cpuflags 0` (no SIMD) and the same command gives a correct image. yuv444p and nv12 to gbrp are not affected, and neither are yuv420p to rgb24, rgba, gbrap or bgr0.

HyperFrames 0.8.143 passes every captured frame, a JPEG, through `scale=in_color_matrix=bt601:in_range=pc:flags=neighbor,format=gbrp,...` before encoding (`SDR_CAPTURE_TO_BT709_FILTER` in its engine). Running that exact filter on one of HyperFrames' own reference screenshots, which is clean at x 1072 to 1079, reproduces the strip. Snapshots are saved straight from Chrome and skip ffmpeg, so they never show it.

The frame extractor converts every `<video>` through gbrp too, so footage whose width is not a multiple of 16 gets a black band at its own right edge. With the example's footage encoded 1080 wide, the render had a 7 px dark band at x 1033 to 1039, inside the footage card, in every frame, and the preview images carried it. `scripts/fetch-assets.mjs` now scales the clip to 1088x672, and the footage reaches x 1039 again. Encode your own footage at a width that is a multiple of 16: 1088 or 1024 for a card like this one, 1088 for a full-frame 9:16 clip that `object-fit: cover` scales down to 1080.

We have seen this with one ffmpeg build on one Windows machine. Other builds and operating systems are untested, and we have not seen it reported upstream. Things to try:

- `HYPERFRAMES_FFMPEG_PATH` points HyperFrames at another ffmpeg binary. We have not tried it.
- The bug belongs in FFmpeg's tracker, with the one-line repro and the `-cpuflags 0` result. For HyperFrames, `format=gbrap` or `format=rgb24` in place of `gbrp` avoids it in the repro (not tested inside HyperFrames).
- After any ffmpeg update, run the repro again.

Until then, `scripts/fix-right-edge.mjs` repairs the render:

```bash
node scripts/fix-right-edge.mjs <in.mp4> [out.mp4] [--mode auto|smear|fill] [--color auto|#rrggbb] [--flat 12] [--px auto|N] [--dry-run]
```

1. It decodes 5 frames spread over the video and measures the mean luma of each of the rightmost 64 columns.
2. It counts the columns, from the right edge inward, whose mean luma stays below 8 (out of 255) in every sampled frame. No such column: it copies the input to the output unchanged, says so, and exits 0.
3. It picks a fill (below), fills the strip, re-encodes the video (libx264 `-crf 16 -preset slow`, yuv420p, `+faststart`) and copies the audio as is.

**Smear or fill.** There are two ways to fill the strip, and each fails somewhere the other does not:

- `--mode fill` crops the strip off and pads the frame back with one flat color. `--color auto` takes the median Y'CbCr value of the two columns next to the strip (`#f2ece4` for the handwash example, which encodes to the same Y 219, Cb 124, Cr 131 as the neighbouring pixels); a hex value sets the color yourself. On a flat page this is clean. On footage or a gradient that reaches the edge, a flat column next to a changing picture shows as a seam down the whole frame. (`--mode color` is the old name and still works.)
- `--mode smear` repeats the last good column (1071) into the strip with ffmpeg's `fillborders=right=8:mode=smear`. It continues gradients, shadows and footage. On a flat page it has one flaw: anything that touches column 1071 for a moment is stretched into an 8 px bar out to the frame edge. In the handwash render the "x2" badge on the last board slot overshoots into column 1071 for three frames (21.57 to 21.63 s), and smear drew a blue bar from it to the edge; the flat fill leaves the page color there.
- `--mode auto`, the default, measures the two columns left of the strip in the sampled frames: for each frame, p95 minus p5 of their luma down the frame height, then the median over the frames. Above 12 levels (`--flat`) it smears, otherwise it fills. The handwash render measures 4 levels (the card's soft shadow), so it gets a flat fill. The spin-count render measures 68 to 76 (the gradient backdrop and the boy), so it gets smear.

Both modes write the same pixels they did before `auto` existed: on the handwash raw render, `--mode smear` reproduces the earlier smear-fixed file byte for byte (7,044,264 bytes), and the new default reproduces the earlier `--mode color` output byte for byte (7,037,382 bytes). On the spin-count raw render, the smear gives the same 645 decoded frames (framemd5) as `crop=1072:1920:0:0,pad=1080:1920:0:0,fillborders=right=8:mode=smear`, the command used for the posted video. The page color itself, `--color #f3eee5`, comes out 2 luma levels lighter than the background as the render encodes it and shows as a faint line.

What it printed on the latest handwash render:

```
measured 5 frame(s) at 3.08, 9.24, 15.40, 21.56, 27.72 s; brightest mean luma per column, rightmost 12: 1068:233.6 1069:233.8 1070:233.9 1071:233.9 1072:0.0 1073:0.0 1074:0.0 1075:0.0 1076:0.0 1077:0.0 1078:0.0 1079:0.0
auto: luma spread of x 1070-1071 down the frame (p5 to p95) 4.0, 4.0, 4.0, 5.0, 4.0 levels in the sampled frames, median 4.0 <= --flat 12: flat background, fill
strip: 8 px (x 1072-1079); fill: flat #f2ece4 (median Y'CbCr 219/124/131 of x 1070-1071, bt709 tv range)
wrote examples/handwash-song/renders/handwash-song.mp4 in 11.7 s: 1080x1920, 924 frames, 7.0 MB, audio copied
check at 15.40 s, mean luma per column: filled x 1072-1079 235.0, untouched x 1064-1071 233.6
```

And on the spin-count render:

```
auto: luma spread of x 1070-1071 down the frame (p5 to p95) 68.0, 70.0, 76.0, 68.0, 75.0 levels in the sampled frames, median 70.0 > --flat 12: footage or a gradient reaches the edge, smear
strip: 8 px (x 1072-1079); fill: smear, column 1071 repeated
```

On the wing-it render `auto` measured 79 to 136 levels of spread (median 104.5), footage that reaches the edge, and picked smear. The fix took 42.4 s; at 16.25 s the filled columns average 59.7 luma against 57.9 for the untouched x 1064 to 1071. The raw render is 34,624,061 bytes (HyperFrames prints 33.0 MB) at 8.3 Mbit/s of video; the fixed file is 27,310,022 bytes at 6.5 Mbit/s, 975 frames and 32.500 s of video and audio in both.

How we checked the results:

| Check | handwash-song (fill) | spin-count (smear) |
|---|---|---|
| columns 1072 to 1079 against column 1071, every row, one frame per second | 31 frames: Y at most 3 levels apart, Cb and Cr at most 3 | 22 frames: Y at most 3 levels apart, Cb and Cr at most 4 |
| mean luma (limited range) of the filled columns and of column 1071, same frames | 219.0 and 218.1 | 123.9 and 123.9 |
| PSNR of columns 0 to 1071, raw against fixed, every frame. Those columns were not edited, only re-encoded | 53.1 dB average, 48.7 dB for the worst frame | 50.7 dB average, 47.7 dB for the worst frame |
| decoded audio, raw against fixed | identical, 1,444 of 1,444 audio frames | identical, 1,008 of 1,008 |
| frames and duration | 924 frames, 30.800 s in both files | 645 frames, 21.500 s in both files |
| time | 11.7 s | 35.6 s |
| size, raw and fixed | 9,666,279 and 7,037,382 bytes | 42,056,090 and 33,237,396 bytes |

For the handwash render we also checked the right edge of the footage card (row 900 at 3.6, 14 and 23.1 s): footage up to x 1039, page from x 1040, no dark band. Runs of the fix on the handwash render have taken 11.4 to 25.0 s, so expect about 11 to 25 s for 31 s of video. Byte counts of the renders change by a few KB from one render to the next.

Check your own renders for the strip on any OS: `node scripts/fix-right-edge.mjs <render.mp4> --dry-run` measures and writes nothing.

## 6. Probe the output

```bash
npm run probe
```

| Property | Raw render (`handwash-song.raw.mp4`) | After the edge fix (`handwash-song.mp4`) |
|---|---|---|
| Video | H.264 High, 1080x1920, 30 fps, yuv420p, bt709, 2.34 Mbps | H.264 High, 1080x1920, 30 fps, yuv420p, bt709, 1.66 Mbps |
| Audio | AAC LC, 48 kHz, stereo, 160 kbps | the same stream, copied |
| Frames | 924 | 924 |
| Duration | 30.800 s video, 30.800 s audio | 30.800 s video, 30.800 s audio |
| Size | 9,666,279 bytes | 7,037,382 bytes |

HyperFrames' summary line prints the size in MiB (`9.2 MB`), and the byte count changes by a few KB from one render to the next (9,670,431 bytes for the second render in section 7).

The input song is 44.1 kHz; HyperFrames resampled the mix to 48 kHz. Video and audio durations match, so the resample is correct (see the sample-rate story in [05-or-use-existing-footage.md](05-or-use-existing-footage.md#always-probe-sample-rate-and-duration)). Both files carry `hyperframes_version=0.8.143` in their metadata tags.

## 7. Determinism check

Render the same composition twice and compare the decoded frames:

```bash
npx hyperframes@0.8.143 render examples/handwash-song -q delivery -o a.mp4
npx hyperframes@0.8.143 render examples/handwash-song -q delivery -o b.mp4
node scripts/framemd5-diff.mjs a.mp4 b.mp4
```

Compare raw renders, before the edge fix: the fix re-encodes, so two fixed files can differ even when their raw renders match.

`framemd5-diff.mjs` hashes every decoded frame with ffmpeg's `framemd5` muxer and compares the hashes in order. File bytes can differ between two encodes of identical frames (metadata, timestamps); the frame hashes cannot. Add `--audio` to compare the decoded audio too. The same check with plain ffmpeg:

```bash
ffmpeg -v error -i a.mp4 -map 0:v -f framemd5 a.md5
ffmpeg -v error -i b.mp4 -map 0:v -f framemd5 b.md5
diff a.md5 b.md5 && echo identical
```

Our results, all on one machine:

| Compared | Video frames equal | Lowest PSNR of a differing frame | Decoded audio |
|---|---|---|---|
| the latest delivery render against a second one made right after it, draw-element capture, GPU | **530 of 924** | 51.6 dB | identical, 1,444 of 1,444 |
| earlier pairs with the callback counter, screenshot capture, GPU (earlier session, files not kept) | 520, 528 and 529 of 924 | 51.4 to 52.9 dB | identical |
| two delivery renders with the callback counter, `--no-browser-gpu` (earlier session, files not kept) | 345 of 924 | 52.9 dB | identical |
| two renders of a 5-second test composition (earlier session, files not kept) | 150 of 150 | | |

The full-length differences cannot be seen. In the latest pair the differing frames are 92 to 249 (from 3.07 s, the WASH pop, to the encoder keyframe at 8.33 s) and 264 to 499 (from 8.80 s, just after the SCRUB pop, to the keyframe at 16.67 s), the same pattern as in the earlier pairs. To measure it:

```bash
ffmpeg -i a.mp4 -i b.mp4 -lavfi "[0:v][1:v]psnr=stats_file=psnr.log" -f null -
```

So for your own renders: the decoded audio must be identical, and frame differences must be invisible (minimum PSNR above about 50 dB) and confined to stretches between keyframes. A visible difference usually means something in the page depends on wall-clock time, unseeded randomness, or a network request during the render ([00-how-it-works.md](00-how-it-works.md#how-hyperframes-turns-html-into-an-mp4)). We only compared renders on one machine. Across machines, fonts and GPU drivers can change pixels; HyperFrames offers `render --docker` for that case, untested here.

## 8. A preview GIF and a still

The README shows a GIF of each example and links the full MP4s. Every image in `docs/img/` comes from a fixed render.

```bash
# docs/img/demo-wing.gif: 2.6 to 9.6 s of the wing-it render (countdown, ignition, liftoff, the roof, the start of the climb)
ffmpeg -ss 2.6 -t 7.0 -i examples/wing-it/renders/wing-it.mp4 \
  -vf "fps=12,scale=360:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
  -loop 0 docs/img/demo-wing.gif
```

The wing-it GIF uses the spin-count settings: 360x640, 12 fps, 84 frames, 128 colors, 3,228,266 bytes. Run on the posted render, this command gives the committed file byte for byte. The handwash images stop well before 25.17 s, where the source cuts to its end card with the CDC and HHS logos ([05-or-use-existing-footage.md](05-or-use-existing-footage.md#a-five-minute-license-check)). They were made from the smear-fixed render, before the edge fix's `auto` mode picked a flat fill for that example; the two files differ only in columns 1072 to 1079.

```bash
# docs/img/demo-spin.gif: 1.0 to 8.4 s of the spin-count render (title, spins 1 to 3)
ffmpeg -ss 1.0 -t 7.4 -i examples/spin-count/renders/spin.mp4 \
  -vf "fps=12,scale=360:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
  -loop 0 docs/img/demo-spin.gif

# docs/img/demo.gif: 1.8 s to 9.5 s (giant "1", WASH flying into the board, karaoke, bubbles, timer, SCRUB)
ffmpeg -ss 1.8 -t 7.7 -i examples/handwash-song/renders/handwash-song.mp4 \
  -vf "fps=20,scale=360:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=256:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" \
  -loop 0 docs/img/demo.gif

# docs/img/hero.png: frames at 3.4, 9.1 and 22.3 s side by side
R=examples/handwash-song/renders/handwash-song.mp4
ffmpeg -ss 3.4 -i $R -ss 9.1 -i $R -ss 22.3 -i $R -filter_complex \
  "[0:v]scale=400:712:flags=lanczos,pad=416:712:8:0:color=0xd9d2c5[a];[1:v]scale=400:712:flags=lanczos,pad=416:712:8:0:color=0xd9d2c5[b];[2:v]scale=400:712:flags=lanczos,pad=416:712:8:0:color=0xd9d2c5[c];[a][b][c]hstack=inputs=3" \
  -frames:v 1 docs/img/hero.png
```

Our handwash GIF: 360x640, 20 fps, 154 frames, 7.7 s, 1,934,912 bytes. `palettegen` builds one 256-color palette for the clip, and `paletteuse` with `diff_mode=rectangle` re-encodes only the part of each frame that changed, which keeps a mostly static layout small. At 15 fps and 128 colors the same clip was 1,319,273 bytes.

Full-frame footage changes everywhere in every frame, so the same trick saves little. With the handwash settings (20 fps, 256 colors) a 7.9 s spin-count excerpt (0 to 7.9 s) was 8,540,902 bytes; at 15 fps and 128 colors, 5,320,778; at 12 fps and 128 colors, 4,298,574 bytes. The GIF in `docs/img/demo-spin.gif` uses the last settings on 1.0 to 8.4 s: 360x640, 89 frames, 4,048,679 bytes from the corrected render (4,996,443 at 15 fps on the earlier one). It starts at 1.0 s, after the intro pop-in. `stats_mode=full` builds the palette from every pixel of every frame, which suits a gradient backdrop; `bayer_scale=4` gives a finer dither pattern than 3 and a smaller file here. The banding in the backdrop is visible in the GIF and not in the MP4. The still is 1248x712, 460,949 bytes. Make both from a render whose footage width is a multiple of 16 (section 5): our first previews carried the dark band at the card's right edge.

## 9. Sharing the full video

GitHub accepts video attachments (`.mp4`, `.mov`, `.webm`) up to **10 MB** on repositories owned by free-plan accounts and 100 MB on paid plans, and recommends H.264 ([GitHub docs](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)). That page describes attachments to issues, pull requests and comments; we have not tested an upload in the README editor. This repo commits no video at all: the full render is published as a release asset, and each file in a GitHub release must be under 2 GiB ([about releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)). The handwash render is 7.0 MB, under the 10 MB attachment limit too. The spin-count render is 33 MB and the wing-it render 27.3 MB (full-frame footage), so a release asset is the only way for those two.

For a longer video, budget roughly 2.5 Mbps total for 30 s and 2.2 Mbps for 35 s to stay under 10 MB, and re-render with a target bitrate:

```bash
npx hyperframes@0.8.143 render examples/handwash-song --video-bitrate 2M -o renders/readme.mp4
```

(`--video-bitrate` and `--crf` are mutually exclusive. We did not need this step, so the command is untested.)

## Windows notes

- Capture runs through screenshots on Windows, or through the draw-element path when its self-check passes ([section 4](#4-render)). Full-length renders of the example were not frame-identical, though the differences cannot be seen ([section 7](#7-determinism-check)). HeyGen's write-up on the engine says determinism is strongest on Linux and that video-heavy renders should drop to a single worker (`--workers 1`) ([heygen.com/research/html-to-video](https://www.heygen.com/research/html-to-video)).
- The 8 px black strip at the right edge comes from the ffmpeg 8.1.2 build that HyperFrames calls on this machine ([section 5](#5-fix-the-right-edge)). `npm run render` repairs it.
- Failed draw-element self-checks leave `hf-de-verify-fail-*` folders in `%TEMP%`; delete them once you have looked at them.
- Machines with 8 GB of RAM or less get the low-memory profile automatically: one worker, screenshot capture.
- The extracted-frame cache lives in `%TEMP%`, usually on `C:`. Move it with `--frames-cache-dir D:\hf-cache` if that drive is small.
- Set environment variables in PowerShell with `$env:NAME="value"`, in Git Bash with `export NAME=value`.
- Behind a proxy, `npx` needs `npm_config_https_proxy`, and the Node scripts in `scripts/` need `HTTPS_PROXY` plus `NODE_USE_ENV_PROXY=1`.
- `claude plugin marketplace add heygen-com/hyperframes` failed for us with `EBUSY` on a half-cloned folder. Restarting Claude Code and running it again worked.
