import { describe, expect, test, spyOn } from "bun:test";
import { logger } from "@/lib/logger";

function captured(fn: () => void): string {
  const spy = spyOn(console, "log").mockImplementation(() => {});
  const errSpy = spyOn(console, "error").mockImplementation(() => {});
  try {
    fn();
    return (spy.mock.calls[0]?.[0] ?? errSpy.mock.calls[0]?.[0]) as string;
  } finally {
    spy.mockRestore();
    errSpy.mockRestore();
  }
}

describe("logger", () => {
  test("emits a JSON line with timestamp/level/message/context", () => {
    const line = captured(() => logger.info("hello", { userId: "abc" }));
    const parsed = JSON.parse(line);

    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("hello");
    expect(parsed.context.userId).toBe("abc");
    expect(typeof parsed.timestamp).toBe("string");
    expect(new Date(parsed.timestamp).toString()).not.toBe("Invalid Date");
  });

  test("redacts PII fields by key name, regardless of nesting depth", () => {
    const line = captured(() =>
      logger.warn("failed login", {
        email: "person@example.com",
        nested: { ipAddress: "1.2.3.4", passwordHash: "abc123", safe: "keep-me" },
        accessToken: "secret-token-value",
      }),
    );
    const parsed = JSON.parse(line);

    expect(parsed.context.email).toBe("[REDACTED]");
    expect(parsed.context.nested.ipAddress).toBe("[REDACTED]");
    expect(parsed.context.nested.passwordHash).toBe("[REDACTED]");
    expect(parsed.context.nested.safe).toBe("keep-me");
    expect(parsed.context.accessToken).toBe("[REDACTED]");
  });

  test("folds an Error passed as the second argument into context.error", () => {
    const err = new Error("boom");
    const line = captured(() => logger.error("something failed", err));
    const parsed = JSON.parse(line);

    expect(parsed.context.error.message).toBe("boom");
    expect(parsed.context.error.name).toBe("Error");
  });

  test("suppresses levels below LOGGING_LEVEL", () => {
    const originalLevel = process.env.LOGGING_LEVEL;
    process.env.LOGGING_LEVEL = "warn";
    try {
      const spy = spyOn(console, "log").mockImplementation(() => {});
      logger.info("should be suppressed");
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    } finally {
      process.env.LOGGING_LEVEL = originalLevel;
    }
  });

  test("includes traceId at the top level when provided", () => {
    const line = captured(() => logger.info("traced", undefined, { traceId: "trace-123" }));
    const parsed = JSON.parse(line);

    expect(parsed.traceId).toBe("trace-123");
  });
});
