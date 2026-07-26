import { defineConfig } from "drizzle-kit";

// drizzle-kit runs standalone (outside the Next.js process), so it reads
// process.env directly rather than importing the validated `env` from
// src/lib/env.ts — see the exception list documented there.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set to run drizzle-kit (see .env.example).");
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
