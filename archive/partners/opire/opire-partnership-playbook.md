# Opire Partnership Playbook

Prepared for [ubiquity/business-development#89](https://github.com/ubiquity/business-development/issues/89) on 2026-05-13.

## Executive Summary

Opire is a strong business-development target for Ubiquity because it already aggregates paid GitHub issue work and has public traction. Its open-startup page reports 35 bounties paid, USD 4,655 paid in bounties, 204 available bounties, USD 54,767.22 available in bounties, 5,414 users, 11,406 projects with OpireBot, and 60 projects benefited.

The best collaboration angle is not to ask Opire for generic partnership. Ubiquity should offer a concrete "bounty operations desk" pilot:

1. Pick 5-10 Opire bounties that are high-value but stale or under-specified.
2. Turn them into contributor-ready specs with acceptance criteria, reproduction notes, and test plans.
3. Route implementation work to Ubiquity's contributor network where relevant.
4. Publish outcomes as a joint case study showing more bounty completion and better GitHub issue quality.

## Why Opire Matters

Opire's positioning overlaps with Ubiquity's work around GitHub-native incentives, bounties, contributor routing, and automated operations.

Useful public signals:

- Opire describes itself as a rewards platform for software developers where anyone can create rewards for open-source projects and developers can solve issues to earn rewards.
- Opire's docs say the product consists of a GitHub bot and a web platform. The bot enables GitHub-native commands to create and claim rewards, while the platform provides search and management.
- Opire says developers receive 100% of earned bounties, with fees covered by bounty creators.
- Opire says rewards can be created for public GitHub issues even when a repository does not have OpireBot installed.
- Opire's marketplace currently surfaces high-value rewards across well-known projects such as Godot, FalkorDB, Zed, Keycloak, TypeORM, and Storybook.

Sources:

- <https://opire.dev/open-startup>
- <https://docs.opire.dev/overview/introduction>
- <https://docs.opire.dev/rewards/introduction>
- <https://opire.dev/home>
- <https://app.opire.dev/home>
- <https://github.com/opire>

## Recommended Partnership Thesis

Ubiquity should approach Opire as an execution and operations partner, not as a competing bounty platform.

Opire has:

- Bounty marketplace demand.
- Payment and reward lifecycle.
- GitHub bot workflow.
- A broad pool of projects and open issues.

Ubiquity can add:

- GitHub issue triage and bounty packaging.
- Contributor routing.
- Automation around acceptance criteria, test plans, and PR quality.
- Follow-through on stale or under-specified rewards.
- A second distribution channel through Ubiquity's business-development and contributor workflows.

## Partner Lead Shortlist

The companion CSV, `opire-partner-leads.csv`, ranks 11 targets. The first target is Opire itself. The remaining targets are projects with visible Opire rewards that can be used as collaboration examples.

Top practical leads:

| Rank | Target | Why it matters | Suggested angle |
| ---: | --- | --- | --- |
| 1 | Opire | Direct platform partnership with public traction | Propose a 5-10 bounty operations pilot |
| 2 | Godot | Very large visible reward on Opire | Use as a flagship coordination case, not necessarily an implementation target |
| 3 | Kokoro | Mid-size reward and language/community angle | Translation/contributor workflow support |
| 4 | FalkorDB | Crash/fuzzer issue needs reproducibility and CI clarity | Reproduction and test harness packaging |
| 5 | TypeORM | Data-loss migration issue is sponsor-friendly | Acceptance tests and issue cleanup |
| 6 | Storybook | Small concrete TypeScript reward | Quick execution test case |

## Pilot Proposal

### Scope

Run a 30-day pilot focused on 5-10 Opire bounties.

### Deliverables

- A curated bounty queue with reason codes.
- Acceptance criteria for each selected issue.
- Reproduction or validation plan where applicable.
- Contributor fit notes.
- Weekly status summary.
- Final case study covering completion rate, PR quality, and lessons learned.

### Success Metrics

- 5+ bounties converted into contributor-ready specs.
- 2+ PRs opened or materially improved.
- 1+ bounty accepted, merged, or moved closer to payout.
- Measurable reduction in ambiguity for selected issues.
- Public case study that both Opire and Ubiquity can share.

## Outreach Drafts

### Direct Opire Message

Subject: Pilot idea: Ubiquity bounty operations desk for Opire rewards

Hi Opire team,

Ubiquity is exploring ways to help GitHub-native bounty ecosystems convert more open rewards into merged work. Opire already has strong public traction, and your marketplace has several rewards that appear valuable but could benefit from extra issue packaging, contributor routing, and follow-through.

We would like to propose a lightweight pilot:

- Select 5-10 Opire rewards.
- Turn each into a contributor-ready spec with acceptance criteria and validation notes.
- Route suitable tasks to Ubiquity contributors.
- Publish a short case study on what improved completion quality and payout readiness.

This would not require Opire to change its payment flow. The goal is to make existing rewards easier to complete and easier for maintainers to review.

Would you be open to a short async discussion around a pilot queue?

### Project Maintainer Message

Subject: Help packaging your Opire reward for faster contributor pickup

Hi,

I noticed your project has an active reward listed on Opire. Ubiquity is testing a small bounty-operations workflow that helps maintainers convert paid issues into contributor-ready specs.

We can help by preparing:

- Clear acceptance criteria.
- Reproduction or validation steps.
- Test plan.
- Contributor skill notes.
- A short PR review checklist.

No change to your existing Opire reward flow is required. The goal is simply to make the issue easier for qualified contributors to pick up and complete.

Would this be useful for the current reward?

## Non-Spam Outreach Rules

Do not mass-message every project. Start with Opire directly, then only contact project maintainers if:

- The issue is still open.
- The bounty is still visible.
- The maintainer has an obvious public discussion channel.
- The message is specific to one issue and offers concrete help.
- No sensitive or private information is requested.

## Immediate Next Steps

1. Send the direct Opire message to `team@opire.dev` or through their Discord/community channel.
2. Ask whether Opire can provide a current export of rewards that are high-value, stale, and still open.
3. Pick 5 pilot issues.
4. Produce contributor-ready specs for those 5 issues.
5. Use the results to propose a recurring Ubiquity bounty-ops service.

## Recommendation

Pursue Opire as a direct platform partner first. Individual project outreach should come after Opire confirms that this kind of help is welcome. This keeps the campaign focused, avoids spam, and gives Ubiquity a stronger reason to contact maintainers.
