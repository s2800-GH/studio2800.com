# studio2800.com

Current GitHub backup package for the Studio2800 public website and Cloudflare Worker API.

Refreshed: 2026-08-18

## Current Position

- Primary production host: Cloudflare Pages project `studio2800`.
- Primary domain: `https://studio2800.com/`.
- WWW domain: `https://www.studio2800.com/`.
- API Worker: `studio2800-api`.
- D1 database: `studio2800-leads`.
- Netlify: legacy backup/reference only.

This repository is intended to preserve the current Cloudflare production source. It should not be treated as an automatic deployment source unless Cloudflare Pages is deliberately connected to it and tested first.

## Project Structure

- `public/` - static Cloudflare Pages site output.
- `public/index.html` - Studio Central homepage.
- `public/services/` - Studio2800 services and showcase page.
- `public/admin.html` - protected admin interface shell.
- `public/admin/metrics/` - protected metrics dashboard shell.
- `public/dashboard/` - network dashboard shell.
- `public/Livestream/` - livestream page, hidden unless enabled in admin settings.
- `public/_headers` - Cloudflare Pages security headers.
- `public/_redirects` - Cloudflare Pages redirects.
- `cloudflare-api/` - Cloudflare Worker API source and Wrangler config.
- `cloudflare-api/src/index.js` - Worker implementation.
- `docs/` - current status docs, setup notes, manual, changelog, and operating references.
- `beta-archive/` - historical Netlify backup files retained for reference only.

## Verified State At Refresh

- `studio2800.com`, `www.studio2800.com`, and `/services/` returned HTTP 200 over HTTPS.
- DNS nameservers resolved to `matias.ns.cloudflare.com` and `lilith.ns.cloudflare.com`.
- `www.studio2800.com` resolved to `studio2800.pages.dev`.
- API health returned `{"ok":true,"service":"studio2800-api"}`.
- Worker version verified during cleanup: `b56f8fb2-84da-4459-beb7-960e53d801b9`.
- The public contact form default option was fixed and tested successfully with lead email status `sent`.
- Unauthenticated admin APIs returned HTTP 401.
- Private demo access redirected anonymous visitors to Cloudflare Access.
- `feed.xml`, `sitemap.xml`, and `robots.txt` returned HTTP 200.

## Security Notes

Do not commit secrets. Runtime values live in Cloudflare Worker secrets, Cloudflare DNS/Email Routing, Resend, Twilio, Pushover, Gmail, or the relevant provider.

Important secret names include:

- `ADMIN_PASSWORD`
- `AUTH_SECRET`
- `RESEND_API_KEY`
- `REPORT_TO_EMAIL`
- `REPORT_FROM_EMAIL`
- `LEAD_TO_EMAIL`
- `LEAD_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `SMS_TO_NUMBER`
- `PUSHOVER_APP_TOKEN`
- `PUSHOVER_USER_KEY`

## Operating Rule

Normal change path:

1. Edit and test locally.
2. Create a rollback marker.
3. Deploy to Cloudflare preview when the change affects public pages.
4. Deploy to Cloudflare production only after verification.
5. Refresh this GitHub backup after production is confirmed.

