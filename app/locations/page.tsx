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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Monitored Location</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set the location you want to monitor for rainfall data.
        </p>
      </div>
      <LocationManager />
    </div>
  );
}
