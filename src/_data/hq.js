// Seed data for the client HQ at /hq.
//
// Deliberately a flat file, not a database: the lead DB (Supabase) was
// deleted in June and this site has no paid backend. Everything here is
// verified against a real source — SEMrush API, the 2026-05-26 Supabase
// CSV export, and the leads@gullstack.com notification archive.
//
// To refresh SEO numbers:  npm run sync:seo   (see scripts/seo-sync.mjs)

module.exports = {
  updated: "2026-08-13",

  // ── SEO ─────────────────────────────────────────────────────────────
  // Source: SEMrush API (domain_ranks + backlinks_overview, us database)
  seo: {
    source: "SEMrush · US database",
    pulled: "2026-08-13",
    overview: [
      { label: "Authority Score", value: "8", note: "flat since May · scale 0-100" },
      { label: "Organic keywords", value: "162", note: "terms ranking in Google top 100 · 161 in July" },
      { label: "Monthly organic traffic", value: "68", note: "estimated visits/mo · was 144 on 15 July" },
      { label: "Referring domains", value: "132", note: "563 total backlinks · 412 follow · +1 domain since July" },
    ],

    // Top organic positions, sorted by traffic contribution.
    // `was` is the 15 July position from the same SEMrush report.
    // Google Business Profile, read live 2026-08-13 (bryce@gullstack.com, /u/1/).
    // Corrects the 2026-07-22 note that said "zero reviews".
    gbp: {
      status: "Verified",
      address: "874 W Skyline Dr, Loa, UT 84747",
      rating: "3.0",
      reviewCount: 2,
      note: "Two reviews only. One 5-star (Quiet Desperation, 17 Jul 2025, \"Works well and keeps on working\"). One 1-star from Abel Madiyanouba, which the owner reply says matches no customer record — that single review is what holds the rating at 3.0. A review from a non-customer is normally removable under Google's policy.",
      ads: "A Google Ads campaign exists on this profile and is PAUSED.",
    },

    keywords: [
      { kw: "gold wash plants for sale",             pos: 3,  was: 3,  vol: 110, kd: 4,  url: "/" },
      { kw: "used small scale gold wash plants",     pos: 2,  was: 2,  vol: 40,  kd: 0,  url: "/" },
      { kw: "gold wash plant for sale",              pos: 8,  was: 4,  vol: 210, kd: 1,  url: "/" },
      { kw: "small scale gold wash plants for sale", pos: 4,  was: 4,  vol: 90,  kd: 0,  url: "/" },
      { kw: "wash plant for sale",                   pos: 6,  was: 6,  vol: 110, kd: 0,  url: "/" },
      { kw: "flour gold",                            pos: 5,  was: null, vol: 480, kd: 6, url: "/blog/fine-gold-recovery/" },
      { kw: "sd-600 wash plant price",               pos: 5,  was: 5,  vol: 110, kd: 2,  url: "/products/" },
      { kw: "sd600 wash plant",                      pos: 3,  was: 3,  vol: 70,  kd: 0,  url: "/products/" },
      { kw: "easy wash plant",                       pos: 5,  was: 5,  vol: 210, kd: 22, url: "/blog/gold-wash-plant-site-preparation/" },
      { kw: "gold trommel wash plant",               pos: 3,  was: 3,  vol: 70,  kd: 5,  url: "/blog/gold-wash-plant-vs-trommel/" },
      { kw: "fine gold recovery equipment",          pos: 4,  was: 4,  vol: 90,  kd: 0,  url: "/blog/fine-gold-recovery/" },
      { kw: "gold wash plant",                       pos: 15, was: 7,  vol: 390, kd: 1,  url: "/" },
      { kw: "gold wash plants",                      pos: 12, was: 5,  vol: 70,  kd: 0,  url: "/" },
    ],

    // Ranked 11-40: one or two positions from real traffic.
    strikingDistance: [
      { kw: "gold processing equipment for sale", pos: 18, vol: 50,  kd: 11 },
      { kw: "gold wash machine",                  pos: 27, vol: 40,  kd: 0 },
      { kw: "rock wash plant",                    pos: 19, vol: 40,  kd: 0 },
      { kw: "mini trommel wash plant",            pos: 28, vol: 70,  kd: 0 },
      { kw: "miller table fine gold recovery",    pos: 26, vol: 50,  kd: 19 },
      { kw: "gold mining machines for sale",      pos: 27, vol: 260, kd: 20 },
      { kw: "wash plants",                        pos: 28, vol: 90,  kd: 0 },
      { kw: "placer mining equipment",            pos: 22, vol: 210, kd: 2 },
    ],

    // Same keyword, multiple competing URLs. Google splits the signal and
    // ranks all of them badly instead of one of them well.
    // Re-measured 2026-08-13: unchanged since July, and two got worse.
    cannibalization: [
      { kw: "easy wash plant",          positions: [5, 27, 36, 42, 48, 55], urls: 6, keep: "/blog/gold-wash-plant-site-preparation/" },
      { kw: "gold wash plant for sale", positions: [8, 29, 43, 52, 63],     urls: 5, keep: "/" },
      { kw: "wash plants",              positions: [28, 45, 67, 79, 92],    urls: 5, keep: "/" },
      { kw: "gold wash plant",          positions: [15, 30, 44, 57],        urls: 4, keep: "/" },
      { kw: "gold wash plants",         positions: [12, 31, 44, 55],        urls: 4, keep: "/" },
      { kw: "gold mining wash plant",   positions: [13, 30, 45, 54],        urls: 4, keep: "/" },
      { kw: "wash plant for gold",      positions: [10, 30, 40, 52],        urls: 4, keep: "/" },
      { kw: "gold wash machine",        positions: [27, 52, 54],            urls: 3, keep: "/" },
    ],
  },

  // ── LEADS ───────────────────────────────────────────────────────────
  leads: {
    note: "Mar 12 – Apr 26 from the Supabase export; Apr 27 – Jul 22 reconstructed from lead notification email. The lead database was deleted in June (free-tier expiry) — email is the system of record until it is rebuilt.",
    totals: {
      real: 53,
      spam: 187,
      spamWindow: "Mar 20-22",
      gapStart: "2026-04-27",
      gapEnd: "2026-05-26",
    },
    byMonth: [
      { month: "Mar 2026", count: 24 },
      { month: "Apr 2026", count: 9 },
      { month: "May 2026", count: 5 },
      { month: "Jun 2026", count: 2 },
      { month: "Jul 2026", count: 13 },
    ],
    byInterest: [
      { interest: "50-ton",  count: 25 },
      { interest: "200-ton", count: 7 },
      { interest: "100-ton", count: 6 },
      { interest: "300-ton", count: 4 },
      { interest: "custom",  count: 3 },
      { interest: "other / unspecified", count: 8 },
    ],
    recent: [
      { date: "2026-07-19", name: "Charbel Hakme",     interest: "50-ton",  location: "Ghana (alluvial)",     note: "Quote request, 50 TPH" },
      { date: "2026-07-18", name: "Jeff Abel",         interest: "50-ton",  location: "Papua New Guinea",     note: "Existing owner — parts/support" },
      { date: "2026-07-17", name: "Massamba Amar",     interest: "200-ton", location: "Mozambique",           note: "19,000-hectare licence" },
      { date: "2026-07-17", name: "Jacob Micheal Reed",interest: "custom",  location: "—",                    note: "Flagged (Turnstile) — repeat enquiry" },
      { date: "2026-07-12", name: "Martian Gold Miners LLC", interest: "200-ton", location: "Alaska",         note: "Flagged in error — real lead" },
      { date: "2026-07-11", name: "Michael Mendoza",   interest: "50-ton",  location: "United States",        note: "" },
      { date: "2026-07-09", name: "Andy Kingston",     interest: "50-ton",  location: "Fairbanks, AK",        note: "Quote request" },
      { date: "2026-07-09", name: "John Fraser",       interest: "300-ton", location: "Ghana",                note: "Prospecting, West Africa" },
      { date: "2026-07-08", name: "Matthew Mendoza",   interest: "50-ton",  location: "United States",        note: "" },
      { date: "2026-07-08", name: "M. Mouguedode Nathan", interest: "50-ton", location: "Chad",              note: "Full-plant quotation" },
      { date: "2026-07-07", name: "Lloyd John Tapis",  interest: "50-ton",  location: "United States",        note: "" },
      { date: "2026-07-06", name: "Duncan",            interest: "other",   location: "Guyana",               note: "" },
      { date: "2026-07-06", name: "Bret Bradlely",     interest: "300-ton", location: "—",                    note: "Wants a plant this season" },
      { date: "2026-06-29", name: "Richard Bradford",  interest: "50-ton",  location: "Alaska, USA",          note: "10 yards/hour" },
      { date: "2026-06-04", name: "R. Miranda Moreano",interest: "50-ton",  location: "Perú",                 note: "Placer, Spanish-language" },
    ],
    insights: [
      "International buyers are over half the pipeline — Ghana, Chad, Guyana, PNG, Mozambique, Perú, Australia. Nothing on the site speaks to shipping, containerisation, or duty.",
      "The 50-ton is the volume seller (25 of 53). The 200/300-ton enquiries are fewer but far larger tickets.",
      "Alaska is the strongest single domestic region — Fairbanks appears repeatedly.",
      "Spam collapsed from 187 in three days to roughly one bot a week once Turnstile went in. The filter is working.",
    ],
  },

  // ── ROADMAP ─────────────────────────────────────────────────────────
  roadmap: [
    {
      phase: "Phase 1",
      window: "Weeks 1-2",
      title: "Stop the leaks",
      status: "ready",
      items: [
        { task: "Consolidate cannibalised keywords — 6 terms currently split across 2-5 URLs each", why: "\"wash plants\" ranks 28/45/67/79/92. One page ranking 20th beats five ranking 45th." },
        { task: "Fix spam-filter false positives (company names ending LLC, vowel-less email handles)", why: "Two confirmed real leads were wrongly flagged." },
        { task: "Rate-limit /api/submit-lead and hard-drop the \"test / 202-555-0123\" bot", why: "Four junk notifications hit Chase's inbox this week alone." },
        { task: "Rebuild the lead database so there's an audit trail again", why: "Since June, a lost email means a lost lead permanently." },
      ],
    },
    {
      phase: "Phase 2",
      window: "Weeks 2-8",
      title: "Google Business Profile engine",
      status: "next",
      items: [
        { task: "Two GBP posts a week, on a fixed calendar", why: "Profile is claimed but dormant. Posts feed Maps rankings and are the cheapest ranking lever available." },
        { task: "Load 20+ geotagged photos and every plant-in-action video", why: "Photo count correlates directly with Maps pack placement." },
        { task: "Seed 8-10 Q&As on the profile (capacity, shipping, lead time, pricing)", why: "Owner-answered Q&As surface in the knowledge panel." },
        { task: "Request reviews from the PNG, Alaska and Ghana customers already delivered to", why: "Zero reviews is the single biggest local-ranking handicap." },
      ],
    },
    {
      phase: "Phase 3",
      window: "Weeks 3-12",
      title: "Content against striking-distance terms",
      status: "next",
      items: [
        { task: "Push \"gold wash plant\" from #7 to top 3", why: "390 searches/mo, KD 0 — the single biggest traffic prize on the board." },
        { task: "Build a page for \"gold mining machines for sale\" (#27, 260/mo)", why: "Second-largest volume term; currently only the homepage limps at it." },
        { task: "Ship the 6 blog posts queued below", why: "The two existing posts already rank #4 and #6. Content demonstrably works on this domain." },
        { task: "International buyer's page — shipping, containerisation, duty, lead times", why: "Over half of all enquiries are overseas and the site answers none of their questions." },
      ],
    },
    {
      phase: "Phase 4",
      window: "Ongoing",
      title: "Authority",
      status: "later",
      items: [
        { task: "Work the Tier 1-3 listings in docs/BACKLINK_PLAN.md", why: "Authority Score 8 vs competitors at KD 0-9 — roughly 12-15 real links moves the whole domain." },
        { task: "Pitch the mercury-free angle to ICMJ and planetGOLD", why: "The one genuine PR hook this business has." },
      ],
    },
  ],

  // First eight GBP posts, ready to paste.
  gbpCalendar: [
    { week: 1, type: "Product",  title: "50-ton plant — the one most placer operations start with", cta: "Get a quote" },
    { week: 1, type: "Offer",    title: "Free sizing consult: tell us your yardage, we'll spec the plant", cta: "Learn more" },
    { week: 2, type: "Update",   title: "Now shipping to Ghana, PNG and Chad — containerised delivery", cta: "Learn more" },
    { week: 2, type: "Product",  title: "SD-600: specs, throughput and real pricing", cta: "Get a quote" },
    { week: 3, type: "Update",   title: "Mercury-free recovery — why our sluice design matters", cta: "Learn more" },
    { week: 3, type: "Product",  title: "200-ton plant walkthrough (video)", cta: "Get a quote" },
    { week: 4, type: "Update",   title: "Running in clay? What changes on a wash plant build", cta: "Learn more" },
    { week: 4, type: "Offer",    title: "Season build slots — lead times for this year", cta: "Call now" },
  ],

  // Blog queue, each mapped to a real SEMrush term the site nearly ranks for.
  blogQueue: [
    { title: "Gold mining machines for sale: what you actually need at each scale", target: "gold mining machines for sale", vol: 260, pos: 27 },
    { title: "Mini trommel vs full wash plant: where the crossover is",            target: "mini trommel wash plant",       vol: 70,  pos: 24 },
    { title: "Gold processing equipment: a buyer's checklist",                     target: "gold processing equipment for sale", vol: 50, pos: 18 },
    { title: "Large-scale gold mining equipment: 200-300 TPH planning guide",      target: "large scale gold mining equipment", vol: 70, pos: 37 },
    { title: "Miller tables and fine gold: what they do and don't recover",        target: "miller table fine gold recovery", vol: 50, pos: 26 },
    { title: "Shipping a wash plant overseas: containers, duty and lead times",    target: "international buyers",         vol: null, pos: null },
  ],
};
