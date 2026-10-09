# 02 Word timing

**What it does:** gets a start and end time for every sung word, then aligns those times to the words in your `lyrics.txt`. The words on screen come from your lyrics; the transcription only supplies the clock.

**What you should see:** `examples/my-video/transcript.json` with exactly as many entries as there are words in `lyrics.txt`, and a report listing every word the model heard differently, every lyric word it missed, and every extra word it invented. Then Claude stops.

## Before you paste

- [`01-assets.md`](01-assets.md) is done: `assets/song.mp3` exists and has been probed. For a generated song, the take check in [`gen-03-song.md`](../generate/gen-03-song.md) already ran the same aligner on the accepted take; this step produces the final `transcript.json` for the edit.
- Pick an engine:
  - **Groq `whisper-large-v3`** (what the example used). Needs `GROQ_API_KEY` in your environment and uploads the audio to Groq. Groq lists it at $0.111 per audio hour with a 10 s minimum ([Groq speech-to-text docs](https://console.groq.com/docs/speech-to-text)).
  - **Local, through HyperFrames.** `npx hyperframes@0.8.143 transcribe --engine parakeet` after a one-time `npx hyperframes@0.8.143 models install parakeet` (about 640 MB per the [CLI reference](https://hyperframes.heygen.com/packages/cli)). The other local engine, whisper.cpp, was not installed on our Windows machine, and on Windows HyperFrames builds it from source, which needs cmake and a C compiler ([manager.ts](https://github.com/heygen-com/hyperframes/blob/main/packages/cli/src/whisper/manager.ts)). For sung vocals the HyperFrames docs suggest `--model medium.en` with that engine.
- Expect mistakes. Sung words are hard for speech models. In the example, Whisper heard "Wash and sell each day" for "Wash hands well each day" on both passes, and added a "you" at 30.16 s, after the music had stopped.

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

- Why align instead of trusting the transcript: the model's text is wrong in places while its word boundaries are often still usable. In the example the alignment kept Whisper's times for the two misheard words (`hands` 3.14 to 3.84 s, `well` 3.84 to 4.30 s) and replaced only the text. The result, 38 words from 2.98 s to 24.48 s, is `examples/handwash-song/transcript.json`. Still listen to them in preview during the review step.
- A generated song has the opposite problem: a take can skip a word, for example a lone shouted "Three!" in a counting song. Diffing every take against your lyrics is cheap and catches this before you build anything on top of it.
- More detail on formats and the alignment algorithm: [`docs/06-word-timing.md`](../../docs/06-word-timing.md).
- Next: [`03-edit.md`](03-edit.md).
