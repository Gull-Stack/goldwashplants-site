// Gold Wash Plants - Lead Submission API
// Stores leads in Supabase, ready for OpenClaw email notifications

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

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
