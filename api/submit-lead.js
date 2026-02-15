// Gold Wash Plants - Lead Submission API
// Stores leads in Supabase + emails sales@goldwatchproject.com

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SALES_EMAIL = 'sales@goldwatchproject.com';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, interest, location, message } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Prepare lead data
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

    // Insert into Supabase
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase error:', errorText);
      throw new Error('Failed to save lead');
    }

    const savedLead = await response.json();

    // Send email notification to sales
    if (RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Gold Wash Plants <leads@goldwashplants.com>',
            to: SALES_EMAIL,
            subject: `🔔 New Lead: ${leadData.name} - ${leadData.interest || 'General Inquiry'}`,
            html: `
              <h2>New Quote Request from goldwashplants.com</h2>
              <table style="border-collapse:collapse;width:100%;max-width:600px;">
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Name</td><td style="padding:8px;border:1px solid #ddd;">${leadData.name}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;"><a href="mailto:${leadData.email}">${leadData.email}</a></td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Phone</td><td style="padding:8px;border:1px solid #ddd;">${leadData.phone || 'Not provided'}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Interest</td><td style="padding:8px;border:1px solid #ddd;">${leadData.interest || 'Not specified'}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Location</td><td style="padding:8px;border:1px solid #ddd;">${leadData.location || 'Not provided'}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Message</td><td style="padding:8px;border:1px solid #ddd;">${leadData.message || 'None'}</td></tr>
              </table>
              <p style="margin-top:20px;color:#666;">Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PST</p>
            `,
          }),
        });
        
        // Mark email as sent in Supabase
        if (savedLead[0]?.id) {
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
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the whole request if email fails
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Thank you! We\'ll be in touch within 24 hours.',
      leadId: savedLead[0]?.id,
    });

  } catch (error) {
    console.error('Lead submission error:', error);
    return res.status(500).json({
      error: 'Something went wrong. Please try again or contact us directly.',
    });
  }
}
