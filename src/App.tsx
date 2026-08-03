/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from "motion/react";

import Registration from "./components/Registration";
import Dashboard from "./components/Dashboard";
import CollectorDashboard from "./components/CollectorDashboard";
import LeaderDashboard from "./components/LeaderDashboard";
import AdminDashboard from "./components/AdminDashboard";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import UserManagement from "./components/UserManagement";
import MembersList from "./components/MembersList";
import Schedule from "./components/Schedule";
import BottomNav from "./components/BottomNav";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import MapView from "./components/MapView";
import PaymentPortal from "./components/PaymentPortal";
import EndorsementManager from "./components/EndorsementManager";
import ChatbotWidget from "./components/ChatbotWidget";
import UserProfilePanel from "./components/UserProfilePanel";
import ComplaintsPanel from "./components/ComplaintsPanel";
import NotificationsPanel from "./components/NotificationsPanel";
import BinInspections from "./components/BinInspections";
import ManageGarbageBins from "./components/ManageGarbageBins";
import ChangeInitialPassword from "./components/ChangeInitialPassword";

import {
  AppStateProvider,
  useAppState,
} from "./context/AppStateContext";

export type Role =
  | "household"
  | "collector"
  | "leader"
  | "admin"
  | "super_admin";

export type Screen =
  | "registration"
  | "dashboard"
  | "collector-tasks"
  | "leader-dashboard"
  | "admin-dashboard"
  | "super-admin-dashboard"
  | "user-management"
  | "members-list"
  | "route-map"
  | "schedule"
  | "complaints"
  | "payments"
  | "notifications"
  | "profile"
  | "endorsements"
  | "bin-inspections"
 | "garbage-bins"
| "change-initial-password";

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

function AppContent() {
  const {
    isLoggedIn,
    userRole,
    currentScreen,
    setCurrentScreen,
    logoutUser,
  } = useAppState();

  const handleLogout = () => {
    logoutUser();
  };

  if (!isLoggedIn) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-[#F8FAFC] font-sans text-slate-900">
      <Registration />
    </div>
  );
}

if (currentScreen === "change-initial-password") {
  return <ChangeInitialPassword />;
}
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-slate-900 md:flex-row">
      <Sidebar
        activeTab={currentScreen as any}
        onTabChange={(tab: any) => setCurrentScreen(tab)}
        onLogout={handleLogout}
        role={userRole}
      />

      <div className="flex min-h-0 flex-1 flex-col bg-[#F1F5F9]/30">
        <Header
          activeTab={currentScreen as any}
          onLogout={handleLogout}
          userRole={userRole as any}
        />

        <main className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {currentScreen === "dashboard" && (
                <Dashboard setCurrentScreen={setCurrentScreen as any} />
              )}

              {currentScreen === "collector-tasks" && (
                <CollectorDashboard setCurrentScreen={setCurrentScreen as any} />
              )}

              {currentScreen === "leader-dashboard" && (
                <LeaderDashboard setCurrentScreen={setCurrentScreen as any} />
              )}

              {currentScreen === "admin-dashboard" && (
                <AdminDashboard setCurrentScreen={setCurrentScreen as any} />
              )}

              {currentScreen === "super-admin-dashboard" && (
                <SuperAdminDashboard setCurrentScreen={setCurrentScreen as any} />
              )}

              {currentScreen === "user-management" && <UserManagement />}
              {currentScreen === "members-list" && <MembersList />}
              {currentScreen === "bin-inspections" && <BinInspections />}
              {currentScreen === "garbage-bins" && <ManageGarbageBins />}
              {currentScreen === "route-map" && <MapView />}
              {currentScreen === "schedule" && <Schedule />}
              {currentScreen === "complaints" && (
                <ComplaintsPanel role={userRole as any} />
              )}
              {currentScreen === "payments" && (
                <PaymentPortal role={userRole as any} />
              )}
              {currentScreen === "endorsements" && (
                <EndorsementManager role={userRole as any} />
              )}
              {currentScreen === "notifications" && (
                <NotificationsPanel role={userRole as any} />
              )}
              {currentScreen === "profile" && <UserProfilePanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <div className="md:hidden">
        <BottomNav
          activeTab={currentScreen as any}
          onTabChange={(tab: any) => setCurrentScreen(tab)}
          role={userRole as any}
        />
      </div>

      <ChatbotWidget />
    </div>
  );
}