# Studio2800 Notification Failover Process

Last updated: 2026-08-03

## Purpose

This process keeps Studio2800 lead and weekly report alerts working when Twilio SMS is blocked, expired, or unavailable.

## Normal Alert Path

1. Visitor submits the Studio2800 contact form or the weekly report runs.
2. The Cloudflare Worker saves required data to D1.
3. The Worker sends the Studio2800-styled email through Resend.
4. The Worker attempts Twilio SMS if SMS is enabled and all Twilio phone secrets exist.
5. If SMS sends, app push fallback is skipped.

## Twilio Failure Or Expiration Path

1. Twilio SMS is treated as not sent if Twilio is disabled, blocked, missing phone secrets, expired, loses sender eligibility, or returns an API error.
2. The lead/report email path still succeeds through Resend whenever Resend is healthy.
3. If `PUSH_ON_SMS_FAILURE=true` and Pushover secrets are configured, the Worker sends an app push backup.
4. Any SMS or push failure is recorded in D1 `site_errors`.
5. Visitor form submissions still return success after the lead is saved.

## Required Twilio Secrets

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `SMS_TO_NUMBER`

Current known blocker: `TWILIO_FROM_NUMBER` and `SMS_TO_NUMBER` are not set.

## Required App Push Backup Secrets

- `PUSHOVER_APP_TOKEN`
- `PUSHOVER_USER_KEY`

Current known blocker: both Pushover secrets are not set.

## Admin Checks

- Admin page: `https://studio2800.com/admin`
- Notification status endpoint: `/api/admin/notification-status`
- Push test endpoint: `/api/admin/test-lead-push`
- Failover test endpoint: `/api/admin/test-notification-failover`

Use `Refresh status` first. Use `Test failover` only after Pushover secrets are configured.

## Secure Setup Helpers

Run these locally. Paste values only into Wrangler's masked prompts.

```text
tools/set-studio2800-sms-secrets.sh
tools/set-studio2800-push-secrets.sh
```
