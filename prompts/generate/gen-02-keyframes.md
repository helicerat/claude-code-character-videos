# gen-02: one keyframe per line

What it does: draws the character into one still for every line of the song or script, all in 9:16, all in one world. These stills are what the video model animates in step 5.
What you should see: `STORYBOARD.md` with one row per line, then one image per row. Same face, same outfit, a clear action that matches the line, and a calm area where captions will go.

Status: written from docs, not run for this repo. Built from the method in [`docs/02-character.md`](../../docs/02-character.md); expect to tune it.

Pipeline step 2. Paid: about 8 to 10 images for six lines. Needs an approved `lyrics.txt` or `script.txt` first (step 1 of [`gen-03-song.md`](gen-03-song.md) or [`gen-06-talking.md`](gen-06-talking.md)). Next: [`gen-03-song.md`](gen-03-song.md).

## Prompt for Claude Code

```
The project folder is examples/my-video. BRIEF.md, lyrics.txt, script.txt, STORYBOARD.md,
PROMPTS.md, costs.csv and every assets/ path below are inside it; docs/ and scripts/ are at the
repo root. Run commands from the repo root.
Read BRIEF.md, lyrics.txt (or script.txt) and assets/character/CHARACTER.md.
Before every paid call, state the model, the provider, the number of calls or seconds and the
list price, and wait for my OK. Log every paid call in costs.csv (date, step, model, provider,
units, list price in USD, kept or rejected), rejected takes included.

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

3. Check every keyframe at full size against the list below. Fix a defect by editing only that
   region of the image; keep the original file. Save to assets/keyframes/01.png, 02.png ...
   Log image, prompt, references and canon version in assets/keyframes/log.md.
```

Keyframe check (run on every image):
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

```
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

If a word must appear inside the scene (a sign, a page, a door), ask for a blank surface and let the edit print the word: "a blank white sign", "a paper calendar with an empty grid". The code can then spell it correctly and time it to the word.

## Why each piece is there

- **One world for every line.** The same place in every scene keeps the character and the light stable, and lets the viewer follow the song instead of the set.
- **Character in frame from frame one.** The first frame is the hook; an empty opening loses the viewer.
- **Close-ups for sung lines.** A locked frontal close-up is the easiest shot for a lip-sync model.
- **Identity only, no layout.** A sheet passed as a reference can carry its grid, labels or lettering into the output, so the prompt says not to copy them.
- **Framing word first, block by framing.** A close-up prompt that lists boots asks the model to show the boots.
- **Action as body positions, expression in the still.** Picsart found Gemini keeps a neutral stance even when asked for action ([persona skill](https://github.com/PicsArt/gen-ai-skills/blob/main/skills/gen-ai-persona-creation/SKILL.md), MIT). Put the expression in the still, then animate.
- **What the character wants.** A list of movements alone gives flat acting; a reason for the shot gives the movements a direction.
- **Face clear, hands only when needed.** Hair, hands and props across the face spoil the lip-sync later, and every hand in frame is a chance for a wrong finger count.
- **A calm caption zone written into the prompt.** Decide in the storyboard where the words go, then write the empty area and the subject's position into the prompt together. A blank surface for a printed word follows the same idea.
- **"No text, no letters, no logos" last.** Nothing positive comes after the negative tail. Google suggests describing what you want instead of what you do not want ([Gemini docs](https://ai.google.dev/gemini-api/docs/image-generation)); the empty caption zone is written that way.
- **Approved frame as a second reference.** Google: "include previously generated images in subsequent prompts to maintain consistency" ([Gemini docs](https://ai.google.dev/gemini-api/docs/image-generation)). Their example is a 360-degree view; that it helps across scenes is unverified.
- **At most 5 character images.** Nano Banana Pro: "Up to 5 images of characters to maintain character consistency" (same page).
- **Region fixes, keep the original.** Crop the region, redraw the crop, paste it back; a full regeneration risks the parts that were right.

Price guide: Nano Banana Pro $0.134 per 1K/2K image ([Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), Oct 2026). Six lines plus a few fixes is about 8-10 images.

Sources: https://github.com/PicsArt/gen-ai-skills/blob/main/skills/gen-ai-persona-creation/SKILL.md , https://ai.google.dev/gemini-api/docs/image-generation , https://ai.google.dev/gemini-api/docs/pricing
