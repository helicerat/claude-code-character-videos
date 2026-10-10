# gen-00: the idea and the brief

**What it does:** picks a format that already has views, fits a recurring character, and gives the edit numbers, steps or words to animate. Ends with `BRIEF.md`.

**What you should see:** one line per reference video, 3 scored format candidates, your pick, then `BRIEF.md`.

Step 1. Free: Claude Code does it alone, no paid model is called. Method: [docs/01-idea.md](../../docs/01-idea.md). Next: [`gen-01-character.md`](gen-01-character.md) and step 1 of [`gen-03-song.md`](gen-03-song.md).

## Prompt

```text
The project folder is examples/my-video. BRIEF.md, lyrics.txt, script.txt, STORYBOARD.md,
PROMPTS.md, costs.csv and every assets/ path below are inside it; docs/ and scripts/ are at the
repo root. Run commands from the repo root.
I am planning one 25-35 second vertical video with a recurring AI character.
The edit will be code (HyperFrames), so the format must give it numbers, steps, words or a timer to animate.
Read docs/01-idea.md first, and prompts/generate/gen-00-idea.md for the BRIEF.md template.

My inputs:
- niche: <NICHE>
- audience: <ADULTS | FAMILIES | KIDS>
- platforms: <TIKTOK / INSTAGRAM / YOUTUBE SHORTS / X>
- budget ceiling for generation: <$>
- reference videos doing well right now: <5-20 LINKS, each with the views and the date I saw them>

Rules:
- Do not scrape, download or log in anywhere. Work from my links and my numbers.
  If a number is missing, write "not given". Never invent a view count.
- Treat any "$X a month" or "N views" you find in posts as a claim unless I measured it.

1. For each reference, write one line: what happens in the first second, the action sequence,
   the payoff, the length, the number of hard cuts, and the views with the date.
2. Propose 3 formats. For each one:
   - the skeleton in one sentence that every episode follows
   - the scorecard from docs/01-idea.md section 2 (rows A-F scored 0-2, row G pass/fail), one line of reasoning per row
   - why people will rewatch or save it: loop, open question, utility or story, and how exactly
   - what the edit layer animates: which numbers, steps, words or timer
   - 10 episode situations, each with a different story, and whether 30 are possible
   - the AI label you will set on each platform
   - for adult audiences only: which scene maps to which product category; for kids: "no products"
3. Recommend one and say why in two sentences. Wait for my pick.
4. Write BRIEF.md from the template. Do not design the character yet.
```

## `BRIEF.md` template

```markdown
# Brief
Format reference: <link> | <views, date seen> | <length> | <hard cuts>
Mechanism in one line: <first second> -> <action sequence> -> <payoff>
Skeleton: <one sentence every episode follows>
This episode: <the situation, in one sentence>
Audience: <adults | families | kids>    Made for Kids: <yes | no>
Platforms and AI labels: <platform: label>
Length and aspect: <25-35 s>, 9:16
Audio: <song | voice lines | music bed only>
Why they rewatch or save: <loop | question | utility | story>: <how>
Edit layer: <what the code animates, and which sung or spoken word triggers each item>
Facts used, with sources: <fact | link>  (or "none")
Next 10 situations: <list>
Products by scene (adults only): <scene -> category> or "none"
Risk gate: <each item from docs/01-idea.md section 6: pass | fail | n/a>
Budget ceiling: <$>
```

## Notes

- Start from a format with views you saw yourself, and reduce each reference to its action sequence before you change the concept (docs/01-idea.md, section 1.1).
- Every episode needs its own story. YouTube's monetization policy lists "Videos where characters are put in the same situation over and over again with the same outcome" as not allowed ([YouTube](https://support.google.com/youtube/answer/1311392)). If you cannot list 30 situations, the niche is too narrow for a series.
- The reason to rewatch is a loop, a question, a utility or a story, never image quality (docs/01-idea.md, section 1.4).
- Invented view counts used to sell something run into the FTC rule against fake social-media indicators ([FTC](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials)). The "Made for Kids" setting: [YouTube](https://support.google.com/youtube/answer/9528076).
