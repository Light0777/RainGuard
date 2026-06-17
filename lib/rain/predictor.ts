import type { ForecastInterval } from "@/lib/weather";
import { getSharedCache } from "@/lib/weather";
import type { RainAlertResult, RainPredictionConfig } from "./types";
import { DEFAULT_RAIN_CONFIG } from "./types";

const CACHE_PREFIX = "rain_alert_location:";

export function shouldSendRainAlert(
  intervals: ForecastInterval[],
  locationKey: string,
  config: Partial<RainPredictionConfig> = {}
): RainAlertResult {
  const fullConfig: RainPredictionConfig = {
    ...DEFAULT_RAIN_CONFIG,
    ...config,
  };

  if (intervals.length === 0) {
    return emptyResult();
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() + fullConfig.lookAheadMinutes * 60 * 1000);

  const upcoming = intervals.filter((interval) => {
    const intervalTime = new Date(interval.startTime);
    return intervalTime >= now && intervalTime <= cutoff;
  });

  if (upcoming.length === 0) {
    return emptyResult();
  }

  const risky = upcoming.filter(
    (interval) =>
      interval.precipitationProbability >= fullConfig.probabilityThreshold
  );

  if (risky.length === 0) {
    return emptyResult();
  }

  const rainStartTime = risky[0]!.startTime;
  const maxProb = Math.max(...risky.map((r) => r.precipitationProbability));
  const firstRiskyTime = new Date(rainStartTime).getTime();
  const minutesUntilRain = (firstRiskyTime - now.getTime()) / (60 * 1000);
  const timeRatio = Math.max(
    0,
    (fullConfig.lookAheadMinutes - minutesUntilRain) / fullConfig.lookAheadMinutes
  );
  const confidence = Math.round(
    Math.min(100, maxProb * (0.6 + 0.4 * timeRatio))
  );

  const cache = getSharedCache();
  const cacheKey = `${CACHE_PREFIX}${locationKey}`;
  if (cache.get<boolean>(cacheKey)) {
    return emptyResult();
  }

  cache.set(cacheKey, true, fullConfig.alertCooldownMinutes * 60 * 1000);

  return {
    shouldAlert: true,
    rainStartTime,
    confidence,
  };
}

function emptyResult(): RainAlertResult {
  return { shouldAlert: false, rainStartTime: null, confidence: 0 };
}
