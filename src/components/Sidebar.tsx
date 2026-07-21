import { ClipboardCheck, LayoutDashboard, Calendar, MessageSquare, CreditCard, Bell, User, LogOut, Map, Truck, ClipboardList, Shield, Settings, Users, Award } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  onLogout: () => void;
  role: 'household' | 'collector' | 'leader' | 'admin';
}

export default function Sidebar({ activeTab, onTabChange, onLogout, role }: SidebarProps) {
  const { userProfile, currentUser, notifications } = useAppState();
  const activeUser = currentUser || userProfile;
  const username = activeUser?.name || 'demo_resident';

  // Calculate dynamic unread notification count
  const unreadCount = notifications.filter(n => !n.readBy.includes(username)).length;

  const householdItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'schedule', icon: Calendar, label: 'Schedule' },
    { id: 'complaints', icon: MessageSquare, label: 'Complaints' },
    { id: 'payments', icon: CreditCard, label: 'Payments' },
    { id: 'endorsements', icon: Award, label: 'Endorsements' },
    { id: 'notifications', icon: Bell, label: 'Notifications', count: unreadCount },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const collectorItems = [
    { id: 'collector-tasks', icon: ClipboardList, label: 'Collection Tasks' },
    { id: 'route-map', icon: Map, label: 'Route Map' },
    { id: 'schedule', icon: Truck, label: 'Pickup Log' },
    { id: 'notifications', icon: Bell, label: 'Alerts', count: unreadCount },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const leaderItems = [
    { id: 'leader-dashboard', icon: LayoutDashboard, label: 'Leader HUD' },
    { id: 'bin-inspections', icon: ClipboardCheck, label: 'Bin Inspections' },
    { id: 'members-list', icon: User, label: 'Purok Members' },
    { id: 'endorsements', icon: Award, label: 'Endorsements' },
    { id: 'payments', icon: CreditCard, label: 'Verify Payments' },
    { id: 'complaints', icon: MessageSquare, label: 'Complaints & Tickets' },
    { id: 'schedule', icon: Calendar, label: 'Waste Logs' },
    { id: 'notifications', icon: Bell, label: 'System Alerts', count: unreadCount },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const adminItems = [
    { id: 'admin-dashboard', icon: Shield, label: 'Admin Panel' },
    { id: 'bin-inspections', icon: ClipboardCheck, label: 'Inspection Records' },
    { id: 'user-management', icon: Users, label: 'Manage Users' },
    { id: 'endorsements', icon: Award, label: 'Endorsements' },
    { id: 'payments', icon: CreditCard, label: 'Ledger Audit' },
    { id: 'complaints', icon: MessageSquare, label: 'Complaints & Tickets' },
    { id: 'route-map', icon: Map, label: 'Global Map' },
    { id: 'notifications', icon: Bell, label: 'Global Alerts', count: unreadCount },
    { id: 'profile', icon: Settings, label: 'Control Center' },
  ];

  const menuItems = role === 'collector' ? collectorItems : role === 'leader' ? leaderItems : role === 'admin' ? adminItems : householdItems;

  const getRoleLabel = () => {
    switch (role) {
      case 'household': return 'Household';
      case 'collector': return 'Collector';
      case 'leader': return 'Leader';
      case 'admin': return 'Admin';
      default: return 'User';
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#14532d] text-white h-screen sticky top-0 shrink-0 shadow-xl z-20 transition-all duration-300">
      <div className="p-6 flex items-center gap-3 mb-8 border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
          <User className="w-5 h-5 text-emerald-100" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
            {getRoleLabel()}: Welcome
          </p>
          <p className="font-extrabold text-sm text-white truncate max-w-[150px] mt-0.5" title={userProfile.name}>
            {userProfile.name}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-white/15 text-white font-semibold' 
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-rose-500/20 hover:text-rose-100 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
