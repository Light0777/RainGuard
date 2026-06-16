export interface ForecastInterval {
  startTime: string;
  precipitationProbability: number;
  precipitationIntensity: number;
}

export interface ForecastResponse {
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  intervals: ForecastInterval[];
}

export interface WeatherServiceConfig {
  apiKey: string;
  cacheTtlMs?: number;
  maxRetries?: number;
}

export interface TomorrowioResponse {
  timelines: {
    hourly: Array<{
      time: string;
      values: {
        precipitationProbability: number;
        rainIntensity: number;
      };
    }>;
  };
}
