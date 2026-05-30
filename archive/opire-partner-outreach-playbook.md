# Opire Partner Outreach Playbook

This playbook turns issue #89 into an executable business-development workflow for discovering Opire-aligned bounty programs, qualifying partner projects, and starting useful collaboration conversations for Ubiquity.

## Objective

Find teams already paying contributors through GitHub-native bounty workflows, then position Ubiquity OS and DevPool as a way to improve contributor routing, task pricing, review throughput, and reward distribution.

## Why Opire-Adjacent Projects Are High Fit

Projects that already use Opire or public GitHub bounties have several buying signals:

- They already believe GitHub issues can be a paid work surface.
- They already need contributor discovery, assignment, review, and payout coordination.
- They have public evidence of bounty budget and workflow friction.
- They can understand Ubiquity without a long education cycle.
- They often have open issues where a specific workflow improvement can be proposed.

## Source Queries

Use GitHub search first because it provides visible proof of current bounty behavior.

```text
"powered by Opire" "Bounty:" "GitHub"
"opire try" "Bounty:" "GitHub"
"/opire try" "Submit a PR"
"Payment is released automatically on merge"
"Bounty:" "powered by Opire" site:github.com
"bounty" "Opire" "issues"
"opire.dev" "bounty" "GitHub"
```

Add these broader bounty-system queries when Opire results are thin:

```text
"Price:" "Time:" "state:open" "GitHub"
"bounty" "good first issue" "Submit a PR"
"reward" "merged PR" "GitHub"
"paid contributors" "GitHub issues"
```

## Qualification Score

Score each target from 0 to 10.

| Signal | Points | Notes |
| --- | ---: | --- |
| Public bounty issue or paid task | 2 | Must be visible and current. |
| Recent maintainer response within 30 days | 2 | Avoid abandoned boards. |
| More than 5 open contributor tasks | 1 | Indicates workflow volume. |
| Uses GitHub issues/PRs as the work surface | 1 | Strong Ubiquity fit. |
| Has review or assignment bottlenecks | 2 | Best wedge for automation. |
| Web3, AI tooling, OSS SaaS, infra, or devtools | 1 | Strongest buyer personas. |
| Public docs for contribution/payment process | 1 | Easier to propose integration. |

Prioritize projects scoring 7 or higher.

## Partner Targets To Research First

| Target Type | Why It Matters | First Action |
| --- | --- | --- |
| Opire bounty boards | Already pay for GitHub work | Map active bounties, PR volume, stale issues. |
| AI tooling communities | High contributor demand | Offer GitHub-native task triage and reward routing. |
| Web3 protocol repos | Common bounty budgets | Propose DevPool for priced issue execution. |
| Open source SaaS tools | Need contributor leverage | Offer auto-pricing and reviewer throughput workflow. |
| Developer education groups | Have builders but need tasks | Offer templated bounty campaigns. |

## Outreach Message: Opire-Using Project

Subject: GitHub bounty workflow idea for `<project>`

```text
Hi <name>,

I noticed <project> is already running GitHub-native bounties through Opire. That is exactly the kind of workflow Ubiquity OS is built to improve: contributor routing, task pricing, review status, and reward coordination directly around issues and PRs.

I put together a quick collaboration idea:

- identify stale or high-value bounty issues,
- auto-rank tasks by contributor fit and review burden,
- route contributors into the right issue before maintainers spend time manually triaging,
- keep reward and review state visible on GitHub.

Would it be useful if we drafted a lightweight pilot around one active bounty queue?
```

## Outreach Message: Non-Opire Bounty Board

Subject: Reducing bounty triage work for `<project>`

```text
Hi <name>,

I saw that <project> coordinates paid/open contributor work through GitHub issues. Ubiquity OS may be a fit because it helps turn issues into managed work units with pricing, contributor assignment, and review-state automation.

The practical pilot would be small:

- choose 5 to 10 active paid/help-wanted issues,
- add clearer reward/review metadata,
- automate contributor intake and status updates,
- measure whether maintainers spend less time coordinating.

If useful, I can outline the pilot using your current issue flow.
```

## Outreach Message: Platform Partnership

Subject: Ubiquity x `<platform>` bounty workflow pilot

```text
Hi <name>,

Ubiquity and <platform> appear to serve adjacent needs: getting contributors into paid GitHub work and making sure maintainers can review, route, and reward work without manual overhead.

A low-risk collaboration could be:

- co-publish a GitHub bounty workflow template,
- test it with one active open source project,
- compare contributor response time, PR merge rate, and reviewer load,
- turn the successful version into a repeatable partner playbook.

Is there someone on your partnerships or developer-relations side who owns bounty workflows?
```

## Daily Execution Workflow

1. Search the source queries for new targets.
2. Add each target to the tracker with score, link, maintainer contact path, and suggested pilot.
3. Send at most five highly specific outreach messages per day.
4. Follow up only when there is a concrete improvement or artifact to share.
5. Convert positive replies into a one-page pilot proposal.

## Tracker Schema

```csv
date,project,repo_or_site,contact_path,fit_score,bounty_evidence,current_friction,pilot_offer,status,next_action
2026-05-30,Example Project,github.com/example/repo,GitHub issue,8,Open bounty issues,Stale reviews,Contributor routing pilot,Qualified,Draft outreach
```

## Pilot Proposal Template

```text
Pilot: GitHub bounty workflow optimization for <project>

Goal:
Reduce manual bounty coordination while increasing qualified contributor submissions.

Scope:
- 5 to 10 active GitHub issues
- pricing/reward metadata cleanup
- contributor intake message
- review status automation
- weekly summary of completed, blocked, and stale work

Success Metrics:
- time from issue posted to first qualified PR
- maintainer comments per bounty
- stale bounty count
- merged PR count
- contributor repeat rate
```

## Suggested First Week

Day 1: Build the target list and qualify the top 20.

Day 2: Send five tailored outreach messages to the highest-fit targets.

Day 3: Turn any reply into a pilot proposal. For no-reply targets, improve the message with one repo-specific observation.

Day 4: Publish a reusable public template for GitHub bounty workflows.

Day 5: Follow up with a concrete artifact, not a generic reminder.

## Reusable Asset

The strongest reusable asset from this work is a `bounty-workflow-audit` package:

- public bounty queue review,
- stale issue list,
- contributor intake recommendations,
- pricing/reward metadata cleanup,
- one-page pilot proposal,
- follow-up email sequence.

This can be reused for Opire projects, Ubiquity prospects, and external clients who want paid contributor workflows without building their own coordination system.
