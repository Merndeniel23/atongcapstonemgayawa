import { LogOut } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onLogout: () => void;
  userRole: 'household' | 'collector' | 'leader' | 'admin';
  onRoleChange?: (role: 'household' | 'collector' | 'leader' | 'admin') => void;
}

export default function Header({ activeTab, onLogout, userRole }: HeaderProps) {
  const getRoleLabel = () => {
    switch (userRole) {
      case 'household': return 'HOUSEHOLD';
      case 'collector': return 'COLLECTOR';
      case 'leader': return 'PUROK LEADER';
      case 'admin': return 'SYSTEM ADMIN';
      default: return 'USER';
    }
  };

  return (
    <header className="py-4 px-4 md:px-6 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-10 shrink-0 shadow-sm">
      {/* Mobile Title View */}
      <div className="flex items-center justify-between md:hidden w-full">
        <h1 className="text-base font-black text-slate-800 whitespace-nowrap">
          {(activeTab || '').split('-').map(w => w ? (w.charAt(0).toUpperCase() + w.slice(1)) : '').join(' ')}
        </h1>
      </div>

      {/* Centered Desktop Title */}
      <div className="hidden md:block flex-1 text-center md:text-left">
        <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">
          Smart Garbage Monitoring System
        </h2>
      </div>

      {/* Right side status and Logout */}
      <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto ml-auto">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-bold text-slate-650 uppercase tracking-wider">
            Account Active | <span className="text-emerald-600 font-black">{getRoleLabel()}</span>
          </span>
        </div>
        
        <button 
          onClick={onLogout}
          className="px-3.5 py-1.5 border border-slate-250 rounded-xl text-xs font-black text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
