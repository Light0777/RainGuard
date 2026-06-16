import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden lg:min-h-screen lg:flex lg:items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#cbff49]/20 via-[#a6cf44]/10 to-[#8ab332]/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(203,255,73,0.2),transparent)]" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[#ebebeb] bg-white px-3 py-1 text-[12px] font-mono text-[#888]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a6cf44]" />
              Smart Rainfall Monitoring
            </div>
            <h1 className="mx-auto max-w-4xl text-[40px] font-semibold leading-[44px] tracking-[-2px] text-[#171717] sm:text-[56px] sm:leading-[60px]">
              <span>Know when it&apos;s going to rain.</span>
              <br />
              <span>Before it does.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[18px] leading-7 text-[#4d4d4d]">
              RainGuard gives you real-time precipitation forecasts and instant email alerts so you&apos;re never caught in the rain.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center rounded-full bg-[#a6cf44] px-5 text-[14px] font-medium text-[#171717] hover:bg-[#8ab332] transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                href="#features"
                className="inline-flex h-11 items-center rounded-full border border-[#ebebeb] bg-white px-5 text-[14px] font-medium text-[#171717] hover:bg-[#fafafa] transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-[#ebebeb] bg-[#fafafa]">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-[13px] font-mono tracking-wide text-[#888] uppercase">Features</p>
            <h2 className="text-[32px] font-semibold leading-[40px] tracking-[-1.28px] text-[#171717]">
              Everything you need to stay dry.
            </h2>
            <p className="mt-3 text-[16px] leading-6 text-[#4d4d4d]">
              Precipitation forecasts, intelligent alerts, and a clean dashboard — no clutter, just the weather that matters.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Precipitation Forecasts",
                description: "48-hour hourly forecast powered by Tomorrow.io. See rain probability and intensity at a glance.",
                gradient: "from-[#cbff49] to-[#a6cf44]",
              },
              {
                title: "Smart Email Alerts",
                description: "Get notified when rain probability exceeds 60% within the next 30 minutes. No spam, just the alerts you need.",
                gradient: "from-[#a6cf44] to-[#8ab332]",
              },
              {
                title: "Minimal Dashboard",
                description: "A clean, focused dashboard that shows you exactly what matters — your location, forecast, and alert history.",
                gradient: "from-[#cbff49] to-[#8ab332]",
              },
              {
                title: "Any City Worldwide",
                description: "Search and monitor any city globally. Set your location and get localised forecasts wherever you are.",
                gradient: "from-[#a6cf44] to-[#7a9e2e]",
              },
              {
                title: "Free & Open",
                description: "No subscriptions, no hidden fees. Just a weather tool that works, built with Next.js and TypeScript.",
                gradient: "from-[#cbff49] to-[#7a9e2e]",
              },
              {
                title: "Open Source",
                description: "Fully open source. Contribute, fork, or self-host. Your data stays yours.",
                gradient: "from-[#a6cf44] to-[#6b8c28]",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-[#ebebeb] bg-white p-6 shadow-card transition-all hover:shadow-card-hover"
              >
                <div className={`mb-4 h-1 w-10 rounded-full bg-gradient-to-r ${feature.gradient}`} />
                <h3 className="text-[16px] font-semibold leading-6 text-[#171717]">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-5 text-[#4d4d4d]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#ebebeb] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="text-[32px] font-semibold leading-[40px] tracking-[-1.28px] text-[#171717]">
            Ready to never get caught in the rain again?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[16px] leading-6 text-[#4d4d4d]">
            Set your location, and RainGuard will watch the weather for you.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center rounded-full bg-[#a6cf44] px-6 text-[14px] font-medium text-[#171717] hover:bg-[#8ab332] transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/locations"
              className="inline-flex h-11 items-center rounded-full border border-[#ebebeb] bg-white px-6 text-[14px] font-medium text-[#171717] hover:bg-[#fafafa] transition-colors"
            >
              Set a Location
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
