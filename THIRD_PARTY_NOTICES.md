# Third-party notices

This repo's own code, docs, prompts and skill are under the [MIT License](LICENSE). The software, media, services and quoted material below belong to others and keep their own terms. The MIT License does not apply to them.

Summary:

| Item | License or terms | In this repo? | How you get it |
|---|---|---|---|
| HyperFrames 0.8.143 | Apache License 2.0 | no | `npx hyperframes@0.8.143` downloads it from npm |
| GSAP 3.14.2 | GSAP Standard License | no (gitignored) | `scripts/fetch-assets.mjs` downloads it from jsDelivr; `scripts/fetch-spin-assets.mjs` and `scripts/fetch-wing-assets.mjs` copy that file or download it |
| WING IT! (Blender Studio, 2023), film and soundtrack | Creative Commons Attribution 4.0 | raw media no (gitignored); one derived GIF and two small timing files yes; the edited render is a release asset | `scripts/fetch-wing-assets.mjs` downloads it from Wikimedia Commons |
| Pixabay video 313047 "Boy, Child, Kid" (TonyDias7) and music 158822 "Funny Dancing Kids" (AudioCoffee) | Pixabay Content License | raw media no (gitignored); one derived GIF and two small timing files yes; the edited render is a release asset | `scripts/fetch-spin-assets.mjs` downloads both from the Pixabay CDN |
| CDC "Happy Handwashing Song" (video and audio) | public domain | raw media no (gitignored); two derived preview images and text derived from the song yes; the full render is a release asset | `scripts/fetch-assets.mjs` downloads it from Wikimedia Commons |
| Poppins and Inter fonts | SIL Open Font License 1.1 | no | HyperFrames fetches them from Google Fonts when it compiles the composition |
| Groq API, `whisper-large-v3` | Groq Services Agreement; Whisper is MIT | output only (`whisper_verbose.json`) | optional, `scripts/transcribe-groq.mjs` |
| Chrome Headless Shell, FFmpeg | their own licenses | no | installed by you or by HyperFrames |
| Quoted Picsart gen-ai-skills | MIT | short quotes with attribution, in `docs/` and `prompts/generate/` | linked where quoted |
| Quoted Google Gemini API docs (Lyria, Nano Banana, speech) | CC BY 4.0 | short quotes with attribution | linked where quoted |

This file summarizes the terms for readers and does not amount to legal advice. Licenses and terms change; read the linked pages before you publish.

## HyperFrames

- Project: https://github.com/heygen-com/hyperframes
- License: Apache License 2.0, "Copyright 2026 HeyGen, Inc." (https://github.com/heygen-com/hyperframes/blob/main/LICENSE)
- Use here: run through `npx hyperframes@0.8.143` for `lint`, `preview`, `snapshot`, `check`, `render`, `beats` and related commands. No HyperFrames source, catalog component or asset is copied into this repo, so no Apache-2.0 files are redistributed here.
- If you install a catalog item into your own project with `npx hyperframes add <name>`, that code comes from the HyperFrames repository and carries its license. Keep the notice.
- HyperFrames collects anonymous usage telemetry by default. Turn it off with `HYPERFRAMES_NO_TELEMETRY=1` or `npx hyperframes telemetry disable` (https://hyperframes.heygen.com/packages/cli).

## GSAP

- Version: 3.14.2, file `dist/gsap.min.js` from https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js
- License: GSAP Standard License, https://gsap.com/standard-license. The file header reads "Copyright 2025, GreenSock. All rights reserved. Subject to the terms at https://gsap.com/standard-license."
- Use here: `scripts/fetch-assets.mjs` downloads the file into `examples/handwash-song/assets/gsap.min.js` and checks its sha256 (`c174bfce53a729418d57a8ad8625e7247c793a22fef8e2851e3cfa3de9cd8280`); `scripts/fetch-spin-assets.mjs` and `scripts/fetch-wing-assets.mjs` copy that file into `examples/spin-count/assets/` and `examples/wing-it/assets/`, or download it when no copy is there, and check the same sha256. `.gitignore` keeps every copy out of commits. Each composition loads its local copy.
- What the license says, read on 2026-10-09: GSAP may be used for free, including commercial use. The one Prohibited Use is using GSAP in tools that let users build visual animations without code, where the tool competes with Webflow's visual animation building. The license page's FAQ says AI-generated GSAP code is not a Prohibited Use. Do not remove GreenSock's notices from the file. The Standard License is not an OSI-approved open-source license.

## Pixabay clip and music (examples/spin-count)

- Footage: "Boy, Child, Kid", Pixabay video 313047, uploaded by TonyDias7 on 2025-10-31: https://pixabay.com/videos/boy-child-kid-childhood-dancing-313047/. The page labels it "AI generated". File used: https://cdn.pixabay.com/video/2025/10/31/313047_large.mp4 (2160x3840, 52,467,610 bytes).
- Music: "Funny Dancing Kids", Pixabay music 158822, by AudioCoffee: https://pixabay.com/music/happy-childrens-tunes-funny-dancing-kids-158822/ (4,026,618 bytes). The page shows "Content ID Registered", and the uploader asks to be credited in video descriptions as "Music by AudioCoffee(Denys Kyshchuk): https://www.audiocoffee.net/".
- License: both pages say "Free for use under the Pixabay Content License". Summary: https://pixabay.com/service/license-summary/; full terms: https://pixabay.com/service/terms/ (last updated 2024-11-18). Read on 2026-10-09: free use and modification for commercial or non-commercial purposes, no attribution required; no selling or distributing the content "on a Standalone basis", meaning unedited, including through a stock media platform; no bulk or systematic copying and no automated data collection for unauthorised purposes.
- Not in git: both files and everything cut from them (`assets/source/`, `boy.mp4`, `music_cut.mp3`, renders, snapshots). `scripts/fetch-spin-assets.mjs` downloads exactly these two files and checks their size and sha256; the README and `--help` give the manual download path.
- In git, derived from the works: `docs/img/demo-spin.gif` (a 7.4 s, 360 px wide, silent excerpt of the edited render, with this repo's overlays on it); `examples/spin-count/spins.json` (times read from the clip); `examples/spin-count/beats/assets/music_cut.mp3.json` (beat times detected in the music).
- Outside git: the full edited render (21.5 s, with sound) as a GitHub release asset.
- Credit line used in the video: `Footage: TonyDias7 / Pixabay · Music: AudioCoffee / Pixabay · Edit: HTML + GSAP, rendered with HyperFrames`. An early render named the wrong uploader, by mistake; the current template and the release video are corrected.

More detail: [examples/spin-count/CREDITS.md](examples/spin-count/CREDITS.md).

## WING IT! (examples/wing-it)

- Work: WING IT!, an open movie by Blender Studio (Blender Foundation), 2023. Film page: https://studio.blender.org/projects/wing-it/
- File page: https://commons.wikimedia.org/wiki/File:WING_IT!_-_Blender_Open_Movie-full_movie.webm
- File used: https://upload.wikimedia.org/wikipedia/commons/3/38/WING_IT%21_-_Blender_Open_Movie-full_movie.webm (VP9 1920x1080, 24 fps, Opus 48 kHz stereo, 237.948 s, 36,196,718 bytes, sha256 `393df1098a0db66e5a6cee3678762e600f085317faaf36e56636bd7a54bcfc51`)
- License: Creative Commons Attribution 4.0, https://creativecommons.org/licenses/by/4.0/. The licensing page (https://studio.blender.org/projects/wing-it/pages/licensing/) gives the attribution as `(CC) Blender Foundation | studio.blender.org` and excludes all logos and associated trademarks from the license. Read on 2026-10-09.
- Changes: 30 seconds of the film (82.0 to 112.0 s) cut at its 12 shot changes, 11 shots cropped to 9:16 and one kept 16:9 as a card over a blurred copy, scaled to 1080x1920 at 30 fps; the last frame held as a still for 2.5 s; the sound from 82.0 to 114.5 s with a shouted swear (film 1:42 to 1:44) turned down to 12 percent and a 1.5 s fade out; motion graphics drawn over all of it.
- Not in git: the film and everything cut from it (`assets/source/`, `wing_v.mp4`, `wing_a.mp3`, `last.jpg`, renders, snapshots). CC BY 4.0 would allow sharing them; the repo keeps media out of git anyway. `scripts/fetch-wing-assets.mjs` downloads the file and checks its size and sha256.
- In git, derived from the work: `docs/img/demo-wing.gif` (a 7 s, 360 px wide, silent excerpt of the edited render, with this repo's overlays on it); `examples/wing-it/shots.json` and `examples/wing-it/events.json` (times read from the film, with short descriptions of what the frames show).
- Outside git: the full edited render (32.5 s, with sound) as a GitHub release asset.
- Credit line used in the video: `WING IT! (CC BY 4.0) Blender Foundation, studio.blender.org · Edit: HTML + GSAP, rendered with HyperFrames`. Wherever the video is posted, add the full attribution with the license link and say that it was cut and edited. This repo is not affiliated with or endorsed by Blender Foundation or Blender Studio.

More detail: [examples/wing-it/CREDITS.md](examples/wing-it/CREDITS.md).

## CDC "Happy Handwashing Song" (examples/handwash-song)

- Work: "Happy Handwashing Song", Centers for Disease Control and Prevention (CDC). Per the Commons page, it comes from CDC's CDCStreamingHealth YouTube channel and is dated 3 March 2010.
- File page: https://commons.wikimedia.org/wiki/File:Happy_Handwashing_Song.webm
- Original upload: https://upload.wikimedia.org/wikipedia/commons/b/b9/Happy_Handwashing_Song.webm
- License: public domain. Wikimedia Commons marks it as a work of the CDC, a U.S. federal agency, made as part of an employee's official duties.
- The video's own end card credits the people who wrote, sang, played and animated it. The melody is "Happy Birthday to You", in the public domain in the U.S. since 2016 (https://en.wikipedia.org/wiki/Happy_Birthday_to_You).
- Not endorsed: this repo and videos made with it are not endorsed by CDC or the U.S. Department of Health and Human Services (HHS). CDC's guidance on reusing its materials (https://www.cdc.gov/other/agencymaterials.html) asks you to credit CDC, not imply endorsement, and not use the CDC logo; it also says some CDC materials were made by contractors or licensed from third parties. That page refused connections from our build machine, so this summary comes from our research notes. Read it yourself before you publish.
- Logos: the source ends on a card with the CDC and HHS logos (from 25.17 s). Part of it is visible in the example render's last 5.6 s as part of the original work's credits. The logos are not used as branding for this repo, and neither preview image shows them. `docs/05-or-use-existing-footage.md` shows how to cut the clip before that card.
- Not in git: the `.webm` and everything cut from it (`cat.mp4`, `song.mp3`, renders, snapshots). `scripts/fetch-assets.mjs` downloads the original and checks its sha256 (`9b5c584cdde29757c282ad8effcdaee11c79abc3be501e048118a211d5761780`).
- In git, derived from the work:
  - `examples/handwash-song/lyrics.txt`: the sung words, taken from the captions burned into the video
  - `examples/handwash-song/assets/whisper_verbose.json` and `examples/handwash-song/transcript.json`: word timings of the song
  - `docs/img/demo.gif`: a 7.7 s excerpt of the example render (1.8 s to 9.5 s), 360 px wide, no sound
  - `docs/img/hero.png`: three frames from the example render (3.4, 9.1 and 22.3 s)
  - Both images come from before the end card with the logos. The cartoon inside the card is the CDC work; the overlay graphics around it are this repo's work under the MIT License.
- Outside git: the full render (30.8 s, with sound, including the end card) is published as an asset of the repo's GitHub release, with the credit line below. Not endorsed by CDC or HHS.
- Credit line used in the video: `Footage & song: CDC "Happy Handwashing Song", public domain. Edit: HTML + GSAP, rendered with HyperFrames.`

More detail: [examples/handwash-song/CREDITS.md](examples/handwash-song/CREDITS.md).

## Fonts

All three compositions name two fonts. No font files are in this repo.

- Poppins: SIL Open Font License 1.1, "Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins)" (https://github.com/google/fonts/blob/main/ofl/poppins/OFL.txt). HyperFrames fetched it from Google Fonts at compile time and cached it under `~/.cache/hyperframes/fonts`.
- Inter: SIL Open Font License 1.1, "Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter)" (https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt). Used for the kicker, the timer label, the board label and the credit line in handwash-song, for the credit line in spin-count, and for the PRE-FLIGHT CHECKLIST, NEXT STEP and EMERGENCY GADGETS labels and the credit line in wing-it. HyperFrames fetched it from Google Fonts at compile time and cached it under `~/.cache/hyperframes/fonts`.

## Transcription

- Groq API: `scripts/transcribe-groq.mjs` sends `song.mp3` to Groq's OpenAI-compatible endpoint (`https://api.groq.com/openai/v1/audio/transcriptions`) with the model `whisper-large-v3`. Running it is optional, and it needs your own `GROQ_API_KEY`. GroqCloud use is governed by the Groq Services Agreement (https://console.groq.com/docs/legal/services-agreement); Groq's website Terms of Use say they do not cover GroqCloud (https://groq.com/terms-of-use). Pricing: https://console.groq.com/docs/speech-to-text. We did not review the Services Agreement in detail.
- Whisper: the model was released by OpenAI under the MIT License, "Copyright (c) 2022 OpenAI" (https://github.com/openai/whisper/blob/main/LICENSE). No Whisper code or weights are in this repo.
- The committed `examples/handwash-song/assets/whisper_verbose.json` is the raw output of one Groq request for this song.
- Other engines mentioned in the docs (OpenAI's API, ElevenLabs Scribe, WhisperX, and the local Parakeet and whisper.cpp engines that `npx hyperframes transcribe` can download) have their own terms and licenses. We did not use them for the example and did not review them.

## Tools you install

- **Chrome Headless Shell** is downloaded by `npx hyperframes browser ensure` into HyperFrames' cache. It is not part of this repo and is under Google's and Chromium's terms.
- **FFmpeg and ffprobe** must be on your PATH. They are not distributed with this repo. Your build's license applies (LGPL or GPL, depending on how it was built).
- **Node.js** 22 or newer, under its own license.

## Generated media

None of the examples contains media generated for this repo. The spin-count clip is labelled AI generated on its Pixabay page; we did not make it, and it is used under the Pixabay Content License. `docs/02-character.md`, `docs/03-song-or-voice.md`, `docs/04-animate.md` and `prompts/generate/` describe paid image, music, voice and video models and the services that resell them (Picsart, Higgsfield, fal). We have not run those steps and have not reviewed every provider's terms. If you add their outputs to a project or a public repo, follow each provider's terms, label the files (for example "generated with <service>, included for study"), and note that Lyria music carries a SynthID watermark. `.gitignore` keeps media in any subfolder of `examples/*/assets/` out of commits.

## Quoted material

- [PicsArt/gen-ai-skills](https://github.com/PicsArt/gen-ai-skills) (persona creation skill), MIT, "Copyright (c) 2026 Picsart" (https://github.com/PicsArt/gen-ai-skills/blob/main/LICENSE). Short quotes, each with a link.
- [higgsfield-ai/skills](https://github.com/higgsfield-ai/skills), MIT, "Copyright (c) 2026 Higgsfield AI". Facts from its model catalog and Soul ID skill, no copied text.
- Google's Gemini API documentation (Lyria prompt guide, music generation, image generation, speech generation), CC BY 4.0. Short quotes and Google's example prompt, each with a link.
- HyperFrames documentation and skills, Apache-2.0. Short quotes, each with a link.
