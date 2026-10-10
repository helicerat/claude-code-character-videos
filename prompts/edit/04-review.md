# 04 Review

**What it does:** runs a separate reviewer that did not write the edit. It snapshots every lyric line and every word, checks that each word lights on time, reads the frames at phone size, runs HyperFrames' layout and contrast check, and audits the code for anything that breaks determinism. It writes a report and changes nothing.

**What you should see:** `examples/my-video/REVIEW.md` with a findings table (severity, time, element, problem, evidence, suggested fix) and the list of checks that passed. No other file changes. You decide what to fix and paste the fixes into the session that wrote the edit.

**Before you paste:**

- [`03-edit.md`](03-edit.md) is done and lint shows 0 errors.
- Start a **new** Claude Code session, or ask for a subagent. A reviewer that has not seen the edit being written knows only what the frames show.
- Know the baseline. On `examples/handwash-song`, `check` at 0.8.143 reports 2 contrast errors (`#ring-lbl` at 3.72:1 and `#credit` at 2.64:1, where WCAG AA asks for 4.5:1), contrast warnings on the grey not-yet-sung words, and `content_overlap` warnings while one lyric line fades out as the next fades in.

## Prompt

```text
You are the reviewer for the HyperFrames composition in examples/my-video. Report only. Do not edit, create or delete any file except examples/my-video/REVIEW.md and snapshot images. Set HYPERFRAMES_NO_TELEMETRY=1. Always pass --describe false to snapshot.

Read: examples/my-video/BRIEF.md, lyrics.txt, transcript.json, build/index.template.htm. index.html is generated from the template by scripts/build.mjs; review the template and treat index.html as output.

1. Line timing. From the LINES constant and transcript.json, compute for each lyric line: its first word start + 0.15 s, and the next line's first word start - 0.05 s. Snapshot all of those times in one call:
   npx hyperframes@0.8.143 snapshot examples/my-video --at <times> --describe false -o examples/my-video/snapshots/review-lines
   At each first time the right line is on screen and its first word is lit. At each second time the old line is still readable or leaving, and no two lines are readable at once.

2. Word timing. Snapshot every word at start + 0.12 s (several calls if the list is long) into examples/my-video/snapshots/review-words. In each frame the target word is lit and the word after it is still unlit (unless the next word starts less than 0.12 s later). List every word that is early, late or never lit. Note that exactly at word.start the 0.1 s highlight tween has only just begun, so do not test at start + 0.

3. Content. Every line on screen matches lyrics.txt (spelling, order, punctuation if any). Board words land in the right slot on their first occurrence and get the badge on later ones. Recompute every number on screen from transcript.json or the source named in BRIEF.md, and check the timer value at the end matches last end minus first start, rounded down.

4. Phone legibility. Scale each review frame to 360 px wide with ffmpeg and look at it at that size. List any text you cannot read, text over busy footage without a backing, and anything important in the bottom strip of the frame where phone apps draw their controls.

5. Layout and contrast. Run npx hyperframes@0.8.143 check examples/my-video and list its findings. For each one, say whether it is a real problem or intended layering, and why.

6. Footage. In the review frames, look for burned-in captions left after the crop, logos, watermarks, and end cards with logos.

7. Determinism and HyperFrames contract, by reading the template:
   - search for Math.random, Date.now, performance.now, requestAnimationFrame, setTimeout, setInterval, fetch(, async, await
   - search for onUpdate, onComplete and other timeline callbacks; any that writes to the page (textContent, innerHTML, style) is a finding: tween the property instead
   - one gsap.timeline({ paused: true }), registered as window.__timelines[key] where key equals the root data-composition-id
   - <audio> has an id, <video> is muted, no script plays, pauses or seeks media
   - no seconds literals tied to sung events (literals are fine for the intro, offsets relative to a word, and the total duration)
   - root data-duration equals END and is no longer than the shorter of assets/footage.mp4 and assets/song.mp3 (probe them with node scripts/probe.mjs)

Write examples/my-video/REVIEW.md with:
- a findings table: severity (blocker / should fix / nit), time in seconds, element id, what is wrong, evidence (snapshot file name or line in the template), suggested fix in one sentence
- a list of every check above that passed
- anything you could not check, and why

Then stop.
```

## Notes

- The determinism proof (two renders, identical frames) needs a render, so it lives in [`05-render.md`](05-render.md). This step catches the usual causes before you spend render time.
- Why start + 0.12 s: the highlight is a 0.1 s tween that begins at `word.start`. A snapshot of handwash-song at 2.98 s, the exact start of the first word, still shows "Wash" grey.
- Next: [`05-render.md`](05-render.md).
