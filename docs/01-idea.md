# 01. The idea and the format

Step 1 of 7. Cost: free, Claude Code works from your links and numbers. Prompt: [`gen-00-idea`](../prompts/generate/gen-00-idea.md). Output: `BRIEF.md`.

Start from a format that already has views, never from "make me a cute character". The idea decides more than any model choice.

Each example started from one line that gives the edit something to count or tick: a pre-flight checklist the flight ignores (wing-it), the spins of a boy in a stock clip (spin-count), the 20 seconds the CDC handwashing song takes when sung twice (handwash-song).

## 1. What a format needs

### 1.1 A reference with a number you saw yourself

- **Measure the reference.** Collect 10 to 20 recent videos in one niche that are doing well, with the views and the date you saw them. A view count you did not see yourself is a claim.
- **Reduce each one to its action sequence**: the first second, what repeats, the payoff. Keep the action sequence and change the concept.
- **Track speed, not totals.** If you can look twice: `(later views - earlier views) / hours between`. A recent upload that gains fast tells you more than an old one with a big total.
- **Distrust grids and income posts.** A grid of scenes with a view counter on each tile and no account name is usually a mockup. Most "$X a month" posts are self-reports, often next to an affiliate link.

### 1.2 Two families, and only one needs an edit layer

| | Swap family | Structured family |
|---|---|---|
| The video | a character replaces a person in a viral clip; one shot, 10 to 15 s | a song, a workout, a lesson or a story with a fixed shape |
| Text on screen | none, or one caption | counters, step cards, timers, word highlights, checklists |
| Rights | someone else's footage, often with real people | your own material, or footage you may edit |

This repo teaches the structured family. The edit is code, so it needs numbers, steps, words, events or a timer to animate.

### 1.3 A fixed skeleton, and a new situation every episode

A series that works has a recognisable face, one signature move, and a new situation each time. Repeat the situation that worked, not the location.

YouTube monetizes "a series following a set of characters across episodes" when "each video has a distinct storyline, focus, or concept". It does not monetize "Videos where characters are put in the same situation over and over again with the same outcome" ([policy](https://support.google.com/youtube/answer/1311392)).

Series hooks bring people back: votes on what happens next, crossovers between recurring characters, one character across many videos.

### 1.4 A reason to rewatch, planned before anything is generated

| Reason | What it looks like |
|---|---|
| A loop | a board fills on the sung numbers and the outro counts it back |
| Utility | step cards to follow along with, ending on a reason to save |
| An open question | "how many did you count?" at the end |
| A search | something hidden in each shot |
| A predictable beat | the same reveal again and again, then a finale |
| A broken plan | a checklist the story tears up item by item (wing-it) |

Image quality is not a reason to rewatch. Write the reason into `BRIEF.md` before you spend anything.

## 2. The scorecard

Score each candidate 0 to 2 on rows A to F. Row G is pass or fail. Ship only if G passes, the total is 8 or more out of 12, and neither B nor C is zero.

| Row | Criterion | 2 points if |
|---|---|---|
| A | **Audience that pays** | adults in a category with buyers (fitness, food, apps, money), or a client who pays for production. Median YouTube RPM is $0.33 for Kids & Teens against about $2.30 across all channels ([AIR, 300 channels](https://air.io/en/air-data-findings/which-youtube-niche-makes-the-most-money-in-2026-ranked-by-real-rpm-and-cpm)) |
| B | **Proven mechanism** | a reference with a view count you saw yourself, plus two other channels using the same action sequence |
| C | **Repeatable skeleton** | the episode fits one sentence, and you can list 30 situations with distinct stories |
| D | **A character can carry it** | one recurring face that reads at phone size ([02-character](02-character.md)) |
| E | **Room for the edit layer** | numbers, steps, words, events or a timer |
| F | **A reason to rewatch or save** | one you can name in one line (section 1.4) |
| G | **Risk gate** (pass/fail) | every item in section 6 passes |

## 3. The process

1. **Collect 10 to 20 references** in one niche (section 1.1). Do not scrape: links and numbers you saw are enough.
2. **Write each candidate's mechanism in one line.** Example: "giant number pops, flies into a slot, the board counts back at the end".
3. **Score the top candidates and freeze the ranking.** Also record the top three by view speed alone, to check later whether your judgement beat the plain numbers.
4. **Design the character** for the winner ([02-character](02-character.md)).
5. **Write a series list**: 10 situations now, a path to 30, one recurring gag, the fixed skeleton.
6. **Make about 10 videos** with one character before you judge.
7. **Read the first three days.** Keep the situation that worked and change the location. The question: do viewers want another episode?

## 4. Idea templates

| # | Template | Skeleton | The code animates | Verdict |
|---|---|---|---|---|
| 1 | Counting or steps song with a mascot | 25 to 35 s original song, one action per line, numbers 1 to 5, the outro counts back | word highlight, a hopping marker, a number board | teaches the edit; weak money |
| 2 | No-gym fitness coach | hook, "3 moves", a step card per move (name, reps or hold, one form cue), save call | counters, step cards, progress bar, timer, muscle map | strong fit for adults |
| 3 | Brand or app mascot, as a service | one feature per episode; the same mascot in onboarding, posts and ads | interface callouts, feature cards, end card | paid by a client, not by views |
| 4 | Short-film scene with a plan on top | 30 s of an open movie cut to 9:16; a plan the story breaks item by item; a score | chips that tick or cross, a countdown, meters, a counter | no generation cost, strong edit |

- **1.** 9 of the 30 most-viewed YouTube videos are children's songs ([Wikipedia](https://en.wikipedia.org/wiki/List_of_most-viewed_YouTube_videos)), and 57.4% of TikTok videos aimed at children in Kapwing's sample were AI slop ([Kapwing](https://www.kapwing.com/resources/the-tiktok-ai-slop-report/)), so the space is crowded. Keep it brand-free, with an original song and Made for Kids set correctly. handwash-song is this template.
- **2.** In the same sample, Fitness was 1.6% AI slop, "almost entirely human-made". Exercise cues must be correct, and a realistic human needs AI labels.
- **3.** A brand pays for production, not views, so do not sell on a promise of views.
- **4.** wing-it is this template: no generation, and the story gives the timings. Blender Studio's open movies are CC BY: credit them and link the license ([05](05-or-use-existing-footage.md)).

Weaker fits: news explained by a cast of objects (keep real people to commentary), an object reality show (invent your own show format), an absurd character in everyday places (no on-screen text to animate), an animal mascot in human situations (each episode needs its own story, section 1.3).

**For a first video:** template 2 for adults, 1 or 4 as an edit demo, 3 to sell the work.

## 5. Money: what holds up

- **YouTube Partner Program**: 1,000 subscribers plus 4,000 watch hours in 12 months or 10 million Shorts views in 90 days ([YouTube](https://support.google.com/youtube/answer/72851)).
- **Made for Kids** turns off personalized ads, comments, the notification bell, end screens and merchandise, which "may result in a decrease in revenue" ([YouTube](https://support.google.com/youtube/answer/9527654)).
- **"Every scene is an ad slot"** is a plan for adult audiences, with a clear disclosure: the coach wears the sneakers, drinks from the bottle. The FTC treats virtual influencers as endorsers ([BakerHostetler](https://www.bakerlaw.com/insights/updated-ftc-endorsement-guides-hold-virtual-influencers-to-actual-standards/)).
- **No products for young children.** YouTube limits monetization of kids content that is "Heavily promotional: Content that mainly features products, brands and logos (such as toys or food)" ([YouTube](https://support.google.com/youtube/answer/1311392)), and the YouTube Kids app does not allow paid placements ([policy](https://support.google.com/youtube/answer/10938174)).
- **Vendor programs.** Higgsfield Earn pays per approved video, up to $2,500 per video ([higgsfield.ai/earn](https://higgsfield.ai/earn)).

## 6. Red flags (row G)

Policies as of 2026-10-09.

**Kids**
- [ ] Made for Kids set honestly. YouTube counts "songs, stories" and "animated characters or cartoon figures" as signs of kids content and warns of "legal consequences under COPPA" ([YouTube](https://support.google.com/youtube/answer/9528076)). Disney paid $10M over mislabelled videos ([FTC](https://www.ftc.gov/node/327535)).
- [ ] No products in kids videos.
- [ ] No AI avatar in child-directed ads that a child could take for a real person ([CARU](https://bbbprograms.org/media/newsroom/press/caru-compliance-warning-ai)).

**Mass production**
- [ ] Each episode has its own story. YouTube does not monetize "AI-generated content made with generic or unoriginal templates giving the impression of mass production" ([YouTube](https://support.google.com/youtube/answer/1311392)).
- [ ] Not the same file on many channels. A Google research paper describes terminating about 130,000 channels in clusters that reused one template ([Fstoppers](https://fstoppers.com/artificial-intelligence/how-google-machine-terminated-130000-ai-slop-youtube-channels-six-months-903645)).

**AI labels**
- [ ] YouTube: disclose photorealistic AI content, and AI music that is "the main focus of the video". A fully animated video needs no visual label; AI-written scripts need no disclosure ([YouTube](https://support.google.com/youtube/answer/14328491)).
- [ ] Instagram: since 2026-08-31, an account whose central identity is an AI person gets an "AI-generated profile" label ([Khaleej Times](https://www.khaleejtimes.com/business/tech/instagram-ai-generated-profile-label-reach-restrictions)).
- [ ] TikTok: label realistic AI content ([Cinerads](https://www.cinerads.com/blog/tiktok-ai-content-policy)).
- [ ] EU: AI Act Article 50 labelling applies from 2026-08-02 ([Lewis Silkin](https://www.lewissilkin.com/insights/2026/07/31/the-new-ai-labelling-rules-for-deployers-in-the-advertising-supply-chain)).

**Advertising honesty**
- [ ] No testimonials from people who do not exist, no fake view or follower counts ([FTC rule](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials)).

**IP and likeness**
- [ ] An original character: no real people, no existing characters, no studio or franchise names in prompts.
- [ ] No borrowed TV format or brand, and no real person's footage without permission.

## Pitfalls

More in [gotchas.md](gotchas.md).

- A view count you did not see yourself is a claim, and so is an income post.
- The same situation with the same outcome every episode is not monetized.
- Kids content and products do not mix.
- A format with nothing to count, list or time gives the edit nothing to do.
