import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(req);
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const { type, data } = event;

  if (type === "user.created") {
    const { id, email_addresses, first_name, last_name, username } = data;
    const email = email_addresses?.[0]?.email_address;
    const name =
      [first_name, last_name].filter(Boolean).join(" ") ||
      username ||
      email ||
      "Unknown";

    if (!email || !id) {
      return new Response("Missing required fields", { status: 400 });
    }

    await prisma.user.upsert({
      where: { clerkId: id },
      update: { name, email },
      create: { clerkId: id, name, email },
    });
  }

  if (type === "user.updated") {
    const { id, email_addresses, first_name, last_name, username } = data;
    const email = email_addresses?.[0]?.email_address;
    const name =
      [first_name, last_name].filter(Boolean).join(" ") ||
      username ||
      email ||
      "Unknown";

    if (id && email) {
      await prisma.user.upsert({
        where: { clerkId: id },
        update: { name, email },
        create: { clerkId: id, name, email },
      });
    }
  }

  if (type === "user.deleted") {
    const { id } = data;
    if (id) {
      await prisma.user.deleteMany({
        where: { clerkId: id },
      });
    }
  }

  return new Response("OK", { status: 200 });
}
