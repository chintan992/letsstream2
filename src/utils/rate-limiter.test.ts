import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RateLimiter } from "@/utils/rate-limiter";

describe("RateLimiter", () => {
  beforeEach(() => {
    RateLimiter.instances.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow requests within capacity", async () => {
    const limiter = RateLimiter.getInstance(5, 60000); // 5 requests per minute

    for (let i = 0; i < 5; i++) {
      const allowed = await limiter.canExecute("test");
      expect(allowed).toBe(true);
    }
  });

  it("should reject requests exceeding capacity", async () => {
    const limiter = RateLimiter.getInstance(3, 60000);

    for (let i = 0; i < 3; i++) {
      await limiter.canExecute("test");
    }

    const allowed = await limiter.canExecute("test");
    expect(allowed).toBe(false);
  });

  it("should refill tokens over time", async () => {
    const limiter = RateLimiter.getInstance(2, 1000); // 2 tokens per second

    await limiter.canExecute("test");
    await limiter.canExecute("test");

    expect(await limiter.canExecute("test")).toBe(false);

    vi.advanceTimersByTime(1000); // 1 second = 2 tokens

    expect(await limiter.canExecute("test")).toBe(true);
  });

  it("should track separate buckets per resource key", async () => {
    const limiter = RateLimiter.getInstance(1, 60000);

    await limiter.canExecute("resource-a");
    expect(await limiter.canExecute("resource-a")).toBe(false);
    expect(await limiter.canExecute("resource-b")).toBe(true);
  });

  it("should return available tokens", async () => {
    const limiter = RateLimiter.getInstance(5, 60000);

    expect(limiter.getAvailableTokens("test")).toBe(5);

    await limiter.canExecute("test");
    expect(limiter.getAvailableTokens("test")).toBe(4);
  });

  it("should reset bucket", async () => {
    const limiter = RateLimiter.getInstance(2, 60000);

    await limiter.canExecute("test");
    await limiter.canExecute("test");
    expect(await limiter.canExecute("test")).toBe(false);

    limiter.reset("test");
    expect(await limiter.canExecute("test")).toBe(true);
  });
});