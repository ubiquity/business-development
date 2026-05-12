#!/usr/bin/env python3
"""Find GitHub repositories that are actively running bounty-style work.

The output is intended for business development research, not automated spam.
Use it to identify projects that already understand GitHub-native bounties and
may be receptive to Ubiquity's DevPool / task marketplace offer.
"""

from __future__ import annotations

import csv
import datetime as dt
import json
import os
import time
import urllib.parse
import urllib.request
from urllib.error import HTTPError
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "archive" / "partners" / "github"
USER_AGENT = "Ubiquity-GitHub-Based-Marketing-Research/1.0"

SEARCH_QUERIES = [
    'is:issue is:open "bounty" "good first issue" -security -vulnerability -audit',
    'is:issue is:open "paid" "bounty" -security -vulnerability -audit',
    'is:issue is:open label:bounty -security -vulnerability -audit',
    'is:issue is:open "reward" "GitHub" "issue" -security -vulnerability -audit',
    'is:issue is:open "bounty" "documentation" -security -vulnerability -audit',
    'is:issue is:open "bounty" "design" -security -vulnerability -audit',
]

EXCLUDED_TERMS = {
    "security",
    "audit",
    "vulnerability",
    "exploit",
    "ctf",
    "red team",
    "xss",
    "csrf",
    "hardening",
    "attack",
    "pentest",
    "pentesting",
    "upvote",
    "star",
    "star all",
    "share on social",
    "open an issue",
    "comment on any",
    "review an open pr",
    "answer questions",
    "vote manipulation",
}


def github_get(path: str, params: dict[str, str | int]) -> dict:
    token = os.environ.get("GITHUB_TOKEN")
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": USER_AGENT,
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = "https://api.github.com" + path + "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def repo_key(repository_url: str) -> str:
    return repository_url.split("/repos/", 1)[-1]


def collect_issues(per_query: int = 20) -> list[dict]:
    seen: set[str] = set()
    rows: list[dict] = []
    for query in SEARCH_QUERIES:
        data = github_get(
            "/search/issues",
            {
                "q": query,
                "sort": "updated",
                "order": "desc",
                "per_page": per_query,
            },
        )
        for item in data.get("items", []):
            if "pull_request" in item:
                continue
            key = item["html_url"]
            if key in seen:
                continue
            seen.add(key)
            labels = [label["name"] for label in item.get("labels", [])]
            haystack = " ".join([item["title"], item.get("body") or "", " ".join(labels)]).lower()
            if any(term in haystack for term in EXCLUDED_TERMS):
                continue
            rows.append(
                {
                    "query": query,
                    "repo": repo_key(item["repository_url"]),
                    "title": item["title"],
                    "issueUrl": item["html_url"],
                    "updatedAt": item["updated_at"],
                    "labels": ", ".join(labels),
                }
            )
        time.sleep(1)
    return rows


def load_existing_csv() -> list[dict]:
    path = OUT_DIR / "github-bounty-leads.csv"
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    normalized = []
    for row in rows:
        normalized.append(
            {
                "query": row.get("query", ""),
                "repo": row.get("repo", ""),
                "title": row.get("title", ""),
                "issueUrl": row.get("issueUrl", ""),
                "updatedAt": row.get("updatedAt", ""),
                "labels": row.get("labels", ""),
            }
        )
    return normalized


def is_excluded(row: dict) -> bool:
    haystack = " ".join([row.get("title", ""), row.get("labels", ""), row.get("repo", "")]).lower()
    return any(term in haystack for term in EXCLUDED_TERMS)


def score(row: dict) -> int:
    labels = row["labels"].lower()
    title = row["title"].lower()
    points = 0
    if "bounty" in labels or "bounty" in title:
        points += 35
    if "good first issue" in labels or "good first issue" in title:
        points += 15
    if "$" in title or "paid" in title or "reward" in title:
        points += 15
    if any(term in title for term in EXCLUDED_TERMS):
        points -= 50
    if "documentation" in labels or "docs" in title:
        points += 10
    if "open" in labels:
        points += 5
    return points


def write_csv(rows: list[dict]) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / "github-bounty-leads.csv"
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "score",
                "repo",
                "title",
                "issueUrl",
                "updatedAt",
                "labels",
                "query",
            ],
        )
        writer.writeheader()
        for row in rows:
            if is_excluded(row):
                continue
            writer.writerow({"score": score(row), **row})
    return path


def write_report(rows: list[dict]) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    generated = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    ranked = [
        row
        for row in sorted(rows, key=score, reverse=True)
        if score(row) > 0 and not is_excluded(row)
    ]
    path = OUT_DIR / "github-based-marketing.md"
    lines = [
        "# GitHub Based Marketing",
        "",
        f"Generated: {generated}",
        "",
        "Issue: https://github.com/ubiquity/business-development/issues/90",
        "",
        "## Goal",
        "",
        "Find projects that already run bounty-style work on GitHub and are therefore more likely to understand Ubiquity's GitHub-native task marketplace.",
        "",
        "This is a research and qualification workflow. It should not be used for automated spam. Outreach should be manual, relevant, and limited to projects with clear GitHub bounty activity.",
        "",
        "## Search Queries",
        "",
    ]
    lines.extend([f"- `{query}`" for query in SEARCH_QUERIES])
    lines.extend(
        [
            "",
            "## Top Qualified Leads",
            "",
            "| Score | Repository | Signal | Issue |",
            "| ---: | --- | --- | --- |",
        ]
    )
    for row in ranked[:25]:
        title = row["title"].replace("|", "\\|")
        lines.append(
            f"| {score(row)} | `{row['repo']}` | {title} | [issue]({row['issueUrl']}) |"
        )
    lines.extend(
        [
            "",
            "## Recommended Outreach Angle",
            "",
            "Use this only where the repository has open bounty issues or a visible bounty workflow.",
            "",
            "```text",
            "Hi, I noticed your project is already coordinating bounty-style work directly on GitHub.",
            "",
            "Ubiquity helps teams turn GitHub issues into priced, reviewable work with clearer contributor flow and less manual tracking.",
            "",
            "The reason I thought it might fit: you already have public bounty/issues activity, so the migration cost should be low.",
            "",
            "Would it be useful if I mapped one of your current bounty workflows into a Ubiquity-style issue/pricing setup as a concrete example?",
            "```",
            "",
            "## Qualification Rules",
            "",
            "- Prioritize repositories with current open bounty issues.",
            "- Avoid security/audit/exploit bounty targets for this campaign.",
            "- Avoid repositories where the only bounty is social propagation.",
            "- Avoid voting, starring, or engagement-manipulation tasks.",
            "- Prefer projects where GitHub is already the coordination surface.",
            "- Do not post generic copy-paste comments across many repositories.",
            "",
            "## Next Step",
            "",
            "Manually review the top 10 leads, pick 3 with active non-security bounty workflows, and draft repository-specific comments or emails.",
            "",
            "CSV output: `archive/partners/github/github-bounty-leads.csv`",
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def main() -> None:
    try:
        rows = collect_issues()
    except HTTPError as error:
        if error.code != 403:
            raise
        rows = load_existing_csv()
        if not rows:
            raise
        print("GitHub API rate limited; regenerated report from existing CSV cache.")
    csv_path = write_csv(rows)
    report_path = write_report(rows)
    print(f"Wrote {csv_path}")
    print(f"Wrote {report_path}")
    print(f"Rows: {len(rows)}")


if __name__ == "__main__":
    main()
