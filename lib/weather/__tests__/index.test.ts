import { describe, it, expect } from "vitest";
import {
  TomorrowioClient,
  WeatherCache,
  getSharedCache,
  WeatherApiError,
  WeatherRateLimitError,
  WeatherAuthError,
  WeatherNetworkError,
  withRetry,
} from "../index";

describe("public API exports", () => {
  it("exports TomorrowioClient", () => {
    expect(TomorrowioClient).toBeDefined();
    expect(TomorrowioClient).toBeInstanceOf(Function);
  });

  it("exports WeatherCache", () => {
    expect(WeatherCache).toBeDefined();
    const cache = new WeatherCache();
    expect(cache).toBeInstanceOf(WeatherCache);
  });

  it("exports getSharedCache", () => {
    expect(getSharedCache).toBeDefined();
    const cache = getSharedCache();
    expect(cache).toBeInstanceOf(WeatherCache);
  });

  it("shares the same cache instance", () => {
    const a = getSharedCache();
    const b = getSharedCache();
    expect(a).toBe(b);
  });

  it("exports error classes", () => {
    expect(WeatherApiError).toBeDefined();
    expect(WeatherRateLimitError).toBeDefined();
    expect(WeatherAuthError).toBeDefined();
    expect(WeatherNetworkError).toBeDefined();
  });

  it("exports withRetry", () => {
    expect(withRetry).toBeDefined();
    expect(withRetry).toBeInstanceOf(Function);
  });
});
