import { describe, it, expect } from "vitest";
import {
  WeatherApiError,
  WeatherRateLimitError,
  WeatherAuthError,
  WeatherNetworkError,
} from "../errors";

describe("WeatherApiError", () => {
  it("creates error with correct message and status", () => {
    const error = new WeatherApiError("Not Found", 404, "Not Found");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("WeatherApiError");
    expect(error.message).toBe("Not Found");
    expect(error.statusCode).toBe(404);
    expect(error.statusText).toBe("Not Found");
  });
});

describe("WeatherRateLimitError", () => {
  it("creates rate limit error with 429 status", () => {
    const error = new WeatherRateLimitError();
    expect(error).toBeInstanceOf(WeatherApiError);
    expect(error.name).toBe("WeatherRateLimitError");
    expect(error.statusCode).toBe(429);
    expect(error.message).toContain("Rate limit exceeded");
  });
});

describe("WeatherAuthError", () => {
  it("creates auth error with 401 status", () => {
    const error = new WeatherAuthError();
    expect(error).toBeInstanceOf(WeatherApiError);
    expect(error.name).toBe("WeatherAuthError");
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain("API key");
  });
});

describe("WeatherNetworkError", () => {
  it("creates network error with cause", () => {
    const cause = new TypeError("fetch failed");
    const error = new WeatherNetworkError(cause);
    expect(error.name).toBe("WeatherNetworkError");
    expect(error.message).toContain("Network error");
    expect(error.cause).toBe(cause);
  });
});
