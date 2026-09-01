# goldwashplants — notes

Durable facts a future session or teammate needs. Not a diary — the dated
narrative belongs in the CLAUDE.md Session Log.

Write for someone who was not in the room: no "as discussed", no bare pronouns.
Never put passwords, API keys, or tokens in this file.

## Who

- (client contacts, who asks for what, who approves)

## Decisions

- (what we chose, and why — the why is the part that ages well)

## Gotchas

- **Form emails go to spam (open as of 31 Aug 2026).** `api/submit-lead.js`
  sends both the visitor auto-reply and Chase's lead alert from `FROM_EMAIL`,
  which defaults to `leads@gullstack.com`. A goldwashplants.com form that
  replies from a gullstack.com address will fail DMARC alignment unless that
  domain is authenticated in SendGrid. Bryce confirmed a test reply landed in
  spam. The contact page now warns visitors to check spam; that is a bandage,
  not the fix. The fix is SendGrid domain authentication (DKIM + SPF) on the
  sending domain, or moving the sender to an authenticated
  goldwashplants.com address.
- (things that broke, and what actually fixed them)

## Links

- (dashboards, live URLs, Notion pages, ticket queues)
