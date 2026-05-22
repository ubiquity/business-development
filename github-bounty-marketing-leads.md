# GitHub-Based Bounty Marketing Leads for Ubiquity

Issue: https://github.com/ubiquity/business-development/issues/90

## Objective

Find GitHub-native projects that already use bounty language, manual cash rewards, paid contributor workflows, or third-party bounty platforms. These projects are likely prospects for Ubiquity because they have already validated contributor incentives, but many show pain around payout operations, trust/safety, spam, manual tracking, or fragmented tooling.

## Methodology

Search patterns used:

- `"/bounty $" is:issue is:open`
- `"Bounty: $" is:issue is:open`
- `"[Bounty $" is:issue is:open`
- `"Price:" "USD" is:issue is:open "Time:"`
- `"bounty" "good first issue" is:issue is:open "$"`
- `"Algora" "bounty" is:issue is:open`

Screening criteria:

1. Public GitHub evidence of bounties, rewards, or paid contributor workflows.
2. Active or recently updated repository/issue where outreach is still plausible.
3. Clear operational pain or adoption signal.
4. Preference for teams that already understand issue-based rewards.
5. Avoid obvious spam, throwaway repos, stale archived repos, or test-only bounties.

## Prioritized Leads

### 1. Converse.js

- Repository: https://github.com/conversejs/converse.js
- Evidence: https://github.com/conversejs/converse.js/issues/2481
- Signal: Public bounty program where selected issues with the `bounty` label pay `$100` to the merged implementation.
- Pain/Opportunity: Manual bounty rules, assignment rules, and payout coordination are handled in a pinned issue. Ubiquity can reduce manual coordination by making issue pricing, assignment, completion, and wallet/payment registration GitHub-native.
- Recommended outreach angle: "You already run $100 GitHub bounties manually. Ubiquity can automate contributor assignment, pricing labels, wallet registration, and reward workflows without moving contributors away from GitHub."
- Priority: High

### 2. Flow Credit Markets / onflow

- Repository: https://github.com/onflow/flow-credit-markets
- Evidence: https://github.com/onflow/flow-credit-markets/issues/26
- Signal: Standing bug bounty program issue.
- Pain/Opportunity: A standing bounty program benefits from structured scope, payout tiers, claim tracking, and contributor guidance.
- Recommended outreach angle: "For a standing bug bounty, Ubiquity can help keep bounty scope, task pricing, contributor claiming, and payout readiness inside GitHub issues."
- Priority: High

### 3. Rosenpass

- Repository: https://github.com/rosenpass/rosenpass
- Evidence: https://github.com/rosenpass/rosenpass/issues/748
- Signal: Maintainers discuss deactivating/reopening Algora bounty issues and deciding how to handle bounty history.
- Pain/Opportunity: This is a direct competitor-switching signal. They used Algora bounties, but are reconsidering the setup.
- Recommended outreach angle: "Saw your discussion about reopening issues after Algora bounty cleanup. If the goal is to keep bounties GitHub-native with clearer lifecycle controls, Ubiquity may be worth evaluating."
- Priority: High

### 4. Space and Time Proof of SQL

- Repository: https://github.com/spaceandtimefdn/sxt-proof-of-sql
- Evidence: https://github.com/spaceandtimefdn/sxt-proof-of-sql/issues/1724
- Signal: Repo-wide spam pattern from fake Algora-style bounty comments across many PRs.
- Pain/Opportunity: Trust and safety around bounty claims. Ubiquity can differentiate on verified bot identity, GitHub-native commands, and transparent reward state.
- Recommended outreach angle: "Your bounty workflow has attracted impersonation/spam. Ubiquity could be positioned as a safer GitHub-native alternative with clearer bot identity and issue/PR lifecycle state."
- Priority: High

### 5. Crossbar.io Autobahn Testsuite

- Repository: https://github.com/crossbario/autobahn-testsuite
- Evidence: https://github.com/crossbario/autobahn-testsuite/issues/144
- Signal: Maintainer references the Jules OSS bounty program and an Algora challenge link.
- Pain/Opportunity: The project is open to bounty/challenge-based contribution sourcing. They may need better GitHub-native task management after campaign interest.
- Recommended outreach angle: "If you are evaluating OSS bounty/challenge programs, Ubiquity can help manage priced tasks and contributor workflows directly on GitHub."
- Priority: Medium-High

### 6. Woodpecker CI Autoscaler

- Repository: https://github.com/woodpecker-ci/autoscaler
- Evidence: https://github.com/woodpecker-ci/autoscaler/issues/102
- Signal: Issue body includes `Bounty: 50$`; labels include bounty/enhancement/new provider.
- Pain/Opportunity: Real engineering bounty for a cloud provider integration. Useful target for structured task pricing and contributor claiming.
- Recommended outreach angle: "You already attach bounty values to GitHub issues. Ubiquity can make the reward/assignment/review workflow explicit and reduce manual follow-up."
- Priority: Medium-High

### 7. FreezingMoon / Ancient Beast

- Repository: https://github.com/FreezingMoon/AncientBeast
- Evidence examples:
  - https://github.com/FreezingMoon/AncientBeast/issues/1773
  - https://github.com/FreezingMoon/AncientBeast/issues/1965
  - https://github.com/FreezingMoon/AncientBeast/issues/1099
- Signal: Multiple issues use `bounty` labels and token-denominated rewards such as `8 XTR` or `10 XTR`.
- Pain/Opportunity: They already maintain a recurring bounty labeling convention, but rewards appear token-specific and manually managed.
- Recommended outreach angle: "Your project already uses bounty labels across multiple issues. Ubiquity can help standardize issue claiming, contribution reminders, and reward metadata."
- Priority: Medium

### 8. Syncleus / Aparapi

- Repository: https://github.com/Syncleus/aparapi
- Evidence examples:
  - https://github.com/Syncleus/aparapi/issues/35
  - https://github.com/Syncleus/aparapi/issues/40
  - https://github.com/Syncleus/aparapi/issues/97
- Signal: Explicit cash bounty issue titles such as `[Bounty $10]`, `[BOUNTY $20]`, and labels such as `bounty` / `good first issue`.
- Pain/Opportunity: Older bounty issues indicate a manual bounty history. If the project revives paid contribution, Ubiquity can modernize the workflow.
- Recommended outreach angle: "Your repo has historical cash bounty issues. If bounties are still useful, Ubiquity can turn that manual convention into a structured GitHub-native workflow."
- Priority: Medium

### 9. ntemple / bracketpress

- Repository: https://github.com/ntemple/bracketpress
- Evidence: https://github.com/ntemple/bracketpress/issues/7
- Signal: Issue title includes `Bounty $25`.
- Pain/Opportunity: Small plugin project using a manual cash bounty for a bug. Good fit for lightweight task pricing if the maintainer is still active.
- Recommended outreach angle: "For small plugin bounties, Ubiquity can provide a simple issue-label and payout workflow without requiring a separate bounty platform."
- Priority: Medium

### 10. Algora issue tracker: payout friction signal

- Repository: https://github.com/algora-io/algora
- Evidence:
  - https://github.com/algora-io/algora/issues/262
  - https://github.com/algora-io/algora/issues/270
- Signal: Public issues mention delayed sponsor reward after merged PR and contributor payout questions for mainland China / Stripe limitations.
- Pain/Opportunity: Not an outreach target for Ubiquity sales, but useful competitive intelligence. Contributors and sponsors care about payout reliability, geographic availability, and manual fallback options.
- Recommended action: Use these as messaging inputs: "transparent payment state," "clear sponsor approval flow," and "documented payout alternatives/limitations."
- Priority: Competitive intelligence

### 11. Costajohnt / bounty-hunter

- Repository: https://github.com/costajohnt/bounty-hunter
- Evidence: https://github.com/costajohnt/bounty-hunter/issues/14
- Signal: Project is building cross-source bounty metadata and confidence scoring.
- Pain/Opportunity: Potential partner/integration or data-source lead rather than direct customer. They care about validated bounty metadata from sources such as Algora and GitHub text extraction.
- Recommended outreach angle: "Ubiquity could expose cleaner GitHub-native bounty metadata that bounty aggregators can classify with higher confidence than text extraction."
- Priority: Partner/Research

### 12. Simple Icons / Algora icon request

- Repository: https://github.com/simple-icons/simple-icons
- Evidence: https://github.com/simple-icons/simple-icons/issues/13178
- Signal: Algora has enough brand recognition to trigger icon requests.
- Pain/Opportunity: Competitive visibility signal rather than direct buyer intent. Useful for positioning/brand distribution: Ubiquity may benefit from similar developer-facing brand assets and listings if pursuing bounty-platform mindshare.
- Recommended action: Consider creating/standardizing Ubiquity brand assets for open-source ecosystem visibility.
- Priority: Competitive intelligence

## Recommended First Outreach Batch

Start with these five because they show the clearest combination of bounty intent and operational pain:

1. Converse.js — manual `$100` GitHub bounty workflow.
2. Rosenpass — active reconsideration of Algora bounty setup.
3. Space and Time Proof of SQL — fake Algora-style bounty spam problem.
4. Flow Credit Markets — standing bug bounty program.
5. Woodpecker CI Autoscaler — explicit `$50` engineering bounty issue.

## Suggested Outreach Copy

### Short GitHub issue/discussion comment

> Hi maintainers — I noticed your project already uses GitHub issues for bounty-style contributions. Ubiquity helps teams run priced tasks, assignment, contributor reminders, wallet registration, and reward workflows directly inside GitHub, without moving contributors to a separate platform. If you are still using bounties or want to reduce manual coordination around them, I can share a short setup path tailored to this repo.

### Direct maintainer message

> Hi — I found your repo while researching open-source projects that already use GitHub-native bounties. Your workflow appears to rely on manual issue labels/comments for rewards. Ubiquity is designed for exactly this use case: priced GitHub issues, `/start` assignment, contributor workflow automation, and wallet/payment readiness. Would you be open to a quick comparison or pilot on one low-risk issue?

### Competitor-switching version for Algora pain

> Hi — I saw your public issue discussing Algora bounty cleanup / payout or spam friction. Ubiquity may be a good fit if you want a more GitHub-native workflow with clearer issue assignment, reward state, and bot-driven lifecycle controls. Happy to map one existing bounty issue into a Ubiquity-style flow as a quick test.

## Notes and Risks

- Some bounty signals are manual and may be stale; outreach should ask if the bounty workflow is still active before pitching migration.
- Some rewards are token-denominated rather than USD; frame Ubiquity around workflow automation, not necessarily cash settlement.
- Avoid repos with obvious spam/test issues unless using them only as negative examples.
- Avoid criticizing competitors publicly. For Algora-related leads, frame the pitch around workflow clarity and safety, not attacks.

## Next Step

Create a lightweight outreach tracker with columns:

- Repository
- Maintainer/contact path
- Evidence URL
- Bounty signal
- Pain category
- Recommended message variant
- Status
- Follow-up date

Then test the top five leads with tailored comments/messages and track responses.
