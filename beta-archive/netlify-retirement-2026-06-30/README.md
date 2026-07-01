# Netlify Retirement Beta Archive

Created: 2026-06-30

Purpose:
- Preserve the old Studio2800 Netlify beta/deployment artifacts before removing Netlify from the active Studio2800 workflow.
- Keep Cloudflare as the production hosting and DNS path for studio2800.com.

Archived:
- `netlify-config/.netlify/netlify.toml`
- `netlify-config/netlify-login.sh`
- `upload-zips/studio2800-netlify-upload-v1.zip` through `studio2800-netlify-upload-v14.zip`

Not archived:
- `.tools/netlify-cli/`
- `.tools/home/Library/Preferences/netlify/config.json`
- `.tools/home/.config/configstore/update-notifier-netlify-cli.json`

Reason:
- The Netlify CLI folder is a large reinstallable dependency cache, about 327 MB.
- The Netlify preferences file contained local account/auth material and must not be committed.
- The update-notifier file is non-project cache.

Security note:
- If Netlify is no longer part of the workflow, revoke/rotate the old Netlify access token from the Netlify account dashboard.
- Do not restore Netlify as a production path unless explicitly choosing a rollback.

Current production decision:
- Cloudflare is the main host for `studio2800.com`.
- Netlify is archived only as a beta/reference fallback.
