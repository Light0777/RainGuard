export interface RainAlertResult {
  shouldAlert: boolean;
  rainStartTime: string | null;
  confidence: number;
}

export interface RainPredictionConfig {
  probabilityThreshold: number;
  lookAheadMinutes: number;
  alertCooldownMinutes: number;
}

export const DEFAULT_RAIN_CONFIG: RainPredictionConfig = {
  probabilityThreshold: 60,
  lookAheadMinutes: 30,
  alertCooldownMinutes: 60,
};
