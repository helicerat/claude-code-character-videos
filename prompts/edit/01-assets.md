# 01 Assets

**What it does:** downloads your sources, inspects them, proposes a crop and trim, then makes a silent footage file and a separate audio file and probes everything.

**What you should see:** a probe table for every source, notes on six frames (captions, logos, black bars, cuts), a crop proposal, and after your OK `assets/footage.mp4` and `assets/song.mp3`, each within 0.1 s of the source length.

**Before you paste:**

- [`00-brief.md`](../00-brief.md) is done and you approved `BRIEF.md`.
- ffmpeg and ffprobe are on your PATH (`ffmpeg -version`).
- Behind a proxy, set `NODE_USE_ENV_PROXY=1`. Node's built-in `fetch` ignores `HTTPS_PROXY` without it.
- **Generated character:** your clips are in `assets/scenes/` and the accepted take is `assets/song/song.mp3` ([`gen-05-animate.md`](../generate/gen-05-animate.md)). Skip steps 1 to 4 of the prompt. In step 5, trim each scene clip to its scene length and join them in scene order into `assets/footage.mp4` (1088 wide for a full 9:16 frame), or keep one muted `<video>` per scene ([docs/04-animate.md](../../docs/04-animate.md#6-put-the-clips-into-the-edit)). Copy the accepted take to `assets/song.mp3`.

## Prompt

```text
Prepare the media for examples/my-video. Sources and licenses are in examples/my-video/BRIEF.md. Do not commit any media; check git status at the end and tell me if any media file shows up as untracked and not ignored.

1. Download each source once into examples/my-video/assets/source/. For Wikimedia Commons use the upload.wikimedia.org "Original file" URL and send a descriptive User-Agent header. If a download fails behind a proxy, retry with NODE_USE_ENV_PROXY=1.

2. Probe every source with node scripts/probe.mjs and print: container, video codec, width, height, fps, frame count, audio codec, sample rate, channels, duration. Never assume a sample rate; read it.

3. Extract six frames spread across the footage with ffmpeg into examples/my-video/assets/source/frames/ and look at them. Report burned-in captions (and how many pixels they take), logos, watermarks, end cards, black bars, hard cuts.

4. Propose: a crop rectangle that removes captions, logos and bars; a trim (start, end) if the source runs longer than the song or ends on a logo card; whether the audio comes from the same file. Then stop and wait for my OK.

5. After my OK, make exactly these two files:
   - assets/footage.mp4: apply the agreed trim and crop, scale with lanczos to 1088 or 1024 px wide, a multiple of 16 (keep the aspect, even height), 30 fps, libx264 -crf 16 -preset slow -pix_fmt yuv420p, a keyframe every second (-g 30 -keyint_min 30), -movflags +faststart, no audio track (-an).
   - assets/song.mp3: the same trim, -vn -ac 2 -ar 44100, libmp3lame -q:a 2.
   For reference, examples/handwash-song used crop=522:322:0:0 to drop 38 px of burned captions, then scale=1088:-2:flags=lanczos and fps=30.

6. GSAP: copy examples/handwash-song/assets/gsap.min.js into examples/my-video/assets/ (run node scripts/fetch-assets.mjs examples/handwash-song first if it is missing), or download https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js. Confirm the file header says GSAP 3.14.2.

7. Probe both outputs with node scripts/probe.mjs examples/my-video/assets/footage.mp4 examples/my-video/assets/song.mp3. Report any duration difference above 0.1 s between footage, song and source, and any sample rate other than 44100 or 48000.

8. Stop and show me the probe table.
```

## Notes

- Picture and sound stay apart on purpose. HyperFrames needs every `<video>` to be `muted` or flagged with `data-has-audio`, and it mixes `<audio>` elements itself. One `<audio id="song">` is the simplest setup to keep in sync.
- Without a keyframe every second, the HyperFrames compiler warns that sparse keyframes can cause seek failures and frozen frames.
- The width must be a multiple of 16. HyperFrames 0.8.143 extracts video frames through a yuv420p to gbrp conversion, and ffmpeg 8.1.2 (gyan.dev build) blacks out every column after the last multiple of 16. A 1080-wide card gets a dark band at its right edge ([docs/08-render-and-qa.md](../../docs/08-render-and-qa.md#5-fix-the-right-edge)).
- The final MP4 carries 48 kHz AAC audio. That is expected; look for a mismatch you did not cause.
- Next: [`02-word-timing.md`](02-word-timing.md).
