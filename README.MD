# Business Development Research

This repository contains research and small tools used to identify and qualify
potential Ubiquity partners.

## GitHub Prospect Scraper

`scrapers/github-prospects.js` finds active GitHub projects that already use
bounties, rewards, growth initiatives, marketing tasks, or community programs.
It deduplicates repositories, fetches current repository metadata, and ranks
prospects using:

- recent repository activity;
- stars and open-issue volume;
- active bounty/reward signals;
- active growth/community signals;
- multiple independent matching issues.

The resulting CSV includes evidence links so a business-development researcher
can verify every prospect before outreach.

### Run

Node.js 18 or newer is required.

```bash
# Search both bounty and growth signals
node scrapers/github-prospects.js --output reports/github-prospects.csv

# Search bounty users only and keep the 25 strongest prospects
node scrapers/github-prospects.js \
  --mode bounties \
  --limit 25 \
  --output reports/bounty-prospects.csv

# Produce JSON for another automation
node scrapers/github-prospects.js --format json
```

GitHub permits unauthenticated searches at a low rate. For regular scheduled
runs, provide a read-only public-repository token:

```bash
GITHUB_TOKEN=github_pat_... \
  node scrapers/github-prospects.js --output reports/github-prospects.csv
```

### Test

Tests use an offline fixture and do not consume GitHub API quota:

```bash
node --test scrapers/github-prospects.test.js
```

### Suggested Schedule

The `GitHub Prospect Report` workflow runs every Monday and also supports
manual runs. It uploads CSV and JSON reports as workflow artifacts for 30 days.
Review the top-scoring new entries before outreach and confirm that the linked
issue is genuine, the repository is still active, and the project has a
reachable maintainer or organization contact.
