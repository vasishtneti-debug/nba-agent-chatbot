import { z } from "zod";

import { publicEnv } from "@/lib/env/public";

const serverEnvSchema = z.object({
  TAVILY_API_KEY: z.string().min(1),
  VERCEL_OIDC_TOKEN: z.string().optional(),
  AI_GATEWAY_API_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema> & typeof publicEnv;

let cachedServerEnv: Omit<ServerEnv, keyof typeof publicEnv> | null = null;

function parseServerEnv() {
  const parsed = serverEnvSchema.safeParse({
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`,
    );
  }

  return parsed.data;
}

/** Validated at request time — not during `next build`. */
export function getServerEnv(): ServerEnv {
  if (!cachedServerEnv) {
    cachedServerEnv = parseServerEnv();
  }

  return { ...publicEnv, ...cachedServerEnv };
}

export function getTavilyApiKey() {
  return getServerEnv().TAVILY_API_KEY;
}
