import {
  Building2,
  LogOut,
  Shield,
  Truck,
  User,
} from "lucide-react";
import type { AppRole } from "../context/AppStateContext";

interface HeaderProps {
  activeTab: string;
  onLogout: () => void;
  userRole: AppRole;
  onRoleChange?: (
    role: AppRole,
  ) => void;
}

function formatPageTitle(
  activeTab: string,
) {
  if (
    activeTab ===
    "super-admin-dashboard"
  ) {
    return "Municipal Dashboard";
  }

  if (
    activeTab ===
    "admin-dashboard"
  ) {
    return "Barangay Dashboard";
  }

  if (
    activeTab ===
    "leader-dashboard"
  ) {
    return "Purok Leader Dashboard";
  }

  if (
    activeTab ===
    "collector-tasks"
  ) {
    return "Collection Tasks";
  }

  return String(
    activeTab || "dashboard",
  )
    .split("-")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function getRoleLabel(
  role: AppRole,
) {
  switch (role) {
    case "super_admin":
      return "MUNICIPAL ADMINISTRATOR";
    case "admin":
      return "BARANGAY CAPTAIN";
    case "leader":
      return "PUROK LEADER";
    case "collector":
      return "GARBAGE COLLECTOR";
    default:
      return "CIVILIAN";
  }
}

function getRoleIcon(
  role: AppRole,
) {
  switch (role) {
    case "super_admin":
      return Building2;
    case "admin":
      return Shield;
    case "collector":
      return Truck;
    default:
      return User;
  }
}

export default function Header({
  activeTab,
  onLogout,
  userRole,
}: HeaderProps) {
  const RoleIcon =
    getRoleIcon(userRole);

  return (
    <header className="sticky top-0 z-10 flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex w-full items-center justify-between md:hidden">
        <h1 className="whitespace-nowrap text-base font-black text-slate-800">
          {formatPageTitle(
            activeTab,
          )}
        </h1>
      </div>

      <div className="hidden flex-1 md:block">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
          Smart Garbage Monitoring System
        </p>

        <h2 className="mt-0.5 text-lg font-black tracking-tight text-slate-800">
          {formatPageTitle(
            activeTab,
          )}
        </h2>
      </div>

      <div className="ml-auto flex w-full items-center justify-between gap-4 md:w-auto md:justify-end">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <RoleIcon className="h-4 w-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />

              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Account Active
              </span>
            </div>

            <p className="mt-0.5 text-xs font-black text-emerald-700">
              {getRoleLabel(
                userRole,
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-black text-slate-600 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}