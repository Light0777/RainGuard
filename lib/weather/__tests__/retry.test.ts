import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withRetry } from "../retry";
import { WeatherRateLimitError } from "../errors";

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns result on successful call", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const promise = withRetry(fn);
    expect(await promise).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on rate limit error and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new WeatherRateLimitError())
      .mockResolvedValueOnce("success");

    const promise = withRetry(fn);
    await vi.advanceTimersToNextTimerAsync();
    const result = await promise;
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on network error (TypeError) and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce("success");

    const promise = withRetry(fn);
    await vi.advanceTimersToNextTimerAsync();
    const result = await promise;
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after max retries exhausted", async () => {
    const error = new WeatherRateLimitError();
    const fn = vi.fn().mockRejectedValue(error);

    const promise = withRetry(fn, { maxRetries: 2 });
    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(100000);
    await expect(promise).rejects.toThrow(WeatherRateLimitError);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("uses custom retry options", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new TypeError()).mockResolvedValueOnce("ok");

    const promise = withRetry(fn, { maxRetries: 1, baseDelayMs: 100 });
    await vi.advanceTimersByTimeAsync(100000);
    const result = await promise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable errors", async () => {
    const error = new Error("Fatal error");
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn)).rejects.toThrow("Fatal error");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
