# GitHub Based Marketing Lead Workflow

This note adds an executable workflow for issue #90: finding Web3 projects that already publish bounties on GitHub and turning those issue searches into a lightweight Ubiquity outreach queue.

## Why GitHub issue search

Many Web3 teams already publish bounty metadata directly in GitHub issues instead of on a standalone job board. The strongest lead signals are:

- explicit payout terms such as `USDC`, `USDT`, `Payment:`, `Price:`, or a dollar value
- labels such as `bounty`, `good first issue`, `help wanted`, or `AI agent friendly`
- open, unassigned issues with low comment count
- recently updated issues, because stale bounty threads waste outreach time

The new script in `scrapers/github-bounty-leads.js` searches these signals, deduplicates issue URLs, scores leads, and writes JSON and CSV outputs.

## How to run

```bash
GITHUB_TOKEN=github_pat_xxx node scrapers/github-bounty-leads.js --limit 30 --days 45
```

Dry run mode prints the exact search URLs and seed bounty boards without calling the GitHub API:

```bash
node scrapers/github-bounty-leads.js --dry-run
```

Default outputs are written under:

```text
archive/bounty-boards/generated/
```

## Search queries

- `is:issue is:open bounty USDC`
- `is:issue is:open bounty USDT`
- `is:issue is:open "AI agent friendly" bounty`
- `is:issue is:open "Price:" "Time:" "Priority:"`
- `is:issue is:open "good first issue" bounty`
- `is:issue is:open "USDC on Base"`

These queries intentionally start narrow. They favor high-intent leads over broad noisy searches for the word `bounty`.

## Scoring rules

Positive signals:

- stablecoin or chain payout wording
- explicit bounty, reward, price, or payment wording
- agent-accessible labels or wording
- no current assignee
- recently updated
- low discussion volume

Negative signals:

- result is already a pull request
- crowded issue discussion
- assigned, duplicate, closed, or in-progress wording
- prompt, credential, private key, or seed phrase wording

The last exclusion keeps outreach away from tasks that could require unsafe data disclosure.

## Leads observed during this pass

| Lead | URL | Use |
| --- | --- | --- |
| xevrion agent-playground seed labels bounty | https://github.com/xevrion-v2/agent-playground/issues/957 | Good example of English Web3 bounty metadata: `$50`, `Payment: USDC on Base`, and `AI agent friendly`. Crowded now, useful as a source pattern. |
| Ubiquity business-development issue #90 | https://github.com/ubiquity/business-development/issues/90 | Current target issue. Best contribution path is a code-backed workflow rather than another static comment. |
| Algora Tailcall bounties | https://algora.io/tailcallhq/bounties/community?fund=tailcallhq%2Ftailcall%231121 | Public GitHub-linked developer bounties. Useful for recurring manual review. |
| Algora Daytona bounties | https://algora.io/daytonaio/bounties?status=open | Developer-tooling bounty source. |
| Algora Highlight bounties | https://algora.io/highlight/bounties?status=open | Open-source issue bounty source. |

## Outreach fit

After a lead is scored, the outreach should be short and specific:

```text
Hi, I found your open bounty issue while mapping GitHub-native Web3 bounty programs for Ubiquity.

Ubiquity can help route agent-friendly tasks to contributors, keep task state visible in GitHub, and support crypto-native payout workflows. If useful, I can share the lead notes or help map the first few bounty issues into a reproducible contributor workflow.
```

## Suggested cadence

- Run the scraper twice per week with a GitHub token.
- Review the top 20 scored leads manually before outreach.
- Save accepted or rejected leads in the generated CSV so future passes avoid repeat contact.
- Add project-specific queries after a high-quality lead is found, for example `org:example bounty USDC`.

## Follow-up improvements

- Add repository metadata such as stars, last push date, and primary language.
- Add a small allowlist for bounty platforms that expose GitHub issue URLs.
- Add a manual `rejected_leads.csv` file to prevent repeat outreach.
