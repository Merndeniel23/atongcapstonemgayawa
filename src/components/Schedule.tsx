import { Calendar as CalendarIcon, Clock, ChevronRight, Truck, Camera, X, Image as ImageIcon, BellRing, Sparkles } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useState } from 'react';

export default function Schedule() {
  const { 
    schedules, 
    userRole, 
    currentUser, 
    userProfile,
    automatedRemindersEnabled,
    setAutomatedRemindersEnabled,
    pushNotificationChannel,
    setPushNotificationChannel,
    triggerAutomatedReminder
  } = useAppState();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [simulationFeedback, setSimulationFeedback] = useState<string | null>(null);

  const activeUser = currentUser || userProfile;
  const displayZone = activeUser?.communalZone || 'Purok 4 communal zone';

  const schedulesToDisplay = schedules;

  const handleSimulateReminder = () => {
    // Find the nearest upcoming schedule
    const nearestUpcoming = schedulesToDisplay.find(s => s.status !== 'Completed') || schedulesToDisplay[0];
    
    if (nearestUpcoming) {
      triggerAutomatedReminder(nearestUpcoming);
      setSimulationFeedback(`Simulated 1-Hour Warning for "${nearestUpcoming.type}"!`);
      setTimeout(() => setSimulationFeedback(null), 5000);
    } else {
      setSimulationFeedback('No active schedules found to simulate reminders!');
      setTimeout(() => setSimulationFeedback(null), 5000);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pickup Schedule & Logs</h1>
        <p className="text-slate-500 text-sm">Monitor garbage collection timelines and photo verifications</p>
      </header>

      {/* Automated 1-Hour Prior Push Notification Reminders Settings Card */}
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-[2.2rem] p-6 md:p-8 shadow-xl border border-emerald-950 space-y-6 relative overflow-hidden mb-6">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-300">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.25em] block mb-0.5">Automated Despatch</span>
              <h2 className="text-lg font-black text-white tracking-tight leading-tight">1-Hour Pickup Reminders</h2>
              <p className="text-[11px] text-emerald-200/80 font-medium mt-1 leading-relaxed max-w-md">
                Sends automatic push notifications and logs a warning 1 hour before scheduled collections start in your Purok communal zone.
              </p>
            </div>
          </div>
          
          {/* Toggle Switch */}
          <div className="flex items-center gap-3 bg-emerald-950/40 p-2.5 rounded-2xl border border-white/5 w-fit shrink-0">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">
              {automatedRemindersEnabled ? 'ACTIVE' : 'DISABLED'}
            </span>
            <button
              type="button"
              onClick={() => setAutomatedRemindersEnabled(!automatedRemindersEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                automatedRemindersEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  automatedRemindersEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {automatedRemindersEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* Delivery Channel Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block">
                Notification Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'both', label: 'All Modes' },
                  { id: 'in_app', label: 'In-App Only' },
                  { id: 'browser', label: 'Web Push' }
                ].map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setPushNotificationChannel(ch.id as any)}
                    className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      pushNotificationChannel === ch.id 
                        ? 'bg-emerald-500 border-emerald-400 text-white font-black shadow-md' 
                        : 'bg-emerald-950/50 border-white/10 text-emerald-200 hover:bg-emerald-900/40'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tester Simulator button */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block">
                Demonstration & Verification
              </label>
              <div className="relative">
                <button
                  onClick={handleSimulateReminder}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Simulate 1-Hour Prior Alert
                </button>
                {simulationFeedback && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-2 text-center text-[10px] text-emerald-300 font-bold animate-pulse">
                    {simulationFeedback}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mini Calendar Mock */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900 text-sm">October 2026</h3>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <button className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-slate-300 py-1">{day}</div>
          ))}
          {[...Array(31)].map((_, i) => (
            <div 
              key={i} 
              className={`text-center py-2 text-xs rounded-xl font-medium cursor-pointer transition-colors ${
                i + 1 === 24 ? 'bg-emerald-500 text-white font-bold' : 
                [24, 25, 27].includes(i + 1) ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-500" />
          Timeline & Records
        </h2>

        <div className="space-y-3">
          {schedulesToDisplay.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-emerald-200 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                  item.status === 'Confirmed' || item.status === 'Upcoming' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'
                }`}>
                  <Truck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{item.type}</span>
                    {item.proofPhotoUrl && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1 border border-emerald-200">
                        <Camera className="w-2.5 h-2.5" />
                        With Photo Proof
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.date}</h4>
                  <p className="text-[10px] text-slate-500">{item.time} • <span className="font-bold text-slate-400">{item.location}</span></p>
                  
                  {/* Photo Proof preview container */}
                  {item.proofPhotoUrl && (
                    <div className="mt-3.5 flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 w-fit">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-inner border border-slate-200 shrink-0">
                        <img 
                          src={item.proofPhotoUrl} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          alt="Proof preview" 
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Collector Verification</p>
                        <button 
                          onClick={() => setSelectedPhoto(item.proofPhotoUrl || null)}
                          className="text-[11px] font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Inspect Live Photo Proof
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-150' :
                  item.status === 'Confirmed' || item.status === 'Upcoming' ? 'bg-emerald-500 text-white border-emerald-600' :
                  item.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-150' :
                  'bg-slate-50 text-slate-500 border-slate-150'
                }`}>
                  {item.status}
                </span>
                <div className="text-slate-300 group-hover:text-emerald-500 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
          {schedulesToDisplay.length === 0 && (
            <p className="text-center py-12 text-slate-450 font-bold uppercase text-xs">No schedules booked.</p>
          )}
        </div>
      </div>

      <div className="mt-8 p-6 bg-emerald-50 rounded-[40px] border border-emerald-100 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-emerald-900 font-bold mb-1">Set Recurring</h3>
          <p className="text-emerald-700 text-xs mb-4">Automate your pickups based on bin capacity alerts.</p>
          <button className="px-6 py-2 bg-white text-emerald-600 font-bold rounded-full text-xs shadow-sm shadow-emerald-900/5 active:scale-95 transition-all">
            Configure Now
          </button>
        </div>
        <CalendarIcon className="absolute -bottom-4 -right-4 w-32 h-32 text-emerald-100/50 -rotate-12" />
      </div>

      {/* Proof Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-6 max-w-lg w-full shadow-2xl border border-slate-150 relative">
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors border-none cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  Live Photo Verification
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Submitted by Carlos Collector on Arrived</p>
              </div>
              <div className="aspect-video w-full rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-950">
                <img 
                  src={selectedPhoto} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  alt="High-fidelity proof" 
                />
              </div>
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs font-medium leading-relaxed">
                <strong>Status: Verified & Audited</strong>. This image was geo-tagged and timestamped instantly when Carlos arrived at the target point coordinates.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
