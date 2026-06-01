# Repo XP Report CTA Delivery

## Objective

Turn the XP product landing page call to action into a safe, one-time report flow.

The visitor submits a public GitHub repository URL. Ubiquity validates the repository,
checks whether the organization already received a free report, triggers the XP report
calculation, and emails a dashboard/report link to the visitor.

This document maps the implementation boundaries for issue
https://github.com/ubiquity/business-development/issues/196.

## User Flow

1. Visitor enters a GitHub repository URL on the XP landing page.
2. Visitor enters an email address for report delivery.
3. Backend validates that the repository is public.
4. Backend resolves the repository owner organization.
5. Backend checks whether that organization already used the free report.
6. Backend creates a report request record.
7. Backend triggers the XP computation workflow.
8. Backend stores the workflow run id and report status.
9. Backend sends the report link by email when the workflow completes.

The user should never need GitHub authentication for the free report request.

## Minimal Data Model

Store one report request per organization.

| Field | Purpose |
| --- | --- |
| `id` | Internal request id |
| `repositoryUrl` | Original repository URL submitted by the visitor |
| `repositoryOwner` | GitHub owner or organization |
| `repositoryName` | GitHub repository name |
| `requestEmail` | Email address that receives the report |
| `workflowRunId` | GitHub Actions run id or internal kernel job id |
| `status` | `queued`, `running`, `completed`, `failed`, `blocked` |
| `reportUrl` | Dashboard or static report link |
| `failureReason` | Human-readable failure reason |
| `createdAt` | Request creation timestamp |
| `completedAt` | Report completion timestamp |

Create a unique constraint on `repositoryOwner` for the free report campaign.

```text
unique(repositoryOwner)
```

This keeps the campaign aligned with the issue requirement: one free report per
organization.

## Repository Validation

Before creating a request:

1. Normalize supported GitHub URL forms:

```text
https://github.com/{owner}/{repo}
github.com/{owner}/{repo}
{owner}/{repo}
```

2. Reject unsupported hosts.
3. Call GitHub repository metadata.
4. Reject private repositories.
5. Reject archived repositories unless the product team explicitly wants archive
   reporting.
6. Reject forks if the goal is organization-level sales qualification.

Recommended validation output:

```json
{
  "owner": "example-org",
  "repo": "example-repo",
  "isPrivate": false,
  "isArchived": false,
  "isFork": false,
  "defaultBranch": "main"
}
```

## One-Time Free Report Guard

The free report should be locked at the owner organization level, not the repository
level.

Reason: if `example-org/api` already received a free report, `example-org/web` should
not trigger another free report.

Flow:

```text
resolve repo owner
  -> check report_request where repositoryOwner = owner
  -> if exists, show "report already requested" state
  -> otherwise create report_request and continue
```

This does not stop every possible workaround, but it blocks the low-effort repeat use
that matters for a landing page lead magnet.

## Workflow Trigger Options

There are two safe implementation options.

### Option A: Kernel-Mediated Trigger

The landing page backend submits a signed internal job to the Ubiquity kernel. The
kernel owns the GitHub token and triggers the XP computation workflow.

Best when:

- report generation will become a product feature,
- secrets should never sit in the landing page backend,
- workflow runs need centralized rate limits and retries.

### Option B: Direct Workflow Dispatch

The backend calls the GitHub Actions workflow dispatch endpoint for
`text-conversation-rewards`.

Best when:

- this is still a short campaign experiment,
- the target workflow already accepts enough inputs,
- the team wants the smallest implementation surface.

The direct trigger must still be signed or protected by a server-side secret. The
browser should never call GitHub Actions directly.

## Suggested Workflow Inputs

The XP calculation workflow should receive explicit inputs so the run can be repeated
and audited.

```json
{
  "repository": "owner/repo",
  "from": "2026-05-01T00:00:00Z",
  "to": "2026-06-01T00:00:00Z",
  "labelPreset": "ubiquity-xp-default",
  "requestId": "repo_xp_01HX...",
  "callbackUrl": "https://xp.ubq.fi/api/report-callback"
}
```

The date range should default to the last complete 30 days.

## Label and XP Assumptions

Issue #196 notes that XP depends on priority and reward combinations, and the landing
page report may need theoretical labels.

For the first campaign version, use a default label preset rather than asking visitors
to configure labels.

| Signal | Default assumption |
| --- | --- |
| Priority | Infer from issue labels if present; otherwise use normal priority |
| Reward | Infer from `Price:` labels if present; otherwise use zero reward |
| Conversation quality | Use available issue and pull request comments |
| Contribution timing | Use merged PRs and issue activity from the report window |

If the repository does not use Ubiquity-style labels, the report should explicitly say:

```text
This is a simulated XP report using Ubiquity's default label model.
```

That makes the lead magnet useful without pretending that external repositories already
have perfect Ubiquity metadata.

## Completion and Email Delivery

When the workflow completes:

1. Report generator writes the dashboard/report artifact.
2. Callback updates `report_request.status = completed`.
3. Backend stores `reportUrl`.
4. Email service sends the visitor the report link.

Recommended email shape:

```text
Subject: Your GitHub XP report is ready

Hi,

Your XP report for {owner}/{repo} is ready:
{reportUrl}

This report uses the last complete 30 days of public GitHub activity. If you want a
live version with Ubiquity-native labels, assignment, and rewards, reply to this email.
```

The email should make the next step obvious but not overpromise.

## Failure States

| Failure | User-facing state |
| --- | --- |
| Private repository | "This free report only supports public repositories." |
| Repository not found | "We could not find that GitHub repository." |
| Organization already used free report | "A free report has already been requested for this organization." |
| Workflow trigger failed | "We could not start the report. Please try again later." |
| Workflow completed without enough data | "The repository did not have enough public activity for a useful report." |

All failures should keep the request record for debugging.

## Security Controls

- Do not expose GitHub tokens to the browser.
- Sign backend-to-kernel or backend-to-workflow requests.
- Rate limit by IP, email, and repository owner.
- Validate repository owner before creating a workflow run.
- Store the workflow run id for auditability.
- Ignore private repositories.
- Do not allow arbitrary workflow refs from user input.
- Use a fixed branch or pinned workflow revision for the report generator.

## Analytics

Track the CTA as a conversion funnel:

| Event | Meaning |
| --- | --- |
| `repo_xp_cta_viewed` | Visitor saw the CTA |
| `repo_xp_form_started` | Visitor entered repository URL or email |
| `repo_xp_request_created` | Request passed validation |
| `repo_xp_workflow_started` | XP computation started |
| `repo_xp_report_completed` | Report was generated |
| `repo_xp_email_delivered` | Email service accepted delivery |
| `repo_xp_sales_reply` | Visitor replied or booked follow-up |

The sales metric is not just report generation. It is whether the report creates a
qualified conversation.

## Acceptance Checklist

- [x] Public repository URL validation defined
- [x] Private repository rejection defined
- [x] One free report per organization guard defined
- [x] Kernel-mediated and direct workflow trigger options defined
- [x] Required workflow inputs defined
- [x] XP label assumptions defined
- [x] Completion callback and email delivery flow defined
- [x] Failure states defined
- [x] Security controls defined
- [x] Analytics funnel defined

## Recommended First Build

Start with the smallest version:

1. Landing page form posts `repositoryUrl` and `email`.
2. Backend validates public repository and organization uniqueness.
3. Backend triggers a fixed workflow ref.
4. Workflow generates a static report or dashboard link.
5. Backend sends the report link by email.

Once the report proves that it creates qualified replies, move the trigger behind the
kernel and add richer dashboard state.
