# 04. Animate the character

Step 4 of 7, and most of the bill: list prices run from about $0.06 to $0.57 per second of video depending on the model, resolution and provider. Prompts: [`prompts/generate/gen-04-cut-song.md`](../prompts/generate/gen-04-cut-song.md) (free, ffmpeg only), [`gen-05-animate.md`](../prompts/generate/gen-05-animate.md) (singing), [`gen-06-talking.md`](../prompts/generate/gen-06-talking.md) (talking). Output: one clip per scene in `assets/scenes/`, then one footage layer for the edit.

**We did not run this step for the worked examples.** Their footage already existed ([05-or-use-existing-footage.md](05-or-use-existing-footage.md)). This chapter is our method, written from the model schemas and provider pages and checked against them on 2026-10-09. Prices and limits come from the provider pages linked in each row, and they change often.

The edit layer is the same whichever way the footage was made. Once you have a character clip and a song, everything in [06](06-word-timing.md), [07](07-the-edit.md) and [08](08-render-and-qa.md) applies unchanged.

## 1. Three routes

| The character... | Route | Models | How |
|---|---|---|---|
| sings | reference-to-video with an audio reference per scene | Seedance 2.5 | the song cut piece by piece, each piece given to the model as an audio reference: the mouth moves on the words, the body dances in the gaps |
| talks | a voice file per line, then lip-sync | OmniHuman 1.5, Kling AI Avatar v2 | a TTS voice (Eleven v3 or v4) per line, lip-synced to the keyframe |
| moves without speaking | image-to-video, audio off | Kling v3 | one clip per move, started from its keyframe |

Sort every shot into one of three kinds: `lips` (sung to camera), `motion` (action on the beat, nobody sings) and `insert` (objects, hands, reactions, silent, first frame = the keyframe). An `insert` is the cheapest to get right, because the clip starts on a picture you already approved.

## 2. Cut the song per scene (free)

Seedance 2.5 takes audio references of **1.8 to 30.2 s each, 30.2 s for all audio in one request together, at most 15 MB, MP3 or WAV** ([fal API schema](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api)). A 35 s song has to be cut into pieces.

- **Cut in the gaps between words**, never inside a word. Aim for 4 to 5 s per sung piece: a short window gives the model less to get wrong (our default, untested).
- **Start one beat early**, so a take that comes back late still covers the scene.
- **Vocal piece for singing.** If you have a vocal-only stem, give sung clips the vocal piece and action clips the full mix. A clean vocal is the clearest signal for the mouth.
- **Take cut points from `transcript.json`** ([06-word-timing.md](06-word-timing.md)). A scene runs from just before its first word's `start` to the gap before the next scene's first word. In our example's song the first rhyme pair is words 0 to 8, so it runs from 2.98 s to 8.70 s (word 9's start):

  ```bash
  ffmpeg -i song.mp3 -ss 2.98 -to 8.70 scene-01.wav
  ```

## 3. Make the character sing (Seedance 2.5)

The prompt names the character and the audio by their reference names, says that the character sings the audio on camera, and quotes the exact words of the piece. Ours starts: `@Image1 is <NAME>. <NAME> sings the words of @Audio1 to the camera, the mouth on every word: "<exact words in the piece>".` The reference names `@Image1` and `@Audio1` come from the model's schema ([fal](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api)). The full templates are in [`gen-05-animate.md`](../prompts/generate/gen-05-animate.md). None of this has been run by us.

Rules we follow:

- **Frontal, locked camera, no head turns.** A locked frontal close-up is the easiest shot for a lip-sync; a head turn is where the mouth goes wrong.
- **Timed beats with the words quoted, and an action after the last word**, so the cut has something to land on.
- **Expect the model to sing the line again in its own timing.** The clip comes with its own soundtrack, and the mouth follows that one. Transcribe each take's soundtrack, compare its word ends with the same words in the master song, and take the median lag; judge by long words, because very short words measure badly. For a 30 s video, shifting the clip by its lag in the edit may be enough (unverified).
- **Two identical retries, then change something**: a shorter window, a closer framing, no head turn, or a fixed keyframe. If two takes miss the same thing, a third identical one is wasted money.
- **The keyframe as `@Image1`, never the sheet.** Through Picsart's CLI, Seedance "treats `imageUrls` as **first frame** (verified)" ([Picsart persona skill](https://github.com/PicsArt/gen-ai-skills/blob/main/skills/gen-ai-persona-creation/SKILL.md), MIT).
- **Pilot first, then batches with a price.** Run two or three pilot clips before the main run, and state clips, seconds and cost in one sentence before asking for a go.
- **Budget.** Plan on about twice the on-screen seconds for sung shots and once for motion shots (our assumption).
- **Clip length does not follow the audio.** On fal, Seedance's `duration` is an integer from 4 to 30 or `auto`, set independently of the audio length. Measure every clip with ffprobe and trim it to its scene.
- **Drafts.** On fal, `draft: true` "Returns a draft_id for completing the draft at 1080p within seven days" ([fal schema](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api)).

## 4. Make the character talk

The voice comes from step 3 ([03-song-or-voice.md](03-song-or-voice.md#5-voice-scripts-coach-host-explainer)): one checked file per line. Then:

- **OmniHuman 1.5** on fal takes audio up to 30 s at 1080p (the default) and up to 60 s at 720p; longer returns an error ([fal model](https://fal.ai/models/fal-ai/bytedance/omnihuman/v1.5), [fal guide](https://fal.ai/learn/devs/omnihuman-15-user-guide)).
- **Kling AI Avatar v2**: length follows the audio ([fal](https://fal.ai/models/fal-ai/kling-video/ai-avatar/v2/standard)).
- **Moves without speech**: Kling v3 image-to-video, 3 to 15 s per clip. On fal `generate_audio` defaults to true, so turn it off for silent moves. Aspect ratio follows the start image ([fal endpoint](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video)).
- **Seedance as a lip-sync model** (untested): pass the voice line as a video reference on a black frame, with the keyframe as `@Image1`. Expect some takes to ignore the audio reference and budget retakes for it.

## 5. Models and list prices

| Step | Model | List price (checked 2026-10-09) | Limits that matter | Sources |
|---|---|---|---|---|
| Singing | Seedance 2.5 reference-to-video | Picsart: 480p $0.1028/s, 720p $0.231/s, 1080p $0.5686/s (Picsart's image-to-video rate; no separate reference-to-video price listed). fal: about $0.473/s at 720p, $0.22/s at 480p. Higgsfield: 33 credits per 5 s with audio | 4 to 30 s per clip. Up to 30 images, 10 videos and 10 audio files as references, named `@Image1`, `@Audio1` in the prompt. Audio 1.8 to 30.2 s each, 30.2 s combined, 15 MB, MP3 or WAV | [fal API schema](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api), [Picsart pricing](https://picsart.com/api-platform/models/seedance-2.5/pricing), [Higgsfield blog](https://higgsfield.ai/blog/best-affordable-ai-video-generators) |
| Movement | Kling v3 image-to-video | fal Pro: $0.112/s audio off, $0.168/s audio on. Picsart Standard: $0.084/s | 3 to 15 s. `generate_audio` defaults to true on fal | [fal endpoint](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video), [Picsart pricing](https://picsart.com/api-platform/models/kling-v3/pricing) |
| Lip-sync | OmniHuman 1.5 | $0.16/s (fal, Picsart) | audio up to 30 s at 1080p, up to 60 s at 720p | [fal model](https://fal.ai/models/fal-ai/bytedance/omnihuman/v1.5), [Picsart](https://picsart.com/api-platform/models/bytedance-omnihuman-v1.5/pricing) |
| Lip-sync | Kling AI Avatar v2 | fal Standard $0.0562/s, Pro $0.115/s (from a search summary; confirm on the page) | length follows the audio | [fal](https://fal.ai/models/fal-ai/kling-video/ai-avatar/v2/standard) |

**Do not build on these:** the Sora 2 API was removed on 2026-09-24 ([OpenAI deprecations](https://developers.openai.com/api/docs/deprecations)). The `veo-3.1-*-generate-preview` model IDs are scheduled to shut down on 2026-10-22; Google names `gemini-omni-1.1-flash` as the replacement ([Gemini deprecations](https://ai.google.dev/gemini-api/docs/deprecations?hl=en)).

## 6. Put the clips into the edit

1. **Trim each clip to its scene length** and measure it with ffprobe.
2. **Assemble the footage layer**: either join the clips into one file (ffmpeg concat) and use it in place of `assets/cat.mp4`, or put one `<video muted>` per scene with `data-start` set to the line's start time. Re-encode with a keyframe every 30 frames, at a width that is a multiple of 16: 1088 wide for a full 9:16 frame (`scale=1088:-2`), which `object-fit: cover` scales down to 1080. A 1080-wide clip gets a black band at its right edge from HyperFrames' frame extraction with our ffmpeg build ([05-or-use-existing-footage.md](05-or-use-existing-footage.md#the-preprocessing-flag-by-flag), [08-render-and-qa.md](08-render-and-qa.md#5-fix-the-right-edge)).
3. **Use your master song as `<audio id="song">`.** The generated clips stay muted, even if the model added its own soundtrack.
4. **Check lip sync** in snapshots at word times and in the preview. If one clip's mouth runs early or late, shift it with `data-media-start` on that `<video>` (its offset into the source, in seconds).
5. Run [06](06-word-timing.md), [07](07-the-edit.md) and [08](08-render-and-qa.md) as for the example. The example's card is 1000x617 for a landscape clip; a 9:16 generated clip usually fills the whole frame, so the layers move to the top and bottom thirds that the keyframes left calm.

## 7. Rights and watermarks

- **Higgsfield**: the help center says you own your generations and may use them commercially; on plans with a watermark, the mark is burned in at generation ([help center](https://higgsfield.ai/creator-hub/help-center/account/who-owns-my-generations-and-can-i-use-them-commercially)). We read the help article; the Terms of Service it cites were not reviewed.
- **Picsart**: the [GenAI Additional Terms](https://picsart.com/genaitermsofuse) (dated 2026-04-30) give you the outputs "to the extent allowable by law" and make no promise that outputs do not infringe (from a summary of the page; we did not read the full terms).
- **Everyone else** (Google, OpenAI, ElevenLabs, fal and the model makers behind it): not reviewed here. Read the terms of the service you actually use before you publish, and before you commit generated assets to a public repo. If you include them, label them, for example "generated with <service>, included for study".
- Audio you upload as a reference must be audio you have the right to use.
- Log every take, kept or rejected, with its price in `costs.csv`. Rejected takes are part of the real cost.

## 8. Not verified

- Whether shifting a take by its median lag is enough for a 30 s video, or whether each take needs time-warping between word ends.
- Whether Seedance 2.5 through the Picsart CLI still treats images as the first frame.
- Kling AI Avatar v2 prices (read from a search summary).
