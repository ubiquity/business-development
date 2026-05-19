# GitHub-Based Marketing for DevPool

## Objective

Find projects that already use GitHub issues as paid work queues, then pitch DevPool as a more structured way to price, assign, review, and pay contributors.

This is a high-intent audience because they already understand the behavior DevPool automates:

- posting paid GitHub issues
- attracting outside contributors
- reviewing pull requests
- paying contributors after merge
- handling repeated bounty operations manually

## Search Strategy

Use GitHub issue search as the first channel because the intent signal is public and current.

### High-Intent Queries

```text
is:issue is:open "bounty" "$" "good first issue"
is:issue is:open "bounty" "USDC"
is:issue is:open "bounty" "USD"
is:issue is:open "powered by Opire"
is:issue is:open "Algora" "bounty"
is:issue is:open "/bounty $"
is:issue is:open "Price:" "USD" "Time:"
is:issue is:open "reward" "pull request" "merge"
is:issue is:open "paid on merge"
is:issue is:open "bounty hunter"
```

### Exclusion Filters

Avoid low-quality or poor-fit targets:

```text
- token-only micro rewards with no market liquidity
- star/follow/engagement bounties
- tasks requiring KYC farming or account creation
- private security disclosures
- repos with no maintainer response in 30+ days
- issues with many open competing PRs
- bounties requiring contributors to paste private prompts, secrets, or local environment details
```

## Lead Scoring

Score each lead from 0 to 10.

| Signal | Points | Why it matters |
| --- | ---: | --- |
| Active bounty issue updated in last 30 days | 2 | Maintainer is currently paying attention |
| Reward is denominated in USD, USDC, DAI, or stablecoin | 2 | Easier fit for DevPool payouts |
| Maintainer has posted 3+ bounties | 2 | Repeated workflow pain |
| Bounty is tied to a GitHub issue and PR | 2 | Direct DevPool workflow fit |
| Existing comments show manual coordination overhead | 1 | Clear automation pain |
| Maintainer is a company, DAO, or active OSS team | 1 | Better buyer profile |

Priority:

```text
8-10: Contact now
5-7: Add to nurture list
0-4: Skip unless there is a direct introduction
```

## Initial Lead List

| Priority | Project / Org | Evidence | Fit | Suggested CTA |
| --- | --- | --- | --- | --- |
| High | claude-builders-bounty | Multiple open Opire-powered GitHub bounties from $50-$200 | High-volume bounty workflow, many concurrent submissions | Ask whether they want automated pricing, assignment, review, and payout tracking for future bounty rounds |
| High | Auki Labs / Hagall | Open $50 GitHub bounty for ROS2 relay work | Engineering bounty directly managed in GitHub | Pitch DevPool for future contributor coordination and payment permits |
| High | Algora communities | Public open bounties for ProjectDiscovery, CloudGakkai, Arakoo/EdgeChains | These projects already pay for GitHub issues | Pitch DevPool as complementary automation for teams that outgrow manual bounty boards |
| Medium | ProjectDiscovery / nuclei | Has public bounty history around Go/security issues | Strong OSS audience, high contributor volume | Contact only with a specific workflow improvement angle |
| Medium | Apify / fingerprint-suite | Public bounty board entry for browser fingerprint issues | Technical repo with issue-based paid work | Pitch if maintainers still use issue bounties |
| Medium | ubounty.ai projects | Public USDC bounty marketplace for GitHub issues | Direct category overlap and partner/recruiting potential | Track projects listing bounties and contact maintainers |
| Medium | BountyHub projects | GitHub-integrated bounty platform | Direct category overlap | Use as market map; contact projects, not platform first |
| Low | RustChain / RTC bounty repos | Very active bounty issue flow but many rewards are native RTC and engagement-based | High noise, unclear USD liquidity | Use as observation source, not first outreach target |
| Low | generic bug bounty platforms | HackerOne, Immunefi, HackenProof, YesWeHack | Security programs, not general GitHub task management | Only relevant for security-specific DevPool positioning |

## Outreach Positioning

Core message:

```text
You already use GitHub issues as paid work. DevPool helps turn that into a repeatable workflow: price the task, assign contributors, track delivery, review pull requests, and generate payout permits after merge.
```

Pain points to mention:

```text
- too many manual bounty comments
- repeated payout coordination
- unclear issue pricing
- duplicate or low-quality submissions
- no consistent contributor history
- hard to tell which bounty hunters are reliable
```

## First Contact Template

```text
Hi <name>, I noticed your team is already using GitHub issues for paid contributor work, for example <specific issue or bounty link>.

Ubiquity DevPool is built for this exact workflow: pricing GitHub issues, assigning contributors, tracking delivery, and generating payout permits after work is merged.

This may be useful if you plan to run more bounties and want less manual coordination in issue comments.

Would it be useful if I mapped one of your current bounty workflows into a DevPool-style setup so you can compare the process?
```

## Short GitHub Comment Template

Use only when the repository welcomes product suggestions or partnership discussion.

```text
This bounty workflow looks like a strong fit for GitHub-native contributor management.

Ubiquity DevPool automates issue pricing, assignment, PR tracking, and payout permit generation for GitHub-based work. If your team plans to run more bounties, I can share a concrete workflow map using this issue as an example.
```

## Follow-Up Template

```text
Following up with a concrete example:

For <repo>, DevPool could map:
- issue labels -> price and priority
- contributor comment -> assignment
- linked PR -> delivery tracking
- merged PR -> payout permit

The main benefit is reducing manual bounty coordination while keeping the work inside GitHub.
```

## Weekly Operating Loop

1. Search the high-intent queries every Monday and Thursday.
2. Add leads scoring 5+ to a simple sheet.
3. Contact only leads scoring 8+ immediately.
4. For each contacted project, include one specific issue link.
5. After 7 days, follow up once with a workflow map.
6. If no reply after 14 days, archive the lead.

## Metrics

Track:

```text
Leads found per week
Leads scoring 8+
First messages sent
Reply rate
Calls booked
Projects willing to test DevPool
Projects that create a paid DevPool issue
```

Target for the first two weeks:

```text
50 qualified leads
15 high-priority contacts
3 replies
1 pilot conversation
```

## Why This Channel Should Work

Traditional cold outreach starts from weak intent. GitHub bounty search starts from explicit behavior: the project is already spending money to get issues solved. DevPool does not need to convince these teams that paid GitHub work is useful; it only needs to show that their existing process can become easier to operate.

## Immediate Next Actions

1. Contact maintainers from 5 high-priority leads with issue-specific messages.
2. Create a lightweight CRM sheet using the scoring table above.
3. Turn the best reply into a concrete DevPool workflow map.
4. Re-run the search weekly and add fresh bounty projects.

## PR Summary

This contribution adds two practical assets for the GitHub-based marketing task:

```text
archive/github-based-marketing-bounty-leads.md
archive/github-based-marketing-leads.csv
```

The Markdown file explains the channel strategy, search queries, exclusion filters, lead scoring, positioning, outreach templates, weekly operating loop, and success metrics.

The CSV file turns the strategy into an actionable first lead list with priority, score, evidence, fit, recommended action, and status.

These files are intended to let the team start outreach immediately rather than first designing the campaign from scratch.
