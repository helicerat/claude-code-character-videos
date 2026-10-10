# 07. The edit

Step 6 of 7. Claude Code writes the file, so this step costs nothing beyond your Claude plan. Prompts: [`prompts/edit/03-edit.md`](../prompts/edit/03-edit.md), then a separate review pass with [`prompts/edit/04-review.md`](../prompts/edit/04-review.md). Output: `build/index.template.htm`, built into `index.html`.

Each example's edit is one HTML file with CSS and a GSAP timeline. Every effect is keyed to a time taken from the material: sung words in [handwash-song](#the-handwash-song-edit), spin marks and beats in [spin-count](#the-spin-count-edit), story events in [wing-it](#the-wing-it-edit).

## Template and build

- You edit `build/index.template.htm`. HyperFrames renders `index.html`, which `npm run build` writes.
- The template ends in `.htm` on purpose. HyperFrames Studio rewrites every `*.html` composition file when it previews ([08](08-render-and-qa.md#3-preview)), and the extension keeps the source out of its reach.
- The handwash template has one placeholder, `/*TRANSCRIPT*/[]`. `scripts/build.mjs` replaces it with the words from `transcript.json` (`text`, `start`, `end`). The other two templates have no placeholder and are copied unchanged.
- Never edit `index.html` by hand: the next build overwrites it. `node scripts/build.mjs --check` exits 1 when it is out of date.

## 1. Canvas and root

```html
<meta name="viewport" content="width=1080, height=1920" />
<div id="root" data-composition-id="main" data-start="0" data-duration="30.8" data-width="1080" data-height="1920">
```

```css
html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #f3eee5; }
#root { width: 100%; height: 100%; position: relative; font-family: Poppins, sans-serif; color: #1d1d1f; }
.clip { position: absolute; inset: 0; }
```

- `data-composition-id` is also the key in `window.__timelines`.
- `data-duration` is read before any script runs, so it must be a literal number. Keep it at or under the shortest media file: 30.8 s sits under the handwash footage (30.833 s) and song (30.893 s).
- Text layers are `<section class="clip">` elements with their own `data-start`, `data-duration` and `data-track-index`. The track index only orders rows in Studio. Stacking on screen follows the CSS.
- Animate the children of a `.clip`, never the `.clip` itself. HyperFrames shows and hides clips from their timing (`gsap_animates_clip_element`).
- Never center an element GSAP moves with CSS `translate(-50%, -50%)`: GSAP overwrites `transform` (`gsap_css_transform_conflict`). Use `left: 50%` and a negative margin, flexbox, or `xPercent`/`yPercent`.

### Fonts: `font-family`, never the `font:` shorthand

Poppins and Inter need no `@font-face`. The HyperFrames compiler fetches them from Google Fonts at render time, caches them under `~/.cache/hyperframes/fonts` and inlines them. The compile log confirms it: `Injected deterministic @font-face rules for 2 requested font families`.

In 0.8.143 the compiler and lint read only `font-family` declarations. A font named only in the shorthand is never fetched, lint stays silent, and the text renders in the system sans-serif, which differs from machine to machine.

```css
/* not fetched, not linted */
#kicker { font: 600 26px Inter, sans-serif; }
/* fetched */
#kicker { font-family: Inter, sans-serif; font-weight: 600; font-size: 26px; }
```

A family with no `@font-face` that is not on HyperFrames' list of fonts it can fetch fails lint with `font_family_without_font_face`.

## 2. Media

```html
<div id="card">
  <video id="footage" src="assets/cat.mp4" data-start="0" data-duration="30.8" data-track-index="0" muted playsinline></video>
</div>
<audio id="song" src="assets/song.mp3" data-start="0" data-duration="30.8" data-track-index="1" data-volume="1"></audio>
```

- Every `<audio>` needs an `id`. HyperFrames mixes audio by id, and an `<audio>` without one renders silent (`media_missing_id`).
- Every `<video>` is `muted` or carries `data-has-audio="true"` (`video_missing_muted`). Sound goes through `<audio>`.
- No script plays, pauses or seeks media. HyperFrames does that from the `data-*` attributes.
- Animate a wrapper (`#card` in handwash-song) or the `<video>` itself (the wing-it shake). Both work.

## 3. One paused timeline

```js
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
// ... every tween goes on tl ...
tl.to({}, { duration: END }, 0);
window.__timelines.main = tl;
```

- Register the timeline synchronously, under the composition id. Without it the render is a still frame, with no error.
- The empty tween on `{}` makes the timeline exactly `END` seconds long.
- GSAP 3.14.2 loads from `assets/gsap.min.js`, so the render needs no network for it.

HyperFrames seeks frames in any order, and parallel workers start cold. Frame N must depend only on the timeline position:

- Every time is a constant, a word's `start` or `end`, or a fixed offset from one.
- Every position is arithmetic on constants. Nothing calls `getBoundingClientRect` or measures text.
- Tweens go to absolute values, never relative ones like `"+=50"`.
- A loop that writes fixed tweens at build time is fine. A `repeat: -1` is not.
- No `Math.random`, `Date.now`, `requestAnimationFrame` or timers. For randomness, use a seeded generator:

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

## 4. `fromTo` applies its from-state at build time

GSAP's `fromTo` writes its from-state the moment the tween is created (`immediateRender`), not at its start time. Two rules follow.

**Hide in CSS what starts hidden, and make the from-state hidden too.** Every element that pops in later has `opacity: 0` in CSS. The spin-count stickers also put `opacity: 0` in the from-state. Without it, all ten sit on screen from frame 0, piled up at 20 percent size.

```js
tl.fromTo('#s' + i, { opacity: 0, scale: 0.2, rotation: rot * 2 }, { opacity: 1, scale: 1, rotation: rot, duration: 0.2, ease: 'back.out(3)' }, t - 0.05);
```

**A later `fromTo` on a property an earlier tween animates wins at build time.** The spin-count pills pop in from `scale: 0`. A bump written as `fromTo(pill, { scale: 1 }, ...)` overwrites that start, and every pill shows at full size before its intro.

## 5. State changes: `to` and `set`

Use a plain `to` for a change to an element that already has an intro:

```js
tl.to('#p' + i, { backgroundColor: '#ffd23f', borderColor: '#3b1f7a', borderStyle: 'solid', duration: 0.1 }, t + 0.64);
tl.to('#p' + i, { scale: 1.3, duration: 0.1, ease: 'power2.out', yoyo: true, repeat: 1 }, t + 0.64);
```

When a bump needs a known start, keep the `fromTo` and add `immediateRender: false`, as the wing-it chips do:

```js
tl.fromTo('#c' + i, { scale: 1 }, { scale: 1.12, duration: 0.09, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false }, it.at);
```

Swap text with `tl.set`. A `set` is part of the timeline, so a seek to any frame shows the right text:

```js
if (it.ok) { done += 1; const n = done; tl.set('#score', { textContent: n + '/6' }, it.at); }
tl.set('#step-t', { textContent: 'PARACHUTE: FAILED' }, 22.0);
```

## 6. Counters: tween `textContent`, never write from `onUpdate`

The handwash timer counts the seconds of singing:

```js
const singDur = SING_END - SING_START;
tl.fromTo('#ring-arc', { strokeDashoffset: 578.05 }, { strokeDashoffset: 0, duration: singDur, ease: 'none' }, SING_START);
tl.fromTo('#ring-num', { textContent: 0 }, { textContent: singDur - 0.5, snap: { textContent: 1 }, duration: singDur - 0.5, ease: 'none' }, SING_START + 0.5);
```

- 578.05 is the ring's circumference (2 x pi x 92), so the arc fills exactly while the song is sung.
- `snap: { textContent: 1 }` rounds to a whole number on every frame. A timer shows the seconds already passed, so the tween starts 0.5 s late and runs 0.5 s behind: after 1 s of singing it reaches 0.5 and rounds up to 1.
- A from-value of -0.5 does the same arithmetic but fails on screen: GSAP shows the from-value unsnapped before the tween starts, so the intro reads "-0.5".

Never write the number into the page from `onUpdate` or `onComplete`. HyperFrames' draw-element self-check compares four frames against screenshots ([08](08-render-and-qa.md#4-render)). A counter written by a callback shows one number in the screenshot and another in the draw-element frame, the check fails, and the whole video is captured again with screenshots at about twice the time.

The wing-it altitude number is written from `onUpdate`, and its render passed the check. Do not copy it. Put " FT" in its own element and tween the number's `textContent` with `snap: { textContent: 100 }`. That drops the thousands separator; to keep it, count thousands in one element next to a fixed ",000".

## 7. Giant text on one line

A multi-word label in a fixed-width box wraps when it is wider than the box. The wing-it `.giant` class is an 800 px box at 400 px type, sized for one digit. The PLAN B pop overrides the size and width and adds `white-space: nowrap`:

```html
<div class="giant" id="planb" style="font-size:210px; white-space: nowrap; left: 40px; width: 1000px">PLAN B</div>
```

Check every giant label in a snapshot. All composition rules in one list: [gotchas](gotchas.md#the-edit).

## The handwash-song edit

[`examples/handwash-song`](../examples/handwash-song/README.md) puts karaoke, a timer and a board of key words over a muted clip. Every time on screen is a fixed intro time or a word's `start` or `end` plus an offset.

| Time (s) | Event | Where the time comes from |
|---|---|---|
| 0.05 to 1.7 | kicker, headline, footage card, timer ring, empty board slide in | fixed intro times |
| 1.93 | giant "1", "first time through" | first word start minus 1.05 |
| 2.98 | first word lights up; timer starts; WASH flies to slot 1 | word 0 |
| 8.70, 9.52, 10.44 | SCRUB, SOAP, WATER fly to slots 2 to 4 | words 9, 11, 13 |
| 13.61 | giant "2", "second time through" | word 19 start minus 0.75 |
| 14.36 to 21.42 | each slot gets its "x2" badge | words 19, 28, 30, 32 |
| 24.48 | timer stops at 21 and pulses | last word end |
| 25.08 | outro "2 times through / 21 seconds of singing" | last word end plus 0.6 |
| 30.80 | end | `data-duration` |

```js
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
- `SLOTS`: each key word's first sung occurrence (it flies into the board) and its second (the slot gets "x2").
- The DOM is built once from this data. Each word gets `#w{i}` (its text) and `#b{i}` (its bubble), so the timeline addresses any word by its transcript index.

**Karaoke.** One line is on screen at a time, from 0.3 s before its first word until the next line arrives. Each word lights up and pops on its `start`, and its bubble stays at least 0.2 s:

```js
tl.fromTo('#w' + i, { color: '#bfb6a6', scale: 1 }, { color: '#1d1d1f', scale: 1.1, duration: 0.1, ease: 'power2.out' }, w.start);
tl.fromTo('#b' + i, { opacity: 0, scale: 0.2, y: -24 }, { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: 'back.out(3)' }, w.start);
tl.to('#b' + i, { opacity: 0, scale: 0.4, duration: 0.12, ease: 'power1.in' }, Math.max(w.start + 0.2, w.end - 0.06));
```

**The board.** Each key word pops at the center (540, 780) and flies to its slot. The flight is plain arithmetic on constants (`SLOT_W = 232, SLOT_GAP = 24, SLOT_Y = 1556`):

```js
const dx = (40 + i * (SLOT_W + SLOT_GAP) + SLOT_W / 2) - 540;
const dy = (SLOT_Y + 75) - 780;
tl.to('#fly' + i, { x: dx, y: dy, scale: 0.3, duration: 0.42, ease: 'power3.in' }, t + 0.32);
tl.set('#fly' + i, { opacity: 0 }, t + 0.74);
```

On arrival the word disappears and the slot's own label appears in its place, so the hand-off is invisible.

### Adapt it to your song

1. **Media.** Footage in `assets/` as a muted H.264 file, the song as an MP3, both probed ([05](05-or-use-existing-footage.md); generated clips: [04](04-animate.md#6-put-the-clips-into-the-edit)).
2. **Lyrics.** `lyrics.txt`, one sung line per line. A part sung twice is written twice.
3. **Timings.** Transcribe and align ([06](06-word-timing.md)). The align report ends with your `LINES`. Or get them from `lyrics.txt`, inside your example folder:

   ```bash
   node -e "const fs=require('fs'); let i=0; console.log(JSON.stringify(fs.readFileSync('lyrics.txt','utf8').split(/\r?\n/).filter(l=>l.trim()).map(l=>{const n=l.trim().split(/\s+/).length; const r=[i,i+n-1]; i+=n; return r;})))"
   ```

4. **`SLOTS`.** Print the word indices ([06](06-word-timing.md#quick-checks-before-you-build)) and write each key word's first and second index. A word sung once gets no `second`.
5. **Five slots.** Use `SLOT_W = 184, SLOT_GAP = 20`, and change `width: 232px` in `.slot` and `.slot-w` and `left: 172px` in `.slot-x2`.
6. **Round numbers.** `TRANSCRIPT[19]` is the first word of the second pass. Change it, or delete the second entry for a one-pass song.
7. **Length.** `data-duration` (root, `#head`, `<video>`, `<audio>`, `#overlay`) and `END`, at or under your shortest media file.
8. **Text.** The headline must fit on two lines at 84 px. `li % 2 === 1` adds a full stop after every second line.
9. **Build and check.** `node scripts/build.mjs examples/my-song`, `npx hyperframes@0.8.143 lint examples/my-song`, snapshots, render ([08](08-render-and-qa.md)). The `npm run` scripts cover the three examples only.

A request that does steps 3 to 8 with Claude Code:

```text
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

[`examples/spin-count`](../examples/spin-count/README.md) counts ten spins over a stock clip, cut to a music track. Every time is a spin mark, a beat, or a fixed offset from one.

```js
const SPINS = [1.9, 4.2, 6.1, 7.4, 8.8, 10.1, 11.8, 14.0, 15.1, 16.2].map(t => +(t / 0.85).toFixed(2));
const BEAT0 = 0.22, BEAT = 0.3185;
const END = 21.5, VIDEO_END = 19.66;
const N = SPINS.length;
const PILL = 84, GAP = 12, X0 = (1080 - (N * PILL + (N - 1) * GAP)) / 2, PILL_Y = 120;
```

- `SPINS`: the moments his back faces the camera in the source clip, divided by 0.85 because `boy.mp4` plays it at 0.85x. Also in `spins.json`. How to read such marks: [06](06-word-timing.md#timings-without-words-beats-and-visual-marks).
- `BEAT0`, `BEAT`: the first beat and the beat step from `npx hyperframes beats`. The beat file's mean step is 0.3191 s, so this grid drifts 0.04 s ahead by the end. Reading times from the beat file removes the drift.
- Pill `i` sits at `66 + 96 * i`. Each spin's giant number pops at (540, 980) 0.12 s before its mark, flies into its pill while it shrinks to 17 percent, and disappears as the pill turns yellow and bumps ([section 5](#5-state-changes-to-and-set)).

The title pulses on every second beat. Both tweens use absolute values, so a cold seek to any frame gives the same scale:

```js
for (let t = BEAT0; t < VIDEO_END - 0.2; t += BEAT * 2) {
  tl.to('#title', { scale: 1.045, duration: 0.07, ease: 'power2.out' }, t);
  tl.to('#title', { scale: 1, duration: 0.2, ease: 'power2.inOut' }, t + 0.07);
}
```

Just before `VIDEO_END` a dark card fades in over the footage and a big "10" pops. The pills sit above the card (`z-index: 2` against `1`), so the row of ten stays on screen as the result.

## The wing-it edit

[`examples/wing-it`](../examples/wing-it/README.md) puts a pre-flight checklist over 30 seconds of WING IT!, cut to 9:16 shot by shot ([05](05-or-use-existing-footage.md#a-blender-open-movie-the-wing-it-example)). Every time is a story event read from frames ([06](06-word-timing.md#story-events-stepping-through-frames)) or a fixed offset from one.

```js
const ITEMS = [
  { t: 'SEATBELTS', at: 1.5, ok: false },   // cat yanked upside down
  { t: 'IGNITION',  at: 3.5, ok: true  },   // rocket lights in the barn (cut at 85.5)
  { t: 'LIFTOFF',   at: 5.0, ok: true  },   // through the roof
  { t: 'ALTITUDE',  at: 10.5, ok: true },   // sky and the moon
  { t: 'PARACHUTE', at: 22.0, ok: false },  // the umbrella turns inside out
  { t: 'AIRSPACE',  at: 28.83, ok: false }, // rooster through the windshield
];
const END = 32.5, VIDEO_END = 29.96;
```

`events.json` holds the same times with the film time and what each frame shows. `GADGETS` lists the seven gadgets the hull throws out, each at the frame where it first shows. `END` adds 2.5 s after the footage for the outro.

Three helpers turn a story event into one line, such as `flash(3.5, 0.85); shake(3.5, 18);` on the ignition cut:

```js
const pop = (sel, t, hold) => {
  tl.fromTo(sel, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.18, ease: 'back.out(2.6)' }, t);
  tl.to(sel, { opacity: 0, scale: 1.15, duration: 0.18, ease: 'power1.in' }, t + hold);
};
```

`shake` is four absolute `to` tweens on the `<video>`, up to 22 px, so the dark page shows at one edge for a few frames. `flash` fades a white layer in and out.

- **Checklist.** Each dot holds its tick or cross in `color: transparent`. On its event the dot fills green or red, the glyph turns white, the chip bumps, and a passed item sets the score ([section 5](#5-state-changes-to-and-set)).
- **Altitude meter.** A bar fills with `scaleY` while the number counts to 12,000 FT from `onUpdate` ([section 6](#6-counters-tween-textcontent-never-write-from-onupdate)).
- **Warnings.** A `for` loop adds a blink every 0.5 s from 12.8 to 17.4 s, as fixed `backgroundColor` tweens.
- **Step card.** At 22.0 s it turns red and two `tl.set` calls swap its text to RESULT / PARACHUTE: FAILED.
- **Outro on a still.** `tl.set('#still', { opacity: 1 }, VIDEO_END - 0.04)` shows the footage's last frame (`assets/last.jpg`) a frame before the video ends, so the picture never drops to the dark page.

| Rule it breaks | In this file | Note |
|---|---|---|
| No timeline callback writes to the page | the altitude number | the self-check passed on this render; do not copy it |
| Footage width a multiple of 16 | `wing_v.mp4` is 1080 wide | the band falls on the right-edge strip, which the edge fix covers |
| A keyframe every second | x264 defaults, up to 4.67 s apart | encode new footage with `-g 30 -keyint_min 30` |

`check` exits 1 on this edit: the transparent chip glyphs (by design) and three contrast ratios ([08](08-render-and-qa.md#1-lint)). Lint passes with 0 errors and 1 warning.
