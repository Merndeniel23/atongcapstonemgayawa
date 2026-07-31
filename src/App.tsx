/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell } from 'lucide-react';
import Registration from './components/Registration';
import Dashboard from './components/Dashboard';
import CollectorDashboard from './components/CollectorDashboard';
import LeaderDashboard from './components/LeaderDashboard';
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import MembersList from './components/MembersList';
import Schedule from './components/Schedule';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MapView from './components/MapView';
import PaymentPortal from './components/PaymentPortal';
import EndorsementManager from './components/EndorsementManager';
import ChatbotWidget from './components/ChatbotWidget';
import UserProfilePanel from './components/UserProfilePanel';

import ComplaintsPanel from './components/ComplaintsPanel';
import NotificationsPanel from './components/NotificationsPanel';
import BinInspections from './components/BinInspections';
import ManageGarbageBins from "./components/ManageGarbageBins";

import { AppStateProvider, useAppState } from './context/AppStateContext';

type Role = 'household' | 'collector' | 'leader' | 'admin';
type Screen =
  | 'registration'
  | 'dashboard'
  | 'collector-tasks'
  | 'leader-dashboard'
  | 'admin-dashboard'
  | 'user-management'
  | 'members-list'
  | 'route-map'
  | 'schedule'
  | 'complaints'
  | 'payments'
  | 'notifications'
  | 'profile'
  | 'endorsements'
  | 'bin-inspections'
  | 'garbage-bins';

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
    updateScheduleStatus
  } = useAppState();

  const handleLogout = () => {
    logoutUser();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-y-auto flex items-center justify-center relative w-full">
        <Registration />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <Sidebar 
        activeTab={currentScreen as any} 
        onTabChange={(tab: any) => setCurrentScreen(tab)} 
        onLogout={handleLogout}
        role={userRole}
      />

      <div className="flex-1 flex flex-col min-h-0 bg-[#F1F5F9]/30">
        <Header 
          activeTab={currentScreen as any} 
          onLogout={handleLogout} 
          userRole={userRole} 
          onRoleChange={() => {}} 
        />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {currentScreen === 'dashboard' && <Dashboard setCurrentScreen={(tab: any) => setCurrentScreen(tab)} />}
              {currentScreen === 'collector-tasks' && <CollectorDashboard setCurrentScreen={(tab: any) => setCurrentScreen(tab)} />}
              {currentScreen === 'leader-dashboard' && <LeaderDashboard setCurrentScreen={(tab: any) => setCurrentScreen(tab)} />}
              {currentScreen === 'admin-dashboard' && <AdminDashboard setCurrentScreen={(tab: any) => setCurrentScreen(tab)} />}
              {currentScreen === 'user-management' && <UserManagement />}
              {currentScreen === 'members-list' && <MembersList />}
              {currentScreen === 'bin-inspections' && <BinInspections />}
              {currentScreen === 'garbage-bins' && <ManageGarbageBins />}
              {currentScreen === 'route-map' && <MapView />}
              {currentScreen === 'schedule' && <Schedule />}
              {currentScreen === 'complaints' && <ComplaintsPanel role={userRole} />}
              {currentScreen === 'payments' && <PaymentPortal role={userRole} />}
              {currentScreen === 'endorsements' && <EndorsementManager role={userRole} />}
              {currentScreen === 'notifications' && <NotificationsPanel role={userRole} />}
              {currentScreen === 'profile' && <UserProfilePanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden">
        <BottomNav activeTab={currentScreen as any} onTabChange={(tab: any) => setCurrentScreen(tab)} role={userRole} />
      </div>

      {/* Persistent AI Chat Guide Assistant */}
      <ChatbotWidget />
    </div>
  );
}
