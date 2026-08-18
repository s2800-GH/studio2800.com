# Studio2800 Cloudflare DNS Migration Checklist

Use this worksheet before changing nameservers. Do not delete or overwrite records until each existing record has been copied and verified.

## Current DNS Inventory

Record all existing DNS records from GoDaddy/Netlify before switching:

| Type | Name | Value | TTL | Proxy in Cloudflare | Notes |
| --- | --- | --- | --- | --- | --- |
| A | @ |  | Auto | Proxied if pointing to website | Confirm current production target first |
| CNAME | www |  | Auto | Proxied if pointing to website | Confirm current production target first |
| MX | @ |  | Auto | DNS only | Required for email |
| TXT | @ |  | Auto | DNS only | SPF / verification |
| TXT | _dmarc |  | Auto | DNS only | DMARC if present |
| CNAME/TXT | DKIM selector(s) |  | Auto | DNS only | Email signing if present |
| TXT/CNAME | verification records |  | Auto | DNS only | Google, Netlify, Microsoft, etc. |

## Cloudflare Setup Steps

1. Add `studio2800.com` to Cloudflare.
2. Let Cloudflare scan records, then compare every record against the current DNS inventory.
3. Add any missing MX, TXT, DKIM, SPF, DMARC, and verification records manually.
4. Set website records to proxied only after the site target is confirmed.
5. Leave mail and verification records as DNS only.
6. Keep SSL mode as Full or Full strict when the origin certificate supports it.
7. Only after all records match, update nameservers at the registrar to Cloudflare's assigned nameservers.
8. Verify:
   - `https://studio2800.com/`
   - `https://www.studio2800.com/`
   - `https://studio2800.com/feed.xml`
   - Contact form submission
   - Email receiving and sending
   - Admin login and metrics

## Current Migration Status

Updated 2026-06-25.

- Cloudflare zone: `studio2800.com`
- Cloudflare zone ID: `2a5c8eda6234e6738907b112980f71a7`
- Cloudflare plan: Free Website
- Current Cloudflare status: `pending`
- Current registrar: GoDaddy
- Current observed nameservers:
  - `ns17.domaincontrol.com`
  - `ns18.domaincontrol.com`
- Required Cloudflare nameservers:
  - `lilith.ns.cloudflare.com`
  - `matias.ns.cloudflare.com`
- GoDaddy sign-in blocker: Chrome's saved GoDaddy password was rejected, so the registrar nameserver change still needs a successful GoDaddy login.
- Resume check on 2026-06-25: Cloudflare still observes `ns17.domaincontrol.com` and `ns18.domaincontrol.com`, so the GoDaddy nameserver change has not propagated or has not been completed yet.
- GoDaddy update on 2026-06-25: GoDaddy accepted the custom nameserver change and the Nameservers panel now shows `lilith.ns.cloudflare.com` and `matias.ns.cloudflare.com`. Cloudflare may remain `pending` until nameserver propagation completes.
- Cloudflare check on 2026-06-25 16:42 EDT: clicked `I updated my nameservers` in Cloudflare. Cloudflare dashboard now says it is waiting for the registrar to propagate the new nameservers. API status remains `pending` for now.

### Cloudflare DNS Records Prepared

| Type | Name | Value | Proxy in Cloudflare | Notes |
| --- | --- | --- | --- | --- |
| A | `studio2800.com` | `75.2.60.5` | Proxied | Current website apex target |
| CNAME | `www.studio2800.com` | `velvety-shortbread-4b8e0a.netlify.app` | Proxied | Netlify site target |
| CNAME | `_domainconnect.studio2800.com` | `_domainconnect.gd.domaincontrol.com` | DNS only | GoDaddy service record |
| CNAME | `email.studio2800.com` | `email.secureserver.net` | DNS only | Email service |
| CNAME | `e.studio2800.com` | `email.secureserver.net` | DNS only | Email service |
| CNAME | `ftp.studio2800.com` | `studio2800.com` | DNS only | FTP should not be proxied |
| CNAME | `imap.studio2800.com` | `imap.secureserver.net` | DNS only | Email service |
| CNAME | `mail.studio2800.com` | `pop.secureserver.net` | DNS only | Email service |
| CNAME | `mobilemail.studio2800.com` | `mobilemail-v01.prod.mesa1.secureserver.net` | DNS only | Email service |
| CNAME | `pay.studio2800.com` | `paylinks.commerce.godaddy.com` | DNS only | GoDaddy payment link service |
| CNAME | `pda.studio2800.com` | `mobilemail-v01.prod.mesa1.secureserver.net` | DNS only | Email service |
| CNAME | `pop.studio2800.com` | `pop.secureserver.net` | DNS only | Email service |
| CNAME | `smtp.studio2800.com` | `smtp.secureserver.net` | DNS only | Email service |
| CNAME | `webmail.studio2800.com` | `webmail.secureserver.net` | DNS only | Webmail service |
| MX | `studio2800.com` | `smtp.secureserver.net`, priority `0` | DNS only | Email delivery |
| MX | `studio2800.com` | `mailstore1.secureserver.net`, priority `10` | DNS only | Email delivery |

### Nameserver Change

Completed in GoDaddy on 2026-06-25:

1. Replaced:
   - `ns17.domaincontrol.com`
   - `ns18.domaincontrol.com`
2. With:
   - `lilith.ns.cloudflare.com`
   - `matias.ns.cloudflare.com`
3. GoDaddy showed `Using custom nameservers`.
4. Next verification: confirm Cloudflare changes zone status from `pending` to active after propagation.

## Backup Site Location

Netlify remains the backup hosting location during and after the Cloudflare DNS migration. Keep the Netlify project available as a rollback target:

- Netlify project: `velvety-shortbread-4b8e0a`
- Likely Netlify fallback URL: `https://velvety-shortbread-4b8e0a.netlify.app/`
- Production domain should move through Cloudflare DNS, but the Netlify deployment should not be deleted.
- If Cloudflare routing fails, point the website DNS records back to the Netlify target while troubleshooting.

## Rollback Plan

If the website or email fails after nameserver change:

1. Put website records in DNS only if proxy/SSL is the issue.
2. Restore any missing email records first.
3. If Cloudflare records cannot be corrected quickly, switch nameservers back to the prior registrar nameservers.
4. Keep a screenshot/export of the old DNS records until the migration is stable for 48 hours.
