# 02. The character: design it, then keep it identical

Step 2 of 7. Cost: every image is a paid call, $0.134 each with Nano Banana Pro. Prompts: [`gen-01-character`](../prompts/generate/gen-01-character.md), [`gen-02-keyframes`](../prompts/generate/gen-02-keyframes.md). Output: `assets/character/` and one keyframe per scene.

The three examples skip this step and use existing footage ([05](05-or-use-existing-footage.md)).

**Design** decides whether people remember the character. **Lock** decides whether it is the same character in shot 1 and shot 7, across two different models.

## 1. Design: what makes a character memorable

### 1.1 Rules

| Rule | Why |
|---|---|
| 2 to 4 traits that read at thumbnail size, from any angle, while moving. Name the exact shape, never "quirky" | a vague word gives the model nothing to repeat |
| One exaggerated feature that reads as a silhouette, one outfit in one color | the silhouette is what a scrolling viewer recognises |
| The exaggeration is part of the body (hair, face shape, build), not a costume | without the costume, a costume-only character turns ordinary |
| Normal proportions, empty hands, face uncovered | video models break on capes, props and masks |
| A short name, a one-word catchphrase, a signature move, humour without dialogue | people ask for the character by name, and silent humour travels across languages |
| Contrast with the places it appears in | the contrast is the joke in every episode |
| Original only: no real people, no existing characters, no studio or franchise names in prompts ("3D-animated, feature-film animation aesthetic" instead) | "Studio names trigger content policies + downstream IP risk." ([Picsart persona skill](https://github.com/PicsArt/gen-ai-skills/blob/main/skills/gen-ai-persona-creation/SKILL.md), MIT) |

### 1.2 Mascot or cartoon character

- **Answer three questions first** and paste the answers into every prompt: what the topic is in one object, what the personality is, what the one emotional job is.
- **Ask for a simple flat style** with thick clean shapes and few colors. It animates better and stays readable small.
- **Non-human**: state species, body plan, the counts of legs, horns, wings and tails, and colors as hex.
- **Change one thing at a time.** Several changes at once give you a different character.
- **Check at phone size.** A character can vanish against a background of its own color.

### 1.3 Who picks

Claude Code pitches 4 characters and waits for your pick. A wrong character costs every later step.

## 2. Base image first, then edit. Never re-roll a face you like

- **Base image**: plain light-grey background, soft even light, a soft floor shadow, full body with space around it, facing the camera, no text.
- **Edit, never regenerate.** Each edit keeps the character identical and names one change. Google calls multi-turn editing "the recommended way to iterate on images" ([Gemini image docs](https://ai.google.dev/gemini-api/docs/image-generation)).
- **Body action goes in the video prompt.** Gemini "tends to preserve the casting card's neutral stance even when prompted for power-pose / mid-action" (Picsart's skill), so keep the still's pose calm.
- **Facial expression goes in the still.** A video model often misses a strong expression, and editing it into the still is cheap.

## 3. The sheet: two images with two jobs

| File | What it is | For |
|---|---|---|
| `sheet.png` | turnaround, expressions, palette swatches | you and the agent: the design document |
| `ref.png` | exactly one visible face, large, on neutral grey; the body panels show no face | the models: the identity reference |

`ref.png` gives a model one large face to copy instead of many small ones. To choose between the two for your character, animate one keyframe twice with the same prompt, once with each as `@Image2`. For a mascot whose head is most of its body, drop the neck crop and keep only "exactly one large face".

**Never pass either image as the first frame of a video.** A sheet given as a reference can carry its grid into the output, and as the input image it opens the video on the sheet: "Seedance treats `imageUrls` as **first frame** (verified)" (Picsart's skill, Seedance 2.0). Animate one clean keyframe per scene instead.

If the face looks right but stiff in one route and lively but wrong in another, render the same shot through 2 or 3 routes and pick by eye.

## 4. The text half of identity

Every prompt carries the same written description and the same reference images.

### 4.1 A frozen appearance block

From Picsart's skill (MIT), verbatim:

> Write: name | bio (2–3 sentences) | voice/tone | **frozen appearance block** (verbatim, reuse in every prompt). Block contains identity DNA only (face geometry, eye/hair/skin, body type, distinguishing marks, wardrobe aesthetic baseline) [...] NOT per-shot deltas (expression, pose, lighting, scene, specific outfits).

### 4.2 Macros pasted into every prompt

Write the appearance block, the style sentence and the shot ending once, in `CHARACTER.md`, and paste them word for word. The shot ending in the video prompts: "A single unbroken shot. No on-screen text, lettering or logos."

- **Read your text for what it will cause.** "Long loose strands across her face" puts hair across her face in every image.
- **Describe literally.** A simile becomes a prop: "like a microphone" can produce a microphone.

### 4.3 Split the description by framing

A close-up prompt that lists boots asks for the boots, and the shot comes back wide. Keep one block per framing, each adding to the last:

```markdown
| Framing | Description (each row adds to the one above) |
|---|---|
| close-up | head of a <size> <species>, <horn count and shape>, <skin or scale color + hex>, <eye color>, <one signature marking> |
| medium close-up | close-up + <neck and chest>, <front limb count, hands or claws> |
| medium | medium close-up + <wings or arms: count, color + hex>, <build: slim or stocky> |
| full / wide | medium + <full body proportions>, <tail shape and length>, <size next to a person or a door> |
```

Version the canon and diff it before each batch.

### 4.4 Color as hex, style as one fixed sentence

- Every color as hex.
- One style sentence, stored in a file and appended to every image and video prompt. Retyped, it drifts.
- Full color in the prompt, monochrome in post. A monochrome image can turn the video grey.

## 5. Passing identity to each model

| Model | How identity goes in | Limit |
|---|---|---|
| Nano Banana Pro (`gemini-3-pro-image`) | reference images in an edit call | "Up to 5 images of characters to maintain character consistency", 14 references in total ([docs](https://ai.google.dev/gemini-api/docs/image-generation)) |
| Nano Banana 2.1 (`gemini-3.1-flash-image`) | same | "Up to 4 images of characters" |
| Seedance 2.5 reference-to-video | `@Image1`, `@Audio1` in the prompt | up to 30 images; audio 1.8 to 30.2 s each, 30.2 s combined ([fal schema](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api)) |
| Kling v3 | `elements`: a frontal image plus 1 to 3 angles, `@Element1` in the prompt | [fal schema](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video/api) |
| Higgsfield Soul ID | train on 5 to 20 photos, then `--soul-id` | built for real faces ([skill](https://github.com/higgsfield-ai/skills/blob/main/higgsfield-soul-id/SKILL.md)) |

- **Give every reference one named job**: "@Image1 is the character, for identity only". Never mention an image the model will not receive. If a sheet must go in, say not to copy its layout or labels.
- **A seed is not an identity lock**: "results may still vary slightly even with the same seed" (fal Seedance schema).
- **Some Seedance consoles block faces that look real.** A stylized character avoids that.

## 6. Keyframes: one still per scene

Draw the approved character into one 9:16 still per line of the song or script. [04-animate](04-animate.md) animates them.

- **One world**: the same place in every scene.
- **Character large and facing the camera from frame one.**
- **Close-ups for sung lines**: a locked frontal close-up is the easiest shot for lip-sync.
- **A calm caption zone**: the top or bottom third stays empty for the edit.
- **No lettering**: ask for a blank sign or page, and let the edit print the word.

Check every keyframe at full size against `ref.png` and `CHARACTER.md`: signature trait, every garment, a clear face, the finger count, no letters or logos, the expression the scene needs, and a calm caption zone at phone size. Log the image, prompt, references and canon version.

Fix a defect by editing only the broken region: crop it, redraw the crop, paste it back. Keep the original file, and a second edit model in case one refuses a close crop.

## 7. Models and list prices

| Model | List price (2026-10-09) | Notes |
|---|---|---|
| Nano Banana Pro (`gemini-3-pro-image`) | Google $0.134 per 1K/2K image, $0.24 per 4K ([pricing](https://ai.google.dev/gemini-api/docs/pricing)); [fal](https://fal.ai/models/fal-ai/nano-banana-pro/edit) $0.15; Higgsfield 2 credits | the `-preview` model ID is shut down |
| GPT Image 2 (`gpt-image-2`) | [fal](https://fal.ai/models/openai/gpt-image-2), 1024x1536: $0.005 low, $0.042 medium, $0.165 high; OpenAI API metered by tokens ([model page](https://developers.openai.com/api/docs/models/gpt-image-2)) | good for early concept images |

The step takes 12 to 18 images: a base image, 1 to 5 edits, 2 sheets, then 8 to 10 keyframes for six lines plus fixes. That is roughly $1.60 to $2.40 at $0.134 per image, before retakes.

## 8. Files this step leaves behind

```text
assets/character/
  concept.md      the 4 pitches and the one you picked
  base.png        the approved base image
  sheet.png       design sheet, never a video input
  ref.png         one-face reference, the image models receive
  CHARACTER.md    canon: appearance block, blocks by framing, palette hex, style sentence,
                  what never changes, what may change, changelog
assets/keyframes/
  01.png ...      one 9:16 still per line
  log.md          prompt, references and canon version for each image
STORYBOARD.md     one row per line: framing, action, expression, caption zone, edit layer
costs.csv         every paid call, kept or rejected
```

## Pitfalls

More in [gotchas.md](gotchas.md).

- A second character changes in every shot: cast him once and attach that frame to all his shots.
- Hair over the face: write "face clear of hair" in every prompt.
- The character disappears into the background: pick a background color that contrasts with the outfit.
- In Higgsfield's CLI, `nano_banana_2` resolves to Nano Banana Pro ([model catalog](https://github.com/higgsfield-ai/skills/blob/main/higgsfield-generate/references/model-catalog.md)).
- Read the service's terms before you publish generated assets.
