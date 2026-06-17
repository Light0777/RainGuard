import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon query parameters are required" }, { status: 400 });
  }

  const params = new URLSearchParams({ lat, lon, format: "json" });

  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: {
      "User-Agent": "RainGuard/1.0",
      "Accept-Language": "en",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Reverse geocoding service unavailable" }, { status: 502 });
  }

  const data = await res.json();

  if (!data || data.error) {
    return NextResponse.json({ error: "No results found" }, { status: 404 });
  }

  return NextResponse.json({
    name: data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.county ?? "Unknown",
    latitude: parseFloat(data.lat),
    longitude: parseFloat(data.lon),
    displayName: data.display_name,
  });
}
