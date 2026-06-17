import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WeatherCache } from "../cache";

describe("WeatherCache", () => {
  let cache: WeatherCache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new WeatherCache(5000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves values", () => {
    cache.set("key1", { foo: "bar" });
    expect(cache.get("key1")).toEqual({ foo: "bar" });
  });

  it("returns null for missing keys", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("returns null for expired entries", () => {
    cache.set("key1", "value", 100);
    vi.advanceTimersByTime(101);
    expect(cache.get("key1")).toBeNull();
  });

  it("returns value before expiry", () => {
    cache.set("key1", "value", 100);
    vi.advanceTimersByTime(50);
    expect(cache.get("key1")).toBe("value");
  });

  it("uses default TTL when not specified", () => {
    cache.set("key1", "value");
    vi.advanceTimersByTime(4999);
    expect(cache.get("key1")).toBe("value");
    vi.advanceTimersByTime(2);
    expect(cache.get("key1")).toBeNull();
  });

  it("reports correct size", () => {
    expect(cache.size).toBe(0);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.size).toBe(2);
  });

  it("clears all entries", () => {
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeNull();
  });

  it("overwrites existing keys", () => {
    cache.set("key", "old");
    cache.set("key", "new");
    expect(cache.get("key")).toBe("new");
  });

  it("has returns true for valid entries", () => {
    cache.set("key", "value");
    expect(cache.has("key")).toBe(true);
  });

  it("has returns false for expired entries", () => {
    cache.set("key", "value", 100);
    vi.advanceTimersByTime(101);
    expect(cache.has("key")).toBe(false);
  });
});
