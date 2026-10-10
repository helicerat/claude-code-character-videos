# gen-01: the character

**What it does:** designs one original character that reads at phone size, and locks it in pictures and in text so it stays the same in every later shot.

**What you should see:** 4 one-paragraph pitches, your pick as a base image, then `sheet.png` (design sheet), `ref.png` (one-face reference for models) and `CHARACTER.md` (the canon).

Step 2. Paid: about 1 base image, 1 to 5 edits and 2 sheets, at $0.134 per 1K/2K image on Nano Banana Pro ([Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), 2026-10-09). Method: [docs/02-character.md](../../docs/02-character.md). Next: [`gen-02-keyframes.md`](gen-02-keyframes.md).

## Prompt

```text
The project folder is examples/my-video. BRIEF.md, lyrics.txt, script.txt, STORYBOARD.md,
PROMPTS.md, costs.csv and every assets/ path below are inside it; docs/ and scripts/ are at the
repo root. Run commands from the repo root.
Read BRIEF.md and docs/02-character.md. The model prompts and the CHARACTER.md template this
prompt refers to are in prompts/generate/gen-01-character.md.
Before every paid call, state the model, the provider, the number of calls or seconds and the
list price, and wait for my OK. Log every paid call in costs.csv (date, step, model, provider,
units, unit_price_usd, total_usd, kept, note), rejected takes included.

1. Pitch 4 original characters for this brief, one paragraph each:
   - a short name people can repeat, and a one-line vibe a stranger can picture
   - kind and style: human, animal, object or creature; photoreal, 3D-animated or flat 2D
   - 2-4 traits that read at thumbnail size, from any angle, while moving:
     one silhouette feature (head shape, hair, horns, body shape) that is part of the body (a costume does not count);
     one face feature; one fixed outfit or marking; one signature color with its hex code
   - one signature gesture, move or one-word catchphrase
   - how it contrasts with the places it will appear in
   - for a mascot: what it is in one object, its personality, its one emotional job
   Rules: original only, no real people, no existing characters. Never write a studio or
   franchise name in any prompt ("3D-animated, feature-film animation aesthetic" instead).
   Face visible, hands free. For an animal or creature, state the species and the counts of
   legs, arms, horns, wings and tails. Describe everything literally: no similes.
   Wait for my pick.

2. For the pick, write the frozen appearance block (identity only: face, body, colors as hex,
   outfit, marks; no pose, expression, light or scene) and one style sentence.
   Show me the price per image, then generate the base image with <MODEL> through <CLI or MCP>.
   Stop and show it to me.

3. If I ask for a change, edit the approved image with the edit prompt and change
   exactly one thing per edit. Never regenerate from scratch once I like the face.

4. When I approve the base image, generate:
   - assets/character/sheet.png with the design-sheet prompt (design only, never a video input)
   - assets/character/ref.png with the video-reference prompt (the image models will receive)
   Pass the approved base image as the only reference. Show both, full size.

5. Write assets/character/CHARACTER.md from the template, version v1.
   From now on, every image and video prompt pastes the appearance block and the style
   sentence word for word. Any change to them bumps the version and gets a changelog line.

Do not generate scenes yet.
```

## Model prompts

**Base image**, the first picture of the character:

```text
Full-body image of <NAME>: <FROZEN APPEARANCE BLOCK>.
Standing relaxed, facing the camera, arms slightly away from the body, <neutral | signature> expression.
Plain seamless light-grey background, soft even light, soft shadow on the floor.
Head to toe in frame with space around it. <STYLE SENTENCE>.
No text, no logos, no props<, except SIGNATURE PROP>.
```

**Edit**, for any change after the base image exists:

```text
Keep this exact character identical: same face, proportions, colors, outfit, light and background.
Change only this: <ONE CHANGE>.
```

**Design sheet** (`sheet.png`, for you and the agent):

```text
Character design sheet of the exact character in the reference image. One wide image.
Same face, proportions, colors and outfit in every view. Plain light-grey background in every panel.
Top row, same scale, full body: front, three-quarter front, side, three-quarter back, back.
Bottom row, head and shoulders: neutral, happy, surprised, <THE EXPRESSION THIS VIDEO NEEDS MOST>.
A strip of 4 to 6 color swatches. Thin white dividers. No text, no labels. <STYLE SENTENCE>.
```

**Video reference** (`ref.png`, the image models receive):

```text
Reference image of the exact character in the reference image. One wide image, three panels,
flat neutral grey #808080 background in every panel, soft even light, no text, no labels.
Left half: chest-up portrait, front view, face large and sharp, eyes to camera, neutral expression.
Middle quarter: full body from the front, cropped at the base of the neck, no face in this panel.
Right quarter: full body from behind.
Exactly one visible face in the whole image. Same outfit and colors in every panel. <STYLE SENTENCE>.
```

For a mascot whose head is most of its body, drop the neck crop and keep only "exactly one large face".

**`assets/character/CHARACTER.md`** template:

```markdown
# <NAME> - canon v<N>
Frozen appearance block (paste word for word):
<...>
By framing (paste only the block for the shot):
- close-up: <head, face, hair or horns, signature color>
- medium: close-up + <top, chest, arms>
- full: medium + <legs, feet, tail>
Anatomy lock (non-human): <legs, arms, horns, wings, tails: counts>
Palette: <role: hex> x 4-6
Signature detail, visible in every shot: <...>
Style sentence (paste word for word): <...>
Never changes: <list>
May change per scene: <expression, pose, props named in STORYBOARD.md>
Files: sheet.png (design only), ref.png (model input), base.png (approved base)
Route that won the casting test: <model, settings> (if you ran one)
Changelog: <version | date | change | why>
```

## Notes

- No studio names. Picsart: "Studio names trigger content policies + downstream IP risk." ([persona skill](https://github.com/PicsArt/gen-ai-skills/blob/main/skills/gen-ai-persona-creation/SKILL.md), MIT). No similes either: "like a microphone" can produce a microphone.
- Edit, never re-roll. Google calls multi-turn editing "the recommended way to iterate on images" ([Gemini docs](https://ai.google.dev/gemini-api/docs/image-generation)). Several changes in one edit give a different character.
- The frozen block follows Picsart's rule: "verbatim, reuse in every prompt", identity only, "NOT per-shot deltas" (same skill). Identity lives in the text and the reference images together.
- Models get `ref.png`, never the sheet: a whole sheet given as an image reference can carry its grid into the output.
- At most 5 character images per call. Nano Banana Pro takes "Up to 5 images of characters to maintain character consistency" out of 14 references ([Gemini docs](https://ai.google.dev/gemini-api/docs/image-generation)).
- Optional casting test: if one route gives the right face but stiff and another a lively but wrong one, render the same shot through 2 or 3 routes and pick by eye.
