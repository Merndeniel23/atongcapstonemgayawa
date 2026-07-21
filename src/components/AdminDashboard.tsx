import { Shield, Users, Activity, Package, Map, AlertTriangle, ArrowUpRight, CheckCircle, CreditCard } from 'lucide-react';

interface AdminDashboardProps {
  setCurrentScreen: (screen: any) => void;
}

export default function AdminDashboard({ setCurrentScreen }: AdminDashboardProps) {
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
    { label: 'Total Users', value: '2,842', trend: '+124', icon: Users, color: 'blue' },
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

           <h2 className="text-xl font-black text-slate-800 px-2">High Priority Alerts</h2>
           <div className="space-y-4">
              {[
                { title: 'Server Load Peak', time: '2m ago', desc: 'System resources reaching 85% capacity.', type: 'critical' },
                { title: 'New Collector Registered', time: '15m ago', desc: 'ID: C-884 requires credential verification.', type: 'warning' },
                { title: 'Global Schedule Update', time: '1h ago', desc: 'Quarterly route optimization complete.', type: 'success' },
              ].map((alert, i) => (
                <div key={i} className={`p-6 rounded-[2rem] border shadow-sm ${
                  alert.type === 'critical' ? 'bg-rose-50/50 border-rose-100' : 
                  alert.type === 'warning' ? 'bg-amber-50/50 border-amber-100' : 'bg-emerald-50/50 border-emerald-100'
                }`}>
                   <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{alert.time}</span>
                   </div>
                   <p className="text-[11px] text-slate-500 leading-relaxed mb-4">{alert.desc}</p>
                   {alert.type === 'warning' && (
                     <button className="w-full bg-amber-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                       Verify Now
                     </button>
                   )}
                   {alert.type === 'success' && (
                     <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px]">
                        <CheckCircle className="w-3 h-3" />
                        System Optimized
                     </div>
                   )}
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
