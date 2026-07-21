import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppState } from '../context/AppStateContext';
import { 
  MessageSquare, 
  AlertTriangle, 
  Plus, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle, 
  ArrowRight, 
  Send,
  Sparkles,
  ShieldAlert,
  Sliders,
  Check,
  ChevronDown,
  Trash2,
  Camera,
  Layers,
  Phone
} from 'lucide-react';

interface Complaint {
  id: string;
  type: string;
  purok: string;
  description: string;
  creator: string;
  phone: string;
  date: string;
  status: 'Pending Review' | 'Assigned' | 'Scheduled' | 'Resolved';
  assignedTo?: string;
  resolutionRemark?: string;
  chats: { sender: string; text: string; time: string; role: string }[];
  visualMockUrl?: string;
}

interface ComplaintsPanelProps {
  role: 'household' | 'collector' | 'leader' | 'admin';
}

export default function ComplaintsPanel({ role }: ComplaintsPanelProps) {
  const { 
    complaints, 
    addComplaint, 
    updateComplaintStatus, 
    addComplaintChat, 
    deleteComplaint,
    currentUser,
    userProfile,
    approveAddressCorrection
  } = useAppState();

  const activeUser = currentUser || userProfile;
  const displayName = activeUser?.name || 'Household';

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'resolved'>('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

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

  // Submit Form States
  const [newType, setNewType] = useState('Overflowing Barangay Barrel');
  const [newPurok, setNewPurok] = useState('Purok 4');
  const [newDesc, setNewDesc] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newVisual, setNewVisual] = useState('overspill');
  const [validationError, setValidationError] = useState('');

  // Auditor/Admin Response Form States
  const [assignee, setAssignee] = useState('Driver Carlos');
  const [remark, setRemark] = useState('');
  const [chatInput, setChatInput] = useState('');

  // Synchronize selection when the global complaints array updates
  useEffect(() => {
    if (selectedComplaint) {
      const current = complaints.find(c => c.id === selectedComplaint.id);
      if (current) {
        setSelectedComplaint(current as Complaint);
      } else {
        setSelectedComplaint(null);
      }
    }
  }, [complaints]);

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || !newPhone.trim()) {
      setValidationError('Please explain the issue and provide a mobile contact number.');
      return;
    }

    const currentName = role === 'household' ? displayName : 'System Staff';
    
    addComplaint({
      type: newType,
      purok: newPurok,
      description: newDesc,
      creator: currentName,
      phone: newPhone,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'Pending Review',
      visualMockUrl: newVisual
    });
    
    // Reset Form
    setNewDesc('');
    setNewPhone('');
    setValidationError('');
    setShowSubmitModal(false);
  };

  const handleUpdateStatus = (id: string, nextStatus: 'Pending Review' | 'Assigned' | 'Scheduled' | 'Resolved') => {
    updateComplaintStatus(id, nextStatus, nextStatus === 'Assigned' ? assignee : undefined, nextStatus === 'Resolved' && remark ? remark : undefined);
  };

  const handleSendChat = (e: React.FormEvent, complaintId: string) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const senderName = role === 'household' ? 'Mark Rallos' : role === 'leader' ? 'Purok Leader' : role === 'admin' ? 'Sys Admin' : 'Waste Collector';

    addComplaintChat(complaintId, chatInput, senderName, role);
    setChatInput('');
  };

  const handleDeleteComplaint = (id: string) => {
    deleteComplaint(id);
    if (selectedComplaint?.id === id) {
      setSelectedComplaint(null);
    }
  };

  // Filters
  const filteredComplaints = complaints.filter(c => {
    if (role === 'household') {
      const isOwner = (c.creator || '').toLowerCase() === displayName.toLowerCase() ||
                      (c.creator || '').toLowerCase().includes(displayName.toLowerCase());
      if (!isOwner) return false;
    }
    
    if (activeTab === 'pending') return c.status !== 'Resolved';
    if (activeTab === 'resolved') return c.status === 'Resolved';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending Review':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/30';
      case 'Assigned':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/30';
      case 'Scheduled':
        return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30';
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30';
      default:
        return 'bg-slate-500/10 text-slate-500 border border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-550 pb-20 md:pb-0">
      
      {/* HEADER ROW */}
      <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-amber-600 font-extrabold text-[10px] uppercase tracking-[0.2em]">
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
            Barangay Sanitation Feedback
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Complaints & Logs</h1>
        </div>
        
        {/* ADD COMPLAINT ACTION */}
        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-2xl shadow-md transition-all border-none cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Report New Debris</span>
        </button>
      </div>

      {/* METRIC QUICK ACCENTS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Awaiting Sweep</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-amber-600">
              {complaints.filter(c => c.status === 'Pending Review').length}
            </span>
            <span className="text-[10px] font-bold text-slate-400">Reports</span>
          </div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Under Action</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-indigo-600">
              {complaints.filter(c => c.status === 'Assigned' || c.status === 'Scheduled').length}
            </span>
            <span className="text-[10px] font-bold text-slate-400">Active</span>
          </div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Solved</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-emerald-600">
              {complaints.filter(c => c.status === 'Resolved').length}
            </span>
            <span className="text-[10px] font-bold text-slate-400">Success</span>
          </div>
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div className="flex border-b border-slate-100 gap-6">
        {(['all', 'pending', 'resolved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3.5 text-xs font-black uppercase tracking-widest relative cursor-pointer ${
              activeTab === tab ? 'text-slate-900 font-extrabold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="capitalize">{tab} Feedback</span>
            {activeTab === tab && (
              <motion.div layoutId="complaintsActiveLine" className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: LIST */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              Showing {filteredComplaints.length} Declared Events
            </span>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No complaints registered in this segment.</p>
              <p className="text-[10px] text-slate-400 mt-1">Use 'Report New Debris' to request a municipal evaluation.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {filteredComplaints.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedComplaint(item)}
                  className={`w-full text-left p-4.5 bg-white rounded-[1.6rem] border transition-all flex flex-col justify-between cursor-pointer ${
                    selectedComplaint?.id === item.id 
                      ? 'border-amber-500 shadow-sm ring-1 ring-amber-500/20' 
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <span className="text-xs font-black text-slate-900 leading-tight block">
                      {item.type}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-nowrap select-none shrink-0 ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed text-slate-500 mt-2 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 text-[10px]">
                    <span className="font-bold flex items-center gap-1 text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {item.creator} ({item.purok})
                    </span>
                    <span className="font-mono text-slate-400">{item.date}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INTERACTIVE INSPECTION SHEET */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedComplaint ? (
              <motion.div 
                key={selectedComplaint.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6"
              >
                {/* ID & ACTION ROW */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono px-3 py-1 bg-slate-100 rounded-lg text-slate-600 border border-slate-200">
                      {selectedComplaint.id}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${getStatusBadge(selectedComplaint.status)}`}>
                      {selectedComplaint.status}
                    </span>
                  </div>

                  {role !== 'household' && (
                    <button
                      onClick={() => handleDeleteComplaint(selectedComplaint.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Dismiss ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* ESSENTIAL COMPLAINT META DATA */}
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedComplaint.type}</h3>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {selectedComplaint.purok}</span>
                    <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> {selectedComplaint.phone}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {selectedComplaint.date}</span>
                  </div>
                  <p className="bg-slate-50 p-4 rounded-2xl text-xs font-medium text-slate-650 leading-relaxed border border-slate-100 whitespace-pre-line">
                    {selectedComplaint.description}
                  </p>

                  {selectedComplaint.type === 'Address & Zone Correction' && (
                    <div className="p-5 bg-amber-500/5 border border-amber-500/15 rounded-2xl space-y-3.5 mt-3">
                      <div className="flex items-center gap-2 font-black text-[10px] text-amber-700 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        Address Change Verification Details
                      </div>
                      
                      {(() => {
                        const { bgy, prk, addr } = parseAddressCorrection(selectedComplaint.description);
                        const hasValidData = bgy && prk && addr;
                        
                        return (
                          <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-3 text-[11px]">
                              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Target Barangay</span>
                                <span className="font-extrabold text-slate-850">{bgy || 'Not parsed'}</span>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Target Purok</span>
                                <span className="font-extrabold text-slate-850">{prk || 'Not parsed'}</span>
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-[11px]">
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Target Physical Address</span>
                              <span className="font-bold text-slate-850">{addr || 'Not parsed'}</span>
                            </div>

                            {role !== 'household' && selectedComplaint.status !== 'Resolved' && hasValidData && (
                              <button
                                onClick={() => {
                                  // 1. Apply the correction to context database
                                  approveAddressCorrection(selectedComplaint.creator, prk, bgy, addr);
                                  // 2. Mark the complaint resolved with appropriate note
                                  updateComplaintStatus(
                                    selectedComplaint.id, 
                                    'Resolved', 
                                    undefined, 
                                    `Approved and officially applied the corrected address: "${addr}, ${prk}, ${bgy}" for ${selectedComplaint.creator}.`
                                  );
                                }}
                                className="w-full mt-1.5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[10px] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                              >
                                <Check className="w-4 h-4" />
                                Approve & Apply Master Update
                              </button>
                            )}

                            {selectedComplaint.status === 'Resolved' && (
                              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl flex items-center gap-2 text-[10px] font-bold border border-emerald-150">
                                <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                                Address correction has been successfully updated and saved permanently!
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* DETAILED REVIEWS BY LEADERS/ADMINS */}
                {role !== 'household' && (
                  <div className="p-5.5 bg-slate-900 text-slate-100 rounded-[1.8rem] space-y-4 shadow-md border border-slate-800">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#5CA28F] block">
                      Admin Verification Console
                    </span>

                    {/* Change assigned collector driver */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-400">Assigned Driver Unit</label>
                        <div className="relative">
                          <select
                            value={assignee}
                            onChange={(e) => setAssignee(e.target.value)}
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-bold text-white cursor-pointer appearance-none"
                          >
                            <option value="Driver Carlos">Driver Carlos (Route 2)</option>
                            <option value="Driver Roberto">Driver Roberto (Route 4)</option>
                            <option value="Driver Alex">Driver Alex (Communal Sweep)</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                      </div>

                      {/* Status quick tags */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-400">Direct Actions</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleUpdateStatus(selectedComplaint.id, 'Assigned')}
                            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black uppercase tracking-wider text-white cursor-pointer transition-colors"
                          >
                            Assign Unit
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(selectedComplaint.id, 'Resolved')}
                            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-wider text-white cursor-pointer transition-colors"
                          >
                            Mark Solved
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Input official logs remark */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400">Official Clearance Resolution Note</label>
                      <input
                        type="text"
                        placeholder="e.g. Sinks driver Roberto cleared illegal cardboard barrels."
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* CURRENT DISPATCH TRACKING UNIT */}
                {(selectedComplaint.assignedTo || selectedComplaint.resolutionRemark) && (
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2 text-xs">
                    <span className="font-black uppercase tracking-wide text-[10px] flex items-center gap-1 text-amber-700">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                      Dispatch Action Stamps
                    </span>
                    {selectedComplaint.assignedTo && (
                      <p className="font-semibold text-slate-700">
                        → Assigned Duty Unit: <span className="font-black text-amber-600">{selectedComplaint.assignedTo}</span>
                      </p>
                    )}
                    {selectedComplaint.resolutionRemark && (
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-[10px] font-extrabold text-emerald-700 uppercase flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Resolution Action Sheet
                        </p>
                        <p className="text-[11px] font-medium italic text-slate-650 mt-1">"{selectedComplaint.resolutionRemark}"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* STREAM CHATS CONVERSATION FOR THE REPORT */}
                <div className="space-y-3.5">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block border-b border-slate-100 pb-2">
                    Action Trail & Messages ({selectedComplaint.chats.length})
                  </span>

                  <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                    {selectedComplaint.chats.map((chat, idx) => (
                      <div key={idx} className={`flex gap-3 max-w-[85%] ${chat.role === role ? 'ml-auto flex-row-reverse' : ''}`}>
                        <div className={`p-3 rounded-2xl text-xs font-semibold ${
                          chat.role === role 
                            ? 'bg-amber-600 text-white rounded-tr-none' 
                            : 'bg-slate-100 text-slate-800 rounded-tl-none'
                        }`}>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1 leading-none text-opacity-80">
                            {chat.sender}
                          </p>
                          <p>{chat.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Send chat message */}
                  <form onSubmit={(e) => handleSendChat(e, selectedComplaint.id)} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type reference message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500/80 focus:bg-white"
                    />
                    <button
                      type="submit"
                      className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

              </motion.div>
            ) : (
              <div className="bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 h-96 flex flex-col justify-center items-center">
                <MessageSquare className="w-10 h-10 text-slate-350 mb-3 animate-bounce" />
                <p className="text-sm font-black text-slate-700">Verification Ledger Window</p>
                <p className="text-[11px] max-w-xs mt-1 text-slate-450 leading-relaxed">
                  Select any active rubbish report from the left sidebar to audit GPS drivers, append chat files, or log resolution stamps.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* SUBMIT COMPLAINT SLIDEOUT MODAL */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-slate-100"
            >
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Report Garbage Issue</h2>
              <p className="text-xs text-slate-500 mb-6 font-medium">Please provide accurate info for immediate barangay dispatch.</p>

              {validationError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold rounded-xl text-xs flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                {/* Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block ml-1">Issue Category</label>
                  <div className="relative">
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-extrabold text-slate-800 appearance-none cursor-pointer"
                    >
                      <option value="Overflowing Barangay Barrel">Overflowing Communal Barrel</option>
                      <option value="Missed Trash Pickup">Missed Weekly Curbside Truck</option>
                      <option value="Illegal Littering Alert">Illegal Littering / Dump Site</option>
                      <option value="Damaged Resident Trash Bin">Damaged Resident Pickup Barrel</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Purok and Phone in responsive 2 cols */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block ml-1">Assigned Purok</label>
                    <div className="relative">
                      <select
                        value={newPurok}
                        onChange={(e) => setNewPurok(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-extrabold text-slate-800 appearance-none cursor-pointer"
                      >
                        {Array.from({ length: 9 }, (_, i) => `Purok ${i + 1}`).map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block ml-1">Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="+63 9xx xxx xxxx"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Explanation text */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block ml-1">Explain Details & Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide landmarks (e.g., corner of Maple and Acacia Road) and specify any hazards..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 text-xs font-semibold text-slate-800"
                  />
                </div>

                {/* Camera mock snap slot */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block ml-1">Attach Geo-tagged Photo</label>
                  <div className="flex gap-2.5">
                    {(['overspill', 'missed', 'illegal', 'bin_fault'] as const).map((v) => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => setNewVisual(v)}
                        className={`flex-1 p-2 border text-center rounded-xl transition-all cursor-pointer select-none ${
                          newVisual === v 
                            ? 'border-amber-500 bg-amber-500/10 text-amber-700' 
                            : 'border-slate-200 bg-slate-50 text-slate-550'
                        }`}
                      >
                        <Camera className="w-5 h-5 mx-auto mb-1 opacity-70" />
                        <span className="text-[8px] font-black uppercase block capitalize">{v === 'bin_fault' ? 'damaged' : v}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit & Cancel footer actions */}
                <div className="pt-4 flex gap-3 text-xs font-black uppercase tracking-widest justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-6 py-3.5 text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl cursor-pointer shadow-md border-none flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>File Dispatch Report</span>
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
