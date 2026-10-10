# Credits: spin-count

## Footage

**"Boy, Child, Kid"**, Pixabay video 313047, uploaded by TonyDias7.

- Page: https://pixabay.com/videos/boy-child-kid-childhood-dancing-313047/
- Uploader: https://pixabay.com/users/tonydias7-26930749/
- File: https://cdn.pixabay.com/video/2025/10/31/313047_large.mp4 (2160x3840, 24 fps, 16.708 s, no audio, 52,467,610 bytes, sha256 `5060118bfbcbb55cab8869e2088b3d2581b382df8060380c8038ade14af00129`)
- Uploaded 2025-10-31. The page labels the clip "AI generated" and tags it "3d" and "Ai Generated".
- License: "Free for use under the Pixabay Content License", per the page.

## Music

**"Funny Dancing Kids"**, Pixabay music 158822, by AudioCoffee.

- Page: https://pixabay.com/music/happy-childrens-tunes-funny-dancing-kids-158822/
- Uploader: https://pixabay.com/users/audiocoffee-27005420/
- File: https://cdn.pixabay.com/download/audio/2023/07/19/audio_0f020bf728.mp3?filename=audiocoffee-funny-dancing-kids-158822.mp3 (MP3 256 kbit/s, 44.1 kHz stereo, 125.832 s, 4,026,618 bytes, sha256 `2b5a744047cee7352824afc0d92d127a22d7bd4bd6e2899e5cfe1d85626a60d9`)
- License: "Free for use under the Pixabay Content License", per the page.
- The uploader asks, on the page: "Please credit me in your video description as follows: Music by AudioCoffee(Denys Kyshchuk): https://www.audiocoffee.net/". When you post a video with this track, put that line in the post's description.
- The page shows a "Content ID Registered" label. A video that uses the track can get a Content ID claim on platforms that run Content ID, such as YouTube.

Both pages were read on 2026-10-09.

## The Pixabay Content License

Summary page: https://pixabay.com/service/license-summary/ (full terms: https://pixabay.com/service/terms/, "last updated" November 18, 2024). Read on 2026-10-09:

- Allowed: using Content for free, without crediting the author (credit is welcome), and modifying or adapting it into new works. The full terms grant this "for commercial or non-commercial purposes".
- Not allowed, among other uses: selling or distributing Content "on a Standalone basis", which the summary defines as Content with no creative effort applied, left in substantially the form it has on Pixabay. The full terms count distribution through a stock media platform as well.
- The full terms also prohibit bulk, large-scale or systematic copying of Content, and data collection by programs or robots for unauthorised purposes, machine learning included. `scripts/fetch-spin-assets.mjs` downloads exactly the two files above, once, for this example. If you read those terms as covering it, download the two files by hand from their pages; the script then uses your copies.
- Content can carry other rights (trademarks, likeness, privacy). Per the summary, checking whether you need a third party's consent is up to you.

This is a summary for readers, not legal advice. Only the full terms are binding.

## What this example changes

- Video: scaled from 2160x3840 to 1080x1920, slowed to 0.85x (16.708 s to 19.667 s), converted to 30 fps, shown full frame under motion graphics (counter pills, numbers, stickers, title, progress bar, outro card).
- Audio: the first 22 s of the track, re-encoded as MP3; the render uses 21.5 s of it, resampled to 48 kHz AAC by HyperFrames.

## What is in git and what is not

- **Not committed:** the two Pixabay files and everything cut from them (`assets/source/`, `assets/boy.mp4`, `assets/music_cut.mp3`), the renders and the snapshots. `scripts/fetch-spin-assets.mjs` downloads the files and rebuilds the derived ones. `.gitignore` covers them.
- **Committed, derived from the works:** `docs/img/demo-spin.gif`, a 7.4 s, 360 px wide, silent excerpt of the edited render with the overlays on it; `spins.json` (ten times read from the clip); `beats/assets/music_cut.mp3.json` (beat times detected in the music).
- **Distributed outside git:** the full edited render (21.5 s, with sound) as an asset of the repo's GitHub release. It is an edited work with the overlays described above, not the clip or the track on its own.

## Credit line in the video

`Footage: TonyDias7 / Pixabay · Music: AudioCoffee / Pixabay · Edit: HTML + GSAP, rendered with HyperFrames`

## Software

- **HyperFrames** by HeyGen, Apache License 2.0, https://github.com/heygen-com/hyperframes. Used through `npx hyperframes@0.8.143`, including `beats`; no HyperFrames code is copied into this repo.
- **GSAP 3.14.2** by GreenSock, under the GSAP Standard License, https://gsap.com/standard-license. Copied from `examples/handwash-song/assets/` or downloaded from jsDelivr by the fetch script, sha256 checked, not committed.
- **Fonts:** Poppins (all text but the credit line) and Inter (the credit line), both SIL Open Font License 1.1, fetched from Google Fonts by HyperFrames at compile time.
