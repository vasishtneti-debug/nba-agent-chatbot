import { tavilyExtract, tavilySearch } from "@tavily/ai-sdk";

import { getTavilyApiKey } from "@/lib/env/server";

import { NBA_CONTRACTS_DOMAINS, NBA_NEWS_DOMAINS } from "./search-domains";

function createTavilyTools() {
  const apiKey = getTavilyApiKey();

  const nbaNewsSearch = tavilySearch({
    apiKey,
    searchDepth: "advanced",
    topic: "news",
    maxResults: 6,
    includeAnswer: true,
    includeDomains: [...NBA_NEWS_DOMAINS],
  });

  const nbaContractsSearch = tavilySearch({
    apiKey,
    searchDepth: "advanced",
    topic: "finance",
    maxResults: 5,
    includeAnswer: "advanced",
    includeDomains: [...NBA_CONTRACTS_DOMAINS],
  });

  const nbaGeneralSearch = tavilySearch({
    apiKey,
    searchDepth: "advanced",
    topic: "general",
    maxResults: 6,
    includeAnswer: true,
  });

  const nbaExtract = tavilyExtract({
    apiKey,
    extractDepth: "advanced",
    format: "markdown",
  });

  return { nbaNewsSearch, nbaContractsSearch, nbaGeneralSearch, nbaExtract };
}

let cachedTools: ReturnType<typeof createTavilyTools> | null = null;

/** Lazily created so `next build` does not require TAVILY_API_KEY. */
export function getNbaSearchTools() {
  if (!cachedTools) {
    cachedTools = createTavilyTools();
  }
  return cachedTools;
}

/** @deprecated Use getNbaSearchTools().nbaNewsSearch */
export function getNbaWebSearch() {
  return getNbaSearchTools().nbaNewsSearch;
}
