import { Users, Trash2, PieChart, TrendingUp, AlertCircle, ChevronRight, Award, CreditCard, Sparkles, Check, CheckCircle, MessageSquare, MapPin, Camera, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppState } from '../context/AppStateContext';
import { useState } from 'react';

interface LeaderDashboardProps {
  setCurrentScreen: (screen: any) => void;
}

export default function LeaderDashboard({ setCurrentScreen }: LeaderDashboardProps) {
  const { complaints, approveAddressCorrection, updateComplaintStatus, schedules } = useAppState();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Retrieve communal points from local storage
  const [communalPoints] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sg_communal_points') : null;
    return saved ? JSON.parse(saved) : [];
  });

  // Combine completed tasks that have photo proofs
  const completedWithProof = [
    ...schedules
      .filter((s) => s.status === 'Completed' && s.proofPhotoUrl)
      .map((s) => ({
        id: s.id,
        type: 'Resident Booking',
        wasteType: s.type,
        location: s.location,
        date: s.date,
        time: s.time,
        proofPhotoUrl: s.proofPhotoUrl!,
      })),
    ...communalPoints
      .filter((p: any) => p.collected && p.proofPhotoUrl)
      .map((p: any) => ({
        id: `COMM-${p.id}`,
        type: 'Communal Bin',
        wasteType: 'Mixed Waste',
        location: p.location,
        date: 'Today',
        time: 'Just now',
        proofPhotoUrl: p.proofPhotoUrl!,
      })),
  ];

  // Query sector clearances from localStorage
  const saved = typeof window !== 'undefined' ? localStorage.getItem('sg_endorsements') : null;
  const endorsements = saved ? JSON.parse(saved) : [];
  // For Purok 4 Leaders (default leader and Demo context)
  const pendingLeaderSign = endorsements.filter((e: any) => e.status === 'Pending Leader Review' && e.purok === 'Purok 4');
  const totalLeaderRequests = endorsements.filter((e: any) => e.purok === 'Purok 4').length;

  // Real-time local storage pull for clearance payments
  const savedPay = typeof window !== 'undefined' ? localStorage.getItem('sg_payment_history') : null;
  const payments = savedPay ? JSON.parse(savedPay) : [];
  const pendingPayments = payments.filter((p: any) => p.status === 'Pending Verification' && p.purok === 'Purok 4');

  const purokStats = {
    totalMembers: 124,
    activeThisWeek: 98,
    totalWasteThisMonth: '2.4 Tons',
    purokName: 'Purok 4',
  };

  const topContributors = [
    { id: 1, name: 'Echavia Household', waste: '5kg', status: 'Paid' },
    { id: 2, name: 'Rallos Household', waste: '8kg', status: 'Paid' },
    { id: 3, name: 'Bayubay Household', waste: '10kg', status: 'Unpaid' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20 md:pb-0">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight">Leader Overview</h1>
        <p className="text-slate-500 text-sm">Managing: {purokStats.purokName} • Barangay Central</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Users className="w-8 h-8 text-emerald-500 bg-emerald-50 p-1.5 rounded-xl" />
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{purokStats.totalMembers}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Members</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <TrendingUp className="w-8 h-8 text-blue-500 bg-blue-50 p-1.5 rounded-xl" />
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">ACTIVE</span>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{purokStats.activeThisWeek}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Weekly Active HH</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Trash2 className="w-8 h-8 text-rose-500 bg-rose-50 p-1.5 rounded-xl" />
            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">-5%</span>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{purokStats.totalWasteThisMonth}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Waste Collected</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <PieChart className="w-8 h-8 text-amber-500 bg-amber-50 p-1.5 rounded-xl" />
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">GOOD</span>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">82%</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Compliance Rate</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Member Quick Look */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-end">
             <h3 className="text-xl font-bold text-slate-800">Top Households</h3>
             <button 
               onClick={() => setCurrentScreen('members-list')}
               className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
             >
               View All Members <ChevronRight className="w-3 h-3" />
             </button>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                 <tr>
                   <th className="px-6 py-4">Household Name</th>
                   <th className="px-6 py-4 text-center">Waste Volume</th>
                   <th className="px-6 py-4 text-right">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {topContributors.map((hh) => (
                   <tr key={hh.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4 font-bold text-slate-700 text-sm">{hh.name}</td>
                     <td className="px-6 py-4 text-center font-mono text-xs">{hh.waste}</td>
                     <td className="px-6 py-4 text-right">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                         hh.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                       }`}>
                         {hh.status}
                       </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>

          {/* Live Collection & Verification Feed */}
          <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                <h3 className="text-xl font-bold text-slate-800">Live Collection Verifications</h3>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                {completedWithProof.length} verified completed
              </span>
            </div>

            {completedWithProof.length === 0 ? (
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 text-center space-y-3 shadow-xs">
                <Camera className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-extrabold text-xs text-slate-600 uppercase tracking-wider">No Active Proofs Received</p>
                <p className="text-[11px] text-slate-450 max-w-sm mx-auto leading-relaxed">
                  When collectors upload photos during trash pickup, the files will stream live here for Purok validation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedWithProof.map((item, i) => (
                  <div key={item.id} className="bg-white p-4.5 rounded-[2rem] border border-slate-100 shadow-xs flex flex-col justify-between gap-4.5 hover:shadow-md transition-all">
                    <div className="flex gap-3.5">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-inner border border-slate-150 shrink-0 bg-slate-100">
                        <img 
                          src={item.proofPhotoUrl} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          alt="Live Proof" 
                        />
                        <button 
                          onClick={() => setSelectedPhoto(item.proofPhotoUrl)}
                          className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white border-none cursor-pointer"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-0.5 text-left min-w-0 flex-1">
                        <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          item.type === 'Resident Booking' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {item.type}
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs truncate" title={item.location}>{item.location}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.wasteType}</p>
                        <p className="text-[9px] text-slate-500 font-medium">{item.date} • {item.time}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedPhoto(item.proofPhotoUrl)}
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Inspect High-Res Proof Photo
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Alerts / System Notices */}
        <section className="space-y-4">
          {/* LEADERSHIP ENDORSEMENT DESK CARD */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-6 rounded-[2.5rem] text-white shadow-lg space-y-4">
             <div className="flex justify-between items-start">
               <div className="p-2.5 bg-white/20 rounded-2xl">
                 <Award className="w-5 h-5 text-indigo-200" />
               </div>
               <span className="px-2.5 py-1 bg-white/15 text-white text-[9px] font-black uppercase tracking-wider rounded-lg">
                 Purok 4 Officer
               </span>
             </div>
             <div className="space-y-1">
                <h3 className="text-lg font-black tracking-tight leading-none text-white">Leader Endorsement Desk</h3>
                <p className="text-[10px] text-indigo-100">Review sector sanitary certifications from residents</p>
             </div>
             
             <div className="grid grid-cols-2 gap-3 bg-black/15 p-3 rounded-2xl text-center">
                <div>
                   <span className="text-2xl font-black block leading-none">{pendingLeaderSign.length}</span>
                   <span className="text-[8px] font-black uppercase text-indigo-200 tracking-wider">To Endorse</span>
                </div>
                <div className="border-l border-white/10">
                   <span className="text-2xl font-black block leading-none">{totalLeaderRequests}</span>
                   <span className="text-[8px] font-black uppercase text-indigo-200 tracking-wider">Total Recv</span>
                </div>
             </div>

             {pendingLeaderSign.length > 0 && (
               <div className="space-y-1.5 pt-1.5 border-t border-white/10">
                 <span className="text-[8px] font-black uppercase tracking-wider text-indigo-200 block">Pending Citizens</span>
                 <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                   {pendingLeaderSign.map((req: any) => (
                     <div key={req.id} className="flex justify-between items-center text-[10px] bg-white/10 px-2.5 py-1.5 rounded-lg">
                       <span className="font-extrabold truncate max-w-[120px]">{req.householdName}</span>
                       <span className="font-mono text-[8px] bg-indigo-500/30 px-1 rounded-sm">{req.purok}</span>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             <button 
               onClick={() => setCurrentScreen('endorsements')}
               className="w-full py-3 bg-white text-indigo-900 hover:bg-slate-50 active:scale-95 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
             >
               <span>Sign Clearance Forms ({pendingLeaderSign.length}) →</span>
             </button>
          </div>

          {/* AUDIT PAYMENTS DESK CARD */}
          <div className="bg-[#1E293B] p-6 rounded-[2.5rem] text-white shadow-lg space-y-4">
             <div className="flex justify-between items-start">
               <div className="p-2.5 bg-white/10 rounded-2xl">
                 <CreditCard className="w-5 h-5 text-emerald-400 font-extrabold" />
               </div>
               <span className="px-2.5 py-1 bg-white/10 text-white text-[9px] font-black uppercase tracking-wider rounded-lg">
                 Treasury Desk
               </span>
             </div>
             <div className="space-y-1">
                <h3 className="text-lg font-black tracking-tight leading-none text-white">Payments Audit Desk</h3>
                <p className="text-[10px] text-slate-300">Authorize GCash/PayMaya resident deposit slips</p>
             </div>
             
             <div className="grid grid-cols-2 gap-3 bg-black/20 p-3 rounded-2xl text-center">
                <div>
                   <span className="text-2xl font-black block leading-none text-amber-400">{pendingPayments.length}</span>
                   <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Awaiting Audit</span>
                </div>
                <div className="border-l border-white/10">
                   <span className="text-2xl font-black block leading-none text-emerald-400">
                     ₱{payments.filter((p: any) => p.status === 'Paid' && p.purok === 'Purok 4').reduce((acc: number, curr: any) => acc + curr.amount, 0)}
                   </span>
                   <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Sec-4 Revenue</span>
                </div>
             </div>

             {pendingPayments.length > 0 && (
               <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                 <span className="text-[8px] font-black uppercase tracking-wider text-slate-450 block">Pending Confirmations</span>
                 <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                   {pendingPayments.map((p: any) => (
                     <div key={p.id} className="flex justify-between items-center text-[10px] bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                       <span className="font-extrabold truncate max-w-[125px]">{p.householdName}</span>
                       <span className="font-mono text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded-sm">₱{p.amount}</span>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             <button 
               onClick={() => setCurrentScreen('payments')}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 text-white border-none"
              >
                <span>Verify Ledger Queue ({pendingPayments.length}) →</span>
              </button>
            </div>

            {/* LEADER & ADMIN MASTER APPROVAL CONSOLE */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-amber-500/10 rounded-2xl">
                    <Sparkles className="w-5 h-5 text-amber-600 font-extrabold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight">Leader & Admin Master Approval Console</h3>
                    <p className="text-[10px] text-slate-500 font-bold">Address & Zone Correction Requests</p>
                  </div>
                </div>
              </div>

              {(() => {
                const addressCorrections = complaints.filter(
                  (c) => c.type === 'Address & Zone Correction' && c.status !== 'Resolved'
                );

                const parseAddressCorrection = (desc: string) => {
                  const lines = desc.split('\n');
                  let bgy = '';
                  let prk = '';
                  let addr = '';
                  
                  for (const line of lines) {
                    if (line.includes('Requested Barangay:')) {
                      bgy = line.replace('Requested Barangay:', '').trim();
                    } else if (line.includes('Requested Purok:')) {
                      prk = line.replace('Requested Purok:', '').trim();
                    } else if (line.includes('Requested Physical Address:')) {
                      addr = line.replace('Requested Physical Address:', '').trim();
                    }
                  }
                  return { bgy, prk, addr };
                };

                if (addressCorrections.length === 0) {
                  return (
                    <div className="bg-slate-50 p-4 rounded-2xl text-center border border-dashed border-slate-150">
                      <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                      <p className="text-[10px] font-bold text-slate-600">All Master Registers Synchronized</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">No pending address correction requests currently active in your sector.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {addressCorrections.map((c) => {
                      const { bgy, prk, addr } = parseAddressCorrection(c.description);
                      const hasValidData = bgy && prk && addr;
                      return (
                        <div key={c.id} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-3 text-slate-700">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                            <span className="text-amber-800 font-extrabold">Ticket ID: {c.id}</span>
                            <span className="text-slate-400">{c.date}</span>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Applicant</span>
                            <span className="text-xs font-extrabold text-slate-850 block">{c.creator}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-[8px] uppercase text-slate-400 font-bold block">Proposed Barangay</span>
                              <span className="font-extrabold text-slate-800">{bgy || 'N/A'}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-[8px] uppercase text-slate-400 font-bold block">Proposed Purok</span>
                              <span className="font-extrabold text-slate-800">{prk || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-[10px]">
                            <span className="text-[8px] uppercase text-slate-400 font-bold block">Proposed Address</span>
                            <span className="font-bold text-slate-800 leading-tight block">{addr || 'N/A'}</span>
                          </div>

                          {hasValidData ? (
                            <button
                              onClick={() => {
                                approveAddressCorrection(c.creator, prk, bgy, addr);
                                updateComplaintStatus(
                                  c.id,
                                  'Resolved',
                                  undefined,
                                  `Approved and officially applied the corrected address: "${addr}, ${prk}, ${bgy}" for ${c.creator}.`
                                );
                              }}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[9px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve & Apply Master Update
                            </button>
                          ) : (
                            <button
                              onClick={() => setCurrentScreen('complaints')}
                              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-wider text-[9px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Examine ticket in Complaints
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="hidden">
              <button onClick={() => setCurrentScreen('payments')}
               className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 text-white border-none"
             >
               <span>Verify Ledger Queue ({pendingPayments.length}) →</span>
             </button>
          </div>

          <h3 className="text-xl font-bold text-slate-800">Critical Alerts</h3>
          <div className="space-y-3">
            <div className="p-5 bg-rose-50 border border-rose-100 rounded-[2rem] flex gap-4">
               <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
               <div>
                 <h4 className="font-bold text-rose-900 text-sm">Missed Pickup</h4>
                 <p className="text-rose-700 text-[10px] leading-relaxed mt-1">
                   12 households in Purok 1 missed today's collection window.
                 </p>
               </div>
            </div>
            <div className="p-5 bg-amber-50 border border-amber-100 rounded-[2rem] flex gap-4">
               <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
               <div>
                 <h4 className="font-bold text-amber-900 text-sm">Cap. Peak</h4>
                 <p className="text-amber-700 text-[10px] leading-relaxed mt-1">
                   Main bin at Crossing reached 100% early today.
                 </p>
               </div>
            </div>
          </div>
        </section>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-250"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] p-4 max-w-2xl w-full relative overflow-hidden shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Purok Verification - High-Res Image Proof</span>
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full transition-colors bg-slate-50 hover:bg-slate-100 cursor-pointer border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-150 shadow-inner bg-slate-50">
              <img 
                src={selectedPhoto} 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
                alt="High-Res Proof" 
              />
            </div>
            <div className="flex justify-end gap-2 px-2">
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-wider rounded-xl text-slate-700 transition-colors cursor-pointer border-none"
              >
                Dismiss Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
