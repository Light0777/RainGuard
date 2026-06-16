import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TomorrowioClient, WeatherApiError } from "@/lib/weather";
import { shouldSendRainAlert, DEFAULT_RAIN_CONFIG } from "@/lib/rain";
import { GmailClient, buildRainAlertEmail } from "@/lib/email";
import type { ForecastInterval } from "@/lib/weather";

function maxRiskyProbability(intervals: ForecastInterval[]): number {
  const now = Date.now();
  const cutoff = now + DEFAULT_RAIN_CONFIG.lookAheadMinutes * 60 * 1000;
  const risky = intervals.filter((i) => {
    const t = new Date(i.startTime).getTime();
    return t >= now && t <= cutoff && i.precipitationProbability >= DEFAULT_RAIN_CONFIG.probabilityThreshold;
  });
  if (risky.length === 0) return 0;
  return Math.round(Math.max(...risky.map((i) => i.precipitationProbability)));
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

  const results: { userId: string; alerted: boolean; reason?: string }[] = [];

  for (const user of users) {
    const location = user.locations[0]!;
    let intervals: ForecastInterval[];
    try {
      const client = new TomorrowioClient({ apiKey: weatherApiKey });
      intervals = await client.getForecast(location.latitude, location.longitude);
    } catch (error) {
      const msg = error instanceof WeatherApiError ? error.message : "Failed to fetch forecast";
      results.push({ userId: user.id, alerted: false, reason: msg });
      continue;
    }

    const result = shouldSendRainAlert(intervals, user.id);

    if (!result.shouldAlert) {
      results.push({ userId: user.id, alerted: false, reason: "No rain expected" });
      continue;
    }

    const rainTime = new Date(result.rainStartTime!);
    const minutesUntilRain = Math.max(1, Math.round((rainTime.getTime() - Date.now()) / (60 * 1000)));
    const probability = maxRiskyProbability(intervals);

    const { subject, html, text } = buildRainAlertEmail({
      locationName: location.locationName,
      minutesUntilRain,
      rainStartTime: rainTime.toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
      probability,
      confidence: result.confidence,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    });

    const emailClient = new GmailClient({ user: gmailUser, appPassword: gmailAppPassword });
    const emailResult = await emailClient.sendEmail({ to: user.email, subject, html, text });

    if (!emailResult.success) {
      results.push({ userId: user.id, alerted: true, reason: `Email failed: ${emailResult.error}` });
      continue;
    }

    await prisma.rainAlert.create({
      data: {
        userId: user.id,
        locationName: location.locationName,
        latitude: location.latitude,
        longitude: location.longitude,
        probability,
        confidence: result.confidence,
        message: subject,
        emailTo: user.email,
        rainStartTime: rainTime,
      },
    });

    results.push({ userId: user.id, alerted: true });
  }

  return NextResponse.json({ checked: users.length, results });
}
