# Deployment Notes

This repository is the current GitHub backup for `studio2800.com`, not the source of truth for automatic production deploys unless explicitly connected later.

## Current Production Path

1. Local source is maintained in:
   `/Users/jasondanyliw/Documents/Codex/2026-06-15/build-a-website`
2. Static public files are in:
   `outputs/`
3. Cloudflare Pages serves:
   `studio2800.com`, `www.studio2800.com`, and `studio2800.pages.dev`
4. Dynamic functions are handled by:
   `cloudflare-api/src/index.js`
5. Data is stored in:
   Cloudflare D1 database `studio2800-leads`

## Before Deploying Static Pages

- Create a rollback marker.
- Confirm `public/_headers` includes security headers.
- Confirm `public/_redirects` includes expected redirects.
- Test home, services, admin shell, metrics shell, dashboard, Livestream, signup, login, account, thanks, RSS, sitemap, and robots.
- Check mobile layout for the video carousel and key navigation.
- Do not expose private admin/demo functions publicly.

## Before Deploying Worker API

- Create a rollback marker.
- Run a JavaScript syntax check against `cloudflare-api/src/index.js`.
- Confirm `cloudflare-api/wrangler.jsonc` still points to Worker `studio2800-api`.
- Confirm D1 binding `DB` still targets `studio2800-leads`.
- Confirm required secrets exist in Cloudflare.
- Test `/api/health`.
- Test unauthenticated admin endpoints return HTTP 401.
- Test the public contact form path.

## Rollback Notes

- Latest Worker rollback marker from operational cleanup:
  `rollback-markers/20260818-operational-cleanup-pre-worker-fix/`
- GitHub-ready repo pre-refresh restore archive:
  `rollback-markers/github-ready-repo-pre-refresh-20260818/studio2800.com-source-pre-refresh.tar.gz`

## Netlify

Netlify is legacy backup/reference only. Do not use Netlify for normal production deployment, DNS decisions, or launch decisions unless Jason explicitly reverses the Cloudflare-primary plan.

