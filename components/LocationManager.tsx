"use client";

import { useState, useEffect } from "react";

interface Location {
  id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

interface ForecastInterval {
  startTime: string;
  precipitationProbability: number;
  precipitationIntensity: number;
}

function Spinner() {
  return <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#d4d4d4] border-t-[#a6cf44]" />;
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export default function LocationManager() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [forecast, setForecast] = useState<ForecastInterval[] | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/locations");
        if (cancelled) return;
        if (!res.ok) {
          if (res.status !== 401) setError("Failed to load location");
          return;
        }
        const data = await res.json();
        if (!cancelled && data.location) setLocation(data.location);
      } catch {
        if (!cancelled) setError("Failed to load location");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowResults(true);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleSelect(result: GeoResult) {
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/locations", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationName: result.displayName, latitude: result.latitude, longitude: result.longitude }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save location"); return; }
      setLocation(data.location);
      setSearchQuery("");
      setSearchResults([]);
      setShowResults(false);
      setIsEditing(false);
    } catch {
      setError("Failed to save location");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete your saved location?")) return;
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/locations", { method: "DELETE" });
      if (!res.ok) { const data = await res.json(); setError(data.error || "Failed to delete location"); return; }
      setLocation(null);
      setForecast(null);
    } catch {
      setError("Failed to delete location");
    } finally {
      setIsSaving(false);
    }
  }

  async function fetchForecast() {
    setForecastLoading(true);
    setForecastError("");
    setForecast(null);
    try {
      const res = await fetch("/api/forecast");
      if (!res.ok) { const data = await res.json(); setForecastError(data.error || "Failed to load forecast"); return; }
      const data = await res.json();
      setForecast(data.intervals);
    } catch {
      setForecastError("Failed to load forecast");
    } finally {
      setForecastLoading(false);
    }
  }

  function startEditing() {
    setIsEditing(true);
    if (location) setSearchQuery(location.locationName.split(",")[0] ?? "");
  }

  function cancelEditing() {
    setIsEditing(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setError("");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!location || isEditing) {
    return (
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-[#f7d4d6] bg-[#fafafa] px-4 py-3 text-[13px] text-[#ee0000]">
            {error}
          </div>
        )}

        <div className="relative">
          <label htmlFor="location-search" className="mb-1.5 block text-[13px] font-medium text-[#171717]">
            {isEditing ? "Search for a new location" : "Search for a city"}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#888]">
              <SearchIcon />
            </div>
            <input
              id="location-search"
              type="text"
              placeholder="e.g., London, Tokyo, New York..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#ebebeb] bg-white pl-9 pr-9 text-[14px] text-[#171717] placeholder-[#888] outline-none transition-colors focus:border-[#a6cf44]"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner />
              </div>
            )}
          </div>

          {showResults && searchResults.length > 0 && (
            <ul className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-[#ebebeb] bg-white shadow-card">
              {searchResults.map((result, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleSelect(result)}
                    disabled={isSaving}
                    className="w-full border-b border-[#ebebeb] px-4 py-3 text-left text-[13px] text-[#4d4d4d] transition-colors last:border-0 hover:bg-[#fafafa] hover:text-[#171717] disabled:opacity-50"
                  >
                    <span className="font-medium">{result.name}</span>
                    <span className="ml-1 text-[#a1a1a1]">
                      ({result.latitude.toFixed(4)}, {result.longitude.toFixed(4)})
                    </span>
                    <p className="mt-0.5 truncate text-[12px] text-[#a1a1a1]">{result.displayName}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
            <p className="mt-2 text-[13px] text-[#888]">No locations found. Try a different search.</p>
          )}
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={cancelEditing}
            className="inline-flex h-8 items-center rounded-md border border-[#ebebeb] bg-white px-4 text-[13px] font-medium text-[#171717] hover:bg-[#fafafa] transition-colors"
          >
            Cancel
          </button>
        )}

        {!isEditing && (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-[#ebebeb] bg-[#fafafa] py-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card">
              <svg className="h-5 w-5 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="mt-4 text-[14px] text-[#888]">Search for a city above to set your monitored location.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-[#f7d4d6] bg-[#fafafa] px-4 py-3 text-[13px] text-[#ee0000]">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-[#ebebeb] bg-white p-6 shadow-card">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5]">
              <svg className="h-5 w-5 text-[#4d4d4d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#171717]">Monitored Location</h2>
              <p className="mt-0.5 text-[13px] text-[#888]">Weather data will be fetched for this area.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startEditing}
              disabled={isSaving}
              className="inline-flex h-8 items-center rounded-md border border-[#ebebeb] bg-white px-3 text-[13px] font-medium text-[#171717] hover:bg-[#fafafa] transition-colors disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="inline-flex h-8 items-center rounded-md border border-[#f7d4d6] bg-white px-3 text-[13px] font-medium text-[#ee0000] hover:bg-[#fafafa] transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wide text-[#888]">Location</p>
            <p className="mt-1 text-[14px] text-[#171717]">{location.locationName}</p>
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wide text-[#888]">Coordinates</p>
            <p className="mt-1 text-[14px] text-[#171717]">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wide text-[#888]">Latitude</p>
            <p className="mt-1 font-mono text-[13px] text-[#171717]">{location.latitude.toFixed(6)}</p>
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wide text-[#888]">Longitude</p>
            <p className="mt-1 font-mono text-[13px] text-[#171717]">{location.longitude.toFixed(6)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[11px] font-mono uppercase tracking-wide text-[#888]">Added on</p>
            <p className="mt-1 text-[14px] text-[#171717]">
              {new Date(location.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#ebebeb] bg-white p-6 shadow-card">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5]">
              <svg className="h-5 w-5 text-[#4d4d4d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#171717]">Weather Forecast</h2>
              <p className="mt-0.5 text-[13px] text-[#888]">48-hour precipitation forecast for this location.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchForecast}
            disabled={forecastLoading}
            className="inline-flex h-8 items-center rounded-md bg-[#a6cf44] px-4 text-[13px] font-medium text-[#171717] hover:bg-[#8ab332] transition-colors disabled:opacity-50"
          >
            {forecastLoading ? "Loading..." : forecast ? "Refresh" : "Load Forecast"}
          </button>
        </div>

        {forecastError && (
          <div className="mt-4 rounded-lg border border-[#f7d4d6] bg-[#fafafa] px-4 py-3 text-[13px] text-[#ee0000]">
            {forecastError}
          </div>
        )}

        {forecastLoading && (
          <div className="mt-6 flex items-center justify-center py-8">
            <Spinner />
          </div>
        )}

        {forecast && !forecastLoading && (
          <div className="mt-5">
            <div className="overflow-x-auto rounded-lg border border-[#ebebeb]">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[#ebebeb] bg-[#fafafa]">
                    <th className="px-4 py-2.5 text-left text-[11px] font-mono uppercase tracking-wide text-[#888]">Time</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-mono uppercase tracking-wide text-[#888]">Rain Probability</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-mono uppercase tracking-wide text-[#888]">Intensity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebebeb]">
                  {forecast.map((interval, idx) => {
                    const time = new Date(interval.startTime);
                    const prob = interval.precipitationProbability ?? 0;
                    const intensity = interval.precipitationIntensity ?? 0;
                    const level = prob >= 70 ? "high" : prob >= 40 ? "medium" : "low";
                    return (
                      <tr key={idx} className="transition-colors hover:bg-[#fafafa]">
                        <td className="whitespace-nowrap px-4 py-2.5 text-[13px] text-[#171717]">
                          <span className="font-medium">
                            {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                          <span className="ml-1.5 text-[#888]">
                            {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right">
                          <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${
                            level === "high" ? "text-[#ee0000]" : level === "medium" ? "text-[#f5a623]" : "text-[#888]"
                          }`}>
                            <svg className={`h-3 w-3 ${
                              level === "high" ? "text-[#ee0000]" : level === "medium" ? "text-[#f5a623]" : "text-[#a1a1a1]"
                            }`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
                            </svg>
                            {Math.round(prob)}%
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right text-[13px] text-[#4d4d4d]">
                          {intensity < 0.01 ? "<0.01" : intensity.toFixed(2)} mm/h
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-[#888]">
              Data from Tomorrow.io &middot; Updated every 5 minutes
            </p>
          </div>
        )}

        {!forecast && !forecastLoading && !forecastError && (
          <div className="mt-4 flex items-center justify-center rounded-lg bg-[#fafafa] py-10 text-[13px] text-[#888]">
            Click &quot;Load Forecast&quot; to view precipitation data.
          </div>
        )}
      </div>
    </div>
  );
}
