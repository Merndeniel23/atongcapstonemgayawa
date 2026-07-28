import { useCallback, useEffect, useState } from 'react';
import { Shield, Users, Activity, Package, Map, CheckCircle, CreditCard, LoaderCircle, XCircle } from 'lucide-react';

interface PendingCollector {
  id: number;
  purok_id: number | null;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: string;
  created_at: string;
}

interface AdminDashboardProps {
  setCurrentScreen: (screen: any) => void;
}

export default function AdminDashboard({ setCurrentScreen }: AdminDashboardProps) {
  const [pendingCollectors, setPendingCollectors] = useState<PendingCollector[]>([]);
  const [collectorLoading, setCollectorLoading] = useState(true);
  const [collectorError, setCollectorError] = useState('');
  const [collectorMessage, setCollectorMessage] = useState('');
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const loadPendingCollectors = useCallback(async () => {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token') || '';

    if (!token) {
      setCollectorError('Admin session not found. Please sign in again.');
      setCollectorLoading(false);
      return;
    }

    try {
      setCollectorLoading(true);
      setCollectorError('');

      const response = await fetch('/api/auth/admin/pending-collectors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setCollectorError(data.message || 'Unable to load pending collectors.');
        return;
      }

      setPendingCollectors(
        Array.isArray(data.collectors) ? data.collectors : [],
      );
    } catch (error) {
      console.error('Pending collector fetch error:', error);
      setCollectorError('Cannot connect to the server.');
    } finally {
      setCollectorLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPendingCollectors();
  }, [loadPendingCollectors]);

  const reviewCollector = async (
    collectorId: number,
    action: 'approve' | 'reject',
  ) => {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token') || '';

    if (!token) {
      setCollectorError('Admin session not found. Please sign in again.');
      return;
    }

    try {
      setReviewingId(collectorId);
      setCollectorError('');
      setCollectorMessage('');

      const response = await fetch(
        `/api/auth/admin/collectors/${collectorId}/verification`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setCollectorError(data.message || 'Unable to review collector.');
        return;
      }

      setPendingCollectors((current) =>
        current.filter((collector) => collector.id !== collectorId),
      );
      setCollectorMessage(data.message || 'Collector registration updated.');
    } catch (error) {
      console.error('Collector review error:', error);
      setCollectorError('Cannot connect to the server.');
    } finally {
      setReviewingId(null);
    }
  };
  // Real-time local storage pull for clearance records
  const saved = typeof window !== 'undefined' ? localStorage.getItem('sg_endorsements') : null;
  const endorsements = saved ? JSON.parse(saved) : [];
  const pendingAdminSign = endorsements.filter((e: any) => e.status === 'Purok Leader Endorsed');
  const totalRequests = endorsements.length;

  // Payments verification tracking for ledger
  const savedPay = typeof window !== 'undefined' ? localStorage.getItem('sg_payment_history') : null;
  const payments = savedPay ? JSON.parse(savedPay) : [];
  const pendingPayments = payments.filter((p: any) => p.status === 'Pending Verification');

  const systemMetrics = [
    { label: 'Pending Collectors', value: String(pendingCollectors.length), trend: 'Needs Review', icon: Users, color: 'blue' },
    { label: 'Active Trucks', value: '18', trend: 'Online', icon: Activity, color: 'emerald' },
    { label: 'Waste Vol (MT)', value: '124.5', trend: '-2.4%', icon: Package, color: 'amber' },
    { label: 'Clearance Queue', value: String(pendingAdminSign.length), trend: `${totalRequests} Total`, icon: Shield, color: 'indigo' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-0">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">
          <Shield className="w-3 h-3" />
          System Control Panel
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin</h1>
      </header>

      {/* Global Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemMetrics.map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-${m.color}-50 text-${m.color}-500`}>
              <m.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 leading-none">{m.value}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</p>
                <p className={`text-[10px] font-black text-${m.color}-600`}>{m.trend}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent System Activity */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800">System Performance</h2>
            <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Generate Global Report</button>
          </div>
          
          <div className="p-8 flex-1">
             <div className="h-64 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-x-8 bottom-8 flex items-end gap-2 h-32">
                  {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85].map((h, i) => (
                    <div 
                      key={i} 
                      style={{ height: `${h}%` }} 
                      className={`flex-1 rounded-t-lg transition-all duration-500 group-hover:scale-y-110 origin-bottom ${
                        h > 80 ? 'bg-rose-400' : 'bg-emerald-400'
                      }`}
                    />
                  ))}
                </div>
                <div className="z-10 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-xl border border-white flex items-center gap-2">
                   <Activity className="w-4 h-4 text-emerald-600" />
                   <span className="text-xs font-bold text-slate-700 italic">Live Feed: Collection Efficiency +4.2%</span>
                </div>
             </div>
          </div>

          <div className="px-8 pb-8 grid grid-cols-3 gap-4">
             <button 
               onClick={() => setCurrentScreen('user-management')}
               className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center gap-2 hover:bg-emerald-50 transition-colors group border border-transparent hover:border-emerald-100"
             >
                <Users className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <span className="text-[10px] font-black text-slate-500 uppercase">User Accounts</span>
             </button>
             <button 
               onClick={() => setCurrentScreen('route-map')}
               className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group border border-transparent hover:border-blue-100"
             >
                <Map className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-[10px] font-black text-slate-500 uppercase">System Map</span>
             </button>
             <button className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center gap-2 hover:bg-amber-50 transition-colors group border border-transparent hover:border-amber-100">
                <Shield className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Security Logs</span>
             </button>
          </div>
        </div>

        {/* Global Alerts Feed */}
        <div className="space-y-6">
           {/* CLEARANCE DESK INTERACTIVE CARD */}
           <div className="bg-gradient-to-br from-[#059669] to-emerald-800 p-6 rounded-[2.5rem] text-white shadow-lg space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-white/20 rounded-2xl">
                  <Shield className="w-5 h-5 text-emerald-300" />
                </div>
                <span className="px-2.5 py-1 bg-white/15 text-white text-[9px] font-black uppercase tracking-wider rounded-lg">
                  Main Registrar
                </span>
              </div>
              <div className="space-y-1">
                 <h3 className="text-lg font-black tracking-tight leading-none text-white">Clearance Desk Hub</h3>
                 <p className="text-[10px] text-emerald-100">Review community sanitary and residency endorsements</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 bg-black/15 p-3 rounded-2xl text-center">
                 <div>
                    <span className="text-2xl font-black block leading-none">{pendingAdminSign.length}</span>
                    <span className="text-[8px] font-black uppercase text-emerald-200 tracking-wider">Await Sign</span>
                 </div>
                 <div className="border-l border-white/10">
                    <span className="text-2xl font-black block leading-none">{totalRequests}</span>
                    <span className="text-[8px] font-black uppercase text-emerald-200 tracking-wider">Total Recv</span>
                 </div>
              </div>

              {pendingAdminSign.length > 0 && (
                <div className="space-y-1.5 pt-1.5 border-t border-white/10">
                  <span className="text-[8px] font-black uppercase tracking-wider text-emerald-200 block">Queue Highlights</span>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {pendingAdminSign.map((req: any) => (
                      <div key={req.id} className="flex justify-between items-center text-[10px] bg-white/10 px-2.5 py-1.5 rounded-lg">
                        <span className="font-extrabold truncate max-w-[120px]">{req.householdName}</span>
                        <span className="font-mono text-[8px] bg-emerald-500/30 px-1 rounded-sm">{req.purok}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={() => setCurrentScreen('endorsements')}
                className="w-full py-3 bg-white text-emerald-990 hover:bg-emerald-50 active:scale-95 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 text-emerald-900"
              >
                <span>Browse Queue ({pendingAdminSign.length}) →</span>
              </button>
           </div>

           {/* ADMIN TREASURY JOURNAL AUDIT CARD */}
           <div className="bg-[#1E293B] p-6 rounded-[2.5rem] text-white shadow-lg space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-white/10 rounded-2xl">
                  <CreditCard className="w-5 h-5 text-emerald-400 font-extrabold" />
                </div>
                <span className="px-2.5 py-1 bg-white/10 text-white text-[9px] font-black uppercase tracking-wider rounded-lg">
                  Global Auditor
                </span>
              </div>
              <div className="space-y-1">
                 <h3 className="text-lg font-black tracking-tight leading-none text-white">Treasury Journal Desk</h3>
                 <p className="text-[10px] text-slate-350">Approve municipal-wide digital environmental receipts</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 bg-black/20 p-3 rounded-2xl text-center">
                 <div>
                    <span className="text-2xl font-black block leading-none text-amber-400">{pendingPayments.length}</span>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Awaiting Audit</span>
                 </div>
                 <div className="border-l border-white/10">
                    <span className="text-2xl font-black block leading-none text-emerald-400">
                      ₱{payments.filter((p: any) => p.status === 'Paid').reduce((acc: number, curr: any) => acc + curr.amount, 0)}
                    </span>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Total Revenue</span>
                 </div>
              </div>

              {pendingPayments.length > 0 && (
                <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">Pending Receipts</span>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {pendingPayments.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center text-[10px] bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                        <span className="font-extrabold truncate max-w-[120px]">{p.householdName}</span>
                        <span className="font-mono text-[8px] bg-amber-500/10 text-amber-300 px-1 rounded-sm">{p.purok}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={() => setCurrentScreen('payments')}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 border-none text-white"
              >
                <span>Audit Financial Ledger ({pendingPayments.length}) →</span>
              </button>
           </div>

           <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-slate-800">Collector Verification</h2>
              <button
                type="button"
                onClick={() => void loadPendingCollectors()}
                className="text-[10px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700"
              >
                Refresh
              </button>
           </div>

           {collectorError && (
             <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[11px] font-bold text-rose-700">
               {collectorError}
             </div>
           )}

           {collectorMessage && (
             <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-[11px] font-bold text-emerald-700">
               {collectorMessage}
             </div>
           )}

           {collectorLoading ? (
             <div className="flex items-center justify-center gap-2 rounded-[2rem] border border-slate-100 bg-white p-6 text-slate-500 shadow-sm">
               <LoaderCircle className="h-4 w-4 animate-spin" />
               <span className="text-[11px] font-bold">Loading registrations...</span>
             </div>
           ) : pendingCollectors.length === 0 ? (
             <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm">
               <div className="flex items-center gap-2 text-emerald-700">
                 <CheckCircle className="h-4 w-4" />
                 <span className="text-xs font-black">
                   No pending collector registrations
                 </span>
               </div>
             </div>
           ) : (
             <div className="space-y-4">
               {pendingCollectors.map((collector) => {
                 const isReviewing = reviewingId === collector.id;

                 return (
                   <div
                     key={collector.id}
                     className="rounded-[2rem] border border-amber-100 bg-amber-50/50 p-6 shadow-sm"
                   >
                     <div className="mb-3 flex items-start justify-between gap-3">
                       <div className="min-w-0">
                         <h4 className="truncate text-sm font-black text-slate-900">
                           {collector.full_name}
                         </h4>
                         <p className="mt-1 truncate text-[10px] font-semibold text-slate-500">
                           {collector.email}
                         </p>
                       </div>
                       <span className="rounded-lg bg-amber-100 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-amber-700">
                         Pending
                       </span>
                     </div>

                     <div className="mb-4 space-y-1 text-[10px] text-slate-500">
                       <p>
                         Collector ID:{' '}
                         <span className="font-mono font-bold">
                           C-{String(collector.id).padStart(3, '0')}
                         </span>
                       </p>
                       <p>
                         Purok:{' '}
                         {collector.purok_id
                           ? `Purok ${collector.purok_id}`
                           : 'Not assigned'}
                       </p>
                       <p>Phone: {collector.phone || 'Not provided'}</p>
                     </div>

                     <div className="grid grid-cols-2 gap-2">
                       <button
                         type="button"
                         disabled={isReviewing}
                         onClick={() =>
                           void reviewCollector(collector.id, 'reject')
                         }
                         className="flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-white py-2 text-[9px] font-black uppercase tracking-wider text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                       >
                         <XCircle className="h-3 w-3" />
                         Reject
                       </button>

                       <button
                         type="button"
                         disabled={isReviewing}
                         onClick={() =>
                           void reviewCollector(collector.id, 'approve')
                         }
                         className="flex items-center justify-center gap-1 rounded-xl bg-amber-500 py-2 text-[9px] font-black uppercase tracking-wider text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                       >
                         {isReviewing ? (
                           <LoaderCircle className="h-3 w-3 animate-spin" />
                         ) : (
                           <CheckCircle className="h-3 w-3" />
                         )}
                         Approve
                       </button>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}