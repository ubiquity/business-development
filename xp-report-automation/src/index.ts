import express, { Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import * as nacl from 'tweetnacl';
import { config } from 'dotenv';

config();

const app = express();
app.use(express.json());

// Initialize database
const db = new Database(process.env.DB_PATH || './db/xp-reports.db');
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS processed_orgs (
    org_name TEXT PRIMARY KEY,
    repo_url TEXT NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email TEXT,
    workflow_run_id INTEGER
  )
`);

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Email transporter
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface XPReportRequest {
  repoUrl: string;
  email: string;
}

/**
 * Parse GitHub repository URL
 */
function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

/**
 * Check if organization has already been processed
 */
function hasOrgBeenProcessed(orgName: string): boolean {
  const stmt = db.prepare('SELECT 1 FROM processed_orgs WHERE org_name = ?');
  return stmt.get(orgName) !== undefined;
}

/**
 * Mark organization as processed
 */
function markOrgAsProcessed(orgName: string, repoUrl: string, email: string, workflowRunId: number) {
  const stmt = db.prepare(
    'INSERT INTO processed_orgs (org_name, repo_url, email, workflow_run_id) VALUES (?, ?, ?, ?)'
  );
  stmt.run(orgName, repoUrl, email, workflowRunId);
}

/**
 * Generate signature for workflow dispatch
 * Based on UbiquityOS kernel signature mechanism
 */
function generateSignature(payload: string): string {
  const privateKeyHex = process.env.X25519_PRIVATE_KEY;
  if (!privateKeyHex) {
    throw new Error('X25519_PRIVATE_KEY not configured');
  }
  
  const privateKey = Buffer.from(privateKeyHex, 'hex');
  const message = Buffer.from(payload, 'utf8');
  const signature = nacl.sign.detached(message, privateKey);
  
  return Buffer.from(signature).toString('base64');
}

/**
 * Trigger text-conversation-rewards workflow
 */
async function triggerXPCalculation(owner: string, repo: string): Promise<number> {
  // Prepare workflow inputs
  const eventPayload = {
    repository: {
      owner: { login: owner },
      name: repo,
    },
    sender: { login: 'xp-report-automation' },
  };

  const settings = {
    // XP calculation settings - adjust based on ubiquity defaults
    incentives: {
      enabled: true,
    },
    labels: {
      // Theoretical labels for XP calculation
      time: ['Time: <1 Hour', 'Time: <2 Hours', 'Time: <1 Day', 'Time: <1 Week'],
      priority: ['Priority: 1 (Normal)', 'Priority: 2 (Medium)', 'Priority: 3 (High)', 'Priority: 4 (Urgent)', 'Priority: 5 (Critical)'],
    },
  };

  const payload = JSON.stringify({ eventPayload, settings });
  const signature = generateSignature(payload);

  // Trigger workflow
  const response = await octokit.actions.createWorkflowDispatch({
    owner: 'ubiquity-os-marketplace',
    repo: 'text-conversation-rewards',
    workflow_id: 'compute.yml',
    ref: 'main',
    inputs: {
      stateId: crypto.randomUUID(),
      eventName: 'issues.closed',
      eventPayload: JSON.stringify(eventPayload),
      settings: JSON.stringify(settings),
      authToken: process.env.GITHUB_TOKEN || '',
      ref: 'main',
      signature,
    },
  });

  // Get the workflow run ID (requires polling as GitHub doesn't return it immediately)
  await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5s for workflow to start

  const runs = await octokit.actions.listWorkflowRuns({
    owner: 'ubiquity-os-marketplace',
    repo: 'text-conversation-rewards',
    workflow_id: 'compute.yml',
    per_page: 1,
  });

  const workflowRunId = runs.data.workflow_runs[0]?.id || 0;
  return workflowRunId;
}

/**
 * Wait for workflow completion and get results
 */
async function waitForWorkflowCompletion(runId: number): Promise<string> {
  const maxAttempts = 60; // 10 minutes max
  const pollInterval = 10000; // 10 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const run = await octokit.actions.getWorkflowRun({
      owner: 'ubiquity-os-marketplace',
      repo: 'text-conversation-rewards',
      run_id: runId,
    });

    if (run.data.status === 'completed') {
      if (run.data.conclusion === 'success') {
        // Fetch logs or artifacts (simplified - would need actual artifact download)
        return run.data.html_url;
      } else {
        throw new Error(`Workflow failed: ${run.data.conclusion}`);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Workflow timeout');
}

/**
 * Send email with XP report results
 */
async function sendEmailReport(email: string, repoUrl: string, workflowUrl: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@ubq.fi',
    to: email,
    subject: 'Your Free XP Report is Ready!',
    html: `
      <h2>XP Report for ${repoUrl}</h2>
      <p>Thank you for trying Ubiquity XP! Your free report has been generated.</p>
      <p><strong>View your report:</strong> <a href="${workflowUrl}">${workflowUrl}</a></p>
      <p>Interested in automating XP rewards for your team? Contact us to learn more about Ubiquity OS.</p>
      <hr>
      <p><small>This is a one-time free report. Additional reports require a paid subscription.</small></p>
    `,
  });
}

/**
 * Main endpoint: Generate XP report
 */
app.post('/api/generate-xp-report', async (req: Request, res: Response) => {
  try {
    const { repoUrl, email }: XPReportRequest = req.body;

    // Validate inputs
    if (!repoUrl || !email) {
      return res.status(400).json({ error: 'Missing repoUrl or email' });
    }

    // Parse repo URL
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }

    const { owner, repo } = parsed;

    // Check if org already processed
    if (hasOrgBeenProcessed(owner)) {
      return res.status(403).json({
        error: 'Organization already received a free report',
        message: 'Only one free report per organization is allowed. Please contact sales for additional reports.',
      });
    }

    // Verify repo exists and is public
    try {
      const repoData = await octokit.repos.get({ owner, repo });
      if (repoData.data.private) {
        return res.status(400).json({ error: 'Repository must be public' });
      }
    } catch (error) {
      return res.status(404).json({ error: 'Repository not found or not accessible' });
    }

    // Trigger XP calculation
    const workflowRunId = await triggerXPCalculation(owner, repo);

    // Mark as processed immediately to prevent double-processing
    markOrgAsProcessed(owner, repoUrl, email, workflowRunId);

    // Return immediately with pending status
    res.status(202).json({
      message: 'XP report generation started',
      status: 'pending',
      workflowRunId,
      estimatedTime: '5-10 minutes',
    });

    // Process in background
    (async () => {
      try {
        const workflowUrl = await waitForWorkflowCompletion(workflowRunId);
        await sendEmailReport(email, repoUrl, workflowUrl);
      } catch (error) {
        console.error('Background processing error:', error);
        // Could implement retry logic or admin notification here
      }
    })();
  } catch (error) {
    console.error('Error generating XP report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'xp-report-automation' });
});

/**
 * Stats endpoint (admin only - requires API key)
 */
app.get('/api/stats', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const stats = db.prepare('SELECT COUNT(*) as count FROM processed_orgs').get() as { count: number };
  const recent = db.prepare('SELECT * FROM processed_orgs ORDER BY processed_at DESC LIMIT 10').all();

  res.json({ totalReports: stats.count, recentReports: recent });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`XP Report Automation API running on port ${PORT}`);
});
