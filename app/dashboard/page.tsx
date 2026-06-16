import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  await syncUser();

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { locations: true, rainAlerts: { orderBy: { sentAt: "desc" }, take: 5 } },
  });

  const location = user?.locations[0] ?? null;
  const recentAlerts = user?.rainAlerts ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome{user ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Rain monitoring dashboard for your location.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Monitored Location</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 truncate">
            {location ? location.locationName.split(",")[0] : "—"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {location
              ? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`
              : "Not set"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Rain Alerts Sent</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{recentAlerts.length > 0 ? recentAlerts.filter(a => a.probability >= 60).length : 0}</p>
          <p className="mt-1 text-xs text-gray-400">Total alerts triggered</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Status</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {location ? "Active" : "—"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {location ? "Monitoring for rain" : "Set a location first"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Uptime</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">99.9%</p>
          <p className="mt-1 text-xs text-gray-400">System online</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Location
          </h2>
          {location ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-700">
                <span className="font-medium">City:</span> {location.locationName}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Coordinates:</span> {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </p>
              <p className="text-sm text-gray-500">
                View the{" "}
                <Link href="/locations" className="text-blue-600 hover:text-blue-700 font-medium">
                  48-hour forecast
                </Link>{" "}
                for this location.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex h-48 flex-col items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
              <p>No location set yet.</p>
              <Link
                href="/locations"
                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Set your location
              </Link>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
          {recentAlerts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {alert.locationName}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {alert.probability}% probability &middot;{" "}
                    {new Date(alert.sentAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
              No rain alerts yet. They will appear here when rain is detected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
