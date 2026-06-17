import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/auth";

type LocationType = "HOME" | "OFFICE" | "SCHOOL" | "FARM" | "PARENTS_HOME" | "CUSTOM";

export async function GET() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncUser();

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { locations: { orderBy: { createdAt: "asc" } } },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ locations: user.locations });
}

export async function POST(req: Request) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncUser();

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let body: { name?: string; type?: LocationType; latitude?: number; longitude?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, type, latitude, longitude } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (latitude == null || typeof latitude !== "number" || isNaN(latitude)) {
    return NextResponse.json({ error: "Valid latitude is required" }, { status: 400 });
  }
  if (longitude == null || typeof longitude !== "number" || isNaN(longitude)) {
    return NextResponse.json({ error: "Valid longitude is required" }, { status: 400 });
  }
  if (latitude < -90 || latitude > 90) {
    return NextResponse.json({ error: "Latitude must be between -90 and 90" }, { status: 400 });
  }
  if (longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: "Longitude must be between -180 and 180" }, { status: 400 });
  }

  const validTypes: LocationType[] = ["HOME", "OFFICE", "SCHOOL", "FARM", "PARENTS_HOME", "CUSTOM"];
  const locationType: LocationType = type && validTypes.includes(type) ? type : "CUSTOM";

  const location = await prisma.location.create({
    data: {
      userId: user.id,
      name: name.trim(),
      type: locationType,
      latitude,
      longitude,
    },
  });

  return NextResponse.json({ location }, { status: 201 });
}

export async function PUT(req: Request) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncUser();

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let body: { id?: string; name?: string; type?: LocationType; latitude?: number; longitude?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, name, type, latitude, longitude } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.location.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (name && typeof name === "string") updateData.name = name.trim();
  if (latitude != null && typeof latitude === "number" && !isNaN(latitude)) updateData.latitude = latitude;
  if (longitude != null && typeof longitude === "number" && !isNaN(longitude)) updateData.longitude = longitude;
  if (type) {
    const validTypes: LocationType[] = ["HOME", "OFFICE", "SCHOOL", "FARM", "PARENTS_HOME", "CUSTOM"];
    if (validTypes.includes(type)) updateData.type = type;
  }

  const location = await prisma.location.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ location });
}

export async function DELETE(req: Request) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncUser();

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Location id is required" }, { status: 400 });
  }

  const existing = await prisma.location.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  await prisma.location.delete({ where: { id } });

  return NextResponse.json({ message: "Location deleted" });
}
