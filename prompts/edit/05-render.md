# 05 Render

**What it does:** renders a draft, renders it a second time and compares the two frame by frame, checks the right edge for the black strip and repairs it, probes the file and checks the sound, waits for you to watch it, then renders the delivery version, repairs and probes that too.

**What you should see:** two draft files with identical decoded audio and no visible frame differences, the edge-check report, a probe table (1080x1920, 30 fps, frame count equal to duration x 30, AAC 48 kHz audio, duration within one frame of `data-duration`), a non-silent audio level, matching silence boundaries between `song.mp3` and the render, and after your OK the final MP4 with its size. On the reference machine the 30.8 s handwash example rendered at delivery quality in 64.6 s, the raw file was about 9.7 MB, and after the edge fix about 7.0 MB (both sizes change by a few KB between renders). The 21.5 s spin-count example, full-frame footage, rendered in 94 s plus 36 s for the edge fix, raw 42.1 MB, fixed 33.2 MB. The 32.5 s wing-it example, also full-frame, rendered in 1 min 43.3 s plus 42.4 s for the edge fix, raw 34.6 MB, fixed 27.3 MB.

## Before you paste

- [`04-review.md`](04-review.md) is done and you fixed what you wanted to fix.
- `npx hyperframes@0.8.143 browser ensure` has run on this machine.
- HyperFrames uses Chrome's BeginFrame capture on Linux. Elsewhere it captures screenshots, and first tries a faster drawElement path where that can engage (`render --help`: macOS with a hardware GPU; on our Windows machine with a GPU it was tried too) ([CLI reference](https://hyperframes.heygen.com/packages/cli)). That path runs a self-check on four frames. With the example's current template all four pass and the log ends with `drawelement capture`. If you see `drawElement self-verification failed; re-rendering via screenshot`, the render takes about twice as long: look for a timeline callback (`onUpdate`, `onComplete`) that writes to the page, and compare the two frames HyperFrames saved in `hf-de-verify-fail-*` in the system temp folder. The example's first template, whose counter was written by `onUpdate`, failed at frame 693 (31.7 dB against 32 dB) on every render ([docs/08-render-and-qa.md](../../docs/08-render-and-qa.md#4-render)).
- Every render on our machine has an 8 px black strip at the right edge, from an FFmpeg 8.1.2 conversion bug that HyperFrames triggers. `scripts/fix-right-edge.mjs` measures it and fills it, with a flat color when the edge of the picture is a flat page and by repeating the last good column when footage or a gradient reaches it; with no strip it copies the file unchanged ([docs/08-render-and-qa.md](../../docs/08-render-and-qa.md#5-fix-the-right-edge)).

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

6. Determinism: render the same draft again to examples/my-video/renders/draft-b.raw.mp4, then compare the two raw files (before the edge fix, which re-encodes): node scripts/framemd5-diff.mjs examples/my-video/renders/draft-a.raw.mp4 examples/my-video/renders/draft-b.raw.mp4 --audio. The decoded audio must be identical. Video frames may differ, but only invisibly and only in stretches that end at a keyframe: from inside examples/my-video/renders run ffmpeg -i draft-a.raw.mp4 -i draft-b.raw.mp4 -lavfi "[0:v][1:v]psnr=stats_file=psnr.log" -f null - (a Windows path with a drive letter breaks the filter's stats_file option) and report the number of equal frames and the lowest PSNR among the differing ones. For reference, two delivery renders of examples/handwash-song on the reference machine matched on 530 of 924 frames with a lowest PSNR of 51.6 dB and identical audio, which is normal there. If the audio differs, the lowest PSNR is under about 50 dB, or a difference is visible, list the first differing frame numbers and times, and look in the template for clocks, randomness, late-loading fonts or media.

7. Stop. Show me the render time, the edge report, the probe table, sound checks and frame comparison, and wait until I have watched draft-a.mp4 and said OK.

8. After my OK: npx hyperframes@0.8.143 render examples/my-video -q delivery -o examples/my-video/renders/my-video.raw.mp4, measure the time, then node scripts/fix-right-edge.mjs examples/my-video/renders/my-video.raw.mp4 examples/my-video/renders/my-video.mp4, and repeat steps 4 and 5 on my-video.mp4. Report both file sizes in bytes and MB.

9. If I want a preview for a README: propose a 6 to 8 second stretch that shows the main effects and contains no logo or end card, and make a GIF of it with the palettegen/paletteuse command in docs/08-render-and-qa.md section 8, 360 px wide, under 5 MB (for full-frame footage start from the spin-count settings, 12 fps and 128 colors). Show me a few of its frames.

10. If the file is over 10 MB and I want to attach it to a GitHub issue or comment on a free plan, propose a re-render with --video-bitrate (for example 2M) and how big you expect it to be. Do not run it without my OK.
```

## Notes

- Why two drafts: HyperFrames renders by seeking every frame of a paused timeline, so the same input should give the same frames ([determinism](https://hyperframes.heygen.com/concepts/determinism)). In practice, two renders of a 5 s test composition were identical, 150 of 150 frames (earlier session, files not kept), while full-length renders of the example matched on 530 of 924 frames in the latest pair (520 to 529 in earlier pairs): the rest differed by amounts you cannot see (PSNR 51.4 dB or more), in stretches that started at a pop animation and ended at the next keyframe, and the audio was identical. Visible differences, or different audio, mean something in the composition reads a clock, a random number, or something that loaded late.
- The sync check on the example: the music stops at 25.160 s in both `song.mp3` and the rendered MP4, and the mean level is -28.3 dB in both.
- The edge fix re-encodes the video with libx264 CRF 16 and copies the audio. On the handwash example (flat fill), the columns it did not edit came out at 53.1 dB PSNR on average against the raw render (48.7 dB for the worst frame), the filled columns stayed within 3 luma levels of column 1071, and the decoded audio was identical; it takes about 11 to 25 s. On spin-count (smear, full-frame footage) it took 35.6 s for 21.5 s of video, with 50.7 dB on average for the untouched columns.
- GitHub accepts video attachments up to 10 MB on a free plan and up to 100 MB on paid plans ([docs](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)). That page describes issues, pull requests and comments; we have not tested an upload in the README editor. A release asset can be up to 2 GiB ([about releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)), which is how this repo publishes the example's full render.
- `-q` accepts draft, looks, delivery, standard and high in 0.8.143; `looks` (CRF 16) is the default and `delivery` maps to high (`npx hyperframes@0.8.143 render --help`).
