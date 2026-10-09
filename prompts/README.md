# Prompts

Prompts that take a video through the whole pipeline in this repo, one step at a time. Paste them into Claude Code from the root of the repo, in order. Every prompt stops for you at least once.

There are two ways in, and they meet at the brief:

- **Entry A, generate the character** (`generate/`). Idea, character, keyframes, song or voice, animation. These steps call paid models. **Status: written from provider docs, not run for this repo.** Each prompt makes Claude state the price and wait before every paid call, and log every take in `costs.csv`.
- **Entry B, bring existing footage and a song.** No generation, no cost. This is how all three examples were made: `examples/wing-it` (a CC BY film scene with its own sound, cut to 9:16 shot by shot and timed by story events read from frames), `examples/spin-count` (a Pixabay clip and track, timed by beats and spin marks read from frames) and `examples/handwash-song` (a public-domain cartoon with its own song, timed by its words). The edit prompts take their commands and reference numbers from handwash-song; for a video without words, use [docs/06-word-timing.md](../docs/06-word-timing.md#timings-without-words-beats-and-visual-marks) (beats and marks) or [its story-events section](../docs/06-word-timing.md#story-events-stepping-through-frames) in place of `02-word-timing.md`. The prompts as written have not been run end to end on new material.

Both continue with [`00-brief.md`](00-brief.md) and the five edit prompts.

## Entry A: generate (`generate/`)

| # | File | Pipeline step | Model (list price, 2026-10-09) | Stops for you |
|---|---|---|---|---|
| gen-00 | [gen-00-idea.md](generate/gen-00-idea.md) | 1. idea | none, Claude Code only | after 3 scored formats, then after `BRIEF.md` |
| gen-01 | [gen-01-character.md](generate/gen-01-character.md) | 2. character | Nano Banana Pro ($0.134 per 1K/2K image) or GPT Image 2 | after 4 pitches, after the base image, before each paid call |
| gen-03, part 1 | [gen-03-song.md](generate/gen-03-song.md) | 3. lyrics | none | after `lyrics.txt` and its timing table |
| gen-02 | [gen-02-keyframes.md](generate/gen-02-keyframes.md) | 2. keyframes | Nano Banana Pro edit with `ref.png` as the reference | after `STORYBOARD.md`, after the first 2 keyframes |
| gen-03, part 2 | [gen-03-song.md](generate/gen-03-song.md) | 3. song takes and the word check | Lyria 3 Clip ($0.04, always 30 s) or Lyria 3.5 ($0.08); ElevenLabs Music when scene lengths must be exact | before each batch of takes, after 6 takes |
| gen-04 | [gen-04-cut-song.md](generate/gen-04-cut-song.md) | 4. cut the song per scene | ffmpeg, no cost | |
| gen-05 | [gen-05-animate.md](generate/gen-05-animate.md) | 4. singing clips | Seedance 2.5 reference-to-video with an audio reference ($0.10 to $0.57 per second) | after `PROMPTS.md`, after the pilot, before each batch |
| gen-06 | [gen-06-talking.md](generate/gen-06-talking.md) | 3 and 4 for a talking character | Eleven v4 ($0.08 per 1,000 characters; promo $0.022 until 2026-10-12) or Gemini TTS for the voice; OmniHuman 1.5 or Kling AI Avatar v2 for the lip-sync | after `script.txt`, before each paid call, after the first talking clip |

Rules that run through every generation prompt (explained in [docs/02-character.md](../docs/02-character.md) and [docs/04-animate.md](../docs/04-animate.md)):

- **Pick and approve before you pay.** Pitch the idea and the character, wait for a choice, show the price, stop after the first output.
- **Identity is text plus image.** The appearance block and the style sentence from `CHARACTER.md` are pasted word for word into every image and video prompt.
- **The sheet is never a video input.** Models get `ref.png` for identity and one keyframe per scene as the picture to animate.
- **Words are checked before pictures move.** Every song take and every voice line is transcribed blind and diffed against the text with `scripts/align-lyrics.mjs`.
- **No lettering in generated footage.** Every prompt ends with "No on-screen text, lettering or logos"; all type comes from the edit, where it is spelled right and timed to the word.

How the agent calls the models: through an aggregator CLI or MCP server you log into yourself (Picsart `gen-ai`, Higgsfield, fal; see [docs/00-how-it-works.md](../docs/00-how-it-works.md#how-claude-code-reaches-the-paid-models)). Keys and logins stay with you. Never paste keys into prompts.

The prompts are our own. Short quotes from Picsart's MIT-licensed skills and from Google's CC BY 4.0 docs keep their attribution and link.

## Shared: the brief

| File | What it does | Stops for you |
|---|---|---|
| [00-brief.md](00-brief.md) | entry B: license checks, `lyrics.txt`, `BRIEF.md`. Entry A: terms and AI labels, an "On screen" section added to `BRIEF.md` | yes, approve the brief |

## The edit (`edit/`), both entries

| # | File | Pipeline step | Stops for you |
|---|---|---|---|
| 1 | [01-assets.md](edit/01-assets.md) | footage and song files: download, crop, re-encode, probe (entry A: join the scene clips) | yes, approve the crop |
| 2 | [02-word-timing.md](edit/02-word-timing.md) | 5. transcribe, align to your lyrics, report mismatches | yes, approve the timings |
| 3 | [03-edit.md](edit/03-edit.md) | 6. build the HyperFrames composition, lint, snapshot | yes, before any render |
| 4 | [04-review.md](edit/04-review.md) | 6. separate reviewer pass that only reports | yes, decide what to fix |
| 5 | [05-render.md](edit/05-render.md) | 7. draft render, right-edge fix, determinism check, delivery render, probe | yes, approve the draft |

These were written after the example was built, to make the method repeatable on other material. They are not a log of the session that produced the example.

## Conventions

- The project folder is `examples/my-video`. Change it in the prompt if you want another name. Paste every prompt from the repo root; the generation prompts say which paths are inside the project folder.
- Text in `<ANGLE BRACKETS>` is yours to fill in.
- HyperFrames is pinned: `npx hyperframes@0.8.143`. Telemetry is off with `HYPERFRAMES_NO_TELEMETRY=1`.
- Media never goes into git. The repo's `.gitignore` covers media files under `examples/*/assets/` (subfolders included), `renders/` and `snapshots/`; still run `git status` before you commit.

If you would rather run everything as one command with the same stop points, install the skill in [`skills/character-video`](../skills/character-video/SKILL.md).

Before the first prompt, run one of the examples once (see [`examples/wing-it/README.md`](../examples/wing-it/README.md), [`examples/spin-count/README.md`](../examples/spin-count/README.md) or [`examples/handwash-song/README.md`](../examples/handwash-song/README.md)). If it renders on your machine, the toolchain works and any later problem is in your material.
