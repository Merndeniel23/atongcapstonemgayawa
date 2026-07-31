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
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  RefreshCw,
  Truck,
} from "lucide-react";

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
  created_at?: string | null;
  assigned_collector_id?: number | null;
  assigned_collector_name?: string | null;

  bin_code: string;
  location_name: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  current_status?: string | null;
  condition_status?: string | null;

  purok_id?: number | null;
  purok_name?: string | null;
  barangay_name?: string | null;
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
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Request failed.",
    );
  }

  return data;
}

function hasCoordinates(
  request: CollectionRequest,
): boolean {
  if (
    request.latitude === null ||
    request.latitude === undefined ||
    request.latitude === "" ||
    request.longitude === null ||
    request.longitude === undefined ||
    request.longitude === ""
  ) {
    return false;
  }

  const latitude = Number(request.latitude);
  const longitude = Number(request.longitude);

  return (
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

function statusLabel(status: string): string {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function MapView({
  viewOnly = false,
}: MapViewProps) {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<L.Map | null>(null);

  const markerLayerRef =
    useRef<L.LayerGroup | null>(null);

  const [requests, setRequests] =
    useState<CollectionRequest[]>([]);

  const [selectedId, setSelectedId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const loadRequests = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await apiRequest(
        "/api/collection-requests",
      );

      setRequests(result.requests || []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load collection requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (
      !mapContainerRef.current ||
      mapRef.current
    ) {
      return;
    }

    const map = L.map(
      mapContainerRef.current,
    ).setView(DEFAULT_CENTER, 14);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          "&copy; OpenStreetMap contributors",
      },
    ).addTo(map);

    markerLayerRef.current =
      L.layerGroup().addTo(map);

    mapRef.current = map;

    window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  const visibleRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status !== "cancelled",
      ),
    [requests],
  );

  const selectedRequest =
    visibleRequests.find(
      (request) =>
        request.id === selectedId,
    ) || null;

  useEffect(() => {
    const markerLayer =
      markerLayerRef.current;

    if (!markerLayer) {
      return;
    }

    markerLayer.clearLayers();

    const mappedRequests =
      visibleRequests.filter(hasCoordinates);

    mappedRequests.forEach((request) => {
      const latitude =
        Number(request.latitude);

      const longitude =
        Number(request.longitude);

      const marker = L.marker([
        latitude,
        longitude,
      ]).addTo(markerLayer);

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <strong>${request.bin_code}</strong>
          <br />
          ${request.location_name}
          <br />
          ${request.purok_name || "No purok"}
          <br />
          Status: ${statusLabel(request.status)}
          <br />
          Priority: ${request.priority}
        </div>
      `);

      marker.on("click", () => {
        setSelectedId(request.id);
      });
    });

    if (!mapRef.current) {
      return;
    }

    if (mappedRequests.length > 0) {
      const bounds = L.latLngBounds(
        mappedRequests.map(
          (request) => [
            Number(request.latitude),
            Number(request.longitude),
          ],
        ),
      );

      mapRef.current.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 17,
      });
    } else {
      mapRef.current.setView(
        DEFAULT_CENTER,
        14,
      );
    }

    window.setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);
  }, [visibleRequests]);

  const updateStatus = async (
    requestId: number,
    status:
      | "assigned"
      | "in_progress"
      | "completed",
  ) => {
    if (viewOnly) {
      return;
    }

    setUpdatingId(requestId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await apiRequest(
        `/api/collection-requests/${requestId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );

      setSuccessMessage(
        result.message ||
          "Collection request updated.",
      );

      await loadRequests();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update collection request.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const activeCount =
    visibleRequests.filter(
      (request) =>
        !["completed", "cancelled"].includes(
          request.status,
        ),
    ).length;

  const completedCount =
    visibleRequests.filter(
      (request) =>
        request.status === "completed",
    ).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            {viewOnly
              ? "Collector Monitoring"
              : "Collector Route Map"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {viewOnly
              ? "Monitor collection requests and collector progress."
              : "Open a request, start the route, and mark it collected."}
          </p>
        </div>

        <button
          type="button"
          onClick={loadRequests}
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
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">
            Total Requests
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {visibleRequests.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">
            Active
          </p>
          <p className="mt-1 text-2xl font-black text-amber-600">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">
            Completed
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-700">
            {completedCount}
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div
            ref={mapContainerRef}
            className="h-[560px] w-full"
          />
        </div>

        <aside className="rounded-2xl border bg-white p-5 shadow-sm">
          {!selectedRequest ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
              <Navigation className="mb-3 h-10 w-10 text-emerald-700" />

              <h2 className="font-black text-slate-900">
                Select a collection request
              </h2>

              <p className="mt-2 max-w-xs text-sm text-slate-500">
                Click a map marker or choose a request from the queue below.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-emerald-700">
                  Active Request
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {selectedRequest.bin_code}
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  {selectedRequest.location_name}
                </p>
              </div>

              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Area
                </p>
                <p className="mt-1 font-black text-slate-900">
                  {selectedRequest.purok_name ||
                    "No purok"}
                  {selectedRequest.barangay_name
                    ? `, ${selectedRequest.barangay_name}`
                    : ""}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {statusLabel(
                      selectedRequest.status,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Priority
                  </p>
                  <p className="mt-1 text-sm font-black capitalize text-slate-900">
                    {selectedRequest.priority}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  Reason
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {selectedRequest.reason ||
                    "No reason provided."}
                </p>
              </div>

              <div className="rounded-xl border p-3">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  Requested
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {formatDate(
                    selectedRequest.requested_at ||
                      selectedRequest.created_at,
                  )}
                </p>
              </div>

              {!viewOnly && (
                <div className="space-y-2">
                  {selectedRequest.status ===
                    "pending" && (
                    <button
                      type="button"
                      disabled={
                        updatingId ===
                        selectedRequest.id
                      }
                      onClick={() =>
                        updateStatus(
                          selectedRequest.id,
                          "assigned",
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                    >
                      <Truck className="h-4 w-4" />
                      Accept Request
                    </button>
                  )}

                  {[
                    "approved",
                    "assigned",
                  ].includes(
                    selectedRequest.status,
                  ) && (
                    <button
                      type="button"
                      disabled={
                        updatingId ===
                        selectedRequest.id
                      }
                      onClick={() =>
                        updateStatus(
                          selectedRequest.id,
                          "in_progress",
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                    >
                      <Navigation className="h-4 w-4" />
                      Start Route
                    </button>
                  )}

                  {selectedRequest.status ===
                    "in_progress" && (
                    <button
                      type="button"
                      disabled={
                        updatingId ===
                        selectedRequest.id
                      }
                      onClick={() =>
                        updateStatus(
                          selectedRequest.id,
                          "completed",
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Collected
                    </button>
                  )}

                  {selectedRequest.status ===
                    "completed" && (
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
          )}
        </aside>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-black text-slate-900">
            Collection Request Queue
          </h2>
        </div>

        <div className="divide-y">
          {visibleRequests.map((request) => (
            <button
              key={request.id}
              type="button"
              onClick={() => {
                setSelectedId(request.id);

                if (
                  hasCoordinates(request)
                ) {
                  mapRef.current?.setView(
                    [
                      Number(request.latitude),
                      Number(request.longitude),
                    ],
                    17,
                  );
                }
              }}
              className={`flex w-full flex-col gap-3 p-5 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${
                selectedId === request.id
                  ? "bg-emerald-50"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-black text-slate-900">
                    {request.bin_code} —{" "}
                    {request.location_name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {request.purok_name ||
                      "No purok"}
                    {request.barangay_name
                      ? `, ${request.barangay_name}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
                  {statusLabel(
                    request.status,
                  )}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                    request.priority ===
                    "urgent"
                      ? "bg-rose-100 text-rose-700"
                      : request.priority ===
                          "high"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {request.priority}
                </span>

                {!hasCoordinates(request) && (
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black uppercase text-rose-700">
                    No map coordinates
                  </span>
                )}
              </div>
            </button>
          ))}

          {!loading &&
            visibleRequests.length === 0 && (
              <div className="p-10 text-center text-slate-500">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-300" />

                <p className="font-black">
                  No collection requests found
                </p>

                <p className="mt-1 text-xs">
                  Create a collection request first so it can appear on the route map.
                </p>
              </div>
            )}

          {loading && (
            <div className="p-10 text-center text-slate-500">
              <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
              Loading route data...
            </div>
          )}
        </div>
      </section>
    </div>
  );
}