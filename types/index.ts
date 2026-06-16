export interface StationWithReadings {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  readings: ReadingSummary[];
}

export interface ReadingSummary {
  id: string;
  amountMm: number;
  timestamp: Date;
  recordedAt: Date;
}

export interface AlertData {
  id: string;
  stationId: string;
  stationName: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  threshold: number;
  triggeredAt: Date;
  resolvedAt: Date | null;
}
