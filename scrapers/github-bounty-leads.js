#!/usr/bin/env node

/**
 * Finds GitHub issues that are likely to be bounty programs or paid tasks and
 * ranks them as business-development leads for Ubiquity.
 *
 * This script is read-only. It does not post comments, open issues, or contact
 * projects. Use the output as a qualification queue for manual outreach.
 */

const DEFAULT_QUERIES = [
  'is:issue is:open "/bounty" "$"',
  'is:issue is:open "Price:" "Time:" "Priority:"',
  'is:issue is:open "Reward:" "Payment:" "How to Claim"',
  'is:issue is:open "Bounty:" "Acceptance Criteria"',
  'is:issue is:open "USDC" "bounty"',
];

const NEGATIVE_TERMS = [
  "airdrop",
  "captcha",
  "discord",
  "giveaway",
  "kyc",
  "like and repost",
  "mint",
  "private key",
  "seed phrase",
  "stake",
  "wallet",
];

function parseArgs(argv) {
  const options = {
    format: "markdown",
    maxPerQuery: 10,
    minScore: 35,
    query: [],
    includeRisky: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--format" && next) {
      options.format = next;
      i += 1;
    } else if (arg === "--max-per-query" && next) {
      options.maxPerQuery = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--min-score" && next) {
      options.minScore = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--query" && next) {
      options.query.push(next);
      i += 1;
    } else if (arg === "--include-risky") {
      options.includeRisky = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.maxPerQuery) || options.maxPerQuery < 1 || options.maxPerQuery > 100) {
    throw new Error("--max-per-query must be between 1 and 100");
  }

  if (!Number.isFinite(options.minScore)) {
    throw new Error("--min-score must be a number");
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scrapers/github-bounty-leads.js [options]

Options:
  --format markdown|csv|json   Output format. Default: markdown
  --max-per-query <number>     GitHub results per search query. Default: 10
  --min-score <number>         Hide leads below this score. Default: 35
  --query <github search>      Add a custom issue search. Can be repeated
  --include-risky              Keep wallet/stake/social-risk leads in output
  -h, --help                   Show help

Environment:
  GITHUB_TOKEN or GH_TOKEN     Optional token for higher GitHub API limits
`);
}

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ubiquity-github-bounty-leads",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function githubJson(url) {
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status} for ${url}\n${body.slice(0, 800)}`);
  }
  return response.json();
}

async function searchIssues(query, maxPerQuery) {
  const params = new URLSearchParams({
    q: query,
    sort: "updated",
    order: "desc",
    per_page: String(maxPerQuery),
  });
  return githubJson(`https://api.github.com/search/issues?${params.toString()}`);
}

async function countOpenPullRequests(repo, issueNumber) {
  const params = new URLSearchParams({
    q: `repo:${repo} is:pr is:open #${issueNumber}`,
    per_page: "5",
  });
  try {
    const result = await githubJson(`https://api.github.com/search/issues?${params.toString()}`);
    return result.total_count || 0;
  } catch {
    return null;
  }
}

function repoFromApiUrl(repositoryUrl) {
  return repositoryUrl.replace("https://api.github.com/repos/", "");
}

function extractAmount(text, labels) {
  const haystack = `${labels.join(" ")}\n${text}`;
  const patterns = [
    /\bPrice:\s*([0-9][0-9,]*(?:\.\d+)?)\s*(USD|USDC)?/i,
    /\bbounty\s*\$?\s*([0-9][0-9,]*(?:\.\d+)?)\s*(USD|USDC)?/i,
    /\$([0-9][0-9,]*(?:\.\d+)?)\b/i,
    /\b([0-9][0-9,]*(?:\.\d+)?)\s*\$/i,
    /\b([0-9][0-9,]*(?:\.\d+)?)\s*(USD|USDC)\b/i,
  ];

  for (const pattern of patterns) {
    const match = haystack.match(pattern);
    if (match) {
      const amount = Number.parseFloat(match[1].replace(/,/g, ""));
      const currency = (match[2] || "USD").toUpperCase();
      if (Number.isFinite(amount)) {
        return { amount, currency, raw: match[0].trim() };
      }
    }
  }
  return { amount: null, currency: "", raw: "" };
}

function hasPaidWorkSignal(text, labels, amountInfo) {
  if (amountInfo.amount) {
    return true;
  }
  return /(\/bounty|bounty|reward|payment|payout|paid task|price:|opire|algora|usdc|usd)/i.test(
    `${labels.join(" ")}\n${text}`
  );
}

function daysSince(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }
  return Math.floor((Date.now() - date.valueOf()) / 86400000);
}

function hasRiskSignals(text) {
  const lower = text.toLowerCase();
  return NEGATIVE_TERMS.filter((term) => lower.includes(term));
}

function outreachAngle(item, labels, body) {
  const lower = `${labels.join(" ")}\n${body}`.toLowerCase();
  if (lower.includes("price:") && lower.includes("time:")) {
    return "Uses priced GitHub issues already; pitch automated lead capture and task routing.";
  }
  if (lower.includes("/bounty") || lower.includes("opire") || lower.includes("algora")) {
    return "Uses a GitHub bounty workflow; pitch a GitHub-native bounty marketplace alternative.";
  }
  if (lower.includes("payment") || lower.includes("how to claim")) {
    return "Has public payout instructions; qualify maintainers for structured bounty operations.";
  }
  if (item.comments <= 5) {
    return "Low-competition issue; qualify whether maintainers need more contributors.";
  }
  return "General bounty lead; manually review before outreach.";
}

function scoreLead({ amount, comments, updatedDays, openPrCount, riskSignals, body, labels }) {
  let score = 0;
  const lower = `${labels.join(" ")}\n${body}`.toLowerCase();

  if (amount >= 500) score += 30;
  else if (amount >= 200) score += 24;
  else if (amount >= 50) score += 14;
  else if (amount > 0) score += 6;

  if (openPrCount === 0) score += 20;
  else if (openPrCount !== null && openPrCount <= 2) score += 8;

  if (comments <= 3) score += 12;
  else if (comments <= 10) score += 6;

  if (updatedDays !== null && updatedDays <= 14) score += 10;
  else if (updatedDays !== null && updatedDays <= 60) score += 5;

  if (lower.includes("price:") && lower.includes("time:")) score += 15;
  if (lower.includes("/bounty") || lower.includes("opire") || lower.includes("algora")) score += 10;
  if (riskSignals.length > 0) score -= 35;

  return score;
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function renderCsv(rows) {
  const headers = [
    "score",
    "amount",
    "currency",
    "repo",
    "issue",
    "title",
    "url",
    "labels",
    "comments",
    "open_pr_count",
    "updated_days",
    "risk_signals",
    "outreach_angle",
  ];
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header])).join(","));
  }
  return lines.join("\n");
}

function renderMarkdown(rows) {
  const lines = [
    "# GitHub Bounty Lead Candidates",
    "",
    "| Score | Amount | Repo | Issue | PRs | Updated | Risk | Outreach angle |",
    "| ---: | ---: | --- | --- | ---: | ---: | --- | --- |",
  ];

  for (const row of rows) {
    const amount = row.amount ? `${row.amount} ${row.currency}` : "";
    const issue = `[#${row.issue}](${row.url})`;
    lines.push(
      `| ${row.score} | ${amount} | \`${row.repo}\` | ${issue} | ${row.open_pr_count ?? "?"} | ${row.updated_days ?? "?"}d | ${row.risk_signals || ""} | ${row.outreach_angle} |`
    );
  }

  return lines.join("\n");
}

async function main() {
  const options = parseArgs(process.argv);
  if (options.help) {
    printHelp();
    return;
  }

  const queries = options.query.length ? options.query : DEFAULT_QUERIES;
  const seen = new Set();
  const leads = [];

  for (const query of queries) {
    const result = await searchIssues(query, options.maxPerQuery);
    for (const item of result.items || []) {
      if (item.pull_request) continue;

      const repo = repoFromApiUrl(item.repository_url);
      const key = `${repo}#${item.number}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const labels = (item.labels || []).map((label) => label.name || "");
      const body = item.body || "";
      const amountInfo = extractAmount(`${item.title}\n${body}`, labels);
      if (!hasPaidWorkSignal(`${item.title}\n${body}`, labels, amountInfo)) continue;
      const riskSignals = hasRiskSignals(`${item.title}\n${body}`);
      if (riskSignals.length > 0 && !options.includeRisky) continue;

      const openPrCount = await countOpenPullRequests(repo, item.number);
      const updatedDays = daysSince(item.updated_at);
      const score = scoreLead({
        amount: amountInfo.amount || 0,
        comments: item.comments || 0,
        updatedDays,
        openPrCount,
        riskSignals,
        body,
        labels,
      });

      if (score < options.minScore) continue;

      leads.push({
        score,
        amount: amountInfo.amount || "",
        currency: amountInfo.currency || "",
        repo,
        issue: item.number,
        title: item.title,
        url: item.html_url,
        labels: labels.join("; "),
        comments: item.comments || 0,
        open_pr_count: openPrCount,
        updated_days: updatedDays,
        risk_signals: riskSignals.join("; "),
        outreach_angle: outreachAngle(item, labels, body),
      });
    }
  }

  leads.sort((a, b) => b.score - a.score || Number(b.amount || 0) - Number(a.amount || 0));

  if (options.format === "json") {
    console.log(JSON.stringify(leads, null, 2));
  } else if (options.format === "csv") {
    console.log(renderCsv(leads));
  } else if (options.format === "markdown") {
    console.log(renderMarkdown(leads));
  } else {
    throw new Error("--format must be markdown, csv, or json");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
