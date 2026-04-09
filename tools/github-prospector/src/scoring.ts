import { SearchResult } from "./search";
export interface ScoredResult extends SearchResult { score: number; }
export function scoreResults(results: SearchResult[]): ScoredResult[] {
  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.url)) return false; seen.add(r.url); return true;
  }).map(r => {
    let score = 10;
    const body = r.title.toLowerCase();
    if (body.includes("bounty")) score += 30;
    if (body.includes("usdc") || body.includes("$")) score += 20;
    return { ...r, score };
  }).sort((a, b) => b.score - a.score);
}
