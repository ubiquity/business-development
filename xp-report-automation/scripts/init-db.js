const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Ensure db directory exists
const dbDir = path.join(__dirname, '../db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'xp-reports.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS processed_orgs (
    org_name TEXT PRIMARY KEY,
    repo_url TEXT NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email TEXT,
    workflow_run_id INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_processed_at ON processed_orgs(processed_at DESC);
`);

console.log(`Database initialized at ${dbPath}`);
db.close();
