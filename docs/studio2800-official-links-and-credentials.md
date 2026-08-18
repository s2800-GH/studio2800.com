# Studio2800 Official Links And Credential Reference

Last updated: 2026-08-18

## Production Links

| Purpose | Link |
| --- | --- |
| Main website | https://studio2800.com/ |
| WWW website | https://www.studio2800.com/ |
| Cloudflare Pages preview | https://studio2800.pages.dev/ |
| Admin page | https://studio2800.com/admin |
| Metrics dashboard | https://studio2800.com/admin/metrics/ |
| Network dashboard | https://studio2800.com/dashboard/ |
| Livestream page | https://studio2800.com/Livestream/ - hidden until enabled in Admin |
| RSS feed | https://studio2800.com/feed.xml |
| Sitemap | https://studio2800.com/sitemap.xml |
| API health check | https://studio2800-api.jason-danyliw.workers.dev/api/health |
| API videos | https://studio2800-api.jason-danyliw.workers.dev/api/videos |
| Weekly report API, protected | https://studio2800-api.jason-danyliw.workers.dev/api/admin/monthly-report |
| Lead email test API, protected | https://studio2800-api.jason-danyliw.workers.dev/api/admin/test-lead-email |
| Notification status API, protected | https://studio2800-api.jason-danyliw.workers.dev/api/admin/notification-status |
| Notification failover test API, protected | https://studio2800-api.jason-danyliw.workers.dev/api/admin/test-notification-failover |
| Cloudflare Email Routing | https://dash.cloudflare.com/bd02c969c7d0831d3bb239ffdefe0fdb/email-service/routing |

## Public Studio2800 Network Links

| Channel | Link |
| --- | --- |
| YouTube - S2800 Productions | https://www.youtube.com/@s2800productions |
| Studio2800 website | https://studio2800.com |
| SoundCloud | https://soundcloud.com/studio2800 |
| Studio2800News (AIVN) | https://www.youtube.com/@AIVideoProductionNews |
| Studio2800 Music | https://www.youtube.com/channel/UC-xpelmqYF-FgOr1jPUjUlQ |
| RealTimeLiveTV | https://www.youtube.com/channel/UCbhfhoSOKTlu52o2IHs8yGg |
| X / Twitter | https://x.com/studio2800 |

## Service Inventory

| Service | Role | Cost / status | Credential or owner item |
| --- | --- | --- | --- |
| Agent Overlord | Daily Studio2800 oversight, Boss Agent coordination, project plan, and email report | Local Codex skill plus active automation | Skill folder `/Users/jasondanyliw/.codex/skills/agent-overlord/`; automation id `daily-project-portfolio-status` |
| Cloudflare Pages | Main website hosting | Free tier active | Cloudflare account `jason.danyliw@gmail.com` |
| Cloudflare Worker `studio2800-api` | API, forms, admin, metrics, reports | Free tier active | Worker secrets and Wrangler/Codex access |
| Cloudflare D1 `studio2800-leads` | Database | Free tier active | Bound to Worker as `DB` |
| Cloudflare DNS | DNS for `studio2800.com` | Free tier active | DNS records in Cloudflare zone |
| Cloudflare Email Routing | Free inbound forwarding for domain email | Free tier active | `studio@studio2800.com` and `jdanyliw@studio2800.com` forward to the verified Studio2800 Gmail destination |
| GoDaddy | Registrar | Paid externally | Domain registrar login. Root mail MX records are no longer GoDaddy-hosted. |
| GitHub | Backup/source archive | Free unless upgraded | Existing repo is a stale historical archive until refreshed; see GitHub Backup Status below |
| Resend | Transactional email provider | Free plan active | Account `jason.danyliw@gmail.com`, verified domain `studio2800.com`, `RESEND_API_KEY` secret set |
| Twilio SMS | Optional text-message notification provider | Partially configured | Worker support is deployed with `SMS_ENABLED=true`; account SID and auth token are set, but sender and destination phone secrets are still missing |
| Pushover | Optional app push fallback provider | Feature flag enabled; provider not configured | Worker support is deployed with `PUSH_ENABLED=true`; push remains blocked until Pushover app token and user key secrets are configured |
| Google Ads / AdSense | Future traffic/monetization | Not active for Studio2800 | Google account, publisher/ads IDs when approved |
| YouTube | Video hosting and showcase content | Free unless upgraded | Studio2800/AIVN channel access |

## Agent Overlord Oversight Automation

| Item | Value |
| --- | --- |
| Automation name | Agent Overlord Studio2800 Daily Oversight |
| Automation id | `daily-project-portfolio-status` |
| Cadence | Daily at 10:00 AM America/Detroit |
| Email delivery | Authenticated Gmail account using `to: me` |
| Coordination target | Boss Agent/status workspaces plus Studio2800 website, Cloudflare, AIVN, Studio Central platform, NVIDIA/business collateral, and project documentation |
| Security rule | Do not print passwords, API keys, OAuth tokens, cookies, recovery codes, or private account secrets in reports |

## GitHub Backup Status

Current status as of 2026-08-18:

- Active working folder: `/Users/jasondanyliw/Documents/Codex/2026-06-15/build-a-website`
- Current working folder Git status: not a Git repository.
- Located GitHub-ready package: `/Users/jasondanyliw/Documents/Codex/2026-06-26/c/outputs/github-ready/studio2800.com`
- Located Git remote: `git@github.com:s2800-GH/studio2800.com.git`
- Last located commit: `d174106` from 2026-06-30, `Archive Netlify beta files`
- Current conclusion: this GitHub-ready package is stale compared with the current Cloudflare production source. It is missing current files such as `services/`, `dashboard/`, `Livestream/`, `platform.css`, Studio Central assets, and recent Worker changes.
- Operating rule: treat the found GitHub repo as a historical Netlify/beta archive until a separate approved backup pass refreshes or replaces it with the current Cloudflare production source.

## Credential And Secret Locations

| Credential | Where it lives | Notes |
| --- | --- | --- |
| Cloudflare account login | Cloudflare dashboard account | Do not save the password in project files. |
| Cloudflare API token | Local environment variable `CLOUDFLARE_API_TOKEN` | Required for command-line deploys. |
| Admin password | Cloudflare Worker secret `ADMIN_PASSWORD` on Worker `studio2800-api` | Used for `/admin` and `/admin/metrics/`. |
| Auth signing secret | Cloudflare Worker secret `AUTH_SECRET` on Worker `studio2800-api` | Signs admin and user session tokens. |
| Weekly report recipient | Cloudflare Worker secret `REPORT_TO_EMAIL` on Worker `studio2800-api` | Receives the weekly traffic report. |
| Weekly report sender | Cloudflare Worker secret `REPORT_FROM_EMAIL` on Worker `studio2800-api` | Approved sender for the weekly traffic report. |
| Lead notification recipient | Optional Cloudflare Worker secret `LEAD_TO_EMAIL` on Worker `studio2800-api` | Receives contact form lead emails; falls back to `REPORT_TO_EMAIL`. |
| Lead notification sender | Optional Cloudflare Worker secret `LEAD_FROM_EMAIL` on Worker `studio2800-api` | Approved sender for contact form lead emails; falls back to `REPORT_FROM_EMAIL`. |
| Resend API key | Cloudflare Worker secret `RESEND_API_KEY` on Worker `studio2800-api` | Enables Resend Free transactional email sending. Do not commit this key. |
| Email provider flag | Cloudflare Worker variable `EMAIL_PROVIDER=resend` | Routes email through Resend once `RESEND_API_KEY` exists. |
| Email Service binding | Cloudflare Worker binding `EMAIL` on Worker `studio2800-api` | Used by scheduled traffic reports and lead notification emails. |
| Business email forwarding | Cloudflare Email Routing for `studio2800.com` | `studio@studio2800.com` and `jdanyliw@studio2800.com` forward into the verified Studio2800 Gmail destination. This is inbound forwarding only, not a full mailbox. |
| Cloudflare Email Routing DNS | Cloudflare DNS zone `studio2800.com` | Root MX records point to `route1`, `route2`, and `route3.mx.cloudflare.net`; DKIM and SPF records are present. |
| Notification status route | Protected Worker route `/api/admin/notification-status` | Reports readiness for email, SMS, app push, and failover without exposing secret values. |
| Notification failover route | Protected Worker route `/api/admin/test-notification-failover` | Simulates Twilio failure and tests the app push backup path. |
| SMS provider flag | Cloudflare Worker variable `SMS_PROVIDER=twilio` | Selects the optional SMS provider path. |
| SMS enable flag | Cloudflare Worker variable `SMS_ENABLED=true` | Enables the SMS path; actual sending still requires provider secrets and destination phone. |
| Twilio account SID | Optional Cloudflare Worker secret `TWILIO_ACCOUNT_SID` | Required only when SMS is enabled. Do not commit this value. |
| Twilio auth token | Optional Cloudflare Worker secret `TWILIO_AUTH_TOKEN` | Required only when SMS is enabled. Do not commit this value. |
| Twilio sender number | Optional Cloudflare Worker secret `TWILIO_FROM_NUMBER` | Sender number for outbound texts. |
| SMS destination number | Optional Cloudflare Worker secret `SMS_TO_NUMBER` | Phone number that receives Studio2800 lead/report texts. |
| Push provider flag | Cloudflare Worker variable `PUSH_PROVIDER=pushover` | Selects the optional app push fallback provider path. |
| Push enable flag | Cloudflare Worker variable `PUSH_ENABLED=true` | Enables the app push path; actual sending still requires Pushover secrets. |
| Push fallback flag | Cloudflare Worker variable `PUSH_ON_SMS_FAILURE=true` | Sends app push only when SMS is disabled, blocked, or fails. |
| Pushover app token | Optional Cloudflare Worker secret `PUSHOVER_APP_TOKEN` | Required for app push fallback. Do not commit this value. |
| Pushover user key | Optional Cloudflare Worker secret `PUSHOVER_USER_KEY` | Required for app push fallback. Do not commit this value. |
| Admin account identity | Cloudflare Worker auth and D1 user roles | No public admin email is stored in this reference. |
| D1 database | Cloudflare D1 database `studio2800-leads` | Stores submissions, users, videos, page views, weekly report runs, and errors. |

Secure SMS secret entry helper:

```text
tools/set-studio2800-sms-secrets.sh
```

Run it locally and paste Twilio/SMS values only into the Wrangler prompts. Do not paste Twilio credentials into chat, docs, shell commands, or committed files.

Secure app push secret entry helper:

```text
tools/set-studio2800-push-secrets.sh
```

Run it locally and paste Pushover values only into the Wrangler prompts. Do not paste push tokens into chat, docs, shell commands, or committed files.

## Weekly Traffic Report

The Worker `studio2800-api` has an hourly Cloudflare Cron Trigger. Worker logic sends the weekly report once per week on Monday after the configured Detroit local send hour.

Cloudflare API verification confirms:

- Weekly report endpoint exists. The protected URL remains `/api/admin/monthly-report` for compatibility.
- Scheduled handler exists.
- `monthly_report_runs` audit table exists in Worker initialization and now stores weekly period keys.
- `EMAIL` binding is attached.
- Report sender/recipient secrets are present.
- Hourly cron trigger is active.
- Production D1 `monthly_report_runs` table exists.

Current schedule: Monday at or after 9 AM America/Detroit. Forced live test completed on 2026-07-18 for `week-2026-07-13`; Resend returned `sent` with the SVG attachment. The separate lead notification test has also passed through Resend.

## Lead Submission Email Alerts

Contact form leads are saved to D1 first, then the Worker sends a Studio2800-styled HTML email through Resend when `RESEND_API_KEY` exists. If Resend is not configured, the Worker falls back to the Cloudflare `EMAIL` binding. If the email send fails, the lead remains saved and the failure is logged to `site_errors`.

Optional SMS/text alerts follow the same safety pattern. When `SMS_ENABLED=true` and Twilio secrets are configured, the Worker sends a short lead text and weekly report summary text. If SMS fails, the lead/report email path still continues and the SMS issue is logged to `site_errors`.

Optional app push fallback alerts follow SMS. When `PUSH_ENABLED=true` and Pushover secrets are configured, the Worker sends a push alert if Twilio SMS is disabled, blocked, or fails. If push fails, the lead/report email path still continues and the push issue is logged to `site_errors`.

Twilio expiration/failure process:

- If Twilio returns an API error, loses sender eligibility, expires, or is missing phone secrets, the Worker treats SMS as not sent.
- Lead and weekly report emails still send through Resend.
- If `PUSH_ON_SMS_FAILURE=true` and Pushover secrets are configured, the Worker sends an app push backup.
- The Admin `SMS and app backup` panel shows whether SMS, app push, and automatic failover are ready.

Admin test path:

- Log into https://studio2800.com/admin
- Open the Notifications section and select `Refresh status`
- Select `Test failover` only after Pushover secrets are configured
- Open the Form submissions section
- Select `Send test email`
- Confirm the styled email arrives in the configured Studio2800 inbox
- Select `Send test text` only after SMS has been enabled and Twilio secrets are configured
- Select `Send test push` only after Pushover secrets are configured

Current status as of 2026-08-18:

- Worker and Pages updates are deployed.
- `LEAD_FROM_EMAIL`, `LEAD_TO_EMAIL`, and `REPORT_FROM_EMAIL` secrets are set.
- The authenticated test reaches the Worker.
- Resend is the active transactional email path. Cloudflare native Email Sending remains a paid fallback option if Workers Paid is added later.
- Worker version `b56f8fb2-84da-4459-beb7-960e53d801b9` is configured with `EMAIL_PROVIDER=resend`, weekly report scheduling, SMS support enabled, and app push failover support enabled.
- Cloudflare Pages deployment `dd6870b6` includes `Send test email`, `Send test text`, `Send test push`, notification status, and notification failover testing.
- Resend account has been created/signed in under `jason.danyliw@gmail.com`.
- Resend domain onboarding is complete for `studio2800.com`.
- Resend sending DNS records were added in Cloudflare and public DNS returns them: DKIM TXT at `resend._domainkey`, SPF TXT at `send`, MX at `send`, and non-enforcing DMARC TXT at `_dmarc`.
- Resend domain status for `studio2800.com` is `Verified`; Resend reports the domain is ready to send emails.
- Resend API key `studio2800-production` was created with sending access scoped to `studio2800.com`.
- Cloudflare Worker secret `RESEND_API_KEY` is set on `studio2800-api`.
- Protected test endpoint `/api/admin/test-lead-email` returned success and sent the branded lead notification through Resend.
- 2026-08-18 operational cleanup test: the public form default project option `Studio Central design-partner pilot` was accepted by `/api/submissions`; the Worker returned HTTP 201 with lead email status `sent`.
- SMS/text support is enabled but currently blocked. `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set as Cloudflare Worker secrets. Twilio redirected phone-number management to the trial-account upgrade screen, so `TWILIO_FROM_NUMBER` and `SMS_TO_NUMBER` are still not configured.
- App push fallback support is enabled but currently blocked. It requires `PUSHOVER_APP_TOKEN` and `PUSHOVER_USER_KEY` before push alerts can send.

## Business Email Forwarding

Current status as of 2026-08-14:

- Cloudflare Email Routing is enabled for `studio2800.com`.
- `studio@studio2800.com` forwards to the verified Studio2800 Gmail destination.
- `jdanyliw@studio2800.com` forwards to the verified Studio2800 Gmail destination.
- DNS contains Cloudflare Email Routing root MX records: `route1.mx.cloudflare.net` priority `7`, `route2.mx.cloudflare.net` priority `17`, and `route3.mx.cloudflare.net` priority `96`.
- DNS contains the Cloudflare Email Routing DKIM TXT record at `cf2024-1._domainkey.studio2800.com`.
- DNS contains the Cloudflare Email Routing SPF TXT record on `studio2800.com`.
- The existing Resend bounce/feedback MX record on `send.studio2800.com` remains in place.
- The old GoDaddy root MX records for `smtp.secureserver.net` and `mailstore1.secureserver.net` were removed from the root domain to avoid conflicts.

Important limitation:

- This is a free forwarding setup for inbound messages. It is not a paid mailbox.
- Incoming messages can be monitored in Gmail or the Mac Mail app if the Studio2800 Gmail account is added there.
- Sending from either domain address requires a separate Gmail "Send mail as" setup or a paid mailbox/provider later.

## Hosting Decision

Cloudflare is the main production host and DNS manager. Netlify should not be used for normal production deploys, site updates, or DNS unless you intentionally choose a rollback.

## Rollback Markers

| Change | Rollback marker |
| --- | --- |
| Livestream page added on July 1, 2026 | `rollback-markers/2026-07-01-livestream-page/ROLLBACK-NOTE.md` |

## Admin Visibility Controls

The Livestream page is hidden by default. Use the Admin page visibility switch to turn the page and navigation link on or off.
