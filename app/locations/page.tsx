import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/auth";
import LocationManager from "@/components/LocationManager";

export default async function LocationsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  await syncUser();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.96px] text-[#171717]">
          Your Places
        </h1>
        <p className="mt-1 text-[14px] text-[#4d4d4d]">
          Add and manage the places you want to monitor for rain.
        </p>
      </div>
      <LocationManager />
    </div>
  );
}
