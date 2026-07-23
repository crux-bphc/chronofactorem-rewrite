// @ts-check
import { z } from "zod";

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  PGPORT: z.coerce.number().prefault(5432),
  DB_HOST: z.string().min(1),
  BACKEND_URL: z.url().min(1),
  FRONTEND_URL: z.url().min(1),
  BACKEND_PORT: z.coerce.number().prefault(3000),
  LOGTO_ENDPOINT: z
    .url()
    .min(1)
    .transform((url) => url.replace(/\/+$/, "")),
  LOGTO_APP_ID: z.string().min(1),
  LOGTO_APP_SECRET: z.string().min(1),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  SQIDS_ALPHABET: z.string().min(62),
  SESSION_MAX_AGE_MS: z.coerce.number().prefault(86400000),
  CHRONO_SECRET: z.string().min(1),
  DB_LONG_RUNNING_QUERY_MS: z.coerce.number().prefault(2000),
  LOG_MODE: z.enum(["development", "production"]).optional(),
  // from pino.Level
  LOG_LEVEL: z
    .enum(["silent", "fatal", "error", "warn", "info", "debug", "trace"])
    .default("debug"),
});
