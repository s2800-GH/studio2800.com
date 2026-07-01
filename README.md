# studio2800.com

Source package for the Studio2800 AI video production website.

Current protected build:
- Build name: Build 1-studio2800-GitHub
- Captured live URL: https://www.studio2800.com/
- Original Codex source folder: `/Users/jasondanyliw/Documents/Codex/2026-06-15/build-a-website`

## Project Structure

- `public/` - static website files for studio2800.com.
- `public/index.html` - main public website.
- `public/signup/`, `public/login/`, `public/account/` - account pages.
- `public/admin.html`, `public/admin/metrics/` - admin and metrics pages.
- `cloudflare-api/` - Cloudflare Worker API source.
- `cloudflare-api/src/index.js` - Worker implementation.
- `cloudflare-api/wrangler.jsonc` - Worker configuration.

## Production Safety

Before any production deploy:

- Keep a rollback build saved.
- Test a preview deployment first.
- Confirm Cloudflare Worker secrets are present:
  - `ADMIN_PASSWORD`
  - `AUTH_SECRET`
- Confirm the D1 database binding is present for the API Worker.
- Do not commit real passwords, API tokens, or private keys.

## Current Notes

- The live `www.studio2800.com` page was reachable when this package was prepared.
- The bare `studio2800.com` request was slow/timed out during one CLI capture attempt, so confirm both apex and `www` before any DNS or production changes.
