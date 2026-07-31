import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Package,
  RefreshCw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

interface CollectorDashboardProps {
  setCurrentScreen: (screen: any) => void;
}

type CollectionRequest = {
  id: number;
  bin_id: number;
  inspection_id?: number | null;
  requested_by: number;
  priority: "low" | "normal" | "high" | "urgent";
  status:
    | "pending"
    | "approved"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled";
  reason?: string | null;
  assigned_collector_id?: number | null;
  requested_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  bin_code: string;
  location_name: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  current_status?: string | null;
  condition_status?: string | null;
  purok_name?: string | null;
  barangay_name?: string | null;
  requested_by_name?: string | null;
  assigned_collector_name?: string | null;
};

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

export default function CollectorDashboard({
  setCurrentScreen,
}: CollectorDashboardProps) {
  const [requests, setRequests] =
    useState<CollectionRequest[]>([]);

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

  const updateStatus = async (
    requestId: number,
    status:
      | "assigned"
      | "in_progress"
      | "completed",
  ) => {
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

  const stats = useMemo(() => {
    const active = requests.filter(
      (request) =>
        !["completed", "cancelled"].includes(
          request.status,
        ),
    ).length;

    const completed = requests.filter(
      (request) =>
        request.status === "completed",
    ).length;

    const urgent = requests.filter(
      (request) =>
        request.priority === "urgent" &&
        request.status !== "completed",
    ).length;

    return {
      total: requests.length,
      active,
      completed,
      urgent,
    };
  }, [requests]);

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Collector Dashboard
          </h1>

          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            Database-connected collection requests
          </p>
        </div>

        <div className="flex gap-2">
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

          <button
            type="button"
            onClick={() =>
              setCurrentScreen("route-map")
            }
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white"
          >
            <Navigation className="h-4 w-4" />
            Open Route Map
          </button>
        </div>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Requests",
            value: stats.total,
            icon: Package,
          },
          {
            label: "Active Queue",
            value: stats.active,
            icon: Truck,
          },
          {
            label: "Urgent",
            value: stats.urgent,
            icon: AlertCircle,
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: ShieldCheck,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">
                  {item.label}
                </p>

                <p className="mt-1 text-3xl font-black text-slate-900">
                  {item.value}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <item.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="flex flex-col gap-2 bg-emerald-700 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Truck className="h-5 w-5" />
              Active Collection Queue
            </h2>

            <p className="mt-1 text-xs text-emerald-100">
              Accept, start, and complete assigned collection requests.
            </p>
          </div>

          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
            {stats.active} active
          </span>
        </div>

        <div className="divide-y">
          {requests.map((request) => {
            const busy =
              updatingId === request.id;

            return (
              <article
                key={request.id}
                className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <MapPin className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900">
                        {request.bin_code} —{" "}
                        {request.location_name}
                      </h3>

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
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      {request.purok_name ||
                        "Unassigned purok"}
                      {request.barangay_name
                        ? `, ${request.barangay_name}`
                        : ""}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {request.reason ||
                        "No additional reason provided."}
                    </p>

                    <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      Requested:{" "}
                      {formatDate(
                        request.requested_at ||
                          request.created_at,
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {request.status ===
                    "pending" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "assigned",
                        )
                      }
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
                    >
                      Accept Request
                    </button>
                  )}

                  {[
                    "approved",
                    "assigned",
                  ].includes(
                    request.status,
                  ) && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "in_progress",
                        )
                      }
                      className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
                    >
                      Start Route
                    </button>
                  )}

                  {request.status ===
                    "in_progress" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "completed",
                        )
                      }
                      className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Collected
                    </button>
                  )}

                  {request.status ===
                    "completed" && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black uppercase text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Collected
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {!loading &&
            requests.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-300" />

                <p className="font-black">
                  No collection requests found
                </p>

                <p className="mt-1 text-xs">
                  New collection requests will appear here.
                </p>
              </div>
            )}

          {loading && (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
              Loading collection requests...
            </div>
          )}
        </div>
      </section>
    </div>
  );
}