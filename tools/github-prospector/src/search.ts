export interface SearchResult {
  url: string; title: string; type: "issue" | "repo";
  stars: number; updatedAt: string; labels: string[];
}
export async function searchGitHub(query: string, max: number = 30): Promise<SearchResult[]> {
  const headers = { Authorization: `token ${process.env.GITHUB_TOKEN}` };
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}+is:open&per_page=${max}`;
  const res = await fetch(url, { headers });
  const data = await res.json();
  return (data.items || []).map((i: any) => ({
    url: i.html_url, title: i.title, type: "issue" as const,
    stars: 0, updatedAt: i.updated_at, labels: i.labels?.map((l: any) => l.name) || []
  }));
}
