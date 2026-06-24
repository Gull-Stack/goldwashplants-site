// Gold Wash Plants - Lead Submission API
// Stores leads in Supabase + emails via SendGrid

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SALES_EMAIL = process.env.SITE_EMAIL || 'chase@goldwashplants.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'leads@gullstack.com';
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

// === SPAM PROTECTION ===
function isGibberish(text) {
  if (!text || text.length < 2) return false;
  const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length < 2) return false;
  const vowels = cleaned.match(/[aeiou]/g);
  if (!vowels || vowels.length < cleaned.length * 0.15) return true;
  if (/[^aeiou]{5,}/i.test(cleaned)) return true;
  return false;
}

function looksLikeSpam(data) {
  const { name, website, _timestamp, email, message } = data;
  if (website) return 'honeypot';
  if (_timestamp) {
    const elapsed = Date.now() - parseInt(_timestamp, 10);
    if (elapsed < 3000) return 'too_fast';
  }
  if (isGibberish(name)) return 'gibberish_name';
  if (name && name.trim().length < 2) return 'short_name';

  // Truly non-name characters (URLs, code, pipes). Allow apostrophes, hyphens, dots, spaces, diacritics.
  if (name && /[|<>{}[\]\\\/~`^]/.test(name)) return 'suspicious_name_chars';

  // NOTE: previous version rejected any single-word mixed-case name (e.g. "McDonald",
  // "DeAngelo", "MacGregor", "LaShawn") as a bot. That dropped real leads silently.
  // Mixed case alone is not a spam signal.

  // Gibberish email local part (before @)
  if (email) {
    const localPart = email.split('@')[0];
    if (isGibberish(localPart)) return 'gibberish_email';
    // Spam/affiliate email domains
    const spamDomains = /@.*(affiliate|marketing|seo-|bulk|promo|blast|leads|spammer|filler|nosefiller)/i;
    if (spamDomains.test(email)) return 'spam_email_domain';
    const disposable = /@(mailinator|guerrillamail|tempmail|throwaway|yopmail|sharklasers|grr\.la|guerrillamailblock|dispostable|maildrop|cool-affiliates)\./i;
    if (disposable.test(email)) return 'disposable_email';
  }

  // Block common spam patterns in message
  if (message) {
    const spamPatterns = /\b(viagra|casino|crypto|bitcoin|lottery|prize|winner|click here|buy now|free money|nigerian|prince|seo services|web design services|backlink|link building)\b/i;
    if (spamPatterns.test(message)) return 'spam_content';
    // ANY URL in message that isn't goldwashplants.com = suspicious
    const urls = message.match(/https?:\/\/[^\s)]+/g) || [];
    const externalUrls = urls.filter(u => !u.includes('goldwashplants.com'));
    if (externalUrls.length > 0) return 'external_url';
    // Message completely irrelevant to gold mining (no mining/equipment keywords in a short message with a URL)
  }

  return false;
}

async function sendEmail({ to, from, fromName, subject, html, replyTo, cc }) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], ...(cc ? { cc: [{ email: cc }] } : {}) }],
      from: { email: from, name: fromName || 'Gold Wash Plants' },
      reply_to: replyTo ? { email: replyTo } : undefined,
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  return response.ok;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, phone, interest, location, message, website, _timestamp } = req.body;
    const turnstileToken = req.body['cf-turnstile-response'];

    // Turnstile verification (if secret is configured)
    let flaggedReason = null;

    if (TURNSTILE_SECRET) {
      if (!turnstileToken) {
        console.log(`[TURNSTILE FLAG] reason=missing_token name="${name}" email="${email}"`);
        flaggedReason = 'turnstile_missing';
      } else {
        const tsResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${encodeURIComponent(TURNSTILE_SECRET)}&response=${encodeURIComponent(turnstileToken)}`,
        });
        const tsResult = await tsResponse.json();
        if (!tsResult.success) {
          console.log(`[TURNSTILE FLAG] reason=failed_verification name="${name}" email="${email}" errors=${JSON.stringify(tsResult['error-codes'])}`);
          flaggedReason = 'turnstile_failed';
        }
      }
    }

    if (!flaggedReason) {
      const spamReason = looksLikeSpam({ name, website, _timestamp, email, message });
      if (spamReason) {
        console.log(`[SPAM FLAG] reason=${spamReason} name="${name}" email="${email}"`);
        flaggedReason = spamReason;
      }
    }

    // Honeypot is filled only by bots — hard drop (no save, no email).
    // Every other flag is uncertain (a real visitor's Turnstile widget can
    // fail), so those are saved AND emailed below, marked for review.
    if (flaggedReason === 'honeypot') {
      return res.status(200).json({ success: true, message: "Thank you! We'll be in touch within 24 hours." });
    }

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // NOTE: no `notes` column exists on the leads table — including it made
    // every insert fail (Postgres 42703) and silently lost the lead. The flag
    // reason is preserved in `message` and `status` instead.
    const leadData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      interest: interest || null,
      location: location?.trim() || null,
      message: flaggedReason
        ? `${message?.trim() || ''}\n\n[auto-flagged: ${flaggedReason}]`.trim()
        : (message?.trim() || null),
      source: 'goldwashplants.com',
      status: flaggedReason ? 'flagged' : 'new',
      email_sent: false,
      created_at: new Date().toISOString(),
    };

    // Insert into Supabase (if configured). Non-fatal: if the DB is
    // unreachable (paused/deleted project, network error) we log and keep
    // going so the lead still reaches sales via email instead of 500ing.
    let savedLead = null;
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(leadData),
        });

        if (response.ok) {
          savedLead = await response.json();
        } else {
          console.error(`[SUPABASE] insert failed status=${response.status} ${await response.text().catch(() => '')}`);
        }
      } catch (dbErr) {
        console.error('[SUPABASE] insert unreachable, continuing to email:', dbErr?.cause?.code || dbErr?.message || dbErr);
      }
    }

    // Always notify sales (clean OR flagged) so a real lead is never silently
    // dropped; flagged leads are clearly marked for review. The confirmation
    // email to the submitter is sent only for clean leads.
    if (SENDGRID_API_KEY) {
     if (!flaggedReason) {
      const confirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #b8860b 0%, #daa520 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thanks, ${name}!</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="font-size: 16px; color: #333;">We've received your inquiry and our team will contact you within 24 hours with pricing and availability.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
              <p style="margin: 5px 0;"><strong>Interest:</strong> ${interest || 'General inquiry'}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${location || 'Not specified'}</p>
              ${message ? `<p style="margin: 5px 0;"><strong>Message:</strong> ${message}</p>` : ''}
            </div>
            <p style="font-size: 16px; color: #333; margin-top: 20px;">Questions? Reply to this email or call us directly.</p>
          </div>
          <div style="background: #1a1a1a; padding: 20px; text-align: center;">
            <p style="color: #888; margin: 0; font-size: 14px;">Gold Wash Plants — Custom Gold Mining Equipment</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: email,
        from: FROM_EMAIL,
        subject: 'Thanks for contacting Gold Wash Plants!',
        html: confirmationHtml,
      });
     }

      // Send notification to sales — sent for every lead, flagged or not.
      const flagBanner = flaggedReason
        ? `<div style="background:#b00020;color:#fff;padding:12px;text-align:center;font-weight:bold;">&#9888;&#65039; AUTO-FLAGGED: ${flaggedReason} &mdash; verify before trusting this lead</div>`
        : '';
      const notificationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${flagBanner}
          <div style="background: #b8860b; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔔 New Lead!</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.name}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="mailto:${leadData.email}">${leadData.email}</a></td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.phone || 'Not provided'}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Interest:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.interest || 'Not specified'}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Location:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.location || 'Not provided'}</td></tr>
            </table>
            ${leadData.message ? `<div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #ddd;"><strong>Message:</strong><br/><p style="margin: 10px 0 0 0;">${leadData.message}</p></div>` : ''}
          </div>
          <div style="background: #1a1a1a; padding: 15px; text-align: center;">
            <p style="color: #888; margin: 0; font-size: 12px;">Lead from goldwashplants.com</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: SALES_EMAIL,
        from: FROM_EMAIL,
        fromName: `${leadData.name} via Gold Wash Plants`,
        subject: `${flaggedReason ? `⚠️ FLAGGED (${flaggedReason})` : '🔔 New Lead'}: ${leadData.name} - ${leadData.interest || 'General Inquiry'}`,
        html: notificationHtml,
        replyTo: leadData.email,
        cc: 'bryce@gullstack.com',
      });

      // Mark email as sent in Supabase (best-effort, never fatal)
      if (savedLead?.[0]?.id && SUPABASE_URL && SUPABASE_KEY) {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${savedLead[0].id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ email_sent: true }),
          });
        } catch (patchErr) {
          console.error('[SUPABASE] email_sent patch failed:', patchErr?.cause?.code || patchErr?.message || patchErr);
        }
      }

    }

    return res.status(200).json({
      success: true,
      message: "Thank you! We'll be in touch within 24 hours.",
      leadId: savedLead?.[0]?.id,
    });

  } catch (error) {
    console.error('Lead submission error:', error);
    return res.status(500).json({
      error: 'Something went wrong. Please try again or contact us directly.',
    });
  }
}
