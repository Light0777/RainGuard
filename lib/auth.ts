import { prisma } from "./prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function syncUser(): Promise<void> {
  const clerkUser = await currentUser();
  if (!clerkUser) return;

  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existing) return;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const name =
    clerkUser.firstName && clerkUser.lastName
      ? `${clerkUser.firstName} ${clerkUser.lastName}`
      : clerkUser.firstName ?? clerkUser.username ?? email ?? "Unknown";

  if (!email) return;

  await prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      name,
      email,
    },
  });
}
