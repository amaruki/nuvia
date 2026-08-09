/**
 * Daily demo reset (UI-39, stage 3) — wipes and reseeds the demo instance,
 * rotating the disposable login credential.
 *
 *   0 4 * * * cd /app && DEMO_MODE=true bun run scripts/reset-demo.ts
 *
 * The new password is printed to stdout exactly once (capture it into your
 * credential store); it is never logged or written to disk.
 */
import { resetDemo } from "./seed-demo";

resetDemo()
  .catch((error) => {
    console.error("Demo reset failed:", error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
