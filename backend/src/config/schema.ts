// @ts-check
import { z } from "zod";

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PGUSER: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  PGPORT: z.coerce.number().default(5432),
  DB_HOST: z.string().min(1),
  BACKEND_URL: z.string().url().min(1),
  FRONTEND_URL: z.string().url().min(1),
  BACKEND_PORT: z.coerce.number().default(3000),
  GOOGLE_CLIENT_ID: z
    .string()
    .regex(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  FRONTEND_DEV_PORT: z.coerce.number().default(5173),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  NGINX_PORT: z.coerce.number().default(80),
  SQIDS_ALPHABET: z.string().min(62),
  SESSION_MAX_AGE_MS: z.coerce.number().default(86400000),
  VITE_FRONTEND_URL: z.string().url().min(1),
  VITE_CMS_EXTENSION_ID: z.string().min(1),
  CHRONO_SECRET: z.string().min(1),
  DB_LONG_RUNNING_QUERY_MS: z.coerce.number().default(2000),
  LOG_MODE: z.enum(["development", "production"]).optional(),
  SEARCH_SERVICE_URL: z.string().url().min(1),
  // from pino.Level
  LOG_LEVEL: z
    .enum(["silent", "fatal", "error", "warn", "info", "debug", "trace"])
    .default("debug"),
});
