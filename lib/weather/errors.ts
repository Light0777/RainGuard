export class WeatherApiError extends Error {
  public statusCode: number;
  public statusText: string;

  constructor(message: string, statusCode: number, statusText: string) {
    super(message);
    this.name = "WeatherApiError";
    this.statusCode = statusCode;
    this.statusText = statusText;
  }
}

export class WeatherRateLimitError extends WeatherApiError {
  constructor() {
    super("Rate limit exceeded. Please try again later.", 429, "Too Many Requests");
    this.name = "WeatherRateLimitError";
  }
}

export class WeatherAuthError extends WeatherApiError {
  constructor() {
    super("Invalid or missing API key.", 401, "Unauthorized");
    this.name = "WeatherAuthError";
  }
}

export class WeatherNetworkError extends Error {
  constructor(cause: unknown) {
    super("Network error while contacting weather service.");
    this.name = "WeatherNetworkError";
    this.cause = cause;
  }
}
