# gen-03: the song and the lyrics check

What it does: writes lyrics where every line is one scene, generates a 25-35 s song on those exact words, and proves the model sang every word before anything is animated.
What you should see: `lyrics.txt` with a timing table, 2-3 takes in `assets/song/`, and a diff that says "0 missing" for the take you keep.

Status: written from docs, not run for this repo. Built from the method in [`docs/03-song-or-voice.md`](../../docs/03-song-or-voice.md); expect to tune it.

Pipeline step 3. Paid: $0.04 to $0.08 per take, 2 to 6 takes. Step 1 below (the lyrics) runs before [`gen-02-keyframes.md`](gen-02-keyframes.md). Next: [`gen-04-cut-song.md`](gen-04-cut-song.md).

## Prompt for Claude Code

```
The project folder is examples/my-video. BRIEF.md, lyrics.txt, script.txt, STORYBOARD.md,
PROMPTS.md, costs.csv and every assets/ path below are inside it; docs/ and scripts/ are at the
repo root. Run commands from the repo root.
Read BRIEF.md and docs/03-song-or-voice.md.
Before every paid call, state the model, the provider, the number of calls or seconds and the
list price, and wait for my OK. Log every paid call in costs.csv (date, step, model, provider,
units, list price in USD, kept or rejected), rejected takes included.

1. Write lyrics.txt for a <25-35> s song about <TOPIC>, one line per scene.
   - The first sung line is the hook and starts at 0:00. No instrumental intro.
   - One action or step per line. Short lines, simple words.
   - Count with words inside a line ("Number three, scrub, scrub"), never a lone one-word shout.
   - Echo or answer words go in (parentheses). They are optional in the QA diff.
   - Repeat the hook text exactly. End by counting back every number in order.
   - Spell every number as it will be sung, and use the same spelling everywhere later.
   - Every number, word or card the edit will show must be sung in its line.
   - No existing song lyrics, no artist names, no brand names.
   Mark sections [Hook] / [Verse] / [Outro]. Under the lyrics, add a table:
   line | scene id | target start and end in seconds at <BPM> BPM, 2 bars per line.
   Wait for my approval.

2. Generate 2 takes with <MODEL> through <CLI or MCP>, using the model prompt below.
   Default: lyria-3-clip-preview for a 30 s song (it always returns 30 s), lyria-3.5 if the song
   must be shorter or longer. Show the price first. Save as assets/song/take1.mp3, take2.mp3.

3. For each take, run the lyrics check:
   a. Transcribe it WITHOUT passing lyrics.txt as a prompt:
      npx hyperframes@0.8.143 transcribe <take> --model medium.en --dir examples/my-video/assets/song/asr/<take name>
      with HYPERFRAMES_NO_TELEMETRY=1 set. Always give --dir a scratch folder, never the project
      folder: transcribe writes transcript.json there and rewrites transcripts it finds in .html
      files under it. Or, after I approve the upload, node scripts/transcribe-groq.mjs <take>
      examples/my-video/assets/song/asr/<take name>.json. If more than 20% of the entries are music tokens or
      nonsense, the transcription failed: say so, do not guess.
   b. Diff against lyrics.txt with node scripts/align-lyrics.mjs examples/my-video --heard <that transcript>
      --dry-run. It compares lower case, letters and digits only, and lists missing, changed and
      extra words. Words in parentheses are optional: if they show up as not heard, list them
      separately. Report per line: missing words, extra words, order of the numbers.
   c. A take with any missing number or step word is rejected.
   d. Measure the real tempo and length (the model may ignore prompted values).
   If both takes fail, write the next prompt from zero (do not stack "less X, no Y" onto the
   old one), change one thing, and generate 2 more. Stop after 6 takes total and ask me.

4. Recommend one take. Copy it to assets/song/song.mp3 and keep the transcript next to it.
Do not cut or animate anything yet.
```

## Model prompt

**Lyria** (`lyria-3-clip-preview` or `lyria-3.5`). Musical direction first, then the lyrics under a `Lyrics:` header:

```
A cheerful sing-along song for young children, <LENGTH> seconds, <BPM> BPM in <KEY>.
<2-3 INSTRUMENTS, e.g. ukulele, hand claps, light glockenspiel>.
One warm, clear <female | male> lead vocal, every word easy to understand, slow enough to sing along.
The vocal starts immediately at 0:00, no instrumental intro.
A small group of backing voices sings only the words in parentheses, as echoes.

Lyrics:

[Hook]
<LINE 1> (<ECHO>)
[Verse]
<LINE 2> (<ECHO>)
...
[Outro]
<COUNT-BACK LINE>
```

**ElevenLabs Music** (`music_v2_5`, composition plan), when every scene must have an exact length. One chunk per scene, `duration_ms` = the scene window (3,000 ms minimum). Styles must be in English:

```json
{"chunks": [
  {"text": "[Hook]\n<LINE 1> (<ECHO>)", "duration_ms": 4400,
   "positive_styles": ["cheerful children's sing-along", "<BPM> BPM", "<KEY>", "<INSTRUMENT 1>", "<INSTRUMENT 2>",
                       "one warm clear <female> lead vocal", "vocals from the first beat", "great production quality"],
   "negative_styles": ["instrumental intro", "choir", "dark", "slow tempo"],
   "context_adherence": "high"},
  {"text": "[Verse]\n<LINE 2> (<ECHO>)", "duration_ms": 4400,
   "positive_styles": ["same groove and voice"], "negative_styles": ["choir"], "context_adherence": "high"}
]}
```

**Suno** (UI only; turn off "Variety" and "Personalize"). Style box: `cheerful children's sing-along, <BPM> BPM, <INSTRUMENTS>, one clear warm <female> lead vocal, simple melody, vocals start immediately at 0:00, no instrumental intro`. Exclude: `choir, crowd vocals, long intro`.

**Worked example** (our draft for the handwashing video, not generated yet). At 110 BPM and 2 bars per line, 7 lines run about 30.5 s:

```
[Hook]
Wash, wash, wash your hands (wash your hands)
[Verse]
Number one, get them wet (splash, splash)
Number two, soap and lather (rub, rub)
Number three, scrub for twenty (scrub, scrub)
Number four, rinse away (whoosh)
Number five, dry them off (pat, pat)
[Outro]
One, two, three, four, five
Clean hands, high five
```

## Why each piece is there

- **The check before anything else.** A generated counting song can skip a word, a lone shouted number most easily, and only a transcription shows it. Finding the skip after the lip-sync step means paying for the most expensive step twice.
- **Vocal at 0:00.** An instrumental intro spends the first seconds on nothing. TikTok: "Introduce your content proposition in the first 3 seconds" ([TikTok](https://ads.tiktok.com/help/article/creative-best-practices)).
- **`Lyrics:` header, parentheses for echoes, direction separate from lyrics.** Google: "Include your lyrics directly in the prompt beneath a `Lyrics:` header", "Use parentheses for backing vocals, echoes, or ad-libs", and "Separate lyrics from instructions" ([Lyria prompt guide](https://ai.google.dev/gemini-api/docs/lyria-prompt-guide), [music docs](https://ai.google.dev/gemini-api/docs/music-generation), CC BY 4.0).
- **Clip model for a 30 s short.** "The Lyria 3 Clip model always generates a **30-second** clip", and Google's best practice is "Iterate with Clip first" (music docs).
- **Composition plan for exact scene lengths.** "for `music_v2` and `music_v2_5` section durations are always enforced" ([ElevenLabs API](https://elevenlabs.io/docs/api-reference/music/compose-detailed.md)). "The first chunk is the most important", "Aim for at least 6-7 styles in early chunks", "Use negative styles liberally" ([composition plans](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans)). Whether 4.4 s chunks join without audible seams is unverified; test one song first.
- **Numbers spelled as sung, the same everywhere.** The aligner compares letters and digits, so "3" in the lyrics and "three" in the transcript do not match, and the video prompts quote the same words.
- **Measure tempo and length.** A prompted tempo or length is a request; the take decides.
- **Blind transcription.** A lyrics prompt pulls the transcriber toward the expected words and can hide a skip (our reasoning). The 20% rule and `medium.en` for music are from HyperFrames' mandatory transcript check ([transcript-handling.md](https://github.com/heygen-com/hyperframes/blob/main/skills/media-use/audio/references/captions/transcript-handling.md)).
- **Retries from zero, two at a time.** Stacking "less this, no that" onto the last prompt makes it vaguer; write the next prompt fresh, fire a small batch and listen before firing more. Expect misses: plan for 2 to 3 takes per usable song.
- **Suno toggles.** Turn "Variety" and "Personalize" off so Suno does not rewrite your prompt.
- **No artist names or existing lyrics.** Lyria blocks "prompts that request specific artist voices or the generation of copyrighted lyrics" (music docs).

Price guide (Oct 2026): `lyria-3-clip-preview` $0.04 per clip, `lyria-3.5` $0.08 per song ([Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)). Every Lyria file carries a SynthID watermark. The default prompt above is for a children's song: for a kids video made through the Gemini API, check the under-18 clause in the API terms first (section 7 of [`docs/03-song-or-voice.md`](../../docs/03-song-or-voice.md#7-rights-and-labels)). A song with AI music as the main focus needs YouTube's AI disclosure even in a fully animated video ([YouTube](https://support.google.com/youtube/answer/14328491)).

Sources: https://ai.google.dev/gemini-api/docs/lyria-prompt-guide , https://ai.google.dev/gemini-api/docs/music-generation , https://ai.google.dev/gemini-api/docs/pricing , https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans , https://elevenlabs.io/docs/api-reference/music/compose-detailed.md , https://github.com/heygen-com/hyperframes/blob/main/skills/media-use/audio/references/captions/transcript-handling.md , https://ads.tiktok.com/help/article/creative-best-practices
