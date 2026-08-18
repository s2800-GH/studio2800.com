# Studio2800 Website Changelog

All notable Studio2800 website infrastructure, workflow, restore point, and production changes are tracked here.

## 2026-08-18

- Created the reusable Codex skill `agent-overlord` at `/Users/jasondanyliw/.codex/skills/agent-overlord/` for Studio2800 oversight, cross-project consolidation, Boss Agent coordination, project planning, and email-ready reporting.
- Added the skill reference map `references/studio2800-project-map.md` covering the main website, Cloudflare Worker/API, AIVN/studio2800news, private Studio Central platform, NVIDIA/business collateral, Boss/status workspaces, and recurring oversight checks.
- Updated the existing daily project heartbeat automation into `Agent Overlord Studio2800 Daily Oversight`.
- Changed that automation schedule from 9:00 AM to 10:00 AM local time and configured it to email the authenticated Gmail account while keeping credentials and secrets out of reports.
- Corrected the initial oversight skill spelling to `agent-overlord`, including the skill folder, display name, automation prompt, project manual, official reference, and PDF generator.
- Added original Agent Overlord visual identity assets to the skill: circular emblem, symbol-only icon, and horizontal logo lockup in the Studio2800 teal/orange command style.
- The initial Agent Overlord skill and logo work did not change production website, DNS, Worker, D1, or Cloudflare Pages deployment state.
- Ran an Agent Overlord operational cleanup pass across the live public site, Worker API, private demo protection, admin API protection, RSS, sitemap, contact/email path, documentation, and GitHub backup status.
- Created rollback marker `rollback-markers/20260818-operational-cleanup-pre-worker-fix/` before changing Worker code or documentation.
- Fixed a live lead-capture defect where the public services form default option `Studio Central design-partner pilot` was rejected by the Worker `/api/submissions` project allowlist.
- Deployed Worker version `b56f8fb2-84da-4459-beb7-960e53d801b9`; verified `/api/health` returns `ok:true` and the default contact-form payload now returns HTTP 201 with lead email status `sent`.
- Verified unauthenticated admin APIs remain protected: `/api/admin/submissions`, `/api/admin/metrics`, `/api/admin/network-dashboard`, `/api/admin/monthly-report`, and `PUT /api/videos` returned HTTP 401.
- Verified `studio2800.com`, `www.studio2800.com`, `/services/`, `/feed.xml`, `/sitemap.xml`, `/robots.txt`, and Cloudflare Access protection for `demo.studio2800.com`.
- Determined the existing GitHub-ready repository at `/Users/jasondanyliw/Documents/Codex/2026-06-26/c/outputs/github-ready/studio2800.com` points to `git@github.com:s2800-GH/studio2800.com.git` but is stale as of commit `d174106` from 2026-06-30 and should be treated as a historical Netlify/beta archive until refreshed.
- Updated `site-health-findings.md`, setup notes, official links/credential reference, and the user manual source/PDF with the operational cleanup evidence and GitHub backup status.

## 2026-08-16

- Created rollback marker `rollback-markers/20260816-agent-platform-homepage-predeploy/` before the public-site migration.
- Replaced the root homepage with a product-first Studio2800 Agent Production Platform presentation built as responsive HTML/CSS, including the virtual production workflow, active agent crew, shared production state, human review gates, governance, and honest development-status messaging.
- Preserved the complete previous homepage as `/services/`, including its showcase, planning graphics, five production lanes, ten service offerings, process graphic, blueprint CTA, creative-network links, and inquiry form.
- Added first-class `Services` and `Showcase` navigation while retaining `Product`, `Workflow`, `Agent Crew`, `Governance`, and `Request a pilot` paths.
- Added legacy fragment routing so old homepage links such as `/#services`, `/#showcase`, and `/#contact` continue at the corresponding `/services/` sections.
- Updated root-relative nested-page assets, form success routing, sitemap, RSS feed, canonical metadata, security headers, Livestream navigation, and thank-you navigation.
- Verified desktop at 1536x1024 and mobile at 390x844 with no horizontal overflow, no broken local assets, no duplicate IDs, working mobile navigation, and correct pilot-form anchor restoration after asynchronous showcase media loads.
- Deployed and verified Cloudflare Pages preview `99268cfc` before production.
- Deployed Cloudflare Pages production deployment `fd052a83`; verified `studio2800.com`, `/services/`, signup, Livestream, thank-you, sitemap, feed, security headers, retired demo redirects, and the existing Worker health endpoint.
- No Cloudflare Worker, D1, Admin, account, dashboard, or Livestream application logic was changed in this release.
- Branded the flagship product as `Studio Central`, added its dedicated wordmark and browser-tab emblem, and retained `studio2800.com` as the parent-company identity in the public header.
- Restyled the Studio Central production schedule as a lighter planning surface with warm-white panels, teal structure, orange active states, and higher-contrast timeline bars.
- Expanded the lower homepage explanation of Studio Central while keeping the prior services and showcase content at `/services/`.
- Fixed the Admin `View site` link so it opens `/services/#showcase` after the homepage migration.
- Deployed Cloudflare Pages production deployment `7a72514e`; verified the immutable deployment, `studio2800.com`, `www.studio2800.com`, Studio Central assets, Services/contact surfaces, signup/login/account/Admin routes, sitemap, feed, redirects, security headers, and the existing Worker health and videos endpoints.
- Preserved production deployment `fd052a83` as the immediate rollback target. No Worker, D1, authentication, notification, or Admin application logic was changed.
- Replaced all homepage and `/studio-central/` references to an “approved brief” with the more accessible starting point “a video concept or idea,” including the page metadata and product explainer while retaining `Brief` as the structured workflow stage.
- Deployed Cloudflare Pages production deployment `9c0f5797`; verified the custom domain and immutable deployment, exact live copy, Studio Central alias, Services page, static assets, workflow anchor, responsive-safe desktop rendering, clean browser console, and existing Worker health endpoint. Preserved `7a72514e` as the immediate rollback target.

## 2026-08-14

- Configured free inbound business email forwarding through Cloudflare Email Routing for `studio2800.com`.
- Created active forwarding rules for `studio@studio2800.com` and `jdanyliw@studio2800.com` to the verified Studio2800 Gmail destination.
- Removed the old conflicting GoDaddy root MX records for `smtp.secureserver.net` and `mailstore1.secureserver.net`.
- Added Cloudflare Email Routing DNS records: three root MX records, Cloudflare DKIM TXT, and root SPF TXT.
- Preserved the existing Resend `send.studio2800.com` MX record used for transactional email bounce/feedback handling.
- Verified the Cloudflare dashboard reports Email Routing `Enabled`, DNS records `Enabled`, 2 routing rules, and 1 destination address.
- Documented that the setup is inbound forwarding only, not a full paid mailbox, and added rollback records for returning to GoDaddy root MX if needed.

## 2026-08-03

- Created rollback marker `rollback-markers/20260803-notification-failover-admin/` before deploying notification readiness and failover admin changes.
- Added protected Worker endpoint `/api/admin/notification-status` so the Admin page can report notification readiness without exposing secret values.
- Added protected Worker endpoint `/api/admin/test-notification-failover` to simulate a Twilio failure and test the app push backup path.
- Added an Admin `SMS and app backup` status panel with readiness cards for lead email, Twilio SMS, app push backup, and automatic failover.
- Confirmed Cloudflare Worker secrets currently present: admin/auth secrets, Resend email secrets, lead/report email secrets, `TWILIO_ACCOUNT_SID`, and `TWILIO_AUTH_TOKEN`.
- Confirmed Cloudflare Worker secrets still missing: `TWILIO_FROM_NUMBER`, `SMS_TO_NUMBER`, `PUSHOVER_APP_TOKEN`, and `PUSHOVER_USER_KEY`.
- Documented Twilio expiration behavior: if Twilio returns an API failure and Pushover is configured, the Worker sends app push backup automatically for leads and weekly reports.
- SMS can not send until a Twilio sender number and destination phone are stored as Worker secrets. App push backup can not send until Pushover app token and user key are stored as Worker secrets.
- Deployed Worker version `02b067e7-181d-431e-90fd-7579ee040e83`.
- Deployed Cloudflare Pages production deployment `dd6870b6` with the Admin `SMS and app backup` panel.

## 2026-07-18

- Created rollback marker `rollback-markers/20260718-sms-notifications-predeploy/` before adding SMS/text notification support.
- Added optional Twilio-compatible SMS notification support to `studio2800-api`.
- Added `SMS_PROVIDER=twilio` and `SMS_ENABLED=false` Worker variables so SMS remains disabled until phone/provider secrets are configured.
- Added SMS hooks for contact form lead alerts and weekly traffic report summaries. SMS failures are logged but do not break form submissions or report email delivery.
- Added protected admin test endpoint `/api/admin/test-lead-sms`.
- Added `Send test text` to the private Admin Form submissions panel.
- Updated the setup notes, official links/credentials reference, and user manual source with SMS service inventory and required Worker secrets.
- Deployed Worker version `a8f9763f-0184-47fe-998b-96d575a5b0c3` with SMS disabled by default.
- Deployed Cloudflare Pages update `453857e2` with the private Admin `Send test text` button.
- Enabled `SMS_ENABLED=true` and deployed Worker version `74fcde3d-0de3-4db8-b99d-bc02c540717a`.
- Ran a controlled contact-form notification test. Result: form `ok:true`, email notification `sent`, SMS notification `blocked` because Twilio secrets and phone numbers are not set yet.
- Added secure local helper `tools/set-studio2800-sms-secrets.sh` to set Twilio/SMS Worker secrets through masked Wrangler prompts instead of chat, shell history, or committed files.
- Created rollback marker `rollback-markers/20260718-push-fallback-predeploy/` before adding app push fallback support.
- Added optional Pushover-compatible app push notifications as a fallback when Twilio SMS is disabled, blocked, or fails.
- Added `PUSH_PROVIDER=pushover`, `PUSH_ENABLED=true`, and `PUSH_ON_SMS_FAILURE=true` Worker variables. Actual push delivery remains blocked until Pushover secrets are configured.
- Added protected admin test endpoint `/api/admin/test-lead-push` and `Send test push` to the private Admin Form submissions panel.
- Added secure local helper `tools/set-studio2800-push-secrets.sh` to set Pushover Worker secrets through masked Wrangler prompts.
- Deployed Worker version `06df2388-d4ed-41fe-a28e-de74d758a765` with Pushover-compatible push fallback logic enabled by `PUSH_PROVIDER=pushover`, `PUSH_ENABLED=true`, and `PUSH_ON_SMS_FAILURE=true`.
- Stored `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` as Cloudflare Worker secrets on `studio2800-api` through the Cloudflare API. Values are not recorded in this repo or manual.
- Twilio phone-number management redirected to the trial-account upgrade screen, so `TWILIO_FROM_NUMBER` and `SMS_TO_NUMBER` are still not configured. SMS remains unable to send until a sender number and destination phone are set.
- Cloudflare Pages admin UI update with `Send test push` is prepared locally, but production Pages deploy was not completed because local Wrangler/Node DNS resolution failed. Existing production admin still has the previously deployed `Send test text` button.
- Created/signed into Resend under account `jason.danyliw@gmail.com` for Studio2800 transactional email.
- Added Resend sending DNS records in Cloudflare: DKIM TXT `resend._domainkey`, SPF TXT `send`, MX `send`, and non-enforcing DMARC TXT `_dmarc`.
- Verified public DNS returns all four Resend records, and Resend domain status for `studio2800.com` is `Verified`.
- Created Resend API key `studio2800-production` with sending access scoped to `studio2800.com`.
- Stored the API key as Cloudflare Worker secret `RESEND_API_KEY` on `studio2800-api`.
- Verified the protected test endpoint `/api/admin/test-lead-email` sends the branded lead notification through Resend.
- Updated the Studio2800 user manual and PDF with the Resend account, DNS, verification, API-key secret, and live test result.
- Changed the scheduled traffic report cadence from monthly to weekly. Cloudflare still checks hourly, but Worker logic now sends once per week on Monday at or after 9 AM America/Detroit and deduplicates by weekly period key.
- Deployed Worker version `cf2b60db-22a4-424a-9d98-393943cdc741` with `REPORT_FREQUENCY=weekly`, `REPORT_SEND_WEEKDAY=1`, and `REPORT_SEND_HOUR=9`.
- Forced a protected weekly report test send for period `week-2026-07-13`; Resend returned `sent` with SVG attachment.

## 2026-07-17

- Added Resend-compatible transactional email sending to the Worker. When `RESEND_API_KEY` is present, lead notifications and monthly reports send through Resend; otherwise the Worker falls back to Cloudflare Email Service.
- Documented Resend Free vs Cloudflare Workers Paid tradeoffs and added service/site tracking notes to the user manual.
- Current Resend activation requirement: create a Resend Free account, verify the Studio2800 sending domain, create an API key, and save it as the Worker secret `RESEND_API_KEY`.
- Deployed Worker version `d6c2d0b5-ae1b-4661-bddc-1d3c82a31874` with `EMAIL_PROVIDER=resend`.
- Created rollback marker `rollback-markers/20260717-005604-form-email-fix/` before changing form and email behavior.
- Added Studio2800-branded HTML lead notification emails to the Cloudflare Worker `/api/submissions` path.
- Matched the lead email pattern used on the AIProductionPros reference worker: sanitized payload, HTML + text email, Cloudflare Email Service binding, and admin dashboard link.
- Added protected admin test endpoint `/api/admin/test-lead-email`.
- Added a `Send test email` button to the private admin inquiry spreadsheet section.
- Changed the public thank-you page wording so it does not reference an email address on the response page.
- Verified local Worker and admin JavaScript syntax with the bundled Node runtime.
- Verified no public `studio2800@gmail.com`, `mailto:`, or old response-page email wording remains in `outputs/` or `cloudflare-api/`.
- Deployed Worker version `190bbc8f-5b41-4b8a-8a16-0bca2b0fe115` and Cloudflare Pages deployment `5021e52b`.
- Set Worker secrets `LEAD_FROM_EMAIL`, `LEAD_TO_EMAIL`, and updated `REPORT_FROM_EMAIL` so outgoing mail uses a Studio2800 sender domain.
- Authenticated test email reached the Worker but Cloudflare Email Service rejected delivery with `could not find domain config of sending domain`.
- Confirmed in the Cloudflare dashboard that Email Sending is blocked until the account is upgraded to Workers Paid; the dashboard shows `Purchase Workers Paid` before domain onboarding is available.
- Remaining action: upgrade to Workers Paid or choose another transactional email provider, then onboard `studio2800.com` under Compute > Email Service > Email Sending before lead/report emails can be delivered from `noreply@studio2800.com`.

## 2026-07-15

- Added Cloudflare-native monthly traffic reporting to `studio2800-api`.
- Added an hourly Cloudflare Cron trigger with Detroit local-time logic so the report runs once per month on the 15th after the configured send hour.
- Added the `monthly_report_runs` D1 table to audit whether a monthly report was sent, skipped, blocked, or failed.
- Added protected admin endpoint `/api/admin/monthly-report` for JSON preview, HTML preview, and forced test sends.
- Added Cloudflare Email Service binding placeholder `EMAIL`; report sender and recipient must be stored as Worker secrets `REPORT_FROM_EMAIL` and `REPORT_TO_EMAIL`, not committed to project files.
- Deployed the Worker update through the Cloudflare API after Wrangler shell networking was blocked locally.
- Set Worker secrets `REPORT_FROM_EMAIL` and `REPORT_TO_EMAIL`.
- Removed the old live `ADMIN_EMAIL` binding from `studio2800-api`.
- Verified through Cloudflare API that the deployed Worker source contains the monthly report endpoint, scheduled handler, D1 report table, Email Service binding, report secrets, and hourly cron trigger.
- Created and verified the `monthly_report_runs` table directly in the production D1 database.
- Status: production scheduling is configured. A live forced email send still needs to be tested from an authenticated admin browser session because this environment cannot directly fetch the Workers runtime URL.

## 2026-07-14

- Removed the unused public `ADMIN_EMAIL` value from the Worker config.
- Removed the admin email from the official links and setup reference docs.
- Updated the user manual generator so the admin credential table no longer prints the admin email address.
- Changed the private admin submissions table so submitted email addresses are plain text instead of clickable `mailto:` links.

## 2026-07-09

- Rolled production back from Cloudflare Pages deployment `278dd505` to known-good deployment `11ea4d7e`.
- Verified `studio2800.com` and `www.studio2800.com` are again aliased to deployment `11ea4d7e`.
- Verified `https://studio2800.com/` returns `HTTP 200` with the security headers from the July 8 hardening release.
- Root cause noted: do not use a manifest-only direct Cloudflare Pages production deployment unless the matching asset upload path has also been completed and verified.
- Workflow rule added: future production changes must be previewed, verified, and deployed through the validated Wrangler or full Cloudflare Pages asset upload process only.

## 2026-07-08

- Removed the public `outputs/website-tax-tracker/` folder from the Cloudflare Pages publish directory.
- Deployed Cloudflare Pages production deployment `11ea4d7e`.
- Added Cloudflare Pages security headers through `outputs/_headers`: CSP, HSTS, frame protection, permissions policy, referrer policy, and nosniff.
- Deployed Worker API security hardening for `studio2800-api`.
- Changed public signup so new accounts are always created as regular `user` accounts; admin role is no longer granted by matching a specific email address.
- Added database-backed rate limiting for admin login, user login, signup, lead submissions, visit metrics, and client error logging.
- Verified the new Pages deployment URL serves the removed tracker path as HTML fallback with the new security headers instead of the spreadsheet asset.
- Cloudflare zone cache purge was attempted but denied by API permission; cache-busted live URLs verified against the new deployment.
- Completed Cloudflare dashboard Custom Purge for the two exposed tracker URLs after browser login; Cloudflare reported: "Purge request successfully received."

## 2026-07-07

- Created a current-production restore point before future site changes.
- Saved restore folder at `rollback-markers/2026-07-07-current-production-restore-point/`.
- Saved restore zip at `rollback-markers/studio2800-restore-point-2026-07-07-current-production.zip`.
- Added a restore-point `README.md` and `RESTORE-MANIFEST.sha256` checksum manifest.
- Verified the restore zip with no compression errors.
- Updated the user manual source to document the July 7 restore point.
- Updated the operating process to include creating a restore point before larger design, routing, admin, DNS, or API changes.

## 2026-07-01

- Deployed Studio2800 production build to Cloudflare Pages.
- Production deployment `e94cdd3b` was attached to `studio2800.com` and `www.studio2800.com`.
- Verified `/Livestream/` as a player-only page with no extra instruction cards.
- Confirmed admin page remains password protected.
- Confirmed Cloudflare is the main production host and Netlify is retired from the active workflow.
