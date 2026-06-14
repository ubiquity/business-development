#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_QUERIES = [
  {
    name: "stablecoin-usdc",
    query: 'is:issue is:open bounty USDC',
  },
  {
    name: "stablecoin-usdt",
    query: 'is:issue is:open bounty USDT',
  },
  {
    name: "ai-agent-friendly",
    query: 'is:issue is:open "AI agent friendly" bounty',
  },
  {
    name: "price-time-labels",
    query: 'is:issue is:open "Price:" "Time:" "Priority:"',
  },
  {
    name: "good-first-bounties",
    query: 'is:issue is:open "good first issue" bounty',
  },
  {
    name: "base-usdc",
    query: 'is:issue is:open "USDC on Base"',
  },
];

const MANUAL_BOARDS = [
  {
    name: "Algora Tailcall",
    url: "https://algora.io/tailcallhq/bounties/community?fund=tailcallhq%2Ftailcall%231121",
    note: "Open-source bounties with public PR workflows.",
  },
  {
    name: "Algora Daytona",
    url: "https://algora.io/daytonaio/bounties?status=open",
    note: "Developer-tooling bounties, usually English-first.",
  },
  {
    name: "Algora Highlight",
    url: "https://algora.io/highlight/bounties?status=open",
    note: "Frontend/backend issues with clear GitHub links.",
  },
];

function parseArgs(argv) {
  const args = {
    dryRun: false,
    limit: 20,
    outDir: "archive/bounty-boards/generated",
    days: 45,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--limit") {
      args.limit = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--out-dir") {
      args.outDir = argv[index + 1];
      index += 1;
    } else if (arg === "--days") {
      args.days = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100) {
    throw new Error("--limit must be an integer from 1 to 100.");
  }
  if (!Number.isInteger(args.days) || args.days < 1) {
    throw new Error("--days must be a positive integer.");
  }

  return args;
}

function usage() {
  return [
    "Usage: node scrapers/github-bounty-leads.js [options]",
    "",
    "Options:",
    "  --dry-run        Print search URLs and seed boards without calling GitHub.",
    "  --limit <n>      Results per query, 1-100. Default: 20.",
    "  --days <n>       Freshness window used by scoring. Default: 45.",
    "  --out-dir <dir>  Output directory. Default: archive/bounty-boards/generated.",
    "",
    "Set GITHUB_TOKEN to raise GitHub Search API rate limits.",
  ].join("\n");
}

function searchUrl(query) {
  return `https://github.com/search?q=${encodeURIComponent(query)}&type=issues`;
}

function apiUrl(query, limit) {
  const params = new URLSearchParams({
    q: query,
    sort: "updated",
    order: "desc",
    per_page: String(limit),
  });
  return `https://api.github.com/search/issues?${params.toString()}`;
}

async function fetchJson(url, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ubiquity-github-bounty-leads",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }

  return JSON.parse(body);
}

function repoFromIssue(issue) {
  const match = issue.repository_url && issue.repository_url.match(/\/repos\/(.+)$/);
  return match ? match[1] : "";
}

function daysSince(dateString) {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
}

function labelNames(issue) {
  return (issue.labels || []).map((label) => {
    if (typeof label === "string") {
      return label;
    }
    return label.name || "";
  }).filter(Boolean);
}

function compactText(issue) {
  return [
    issue.title || "",
    issue.body || "",
    labelNames(issue).join(" "),
  ].join("\n").toLowerCase();
}

function scoreIssue(issue, maxAgeDays) {
  const labels = labelNames(issue);
  const text = compactText(issue);
  const signals = [];
  let score = 0;

  const add = (points, signal) => {
    score += points;
    signals.push(`${points > 0 ? "+" : ""}${points} ${signal}`);
  };

  if (/\b(usdc|usdt|stablecoin|erc20|base)\b/.test(text)) {
    add(12, "explicit stablecoin or chain payout signal");
  }
  if (/\b(bounty|reward|price:|payment:|\$[0-9])/i.test(text)) {
    add(10, "explicit bounty or price signal");
  }
  if (/ai agent friendly|good first issue|help wanted/.test(text)) {
    add(6, "agent-accessible label or wording");
  }
  if ((issue.assignees || []).length === 0) {
    add(5, "unassigned issue");
  }

  const age = daysSince(issue.updated_at);
  if (age <= 7) {
    add(5, "updated within 7 days");
  } else if (age <= maxAgeDays) {
    add(2, `updated within ${maxAgeDays} days`);
  } else {
    add(-4, `stale update older than ${maxAgeDays} days`);
  }

  if (issue.comments <= 5) {
    add(4, "low discussion volume");
  } else if (issue.comments > 20) {
    add(-7, "crowded discussion");
  }

  if (issue.pull_request) {
    add(-25, "search result is a pull request, not an issue");
  }
  if (/already assigned|in progress|duplicate|no longer available|closed by/i.test(text)) {
    add(-10, "competition or closure wording");
  }
  if (/prompt|system prompt|private key|seed phrase|credential/i.test(text)) {
    add(-25, "unsafe data disclosure risk");
  }

  return {
    score,
    signals,
    labels,
  };
}

function toLead(issue, queryName, maxAgeDays) {
  const scoring = scoreIssue(issue, maxAgeDays);
  return {
    score: scoring.score,
    source_query: queryName,
    repo: repoFromIssue(issue),
    title: issue.title,
    url: issue.html_url,
    state: issue.state,
    labels: scoring.labels,
    comments: issue.comments,
    assignees: (issue.assignees || []).map((assignee) => assignee.login),
    updated_at: issue.updated_at,
    created_at: issue.created_at,
    signals: scoring.signals,
  };
}

function csvEscape(value) {
  const stringValue = Array.isArray(value) ? value.join("; ") : String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function toCsv(leads) {
  const headers = [
    "score",
    "source_query",
    "repo",
    "title",
    "url",
    "labels",
    "comments",
    "assignees",
    "updated_at",
    "signals",
  ];
  const rows = leads.map((lead) => headers.map((header) => csvEscape(lead[header])));
  return [headers.map(csvEscape), ...rows].map((row) => row.join(",")).join("\n");
}

async function collectLeads(args) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn("GITHUB_TOKEN is not set. Unauthenticated GitHub Search API calls are heavily rate limited.");
  }

  const byUrl = new Map();
  for (const search of DEFAULT_QUERIES) {
    const data = await fetchJson(apiUrl(search.query, args.limit), token);
    for (const issue of data.items || []) {
      const lead = toLead(issue, search.name, args.days);
      const current = byUrl.get(lead.url);
      if (!current || lead.score > current.score) {
        byUrl.set(lead.url, lead);
      }
    }
  }

  return [...byUrl.values()].sort((a, b) => b.score - a.score || a.comments - b.comments);
}

async function writeOutputs(leads, outDir) {
  const absoluteOutDir = path.resolve(outDir);
  await fs.mkdir(absoluteOutDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const jsonPath = path.join(absoluteOutDir, `github-bounty-leads-${stamp}.json`);
  const csvPath = path.join(absoluteOutDir, `github-bounty-leads-${stamp}.csv`);

  await fs.writeFile(jsonPath, `${JSON.stringify({ generated_at: new Date().toISOString(), leads }, null, 2)}\n`);
  await fs.writeFile(csvPath, `${toCsv(leads)}\n`);

  return { jsonPath, csvPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  if (args.dryRun) {
    console.log("GitHub issue searches:");
    for (const query of DEFAULT_QUERIES) {
      console.log(`- ${query.name}: ${searchUrl(query.query)}`);
    }
    console.log("\nManual English bounty boards to inspect:");
    for (const board of MANUAL_BOARDS) {
      console.log(`- ${board.name}: ${board.url} (${board.note})`);
    }
    return;
  }

  const leads = await collectLeads(args);
  const paths = await writeOutputs(leads, args.outDir);

  console.log(`Collected ${leads.length} unique GitHub bounty leads.`);
  console.log(`JSON: ${paths.jsonPath}`);
  console.log(`CSV:  ${paths.csvPath}`);
  console.log("\nTop leads:");
  for (const lead of leads.slice(0, 10)) {
    console.log(`- [${lead.score}] ${lead.repo} - ${lead.title}`);
    console.log(`  ${lead.url}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
