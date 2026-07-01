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

Use this public SSH key as a GitHub deploy key for the repository:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICK88VfbN/+paxHQP0AiAML0duyfIdkbRbvjn1fAVfte s2800-GH-studio2800.com
```

GitHub path:

1. Repository `Settings`
2. `Deploy keys`
3. `Add deploy key`
4. Title: `Studio2800 Codex Push Key`
5. Paste the public key above
6. Enable `Allow write access`
7. Save

Security note:
- Only the public key belongs in documentation or GitHub.
- Do not commit or share the private key file.
