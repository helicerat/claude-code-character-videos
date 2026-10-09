# Credits: handwash-song

## Footage and song

**"Happy Handwashing Song"**, Centers for Disease Control and Prevention (CDC).

- File: https://commons.wikimedia.org/wiki/File:Happy_Handwashing_Song.webm
- Original upload: https://upload.wikimedia.org/wikipedia/commons/b/b9/Happy_Handwashing_Song.webm
- Per the Commons page, the video comes from CDC's CDCStreamingHealth YouTube channel (https://www.youtube.com/watch?v=kHPQrYthn6M) and is dated 3 March 2010.
- License: public domain. Wikimedia Commons marks it as a work of the CDC made as part of an employee's official duties, which puts it in the public domain as a work of the U.S. federal government.

The video's own end card (from 25.17 s in the source) credits the people who wrote the lyrics, sang, played and animated it. The song is sung to the tune of "Happy Birthday to You".

### What this example changes

- Video: the bottom 38 px of burned-in captions are cropped off (522x360 to 522x322), the result is scaled to 1088 px wide, re-encoded as H.264 without audio, and shown inside a card with motion graphics on top.
- Audio: converted from mono Vorbis to stereo MP3; HyperFrames resamples it to 48 kHz AAC in the final MP4.
- Lyrics on screen come from the captions burned into the source. Word timings come from Groq `whisper-large-v3`, aligned to those lyrics.

### Not endorsed

This repository and the videos made with it are not endorsed by CDC or the U.S. Department of Health and Human Services (HHS). Following CDC's guidance on reusing its materials (https://www.cdc.gov/other/agencymaterials.html), we credit CDC, do not imply endorsement, and do not use the CDC logo as branding. That page could not be opened from our build machine; its rules are summarized here from our research notes.

The source's end card shows the CDC and HHS logos. In the current render that card is visible inside the footage card from 25.17 s to the end (30.8 s), while the outro plays below it; the logos sit at the card's bottom edge and are partly cropped. The logos are part of the original work's credits and are not used to brand this repo. The two preview images committed to the repo (`docs/img/demo.gif`, 1.8 s to 9.5 s, and `docs/img/hero.png`, frames at 3.4, 9.1 and 22.3 s) are taken from before the end card. If you publish a video derived from this example, consider ending the footage before 25.17 s or covering the card.

### What is in git and what is not

- **Not committed:** the CDC file and the raw media cut from it (`cat.mp4`, `song.mp3`), the renders and the snapshots. `scripts/fetch-assets.mjs` downloads the original from Wikimedia Commons and rebuilds the derived files on your machine.
- **Committed, derived from the work:** two preview images made from the render, `docs/img/demo.gif` (a 7.7 s, 360 px wide excerpt) and `docs/img/hero.png` (three frames). The cartoon inside the card is the CDC work; the overlay graphics around it are this repo's work under the MIT License. Also the text files `lyrics.txt`, `assets/whisper_verbose.json` and `transcript.json`.
- **Distributed outside git:** the full render (`handwash-song.mp4`, 30.8 s, with sound, including the end card) is published as an asset of the repo's GitHub release, with this credit.
- Neither the repo nor the release is endorsed by CDC or HHS.

## Software

- **HyperFrames** by HeyGen, Apache License 2.0, https://github.com/heygen-com/hyperframes. Used through `npx hyperframes@0.8.143`; no HyperFrames code is copied into this repo.
- **GSAP 3.14.2** by GreenSock, free to use under the GSAP Standard License, https://gsap.com/standard-license. GSAP is not OSI open source; the license's one prohibited use is building no-code visual animation tools that compete with Webflow. `gsap.min.js` is downloaded by `scripts/fetch-assets.mjs` and not committed.
- **Fonts:** Poppins and Inter, both under the SIL Open Font License 1.1. Inter sets the kicker, the timer label, the board label and the credit line; Poppins sets everything else. HyperFrames fetches both from Google Fonts on the first compile and caches them locally.
- **Transcription:** Groq API, model `whisper-large-v3` (OpenAI Whisper weights). Use of the API is subject to Groq's terms.
