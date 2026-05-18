# GitHub-Based Marketing Playbook

This playbook turns GitHub issue search into a repeatable business-development channel for Ubiquity. The goal is to find open-source teams that already understand bounties, rewards, contributor routing, or pay-for-work workflows, then approach only the highest-signal conversations with useful context.

## 1. Channel Thesis

Many teams already search GitHub for terms like "bounty", "reward", and "paid issue" to find work. Ubiquity can use the same surface for growth, but the winning strategy is not raw keyword matching. The useful signal is recent engagement: comments, reactions, labels, pull requests, and maintainer activity added in the last few days.

This matters because generic searches lead every growth team to the same old issues. Ranking by recent engagement delta finds live conversations where maintainers are still reading and making decisions.

## 2. Weekly Workflow

Run this loop once per week, then keep a short target sheet updated.

1. Search GitHub for active bounty and reward signals.
2. Remove stale or already-solved issues.
3. Score each lead using the rubric below.
4. Shortlist 10-20 targets.
5. Review the repository and latest comments before outreach.
6. Write a contextual comment only when Ubiquity can add clear value.
7. Track replies, follow-ups, conversions, and false-positive queries.

Do not post the same message across many repositories. Every comment should mention a concrete workflow problem observed in that repo.

## 3. Search Queries

Use GitHub issue search with `is:issue is:open` and sort by recently updated.

High-intent queries:

```text
is:issue is:open bounty updated:>YYYY-MM-DD
is:issue is:open "Price:" "USD" updated:>YYYY-MM-DD
is:issue is:open "Bounty" "USD" updated:>YYYY-MM-DD
is:issue is:open "reward" "pull request" updated:>YYYY-MM-DD
is:issue is:open "good first issue" bounty updated:>YYYY-MM-DD
is:issue is:open "Gitcoin" bounty updated:>YYYY-MM-DD
is:issue is:open "Algora" bounty updated:>YYYY-MM-DD
is:issue is:open "Polar" reward updated:>YYYY-MM-DD
```

Ubiquity-specific competitor and adjacent-workflow queries:

```text
is:issue is:open "pay when PRs are merged"
is:issue is:open "bounty board"
is:issue is:open "paid contributor"
is:issue is:open "contributor payment"
is:issue is:open "wallet" "bounty"
is:issue is:open "USDC" "bounty"
```

Recommended date window: last 7 days for first pass, then last 30 days if the result set is thin.

## 4. Lead Scoring Rubric

Score each candidate from 0-20.

| Signal | Points | How to evaluate |
| --- | ---: | --- |
| Recent activity | 0-5 | Comments or label changes in the last 7 days score highest. |
| Maintainer responsiveness | 0-4 | Maintainers answer claims, review PRs, or award rewards. |
| Workflow fit | 0-4 | Repo has repeated bounty, contributor, assignment, or payment friction. |
| Ubiquity differentiation | 0-3 | Crypto-native, automation, DevPool, pricing, or issue orchestration is relevant. |
| Outreach quality | 0-2 | There is a specific problem to mention, not just a generic pitch. |
| Risk control | 0-2 | Avoid spam-heavy, already-claimed, abandoned, or unclear-payment threads. |

Recommended action:

- 16-20: outreach candidate this week.
- 11-15: monitor or comment only if there is a concrete hook.
- 6-10: add to watchlist.
- 0-5: ignore.

## 5. Seed Target List

These were found from recently updated GitHub bounty/reward searches. Revalidate before outreach because issue state changes quickly.

| Target | Signal | Why it matters for Ubiquity | Outreach eligible |
| --- | --- | --- | --- |
| [ubiquity-os-marketplace/daemon-disqualifier#135](https://github.com/ubiquity-os-marketplace/daemon-disqualifier/issues/135) | UbiquityOS labels: `Price: 75 USD`, `Time: 2 Hours` | Internal reference for how Ubiquity issue pricing appears in GitHub search. | No (reference only) |
| [claude-builders-bounty#1](https://github.com/claude-builders-bounty/claude-builders-bounty/issues/1) | Active `BOUNTY $50`, high comment velocity | Shows demand for AI-agent work bounties and structured claim workflows. | Yes |
| [SecureBananaLabs/bug-bounty#30](https://github.com/SecureBananaLabs/bug-bounty/issues/30) | `good first issue`, bounty labels, high-dollar reward | Useful for studying AI-agent-friendly bounty positioning and trust signals. | Yes |
| [Expensify/App#88504](https://github.com/Expensify/App/issues/88504) | Due-for-payment issue with USD amount | Mature public payout workflow; good benchmark for transparency and payment language. | Yes |
| [tscircuit/prompt-benchmarks#45](https://github.com/tscircuit/prompt-benchmarks/issues/45) | Algora $5 bounty with attempt/claim bot flow | Low-value but clear example of automated bounty lifecycle. | Yes |
| [tscircuit/kicad-component-converter#114](https://github.com/tscircuit/kicad-component-converter/issues/114) | Algora $50 bounty, many attempts | High competition; useful to study where bounty workflows get noisy. | Yes |
| [Scottcjn/rustchain-bounties#71](https://github.com/Scottcjn/rustchain-bounties/issues/71) | Ongoing bug bounty program, active community | Crypto/community bounty structure that may value wallet-native payouts. | Yes |
| [Scottcjn/rustchain-bounties#73](https://github.com/Scottcjn/rustchain-bounties/issues/73) | Code review bounty program with very high activity | Good example of a repeatable non-code bounty workflow. | Yes |
| [XDC-Community/XDPoSChain#1](https://github.com/XDC-Community/XDPoSChain/issues/1) | Gitcoin bounty label | Web3 ecosystem lead where contributor incentives are already accepted. | Yes |
| [daytonaio/content#13](https://github.com/daytonaio/content/issues/13) | Recent bounty-tagged content task | Content bounty candidate; useful for comparing non-code reward workflows. | Yes |

## 6. Outreach Rules

Only comment when the message is tied to the repository's actual workflow.

Good outreach structure:

```text
I noticed this repo is already coordinating paid contributor work through [specific signal].
Ubiquity may be relevant because it can [specific value: pricing, wallet-native payouts, assignment, review, automation].
If useful, I can map this issue flow into a minimal UbiquityOS-style workflow and show what would change.
```

Avoid:

- Posting a generic "try Ubiquity" pitch.
- Commenting on issues where a contributor is already actively claiming the bounty.
- Commenting on abandoned bounty platforms where payout trust is already damaged.
- Repeating the same message across multiple repos in one day.

## 7. Tracking Sheet Columns

Use these fields in a lightweight spreadsheet or GitHub project.

| Field | Purpose |
| --- | --- |
| Repository | Owner/repo. |
| Issue URL | Exact thread to revisit. |
| Platform signal | Algora, Gitcoin, Polar, manual USD, Ubiquity labels, crypto token, other. |
| Reward signal | Amount, token, or payment language. |
| Last activity date | Used for engagement-delta ranking. |
| Maintainer activity | Last maintainer reply, merge, award, or payment confirmation. |
| Fit score | 0-20 from the rubric. |
| Outreach hook | One sentence explaining why Ubiquity is relevant. |
| Status | Watchlist, contacted, replied, follow-up, converted, rejected. |
| Next action date | Prevents accidental spam and duplicate follow-ups. |

## 8. Metrics

Track this as a funnel, not as raw comment volume.

Weekly metrics:

- Search results reviewed.
- Qualified leads above score 15.
- Contextual comments posted.
- Maintainer replies.
- Calls or async discussions started.
- Repositories that adopt a Ubiquity workflow.
- Search queries that produced false positives.

Success target for the first month:

- 40-60 qualified leads reviewed.
- 10-15 contextual outreach comments.
- 3-5 maintainer replies.
- 1-2 serious integration conversations.

## 9. First Week Execution Plan

1. Run the high-intent queries for the last 7 days.
2. Score the top 50 results.
3. Pick 10 targets with recent maintainer activity and clear bounty workflow pain.
4. Draft one custom comment per target, but post only after manual review.
5. Log which query found each lead.
6. At the end of the week, remove search terms that produced stale or spam-heavy results.

The first week should optimize for learning which search terms produce conversations, not for maximum outreach volume.
