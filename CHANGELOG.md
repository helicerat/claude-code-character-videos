# Changelog

## 0.2.0

- The project is now called cuecut (it was claude-code-character-videos). GitHub redirects the old URLs.

- `npm run new -- <name>` makes `projects/<name>` from `templates/starter`: an edit with an intro, one beat per mark and an outro, 12 s of placeholder footage and silence made with ffmpeg, and GSAP 3.14.2 checked by sha256. It lints with 0 errors on HyperFrames 0.8.143 before you add any media.
- `scripts/build.mjs` fills a `/*MARKS*/[]` placeholder from `marks.json` (`{ t, label }` per mark, in time order). Templates without it build as before; all three examples are byte for byte unchanged.
- `npm test`: every script's `--help`, `build.mjs --check` for every example, the Markdown links, and the starter. No media, no network.
- GitHub Actions runs `npm test`, then scaffolds the starter with ffmpeg and lints it.

## 0.1.0

- The pipeline, the prompts, the `character-video` skill and three examples: wing-it, spin-count and handwash-song.
