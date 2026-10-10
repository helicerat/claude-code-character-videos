# 03 Edit

**What it does:** writes the HyperFrames composition by adapting the example's template, keys every animation to `transcript.json`, builds `index.html`, lints it and takes snapshots. It does not render.

**What you should see:** `build/index.template.htm`, a generated `index.html`, the printed `LINES` and `SLOTS` tables, the catalog searches and what came of them, lint with 0 errors, and `snapshots/contact-sheet.jpg` with one frame per lyric line.

**Before you paste:**

- [`00-brief.md`](../00-brief.md), [`01-assets.md`](01-assets.md) and [`02-word-timing.md`](02-word-timing.md) are done: `BRIEF.md`, `lyrics.txt`, `assets/footage.mp4`, `assets/song.mp3`, `assets/gsap.min.js` and an aligned `transcript.json` exist.
- `npx hyperframes@0.8.143 browser ensure` has run once.
- Optional: the HyperFrames plugin for Claude Code (`claude plugin marketplace add heygen-com/hyperframes`, then `claude plugin install hyperframes@hyperframes`). The prompt works without it. On Windows, if `marketplace add` fails with `EBUSY` on a half-cloned folder, restart Claude Code and retry.

## Prompt

```text
Build the edit for examples/my-video with HyperFrames (https://github.com/heygen-com/hyperframes), using the CLI pinned as npx hyperframes@0.8.143 with HYPERFRAMES_NO_TELEMETRY=1 set. If HyperFrames skills are available in this session (hyperframes-core, hyperframes-cli), follow their composition rules. Do not run hyperframes init: the project folder already exists and has its own layout.

Inputs in examples/my-video: BRIEF.md, lyrics.txt, transcript.json, assets/footage.mp4, assets/song.mp3, assets/gsap.min.js.
Reference: examples/handwash-song/build/index.template.htm. Read all of it before writing anything, then create examples/my-video/build/index.template.htm from it. Keep the .htm extension: HyperFrames Studio writes data-hf-id attributes into every *.html file in the project folder when it previews, and the template must stay clean. Change the content and keep the architecture: a /*TRANSCRIPT*/[] placeholder that scripts/build.mjs fills, LINES and SLOTS as word indices, one paused GSAP timeline.

Layers, bottom to top. Keep the ones BRIEF.md asks for:
1. Footage card: <video id="footage" src="assets/footage.mp4" muted playsinline> with data-start, data-duration, data-track-index. Sound comes only from a separate <audio id="song" src="assets/song.mp3">.
2. Kinetic headline from BRIEF.md: each word in an overflow:hidden row, revealed with yPercent 110 -> 0, staggered.
3. Timer ring and counter: start at the first sung word, stop at the end of the last one, show whole seconds.
4. Progress bar across the whole duration.
5. A giant round number before each pass of a repeated song.
6. Karaoke, one lyric line at a time: each word darkens and scales up at its start, a small bubble pops above it, the line leaves before the next one enters.
7. Board: on its first sung occurrence a board word pops over the footage and flies into its slot; each later occurrence bumps the slot and shows an "x2" badge (x3 and so on if sung more often).
8. Outro with the number from BRIEF.md, and the credit line from BRIEF.md at the bottom.

Timing rules:
- Every sung event is keyed to TRANSCRIPT[i].start or TRANSCRIPT[i].end. Compute LINES (first and last word index of each lyric line, from lyrics.txt) and SLOTS (board word, index of each occurrence) from lyrics.txt and transcript.json, write them into the template as index constants, and print both tables for me.
- Literal seconds are allowed only for the intro before the first sung word, short offsets relative to a word, and the total duration.
- The root data-duration and the END constant are the same number, no longer than the shorter of footage.mp4 and song.mp3 from the probe, rounded down (the example uses 30.8 for 30.83 s of footage and 30.89 s of song), unless BRIEF.md says otherwise. Every clip's data-duration matches it. Never change data-duration from JS; HyperFrames reads it before scripts run.
- Any number shown on screen (seconds of singing, counts) is computed from transcript.json or quoted from a source in BRIEF.md. Tell me where each one comes from.

Determinism and HyperFrames rules:
- One gsap.timeline({ paused: true }), registered synchronously as window.__timelines["<data-composition-id>"].
- No Math.random, Date.now, performance.now, requestAnimationFrame, setTimeout, setInterval or fetch. Never play, pause or seek media from script.
- Do not center anything GSAP moves with translate(-50%,-50%); use flex, left/top, or xPercent/yPercent. Do not tween visibility, display or autoAlpha on .clip elements.
- Lay out with fixed sizes; do not measure the DOM inside tweens.
- No timeline callback (onUpdate, onComplete) writes to the page. A number on screen is the element's textContent, tweened with snap: { textContent: 1 }, as the example's timer counter does. A DOM write from a timeline callback can fail HyperFrames' draw-element self-check, and then the whole video is captured again with screenshots at about twice the time.
- GSAP loads from assets/gsap.min.js. Fonts: Poppins and Inter only, unless you add an @font-face pointing to a local file. Name every font with the font-family property (plus font-weight and font-size), never only inside the font: shorthand: HyperFrames 0.8.143 neither fetches nor lints a family named that way, and the text silently falls back to the system font. In the snapshot output (step 3 below), check that the compiler line says "Injected deterministic @font-face rules for N requested font families" with N equal to the number of families you use.

Catalog first: before hand-animating an effect, search the HyperFrames catalog with npx hyperframes@0.8.143 catalog <words>, for example "karaoke", "progress ring", "number pop", "counter", "board". For each search tell me the top items and whether you used one. Most catalog items are 1920x1080, and caption components ship as demos with a fixed word list and timeline, so anything you take must be resized for 1080x1920 and rewired to TRANSCRIPT. Install an item with npx hyperframes@0.8.143 add <name> only after telling me which one.

Then:
1. node scripts/build.mjs examples/my-video
2. npx hyperframes@0.8.143 lint examples/my-video. Fix every error. List every warning and say whether it matters.
3. npx hyperframes@0.8.143 snapshot examples/my-video --at <first word start of each lyric line + 0.15, comma separated> --describe false
4. Look at examples/my-video/snapshots/contact-sheet.jpg and describe each frame in one line: which line is shown, which word is lit, what the board and timer show.

Stop there. Do not render, and do not edit index.html by hand.
```

## Notes

- `--describe false` matters: when `GEMINI_API_KEY` is set, `snapshot` sends frames to Gemini for a description by default.
- Lint on handwash-song gives 0 errors and 2 `nested_structure_needs_subcomposition` warnings, harmless for a single-file composition.
- At 0.8.143 the catalog search "karaoke" returns `caption-pill-karaoke` (a pill with per-word color) and `mk-callout-highlight`. The example's karaoke is hand-written because it scales each word and pops a bubble above it. Nothing in the catalog matches the slot board; the nearest is the `split-flap-board` block.
- The rules come from the HyperFrames docs: [HTML schema](https://hyperframes.heygen.com/reference/html-schema), [determinism](https://hyperframes.heygen.com/concepts/determinism), [rules and anti-patterns](https://hyperframes.heygen.com/prompting/rules-and-anti-patterns). The example layer by layer: [docs/07-the-edit.md](../../docs/07-the-edit.md).
- Next: [`04-review.md`](04-review.md).
