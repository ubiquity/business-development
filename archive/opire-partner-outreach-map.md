# Opire Partner Outreach Map

## Objective

Evaluate whether Opire can become a useful partner channel for Ubiquity and define a
small, GitHub-native outreach experiment that can be completed in less than one day.

The issue points to Opire because it is also trying to coordinate bounties around
GitHub work. The opportunity is not broad partnership theater. It is to identify
where Opire's partner projects still have coordination, assignment, review, or payout
friction that Ubiquity could solve better.

## Working Hypothesis

Opire is most useful to Ubiquity if it exposes projects that already believe in paid
open-source work but still run part of the workflow manually. Those projects are easier
to approach than cold repositories because they already understand the value of paying
contributors.

The outreach should therefore be framed as:

> You already use GitHub issues and bounties to get work done. Ubiquity can help make
> assignment, progress tracking, review state, and payout state more auditable inside
> GitHub.

## What to Check First

Before contacting anyone, review Opire-related projects against this checklist:

| Signal | Why it matters | Pass condition |
| --- | --- | --- |
| Recent bounty activity | Shows that paid work is not theoretical | Activity in the last 30-60 days |
| GitHub issue workflow | Ubiquity is strongest when the workflow already lives in GitHub | Issues and PRs are public |
| Manual assignment comments | Indicates coordination overhead | Contributors ask to be assigned or maintainers manually confirm |
| Ambiguous payment state | Indicates trust and operations friction | It is not obvious which PR won or when payout happens |
| Maintainer responsiveness | Outreach only works if someone reads it | Maintainer replies in recent threads |
| No existing complete bounty bot | Avoids pitching where the need is already solved | No clear automated claim/reward loop |

## Partner Segment Priority

### Tier 1: Best Fit

Projects that already publish GitHub issues with:

- explicit bounty or reward language,
- multiple contributors attempting the same task,
- visible confusion about assignment or payout,
- maintainers reviewing PRs in public.

These projects can understand Ubiquity quickly because the pain is visible in their
own issue threads.

### Tier 2: Possible Fit

Projects using Opire or bounty labels but with low recent activity. These may still be
useful for a future nurture list, but they should not be the first outreach batch.

### Tier 3: Poor Fit

Projects where:

- work happens outside GitHub,
- the repository is inactive,
- bounties are only historical,
- rewards are informal promises without visible review or payout behavior.

These should not be contacted in the first pilot.

## Search Workflow

Use GitHub search and Opire references to build a small target list.

```text
"Opire" "bounty" "GitHub"
"opire" "reward" "pull request"
"opire" "bounty" site:github.com
"bounty" "Opire" is:issue is:open
"reward" "Opire" is:issue is:open
```

Then score each candidate from 0 to 10:

| Factor | Points |
| --- | ---: |
| Active maintainer in last 30 days | 2 |
| Public bounty/reward workflow | 2 |
| Multiple contributors or attempts | 2 |
| Assignment/review/payout state is unclear | 2 |
| Project is a credible open-source or commercial repo | 1 |
| Ubiquity can explain a concrete improvement in one comment | 1 |

Only act on repositories scoring 7 or higher.

## Outreach Rule

Do not pitch Ubiquity generically. Each message must point to one visible workflow
problem in the repository.

Good:

> In this issue, several contributors appear to be coordinating manually around the
> same bounty. Ubiquity could make assignment, activity, and payout state visible in
> the GitHub thread.

Bad:

> Ubiquity is a better bounty platform. Please try it.

## First Message Template

```text
Hi [name],

I found this because the project already seems to use GitHub issues for bounty-style
work.

One thing that stood out is that assignment, progress, review, and payout state are
spread across comments and PRs. That makes it harder for maintainers to know who is
actually working, and harder for contributors to know what has been accepted.

Ubiquity may be a fit because it keeps that workflow GitHub-native: pricing, assignment,
activity checks, review state, and payout state can all stay attached to the issue.

If useful, I can map one current bounty thread into a Ubiquity-style workflow so you can
compare the coordination overhead.
```

## Recommended Pilot

Run a five-target pilot:

1. Select five Opire-related repositories or partner projects.
2. Score them with the rubric above.
3. Contact only the top two or three.
4. For each contacted repo, map one live bounty issue into a Ubiquity workflow.
5. Track whether the maintainer asks a follow-up question, shares a pain point, or agrees
   to test a small workflow.

## Pilot Metrics

| Metric | Target |
| --- | ---: |
| Repositories reviewed | 10 |
| Repositories scoring 7+ | 3-5 |
| Personalized comments/messages sent | 2-3 |
| Maintainer replies | 1 |
| Workflow map requested | 1 |
| Ubiquity pilot candidate created | 1 |

The pilot succeeds if one maintainer asks for a workflow map or agrees to test Ubiquity
on a small set of existing bounty issues.

## Risk Controls

- Do not spam Opire partners.
- Do not send duplicate text.
- Do not contact inactive repositories.
- Do not frame this as replacing Opire.
- Do not mention payouts unless the project already discusses bounties or rewards.
- Stop if a maintainer does not engage.

## Deliverable Checklist

- [x] Opire partner qualification rubric
- [x] Search workflow
- [x] Outreach rule
- [x] First message template
- [x] Five-target pilot design
- [x] Success metrics
- [x] Risk controls
