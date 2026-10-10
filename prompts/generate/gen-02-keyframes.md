# gen-02: one keyframe per line

**What it does:** draws the character into one 9:16 still for every line of the song or script, all in one world. The video model animates these stills in step 4.

**What you should see:** `STORYBOARD.md` with one row per line, then one image per row: the same face and outfit, a clear action that matches the line, and a calm area for captions.

Step 2. Paid: about 8 to 10 images for six lines, at $0.134 per 1K/2K image on Nano Banana Pro ([Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), 2026-10-09). Needs an approved `lyrics.txt` or `script.txt` (step 1 of [`gen-03-song.md`](gen-03-song.md) or [`gen-06-talking.md`](gen-06-talking.md)). Method: [docs/02-character.md](../../docs/02-character.md). Next: [`gen-03-song.md`](gen-03-song.md).

## Prompt

```text
The project folder is examples/my-video. BRIEF.md, lyrics.txt, script.txt, STORYBOARD.md,
PROMPTS.md, costs.csv and every assets/ path below are inside it; docs/ and scripts/ are at the
repo root. Run commands from the repo root.
Read BRIEF.md, lyrics.txt (or script.txt) and assets/character/CHARACTER.md. The per-row model
prompt and the keyframe check this prompt refers to are in prompts/generate/gen-02-keyframes.md.
Before every paid call, state the model, the provider, the number of calls or seconds and the
list price, and wait for my OK. Log every paid call in costs.csv (date, step, model, provider,
units, unit_price_usd, total_usd, kept, note), rejected takes included.

1. Write STORYBOARD.md, one row per line:
   | id | line | seconds (from the timing table) | framing word | action as body positions |
   | expression | what the character wants in this moment | scene prop | hands in frame? |
   | caption zone (top or bottom third) | edit layer (word highlight, counter, card, board slot...) |
   Rules:
   - One world for the whole video: the same room or place in every row unless BRIEF.md says otherwise.
     Write one world sentence (place, light, two or three fixed objects, colors as hex) and reuse it.
   - Row 1 is the hook: the character large in frame, facing the camera, from the first frame.
   - Prefer close-up and medium close-up for any line that is sung or spoken to camera.
   - Every number, word or card in the edit layer must match a word that is sung or spoken in that row.
   Wait for my approval.

2. Generate one 9:16 keyframe per row with <MODEL> edit through <CLI or MCP>.
   References: assets/character/ref.png as image 1. After I approve keyframe 01, also pass it as image 2.
   Never pass sheet.png. Never more than 5 character images in one call.
   Paste the canon block for the row's framing and the style sentence from CHARACTER.md word for word.
   Show me the total price first. Stop after the first 2 keyframes so I can check the likeness.

3. Check every keyframe at full size against the keyframe check. Fix a defect by editing only that
   region of the image; keep the original file. Save to assets/keyframes/01.png, 02.png ...
   Log image, prompt, references and canon version in assets/keyframes/log.md.
```

## Keyframe check

Run it on every image:

1. Open it at full size; a contact sheet hides defects.
2. The signature trait is there, same shape and color as `ref.png`.
3. The outfit matches `CHARACTER.md` garment by garment; no duplicated accessory.
4. The face is clear: no hair, hand or prop across the eyes or mouth.
5. Hands: count the fingers, or there are no hands in frame.
6. No letters, logos or panel borders.
7. Side by side with `ref.png`, it reads as the same face.
8. The expression the line needs is already in the still.
9. At phone size the character stands out from the background, and the caption zone is calm.

## Model prompt (per row)

```text
The first reference image shows <NAME>. Use it for identity only: face, proportions, colors, outfit, <SIGNATURE DETAIL>.
Do not copy its layout, panels, grey background or labels.
<If image 2 is passed: The second reference image is an approved frame from the same video. Match the character's look in it.>
Vertical 9:16, one single frame.
<FRAMING WORD> of <NAME>: <CANON BLOCK FOR THIS FRAMING>, <ACTION AS BODY POSITIONS>, <EXPRESSION>, <POSITION IN FRAME>.
<WORLD SENTENCE, word for word>. <SCENE PROP FOR THIS LINE, described literally>.
Face clear of hair, hands and props. <No hands in frame.>
The <bottom | top> third of the frame is calm, empty <wall | floor | sky> for captions.
<STYLE SENTENCE>. No text, no letters, no logos.
```

If a word must appear inside the scene (a sign, a page, a door), ask for a blank surface, such as "a blank white sign" or "a paper calendar with an empty grid", and let the edit print the word. The code spells it right and times it to the word.

## Notes

- Identity only, no layout: a sheet passed as a reference can carry its grid, labels or lettering into the output.
- Put the expression in the still, then animate. Picsart found that Gemini keeps a neutral stance even when asked for action ([persona skill](https://github.com/PicsArt/gen-ai-skills/blob/main/skills/gen-ai-persona-creation/SKILL.md), MIT).
- "No text, no letters, no logos" goes last, with nothing positive after it. Google suggests describing what you want instead of what you do not want ([Gemini docs](https://ai.google.dev/gemini-api/docs/image-generation)), which is why the caption zone is written as a calm, empty area.
- The approved frame as image 2 follows Google's advice to "include previously generated images in subsequent prompts to maintain consistency" (same page). Nano Banana Pro takes "Up to 5 images of characters to maintain character consistency".
- Fix a region, keep the original: crop the region, redraw the crop, paste it back. A full regeneration risks the parts that were right.
