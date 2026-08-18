# Studio2800 Site Health Findings

Checked on 2026-08-18.

## Current Position

Cloudflare is the active production host for `studio2800.com`. Netlify remains legacy/backup only and should not be used for normal deploys, DNS, or launch decisions.

One live lead-capture defect was found and fixed during this cleanup: the public services form default option was `Studio Central design-partner pilot`, but the Worker submission allowlist did not accept that value. The Worker now accepts the default form option.

## Fixed During This Cleanup

| Severity | Area | Finding | Fix | Verification |
| --- | --- | --- | --- | --- |
| High | Contact form / lead capture | Default public form selection was rejected by `/api/submissions` with HTTP 400. | Added `Studio Central design-partner pilot` to the Worker `allowedProjects` list in `cloudflare-api/src/index.js`. | Deployed Worker version `b56f8fb2-84da-4459-beb7-960e53d801b9`; repeated default-form POST returned HTTP 201 with `email: sent`. |
| Medium | GitHub backup | GitHub backup was stale at commit `d174106` from 2026-06-30 and did not include current Cloudflare production files. | Refreshed `/Users/jasondanyliw/Documents/Codex/2026-06-26/c/outputs/github-ready/studio2800.com` with current `outputs/`, `cloudflare-api/`, and operational docs, then pushed to GitHub. | Remote `git@github.com:s2800-GH/studio2800.com.git` branch `main` now points to commit `7c4032f` (`Refresh Cloudflare production backup`). |

## Verified Live Systems

| Check | Result | Evidence |
| --- | --- | --- |
| DNS nameservers | Pass | `studio2800.com` nameservers resolve to `matias.ns.cloudflare.com` and `lilith.ns.cloudflare.com`. |
| DNS web routing | Pass | `www.studio2800.com` CNAME resolves to `studio2800.pages.dev`; apex `studio2800.com` resolves to Cloudflare edge IPs. |
| Main website | Pass | `https://studio2800.com/` returned HTTP 200 over HTTPS. |
| WWW website | Pass | `https://www.studio2800.com/` returned HTTP 200 over HTTPS. |
| Services page | Pass | `https://studio2800.com/services/` returned HTTP 200 and includes `AI Video Content Creation` plus the public inquiry form. |
| API health | Pass | `https://studio2800-api.jason-danyliw.workers.dev/api/health` returned HTTP 200 and `{"ok":true,"service":"studio2800-api"}`. |
| RSS feed | Pass | `https://studio2800.com/feed.xml` returned HTTP 200 and valid-looking RSS channel/items. |
| Sitemap | Pass | `https://studio2800.com/sitemap.xml` returned HTTP 200 and includes public URLs. |
| Robots | Pass | `https://studio2800.com/robots.txt` returned HTTP 200 and disallows admin/account/login paths. |
| Private demo protection | Pass | `https://demo.studio2800.com/` redirected anonymous access to Cloudflare Access login. |
| Admin submissions API protection | Pass | Unauthenticated `/api/admin/submissions` returned HTTP 401. |
| Admin metrics API protection | Pass | Unauthenticated `/api/admin/metrics` returned HTTP 401. |
| Network dashboard API protection | Pass | Unauthenticated `/api/admin/network-dashboard` returned HTTP 401. |
| Weekly report API protection | Pass | Unauthenticated `/api/admin/monthly-report` returned HTTP 401. |
| Video write protection | Pass | Unauthenticated `PUT /api/videos` returned HTTP 401. |
| Video read endpoint | Pass | Public `GET /api/videos` returned nine YouTube URLs, all set to `https://youtu.be/E18RGsfK7-Y`. |
| Livestream visibility setting | Pass | Public `/api/site-settings` returned `{"livestreamEnabled":false}`. |
| Thank-you page | Pass | `https://studio2800.com/thanks.html` redirects to `/thanks`; the page does not visibly show the private recipient email address. |

## Local Technical Checks

| Check | Result |
| --- | --- |
| Worker JavaScript syntax | Passed: `.tools/node/bin/node --check cloudflare-api/src/index.js`. |
| Public script syntax | Passed: `.tools/node/bin/node --check outputs/script.js`. |
| Admin script syntax | Passed: `.tools/node/bin/node --check outputs/admin.js`. |
| Metrics script syntax | Passed: `.tools/node/bin/node --check outputs/admin/metrics/metrics.js`. |
| Secret exposure scan | Passed for real secret values. Matches found were expected secret names and documentation references, not stored passwords or API keys. |

## Open Issues And Risks

| Severity | Area | Finding | Recommended fix |
| --- | --- | --- | --- |
| Medium | SMS alerts | SMS support is enabled in Worker variables, but sending remains blocked because Twilio sender and destination phone secrets are missing. | Configure `TWILIO_FROM_NUMBER` and `SMS_TO_NUMBER`, or disable `SMS_ENABLED` until ready. |
| Medium | App push fallback | Push fallback support is enabled in Worker variables, but sending remains blocked because Pushover secrets are missing. | Configure `PUSHOVER_APP_TOKEN` and `PUSHOVER_USER_KEY`, or disable `PUSH_ENABLED` until ready. |
| Low | RSS content type and alias | Cloudflare Pages serves `feed.xml` as `application/xml`. The supported feed URL is `https://studio2800.com/feed.xml`; `https://studio2800.com/rss.xml` currently falls back to the homepage. | Optional: add a header rule for `/feed.xml` and create a real `/rss.xml` alias if strict RSS content type or alternate feed URL support is required. |
| Low | Git repository command behavior | Broad Git diff/status commands can be slow in the GitHub-ready repo because it retains the historical Netlify beta archive. Targeted Git commands, commit, push, and remote verification completed successfully. | Consider moving old Netlify zip archives out of the active branch if Git operations become a recurring pain. |

## Deployment And Rollback

- Worker deploy completed on 2026-08-18.
- Current Worker version deployed by this cleanup: `b56f8fb2-84da-4459-beb7-960e53d801b9`.
- Rollback marker created before the Worker/docs edits: `rollback-markers/20260818-operational-cleanup-pre-worker-fix/`.
- Static Cloudflare Pages files were not deployed during this cleanup because the verified defect was Worker-side validation only.

## Manual Follow-Up

1. Check the Studio2800 inbox for the test lead email generated by the post-fix submission test.
2. Decide whether SMS and Pushover should be completed or disabled until actually needed.
