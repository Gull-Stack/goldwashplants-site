// Gold Wash Plants - Lead Submission API
// Stores leads in Supabase + emails via SendGrid

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SALES_EMAIL = process.env.SITE_EMAIL || 'sales@goldwatchproject.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'sales@goldwatchproject.com';

async function sendEmail({ to, from, subject, html, replyTo }) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
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
    const { name, email, phone, interest, location, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const leadData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      interest: interest || null,
      location: location?.trim() || null,
      message: message?.trim() || null,
      source: 'goldwashplants.com',
      status: 'new',
      email_sent: false,
      created_at: new Date().toISOString(),
    };

    // Insert into Supabase (if configured)
    let savedLead = null;
    if (SUPABASE_URL && SUPABASE_KEY) {
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
      }
    }

    // Send confirmation to lead
    if (SENDGRID_API_KEY) {
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

      // Send notification to sales
      const notificationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
        subject: `🔔 New Lead: ${leadData.name} - ${leadData.interest || 'General Inquiry'}`,
        html: notificationHtml,
        replyTo: leadData.email,
      });

      // Mark email as sent in Supabase
      if (savedLead?.[0]?.id && SUPABASE_URL && SUPABASE_KEY) {
        await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${savedLead[0].id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ email_sent: true }),
        });
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
