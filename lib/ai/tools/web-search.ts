import { tavilySearch } from "@tavily/ai-sdk";

import { env } from "@/lib/env/server";

export const nbaWebSearch = tavilySearch({
  apiKey: env.TAVILY_API_KEY,
  searchDepth: "advanced",
  topic: "news",
  maxResults: 5,
  includeAnswer: true,
  includeDomains: [
    "espn.com",
    "nba.com",
    "theathletic.com",
    "basketball-reference.com",
    "bleacherreport.com",
  ],
});
