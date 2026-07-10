# GitHub Bounty Lead Generation

This workflow turns public GitHub bounty issues into a qualified business-development lead queue for Ubiquity.

## Purpose

Many projects already advertise paid work directly in GitHub issues through labels, `/bounty` comments, or issue text such as `Reward`, `Payment`, `Price`, and `Time`. These projects are good prospects because they already understand paid open-source contribution but may not have a structured GitHub-native workflow for contributor routing, pricing, and payout operations.

## Script

Run the lead finder from the repository root:

```sh
node scrapers/github-bounty-leads.js --max-per-query 10 --format markdown
```

Use a token for higher GitHub API limits:

```sh
GITHUB_TOKEN=<github-token> node scrapers/github-bounty-leads.js --max-per-query 30 --format csv
```

Unauthenticated runs are useful for a quick smoke test, but GitHub's public search API can rate-limit quickly. Use `GITHUB_TOKEN` or `GH_TOKEN` for routine weekly runs.

The script is read-only. It searches public issues, checks whether open pull requests already reference each issue, scores the lead, and prints a table. It does not post comments, open issues, send messages, or contact anyone.

## Scoring Signals

Higher scores mean a lead is more likely to be worth manual review.

- Posted amount is visible and material.
- The issue has zero or few open pull requests.
- The issue has low comment volume, which can indicate low competition.
- The issue was updated recently.
- The project already uses bounty labels, `/bounty`, `Price`, `Time`, or payout instructions.

Risky leads are excluded by default when the text mentions wallet, stake, KYC, airdrop, giveaway, private keys, or similar signals. Use `--include-risky` only for research, not outreach.

## Manual Qualification

Before outreach, review each candidate manually:

- Confirm the issue is still open and not already completed.
- Confirm there is a real maintainer, project, or organization behind it.
- Confirm the bounty language is public and not a bug disclosure or private security report.
- Exclude spam, social-only tasks, wallet-signing tasks, or anything that asks for secrets.
- Check whether Ubiquity can offer a concrete improvement to the current workflow.

## Outreach Positioning

Keep outreach specific and low-volume. Do not paste generic comments across many repositories.

Useful angles:

- "You already run paid tasks in GitHub; Ubiquity can help standardize pricing, assignment, and completion tracking."
- "Your issue has multiple contributors competing; Ubiquity can route contributors and reduce maintainer coordination overhead."
- "Your current bounty instructions are manual; Ubiquity can keep the workflow inside GitHub with structured labels and bot commands."

Do not claim that Ubiquity has evaluated or endorsed a project unless someone has reviewed it directly. Do not post on issues that prohibit promotion, hiring, or off-topic comments.

## Suggested Cadence

- Run the script weekly.
- Review the top 20 leads manually.
- Contact only the best 3-5 fits with tailored context.
- Record contacted projects and outcomes in the business-development tracker before repeating outreach.
