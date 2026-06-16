import { WeatherRateLimitError } from "./errors";

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

function isRetryable(error: unknown): boolean {
  if (error instanceof WeatherRateLimitError) return true;
  if (error instanceof TypeError) return true;
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && isRetryable(error)) {
        const delay = Math.min(
          baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
          maxDelayMs
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else if (attempt < maxRetries) {
        break;
      }
    }
  }

  throw lastError;
}
