# GitHub Based Marketing Playbook

This playbook responds to [business-development issue #90](https://github.com/ubiquity/business-development/issues/90): using GitHub search behavior as a growth channel for Ubiquity.

## Objective

Find repository maintainers who already feel the pain that Ubiquity solves:

- They use GitHub Issues as their task backlog.
- They label issues with bounties, prices, rewards, or "help wanted."
- They already coordinate contributors in public comments.
- They need a cleaner way to price work, assign contributors, track progress, and pay accepted work.

The marketing motion should not be broad cold outreach. It should be narrow, GitHub-native, and triggered by visible buying signals.

## Core thesis

Projects that already mention "bounty" on GitHub are doing manual versions of Ubiquity's workflow. They are not being educated from zero. The growth job is to find those moments and show a concrete upgrade path:

> "You are already trying to run paid open-source work in issues. Ubiquity can turn that into a repeatable workflow with pricing, assignment, activity tracking, and payout mechanics."

## Ideal customer profile

| Segment | Signal | Why it matters | Priority |
| --- | --- | --- | --- |
| Crypto and DAO repositories | Issues mention bounty, reward, contributor, grant, or payment | They are already comfortable with token or stablecoin incentives | High |
| Open-source tools with many good-first issues | `help wanted`, `good first issue`, active maintainers, many open issues | They need contributor throughput but may not have a paid workflow yet | Medium |
| Existing bounty-board users | Gitcoin, Dework, OnlyDust, Opire, Algora, BountySource, IssueHunt references | They understand bounties and may want a GitHub-native alternative | High |
| Repositories with abandoned bounty attempts | Old bounty issues, dead external links, manual payout comments | Clear pain around operational overhead | High |
| Hackathon or grant repositories | Issues mention grant, bounty, prize, submission, judging | They need structured contributor evaluation | Medium |

## GitHub search queries

Start with these searches and review results manually before any outreach.

```text
"bounty" "help wanted" is:issue is:open
"Price:" "USD" is:issue is:open
"reward" "pull request" "bounty" is:issue is:open
"claim" "bounty" "issue" is:issue is:open
"paid" "good first issue" is:issue is:open
"Gitcoin" "bounty" is:issue is:open
"Dework" "bounty" is:issue is:open
"OnlyDust" "bounty" is:issue is:open
"Algora" "bounty" is:issue is:open
"BountySource" is:issue is:open
"IssueHunt" is:issue is:open
"USDC" "bounty" is:issue is:open
"reward" "contributor" "GitHub" is:issue is:open
```

Use qualifiers to focus the list:

```text
created:>2026-01-01 comments:<10
updated:>2026-05-01 comments:<20
label:"help wanted" label:"good first issue"
language:TypeScript OR language:Solidity OR language:Rust
org:ethereum OR org:solana-labs OR org:cosmos OR org:paradigmxyz
```

## Scoring rubric

Score every target before posting anything.

| Factor | 0 points | 1 point | 2 points |
| --- | --- | --- | --- |
| Active maintainer | No recent maintainer activity | Maintainer active in last 30 days | Maintainer replies in issues weekly |
| Bounty signal | No explicit reward | Bounty mentioned once | Price, reward, or payout is explicit |
| Workflow pain | Clean workflow already exists | Some manual coordination | Confusion around claim, payment, scope, or stale assignees |
| Fit with Ubiquity | Non-technical or private workflow | Public issues but no payment need | Public issue workflow plus contributor/payment need |
| Outreach safety | Message would feel unrelated | Some relevance | Comment directly helps the current issue |

Only act on targets scoring 7 or higher out of 10.

## Outreach rule

Do not post generic promotional comments. The first touch must add value to the exact issue or repository.

Bad:

> "Try Ubiquity for bounties."

Good:

> "I noticed this issue already has a bounty-style workflow: price signal, contributor discussion, and manual status tracking. One operational risk is that claim/payment state can become unclear once multiple contributors appear. Ubiquity's GitHub-native flow could help by keeping assignment, pricing, activity, and payout state inside the issue workflow. If useful, I can map this issue into a short Ubiquity-style workflow so you can compare the overhead."

## Outreach templates

### Maintainer comment

```text
I found this because it looks like you are already running a bounty-style workflow directly inside GitHub.

One thing Ubiquity may help with is keeping the whole loop GitHub-native: price labels, assignment, activity checks, review state, and payout state without moving contributors into a separate marketplace.

For this issue, the manual overhead appears to be:

- deciding who is actually assigned
- keeping contributor updates visible
- avoiding stale claims
- making payment status auditable after review

If helpful, I can draft a Ubiquity-style version of this workflow for this repo so you can compare it against the current process.
```

### Repository-level discussion

```text
Your repository already has the ingredients for a paid contributor workflow: public issues, maintainers reviewing PRs, and contributors asking where to help.

Ubiquity is strongest when a team wants to keep that workflow inside GitHub instead of pushing contributors to a separate bounty board. The relevant experiment would be small:

1. select 3-5 existing issues,
2. price them with priority/time labels,
3. allow contributors to self-assign,
4. require visible progress updates,
5. close the loop with review and payout state.

That should be enough to test whether the workflow reduces maintainer coordination time.
```

### Direct maintainer email or DM

```text
Subject: GitHub-native bounty workflow for your open issues

Hi [name],

I noticed your repo is already using GitHub Issues to coordinate paid or reward-based contributor work. Ubiquity may be relevant because it keeps the contributor workflow inside GitHub rather than moving it to a separate bounty board.

The small test I would suggest is:

- choose 3-5 existing issues,
- add clear price/time/priority labels,
- let contributors assign through GitHub comments,
- track progress and stale assignments,
- keep payout state auditable from the issue thread.

If useful, I can map one of your current issues into that workflow so you can evaluate whether it removes coordination overhead.
```

## Seven-day experiment

| Day | Action | Output |
| --- | --- | --- |
| 1 | Run the search queries and collect 100 candidate issues | Candidate spreadsheet |
| 2 | Score candidates with the 10-point rubric | Top 25 targets |
| 3 | Review top 25 manually and remove risky/spam-prone targets | Final 10 targets |
| 4 | Write one custom comment or message per target | 10 tailored drafts |
| 5 | Post only the strongest 5 messages | 5 public touches |
| 6 | Reply to maintainers and offer one workflow map | 1-2 deeper conversations |
| 7 | Convert one interested maintainer into a 3-issue pilot | Pilot proposal |

## Metrics

Track these numbers in a simple table:

| Metric | Target |
| --- | ---: |
| Candidate issues reviewed | 100 |
| Targets scoring 7+ | 20-30 |
| Tailored messages drafted | 10 |
| Messages posted | 5 |
| Maintainer replies | 1-2 |
| Pilot conversations | 1 |
| Pilot repositories | 1 |

The experiment is successful if one maintainer asks for a workflow map or agrees to test Ubiquity on a small set of issues.

## Example target sheet

| Repository | Issue URL | Signal | Pain | Score | Suggested angle |
| --- | --- | --- | --- | ---: | --- |
| Example DAO repo | `https://github.com/org/repo/issues/123` | Explicit bounty and contributor comments | Manual claim/payment tracking | 9 | Offer GitHub-native assignment and payout state |
| Example infra repo | `https://github.com/org/repo/issues/456` | `help wanted` plus reward comment | Stale assignee and unclear progress | 8 | Offer stale-assignment and progress-update workflow |
| Example hackathon repo | `https://github.com/org/repo/issues/789` | Prize/submission language | Review burden and unclear winner criteria | 7 | Offer issue-to-PR review and payout audit trail |

## Anti-spam guardrails

- Do not comment on repos without a visible bounty, payment, reward, grant, or contributor-management pain.
- Do not post the same text twice.
- Do not pitch on closed issues unless the thread shows unresolved workflow pain.
- Do not mention payout mechanics unless the project already discusses paid work.
- Do not ask maintainers to migrate platforms; propose one small issue-level pilot.
- Stop contacting a repository if a maintainer does not engage.

## Recommended first pilot

The first Ubiquity growth pilot should target five repositories that:

1. have open issues with explicit bounty or reward language,
2. have maintainers active in the last seven days,
3. have fewer than ten comments on the issue,
4. do not already have a clean bounty bot installed,
5. have at least three other similar issues that could become a small pilot set.

This keeps the campaign narrow enough to avoid spam while still proving whether GitHub-native bounty operations can create qualified demand.

## Deliverable checklist

- [x] Search query set for GitHub-native bounty discovery
- [x] Target scoring rubric
- [x] Outreach safety rules
- [x] Three reusable message templates
- [x] Seven-day experiment plan
- [x] Pilot conversion metric
- [x] Anti-spam guardrails
