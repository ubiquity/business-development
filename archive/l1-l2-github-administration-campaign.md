# L1/L2 GitHub Administration Campaign

Issue: https://github.com/ubiquity/business-development/issues/184

## Goal

Build a launch-ready campaign for Layer 1 and Layer 2 projects that can use
UbiquityOS as a managed GitHub administration layer.

The pitch is not "buy a bot." The pitch is:

> Your open source GitHub can be managed like an agency service, while UbiquityOS
> automates issue triage, priority labels, reward labels, assignment, contributor
> routing, and operational reporting behind the scenes.

This package covers the first launch slice:

1. scrape L1/L2 project candidates from CoinMarketCap,
2. enrich each candidate with website, GitHub and public contact surfaces,
3. score which projects are likely to need GitHub administration,
4. deduplicate against nReach / existing DAO lists,
5. launch a small, low-spam outbound campaign,
6. track replies and follow-ups.

## Deliverables

| Asset | Location | Purpose |
| --- | --- | --- |
| CoinMarketCap lead scraper | `scrapers/coinmarketcap-l1-l2-github-leads.js` | Browser-console scraper for L1/L2 pages |
| Lead schema | This document | Standard CSV fields for Clay/nReach merge |
| Scoring model | This document | Prioritize projects with GitHub admin pain |
| Campaign sequence | This document | Copy for email, LinkedIn or other outbound channel |
| Launch checklist | This document | Turn the list into a controlled 7-day test |

## Lead Collection Workflow

Run the scraper in the browser console on both pages:

```text
https://coinmarketcap.com/view/layer-1/
https://coinmarketcap.com/view/layer-2/
```

Optional row limit:

```text
https://coinmarketcap.com/view/layer-1/?ubq_limit=100
```

The script downloads one CSV per category.

### CSV Fields

| Field | Description |
| --- | --- |
| `category` | Layer 1 or Layer 2 |
| `name` | Project name |
| `slug` | CoinMarketCap slug |
| `website` | Primary website detected from the project panel/page |
| `github` | Public GitHub links detected |
| `docs` | Docs links detected |
| `linkedin` | LinkedIn links detected |
| `twitter` | Twitter/X links detected |
| `discord` | Discord links detected |
| `notes` | Short visible text snippet for human review |

## Enrichment Workflow

After export:

1. merge the L1 and L2 CSVs,
2. normalize GitHub org URLs,
3. deduplicate by GitHub org, website domain, and project name,
4. remove projects already present in nReach ETH DAO lists,
5. enrich remaining rows in Clay or nReach with:
   - company LinkedIn page,
   - founder / devrel / ecosystem lead profiles,
   - public work email where available,
   - GitHub organization metrics,
   - latest repository activity.

## Qualification Score

Use a 100-point score before outreach.

| Signal | Points | Why It Matters |
| --- | ---: | --- |
| Public GitHub org with 5+ active repositories | 20 | UbiquityOS needs a meaningful GitHub surface |
| 20+ open issues across public repos | 20 | Indicates admin load |
| Recent issue/PR activity within 30 days | 15 | Shows the project is alive |
| No clear bounty / contributor routing system | 15 | UbiquityOS has an obvious wedge |
| L1/L2 ecosystem or infrastructure project | 10 | Strong fit for open source contributor workflows |
| Devrel/ecosystem contact found | 10 | Makes outreach practical |
| English public docs and active social channel | 10 | Reduces friction for campaign launch |

Priority:

| Score | Action |
| ---: | --- |
| 75-100 | Launch in first batch |
| 55-74 | Keep for second batch |
| 35-54 | Hold until messaging is proven |
| <35 | Do not contact |

## Campaign Positioning

### One-Line Offer

We help open source crypto teams turn GitHub issues into a managed contributor
pipeline, with UbiquityOS automating labels, rewards, assignment and reporting.

### Pain Points to Test

1. Issues are open but not consistently triaged.
2. Contributors ask for direction but maintainers do not have time to manage them.
3. Bounties are posted manually and inconsistently.
4. Good first issues do not have clear rewards or next steps.
5. The team wants more external contributors without adding operations headcount.

## Outreach Sequence

### Message 1: GitHub Administration Wedge

```text
Subject: Quick GitHub ops idea for {project}

Hi {name},

I was looking at {project}'s public GitHub and noticed there may be a useful
workflow opportunity around issue triage, contributor routing and bounty
administration.

UbiquityOS can sit on top of GitHub and help turn issues into a managed
contributor pipeline: priority labels, time estimates, rewards, assignment and
reporting can be automated instead of handled manually.

Would it be useful if we prepared a short GitHub operations snapshot for
{project} showing where this could reduce maintainer overhead?
```

### Message 2: Managed Service Framing

```text
Subject: Re: GitHub ops idea for {project}

The practical version is simple: {project} can treat GitHub administration like
a lightweight managed service.

UbiquityOS handles the automation layer, and the team can start with a small
pilot around one repo or one issue category before handing over more workflow
control.

If helpful, we can map the first pilot around:
- issue triage,
- reward labels,
- contributor assignment,
- weekly maintainer report.
```

### Message 3: Pilot Ask

```text
Subject: Small pilot around {project}'s GitHub issues?

If there is interest, the first pilot does not need broad access.

We can start from public GitHub activity and propose a 2-week workflow:
1. classify open issues,
2. identify bounty-ready tasks,
3. route contributors,
4. produce a weekly report.

The goal is to prove whether GitHub administration can become more automated
without disrupting the maintainers.
```

## Seven-Day Launch Plan

| Day | Action | Output |
| --- | --- | --- |
| 1 | Run L1/L2 scraper and merge CSVs | Raw candidate table |
| 1 | Deduplicate against nReach / existing DAO lists | Clean candidate table |
| 2 | Score top 100 candidates | Priority list |
| 2 | Enrich top 30 contacts | Launch batch |
| 3 | Send first 15-20 messages | Batch 1 launched |
| 5 | Send first follow-up to non-replies | Follow-up 1 |
| 7 | Review replies and book qualified pilots | Campaign report |

## Reply Handling

| Reply Type | Response |
| --- | --- |
| Interested | Offer a public GitHub operations snapshot before asking for access |
| Not now | Ask whether to send a short example report for one public repo |
| Wrong person | Ask for devrel, ecosystem, open source or engineering operations contact |
| Concerned about access | Clarify that the first snapshot can use only public GitHub data |
| No response | Stop after two follow-ups |

## Launch Guardrails

- Do not send to projects without a visible public GitHub surface.
- Do not send more than 20 first-touch messages in the first batch.
- Do not imply that UbiquityOS already manages the project.
- Do not scrape private code, private emails or hidden community data.
- Use public role-based contacts first where possible.
- Stop outreach to any project that asks not to be contacted.

## Success Metrics

| Metric | Target for First Test |
| --- | ---: |
| Qualified candidates scored | 100 |
| First-touch messages sent | 15-20 |
| Positive replies | 2+ |
| Public GitHub snapshots requested | 1+ |
| Pilot conversations | 1 |

## Next Automation Step

The scraper output can be joined with GitHub organization metrics:

```text
github_org, public_repos, open_issues, open_pull_requests, last_push_at
```

That second pass should be automated with the GitHub API or GraphQL when the
team is ready to score leads at higher volume.
