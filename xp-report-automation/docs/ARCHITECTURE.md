# XP Report Automation - Architecture

## System Overview

The XP Report Automation service bridges the Ubiquity landing page and the internal `text-conversation-rewards` workflow, providing free one-time XP reports for prospective customers.

## Components

### 1. API Server (Express + TypeScript)

**Responsibilities:**
- Accept incoming XP report requests
- Validate repository URLs and permissions
- Enforce one-report-per-org limit
- Trigger workflow with signed payloads
- Poll for workflow completion
- Send email notifications

**Tech Stack:**
- Express.js (web framework)
- TypeScript (type safety)
- @octokit/rest (GitHub API client)
- better-sqlite3 (database)
- nodemailer (email delivery)
- tweetnacl (cryptographic signing)

### 2. Database (SQLite)

**Purpose:** Track which organizations have received free reports

**Schema:**
```sql
CREATE TABLE processed_orgs (
    org_name TEXT PRIMARY KEY,        -- GitHub org/user
    repo_url TEXT NOT NULL,           -- Full URL
    processed_at TIMESTAMP,           -- Generation time
    email TEXT,                       -- Recipient
    workflow_run_id INTEGER           -- GitHub Actions run
);
```plaintext

**Why SQLite?**
- Simple deployment (single file)
- Fast for our use case
- No external database server needed
- Easy backups (`cp db/xp-reports.db backup/`)

### 3. Workflow Integration

**How we trigger `text-conversation-rewards`:**

1. **Create signed payload:**
   ```typescript
   const payload = {
     eventPayload: {
       repository: { owner, name },
       sender: { login: 'xp-report-automation' }
     },
     settings: {
       labels: { time: [...], priority: [...] },
       incentives: { enabled: true }
     }
   };
   ```

2. **Sign with X25519 private key:**
   ```typescript
   const signature = nacl.sign.detached(
     Buffer.from(JSON.stringify(payload)),
     Buffer.from(X25519_PRIVATE_KEY, 'hex')
   );
   ```

3. **Dispatch workflow:**
   ```typescript
   await octokit.actions.createWorkflowDispatch({
     owner: 'ubiquity-os-marketplace',
     repo: 'text-conversation-rewards',
     workflow_id: 'compute.yml',
     ref: 'main',
     inputs: {
       stateId: randomUUID(),
       eventPayload: JSON.stringify(payload.eventPayload),
       settings: JSON.stringify(payload.settings),
       signature: Buffer.from(signature).toString('base64'),
       authToken: GITHUB_TOKEN,
       ref: 'main'
     }
   });
   ```

4. **Poll for completion:**
   - Wait 5 seconds for workflow to start
   - Poll every 10 seconds
   - Max 10 minutes timeout
   - Return workflow URL on success

### 4. Email Delivery

**Flow:**
1. Workflow completes successfully
2. Extract workflow run URL
3. Send email via SMTP:
   ```
   Subject: Your Free XP Report is Ready!
   Body: 
     - Link to workflow run
     - Call-to-action for paid service
     - "One-time free report" disclaimer
   ```

**SMTP Support:**
- Gmail (requires app password)
- SendGrid
- Mailgun
- Any SMTP server

## Security Model

### 1. One Report Per Org

**Problem:** Users could abuse free tier by requesting multiple reports

**Solution:** Track by GitHub organization name in database
- `processed_orgs.org_name PRIMARY KEY`
- Reject repeat requests with `403 Forbidden`

**Why not rate-limit by IP?**
- VPNs/proxies easy to circumvent
- GitHub org is permanent identifier

### 2. Signature Verification

**Problem:** Anyone could trigger workflows, consuming GitHub Actions minutes

**Solution:** Sign payloads with X25519 private key
- Kernel verifies signature using public key
- Invalid signatures rejected by workflow

**Key generation:**
```bash
openssl rand -hex 32  # Generates 64-char hex string
```plaintext

### 3. Public Repos Only

**Problem:** We don't have access to private repo data

**Solution:** Validate repo is public before processing
```typescript
const repo = await octokit.repos.get({ owner, repo });
if (repo.data.private) {
  return res.status(400).json({ error: 'Repository must be public' });
}
```plaintext

### 4. Admin-Only Stats

**Problem:** Stats endpoint reveals business metrics

**Solution:** Require `X-Api-Key` header
```typescript
if (req.headers['x-api-key'] !== process.env.ADMIN_API_KEY) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```plaintext

## Data Flow

```plaintext
┌────────────────────────────────────────────────────────────┐
│ 1. User Submits Form on Landing Page                       │
│    POST https://xp-api.ubq.fi/api/generate-xp-report       │
│    { repoUrl, email }                                      │
└────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│ 2. API Validates Request                                    │
│    - Parse GitHub URL                                      │
│    - Check org not in processed_orgs table                 │
│    - Verify repo exists and is public                      │
└────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│ 3. Trigger Workflow                                         │
│    - Create signed payload                                 │
│    - Call GitHub Actions API                               │
│    - Insert org into processed_orgs                        │
│    - Return 202 Accepted to user                           │
└────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│ 4. Background Processing (async)                           │
│    - Poll workflow status every 10s                        │
│    - Wait for completion (max 10 min)                      │
│    - Extract workflow run URL                              │
└────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│ 5. Email Delivery                                          │
│    - Send email with results link                          │
│    - Include call-to-action for paid service               │
│    - Mark as completed in database                         │
└────────────────────────────────────────────────────────────┘
```plaintext

## Error Handling

### API Errors

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Invalid URL/email | `{ error: "Invalid GitHub repository URL" }` |
| 403 | Org already processed | `{ error: "Organization already received a free report" }` |
| 404 | Repo not found | `{ error: "Repository not found or not accessible" }` |
| 500 | Internal error | `{ error: "Internal server error" }` |

### Workflow Errors

**Failure:** Workflow completes with `failure` status
- Log error
- Could retry once
- Could send "failure" email to user

**Timeout:** Workflow doesn't complete in 10 minutes
- Log timeout
- Mark as failed in database
- Could implement webhook callback for actual completion

### Email Errors

**SMTP failure:** Email send fails
- Log error
- Retry up to 3 times
- Could queue for later retry

## Performance

### Expected Load

- **Target:** 100-500 reports/day during launch
- **Peak:** 50 concurrent requests
- **Database:** <10ms query time
- **Workflow:** 3-5 minutes average

### Scaling Strategy

**Current (single instance):**
- Express handles 1000+ req/s easily
- SQLite fast enough for our use case
- Bottleneck: GitHub Actions minutes

**Future (if needed):**
- Horizontal scaling (multiple API instances)
- Shared PostgreSQL database
- Redis for distributed locks
- Queue system (Bull/BullMQ) for background jobs

## Monitoring

### Key Metrics

- **Total reports generated** (`SELECT COUNT(*) FROM processed_orgs`)
- **Reports per day** (group by date)
- **Average workflow time** (track in logs)
- **Email delivery rate** (success/failure ratio)
- **Error rate** (4xx/5xx responses)

### Logging

**Structured logs:**
```json
{
  "timestamp": "2026-02-16T23:00:00Z",
  "level": "info",
  "event": "report_requested",
  "org": "ubiquity",
  "repo": "pay.ubq.fi",
  "email": "user@example.com"
}
```plaintext

**Log levels:**
- `info`: Normal operations
- `warn`: Duplicate org, invalid repo
- `error`: Workflow failures, email errors

### Alerting

**Critical:**
- API down (health check fails)
- Database corruption
- SMTP credentials invalid

**Warning:**
- High error rate (>5%)
- Slow workflows (>10 minutes)
- Disk space low

## Deployment

### Production Checklist

- [ ] Configure all environment variables
- [ ] Generate secure X25519 private key
- [ ] Set up SMTP credentials
- [ ] Initialize database
- [ ] Test workflow trigger manually
- [ ] Set up monitoring/alerts
- [ ] Configure DNS (xp-api.ubq.fi)
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Set up backups (daily)
- [ ] Document runbook

### Backup Strategy

**Database:**
```bash
# Daily cron job
0 0 * * * cp /app/db/xp-reports.db /backups/xp-reports-$(date +\%Y\%m\%d).db
```plaintext

**Retention:**
- Daily backups: 30 days
- Weekly backups: 1 year

### Rollback Plan

1. Stop current service
2. Restore previous Docker image
3. Restore database from backup
4. Verify health check passes
5. Monitor for errors

## Future Enhancements

### Phase 2: Dashboard Integration

Instead of emailing workflow URL, generate actual pay.ubq.fi dashboard link:

```typescript
const dashboardUrl = `https://pay.ubq.fi/${owner}/${repo}?month=${currentMonth}`;
```plaintext

**Requirements:**
- pay.ubq.fi supports public dashboard URLs
- Or: generate temporary token for access

### Phase 3: Webhook Callback

Have `text-conversation-rewards` POST results back to our API:

```typescript
// In workflow
await fetch('https://xp-api.ubq.fi/api/workflow-callback', {
  method: 'POST',
  body: JSON.stringify({
    workflowRunId,
    status: 'success',
    results: { ... }
  })
});
```plaintext

**Benefits:**
- No polling needed
- Instant email delivery
- More accurate timing

### Phase 4: Analytics Dashboard

Admin UI for visualizing:
- Reports per day/week/month
- Most popular repositories
- Conversion rate (free → paid)
- Geographic distribution

### Phase 5: Multi-Tier Pricing

- **Free:** 1 report per org
- **Starter:** $49/month, 10 reports
- **Pro:** $199/month, unlimited reports

---

**This architecture provides:**
✅ Scalability (can handle 1000s of requests)  
✅ Security (signed workflows, rate limiting)  
✅ Reliability (error handling, retries)  
✅ Maintainability (clear structure, documented)
