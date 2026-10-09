# Credits: wing-it

## The film

**WING IT!**, an open movie by Blender Studio (Blender Foundation), 2023. Full credits are on the film's [credits page](https://studio.blender.org/projects/wing-it/pages/credits/).

- Film page: https://studio.blender.org/projects/wing-it/
- Licensing page: https://studio.blender.org/projects/wing-it/pages/licensing/
- Commons file page: https://commons.wikimedia.org/wiki/File:WING_IT!_-_Blender_Open_Movie-full_movie.webm
- File: https://upload.wikimedia.org/wikipedia/commons/3/38/WING_IT%21_-_Blender_Open_Movie-full_movie.webm (VP9 1920x1080, 24 fps, Opus 48 kHz stereo, 237.948 s, 36,196,718 bytes; sha1 `ed4413be967c5333bb70251e3ddfdb38d42c7643` as listed by Commons, sha256 `393df1098a0db66e5a6cee3678762e600f085317faaf36e56636bd7a54bcfc51`)
- The Commons page gives the license as CC BY 4.0, the author as Blender Studio, the source as Blender Studio's YouTube upload "WING IT! - Blender Open Movie", and the date as 12 September 2023.

## The license

The licensing page says the work of the Wing It! project "is licensed under the Creative Commons Attribution 4.0 license", and that this "includes all the data we publish on this website". It gives the attribution, "if not specifically mentioned otherwise", as:

`(CC) Blender Foundation | studio.blender.org`

It excludes all logos (including the Blender, Wing It! and Creative Commons logos and sponsor logos) and associated trademarks from the license. The page names no exception for the soundtrack. We saw no logo in the 30 seconds used here (film 1:22 to 1:52).

Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/), in short: you may copy, share and adapt the work for any purpose, commercial use included, as long as you credit the creator, link the license, say whether you changed the work, and do not suggest that the licensor endorses you or your use. You may not add terms or technical measures that stop others from doing what the license allows.

Both pages were read on 2026-10-09. This is a summary for readers, not legal advice; the license text is binding.

## What this example changes

- **Picture:** 30 seconds of the film (82.0 to 112.0 s), cut at the film's own 12 shot changes. Eleven shots are cropped to a 608x1080 window around their subject; one (107.0 to 110.83 s) is kept whole as a 1080x608 card over a blurred, darkened copy of itself. Everything is scaled to 1080x1920 and converted to 30 fps. The last frame is held as a still for 2.5 s at the end. Motion graphics are drawn over all of it (a checklist card, a countdown, an altitude meter, warnings, a gadget counter, a tape, an outro).
- **Sound:** the film's soundtrack from 82.0 to 114.5 s. A shouted swear at film 1:42 to 1:44 is turned down to 12 percent, and the last 1.5 s fade out. HyperFrames re-encodes it as 48 kHz AAC.

The exact cut is in [`shots.json`](shots.json), the ffmpeg chains in [README.md](README.md#reproduce).

## Credit line in the video

`WING IT! (CC BY 4.0) Blender Foundation, studio.blender.org · Edit: HTML + GSAP, rendered with HyperFrames`

It stays at the bottom of the frame for the whole video. When you post a video made from this example, also put the full attribution in the post or its description, for example:

`Footage and sound: WING IT! (CC) Blender Foundation | studio.blender.org, CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ . Cut to 9:16 and edited, with motion graphics added.`

This repo and the videos made with it are not affiliated with or endorsed by Blender Foundation or Blender Studio.

## What is in git and what is not

- **Not committed:** the film and everything cut from it (`assets/source/`, `assets/wing_v.mp4`, `assets/wing_a.mp3`, `assets/last.jpg`), the renders and the snapshots. CC BY 4.0 would allow sharing them; the repo keeps media out of git anyway, as for the other examples, and `scripts/fetch-wing-assets.mjs` rebuilds them on your machine.
- **Committed, derived from the work:** `docs/img/demo-wing.gif`, a 7 s, 360 px wide, silent excerpt of the edited render (2.6 to 9.6 s) with the overlays on it; `shots.json` and `events.json` (times read from the film, with short descriptions of what the frames show).
- **Distributed outside git:** the full edited render (32.5 s, with sound) as `wing-it.mp4`, an asset of the repo's GitHub release v0.1.0, with the credit line above in the frame.

## Software

- **HyperFrames** by HeyGen, Apache License 2.0, https://github.com/heygen-com/hyperframes. Used through `npx hyperframes@0.8.143`; no HyperFrames code is copied into this repo.
- **GSAP 3.14.2** by GreenSock, under the GSAP Standard License, https://gsap.com/standard-license. Copied from another example's `assets/` or downloaded from jsDelivr by the fetch script, sha256 checked, not committed.
- **Fonts:** Poppins (all text but the small labels and the credit line) and Inter (the PRE-FLIGHT CHECKLIST, NEXT STEP and EMERGENCY GADGETS labels and the credit line), both SIL Open Font License 1.1, fetched from Google Fonts by HyperFrames at compile time.
