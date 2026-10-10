# 05 Render

**What it does:** renders a draft twice and compares the two frame by frame, fixes the right edge, probes the file and checks the sound, waits for you to watch it, then renders, fixes and probes the delivery version.

**What you should see:** the render time, the edge report, a probe table (1080x1920, 30 fps, frame count equal to duration x 30, AAC 48 kHz, duration within one frame of `data-duration`), a non-silent audio level, matching silence boundaries between `song.mp3` and the render, a frame comparison with identical audio, and after your OK the final MP4 with its size.

**Before you paste:**

- [`04-review.md`](04-review.md) is done and you fixed what you wanted to fix.
- `npx hyperframes@0.8.143 browser ensure` has run once.
- Capture: HyperFrames uses Chrome's BeginFrame capture on Linux. Elsewhere it captures screenshots, and first tries a faster drawElement path where it can engage (`render --help` names macOS with a hardware GPU; it can also engage on Windows with a GPU). That path self-checks four frames. If the log says `drawElement self-verification failed; re-rendering via screenshot`, the render takes about twice as long: look for a timeline callback (`onUpdate`, `onComplete`) that writes to the page, and compare the two frames saved in `hf-de-verify-fail-*` in the system temp folder ([docs/08-render-and-qa.md](../../docs/08-render-and-qa.md#4-render)).
- Right edge: with ffmpeg 8.1.2 (gyan.dev Windows build), HyperFrames 0.8.143 renders carry an 8 px black strip at the right edge. `scripts/fix-right-edge.mjs` measures it and fills it, with a flat color next to a flat page and by repeating the last good column next to footage or a gradient. With no strip it copies the file unchanged ([docs/08-render-and-qa.md](../../docs/08-render-and-qa.md#5-fix-the-right-edge)).

## Prompt

```text
Render examples/my-video with HyperFrames, CLI pinned as npx hyperframes@0.8.143, HYPERFRAMES_NO_TELEMETRY=1 set in the shell.

1. Preflight: node scripts/build.mjs examples/my-video, then npx hyperframes@0.8.143 lint examples/my-video. Stop if lint reports any error.

2. Draft A: npx hyperframes@0.8.143 render examples/my-video -q draft -o examples/my-video/renders/draft-a.raw.mp4
   Measure wall-clock time.

3. Right edge: node scripts/fix-right-edge.mjs examples/my-video/renders/draft-a.raw.mp4 examples/my-video/renders/draft-a.mp4
   Report what it measured and what it did, including the mode that --mode auto picked: fill (a flat color, for a flat page next to the strip) or smear (the last good column repeated, for footage or a gradient). If the filled strip looks wrong, tell me and propose the other mode with --mode fill or --mode smear.

4. Probe draft-a.mp4 with node scripts/probe.mjs and report: width, height, fps, frame count, video codec, audio codec, sample rate, channels, duration. Expected: 1080x1920, frame count = data-duration x fps, audio present, duration within one frame of data-duration. HyperFrames writes 48 kHz AAC; anything else, or a missing audio stream, is a problem.

5. Sound checks on draft-a.mp4:
   - level: ffmpeg -i <file> -vn -af volumedetect -f null -   A mean_volume near -91 dB means silence (usually an <audio> without an id).
   - sync: run ffmpeg -vn -af silencedetect=n=-35dB:d=0.25 -f null - on assets/song.mp3 and on the render and compare the silence_start and silence_end times. They should match within 0.05 s. If the song has no silences, say so and skip this check.

6. Determinism: render the same draft again to examples/my-video/renders/draft-b.raw.mp4, then compare the two raw files (before the edge fix, which re-encodes): node scripts/framemd5-diff.mjs examples/my-video/renders/draft-a.raw.mp4 examples/my-video/renders/draft-b.raw.mp4 --audio. The decoded audio must be identical. Video frames may differ, but only invisibly and only in stretches that end at a keyframe: from inside examples/my-video/renders run ffmpeg -i draft-a.raw.mp4 -i draft-b.raw.mp4 -lavfi "[0:v][1:v]psnr=stats_file=psnr.log" -f null - (a Windows path with a drive letter breaks the filter's stats_file option) and report the number of equal frames and the lowest PSNR among the differing ones. For reference, two delivery renders of examples/handwash-song matched on 530 of 924 frames with a lowest PSNR of 51.6 dB and identical audio, which is normal. If the audio differs, the lowest PSNR is under about 50 dB, or a difference is visible, list the first differing frame numbers and times, and look in the template for clocks, randomness, late-loading fonts or media.

7. Stop. Show me the render time, the edge report, the probe table, sound checks and frame comparison, and wait until I have watched draft-a.mp4 and said OK.

8. After my OK: npx hyperframes@0.8.143 render examples/my-video -q delivery -o examples/my-video/renders/my-video.raw.mp4, measure the time, then node scripts/fix-right-edge.mjs examples/my-video/renders/my-video.raw.mp4 examples/my-video/renders/my-video.mp4, and repeat steps 4 and 5 on my-video.mp4. Report both file sizes in bytes and MB.

9. If I want a preview for a README: propose a 6 to 8 second stretch that shows the main effects and contains no logo or end card, and make a GIF of it with the palettegen/paletteuse command in docs/08-render-and-qa.md section 8, 360 px wide, under 5 MB (for full-frame footage start from the spin-count settings, 12 fps and 128 colors). Show me a few of its frames.

10. If the file is over 10 MB and I want to attach it to a GitHub issue or comment on a free plan, propose a re-render with --video-bitrate (for example 2M) and how big you expect it to be. Do not run it without my OK.
```

## Notes

- Why two drafts: HyperFrames renders by seeking every frame of a paused timeline, so the same input should give the same frames ([determinism](https://hyperframes.heygen.com/concepts/determinism)). Full-length renders can still differ by amounts you cannot see, in stretches that start at a pop animation and end at the next keyframe, with identical audio. Visible differences or different audio mean the composition reads a clock, a random number, or something that loaded late.
- The edge fix re-encodes the video with libx264 CRF 16 and copies the audio.
- `-q` accepts `draft`, `looks`, `delivery`, `standard` and `high` at 0.8.143. `looks` (CRF 16) is the default and `delivery` maps to `high` (`npx hyperframes@0.8.143 render --help`).
- GitHub accepts video attachments in issues, pull requests and comments up to 10 MB on free plans and 100 MB on paid plans ([docs](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)). A release asset can be up to 2 GiB ([about releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)); the examples' full renders are published that way.
