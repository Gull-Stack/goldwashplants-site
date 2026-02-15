# Gold Wash Plants - Leads System Setup

## Overview
Form submissions from goldwashplants.com/contact are stored in Supabase and emailed via OpenClaw.

## 1. Supabase Setup

### Create Table (run in Supabase SQL Editor)

```sql
-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  interest TEXT,
  location TEXT,
  message TEXT,
  source TEXT DEFAULT 'goldwashplants.com',
  status TEXT DEFAULT 'new',
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email_sent ON leads(email_sent);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (API access)
CREATE POLICY "Service role can do everything" ON leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## 2. Vercel Environment Variables

Add these to Vercel project settings (goldwashplants-site):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get these from Supabase Dashboard → Settings → API

## 3. OpenClaw Cron Job (add later)

Once `gog` is authenticated with leads@gullstack.com, add this cron job:

```json
{
  "name": "Gold Wash Plants Lead Notifier",
  "schedule": { "kind": "every", "everyMs": 300000 },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "Check Supabase for new Gold Wash Plants leads (email_sent=false). For each new lead, send an email to [CHASE_EMAIL] from leads@gullstack.com with the lead details, then mark email_sent=true in the database."
  }
}
```

## 4. Testing

1. Deploy to Vercel
2. Submit test form at goldwashplants.com/contact
3. Check Supabase table for new row
4. Verify email_sent = false (waiting for cron)

## 5. SuperTool Integration (future)

The `leads` table can be queried by SuperTool to display:
- All leads by source
- Lead status (new, contacted, converted, lost)
- Conversion metrics

Query example:
```sql
SELECT * FROM leads 
WHERE source = 'goldwashplants.com' 
ORDER BY created_at DESC;
```

---

## API Endpoint

**POST /api/submit-lead**

Request body:
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+1-555-123-4567",
  "interest": "200-ton",
  "location": "Alaska",
  "message": "Looking for a wash plant for my claim..."
}
```

Response (success):
```json
{
  "success": true,
  "message": "Thank you! We'll be in touch within 24 hours.",
  "leadId": "uuid-here"
}
```

Response (error):
```json
{
  "error": "Name and email are required"
}
```
