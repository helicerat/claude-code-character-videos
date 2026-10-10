# gen-04: cut the song per scene

**What it does:** splits `song.mp3` into one audio piece per scene, cut in the gaps between words and sized for the video model.

**What you should see:** `assets/song/pieces/01.mp3 ...` and a table of start, end and length for each piece.

Step 4. Free: ffmpeg only, no model prompt. Needs the accepted take and its aligned `transcript.json`: the take check in [`gen-03-song.md`](gen-03-song.md) is enough to start, and [`edit/02-word-timing.md`](../edit/02-word-timing.md) makes the final one. Method: [docs/04-animate.md](../../docs/04-animate.md). Next: [`gen-05-animate.md`](gen-05-animate.md).

## Prompt

```text
The project folder is examples/my-video. BRIEF.md, lyrics.txt, script.txt, STORYBOARD.md,
PROMPTS.md, costs.csv and every assets/ path below are inside it; docs/ and scripts/ are at the
repo root. Run commands from the repo root.
Using the accepted transcript (word timings, text from lyrics.txt) and STORYBOARD.md,
cut assets/song/song.mp3 into one piece per scene with ffmpeg.
- Start and end every piece in a gap between words, never inside a word.
  Start about one beat before the scene's first word, so a late take still covers the scene.
- Aim for 4-5 s per sung piece. Each piece must be 1.8-30.2 s (the Seedance 2.5 audio
  reference limit), and pieces sent in one request must add up to 30.2 s or less.
- If a vocal-only stem exists (assets/song/vocals.wav), cut it at the same points too:
  sung clips get the vocal piece, dance or action clips get the full-mix piece.
- If the song was made with an ElevenLabs composition plan, start from the chunk boundaries,
  then move each cut to the nearest gap between words.
Write assets/song/pieces.json with {scene, file, vocal_file, start, end, duration, words}
and print it as a table. Flag any piece shorter than 4 s or longer than 6 s.
```

## Notes

- Seedance 2.5 reference-to-video takes audio references of 1.8-30.2 s each, 30.2 s combined, MP3 or WAV up to 15 MB ([fal schema](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api)). A 25-35 s song goes in piece by piece, one piece per scene.
- A cut inside a word gives the model half a syllable to sing. Short windows give it less to get wrong; 4-5 s is the default.
- A clean vocal is the clearest signal for the mouth; the full mix suits dance and action clips. ElevenLabs has a stem separation endpoint ([API](https://elevenlabs.io/docs/api-reference/music/separate-stems.md)).
- ElevenLabs enforces section durations on `music_v2` and `music_v2_5` ([API](https://elevenlabs.io/docs/api-reference/music/compose-detailed.md)), so chunk boundaries sit close to scene boundaries. Words can still spill over a chunk edge, hence the move to the nearest gap.
