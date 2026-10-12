---
name: character-video
description: Makes a short 1080x1920 video with a character and a motion-graphics edit written as code. Entry A generates a character, keyframes, a song or voice and animated clips through a CLI or MCP server the user logs into, with the price stated and an OK before every paid call. Entry B starts from existing footage and a song or track. Both continue with timings (words, beats, marks or story events), an HTML + GSAP edit, a reviewer pass and a HyperFrames render. Use for an AI character or mascot that sings or talks, a lyric or karaoke video, a count-the-moves video, a checklist over a film scene, or a clip and a song to turn into a short. Stops after the brief, before every paid call, after the timings and before each render.
---

# character-video

Runs the [claude-code-character-videos](https://github.com/helicerat/claude-code-character-videos) pipeline from idea to render. This file is the procedure and its stop points. Each step names the repo prompt that holds the exact commands; read it before you run the step.

Pick the example closest to the job and read its `README.md` and `build/index.template.htm` before you write any edit:

| Example | Timings from | Edit |
|---|---|---|
| `examples/handwash-song` | words: Whisper timestamps aligned to `lyrics.txt` | karaoke, a timer, board words with `x2` badges |
| `examples/spin-count` | marks read from frames, plus a beat grid | counter pills that fill as the marks pass |
| `examples/wing-it` | story events read from frames, in a film cut to 9:16 shot by shot | a checklist that ticks or crosses as the story reaches each item |

Entry A follows `prompts/generate/`, which is written from provider docs. Before the first paid call, tell the user the prompts may need tuning.

## Requirements

- Node 22 or newer, ffmpeg and ffprobe on PATH.
- A clone of the repo. Every script in `scripts/` has `--help`; read it before first use. If the current directory is not the repo, ask for the path to the clone.
- HyperFrames through npx, always pinned: `npx hyperframes@0.8.143`. Install nothing globally yourself.
- Entry A: a generation CLI or MCP server (Picsart `gen-ai`, Higgsfield, fal; see `docs/00-how-it-works.md`). The user installs it and logs in.

## Ground rules

- `HYPERFRAMES_NO_TELEMETRY=1` in every shell that runs HyperFrames. `--describe false` on every `snapshot` (otherwise frames go to Gemini when `GEMINI_API_KEY` is set). Never run `npx hyperframes feedback` or `usage`.
- **Money.** Before every paid call, state the model, the provider, the number of calls or seconds and the list price, then wait for an OK. One OK covers one stated batch. Log every paid call in `costs.csv`, rejected takes included, and give the running total at each stop.
- **Keys** stay with the user. Read `GROQ_API_KEY` and `FAL_KEY` from the environment; never print, write or paste them.
- **Ask before** uploading audio to an API, installing a model or catalog item, any paid generation, and every render.
- **The template is the source.** Edit `build/index.template.htm` (keep `.htm`: HyperFrames Studio writes `data-hf-id` into every `*.html` in the project) and run `node scripts/build.mjs <project>` to write `index.html`. After any `preview`, rebuild and review `git diff`.
- Never commit media (`*.mp4`, `*.webm`, `*.mp3`, `*.wav`, generated images, `gsap.min.js`, `renders/`, `snapshots/`). Check `git status` before any commit.
- Probe every input and output with `node scripts/probe.mjs`. Never assume a sample rate.
- Content (`docs/01-idea.md`, section 6): an original character, no real people or existing characters, no studio or franchise names in prompts, no products in anything aimed at children, no view counts the user did not measure, and the AI label each platform needs.

The project folder is `projects/<name>` unless the user picks another. Create it with `npm run new -- <name>`: a starter edit that lints and renders on placeholder media, with marks in `marks.json` (the `/*MARKS*/[]` placeholder). Replace the media and the edit; keep the build and the contract. Its timing data is `transcript.json`, `marks.json` plus `beats/`, or `events.json` (with `shots.json` for a film cut shot by shot).

## Step 0: choose the entry point

Ask, unless the user already said:

- **A, generate:** a new character through a generation service.
- **B, existing footage:** a clip and a song or track, one video with its own soundtrack, or public-domain or free stock footage to find. Then ask what drives the timing: **words** (S1), **beats and marks** (S1-M) or **story events** (S1-E).

## Entry A: generate

| # | Prompt in `prompts/generate/` | What it makes | Cost | Stops |
|---|---|---|---|---|
| 1 | `gen-00-idea.md` | 3 scored formats from the user's links and numbers, then `BRIEF.md` | free | pick a format |
| 2 | step 1 of `gen-03-song.md` or `gen-06-talking.md` | lyrics or script, one line per scene, the hook from 0:00 | free | approve the words |
| 3 | `gen-01-character.md` | 4 pitches, base image, edits, `sheet.png`, `ref.png`, `CHARACTER.md` | paid | pick; cost; base image; cost |
| 4 | `gen-02-keyframes.md` | `STORYBOARD.md`, one keyframe per line | paid | storyboard; cost; first 2 keyframes |
| 5 | `gen-03-song.md` | 2 takes at a time, each checked word by word, at most 6 | paid | cost per batch; after 6 takes |
| 6 | `gen-04-cut-song.md` | one audio piece per scene, cut in gaps between words | free | |
| 7 | `gen-05-animate.md` or `gen-06-talking.md` | `PROMPTS.md`, a 2-scene pilot, then batches of about 5 | paid, most of the bill | prompts; cost; pilot; cost per batch |

- Never re-roll an approved face; each edit changes one thing. `ref.png` is image 1, never the sheet. At most 5 character images per call.
- Transcribe every take blind (`npx hyperframes@0.8.143 transcribe <take> --model medium.en --dir <scratch folder>`, or Groq after the user approves the upload) and diff with `node scripts/align-lyrics.mjs <project> --heard <transcript> --dry-run`. Reject a take with any missing number or step word.
- After two identical failed takes, change one variable instead of paying for a third.

Then assemble: trim each clip to its scene and join them into `assets/footage.mp4` (1088 wide, a keyframe every 30 frames), or keep one muted `<video>` per scene at a width that is a multiple of 16. The master song becomes `assets/song.mp3`. Run `prompts/00-brief.md` to add the "On screen" section and the credit line, then continue with S1.

## Entry B: existing footage

1. **Brief** (`prompts/00-brief.md`). Collect the footage, the audio, the lyrics source (words only) and the one sentence the video proves: for marks, what is counted and the rule for one mark; for events, the plan the story breaks. Claude cannot hear audio, so lyrics come from the user, a published source or burned-in captions. For licenses:
   - give each source's license, credit line, redistribution and logo or endorsement rules, with links; mark anything unconfirmed as unverified
   - Pixabay or Pexels: copy the uploader from the author box next to the Download button, not from related-media cards; note a "Content ID Registered" label on music
   - CC BY films (Blender Studio's open movies): use the film page's attribution line, link the license, say what was changed; logos and trademarks are excluded

   **STOP A.** Show the license table, `lyrics.txt` and `BRIEF.md`. Wait for approval.

2. **Assets** (`prompts/edit/01-assets.md`): download, probe, crop and trim, then make `assets/footage.mp4` (1088 or 1024 wide, a keyframe every second, no audio), `assets/song.mp3` and `assets/gsap.min.js`. Pixabay downloads need a descriptive User-Agent and `Referer: https://pixabay.com/`, as `scripts/fetch-spin-assets.mjs` sends. Three recipes from the examples:
   - slow a clip with `setpts=PTS/<factor>` before `fps=30` (spin-count: 0.85), and divide marks read in the source by the factor
   - put a 16:9 film into 9:16 by cutting at its own shot changes and cropping each shot around its subject, with a wide shot as a 16:9 card over a blurred copy (`shots.json` and `scripts/fetch-wing-assets.mjs`)
   - turn down a swear with `volume=enable='between(t,<from>,<to>)':volume=0.12`, and say so in the brief

## Shared steps

### S1. Word timing (STOP B)

Run `prompts/edit/02-word-timing.md`. Ask which engine first: Groq (`scripts/transcribe-groq.mjs`, uploads the audio) or local Parakeet through `npx hyperframes@0.8.143 transcribe --engine parakeet`. **Always point `--dir` at a scratch folder**, never the project: `transcribe` overwrites `transcript.json` and rewrites `const TRANSCRIPT` in the HTML there. `node scripts/align-lyrics.mjs <project>` then writes `transcript.json` with text from `lyrics.txt` and times from the ASR. Never edit `lyrics.txt` yourself.

**STOP B.** Show the substitutions, missed and dropped words, word counts and sanity checks. Wait for approval.

### S1-M. Beats and marks (STOP B)

Method: `docs/06-word-timing.md`, "Timings without words".

1. `npx hyperframes@0.8.143 beats <project>` writes `beats/<audio>.json` and leaves the HTML alone. Use a grid (`BEAT0`, `BEAT`) only if the spacing is steady.
2. Read contact sheets of the source at 4 fps (`fps=4,scale=180:-2,tile=8x2`, under `assets/frames/`), then every frame for 0.6 s around each candidate, and pick the peak. Write `marks.json` with source times and the slow-down factor.
3. Read the frame at each mark on one sheet. List every moment that looks like the event but has no mark.

**STOP B.** Show the marks table, the check sheet and the beat summary.

### S1-E. Story events (STOP B)

Method: `docs/06-word-timing.md`, "Story events: stepping through frames".

1. Read sheets of the cut footage at 4 fps and write down the story beats in order.
2. For each beat, read every frame for 1 to 1.5 s around it and pick the frame. Note whether the event lands on the cut or on the action inside the shot.
3. Write `events.json`: time in the footage, time in the source, what the frame shows. Group what the edit counts or ticks.
4. Read the frame at each event on one sheet. Report every event that lands off its action, and by how much.

**STOP B.** Show the events table and the check sheet.

### S2. Edit

Run `prompts/edit/03-edit.md`, with the matching example's template as the reference. `docs/07-the-edit.md` walks through all three edits layer by layer.

- Keep the data shape: the `/*TRANSCRIPT*/[]` placeholder with `LINES` and `SLOTS` as word indices; or one array of marks, the same numbers as `marks.json`; or event arrays (`ITEMS`, `GADGETS` in wing-it), the same numbers as `events.json`. With no placeholder and no `transcript.json`, `build.mjs` copies the template unchanged.
- Key every reaction to a word, mark, beat or event. Literal seconds only for the intro, short offsets relative to an event, and the total duration. The root `data-duration` equals `END` and is no longer than the shorter of footage and song.
- Every number on screen is computed from the data or cited in `BRIEF.md`.
- Follow the composition contract in the repo's `AGENTS.md`: one paused GSAP timeline on `window.__timelines`, no clocks or randomness, no media control from script, no DOM writes from timeline callbacks, hidden `fromTo` from-states, fonts named with `font-family`.
- Search the catalog (`npx hyperframes@0.8.143 catalog <words>`) before hand-animating an effect. Ask before `add`.
- Build, then lint: 0 errors, each warning explained.

### S3. Review (STOP C, before any render)

Run `prompts/edit/04-review.md` as a separate pass: a fresh subagent if available, otherwise yourself, changing nothing during the pass. For a video without words, swap the snapshot times:

- mark-driven: 0 and 0.05 s (nothing shows before its intro), each mark + 0.3 s (the right number) and + 0.7 s (the right pill on)
- event-driven: 0 and 0.05 s, and each event + 0.2 s (the item in its new state, the score right, no text over text)

**STOP C.** Show `REVIEW.md` and the review contact sheet. Apply only the fixes the user picks, rebuild, lint and re-snapshot the affected times. Do not render until the user says so.

### S4. Draft render, edge fix, determinism (STOP D)

Run steps 1 to 7 of `prompts/edit/05-render.md`.

- Fix the right edge after every render with `scripts/fix-right-edge.mjs`. With ffmpeg 8.1.2 (gyan.dev Windows build), HyperFrames 0.8.143 renders carry an 8 px black strip at x 1072 to 1079. Report the mode `--mode auto` picked; with no strip the script copies the file unchanged.
- A dark band at the right edge of the footage itself means the footage is not a multiple of 16 wide.
- Compare raw renders, never fixed ones. Audio must be identical; differing frames must stay above about 50 dB PSNR.
- `drawElement self-verification failed` in the log means a timeline callback writes to the page.

**STOP D.** Show the render time, edge report, probe, sound checks and frame comparison. Wait until the user has watched `draft-a.mp4` and approves.

### S5. Delivery render

Run steps 8 to 10 of `prompts/edit/05-render.md`. A README preview GIF is 6 to 8 s, 360 px wide, under 5 MB, with no logo or end card. Hand off: output path, duration, render times, sizes, lint and determinism results, the credit line, the cost total from `costs.csv` (entry A), and anything you could not check.

## Reference values (HyperFrames 0.8.143)

| Example | Length | Frames | Lint warnings | Edge fix | Expected `check` findings |
|---|---|---|---|---|---|
| wing-it | 32.5 s | 975 | 1 | smear | transparent chip glyphs before their events (by design); contrast errors on the white tick, the RESULT label and the credit line |
| spin-count | 21.5 s | 645 | 1 | smear | contrast errors on the unlit pill numbers and the credit line (2.91:1) |
| handwash-song | 30.8 s | 924 | 2 | fill | contrast errors on `#ring-lbl` (3.72:1) and `#credit` (2.64:1); warnings on unlit words and on overlap during line crossfades |

The lint warnings are `nested_structure_needs_subcomposition`, harmless for a single-file composition. wing-it writes its altitude number from `onUpdate`, against the contract, to match its published render; do not copy it.

## costs.csv

One row per paid call, written as it happens:

```csv
date,step,model,provider,units,unit_price_usd,total_usd,kept,note
2026-10-09,character,gemini-3-pro-image,google,1 image,0.134,0.134,yes,base image
```

`units` is images, takes, characters or seconds of video. Use list prices from the provider pages, and name the source of any other price. Retakes typically double or triple the single-pass estimate in `docs/00-how-it-works.md`.

## Installing this skill

Copy `skills/character-video` into `~/.claude/skills/` (all projects) or `<project>/.claude/skills/` (one project), then start a new Claude Code session.

```bash
mkdir -p ~/.claude/skills && cp -r skills/character-video ~/.claude/skills/
```

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
Copy-Item -Recurse skills\character-video "$HOME\.claude\skills\"
```

Ask for it by name ("use character-video on examples/my-video") or describe the job: "make a video with an AI mascot that sings about brushing teeth", "make a lyric video from this clip and song", "count the jumps in this clip, to this track", "put a pre-flight checklist over this short-film scene".
