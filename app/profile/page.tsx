import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/auth";
import { UserProfile } from "@clerk/nextjs";

export default async function ProfilePage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  await syncUser();

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences.
        </p>
      </div>

      {user && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Account Details
          </h2>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Member since
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.createdAt.toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0",
              navbar: "hidden",
              pageScrollBox: "py-4 px-6",
            },
          }}
        />
      </div>
    </div>
  );
}
