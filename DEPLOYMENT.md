# Deployment Notes

This repo is intended to preserve the Studio2800 site source in GitHub before any future deployment wiring.

## Suggested GitHub Repository

Recommended repository name:

```text
studio2800.com
```

Owner:

```text
s2800-GH
```

## Safe Flow

1. Push this source package to GitHub.
2. Confirm the repository files look correct.
3. Do not enable automatic production deploys until a preview is tested.
4. If using Cloudflare Pages, connect `public/` as the static output folder.
5. If deploying the API Worker, confirm `cloudflare-api/wrangler.jsonc` and all secrets/bindings.

## Required Secrets / Bindings

The code refers to these runtime values, but actual secret values are not stored in this repo:

- `ADMIN_PASSWORD`
- `AUTH_SECRET`
- D1 database binding: `DB`

## GitHub Deploy Key

Create a separate deploy key for this repo. Do not reuse private keys across repos.

Only public SSH keys should be added to GitHub or documentation. Never commit a private key.
