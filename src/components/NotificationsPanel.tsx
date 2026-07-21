import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppState } from '../context/AppStateContext';
import { 
  Bell, 
  Megaphone, 
  Plus, 
  Clock, 
  ShieldAlert, 
  Send,
  Info,
  Sparkles,
  Leaf,
  Calendar,
  X,
  Check,
  Volume2,
  Trash2,
  Lock,
  Compass
} from 'lucide-react';

interface Bulletin {
  id: string;
  title: string;
  priority: 'emergency' | 'schedule' | 'notice';
  message: string;
  audience: string;
  author: string;
  date: string;
  time: string;
  purokTarget?: string;
  readBy: string[]; // usernames that have acknowledged it
}

const PRESET_BULLETINS: Bulletin[] = [
  {
    id: 'BLL-819',
    title: 'Pre-Disaster Storm Warning: Collection Delay',
    priority: 'emergency',
    message: 'Due to severe weather warnings in Northern Luzon, our municipal waste hauling schedules may experience a 2-hour delay. Residents are advised to keep garbage lids locked to prevent scattering in strong winds.',
    audience: 'Everyone (Barangay Central)',
    author: 'Admin Central',
    date: 'May 27, 2026',
    time: '08:15 AM',
    readBy: []
  },
  {
    id: 'BLL-402',
    title: 'May 2026 Clearance & Environmental Target',
    priority: 'schedule',
    message: 'Friendly notice to all Purok 4 residents! Contribution ledgers for May must be verified to release Cleanliness digital endorsements. Please upload GCash screenshot stamps via the Payments tab.',
    audience: 'Purok 4 Residents Only',
    author: 'Leader Mark',
    date: 'May 26, 2026',
    time: '03:45 PM',
    purokTarget: 'Purok 4',
    readBy: ['demo_resident']
  },
  {
    id: 'BLL-311',
    title: 'New EcoTrack Smart Bin Deployments',
    priority: 'notice',
    message: 'Purok Leaders have completed physical inspections of four communal garbage bins on Maple Street. Full-bin findings were forwarded to collectors for action.',
    audience: 'Waste Collectors & Leaders',
    author: 'Sanitation Sinks Panel',
    date: 'May 24, 2026',
    time: '11:00 AM',
    readBy: []
  }
];

interface NotificationsPanelProps {
  role: 'household' | 'collector' | 'leader' | 'admin';
}

export default function NotificationsPanel({ role }: NotificationsPanelProps) {
  const { currentUser, userProfile } = useAppState();
  const activeUser = currentUser || userProfile;
  const username = activeUser?.name || 'demo_resident';

  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'emergency'>('all');
  
  // Compose states
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'emergency' | 'schedule' | 'notice'>('notice');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('Everyone (Barangay Central)');
  const [targetPurok, setTargetPurok] = useState('All Puroks');
  const [validationError, setValidationError] = useState('');

  // Load bulletins
  useEffect(() => {
    const saved = localStorage.getItem('sg_municipal_bulletins');
    if (saved) {
      try {
        setBulletins(JSON.parse(saved));
      } catch (e) {
        setBulletins(PRESET_BULLETINS);
      }
    } else {
      localStorage.setItem('sg_municipal_bulletins', JSON.stringify(PRESET_BULLETINS));
      setBulletins(PRESET_BULLETINS);
    }
  }, []);

  const saveBulletins = (updatedList: Bulletin[]) => {
    setBulletins(updatedList);
    localStorage.setItem('sg_municipal_bulletins', JSON.stringify(updatedList));
  };

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setValidationError('Please specify a title and complete explanation text.');
      return;
    }

    const newRecord: Bulletin = {
      id: `BLL-${Math.floor(100 + Math.random() * 900)}`,
      title,
      priority,
      message,
      audience: targetPurok === 'All Puroks' ? audience : `${targetPurok} Only`,
      author: role === 'leader' ? 'Purok Leader' : 'Barangay Admin',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      purokTarget: targetPurok === 'All Puroks' ? undefined : targetPurok,
      readBy: []
    };

    const updated = [newRecord, ...bulletins];
    saveBulletins(updated);

    // Reset draft fields
    setTitle('');
    setMessage('');
    setValidationError('');
    setShowCompose(false);
  };

  const handleMarkAsRead = (id: string) => {
    const updated = bulletins.map(b => {
      if (b.id === id) {
        const readSet = new Set(b.readBy);
        readSet.add(username); // current logged-in resident
        return { ...b, readBy: Array.from(readSet) };
      }
      return b;
    });
    saveBulletins(updated);
  };

  const handleMarkAllRead = () => {
    const updated = bulletins.map(b => {
      const readSet = new Set(b.readBy);
      readSet.add(username);
      return { ...b, readBy: Array.from(readSet) };
    });
    saveBulletins(updated);
  };

  const handleDeleteBulletin = (id: string) => {
    const updated = bulletins.filter(b => b.id !== id);
    saveBulletins(updated);
  };

  // Filter criteria logic
  const filteredBulletins = bulletins.filter(b => {
    // If emergency filter is active
    if (activeFilter === 'emergency' && b.priority !== 'emergency') return false;
    
    // If unread filter is active
    if (activeFilter === 'unread' && b.readBy.includes(username)) return false;

    // Audience isolation rules
    if (role === 'collector') {
      // Driver sees global notices or crew-specific tags
      if (b.audience.includes('Purok') && !b.audience.includes('Collectors')) {
        return false;
      }
    }

    if (role === 'household') {
      // Household Resident only sees their targeted purok values or general announcements
      if (b.purokTarget && b.purokTarget !== 'Purok 4') {
        return false;
      }
    }

    return true;
  });

  const getPriorityAccent = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return {
          bg: 'bg-rose-50 border-rose-100 hover:border-rose-250',
          badge: 'bg-rose-500 text-white',
          text: 'text-rose-700',
          label: '🚨 General Emergency'
        };
      case 'schedule':
        return {
          bg: 'bg-amber-50 border-amber-105 hover:border-amber-250',
          badge: 'bg-amber-505 text-white bg-amber-600',
          text: 'text-amber-800',
          label: '📅 Schedule Update'
        };
      case 'notice':
      default:
        return {
          bg: 'bg-[#ECFDF5] border-[#D1FAE5] hover:border-[#10B981]',
          badge: 'bg-emerald-600 text-white',
          text: 'text-emerald-800',
          label: '📢 Official Notice'
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20 md:pb-0">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-[10px] uppercase tracking-[0.2em]">
            <Megaphone className="w-3.5 h-3.5" />
            Barangay Broadcasters
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Alerts & Notices</h1>
        </div>

        {/* Action triggers depending on role */}
        <div className="flex items-center gap-2.5">
          {role !== 'household' && role !== 'collector' ? (
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-2xl shadow-md transition-all border-none cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Broadcast Bulletin</span>
            </button>
          ) : (
            <button
              onClick={handleMarkAllRead}
              className="px-4.5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-[#1E293B] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Acknowledge All Open Alerts
            </button>
          )}
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex gap-2.5 bg-slate-100 p-1.5 rounded-2xl max-w-sm">
        {(['all', 'unread', 'emergency'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex-1 text-center py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeFilter === f 
                ? 'bg-white shadow text-slate-900' 
                : 'text-slate-450 hover:text-slate-650'
            }`}
          >
            {f === 'all' ? 'All Alerts' : f === 'unread' ? 'Unacknowledged' : 'Critical'}
          </button>
        ))}
      </div>

      {/* EMERGENCY HIGHLIGHT RIBBON */}
      {bulletins.some(b => b.priority === 'emergency' && !b.readBy.includes(username)) && (
        <div className="bg-gradient-to-r from-rose-500 to-red-600 rounded-[2rem] p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg shadow-rose-950/15">
          <div className="space-y-1.5 flex-1">
            <span className="bg-white/20 text-white font-extrabold text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-md">
              URGENT BROADCAST ACTIVE
            </span>
            <p className="text-sm font-black leading-tight text-white/95">
              Refuse Collectors have modified route guidelines due to incoming high winds. Securing bin lids is strictly requested.
            </p>
          </div>
          <button
            onClick={() => {
              const typh = bulletins.find(b => b.priority === 'emergency');
              if (typh) handleMarkAsRead(typh.id);
            }}
            className="px-5 py-3.5 bg-white text-rose-700 hover:bg-rose-50 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow border-none text-nowrap"
          >
            Acknowledge Danger Alert
          </button>
        </div>
      )}

      {/* BULLETINS LIST BOARD */}
      <div className="space-y-4">
        {filteredBulletins.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-black text-slate-700 uppercase tracking-wide">Board Up-To-Date</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              No bulletin updates matching your current workspace. Unread announcements or critical reports will propagate here in real-time.
            </p>
          </div>
        ) : (
          filteredBulletins.map((item) => {
            const meta = getPriorityAccent(item.priority);
            const isUnread = !item.readBy.includes(username);

            return (
              <motion.div
                key={item.id}
                layout
                className={`p-6 rounded-[2.2rem] border transition-all ${meta.bg} flex flex-col justify-between shadow-sm relative overflow-hidden`}
              >
                {/* Unread dot flash */}
                {isUnread && (
                  <span className="absolute top-4 left-4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pl-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${meta.badge}`}>
                        {meta.label}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">
                        {item.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest bg-white/60 px-2 py-0.5 rounded-sm border border-slate-200">
                        Target: {item.audience}
                      </span>
                      {role !== 'household' && role !== 'collector' && (
                        <button
                          onClick={() => handleDeleteBulletin(item.id)}
                          className="p-1.5 text-slate-450 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Trash alert"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug pl-3">
                    {item.title}
                  </h3>

                  <p className="text-xs font-semibold text-slate-650 leading-relaxed pl-3 max-w-4xl text-slate-500">
                    {item.message}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 pl-3">
                  <div className="flex gap-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">
                    <span>Issued: <span className="font-bold text-slate-800">{item.author}</span></span>
                    <span>Date: <span className="font-bold text-slate-600">{item.date} at {item.time}</span></span>
                  </div>

                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors border-none cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Acknowledge
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* COMPOSE BULLETIN POPUP */}
      <AnimatePresence>
        {showCompose && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-slate-100"
            >
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Broadcast Bulletin</h2>
              <p className="text-xs text-slate-500 mb-6 font-semibold">Deploy notification updates globally to Barangay environmental members.</p>

              {validationError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold rounded-xl text-xs flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleComposeSubmit} className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block ml-1">Annnouncement Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Schedule Update or Street Cleansings"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-semibold text-slate-800"
                  />
                </div>

                {/* Priority Selection */}
                <div className="grid grid-cols-3 gap-3">
                  {(['emergency', 'schedule', 'notice'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                        priority === p 
                          ? 'bg-slate-900 text-white shadow' 
                          : 'bg-slate-100 text-slate-550 border border-transparent'
                      }`}
                    >
                      {p === 'emergency' ? '🚨 Hazard' : p === 'schedule' ? '📅 Schedule' : '📢 General'}
                    </button>
                  ))}
                </div>

                {/* Target Audience selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block ml-1">Audience Scope</label>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-extrabold text-slate-800 appearance-none cursor-pointer"
                    >
                      <option>Everyone (Barangay Central)</option>
                      <option>Only Waste Collector Operators</option>
                      <option>Residents and Leaders Only</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block ml-1">Barangay Sector limit</label>
                    <select
                      value={targetPurok}
                      onChange={(e) => setTargetPurok(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-extrabold text-slate-800 appearance-none cursor-pointer"
                    >
                      <option value="All Puroks">All Puroks</option>
                      {Array.from({ length: 9 }, (_, i) => `Purok ${i + 1}`).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Main Message text info */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block ml-1">Bulletin Content Message</label>
                  <textarea
                    rows={4}
                    placeholder="Outline safety measures, specific guidelines or pickup delays clearly..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-semibold text-slate-800"
                  />
                </div>

                {/* Submits */}
                <div className="pt-4 flex gap-3 text-xs font-black uppercase tracking-widest justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="px-6 py-3.5 text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl cursor-pointer shadow-md border-none flex items-center gap-15"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast Notice</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
