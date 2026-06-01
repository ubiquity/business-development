// Run this in the browser console on:
// - https://coinmarketcap.com/view/layer-1/
// - https://coinmarketcap.com/view/layer-2/
//
// It opens each visible project row, extracts the project name, website, GitHub,
// docs and social links from the detail panel/page, and downloads a CSV that can
// be merged with nReach or Clay before campaign launch.
(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const CATEGORY = location.pathname.includes("layer-2") ? "Layer 2" : "Layer 1";
  const MAX_ROWS = Number(new URLSearchParams(location.search).get("ubq_limit") || 250);
  const rows = [];
  const seen = new Set();

  function csvEscape(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function normalizeUrl(url) {
    if (!url) {
      return "";
    }
    try {
      const parsed = new URL(url, location.href);
      parsed.hash = "";
      return parsed.href.replace(/\/$/, "");
    } catch {
      return "";
    }
  }

  function linkBucket(url) {
    const lower = url.toLowerCase();
    if (lower.includes("github.com")) {
      return "github";
    }
    if (lower.includes("docs.") || lower.includes("/docs")) {
      return "docs";
    }
    if (lower.includes("linkedin.com")) {
      return "linkedin";
    }
    if (lower.includes("twitter.com") || lower.includes("x.com")) {
      return "twitter";
    }
    if (lower.includes("discord.gg") || lower.includes("discord.com")) {
      return "discord";
    }
    return "website";
  }

  function getCandidateRows() {
    return [...document.querySelectorAll("tbody tr")]
      .filter((row) => row.querySelector("a[href*='/currencies/']"))
      .slice(0, MAX_ROWS);
  }

  function extractName(row) {
    const nameNode =
      row.querySelector("p.coin-item-name") ||
      row.querySelector("a[href*='/currencies/'] p") ||
      row.querySelector("a[href*='/currencies/']");
    return nameNode?.textContent?.trim() || "";
  }

  function extractSlug(row) {
    const href = row.querySelector("a[href*='/currencies/']")?.href || "";
    const match = href.match(/\/currencies\/([^/]+)/);
    return match?.[1] || "";
  }

  function collectLinks() {
    const links = {
      website: [],
      github: [],
      docs: [],
      linkedin: [],
      twitter: [],
      discord: [],
    };

    for (const anchor of document.querySelectorAll("a[href]")) {
      const url = normalizeUrl(anchor.href);
      if (!url) {
        continue;
      }
      const bucket = linkBucket(url);
      if (!links[bucket].includes(url)) {
        links[bucket].push(url);
      }
    }

    return links;
  }

  function detailPanelText() {
    return [...document.querySelectorAll("[role='dialog'], aside, main")]
      .map((node) => node.innerText || "")
      .join("\n")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function openDetails(row) {
    const clickable =
      row.querySelector("a[href*='/currencies/']") ||
      row.querySelector("td") ||
      row;
    clickable.scrollIntoView({ block: "center" });
    await sleep(250);
    clickable.click();
    await sleep(900);
  }

  function closeDetails() {
    const closeButton =
      document.querySelector("[aria-label='Close']") ||
      document.querySelector("button[class*='close']") ||
      document.querySelector("button svg[class*='close']")?.closest("button");
    if (closeButton) {
      closeButton.click();
    } else {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    }
  }

  async function scrapeVisibleRows() {
    for (const row of getCandidateRows()) {
      const slug = extractSlug(row);
      const name = extractName(row);
      if (!slug || seen.has(slug)) {
        continue;
      }
      seen.add(slug);

      await openDetails(row);
      const links = collectLinks();
      const text = detailPanelText();
      closeDetails();
      await sleep(250);

      rows.push({
        category: CATEGORY,
        name,
        slug,
        website: links.website[0] || "",
        github: links.github.join(" "),
        docs: links.docs.join(" "),
        linkedin: links.linkedin.join(" "),
        twitter: links.twitter.join(" "),
        discord: links.discord.join(" "),
        notes: text.slice(0, 280),
      });
      console.log(`[${rows.length}] ${name}`, rows[rows.length - 1]);
    }
  }

  async function scrollAndScrape() {
    let previousHeight = 0;
    for (let pass = 0; pass < 20 && rows.length < MAX_ROWS; pass += 1) {
      await scrapeVisibleRows();
      window.scrollBy(0, window.innerHeight * 0.85);
      await sleep(900);
      if (document.body.scrollHeight === previousHeight) {
        break;
      }
      previousHeight = document.body.scrollHeight;
    }
  }

  await scrollAndScrape();

  const headers = [
    "category",
    "name",
    "slug",
    "website",
    "github",
    "docs",
    "linkedin",
    "twitter",
    "discord",
    "notes",
  ];
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");

  const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `ubiquity-${CATEGORY.toLowerCase().replace(/\s+/g, "-")}-github-leads.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log(`Downloaded ${rows.length} ${CATEGORY} leads.`);
})();
