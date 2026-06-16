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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.96px] text-[#171717]">
          Profile
        </h1>
        <p className="mt-1 text-[14px] text-[#4d4d4d]">
          Manage your account settings and preferences.
        </p>
      </div>

      {user && (
        <div className="mb-8 rounded-xl border border-[#ebebeb] bg-white p-6 shadow-card">
          <h2 className="text-[16px] font-semibold text-[#171717]">
            Account Details
          </h2>
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f5]">
                <svg className="h-4 w-4 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] text-[#888]">Name</p>
                <p className="text-[14px] font-medium text-[#171717]">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f5]">
                <svg className="h-4 w-4 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] text-[#888]">Email</p>
                <p className="text-[14px] font-medium text-[#171717]">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f5]">
                <svg className="h-4 w-4 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] text-[#888]">Member since</p>
                <p className="text-[14px] font-medium text-[#171717]">
                  {user.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#ebebeb] bg-white p-6 shadow-card">
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0",
              navbar: "hidden",
              pageScrollBox: "py-4 px-0",
            },
          }}
        />
      </div>
    </div>
  );
}
