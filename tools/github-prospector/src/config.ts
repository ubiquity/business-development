export const CONFIG = {
  githubToken: process.env.GITHUB_TOKEN || "",
  queries: ["bounty label:help-wanted", "bug bounty reward", "crypto bounty USDC", "DeFi bounty developer"],
  maxResults: 30,
};
