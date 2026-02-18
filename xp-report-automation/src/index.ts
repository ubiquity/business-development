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
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS processed_orgs (
    org_name TEXT PRIMARY KEY,
    repo_url TEXT NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email TEXT,
    workflow_run_id INTEGER,
    status TEXT DEFAULT 'pending'
  )
`);

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
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
 * Validates HTTPS protocol and proper GitHub domain
 */
function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/\s?#]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

/**
 * Check if organization has already been processed (non-failed only)
 */
function hasOrgBeenProcessed(orgName: string): boolean {
  const stmt = db.prepare("SELECT 1 FROM processed_orgs WHERE org_name = ? AND status != 'failed'");
  return stmt.get(orgName) !== undefined;
}

/**
 * Insert organization record with conflict handling
 * Returns true if inserted, false if already exists
 */
function insertOrgRecord(orgName: string, repoUrl: string, email: string): boolean {
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO processed_orgs (org_name, repo_url, email, workflow_run_id, status) VALUES (?, ?, ?, 0, 'pending')"
  );
  const result = stmt.run(orgName, repoUrl, email);
  return result.changes > 0;
}

/**
 * Update organization processing status and workflow_run_id
 */
function updateOrgStatus(orgName: string, workflowRunId: number, status: string) {
  const stmt = db.prepare('UPDATE processed_orgs SET workflow_run_id = ?, status = ? WHERE org_name = ?');
  stmt.run(workflowRunId, status, orgName);
}

/**
 * Generate signature for workflow dispatch
 * Based on UbiquityOS kernel signature mechanism
 * Uses Ed25519 signing (tweetnacl)
 */
function generateSignature(payload: string): string {
  const privateKeyHex = process.env.ED25519_PRIVATE_KEY;
  if (!privateKeyHex) {
    throw new Error('ED25519_PRIVATE_KEY not configured');
  }
  
  // Ed25519 requires 32-byte seed, expands to 64-byte secret key
  const seed = Buffer.from(privateKeyHex, 'hex');
  if (seed.length !== 32) {
    throw new Error('ED25519_PRIVATE_KEY must be 64 hex characters (32 bytes)');
  }
  
  const keyPair = nacl.sign.keyPair.fromSeed(seed);
  const message = Buffer.from(payload, 'utf8');
  const signature = nacl.sign.detached(message, keyPair.secretKey);
  
  return Buffer.from(signature).toString('base64');
}

/**
 * Trigger text-conversation-rewards workflow
 */
async function triggerXPCalculation(owner: string, repo: string, email: string): Promise<number> {
  // Capture dispatch time BEFORE triggering workflow
  const dispatchTime = new Date().toISOString();
  
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
      ref: 'main',
      signature,
    },
  });

  // Get the workflow run ID with correlation to avoid race conditions
  let workflowRunId = 0;
  
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const runs = await octokit.actions.listWorkflowRuns({
      owner: 'ubiquity-os-marketplace',
      repo: 'text-conversation-rewards',
      workflow_id: 'compute.yml',
      created: `>=${dispatchTime}`,
      per_page: 5,
    });
    
    // Find the workflow_dispatch event triggered by us with matching stateId
    const match = runs.data.workflow_runs.find(r => 
      r.event === 'workflow_dispatch' && 
      new Date(r.created_at) >= new Date(dispatchTime)
    );
    if (match) {
      workflowRunId = match.id;
      break;
    }
  }
  
  if (workflowRunId === 0) {
    throw new Error('Could not find dispatched workflow run');
  }
  
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
 * Escape HTML entities to prevent injection attacks
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Send email with XP report results
 */
async function sendEmailReport(email: string, repoUrl: string, workflowUrl: string) {
  const safeRepoUrl = escapeHtml(repoUrl);
  const safeWorkflowUrl = escapeHtml(workflowUrl);
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@ubq.fi',
    to: email,
    subject: 'Your Free XP Report is Ready!',
    html: `
      <h2>XP Report for ${safeRepoUrl}</h2>
      <p>Thank you for trying Ubiquity XP! Your free report has been generated.</p>
      <p><strong>View your report:</strong> <a href="${safeWorkflowUrl}">${safeWorkflowUrl}</a></p>
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

    // ATOMIC CHECK-AND-INSERT: Insert record first with conflict handling
    // This prevents TOCTOU race condition where concurrent requests could both pass the check
    const inserted = insertOrgRecord(owner, repoUrl, email);
    if (!inserted) {
      // Record already exists (and not failed), reject the request
      return res.status(403).json({
        error: 'Organization already received a free report',
        message: 'Only one free report per organization is allowed. Please contact sales for additional reports.',
      });
    }

    // Verify repo exists and is public
    try {
      const repoData = await octokit.repos.get({ owner, repo });
      if (repoData.data.private) {
        // Mark as failed since we can't process private repos
        updateOrgStatus(owner, 0, 'failed');
        return res.status(400).json({ error: 'Repository must be public' });
      }
    } catch (error) {
      // Mark as failed since repo not found/inaccessible
      updateOrgStatus(owner, 0, 'failed');
      return res.status(404).json({ error: 'Repository not found or not accessible' });
    }

    // Trigger XP calculation
    const workflowRunId = await triggerXPCalculation(owner, repo, email);

    // Update record with workflow run ID
    updateOrgStatus(owner, workflowRunId, 'pending');

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
        updateOrgStatus(owner, workflowRunId, 'completed');
      } catch (error) {
        console.error('Background processing error:', error);
        updateOrgStatus(owner, workflowRunId, 'failed');
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
 * Returns stats without PII (email excluded)
 */
app.get('/api/stats', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const stats = db.prepare('SELECT COUNT(*) as count FROM processed_orgs').get() as { count: number };
  const recent = db.prepare('SELECT org_name, repo_url, processed_at, workflow_run_id, status FROM processed_orgs ORDER BY processed_at DESC LIMIT 10').all();

  res.json({ totalReports: stats.count, recentReports: recent });
});

const PORT = process.env.PORT || 3000;
app.listen(process.env.NODE_ENV === "production" ? "127.0.0.1" : "0.0.0.0", PORT, () => {
  console.log(`XP Report Automation API running on port ${PORT}`);
});
