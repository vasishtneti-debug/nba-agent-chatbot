import { tavilySearch } from "@tavily/ai-sdk";

import { getTavilyApiKey } from "@/lib/env/server";

const searchOptions = {
  searchDepth: "advanced" as const,
  topic: "news" as const,
  maxResults: 5,
  includeAnswer: true,
  includeDomains: [
    "espn.com",
    "nba.com",
    "theathletic.com",
    "basketball-reference.com",
    "bleacherreport.com",
  ],
};

let cachedTool: ReturnType<typeof tavilySearch> | null = null;

/** Lazily created so `next build` does not require TAVILY_API_KEY. */
export function getNbaWebSearch() {
  if (!cachedTool) {
    cachedTool = tavilySearch({
      apiKey: getTavilyApiKey(),
      ...searchOptions,
    });
  }

  return cachedTool;
}
