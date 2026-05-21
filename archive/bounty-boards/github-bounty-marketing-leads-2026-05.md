# GitHub-Based Marketing Leads

Issue: [#90 GitHub Based Marketing](https://github.com/ubiquity/business-development/issues/90)

Date researched: 2026-05-20

## Goal

Find GitHub projects that already use bounty labels, paid issue workflows, or bounty-style contributor programs, then give Ubiquity a short, low-friction outreach path. These projects are more likely to understand Ubiquity because they already have a visible need for contributor coordination, automated pricing, or bounty payment operations.

## Search Method

GitHub issue search was used with queries around:

- `is:issue is:open bounty`
- `is:issue is:open label:bounty`
- `is:issue is:open "pay" "bounty"`
- `is:issue is:open "reward" "bounty"`

Results that required prompt disclosure, private personal data, or unsafe agent traceability dumps were excluded.

## Priority Leads

| Project | Example Signal | Why It Fits Ubiquity | Suggested Angle |
| --- | --- | --- | --- |
| [terrastruct/d2](https://github.com/terrastruct/d2/issues/1578) | Open issue with `💎 Bounty` label | Mature OSS project with a visible bounty label and high contributor surface area | "If bounties become a recurring workflow, Ubiquity can help price, assign, and settle tasks directly from GitHub." |
| [Dokploy/dokploy](https://github.com/Dokploy/dokploy/issues/1413) | Open `$100` bounty issue for organization/team management | Developer-tool project with many feature issues and active contributors | "Ubiquity can help turn high-signal feature issues into paid contributor tasks without a separate bounty board." |
| [archestra-ai/archestra](https://github.com/archestra-ai/archestra/issues/3012) | Multiple `$150-$200` GitHub bounty issues | AI/devtool project with many bounty-labeled issues and frequent PR traffic | "Ubiquity can reduce duplicate PR races and automate bounty lifecycle rules." |
| [getdozer/dozer](https://github.com/getdozer/dozer/issues/1659) | Open `💎 Bounty` issue for streaming SQL `IN` support | Infrastructure project with deeper implementation tasks | "Ubiquity can help split large bounty issues into reviewable, priced subtasks." |
| [coder/code-server](https://github.com/coder/code-server/issues/7198) | User-created `$100` bounty request | Large OSS project where users organically offer payment for specific fixes | "Ubiquity can formalize community-funded requests that currently live as ad hoc issue comments." |
| [qtop/qtop](https://github.com/qtop/qtop/issues/356) | Challenge issue with process requirements and bounty mission wording | Maintainer already has strict challenge/review requirements | "Ubiquity can enforce claim, review, and payout process constraints in GitHub-native workflows." |
| [Kozea/pygal](https://github.com/Kozea/pygal/issues/426) | `$300 Bounty` issue for chart support | Long-lived OSS project with a paid feature request | "Ubiquity can capture old but valuable paid feature requests before they go stale." |
| [OpenAngelArena/oaa](https://github.com/OpenAngelArena/oaa/issues/2093) | `300€ Bounty` issue | Game/open-source project using direct bounty language | "Ubiquity can make payout and acceptance criteria explicit for community-funded features." |
| [Stakwork/sphinx-tribes](https://github.com/stakwork/sphinx-tribes/issues/902) | Bounty-labeled test issue | Existing bounty/task ecosystem with GitHub issue workflows | "Ubiquity can integrate or benchmark against existing bounty operations." |
| [scratchdata/scratchdata](https://github.com/scratchdata/scratchdata/issues/126) | Rewarded `💎 Bounty` issue history | Shows project has used paid issue labels before | "Ubiquity can support repeat bounty programs after a successful first rewarded issue." |

## Lightweight Outreach Copy

Use this as a GitHub issue comment or maintainer DM only where project rules allow it:

```text
Noticed this project already uses bounty-style GitHub issues. Ubiquity may be relevant if you want a GitHub-native way to price issues, manage attempts, enforce acceptance criteria, and automate payout/review workflows without moving contributors to a separate bounty board.

Would it be useful if someone opened a short integration/process proposal for how Ubiquity could fit your current bounty workflow?
```

## Shorter Version

```text
Saw the bounty workflow here. Ubiquity is built around GitHub-native paid issue workflows: pricing, attempts, reviews, and payout automation. Worth a look if bounties are becoming a recurring pattern for this repo.
```

## Recommended Next Step

Start with projects where bounty labels are recent and repeated, not one-off old comments:

1. `archestra-ai/archestra`
2. `Dokploy/dokploy`
3. `terrastruct/d2`
4. `getdozer/dozer`
5. `qtop/qtop`

Post only if the target project permits tool or product suggestions. Avoid posting on security issues, private payout discussions, or threads where outreach would be off-topic.

