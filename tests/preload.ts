/**
 * Bun test preload — wired via bunfig.toml `[test].preload`, runs before
 * every test file in every worker.
 *
 * Pin TZ=UTC so date-window assertions (membership periods, award nomination
 * windows, event countdowns, finance month boundaries) behave identically on
 * every developer machine and in CI. Bun's runner sets NODE_ENV=test itself;
 * the timezone is the host's responsibility, and host-dependent tests are
 * exactly the flaky kind this repo avoids.
 *
 * Isolation rules for the suites that run under this preload are documented
 * in CODING_STANDARD.md §6 — mock.module registrations are per test file, so
 * nothing here tries to reset module state across files.
 */
process.env.TZ = "UTC";
