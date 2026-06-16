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
          if (res.status !== 401) {
            setError("Failed to load location");
          }
          return;
        }
        const data = await res.json();
        if (!cancelled && data.location) {
          setLocation(data.location);
        }
      } catch {
        if (!cancelled) setError("Failed to load location");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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
        body: JSON.stringify({
          locationName: result.displayName,
          latitude: result.latitude,
          longitude: result.longitude,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save location");
        return;
      }

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
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete location");
        return;
      }
      setLocation(null);
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
      if (!res.ok) {
        const data = await res.json();
        setForecastError(data.error || "Failed to load forecast");
        return;
      }
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
    if (location) {
      const shortName = location.locationName.split(",")[0] ?? "";
      setSearchQuery(shortName);
    }
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
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!location || isEditing) {
    return (
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="relative">
          <label htmlFor="location-search" className="block text-sm font-medium text-gray-700 mb-1.5">
            {isEditing ? "Search for a new location" : "Search for a city"}
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="location-search"
              type="text"
              placeholder="e.g., London, Tokyo, New York..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            )}
          </div>

          {showResults && searchResults.length > 0 && (
            <ul className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {searchResults.map((result, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleSelect(result)}
                    disabled={isSaving}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-100 last:border-0 disabled:opacity-50"
                  >
                    <span className="font-medium">{result.name}</span>
                    <span className="ml-1 text-gray-400">
                      ({result.latitude.toFixed(4)}, {result.longitude.toFixed(4)})
                    </span>
                    <p className="mt-0.5 text-xs text-gray-400 truncate">
                      {result.displayName}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
            <p className="mt-2 text-sm text-gray-400">No locations found. Try a different search.</p>
          )}
        </div>

        {isEditing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelEditing}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {!isEditing && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <svg
              className="mx-auto h-10 w-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-3 text-sm text-gray-500">
              Search for a city above to set your monitored location.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Monitored Location</h2>
              <p className="mt-1 text-sm text-gray-500">
                Weather data will be fetched for this area.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startEditing}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Location</p>
            <p className="mt-1 text-sm text-gray-900">{location.locationName}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Coordinates</p>
            <p className="mt-1 text-sm text-gray-900">
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Latitude</p>
            <p className="mt-1 font-mono text-sm text-gray-900">{location.latitude.toFixed(6)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Longitude</p>
            <p className="mt-1 font-mono text-sm text-gray-900">{location.longitude.toFixed(6)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Added on</p>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(location.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100">
              <svg
                className="h-5 w-5 text-sky-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Weather Forecast</h2>
              <p className="mt-1 text-sm text-gray-500">
                48-hour precipitation forecast for this location.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchForecast}
            disabled={forecastLoading}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors disabled:opacity-50"
          >
            {forecastLoading ? "Loading..." : forecast ? "Refresh" : "Load Forecast"}
          </button>
        </div>

        {forecastError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {forecastError}
          </div>
        )}

        {forecastLoading && (
          <div className="mt-6 flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-sky-600 border-t-transparent" />
          </div>
        )}

        {forecast && !forecastLoading && (
          <div className="mt-5">
            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Time
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                      Rain Probability
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                      Intensity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {forecast.map((interval, idx) => {
                    const time = new Date(interval.startTime);
                    const prob = interval.precipitationProbability ?? 0;
                    const intensity = interval.precipitationIntensity ?? 0;
                    return (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-4 py-2.5 text-sm text-gray-900">
                          <span className="font-medium">
                            {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                          <span className="ml-1.5 text-gray-500">
                            {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-sm font-medium ${
                              prob >= 70
                                ? "text-red-600"
                                : prob >= 40
                                  ? "text-amber-600"
                                  : "text-gray-600"
                            }`}
                          >
                            <svg
                              className={`h-3.5 w-3.5 ${
                                prob >= 70
                                  ? "text-red-500"
                                  : prob >= 40
                                    ? "text-amber-500"
                                    : "text-gray-400"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
                            </svg>
                            {Math.round(prob)}%
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm text-gray-600">
                          {intensity < 0.01
                            ? "<0.01"
                            : intensity.toFixed(2)}{" "}
                          mm/h
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Data from Tomorrow.io &middot; Updated every 5 minutes
            </p>
          </div>
        )}

        {!forecast && !forecastLoading && !forecastError && (
          <div className="mt-4 flex items-center justify-center rounded-lg bg-gray-50 py-8 text-sm text-gray-400">
            Click &quot;Load Forecast&quot; to view precipitation data.
          </div>
        )}
      </div>
    </div>
  );
}
