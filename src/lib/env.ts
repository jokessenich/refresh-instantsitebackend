// src/lib/env.ts

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  VERCEL_TOKEN: z.string().min(1),
  VERCEL_TEAM_ID: z.string().optional(),
  S3_BUCKET: z.string().default("simplersite-assets"),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

/** Lazy-loaded env — validates on first access, not at import time.
 *  This prevents build-time crashes when Next.js collects page data. */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (!_env) {
      const result = envSchema.safeParse(process.env);
      if (!result.success) {
        const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
        throw new Error(`Missing or invalid environment variables: ${missing}`);
      }
      _env = result.data;
    }
    return _env[prop as keyof Env];
  },
});
