# 06. Word timing

Step 5 of 7. Free on your machine, or about a tenth of a cent per 30 s song on Groq. Prompt: [`prompts/edit/02-word-timing.md`](../prompts/edit/02-word-timing.md). Output: `transcript.json`.

Every effect that follows the song needs to know when each word is sung: the karaoke highlight, the bubble above each word, the key words that fly into the board, the timer that runs while the song is sung. This step produces one file, `transcript.json`, with a start and end time for every word. It works the same whether the song was generated in step 3 or came with existing footage; for a generated song, the same aligner is also the take check in [03-song-or-voice.md](03-song-or-voice.md#6-qa-did-the-model-sing-or-say-every-word).

A video without words needs timings too, of a different kind: beats in the music, or moments in the picture. `examples/spin-count` uses both and has no `transcript.json`; `examples/wing-it` follows the story of a film scene, one event at a time. Those cases are at the end of this chapter: [Timings without words](#timings-without-words-beats-and-visual-marks) and [Story events](#story-events-stepping-through-frames).

## The rule: timings from the model, words from your lyrics

Speech recognition is good at *when* a word happens and unreliable at *which* word it is, especially in singing. You already know the words: you wrote the lyrics, or they are printed somewhere. So take the times from the transcription and the text from `lyrics.txt`.

## Options

| Tool | Cost | How you get word timestamps | Notes |
|---|---|---|---|
| Groq `whisper-large-v3` (used here) | $0.111 per hour of audio, 10 s minimum per request | `response_format=verbose_json` plus `timestamp_granularities[]=word` | 25 MB upload limit on the free tier, 100 MB on the dev tier ([Groq docs](https://console.groq.com/docs/speech-to-text)) |
| `npx hyperframes transcribe` | free, runs locally | built in; writes `[{text, start, end}]` | engines: Parakeet or whisper.cpp; see below |
| OpenAI `whisper-1` | paid | `timestamp_granularities[]`, supported by `whisper-1` only among OpenAI's transcription models ([OpenAI guide](https://developers.openai.com/api/docs/guides/speech-to-text)) | 25 MB limit |
| ElevenLabs Scribe v2 | $0.22 per hour | `words[]` with start and end ([API reference](https://elevenlabs.io/docs/api-reference/speech-to-text/convert)) | |
| WhisperX | free, local, Python | forced alignment with wav2vec2 ([GitHub](https://github.com/m-bain/whisperX)) | needs a Python ML setup |

### Groq (what the example used)

`scripts/transcribe-groq.mjs` sends the audio and saves the raw answer. The key comes from the `GROQ_API_KEY` environment variable and is never printed.

```bash
# bash / zsh (overwrites the shipped assets/whisper_verbose.json)
GROQ_API_KEY=... npm run transcribe
# PowerShell
$env:GROQ_API_KEY="..."; npm run transcribe
```

The request it makes, as curl:

```bash
curl https://api.groq.com/openai/v1/audio/transcriptions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -F file=@assets/song.mp3 \
  -F model=whisper-large-v3 \
  -F response_format=verbose_json \
  -F "timestamp_granularities[]=word" \
  -F language=en
```

Our 30.9-second song cost about a tenth of a cent. The answer is saved as `assets/whisper_verbose.json` and committed, so you can run the rest of the pipeline without a key.

Behind a proxy: Node's built-in `fetch` ignores `HTTPS_PROXY` unless you also set `NODE_USE_ENV_PROXY=1` (tested on Node 24.18.0; older Node 22 releases may not support it).

### `npx hyperframes transcribe` (free, local)

From `npx hyperframes@0.8.143 transcribe --help`:

- `-e, --engine`: `auto` (Parakeet if installed and it covers the language, else whisper), `parakeet`, or `whisper`
- `-m, --model`: whisper model, default `small.en`; options `tiny.en`, `base.en`, `small.en`, `medium.en`, `large-v3`
- `-l, --language`: language code
- `-d, --dir`: where `transcript.json` goes (see the notes below)
- `--to srt|vtt`: export a caption sidecar

The free local route for the example, from the repo root (untested here, see the Windows note below):

```bash
npx hyperframes@0.8.143 models install parakeet     # once
npx hyperframes@0.8.143 transcribe examples/handwash-song/assets/song.mp3 --engine parakeet --language en
# writes examples/handwash-song/assets/transcript.json
node scripts/align-lyrics.mjs examples/handwash-song --heard examples/handwash-song/assets/transcript.json
```

Pass `--heard`: without it, `align-lyrics.mjs` prefers `assets/whisper_verbose.json`, which is committed for this example, and would ignore the Parakeet output.

HyperFrames' own guidance for songs: start with `medium.en`, expect to fix lyrics by hand or use an external API, strip `♪` tokens, and treat a transcript with more than 20 percent `♪` as failed ([transcript-handling.md](https://github.com/heygen-com/hyperframes/blob/main/skills/media-use/audio/references/captions/transcript-handling.md)). The `.en` models translate non-English audio into English, so pass `--model` and `--language` explicitly.

On Windows: on our machine `npx hyperframes doctor` reports `whisper-cpp Not found` and points to a cmake build, which is why the route above uses Parakeet (the model is about 640 MB according to the [CLI reference](https://hyperframes.heygen.com/packages/cli)). We did not run either engine for this example; our timings came from Groq.

Two notes:

- **Where it writes.** `--help` says `--dir` defaults to the current directory. The 0.8.143 code uses the input file's folder instead, so `transcribe assets/song.mp3` writes `assets/transcript.json`. With `--dir`, it writes `<dir>/transcript.json`. Either way it then scans every `.html` file under that folder, recursively, and in each file replaces the first `const script = [ ... ];` inside a `<script>` block with the raw words, or the first `const TRANSCRIPT = [ ... ];` if there is no `script` array ([normalize.ts](https://github.com/heygen-com/hyperframes/blob/main/packages/cli/src/whisper/normalize.ts)). `--dir examples/handwash-song` would overwrite our corrected `transcript.json` and put the misheard words into `index.html`. The template survives: the scan skips `.htm` files, and `const TRANSCRIPT = /*TRANSCRIPT*/[];` would not match the pattern anyway. `npm run align` followed by `npm run build` repairs both files. Never pass `--dir` with an example folder.
- **Importing.** It also converts transcripts from other tools: OpenAI-style JSON with `words[]` (which is what Groq returns), whisper.cpp JSON, SRT and VTT all become the same `[{id, text, start, end}]` array.

## What Whisper heard

Our lyrics (`lyrics.txt`), sung twice:

```
Wash hands well each day,
to keep germs away.
Scrub with soap and water
and be on your way.
```

Groq's `whisper-large-v3` returned 39 words for 38 sung ones. The `text` field of `assets/whisper_verbose.json`:

```
Wash and sell each day to keep germs away. Scrub with soap and water and be on your way. Wash and sell each day to keep germs away. Scrub with soap and water and be on your way. you
```

| Time (s) | Sung | Heard |
|---|---|---|
| 3.14 to 3.84 | hands | and |
| 3.84 to 4.30 | well | sell |
| 14.70 to 15.18 | hands | and |
| 15.18 to 15.62 | well | sell |
| 30.16 to 30.22 | (nothing; the music has ended) | you |

Three things to notice:

1. **The same mistake both times.** "Wash hands well" became "Wash and sell" in both passes of the song. The error comes from how the model hears this recording, so the fix belongs in the text.
2. **The timings of the wrong words are right.** "and" starts at 3.14 s, exactly where "hands" starts. Only the text is wrong.
3. **A word out of nothing.** The last sung word ends at 24.48 s. The trailing "you" at 30.16 s sits on the silent end card. A stray word after the music stops is a known Whisper habit.

The same comparison catches the opposite case on a generated song. If a take skips a word, for example a lone shouted "Three!" in a counting song, the lyrics are right and the take is wrong; here the take is right and the transcription is wrong. Comparing the transcription against your lyrics word by word catches both cases.

## How `align-lyrics.mjs` works

```bash
npm run align
# same as
node scripts/align-lyrics.mjs examples/handwash-song
# report only, write nothing
node scripts/align-lyrics.mjs examples/handwash-song --dry-run
```

1. **Read both word lists.** Lyrics come from `lyrics.txt`, one sung line per line; blank lines, `#` comments and labels like `[Chorus]` are skipped. The heard words come from `assets/whisper_verbose.json`, or from `assets/transcript.json` (what `npx hyperframes transcribe assets/song.mp3` writes) when the first is missing; `--heard <file>` picks another file. The script accepts OpenAI/Groq `verbose_json` (`words[]`), the openai-whisper Python format (`segments[].words[]`) and a plain `[{text, start, end}]` array. Tokens with no letters or digits (`♪`, empty strings) are ignored.
2. **Compare in lower case, letters and digits only**, so "away." matches "away".
3. **Align the two lists with word-level edit distance** (dynamic programming, the same idea as `diff`). Every lyric word ends up as one of:
   - *match*: same word, keep its timing
   - *corrected*: a different heard word in the same slot; keep the timing, take the text from the lyrics, record what was heard in `heard`
   - *not heard*: no heard word for it; flag it `interpolated` and spread its time across the gap between its neighbours
   
   A heard word with no lyric word (the trailing "you") is dropped and listed. A substitution costs less than a drop plus an insertion, and similar-sounding words ("well"/"sell") cost less than unrelated ones, which settles ties.
4. **Check** that every word ends after it starts and that starts never go backwards.
5. **Print a report and write `transcript.json`.**

Our report:

```
  #    time  sung                       heard
  1    2.98  Wash hands well each day   Wash [and] [sell] each day
  2    5.34  to keep germs away         to keep germs away
  3    8.70  Scrub with soap and water  Scrub with soap and water
  4   11.14  and be on your way         and be on your way
  5   14.36  Wash hands well each day   Wash [and] [sell] each day
  6   16.56  to keep germs away         to keep germs away
  7   19.72  Scrub with soap and water  Scrub with soap and water
  8   21.98  and be on your way         and be on your way +you
  [x] heard x instead   (-) not heard   +x heard, not in lyrics

corrected (text from lyrics, time from the transcription):
    3.14  #1   hands        heard "and"
    3.84  #2   well         heard "sell"
   14.70  #20  hands        heard "and"
   15.18  #21  well         heard "sell"
not heard (time interpolated, listen to the take): none
dropped (heard, not in lyrics):
   30.16  "you" after the last sung word (24.48 s)

38 words: 34 matched, 4 corrected, 0 interpolated; 1 heard word(s) dropped
singing 2.98 s -> 24.48 s (21.50 s)
LINES (word index range of each lyric line): [[0, 4], [5, 8], [9, 13], [14, 18], [19, 23], [24, 27], [28, 32], [33, 37]]
```

The last line gives you the `LINES` array for the composition ([07-the-edit.md](07-the-edit.md)).

**Read the "not heard" list.** An interpolated word has a guessed time. If you made the song with a generator, a "not heard" word usually means the take skipped it: generate another take. If you are sure the word is sung, nudge its time by hand after listening.

## `transcript.json`

```json
[
 {
  "text": "Wash",
  "start": 2.98,
  "end": 3.14
 },
 {
  "text": "hands",
  "start": 3.14,
  "end": 3.84,
  "heard": "and"
 },
 ...
]
```

| Field | Meaning |
|---|---|
| `text` | the word from `lyrics.txt`, outer punctuation removed |
| `start`, `end` | seconds from the start of `song.mp3`, from the transcription |
| `heard` | present only when the transcription heard a different word |
| `interpolated` | present only when the word was not heard at all and its time was spread between its neighbours |

38 words, singing from 2.98 s to 24.48 s. Word order equals lyric order, so word index 19 is the first word of the second pass in every version of this file. The composition relies on that.

`npm run build` (`scripts/build.mjs`) copies only `text`, `start` and `end` into `index.html`; `heard` and `interpolated` stay in `transcript.json` as an audit trail.

## Quick checks before you build

```bash
# word index, text and start time, eight per row
node -e "const t=require('./examples/handwash-song/transcript.json'); t.forEach((w,i)=>process.stdout.write(i+':'+w.text+'@'+w.start+(i%8==7?'\n':'  ')))"
```

- The word count equals the lyric word count.
- The first word starts where you hear the singing start (2.98 s here), the last ends where it stops (24.48 s).
- Nothing is past the end of the audio (30.89 s here). `npm run probe` shows the audio length.

## Timings without words: beats and visual marks

`examples/spin-count` has music and no lyrics. Its effects follow two other clocks: the beat of the music, and ten moments in the picture. Neither needs a transcription service, and neither goes through `align-lyrics.mjs` or the `/*TRANSCRIPT*/[]` placeholder: the times are written into the template as constants, with their raw data committed next to it.

### Beats

```bash
npx hyperframes@0.8.143 beats examples/spin-count
# Analyzing assets/music_cut.mp3 in headless Chrome…
# ✓ Wrote 69 beats → beats/assets/music_cut.mp3.json (bpm 188, high)
```

It analyzes the composition's music track (here the only `<audio>`, which is also marked `data-timeline-role="music"`) in headless Chrome on your machine and writes `beats/<audio path>.json` in the project folder: `{"version": 1, "audio": "...", "beats": [{"time": 0.224, "strength": 0.65}, ...]}`. It took 4 s here, wrote a file identical to the one from the session that made the video, and left `index.html` and the template alone.

The example turned the beats into a grid of two constants, the first beat and the step:

```bash
node -e "const b=require('./examples/spin-count/beats/assets/music_cut.mp3.json').beats.map(x=>x.time); console.log(b.length, b[0], ((b.at(-1)-b[0])/(b.length-1)).toFixed(4))"
# 69 0.224 0.3191
```

The template says `BEAT0 = 0.22, BEAT = 0.3185`. The step is 0.0006 s short, so after 30 double steps its last title pulse lands 0.043 s before the beat, a little over one frame at 30 fps. A grid works for a track with a steady tempo like this one, whose 68 gaps between beats all measure 0.319 to 0.320 s; for music that drifts, inline the beat times themselves.

### Marks read from the picture

A mark is a frame where something you can see happens: his back turns to the camera, a foot lands, a ball reaches the top. Claude Code cannot watch video, but it reads images, so the job is to turn the clip into contact sheets it can read, then narrow down.

```bash
# from examples/spin-count, after npm run fetch:spin
mkdir -p assets/frames
# 1. overview: 4 frames per second of the source, 16 per sheet (4 s per sheet)
ffmpeg -i assets/source/313047_large.mp4 -vf "fps=4,scale=180:-2,tile=8x2" assets/frames/sheet_%02d.png
#    sheet k (from 1), tile n (from 0, left to right, then the second row) shows (k - 1) * 4 + n / 4 seconds
# 2. close-up around a candidate: every source frame (24 fps here) from 1.6 s
ffmpeg -ss 1.6 -t 0.6 -i assets/source/313047_large.mp4 -vf "scale=180:-2,tile=8x2" -frames:v 1 assets/frames/near_1.6.png
#    tile n shows 1.6 + n / 24 seconds
```

The 16.7 s clip gives five overview sheets in under 4 s. Keep the frames under `assets/`: `.gitignore` covers images there and nowhere else in an example folder.

The marks for the example were read this way, in the source clip, in the session that made the video, and then divided by 0.85 because `boy.mp4` plays the clip slower (`setpts=PTS/0.85`). Write them down in source time and convert in one place: if you change the slow-down, the marks follow. In the example the conversion is in the template, `SPINS = [...].map(t => +(t / 0.85).toFixed(2))`, and the record is `examples/spin-count/spins.json`.

**Check every mark with a frame grab before you build.** For this guide we extracted the frame at each of the ten marks: eight show his back, and marks 1 and 4 land on a profile frame, mid-turn. A second pass over the overview sheets, then close-ups at 12 frames per second, found two back views with no mark, at about 1.35 s and 13.3 s in the source, each separated from the next marked one by frames that show his face. By the rule the marks were meant to follow, the clip has 12 spins, not 10 (`spins.json`, `unmarked`). Do that pass before the numbers go on screen.

A request for Claude Code that does the whole job:

```
In examples/my-video, assets/source/clip.mp4 is the footage. I want a mark
every time <the event, for example: his back faces the camera>.
1. Make overview contact sheets with
   ffmpeg -i assets/source/clip.mp4 -vf "fps=4,scale=180:-2,tile=8x2" assets/frames/sheet_%02d.png
   Read every sheet and list each candidate with its time
   ((sheet - 1) * 4 + tile / 4 seconds) and what the tile shows.
2. For each candidate, make a close-up sheet of every source frame for
   0.6 s around it, and pick the frame where <the event> peaks.
3. Write spins.json with the source times, and show me a table: mark,
   time, what the frame shows, how sure you are. List anything that looks
   like the event but that you did not mark, and why.
4. Extract the frame at each final time into one sheet so I can check them.
Do not edit the template yet.
```

## Story events: stepping through frames

`examples/wing-it` has no words and no beat to follow. Its edit is a pre-flight checklist over 30 seconds of a short film, and every chip on the list ticks or crosses when the story reaches it: the seatbelts fail, the rocket lights, it goes through the roof, the parachute turns out to be an umbrella. Each of those moments is a story event: a frame where something happens that the edit reacts to. Finding them is the same job as finding spin marks, with two differences: each event happens once, and you have to decide whether the edit reacts to the cut or to the action inside the shot.

### 1. Overview: what happens, and about when

```bash
# from examples/wing-it, after npm run fetch:wing
mkdir -p assets/frames
# 4 frames per second of the cut footage, 16 per sheet (4 s per sheet): 8 sheets for 30 s, in under 2 s
ffmpeg -i assets/wing_v.mp4 -vf "fps=4,scale=135:-2,tile=8x2" assets/frames/sheet_%02d.png
#    sheet k (from 1), tile n (from 0) shows (k - 1) * 4 + n / 4 seconds
```

Read the sheets in order and write the story down as a list of beats, each with a rough time: "about 1.5: the cat is yanked out of his seat", "about 3.5: cut to the rocket in the barn". Work on the cut footage, not on the film: the edit runs on the cut's clock. Keep the film time next to it (here, cut time plus 82.0 s), so you can find the moment in the source again.

### 2. Close-up: the exact frame

For each beat, make a sheet of every frame around it. At 30 fps, 18 tiles cover 0.6 s:

```bash
# every frame from 21.4 s: tile n shows 21.4 + n / 30 seconds
ffmpeg -ss 21.4 -t 0.6 -i assets/wing_v.mp4 -vf "scale=135:-2,tile=6x3" -frames:v 1 assets/frames/near_21.4.png
```

On that sheet the umbrella is still open in tile 7 (21.63 s) and inside out in tile 8 (21.67 s). Pick the frame where the event peaks, then decide where the edit reacts:

- **On the cut**, when the new shot is the event: IGNITION lands at 3.5 s, the first frame of the rocket in the barn.
- **On the action**, when it happens inside a shot: the gadgets land within about 0.1 s of the frame where each one first shows.
- **A little after it**, when the viewer needs a moment to see it: PARACHUTE lands at 22.0 s, about 0.33 s after the flip.

ffmpeg's scene score finds the cuts for you ([05-or-use-existing-footage.md](05-or-use-existing-footage.md#a-blender-open-movie-the-wing-it-example)); the action inside a shot needs the close-up sheets.

### 3. Write `events.json`

[`examples/wing-it/events.json`](../examples/wing-it/events.json) is the record. Each event has its time in the cut (`t`), the same moment in the film (`film_s`), and what the frame shows:

```json
{ "n": 5, "item": "PARACHUTE", "t": 22.0, "film_s": 104.0, "result": "fail", "frame": "the umbrella is inside out; it flips between 21.6 and 21.8" }
```

It groups the events the edit counts or ticks (six `checklist` items, seven `gadgets`) and lists the other cues (`cues`: the countdown, shakes, cards, the outro) with the times the template uses. The template holds the same numbers in `ITEMS`, `GADGETS` and its cue calls; change both together. Unlike `transcript.json`, nothing generates the template's arrays from the file: `scripts/build.mjs` copies the wing-it template as it is.

### 4. Check every event with a frame grab

Extract the frame at each final time into one sheet and read it. For wing-it this pass checked all thirteen counted events and showed four that land off the action by design or by choice: IGNITION and AIRSPACE on the cut, 0.5 s and 0.37 s before the action in the shot; LIFTOFF about 0.4 s after the rocket leaves the frame; PARACHUTE 0.2 to 0.4 s after the flip. ALTITUDE (10.5 s) is a moment picked inside the climb, not an event. `events.json` records what each frame shows, so the next edit can move a mark knowingly.

A request for Claude Code that does the whole job:

```
In examples/my-video, assets/footage.mp4 is the cut. The edit is a <checklist,
plan, rule list> that the story <ticks off, breaks>. Items: <list>.
1. Make overview sheets with
   ffmpeg -i assets/footage.mp4 -vf "fps=4,scale=135:-2,tile=8x2" assets/frames/sheet_%02d.png
   Read every sheet and write the story as a list of beats with rough times
   ((sheet - 1) * 4 + tile / 4 seconds).
2. For each item, find the beat that decides it. Make a close-up sheet of every
   frame for 0.6 s around it and pick the frame. Say whether the event is a cut
   or an action inside a shot, and where the chip should react.
3. Write events.json: n, item, t (seconds in the cut), source time, result,
   and what the frame shows. Show me the table.
4. Extract the frame at each final time into one sheet so I can check them.
Do not edit the template yet.
```
