# 03. The song or the voice

Step 3 of 7. Costs $0.04 to $0.08 per song take on Lyria, or $0.08 per 1,000 characters of voice on Eleven v3 or v4. Prompts: [`gen-03-song.md`](../prompts/generate/gen-03-song.md) (song), [`gen-06-talking.md`](../prompts/generate/gen-06-talking.md) (voice). Output: `lyrics.txt` or `script.txt`, and the accepted take in `assets/song/song.mp3`.

The worked examples skip this step: their sound comes with the footage ([05](05-or-use-existing-footage.md)).

The audio is the clock of the video: scenes, mouth and edit all follow its words. Write the lyrics before the keyframes (part 1 of [`gen-03-song.md`](../prompts/generate/gen-03-song.md) runs before [`gen-02-keyframes.md`](../prompts/generate/gen-02-keyframes.md)), and generate the takes any time before step 4.

## 1. Song or voice

| | Song | Voice |
|---|---|---|
| Fits | counting, steps, a routine, a family or kids format | coach, host, explainer |
| Shots | one sung line per scene, movement in the gaps | some shots to camera, the rest silent action |
| Route | your lyrics, one Lyria prompt, 25 to 35 s | a TTS voice (Eleven v3 or v4), lip-sync (OmniHuman 1.5), a Lyria music bed |

Either way, transcribe every take and diff it with your text before you animate ([section 6](#6-qa-did-the-model-sing-or-say-every-word)). A generated counting song can drop a lone shouted "Three!" without a trace in the file.

## 2. Write the song

Shapes that fit: a list that grows by one item per verse, one object and one action per verse (The Wheels on the Bus), a daily routine step by step, question and answer (Baa Baa Black Sheep). Keep it slow enough to follow with gestures.

| # | Rule | Why |
|---|---|---|
| 1 | **The vocal starts at 0:00.** The first sung line is the hook | an intro loses the viewer before the first word |
| 2 | **One line = one action = one scene** | the lyrics are the storyboard |
| 3 | **Count inside a line** ("Number three, scrub, scrub"), never as one shouted word | a lone shout is the easiest word for a generator to skip |
| 4 | **Count back in the outro**, one to five over the filled board | closes the loop ([01](01-idea.md)) |
| 5 | **Repeat the hook text exactly** | Lyria: "request short repeating vocal hooks" |
| 6 | **Echo words in parentheses**, optional in the QA diff | Lyria: "Use parentheses for backing vocals, echoes, or ad-libs" |
| 7 | **Short lines, simple words, 100 to 120 BPM**, 2 to 3.5 sung syllables per second | clear singing a child can follow |
| 8 | **Spell numbers as they are sung**, in the lyrics, the aligner and the video prompts | the aligner compares letters and digits: "3" is not "three" |
| 9 | **Every edit event needs a sung word** | the edit reads word timings; an unsung number drives nothing |
| 10 | **No artist names, no existing lyrics** | Lyria blocks both; ElevenLabs returns an error ([cookbook](https://elevenlabs.io/docs/eleven-api/guides/cookbooks/music)) |
| 11 | **Prompt in the language of the lyrics** (ElevenLabs: styles in English, lyrics in any language) | Lyria: "Prompt in the language you want the lyrics in." |

Lyria sources (CC BY 4.0): [prompt guide](https://ai.google.dev/gemini-api/docs/lyria-prompt-guide), [music docs](https://ai.google.dev/gemini-api/docs/music-generation).

**Timing.** At 110 BPM in 4/4, one bar is 4 x 60 / 110 = 2.18 s. Two bars per line is 4.4 s, so 7 lines run about 30.5 s, and every line clears Seedance 2.5's 4-second minimum clip ([fal schema](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api)). Tempo and length in a prompt are requests: measure both on every take.

[`gen-03-song.md`](../prompts/generate/gen-03-song.md) has a draft handwashing song written to all eleven rules.

## 3. Generate the song

| Model | Use it for | Price (2026-10-09) | Notes |
|---|---|---|---|
| `lyria-3-clip-preview` | a 30 s short | [$0.04](https://ai.google.dev/gemini-api/docs/pricing) | "always generates a 30-second clip" |
| `lyria-3.5` | longer songs, more control | [$0.08](https://ai.google.dev/gemini-api/docs/pricing) per song | length "controllable using prompt"; replaces `lyria-3-pro-preview` ([deprecations](https://ai.google.dev/gemini-api/docs/deprecations)) |
| ElevenLabs Music `music_v2_5` | exact scene lengths | ElevenLabs plan | one [composition plan](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans) chunk per scene, 3 to 120 s, where "section durations are always enforced"; word timestamps; regenerate one section |
| [Suno v6](https://suno.com/blog/introducing-v6) | vocals, fixing one lyric | subscription, web app | can "Update a single lyric without rebuilding the entire song" |
| [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5) | keeping a given melody | free, local, MIT | cover generation and "Copy Melody" |

Lyria writes 44.1 kHz stereo MP3 with a SynthID watermark on every file. Probe every take anyway ([08](08-render-and-qa.md#6-probe-the-output)).

**Lyria prompts**, from Google's [prompt guide](https://ai.google.dev/gemini-api/docs/lyria-prompt-guide) (CC BY 4.0):

- "Include your lyrics directly in the prompt beneath a `Lyrics:` header. Tag each section to guide vocal delivery".
- "**Be specific.** Vague prompts produce generic results. Mention instruments, BPM, key, mood, and structure for the best output."
- Timing markers work: "The chorus kicks in at 22 seconds".

```text
An upbeat, feel-good indie-pop song in G major at 122 BPM. Bright acoustic guitar strumming, driving kick drum, handclaps, and warm female vocal harmonies. The lyrics describe an unforgettable summer road trip with friends.
```

**ElevenLabs Music prompts**, from [best practices](https://elevenlabs.io/docs/overview/capabilities/music/best-practices):

- Cover "genre, mood, instrumentation, tempo, and production era", plus cues like "130 BPM", "in A minor", "lyrics begin at 15 seconds". Anything left open gets the most average choice.
- "The first chunk is the most important": give it 6 to 7 styles. "Use negative styles liberally to prevent unwanted sounds."
- Vocal style goes in `positive_styles`, not in the lyrics.

## 4. Takes and retries

- Budget 2 to 3 takes per usable song. Lyria: "Results may vary between calls, even with the same prompt."
- Write every retry from zero. Stacking "less this, no that" makes the prompt vaguer.
- Use few adjectives: one can move the whole song, the voice included.
- Keep the lyrics block fixed and A/B only the style block.
- On Suno, turn off "Variety" and "Personalize" so it does not rewrite your prompt.

## 5. Voice scripts (coach, host, explainer)

- **Promise in the first 3 seconds:** "Three moves. Thirty seconds. No gym." ([TikTok creative best practices](https://ads.tiktok.com/help/article/creative-best-practices))
- **Word budget.** Speech runs about 150 words per minute, so 30 s holds about 70 words. With silent move clips in between, aim for 25 to 55.
- **One short external cue per move** ("push the floor away"), never an anatomy lecture ([ACE Fitness](https://www.acefitness.org/education-and-resources/professional/expert-articles/7324/internal-vs-external-cueing-how-to-help-your-clients-move-more-efficiently-and-effectively/)).
- **On-screen text** shows the word the voice says, at most 5 to 10 words per second (TikTok, same page).
- **Write for the voice:** numbers as words, capitals on the one stressed word, an ellipsis before the move, audio tags like `[exhales]` or `[excited]`. No SSML: "Eleven v4 and Eleven v3 do not support SSML break tags" ([ElevenLabs](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices)).
- **One file per line**, with `previous_text` and `next_text` set for continuity ([API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps.md)).
- **Gemini TTS:** test with an empty style first. Long "Audio Profile" paragraphs are "the most common cause of voice drift" ([speech docs](https://ai.google.dev/gemini-api/docs/speech-generation)).

| Voice model | Price (2026-10-09) | Notes |
|---|---|---|
| Eleven v4 (`eleven_v4`) | [$0.08](https://elevenlabs.io/pricing/api) per 1,000 characters | launched 2026-09-28 |
| Eleven v3 (`eleven_v3`) | [$0.08](https://elevenlabs.io/pricing/api) per 1,000 characters | 5,000 characters per request; listed as [previous generation](https://elevenlabs.io/docs/overview/models) |
| Kokoro-82M via `npx hyperframes@0.8.143 tts` | free, local | needs a Python package ([CLI reference](https://hyperframes.heygen.com/packages/cli)) |

## 6. QA: did the model sing (or say) every word?

A wrong take costs cents. A skip found after lip-sync costs the most expensive step twice.

1. **Blind pass.** Transcribe without your lyrics: a lyrics prompt pulls the model toward the expected words and hides the skip. Use `npx hyperframes@0.8.143 transcribe song.mp3 --model medium.en` (read where it writes in [06](06-word-timing.md) first) or Groq `whisper-large-v3` through `scripts/transcribe-groq.mjs`, as the handwash example does.
   - HyperFrames: "**If more than 20% of entries are `♪`/`�` tokens, or the transcript contains obvious nonsense words, the transcription failed.**" ([transcript-handling.md](https://github.com/heygen-com/hyperframes/blob/main/skills/media-use/audio/references/captions/transcript-handling.md))
2. **Diff.** The aligner compares lower case, letters and digits only, and lists every lyric word not heard, every word heard differently and every extra word. **Reject the take on any missing number or step word.** Missed echo words in parentheses land in the list too; judge those by ear.

   ```bash
   node scripts/align-lyrics.mjs <project> --heard <transcript> --dry-run
   ```

3. **Timing pass**, on the accepted take only: words from your lyrics, times from the transcript ([06](06-word-timing.md)).
4. **For a voice**, run the same blind diff per line file. Timestamp endpoints report the timing of the text you sent, so they cannot prove a word was said.

The lyrics text Lyria returns can differ from what was sung, and [ElevenLabs forced alignment](https://elevenlabs.io/docs/api-reference/forced-alignment/create.md) times the text you give it. Use them as filters, never as the check.

A clean vocal helps QA and lip-sync: prompt ElevenLabs with "a cappella", or split stems with its [separation endpoint](https://elevenlabs.io/docs/api-reference/music/separate-stems.md).

## 7. Rights and labels

**Tunes.** A song and a recording of it are separate copyrights. US works published in 1930 or earlier are public domain ([Duke CSPD](https://web.law.duke.edu/cspd/publicdomainday/2026/)).

| Tune | Status |
|---|---|
| Happy Birthday | public domain in the US since the 2016 settlement, in the EU since 2017 ([Wikipedia](https://en.wikipedia.org/wiki/Happy_Birthday_to_You)) |
| Twinkle Twinkle Little Star | public domain (melody 1761, words 1806); same tune as the ABC Song ([Wikipedia](https://en.wikipedia.org/wiki/Twinkle,_Twinkle,_Little_Star)) |
| Here We Go Round the Mulberry Bush | traditional; The Wheels on the Bus is sung to this tune ([Wikipedia](https://en.wikipedia.org/wiki/The_Wheels_on_the_Bus)) |
| The Wheels on the Bus | unclear: first published 1937; check the renewal first |
| If You're Happy and You Know It | avoid: a 1971 copyright filing exists ([Wikipedia](https://en.wikipedia.org/wiki/If_You%27re_Happy_and_You_Know_It)) |
| Baby Shark | the campfire chant is traditional; the commercial arrangement is its own work ([AP via NBC](https://www.nbcnewyork.com/news/national-international/baby-shark-plagiarism-case-south-korea-copyright-claim/6367581/)) |

**Melodies.** Lyria takes text and images, not a melody, and ElevenLabs Audio Reference matches "feel, groove, and palette without copying the notes". [Suno Covers](https://suno.com/blog/covers) and ACE-Step 1.5 can keep a melody. An original melody is simplest.

**Who owns the output.**

- Gemini API: "Google won't claim ownership over that content"; similar content may be generated for others ([terms](https://ai.google.dev/gemini-api/terms)).
- ElevenLabs Music: "cleared for broad commercial use" on paid plans, not exclusive ([music terms](https://elevenlabs.io/music-terms)).
- Suno: free-tier songs are non-commercial; Pro or Premier subscribers own songs made while subscribed ([Suno help](https://help.suno.com/en/articles/2416769)).
- US Copyright Office: "prompts alone do not provide sufficient human control", while "Human-authored expressive inputs that are perceptible in the output may be protected" ([report](https://blogs.loc.gov/copyright/2025/02/inside-the-copyright-offices-report-copyright-and-artificial-intelligence-part-2-copyrightability/)). Your own lyrics are the part most likely to stay yours.

**Labels.**

- YouTube requires AI disclosure when AI "Creates music that's the main focus of the video", even when the picture is fully animated ([YouTube](https://support.google.com/youtube/answer/14328491)).
- A children's song makes a video likely Made for Kids: YouTube lists "songs, stories" among the signs ([YouTube](https://support.google.com/youtube/answer/9528076)).
- The Gemini API terms bar use in a product "directed towards or is likely to be accessed by individuals under the age of 18" ([terms](https://ai.google.dev/gemini-api/terms)). Read that clause before you publish kids content made with Lyria.

Check every service's current terms before release.

## Pitfalls

Skipped words, tempo as a request, numbers spelled as sung, `.en` models translating, whisper.cpp on Windows: [gotchas.md](gotchas.md).
