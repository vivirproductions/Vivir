# CODEX.md - Vivir Project Instructions

This file and `CLAUDE.md` are meant to describe the same project facts. They exist as two
files because Codex runs as a single agent here, not as the multi-agent orchestrator Claude
Code uses - so this file skips the agent-roster and handoff-format material that only makes
sense inside that pipeline, and keeps everything else in sync. If the two files ever disagree
on a fact (palette values, consent rules, what exists on disk), `CLAUDE.md` is the source of
truth and this file is stale - update this file to match, not the other way around.

## What Vivir Is

A production and media studio in Iloilo City, Philippines. Photography and cinematography:
same-day edits for corporate and faith events, pageants, pre-wedding, pre-debut, tourism and
advocacy films. There are two positioning documents in tension - a faith/testimony framing
("Digital Missionaries, Unveiling Testimonies") and a 2024 Canva brand book describing a
wedding/corporate photography studio with two named founders. Both are true of the same
company; the media library itself (this folder's `Videos/`) contains both kinds of work.
Hanz has not confirmed which framing leads. Treat all copy as swappable until he does.

## Repo and Deploy State (current, not aspirational)

- `C:\Users\Admin\Documents\Vivir` **is** a git repository. Remote:
  `https://github.com/vivirproductions/Vivir`. Do not run `git init` - it already exists.
- A Next.js 16 App Router app is scaffolded: `app/`, `src/`, `public/`, TypeScript, deployed to
  Vercel as `vivirproduction-1227`. `package.json` name is `vivir-three-version-review`.
- The Next.js app currently serves a **review selector** - `/`, `/v1-ochre`, `/v2-sanctuary`,
  `/v4-blue` - showing the three approved color directions built from the older
  `prototypes/ink-v*` folders via `src/variants/registry.ts` and
  `scripts/extract-variants.mjs`. That task is done and already committed
  (`Prepare Vercel review for V1 V2 V4 color directions`).
- **Git writes are permitted when Hanz explicitly asks to ship reviewed work to `main`.** Before
  `add`, `commit`, or `push`, inspect the diff, run the relevant build and tests, and report what
  is being shipped. Use normal commits and `git push origin main` only. Never force-push, reset,
  amend published history, or use broad staging commands that can include unrelated files.
- V3 Oxblood is not "excluded from the selector" - it is **fully deleted**, everywhere:
  `prototypes/film-v3-oxblood`, `prototypes/ink-v3-oxblood`, `prototypes/v6-oxblood`, its
  README section, its exported HTML. If you find a reference to it, that reference is stale;
  remove it rather than restore the folder. Three approved directions only: Ochre, Sanctuary,
  Blue.

## The Active Work: a Landing Page, Separate From the Selector

The review-selector app above and the actual **landing page** are two different things living
in the same repo. The landing page is being built and iterated as static HTML in
`prototypes/film-v1-ochre/`, `prototypes/film-v2-sanctuary/`, `prototypes/film-v4-blue/` - one
`index.src.html` per direction, built to `index.html` by `prototypes/shared/build.py`. It is
**not yet wired into the Next.js app** - it is viewed locally via
`python -m http.server 8090` from the repo root, then opening
`/prototypes/film-v1-ochre/index.html`. The three files are deliberately near-identical:
same layout, same copy, same scripts, differing only in CSS custom-property colour values and
title. Preserve that when editing - a change that isn't a colour token should land in all
three, or the port relationship is broken.

Format: a full-bleed video hero (the client's own footage, not a mockup) over a nine-row film
index (number, name, kind), not a thumbnail grid. Reference brief was lulafilms.com for the
*idea* of restraint and minimal text; the actual shipped page deliberately does not resemble it
structurally (Hanz rejected an earlier pass for looking too much like it). Type is Archivo,
weights 300 and 400 only - Hanz asked twice for lighter, less bold type. Do not add 500/600/700
anywhere on this page.

The hero video lives at `public/media/hero.mp4` - full native resolution (1920x800), the
client's real footage with its own audio, about 88 MiB. That is intentional: GitHub's real
block is 100 **MiB** (104,857,600 bytes), not 100 MB, and Hanz asked for full resolution rather
than a downscale. Do not re-encode or shrink it without being asked - a prior smaller cut was
explicitly rejected once he clarified he wanted the whole file at full quality. The nine work
stills live in `public/media/work/*.jpg`.

## Build and Verify

```
python prototypes/shared/build.py film-v1-ochre film-v2-sanctuary film-v4-blue
node prototypes/shared/palette-audit.mjs
python -m http.server 8090        # from the repo root, so /media/... resolves
```

`build.py` builds every `*.src.html` in a named folder, not just `index.src.html` - pass a
folder name, never run it bare while another folder is mid-edit. `palette-audit.mjs` greps
every hex literal in each `index.src.html` against that file's own line-8
`<!-- palette: ... -->` comment; a retired colour value must be written in words or `hsl()` in
a comment, never as a hex, or the audit fails for a reason that looks like nonsense.

## Inquiry Form / Email

`app/api/inquiry/route.ts` is a Next.js route handler (Node runtime, forced - nodemailer
cannot run on Edge) that emails a real inquiry to `vivir.production@gmail.com` over Gmail SMTP.
Credentials are `GMAIL_USER` / `GMAIL_APP_PASSWORD`, read from environment only - `.env.local`
locally (gitignored), the Vercel project's Environment Variables in production. Never write a
real credential into any file in this repo; `.env.example` holds placeholders only. The route
has a honeypot field (`company`), field-level validation, and returns a clean operator-facing
503 if the env vars are absent rather than crashing or silently discarding mail. Tests live in
`tests/inquiry-route.spec.ts` (Playwright) and stub the SMTP transport - running the suite must
never send real mail. If you change this route, prove the test-honesty gate: green with the
change, then break the specific behaviour and confirm the specific test goes red, then restore
and confirm green again. Report all three states.

**The dev server, when running, holds the real app password.** A real POST to
`localhost:3000/api/inquiry` sends actual mail to the client's inbox. Do not smoke-test this
route by hand against the live dev server; use the stubbed test suite.

## Consent - the non-negotiable gate

Consent is **UNCLEARED** for everything except the studio's own contact address. This is not a
formality; it has already caused one real defect this project shipped and then had to fix: two
of the nine work-grid stills (a pageant photo and a "Jesus Reigns" ministry-branded photo) were
pulled straight from the client's raw footage and legibly showed a competing brand name, an
event year, and identifiable people, before an independent review caught it. The footage itself
is authorised to use; naming or branding within it is not.

Rules, concretely:
- No real person's, couple's, client's, church's or ministry's name anywhere, visible or in a
  source comment.
- No year attached to any specific piece of work (a year asserts when Vivir filmed it - that's
  a company fact, not a placeholder).
- No invented testimonial, quote, or review. No asserted company fact - no founding year,
  founders, head count, film count, years active, awards, client count, street address.
- If a frame from the real media library carries legible branding, a name, or a year burnt into
  the footage, do not use that frame. Pulling a different, cleaner frame from the same source
  video is usually possible and is the first thing to try; if it genuinely is not (an entire
  source video is branded/solo-portrait throughout), the correct move is a visibly labeled
  placeholder in that slot, not a marginal frame that "probably" reads as fine at delivery size.
  This project's own bracket convention is `[Thing - to be confirmed]`, rendered as real text in
  the page, never only in a comment. A label that exists only in a comment is not a label.
- Never fabricate a testimony. Placeholder story copy must read as placeholder, not as a
  plausible invented account - "lorem ipsum, never a plausible fake."

## Brand Facts (condensed - `CLAUDE.md` has the full version with sourcing)

**Palette**, nine steps, printed as hex in the client's own Canva brand book - this is the
closed set for the original brand-locked prototypes (`v1-deep`, `v2-daylight`, `v3-story`):
`#03045E #023E8A #0077B6 #0096C7 #00B4D8 #48CAE4 #90E0EF #ADE8F4 #CAF0F8`, plus pure `#FFFFFF`
and `#000000`. The three current landing-page directions (Ochre, Sanctuary, Blue) are
**exploratory** and each declares its own five-or-six-value palette on line 8 of its own file,
audited against exactly that declared set, not the brand nine - Hanz explicitly authorised
non-blue palettes for exploratory work. The **logo files are excluded from that exception** -
they ship in fixed black/white only and are never recoloured, per the brand book's own rule
against altering the mark.

**Marks**: the VIVIR wordmark (angular, no curves, mixed heavy-strokes-and-hairlines) and a
separate curved V mark (the brand book's own words: "evokes movement and dynamism"), plus an
aperture submark. Never rotate, crop, recolour, or retypeset any of them.

**Type**: Brown Sugar is the brand book's named display face, used for the older `ink-v*`
review prototypes (embedded as a 17 KB woff2). The current landing-page rebuild deliberately
does **not** use it - Archivo throughout, weights 300/400 only, loaded from
`fonts.googleapis.com` (the only external script/style host the Artifact CSP and this project's
own convention allow). This is a live decision, not an oversight - don't "restore" Brown Sugar
to the landing page without being asked.

## Traps - real bugs this project has already paid for

**The wordmark loses its hairlines below 402 CSS px of rendered width**, and silently reads
"VIV R" - the failure doesn't look broken, it just looks like a different, wrong logo. Fix:
headers use the standalone V mark, sized by height with `width:auto`; the full wordmark only
appears at 420px+ (a hero, not a header), or not at all.

**IntersectionObserver strands content at opacity 0 forever** if an anchor jump, an End
keypress, or a restored scroll position carries an element past the observer without it ever
firing - measured at 8, 11, 13, then 15 of 16 stranded elements across different builds of this
same project. The current landing-page format avoids the whole failure class by not using a
scroll-reveal at all: everything is visible at rest, and the only JS-driven motion is a hover/
focus crossfade on the work-index backdrop.

**A published Claude Artifact wraps the page in a shell defaulting to `color-scheme:light`** -
a near-black page then gets a light scrollbar track down its right edge, invisible in every
local test because the wrapper doesn't exist locally. Fix is one `color-scheme:dark;` in the
page's own `:root`, with a comment explaining why, or the next editor deletes it as redundant.

**The palette audit only greps hex literals** - it can't tell a colour that's *used* from one
that's merely *discussed*. Write a retired value in words or `hsl()` in a comment, never as a
hex, or a correct build fails for a reason that looks like nonsense.

**A fragment deep link (`#studio`) can land short of the target.** Chromium runs its fragment
scroll after an end-of-body script, so any script touching layout on load wins the race. Fix is
a guarded re-assertion of the target scroll on `requestAnimationFrame` twice, then again on
`load`. Do not set `history.scrollRestoration = 'manual'` as a fix - it trades this bug for a
worse one, losing the reader's scroll position on every back-navigation.

**A session's first full-page screenshot differs from every one after it**, even on a
completely static page with zero animation - this is the screenshot tool settling on its first
call, not the page. Take one throwaway capture before the pair you actually intend to compare.

**GitHub's real per-file block is 100 MiB (104,857,600 bytes), not 100 MB.** Do the arithmetic
in MiB before declaring a video asset "too big for git" - a bitrate adjustment at full
resolution often clears it without any quality loss or external hosting.

## Verification Checklist

Before handing work back:
- The relevant `prototypes/*/index.src.html` builds clean (`build.py`, named folder) and the
  palette audit exits 0.
- No horizontal scroll at 375, 768, 1440 CSS px.
- Every interactive element has a visible keyboard focus state.
- Console is clean in a real browser.
- Nothing under `Videos/` (the 700 MB-class raw masters) was opened, moved, or re-encoded.
- No git write command was run.
- The consent rules above hold on the *rendered* page, not just the source - read the built
  page's visible text and check every image, not only the HTML you wrote.

## Preferred Working Style

- Edit `index.src.html`; `index.html` is generated. Rebuild after every source change before
  claiming anything is done.
- When a fact here and in `CLAUDE.md` disagree, assume this file is the one that drifted, and
  say so rather than picking one silently.
- Keep the three landing-page variants structurally identical. If a fix isn't a colour token, a
  title, or a variant-specific number in a comment, apply it to all three, not just one.
- Prefer a real, working substitute over a stalled task. If a media asset can't clear the
  consent gate, put in a real, visibly-labeled placeholder rather than leaving the question
  open and the defect shipped.
