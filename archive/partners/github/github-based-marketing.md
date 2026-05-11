# GitHub Based Marketing Workflow

This workflow turns public GitHub issue search into a repeatable lead source for Ubiquity. The goal is to find projects already using bounty language, then approach only relevant maintainers with a concrete DevPool/Ubiquity angle.

## Why This Channel Works

Teams that mention bounties on GitHub already understand task-based contribution and public rewards. They are warmer than generic Web3 leads because they have at least one of these signals:

- They fund work directly on issues.
- They discuss contributor assignment and payment in public.
- They already have unresolved work with `bounty`, `help wanted`, or `good first issue` labels.
- They have contributors asking about payout mechanics.

The outreach should not be a bulk comment campaign. It should be a shortlist-based process: identify the maintainer, verify that the repo has a real project behind it, then send a specific suggestion through the project's preferred contact channel.

## Lead Generation

Run the scraper from the repository root:

```sh
node scrapers/github-bounty-leads.js --per-query 20 --min-score 6
```

For CSV export:

```sh
node scrapers/github-bounty-leads.js --per-query 50 --min-score 7 --format csv > github-bounty-leads.csv
```

The script searches GitHub issues for bounty-related language, deduplicates results, and scores each lead. It works without credentials, but `GITHUB_TOKEN` is recommended to avoid low rate limits:

```sh
GITHUB_TOKEN=github_pat_xxx node scrapers/github-bounty-leads.js
```

## Scoring Rules

Higher scores mean a lead is more likely to be worth manual review:

- `+4` if the issue mentions at least `$20`.
- `+2` if the issue mentions at least `$100`.
- `+3` if the issue has a bounty label.
- `+1` if it has `help wanted` or `good first issue`.
- `+2` if the issue is open.
- `+2` if comment volume is low.
- `-2` if comment volume is already high.
- `-3` for obvious test, demo, sandbox, fork, archive, or mirror repos.
- `-5` for giveaway, referral, scam, or airdrop language.

These rules bias toward real maintainers who have a bounty process but may not have a full contributor marketplace.

## Manual Review Checklist

Before contacting anyone, check:

- The repository is active in the last 30 days.
- The issue is not already assigned or solved by an open PR.
- The bounty appears to be paid in money or a credible token, not only points.
- The maintainer has a public contact path: GitHub profile email, project website, Discord, Telegram, or X.
- Ubiquity has a clear improvement to offer: pricing automation, bounty lifecycle management, task verification, or contributor routing.

Reject leads where the only possible action is public spam. A bad public comment damages the channel.

## Outreach Pattern

Use a short message that proves the issue was read:

```text
Hi <name>, I noticed <repo> is already using GitHub issues for bounties, especially <specific issue>.

Ubiquity helps teams run the same workflow with assignment, pricing, verification, and payout tracking around GitHub issues. The useful fit here seems to be <one concrete pain point>.

Would it be useful if I mapped one of your active bounty issues into a Ubiquity-style task flow so you can compare the process?
```

If the project has a community channel, send one message there. If not, use a GitHub discussion or maintainer email. Avoid commenting on unrelated issues.

## Daily Operating Loop

1. Run the scraper and export CSV.
2. Review the top 20 leads manually.
3. Pick 5 high-confidence maintainers.
4. Write one specific outreach line per maintainer.
5. Track replies in a simple sheet with `repo`, `contact`, `sent_at`, `reply`, and `next_step`.

The expected output is not a large list. It is a small number of projects where the maintainer already has bounty intent and Ubiquity can remove operational friction.

## Example Follow-Up

```text
Thanks. If helpful, I can put together a concrete example using <issue URL>: suggested price, acceptance criteria, verification gate, and payout handoff. That tends to make the difference clearer than a generic demo.
```

## Success Metrics

- Number of qualified leads found per run.
- Number of maintainers contacted.
- Reply rate.
- Number of maintainers who agree to a mapped task-flow example.
- Number of projects that open a paid task or request a demo.
