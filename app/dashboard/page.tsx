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
  const alertCount = recentAlerts.filter(a => a.probability >= 60).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.96px] text-[#171717]">
          Welcome{user ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-1 text-[14px] text-[#4d4d4d]">
          Rain monitoring dashboard for your location.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monitored Location"
          value={location ? location.locationName.split(",")[0] ?? location.locationName : "—"}
          sub={location ? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}` : "Not set"}
        />
        <StatCard
          label="Rain Alerts Sent"
          value={String(alertCount)}
          sub="Total alerts triggered"
        />
        <StatCard
          label="Status"
          value={location ? "Active" : "—"}
          sub={location ? "Monitoring for rain" : "Set a location first"}
          highlight={!!location}
        />
        <StatCard
          label="Uptime"
          value="99.9%"
          sub="System online"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#ebebeb] bg-white p-6 shadow-card">
          <h2 className="text-[16px] font-semibold text-[#171717]">Your Location</h2>
          {location ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f5f5]">
                  <svg className="h-4 w-4 text-[#4d4d4d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[#171717]">{location.locationName}</p>
                  <p className="text-[12px] text-[#888]">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
                </div>
              </div>
              <p className="text-[13px] text-[#888]">
                View the{" "}
                <Link href="/locations" className="text-[#a6cf44] hover:text-[#8ab332] font-medium">
                  48-hour forecast
                </Link>{" "}
                for this location.
              </p>
            </div>
          ) : (
            <EmptyState
              message="No location set yet."
              action={{ href: "/locations", label: "Set your location" }}
            />
          )}
        </div>

        <div className="rounded-xl border border-[#ebebeb] bg-white p-6 shadow-card">
          <h2 className="text-[16px] font-semibold text-[#171717]">Recent Alerts</h2>
          {recentAlerts.length > 0 ? (
            <div className="mt-4 space-y-2">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-lg border border-[#ebebeb] bg-[#fafafa] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      alert.probability >= 70 ? "bg-[#f7d4d6] text-[#ee0000]" :
                      alert.probability >= 40 ? "bg-[#ffefcf] text-[#f5a623]" :
                      "bg-[#f5f5f5] text-[#888]"
                    }`}>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[#171717]">{alert.locationName}</p>
                      <p className="text-[12px] text-[#888]">
                        {alert.probability}% probability &middot;{" "}
                        {new Date(alert.sentAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-mono uppercase ${
                    alert.probability >= 70 ? "text-[#ee0000]" :
                    alert.probability >= 40 ? "text-[#f5a623]" :
                    "text-[#888]"
                  }`}>
                    {alert.probability >= 70 ? "High" : alert.probability >= 40 ? "Med" : "Low"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              message="No rain alerts yet."
              sub="They will appear here when rain is detected for your location."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#ebebeb] bg-white p-5 shadow-card">
      <p className="text-[12px] font-medium text-[#888] tracking-wide uppercase">{label}</p>
      <p className={`mt-1.5 text-[28px] font-semibold leading-8 tracking-[-0.5px] ${
        highlight ? "text-[#a6cf44]" : "text-[#171717]"
      } truncate`}>
        {value}
      </p>
      <p className="mt-1 text-[12px] text-[#888]">{sub}</p>
    </div>
  );
}

function EmptyState({ message, sub, action }: {
  message: string;
  sub?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mt-4 flex h-44 flex-col items-center justify-center rounded-lg border border-dashed border-[#ebebeb] bg-[#fafafa]">
      <p className="text-[14px] text-[#888]">{message}</p>
      {sub && <p className="mt-1 text-[12px] text-[#a1a1a1]">{sub}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-3 inline-flex h-8 items-center rounded-md bg-[#a6cf44] px-4 text-[13px] font-medium text-[#171717] hover:bg-[#8ab332] transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
