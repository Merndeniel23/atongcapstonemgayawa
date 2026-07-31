import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  RefreshCw,
  Truck,
} from "lucide-react";

type BinStatus =
  | "empty"
  | "half-full"
  | "half_full"
  | "full"
  | "overflowing"
  | string;

type GarbageBin = {
  id: number;
  bin_code: string;
  location_name: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  current_status?: BinStatus | null;
  condition_status?: string | null;
  last_inspected_at?: string | null;
  is_active: number | boolean;
  purok_id?: number | null;
  purok_name?: string | null;
  barangay_id?: number | null;
  barangay_name?: string | null;
  schedule_id?: number | null;
  schedule_day?: string | null;
  schedule_start_time?: string | null;
  schedule_end_time?: string | null;
  schedule_notes?: string | null;
  is_scheduled_today?: number | boolean;
};

type CollectionRequest = {
  id: number;
  bin_id: number;
  priority: "low" | "normal" | "high" | "urgent";
  status:
    | "pending"
    | "approved"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled";
  reason?: string | null;
  requested_at?: string | null;
  completed_at?: string | null;
  assigned_collector_id?: number | null;
};

type BinWithRequest = GarbageBin & {
  request: CollectionRequest | null;
};

type MapViewProps = {
  viewOnly?: boolean;
};

const DEFAULT_CENTER: L.LatLngExpression = [
  10.2525,
  123.9494,
];

function getToken(): string {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

async function apiRequest(
  url: string,
  options: RequestInit = {},
) {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function hasCoordinates(bin: GarbageBin): boolean {
  const latitude = Number(bin.latitude);
  const longitude = Number(bin.longitude);

  return (
    bin.latitude !== null &&
    bin.latitude !== undefined &&
    bin.latitude !== "" &&
    bin.longitude !== null &&
    bin.longitude !== undefined &&
    bin.longitude !== "" &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

function normalizeStatus(value?: string | null): string {
  return String(value || "empty")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-");
}

function statusLabel(value?: string | null): string {
  return normalizeStatus(value)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatDate(value?: string | null): string {
  if (!value) return "Not yet inspected";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

function isScheduledToday(bin: GarbageBin): boolean {
  return Number(bin.is_scheduled_today) === 1;
}

function needsCollection(bin: GarbageBin): boolean {
  const status = normalizeStatus(bin.current_status);
  return (
    isScheduledToday(bin) ||
    status === "full" ||
    status === "overflowing"
  );
}

function priorityForBin(
  bin: GarbageBin,
): CollectionRequest["priority"] {
  const status = normalizeStatus(bin.current_status);

  if (status === "overflowing") return "urgent";
  if (status === "full") return "high";
  if (isScheduledToday(bin)) return "normal";
  return "low";
}

function markerColor(bin: GarbageBin): string {
  const status = normalizeStatus(bin.current_status);

  if (!Boolean(Number(bin.is_active))) return "#64748b";
  if (status === "overflowing") return "#dc2626";
  if (status === "full") return "#f97316";
  if (isScheduledToday(bin)) return "#16a34a";
  if (status === "half-full") return "#eab308";
  return "#2563eb";
}

function makeMarkerIcon(bin: GarbageBin): L.DivIcon {
  const color = markerColor(bin);
  const scheduledRing = isScheduledToday(bin)
    ? "box-shadow: 0 0 0 4px rgba(34,197,94,.25);"
    : "";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 999px 999px 999px 0;
        transform: rotate(-45deg);
        background: ${color};
        border: 3px solid white;
        ${scheduledRing}
      ">
        <div style="
          width: 8px;
          height: 8px;
          margin: 7px;
          border-radius: 999px;
          background: white;
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -29],
  });
}

export default function MapView({
  viewOnly = false,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  const [bins, setBins] = useState<GarbageBin[]>([]);
  const [requests, setRequests] =
    useState<CollectionRequest[]>([]);
  const [selectedId, setSelectedId] =
    useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] =
    useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [binResult, requestResult] = await Promise.all([
        apiRequest("/api/garbage-bins"),
        apiRequest("/api/collection-requests"),
      ]);

      setBins(binResult.bins || []);
      setRequests(requestResult.requests || []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load collector route data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(
      DEFAULT_CENTER,
      14,
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      },
    ).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    window.setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  const activeRequestsByBin = useMemo(() => {
    const map = new Map<number, CollectionRequest>();

    [...requests]
      .sort((a, b) => b.id - a.id)
      .forEach((request) => {
        if (
          request.status !== "cancelled" &&
          !map.has(request.bin_id)
        ) {
          map.set(request.bin_id, request);
        }
      });

    return map;
  }, [requests]);

  const visibleBins = useMemo<BinWithRequest[]>(
    () =>
      bins
        .filter((bin) => Number(bin.is_active) === 1)
        .map((bin) => ({
          ...bin,
          request: activeRequestsByBin.get(bin.id) || null,
        }))
        .sort((a, b) => {
          const aPriority = needsCollection(a) ? 1 : 0;
          const bPriority = needsCollection(b) ? 1 : 0;
          return bPriority - aPriority;
        }),
    [bins, activeRequestsByBin],
  );

  const selectedBin =
    visibleBins.find((bin) => bin.id === selectedId) || null;

  useEffect(() => {
    const markerLayer = markerLayerRef.current;
    if (!markerLayer) return;

    markerLayer.clearLayers();
    const mappedBins = visibleBins.filter(hasCoordinates);

    mappedBins.forEach((bin) => {
      const marker = L.marker(
        [Number(bin.latitude), Number(bin.longitude)],
        { icon: makeMarkerIcon(bin) },
      ).addTo(markerLayer);

      marker.bindPopup(`
        <div style="min-width: 210px; line-height: 1.5;">
          <strong>${bin.bin_code}</strong><br />
          ${bin.location_name}<br />
          ${bin.purok_name || "No purok"}<br />
          Bin status: ${statusLabel(bin.current_status)}<br />
          Scheduled today: ${
            isScheduledToday(bin) ? "Yes" : "No"
          }
        </div>
      `);

      marker.on("click", () => setSelectedId(bin.id));
    });

    if (!mapRef.current) return;

    if (mappedBins.length > 0) {
      const bounds = L.latLngBounds(
        mappedBins.map((bin) => [
          Number(bin.latitude),
          Number(bin.longitude),
        ]),
      );

      mapRef.current.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 17,
      });
    } else {
      mapRef.current.setView(DEFAULT_CENTER, 14);
    }

    window.setTimeout(
      () => mapRef.current?.invalidateSize(),
      100,
    );
  }, [visibleBins]);

  const createTask = async (bin: BinWithRequest) => {
    if (viewOnly) return;

    setUpdatingId(bin.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const priority = priorityForBin(bin);
      const result = await apiRequest(
        "/api/collection-requests",
        {
          method: "POST",
          body: JSON.stringify({
            bin_id: bin.id,
            priority,
            reason: isScheduledToday(bin)
              ? `Scheduled collection for ${
                  bin.schedule_day || "today"
                }.`
              : `${statusLabel(
                  bin.current_status,
                )} garbage bin requires collection.`,
          }),
        },
      );

      setSuccessMessage(
        result.message || "Collection task created.",
      );
      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to create collection task.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const updateStatus = async (
    bin: BinWithRequest,
    status: "assigned" | "in_progress" | "completed",
  ) => {
    if (viewOnly || !bin.request) return;

    setUpdatingId(bin.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await apiRequest(
        `/api/collection-requests/${bin.request.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );

      setSuccessMessage(
        result.message || "Collection task updated.",
      );
      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update collection task.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const scheduledCount = visibleBins.filter(
    isScheduledToday,
  ).length;
  const needsCollectionCount = visibleBins.filter(
    needsCollection,
  ).length;
  const mappedCount = visibleBins.filter(hasCoordinates).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            {viewOnly
              ? "Garbage Bin and Collector Monitoring"
              : "Collector Route Map"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            All active bins registered by Purok Leaders are shown. Green-ringed bins are scheduled today.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-black text-slate-700"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </header>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active Bins" value={visibleBins.length} />
        <StatCard
          label="Scheduled Today"
          value={scheduledCount}
        />
        <StatCard
          label="Needs Collection"
          value={needsCollectionCount}
        />
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4 text-xs font-bold text-slate-600 shadow-sm">
        <Legend color="#16a34a" label="Scheduled today" />
        <Legend color="#dc2626" label="Overflowing" />
        <Legend color="#f97316" label="Full" />
        <Legend color="#eab308" label="Half-full" />
        <Legend color="#2563eb" label="Empty / normal" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div
            ref={mapContainerRef}
            className="h-[560px] w-full"
          />
        </div>

        <aside className="rounded-2xl border bg-white p-5 shadow-sm">
          {!selectedBin ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
              <Navigation className="mb-3 h-10 w-10 text-emerald-700" />
              <h2 className="font-black text-slate-900">
                Select a garbage bin
              </h2>
              <p className="mt-2 max-w-xs text-sm text-slate-500">
                Click a marker or choose a bin from the list below.
              </p>
            </div>
          ) : (
            <BinDetails
              bin={selectedBin}
              busy={updatingId === selectedBin.id}
              viewOnly={viewOnly}
              onCreateTask={() => createTask(selectedBin)}
              onUpdateStatus={(status) =>
                updateStatus(selectedBin, status)
              }
            />
          )}
        </aside>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-black text-slate-900">
            Garbage Bin Collection List
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {mappedCount} with map coordinates
          </span>
        </div>

        <div className="divide-y">
          {visibleBins.map((bin) => (
            <button
              key={bin.id}
              type="button"
              onClick={() => {
                setSelectedId(bin.id);
                if (hasCoordinates(bin)) {
                  mapRef.current?.setView(
                    [
                      Number(bin.latitude),
                      Number(bin.longitude),
                    ],
                    17,
                  );
                }
              }}
              className={`flex w-full flex-col gap-3 p-5 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${
                selectedId === bin.id ? "bg-emerald-50" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-black text-slate-900">
                    {bin.bin_code} — {bin.location_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {bin.purok_name || "No purok"}
                    {bin.barangay_name
                      ? `, ${bin.barangay_name}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge label={statusLabel(bin.current_status)} />
                {isScheduledToday(bin) && (
                  <Badge label="Scheduled today" tone="green" />
                )}
                {bin.request && (
                  <Badge
                    label={statusLabel(bin.request.status)}
                    tone="blue"
                  />
                )}
                {!hasCoordinates(bin) && (
                  <Badge label="No coordinates" tone="red" />
                )}
              </div>
            </button>
          ))}

          {!loading && visibleBins.length === 0 && (
            <div className="p-10 text-center text-slate-500">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="font-black">No garbage bins found</p>
              <p className="mt-1 text-xs">
                A Purok Leader must register a garbage bin first.
              </p>
            </div>
          )}

          {loading && (
            <div className="p-10 text-center text-slate-500">
              <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
              Loading garbage bins...
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function Badge({
  label,
  tone = "gray",
}: {
  label: string;
  tone?: "gray" | "green" | "blue" | "red";
}) {
  const className = {
    gray: "bg-slate-100 text-slate-600",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-rose-100 text-rose-700",
  }[tone];

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${className}`}
    >
      {label}
    </span>
  );
}

function BinDetails({
  bin,
  busy,
  viewOnly,
  onCreateTask,
  onUpdateStatus,
}: {
  bin: BinWithRequest;
  busy: boolean;
  viewOnly: boolean;
  onCreateTask: () => void;
  onUpdateStatus: (
    status: "assigned" | "in_progress" | "completed",
  ) => void;
}) {
  const request = bin.request;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase text-emerald-700">
          Selected Garbage Bin
        </p>
        <h2 className="mt-1 text-xl font-black text-slate-900">
          {bin.bin_code}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {bin.location_name}
        </p>
      </div>

      <div className="rounded-xl border bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase text-slate-500">
          Area
        </p>
        <p className="mt-1 font-black text-slate-900">
          {bin.purok_name || "No purok"}
          {bin.barangay_name ? `, ${bin.barangay_name}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoCard
          label="Bin Status"
          value={statusLabel(bin.current_status)}
        />
        <InfoCard
          label="Condition"
          value={statusLabel(bin.condition_status || "good")}
        />
      </div>

      <div className="rounded-xl border p-3">
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
          <CalendarDays className="h-3.5 w-3.5" />
          Collection Schedule
        </p>
        <p className="mt-1 text-sm font-black text-slate-800">
          {isScheduledToday(bin)
            ? `${bin.schedule_day || "Today"}${
                bin.schedule_start_time
                  ? ` • ${bin.schedule_start_time}`
                  : ""
              }`
            : "Not scheduled today"}
        </p>
        {bin.schedule_notes && (
          <p className="mt-1 text-xs text-slate-500">
            {bin.schedule_notes}
          </p>
        )}
      </div>

      <div className="rounded-xl border p-3">
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          Last Inspection
        </p>
        <p className="mt-1 text-sm text-slate-700">
          {formatDate(bin.last_inspected_at)}
        </p>
      </div>

      {request && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <p className="text-[10px] font-bold uppercase text-blue-600">
            Collection Task
          </p>
          <p className="mt-1 text-sm font-black text-blue-900">
            {statusLabel(request.status)} • {request.priority}
          </p>
        </div>
      )}

      {!viewOnly && (
        <div className="space-y-2">
          {!request && needsCollection(bin) && (
            <button
              type="button"
              disabled={busy}
              onClick={onCreateTask}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <Truck className="h-4 w-4" />
              Create Collection Task
            </button>
          )}

          {!request && !needsCollection(bin) && (
            <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-600">
              This bin does not require collection today
            </div>
          )}

          {request?.status === "pending" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onUpdateStatus("assigned")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <Truck className="h-4 w-4" />
              Accept Task
            </button>
          )}

          {request &&
            ["approved", "assigned"].includes(request.status) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onUpdateStatus("in_progress")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                <Navigation className="h-4 w-4" />
                Start Route
              </button>
            )}

          {request?.status === "in_progress" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onUpdateStatus("completed")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Collected
            </button>
          )}

          {request?.status === "completed" && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Collection Completed
            </div>
          )}
        </div>
      )}

      {viewOnly && (
        <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-600">
          Administrator monitoring only
        </div>
      )}
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-[10px] font-bold uppercase text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}