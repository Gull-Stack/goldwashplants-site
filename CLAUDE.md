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

## Session Log

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
