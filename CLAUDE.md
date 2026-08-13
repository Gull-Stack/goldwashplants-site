# Gold Wash Plants — Claude session notes

Eleventy static site at goldwashplants.com. Built from `src/`, output to
`_site/`. Vercel serves `_site/` plus the `api/` directory (Node functions).
Auto-deploys from `main` (autoAlias to production).

## Repo orientation

- `src/index.njk` is the **real** homepage source. Root `index.html` is dead
  pre-Eleventy code — do not edit it, Eleventy doesn't read it.
- `src/contact/index.njk` is the contact page; its form is the canonical
  JS-handled pattern (preventDefault, POST JSON, capture Turnstile token).
- `api/submit-lead.js` is the lead pipeline: Turnstile → spam check →
  Supabase insert → SendGrid email to chase@goldwashplants.com (CC bryce).
- Cloudflare Turnstile is enforced in prod (`TURNSTILE_SECRET_KEY` is set).
  Forms must include the `cf-turnstile-response` token in the POST body.
- Supabase is on a separate org from GullStack's MCP. To query locally:
  `vercel link` + `vercel env pull --environment=production` then curl
  `$SUPABASE_URL/rest/v1/leads`.
- Three Nunjucks partials drive site-wide consistency:
  - `src/_includes/icons.njk` — SVG icon macro (`{% from "icons.njk" import icon %}`
    then `{{ icon("phone", 24) }}`). No emojis on this site by policy.
  - `src/_includes/location-schema.njk` — LocalBusiness + Service JSON-LD
    for every `/locations/*` page. Reads `location` / `regionType` /
    `regionCode` from per-page front-matter.
  - `src/_includes/article-schema.njk` — Article + BreadcrumbList JSON-LD
    for every `/blog/*` post. Reads `datePublished` / `dateModified` from
    front-matter.

## Session Log

### 2026-08-13 — Full SEO audit: broken images Chase reported twice, 145 fake reviews, and the money terms are sliding

Full audit written up at **`docs/SEO-AUDIT-2026-08-13.md`** — read that for the
detail. Highlights:

- **🔴 Chase was right about the M100 photo, and it was four images not one.**
  `src="../images/…"` on pages one directory deep resolves to
  `/products/images/…` → **404**. Hit `/products/100-ton/`, `/products/50-ton/`
  and **both** images on `/locations/alaska/`. `/products/200-ton/` used an
  absolute path, which is why nobody caught it. He asked **7 Aug and again
  9 Aug**. Fixed in `c2a6cd2` with better alt text + `loading="lazy"`.
- **🔴 THE FINDING OF THE SESSION — the site published 145 reviews it does not
  have.** Homepage `Organization` carried `aggregateRating` **4.8/127**;
  `/products/50-ton/` carried **4.9/18**. The 22 July session recorded the site
  has **zero reviews**. The 19 May session had already flagged the homepage one
  ("verify this is real … or remove it — manual-action risk") and it was never
  resolved. Same page also declared **price $35,000 and $0 shipping** on a page
  with no visible price, for a company that ships worldwide. All removed; 0
  `aggregateRating` remain in the build. ⚠️ The three homepage testimonials are
  still live and **unverified** — ask Chase whether they are real people, and if
  so get them to leave actual Google reviews.
- **🔴 Commercial terms slid 4–8 places since 15 July; informational terms held.**
  Same-source SEMrush: `gold wash plant` (390/mo) **7 → 15** · `gold wash plants`
  **5 → 12** · `gold wash plant for sale` (210/mo) **4 → 8** · `gold in clay
  deposits` dropped out of the top 30. Meanwhile `flour gold` (480/mo, the
  biggest volume term on the site) **appeared at #5**. Traffic estimate
  **144 → 68**. Keywords flat 161 → 162, Authority Score flat at 8, referring
  domains 131 → 132.
- **⚠️ Do not read that as a traffic collapse.** Chase's Search Console shows
  **748 clicks over ~3 months, flat to slightly up**, with some of the highest
  daily peaks in early August. SEMrush estimates position × volume; GSC counts
  real clicks. Both are true — the site is losing buying-intent terms while
  holding long-tail clicks. Say it that way to Chase.
- **Cannibalization from 22 July was never fixed and is now worse — 8 terms.**
  `easy wash plant` across **6 URLs**, `gold wash plant for sale` and
  `wash plants` across **5** each. `wash plants` sits at *exactly* the same five
  positions as three weeks ago (28/45/67/79/92). Titles are already
  differentiated (that was the right 22 July fix); the remaining split is body
  copy + internal linking. **This is the highest-return work outstanding.**
- **The money pages were the thinnest pages on the site** — 265–309 words, ranking
  29th–63rd for their own terms while the homepage ranked 8th. Each product page
  gained a model-specific FAQ + `FAQPage` schema answering cost / water / power /
  feed size / fine gold / international shipping, every answer linking into the
  existing blog cluster (which also unstrands the blog). Now **629–655 words**.
  All facts taken from each page's own spec table; nothing invented.
- **The 293 "not indexed" pages are mostly benign.** The site publishes 57 pages,
  so ~283 of them are legacy goldwatchproject.com WordPress URLs. Verified all 56
  sitemap URLs return **200 with no redirect hops**, and no location/product/blog
  pair exceeds 70% body-text similarity — so neither redirects nor duplicate
  content is the cause. **The number that matters is 46 indexed of 56 indexable**
  — ~10 real pages missing. Needs the GSC Pages report to name them.
- **✅ THE MAY MIGRATION REDIRECTS ARE LIVE — and the cause was a single missing
  step, not missing work.** In Cloudflare (GullStack acct `6c00aba9…`) a Bulk
  Redirect List named **`new_site` already existed with exactly these 16
  redirects**, uploaded in May, contents correct — but **Inactive**, with **0 Bulk
  Redirect Rules** in the account. A list does nothing without a rule referencing
  it. Created rule **"goldwatchproject legacy page redirects"** → list flipped
  Active.
  🔴 **That alone did not work.** The zone Redirect Rule "Gold Wash Plants"
  (`All incoming requests` → 301 homepage) still won — **empirically the
  zone-level Single Redirect beats the account-level Bulk Redirect here**, the
  opposite of what phase ordering implies. Tested one path, confirmed, then
  changed the catch-all's match to a custom expression excluding the 16 legacy
  paths. **Verified 16/16 land on target in one hop**, and unmapped legacy URLs
  (`/about/`, `/careers/`, `/2017/02/`, random) still fall through to the
  homepage. ⚠️ Trailing-slash variants are deliberately NOT excluded — the list
  has no trailing-slash sources and `subpathmatching` is off, so `/blog/` must
  stay on the catch-all or it would hit origin.
- **🔴 The GBP has 2 reviews at 3.0 stars — NOT "zero reviews" as the 22 July note
  said.** Read live from `business.google.com/u/1/` (bryce@gullstack.com — the
  personal gmail shows nothing, see [[reference-gbp-account-split]]). Profile is
  **Verified**, 874 W Skyline Dr, Loa UT, 226 customer interactions.
  - **5★** — *Quiet Desperation*, 17 Jul 2025, "Works well and keeps on working."
  - **1★** — *Abel Madiyanouba*, ~41 weeks ago, photo attached. **The owner's own
    public reply reads "We went through our records and can't find a record of
    you."** That single review is the entire reason the rating is 3.0 rather than
    5.0. **A review from someone who was never a customer is normally removable
    under Google's policy — filing that is the single cheapest win on this
    account right now.**
  - ⚠️ **None of the three homepage testimonials (Mike R. / James T. / Kwame A.)
    appear as Google reviews**, so nothing we hold corroborates them. Not proof
    they are fake — could be email or WhatsApp customers — but they remain
    unverifiable. Asked Chase directly.
  - ⚠️ **There is a Google Ads campaign on this profile and it is PAUSED.** Nobody
    has mentioned Ads on this account in any prior session. Worth asking who set
    it up, what it spent, and whether it should resume.
- **🔴 CORRECTION TO MY OWN FRAMING, same session.** I called that redirect map
  "the biggest win on the account" and said the blanket redirect was wasting the
  132 referring domains. **Overstated — I checked the backlinks afterwards and
  they do not support it.** SEMrush: `https://goldwatchproject.com/` has **69
  referring domains**, `http://goldwatchproject.com/` has **26**, and **every
  other legacy URL has 0**. So ~95 of the domains point at the old *homepage*,
  which was already redirecting homepage→homepage correctly. The deep pages this
  map fixes have no external links. The referring domains are also mostly spam
  (AS 6: `analyticshaven.top`, `blogsphere.top`, `cheapsmmprovider.online`); only
  `juniorminers.com` (AS 22) looks real. **Real value = correct landing page for
  humans + removes a soft-404 pattern. NOT link-equity recovery — do not sell it
  as one.** The highest-return work is the cannibalization above.
  **Standing lesson: check where the backlinks actually point before valuing a
  redirect map.**
- **🔴 `/products/300-ton/` contradicts itself about sluice length, live.** Spec
  table + schema say **50 feet**; meta description, hero and body say **60 ft**.
  Four places, two answers. Product fact — **not guessed.** One question for Chase.
- **⚠️ Two checkouts of this repo exist.** `~/Documents/clients/goldwashplants` is
  canonical (`main`, current with origin). **`~/Code/goldwashplants-site` is on the
  unmerged May branch, three months behind — do not work in it.**
- `/hq` SEO block refreshed to today's pull (`a1d25f1`) — it had been showing
  22 July numbers to the client. Added a `was` field so the July→August slide is
  visible in the dashboard rather than implied.
- Verified: 57 pages build clean, **120 JSON-LD blocks, 0 invalid**, 0 images
  missing alt, 0 relative `../images/` refs remain, 0 duplicate titles or
  descriptions, canonicals self-referential everywhere except the noindexed `/hq/`.
- **Still open from 22 July, untouched:** Phase 1 spam-filter fixes (LLC names,
  `y`-as-vowel), lead DB rebuild, GBP posting calendar. Six pages still carry no
  JSON-LD (`/blog/`, `/compare/`, `/contact/`, `/examples/`, `/privacy/`,
  `/terms/`), and `/contact/` is **86 words**.

**Next:** **de-cannibalize the 8 split terms — highest return available** · start
collecting real Google reviews (zero today) · ask Chase the 300-ton sluice
question + whether the three testimonials are real people · pull the GSC Pages
report for the ~10 unindexed pages · Phase 1 spam-filter fixes · schema on
`/contact/` + `/blog/`.

### 2026-07-22 — Flagged-lead diagnosis + client Flight Deck at /hq

- **The "flagged lead" scare was bots, not lost leads.** Four
  `turnstile_missing` notifications hit Chase 7/20-7/22, all with the same
  fingerprint: name `test`, message `Test submission.`, phone
  `202-555-0123` (a reserved fake), only the email rotating
  (`harinee@prayani.com`, `dratcliffe@earthlink.net`). These are scripted
  POSTs straight to `/api/submit-lead`, bypassing the page — hence no
  token. Verified the widget is healthy: loaded `/contact/` in a real
  browser, Turnstile rendered and issued a valid token. Genuine
  submissions are unaffected and real leads are flowing unflagged.
- **Two real false-positive bugs found in `looksLikeSpam()`** (still
  OPEN — not fixed this session, they're Phase 1 of the roadmap):
  1. `/[^aeiou]{5,}/` rejects any company name ending in **LLC**
     ("Martian gold miners LLC" → `...minerSLLC`). Hit a real Alaska
     200-ton lead on 7/12.
  2. `isGibberish()` on the email local part treats **y as a consonant**,
     so `dyby6178@gmail.com` has "no vowels". Hit a real lead 5/27.
  Both were still emailed (flagged-but-delivered), so nothing was lost —
  but Chase may have discounted them. Fix: allowlist LLC/Inc/Corp/Ltd,
  count `y` as a vowel, rate-limit the endpoint, hard-drop `test` +
  555-number submissions.
- **Lead data reality check**: the 2026-05-26 Supabase export has 341
  rows but only **33 are genuine**. Mar 20-22 was a single bot flood of
  ~187 multilingual "I wanted to know your price" submissions
  (`Robertunsot`, `mabuka@aol.com`, `008davidd@gmail.com`). Anyone reading
  the raw export will badly overcount. Total real leads on record: **53**.
- **Shipped [5c8235f](https://github.com/Gull-Stack/goldwashplants-site/commit/5c8235f) — client Flight Deck at `/hq`.** Standalone Nunjucks page
  (`src/hq/index.njk`, `layout: null`), PIN-gated (**1849**, sessionStorage,
  client-side only — obscurity not security), `noindex` + disallowed in
  robots.txt + excluded from collections/sitemap. Four sections: Leads,
  Search standing, Roadmap, Production queue.
- **Data lives in `src/_data/hq.js`** — a flat file on purpose. The lead
  DB is still gone (see 2026-06-24) and this site has no paid backend.
- **Live SEMrush numbers (7/22)**: Authority Score **8** (was 7), **161**
  organic keywords, **137** organic visits/mo, **131** referring domains.
  Every tracked position is **flat** — zero movement, which is the whole
  argument for the roadmap.
- **Biggest SEO finding — cannibalization.** Six terms are split across
  2-5 URLs each: `wash plants` ranks 28/45/67/79/92 (five URLs),
  `gold wash machine` 16/33/51, `gold wash plant for sale` 4/31/47.
  Consolidating is the cheapest available gain, no new content needed.
  Biggest single prize: `gold wash plant` (390/mo, KD 0) stuck at **#7**.
- **`scripts/seo-sync.mjs`** refreshes the SEMrush block on demand
  (`SEMRUSH_API_KEY=xxx node scripts/seo-sync.mjs`). It prints a
  paste-ready `seo` object rather than rewriting the data file, because
  the roadmap prose is hand-written against those numbers. Key lives in
  `kingmaker-hq/.env.local`; it is **not** yet a shared Vercel env var.
- **Pick up next**: (1) ship the Phase 1 spam-filter fixes above;
  (2) rebuild the lead DB so there's an audit trail again; (3) start the
  GBP posting calendar — profile is claimed and live but dormant, and
  the site has **zero reviews**, which is the biggest local handicap;
  (4) write the 6 queued blog posts. Over half of all enquiries are
  international (Ghana, Chad, Guyana, PNG, Mozambique, Perú, Australia)
  and the site says nothing about shipping, containerisation or duty —
  that page is probably the highest-value single piece of content.

### 2026-06-24 — Domain re-registration + lead pipeline 500 fix

- **Domain**: goldwashplants.com had **expired**; Bryce repurchased it
  (Namecheap, now valid through Jun 16 2027, auto-renew ON) and moved
  nameservers to **Cloudflare** (`mary/ram.ns.cloudflare.com`). Verified
  live via DNS-over-HTTPS (Google + Cloudflare DoH): apex + www resolve to
  Vercel, email is on Google Workspace MX + `v=spf1 include:_spf.google.com
  ~all` + SendGrid DKIM (`s1/s2._domainkey`) + DMARC — all correct. Site +
  email fully restored. (Future-debug heads-up: this sandbox's DNS resolver
  served **stale cached parking records** `mx.plingest.com` / `v=spf1 -all`
  for a long time — a red herring. Confirm goldwashplants DNS via DoH, not
  `dig`, in this environment.)
- **Real bug — quote/contact form returned 500.** Root cause: the Supabase
  project `jnpinscmjciysrhpgjyp.supabase.co` was **deleted** (NXDOMAIN —
  Supabase permanently removes free projects left paused too long). The
  unguarded insert `fetch` threw `ENOTFOUND` straight to the catch and
  500'd every submission **before** the email step — so leads were lost
  entirely (no DB row, no SendGrid notification) for the whole outage
  window. Both the homepage form and `/contact/` hit the same endpoint.
- **Shipped** [28c1846](https://github.com/Gull-Stack/goldwashplants-site/commit/28c1846):
  wrapped the Supabase insert + `email_sent` PATCH in `api/submit-lead.js`
  in try/catch so a DB outage is **non-fatal** — it logs and still sends the
  SendGrid notification + customer confirmation and returns 200. Lead
  delivery is now decoupled from the database. Verified live: 200 +
  `[SUPABASE] insert unreachable, continuing to email`.
- The push rebased on top of a **parallel branch fix** that removed the
  nonexistent `notes` column (was causing Postgres 42703) and made flagged
  leads still notify sales. Both are now on `main`.
- **Pick up next — STILL OPEN (separate Supabase account, Bryce only):**
  the lead DB is gone. Form works email-only with no audit trail until it's
  restored. To fully fix: create a new Supabase project + recreate the
  `leads` table (cols: id, name, email, phone, interest, location, message,
  source, status, email_sent, created_at), then update `SUPABASE_URL` +
  `SUPABASE_SERVICE_KEY` in the Vercel project and redeploy. Also assume
  some leads were missed during the outage — cross-check WhatsApp/phone.

### 2026-05-19 — Expand 8 thin location pages

- Rewrote the 8 lightest location pages (Nevada, Arizona, Colorado,
  Idaho, Montana, Oregon, Georgia, Australia). Each went from ~150-200
  words of unique copy on a shared skeleton to a full page: intro
  section, 6-district regions grid with real named districts, a
  "why our equipment" section, and a 4-question FAQ.
- Content is location-specific and factual (real mining districts,
  regional ground conditions, regulations — e.g. Nevada water
  recirculation, Oregon in-stream-vs-bench permitting, Georgia
  private-land access, Australia container shipping).
- Each page now also adds `FAQPage` JSON-LD and links out to relevant
  blog guides + product pages (location -> blog/product internal
  linking).
- Also fixed: removed an emoji from the Australia hero (emoji-free
  policy), fixed "Get a Arizona/Idaho/Oregon Quote" grammar to
  "Get Your {State} Quote", trimmed Idaho + Georgia titles to match
  the standardized location title format.
- Build passes, all JSON-LD validates. Committed + pushed.
- The remaining 9 location pages (Alaska, California + 7 richer
  international pages) were already substantial and left as-is.

### 2026-05-19 — CRITICAL: stylesheet was never linked + internal linking

- **Critical bug found while starting the "expand thin location pages"
  task**: `styles.css` (the stylesheet for every non-homepage page —
  defines `.card`, `.hero-dark`, `.cta-section`, `.section-header`,
  `.spec-table`, `.grid-*`, etc.) is passthrough-copied to `_site/`
  but **was never `<link>`ed in `<head>`**. Only the homepage looked
  right because it carries a full inline `<style>`. All 4 product
  pages, 17 location pages, 22 blog posts, and faq/compare/examples/
  how-it-works/contact were rendering with their main content
  sections almost entirely unstyled on the live site.
- **This reframes the "thin location pages" finding** — those pages
  aren't thin on content (they're 1,000+ words, localized). They were
  visually broken. The fix below repairs ~45 pages at once.
- **Fixed**: added `<link rel="stylesheet" href="/styles.css">` to
  `base.njk`, placed before base's inline `<style>` so the inline
  header/footer rules still win (header stays `position:fixed`).
  Homepage is unaffected — its own inline `<style>` overrides.
- **Internal linking**: new `equipment-callout.njk` partial (self-
  contained styles, 4 product cards + quote CTA) appended to all 22
  blog posts, pushing link equity blog -> product pages.
- Build passes (54 files). Committed + pushed.
- **Pick up next**: now that pages render, re-judge the location
  pages. Nevada/Arizona/Colorado/Idaho/Montana/Oregon/Georgia/
  Australia are genuinely light (~200 words unique vs Alaska's ~800)
  — expansion still worthwhile but no longer urgent. Also still open:
  per-page OG images, image optimization, VideoObject schema.

### 2026-05-19 — Schema + meta cleanup pass

- Second batch from the SEO audit, all template-level, low-risk:
  - **robots.txt**: removed `Crawl-delay: 1` (Google ignores it; Bing
    obeyed it and crawled slower for no benefit).
  - **Homepage schema**: the two blocks (Organization + LocalBusiness)
    were merged into one `Organization`. LocalBusiness had only a
    country-stub address. Kept `aggregateRating` 4.8/127 — **verify
    this is real and backed by collected reviews**, or remove it
    (fake rating markup is a manual-action risk).
  - **HowTo schema** added to `/how-it-works/` (5-step process). Note:
    Google retired HowTo rich results, but it still helps AI/LLM
    answer engines parse the page.
  - **Titles**: trimmed 18 over-length titles (location pages were
    72-83 chars and truncating). Locations standardized to
    "Gold Wash Plants {Place} | Placer Mining Equipment".
  - **Blog dates**: visible "Published" bylines contradicted the
    `datePublished` front-matter on nearly every post, and 6 posts
    had no byline. Added a `readableDate` filter to `.eleventy.js`;
    all 22 posts now render the byline from front-matter so the
    visible date and schema date always agree.
- **Skipped on purpose**: FAQPage schema on the 17 location pages —
  Google restricted FAQ rich results to gov/health sites in 2023, so
  it's not worth 85 Q&A extractions. VideoObject schema — deferred,
  needs real YouTube upload dates.
- Build passes (54 files), all JSON-LD validates. Committed + pushed.

### 2026-05-19 — Unorphan location pages + Product schema

- **Trigger**: Bryce asked why traffic is low; re-ran SEO audit on the
  live site. Two issues were throttling traffic.
- **Fixed #1 — orphaned location pages**: the 17 `/locations/*` pages
  had zero internal links (no nav entry, not in footer) — sitemap-only,
  so Google barely crawled them and they got no link equity.
  - New `src/locations/index.njk` — a `/locations/` hub page, dark
    hero + two card grids (9 US states, 8 international), self-contained
    inline styles (the site's `styles.css` is passthrough-copied but
    never `<link>`ed — pages carry their own CSS).
  - Added "Locations" to header nav (`header.njk`, after Equipment) and
    a new "Locations" footer column (`footer.njk`); bumped
    `.footer-grid` to 5 cols in `base.njk`.
  - Added `/locations/` to `sitemap.xml`.
- **Fixed #2 — product pages had no schema**: `100/200/300-ton` had
  zero JSON-LD (50-ton already had a full Product+Offer block).
  - New `src/_includes/product-schema.njk` — front-matter-driven
    Product schema (brand, manufacturer, model, productID, specs as
    `additionalProperty`). **No Offer/price** on purpose: pages show no
    visible price, so a schema price would mismatch and risk a manual
    action. Added `productModel/productID/productImage/specs`
    front-matter + the include to all three pages.
- **State**: build passes (`npx @11ty/eleventy`, 54 files), all 17
  location pages now linked from the hub, product JSON-LD validates.
  Committed + pushed to `main` → Vercel production.
- **Pick up next session**:
  - Pre-existing bug found: the blog index (`/blog/`) renders `.card`
    /`.grid-3` cards but those classes are defined only in the unlinked
    `styles.css` — blog cards are unstyled on the live site. Either
    `<link>` styles.css from `base.njk` or inline the classes.
  - 50-ton Product schema has `price: 35000` but the page shows no
    price — potential price-mismatch flag in GSC; consider removing the
    Offer block to match the other three.
  - Still outstanding from prior audits: thin location-page copy,
    blog→product internal linking, image optimization, per-page OG
    images, wire `generate-sitemap.sh` into the build.
  - In GSC: resubmit sitemap, Request Indexing on `/locations/` + the
    product pages to speed re-crawl.

### 2026-05-15 — Fix canonical host bug (traffic suppressor)

- **Trigger**: Chase's site getting almost no organic traffic. Ran a full
  SEO audit (searchfit-seo agent) against the live site + codebase.
- **Root cause found**: the whole site was standardized on
  `https://www.goldwashplants.com`, but Vercel serves the **non-www** host.
  Every `<link rel="canonical">`, OG/Twitter URL, JSON-LD `url`/`@id`, and
  all 57 sitemap entries pointed at a URL that 308-redirects. On a small/new
  domain that strands pages in "Crawled - not indexed" and breaks canonical
  consolidation. NOTE: the 2026-05-14 log entry below claims it "fixed
  sitemap host (now matches www canonical)" — that *was* the bug, not a fix.
- **Shipped** [6e913f4](https://github.com/Gull-Stack/goldwashplants-site/commit/6e913f4):
  standardized everything on `https://goldwashplants.com` + set
  `trailingSlash: true` in `vercel.json`. Now canonicals, permalinks (all
  end in `/`), and internal links (all slashed) resolve to a 200 instead of
  a 308 — also kills the internal-link redirect hops the prior session noted.
  Changed: `vercel.json`, `base.njk`, `location-schema.njk`,
  `article-schema.njk`, `index.njk`, `products/50-ton.njk`, `sitemap.xml`,
  `video-sitemap.xml`, `generate-sitemap.sh` (host + slash output fixed so a
  future run won't reintroduce the bug).
- **Verified live**: `goldwashplants.com/locations/ghana/` → 200; non-www
  and non-slash variants → 308 *into* the canonical; live canonical tag
  matches. Deployed to production.
- **Pick up next session** (the audit's bigger findings, NOT yet done):
  - In GSC: resubmit sitemap, run URL Inspection → Request Indexing on key
    pages to speed re-crawl. Watch indexed-page count recover.
  - The 17 location pages are thin doorway pages (9 US-state pages are
    ~120-180 words of unique copy on an identical skeleton). Consolidate to
    2-3 strong regional pages or keep only Alaska+California, 301 the rest;
    expand country pages to 800-1200 words of country-specific detail.
  - Keyword targeting is anchored on low-volume "gold wash plant {geo}".
    Real demand: "gold wash plant for sale/price/cost", "gold trommel"
    (currently 301'd away — own it instead), "placer mining equipment".
  - Internal linking is siloed; the strong 22 blog posts are stranded.
  - `generate-sitemap.sh` still not wired into the build (host now fixed,
    but it goes stale until someone runs it — wire into build or replace
    with eleventy-plugin-sitemap).
  - Images: 8.9MB unoptimized, no WebP/srcset; per-page OG images missing.

### 2026-05-14 — Emoji cleanup, SEO sweep, schema rollout

- **Shipped in three commits**:
  - [01f476a](https://github.com/Gull-Stack/goldwashplants-site/commit/01f476a):
    SVG icon library + emoji cleanup across 41 templates (127 emojis
    replaced). SEO quick wins: meta description tightened, hero H1
    capitalized, removed `<em>` from product image alt text (screen
    readers were reading "less-than em greater-than"), deleted
    duplicate Alaska LocalBusiness, added FAQPage schema to /faq,
    fixed sitemap host (now matches `www.` canonical), stripped
    `.html` from video-sitemap, rewrote 237 internal `.html` hrefs
    to clean URLs (every internal click was a 308 hop), deleted
    deprecated `<meta name="keywords">`.
  - [23e3024](https://github.com/Gull-Stack/goldwashplants-site/commit/23e3024):
    Hero CTAs flipped — primary is gold "Get a Free Quote →"
    anchored to homepage form; WhatsApp demoted to outlined-green
    secondary. Sticky WhatsApp float kept.
  - [01d1fa3](https://github.com/Gull-Stack/goldwashplants-site/commit/01d1fa3):
    Re-localized 6 cloned country pages (Ghana, Tanzania, Congo,
    Guyana, Suriname, South America) — they all had "Africa" in
    the H1/hero/regions. Now country-specific with real mining
    districts. New `src/_includes/location-schema.njk` rolls
    LocalBusiness + Service JSON-LD across all 17 locations. New
    `src/_includes/article-schema.njk` rolls Article + BreadcrumbList
    across 22 blog posts. Two new high-intent posts:
    `/blog/gold-dredge-vs-wash-plant/` and
    `/blog/gold-concentrator-vs-wash-plant/`.
- **Current state**:
  - Site is emoji-free, all SVG (via `icons.njk` macro).
  - Every page that matters for SEO has structured data: homepage
    (Organization + LocalBusiness), products (Product), locations
    (LocalBusiness + Service), blog (Article + Breadcrumb + FAQPage),
    /faq (FAQPage).
  - All internal links are clean `/trailing-slash/` URLs.
  - Sitemap is consistent with canonical (`www.`).
- **Pick up next session** (outstanding from the audit):
  - Re-localized country pages are still light on copy (~300 words);
    consider expanding with permits/customs/incoterms detail per country.
  - `generate-sitemap.sh` exists but isn't wired into the build. Hook
    it into `package.json` `build` or replace with eleventy-plugin-sitemap
    so it auto-stays in sync.
  - No `VideoObject` JSON-LD on pages with YouTube iframes (homepage
    has 4, examples + product pages have more). Easy add.
  - Per-page OG images are missing; everything points at
    `/images/gold-wash-plant.jpg`.
  - Inline `<style>` mobile-menu CSS is duplicated across ~30 files.
    Move to `styles.css`.

### 2026-05-14 — Fix lead drop: homepage form + silent-drop spam filter

- **Shipped** [7617e33](https://github.com/Gull-Stack/goldwashplants-site/commit/7617e33):
  - `src/index.njk` homepage quote form converted from plain HTML POST to
    JS-handled (preventDefault, JSON, inline status, honeypot, location
    field). Was redirecting users to a raw JSON page on submit — almost
    certainly killing the bulk of homepage conversions.
  - `api/submit-lead.js`: removed the `[a-z][A-Z]` name regex that was
    silently rejecting real names (McDonald, DeAngelo, etc.). Turnstile
    failures and spam rejections now save the lead with `status='flagged'`
    and a `notes` reason instead of returning a fake 200 OK. SendGrid is
    skipped for flagged leads so the inbox stays clean.
- **Root cause of the lead drop** (from Supabase audit of 224 historical
  leads): Mar 19–22 a "Robertunsot" bot flooded the form with 183 fake
  submissions in 72 hours. The flood passed all spam heuristics and emailed
  Chase 183 times — probably poisoned his inbox/training so real "Gold Wash
  Plants" lead emails started getting ignored. Cloudflare Turnstile was
  added Mar 22ish (commit `a4995ac`) to stop the flood. It worked, but was
  configured to silently fake-success on missing tokens — eating real users
  whose widget didn't load (ad blockers, slow connections, mobile). Mar→Apr
  real leads dropped 22→9, May→0.
- **Current state**:
  - Form fix + spam-filter loosening deployed to prod.
  - Going forward every submission lands in Supabase (clean as `new`,
    blocked as `flagged`). No more silent drops.
  - WhatsApp CTAs were NOT changed (Bryce flagged them as too prominent but
    deferred the rebalance). wa.me has zero audit trail — leads via that
    channel are invisible to us if Chase misses them.
- **Pick up next session**:
  - Watch leads table 24–48h. Look for `status='flagged'` with reason
    `turnstile_missing` or `turnstile_failed` — those were the silent
    drops; manual contact recovers them.
  - Check Chase's spam folder + ask him to whitelist `leads@gullstack.com`.
  - Revisit WhatsApp prominence: hero CTA is "Chat on WhatsApp" before
    "Get a Quote", and there are 3+ WhatsApp surfaces per page. Consider
    demoting WhatsApp to secondary and making the form the primary CTA.
  - Root `index.html` is stale duplicate code — delete it eventually.
