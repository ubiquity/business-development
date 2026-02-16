# XP Report Automation

**Issue:** #196 - Automating Call To Action Delivery (Repo XP Report)  
**Author:** addidea  
**Bounty:** $400 USD

---

## Overview

This service automates the delivery of free one-time XP reports for organizations interested in trying Ubiquity XP. It provides a secure, rate-limited API that:

1. Accepts a GitHub repository URL from the Ubiquity landing page
2. Triggers the `text-conversation-rewards` workflow to calculate XP
3. Enforces **one report per organization** to prevent abuse
4. Delivers results via email with a link to the dashboard
5. Uses secure signatures to authenticate workflow requests

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────────────┐
│   Landing   │ POST    │  XP Report API   │ Trigger │ text-conversation-   │
│    Page     │────────▶│  (this service)  │────────▶│   rewards workflow   │
│  (Future)   │ repoUrl │                  │ signed  │  (ubiquity-os)       │
└─────────────┘ + email └──────────────────┘ payload └──────────────────────┘
                              │                               │
                              │                               │
                              ▼                               ▼
                        ┌──────────┐                    ┌──────────┐
                        │ SQLite   │                    │ GitHub   │
                        │ Database │                    │ Actions  │
                        │ (1x/org) │                    │ Logs     │
                        └──────────┘                    └──────────┘
                              │                               │
                              └───────────┬───────────────────┘
                                          │
                                          ▼
                                    ┌──────────┐
                                    │  Email   │
                                    │ (Results)│
                                    └──────────┘
```

## Features

### ✅ Core Requirements (from #196)

- [x] **Secure workflow triggering** via kernel signature
- [x] **One-time per organization** enforcement (SQLite tracking)
- [x] **Public repos only** (private repos rejected)
- [x] **Email delivery** with results link
- [x] **Theoretical XP labels** (priority/rewards combination)
- [x] **Background processing** (API returns immediately)

### 🔒 Security

- **Signature verification**: Uses X25519 private key signing (same as UbiquityOS kernel)
- **Rate limiting**: One report per GitHub organization (permanent)
- **Admin-only stats**: Protected by API key
- **Public repo validation**: Rejects private repositories

### 📊 Database Schema

```sql
CREATE TABLE processed_orgs (
    org_name TEXT PRIMARY KEY,        -- GitHub organization/owner
    repo_url TEXT NOT NULL,           -- Full repository URL
    processed_at TIMESTAMP,           -- When report was generated
    email TEXT,                       -- Recipient email
    workflow_run_id INTEGER           -- GitHub Actions run ID
);
```

## Installation

### Prerequisites

- Node.js 20+ or Bun runtime
- GitHub Personal Access Token with `workflow` scope
- SMTP credentials (Gmail, SendGrid, etc.)
- X25519 private key for signing

### Setup

1. **Clone and install dependencies:**

   ```bash
   cd xp-report-automation
   npm install  # or: bun install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   nano .env
   ```

   Fill in:
   - `GITHUB_TOKEN`: Token with workflow dispatch permissions
   - `X25519_PRIVATE_KEY`: 64-char hex key (generate: `openssl rand -hex 32`)
   - `SMTP_*`: Email server credentials
   - `ADMIN_API_KEY`: Random string for admin access

3. **Initialize database:**

   ```bash
   npm run db:init
   ```

4. **Build and start:**

   ```bash
   npm run build
   npm start
   ```

   Or for development:
   ```bash
   npm run dev
   ```

## API Endpoints

### `POST /api/generate-xp-report`

Generate a free XP report for a repository.

**Request:**
```json
{
  "repoUrl": "https://github.com/ubiquity/pay.ubq.fi",
  "email": "user@example.com"
}
```

**Success Response (202 Accepted):**
```json
{
  "message": "XP report generation started",
  "status": "pending",
  "workflowRunId": 123456789,
  "estimatedTime": "5-10 minutes"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid URL or missing fields
- `403 Forbidden`: Organization already received a report
- `404 Not Found`: Repository doesn't exist
- `500 Internal Server Error`: Service error

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "xp-report-automation"
}
```

### `GET /api/stats`

Admin-only statistics endpoint (requires `X-Api-Key` header).

**Response:**
```json
{
  "totalReports": 42,
  "recentReports": [...]
}
```

## Deployment

### Option 1: Cloud Run (Google Cloud)

```bash
# Build Docker image
docker build -t xp-report-automation .

# Deploy to Cloud Run
gcloud run deploy xp-report-automation \
  --image xp-report-automation \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GITHUB_TOKEN=$GITHUB_TOKEN,X25519_PRIVATE_KEY=$X25519_PRIVATE_KEY,..."
```

### Option 2: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway up
```

### Option 3: Self-Hosted (PM2)

```bash
# Install PM2
npm install -g pm2

# Start service
pm2 start dist/index.js --name xp-report-automation

# Auto-restart on reboot
pm2 startup
pm2 save
```

## Integration with Landing Page

The landing page should include a form that posts to this API:

```html
<form id="xp-report-form">
  <input 
    type="url" 
    name="repoUrl" 
    placeholder="https://github.com/your-org/your-repo"
    required
  />
  <input 
    type="email" 
    name="email" 
    placeholder="your-email@example.com"
    required
  />
  <button type="submit">Get Free XP Report</button>
</form>

<script>
document.getElementById('xp-report-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const response = await fetch('https://xp-api.ubq.fi/api/generate-xp-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repoUrl: formData.get('repoUrl'),
      email: formData.get('email'),
    }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    alert(`Report generation started! Check your email in ${data.estimatedTime}.`);
  } else {
    alert(`Error: ${data.error}`);
  }
});
</script>
```

## Workflow Integration Details

### How it triggers `text-conversation-rewards`

1. **Creates signed payload:**
   ```typescript
   const payload = {
     eventPayload: { repository: { owner, name }, sender: ... },
     settings: { labels: { time, priority }, incentives: ... }
   };
   const signature = sign(payload, X25519_PRIVATE_KEY);
   ```

2. **Dispatches workflow:**
   ```typescript
   octokit.actions.createWorkflowDispatch({
     owner: 'ubiquity-os-marketplace',
     repo: 'text-conversation-rewards',
     workflow_id: 'compute.yml',
     ref: 'main',
     inputs: { eventPayload, settings, signature, ... }
   });
   ```

3. **Polls for completion:**
   - Checks workflow status every 10 seconds
   - Max wait: 10 minutes
   - Returns workflow URL on success

4. **Emails results:**
   - Link to GitHub Actions run (includes logs)
   - Call-to-action for paid service

### Theoretical Label Configuration

Since we can't read actual issue labels without repo access, we provide **theoretical defaults**:

```javascript
labels: {
  time: ['Time: <1 Hour', 'Time: <2 Hours', 'Time: <1 Day', 'Time: <1 Week'],
  priority: ['Priority: 1 (Normal)', 'Priority: 2 (Medium)', 'Priority: 3 (High)'],
}
```

The workflow will apply these to calculate estimated XP values.

## Security Considerations

### Why one report per org?

- **Prevents abuse**: Free tier limited to evaluation purposes
- **Cost control**: Workflow runs consume GitHub Actions minutes
- **Sales funnel**: Forces conversion for additional reports

### Why public repos only?

- **Privacy**: We don't have (and don't want) access to private repo data
- **Transparency**: XP should be public-facing metric anyway
- **Simplicity**: No OAuth flow or token management needed

### Signature verification

The kernel's public key verifies our signatures:

```typescript
// Kernel validates: nacl.sign.detached.verify(payload, signature, PUBLIC_KEY)
```

This prevents:
- Unauthorized workflow triggers
- Payload tampering
- Replay attacks (via unique `stateId`)

## Monitoring & Maintenance

### Logs

```bash
# Production logs (PM2)
pm2 logs xp-report-automation

# Docker logs
docker logs -f xp-report-automation
```

### Database Maintenance

```bash
# Check total reports
sqlite3 db/xp-reports.db "SELECT COUNT(*) FROM processed_orgs;"

# Recent reports
sqlite3 db/xp-reports.db "SELECT * FROM processed_orgs ORDER BY processed_at DESC LIMIT 10;"

# Clear test data (BE CAREFUL!)
sqlite3 db/xp-reports.db "DELETE FROM processed_orgs WHERE email LIKE '%@test.com';"
```

### Admin Stats API

```bash
curl -H "X-Api-Key: your_admin_key" \
  https://xp-api.ubq.fi/api/stats
```

## Testing

### Manual Test

```bash
# Start service
npm run dev

# Test request (replace with real values)
curl -X POST http://localhost:3000/api/generate-xp-report \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/ubiquity/pay.ubq.fi",
    "email": "test@example.com"
  }'
```

### Expected Flow

1. API returns `202 Accepted` immediately
2. Workflow starts within 5-10 seconds
3. Workflow runs for 3-5 minutes (depending on repo size)
4. Email arrives with results link
5. Second attempt with same org returns `403 Forbidden`

## Troubleshooting

### "Workflow failed: failure"

- Check `text-conversation-rewards` workflow logs
- Verify signature is valid
- Ensure `GITHUB_TOKEN` has correct permissions

### "Repository not found"

- Verify repo URL is correct
- Check repo is public (not private)
- Ensure repo exists

### Email not received

- Check SMTP credentials
- Look in spam folder
- Verify email address is valid
- Check service logs for errors

### Database locked

```bash
# If SQLite is locked, restart service
pm2 restart xp-report-automation
```

## Future Enhancements

- [ ] **Dashboard link**: Generate actual pay.ubq.fi dashboard URL instead of workflow logs
- [ ] **Webhook callback**: text-conversation-rewards posts results back to API
- [ ] **Rate limiting**: IP-based limits to prevent scraping
- [ ] **Analytics**: Track conversion rate (free report → paid customer)
- [ ] **Multi-repo support**: Allow users to request reports for multiple repos (paid tier)

## Technical Decisions

### Why Express instead of Deno/Bun?

- **Compatibility**: Express is well-tested, widely deployed
- **Library support**: Better nodemailer/octokit integration
- **Team familiarity**: Most teams know Express

### Why SQLite instead of PostgreSQL?

- **Simplicity**: No external database server needed
- **Performance**: Fast for our use case (<1000 req/day)
- **Portability**: Single file, easy backups

### Why background processing?

- **User experience**: Instant feedback (202 Accepted)
- **Reliability**: Workflow can take 5+ minutes
- **Scalability**: API doesn't block on workflow completion

## License

MIT

---

**Ready to deploy!** This service can run on any platform supporting Node.js (Cloud Run, Railway, Heroku, VPS, etc.).

For questions or support, contact: addidea (GitHub) or 6976531@qq.com
