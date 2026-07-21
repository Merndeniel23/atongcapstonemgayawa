import { useState } from 'react';
import { Search, Filter, User, MoreVertical, Edit2, ShieldAlert, Trash2, CheckCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<'all' | 'households' | 'collectors' | 'leaders'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const users = [
    { id: 1, name: 'Echavia Family', role: 'household', purok: 'Purok 4', status: 'Active', email: 'echavia@test.com' },
    { id: 2, name: 'John Doe', role: 'collector', area: 'Sector A', status: 'Verification Pending', email: 'john@sanitation.com' },
    { id: 3, name: 'Rallos Household', role: 'household', purok: 'Purok 1', status: 'Active', email: 'rallos@test.com' },
    { id: 4, name: 'Sarah Lee', role: 'leader', purok: 'Purok 4', status: 'Active', email: 'sarah.leader@central.com' },
    { id: 5, name: 'Mike Trash', role: 'collector', area: 'Sector B', status: 'Active', email: 'mike@sanitation.com' },
    { id: 6, name: 'Bayubay Residence', role: 'household', purok: 'Purok 7', status: 'Flagged', email: 'bayubay@test.com' },
  ];

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'households' && u.role === 'household') ||
                       (activeTab === 'collectors' && u.role === 'collector') ||
                       (activeTab === 'leaders' && u.role === 'leader');
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20 md:pb-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
             <User className="w-3 h-3" />
             Access Control
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 w-4 h-4 text-slate-400 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search by name, email or ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
           </div>
           <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl text-sm shadow-lg shadow-slate-900/10 active:scale-95 transition-all">
             Export CSV
           </button>
        </div>
      </header>

      {/* Role Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'all', label: 'All Users' },
          { id: 'households', label: 'Households' },
          { id: 'collectors', label: 'Collectors' },
          { id: 'leaders', label: 'Leaders' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
               <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <th className="px-8 py-5">User Identity</th>
                 <th className="px-8 py-5">Role</th>
                 <th className="px-8 py-5">Location/Area</th>
                 <th className="px-8 py-5">Status</th>
                 <th className="px-8 py-5">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {filteredUsers.map((user) => (
                 <motion.tr 
                   layout
                   key={user.id} 
                   className="hover:bg-slate-50 transition-colors group"
                 >
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                           user.role === 'admin' ? 'bg-slate-900 text-white' : 
                           user.role === 'leader' ? 'bg-indigo-50 text-indigo-600' :
                           user.role === 'collector' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                         }`}>
                           <User className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                         </div>
                      </div>
                   </td>
                   <td className="px-8 py-6">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                        user.role === 'leader' ? 'border-indigo-100 text-indigo-600 bg-indigo-50/30' :
                        user.role === 'collector' ? 'border-emerald-100 text-emerald-600 bg-emerald-50/30' : 'border-blue-100 text-blue-600 bg-blue-50/30'
                      }`}>
                        {user.role}
                      </span>
                   </td>
                   <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-600">{user.purok || user.area}</p>
                   </td>
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${
                           user.status === 'Active' ? 'bg-emerald-500' : 
                           user.status === 'Flagged' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                         }`} />
                         <span className="text-[10px] font-bold text-slate-600">{user.status}</span>
                      </div>
                   </td>
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-400 hover:text-emerald-600 transition-all">
                            <Edit2 className="w-4 h-4" />
                         </button>
                         <button className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-400 hover:text-amber-600 transition-all">
                            <ShieldAlert className="w-4 h-4" />
                         </button>
                         <button className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-400 hover:text-rose-600 transition-all">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </td>
                 </motion.tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
