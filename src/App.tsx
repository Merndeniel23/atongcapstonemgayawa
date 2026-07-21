/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
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

import { AppStateProvider, useAppState } from './context/AppStateContext';

type Role = 'household' | 'collector' | 'leader' | 'admin';
type Screen = 'registration' | 'dashboard' | 'collector-tasks' | 'leader-dashboard' | 'admin-dashboard' | 'user-management' | 'members-list' | 'route-map' | 'schedule' | 'complaints' | 'payments' | 'notifications' | 'profile' | 'endorsements' | 'bin-inspections';

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
    activePushNotification,
    setActivePushNotification,
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

      {/* Slide-Down Custom Push Notification Reminder Banner */}
      <AnimatePresence>
        {activePushNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120 }}
            className="fixed top-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-slate-900 border border-slate-800 text-white rounded-[2rem] p-5 shadow-2xl z-[99999] flex flex-col gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <Bell className="w-5 h-5 text-white animate-ring" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    PUSH ALERT
                  </span>
                  <button 
                    onClick={() => setActivePushNotification(null)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs p-1 rounded-md hover:bg-slate-800 border-none bg-transparent"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="text-xs font-black text-white leading-tight uppercase tracking-tight">
                  {activePushNotification.title}
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                  {activePushNotification.body}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 border-t border-slate-800/60 pt-3.5">
              <button
                onClick={() => {
                  updateScheduleStatus(activePushNotification.scheduleId, 'Confirmed');
                  setActivePushNotification(null);
                }}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-none shadow-md"
              >
                Mark as Prepared
              </button>
              <button
                onClick={() => setActivePushNotification(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-none"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
