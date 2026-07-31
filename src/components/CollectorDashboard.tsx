import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
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

type GarbageBin = {
  id: number;
  bin_code: string;
  location_name: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  current_status?: string | null;
  condition_status?: string | null;
  last_inspected_at?: string | null;
  is_active: number | boolean;
  purok_name?: string | null;
  barangay_name?: string | null;
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
};

type DashboardBin = GarbageBin & {
  request: CollectionRequest | null;
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

function normalizeStatus(value?: string | null): string {
  return String(value || "empty")
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
  return "normal";
}

export default function CollectorDashboard({
  setCurrentScreen,
}: CollectorDashboardProps) {
  const [bins, setBins] = useState<GarbageBin[]>([]);
  const [requests, setRequests] =
    useState<CollectionRequest[]>([]);
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
          : "Failed to load collector dashboard.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeRequestByBin = useMemo(() => {
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

  const dashboardBins = useMemo<DashboardBin[]>(
    () =>
      bins
        .filter((bin) => Number(bin.is_active) === 1)
        .map((bin) => ({
          ...bin,
          request: activeRequestByBin.get(bin.id) || null,
        }))
        .filter(
          (bin) =>
            needsCollection(bin) ||
            (bin.request && bin.request.status !== "completed"),
        )
        .sort((a, b) => {
          const order = {
            overflowing: 4,
            full: 3,
            scheduled: 2,
            normal: 1,
          };

          const rank = (bin: DashboardBin) => {
            const status = normalizeStatus(bin.current_status);
            if (status === "overflowing") return order.overflowing;
            if (status === "full") return order.full;
            if (isScheduledToday(bin)) return order.scheduled;
            return order.normal;
          };

          return rank(b) - rank(a);
        }),
    [bins, activeRequestByBin],
  );

  const stats = useMemo(() => {
    const activeBins = bins.filter(
      (bin) => Number(bin.is_active) === 1,
    );

    return {
      total: activeBins.length,
      scheduled: activeBins.filter(isScheduledToday).length,
      urgent: activeBins.filter(
        (bin) => normalizeStatus(bin.current_status) === "overflowing",
      ).length,
      completed: requests.filter(
        (request) => request.status === "completed",
      ).length,
    };
  }, [bins, requests]);

  const createTask = async (bin: DashboardBin) => {
    setUpdatingId(bin.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await apiRequest(
        "/api/collection-requests",
        {
          method: "POST",
          body: JSON.stringify({
            bin_id: bin.id,
            priority: priorityForBin(bin),
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
    bin: DashboardBin,
    status: "assigned" | "in_progress" | "completed",
  ) => {
    if (!bin.request) return;

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

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Collector Dashboard
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            Leader-registered bins and today&apos;s collection schedule
          </p>
        </div>

        <div className="flex gap-2">
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

          <button
            type="button"
            onClick={() => setCurrentScreen("route-map")}
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
            label: "Registered Bins",
            value: stats.total,
            icon: Package,
          },
          {
            label: "Scheduled Today",
            value: stats.scheduled,
            icon: CalendarDays,
          },
          {
            label: "Overflowing",
            value: stats.urgent,
            icon: AlertCircle,
          },
          {
            label: "Completed Tasks",
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
              Today&apos;s Collection Bins
            </h2>
            <p className="mt-1 text-xs text-emerald-100">
              Scheduled, full, and overflowing bins appear here automatically.
            </p>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
            {dashboardBins.length} bins
          </span>
        </div>

        <div className="divide-y">
          {dashboardBins.map((bin) => {
            const busy = updatingId === bin.id;
            const request = bin.request;

            return (
              <article
                key={bin.id}
                className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <MapPin className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900">
                        {bin.bin_code} — {bin.location_name}
                      </h3>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
                        {statusLabel(bin.current_status)}
                      </span>

                      {isScheduledToday(bin) && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                          Scheduled today
                        </span>
                      )}

                      {request && (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">
                          {statusLabel(request.status)}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      {bin.purok_name || "Unassigned purok"}
                      {bin.barangay_name
                        ? `, ${bin.barangay_name}`
                        : ""}
                    </p>

                    <p className="mt-2 text-xs font-bold text-slate-500">
                      {isScheduledToday(bin)
                        ? `${bin.schedule_day || "Today"}${
                            bin.schedule_start_time
                              ? ` • ${bin.schedule_start_time}`
                              : ""
                          }`
                        : "Marked by the Purok Leader for collection"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {!request && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => createTask(bin)}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
                    >
                      Create Task
                    </button>
                  )}

                  {request?.status === "pending" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateStatus(bin, "assigned")
                      }
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
                    >
                      Accept Task
                    </button>
                  )}

                  {request &&
                    ["approved", "assigned"].includes(
                      request.status,
                    ) && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          updateStatus(bin, "in_progress")
                        }
                        className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
                      >
                        Start Route
                      </button>
                    )}

                  {request?.status === "in_progress" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateStatus(bin, "completed")
                      }
                      className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Collected
                    </button>
                  )}
                </div>
              </article>
            );
          })}

          {!loading && dashboardBins.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
              <p className="font-black">
                No bins require collection today
              </p>
              <p className="mt-1 text-xs">
                Scheduled, full, or overflowing bins will appear here.
              </p>
            </div>
          )}

          {loading && (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
              Loading garbage bins...
            </div>
          )}
        </div>
      </section>
    </div>
  );
}