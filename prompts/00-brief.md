# 00 Brief

**What it does:** fixes what the video says on screen, for either way in. With existing footage it checks the licenses of your footage and audio, writes `lyrics.txt` and writes `BRIEF.md`. With a generated character it reads the `BRIEF.md` and `lyrics.txt` that the generation prompts wrote, lists the terms and AI labels that apply, and adds an "On screen" section. Either way the result is the plan the edit is built from: the hook, the counters, the board words, the outro and the credit line.

**What you should see:** `examples/my-video/BRIEF.md` and `examples/my-video/lyrics.txt`, a rights table with a source link for every claim, and a list of open questions. Nothing is downloaded or generated, and no paid service is called.

## Before you paste

- **Existing footage** ([docs/05-or-use-existing-footage.md](../docs/05-or-use-existing-footage.md)): have a link or path for the footage and for the audio. They can be one file (a video with its own soundtrack, like the CDC clip in handwash-song or the film in wing-it). Know where the lyrics come from. Claude cannot listen to audio, so the words must come from you, from a published source, or from captions burned into the video. In the example, the CDC video's own burned-in captions gave the real lyric "Wash hands well each day", which the transcription later misheard.
- **Generated character** ([prompts/generate/](generate/)): run this after [`gen-00-idea.md`](generate/gen-00-idea.md) has written `BRIEF.md` and the first part of [`gen-03-song.md`](generate/gen-03-song.md) (or [`gen-06-talking.md`](generate/gen-06-talking.md)) has written `lyrics.txt` (or `script.txt`). The board and counters must match sung or spoken words, so the words come first.

## Prompt

```text
I want to make a 9:16 short (1080x1920, 30 fps, about 30 seconds) with the pipeline in this repo: a character on screen, a song or voice track, and a motion-graphics edit written as HTML + GSAP and rendered with HyperFrames. The worked example is examples/handwash-song. Read examples/handwash-song/README.md, examples/handwash-song/lyrics.txt and examples/handwash-song/build/index.template.htm first so you know which layers the edit has.

Path: <EXISTING FOOTAGE | GENERATED>
Project folder: examples/my-video

If EXISTING FOOTAGE, my material:
- Footage: <URL OR PATH, OR "find public-domain footage about TOPIC">
- Audio: <URL OR PATH, OR "the footage's own soundtrack">
- Lyrics source: <"I wrote them", A URL WITH THE LYRICS, "burned into the video", OR "none yet">
- What the video should prove or teach, in one sentence: <SENTENCE>
If GENERATED: BRIEF.md and lyrics.txt (or script.txt) already exist in the project folder. Read them and keep what is there.

Do these steps in order. Do not download or generate any media, and do not call any paid service.

1. Rights.
   EXISTING FOOTAGE: for each source give the license, who to credit and how, whether the raw file may be redistributed, and any rules about logos, endorsement or people shown.
   GENERATED: for each generation service used or planned, give the terms page for its outputs, whether outputs carry a watermark (Lyria: SynthID), and the AI label each target platform needs (docs/01-idea.md section 6). If the audience includes children, confirm that no scene shows a product.
   Link the page you read for each claim. If you cannot confirm something from the source page, write "unverified". Raw and generated media will not be committed to git either way.

2. lyrics.txt.
   EXISTING FOOTAGE: create examples/my-video/lyrics.txt with the words exactly as they are sung or spoken, one sung line per text line, in order, repeats written out in full. Keep the singer's wording even if it is ungrammatical. If my lyrics source is "none yet", write a placeholder file and add "transcribe first, then I correct it by ear" to the open questions.
   GENERATED: check that lyrics.txt is one sung line per text line, repeats written out in full, numbers spelled as sung. Do not edit it; list anything you doubt as an open question.

3. BRIEF.md. EXISTING FOOTAGE: create examples/my-video/BRIEF.md with the sections below. GENERATED: add a section "On screen" to the existing BRIEF.md with the same items.
   - Sources: links, licenses or terms, credit line text.
   - Format: 1080x1920, 30 fps, target duration, where the footage sits (the example uses a 1000 px wide card near the top; a 9:16 generated clip usually fills the frame, with the text in the calm top or bottom third).
   - Hook: a kicker line and a headline of at most 8 words that states the claim the video proves. The example uses "THE 20-SECOND RULE" and "Sing it twice. That's 20 seconds."
   - Counters: what the timer counts and which sung words start and stop it. In the example it runs from the first sung word to the last one.
   - Passes: if the song repeats, how many passes, and whether to show a giant round number before each.
   - Board: 3 to 5 key words from lyrics.txt that fly into slots on their first sung occurrence and get an "x2" badge when sung again. For each, give the word and its line in lyrics.txt.
   - Outro: the number the video ends on and how it will be computed from transcript.json or which source it comes from. No number on screen without a source.
   - Credit line: the exact text that will appear at the bottom of the video, including "generated with <service>" for generated media.
   - Open questions for me.

4. Stop. Show me the rights table, lyrics.txt and BRIEF.md (or the new section), and wait for my answers before doing anything else.
```

## Notes

- Public-domain video is easiest to share. Works made by U.S. federal employees as part of their jobs (CDC, NASA) are public domain, but agency logos are restricted, some agency material is made by contractors or licensed from third parties, and you may not imply endorsement. Wikimedia Commons hosts many of them, with the license stated on each file page. Stock sites like Pexels (https://www.pexels.com/license/) and Pixabay (https://pixabay.com/service/license-summary/) allow use in your video but restrict redistributing the raw files, so keep those files out of git.
- Aim for about 30 s. The three examples run 21.5 to 32.5 s and render at delivery quality in 64.6 s to 1 min 43.3 s on a 2014 i7-4790, so a render fits into an iteration loop.
- Four board slots fit across the 1000 px width at the example's sizes. Five need narrower slots or smaller type.
- Next: [`edit/01-assets.md`](edit/01-assets.md).
