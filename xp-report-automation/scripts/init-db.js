const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Use DB_PATH from environment or default
const dbPath = process.env.DB_PATH || path.join(__dirname, '../db/xp-reports.db');
const dbDir = path.dirname(dbPath);

// Ensure db directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Create tables with status column for tracking
db.exec(`
  CREATE TABLE IF NOT EXISTS processed_orgs (
    org_name TEXT PRIMARY KEY,
    repo_url TEXT NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email TEXT,
    workflow_run_id INTEGER,
    status TEXT DEFAULT 'pending'
  );

  CREATE INDEX IF NOT EXISTS idx_processed_at ON processed_orgs(processed_at DESC);
  CREATE INDEX IF NOT EXISTS idx_status ON processed_orgs(status);
`);

console.log(`Database initialized at ${dbPath}`);
db.close();
