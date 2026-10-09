# 03. The song or the voice: write it, generate it, check it

Step 3 of 7. Costs money: a Lyria song lists at $0.04 (30 s clip) or $0.08 per take, a voice at $0.08 per 1,000 characters on Eleven v3 or v4. Prompts: [`prompts/generate/gen-03-song.md`](../prompts/generate/gen-03-song.md) for a song, [`gen-06-talking.md`](../prompts/generate/gen-06-talking.md) for a voice. Output: `lyrics.txt` (or `script.txt`) and the accepted take in `assets/song/song.mp3`.

**We did not run this step for the worked examples.** Their sound comes with the footage ([05-or-use-existing-footage.md](05-or-use-existing-footage.md)). This chapter is our method, written from the providers' docs and checked against them on 2026-10-09. Google's docs are CC BY 4.0, so their prompts are quoted word for word. Everything else is quoted briefly with a link.

The audio is the clock of the whole video. Scenes are cut to its lines, the character's mouth follows it, and every number, word highlight and card in the edit is timed to its words. Write it before you draw a single scene: the keyframes in step 2 need one row per line, so the first part of [`gen-03-song.md`](../prompts/generate/gen-03-song.md) (writing `lyrics.txt`) runs before [`gen-02-keyframes.md`](../prompts/generate/gen-02-keyframes.md). Generate the takes any time before step 4.

## 1. Song or voice

| | Song | Voice |
|---|---|---|
| Fits | counting, steps, a routine, a family or kids format | coach, host, explainer, anything with instructions |
| The character | sings: one scene per line, mouth on the words, movement in the gaps | talks to camera in some shots; the rest are silent action clips |
| A route | your own lyrics, one prompt to Lyria, 25 to 35 seconds | a TTS voice (Eleven v3 or v4), a lip-sync model (OmniHuman 1.5), a Lyria music bed |

The step that matters most is the check after generation. A generated counting song can skip a word, for example a lone shouted "Three!", and nothing about the file tells you. Transcribe every take and compare it with the lyrics before anything is animated (section 6).

## 2. How songs that get watched are built

- **9 of the 30 most-viewed YouTube videos are children's songs**, Baby Shark Dance first at 17.28B ([Wikipedia](https://en.wikipedia.org/wiki/List_of_most-viewed_YouTube_videos), as of 2026-08-30).
- Their shapes (our reading of well-known songs):
  - a list that grows by one item per verse (Baby Shark);
  - one object and one action per verse on a fixed frame (Wheels on the Bus, sung to the traditional tune of "Here We Go Round the Mulberry Bush", [Wikipedia](https://en.wikipedia.org/wiki/The_Wheels_on_the_Bus));
  - a daily routine, step by step (Bath Song);
  - question and answer (Johny Johny Yes Papa, Baa Baa Black Sheep).
- Songs for young children are slow and easy to follow with gestures and movement. Fast, complex songs lose them.
- The learning evidence is weak. A 2024 review of 60 studies on songs in language classrooms found it is "not possible to draw firm causal inferences" (secondary: [Oxford Education Deanery](https://www.education.ox.ac.uk/oxford-education-deanery/digest/can-children-in-classrooms-learn-new-languages-through-songs-a-look-at-what-research-on-this-topic-can-tell-us/)). Justify the format by what people watch. Do not lean on "educational" claims.

## 3. Writing rules for a 25 to 35 second song

| # | Rule | Source |
|---|---|---|
| 1 | **The vocal starts at 0:00.** No instrumental intro. The first sung line is the hook | a slow build loses the viewer before the first word; TikTok: "Introduce your content proposition in the first 3 seconds" ([TikTok](https://ads.tiktok.com/help/article/creative-best-practices)) |
| 2 | **One line = one action or step = one scene.** The storyboard and the lyrics are the same list | one scene per line, all in one world, keeps the character and the place stable |
| 3 | **Count with words inside a line** ("Number three, scrub, scrub"), never as one shouted word on its own | our inference: a lone one-word shout is the easiest word for a generator to skip |
| 4 | **Count back in the outro**, one to five over the filled board | the count-back closes the loop ([01-idea.md](01-idea.md), section 1.4) |
| 5 | **Repeat the hook text exactly** | Lyria guide: "request short repeating vocal hooks" ([Google](https://ai.google.dev/gemini-api/docs/lyria-prompt-guide)) |
| 6 | **Echo and answer words go in parentheses**, and the QA diff treats them as optional | Lyria: "Use parentheses for backing vocals, echoes, or ad-libs, like `(moving on)`" ([Google](https://ai.google.dev/gemini-api/docs/lyria-prompt-guide)); ElevenLabs: phonetic sounds in parentheses, `(ooh)` ([ElevenLabs](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans)) |
| 7 | **Short lines, simple words, 100 to 120 BPM**, about 2 to 3.5 sung syllables per second | Baby Shark sheet music is about 112 BPM ([Musicnotes](https://www.musicnotes.com/sheetmusic/childrens-song/baby-shark/MN0189377)); the syllable rate is our target for clear singing, not a measurement |
| 8 | **Spell numbers as they are sung**, the same in the lyrics, the aligner and the video prompts | the aligner compares letters and digits, so "3" and "three" do not match |
| 9 | **Every edit event needs a sung word.** If a number pops on screen, someone sings that number | our design rule: the edit reads word timings, so an unsung number has nothing to drive it |
| 10 | **No artist names and no existing lyrics** | Lyria blocks "prompts that request specific artist voices or the generation of copyrighted lyrics" ([Google](https://ai.google.dev/gemini-api/docs/music-generation)); ElevenLabs returns an error for copyrighted lyrics or a named artist ([ElevenLabs](https://elevenlabs.io/docs/eleven-api/guides/cookbooks/music)) |
| 11 | **Prompt in the language of the lyrics** | Lyria: "Prompt in the language you want the lyrics in." ElevenLabs: "Styles must be in English (lyrics can be any language)" |

**Timing math** (our arithmetic). At 110 BPM in 4/4, one bar is 4 x 60 / 110 = 2.18 s. Two bars per line is 4.4 s, so 7 lines is about 30.5 s. A 4.4 s line also clears Seedance 2.5's 4-second minimum clip ([fal schema](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api)).

Prompted tempo and length are requests, and the model may ignore them. Measure the tempo and the length of every take after generation.

The handwash example's song follows rules 2, 5 and 7 by accident: four lines sung twice to the tune of Happy Birthday, 38 words in 21.5 s of singing. [`gen-03-song.md`](../prompts/generate/gen-03-song.md) has a draft of a new handwashing song written to all eleven rules (not generated).

## 4. Generating the song

### 4.1 Which model

| Model | Fits | List price (2026-10-09) | Notes | Source |
|---|---|---|---|---|
| `lyria-3-clip-preview` | a 30 s short | $0.04 | "always generates a **30-second** clip" | [Google music docs](https://ai.google.dev/gemini-api/docs/music-generation), [pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| `lyria-3.5` | longer songs, more control | $0.08 per song | length "controllable using prompt". Google lists it as the replacement for `lyria-3-pro-preview` (Lyria 3 Pro, $0.08) | same, [deprecations](https://ai.google.dev/gemini-api/docs/deprecations) |
| ElevenLabs Music `music_v2_5` with a composition plan | exact scene lengths | not checked | one chunk per scene; "for `music_v2` and `music_v2_5` section durations are always enforced"; chunks of 3 to 120 s; word timestamps on request; regenerate one section and keep the rest | [composition plans](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans), [API reference](https://elevenlabs.io/docs/api-reference/music/compose-detailed.md) |
| Suno v6 | vocals, editing one lyric | subscription | no official self-serve API (secondary: [Sonilo](https://sonilo.com/blog/guides/official-suno-api-saas-builders-2026)), so UI only; v6 can "Update a single lyric without rebuilding the entire song" | [Suno v6](https://suno.com/blog/introducing-v6) |
| ACE-Step 1.5 (local, MIT) | keeping a given melody | free, your hardware | claims cover generation and "Copy Melody"; hardware needs not checked | [README](https://github.com/ace-step/ACE-Step-1.5) |

Lyria facts that matter downstream: 44.1 kHz stereo MP3 output, a SynthID watermark on every file, and prompts asking for a specific artist's voice are blocked ([Gemini music docs](https://ai.google.dev/gemini-api/docs/music-generation)). Probe the take anyway: never assume the sample rate ([08-render-and-qa.md](08-render-and-qa.md#6-probe-the-output)).

### 4.2 Lyria: the official patterns

From Google's [prompt guide](https://ai.google.dev/gemini-api/docs/lyria-prompt-guide) and [music docs](https://ai.google.dev/gemini-api/docs/music-generation), verbatim:
- "Include your lyrics directly in the prompt beneath a `Lyrics:` header. Tag each section to guide vocal delivery".
- "**Separate lyrics from instructions.** When providing custom lyrics, clearly separate them from your musical direction instructions."
- "**Be specific.** Vague prompts produce generic results. Mention instruments, BPM, key, mood, and structure for the best output."
- "**Iterate with Clip first.** Use the faster `lyria-3-clip-preview` model to experiment with prompts before committing to a full-length generation with `lyria-3.5`."
- Timing markers work: "Build to a beat drop at 12 seconds", "The chorus kicks in at 22 seconds".
- Limits: "Music generation is a single-turn process." "Results may vary between calls, even with the same prompt."

Google's example prompt: `An upbeat, feel-good indie-pop song in G major at 122 BPM. Bright acoustic guitar strumming, driving kick drum, handclaps, and warm female vocal harmonies. The lyrics describe an unforgettable summer road trip with friends.`

### 4.3 ElevenLabs Music: the official patterns

From [best practices](https://elevenlabs.io/docs/overview/capabilities/music/best-practices) and [composition plans](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans):
- A prompt answers "genre, mood, instrumentation, tempo, and production era". Any of them you leave open gets the most average choice.
- "The model accurately follows BPM". Add "130 BPM" and "in A minor" style cues.
- To control when vocals start, give a timing cue such as "lyrics begin at 15 seconds".
- "The first chunk is the most important". Give it 6 to 7 styles. "Use negative styles liberally to prevent unwanted sounds."
- Vocal style goes in `positive_styles`, and stays out of the lyrics text.

### 4.4 Takes and retries

- Expect 2 to 3 takes per usable song, and budget for that.
- Write every retry from zero. Stacking "less this, no that" onto the last prompt makes it vaguer, not sharper.
- Few adjectives. One adjective can move the whole song, the voice included.
- Keep the lyrics block fixed and A/B only the style block.
- On Suno, turn off "Variety" and "Personalize" so it does not rewrite your prompt.

## 5. Voice scripts (coach, host, explainer)

| Rule | Source |
|---|---|
| State the promise in the first 3 seconds ("Three moves. Thirty seconds. No gym.") | [TikTok](https://ads.tiktok.com/help/article/creative-best-practices) |
| Word budget: speech runs about 150 words per minute, so 30 s holds about 70 words. With silent move clips in between, aim for 25 to 55, fewer the more of the video is silent moves | secondary: [Mental Floss](https://www.mentalfloss.com/language/how-many-words-per-minute-do-people-speak); 25 to 55 is our arithmetic |
| One short external cue per move ("push the floor away"), never an anatomy lecture | [ACE Fitness on external cues](https://www.acefitness.org/education-and-resources/professional/expert-articles/7324/internal-vs-external-cueing-how-to-help-your-clients-move-more-efficiently-and-effectively/) |
| On-screen text at 5 to 10 words per second at most; the card shows the word the voice says | TikTok: "We recommend displaying 5-10 words per second when using text." |
| Numbers as words, capitals on the one stressed word, an ellipsis before the move | ElevenLabs: "**Ellipses (...)** add pauses and weight", capitalization "increases emphasis" ([TTS best practices](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices)) |
| Audio tags, no SSML: `[exhales]`, `[excited]`, `[whispers]` | "Eleven v4 and Eleven v3 do not support SSML break tags." v4 is "a net upgrade over Eleven v3" (same page) |
| One file per line, generated with `previous_text` and `next_text` set | these improve "continuity when concatenating together multiple generations" ([API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps.md)) |
| Gemini TTS: test with an empty style first; long "Audio Profile" paragraphs are "the most common cause of voice drift" | [Gemini speech docs](https://ai.google.dev/gemini-api/docs/speech-generation) |


| Voice model | List price (2026-10-09) | Limits | Sources |
|---|---|---|---|
| Eleven v3 (`eleven_v3`) | $0.08 per 1,000 characters | 5,000 characters per request. ElevenLabs now calls it previous generation | [ElevenLabs API pricing](https://elevenlabs.io/pricing/api), [models](https://elevenlabs.io/docs/overview/models) |
| Eleven v4 (`eleven_v4`) | $0.08 per 1,000 characters (temporary promo $0.022 until 2026-10-12), checked 2026-10-09 | launched 2026-09-28 | [ElevenLabs API pricing](https://elevenlabs.io/pricing/api), [models](https://elevenlabs.io/docs/overview/models) |
| Gemini TTS | not checked | | [Gemini speech docs](https://ai.google.dev/gemini-api/docs/speech-generation) |
| Kokoro-82M, local, through `npx hyperframes tts` | free | needs a Python package; `doctor` lists it as optional | [CLI reference](https://hyperframes.heygen.com/packages/cli) |

## 6. QA: did the model sing (or say) every word?

The minimum: transcribe the take and compare it with the lyrics. A wrong take costs cents; finding the skip after the lip-sync step costs the most expensive step twice.

1. **Blind pass.** Transcribe without giving the transcriber your lyrics. A lyrics prompt pushes the model toward the expected words and can hide the skip you are looking for (our reasoning).
   - HyperFrames: `npx hyperframes@0.8.143 transcribe song.mp3 --model medium.en`. Its docs say a produced music track should "start with `medium.en`; expect to need manual lyrics or an external API" ([transcribe.md](https://github.com/heygen-com/hyperframes/blob/main/skills/media-use/audio/references/transcribe.md)). Read the warnings about where it writes in [06-word-timing.md](06-word-timing.md).
   - Their mandatory check: "**If more than 20% of entries are `♪`/`�` tokens, or the transcript contains obvious nonsense words, the transcription failed.**" (`�` is the Unicode replacement character) ([transcript-handling.md](https://github.com/heygen-com/hyperframes/blob/main/skills/media-use/audio/references/captions/transcript-handling.md))
   - `.en` models translate non-English audio into English. For other languages, use a multilingual model.
   - On Windows, the whisper engine builds whisper.cpp from source and needs cmake and a C compiler; the Parakeet engine ships a prebuilt binary (our reading of the CLI source: [manager.ts](https://github.com/heygen-com/hyperframes/blob/main/packages/cli/src/whisper/manager.ts), [sherpa.ts](https://github.com/heygen-com/hyperframes/blob/main/packages/cli/src/whisper/sherpa.ts)).
   - Groq `whisper-large-v3` through `scripts/transcribe-groq.mjs` works too and is what the example used.
2. **Diff.** This repo's aligner does it: `node scripts/align-lyrics.mjs <project> --heard <transcript> --dry-run`. It compares lower case, letters and digits only, and lists every lyric word it did not hear, every word it heard differently, and every extra word. **Reject the take on any missing number or step word.** The aligner treats every word in `lyrics.txt` as required, so an echo word in parentheses that the transcription missed also lands in the "not heard" list; judge those by ear.
3. **Timing pass, on the accepted take only.** The words come from your lyrics, the times from the transcript ([06-word-timing.md](06-word-timing.md)). This repo's aligner works on the whole song at once with word-level edit distance, so a misheard word keeps its time and takes its text from the lyrics.
4. **For a voice**, run the same blind diff per line file. Timestamp endpoints report the timing of the text you sent, so they cannot prove a word was said (our inference).

Things that look like QA and are not:
- Lyria returns its own lyrics text with the audio. That text may differ from what was sung. Use it as a cheap first filter only (unverified).
- [ElevenLabs forced alignment](https://elevenlabs.io/docs/api-reference/forced-alignment/create.md) returns timings for the text you give it. Whether its per-word `loss` flags a skipped word in music is unverified.

A clean vocal helps both QA and lip-sync. ElevenLabs suggests "a cappella" before the vocal description for a vocal-only take ([best practices](https://elevenlabs.io/docs/overview/capabilities/music/best-practices)), and has a stem separation endpoint ([API](https://elevenlabs.io/docs/api-reference/music/separate-stems.md)).

## 7. Rights and labels

**Tunes.** A song and a recording of it are separate copyrights; US works published in 1930 or earlier are public domain (secondary: [Duke CSPD](https://web.law.duke.edu/cspd/publicdomainday/2026/)).

| Tune | Status | Source |
|---|---|---|
| Happy Birthday | public domain in the US since the 2016 settlement, in the EU since 2017 | [Wikipedia](https://en.wikipedia.org/wiki/Happy_Birthday_to_You) |
| Twinkle Twinkle Little Star | public domain (melody 1761, words 1806); same tune as the ABC Song | [Wikipedia](https://en.wikipedia.org/wiki/Twinkle,_Twinkle,_Little_Star) |
| Here We Go Round the Mulberry Bush | traditional | [Wikipedia](https://en.wikipedia.org/wiki/The_Wheels_on_the_Bus) |
| The Wheels on the Bus | unclear: first published 1937, renewal not checked | same |
| If You're Happy and You Know It | avoid: a 1971 copyright filing exists | [Wikipedia](https://en.wikipedia.org/wiki/If_You%27re_Happy_and_You_Know_It) |
| Baby Shark | the campfire chant is traditional, the well-known commercial arrangement is its own work | secondary: [AP via NBC](https://www.nbcnewyork.com/news/national-international/baby-shark-plagiarism-case-south-korea-copyright-claim/6367581/) |

**No API model we found takes a melody as input.** Lyria takes text and images. ElevenLabs Audio Reference matches "feel, groove, and palette without copying the notes". Routes that claim to keep a melody are Suno Covers (UI, [blog](https://suno.com/blog/covers)) and ACE-Step 1.5 (local). The simplest path is an original melody.

**Who owns the output.**
- Gemini API: "Google won't claim ownership over that content", and the same or similar content may be generated for others ([terms](https://ai.google.dev/gemini-api/terms)).
- ElevenLabs Music is "cleared for broad commercial use" on paid plans and does not guarantee exclusivity ([what is Eleven Music](https://elevenlabs.io/docs/help-center/product/core-capabilities/music/what-is-eleven-music.md), [music terms](https://elevenlabs.io/music-terms)).
- Suno: songs made on the free tier are for non-commercial use; Pro or Premier subscribers own songs made while subscribed ([Suno help](https://help.suno.com/en/articles/2416769)). Re-check before release.
- The US Copyright Office says "prompts alone do not provide sufficient human control", while "Human-authored expressive inputs that are perceptible in the output may be protected" ([Copyright Office](https://blogs.loc.gov/copyright/2025/02/inside-the-copyright-offices-report-copyright-and-artificial-intelligence-part-2-copyrightability/)). Your own lyrics are the part most likely to stay yours.

**Labels.**
- YouTube requires disclosure for AI that "Creates music that's the main focus of the video", even when the picture is fully animated. An AI-written script does not need it ([YouTube](https://support.google.com/youtube/answer/14328491)).
- A song for children makes a video likely Made for Kids: YouTube lists "songs, stories" among the signs ([YouTube](https://support.google.com/youtube/answer/9528076)).
- The Gemini API terms bar using the services in a product "directed towards or is likely to be accessed by individuals under the age of 18" ([terms](https://ai.google.dev/gemini-api/terms)). Whether a pre-rendered song uploaded to a kids channel falls under this is unclear; check before you publish kids content made with Lyria through the API.

## 8. Not verified

- Whether Lyria or ElevenLabs filters block public-domain nursery lyrics or "to the tune of" phrasing.
- Whether ElevenLabs `with_timestamps` reports the sung timing or the planned timing, and whether short chunks join without audible seams.
- Whether Lyria's returned lyrics text matches what was sung.
- The exact Baby Shark tempo: sources give 112 to 117 BPM.
- The renewal status of The Wheels on the Bus.

## Sources

Google (CC BY 4.0): [Lyria prompt guide](https://ai.google.dev/gemini-api/docs/lyria-prompt-guide), [music generation](https://ai.google.dev/gemini-api/docs/music-generation), [pricing](https://ai.google.dev/gemini-api/docs/pricing), [deprecations](https://ai.google.dev/gemini-api/docs/deprecations), [speech generation](https://ai.google.dev/gemini-api/docs/speech-generation), [Gemini API terms](https://ai.google.dev/gemini-api/terms).
ElevenLabs: [music best practices](https://elevenlabs.io/docs/overview/capabilities/music/best-practices), [composition plans](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans), [compose detailed API](https://elevenlabs.io/docs/api-reference/music/compose-detailed.md), [music cookbook](https://elevenlabs.io/docs/eleven-api/guides/cookbooks/music), [TTS best practices](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices), [TTS with timestamps](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps.md), [forced alignment](https://elevenlabs.io/docs/api-reference/forced-alignment/create.md), [API pricing](https://elevenlabs.io/pricing/api).
HyperFrames (Apache-2.0): [transcribe.md](https://github.com/heygen-com/hyperframes/blob/main/skills/media-use/audio/references/transcribe.md), [transcript-handling.md](https://github.com/heygen-com/hyperframes/blob/main/skills/media-use/audio/references/captions/transcript-handling.md).
Other: [Wikipedia most-viewed list](https://en.wikipedia.org/wiki/List_of_most-viewed_YouTube_videos), [TikTok creative best practices](https://ads.tiktok.com/help/article/creative-best-practices), [Suno v6](https://suno.com/blog/introducing-v6), [Suno Covers](https://suno.com/blog/covers), [Suno ownership](https://help.suno.com/en/articles/2416769), [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5), [Copyright Office](https://blogs.loc.gov/copyright/2025/02/inside-the-copyright-offices-report-copyright-and-artificial-intelligence-part-2-copyrightability/).
