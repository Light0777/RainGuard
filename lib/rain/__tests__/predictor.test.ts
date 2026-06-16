import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { shouldSendRainAlert } from "../predictor";
import { getSharedCache } from "@/lib/weather";
import type { ForecastInterval } from "@/lib/weather";

function makeInterval(minutesFromNow: number, probability: number): ForecastInterval {
  const time = new Date(Date.now() + minutesFromNow * 60 * 1000);
  return {
    startTime: time.toISOString(),
    precipitationProbability: probability,
    precipitationIntensity: 0.5,
  };
}

describe("shouldSendRainAlert", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T12:00:00Z"));
    getSharedCache().clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false for empty intervals", () => {
    const result = shouldSendRainAlert([], "loc-1");
    expect(result.shouldAlert).toBe(false);
    expect(result.rainStartTime).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it("returns false when no intervals exceed threshold", () => {
    const intervals = [
      makeInterval(5, 30),
      makeInterval(15, 45),
      makeInterval(25, 50),
    ];
    const result = shouldSendRainAlert(intervals, "loc-1");
    expect(result.shouldAlert).toBe(false);
  });

  it("returns true when interval exceeds threshold", () => {
    const intervals = [makeInterval(10, 80)];
    const result = shouldSendRainAlert(intervals, "loc-1");
    expect(result.shouldAlert).toBe(true);
    expect(result.rainStartTime).toBe(intervals[0].startTime);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("uses earliest risky interval as rainStartTime", () => {
    const intervals = [
      makeInterval(5, 70),
      makeInterval(15, 90),
      makeInterval(25, 80),
    ];
    const result = shouldSendRainAlert(intervals, "loc-1");
    expect(result.shouldAlert).toBe(true);
    expect(result.rainStartTime).toBe(intervals[0].startTime);
  });

  it("filters out intervals before now", () => {
    const intervals = [
      makeInterval(-10, 90),
      makeInterval(10, 90),
    ];
    const result = shouldSendRainAlert(intervals, "loc-1");
    expect(result.shouldAlert).toBe(true);
    expect(result.rainStartTime).toBe(intervals[1].startTime);
  });

  it("filters out intervals beyond lookAhead window", () => {
    const intervals = [
      makeInterval(10, 90),
      makeInterval(45, 90),
    ];
    const result = shouldSendRainAlert(intervals, "loc-1");
    expect(result.shouldAlert).toBe(true);
    expect(result.rainStartTime).toBe(intervals[0].startTime);
  });

  it("returns false when all risky intervals are outside window", () => {
    const intervals = [makeInterval(45, 90)];
    const result = shouldSendRainAlert(intervals, "loc-1");
    expect(result.shouldAlert).toBe(false);
  });

  it("prevents duplicate alerts within cooldown period", () => {
    const intervals = [makeInterval(10, 80)];
    const first = shouldSendRainAlert(intervals, "loc-dup");
    expect(first.shouldAlert).toBe(true);

    const second = shouldSendRainAlert(intervals, "loc-dup");
    expect(second.shouldAlert).toBe(false);
  });

  it("allows alert after cooldown expires", () => {
    const intervals = [makeInterval(10, 80)];
    const first = shouldSendRainAlert(intervals, "loc-cooldown");
    expect(first.shouldAlert).toBe(true);

    vi.setSystemTime(new Date("2026-06-16T13:01:00Z"));

    const intervals2 = [makeInterval(10, 80)];
    const second = shouldSendRainAlert(intervals2, "loc-cooldown");
    expect(second.shouldAlert).toBe(true);
  });

  it("does not deduplicate across different location keys", () => {
    const intervals = [makeInterval(10, 80)];
    const a = shouldSendRainAlert(intervals, "loc-a");
    const b = shouldSendRainAlert(intervals, "loc-b");
    expect(a.shouldAlert).toBe(true);
    expect(b.shouldAlert).toBe(true);
  });

  it("handles custom probability threshold", () => {
    const intervals = [makeInterval(10, 65)];
    const defaultResult = shouldSendRainAlert(intervals, "loc-custom1");
    expect(defaultResult.shouldAlert).toBe(true);

    getSharedCache().clear();

    const customResult = shouldSendRainAlert(intervals, "loc-custom2", {
      probabilityThreshold: 70,
    });
    expect(customResult.shouldAlert).toBe(false);
  });

  it("handles custom lookAheadMinutes", () => {
    const intervals = [makeInterval(25, 80)];
    const defaultResult = shouldSendRainAlert(intervals, "loc-look1");
    expect(defaultResult.shouldAlert).toBe(true);

    getSharedCache().clear();

    const customResult = shouldSendRainAlert(intervals, "loc-look2", {
      lookAheadMinutes: 20,
    });
    expect(customResult.shouldAlert).toBe(false);
  });

  it("handles custom alertCooldownMinutes", () => {
    const intervals = [makeInterval(10, 80)];
    const first = shouldSendRainAlert(intervals, "loc-custom-cooldown", {
      alertCooldownMinutes: 5,
    });
    expect(first.shouldAlert).toBe(true);

    vi.advanceTimersByTime(6 * 60 * 1000);

    const second = shouldSendRainAlert(intervals, "loc-custom-cooldown", {
      alertCooldownMinutes: 5,
    });
    expect(second.shouldAlert).toBe(true);
  });

  it("returns correct confidence for high probability near-term rain", () => {
    const intervals = [makeInterval(5, 95)];
    const result = shouldSendRainAlert(intervals, "loc-conf-high");
    expect(result.shouldAlert).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(80);
  });

  it("returns lower confidence for threshold-probability far-term rain", () => {
    const intervals = [makeInterval(25, 60)];
    const result = shouldSendRainAlert(intervals, "loc-conf-low");
    expect(result.shouldAlert).toBe(true);
    expect(result.confidence).toBeLessThanOrEqual(60);
  });

  it("returns confidence 0 when no alert", () => {
    const intervals = [makeInterval(10, 10)];
    const result = shouldSendRainAlert(intervals, "loc-no-conf");
    expect(result.shouldAlert).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it("works with empty string locationKey", () => {
    const intervals = [makeInterval(10, 80)];
    const result = shouldSendRainAlert(intervals, "");
    expect(result.shouldAlert).toBe(true);
    expect(result.rainStartTime).toBe(intervals[0].startTime);
  });

  it("handles intervals at exactly the threshold", () => {
    const intervals = [makeInterval(10, 60)];
    const result = shouldSendRainAlert(intervals, "loc-threshold");
    expect(result.shouldAlert).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("handles intervals with zero probability", () => {
    const intervals = [
      makeInterval(5, 0),
      makeInterval(15, 0),
      makeInterval(25, 0),
    ];
    const result = shouldSendRainAlert(intervals, "loc-zero");
    expect(result.shouldAlert).toBe(false);
  });
});
