#!/usr/bin/env node

const DEFAULT_QUERIES = [
  '"bounty" "github" "open source"',
  '"/bounty $"',
  '"paid issue" "github"',
  '"reward" "pull request"',
  '"good first issue" "bounty"',
  '"help wanted" "bounty"',
]

const REPO_NOISE = [
  /(^|\/)(test|demo|sandbox|playground|practice|tutorial|learning)(-|_|$)/i,
  /(^|\/)(fork|archive|mirror)(-|_|$)/i,
]

const TITLE_NOISE = [
  /\btest\b/i,
  /\bplaceholder\b/i,
  /\bexample\b/i,
  /\bonboarding\b/i,
]

function parseArgs(argv) {
  const args = {
    perQuery: 15,
    minScore: 6,
    format: "markdown",
    queries: DEFAULT_QUERIES,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = argv[i + 1]
    if (arg === "--per-query" && next) {
      args.perQuery = Number(next)
      i += 1
    } else if (arg === "--min-score" && next) {
      args.minScore = Number(next)
      i += 1
    } else if (arg === "--format" && next) {
      args.format = next
      i += 1
    } else if (arg === "--query" && next) {
      args.queries = [next]
      i += 1
    }
  }

  return args
}

function authHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ubiquity-github-bounty-leads",
    "X-GitHub-Api-Version": "2022-11-28",
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  return headers
}

function extractAmount(text) {
  const matches = [...text.matchAll(/(?:\$|USD\s*)([1-9][0-9]{1,5})/gi)]
    .map((match) => Number(match[1]))
    .filter((amount) => Number.isFinite(amount))
  return matches.length ? Math.max(...matches) : 0
}

function scoreIssue(issue) {
  const text = `${issue.title}\n${issue.body ?? ""}`
  const labels = (issue.labels ?? []).map((label) => label.name.toLowerCase())
  const repo = issue.repository_url.replace("https://api.github.com/repos/", "")
  const amount = extractAmount(text)
  let score = 0

  if (amount >= 20) score += 4
  if (amount >= 100) score += 2
  if (labels.some((label) => label.includes("bounty"))) score += 3
  if (labels.some((label) => label.includes("good first issue") || label.includes("help wanted"))) score += 1
  if (issue.state === "open") score += 2
  if ((issue.comments ?? 0) <= 5) score += 2
  if ((issue.comments ?? 0) >= 20) score -= 2
  if (REPO_NOISE.some((pattern) => pattern.test(repo))) score -= 3
  if (TITLE_NOISE.some((pattern) => pattern.test(issue.title))) score -= 2
  if (/scam|airdrop|giveaway|referral/i.test(text)) score -= 5

  return { amount, score }
}

async function searchIssues(query, perQuery) {
  const url = new URL("https://api.github.com/search/issues")
  url.searchParams.set("q", `is:issue is:open ${query}`)
  url.searchParams.set("sort", "updated")
  url.searchParams.set("order", "desc")
  url.searchParams.set("per_page", String(perQuery))

  const response = await fetch(url, { headers: authHeaders() })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`GitHub search failed for ${query}: ${response.status} ${body}`)
  }

  return response.json()
}

function normalizeLead(issue, query) {
  const repo = issue.repository_url.replace("https://api.github.com/repos/", "")
  const { amount, score } = scoreIssue(issue)
  return {
    score,
    amount,
    title: issue.title.replace(/\s+/g, " ").trim(),
    repo,
    url: issue.html_url,
    updatedAt: issue.updated_at,
    comments: issue.comments ?? 0,
    labels: (issue.labels ?? []).map((label) => label.name).join(", "),
    query,
  }
}

function dedupe(leads) {
  const byUrl = new Map()
  for (const lead of leads) {
    const existing = byUrl.get(lead.url)
    if (!existing || lead.score > existing.score) {
      byUrl.set(lead.url, lead)
    }
  }
  return [...byUrl.values()]
}

function toMarkdown(leads) {
  const rows = [
    "| Score | Bounty | Repo | Issue | Comments | Updated |",
    "| ---: | ---: | --- | --- | ---: | --- |",
  ]

  for (const lead of leads) {
    rows.push(
      `| ${lead.score} | ${lead.amount ? `$${lead.amount}` : ""} | ${lead.repo} | [${lead.title.replaceAll("|", "\\|")}](${lead.url}) | ${lead.comments} | ${lead.updatedAt.slice(0, 10)} |`,
    )
  }

  return rows.join("\n")
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`
}

function toCsv(leads) {
  const header = ["score", "amount", "repo", "title", "url", "comments", "updatedAt", "labels", "query"]
  const rows = leads.map((lead) => header.map((key) => csvEscape(lead[key])).join(","))
  return [header.join(","), ...rows].join("\n")
}

async function main() {
  const args = parseArgs(process.argv)
  const rawLeads = []

  for (const query of args.queries) {
    const result = await searchIssues(query, args.perQuery)
    for (const issue of result.items ?? []) {
      rawLeads.push(normalizeLead(issue, query))
    }
  }

  const leads = dedupe(rawLeads)
    .filter((lead) => lead.score >= args.minScore)
    .sort((a, b) => b.score - a.score || b.amount - a.amount || a.comments - b.comments)

  if (args.format === "csv") {
    process.stdout.write(`${toCsv(leads)}\n`)
  } else {
    process.stdout.write(`${toMarkdown(leads)}\n`)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
