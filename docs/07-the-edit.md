# 07. The edit

Step 6 of 7. Costs nothing beyond your Claude plan: Claude Code writes the file. Prompts: [`prompts/edit/03-edit.md`](../prompts/edit/03-edit.md), then a separate reviewer pass with [`prompts/edit/04-review.md`](../prompts/edit/04-review.md). Output: `build/index.template.htm`, built into `index.html`.

This is the part of the pipeline that all three examples show in full. Most of this chapter walks through `examples/handwash-song`, whose effects follow sung words; the last two sections cover [`examples/spin-count`](#the-spin-count-edit), whose effects follow spin marks and beats, and [`examples/wing-it`](#the-wing-it-edit), whose effects follow the story events of a film scene. The handwash edit is one HTML file: `examples/handwash-song/build/index.template.htm`, 216 lines of HTML, CSS and JavaScript. It ends in `.htm` on purpose: HyperFrames Studio rewrites every `*.html` composition file in the project folder when it previews ([08-render-and-qa.md](08-render-and-qa.md#3-preview)), and the `.htm` extension keeps the source out of its reach. It has one placeholder, `/*TRANSCRIPT*/[]`. `npm run build` (`scripts/build.mjs`) replaces it with the words from `transcript.json` (`text`, `start`, `end` only) and writes `examples/handwash-song/index.html`, the file HyperFrames renders.

Edit the template. Never edit `index.html` by hand: the next build overwrites it. `node scripts/build.mjs --check` tells you whether `index.html` is up to date.

All code below is copied from the template.

## What happens when

Every time on screen is either a fixed intro time or a word's `start` or `end` from `transcript.json` plus a fixed offset.

| Time (s) | Event | Where the time comes from |
|---|---|---|
| 0.05 to 1.7 | kicker, headline words, footage card, timer ring, empty board slide in | fixed intro times |
| 1.93 | giant "1", "first time through" | first word start minus 1.05 |
| 2.98 | first word lights up; timer starts; WASH pops and flies to slot 1 | word 0 |
| 8.70, 9.52, 10.44 | SCRUB, SOAP, WATER fly to slots 2 to 4 | words 9, 11, 13 |
| 13.61 | giant "2", "second time through" | word 19 start minus 0.75 |
| 14.36, 19.72, 20.48, 21.42 | each slot gets its "x2" badge | words 19, 28, 30, 32 |
| 24.48 | timer stops at 21 and pulses | last word end |
| 25.08 | outro "2 times through / 21 seconds of singing" | last word end plus 0.6 |
| 30.80 | end | `data-duration` |

## 1. Canvas and root

```html
<meta name="viewport" content="width=1080, height=1920" />
```

```css
  html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #f3eee5; }
  #root { width: 100%; height: 100%; position: relative; font-family: Poppins, sans-serif; color: #1d1d1f; }
  .clip { position: absolute; inset: 0; }
```

```html
<div id="root" data-composition-id="main" data-start="0" data-duration="30.8" data-width="1080" data-height="1920">
```

- `data-composition-id="main"` is also the key on `window.__timelines`.
- `data-duration="30.8"` is read before any script runs, so it has to be a literal number; it cannot come from `TRANSCRIPT`. 30.8 s is 924 frames at 30 fps and sits just under both media lengths (footage 30.833 s, song 30.893 s).
- The two text layers are `<section class="clip">` elements with their own `data-start`, `data-duration` and `data-track-index`. The track index only orders rows in HyperFrames Studio; stacking on screen follows the CSS.
- Inter (kicker, timer label, board label, credit line) and Poppins (all other text) need no `@font-face`: at render time the HyperFrames compiler fetched both from Google Fonts, cached them under `~/.cache/hyperframes/fonts` and inlined them (our render log: `Fetched 11 font face(s) for "Poppins"`, the same for `"Inter"`, then `Injected deterministic @font-face rules for 2 requested font families`). A family named in `font-family` that has no `@font-face` and is not on HyperFrames' list of fonts it can fetch fails lint with `font_family_without_font_face`.
- Name fonts with the `font-family` property. In 0.8.143 the compiler and lint read only `font-family` declarations, so a font named only in the `font:` shorthand (`font: 600 26px Inter, sans-serif`) is never fetched, lint stays silent, and the text renders in the system sans-serif, which differs from machine to machine. The example's Inter rules use `font-family`, `font-weight` and `font-size` for that reason.

## 2. Media: a muted video and a separate audio element

```html
  <div id="card">
    <video id="footage" src="assets/cat.mp4" data-start="0" data-duration="30.8" data-track-index="0" muted playsinline></video>
  </div>
  <audio id="song" src="assets/song.mp3" data-start="0" data-duration="30.8" data-track-index="1" data-volume="1"></audio>
```

- The `<video>` is `muted`. `cat.mp4` has no audio track anyway ([05-or-use-existing-footage.md](05-or-use-existing-footage.md)).
- The `<audio>` has an `id`. HyperFrames mixes audio by element id; an `<audio>` without one renders silent (lint rule `media_missing_id`).
- No script plays, pauses or seeks either element. HyperFrames does that from the `data-*` attributes.
- The animation targets the wrapper `#card`. The `<video>` element itself never moves.

```css
  #card { position: absolute; left: 40px; top: 470px; width: 1000px; height: 617px; border-radius: 36px; overflow: hidden;
          box-shadow: 0 18px 50px rgba(40,30,10,.18); background: #cfe3b7; }
  #footage { position: absolute; left: 0; top: 0; width: 1000px; height: 617px; object-fit: cover; }
```

1000x617 has the same aspect ratio as the cropped clip (1.621), so `object-fit: cover` crops almost nothing.

## 3. Data at the top of the script

```js
  // Word timings: Groq whisper-large-v3 word timestamps, text corrected against lyrics.txt
  // ("and"→"hands", "sell"→"well"). Regenerate with scripts/align-lyrics.mjs.
  const TRANSCRIPT = /*TRANSCRIPT*/[];

  const LINES = [[0, 4], [5, 8], [9, 13], [14, 18], [19, 23], [24, 27], [28, 32], [33, 37]];
  const SLOTS = [
    { word: 'WASH',  first: 0,  second: 19 },
    { word: 'SCRUB', first: 9,  second: 28 },
    { word: 'SOAP',  first: 11, second: 30 },
    { word: 'WATER', first: 13, second: 32 },
  ];
  const SING_START = TRANSCRIPT[0].start;
  const SING_END = TRANSCRIPT[TRANSCRIPT.length - 1].end;
  const END = 30.8;
```

- `LINES`: the first and last word index of each lyric line. `align-lyrics.mjs` prints this array.
- `SLOTS`: the board. Each key word has the index of its first sung occurrence (it flies into the board) and its second (the slot gets "x2").
- `SING_START`, `SING_END`: first word start (2.98 s) and last word end (24.48 s). The timer runs between them.

## 4. Build the DOM once, with fixed coordinates

```js
  const lyrics = document.getElementById('lyrics');
  LINES.forEach(([a, b], li) => {
    const line = document.createElement('div');
    line.className = 'line'; line.id = 'line' + li;
    for (let i = a; i <= b; i++) {
      const w = document.createElement('span'); w.className = 'w';
      const inner = document.createElement('span'); inner.className = 'w-in'; inner.id = 'w' + i;
      inner.textContent = TRANSCRIPT[i].text + (i === b && (li % 2 === 1) ? '.' : '');
      const bub = document.createElement('span'); bub.className = 'bub'; bub.id = 'b' + i;
      w.appendChild(bub); w.appendChild(inner); line.appendChild(w);
    }
    lyrics.appendChild(line);
  });
```

Each word gets two elements, `#w{i}` (the text) and `#b{i}` (its bubble), so the timeline can address any word by its transcript index. `li % 2 === 1` puts a full stop after every second line, which matches this song's rhyme pairs.

The board slots are positioned from constants:

```js
  const SLOT_W = 232, SLOT_GAP = 24, SLOT_Y = 1556;
  SLOTS.forEach((s, i) => {
    const slot = document.createElement('div'); slot.className = 'slot'; slot.id = 'slot' + i;
    slot.style.left = (40 + i * (SLOT_W + SLOT_GAP)) + 'px';
```

Nothing in the file calls `getBoundingClientRect` or measures text. Every position is known when you write the code, so every frame renders the same no matter which order the renderer seeks in.

## 5. One paused timeline

```js
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
```

and at the end:

```js
  tl.to({}, { duration: END }, 0);
  window.__timelines.main = tl;
```

The empty tween on `{}` makes the timeline exactly 30.8 s long, as long as the video, even after the last real animation ends. GSAP 3.14.2 loads from the local file `assets/gsap.min.js` (`<script src="assets/gsap.min.js"></script>`), so the render never needs the network for it.

## 6. Layer by layer

### Kinetic headline: masked word reveal

```css
  .hl-row { display: block; overflow: hidden; padding-bottom: 6px; }
  .hl-w { display: inline-block; margin-right: 22px; }
```

```js
  gsap.utils.toArray('.hl-w').forEach((el, i) => {
    tl.fromTo(el, { yPercent: 110 }, { yPercent: 0, duration: 0.55, ease: 'power3.out' }, 0.15 + i * 0.12);
  });
```

Each word starts 110 percent of its own height below its row. The row clips it (`overflow: hidden`), so each word rises into view, 0.12 s after the previous one.

### Footage card entrance

```js
  tl.fromTo('#card', { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }, 0.3);
```

### Progress bar

```css
  #progress-fill { position: absolute; left: 0; top: 0; width: 1000px; height: 12px; background: #1f6fe5; transform-origin: 0 50%; }
```

```js
  tl.fromTo('#progress-fill', { scaleX: 0 }, { scaleX: 1, duration: END, ease: 'none' }, 0);
```

`scaleX` from the left edge over the full 30.8 s. Scaling avoids animating `width`, which would force layout on every frame.

### 20-second timer: ring and counter

```html
        <circle id="ring-arc" cx="105" cy="105" r="92" fill="none" stroke="#1f6fe5" stroke-width="14" stroke-linecap="round"
                stroke-dasharray="578.05" stroke-dashoffset="578.05" transform="rotate(-90 105 105)" />
```

```js
  const singDur = SING_END - SING_START;
  tl.fromTo('#ring-arc', { strokeDashoffset: 578.05 }, { strokeDashoffset: 0, duration: singDur, ease: 'none' }, SING_START);
  tl.fromTo('#ring-num', { textContent: 0 }, { textContent: singDur - 0.5, snap: { textContent: 1 }, duration: singDur - 0.5, ease: 'none' }, SING_START + 0.5);
  tl.to('#ring', { scale: 1.12, duration: 0.18, ease: 'power2.out' }, SING_END);
  tl.to('#ring', { scale: 1, duration: 0.3, ease: 'power2.inOut' }, SING_END + 0.18);
```

578.05 is the circle's circumference (2 x pi x 92). The arc fills exactly while the song is sung.

The counter tweens the element's own `textContent`, and `snap: { textContent: 1 }` rounds it to a whole number on every frame. Rounding gives the nearest second, while a timer should show the seconds already passed, so the tween starts 0.5 s after the first word and runs 0.5 s behind the singing: after 1 s of singing it reaches 0.5 and rounds up to 1. Before it starts, its from-value, 0, is on screen. The number depends only on the timeline position. Singing lasts 21.5 s, so the counter stops at 21, and the outro says "21 seconds of singing". (Our first draft said "of scrubbing". The ring measures singing, so the text was wrong. Reviewing the snapshots caught it.)

Why no callback: our first version tweened a plain object and wrote `Math.floor` of it into the page from `onUpdate`. It looked the same on screen, but HyperFrames' draw-element self-check saw the counter at 0 in its reference screenshot and at 20 in the draw-element frame, failed at frame 693, and every render fell back to the slower screenshot capture: 109 to 133 s, against 64.6 s now ([08-render-and-qa.md](08-render-and-qa.md#4-render)). Keep timeline callbacks from writing to the page. A from-value of -0.5 with the tween starting on the first word does the same arithmetic, but GSAP shows the from-value before the tween starts without snapping it, so the counter read "-0.5" during the intro.

### Giant round numbers

```js
  [['#round1', '#round1cap', SING_START - 1.05], ['#round2', '#round2cap', TRANSCRIPT[19].start - 0.75]].forEach(([n, c, t]) => {
    tl.fromTo(n, { opacity: 1, scale: 0 }, { scale: 1, duration: 0.32, ease: 'back.out(2.2)' }, t);
    tl.fromTo(c, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.25 }, t + 0.1);
    tl.to([n, c], { opacity: 0, y: -60, duration: 0.25, ease: 'power2.in' }, t + 0.72);
  });
```

Word 19 is the first word of the second pass. `back.out(2.2)` overshoots and settles, which gives the pop.

### Karaoke and soap bubbles

```js
  LINES.forEach(([a, b], li) => {
    const tin = TRANSCRIPT[a].start - 0.3;
    const tout = li < LINES.length - 1 ? TRANSCRIPT[LINES[li + 1][0]].start - 0.3 : SING_END + 0.5;
    tl.fromTo('#line' + li, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' }, tin);
    tl.to('#line' + li, { opacity: 0, y: -30, duration: 0.18, ease: 'power2.in' }, tout - 0.02);
    for (let i = a; i <= b; i++) {
      const w = TRANSCRIPT[i];
      tl.fromTo('#w' + i, { color: '#bfb6a6', scale: 1 }, { color: '#1d1d1f', scale: 1.1, duration: 0.1, ease: 'power2.out' }, w.start);
      tl.to('#w' + i, { scale: 1, duration: 0.22, ease: 'power2.inOut' }, w.start + 0.1);
      tl.fromTo('#b' + i, { opacity: 0, scale: 0.2, y: -24 }, { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: 'back.out(3)' }, w.start);
      tl.to('#b' + i, { opacity: 0, scale: 0.4, duration: 0.12, ease: 'power1.in' }, Math.max(w.start + 0.2, w.end - 0.06));
    }
  });
```

- One line on screen at a time. It arrives 0.3 s before its first word and leaves just before the next line arrives (0.3 s before that line's first word).
- Each word turns from grey to black and pops to 110 percent at `word.start`.
- Each bubble pops in at `word.start` and pops out just before `word.end`, but stays at least 0.2 s so short words still get a visible bubble.

### Key words fly into the board

```js
  SLOTS.forEach((s, i) => {
    const t = TRANSCRIPT[s.first].start;
    const dx = (40 + i * (SLOT_W + SLOT_GAP) + SLOT_W / 2) - 540;
    const dy = (SLOT_Y + 75) - 780;
    tl.fromTo('#fly' + i, { opacity: 1, scale: 0, x: 0, y: 0 }, { scale: 1, duration: 0.22, ease: 'back.out(2.5)' }, t);
    tl.to('#fly' + i, { x: dx, y: dy, scale: 0.3, duration: 0.42, ease: 'power3.in' }, t + 0.32);
    tl.set('#fly' + i, { opacity: 0 }, t + 0.74);
    tl.fromTo('#sw' + i, { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, t + 0.74);
    tl.to('#slot' + i, { borderColor: '#1d1d1f', backgroundColor: '#ffffff', borderStyle: 'solid', duration: 0.15 }, t + 0.74);
    const t2 = TRANSCRIPT[s.second].start;
    tl.fromTo('#slot' + i, { scale: 1 }, { scale: 1.08, duration: 0.12, ease: 'power2.out', yoyo: true, repeat: 1 }, t2);
    tl.fromTo('#sx' + i, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(3)' }, t2 + 0.05);
  });
```

The flying word is a 900x180 box at left 90, top 690, so its center is (540, 780). Slot `i` has its center at `40 + i * 256 + 116` across and `1556 + 75` down. `dx` and `dy` are plain arithmetic on those constants. When the word arrives (0.74 s after it is sung), it disappears and the slot's own label appears in its place, so the hand-off is invisible.

### Outro

```js
  tl.fromTo('#outro', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, SING_END + 0.6);
  tl.to('.slot', { y: -8, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1, stagger: 0.1 }, SING_END + 1.0);
```

The outro sits where the lyrics were. The board does one small wave, so the screen keeps moving after the singing ends.

## 7. The rules, and where the file follows them

| Rule | Why | In this file |
|---|---|---|
| Every `<audio>` has an `id` | the mixer finds audio by id; without one the render is silent (`media_missing_id`) | `<audio id="song" ...>` |
| Every `<video>` is `muted` or has `data-has-audio="true"` | lint `video_missing_muted`; sound goes through `<audio>` | `<video id="footage" ... muted playsinline>` |
| No CSS `translate(-50%, -50%)` on an element GSAP moves | GSAP writes `transform` and overwrites the CSS centering (`gsap_css_transform_conflict`) | the bubble is centered with `left: 50%; ... margin-left: -25px;` because GSAP animates its `scale` and `y`; the flying word is a full-width box with `text-align: center` |
| No `Math.random`, `Date.now`, `requestAnimationFrame` or timers | frame N must look the same every time | none in the file; for randomness use a seeded generator (below) |
| No timeline callback writes to the page | a DOM write from `onUpdate` made HyperFrames' draw-element self-check fail, and the render fell back to screenshots | the counter is a `textContent` tween with `snap`; the file has no `onUpdate` or `onComplete` |
| Every time comes from `TRANSCRIPT` or a constant | swap `transcript.json` and every effect follows | all positions are `TRANSCRIPT[i].start` plus an offset, or a fixed intro time |
| Fixed coordinates, no DOM measuring in the timeline | the renderer seeks frames in any order, and parallel workers start cold | slot and flight positions are arithmetic on `SLOT_W`, `SLOT_GAP`, `SLOT_Y` |
| Hidden elements are hidden in CSS too | `fromTo` applies its from-state at build time, before its start | `.round`, `.round-cap`, `.line`, `.bub`, `.fly`, `.slot-w`, `.slot-x2`, `#outro` all have `opacity: 0` in CSS |
| Animate children of a `.clip`, never the `.clip` itself, for visibility | HyperFrames shows and hides clips from their timing (`gsap_animates_clip_element`) | tweens target elements inside `#head` and `#overlay` |
| One paused timeline, registered synchronously under the composition id | otherwise the render shows a still frame | `window.__timelines.main = tl;` at the end of the script |

The bubble's CSS, the centering in practice:

```css
  .bub { position: absolute; left: 50%; top: -58px; width: 50px; height: 50px; margin-left: -25px; border-radius: 50%;
         background: radial-gradient(circle at 32% 30%, #ffffff 0 18%, #d8efff 19% 55%, #8ccaff 100%); border: 3px solid #5aa9f5; opacity: 0; }
```

If you need randomness (bubble jitter, confetti), use a seeded generator so every render draws the same numbers. mulberry32 is a common choice:

```js
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42); // same sequence on every render
```

## 8. Adapt it to your song

1. **Media.** Put your footage in `assets/` as a muted H.264 file and your song as an MP3, probe both ([05-or-use-existing-footage.md](05-or-use-existing-footage.md); for generated clips, [04-animate.md](04-animate.md#6-put-the-clips-into-the-edit)). Keep the ids `footage` and `song`, or change them in the HTML.
2. **Lyrics.** Write `lyrics.txt`, one sung line per line. If a part is sung twice, write it twice.
3. **Timings.** Transcribe and align ([06-word-timing.md](06-word-timing.md)). The align report ends with your `LINES` array. To get it straight from `lyrics.txt` (run inside your example folder):

   ```bash
   node -e "const fs=require('fs'); let i=0; console.log(JSON.stringify(fs.readFileSync('lyrics.txt','utf8').split(/\r?\n/).filter(l=>l.trim()).map(l=>{const n=l.trim().split(/\s+/).length; const r=[i,i+n-1]; i+=n; return r;})))"
   ```

4. **`SLOTS`.** Print the word indices (the one-liner in [06-word-timing.md](06-word-timing.md#quick-checks-before-you-build)), pick your key words, and write their first and second index. A word sung only once gets no `second`; remove the "x2" lines for it or give it a later occurrence.
5. **Slot count.** Four slots of 232 px with 24 px gaps fill 1000 px (4 x 232 + 3 x 24). For five, use `SLOT_W = 184, SLOT_GAP = 20` (5 x 184 + 4 x 20 = 1000). The CSS repeats the width: change `width: 232px` in `.slot` and `.slot-w` and `left: 172px` in `.slot-x2` to match.
6. **Round numbers.** `TRANSCRIPT[19]` is the first word of our second pass. Change 19 to yours, or delete the second entry if your song has one pass.
7. **Length.** Set `data-duration` (it appears five times: root, `#head`, `<video>`, `<audio>`, `#overlay`) and `END` to a value at or under your shortest media file.
8. **Text.** Kicker, headline, round captions, outro, credit line. Recheck that the headline fits on two lines at 84 px.
9. **Full stops.** `li % 2 === 1` adds a full stop after every second line. Change or remove it for your song's punctuation.
10. **Build and check.** `node scripts/build.mjs examples/my-song`, `npx hyperframes@0.8.143 lint examples/my-song`, then snapshots at your word times and a render ([08-render-and-qa.md](08-render-and-qa.md)). The `npm run` scripts are wired to the three examples only (`build`, `lint`, `render` for handwash-song; `build:spin`, `lint:spin`, `render:spin` for spin-count; `build:wing`, `lint:wing`, `render:wing` for wing-it).

A request that does steps 3 to 9 with Claude Code:

```
In examples/my-song, lyrics.txt and assets/whisper_verbose.json are new.
Run node scripts/align-lyrics.mjs examples/my-song and show me the report.
Then update build/index.template.htm: LINES from the report, SLOTS for the
words WASH, SCRUB, SOAP, WATER (first and second occurrence), the second
round number on the first word of pass two, data-duration and END to 30.8.
Keep every time derived from TRANSCRIPT. Run node scripts/build.mjs,
npx hyperframes@0.8.143 lint, and a snapshot at each slot word's start time.
Show me the contact sheet. Do not render yet.
```

## The spin-count edit

The repo's second example, [`examples/spin-count`](../examples/spin-count/README.md), uses the same contract with no words at all: an AI-generated stock clip of a boy hopping and turning, a music track, and ten spins to count. Its template, `examples/spin-count/build/index.template.htm`, is 132 lines, and `scripts/build.mjs` copies it to `index.html` unchanged, because it has no transcript placeholder. Every time in it is a spin mark, a beat, or a fixed offset from one.

### Data

```js
  const SPINS = [1.9, 4.2, 6.1, 7.4, 8.8, 10.1, 11.8, 14.0, 15.1, 16.2].map(t => +(t / 0.85).toFixed(2));
  const BEAT0 = 0.22, BEAT = 0.3185;
  const END = 21.5, VIDEO_END = 19.66;
  const N = SPINS.length;
```

- `SPINS`: the moments his back faces the camera, read in the source clip, divided by 0.85 because `boy.mp4` plays the clip at 0.85x. The same ten numbers are in `examples/spin-count/spins.json`. How to read such marks: [06-word-timing.md](06-word-timing.md#timings-without-words-beats-and-visual-marks).
- `BEAT0`, `BEAT`: the first beat and the beat step from `npx hyperframes beats`. The beat file's mean step is 0.3191 s, so this grid drifts 0.04 s ahead of the music by the end; reading the times from the beat file instead would remove the drift.
- `VIDEO_END`: where the footage element stops (19.66 s of the 19.667 s clip). The outro is keyed to it.

### Counter pills: positions from arithmetic

```js
  const PILL = 84, GAP = 12, X0 = (1080 - (N * PILL + (N - 1) * GAP)) / 2, PILL_Y = 120;
```

Ten 84 px pills with 12 px gaps are 948 px wide, so `X0` is 66 and pill `i` sits at `66 + 96 * i`. The loop that builds the pills also builds one giant number (`#g{i}`) and one sticker (`#s{i}`) per spin, so the timeline can address all three by the spin's index.

### The number that flies into its pill

```js
  SPINS.forEach((t, i) => {
    const px = X0 + i * (PILL + GAP) + PILL / 2, py = PILL_Y + PILL / 2;
    const dx = px - 540, dy = py - 980;
    tl.fromTo('#g' + i, { opacity: 1, scale: 0, x: 0, y: 0, rotation: -12 }, { scale: 1, rotation: 0, duration: 0.22, ease: 'back.out(2.6)' }, t - 0.12);
    tl.to('#g' + i, { x: dx, y: dy, scale: 0.17, duration: 0.42, ease: 'power3.in' }, t + 0.22);
    tl.set('#g' + i, { opacity: 0 }, t + 0.64);
    tl.to('#p' + i, { backgroundColor: '#ffd23f', borderColor: '#3b1f7a', borderStyle: 'solid', duration: 0.1 }, t + 0.64);
    tl.to('#pn' + i, { color: '#3b1f7a', duration: 0.1 }, t + 0.64);
    tl.to('#p' + i, { scale: 1.3, duration: 0.1, ease: 'power2.out', yoyo: true, repeat: 1 }, t + 0.64);
```

The number is a 500x440 box at left 290, top 760, so its center is (540, 980). Pill `i` has its center at `(66 + 96 * i + 42, 162)`. `dx` and `dy` are the difference, the same plain arithmetic as the handwash board. The number starts to pop 0.12 s before the mark, so it is close to full size on the mark. It holds for 0.12 s, then accelerates into the pill (`power3.in`) over 0.42 s while it shrinks to 17 percent: 400 px type becomes 68 px, a little smaller than the 84 px pill. When it lands, it disappears and the pill turns yellow and bumps, so the hand-off reads as one object.

The bump is a plain `to`. The posted render used `fromTo('#p' + i, { scale: 1 }, ...)`, and GSAP applies a `fromTo`'s from-state when the timeline is built: `scale: 1` overwrote the intro's `scale: 0`, and every pill showed at full size for the first frames before it popped in. See [gotchas.md](gotchas.md#composition-rules-hyperframes).

### Stickers

```js
    const rot = i % 2 ? 8 : -8;
    tl.fromTo('#s' + i, { opacity: 0, scale: 0.2, rotation: rot * 2 }, { opacity: 1, scale: 1, rotation: rot, duration: 0.2, ease: 'back.out(3)' }, t - 0.05);
    tl.to('#s' + i, { opacity: 0, scale: 1.25, duration: 0.2, ease: 'power1.in' }, t + 0.55);
  });
```

One word per spin from a fixed list (`SPIN!`, `AGAIN!`, `WHOOSH!` and so on), tilted 8 degrees one way and then the other. The from-state must include `opacity: 0`. Without it, all ten stickers are on screen from frame 0, piled up at 20 percent size: we hit this in the first snapshots, and a scratch copy with `opacity: 1` in the from-state reproduces it at 0.8 s.

### Title on the beat

```js
  for (let t = BEAT0; t < VIDEO_END - 0.2; t += BEAT * 2) {
    tl.to('#title', { scale: 1.045, duration: 0.07, ease: 'power2.out' }, t);
    tl.to('#title', { scale: 1, duration: 0.2, ease: 'power2.inOut' }, t + 0.07);
  }
```

On every second beat, 31 times, the title grows to 104.5 percent in 0.07 s and settles in 0.2 s: about 1.6 pulses a second. Both tweens use absolute values, so a cold seek to any frame gives the same scale.

### Outro

The footage ends at 19.66 s. A dark card fades in over it from 19.51 s, the big "10" pops at 19.71 s, two lines follow, and the pills bounce one by one from 20.16 s. The pills sit in a container with `z-index: 2`, above the card (`z-index: 1`), so the row of ten yellow pills stays on screen as the result.

## The wing-it edit

The hero example, [`examples/wing-it`](../examples/wing-it/README.md), puts a pre-flight checklist over 30 seconds of WING IT!, cut to 9:16 shot by shot ([05-or-use-existing-footage.md](05-or-use-existing-footage.md#a-blender-open-movie-the-wing-it-example)). It has no words and no beat grid: every time in it is a story event read from frames ([06-word-timing.md](06-word-timing.md#story-events-stepping-through-frames)) or a fixed offset from one. Its template, `examples/wing-it/build/index.template.htm`, is 227 lines, and `scripts/build.mjs` copies it to `index.html` unchanged.

### Data

```js
  const ITEMS = [
    { t: 'SEATBELTS', at: 1.5, ok: false },   // cat yanked upside down
    { t: 'IGNITION',  at: 3.5, ok: true  },   // rocket lights in the barn (cut at 85.5)
    { t: 'LIFTOFF',   at: 5.0, ok: true  },   // through the roof
    { t: 'ALTITUDE',  at: 10.5, ok: true },   // sky and the moon
    { t: 'PARACHUTE', at: 22.0, ok: false },  // the umbrella turns inside out
    { t: 'AIRSPACE',  at: 28.83, ok: false }, // rooster through the windshield
  ];
  const GADGETS = [['PLUNGER', 25.0], ['LIFE RING', 25.1], ['GRAPPLING HOOK', 25.5], ['BALLOON', 25.9], ['EXTINGUISHER', 26.0], ['RAFT', 26.2], ['BOXING GLOVE', 27.5]];
  const END = 32.5, VIDEO_END = 29.96;
```

- `ITEMS`: the six checklist items, the second each one is decided in the cut, and whether it passes. The same numbers are in `examples/wing-it/events.json`, with the film time and what each frame shows.
- `GADGETS`: the seven gadgets the hull throws out, each at the frame where it first shows.
- `VIDEO_END`: where the footage element stops (29.96 s of the 29.967 s cut). `END` is the video length, 2.5 s more, for the outro.

### Media and the still

```html
  <video id="footage" src="assets/wing_v.mp4" data-start="0" data-duration="29.96" data-track-index="0" muted playsinline></video>
  <audio id="sound" src="assets/wing_a.mp3" data-start="0" data-duration="32.5" data-track-index="1" data-volume="1"></audio>
```

The footage runs 29.96 s and the sound 32.5 s. For the outro, an `<img id="still" src="assets/last.jpg">` (the last frame of the footage, made by the fetch script) sits at the bottom of the overlay with `opacity: 0`, and one `tl.set('#still', { opacity: 1 }, VIDEO_END - 0.04)` shows it a frame before the video ends, so the picture never drops to the dark page.

### Checklist chips: positions from arithmetic

```js
    c.style.left = (52 + (i % 3) * 332) + 'px'; c.style.top = (112 + Math.floor(i / 3) * 92) + 'px';
    c.innerHTML = `<div class="chip-dot" id="cd-${i}">${it.ok ? '✓' : '✗'}</div><div class="chip-t">${it.t}</div>`;
```

Six 316 px chips in two rows of three, 16 px apart, inside a 1016 px card. Each dot already holds its tick or cross, drawn in `color: transparent` until the event. On the event:

```js
  ITEMS.forEach((it, i) => {
    const color = it.ok ? '#21b35a' : '#e5322d';
    tl.to('#cd-' + i, { backgroundColor: color, borderColor: color, color: '#fff', duration: 0.08 }, it.at);
    tl.fromTo('#c' + i, { scale: 1 }, { scale: 1.12, duration: 0.09, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false }, it.at);
    if (!it.ok) tl.to('#c' + i, { backgroundColor: '#ffe3e1', duration: 0.1 }, it.at);
    if (it.ok) { done += 1; const n = done; tl.set('#score', { textContent: n + '/6' }, it.at); }
  });
```

- The dot fills green or red and its glyph turns white, so the tick or the cross appears. A failed chip also turns pink.
- The bump is a `fromTo` from `scale: 1`, and the chips' intro animates them from `opacity: 0, x: -20`. `immediateRender: false` keeps the bump's from-state from being applied when the timeline is built, the trap spin-count's pills fell into ([gotchas.md](gotchas.md#composition-rules-hyperframes)).
- The score is a `tl.set` of `textContent` on each passed item: 1/6 at 3.5 s, 2/6 at 5.0 s, 3/6 at 10.5 s. A `set` is part of the timeline, so a seek to any frame shows the right score.

### Three helpers: shake, flash, pop

```js
  const shake = (t, amp = 14) => {
    tl.to('#footage', { x: amp, y: -amp * 0.6, duration: 0.04 }, t);
    tl.to('#footage', { x: -amp, y: amp * 0.5, duration: 0.05 }, t + 0.04);
    tl.to('#footage', { x: amp * 0.5, y: 0, duration: 0.05 }, t + 0.09);
    tl.to('#footage', { x: 0, y: 0, duration: 0.08 }, t + 0.14);
  };
  const flash = (t, a = 0.7) => { tl.to('#flash', { opacity: a, duration: 0.04 }, t); tl.to('#flash', { opacity: 0, duration: 0.25 }, t + 0.04); };
  const pop = (sel, t, hold) => {
    tl.fromTo(sel, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.18, ease: 'back.out(2.6)' }, t);
    tl.to(sel, { opacity: 0, scale: 1.15, duration: 0.18, ease: 'power1.in' }, t + hold);
  };
```

Each helper adds a few absolute tweens at a time you give it, so a story event becomes one line: `flash(3.5, 0.85); shake(3.5, 18);` on the ignition cut, `pop('#lb-roof', 5.2, 1.2); shake(5.0, 12);` on the hole in the roof. The shake moves the `<video>` element itself, by up to 22 px for 0.22 s, so for a few frames a strip of the dark page shows at one edge, which reads as part of the jolt. The handwash edit animates only a wrapper around its video; either works in HyperFrames. The countdown before the ignition cut is three of the giant numbers, each popping in over 0.1 s and fading out from 0.16 s after its start, at 2.75, 3.0 and 3.25 s.

### Altitude meter, warnings, the step card

- **Meter.** A 760 px bar fills with `scaleY` from 0 to 1 around a bottom `transform-origin`, from 7.7 to 11.1 s. Its number counts from 0 to 12,000 FT over the same 3.4 s. The number is written by an `onUpdate` callback, against this repo's rule (section 7): `document.getElementById('alt-num').textContent = (Math.round(alt.v / 100) * 100).toLocaleString('en-US') + ' FT'`. HyperFrames' drawElement self-check passed on the posted render anyway, and the template is kept as rendered. For a new edit, put " FT" in its own element and tween the number's `textContent` with `snap: { textContent: 100 }`; you lose the thousands separator, or you keep it by counting thousands in one element ("12") next to a fixed ",000".
- **Warnings.** Three red labels slide in at 12.6, 14.0 and 15.4 s, and a loop adds a blink every 0.5 s from 12.8 to 17.4 s: `for (let t = 12.8; t < 17.4; t += 0.5)` with two absolute `to` tweens of `backgroundColor`. A loop that writes fixed tweens at build time is fine; a `repeat: -1` would not be.
- **Step card.** NEXT STEP / DEPLOY PARACHUTE comes in at 19.0 s, as the finger presses the button. At 22.0 s, the PARACHUTE event, the card turns red and two `tl.set` calls swap its text to RESULT / PARACHUTE: FAILED.

### Gadget counter and the tape

```js
  GADGETS.forEach(([name, t], i) => {
    tl.set('#gad-n', { textContent: String(i + 1) }, t);
    tl.fromTo('#gad-n', { scale: 1.25 }, { scale: 1, duration: 0.15, ease: 'power2.out', immediateRender: false }, t);
    tl.fromTo('#gc' + i, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.18, ease: 'back.out(2.4)' }, t);
  });
```

A 200 px number counts the gadgets as they fly out, and each one adds a white chip with its name, in two columns from y 1300. On the AIRSPACE event at 28.83 s a white flash, the strongest shake (22 px) and a yellow and black BIRD STRIKE tape, rotated -9 degrees across the frame, arrive with the rooster.

### Outro on a still

At 29.92 s the still takes over, at 29.96 s a shade (`rgba(15,18,38,.72)`) fades in over it, and CHECKLIST 3/6, GADGETS 7, BIRDS 1 and "nobody told them about the umbrella" come in at `VIDEO_END + 0.2`, `+ 0.45`, `+ 0.7` and `+ 1.0`. The three numbers repeat what the timeline already counted: three items passed, seven gadgets, one rooster.

### Where it breaks the rules

| Rule | In this file | Effect |
|---|---|---|
| No timeline callback writes to the page | the altitude number is written from `onUpdate` | the drawElement self-check passed on the posted render; do not copy it |
| Footage width a multiple of 16 | `wing_v.mp4` is 1080 wide | the band falls on the render's own strip, which the edge fix covers |
| Footage with a keyframe every second | x264 defaults, keyframes up to 4.67 s apart | not checked frame by frame for freezes |

`npx hyperframes@0.8.143 check` fails on this edit: the chip glyphs are transparent before their events (by design), and contrast is short for the white tick on green (2.74:1), the RESULT label on the red card (2.07:1) and the credit line (4.27:1). Lint passes with 0 errors and 1 warning.
