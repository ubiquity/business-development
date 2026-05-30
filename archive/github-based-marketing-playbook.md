# GitHub Based Marketing Playbook

This playbook turns issue #90 into an executable workflow for finding teams that are already searching for bounties on GitHub and routing them toward Ubiquity OS / DevPool.

## Goal

Find GitHub-native projects and teams that are actively discussing bounties, contributor rewards, grants, or paid open source tasks, then start a useful conversation without spam.

## Search Queries

Use GitHub issue and discussion search with these queries:

```text
"bounty" "good first issue" state:open
"bounty" "help wanted" state:open
"Price:" "Time:" state:open
"reward" "open source" "issue" state:open
"paid" "contributors" "good first issue" state:open
"GitHub bounty" state:open
"USDC" "bounty" state:open
"crypto" "bounty" "issue" state:open
"maintainers" "bounty" "contributors" state:open
"contributors" "rewards" "GitHub" state:open
```

Add niche filters when needed:

```text
"bounty" "dao" state:open
"bounty" "web3" state:open
"bounty" "developer relations" state:open
"bounty" "open source maintainers" state:open
"bounty" "agents" state:open
```

## Qualification Criteria

Prioritize repositories that meet at least three criteria:

- They already use issues or PRs to coordinate paid work.
- They have labels such as `bounty`, `price`, `reward`, `paid`, `good first issue`, or `help wanted`.
- They have at least five active contributors or recent PR activity.
- They operate in Web3, AI agents, developer tooling, infrastructure, or open source SaaS.
- Maintainers respond publicly within the last 30 days.
- The project has visible friction around contributor assignment, payouts, QA, or issue triage.

Avoid:

- Abandoned repos.
- Spammy airdrop/review tasks.
- Projects asking for deposits, private keys, or fake engagement.
- Security bounty programs that require formal pentest scope unless Ubiquity is explicitly a fit.

## Outreach Angles

### For projects already running bounties

```text
I noticed you are already coordinating bounties through GitHub issues.

Ubiquity OS / DevPool may be useful if you want to turn GitHub issues into a more reliable contributor workflow with assignment, pricing, review, and reward automation.

The most relevant fit I see is:

- your existing bounty labels
- contributor assignment/review flow
- payout/reward coordination
- repeatable issue templates

Would it be useful if I mapped one of your current bounty issues into a Ubiquity-style workflow as a concrete example?
```

### For projects with many help-wanted issues

```text
You have a healthy queue of help-wanted issues. If some of those are high-value but hard to move, Ubiquity OS / DevPool could help convert them into scoped paid tasks that external contributors can pick up.

I can share a short example using one issue from your repo:

- suggested price/time label
- acceptance criteria
- contributor workflow
- review and merge path
```

### For AI agent projects

```text
I found your repo while searching for AI-agent bounty workflows.

Ubiquity OS looks especially relevant for agent-friendly task routing because it keeps work GitHub-native while adding structure around issue pricing, assignment, and reward flow.

If useful, I can draft a sample "agent-friendly bounty issue" from one of your open issues.
```

## Data Capture Sheet

Use this schema:

```csv
repo,url,category,signal,maintainer_activity,bounty_fit,next_action,status
```

Example rows:

```csv
owner/repo,https://github.com/owner/repo/issues/1,AI agents,bounty label + active PRs,active,high,comment with workflow example,new
owner/repo,https://github.com/owner/repo/issues/2,developer tooling,help wanted queue,medium,medium,send maintainer message,new
```

## Daily Workflow

1. Run 5 GitHub searches.
2. Save 20 candidate repos.
3. Score each candidate from 1-5 on:
   - bounty signal
   - maintainer activity
   - Ubiquity fit
   - likelihood of response
4. Contact the top 5 with a tailored comment or issue.
5. Track replies and conversion to demo/workflow setup.

## Comment Rules

- Be specific to the repo and issue.
- Do not paste generic ads.
- Offer to map one existing issue into a concrete Ubiquity workflow.
- Do not comment on repos where Ubiquity is not clearly relevant.
- Stop after one comment unless they reply.

## Success Metrics

- 20 qualified repos found per day.
- 5 tailored comments or maintainer messages per day.
- 1-2 replies per week.
- 1 qualified demo/setup conversation per week.

## First Batch Search Targets

Search and review these categories first:

- AI agent frameworks.
- Open source developer tools.
- Web3 infrastructure.
- DAO tooling.
- GitHub automation tools.
- Contributor reward platforms.

## Reusable Deliverable

For each qualified repo, produce a one-page "Ubiquity workflow example":

```markdown
# Ubiquity Workflow Example for owner/repo

## Existing issue

Link:

## Suggested bounty labels

- Time:
- Priority:
- Price:

## Acceptance criteria

-
-
-

## Contributor flow

1. Contributor claims issue.
2. Maintainer confirms scope.
3. Contributor opens PR.
4. Review bot/checks validate.
5. Maintainer merges and reward flow starts.

## Why this repo fits

-
-
```

