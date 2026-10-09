# gen-00: the idea and the brief

What it does: picks a format that already has views, fits a recurring character, and gives the edit layer numbers, steps or words to animate. Ends with `BRIEF.md`.
What you should see: one line per reference video, 3 scored format candidates, your pick, then `BRIEF.md`.

Status: written from docs, not run for this repo. Built from the method in [`docs/01-idea.md`](../../docs/01-idea.md); expect to tune it.

Pipeline step 1. Costs nothing. Next: [`gen-01-character.md`](gen-01-character.md), and the lyrics part of [`gen-03-song.md`](gen-03-song.md).

## Prompt for Claude Code

```
The project folder is examples/my-video. BRIEF.md, lyrics.txt, script.txt, STORYBOARD.md,
PROMPTS.md, costs.csv and every assets/ path below are inside it; docs/ and scripts/ are at the
repo root. Run commands from the repo root.
We are planning one 25-35 second vertical video with a recurring AI character.
The edit will be code (HyperFrames), so the format must give it numbers, steps, words or a timer to animate.
Read docs/01-idea.md first.

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
4. Write BRIEF.md from the template below. Do not design the character yet.
```

`BRIEF.md` template:

```
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

## Model prompt

None. Claude Code does this step itself, no paid model is called.

Why the step exists:
- Start from a format that already has views, measured by you, and reduce each reference to its action sequence before changing the concept (`docs/01-idea.md` section 1.1).
- A format needs a fixed skeleton and a distinct story per episode, or YouTube will not monetize it: "Videos where characters are put in the same situation over and over again with the same outcome" are listed as not allowed ([YouTube](https://support.google.com/youtube/answer/1311392)).
- The "10 now, 30 possible" check: if you cannot list 30 situations with their own stories, the niche is too narrow for a series.
- The rewatch line: a loop, a question, a utility, a search or a story, never image quality (`docs/01-idea.md` section 1.4).
- The no-scraping and no-invented-numbers rules are ours. Invented view counts used to sell something also run into the FTC rule against fake social-media indicators ([FTC](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials)).

Sources: https://support.google.com/youtube/answer/1311392 , https://support.google.com/youtube/answer/9528076 , https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials
