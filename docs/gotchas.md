# Gotchas

Every pitfall from the other docs, in one list. Versions: `hyperframes@0.8.143`, GSAP 3.14.2, Node 24, Windows 10, checked 2026-10-09.

## Footage and audio files

- **Burned-in captions** duplicate your karaoke text. Crop them off before anything else (`crop=522:322:0:0` for the example). `cropdetect` finds black bars only. [05](05-or-use-existing-footage.md#why-we-crop-the-captions)
- **Agency logos are excluded from public-domain reuse** (CDC's policy; NASA under 14 CFR 1221). The CDC clip ends on a card with the CDC and HHS logos (from 25.17 s). Never use such a frame as a thumbnail or cover; cut the footage earlier to remove it entirely. [05](05-or-use-existing-footage.md#a-five-minute-license-check)
- **A public-domain tag on Commons is the uploader's claim.** Check the source, the music, and third-party material inside the clip. Keep raw and derived media out of git and ship a fetch script.
- **Stock licenses forbid redistribution** of the raw file (Pexels: on other stock platforms; Pixabay: "on a Standalone basis"). Big Buck Bunny's score is CC BY-NC-ND 3.0 even though the film is CC BY.
- **A stock page lists other people's work next to the item.** Our first credit line for the spin-count clip named the uploader of some of the related clips shown on the page; the clip itself was uploaded by TonyDias7. Copy the name from the author box next to the Download button. [05](05-or-use-existing-footage.md#a-pixabay-clip-and-track-the-spin-count-example)
- **CC BY needs more than a credit line in the frame.** For a Blender Studio open movie, credit `(CC) Blender Foundation | studio.blender.org`, link the license and say what you changed, in the post as well as in the video. Logos and trademarks are excluded from the license. [05](05-or-use-existing-footage.md#a-blender-open-movie-the-wing-it-example)
- **One crop does not fit a 16:9 film in a 9:16 frame.** The subject moves from shot to shot. Cut at the film's own shot changes and crop each shot around its subject (`shots.json` in wing-it); keep a shot whose action spans the frame as a 16:9 card over a blurred copy. [05](05-or-use-existing-footage.md#a-916-cut-shot-by-shot)
- **Scene detection misses quiet cuts.** On the wing-it window ffmpeg's scene score found 10 of 11 cuts at 0.3 and all 11 at 0.25; the cut to the rocket in the barn scored 0.299. Check every candidate on a contact sheet.
- **Film sound can carry a swear.** WING IT! has a shouted one at film 1:42 to 1:44. `volume=enable='between(t,19.8,22.3)':volume=0.12` turns it down to about -18 dB; it is quieter, not gone. Use `volume=0` to mute it.
- **Free stock music can be registered with Content ID.** The spin-count track's page says "Content ID Registered"; a video with it can get a claim on platforms that run Content ID (not tested). Read the music page before you pick a track.
- **Marks read by eye miss things.** The spin-count edit counts 10 spins; a second pass over contact sheets found 2 more back views with no mark. Check every mark with a frame grab, and look for events you did not mark. [06](06-word-timing.md#timings-without-words-beats-and-visual-marks)
- **A story event is a cut or an action, and they differ.** In wing-it, IGNITION lands on the cut to the rocket, 0.5 s before it jolts, and PARACHUTE lands 0.2 to 0.4 s after the umbrella flips. Decide for each event which one the edit reacts to, and write down what the frame shows in `events.json`. [06](06-word-timing.md#story-events-stepping-through-frames)
- **Sparse keyframes.** x264 defaults to one keyframe per 250 frames (8.33 s at 30 fps), and HyperFrames warns that this "causes seek failures and frame freezing". Encode footage with `-g 30 -keyint_min 30`.
- **Wrong sample-rate labels** play audio at the wrong speed with no error. 48 kHz samples labeled as 44.1 kHz run 8.8 percent long (about 8 percent slow) and drift off the picture. Probe sample rate and duration of every input and output (`npm run probe`). Never hard-code 44100.
- **Even dimensions.** H.264 with `yuv420p` needs even width and height; scale with `-2` (`scale=1088:-2`).
- **Footage width a multiple of 16.** HyperFrames 0.8.143 extracts video frames through a yuv420p to gbrp conversion, and ffmpeg 8.1.2 (gyan.dev build, x86) leaves every column after the last multiple of 16 black in it. A 1080-wide `cat.mp4` gave the example a 7 px dark band at the right edge of the footage card. Encode footage 1088 or 1024 wide; `object-fit: cover` scales it to the card. [08](08-render-and-qa.md#5-fix-the-right-edge)
- **The output is 48 kHz AAC** whatever the input rate. That is expected; check that video and audio durations still match.

## Word timings

- **Whisper mishears singing.** Ours heard "Wash and sell" for "Wash hands well" in both passes. Take timings from the model and text from your lyrics (`npm run align`). [06](06-word-timing.md)
- **Whisper invents words over silence.** Ours added "you" at 30.16 s, six seconds after the singing ended. The aligner drops words that are not in the lyrics.
- **A skipped word looks like a timing gap.** The aligner marks it `interpolated`. If the song was generated, generate another take.
- **`npx hyperframes transcribe` can overwrite your work.** In 0.8.143 it writes `transcript.json` next to the input file (`--help` says the current directory; the code uses the input's folder), or into `--dir` if given. It then scans `.html` files under that folder, recursively, and in each one rewrites the first `const script = [ ... ];`, or else the first `const TRANSCRIPT = [ ... ];`, with the raw words. Never pass `--dir` with an example folder.
- **`.en` whisper models translate** non-English audio into English. Always pass `--model` and `--language`. For songs, HyperFrames suggests starting at `medium.en`, stripping `♪` tokens, and treating more than 20 percent `♪` as a failed transcript.
- **whisper.cpp on Windows** is not prebuilt: `doctor` reports it missing and points to a cmake build. The Parakeet engine (`npx hyperframes models install parakeet`, about 640 MB) is the local alternative.
- **OpenAI word timestamps** work only on `whisper-1`. Groq needs `response_format=verbose_json` with `timestamp_granularities[]=word`.

## Composition rules (HyperFrames)

- **No registered timeline, no motion.** One `gsap.timeline({ paused: true })`, registered synchronously as `window.__timelines["<data-composition-id>"]`. Break the contract and you get a still frame, with no error.
- **`<audio>` without an `id` renders silent** (`media_missing_id`). The HyperFrames README's own example omits the id; add it anyway.
- **Every `<video>` must be `muted`** or carry `data-has-audio="true"` (`video_missing_muted`).
- **Never play, pause or seek media from script**, and never show or hide clips by time in script. HyperFrames does both from the `data-*` attributes.
- **No `translate(-50%, -50%)` on an element GSAP moves** (`gsap_css_transform_conflict`). Center with flexbox, `left: 50%` plus a negative margin, or GSAP's `xPercent`/`yPercent`.
- **Do not tween `visibility`, `display` or `autoAlpha` on a `.clip`** (`gsap_animates_clip_element`). Animate its children.
- **`fromTo` applies its from-state when the timeline is built**, before the tween's start time (GSAP's `immediateRender`). Set the hidden starting state in CSS (or `gsap.set`) so nothing flashes on frame 0, and make the from-state itself hidden. The spin-count edit hit this twice. Its stickers started from `opacity: 1, scale: 0.2`, and all ten sat piled up on the boy from frame 0 until the from-state became `opacity: 0`. Its pill bump, `fromTo(pill, { scale: 1 }, { scale: 1.3, ... })` at the moment each spin is counted, overwrote the intro's `scale: 0`, so the posted render shows all ten pills at full size for 4 frames before they pop in; a plain `to` fixed it. A later `fromTo` on a property an earlier tween animates wins at build time. [07](07-the-edit.md#the-spin-count-edit)
- **No wall clock, no unseeded randomness:** no `Date.now()`, `requestAnimationFrame`, `setTimeout`/`setInterval`, `Math.random()`. Use a seeded generator such as mulberry32.
- **No `fetch` during the render.** Load data and libraries from local files (the example loads `assets/gsap.min.js`).
- **Do not measure the DOM in timeline callbacks** (`getBoundingClientRect`, `getTotalLength`). Compute geometry once, or use fixed coordinates as the example does.
- **Do not write the DOM from `onUpdate` or `onComplete` either.** Tween a property instead: a number on screen is the element's `textContent`, tweened with `snap: { textContent: 1 }`. The handwash example's first counter was written by `onUpdate`; the reference screenshot of HyperFrames' draw-element self-check showed it at 0 where the draw-element frame showed 20, the check failed at frame 693 (31.7 dB against 32 dB), and every render fell back to screenshots: 109 to 133 s instead of 64.6 s. The wing-it altitude number is still written from `onUpdate` and its render passed the check; that is luck, not a rule. [07](07-the-edit.md#20-second-timer-ring-and-counter)
- **Relative tweens (`"+=50"`) on a property another tween also writes** break cold seeks in parallel workers. Use absolute values.
- **Root `data-duration` is read before scripts run**, so it must be a literal. It cannot be computed from the transcript or changed by `--variables`.
- **`data-track-index` does not set stacking order.** It only orders rows in Studio; CSS `z-index` and DOM order decide what is on top.
- **A composition with no timeline needs `data-no-timeline`**, or every render waits for the 45-second player-ready timeout.
- **Fonts:** a named `font-family` without `@font-face` that HyperFrames cannot resolve fails lint (`font_family_without_font_face`). Google Fonts families are fetched at compile time and cached in `~/.cache/hyperframes/fonts`, so the first render needs network access. Distributed (Lambda) renders cannot see system fonts.
- **The `font:` shorthand is invisible to HyperFrames 0.8.143.** The compiler and lint read only `font-family` declarations. `font: 600 26px Inter, sans-serif` is not fetched and not linted, and the text falls back to the system sans-serif, which differs between machines. Use `font-family`, `font-weight` and `font-size`, and check that the compile log counts every family you meant (`Injected deterministic @font-face rules for 2 requested font families` for the example). [07](07-the-edit.md#1-canvas-and-root)
- **`nested_structure_needs_subcomposition` warnings** on a single-file composition only affect the Studio timeline view. The render is unaffected.

## Rendering and environment

- **Pin the version.** Releases ship almost daily and the docs disagree in places: the default `--quality` (`looks` per `render --help`, `standard` in the rendering guide), whether async timeline setup is allowed, whether `#root` should have a hardcoded width. Trust `--help` of your pinned version.
- **Chrome Headless Shell** must be present: `npx hyperframes browser ensure`. `npx hyperframes doctor` checks the rest.
- **Telemetry is on by default.** `HYPERFRAMES_NO_TELEMETRY=1` or `npx hyperframes telemetry disable`.
- **Studio rewrites your HTML.** `preview` writes `data-hf-id` attributes into every `*.html` file in the project folder that contains `data-composition-id`, and reformats it. It skips dot-folders and `node_modules`. Keep source templates in a file that does not end in `.html` (the example uses `build/index.template.htm`), regenerate `index.html` with `npm run build` after a preview, and read `git diff` before you commit. [08](08-render-and-qa.md#3-preview)
- **`snapshot` sends frames to Gemini** when `GEMINI_API_KEY` is set. Pass `--describe false` to keep them local.
- **The `/hyperframes` skill runs `npx hyperframes usage --json`**, which reads your existing Claude Code credentials to show rate-limit windows. The `hyperframes-cli` skill also asks the agent to send `npx hyperframes feedback` after renders.
- **Outside Linux, capture runs through screenshots or draw-element.** BeginFrame capture is Linux only. A faster draw-element path is tried first where it can engage (`render --help`: macOS with a hardware GPU; our Windows machine with a GPU tried it too), after a self-check of four frames against screenshots at 32 dB PSNR. With the current template the check passes and the example renders in 64.6 s; when it failed, the render fell back to screenshots and took 109 to 133 s. [08](08-render-and-qa.md#4-render)
- **A failed self-check leaves files behind:** `hf-de-verify-fail-*/frame-N-truth.jpg` and `frame-N-de.jpg` in the system temp folder (`%TEMP%` on Windows). Compare the two to find the element that differs, then delete the folders (about 450 KB each; we had 9).
- **An 8 px black strip at the right edge** (columns 1072 to 1079 of 1080) in every frame of every render on our machine. It is an FFmpeg 8.1.2 bug that HyperFrames triggers, seen with the gyan.dev Windows build and untested elsewhere: ffmpeg's x86 SIMD conversion from yuv420p, yuvj420p or yuv422p to gbrp leaves every column after the last multiple of 16 black, and HyperFrames 0.8.143 converts every captured frame that way. Repro: `ffmpeg -f lavfi -i "color=c=white:s=1080x64,format=yuv420p" -frames:v 1 -vf format=gbrp out.png` (black columns 1072 to 1079; clean with `-cpuflags 0`). Snapshots skip ffmpeg and never show it. `npm run render` repairs it with `scripts/fix-right-edge.mjs`, which pads a flat color (`--mode fill`) or repeats column 1071 into the strip (`--mode smear`); the default, `--mode auto`, picks between them. `HYPERFRAMES_FFMPEG_PATH` selects another ffmpeg build (untested). Run the repro again after any ffmpeg change, and `node scripts/fix-right-edge.mjs <render.mp4> --dry-run` on your own renders. [08](08-render-and-qa.md#5-fix-the-right-edge)
- **Neither fill suits every edge.** A flat fill on footage or a gradient that reaches the right edge leaves a seam down the frame; smear on a flat page stretches anything that touches column 1071 into a bar to the edge (the handwash "x2" badge, for three frames). `fix-right-edge.mjs --mode auto` measures the two columns left of the strip and picks: 4 luma levels of spread on the handwash page gave fill, 68 to 76 on the spin-count gradient gave smear. [08](08-render-and-qa.md#5-fix-the-right-edge)
- **Full-length renders are not bit-identical** on our machine even with a deterministic composition: 530 of 924 frames matched in the latest pair (520 to 529 in earlier pairs), the rest differed invisibly (PSNR 51.4 dB or more), and the audio was identical. Judge a determinism check by audio equality and PSNR; frame hashes alone would report a failure here. [08](08-render-and-qa.md#7-determinism-check)
- **Determinism is strongest on Linux** (HeyGen's engine write-up); video-heavy renders should use one worker (`--workers 1`). `--docker` pins Chrome, fonts and FFmpeg for byte-identical output across machines (HyperFrames' claim; not tested here, no Docker on our machine).
- **Memory and disk:** each worker is a separate Chrome (about 256 MB). Machines with 8 GB of RAM or less get a one-worker low-memory profile. Raw frames written to disk take about 25 GB per minute of 1080p30 when the render is not streaming. The frame cache lives in the system temp folder; move it with `--frames-cache-dir`.
- **Output format limits:** GIF has no audio; HLS is SDR only and cannot use `--gpu`; the `/slideshow` workflow's MP4 output is silently truncated to its first scene (per its skill docs).
- **Captions sit on top of the footage.** Text behind a subject needs a matte (`/embedded-captions` or `npx hyperframes remove-background`). `/embedded-captions` and `/talking-head-recut` handle one continuous single-speaker clip and do no footage editing.
- **Studio does not keep caption timing edits** after a reload; visual caption overrides are saved, timing changes are live-preview only.
- **Workflow skills have extra dependencies:** `/music-to-video` needs Python with `librosa numpy soundfile`; `/embedded-captions` needs bash and `uvx whisperx`.
- **`FrameAdapter` is an experimental v0 API.** Prefer the GSAP path.
- **GSAP is free, including commercial use, under its own Standard License**, which is not an OSI license and restricts use in no-code visual animation tools that compete with Webflow. Video compositions are fine.

## Windows and network

- **`claude plugin marketplace add heygen-com/hyperframes` can fail with `EBUSY`** on a half-cloned folder. Restart Claude Code and run it again.
- **Node's built-in `fetch` ignores `HTTPS_PROXY`** unless `NODE_USE_ENV_PROXY=1` is set (tested on Node 24.18.0; older Node 22 releases may not support it). `npx` downloads use `npm_config_https_proxy` instead.
- **cdc.gov may refuse connections** from some networks. Download CDC media from Wikimedia Commons, with a descriptive User-Agent header.
- **Video attachment limit:** GitHub accepts video attachments up to 10 MB on repositories of free-plan accounts (100 MB on paid plans). Its docs describe attachments to issues, pull requests and comments; we have not tested an upload in the README editor. This repo ships the full renders as release assets (each release file must be under 2 GiB; the spin-count render is 33 MB, the wing-it render 27.3 MB) and three GIF previews in `docs/img/` (3.2 MB, 4.0 MB and 1.9 MB). Full-frame footage makes a GIF several times larger than a card on a flat page: 12 fps and 128 colors kept the wing-it and spin-count GIFs under 5 MB. [08](08-render-and-qa.md#9-sharing-the-full-video)

## Generated characters (paid path, not run by us)

These come from provider docs and our own planning; we have not run the generation steps.

- **A sheet passed as an image reference can show up in the output** as a grid or a floating head. Through Picsart's CLI, Seedance treats the input image as the first frame. Give video models one keyframe per scene; the sheet is for you. [02](02-character.md#3-the-sheet-two-images-with-two-jobs)
- **Re-rolling a face you like loses it.** Edit the approved image and change one thing per edit. [02](02-character.md#2-base-image-first-then-edit-never-re-roll-a-face-you-like)
- **Similes become props** ("like a microphone" can produce a microphone), and a canon line about hair across the face puts hair across the face. Describe literally. [02](02-character.md#42-macros-pasted-into-every-prompt)
- **Close-up prompts that list shoes come back wide.** Keep one appearance block per framing. [02](02-character.md#43-split-the-description-by-framing)
- **A seed does not hold a face.** The fal Seedance schema says results "may still vary slightly even with the same seed".
- **Generated songs can skip words**, a lone shouted number most easily. Transcribe every take without the lyrics and diff it with `node scripts/align-lyrics.mjs <dir> --heard <file> --dry-run` before any animation. [03](03-song-or-voice.md#6-qa-did-the-model-sing-or-say-every-word)
- **Prompted tempo and length are requests.** Measure every take.
- **Spell numbers as they are sung**, the same in the lyrics, the aligner and the video prompts. The aligner compares letters and digits, so "3" and "three" do not match.
- **Seedance 2.5 audio references:** each 1.8 to 30.2 s, all together at most 30.2 s, at most 15 MB, MP3 or WAV. Cut the song per scene, in the gaps between words. [04](04-animate.md#2-cut-the-song-per-scene-free)
- **Expect Seedance to sing the line again in its own timing**, with the mouth following that new soundtrack. Measure each take's lag against the master song; shift a clip with `data-media-start`. [04](04-animate.md#3-make-the-character-sing-seedance-25)
- **Seedance clip length does not follow the audio:** `duration` is 4 to 30 s or `auto`. Trim each clip to its scene and check lip sync.
- **Head turns cost retakes.** Lock the camera and use frontal close-ups for sung lines.
- **OmniHuman 1.5 on fal defaults to 1080p,** which caps audio at 30 s. Set 720p for up to 60 s.
- **Kling v3 on fal generates audio by default** (`generate_audio: true`, $0.168/s against $0.112/s). Turn it off for silent moves.
- **Dead or retiring model IDs:** Sora 2 API removed 2026-09-24; `gemini-3-pro-image-preview` gone (use `gemini-3-pro-image`); `lyria-3-pro-preview` has no shutdown date, but Google names `lyria-3.5` as its replacement; `veo-3.1-*-generate-preview` scheduled to shut down on 2026-10-22.
- **Higgsfield MCP and CLI spend plan credits** even on "unlimited" plans. Its API is a separate USD wallet. In Higgsfield's CLI, `nano_banana_2` resolves to Nano Banana Pro.
- **Picsart CLI saves every output to Picsart Drive** unless you pass `--no-save-to-drive`. Use `--max-cost` as a budget cap.
- **Lyria output carries a SynthID watermark,** and prompts for a specific artist's voice are blocked.
- **Kids content and products do not mix.** YouTube limits monetization of "Heavily promotional" kids content, and the YouTube Kids app does not allow paid placements. Keep "every scene is an ad slot" for adult audiences. [01](01-idea.md#5-money-what-holds-up)
- **Do not show view counters you did not measure** on a grid of your scenes; the FTC rule covers fake social-media indicators. [01](01-idea.md#6-red-flags-row-g)
- **Read the service's terms** before you publish generated assets or commit them to a public repo.
