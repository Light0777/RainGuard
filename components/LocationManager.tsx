"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Building03Icon,
  GraduationCapIcon,
  BarnsIcon,
  HouseHeartIcon,
  PinLocation01Icon,
  Search01Icon,
  AddCircleIcon,
  CloudRainIcon,
  Navigation01Icon,
} from "@hugeicons/core-free-icons";

interface Location {
  id: string;
  name: string;
  type: string;
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

type LocationType = "HOME" | "OFFICE" | "SCHOOL" | "FARM" | "PARENTS_HOME" | "CUSTOM";

const LOCATION_TYPES: { value: LocationType; label: string; icon: typeof Home01Icon }[] = [
  { value: "HOME", label: "Home", icon: Home01Icon },
  { value: "OFFICE", label: "Office", icon: Building03Icon },
  { value: "SCHOOL", label: "School", icon: GraduationCapIcon },
  { value: "FARM", label: "Farm", icon: BarnsIcon },
  { value: "PARENTS_HOME", label: "Parents' Home", icon: HouseHeartIcon },
  { value: "CUSTOM", label: "Custom", icon: PinLocation01Icon },
];

const LOCATION_ICONS: Record<string, typeof Home01Icon> = {
  HOME: Home01Icon,
  OFFICE: Building03Icon,
  SCHOOL: GraduationCapIcon,
  FARM: BarnsIcon,
  PARENTS_HOME: HouseHeartIcon,
  CUSTOM: PinLocation01Icon,
};

function Spinner() {
  return <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#d4d4d4] border-t-[#a6cf44]" />;
}

export default function LocationManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [selectedType, setSelectedType] = useState<LocationType>("HOME");
  const [locationName, setLocationName] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [forecast, setForecast] = useState<ForecastInterval[] | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");
  const [forecastLocationId, setForecastLocationId] = useState<string | null>(null);

  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/locations");
        if (cancelled) return;
        if (!res.ok) {
          if (res.status !== 401) setError("Failed to load locations");
          return;
        }
        const data = await res.json();
        if (!cancelled) setLocations(data.locations ?? []);
      } catch {
        if (!cancelled) setError("Failed to load locations");
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
      const body = {
        name: locationName.trim() || result.name,
        type: selectedType,
        latitude: result.latitude,
        longitude: result.longitude,
      };
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save location"); return; }
      setLocations((prev) => [...prev, data.location]);
      resetForm();
    } catch {
      setError("Failed to save location");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editingLocation) return;
    setIsSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = { id: editingLocation.id };
      if (locationName.trim()) body.name = locationName.trim();
      body.type = selectedType;

      const res = await fetch("/api/locations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update location"); return; }
      setLocations((prev) => prev.map((l) => l.id === data.location.id ? data.location : l));
      cancelEditing();
    } catch {
      setError("Failed to update location");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this location?")) return;
    setError("");
    try {
      const res = await fetch(`/api/locations?id=${id}`, { method: "DELETE" });
      if (!res.ok) { const data = await res.json(); setError(data.error || "Failed to delete location"); return; }
      setLocations((prev) => prev.filter((l) => l.id !== id));
      if (forecastLocationId === id) {
        setForecast(null);
        setForecastLocationId(null);
      }
    } catch {
      setError("Failed to delete location");
    }
  }

  async function fetchForecast(locationId: string) {
    setForecastLoading(true);
    setForecastError("");
    setForecast(null);
    setForecastLocationId(locationId);
    try {
      const res = await fetch(`/api/forecast?locationId=${locationId}`);
      if (!res.ok) { const data = await res.json(); setForecastError(data.error || "Failed to load forecast"); return; }
      const data = await res.json();
      setForecast(data.intervals);
    } catch {
      setForecastError("Failed to load forecast");
    } finally {
      setForecastLoading(false);
    }
  }

  function startEdit(loc: Location) {
    setEditingLocation(loc);
    setLocationName(loc.name);
    setSelectedType(loc.type as LocationType);
    setShowAddForm(true);
    setError("");
  }

  function cancelEditing() {
    setEditingLocation(null);
    setLocationName("");
    setSelectedType("HOME");
    setShowAddForm(false);
    setError("");
  }

  function resetForm() {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setLocationName("");
    setSelectedType("HOME");
    setShowAddForm(false);
    setEditingLocation(null);
  }

  async function handleGetCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    if (!window.isSecureContext) {
      setError("Geolocation requires a secure connection (HTTPS). This page is not served over HTTPS.");
      return;
    }
    setGeoLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGeoLoading(false);
        setError("");
        const res = await fetch(`/api/geocode/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to get location name.");
          return;
        }
        const result = await res.json();
        await handleSelect(result);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Location access denied. Please enable location permissions in your browser settings.",
          2: "Location unavailable. Your browser could not determine your position. Try enabling Wi-Fi or moving outdoors.",
          3: "Location request timed out. Please try again.",
        };
        setError(messages[err.code] || "Failed to get your location.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const selectedLoc = locations.find((l) => l.id === forecastLocationId);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-[#f7d4d6] bg-[#fafafa] px-4 py-3 text-[13px] text-[#ee0000]">
          {error}
        </div>
      )}

      {locations.length > 0 && !showAddForm && (
        <div className="space-y-3">
          {locations.map((loc) => {
            const IconComponent = LOCATION_ICONS[loc.type] ?? PinLocation01Icon;
            return (
              <div key={loc.id} className="rounded-xl border border-[#ebebeb] bg-white p-5 shadow-card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5f5f5]">
                      <HugeiconsIcon icon={IconComponent} size={22} color="#4d4d4d" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#171717]">{loc.name}</h3>
                      <p className="text-[12px] text-[#a1a1a1]">
                        {LOCATION_TYPES.find(t => t.value === loc.type)?.label ?? loc.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fetchForecast(loc.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[#ebebeb] bg-white px-3 text-[12px] font-medium text-[#171717] hover:bg-[#fafafa] transition-colors"
                    >
                      <HugeiconsIcon icon={CloudRainIcon} size={14} />
                      Forecast
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(loc)}
                      className="inline-flex h-8 items-center rounded-md border border-[#ebebeb] bg-white px-3 text-[12px] font-medium text-[#171717] hover:bg-[#fafafa] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(loc.id)}
                      className="inline-flex h-8 items-center rounded-md border border-[#f7d4d6] bg-white px-3 text-[12px] font-medium text-[#ee0000] hover:bg-[#fafafa] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-[12px] text-[#888]">
                  <span>{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!showAddForm && locations.length > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => { setShowAddForm(true); setEditingLocation(null); setLocationName(""); setSelectedType("HOME"); }}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#a6cf44] px-6 text-[13px] font-medium text-[#171717] hover:bg-[#8ab332] transition-colors"
          >
            <HugeiconsIcon icon={AddCircleIcon} size={18} />
            Add New Location
          </button>
        </div>
      )}

      {locations.length === 0 && !showAddForm && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-[#ebebeb] bg-[#fafafa] py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-card">
            <HugeiconsIcon icon={PinLocation01Icon} size={24} color="#888" />
          </div>
          <p className="mt-4 text-[14px] text-[#888]">No locations yet.</p>
          <p className="mt-1 text-[13px] text-[#a1a1a1]">Add a place you want to monitor for rain.</p>
          <button
            type="button"
            onClick={() => { setShowAddForm(true); setEditingLocation(null); setLocationName(""); setSelectedType("HOME"); }}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#a6cf44] px-6 text-[13px] font-medium text-[#171717] hover:bg-[#8ab332] transition-colors"
          >
            <HugeiconsIcon icon={AddCircleIcon} size={18} />
            Add Location
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="rounded-xl border border-[#ebebeb] bg-white p-6 shadow-card">
          <h2 className="text-[16px] font-semibold text-[#171717] mb-4">
            {editingLocation ? `Edit ${editingLocation.name}` : "Add New Location"}
          </h2>

          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-medium text-[#171717]">
              Location Type
            </label>
            <div className="flex flex-wrap gap-2">
              {LOCATION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSelectedType(t.value)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors ${
                    selectedType === t.value
                      ? "bg-[#a6cf44] text-[#171717]"
                      : "border border-[#ebebeb] bg-white text-[#4d4d4d] hover:bg-[#fafafa]"
                  }`}
                >
                  <HugeiconsIcon icon={t.icon} size={18} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="location-name" className="mb-1.5 block text-[13px] font-medium text-[#171717]">
              Location Name
            </label>
            <input
              id="location-name"
              type="text"
              placeholder="e.g., Grandma's House"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#ebebeb] bg-white px-3 text-[14px] text-[#171717] placeholder-[#888] outline-none transition-colors focus:border-[#a6cf44]"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="location-search" className="mb-1.5 block text-[13px] font-medium text-[#171717]">
              Search for a place
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#888]">
                <HugeiconsIcon icon={Search01Icon} size={16} />
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

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-[#ebebeb]" />
            <span className="text-[12px] text-[#a1a1a1]">or</span>
            <div className="h-px flex-1 bg-[#ebebeb]" />
          </div>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={geoLoading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#a6cf44] px-4 text-[13px] font-medium text-[#171717] hover:bg-[#8ab332] transition-colors disabled:opacity-50"
          >
            {geoLoading ? (
              <Spinner />
            ) : (
              <HugeiconsIcon icon={Navigation01Icon} size={18} />
            )}
            {geoLoading ? "Getting location..." : "Use My Current Location"}
          </button>
          <p className="mt-1.5 text-[11px] text-[#a1a1a1] text-center">
            We use your location once to save this place. RainGuard does not continuously track you.
          </p>

          <div className="mt-4 flex gap-2">
            {editingLocation && (
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isSaving}
                className="flex-1 inline-flex h-10 items-center justify-center rounded-lg bg-[#a6cf44] px-4 text-[13px] font-medium text-[#171717] hover:bg-[#8ab332] transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            )}
            <button
              type="button"
              onClick={cancelEditing}
              className={`inline-flex h-10 items-center justify-center rounded-md border border-[#ebebeb] bg-white px-4 text-[13px] font-medium text-[#171717] hover:bg-[#fafafa] transition-colors ${editingLocation ? "" : "flex-1"}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {forecastLocationId && forecast && !forecastLoading && (
        <div className="rounded-xl border border-[#ebebeb] bg-white p-6 shadow-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-semibold text-[#171717]">
                {selectedLoc?.name ? `${selectedLoc.name} Forecast` : "Weather Forecast"}
              </h2>
              <p className="mt-0.5 text-[13px] text-[#888]">48-hour precipitation forecast.</p>
            </div>
            <button
              type="button"
              onClick={() => fetchForecast(forecastLocationId)}
              className="inline-flex h-8 items-center rounded-md bg-[#a6cf44] px-4 text-[13px] font-medium text-[#171717] hover:bg-[#8ab332] transition-colors"
            >
              Refresh
            </button>
          </div>

          {forecastError && (
            <div className="rounded-lg border border-[#f7d4d6] bg-[#fafafa] px-4 py-3 text-[13px] text-[#ee0000]">
              {forecastError}
            </div>
          )}

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
                          <HugeiconsIcon
                            icon={CloudRainIcon}
                            size={14}
                            color={level === "high" ? "#ee0000" : level === "medium" ? "#f5a623" : "#a1a1a1"}
                          />
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

      {forecastLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )}
    </div>
  );
}
