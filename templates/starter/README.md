# {{NAME}}

A starter project made by `npm run new -- {{NAME}}`. It renders as is: placeholder footage and silence made with ffmpeg, four marks from `marks.json`, an intro, a counter and an outro written as HTML + GSAP.

## Files

| File | What it is |
|---|---|
| `build/index.template.htm` | the edit. Edit this, never `index.html` |
| `marks.json` | the timings, in seconds of the composition |
| `index.html` | written by `node scripts/build.mjs {{DIR}}` |
| `assets/footage.mp4`, `assets/music.mp3` | placeholders. Replace them with media you may use |
| `assets/gsap.min.js` | GSAP 3.14.2, downloaded and checked by sha256 |

## Loop

Run these from the repo root:

```bash
export HYPERFRAMES_NO_TELEMETRY=1
node scripts/build.mjs {{DIR}}
npx hyperframes@0.8.143 lint {{DIR}}
npx hyperframes@0.8.143 snapshot {{DIR}} --at 0,0.05,2,4,6,8,11 --describe false
npx hyperframes@0.8.143 preview {{DIR}}     # then rebuild: preview rewrites index.html
npx hyperframes@0.8.143 render {{DIR}} -q draft -o {{DIR}}/renders/draft.raw.mp4
node scripts/fix-right-edge.mjs {{DIR}}/renders/draft.raw.mp4 {{DIR}}/renders/draft.mp4
```

## Make it yours

1. Put your clip at `assets/footage.mp4`: 1088 wide, 30 fps, a keyframe every second, no audio. [docs/05](../../docs/05-or-use-existing-footage.md) has the ffmpeg recipe.
2. Put your track at `assets/music.mp3`, then probe both: `node scripts/probe.mjs {{DIR}}/assets/footage.mp4 {{DIR}}/assets/music.mp3`.
3. Read frames of your footage, write the moments into `marks.json`, rebuild and snapshot each mark.
4. Change the hook, the labels and the credit line in the template. Set `data-duration` on the root and on every clip to your length, and `END` and `OUTRO` to match.
5. For word timings instead of marks, follow [docs/06](../../docs/06-word-timing.md) and copy the `/*TRANSCRIPT*/[]` pattern from `examples/handwash-song`.

Or hand the folder to the [character-video skill](../../skills/character-video/SKILL.md): "use character-video on {{DIR}}".
