# Deployment Guide - XP Report Automation

This guide covers deploying the XP Report Automation service to various platforms.

## Prerequisites

Before deploying, ensure you have:

- [x] GitHub Personal Access Token with `workflow` scope
- [x] X25519 private key (64-char hex) for signing
- [x] SMTP credentials for email delivery
- [x] Admin API key (random string)

## Option 1: Google Cloud Run (Recommended)

**Why Cloud Run?**
- Automatic scaling (0 → N instances)
- Pay only for actual usage
- Managed infrastructure
- Easy HTTPS setup

### Steps

1. **Install Google Cloud SDK:**
   ```bash
   curl https://sdk.cloud.google.com | bash
   gcloud init
   ```

2. **Build and push Docker image:**
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/xp-report-automation
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy xp-report-automation \
     --image gcr.io/YOUR_PROJECT_ID/xp-report-automation \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "GITHUB_TOKEN=$GITHUB_TOKEN,X25519_PRIVATE_KEY=$X25519_PRIVATE_KEY,SMTP_HOST=$SMTP_HOST,SMTP_PORT=$SMTP_PORT,SMTP_USER=$SMTP_USER,SMTP_PASS=$SMTP_PASS,SMTP_FROM=$SMTP_FROM,ADMIN_API_KEY=$ADMIN_API_KEY"
   ```

4. **Configure custom domain (optional):**
   ```bash
   gcloud beta run domain-mappings create --service xp-report-automation --domain xp-api.ubq.fi
   ```

5. **Set up Cloud SQL (optional, for PostgreSQL):**
   ```bash
   gcloud sql instances create xp-reports-db --tier=db-f1-micro --region=us-central1
   ```

**Cost estimate:** $0-5/month (free tier covers most usage)

## Option 2: Railway (Easiest)

**Why Railway?**
- Zero-config deployments
- Free tier available
- Automatic HTTPS
- Built-in monitoring

### Steps

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize project:**
   ```bash
   cd xp-report-automation
   railway init
   ```

3. **Add environment variables:**
   ```bash
   railway variables set GITHUB_TOKEN=$GITHUB_TOKEN
   railway variables set X25519_PRIVATE_KEY=$X25519_PRIVATE_KEY
   railway variables set SMTP_HOST=$SMTP_HOST
   # ... add all variables
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

5. **Get public URL:**
   ```bash
   railway domain
   ```

**Cost estimate:** Free (hobby plan) or $5/month (pro plan)

## Option 3: Heroku

**Why Heroku?**
- Simple deployment
- Add-ons ecosystem
- Mature platform

### Steps

1. **Install Heroku CLI:**
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   heroku login
   ```

2. **Create app:**
   ```bash
   heroku create xp-report-automation
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set GITHUB_TOKEN=$GITHUB_TOKEN
   heroku config:set X25519_PRIVATE_KEY=$X25519_PRIVATE_KEY
   # ... add all variables
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

5. **Scale dynos:**
   ```bash
   heroku ps:scale web=1
   ```

**Cost estimate:** $7/month (Eco dyno) or $25/month (Basic)

## Option 4: Self-Hosted (VPS)

**Why self-hosted?**
- Full control
- No vendor lock-in
- Can be cheaper at scale

### Steps

1. **Provision server (DigitalOcean, Linode, AWS EC2, etc.)**

2. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo systemctl enable docker
   sudo systemctl start docker
   ```

3. **Clone repository:**
   ```bash
   git clone https://github.com/ubiquity/business-development.git
   cd business-development/xp-report-automation
   ```

4. **Create .env file:**
   ```bash
   cp .env.example .env
   nano .env  # Fill in all values
   ```

5. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

6. **Set up reverse proxy (Nginx):**
   ```nginx
   server {
       listen 80;
       server_name xp-api.ubq.fi;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

7. **Enable HTTPS with Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d xp-api.ubq.fi
   ```

8. **Set up auto-restart (systemd):**
   ```bash
   sudo systemctl enable docker
   sudo systemctl enable docker-xp-report-automation
   ```

**Cost estimate:** $5-10/month (VPS)

## Option 5: PM2 (Node.js)

**Why PM2?**
- No Docker required
- Simple process management
- Built-in monitoring

### Steps

1. **Install Node.js and PM2:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install nodejs
   sudo npm install -g pm2
   ```

2. **Clone and build:**
   ```bash
   git clone https://github.com/ubiquity/business-development.git
   cd business-development/xp-report-automation
   npm install
   npm run build
   ```

3. **Create .env file:**
   ```bash
   cp .env.example .env
   nano .env
   ```

4. **Start with PM2:**
   ```bash
   pm2 start dist/index.js --name xp-report-automation
   pm2 save
   pm2 startup
   ```

5. **Monitor:**
   ```bash
   pm2 logs xp-report-automation
   pm2 monit
   ```

**Cost estimate:** $5-10/month (VPS)

## Post-Deployment Checklist

After deploying to any platform:

### 1. Verify Health Check

```bash
curl https://xp-api.ubq.fi/health
# Expected: {"status":"ok","service":"xp-report-automation"}
```

### 2. Test API

```bash
curl -X POST https://xp-api.ubq.fi/api/generate-xp-report \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/ubiquity/pay.ubq.fi",
    "email": "test@example.com"
  }'
# Expected: 202 Accepted
```

### 3. Check Database

```bash
# If self-hosted:
sqlite3 db/xp-reports.db "SELECT * FROM processed_orgs;"
```

### 4. Monitor Logs

```bash
# Cloud Run
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Railway
railway logs

# Heroku
heroku logs --tail

# PM2
pm2 logs xp-report-automation
```

### 5. Test Email Delivery

- Trigger a real report request
- Verify email arrives within 10 minutes
- Check spam folder if not in inbox

### 6. Set Up Monitoring

**Uptime monitoring:**
- UptimeRobot (free)
- Better Stack (paid)
- Pingdom (paid)

**APM (optional):**
- New Relic
- Datadog
- Sentry

### 7. Configure DNS

Point `xp-api.ubq.fi` to your deployment:

```bash
# Example DNS records
xp-api.ubq.fi.  300 IN  A      <your-server-ip>
# or CNAME for cloud platforms
xp-api.ubq.fi.  300 IN  CNAME  <platform-url>
```

### 8. Set Up Backups

**Automated backup script:**
```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d-%H%M%S)
cp /app/db/xp-reports.db /backups/xp-reports-$DATE.db
# Delete backups older than 30 days
find /backups -name "xp-reports-*.db" -mtime +30 -delete
```

**Cron job:**
```bash
0 0 * * * /path/to/backup-db.sh
```

## Troubleshooting

### "Connection refused" or "502 Bad Gateway"

**Check if service is running:**
```bash
# Docker
docker ps | grep xp-report

# PM2
pm2 list

# Cloud Run
gcloud run services describe xp-report-automation
```

**Check logs for errors:**
```bash
# Look for startup errors
docker logs xp-report-automation
pm2 logs xp-report-automation --lines 50
```

### "Database locked"

**Symptoms:** SQLite returns "database is locked" error

**Solution:**
```bash
# Stop service
pm2 stop xp-report-automation

# Remove lock files
rm db/xp-reports.db-wal db/xp-reports.db-shm

# Restart
pm2 restart xp-report-automation
```

### "Workflow failed: failure"

**Check workflow logs:**
```bash
gh run list --repo ubiquity-os-marketplace/text-conversation-rewards
gh run view <run-id> --log
```

**Common causes:**
- Invalid signature
- Missing/wrong GitHub token
- Workflow permissions issue

### Email not sending

**Test SMTP connection:**
```bash
# Install swaks (SMTP test tool)
sudo apt install swaks

# Test connection
swaks --to test@example.com \
  --from $SMTP_FROM \
  --server $SMTP_HOST \
  --port $SMTP_PORT \
  --auth-user $SMTP_USER \
  --auth-password $SMTP_PASS
```

**Gmail-specific:**
- Enable "Less secure app access" (if using password)
- Or use App Password (recommended)
- Check "Allow less secure apps" in Google Account settings

## Scaling Considerations

### When to scale horizontally?

- **CPU usage** consistently >70%
- **Response time** >1 second (p95)
- **Error rate** >1%

### How to scale?

**Cloud Run:** Automatic (set max instances)
```bash
gcloud run services update xp-report-automation --max-instances 10
```

**Railway:** Automatic scaling on Pro plan

**Self-hosted:** Add load balancer + multiple instances
```nginx
upstream xp_api {
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
}

server {
    location / {
        proxy_pass http://xp_api;
    }
}
```

## Security Hardening

### Production checklist:

- [ ] Use environment variables (never commit secrets)
- [ ] Enable HTTPS only (reject HTTP)
- [ ] Add rate limiting (e.g., 10 req/min per IP)
- [ ] Implement request logging
- [ ] Set up firewall rules (allow 80/443 only)
- [ ] Rotate keys regularly (quarterly)
- [ ] Enable audit logging
- [ ] Set up intrusion detection

### Example rate limiting (Express):

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests, please try again later',
});

app.use('/api/generate-xp-report', limiter);
```

## Cost Optimization

### Tips to reduce costs:

1. **Use free tiers:**
   - Railway: Free hobby plan
   - Cloud Run: 2M requests/month free
   - Heroku: Eco dynos ($7/month)

2. **Optimize database:**
   - Use indexes (already implemented)
   - Archive old records (>1 year)

3. **Cache aggressively:**
   - Cache GitHub API responses
   - Cache workflow results

4. **Set resource limits:**
   - Cloud Run: 512MB RAM (sufficient)
   - CPU: 1 vCPU (sufficient for 100s req/day)

## Maintenance

### Regular tasks:

**Weekly:**
- Check error logs
- Monitor disk space
- Verify backups exist

**Monthly:**
- Review usage stats (`/api/stats`)
- Check for security updates
- Test disaster recovery

**Quarterly:**
- Rotate API keys
- Audit processed orgs list
- Review cost/performance

---

**Recommended for production:** Google Cloud Run (auto-scaling, managed, cheap)  
**Recommended for development:** Railway (easiest setup)  
**Recommended for full control:** Self-hosted with Docker Compose

Choose based on your team's expertise and requirements!
