#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const API_ROOT = "https://api.github.com";
const DEFAULT_LIMIT = 50;
const DEFAULT_MODES = ["bounties", "growth"];

const SEARCH_QUERIES = {
  bounties: [
    'is:issue is:open label:bounty archived:false',
    'is:issue is:open "bounty" in:title archived:false',
    'is:issue is:open "reward" in:title archived:false',
  ],
  growth: [
    'is:issue is:open "growth" in:title archived:false',
    'is:issue is:open "marketing" in:title archived:false',
    'is:issue is:open "community" in:title archived:false',
  ],
};

function parseArgs(argv) {
  const options = {
    modes: DEFAULT_MODES,
    format: "csv",
    limit: DEFAULT_LIMIT,
    output: null,
    fixture: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];

    if (argument === "--mode") {
      options.modes =
        value === "all"
          ? DEFAULT_MODES
          : value.split(",").map((mode) => mode.trim());
      index += 1;
    } else if (argument === "--format") {
      options.format = value;
      index += 1;
    } else if (argument === "--limit") {
      options.limit = Number.parseInt(value, 10);
      index += 1;
    } else if (argument === "--output") {
      options.output = value;
      index += 1;
    } else if (argument === "--fixture") {
      options.fixture = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  const invalidModes = options.modes.filter(
    (mode) => !Object.hasOwn(SEARCH_QUERIES, mode),
  );
  if (invalidModes.length > 0) {
    throw new Error(`Invalid mode: ${invalidModes.join(", ")}`);
  }
  if (!["csv", "json"].includes(options.format)) {
    throw new Error("Format must be csv or json");
  }
  if (!Number.isInteger(options.limit) || options.limit < 1) {
    throw new Error("Limit must be a positive integer");
  }

  return options;
}

function printHelp() {
  console.log(`
Find GitHub organizations that are candidates for Ubiquity onboarding.

Usage:
  node scrapers/github-prospects.js [options]

Options:
  --mode <bounties|growth|all>  Prospect signal to search (default: all)
  --format <csv|json>           Output format (default: csv)
  --limit <number>              Maximum repositories returned (default: 50)
  --output <path>               Write output to a file instead of stdout
  --fixture <path>              Use an offline JSON fixture instead of GitHub
  --help                        Show this help

Authentication:
  Set GITHUB_TOKEN to increase GitHub API limits. The token only needs
  read access to public repositories.
`);
}

async function githubRequest(endpoint, token = process.env.GITHUB_TOKEN) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ubiquity-business-development-prospect-scraper",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_ROOT}${endpoint}`, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub API ${response.status} for ${endpoint}: ${body.slice(0, 300)}`,
    );
  }
  return response.json();
}

async function searchIssues(query, request = githubRequest) {
  const endpoint =
    `/search/issues?q=${encodeURIComponent(query)}` +
    "&sort=updated&order=desc&per_page=100";
  const response = await request(endpoint);
  return response.items || [];
}

function repositoryName(issue) {
  const marker = "/repos/";
  const offset = issue.repository_url.indexOf(marker);
  return offset === -1 ? "" : issue.repository_url.slice(offset + marker.length);
}

function evidenceFromIssue(issue, mode, query) {
  return {
    mode,
    query,
    issue_number: issue.number,
    issue_title: issue.title,
    issue_url: issue.html_url,
    issue_state: issue.state,
    issue_updated_at: issue.updated_at,
    labels: (issue.labels || []).map((label) =>
      typeof label === "string" ? label : label.name,
    ),
  };
}

function collectCandidates(searchResults) {
  const candidates = new Map();

  for (const result of searchResults) {
    for (const issue of result.items) {
      const fullName = repositoryName(issue);
      if (!fullName) continue;

      const candidate = candidates.get(fullName) || {
        repository: fullName,
        evidence: [],
      };
      candidate.evidence.push(evidenceFromIssue(issue, result.mode, result.query));
      candidates.set(fullName, candidate);
    }
  }

  return [...candidates.values()];
}

function prioritizeForEnrichment(candidates) {
  return [...candidates].sort((left, right) => {
    const newest = (candidate) =>
      Math.max(
        ...candidate.evidence.map(
          (item) => Date.parse(item.issue_updated_at) || 0,
        ),
      );
    return (
      right.evidence.length - left.evidence.length ||
      newest(right) - newest(left)
    );
  });
}

function daysSince(date, now = new Date()) {
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.floor((now.getTime() - timestamp) / 86_400_000);
}

function scoreCandidate(candidate, now = new Date()) {
  const repository = candidate.metadata;
  let score = 0;
  const reasons = [];

  if (repository.archived || repository.disabled) {
    return { score: 0, reasons: ["archived or disabled"] };
  }

  const recentPushDays = daysSince(repository.pushed_at, now);
  if (recentPushDays <= 30) {
    score += 25;
    reasons.push("pushed within 30 days");
  } else if (recentPushDays <= 90) {
    score += 15;
    reasons.push("pushed within 90 days");
  } else if (recentPushDays <= 365) {
    score += 5;
    reasons.push("pushed within one year");
  }

  const stars = repository.stargazers_count || 0;
  if (stars >= 1000) {
    score += 20;
    reasons.push("1,000+ stars");
  } else if (stars >= 100) {
    score += 15;
    reasons.push("100+ stars");
  } else if (stars >= 20) {
    score += 8;
    reasons.push("20+ stars");
  }

  const openIssues = repository.open_issues_count || 0;
  if (openIssues >= 20) {
    score += 10;
    reasons.push("active issue backlog");
  } else if (openIssues >= 5) {
    score += 5;
    reasons.push("multiple open issues");
  }

  const evidenceModes = new Set(candidate.evidence.map((item) => item.mode));
  if (evidenceModes.has("bounties")) {
    score += 25;
    reasons.push("currently uses bounty/reward language");
  }
  if (evidenceModes.has("growth")) {
    score += 15;
    reasons.push("currently discusses growth/community work");
  }
  if (evidenceModes.size > 1) {
    score += 5;
    reasons.push("matches multiple onboarding signals");
  }

  score += Math.min(candidate.evidence.length, 5);
  return { score: Math.min(score, 100), reasons };
}

async function enrichCandidates(candidates, request = githubRequest) {
  const enriched = [];
  for (const candidate of candidates) {
    const metadata = await request(`/repos/${candidate.repository}`);
    const owner = metadata.owner || {};
    enriched.push({
      ...candidate,
      metadata,
      owner_type: owner.type || "",
    });
  }
  return enriched;
}

function rankCandidates(candidates, now = new Date()) {
  return candidates
    .map((candidate) => ({
      ...candidate,
      ...scoreCandidate(candidate, now),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        (right.metadata.stargazers_count || 0) -
          (left.metadata.stargazers_count || 0),
    );
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function toRows(candidates) {
  return candidates.map((candidate) => {
    const metadata = candidate.metadata;
    return {
      score: candidate.score,
      repository: candidate.repository,
      owner_type: candidate.owner_type,
      stars: metadata.stargazers_count || 0,
      forks: metadata.forks_count || 0,
      open_issues: metadata.open_issues_count || 0,
      pushed_at: metadata.pushed_at || "",
      language: metadata.language || "",
      homepage: metadata.homepage || "",
      repository_url: metadata.html_url,
      contact_url: `${metadata.html_url}/issues`,
      signals: [...new Set(candidate.evidence.map((item) => item.mode))].join(
        "; ",
      ),
      reasons: candidate.reasons.join("; "),
      evidence_count: candidate.evidence.length,
      evidence_urls: candidate.evidence
        .map((item) => item.issue_url)
        .join("; "),
    };
  });
}

function serialize(candidates, format) {
  const rows = toRows(candidates);
  if (format === "json") return `${JSON.stringify(rows, null, 2)}\n`;
  if (rows.length === 0) return "";

  const columns = Object.keys(rows[0]);
  return [
    columns.map(csvCell).join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\n") + "\n";
}

async function loadFixture(fixturePath) {
  const contents = await fs.readFile(fixturePath, "utf8");
  return JSON.parse(contents);
}

async function gather(options, request = githubRequest) {
  if (options.fixture) {
    const fixture = await loadFixture(options.fixture);
    const candidates = collectCandidates(fixture.search_results);
    const byRepository = new Map(
      fixture.repositories.map((repository) => [
        repository.full_name,
        repository,
      ]),
    );
    const enriched = candidates.map((candidate) => ({
      ...candidate,
      metadata: byRepository.get(candidate.repository),
      owner_type: byRepository.get(candidate.repository)?.owner?.type || "",
    }));
    return rankCandidates(enriched, new Date(fixture.now));
  }

  const searchResults = [];
  for (const mode of options.modes) {
    for (const query of SEARCH_QUERIES[mode]) {
      searchResults.push({
        mode,
        query,
        items: await searchIssues(query, request),
      });
    }
  }

  // Six search requests plus at most 50 repository requests stay within
  // GitHub's current unauthenticated hourly allowance.
  const candidates = prioritizeForEnrichment(collectCandidates(searchResults))
    .slice(0, Math.min(options.limit * 2, 50));
  return rankCandidates(await enrichCandidates(candidates, request));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const candidates = (await gather(options)).slice(0, options.limit);
  const output = serialize(candidates, options.format);

  if (options.output) {
    const outputPath = path.resolve(options.output);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, output);
    console.error(`Wrote ${candidates.length} prospects to ${outputPath}`);
  } else {
    process.stdout.write(output);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  collectCandidates,
  gather,
  parseArgs,
  rankCandidates,
  scoreCandidate,
  serialize,
  toRows,
};
