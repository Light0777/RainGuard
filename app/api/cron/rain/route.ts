import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TomorrowioClient, WeatherApiError } from "@/lib/weather";
import { shouldSendRainAlert, DEFAULT_RAIN_CONFIG } from "@/lib/rain";
import { GmailClient, buildRainAlertEmail } from "@/lib/email";
import type { ForecastInterval } from "@/lib/weather";

function now() {
  return Date.now();
}

function cutoff() {
  return now() + DEFAULT_RAIN_CONFIG.lookAheadMinutes * 60 * 1000;
}

function intervalsInWindow(intervals: ForecastInterval[]) {
  const t = now();
  const c = cutoff();
  return intervals.filter((i) => {
    const s = new Date(i.startTime).getTime();
    return s >= t && s <= c;
  });
}

function maxProbability(intervals: ForecastInterval[]): number {
  const inWindow = intervalsInWindow(intervals);
  if (inWindow.length === 0) return 0;
  return Math.round(Math.max(...inWindow.map((i) => i.precipitationProbability)));
}

function minutesUntilFirstRain(intervals: ForecastInterval[]): number | null {
  const inWindow = intervalsInWindow(intervals);
  const rainy = inWindow.filter((i) => i.precipitationProbability >= DEFAULT_RAIN_CONFIG.probabilityThreshold);
  if (rainy.length === 0) return null;
  const first = Math.min(...rainy.map((i) => new Date(i.startTime).getTime()));
  return Math.max(1, Math.round((first - now()) / 60000));
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weatherApiKey = process.env.TOMORROW_API_KEY;
  if (!weatherApiKey) {
    return NextResponse.json({ error: "Weather API key not configured." }, { status: 503 });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailAppPassword) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
  }

  const users = await prisma.user.findMany({
    where: { locations: { some: {} } },
    include: { locations: true },
  });

  interface Result {
    location: string;
    rainProbability: number;
    minutesUntilRain: number | null;
    threshold: number;
    alerted: boolean;
    reason: string;
  }

  const results: Result[] = [];

  for (const user of users) {
    const location = user.locations[0]!;
    let intervals: ForecastInterval[];
    try {
      const client = new TomorrowioClient({ apiKey: weatherApiKey });
      intervals = await client.getForecast(location.latitude, location.longitude);
    } catch (error) {
      const msg = error instanceof WeatherApiError ? error.message : "Failed to fetch forecast";
      results.push({ location: location.locationName, rainProbability: 0, minutesUntilRain: null, threshold: DEFAULT_RAIN_CONFIG.probabilityThreshold, alerted: false, reason: msg });
      continue;
    }

    const rainProbability = maxProbability(intervals);
    const minutesUntilRain = minutesUntilFirstRain(intervals);
    const threshold = DEFAULT_RAIN_CONFIG.probabilityThreshold;
    const alertResult = shouldSendRainAlert(intervals, user.id);

    if (!alertResult.shouldAlert) {
      results.push({ location: location.locationName, rainProbability, minutesUntilRain, threshold, alerted: false, reason: "No rain expected" });
      continue;
    }

    const rainTime = new Date(alertResult.rainStartTime!);
    const minutesToRain = Math.max(1, Math.round((rainTime.getTime() - now()) / 60000));

    const { subject, html, text } = buildRainAlertEmail({
      locationName: location.locationName,
      minutesUntilRain: minutesToRain,
      rainStartTime: rainTime.toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
      probability: rainProbability,
      confidence: alertResult.confidence,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    });

    const emailClient = new GmailClient({ user: gmailUser, appPassword: gmailAppPassword });
    const emailResult = await emailClient.sendEmail({ to: user.email, subject, html, text });

    if (!emailResult.success) {
      results.push({ location: location.locationName, rainProbability, minutesUntilRain, threshold, alerted: true, reason: `Email failed: ${emailResult.error}` });
      continue;
    }

    await prisma.rainAlert.create({
      data: {
        userId: user.id,
        locationName: location.locationName,
        latitude: location.latitude,
        longitude: location.longitude,
        probability: rainProbability,
        confidence: alertResult.confidence,
        message: subject,
        emailTo: user.email,
        rainStartTime: rainTime,
      },
    });

    results.push({ location: location.locationName, rainProbability, minutesUntilRain: minutesToRain, threshold, alerted: true, reason: "Alert sent" });
  }

  return NextResponse.json({ checked: users.length, results });
}
