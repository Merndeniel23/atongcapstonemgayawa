import { Calendar as CalendarIcon, Clock, ChevronRight, Truck, Camera, X } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useMemo, useState } from 'react';

export default function Schedule() {
  const { 
    schedules, 
    userRole, 
    currentUser, 
    userProfile,
    updateScheduleStatus,
    setCurrentScreen
  } = useAppState();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells: Array<number | null> = [];

    for (let index = 0; index < firstDay; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(day);
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [visibleMonth]);

  const isToday = (day: number) =>
    today.getFullYear() === visibleMonth.getFullYear() &&
    today.getMonth() === visibleMonth.getMonth() &&
    today.getDate() === day;

  const hasScheduleOnDay = (day: number) =>
    schedulesToDisplay.some((item) => {
      const parsed = new Date(item.date);

      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.getFullYear() === visibleMonth.getFullYear() &&
        parsed.getMonth() === visibleMonth.getMonth() &&
        parsed.getDate() === day
      );
    });

  const goToPreviousMonth = () => {
    setVisibleMonth(
      new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() - 1,
        1
      )
    );
  };

  const goToNextMonth = () => {
    setVisibleMonth(
      new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() + 1,
        1
      )
    );
  };

  const activeUser = currentUser || userProfile;
  const displayZone = activeUser?.communalZone || 'Purok 4 communal zone';

  const schedulesToDisplay = schedules;

  return (
    <div className="space-y-6 pb-20">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pickup Schedule & Logs</h1>
        <p className="text-slate-500 text-sm">Monitor garbage collection timelines and photo verifications</p>
      </header>


      {/* Dynamic calendar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900 text-sm">
            {visibleMonth.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </h3>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50"
              aria-label="Previous month"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>

            <button
              type="button"
              onClick={goToNextMonth}
              className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div
              key={`${day}-${i}`}
              className="text-center text-[10px] font-bold text-slate-300 py-1"
            >
              {day}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="py-2" />;
            }

            const todayCell = isToday(day);
            const scheduledCell = hasScheduleOnDay(day);

            return (
              <div
                key={`${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}-${day}`}
                className={`relative text-center py-2 text-xs rounded-xl font-medium transition-colors ${
                  todayCell
                    ? 'bg-emerald-500 text-white font-bold shadow-sm ring-2 ring-emerald-100'
                    : scheduledCell
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {day}

                {scheduledCell && !todayCell && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-500" />
          Timeline & Records
        </h2>

        <div className="space-y-3">
          {schedulesToDisplay.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedSchedule(item)}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-emerald-200 transition-colors cursor-pointer"
            >
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
                          onClick={(e) => { e.stopPropagation(); setSelectedPhoto(item.proofPhotoUrl || null); }}
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

      {/* Schedule detail modal */}
      {selectedSchedule && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-6 max-w-2xl w-full shadow-2xl border border-slate-150 relative">
            <button 
              onClick={() => setSelectedSchedule(null)}
              className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors border-none cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] font-black text-emerald-500">Schedule Detail</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">{selectedSchedule.type}</h3>
                  <p className="text-sm text-slate-500 mt-1">Detailed information for the selected pickup timeline item.</p>
                </div>
                <span className={`px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] ${
                  selectedSchedule.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                  selectedSchedule.status === 'Confirmed' || selectedSchedule.status === 'Upcoming' ? 'bg-emerald-500 text-white' :
                  selectedSchedule.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {selectedSchedule.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-black mb-3">Schedule</p>
                  <p className="text-sm font-bold text-slate-900">{selectedSchedule.date}</p>
                  <p className="text-sm text-slate-500">{selectedSchedule.time}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-black mb-3">Location</p>
                  <p className="text-sm font-bold text-slate-900">{selectedSchedule.location}</p>
                  <p className="text-sm text-slate-500">{displayZone}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-700 font-black mb-3">Audience</p>
                  <p className="text-sm font-bold text-emerald-900">{userRole === 'collector' ? 'Collector Team' : userRole === 'leader' ? 'Purok Leaders' : 'Household Residents'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-black mb-3">Assigned Zone</p>
                  <p className="text-sm font-bold text-slate-900">{displayZone}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-black mb-3">Guide</p>
                  <p className="text-sm text-slate-500">{userRole === 'household' ? 'Track your pickup request and review proof.' : userRole === 'collector' ? 'Confirm arrival and complete the run.' : 'Review Purok collection readiness.'}</p>
                </div>
              </div>

              {selectedSchedule.proofPhotoUrl && (
                <div className="bg-slate-100 p-4 rounded-3xl border border-slate-200">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-black mb-3">Verification Photo</p>
                  <img src={selectedSchedule.proofPhotoUrl} alt="Schedule proof" className="w-full rounded-3xl object-cover h-56" referrerPolicy="no-referrer" />
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                {userRole === 'collector' && selectedSchedule.status !== 'Completed' && (
                  <button
                    onClick={() => {
                      updateScheduleStatus(selectedSchedule.id, 'Completed');
                      setSelectedSchedule({ ...selectedSchedule, status: 'Completed' });
                    }}
                    className="w-full py-3 bg-emerald-600 text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] transition hover:bg-emerald-700"
                  >
                    Confirm Pickup Completed
                  </button>
                )}
                {userRole === 'household' && selectedSchedule.status === 'Pending' && (
                  <button
                    onClick={() => {
                      setSelectedSchedule(null);
                      setCurrentScreen('complaints');
                    }}
                    className="w-full py-3 bg-slate-900 text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] transition hover:bg-slate-800"
                  >
                    Open Pickup Support
                  </button>
                )}
                <button
                  onClick={() => {
                    if (userRole === 'leader') {
                      setSelectedSchedule(null);
                      setCurrentScreen('route-map');
                    } else {
                      setSelectedSchedule(null);
                    }
                  }}
                  className="w-full py-3 border border-slate-200 rounded-3xl text-slate-700 font-black uppercase tracking-[0.2em] transition hover:bg-slate-50"
                >
                  {userRole === 'leader' ? 'Open Route Map' : 'Close details'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}