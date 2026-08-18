# Studio2800 Agent Overlord Overview

Last updated: 2026-08-18

## Purpose

Agent Overlord is the Studio2800 oversight layer. Its job is to consolidate scattered project work into one practical status picture, identify what needs attention, create a prioritized project plan, and report clearly to Jason.

It is not a replacement for Jason approval. It is a coordination and reporting system.

## Current Status

| Item | Current setup |
| --- | --- |
| Skill name | `agent-overlord` |
| Display name | Agent Overlord |
| Skill folder | `/Users/jasondanyliw/.codex/skills/agent-overlord/` |
| Project map | `/Users/jasondanyliw/.codex/skills/agent-overlord/references/studio2800-project-map.md` |
| Main automation | `daily-project-portfolio-status` |
| Automation name | Agent Overlord Studio2800 Daily Oversight |
| Schedule | Daily at 10:00 AM America/Detroit |
| Email delivery | Authenticated Gmail account using `to: me` when available |
| Security rule | Do not include passwords, API keys, OAuth tokens, cookies, recovery codes, or private account secrets in reports |

## What Agent Overlord Watches

| Area | Purpose |
| --- | --- |
| `studio2800.com` public site | Production marketing website, video showcase, forms, admin, dashboard, RSS, sitemap |
| Cloudflare Pages | Main production hosting path |
| Cloudflare Worker API | Forms, admin APIs, metrics, reports, notifications |
| Cloudflare D1 | Leads, page views, users/auth data, videos, errors, report history |
| AIVN / `studio2800news.com` | Related AI video news property and traffic reporting |
| Studio Central platform | Private/demo production platform and agent-role architecture |
| NVIDIA/business collateral | Application support, presentation material, business positioning |
| Documentation | User manual, changelog, official links and credential reference |
| Automations | Traffic reports, oversight reports, expense reminders, notification tests |
| Boss Agent | Broader Codex task supervision and portfolio risk checking |

## Normal Reporting Format

Agent Overlord reports should use this structure unless Jason asks for something else:

1. Current position
2. Verified live systems
3. Open issues and risks
4. Next 3-7 actions
5. Items needing Jason approval or login
6. Documentation updates needed
7. Bottom line

## Operating Rules

- Cloudflare is the main production path for `studio2800.com`.
- Netlify is legacy/backup only unless Jason explicitly reverses that decision.
- Public website, private Studio Central platform, and AIVN/news are related but separate systems.
- Do not merge private demo/admin functionality into the public site without security review.
- Label live facts separately from roadmap ideas.
- Treat AI generation-provider integrations as simulated unless verified end to end.
- Keep credentials and secrets out of reports.

## Relationship To Boss Agent

Boss Agent is the broader Codex control-room supervisor. It watches tasks, detects stale or blocked work, checks priority conflicts, and helps identify where intervention is needed.

Agent Overlord uses Boss Agent context when preparing Studio2800 oversight reports, but Agent Overlord is focused specifically on Studio2800 website, Cloudflare, AIVN, Studio Central, documentation, automations, and business-development work.

## Related Scheduled Agents

| Agent or automation | Status | Purpose |
| --- | --- | --- |
| Agent Overlord Studio2800 Daily Oversight | Active | Daily 10:00 AM project oversight and email report |
| Studio2800 monthly traffic report | Active | Monthly 15th, 9:00 AM report from Studio2800 Cloudflare D1 tracking |
| AIVN monthly traffic report | Active | Monthly 15th, 9:00 AM report from AIVN built-in tracking |
| Restart NVIDIA application | Active one-shot | Single reminder connected to NVIDIA application and email routing verification |
| Studio2800 website expense check-in | Paused | Weekly cost/tax tracker reminder |
| Daily website audience MMS report | Paused | Daily phone/email audience report workflow |
| Financial independence landscape art reminder | Paused | Daily image and message automation |

## Agent Overlord Visual Assets

| Asset | Location |
| --- | --- |
| Icon SVG | `/Users/jasondanyliw/.codex/skills/agent-overlord/assets/agent-overlord-icon.svg` |
| Emblem SVG | `/Users/jasondanyliw/.codex/skills/agent-overlord/assets/agent-overlord-emblem.svg` |
| Horizontal logo SVG | `/Users/jasondanyliw/.codex/skills/agent-overlord/assets/agent-overlord-logo-horizontal.svg` |
| Agent map visual | `/Users/jasondanyliw/.codex/visualizations/2026/06/16/019ece5f-2dcc-75c3-a2e8-04155d256fef/studio2800-agent-map.html` |

## Main Reference Files

| File | Purpose |
| --- | --- |
| `/Users/jasondanyliw/Documents/Codex/2026-06-15/build-a-website/studio2800-cloudflare-site-setup.md` | Hosting, Cloudflare setup, flowchart, and Agent Overlord overview |
| `/Users/jasondanyliw/Documents/Codex/2026-06-15/build-a-website/studio2800-official-links-and-credentials.md` | Official links, service inventory, credential locations without secret values |
| `/Users/jasondanyliw/Documents/Codex/2026-06-15/build-a-website/output/pdf/studio2800_cloudflare_user_manual.pdf` | Current PDF user manual |
| `/Users/jasondanyliw/Documents/Codex/2026-06-15/build-a-website/CHANGELOG.md` | Project change history |

## How To Use It

Ask for one of these:

- "Run Agent Overlord status."
- "Check Studio2800 next steps."
- "Review all related Studio2800 projects."
- "Prepare the daily oversight report."
- "Update the user manual and changelog."

Agent Overlord should then read current files, separate verified live status from unverified/planned work, identify risks, and produce a short actionable plan.
