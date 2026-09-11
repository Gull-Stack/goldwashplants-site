// ============================================================================
// lead-spam-filter.js — shared across every GullStack client lead endpoint.
//
// CANONICAL COPY: Gull-Stack/walkthru-labs → shared/lead-spam-filter.js
// Edit it HERE, then run shared/sync-lead-spam-filter.sh to push the copies out.
// A copy inside a client repo is a build artefact. Do not edit it in place.
//
// ---------------------------------------------------------------------------
// WHY THIS EXISTS
//
// Audited every lead across all clients on 2026-09-11. Roughly 60% of what
// reaches a client inbox is not a customer — it is someone selling TO the
// client. Virtual-assistant agencies, web-design pitches, SEO pitches, and one
// business broker asking a contractor whether he wants to sell his company.
//
// The existing guards (honeypot, sub-3-second submit, gibberish name) target
// crude bots. This traffic is outbound B2B sales filling the form the way a
// customer would: real name, real company domain, plausible sentence. It walks
// past all of it. Evidence: the same VA outfit hit D One Builders on 25 June as
// "Liesel Jacobs" and Monterey Bay Door on 10 September as "Denise Richie",
// using the SAME phone number both times, and both got through.
//
// ---------------------------------------------------------------------------
// THE RULE THAT MATTERS: THIS NEVER SILENTLY DROPS A SUBMISSION.
//
// A false positive that eats a real customer costs far more than spam in an
// inbox. So a flagged submission is still delivered — to US, never to the
// client — with the reason attached. Worst case we read one extra email.
// The client's inbox is what gets protected, not the data.
//
// This is the same lesson as the PhlebGuide failure: 26 real leads sat unseen
// for five months because a delivery path failed quietly. Never quiet.
// ============================================================================

// Outbound-sales shops seen hitting client forms. Sender domain is the single
// highest-signal field: nobody emails a contractor from vettedvas.com to book
// a kitchen. Add to this list as new ones appear; keep it to companies whose
// ENTIRE business is outbound prospecting.
const SOLICITATION_DOMAINS = [
  // Virtual assistant / outsourcing agencies
  'vettedvas.com',
  'vasdirect.com',
  'vas4hire.com',
  'virtualeaseservice.com',
  'virtualhelpdesk.pro',
  'virtualhandsupport.com',
  // Agency / media / lead-gen pitches
  'deerbergmedia.com',
  'melottogroup.com',
  // Scraping and list vendors
  'helloscrapeking.com',
  'integribridge.com',
  // Misc B2B blasts seen on client forms
  'globalenginestands.com',
];

// Phrases lifted verbatim from real spam. Matched against the free-text message
// only — never against a name — so a customer called Mr. Broker is unaffected.
const SOLICITATION_PHRASES = [
  // VA pitches
  'virtual assistant',
  'virtual assistants',
  'trained human virtual',
  'vas help you',
  'focus on clients instead of admin',
  // Brokers and acquisition
  'business broker',
  'interested in purchasing businesses',
  'buyers interested in purchasing',
  'are you interested in selling',
  'interested in selling your business',
  // Web / SEO / marketing pitches
  'your site looks like it',
  'noticed your site',
  'noticed your website',
  'your website looks',
  'came across you guys online',
  'first page of google',
  'improve your ranking',
  'rank higher on google',
  'increase your traffic',
  'i can help you get more customers',
  // Newsletter-harvest and list-building templates
  'please add me for news',
  'send me updates about',
  'i would like more information. please contact me by email',
  // Product blasts
  'let you know about our new',
  'we offer trained',
];

// Our own testing. These should never have counted as leads, and they have been
// padding the numbers: ten of the last fifty lead emails were ours.
const TEST_MARKERS = [
  'zz test',
  'claude test',
  'claude-',
  'test from claude',
  'please ignore',
  'delivery test',
  'lead-capture check',
  'migration check',
  'replyto check',
  'prod intake',
  'dupe test',
  'nophone test',
  'state fix',
  'copy check',
  'intake test',
];

// Our own addresses. A submission from one of these is us, not a customer.
const INTERNAL_DOMAINS = ['gullstack.com', 'walkthrulabs.com', 'cerealgrowth.com'];

function normalise(s) {
  return String(s == null ? '' : s).toLowerCase().trim();
}

function domainOf(email) {
  const m = normalise(email).match(/@([a-z0-9.-]+)$/);
  return m ? m[1] : '';
}

// 555-0100 through 555-0199 in ANY area code is the block reserved for fiction
// (NANP / ATIS-0300115). Four Osborne "leads" in September used 202-555-01xx.
// A real customer never has one of these.
function isReservedPhone(phone) {
  const d = String(phone == null ? '' : phone).replace(/\D/g, '');
  const ten = d.length === 11 && d[0] === '1' ? d.slice(1) : d;
  if (ten.length !== 10) return false;
  const exchange = ten.slice(3, 6);
  const line = parseInt(ten.slice(6), 10);
  return exchange === '555' && line >= 100 && line <= 199;
}

/**
 * Classify a form submission.
 *
 * @param {object} data
 *   name, email, phone, message  — the usual fields. Extra keys are ignored.
 *   Pass any additional free-text fields (details, notes, projectType…)
 *   concatenated into `message`, or via `extraText`.
 *
 * @returns {{verdict: 'clean'|'solicitation'|'test', reasons: string[]}}
 *   'clean'        — deliver to the client as normal.
 *   'solicitation' — someone selling to the client. Send to us only.
 *   'test'         — ours. Send to us only, and keep it out of lead counts.
 */
function classifyLead(data) {
  const d = data || {};
  const name = normalise(d.name);
  const email = normalise(d.email);
  const domain = domainOf(email);
  const text = normalise([d.message, d.extraText, d.details, d.notes].filter(Boolean).join(' '));
  const haystack = `${name} ${text}`;
  const reasons = [];

  // --- ours, checked first so a test never reads as spam -------------------
  if (INTERNAL_DOMAINS.includes(domain)) reasons.push(`internal_domain:${domain}`);
  for (const marker of TEST_MARKERS) {
    if (haystack.includes(marker)) { reasons.push(`test_marker:${marker}`); break; }
  }
  if (reasons.length) return { verdict: 'test', reasons };

  // --- someone selling to the client ---------------------------------------
  if (domain && SOLICITATION_DOMAINS.includes(domain)) {
    reasons.push(`solicitation_domain:${domain}`);
  }
  for (const phrase of SOLICITATION_PHRASES) {
    if (text.includes(phrase)) { reasons.push(`solicitation_phrase:${phrase}`); break; }
  }
  if (isReservedPhone(d.phone)) reasons.push('reserved_555_phone');

  if (reasons.length) return { verdict: 'solicitation', reasons };
  return { verdict: 'clean', reasons: [] };
}

// CommonJS export ON PURPOSE, even though most callers are ES modules.
// The client endpoints are a mix: three use `export default handler`, Edge
// Energy uses `module.exports`. A CJS module can be required by the CJS one AND
// named-imported by the ESM ones (Node's cjs-module-lexer reads this exact
// `module.exports = { ... }` shape), so this single file serves both. An ESM
// module would have broken the CommonJS caller.
//
// ESM callers must use the explicit extension:
//   import { classifyLead } from './lead-spam-filter.js'
module.exports = {
  classifyLead,
  isReservedPhone,
  SOLICITATION_DOMAINS,
  SOLICITATION_PHRASES,
  TEST_MARKERS,
  INTERNAL_DOMAINS,
};
