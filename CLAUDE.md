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
