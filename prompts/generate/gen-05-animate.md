# gen-05: make the character sing

**What it does:** turns each keyframe and its audio piece into a clip where the mouth moves on the words, then measures the sync of each take against the master song.

**What you should see:** one clip per scene, the mouth on the words, the character moving in the gaps, and a sync report per clip.

Step 4, the most expensive one. Seedance 2.5 list prices (2026-10-09): Picsart 480p $0.1028/s, 720p $0.231/s (Picsart's image-to-video rate; no separate reference-to-video price listed); fal 720p about $0.473/s ([Picsart pricing](https://picsart.com/api-platform/models/seedance-2.5/pricing), [fal](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api)). Method: [docs/04-animate.md](../../docs/04-animate.md). Next: [`../00-brief.md`](../00-brief.md), then the edit prompts from [`../edit/01-assets.md`](../edit/01-assets.md).

## Prompt

```text
The project folder is examples/my-video. BRIEF.md, lyrics.txt, script.txt, STORYBOARD.md,
PROMPTS.md, costs.csv and every assets/ path below are inside it; docs/ and scripts/ are at the
repo root. Run commands from the repo root.
Read STORYBOARD.md, assets/song/pieces.json and assets/character/CHARACTER.md. The per-scene
templates this prompt refers to are in prompts/generate/gen-05-animate.md.
Before every paid call, state the model, the provider, the number of calls or seconds and the
list price, and wait for my OK. Log every paid call in costs.csv (date, step, model, provider,
units, unit_price_usd, total_usd, kept, note), rejected takes included.

1. Mark every scene as one of three kinds:
   - lips: the character sings on camera (reference-to-video, keyframe + vocal piece)
   - motion: action or dance on the beat, nobody sings (reference-to-video, keyframe + full-mix piece)
   - insert: objects, hands, reactions that need no song (image-to-video, keyframe as the exact first frame, silent)
   Write one prompt per scene into PROMPTS.md, all in this one file, from the templates.
   Expand the appearance block and the style sentence from CHARACTER.md word for word.
   Wait for my approval of PROMPTS.md.

2. Pilot: run scene 1 and the hardest sung line through <CLI or MCP>, Seedance 2.5
   reference-to-video, 9:16, draft resolution 480p. @Image1 is the approved keyframe, never the sheet.
   Duration: the piece length rounded up, minimum 4 s. Show the price first.

3. For every lips take, measure the sync: transcribe the take's own soundtrack with word times
   (npx hyperframes@0.8.143 transcribe with a scratch --dir, as in gen-03),
   compare the end of each word with the same word in the master song, report the median lag
   and the worst word. Judge by long words; very short words measure badly.
   Show me the take next to the song. I decide with my eyes, the numbers only rank the takes.

4. After I approve the pilot, run the remaining scenes in batches of about 5, with the price
   stated before each batch. Two takes per lips scene, one per motion or insert scene.
   - If two identical takes miss the same thing, stop. Change one variable (shorter window,
     closer framing, no head turn) or fix the keyframe; for a missing expression, edit it into
     the keyframe and rerun.
   - Pin the best take per scene and record its lag.

5. Regenerate only the keepers at 720p (or finish the 480p draft at 1080p if the model offers it).
   Save to assets/scenes/<scene>.mp4. Log every take, kept or rejected, with its price in costs.csv.
```

## Model prompts (per scene)

**lips**, sung to camera:

```text
@Image1 is <NAME>. <NAME> sings the words of @Audio1 to the camera, the mouth on every word: "<EXACT WORDS IN THIS PIECE>".
<CLOSE-UP | MEDIUM CLOSE-UP> of <NAME> from @Image1 (<CANON BLOCK FOR THIS FRAMING>), facing the camera, <EXPRESSION>.
<WHAT THE CHARACTER WANTS IN THIS MOMENT>.
<0.0-0.8 s: action before the first word>. <0.8-2.4 s ("<words>"): action on these words>. <after the last word: one action to end on>.
Mouth large in frame, nothing crosses it. Locked camera, no head turns. Only <NAME> sings.
A single unbroken shot. No on-screen text, lettering or logos.
```

**motion**, dance or action on the beat:

```text
The scene from @Image1, moving in time with @Audio1. <FRAMING>.
<NAME> from @Image1 (<CANON BLOCK FOR THIS FRAMING>) <ACTION, with beat times: "on each beat (0.55, 1.10, 1.64 s): ...">.
<CAMERA>. Nobody sings, mouth closed. A single unbroken shot. No on-screen text, lettering or logos.
```

**insert**, image-to-video, silent, first frame = keyframe:

```text
<WHAT MOVES AND HOW, literally>. <CAMERA>. A single unbroken shot.
<For object-only shots: No people, hands or faces enter the frame.> No on-screen text, lettering or logos.
```

## Notes

- The keyframe, never the sheet, is `@Image1`. Through Picsart's CLI, Seedance "treats `imageUrls` as **first frame** (verified)" ([persona skill](https://github.com/PicsArt/gen-ai-skills/blob/main/skills/gen-ai-persona-creation/SKILL.md), MIT). A sheet would open the clip on the sheet.
- Frontal, locked, no head turns: a head turn is where a lip-sync goes wrong. End a sung shot on an action after the last word, so the cut has something to land on.
- Expect the model to sing the line again in its own timing, with the mouth following that new soundtrack. For a 30 s video, shifting each clip by its median lag in the edit can be enough; warping each take between word ends is the heavier fix.
- On fal, `draft: true` "Returns a draft_id for completing the draft at 1080p within seven days" ([fal schema](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api)). Seedance `duration` is an integer from 4 to 30 or `auto`, with no setting that matches the audio, so measure every clip with ffprobe.
- Budget about twice the on-screen seconds for sung shots and once for motion shots.
