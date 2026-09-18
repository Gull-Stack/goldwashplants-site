# goldwashplants — roadmap

What we are trying to do for this client, and what comes next.
Update this when priorities change. Keep it short enough to read in a minute.

## Goal

Chase pays a small retainer ($55–59/mo). The site delivers about two real
leads a week. The open question since 17 Sep 2026 is whether he closes any of
them. If he does, we move to a cut of each sale and build tools that get him
more sales. If he does not, the retainer stays and we spend no more effort.

## Now

- **Waiting on Chase (texted 17 Sep 2026).** He has the 17-lead list and one
  question: how many did he talk to, and did any buy? Nothing below starts
  until he answers.

## Next (only if Chase says leads turn into sales)

- Lead-status page on `/hq`: every lead, marked talked / quoted / bought /
  dead. Needs the lead DB rebuilt (Supabase was deleted in June 2026).
- "Pay now" link on quotes via Stripe Connect with an application fee. ACH is
  US-only, so this serves the Alaska and lower-48 buyers, not overseas.
- Site copy from real questions: shipping, containerisation, duty, payment
  terms, diesel power. Over half the leads are overseas and the site says
  nothing about any of it.

## Regardless of his answer

- Fix the `gibberish_email` false positive in `api/submit-lead.js`. Philip
  Parker (7 Sep 2026, Alaska, 50-ton) was flagged and looks real.
- Remove the standing "check your spam folder" note on `src/contact/index.njk`
  once inbox delivery has held (fixed 31 Aug 2026).

## Someday / parked

- Keyword cannibalisation cleanup (6–8 terms split across 2–6 URLs). Highest
  SEO return outstanding, per the 13 Aug 2026 audit. Parked until the retainer
  or a rev-share justifies the hours.
- Google Business Profile posts, photos, and review requests (Phase 2 of the
  `/hq` roadmap).

## Done

- 31 Aug 2026: lead email authenticated on goldwashplants.com; spam problem
  closed.
- 13 Aug 2026: fake reviews and invented prices removed; product-page FAQs
  added; broken product images fixed.
