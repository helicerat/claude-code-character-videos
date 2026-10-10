# 04. Animate the character

Step 4 of 7, and most of the bill: about $0.08 to $0.57 per second of video. Prompts: [`gen-04-cut-song.md`](../prompts/generate/gen-04-cut-song.md) (free, ffmpeg only), [`gen-05-animate.md`](../prompts/generate/gen-05-animate.md) (singing), [`gen-06-talking.md`](../prompts/generate/gen-06-talking.md) (talking). Output: one clip per scene in `assets/scenes/`, then one footage layer for the edit.

The worked examples skip this step: their footage already existed ([05](05-or-use-existing-footage.md)). Steps 5 to 7 work the same on generated clips.

## 1. Three routes

| The character... | Route | Model |
|---|---|---|
| sings | reference-to-video, one song piece per scene as the audio reference | Seedance 2.5 |
| talks | one voice file per line, lip-synced to the keyframe | OmniHuman 1.5, Kling AI Avatar v2 |
| moves without speaking | image-to-video from the keyframe, audio off | Kling v3 |

Tag every shot `lips` (sung to camera), `motion` (action on the beat, nobody sings) or `insert` (objects, hands, reactions, silent). An `insert` starts on its keyframe, a picture you already approved, so it is the cheapest to get right.

## 2. Cut the song per scene (free)

Seedance 2.5 takes audio references of **1.8 to 30.2 s each, 30.2 s combined per request, at most 15 MB, MP3 or WAV** ([fal schema](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api)).

- **Cut in the gaps between words.** Aim for 4 to 5 s per sung piece: a short window gives the model less to get wrong.
- **Start one beat early**, so a late take still covers the scene.
- **Give sung clips the vocal stem** when you have one, and action clips the full mix.
- **Take cut points from `transcript.json`** ([06](06-word-timing.md)): from just before the scene's first word to the gap before the next scene's first word. In the handwash song, words 0 to 8 run from 2.98 s to 8.70 s (word 9's start):

```bash
ffmpeg -i song.mp3 -ss 2.98 -to 8.70 scene-01.wav
```

## 3. Make the character sing (Seedance 2.5)

The prompt names the keyframe and the audio by their reference names and quotes the exact words. It starts:

```text
@Image1 is <NAME>. <NAME> sings the words of @Audio1 to the camera, the mouth on every word: "<EXACT WORDS IN THIS PIECE>".
```

Full templates: [`gen-05-animate.md`](../prompts/generate/gen-05-animate.md).

- **Frontal, locked camera, no head turns.** A head turn is where the mouth goes wrong.
- **Quote the words in timed beats, and end on an action** so the cut has something to land on.
- **The keyframe as `@Image1`, never the sheet.** Through Picsart's CLI, Seedance "treats `imageUrls` as **first frame** (verified)" ([Picsart persona skill](https://github.com/PicsArt/gen-ai-skills/blob/main/skills/gen-ai-persona-creation/SKILL.md), MIT).
- **Measure the lag.** Expect the model to sing the line again in its own timing, with the mouth on that. Transcribe each take's soundtrack, compare word ends with the master song and take the median lag, judged on long words. Shift the clip by it ([section 6](#6-put-the-clips-into-the-edit)).
- **Two identical retries, then change one thing:** a shorter window, a closer framing, a fixed keyframe.
- **Pilot two or three clips first.** Before each batch, state clips, seconds and cost in one sentence.
- **Budget** twice the on-screen seconds for sung shots, once for motion shots.
- **Trim every clip.** On fal, `duration` is 4 to 30 s or `auto`, independent of the audio. Measure each clip with ffprobe.
- **Drafts.** On fal, `draft: true` "Returns a draft_id for completing the draft at 1080p within seven days".

## 4. Make the character talk

The voice comes from step 3, one checked file per line ([03](03-song-or-voice.md#5-voice-scripts-coach-host-explainer)).

- **OmniHuman 1.5** on fal: audio up to 30 s at 1080p (the default), up to 60 s at 720p ([fal guide](https://fal.ai/learn/devs/omnihuman-15-user-guide)).
- **Kling AI Avatar v2**: length follows the audio.
- **Silent moves**: Kling v3 image-to-video, 3 to 15 s. `generate_audio` defaults to true on fal; turn it off. Aspect ratio follows the start image.

## 5. Models and list prices

Checked 2026-10-09. Prices change; check the page before each batch.

| Model | Price | Sources |
|---|---|---|
| Seedance 2.5 reference-to-video | Picsart (image-to-video rate): $0.1028/s at 480p, $0.231/s at 720p, $0.5686/s at 1080p. fal: about $0.22/s at 480p, $0.473/s at 720p. Higgsfield: 33 credits per 5 s with audio | [fal](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api), [Picsart](https://picsart.com/api-platform/models/seedance-2.5/pricing), [Higgsfield](https://higgsfield.ai/blog/best-affordable-ai-video-generators) |
| Kling v3 image-to-video | fal Pro: $0.112/s audio off, $0.168/s on. Picsart Standard: $0.084/s | [fal](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video), [Picsart](https://picsart.com/api-platform/models/kling-v3/pricing) |
| OmniHuman 1.5 | $0.16/s on fal and Picsart | [fal](https://fal.ai/models/fal-ai/bytedance/omnihuman/v1.5), [Picsart](https://picsart.com/api-platform/models/bytedance-omnihuman-v1.5/pricing) |
| Kling AI Avatar v2 | on the fal page | [fal](https://fal.ai/models/fal-ai/kling-video/ai-avatar/v2/standard) |

Seedance 2.5 takes up to 30 images, 10 videos and 10 audio files as references.

**Retired:** the Sora 2 API (removed 2026-09-24, [OpenAI](https://developers.openai.com/api/docs/deprecations)). `veo-3.1-*-generate-preview` shuts down on 2026-10-22; Google names `gemini-omni-1.1-flash` as the replacement ([Gemini](https://ai.google.dev/gemini-api/docs/deprecations?hl=en)).

## 6. Put the clips into the edit

1. **Trim each clip** to its scene and measure it with ffprobe.
2. **Assemble the footage layer:** join the clips (ffmpeg concat) in place of `assets/cat.mp4`, or use one `<video muted>` per scene with `data-start` at the line's start.
3. **Re-encode** with `-g 30 -keyint_min 30` at a width that is a multiple of 16: `scale=1088:-2` for a full 9:16 frame, which `object-fit: cover` scales to 1080. A 1080-wide clip gets a dark band at its right edge ([gotchas](gotchas.md)).
4. **Use your master song** as `<audio id="song">`. Keep the clips muted.
5. **Check lip sync** in snapshots at word times. Shift a clip that runs early or late with `data-media-start` on its `<video>` (offset into the source, in seconds).
6. **Move the layers.** A 9:16 clip fills the frame, so cards and text go to the top and bottom thirds the keyframes left calm.

## 7. Rights and watermarks

- Read the terms of each service before you publish or commit generated assets. Label any you commit: "generated with <service>, included for study".
- Higgsfield's help center says you own your generations and may use them commercially; on watermarked plans the mark is burned in ([help center](https://higgsfield.ai/creator-hub/help-center/account/who-owns-my-generations-and-can-i-use-them-commercially)). Picsart: [GenAI Additional Terms](https://picsart.com/genaitermsofuse).
- Upload only reference audio you have the right to use.
- Log every take, kept or rejected, with its price in `costs.csv`.

## Pitfalls

Seedance audio limits and lag, head turns, OmniHuman resolution, Kling's audio default, footage width: [gotchas.md](gotchas.md).
