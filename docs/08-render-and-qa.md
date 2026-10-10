# 08. Render and QA

Step 7 of 7. HyperFrames renders locally, with no per-render fee. Prompt: [`prompts/edit/05-render.md`](../prompts/edit/05-render.md). Output: the MP4, plus an optional GIF preview and still.

The loop: **lint, snapshot, preview, render, fix the right edge, probe.** Lint and snapshots take seconds, so run them after every change. Render when the snapshots look right.

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

Pin the version in every command. HyperFrames ships releases almost daily, and its docs disagree in places, such as the default `--quality`. The `--help` of the pinned version is the reference.

`doctor` may list `whisper-cpp`, `TTS (Kokoro)`, `BGM (MusicGen)` and `Docker` as missing. None of them is needed to render the examples.

## 1. Lint

```bash
npm run lint         # handwash-song; lint:spin and lint:wing for the others
npx hyperframes@0.8.143 lint examples/handwash-song
```

Expect 0 errors. The `nested_structure_needs_subcomposition` warnings (two on handwash-song, one on each other example) only affect how Studio draws its timeline. The render is unaffected.

The rules that matter most here are `media_missing_id` (silent render), `video_missing_muted`, `gsap_css_transform_conflict`, `gsap_animates_clip_element` and `font_family_without_font_face` ([07](07-the-edit.md)). Lint reads only `font-family` declarations, so a font named only in the `font:` shorthand is never checked. `render --strict` refuses to render with lint errors.

`npx hyperframes@0.8.143 check <folder>` is a second, browser-based gate: runtime errors, layout, motion, contrast. Runtime and motion pass on all three examples. It exits with code 1 on each, for known reasons:

| Example | What `check` reports (WCAG AA asks 4.5:1) |
|---|---|
| handwash-song | `#ring-lbl` 3.72:1, `#credit` 2.64:1; grey unsung words (by design); `content_overlap` while one lyric line fades into the next |
| spin-count | unlit pill numbers 1.89:1 to 1.95:1, `#credit` 2.91:1; giant numbers crossing the title, outro card over the credit (both intended) |
| wing-it | `text_not_painted` for the transparent chip glyphs (by design); tick on green 2.74:1, RESULT on red 2.07:1, credit 4.27:1 |

## 2. Snapshots

```bash
npx hyperframes@0.8.143 snapshot examples/handwash-song --at 0.9,2.3,3.6,9.1,11.3,14,20.6,26.5 --describe false
```

It writes `snapshots/frame-NN-at-Xs.png` for each time plus `snapshots/contact-sheet.jpg`, one grid of all of them. It may add an end-of-timeline frame: pass `--no-end` to capture only your times. Each run replaces the previous PNGs, so pass `-o <folder>` to keep a set.

Pick times that land on events. The times above catch the intro, the giant "1", the first lit word, SCRUB in flight, the full board, the giant "2", the "x2" badges and the outro. Word start times come straight from the transcript:

```bash
# start times of words 0, 9, 19 and 28
node -e "const t=require('./examples/handwash-song/transcript.json'); console.log([0,9,19,28].map(i=>t[i].start).join(','))"
# 2.98,8.7,14.36,19.72
```

On the contact sheet, look for text over the footage, words cut off at the frame edge, wrong numbers and wrong text.

`--zoom '#ring'` crops a high-density shot of one element. `--against ref.mp4` saves the reference video's frame next to each snapshot. With `GEMINI_API_KEY` set, `snapshot` sends frames to Gemini for a description; `--describe false` keeps them local.

## 3. Preview

```bash
npm run preview
# stop it with Ctrl+C, or, if it runs in the background:
npx hyperframes@0.8.143 preview examples/handwash-song --stop
```

This opens HyperFrames Studio with live reload. The preview can stutter; the render is frame-exact regardless. The HyperFrames agent skill starts it with `preview --background` and waits for your approval before rendering. Keep that habit without the skill too.

**Studio edits files.** When it opens a project, Studio 0.8.143 writes `data-hf-id` attributes into every `*.html` file in the project folder that contains `data-composition-id`, and reformats it (`<!DOCTYPE html>`, meta tags without `/>`). It skips dot-folders and `node_modules`.

- After a preview, `git status` shows `index.html` as modified. `npm run build` writes it back from the template byte for byte.
- The template, `build/index.template.htm`, is untouched: Studio scans only `*.html`.
- Lint, snapshot, render and check do not modify files.

## 4. Render

```bash
npm run render
# same as
npx hyperframes@0.8.143 render examples/handwash-song -q delivery -o examples/handwash-song/renders/handwash-song.raw.mp4
node scripts/fix-right-edge.mjs examples/handwash-song/renders/handwash-song.raw.mp4 examples/handwash-song/renders/handwash-song.mp4
```

`npm run render` runs `render:raw` (HyperFrames) and then `fix-edge` ([section 5](#5-fix-the-right-edge)). The raw file stays next to the final one. `render:spin` and `render:wing` do the same for the other examples. Without `-o` the file goes to `renders/<name>.mp4`.

`-q` takes `draft` (while you iterate on timing), `looks` (the default, CRF 16), `delivery` (the file you publish, maps to `high`), `standard` or `high`. A delivery render takes roughly 2 to 4 seconds per second of video, the upper end with full-frame footage.

**How frames are captured.** On Linux HyperFrames uses Chrome's BeginFrame ([CLI reference](https://hyperframes.heygen.com/packages/cli)). Elsewhere it captures screenshots, and first tries a faster draw-element path (`render --help`: "macOS + hardware-GPU browser"; it can also engage on Windows with a GPU). It captures four frames both ways and compares them before it trusts that path. A pass logs:

```text
[INFO] [Render] drawElement self-verify passed {... "frame":231,"psnrDb":52.6}
```

If one frame comes out below 32 dB PSNR, it logs `drawElement self-verification failed; re-rendering via screenshot` and captures the whole video again with screenshots, at about twice the time.

**The usual cause is a timeline callback that writes to the page.** A counter set from `onUpdate` reads one number in the reference screenshot and another in the draw-element frame. Tween the element's `textContent` with `snap` instead ([07](07-the-edit.md#6-counters-tween-textcontent-never-write-from-onupdate)).

A failed check leaves the two frames in the system temp folder (`%TEMP%` on Windows) as `hf-de-verify-fail-*/frame-N-truth.jpg` and `frame-N-de.jpg`. Compare them to find the element that differs, then delete the folders: they are about 450 KB each and pile up.

## 5. Fix the right edge

Renders from HyperFrames 0.8.143 with ffmpeg 8.1.2 (gyan.dev full build for Windows) carry an 8 px black strip at the right edge: columns 1072 to 1079 of 1080, in every frame, with both capture paths. The picture is not shifted or scaled. Snapshots do not have it.

**The cause is an FFmpeg bug that HyperFrames triggers.** In ffmpeg 8.1.2 the x86 SIMD code that converts yuv420p, yuvj420p or yuv422p to planar RGB (gbrp) leaves every column after the last multiple of 16 black:

```bash
ffmpeg -f lavfi -i "color=c=white:s=1080x64,format=yuv420p" -frames:v 1 -vf format=gbrp out.png
```

Columns 1072 to 1079 of `out.png` are black. Widths that are multiples of 16 (1072, 1088, 720, 1920) come out clean, and `-cpuflags 0` (no SIMD) gives a correct image.

HyperFrames passes every captured frame through `scale=in_color_matrix=bt601:in_range=pc:flags=neighbor,format=gbrp,...` before encoding (`SDR_CAPTURE_TO_BT709_FILTER` in its engine). Snapshots are saved straight from Chrome and skip ffmpeg.

**Footage gets the same band.** The frame extractor converts every `<video>` through gbrp too, so footage whose width is not a multiple of 16 gets a dark band at its own right edge. Encode footage at a width that is a multiple of 16: 1088 or 1024 for a card, 1088 for a full-frame 9:16 clip that `object-fit: cover` scales to 1080. `scripts/fetch-assets.mjs` scales the handwash clip to 1088x672 for this reason.

Run the repro again after any ffmpeg update. If another build passes it, `HYPERFRAMES_FFMPEG_PATH` points HyperFrames at that binary. Until then, `scripts/fix-right-edge.mjs` repairs the render:

```bash
node scripts/fix-right-edge.mjs <in.mp4> [out.mp4] [--mode auto|smear|fill] [--color auto|#rrggbb] [--flat 12] [--px auto|N] [--dry-run]
```

1. It decodes 5 frames spread over the video and measures the mean luma of each of the rightmost 64 columns.
2. It counts the columns, from the right edge inward, whose mean luma stays below 8 (of 255) in every sampled frame. With no such column it copies the input unchanged and exits 0.
3. It fills the strip, re-encodes the video (libx264 `-crf 16 -preset slow`, yuv420p, `+faststart`) and copies the audio as is.

| `--mode` | What it does | Where it fails |
|---|---|---|
| `fill` | pads one flat color; `--color auto` takes the median Y'CbCr of the two columns next to the strip, or pass a hex (`color` is the old name) | footage or a gradient at the edge: a seam down the frame |
| `smear` | repeats column 1071 into the strip (`fillborders=right=8:mode=smear`) | a flat page: anything touching column 1071 stretches into a bar, like the handwash "x2" badge for three frames |
| `auto` (default) | measures the luma spread of the two columns left of the strip (p95 minus p5 down the frame, median over the samples); above `--flat` (12) it smears, otherwise it fills | |

The handwash page measures 4 levels and gets a flat fill. The spin-count and wing-it renders measure 68 and more (footage and a gradient reach the edge) and get smear. A hex page color such as `--color #f3eee5` comes out 2 luma levels off the encoded background and shows as a faint line, which `auto` avoids.

The rest of the frame is only re-encoded, and the audio is copied. To check any render for the strip without writing anything:

```bash
node scripts/fix-right-edge.mjs <render.mp4> --dry-run
```

## 6. Probe the output

```bash
npm run probe        # probe:spin and probe:wing for the others
```

`scripts/probe.mjs` prints duration, fps, frame count, sample rate and channels, and warns when audio is not 44.1 or 48 kHz or when durations differ. For the handwash render, expect:

| Property | Value |
|---|---|
| Video | H.264 High, 1080x1920, 30 fps, yuv420p, bt709 |
| Audio | AAC LC, 48 kHz, stereo, 160 kbps (copied unchanged by the edge fix) |
| Frames and duration | 924 frames, 30.800 s of video and 30.800 s of audio |

The handwash song is 44.1 kHz, and HyperFrames resamples the mix to 48 kHz. Matching video and audio durations show the resample is correct ([05](05-or-use-existing-footage.md#always-probe-sample-rate-and-duration)). Byte counts change by a few KB from one render to the next.

## 7. Determinism check

Render the same composition twice and compare the decoded frames of the raw renders. The edge fix re-encodes, so compare before it.

```bash
npx hyperframes@0.8.143 render examples/handwash-song -q delivery -o examples/handwash-song/renders/a.mp4
npx hyperframes@0.8.143 render examples/handwash-song -q delivery -o examples/handwash-song/renders/b.mp4
node scripts/framemd5-diff.mjs examples/handwash-song/renders/a.mp4 examples/handwash-song/renders/b.mp4 --audio
```

`framemd5-diff.mjs` hashes every decoded frame with ffmpeg's `framemd5` muxer and compares the hashes in order. Two encodes of identical frames can differ as files; their frame hashes cannot.

Full-length renders are not frame-identical, even from a deterministic composition. Two delivery renders of handwash-song matched on 530 of 924 frames; the rest differed invisibly (lowest PSNR 51.6 dB), in stretches that end at a keyframe, and the decoded audio was identical. So judge the check by identical audio and a lowest PSNR above about 50 dB:

```bash
cd examples/handwash-song/renders
ffmpeg -i a.mp4 -i b.mp4 -lavfi "[0:v][1:v]psnr=stats_file=psnr.log" -f null -
```

Run it from the folder that holds the files, as above: a Windows path with a drive letter breaks the `stats_file` option. A visible difference usually means the page reads a clock, a random number or a network request during the render ([00](00-how-it-works.md#how-hyperframes-turns-html-into-an-mp4)). For renders that must match across machines, HyperFrames offers `render --docker`. HeyGen's engine write-up recommends one worker (`--workers 1`) for video-heavy renders ([heygen.com/research/html-to-video](https://www.heygen.com/research/html-to-video)).

## 8. A preview GIF and a still

Make previews from the fixed render, with footage whose width is a multiple of 16.

```bash
# docs/img/demo-wing.gif: 2.6 to 9.6 s of the wing-it render
ffmpeg -ss 2.6 -t 7.0 -i examples/wing-it/renders/wing-it.mp4 \
  -vf "fps=12,scale=360:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
  -loop 0 docs/img/demo-wing.gif

# docs/img/demo.gif: 1.8 to 9.5 s of the handwash render
ffmpeg -ss 1.8 -t 7.7 -i examples/handwash-song/renders/handwash-song.mp4 \
  -vf "fps=20,scale=360:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=256:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" \
  -loop 0 docs/img/demo.gif

# docs/img/hero.png: frames at 3.4, 9.1 and 22.3 s side by side
R=examples/handwash-song/renders/handwash-song.mp4
ffmpeg -ss 3.4 -i $R -ss 9.1 -i $R -ss 22.3 -i $R -filter_complex \
  "[0:v]scale=400:712:flags=lanczos,pad=416:712:8:0:color=0xd9d2c5[a];[1:v]scale=400:712:flags=lanczos,pad=416:712:8:0:color=0xd9d2c5[b];[2:v]scale=400:712:flags=lanczos,pad=416:712:8:0:color=0xd9d2c5[c];[a][b][c]hstack=inputs=3" \
  -frames:v 1 docs/img/hero.png
```

`docs/img/demo-spin.gif` uses the wing-it filter on 1.0 to 8.4 s of `examples/spin-count/renders/spin.mp4`. The two full-frame GIFs are 3.2 MB and 4.0 MB at 12 fps and 128 colors; the handwash GIF is 1.9 MB at 20 fps and 256 colors.

- `paletteuse` with `diff_mode=rectangle` re-encodes only the part of each frame that changed, which keeps a mostly static layout small.
- Full-frame footage changes everywhere, so that saves little. Drop to 12 fps and 128 colors to stay under 5 MB. `stats_mode=full` suits a gradient backdrop, and `bayer_scale=4` gives a finer dither and a smaller file than 3.
- The handwash images stop well before 25.17 s, where the source cuts to its end card with the CDC and HHS logos ([05](05-or-use-existing-footage.md#a-five-minute-license-check)).

## 9. Sharing the full video

The repo commits no video. The full renders are release assets:

| File | Size |
|---|---|
| [wing-it.mp4](https://github.com/helicerat/claude-code-character-videos/releases/download/v0.1.0/wing-it.mp4) | 27.3 MB |
| [spin-count.mp4](https://github.com/helicerat/claude-code-character-videos/releases/download/v0.1.0/spin-count.mp4) | 33 MB |
| [handwash-song.mp4](https://github.com/helicerat/claude-code-character-videos/releases/download/v0.1.0/handwash-song.mp4) | 7.0 MB |

A release file can be up to 2 GiB ([about releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)). Video attachments to issues, pull requests and comments are capped at 10 MB on free plans and 100 MB on paid plans ([GitHub docs](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)).

To fit 10 MB, budget about 2.5 Mbps in total for 30 s, or 2.2 Mbps for 35 s, and re-render with a target bitrate (`--video-bitrate` and `--crf` are mutually exclusive):

```bash
npx hyperframes@0.8.143 render examples/handwash-song --video-bitrate 2M -o renders/readme.mp4
```

## Windows notes

- Machines with 8 GB of RAM or less get the low-memory profile automatically: one worker, screenshot capture.
- The extracted-frame cache lives in `%TEMP%`, usually on `C:`. Move it with `--frames-cache-dir D:\hf-cache` if that drive is small.
- Set environment variables in PowerShell with `$env:NAME="value"`, in Git Bash with `export NAME=value`.
- Behind a proxy, `npx` needs `npm_config_https_proxy`, and the Node scripts in `scripts/` need `HTTPS_PROXY` plus `NODE_USE_ENV_PROXY=1`.
- `claude plugin marketplace add heygen-com/hyperframes` can fail with `EBUSY` on a half-cloned folder. Restart Claude Code and run it again.
