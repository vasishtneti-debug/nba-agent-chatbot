import { z } from "zod";

import { publicEnv } from "@/lib/env/public";

const serverEnvSchema = z.object({
  TAVILY_API_KEY: z.string().min(1),
  VERCEL_OIDC_TOKEN: z.string().optional(),
  AI_GATEWAY_API_KEY: z.string().optional(),
});

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

export const serverEnv = parseServerEnv();
export const env = { ...publicEnv, ...serverEnv };
