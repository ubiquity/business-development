# GitHub Bounty Marketing Playbook

This playbook turns public GitHub bounty activity into a repeatable lead-generation workflow for Ubiquity. The goal is to find teams that already coordinate work through GitHub issues and may benefit from Ubiquity's bounty, task, and contributor-management tooling.

## Search Queries

Run these as GitHub issue searches, sorted by newest updates first:

| Query | Intent |
| --- | --- |
| `"bounty" "label" "assignee" is:issue is:open` | Repositories already running bounty-style issue workflows. |
| `"Price:" "Time:" "Priority:" is:issue is:open` | Ubiquity-like reward labels and work-scoping patterns. |
| `"bounty" "good first issue" is:issue is:open` | Maintainers trying to attract contributors with paid or beginner-friendly work. |
| `"reward" "pull request" is:issue is:open` | Teams explicitly connecting completion and payment/reward. |
| `"paid" "issue" "contributors" is:issue is:open` | Projects recruiting contributors for compensated work. |
| `"web3" "bounty" is:issue is:open` | Crypto-native projects where bounty workflows are common. |
| `"DAO" "bounty" is:issue is:open` | DAO operations and governance repositories. |
| `"grant" "bounty" "GitHub" is:issue is:open` | Projects funding work through grants but managing execution in GitHub. |

Use narrower qualifiers when the result set is too noisy:

```text
archived:false comments:>0 updated:>2026-01-01
language:TypeScript
org:ethereum
label:bounty
label:"good first issue"
```

## Lead Capture Fields

Capture each candidate in a spreadsheet or CRM with these fields:

| Field | Description |
| --- | --- |
| Repository | Owner and repository name. |
| Issue URL | Direct link to the bounty or paid-work issue. |
| Project type | DAO, protocol, infrastructure, app, developer tool, nonprofit, or other. |
| Existing workflow | Labels, assignment rules, comments, payment instructions, bots, or manual tracking. |
| Pain signal | Evidence that the team struggles with bounty triage, contributor onboarding, review latency, payment tracking, or duplicate work. |
| Contact path | Maintainer handle, public email, discussion thread, website contact page, or Discord/Telegram link from the repository. |
| Fit score | 1 to 5 based on the rubric below. |
| Outreach status | Not contacted, contacted, replied, meeting, closed, or not a fit. |
| Next action | Specific follow-up with date and owner. |

## Fit Scoring

Score quickly so the team can prioritize high-signal leads.

| Score | Criteria |
| --- | --- |
| 5 | Active paid GitHub workflow, repeated bounty issues, clear maintainer pain, and public contact path. |
| 4 | Active bounty workflow but limited pain signal or unclear decision maker. |
| 3 | Uses GitHub issues heavily and mentions contributor rewards, but no consistent bounty process. |
| 2 | Only occasional paid work or stale bounty issues. |
| 1 | No visible bounty process, inactive repo, or no ethical contact path. |

Only contact leads scored 4 or 5 unless there is a strong strategic reason.

## Outreach Guardrails

Do:

- Reference a specific public workflow detail from the repository.
- Keep the first message short and useful.
- Disclose that the message is about Ubiquity.
- Offer a concrete next step, such as a short workflow audit or demo.
- Stop after one unanswered follow-up.

Do not:

- Post generic promotional comments across unrelated issues.
- Contact maintainers through private channels that are not published for project communication.
- Imply affiliation with GitHub or the target project.
- Promise automated payments, contributor quality, or security outcomes without qualification.
- Engage with repositories that prohibit recruiting, advertising, or off-topic comments.

## First Message Template

```text
Hi <name>, I noticed that <project> is coordinating bounty work through GitHub issues, especially <specific issue or workflow detail>.

I work with Ubiquity, which helps teams manage GitHub-native task rewards, contributor assignment, review, and payout workflows. If bounty tracking or contributor coordination is becoming overhead for your team, I can share a short workflow audit or demo based on your current process.

Would that be useful?
```

## Follow-Up Template

```text
Hi <name>, quick follow-up on the GitHub bounty workflow note above. If this is not a priority, no problem. If it is useful, I can send a concise audit of where Ubiquity could reduce manual work in your current issue process.
```

## Daily Operating Cadence

1. Run the saved searches for 20 minutes.
2. Add 10 to 20 candidates to the lead tracker.
3. Score each lead and keep only 4 or 5 scores for outreach.
4. Send up to five personalized messages.
5. Log outcomes and schedule one follow-up for non-replies after five business days.
6. Review reply rate, qualified meetings, and disqualified leads weekly.

## Success Metrics

Track these weekly:

| Metric | Target |
| --- | --- |
| Qualified leads found | 25 per week |
| Personalized first messages sent | 15 per week |
| Positive reply rate | 10% or higher |
| Meetings or deep async evaluations | 2 per month |
| Spam complaints or negative moderation responses | 0 |

## Automation Notes

A lightweight scraper can use the GitHub Search API with the query set above, then export a CSV with:

```text
repository, issue_url, title, labels, created_at, updated_at, comments, author, assignees, body_excerpt
```

The scraper should not auto-post comments. Outreach should stay manual or approval-gated so each message remains relevant and compliant with repository rules.
