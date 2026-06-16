import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/auth";
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

export async function POST() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncUser();

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { locations: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const location = user.locations[0];
  if (!location) {
    return NextResponse.json(
      { error: "No saved location found." },
      { status: 404 }
    );
  }

  const weatherApiKey = process.env.TOMORROW_API_KEY;
  if (!weatherApiKey) {
    return NextResponse.json(
      { error: "Weather API key not configured." },
      { status: 503 }
    );
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailAppPassword) {
    return NextResponse.json(
      { error: "Email service not configured." },
      { status: 503 }
    );
  }

  let intervals: ForecastInterval[];
  try {
    const client = new TomorrowioClient({ apiKey: weatherApiKey });
    intervals = await client.getForecast(location.latitude, location.longitude);
  } catch (error) {
    if (error instanceof WeatherApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode ?? 502 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch forecast." },
      { status: 502 }
    );
  }

  const result = shouldSendRainAlert(intervals, user.id);

  if (!result.shouldAlert) {
    return NextResponse.json({
      alerted: false,
      reason: "No rain expected in the next 30 minutes above 60% probability.",
    });
  }

  const rainTime = new Date(result.rainStartTime!);
  const minutesUntilRain = Math.max(
    1,
    Math.round((rainTime.getTime() - Date.now()) / (60 * 1000))
  );

  const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress ?? user.email;
  const probability = maxRiskyProbability(intervals);

  const { subject, html, text } = buildRainAlertEmail({
    locationName: location.locationName,
    minutesUntilRain,
    rainStartTime: rainTime.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    probability,
    confidence: result.confidence,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  });

  const emailClient = new GmailClient({
    user: gmailUser,
    appPassword: gmailAppPassword,
  });

  const emailResult = await emailClient.sendEmail({
    to: userEmail,
    subject,
    html,
    text,
  });

  if (!emailResult.success) {
    return NextResponse.json(
      { error: emailResult.error ?? "Failed to send email." },
      { status: 502 }
    );
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
      emailTo: userEmail,
      rainStartTime: rainTime,
    },
  });

  return NextResponse.json({
    alerted: true,
    rainStartTime: result.rainStartTime,
    confidence: result.confidence,
    emailId: emailResult.messageId,
  });
}
