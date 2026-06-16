import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const params = new URLSearchParams({
    q: q.trim(),
    format: "json",
    limit: "5",
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        "User-Agent": "RainGuard/1.0",
        "Accept-Language": "en",
      },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
  }

  const data = await res.json();

  const results = data.map((item: { name: string; lat: string; lon: string; display_name: string }) => ({
    name: item.name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    displayName: item.display_name,
  }));

  return NextResponse.json({ results });
}
