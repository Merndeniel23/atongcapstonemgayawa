import { useState } from 'react';
import { Search, Filter, History, Trash2, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MembersList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<number | null>(null);

  const members = [
    { id: 1, name: 'Echavia Family', householdId: 'HH-401', joined: 'Oct 2025', recentWaste: '5kg', trend: 'down', status: 'Compliant' },
    { id: 2, name: 'Rallos Residence', householdId: 'HH-402', joined: 'Nov 2025', recentWaste: '8kg', trend: 'up', status: 'Compliant' },
    { id: 3, name: 'Bayubay Household', householdId: 'HH-403', joined: 'Jan 2026', recentWaste: '10kg', trend: 'up', status: 'Warning' },
    { id: 4, name: 'Daro Family', householdId: 'HH-404', joined: 'Feb 2026', recentWaste: '8.40kg', trend: 'down', status: 'Compliant' },
    { id: 5, name: 'Deatras Residence', householdId: 'HH-405', joined: 'Mar 2026', recentWaste: '14.1kg', trend: 'down', status: 'Compliant' },
  ];

  const wasteHistory = [
    { date: 'Oct 24, 2026', amount: '2.5kg', type: 'General', collector: 'C-001' },
    { date: 'Oct 21, 2026', amount: '4.2kg', type: 'Recyclable', collector: 'C-003' },
    { date: 'Oct 18, 2026', amount: '3.1kg', type: 'Organic', collector: 'C-001' },
    { date: 'Oct 15, 2026', amount: '2.7kg', type: 'General', collector: 'C-002' },
  ];

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.householdId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Purok Members</h1>
          <p className="text-slate-500 text-sm font-medium">Manage and track household contribution history</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 w-4 h-4 text-slate-400 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search Household ID or Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
           </div>
           <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="xl:col-span-2 space-y-4">
           {filteredMembers.map((member) => (
             <motion.div 
               key={member.id}
               whileHover={{ scale: 1.01 }}
               onClick={() => setSelectedMember(member.id)}
               className={`bg-white p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center gap-6 ${
                 selectedMember === member.id ? 'border-emerald-500 shadow-lg shadow-emerald-500/5' : 'border-slate-100 shadow-sm hover:border-slate-200'
               }`}
             >
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                   <User className="w-7 h-7 text-emerald-600" />
                </div>
                
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900">{member.name}</h3>
                      <span className="text-[10px] font-black text-slate-400 tracking-widest">{member.householdId}</span>
                   </div>
                   <p className="text-[11px] text-slate-500 font-medium">Joined {member.joined}</p>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                   <div className="flex items-center gap-1">
                      <span className="text-lg font-black text-slate-800">{member.recentWaste}</span>
                      {member.trend === 'up' ? <ArrowUpRight className="w-4 h-4 text-rose-500" /> : <ArrowDownRight className="w-4 h-4 text-emerald-500" />}
                   </div>
                   <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${
                     member.status === 'Compliant' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                   }`}>
                     {member.status}
                   </span>
                </div>
             </motion.div>
           ))}
        </div>

        {/* Contribution History Side Panel */}
        <div className="xl:col-span-1">
           <AnimatePresence mode="wait">
             {selectedMember ? (
               <motion.div 
                 key={selectedMember}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col"
               >
                  <div className="p-6 bg-slate-900 text-white">
                     <h3 className="font-bold text-lg flex items-center gap-2">
                        <History className="w-5 h-5 text-emerald-400" />
                        Contribution History
                     </h3>
                     <p className="text-white/60 text-xs mt-1">Viewing history for {members.find(m => m.id === selectedMember)?.name}</p>
                  </div>
                  
                  <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                     {wasteHistory.map((log, i) => (
                       <div key={i} className="flex gap-4 border-l-2 border-emerald-500/20 ml-2 pl-6 relative">
                          <div className="absolute w-2 h-2 bg-emerald-500 rounded-full -left-[5px] top-1" />
                          <div className="flex-1">
                             <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.date}</span>
                                <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-1.5 py-0.5 rounded-md">{log.collector}</span>
                             </div>
                             <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                   <Trash2 className="w-4 h-4 text-slate-400" />
                                   <p className="text-sm font-bold text-slate-800">{log.type} Waste</p>
                                </div>
                                <p className="text-sm font-black text-emerald-600">{log.amount}</p>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
                  
                  <div className="p-6 bg-slate-50 border-t border-slate-100">
                     <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-sm">
                        Generate Report
                     </button>
                  </div>
               </motion.div>
             ) : (
               <div className="h-full border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4">
                     <History className="w-8 h-8 text-slate-200" />
                  </div>
                  <h4 className="font-bold text-slate-600">No Member Selected</h4>
                  <p className="text-[11px] text-slate-400 mt-2 max-w-[200px]">Click on a household card to view their complete waste contribution history.</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
