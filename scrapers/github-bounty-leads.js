#!/usr/bin/env node

/**
 * Find GitHub projects that already run bounty programs.
 *
 * This is intentionally read-only: it searches public GitHub issues, scores
 * likely bounty leads, and writes a markdown report for manual business review.
 *
 * Usage:
 *   GITHUB_TOKEN=... node scrapers/github-bounty-leads.js --limit 25 --out github-bounty-leads.md
 */

const DEFAULT_QUERIES = [
  'is:issue is:open "Price:" "USD" "Time:"',
  'is:issue is:open "Reward" "USD" "Bounty"',
  'is:issue is:open "Funded on Issuehunt"',
  'is:issue is:open "bounty" "$" "help wanted"',
];

const EXCLUDED_REPOS = new Set([
  "SecureBananaLabs/bug-bounty",
  "zhangjiayang6835-cyber/bounty-plaza",
  "claude-builders-bounty/claude-builders-bounty",
]);

const MONEY_PATTERNS = [
  /Price:\s*\$?\s*(?<amount>[0-9][0-9,]*(?:\.[0-9]+)?)\s*USD/i,
  /Reward\s*:?\s*\$?\s*(?<amount>[0-9][0-9,]*(?:\.[0-9]+)?)\s*USD/i,
  /\$\s*(?<amount>[0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:USD|USDC)?/i,
  /(?<amount>[0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:USD|USDC)/i,
];

function parseArgs(argv) {
  const options = {
    limit: 20,
    perQuery: 15,
    out: "",
    checkPrs: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--limit" && next) {
      options.limit = Number.parseInt(next, 10);
      index++;
    } else if (arg === "--per-query" && next) {
      options.perQuery = Number.parseInt(next, 10);
      index++;
    } else if (arg === "--out" && next) {
      options.out = next;
      index++;
    } else if (arg === "--check-prs") {
      options.checkPrs = true;
    }
  }

  return options;
}

function normalizeText(value, maxLength = 240) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function extractAmount(text) {
  for (const pattern of MONEY_PATTERNS) {
    const match = pattern.exec(text);
    if (match?.groups?.amount) {
      return Number.parseFloat(match.groups.amount.replace(/,/g, ""));
    }
  }

  return 0;
}

function repoFromApiUrl(url) {
  return url.replace("https://api.github.com/repos/", "");
}

function githubHeaders() {
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "ubiquity-github-bounty-leads",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function githubJson(url) {
  const response = await fetch(url, { headers: githubHeaders() });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${normalizeText(text, 180)}`);
  }

  return response.json();
}

async function searchIssues(query, perPage) {
  const url = new URL("https://api.github.com/search/issues");
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "updated");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(perPage));
  return githubJson(url);
}

async function relatedOpenPrCount(repo, issueNumber, title) {
  const candidates = [
    `repo:${repo} is:pr is:open ${issueNumber}`,
    `repo:${repo} is:pr is:open "${title.replaceAll('"', "")}"`,
  ];

  let max = 0;
  for (const query of candidates) {
    const result = await searchIssues(query, 1);
    max = Math.max(max, result.total_count ?? 0);
  }

  return max;
}

function scoreLead(lead) {
  let score = 0;

  if (lead.amountUsd > 0) {
    score += 5;
  }

  if (lead.amountUsd >= 200) {
    score += 35;
  } else if (lead.amountUsd >= 100) {
    score += 25;
  } else if (lead.amountUsd >= 25) {
    score += 15;
  }

  if (lead.comments <= 3) {
    score += 20;
  } else if (lead.comments <= 15) {
    score += 10;
  }

  if (lead.relatedOpenPrs === 0) {
    score += 25;
  } else if (lead.relatedOpenPrs === 1) {
    score += 10;
  }

  if (/price:|time:|priority:/i.test(lead.labels)) {
    score += 15;
  }

  if (/funded on issuehunt/i.test(lead.labels)) {
    score += 15;
  }

  if (/help wanted|good first issue|bounty/i.test(lead.labels)) {
    score += 10;
  }

  return score;
}

function toMarkdown(leads) {
  const lines = [
    "# GitHub Bounty Lead Report",
    "",
    "Read-only scan of public GitHub issues that mention bounties, rewards, or USD pricing.",
    "Use this as a manual shortlist for business development; do not automate outreach.",
    "",
    "| Score | Amount | Repo | Issue | Open PRs | Comments | Updated | Labels | Title |",
    "|---:|---:|---|---:|---:|---:|---|---|---|",
  ];

  for (const lead of leads) {
    const title = lead.title.replaceAll("|", "/");
    const labels = lead.labels.replaceAll("|", "/");
    const relatedOpenPrs = lead.relatedOpenPrs < 0 ? "not checked" : lead.relatedOpenPrs;
    lines.push(`| ${lead.score} | $${lead.amountUsd} | ${lead.repo} | [#${lead.issue}](${lead.url}) | ${relatedOpenPrs} | ${lead.comments} | ${lead.updatedAt} | ${labels} | ${title} |`);
  }

  lines.push("");
  lines.push("## Recommended Workflow");
  lines.push("");
  lines.push("1. Review the top 10 leads manually.");
  lines.push("2. Prefer issues with explicit USD pricing, recent activity, and zero related open PRs.");
  lines.push("3. Avoid security-sensitive reports, spammy bounty farms, and repos where the reward is ambiguous.");
  lines.push("4. Draft any outreach manually and tailor it to the repository context.");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const seen = new Set();
  const leads = [];

  for (const query of DEFAULT_QUERIES) {
    const result = await searchIssues(query, options.perQuery);

    for (const item of result.items ?? []) {
      if (item.pull_request) {
        continue;
      }

      const repo = repoFromApiUrl(item.repository_url);
      if (EXCLUDED_REPOS.has(repo)) {
        continue;
      }

      const key = `${repo}#${item.number}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const labels = (item.labels ?? []).map(label => label.name).join(", ");
      const amountUsd = extractAmount(`${item.title}\n${labels}\n${item.body ?? ""}`);
      if (amountUsd <= 0) {
        continue;
      }

      const relatedOpenPrs = options.checkPrs
        ? await relatedOpenPrCount(repo, item.number, item.title)
        : -1;

      const lead = {
        repo,
        issue: item.number,
        title: normalizeText(item.title),
        url: item.html_url,
        amountUsd,
        comments: item.comments ?? 0,
        updatedAt: item.updated_at,
        labels,
        relatedOpenPrs,
      };
      lead.score = scoreLead(lead);
      leads.push(lead);
    }
  }

  const ranked = leads
    .sort((left, right) => right.score - left.score || right.amountUsd - left.amountUsd || left.comments - right.comments)
    .slice(0, options.limit);

  const markdown = toMarkdown(ranked);

  if (options.out) {
    await import("node:fs/promises").then(fs => fs.writeFile(options.out, markdown));
  }

  process.stdout.write(markdown);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
