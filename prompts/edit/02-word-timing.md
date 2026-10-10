# 02 Word timing

**What it does:** gets a start and end time for every sung word and aligns those times to your `lyrics.txt`. The words on screen come from your lyrics; the transcription only supplies the clock.

**What you should see:** `examples/my-video/transcript.json` with exactly one entry per word in `lyrics.txt`, and a report of every word the model misheard, missed or invented. Then Claude stops.

**Before you paste:** [`01-assets.md`](01-assets.md) is done and `assets/song.mp3` is probed. Pick an engine:

| Engine | Setup | Notes |
|---|---|---|
| Groq `whisper-large-v3` (used by handwash-song) | `GROQ_API_KEY` in your environment | uploads the audio; $0.111 per audio hour, 10 s minimum ([Groq docs](https://console.groq.com/docs/speech-to-text)) |
| Parakeet, local through HyperFrames | `npx hyperframes@0.8.143 models install parakeet` once, about 640 MB ([CLI reference](https://hyperframes.heygen.com/packages/cli)) | free, offline |
| whisper.cpp, local through HyperFrames | on Windows HyperFrames builds it from source, which needs cmake and a C compiler ([manager.ts](https://github.com/heygen-com/hyperframes/blob/main/packages/cli/src/whisper/manager.ts)) | for sung vocals the HyperFrames docs suggest `--model medium.en` |

## Prompt

```text
Get word timings for examples/my-video/assets/song.mp3 and align them to examples/my-video/lyrics.txt. Text on screen will come from lyrics.txt; the transcription only supplies times. Do not touch any HTML in this step.

1. Transcribe with <GROQ | PARAKEET>. Ask me before uploading audio anywhere or installing a model.
   - Groq: node scripts/transcribe-groq.mjs examples/my-video/assets/song.mp3 examples/my-video/assets/whisper_verbose.json
     The key is read from GROQ_API_KEY. Never print it or write it to a file.
   - Parakeet: npx hyperframes@0.8.143 transcribe examples/my-video/assets/song.mp3 --engine parakeet --language en --dir examples/my-video/asr
     Always point --dir at that scratch folder. transcribe writes transcript.json into --dir and rewrites any "const TRANSCRIPT = [...]" it finds in HTML files there, which would overwrite the aligned file and the composition.
   Set HYPERFRAMES_NO_TELEMETRY=1 before any hyperframes command.

2. Align: read node scripts/align-lyrics.mjs --help, then run it for examples/my-video, pointing it at whichever transcription file step 1 produced. It writes examples/my-video/transcript.json as [{text, start, end, heard?, interpolated?}].

3. Report, as tables:
   - substitutions: lyric word, what the model heard, start, end
   - lyric words the model did not hear at all (their times are interpolated from neighbours): word, line number, interpolated start and end
   - words the model heard that are not in the lyrics and were dropped: word, time
   - totals: words in lyrics.txt, words in transcript.json, first start, last end, last end minus first start

4. Sanity checks, flag each failure:
   - starts strictly increasing, every end after its start
   - any word shorter than 0.05 s or longer than 1.5 s (held notes can be long; say which)
   - any gap longer than 1 s inside one lyric line
   - interpolated words next to each other (two or more in a row means a whole phrase was missed)

5. Diagnose. If a lyric word is missing from the audio itself, either the singer skipped it (a generated song needs a new take) or lyrics.txt is wrong. Tell me which you think it is and why, but do not edit lyrics.txt.

6. Stop. Do not start the composition.
```

## Notes

- Why align: a speech model gets sung words wrong but often keeps usable word boundaries. In handwash-song, Whisper heard "Wash and sell each day" for "Wash hands well each day" on both passes and added a "you" after the music stopped. The aligner kept its times for `hands` and `well` and took the text from `lyrics.txt`. Still listen to the result in preview during the review step.
- A generated song has the opposite problem: a take can skip a word, most often a lone shouted number. The take check in [`gen-03-song.md`](../generate/gen-03-song.md) already ran this aligner; this step makes the final `transcript.json` for the edit.
- Formats and the alignment algorithm: [docs/06-word-timing.md](../../docs/06-word-timing.md). For a video without words, use its sections on [beats and marks](../../docs/06-word-timing.md#timings-without-words-beats-and-visual-marks) or [story events](../../docs/06-word-timing.md#story-events-stepping-through-frames) in place of this prompt.
- Next: [`03-edit.md`](03-edit.md).
