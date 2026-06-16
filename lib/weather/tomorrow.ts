import { getSharedCache, WeatherCache } from "./cache";
import { withRetry } from "./retry";
import {
  WeatherApiError,
  WeatherRateLimitError,
  WeatherAuthError,
  WeatherNetworkError,
} from "./errors";
import type { ForecastInterval, TomorrowioResponse } from "./types";

const BASE_URL = "https://api.tomorrow.io/v4";

export class TomorrowioClient {
  private apiKey: string;
  private cache: WeatherCache;
  private maxRetries: number;
  private baseUrl: string;

  constructor(config: {
    apiKey: string;
    cacheTtlMs?: number;
    maxRetries?: number;
    baseUrl?: string;
  }) {
    if (!config.apiKey) {
      throw new Error("Tomorrow.io API key is required");
    }
    this.apiKey = config.apiKey;
    this.cache = getSharedCache();
    this.maxRetries = config.maxRetries ?? 3;
    this.baseUrl = config.baseUrl ?? BASE_URL;
  }

  async getForecast(
    latitude: number,
    longitude: number
  ): Promise<ForecastInterval[]> {
    const cacheKey = `forecast:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
    const cached = this.cache.get<ForecastInterval[]>(cacheKey);
    if (cached) return cached;

    const data = await withRetry(
      () => this.fetchForecast(latitude, longitude),
      { maxRetries: this.maxRetries }
    );

    this.cache.set(cacheKey, data);
    return data;
  }

  private async fetchForecast(
    latitude: number,
    longitude: number
  ): Promise<ForecastInterval[]> {
    const params = new URLSearchParams({
      location: `${latitude},${longitude}`,
      timesteps: "1h",
      units: "metric",
      apikey: this.apiKey,
    });

    const url = `${this.baseUrl}/weather/forecast?${params}`;

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
    } catch (err) {
      throw new WeatherNetworkError(err);
    }

    if (!res.ok) {
      switch (res.status) {
        case 401:
          throw new WeatherAuthError();
        case 429:
          throw new WeatherRateLimitError();
        default:
          throw new WeatherApiError(
            `Weather API responded with ${res.status}: ${res.statusText}`,
            res.status,
            res.statusText
          );
      }
    }

    let json: TomorrowioResponse;
    try {
      json = await res.json();
    } catch {
      throw new WeatherApiError("Invalid response from weather API", 502, "Bad Gateway");
    }

    const intervals =
      json.timelines?.hourly?.map((interval) => ({
        startTime: interval.time,
        precipitationProbability: interval.values.precipitationProbability,
        precipitationIntensity: interval.values.rainIntensity,
      })) ?? [];

    return intervals;
  }
}
