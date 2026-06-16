import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/auth";
import { TomorrowioClient, WeatherApiError } from "@/lib/weather";

export async function GET() {
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
      { error: "No saved location found. Add one from the Locations page." },
      { status: 404 }
    );
  }

  const apiKey = process.env.TOMORROW_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Weather API key not configured." },
      { status: 503 }
    );
  }

  try {
    const client = new TomorrowioClient({ apiKey });
    const intervals = await client.getForecast(
      location.latitude,
      location.longitude
    );

    return NextResponse.json({
      location: {
        lat: location.latitude,
        lon: location.longitude,
        name: location.locationName,
      },
      intervals,
    });
  } catch (error) {
    if (error instanceof WeatherApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode ?? 502 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch weather forecast." },
      { status: 502 }
    );
  }
}
