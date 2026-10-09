# gen-06: a talking character instead of a singing one

What it does: for a coach, host or explainer, writes a short script, generates one voice file per line, checks every word, and lip-syncs the character to it. Moves without speech are animated separately.
What you should see: `script.txt`, one checked voice file per line, one talking clip per spoken line, one silent clip per move.

Status: written from docs, not run for this repo. Built from the method in [`docs/03-song-or-voice.md`](../../docs/03-song-or-voice.md) and [`docs/04-animate.md`](../../docs/04-animate.md); expect to tune it.

Pipeline steps 3 and 4 for a coach, host or explainer. Paid: the voice ($0.08 per 1,000 characters on Eleven v3 or v4; v4 had a temporary promo price of $0.022 until 2026-10-12, checked 2026-10-09), the lip-sync (about $0.16 per second on OmniHuman 1.5) and the silent moves. Step 1 below (the script) runs before [`gen-02-keyframes.md`](gen-02-keyframes.md). Next: [`../00-brief.md`](../00-brief.md), then [`../edit/01-assets.md`](../edit/01-assets.md).

## Prompt for Claude Code

```
The project folder is examples/my-video. BRIEF.md, lyrics.txt, script.txt, STORYBOARD.md,
PROMPTS.md, costs.csv and every assets/ path below are inside it; docs/ and scripts/ are at the
repo root. Run commands from the repo root.
Read BRIEF.md, STORYBOARD.md and docs/03-song-or-voice.md.
Before every paid call, state the model, the provider, the number of calls or seconds and the
list price, and wait for my OK. Log every paid call in costs.csv (date, step, model, provider,
units, list price in USD, kept or rejected), rejected takes included.

1. Write script.txt: one line per scene, 25-55 words in total for about 30 s (fewer when more of
   the video is silent moves).
   - Line 1 states the promise in under 3 seconds ("Three moves. Thirty seconds. No gym.").
   - One short external cue per move, 6 words at most ("Push the floor away").
   - Numbers as words. At most one word in CAPS per line. An ellipsis before the move starts.
   - Audio tags only at the start of a line, e.g. [punchy, upbeat] [steady] [exhales].
   - Every number or word that appears on a card in the edit is spoken in its line.
   Wait for my approval.

2. Generate the voice with <TTS MODEL> through <CLI, MCP or API>, one file per line,
   with previous_text and next_text set to the neighbouring lines. Show the price first.
   Save to assets/voice/<scene>.mp3.

3. Check every file: transcribe it without passing the script (npx hyperframes@0.8.143
   transcribe with a scratch --dir, as in gen-03), diff against the line, and
   reject any file with a missing or changed word or number. Regenerate only that line.

4. Lip-sync assets/keyframes/<scene>.png to its line with <LIP-SYNC MODEL> for the talking scenes.
   For moves without speech, animate the keyframe with an image-to-video model and audio generation off.
   Show the price first and stop after the first talking clip for review.
```

## Model prompts

**Voice line** (Eleven v4 or v3; tags at the start, the text verbatim):

```
[punchy, upbeat] Three moves. Thirty seconds. No gym.
[steady] Move one... squats. Push the floor away.
[steady] Move two... push-ups. Chest down... and PUSH.
[steady] Move three... plank. Squeeze everything. [exhales] Hold.
[warm, softer] Same time tomorrow.
```

That draft is 27 words, about 11 s of speech at 150 words per minute; the rest of the 30 s is moves and music.

**Gemini TTS alternative**: put the line in `text` exactly as it should be spoken, start with an empty `style`, and add a short style such as `"warm and enthusiastic"` only if the plain voice is wrong.

**Seedance alternative for the lip-sync** (untested): pass the voice line as a video reference on a black frame, cut to the clip length, with the keyframe as `@Image1`. Ask the model to take the spoken words, voice and timing from the black video and the character and composition from the image, with no extra dialogue or music. Expect some takes to ignore the audio reference, and budget retakes for it.

## Why each piece is there

- **The route**: a TTS voice per line, a lip-sync model for the talking shots, an image-to-video model with audio off for the moves, and a music bed under all of it.
- **Promise in 3 seconds.** TikTok: "Introduce your content proposition in the first 3 seconds" ([TikTok](https://ads.tiktok.com/help/article/creative-best-practices)).
- **Word budget.** About 150 words per minute for conversational speech (secondary: [Mental Floss](https://www.mentalfloss.com/language/how-many-words-per-minute-do-people-speak)), so 30 s holds about 70 words; 25-55 words leaves room for silent moves, fewer the more moves there are (our arithmetic).
- **External cues.** Short cues about the effect on the world ("push through the floor"); cues about the body work less well ([ACE Fitness](https://www.acefitness.org/education-and-resources/professional/expert-articles/7324/internal-vs-external-cueing-how-to-help-your-clients-move-more-efficiently-and-effectively/)).
- **Tags, ellipses, capitals, no SSML.** "Eleven v4 and Eleven v3 do not support SSML break tags." "**Ellipses (...)** add pauses and weight", and capitalization "increases emphasis". v4 is "a net upgrade over Eleven v3" ([ElevenLabs TTS best practices](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices)).
- **previous_text and next_text.** They "improve the speech's continuity when concatenating together multiple generations" ([ElevenLabs API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps.md)).
- **Numbers as words.** `apply_text_normalization` can spell numbers for you (API page above), but writing them as words yourself keeps the script, the transcript diff and the edit cards identical.
- **Empty style first on Gemini.** "Test plain TTS first", and long "Audio Profile" paragraphs are "the most common cause of voice drift" ([Gemini speech docs](https://ai.google.dev/gemini-api/docs/speech-generation)).
- **A check per line.** Timestamp endpoints return the timing of the text you sent, so they cannot show that a word was swallowed (our inference). A blind transcription can.

Limits (fal, Oct 2026): OmniHuman 1.5 takes audio up to 60 s at 720p and 30 s at 1080p (the default is 1080p), about $0.16/s. Kling v3 image-to-video makes 3-15 s per clip, and its `generate_audio` is on by default, so turn it off for silent moves.

Sources: https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices , https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps.md , https://ai.google.dev/gemini-api/docs/speech-generation , https://fal.ai/models/fal-ai/bytedance/omnihuman/v1.5 , https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video
