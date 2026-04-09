import { searchGitHub } from "./search";
import { scoreResults } from "./scoring";
import { CONFIG } from "./config";

async function main() {
  console.log("🔍 GitHub Bounty Prospector");
  const allResults = [];
  for (const query of CONFIG.queries) {
    const results = await searchGitHub(query, CONFIG.maxResults);
    allResults.push(...results);
  }
  const scored = scoreResults(allResults);
  console.log(`Found ${scored.length} leads`);
  const fs = require("fs");
  fs.writeFileSync("results.json", JSON.stringify(scored, null, 2));
}
main().catch(console.error);
