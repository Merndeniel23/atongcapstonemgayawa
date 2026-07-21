import { Map as MapIcon, Navigation, Truck, Package, Clock, ShieldCheck, Check, CheckCircle2, Calendar, AlertCircle, Plus, MapPin, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppState } from '../context/AppStateContext';
import { useState, useEffect } from 'react';

interface CollectorDashboardProps {
  setCurrentScreen: (screen: any) => void;
}

export default function CollectorDashboard({ setCurrentScreen }: CollectorDashboardProps) {
  const { schedules, updateScheduleStatus } = useAppState();

  // State to make standard communal collection points interactive and synchronized with the MapView
  const [communalPoints, setCommunalPoints] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sg_communal_points') : null;
    return saved ? JSON.parse(saved) : [
      { id: 1, location: 'Purok 4 - Main Road', bins: 3, urgency: 'High', time: '10m away', collected: false, x: 30, y: 40, image: 'https://media.istockphoto.com/id/1323762998/photo/garbage-crisis-in-sector-1-bucharest.jpg?s=612x612&w=0&k=20&c=dlHXHjBYWnI2KMKIoeNNfXS35LypTQ9legUOz3-Iehw=', desc: 'Located near the community basketball court.' },
      { id: 2, location: 'Purok 1 - Barangay Hall', bins: 5, urgency: 'Medium', time: '25m away', collected: false, x: 65, y: 25, image: 'https://media.istockphoto.com/id/2151562183/photo/the-man-throwing-garbage-into-the-trash-bin.jpg?s=612x612&w=0&k=20&c=JFws0xs9pPNHDc5voGR0bOLO4SEEqY6yxzDW2KQrjXo=', desc: 'Located near the Barangay Hall crossing.' },
      { id: 3, location: 'Purok 7 - Market Area', bins: 8, urgency: 'Very High', time: '2m away', collected: false, x: 50, y: 70, image: 'https://media.istockphoto.com/id/2151575593/photo/trash-on-the-sidewalk.jpg?s=612x612&w=0&k=20&c=Ypy2z8Aj4CrI7TRonNlHdsttTZuLu4zeMpHk6nUdRSA=', desc: 'Located near the local pharmacy and fresh food market.' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('sg_communal_points', JSON.stringify(communalPoints));
  }, [communalPoints]);

  // Tab state for the collector task display
  const [activeTab, setActiveTab] = useState<'communal' | 'resident'>('resident'); // default to resident so they can immediately see the bookings!

  // Toggle communal collection point
  const handleCollectCommunal = (id: number) => {
    setCommunalPoints(prev =>
      prev.map(p => p.id === id ? { ...p, collected: !p.collected, urgency: !p.collected ? 'Collected' : 'High' } : p)
    );
  };

  // Calculations for dynamic stats matching the screenshot layout
  const completedSchedulesCount = schedules.filter(s => s.status === 'Completed').length;
  const completedCommunalCount = communalPoints.filter(p => p.collected).length;
  
  // Base values from screenshot: Total Pickups = 142, Completed Tasks = 8/12
  const dynamicTotalPickups = 142 + completedSchedulesCount + completedCommunalCount;
  
  // Calculate Avg Fill % dynamically based on uncollected bins
  const uncollectedBins = communalPoints.filter(p => !p.collected).reduce((acc, curr) => acc + curr.bins, 0);
  const pendingSchedules = schedules.filter(s => s.status !== 'Completed').length;
  const dynamicFillPercent = Math.max(20, Math.min(95, 78 - (completedCommunalCount * 8) - (completedSchedulesCount * 5) + (pendingSchedules * 3)));

  const dynamicCompletedRatio = `${8 + completedSchedulesCount + completedCommunalCount}/${12 + (schedules.length - 3) + (communalPoints.filter(p => p.collected).length)}`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight">Collector Dashboard</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">Live Garbage Dispatch & Verification HUD</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-3.5 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync: Online
          </div>
        </div>
      </header>

      {/* Hero Service Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Pickups', value: String(dynamicTotalPickups), sub: `+${12 + completedSchedulesCount + completedCommunalCount} today`, icon: Truck, color: 'emerald' },
          { label: 'Avg. Fill %', value: `${dynamicFillPercent}%`, sub: 'Across Area A', icon: Package, color: 'blue' },
          { label: 'Completed', value: dynamicCompletedRatio, sub: 'Tasks', icon: ShieldCheck, color: 'indigo' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
               <div>
                 <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                 <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
               </div>
               <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                 <stat.icon className="w-6 h-6" />
               </div>
            </div>
            <p className={`text-[10px] font-bold text-${stat.color}-600`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Task Section */}
      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 bg-[#059669] text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="font-bold flex items-center gap-2 text-lg">
              <Navigation className="w-5 h-5" />
              Active Dispatch Queue
            </h2>
            <p className="text-emerald-100 text-[10px] font-medium uppercase tracking-wider">Accept or complete pending resident and communal collections</p>
          </div>
          <button 
            onClick={() => setCurrentScreen('route-map')}
            className="text-xs bg-white text-emerald-600 font-extrabold px-4 py-2 rounded-full hover:bg-emerald-50 transition-all shadow-sm active:scale-95"
          >
            View Live Route Map
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1">
          <button
            onClick={() => setActiveTab('resident')}
            className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'resident' 
                ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Resident Bookings ({schedules.filter(s => s.status !== 'Completed').length})
          </button>
          <button
            onClick={() => setActiveTab('communal')}
            className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'communal' 
                ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            Communal Bins ({communalPoints.filter(p => !p.collected).length})
          </button>
        </div>
        
        {/* Dynamic List Display */}
        <div className="divide-y divide-slate-100 min-h-[300px]">
          <AnimatePresence mode="popLayout">
            {activeTab === 'resident' && (
              <div className="divide-y divide-slate-100">
                {schedules.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id} 
                    className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/70 transition-colors gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                        item.status === 'Confirmed' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <Truck className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-sm">{item.location}</h4>
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border border-emerald-100">
                            Household Booking
                          </span>
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                            item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-150' :
                            item.status === 'Confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-150' :
                            'bg-amber-50 text-amber-600 border-amber-150'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {item.date} • <Clock className="w-3.5 h-3.5 text-slate-400" /> {item.time}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Type: <span className="text-slate-700">{item.type}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {item.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => updateScheduleStatus(item.id, 'Confirmed')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 border-none cursor-pointer"
                          >
                            Accept & Route
                          </button>
                          <button
                            onClick={() => updateScheduleStatus(item.id, 'Completed')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 border-none cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        </>
                      )}
                      
                      {item.status === 'Confirmed' && (
                        <button
                          onClick={() => updateScheduleStatus(item.id, 'Completed')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 border-none cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          Complete Pickup
                        </button>
                      )}

                      {item.status === 'Upcoming' && (
                        <button
                          onClick={() => updateScheduleStatus(item.id, 'Completed')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 border-none cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      )}

                      {item.status === 'Completed' && (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-black uppercase tracking-wider">Collected</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {schedules.length === 0 && (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-bold text-sm">No Household Bookings Found</p>
                    <p className="text-xs text-slate-400">Residents haven't submitted any scheduled pickups yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'communal' && (
              <div className="divide-y divide-slate-100">
                {communalPoints.map((point) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={point.id} 
                    className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        point.collected ? 'bg-emerald-50 text-emerald-500' :
                        point.urgency === 'Very High' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'
                      }`}>
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-sm">{point.location}</h4>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                            Communal Barrel
                          </span>
                          {!point.collected && (
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                              point.urgency === 'Very High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              point.urgency === 'High' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-slate-50 text-slate-600 border border-slate-100'
                            }`}>
                              {point.urgency} Urgency
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{point.bins} Bins</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {point.collected ? 'Processed' : point.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!point.collected ? (
                        <>
                          <button 
                            onClick={() => setCurrentScreen('route-map')}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border-none cursor-pointer active:scale-95"
                          >
                            Nav Route
                          </button>
                          <button 
                            onClick={() => handleCollectCommunal(point.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm border-none cursor-pointer active:scale-95"
                          >
                            Collect Bins
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-black uppercase tracking-wider">Collected</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Map Preview Card */}
      <div 
        onClick={() => setCurrentScreen('route-map')}
        className="relative h-48 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl group cursor-pointer"
      >
        <img 
          src="https://media.istockphoto.com/id/578108630/photo/push-pins-on-a-road-map.jpg?s=612x612&w=0&k=20&c=Mf67L3jm7Ydq8FgJWGRiVJjFqpIwdZjBhjwPIB0Ba0E=" 
          alt="Map Preview" 
          className="w-full h-full object-cover filter brightness-75 group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
             <MapIcon className="w-6 h-6 text-emerald-600" />
             <span className="font-bold text-slate-900">Open Interactive Route Map</span>
          </div>
        </div>
      </div>
    </div>
  );
}
