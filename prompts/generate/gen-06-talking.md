# gen-06: a talking character instead of a singing one

**What it does:** for a coach, host or explainer, writes a short script, generates one voice file per line, checks every word, and lip-syncs the character to it. Moves without speech are animated separately.

**What you should see:** `script.txt`, one checked voice file per line, one talking clip per spoken line, one silent clip per move.

Steps 3 and 4 for a talking character. Paid: the voice ($0.08 per 1,000 characters on Eleven v3 or v4), the lip-sync (about $0.16 per second on OmniHuman 1.5) and the silent moves. Step 1 of the prompt (the script) runs before [`gen-02-keyframes.md`](gen-02-keyframes.md). Method: [docs/03-song-or-voice.md](../../docs/03-song-or-voice.md) and [docs/04-animate.md](../../docs/04-animate.md). Next: [`../00-brief.md`](../00-brief.md), then [`../edit/01-assets.md`](../edit/01-assets.md).

## Prompt

```text
The project folder is examples/my-video. BRIEF.md, lyrics.txt, script.txt, STORYBOARD.md,
PROMPTS.md, costs.csv and every assets/ path below are inside it; docs/ and scripts/ are at the
repo root. Run commands from the repo root.
Read BRIEF.md, STORYBOARD.md and docs/03-song-or-voice.md.
Before every paid call, state the model, the provider, the number of calls or seconds and the
list price, and wait for my OK. Log every paid call in costs.csv (date, step, model, provider,
units, unit_price_usd, total_usd, kept, note), rejected takes included.

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

**Voice lines** (Eleven v4 or v3; tags at the start, the text verbatim):

```text
[punchy, upbeat] Three moves. Thirty seconds. No gym.
[steady] Move one... squats. Push the floor away.
[steady] Move two... push-ups. Chest down... and PUSH.
[steady] Move three... plank. Squeeze everything. [exhales] Hold.
[warm, softer] Same time tomorrow.
```

That draft is 29 words, about 12 s of speech at 150 words per minute; the rest of the 30 s is moves and music.

**Gemini TTS instead:** put the line in `text` exactly as it should be spoken, start with an empty `style`, and add a short style such as `"warm and enthusiastic"` only if the plain voice is wrong.

## Notes

- The route: a TTS voice per line, a lip-sync model for the talking shots, an image-to-video model with audio off for the moves, and a music bed under all of it.
- Promise in 3 seconds. TikTok: "Introduce your content proposition in the first 3 seconds" ([TikTok](https://ads.tiktok.com/help/article/creative-best-practices)). Conversational speech runs about 150 words per minute ([Mental Floss](https://www.mentalfloss.com/language/how-many-words-per-minute-do-people-speak)), so 30 s holds about 70 words; 25-55 leaves room for silent moves. Cues about the effect on the world work better than cues about the body ([ACE Fitness](https://www.acefitness.org/education-and-resources/professional/expert-articles/7324/internal-vs-external-cueing-how-to-help-your-clients-move-more-efficiently-and-effectively/)).
- ElevenLabs: "Eleven v4 and Eleven v3 do not support SSML break tags." "**Ellipses (...)** add pauses and weight", and capitalization "increases emphasis" ([TTS best practices](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices)). `previous_text` and `next_text` "improve the speech's continuity when concatenating together multiple generations" ([API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps.md)).
- Gemini: "Test plain TTS first"; long "Audio Profile" paragraphs are "the most common cause of voice drift" ([speech docs](https://ai.google.dev/gemini-api/docs/speech-generation)).
- Check every line by blind transcription. Timestamp endpoints return the timing of the text you sent, so they cannot show a swallowed word. Write numbers as words yourself so the script, the diff and the edit cards stay identical.
- Limits (fal, 2026-10-09): [OmniHuman 1.5](https://fal.ai/models/fal-ai/bytedance/omnihuman/v1.5) takes audio up to 60 s at 720p and 30 s at 1080p (the default), about $0.16/s. [Kling v3 image-to-video](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video) makes 3-15 s per clip with `generate_audio` on by default: turn it off for silent moves.
