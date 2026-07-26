let counter = 0;

/**
 * better-auth's rate limiter buckets by client IP; test requests built from
 * plain Request/NextRequest objects carry no real IP, so without this every
 * test in a run would share one fallback bucket and start 429ing each other
 * after a handful of sign-ups.
 */
export function testIp(): string {
  counter += 1;
  return `10.0.${Math.floor(counter / 255)}.${counter % 255}`;
}
