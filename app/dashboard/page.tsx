import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/auth";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Building03Icon,
  GraduationCapIcon,
  BarnsIcon,
  HouseHeartIcon,
  PinLocation01Icon,
  AddCircleIcon,
  CloudRainIcon,
} from "@hugeicons/core-free-icons";

const LOCATION_ICONS: Record<string, typeof Home01Icon> = {
  HOME: Home01Icon,
  OFFICE: Building03Icon,
  SCHOOL: GraduationCapIcon,
  FARM: BarnsIcon,
  PARENTS_HOME: HouseHeartIcon,
  CUSTOM: PinLocation01Icon,
};

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  await syncUser();

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      locations: { orderBy: { createdAt: "asc" } },
      rainAlerts: { orderBy: { sentAt: "desc" }, take: 10 },
    },
  });

  const locations = user?.locations ?? [];
  const recentAlerts = user?.rainAlerts ?? [];
  const totalAlerts = recentAlerts.filter(a => a.probability >= 60).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.96px] text-[#171717]">
          {user ? `${user.name}'s Places` : "My Places"}
        </h1>
        <p className="mt-1 text-[14px] text-[#4d4d4d]">
          Monitor weather conditions at your important locations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monitored Places"
          value={String(locations.length)}
          sub={locations.length === 1 ? "1 location" : `${locations.length} locations`}
          highlight={locations.length > 0}
        />
        <StatCard
          label="Rain Alerts Sent"
          value={String(totalAlerts)}
          sub="Total alerts triggered"
        />
        <StatCard
          label="Status"
          value={locations.length > 0 ? "Active" : "—"}
          sub={locations.length > 0 ? "Monitoring for rain" : "Add a location first"}
          highlight={locations.length > 0}
        />
        <StatCard
          label="Uptime"
          value="99.9%"
          sub="System online"
        />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-[#171717]">Your Locations</h2>
          <Link
            href="/locations"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#a6cf44] px-4 text-[13px] font-medium text-[#171717] hover:bg-[#8ab332] transition-colors"
          >
            <HugeiconsIcon icon={AddCircleIcon} size={16} />
            Add New Location
          </Link>
        </div>

        {locations.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((loc) => (
              <LocationCard
                key={loc.id}
                id={loc.id}
                name={loc.name}
                type={loc.type}
                latitude={loc.latitude}
                longitude={loc.longitude}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            message="No locations monitored yet."
            sub="Add your home, office, or any place you care about."
            action={{ href: "/locations", label: "Add your first location" }}
          />
        )}
      </div>

      <div className="mt-8">
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
                      <HugeiconsIcon icon={CloudRainIcon} size={14} />
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
              sub="They will appear here when rain is detected for your locations."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LocationCard({ id, name, type, latitude, longitude }: {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
}) {
  const IconComponent = LOCATION_ICONS[type] ?? PinLocation01Icon;
  return (
    <div className="rounded-xl border border-[#ebebeb] bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5f5f5]">
          <HugeiconsIcon icon={IconComponent} size={22} color="#4d4d4d" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-[#171717] truncate">{name}</p>
          <p className="text-[11px] text-[#a6cf44] font-medium">Monitoring Active</p>
        </div>
      </div>
      <div className="mt-3 border-t border-[#ebebeb] pt-3">
        <p className="text-[11px] font-mono text-[#888]">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          href={`/locations?id=${id}`}
          className="flex-1 inline-flex h-8 items-center justify-center rounded-md border border-[#ebebeb] bg-white px-3 text-[12px] font-medium text-[#171717] hover:bg-[#fafafa] transition-colors"
        >
          View Forecast
        </Link>
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
