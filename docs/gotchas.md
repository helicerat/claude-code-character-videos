# Gotchas

Every pitfall from the other docs, grouped by step. Versions: `hyperframes@0.8.143`, GSAP 3.14.2, Node 22 or newer.

## Idea

- **Kids content and products do not mix.** YouTube limits monetization of "Heavily promotional" kids content, and YouTube Kids allows no paid placements. [01](01-idea.md#5-money-what-holds-up)
- **Show only view counts you measured.** The FTC rule covers fake social-media indicators. [01](01-idea.md#6-red-flags-row-g)

## Character

- **A sheet passed as an image reference can show up in the output** as a grid or a floating head. Give video models one keyframe per scene. [02](02-character.md#3-the-sheet-two-images-with-two-jobs)
- **Re-rolling a face you like loses it.** Edit the approved image, one change per edit. [02](02-character.md#2-base-image-first-then-edit-never-re-roll-a-face-you-like)
- **Similes become props.** "Like a microphone" can produce a microphone. [02](02-character.md#42-macros-pasted-into-every-prompt)
- **Close-up prompts that list shoes come back wide.** Keep one appearance block per framing. [02](02-character.md#43-split-the-description-by-framing)
- **A seed does not hold a face.** The fal Seedance schema says results "may still vary slightly even with the same seed".
- **Higgsfield MCP and CLI spend plan credits**, even on "unlimited" plans. Its API is a separate USD wallet.
- **Picsart CLI saves every output to Picsart Drive** unless you pass `--no-save-to-drive`. Cap spend with `--max-cost`.
- **Read each service's terms** before you publish generated assets or commit them to a public repo.

## Song or voice

- **Generated songs can skip words**, a lone shouted number most easily. Diff every take with `node scripts/align-lyrics.mjs <dir> --heard <file> --dry-run`. [03](03-song-or-voice.md#6-qa-did-the-model-sing-or-say-every-word)
- **Prompted tempo and length are requests.** Measure every take.
- **Spell numbers as they are sung**, everywhere. The aligner compares letters and digits, so "3" and "three" do not match.
- **Lyria output carries a SynthID watermark**, and prompts for a specific artist's voice are blocked.

## Animation

- **Seedance 2.5 audio references** are 1.8 to 30.2 s each, 30.2 s combined per request, MP3 or WAV up to 15 MB. Cut the song per scene, between words. [04](04-animate.md#2-cut-the-song-per-scene-free)
- **Seedance sings the line again in its own timing.** Measure each take's lag and shift the clip with `data-media-start`. [04](04-animate.md#3-make-the-character-sing-seedance-25)
- **Seedance clip length does not follow the audio** (`duration` is 4 to 30 s or `auto`). Trim each clip and check lip sync.
- **Head turns cost retakes.** Lock the camera and use frontal close-ups for sung lines.
- **OmniHuman 1.5 on fal defaults to 1080p**, which caps audio at 30 s. Set 720p for up to 60 s.
- **Kling v3 on fal generates audio by default** ($0.168/s against $0.112/s). Set `generate_audio: false` for silent moves.
- **Retired model IDs.** Sora 2 API removed 2026-09-24; `gemini-3-pro-image-preview` gone (use `gemini-3-pro-image`); `veo-3.1-*-generate-preview` shuts down 2026-10-22; Google names `lyria-3.5` as the replacement for `lyria-3-pro-preview`.

## Footage

- **Burned-in captions** duplicate your karaoke text. Crop them off first; `cropdetect` finds black bars only. [05](05-or-use-existing-footage.md)
- **Agency logos are excluded from public-domain reuse** (CDC; NASA under 14 CFR 1221). The CDC clip ends on a logo card from 25.17 s: never use it as a thumbnail, and cut earlier to remove it. [05](05-or-use-existing-footage.md#a-five-minute-license-check)
- **A public-domain tag on Commons is the uploader's claim.** Check the source, the music and third-party material inside.
- **Stock licenses forbid redistributing the raw file.** Keep media out of git and ship a fetch script. Big Buck Bunny's score is CC BY-NC-ND 3.0, though the film is CC BY.
- **A stock page lists other people's work next to the item.** Copy the author's name from the box next to the Download button. [05](05-or-use-existing-footage.md#a-pixabay-clip-and-track-the-spin-count-example)
- **CC BY needs more than a credit in the frame.** For a Blender Studio open movie, credit `(CC) Blender Foundation | studio.blender.org`, link the license and say what you changed, in the post too. [05](05-or-use-existing-footage.md#a-blender-open-movie-the-wing-it-example)
- **One crop does not fit a 16:9 film in a 9:16 frame.** Cut at the shot changes and crop each shot around its subject. [05](05-or-use-existing-footage.md#a-916-cut-shot-by-shot)
- **Scene detection misses quiet cuts.** Check every candidate on a contact sheet.
- **Film sound can carry a swear.** `volume=0.12` over its span leaves it about 18 dB quieter, not gone. `volume=0` mutes it.
- **Free stock music can be registered with Content ID**, and a video with it can get a claim. Read the music page first.
- **Sparse keyframes freeze frames.** x264 defaults to one keyframe per 250 frames. Encode footage with `-g 30 -keyint_min 30`.
- **A wrong sample-rate label plays audio at the wrong speed**, with no error. Probe every input and output; never hard-code 44100. [05](05-or-use-existing-footage.md#always-probe-sample-rate-and-duration)
- **H.264 with yuv420p needs even dimensions.** Scale with `-2`.
- **Footage width must be a multiple of 16**, or the footage gets a dark band at its right edge. Encode 1088 or 1024 wide. [08](08-render-and-qa.md#5-fix-the-right-edge)
- **The output is always 48 kHz AAC.** Check that video and audio durations still match.

## Word timing

- **Whisper mishears singing.** Take timings from the model and text from your lyrics (`npm run align`). [06](06-word-timing.md)
- **Whisper invents words over silence.** The aligner drops words that are not in the lyrics.
- **A skipped word looks like a timing gap.** The aligner marks it `interpolated`.
- **`npx hyperframes@0.8.143 transcribe` can overwrite your work.** It rewrites the first `const script = [...]` or `const TRANSCRIPT = [...]` in every `.html` file under the output folder. Never pass `--dir` with an example folder.
- **`.en` whisper models translate** non-English audio into English. Always pass `--model` and `--language`.
- **whisper.cpp is not prebuilt on Windows.** Parakeet (`npx hyperframes@0.8.143 models install parakeet`) is the local alternative.
- **OpenAI word timestamps work only on `whisper-1`.** Groq needs `response_format=verbose_json` with `timestamp_granularities[]=word`.
- **Marks read by eye miss things.** Check every mark with a frame grab. [06](06-word-timing.md#timings-without-words-beats-and-visual-marks)
- **A story event is a cut or an action, and they differ.** Decide which one the edit reacts to, and note what the frame shows in `events.json`. [06](06-word-timing.md#story-events-stepping-through-frames)

## The edit

- **No registered timeline, no motion.** Register one paused timeline synchronously under the composition id, or the render is a still frame. [07](07-the-edit.md#3-one-paused-timeline)
- **`<audio>` without an `id` renders silent** (`media_missing_id`). The HyperFrames README's own example omits it. [07](07-the-edit.md#2-media)
- **Every `<video>` is `muted`** or carries `data-has-audio="true"`. Never play, pause or seek media from script.
- **No `translate(-50%, -50%)` on an element GSAP moves.** Center with `left: 50%` and a negative margin, or `xPercent`.
- **Never tween a `.clip` itself.** Animate its children.
- **`fromTo` applies its from-state when the timeline is built.** Hide in CSS what starts hidden; use `to` or `immediateRender: false` for later changes. [07](07-the-edit.md#4-fromto-applies-its-from-state-at-build-time)
- **No wall clock, unseeded randomness or `fetch` during the render.** [07](07-the-edit.md#3-one-paused-timeline)
- **Never measure or write the DOM from a timeline callback.** Tween `textContent` with `snap`. [07](07-the-edit.md#6-counters-tween-textcontent-never-write-from-onupdate)
- **Relative tweens (`"+=50"`) break cold seeks.** Use absolute values.
- **Root `data-duration` must be a literal.** `--variables` cannot change it.
- **`data-track-index` does not set stacking order.** CSS does.
- **A composition with no timeline needs `data-no-timeline`**, or every render waits for a 45-second timeout.
- **The first render needs network access** to fetch Google Fonts. Distributed (Lambda) renders cannot see system fonts.
- **The `font:` shorthand is invisible to HyperFrames.** Use `font-family`. [07](07-the-edit.md#fonts-font-family-never-the-font-shorthand)
- **Giant multi-word text wraps** in a fixed-width box. Add `white-space: nowrap`. [07](07-the-edit.md#7-giant-text-on-one-line)

## Render and QA

- **Pin the version.** HyperFrames docs disagree in places; trust `--help` of the pinned version.
- **Telemetry is on by default.** Set `HYPERFRAMES_NO_TELEMETRY=1`.
- **Studio rewrites every `*.html` composition file** it opens. Keep the source in a `.htm` template. [08](08-render-and-qa.md#3-preview)
- **`snapshot` sends frames to Gemini** when `GEMINI_API_KEY` is set. Pass `--describe false`.
- **The `/hyperframes` skill runs `npx hyperframes usage --json`**, which reads your Claude Code credentials. The `hyperframes-cli` skill asks the agent to send `npx hyperframes feedback`.
- **A failed draw-element self-check doubles the render time** and leaves `hf-de-verify-fail-*` folders in the temp folder. [08](08-render-and-qa.md#4-render)
- **ffmpeg 8.1.2 blacks out the last 8 columns** of every HyperFrames frame (an x86 SIMD bug in its gbrp conversion, gyan.dev Windows build). `npm run render` repairs it with `scripts/fix-right-edge.mjs`. [08](08-render-and-qa.md#5-fix-the-right-edge)
- **Neither fill suits every edge.** `--mode auto` picks flat fill or smear. [08](08-render-and-qa.md#5-fix-the-right-edge)
- **Full-length renders are not bit-identical.** Judge by identical audio and a lowest PSNR above about 50 dB. [08](08-render-and-qa.md#7-determinism-check)
- **Each worker is a separate Chrome**, about 256 MB. Raw frames take about 25 GB per minute of 1080p30 when not streaming.
- **GIF has no audio, and GitHub caps video attachments at 10 MB** on free plans. Publish full renders as release assets. [08](08-render-and-qa.md#9-sharing-the-full-video)
- **GSAP's Standard License** is free for commercial use but not OSI, and restricts no-code visual animation tools that compete with Webflow. Video compositions are fine.

## Setup and network

- **`claude plugin marketplace add` can fail with `EBUSY`.** Restart Claude Code and run it again.
- **Node's built-in `fetch` ignores `HTTPS_PROXY`** unless `NODE_USE_ENV_PROXY=1` is set. `npx` uses `npm_config_https_proxy`.
- **Download CDC media from the Wikimedia Commons original upload**, with a descriptive User-Agent, as `scripts/fetch-assets.mjs` does.
