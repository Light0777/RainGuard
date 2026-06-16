import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/auth";

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

  return NextResponse.json({ location: user.locations[0] ?? null });
}

export async function POST(req: Request) {
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

  if (user.locations.length > 0) {
    return NextResponse.json(
      { error: "You already have a saved location. Edit or delete it first." },
      { status: 409 }
    );
  }

  let body: { locationName?: string; latitude?: number; longitude?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { locationName, latitude, longitude } = body;

  if (!locationName || typeof locationName !== "string") {
    return NextResponse.json({ error: "locationName is required" }, { status: 400 });
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

  const location = await prisma.location.create({
    data: {
      userId: user.id,
      locationName: locationName.trim(),
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
    include: { locations: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.locations.length === 0) {
    return NextResponse.json(
      { error: "No location found to update. Add one first." },
      { status: 404 }
    );
  }

  let body: { locationName?: string; latitude?: number; longitude?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { locationName, latitude, longitude } = body;

  if (!locationName || typeof locationName !== "string") {
    return NextResponse.json({ error: "locationName is required" }, { status: 400 });
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

  const location = await prisma.location.update({
    where: { id: user.locations[0]!.id },
    data: {
      locationName: locationName.trim(),
      latitude,
      longitude,
    },
  });

  return NextResponse.json({ location });
}

export async function DELETE() {
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

  if (user.locations.length === 0) {
    return NextResponse.json(
      { error: "No location found to delete" },
      { status: 404 }
    );
  }

  await prisma.location.delete({
    where: { id: user.locations[0]!.id },
  });

  return NextResponse.json({ message: "Location deleted" });
}
