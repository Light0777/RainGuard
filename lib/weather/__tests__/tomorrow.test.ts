import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TomorrowioClient } from "../tomorrow";
import { getSharedCache, WeatherAuthError } from "../index";

const mockForecastResponse = {
  timelines: {
    hourly: [
      {
        time: "2026-06-16T00:00:00Z",
        values: {
          precipitationProbability: 30,
          rainIntensity: 0.5,
        },
      },
      {
        time: "2026-06-16T01:00:00Z",
        values: {
          precipitationProbability: 80,
          rainIntensity: 2.1,
        },
      },
    ],
  },
};

describe("TomorrowioClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getSharedCache().clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("throws if no API key provided", () => {
    expect(() => new TomorrowioClient({ apiKey: "" })).toThrow(
      "Tomorrow.io API key is required"
    );
  });

  it("fetches and returns forecast intervals", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(mockForecastResponse), { status: 200 })
      );

    const client = new TomorrowioClient({ apiKey: "test-key" });
    const result = await client.getForecast(40.7128, -74.006);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      startTime: "2026-06-16T00:00:00Z",
      precipitationProbability: 30,
      precipitationIntensity: 0.5,
    });
    expect(result[1]).toEqual({
      startTime: "2026-06-16T01:00:00Z",
      precipitationProbability: 80,
      precipitationIntensity: 2.1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callUrl = fetchMock.mock.calls[0]![0] as string;
    expect(callUrl).toContain("40.7128");
    expect(callUrl).toContain("-74.006");
    expect(callUrl).toContain("apikey=test-key");
  });

  it("caches results and avoids duplicate requests", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(mockForecastResponse), { status: 200 })
      );

    const client = new TomorrowioClient({ apiKey: "test-key" });
    await client.getForecast(51.5074, -0.1278);
    await client.getForecast(51.5074, -0.1278);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws WeatherAuthError on 401 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Unauthorized", { status: 401 })
    );

    const client = new TomorrowioClient({ apiKey: "bad-key" });
    await expect(client.getForecast(35.6762, 139.6503)).rejects.toThrow(
      WeatherAuthError
    );
  });

  it("returns empty array when no hourly timelines exist", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { timelines: [{ timestep: "1d", intervals: [] }] },
        }),
        { status: 200 }
      )
    );

    const client = new TomorrowioClient({ apiKey: "test-key" });
    const result = await client.getForecast(48.8566, 2.3522);
    expect(result).toEqual([]);
  });
});

describe("TomorrowioClient caching", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getSharedCache().clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses shared cache across instances", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(mockForecastResponse), { status: 200 })
      );

    const client1 = new TomorrowioClient({ apiKey: "test-key" });
    const client2 = new TomorrowioClient({ apiKey: "test-key" });

    await client1.getForecast(34.0522, -118.2437);
    await client2.getForecast(34.0522, -118.2437);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
