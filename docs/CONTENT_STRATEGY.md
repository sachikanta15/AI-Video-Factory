# Content strategy and tracker

Plan and production log for narrated video content. Project documentation is English; narration follows the
episode language. Keep this file up to date as episodes are produced.

The pipeline produces **narrated storybook / explainer** video (narration + evocative art + captions +
chapters + auto-Short). Content is chosen to play to strengths (narration, mythology/history, consistency)
and away from weaknesses (character action, lip-sync, slapstick).

## Target audience

| Tier | Age | Role |
| --- | --- | --- |
| Primary | 18–34 | Largest YouTube/Reels consumption; mythology/history "explained" demand |
| Secondary | 25–44 | Higher CPM; documentary tolerance; family co-viewing |
| Avoid | under 13 | COPPA / "Made for Kids" limits ads, comments, reach; real myths are not kid-safe |

Set the YouTube audience to **Not made for kids**. Content may be family-friendly, but it is not a kids'
channel.

## Content types

Canonical type ids used in the tracker below.

| Id | Type | Form | Default length | Motion mode | Audience |
| --- | --- | --- | --- | --- | --- |
| `MYTH-EXPLAINED` | Mythology explained (retelling + meaning / variants) | Long-form | 8–12 min | vector (or still) | 18–34 |
| `HISTORY-DEEP` | History deep-dive (invention / event / era) | Long-form | 8–12 min | vector | 25–44 |
| `REGIONAL-LORE` | Lesser-known regional folklore and legends | Long-form | 6–10 min | vector | 18–34 |
| `CULTURAL-WHY` | "Why we celebrate / believe X" cultural explainer | Long-form | 5–8 min | vector | 18–44 |
| `REEL-HOOK` | Vertical hook cut from a long-form episode | Reels / Shorts | 20–60 s | vertical render | 18–34 |

### Framing rule

Never publish a bare retelling. Add **meaning, variants, or historical context**. That is the editorial
contribution and the defence against YouTube's *inauthentic content* policy (templated repetition is
penalised).

## Format and specs

| Item | Long-form | Reels / Shorts |
| --- | --- | --- |
| Aspect | 16:9 (1920×1080) | 9:16 (1080×1920) |
| Length | 8–12 min | 20–60 s |
| Delivery | `.mp4` + `.srt` + thumbnail + `.youtube.txt` | `.short.mp4` (one per episode; cut more manually) |
| Captions | burned-in (switchable) + `.srt` | burned-in |
| Chapters | auto from scene offsets | — |

## Language strategy

| Track | Language | Reach |
| --- | --- | --- |
| Hindi | `--lang hi` | India mythology/folklore audience |
| English | `--lang en` | Global mythology/history reach |

Same pipeline, same style packs. Use the Hindi design voice `d55906c0` for Hindi narration (clone voices
need a speech-to-text model installed in VoiceStudio).

## Brand and handles

One name across YouTube and Instagram: **Katha Sutra** (कथा सूत्र) — "the thread of the story". Devanagari display
name, Latin handle, same avatar on both platforms.

**Selected 16 Nov 2026:** handle `@kathasutra.hindi` on both platforms.

| Platform | Display name | Handle | Status |
| --- | --- | --- | --- |
| YouTube | कथा सूत्र | `@kathasutra.hindi` | free on 16 Nov 2026 (`youtube.com/@kathasutra.hindi` returns 404) |
| Instagram | कथा सूत्र | `@kathasutra.hindi` | confirmed free in the app on 16 Nov 2026 |

Both handles were free on 16 Nov 2026. Claim them in the same session so the two cannot drift apart.

The display name is independent of the handle: viewers see **कथा सूत्र**, the handle only appears in the URL and in
@-mentions.

`@kathasutra` is still free. The Hindi channel now carries the `.hindi` suffix, so the bare handle is left for a future
umbrella or English channel — claim it before someone else does if that channel is a real possibility.

Rejected names, with the evidence:

- **Kyun Katha** (`@kyunkatha`) and **Tyohar Katha** (`@tyoharkatha`) are already live YouTube channels. Publishing
  under either would read as a copy, and a festival-only name caps the channel once it moves to evergreen mythology.
- **Katha Ghar** (`@kathaghar`) and **Sutra Katha** (`@sutrakatha`) are also taken.

Channel rules:

- No "official", no year, no "TV" in the name — those read as clones or as dated.
- Video titles stay questions ("…क्यों?"); the channel name stays constant.
- Playlists carry the series names: **त्योहार** for festival episodes, **क्यों?** for the why-explainers.
- Bio line, Hindi then English for reach. Full profile copy is in **Profile copy** below.

### Profile copy

Instagram bio (110 of 150 characters, five lines):

```
कथा सूत्र
पुरानी कथाएँ, साफ़ जवाब।
हर बात के लिए स्रोत 📜
नई कथा हर हफ़्ते
Mythology, explained — with sources.
```

Instagram **Name** field is indexed by search, so it carries keywords the username cannot: `कथा सूत्र | हिंदी कहानियाँ`
(26 of 30 characters). Category: **Education** (or Digital creator). The one link field points at the YouTube channel.

YouTube channel description (551 of 1000 characters; the first 57 characters are what appears in search):

```
कथा सूत्र — पुरानी कथाएँ, साफ़ जवाब। हर बात के लिए स्रोत।

हर हफ़्ते एक कथा: त्योहार क्यों मनाए जाते हैं, किसी कथा का असली अर्थ क्या है, और कौन-सी बात शास्त्र में है और कौन-सी लोक-परंपरा में। हम हर दावे के साथ स्रोत देते हैं — और जहाँ पक्का जवाब नहीं मिलता, वहाँ साफ़ कह देते हैं कि नहीं मिलता।

भाषा: हिंदी
नई वीडियो: हर हफ़्ते

प्लेलिस्ट:
• त्योहार — छठ, तुलसी विवाह, देव दीपावली
• क्यों? — त्योहारों और कथाओं के पीछे का कारण

Mythology and festival stories from India, explained in Hindi, with sources named for every claim. New episode every week.
```

Channel keywords: `छठ पूजा, तुलसी विवाह, हिंदू त्योहार, पौराणिक कथाएँ, लोककथा, सूर्य पूजा, व्रत कथा, mythology explained hindi,
indian festivals explained`.

### Channel setup checklist

- Audience: **Not made for kids** on every upload (see target audience above).
- Channel language: Hindi; country: India.
- Avatar and banner: one style pack, same on both platforms; the avatar must read at 98 px. Sources are
  `.data/brand/avatar.svg` → `avatar-800.png` and `.data/brand/banner.svg` → `banner-2560x1440.png`; re-render with
  headless Chrome, keep the banner text inside the 1546×423 safe area.
- Upload defaults: category Education, the Hindi tag set, the description template from `CONTENT_STRATEGY.md`,
  and the `.srt` attached rather than auto-generated.
- Links: the other platform, and the episode source list where a video cites research.
- Handle reserved for the other platform: Instagram and YouTube must match exactly, including the dot.

### Language expansion

One channel per language, named `<brand>.<language>`: `@kathasutra.hindi` is the Hindi home, every later language takes
its own suffix. Checked 16 Nov 2026 — all of these are free on YouTube:

`@kathasutra.odia` · `.oriya` · `.tamil` · `.telugu` · `.bengali` · `.marathi` · `.gujarati` · `.kannada` ·
`.malayalam` · `.punjabi` · `.english` · `.urdu` · `.assamese` · `.nepali`

Rules for a new language:

- **Same brand, native display name.** The handle stays Latin; the display name is a transliteration, not a
  translation (कथा सूत्र → କଥା ସୂତ୍ର / கதா சூத்ரா), and a native speaker approves it. Brand names are transliterated,
  never translated.
- **Claim the handle when the language launches**, not years ahead: an empty channel is a weak signal, and a handle can
  only be changed twice in 14 days. Keep this list as the reservation record.
- **A language channel needs its own production readiness**, not just a name: a VoiceStudio voice for that language,
  caption fonts with full glyph coverage, a pronunciation dictionary, and one test episode reviewed by a native
  speaker. Ship nothing until those four exist.
- **Do not mix scripts on one channel.** Devanagari, Odia, Tamil and Telugu audiences do not share search terms, and
  mixed-script uploads confuse both the recommendation system and the viewer.
- **English is the exception worth measuring.** YouTube multi-language audio on the Hindi channel can carry an English
  track without splitting the subscriber base; compare that against `@kathasutra.english` on reach before committing.

## Cadence

- **1 long-form episode / week / channel** (8–12 min).
- **3–5 Reels / week** harvested from that episode.
- Rotate topics **and** style packs so the feed does not look templated.

## Guardrails

1. Audience = **Not made for kids**.
2. Vary topics/styles; keep a human review step; add original analysis (avoid mass-templated output).
3. Cultural/religious respect: show outcomes, not gore; state that versions differ.
4. AI disclosure only where realism warrants it (stylized animation is usually exempt).
5. No real living people's likenesses.

## Generating each type (CLI)

```sh
# Long-form mythology explained, Hindi, vector mode, Hindi voice
pnpm ys episode new --topic "The churning of the ocean (Samudra Manthan)" \
  --lang hi --minutes 10 --motion vector --voice d55906c0

# Long-form history deep-dive, English
pnpm ys episode new --topic "The invention of the printing press" \
  --lang en --minutes 10 --motion vector

pnpm ys episode run <id>
pnpm ys episode approve <id> preview   # after reviewing shot previews
pnpm ys episode run <id>               # continues to render
```

Outputs land in `.data/episodes/<id>/`: `<id>.mp4`, `<id>.short.mp4`, `<id>.jpg`, `<id>.srt`,
`<id>.youtube.txt`.

## 1-month content calendar (14 Nov – 23 Dec 2026)

Verified festival dates (Drik Panchang / India). **Publish 2–3 days before each festival** to catch the
search spike; pin a comment with the exact date. Every long-form also yields 1 auto-Short; cut extra Reels
from the best beats.

### Week 1 — 14–20 Nov (Chhath, Tulsi Vivah)

| Date | Platform | Type | Topic | Hook / search keyword |
| --- | --- | --- | --- | --- |
| 14–15 Nov | Reels | `REEL-HOOK` | Why Bihar worships the **setting** sun | "Chhath Puja 2026", "why sunset arghya" |
| 15 Nov | Reels | `REEL-HOOK` | Chhath in 60 s: the 4-day vrat | "Chhath Puja rituals" |
| 19–20 Nov | YouTube | `MYTH-EXPLAINED` | **Tulsi Vivah**: the plant that married Vishnu | "Tulsi Vivah story", "why tulsi is worshipped" |
| 20 Nov | Reels | `REEL-HOOK` | The curse that turned Tulsi into a plant | "Tulsi Vivah 2026" |

### Week 2 — 21–27 Nov (Kartik Purnima, Dev Deepawali)

| Date | Platform | Type | Topic | Hook / search keyword |
| --- | --- | --- | --- | --- |
| 21 Nov | Reels | `REEL-HOOK` | Tulsi Vivah: the wedding that opens wedding season | "Tulsi Vivah 2026 date" |
| 22–23 Nov | YouTube | `MYTH-EXPLAINED` | **Dev Deepawali**: why Varanasi lights a million lamps | "Dev Deepawali 2026", "Kartik Purnima significance" |
| 24 Nov | Reels | `REEL-HOOK` | One full moon, five festivals | "Kartik Purnima 2026", "Karthigai Deepam" |
| 24–25 Nov | Reels | `REEL-HOOK` | Guru Nanak Jayanti in 60 s | "Guru Nanak Jayanti 2026" |

### Week 3 — 28 Nov–4 Dec (Kalabhairav, wedding season)

| Date | Platform | Type | Topic | Hook / search keyword |
| --- | --- | --- | --- | --- |
| 29–30 Nov | YouTube | `MYTH-EXPLAINED` | **Kalabhairav**: Shiva's fiercest form | "Kalabhairav Jayanti 2026", "Kala Bhairava story" |
| 1 Dec | Reels | `REEL-HOOK` | Why Kalabhairav cut off Brahma's fifth head | "Kalabhairav legend" |
| 2–3 Dec | YouTube | `CULTURAL-WHY` | Why the Hindu wedding season starts after **Dev Uthani Ekadashi** | "wedding season", "Vishnu's 4-month sleep" |
| 4 Dec | Reels | `REEL-HOOK` | Vishnu sleeps for four months — here's why | "Utpanna Ekadashi" |

### Week 4 — 5–14 Dec (Vivah Panchami)

| Date | Platform | Type | Topic | Hook / search keyword |
| --- | --- | --- | --- | --- |
| 6–7 Dec | Reels | `REEL-HOOK` | Why Ganesha has one broken tusk | "Ganesha one tusk story" |
| 12–13 Dec | YouTube | `MYTH-EXPLAINED` | **Vivah Panchami**: the wedding of Rama and Sita | "Vivah Panchami 2026", "Rama Sita wedding" |
| 13 Dec | Reels | `REEL-HOOK` | The bow only Rama could lift | "Sita swayamvar", "Shiva's bow" |
| 14 Dec | Reels | `REEL-HOOK` | Vivah Panchami in 60 seconds | "Vivah Panchami 2026" |

### Bonus — plan production now for 20 & 23 Dec

| Date | Platform | Type | Topic | Hook / search keyword |
| --- | --- | --- | --- | --- |
| 20 Dec | YouTube | `MYTH-EXPLAINED` | **Gita Jayanti**: the day Krishna spoke the Bhagavad Gita | "Gita Jayanti 2026", "Bhagavad Gita story" |
| 23 Dec | YouTube | `MYTH-EXPLAINED` | **Dattatreya Jayanti**: the god with 24 gurus | "Dattatreya Jayanti", "24 gurus" |

### Evergreen fillers (use on weeks without a big festival)

- "The 10 avatars of Vishnu — explained"
- "Hanuman's five faces"
- "Ramayana vs Mahabharata: the difference"
- "Why Ganesha is worshipped first"
- "The story of Ekalavya's thumb"

### Recommendation for the algorithm

- **Festival = search spike.** Publish 2–3 days early, title with the year ("… 2026"), pin the date.
- **Questions and "why" win clicks.** Use interrogative titles.
- **Versus / list / "explained"** formats get recommended: comparisons and numbered reveals.
- **Reels:** first 2 seconds must be the hook/question; keep captions on.
- **Diversify** topics and style packs (avoid template flags).

### Production capacity note

At the current pipeline speed, plan the **long-forms first** (they take ~30–60 min each with drawing +
review loops), then harvest Reels from finished episodes. The auto-Short gives you one Reel per episode;
extra Reels are cut manually from the same source.

## Publishing metadata plan (YouTube + Reels)

What the `package` stage already writes into `.youtube.txt` (and `state.package`): **title,
thumbnailText, description** (hook + summary), **chapters** (timecoded), **tags**, **hashtags** (≤3),
**short.title** + the Short's scene range, and a rendered **thumbnail** (1280×720).

### Needed vs. not (per platform)

| Field | YouTube long-form | Reels / Shorts | Notes |
| --- | --- | --- | --- |
| title | ✅ (<70 chars) | ✅ (Shorts title <60) | concrete promise or question |
| thumbnail image | ✅ 1280×720 | ✅ (or auto frame) | one per episode |
| thumbnail text | ✅ 2–5 words | ✅ hook text | must not repeat title |
| description | ✅ hook + 2–4 paragraphs | ❌ short caption instead | Reels show ~1–2 lines |
| chapters | ✅ (3–8, timecoded) | ❌ not applicable | Shorts have no chapters |
| tags | ➖ minimal | ➖ skip | low value on modern YouTube |
| hashtags | ✅ ≤3 | ✅ 3–5 | more important on Reels |
| category / audience / language | ✅ at upload | ✅ at upload | set "Not made for kids" |

### Remove / stop generating

- **Chapters** for Reels (not applicable).
- **Full description** for Reels — use a 1–2 line caption.
- **`tags`** search list — low value; the 3 hashtags carry the weight.

### Pipeline gap to close (optional)

The Short currently inherits only a `title`. For a proper Reels workflow, extend the packager
(`packages/agents/src/package.ts` `PackageOut`) to also emit `short.caption` and `short.hashtags`, and
carry them through the `short` stage so each Reel has a hook caption + hashtags.

### Studio web UI — keep vs. remove

For a content-production + publish workflow (our use case), the top nav can be trimmed:

| Page | Keep? | Why |
| --- | --- | --- |
| Episodes (home) | ✅ | create, approve, render, publish package — core |
| New episode | ✅ | core |
| Characters | ✅ | reuse/cast consistency |
| Models | ➖ keep | model tuning per agent |
| Costs | ➖ optional | near $0 with local+subscription |
| Pricing | ❌ remove | no paid providers configured |
| Lessons | ❌ remove | developer/ops rule book |
| Rules | ❌ remove | quality-gate constants (dev) |

## Production tracker

Status: `planned` · `script` · `concept` · `voice` · `shots` · `keyframes` · `timeline` · `render` ·
`package` · `done`.

| Episode id | Type | Lang | Topic / title | Mode | Length | Status | YouTube | Reels | Date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `2026-11-14-the-birth-of-lord-ganesha-c7a351` | `MYTH-EXPLAINED` | hi | गणेश के जन्म की कथा: द्वार पर शिव को रोकने वाला बालक | vector | 3.6 min | done | — | 1 auto | 2026-11-14 |
| `2026-11-14-how-a-seed-grows-into-a-tree-1bb36b` | test | en | How a seed grows into a tree | vector | 54 s | done | — | 1 auto | 2026-11-14 |
| `2026-11-14-bolum-1a552b` | `REEL-HOOK` | hi | छठ में पहले डूबते सूरज को अर्घ्य क्यों? | vector | 1.0 min | done | — | 1 auto | 2026-11-16 |

## Reels tracker

| Episode id | Range (scenes) | Length | Hook / title | Status | Published |
| --- | --- | --- | --- | --- | --- |
| `2026-11-14-the-birth-of-lord-ganesha-c7a351` | auto | 57.7 s | द्वार पर अडिग बालक | done | — |
| `2026-11-14-bolum-1a552b` | s1–s6 (full) | 60 s | छठ में शाम का अर्घ्य पहले क्यों? | done | — |

## Known pipeline gap: multiple Reels per episode

The `short` stage emits **one** vertical Short per episode (auto-picked 20–60 s range). For 3–5 Reels per
episode, either select ranges manually in the Studio or extend the `short` stage to emit several ranges
(`pipeline/src/short.ts`, `shortRange`/`shortTimeline`).
