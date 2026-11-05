import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().min(1),
  POLL_INTERVAL_MINUTES: z.coerce.number().int().min(1).max(60).default(2),
  POLL_MAX_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(3),
  MAX_SUBMISSION_LOOKBACK: z.coerce.number().int().min(1).max(100).default(20)
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
}

export const env = parsed.data;
