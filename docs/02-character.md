# 02. The character: design it, then keep it identical

Step 2 of 7. Costs money: every image is a paid call (Nano Banana Pro lists at $0.134 per 1K or 2K image). Prompts: [`prompts/generate/gen-01-character.md`](../prompts/generate/gen-01-character.md) and [`gen-02-keyframes.md`](../prompts/generate/gen-02-keyframes.md). Output: `assets/character/` and one keyframe per scene.

**We did not run this step for the worked examples.** They use existing footage ([05-or-use-existing-footage.md](05-or-use-existing-footage.md)). This chapter is our method, written from the model providers' docs and checked against them on 2026-10-09. Quotes from Google's docs (CC BY 4.0) and from Picsart's MIT-licensed skills are word for word, with a link; everything else is our own advice and is marked as untested where it matters.

The step has two halves. **Design** decides whether people remember the character. **Lock** decides whether it is the same character in shot 1 and shot 7, across two different models.

## 1. Design: what makes a character memorable

### 1.1 Rules

| Rule | Why |
|---|---|
| 2 to 4 traits that stay obvious at thumbnail size, from any angle, while moving. Name the exact shape, never a vague word like "quirky" | a vague word gives the model nothing to repeat |
| One exaggerated feature that reads as a silhouette, and one outfit in one color | the silhouette is what a scrolling viewer recognises |
| The exaggeration grows on the body (hair, beard, face shape, build), and a costume alone does not carry it | a costume-only character turns ordinary the moment the costume is gone |
| Normal proportions, empty hands, face uncovered; a short name people can repeat and a one-word catchphrase | video models break on capes, props and masks, and a name is how people ask for the character again |
| A recurring gesture or signature move; humour that works without dialogue | the move is the series' signature, and silent humour travels across languages |
| Contrast between the character and the places it appears in | the contrast is the joke in every episode |
| Original only: no real people, no existing characters | likeness and IP risk |
| Never name a studio or franchise in a prompt. Write "3D-animated", "feature-film animation aesthetic" instead | [Picsart persona skill](https://github.com/PicsArt/gen-ai-skills/blob/main/skills/gen-ai-persona-creation/SKILL.md) (MIT): "Studio names trigger content policies + downstream IP risk." |

### 1.2 Mascot or cartoon character

- **Three questions before any tool**: what the product or topic is in one object, what the personality is, and what the one emotional job is (cheer you on, make you laugh). Write the answers down and paste them into every prompt.
- **Describe personality as well as looks**, and ask for a simple flat style with thick clean shapes and few colors. Simple characters are easier to animate and stay readable small.
- **Change one thing at a time.** Changing several things at once gives you a different character each time.
- **Non-human characters**: always state species, body plan, the counts of legs, horns, wings and tails, and colors as hex. Keep one small signature color, ideally the accent color of the video. Without species and anatomy written out, expect the model to drift from shot to shot.
- **Check at phone size.** A character can vanish against a background of the same color, and props can hide the face. Hold items above the head, and pick a background that contrasts with the clothes.
- Picsart's skill: "**Most creators want stylized.** Don't blindly default to realistic." (MIT)

### 1.3 Who picks

Picsart's skill tells the agent to "infer and proceed" and ask at most one question. This guide uses **pitch 4, wait for a pick**: a wrong character costs you every later step, and you are the one who has to like it.

## 2. Base image first, then edit. Never re-roll a face you like

- **Base image recipe**: plain light-grey seamless background, soft even light, a soft floor shadow, full body head to toe with space around it, facing the camera, neutral or signature expression, no text.
- **Edit, do not regenerate.** The edit keeps the character identical and names the one thing to change. Regenerating from scratch loses the face.
- Google's own guidance for Nano Banana: multi-turn conversation is "the recommended way to iterate on images", with follow-ups like "Keep everything the same, but change the character's expression to be more serious." For a 360-degree view: "include previously generated images in subsequent prompts to maintain consistency" ([Gemini image docs](https://ai.google.dev/gemini-api/docs/image-generation)).
- **Pose and expression go to different places.**
  - Picsart verified that Gemini "tends to preserve the casting card's neutral stance even when prompted for power-pose / mid-action". Their fix: leave the pose calm and put the action in the video prompt.
  - Faces are the other way round: a video model asked for a strong expression often misses it, and editing the expression into the still is cheap. Put the expression in the still, then animate.
  - So: big body action goes in the video prompt; any facial expression that has to read goes into the still.

## 3. The sheet: two images with two jobs

**Rich design sheet.** A turnaround, expressions, close-ups, a color palette with hex codes, a "do not change" list. It is the document you and the agent design against.

**Lean model reference with one face.** Only one visible face, large, on a neutral grey. The reasoning: a video model reads the face from the biggest face it sees, and many small panels starve it. Variants cover the heads in the full-body panels or crop them at the neck. This is untested; nobody we know of has published a side-by-side test.

**What not to do with a sheet.** Passed whole as an image reference, a sheet can carry its grid layout into the output (a floating giant head, panels in the frame). Passed to a video model as the input image, it opens the video on the sheet: Picsart, verified on Seedance 2.0 through their CLI, "Seedance treats `imageUrls` as **first frame** (verified)" ([persona skill](https://github.com/PicsArt/gen-ai-skills/blob/main/skills/gen-ai-persona-creation/SKILL.md), MIT).

**What this guide does:**
1. Make both. `sheet.png` is the design document for you and the agent. `ref.png` is the one-face reference for models.
2. Never pass either one as the first frame of a video. Generate a clean single keyframe per scene and animate that.
3. For a cartoon mascot whose head is most of its body, the headless-panel trick is untested. Keep only "exactly one large face".
4. If the face looks right but stiff in one route and lively but wrong in another, render the same shot through 2 or 3 routes and pick by eye (a casting test).

## 4. The text half of identity

The picture alone does not hold the character. Every prompt carries the same written description and the same reference images.

### 4.1 A frozen appearance block

From Picsart's skill (MIT), verbatim:

> Write: name | bio (2–3 sentences) | voice/tone | **frozen appearance block** (verbatim, reuse in every prompt). Block contains identity DNA only (face geometry, eye/hair/skin, body type, distinguishing marks, wardrobe aesthetic baseline) [...] NOT per-shot deltas (expression, pose, lighting, scene, specific outfits).

### 4.2 Macros pasted into every prompt

Write the character block, the style sentence and the shot ending once, in `CHARACTER.md`, and paste them into every prompt word for word. Our shot ending: "A single unbroken shot. No on-screen text, lettering or logos."

Two rules about what you write:
- **Read your own identity text for what it will cause.** A canon line such as "long loose strands across her face" will put hair across her face in every image.
- **Describe the body and the object literally.** A simile becomes a prop: "like a microphone" can produce a microphone.

### 4.3 Split the description by framing

Pasting the whole outfit into every prompt makes close-ups come back wide: a close-up prompt that lists boots asks the model to show the boots. Keep one block per framing, each adding to the last. Our template for a non-human character:

```
| Framing | Description (each row adds to the one above) |
|---|---|
| close-up | head of a <size> <species>, <horn count and shape>, <skin or scale color + hex>, <eye color>, <one signature marking> |
| medium close-up | close-up + <neck and chest>, <front limb count, hands or claws> |
| medium | medium close-up + <wings or arms: count, color + hex>, <build: slim or stocky> |
| full / wide | medium + <full body proportions>, <tail shape and length>, <size next to a person or a door> |
```

Version the canon and diff it before each batch: it drifts silently when someone retypes a line.

### 4.4 Color as hex, style as one fixed sentence

- Write every color as hex. It is the least ambiguous way to ask for a color.
- One style sentence for every shot, stored in a file and pasted, never retyped: typed by hand it drifts. Append the same sentence to every image and video prompt.
- Prompt full color and do monochrome in post. A monochrome image prompt can carry into the video and turn it grey.

## 5. Passing identity to each model

| Model | How identity goes in | Limit | Source |
|---|---|---|---|
| Nano Banana Pro (`gemini-3-pro-image`) | reference images in an edit call | "Up to 5 images of characters to maintain character consistency", 14 references in total | [Gemini image docs](https://ai.google.dev/gemini-api/docs/image-generation) |
| Nano Banana 2.1 / `gemini-3.1-flash-image` | same | "Up to 4 images of characters" | same |
| Seedance 2.5 reference-to-video | `@Image1`, `@Audio1` in the prompt | up to 30 images; audio references 1.8 to 30.2 s each, 30.2 s combined | [fal schema](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api) |
| Seedance through Picsart CLI | the input image is the first frame | verified for 2.0; for 2.5 unverified | Picsart persona skill |
| Kling v3 | `elements` with a frontal image plus 1 to 3 extra angles, `@Element1` in the prompt | see schema | [fal schema](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video/api) |
| Higgsfield Soul ID | train once on 5 to 20 photos, then `--soul-id` | built for real faces; training on generated images of a fictional character is unverified | [higgsfield-ai/skills](https://github.com/higgsfield-ai/skills/blob/main/higgsfield-soul-id/SKILL.md) (MIT) |

Notes:
- **Give every reference one named job**, for example: @Image1 is the character, for identity only. Never mention an image the model will not receive. When a sheet must be passed, say not to copy its layout or labels.
- **Seed is not an identity lock.** The fal Seedance schema says "results may still vary slightly even with the same seed".
- **Higgsfield naming trap.** In Higgsfield's CLI `nano_banana_2` resolves to Nano Banana Pro ([model-catalog.md](https://github.com/higgsfield-ai/skills/blob/main/higgsfield-generate/references/model-catalog.md), MIT).
- **Synthetic face flagged as a real person.** Some Seedance consoles block faces that look real. A stylized character avoids the problem; for a realistic one, check the service's rules before you design it.

## 6. Keyframes: one still per scene

Once the character is approved, draw it into one 9:16 still for every line of the song or script ([`gen-02-keyframes.md`](../prompts/generate/gen-02-keyframes.md)). These stills are what the video model animates in [04-animate.md](04-animate.md). The rules that matter most:

- **One world for every line.** The same room or place in every scene, unless the brief says otherwise.
- **Character in frame from frame one.** The first scene shows the character large, facing the camera.
- **Close-ups for sung lines.** A locked frontal close-up is the easiest shot for a lip-sync model.
- **A calm caption zone, written into the prompt.** Leave the top or bottom third empty for the edit layer.
- **No lettering in the picture.** If a word must appear in the scene (a sign, a page, a door), ask for a blank surface and let the edit print the word, spelled right and timed to the word.

### Keyframe check: run it on every image

1. Open the image at full size. A contact sheet hides defects such as fused fingers.
2. The signature trait is there, same shape and color as the sheet.
3. The outfit matches `CHARACTER.md` garment by garment. Nothing added, nothing missing, no duplicated accessory.
4. The face is clear: no hair, hand or prop across the eyes or mouth.
5. Hands: count the fingers, or confirm the shot has none. If a shot does not need a hand, take it out of the picture and say so in the prompt.
6. No letters, logos or panel borders.
7. Side by side with `ref.png`, it reads as the same face.
8. The expression the scene needs is already in the still.
9. At phone size the character stands out from the background, and the caption zone is calm.
10. Log the image, the prompt, the references and the canon version.

Fix defects by editing only the broken region and keep the original file: crop the region, redraw the crop, paste it back. Keep a second edit model ready in case one refuses a close crop.

## 7. Failure modes and fixes

| Failure | Fix |
|---|---|
| Face drifts between stills | State skin tone (humans) or species, anatomy counts and hex (non-humans) |
| A second character changes in every shot | Cast him once and attach that frame to all his shots |
| The sheet's grid shows up in the output | Never pass a sheet as the first frame; make one keyframe per scene |
| Close-ups come back wide | Per-framing canon: no shoes in a close-up prompt |
| The canon drifts between batches | Version the file and diff before each batch |
| Hair over the face | Say "face clear of hair" in every prompt |
| A simile becomes a prop | Describe literally |
| The video model cannot make an expression | Edit it into the still, then animate |
| Style drifts across scenes | One style sentence, pasted, never rewritten |
| Character disappears into the background | Background that contrasts with the outfit; check at phone size |

These are the failures we plan for; we have not run the generation steps.

## 8. Models and list prices

| Model | List price (checked 2026-10-09) | Notes | Sources |
|---|---|---|---|
| Nano Banana Pro (`gemini-3-pro-image`) | Google: $0.134 per 1K/2K image, $0.24 per 4K. fal: $0.15. Higgsfield: 2 credits | fal edit endpoint takes up to 14 reference images. The `-preview` model ID is shut down | [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), [fal](https://fal.ai/models/fal-ai/nano-banana-pro/edit), [Segmind on Higgsfield credits](https://blog.segmind.com/higgsfield-credits-explained-expiry-rules-and-real-cost/) |
| GPT Image 2 (`gpt-image-2`) | fal, 1024x1536: low $0.005, medium $0.042, high $0.165 per image. OpenAI API: metered by tokens | good for early concept images | [OpenAI model page](https://developers.openai.com/api/docs/models/gpt-image-2), [fal](https://fal.ai/models/openai/gpt-image-2) |

This step takes about 1 base image, 1 to 5 edits and 2 sheets, then about 8 to 10 keyframes for six lines plus fixes. That is 12 to 18 images; at $0.134 per image, roughly $1.60 to $2.40 before retakes (our arithmetic from list prices; nothing was billed).

## 9. Files this step leaves behind

```
assets/character/
  concept.md      the 4 pitches and the one you picked
  base.png        the approved base image
  sheet.png       design sheet: for you and the agent, never a model input for video
  ref.png         one-face reference: the image models receive
  CHARACTER.md    canon: appearance block, blocks by framing, palette hex, style sentence,
                  what never changes, what may change, which route won, changelog
assets/keyframes/
  01.png ...      one 9:16 still per line
  log.md          prompt, references and canon version for each image
STORYBOARD.md     one row per line: framing, action, expression, caption zone, edit layer
costs.csv         every paid call, kept or rejected
```

## 10. Not verified

- Whether the one-face reference beats the rich sheet for video. Cheapest test: animate one keyframe twice, once with each as `@Image2`, same prompt.
- Whether Higgsfield Soul ID holds a fictional face trained on generated images.
- Whether Seedance 2.5 through the Picsart CLI still treats images as the first frame.
- Background grey value (#808080, 18% grey, light grey or white): arguments, no measurements.

## Sources

Vendor skills (MIT): [Picsart persona creation](https://github.com/PicsArt/gen-ai-skills/blob/main/skills/gen-ai-persona-creation/SKILL.md), [higgsfield-ai/skills](https://github.com/higgsfield-ai/skills).
Model docs: [Gemini image generation](https://ai.google.dev/gemini-api/docs/image-generation), [Seedance 2.5 reference-to-video on fal](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api), [Kling v3 image-to-video on fal](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video/api).
