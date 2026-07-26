/**
 * Validated environment configuration.
 *
 * Previously `validateEnvironmentVariables` (src/lib/errors.ts) existed but
 * was never called, and src/lib/config.ts fell back `DATABASE_URL` to
 * `'file:./dev.db'` when unset — a misconfigured production deploy would
 * boot "successfully" against a nonexistent SQLite file instead of failing
 * loudly. This module is the single source of truth for env access: it
 * parses `process.env` once, at import time, and throws immediately with a
 * readable error if anything required is missing or malformed. Every other
 * module imports `env` from here — nothing outside this file, `drizzle.config.ts`,
 * `scripts/*.ts`, and the edge `middleware.ts` (which can't reach Node's
 * `process.env` shape the same way) reads `process.env` directly. See
 * docs/adr/0002-rfc9457-error-contract.md's neighbour,
 * docs/architecture/overview.md, for the enforcement rule.
 */

import { z } from "zod";

const isProductionRuntime = process.env.NODE_ENV === "production";

const boolFromString = (defaultValue: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? defaultValue : v === "true"));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Application
  APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Database — no fallback. An unset DATABASE_URL is a boot failure, not a
  // silent switch to SQLite.
  DATABASE_URL: z
    .string()
    .url()
    .refine((url) => url.startsWith("postgresql://") || url.startsWith("postgres://"), {
      message: "DATABASE_URL must be a postgresql:// connection string",
    }),

  // Auth
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters")
    .refine((v) => !isProductionRuntime || v !== "your-secret-key-here", {
      message: "BETTER_AUTH_SECRET is still set to the placeholder value in production",
    }),
  /** @deprecated Unused — better-auth manages sessions itself. Kept optional until removed; see TODO.md. */
  JWT_SECRET: z.string().optional(),

  // OAuth (all optional — providers are enabled only when their pair is present)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),

  // Email
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().int().positive().default(587),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@example.com"),
  RESEND_API_KEY: z.string().optional(),

  // Rate limiting / Redis (see docs/adr/0003-single-rate-limiter.md — Redis is
  // required in production because the in-memory limiter it replaces cannot
  // survive more than one server process)
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  ENABLE_REDIS_CACHE: boolFromString(false),
  REDIS_URL: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  CORS_CREDENTIALS: boolFromString(false),

  // Uploads
  UPLOAD_MAX_SIZE: z.coerce.number().int().positive().default(5_242_880),
  UPLOAD_ALLOWED_TYPES: z
    .string()
    .default("image/jpeg,image/png,image/gif,image/webp")
    .transform((v) => v.split(",")),

  // Logging
  LOGGING_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOGGING_REQUESTS: boolFromString(false),
  LOGGING_ERRORS: boolFromString(true),

  // Feature flags
  FEATURE_EMAIL_VERIFICATION: boolFromString(true),
  FEATURE_TWO_FACTOR_AUTH: boolFromString(false),
  FEATURE_SOCIAL_LOGIN: boolFromString(true),
  FEATURE_ACCOUNT_DELETION: boolFromString(true),
  FEATURE_PASSWORD_STRENGTH_METER: boolFromString(true),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    // Thrown at import time, on purpose: a misconfigured deploy must fail to
    // boot, not fail on the first request that happens to touch the missing
    // variable.
    throw new Error(`Invalid environment configuration:\n${issues}\n\nSee .env.example.`);
  }

  if (parsed.data.ENABLE_REDIS_CACHE && !parsed.data.REDIS_URL) {
    throw new Error("ENABLE_REDIS_CACHE=true requires REDIS_URL to be set.");
  }

  if (parsed.data.NODE_ENV === "production" && !parsed.data.REDIS_URL) {
    throw new Error(
      "REDIS_URL is required in production — rate limiting and session caching cannot " +
        "run on the in-memory fallback across more than one server process. " +
        "See docs/adr/0003-single-rate-limiter.md.",
    );
  }

  return parsed.data;
}

export const env = loadEnv();
