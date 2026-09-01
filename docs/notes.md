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

- **Form email now sends as goldwashplants.com (fixed 31 Aug 2026).** It used
  to send as `leads@gullstack.com` from a goldwashplants.com form, which does
  not align with this domain's DMARC policy (`p=quarantine`), and a test reply
  landed in spam.
  - goldwashplants.com is authenticated in the GullStack SendGrid account
    (user `u59904785`, domain-auth id `32751941`). Three CNAMEs in Cloudflare,
    all **DNS only** — proxying them breaks SendGrid:
    `em` → `u59904785.wl036.sendgrid.net`,
    `gwp._domainkey` → `gwp.domainkey.u59904785.wl036.sendgrid.net`,
    `gwp2._domainkey` → `gwp2.domainkey.u59904785.wl036.sendgrid.net`.
  - **The DKIM selector is `gwp`, not the usual `s1`/`s2`.** A *different*
    SendGrid account (`u13370908`) already owns `s1._domainkey`,
    `s2._domainkey` and `fwmail` on this domain. Nobody has established what
    still sends through that account, so those records were left alone and a
    custom selector was used instead. Do not overwrite `s1`/`s2` here.
  - Verified 31 Aug 2026 on a real send to bryce@gullstack.com:
    `dkim=pass header.i=@goldwashplants.com header.s=gwp`,
    `spf=pass` (return path `em.goldwashplants.com`),
    `dmarc=pass header.from=goldwashplants.com`, delivered to **inbox**.
  - The root SPF record was left as `v=spf1 include:_spf.google.com ~all`.
    Adding SendGrid is unnecessary — the return path is on
    `em.goldwashplants.com`, which carries its own SPF and aligns under
    relaxed DMARC.
- **`FROM_EMAIL` cannot be read back from Vercel.** It is stored encrypted, so
  `vercel env pull` writes `FROM_EMAIL=""`. The code default in
  `api/submit-lead.js` is the readable source of truth. Also note the Vercel
  CLI cannot add a Preview var for *all* branches — `vercel env add FROM_EMAIL
  preview --value ... --yes` loops on `git_branch_required`. Preview therefore
  falls through to the code default, which is correct.
- **`leads@goldwashplants.com` is a send-only address.** The confirmation email
  invites a reply, so it sets `replyTo: SALES_EMAIL`
  (`chase@goldwashplants.com`). Keep that if the From address changes.
- (things that broke, and what actually fixed them)

## Links

- (dashboards, live URLs, Notion pages, ticket queues)
