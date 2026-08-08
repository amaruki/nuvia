import { Redis } from "ioredis";
import postgres from "postgres";

const TEST_ENV = {
  APP_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "local-test-secret-not-for-production-use-000000",
  DATABASE_URL: "postgresql://nuvia:nuvia@127.0.0.1:15433/nuvia",
  NODE_ENV: "test",
  REDIS_URL: "redis://127.0.0.1:16380",
} as const;

const COMPOSE_COMMAND = [
  "docker",
  "compose",
  "--file",
  "compose.test.yml",
  "--project-name",
  "nuvia-test",
] as const;

const commandEnvironment = {
  ...process.env,
  ...(process.env.CI === "true" ? {} : TEST_ENV),
};

async function run(command: readonly string[]): Promise<void> {
  const process = Bun.spawn([...command], {
    cwd: import.meta.dir + "/..",
    env: commandEnvironment,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await process.exited;

  if (exitCode !== 0) {
    throw new Error(`Command failed with exit code ${exitCode}: ${command.join(" ")}`);
  }
}

async function waitForDependencies(): Promise<void> {
  const databaseUrl = commandEnvironment.DATABASE_URL;
  const redisUrl = commandEnvironment.REDIS_URL;

  if (!databaseUrl || !redisUrl) {
    throw new Error("Integration tests require DATABASE_URL and REDIS_URL.");
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const sql = postgres(databaseUrl, { connect_timeout: 3, max: 1 });
    const redis = new Redis(redisUrl, {
      connectTimeout: 3_000,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    redis.on("error", () => undefined);

    try {
      await sql`select 1`;
      await redis.connect();
      await redis.ping();
      await Promise.all([sql.end(), redis.quit()]);
      return;
    } catch (error) {
      lastError = error;
      await sql.end({ timeout: 0 });
      redis.disconnect();

      if (attempt < 10) {
        await Bun.sleep(500);
      }
    }
  }

  throw new Error("PostgreSQL or Redis did not become ready. Check DATABASE_URL and REDIS_URL.", {
    cause: lastError,
  });
}

async function main(): Promise<void> {
  const managesLocalServices = process.env.CI !== "true";

  if (managesLocalServices) {
    // A previously started project — e.g. a test env kept up for manual
    // debugging — may still hold a seeded volume. `up` reuses that
    // container and its data, which breaks tests that assert global
    // state (superadmin counts, unique emails). Drop it first so every
    // run starts from the same empty database CI sees.
    try {
      await run([...COMPOSE_COMMAND, "down", "--volumes", "--remove-orphans"]);
    } catch {
      // Nothing was running; the `up` below is the goal either way.
    }
    await run([...COMPOSE_COMMAND, "up", "--detach", "--wait"]);
  }

  await waitForDependencies();
  await run(["bunx", "drizzle-kit", "push", "--force"]);
  await run(["bun", "test"]);

  // Deliberately leave the local project running: the dev server's .env
  // points at the same database (15433), and tearing it down here kills
  // every in-flight `next dev` session. The next run's `down` above
  // resets the volume again, and CI never manages local services.
}

await main();
