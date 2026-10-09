# gen-05: make the character sing

What it does: turns each keyframe and its audio piece into a clip where the mouth moves on the words, then measures the sync and lines each take up with the master song.
What you should see: one clip per scene, the mouth on the words, the character moving in the gaps, and a sync report per clip.

Status: written from docs, not run for this repo. Built from the Seedance schema and the method in [`docs/04-animate.md`](../../docs/04-animate.md); expect to tune it.

Pipeline step 4, the most expensive one. Next: [`../00-brief.md`](../00-brief.md), then the edit prompts starting at [`../edit/01-assets.md`](../edit/01-assets.md).

## Prompt for Claude Code

```
The project folder is examples/my-video. BRIEF.md, lyrics.txt, script.txt, STORYBOARD.md,
PROMPTS.md, costs.csv and every assets/ path below are inside it; docs/ and scripts/ are at the
repo root. Run commands from the repo root.
Read STORYBOARD.md, assets/song/pieces.json and assets/character/CHARACTER.md.
Before every paid call, state the model, the provider, the number of calls or seconds and the
list price, and wait for my OK. Log every paid call in costs.csv (date, step, model, provider,
units, list price in USD, kept or rejected), rejected takes included.

1. Mark every scene as one of three kinds:
   - lips: the character sings on camera (reference-to-video, keyframe + vocal piece)
   - motion: action or dance on the beat, nobody sings (reference-to-video, keyframe + full-mix piece)
   - insert: objects, hands, reactions that need no song (image-to-video, keyframe as the exact first frame, silent)
   Write one prompt per scene into PROMPTS.md, all in this one file, from the templates below.
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

**lips** (sung to camera):

```
@Image1 is <NAME>. <NAME> sings the words of @Audio1 to the camera, the mouth on every word: "<EXACT WORDS IN THIS PIECE>".
<CLOSE-UP | MEDIUM CLOSE-UP> of <NAME> from @Image1 (<CANON BLOCK FOR THIS FRAMING>), facing the camera, <EXPRESSION>.
<WHAT THE CHARACTER WANTS IN THIS MOMENT>.
<0.0-0.8 s: action before the first word>. <0.8-2.4 s ("<words>"): action on these words>. <after the last word: one action to end on>.
Mouth large in frame, nothing crosses it. Locked camera, no head turns. Only <NAME> sings.
A single unbroken shot. No on-screen text, lettering or logos.
```

**motion** (dance or action on the beat):

```
The scene from @Image1, moving in time with @Audio1. <FRAMING>.
<NAME> from @Image1 (<CANON BLOCK FOR THIS FRAMING>) <ACTION, with beat times: "on each beat (0.55, 1.10, 1.64 s): ...">.
<CAMERA>. Nobody sings, mouth closed. A single unbroken shot. No on-screen text, lettering or logos.
```

**insert** (image-to-video, silent, first frame = keyframe):

```
<WHAT MOVES AND HOW, literally>. <CAMERA>. A single unbroken shot.
<For object-only shots: No people, hands or faces enter the frame.> No on-screen text, lettering or logos.
```

## Why each piece is there

- **Three kinds of clip.** `lips`, `motion` and `insert` need different inputs; an `insert` is the cheapest to get right, because the clip starts on a picture you already approved.
- **All prompts in one file**, written in one sitting, so the character and the place read the same in every clip.
- **The sung sentence.** The `lips` template names the character and the audio by their reference names from the schema, says that the character sings the audio, and quotes the exact words of the piece. Describing the mouth in detail adds words without adding control, so the template does not.
- **Frontal, locked, no head turns.** A head turn is where a lip-sync goes wrong.
- **Timed beats with the words quoted, an action after the last word.** The place and what the character wants, then timed beats, then the camera and the mouth rule. A singing shot ends on an action after the last word, so the cut has something to land on.
- **Measure, then line up.** Expect the model to sing the line again in its own timing, with the mouth following that new soundtrack. Transcribe each take's own soundtrack, compare word ends with the song, and take the median lag; judge by long words, since very short words measure badly. For a 30 s video, shifting the clip by its lag in the edit may be enough; warping each take between word ends is the heavier fix. Which one this video needs is unverified.
- **Two identical retries, then change something**: one variable, or the keyframe. A third identical take rarely fixes what two missed.
- **Budget.** Plan on about twice the on-screen seconds for sung shots and once for motion shots (our assumption).
- **The keyframe, never the sheet, as @Image1.** Through Picsart's CLI, Seedance "treats `imageUrls` as **first frame** (verified)" ([Picsart persona skill](https://github.com/PicsArt/gen-ai-skills/blob/main/skills/gen-ai-persona-creation/SKILL.md), MIT). A sheet would open the clip on the sheet.
- **Pilot first, batches with a price.** Two pilot clips before the main run, and one sentence with clips, seconds and cost before every batch.
- **Drafts.** On fal, `draft: true` "Returns a draft_id for completing the draft at 1080p within seven days" ([fal schema](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api)). Seedance `duration` is an integer from 4 to 30 or `auto`, with no setting that matches the audio, so measure every clip with ffprobe.

Price guide (list prices, Oct 2026): Picsart 480p $0.1028/s, 720p $0.231/s (Picsart's image-to-video rate; no separate reference-to-video price listed); fal 720p about $0.473/s ([Picsart pricing](https://picsart.com/api-platform/models/seedance-2.5/pricing), [fal](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api)). This is the most expensive step. Two takes per sung scene doubles its share.

Sources: https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api , https://picsart.com/api-platform/models/seedance-2.5/pricing , https://github.com/PicsArt/gen-ai-skills/blob/main/skills/gen-ai-persona-creation/SKILL.md
