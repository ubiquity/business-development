# GitHub-Based Marketing

Issue: https://github.com/ubiquity/business-development/issues/90

Closes #90.

Goal: use GitHub search to find teams and contributors already working around bounties, then route the best matches into Ubiquity outreach.

## Why GitHub Search Works

People who open or comment on bounty issues are already showing buying intent:

- maintainers with a backlog they are willing to pay for,
- contributors who already understand bounty workflows,
- repos that need better task pricing, assignment, review, or payout coordination,
- ecosystems using GitHub as their public work marketplace.

This is warmer than generic Web3 or developer outreach because the problem is visible in public issue threads.

## Search Queries

Run these in GitHub issue search, sorted by `Recently updated`. Before each run, update the `updated:>=YYYY-MM-DD` filter to about 30 days ago so the searches stay fresh.

```text
"bounty" "USDC" state:open updated:>=2026-05-01
"bounty" "reward" "agent" state:open updated:>=2026-05-01
"bounty" "good first issue" state:open updated:>=2026-05-01
"Price:" "USD" "bounty" state:open updated:>=2026-05-01
"bounty" "web3" state:open updated:>=2026-05-01
"opire try" "bounty" state:open updated:>=2026-05-01
"/bounty" "Bounties can only be paid" state:open updated:>=2026-05-01
```

Useful filters:

- `comments:>20` finds active marketplaces, but can also mean heavy competition.
- `comments:<20` finds quieter leads where a direct maintainer message may stand out.
- `label:bounty` works on some repos, but many teams encode bounty details in the title/body instead.
- `language:TypeScript`, `language:JavaScript`, `language:Python`, or `language:Solidity` can narrow by contributor supply.

## Scoring

Score each lead from 0 to 10.

| Signal | Points | Notes |
| --- | ---: | --- |
| Explicit price or token reward | 2 | USD/USDC/USDT labels are easiest to qualify. |
| Active in last 14 days | 2 | Avoid stale bounty boards. |
| Multiple bounty issues or many bounty comments | 2 | Indicates repeat workflow pain. |
| Public maintainer or org account | 1 | Easier to contact than anonymous repos. |
| Needs triage/review/assignment tooling | 2 | Strong Ubiquity fit. |
| Low spam / not fake bounty bait | 1 | Avoid noisy or exploitative repos. |

Disqualify:

- scam-like issues,
- tasks requiring private keys, seed phrases, deposits, KYC, or fake reviews,
- issues where the bounty is already paused,
- pull requests already merged or clearly claimed,
- repos with no real maintainer activity.

## Sample Leads Found On 2026-06-08

| Priority | Repo / Issue | Why It Is Relevant | Suggested Angle |
| --- | --- | --- | --- |
| High | `ubiquity/business-development#90` | Internal issue with `Price: 200 USD`; proves the workflow is useful to Ubiquity itself. | Turn this document into a repeatable weekly prospecting motion. |
| High | `spaceandtimefdn/sxt-proof-of-sql#560` | Active bounty label `$200`; test-coverage work can be split among contributors. | Pitch structured bounty decomposition and review coordination. |
| High | `BitgesellOfficial/bitgesell#39` | Public PR bounty program, $10,000 budget, paid per accepted PR. | Pitch bounty ops: task sizing, contributor assignment, payout tracking, and review queue management. |
| Medium | `claude-builders-bounty` issues 1-4 | Bounties powered by Opire, huge comment volume, agent/tooling audience. | Observe as a competitor/partner signal; direct outreach may be crowded. |
| Medium | `gibwork/gibwork-website#12` | Web3 work marketplace with open growth/design tasks. | Partner/competitive research, not a direct bounty-ops lead unless they publish pricing. |
| Medium | `SecureBananaLabs/bug-bounty#743` | Bounty labels and AI-agent-friendly tasks, but very high comment volume. | Only approach if there is a clear maintainer contact and anti-spam fit. |
| Low | `Scottcjn/rustchain-bounties` | Many micro-bounties and custom token payouts. | Useful research source; lower priority because rewards are small and noisy. |

## Outreach Templates

### Maintainer With Repeated Bounty Issues

```text
Hi <name>, I noticed <repo> is using GitHub issues for paid bounty coordination.

The public workflow looks active, but it also seems like triage, assignment, review status, and payout evidence could become hard to track as more contributors join.

Ubiquity can help turn GitHub issues into structured, priced work with clearer contributor routing and less maintainer overhead. If useful, I can map one of your current bounty threads into a structured Ubiquity task so you can compare the workflow.
```

### Contributor Active On Bounty Threads

```text
Hi <name>, I saw your work on GitHub bounty issues around <topic>.

Ubiquity routes open-source tasks through GitHub-native workflows with clearer pricing and review status. If you are already picking up bounty work, it may be worth watching Ubiquity tasks as another source of paid issues.
```

### Ecosystem / Marketplace Partner

```text
Hi <name>, I am mapping GitHub-native bounty workflows across Web3 and open-source teams.

Your project appears to attract developers who already want paid issue work. Ubiquity may be complementary as the structured execution layer for scoped tasks, assignment, and payout evidence.
```

## Weekly Operating Rhythm

1. Run the saved searches every Monday and Thursday.
2. Export the top 30 results into a spreadsheet.
3. Score each lead with the table above.
4. Pick 5 maintainer leads and 10 contributor leads.
5. Avoid posting generic comments into issue threads; use direct maintainer channels when available.
6. Record response, follow-up date, and whether the lead becomes a Ubiquity task, contributor, or partner.

## Fields To Track

```csv
date,repo,issue_url,lead_type,reward,activity,comments,fit_score,contact,target_message,next_action,status
```

## Notes

The strongest near-term fit is not "advertise to everyone who says bounty." It is finding maintainers who already spend time coordinating public paid issues and offering a cleaner task workflow.
