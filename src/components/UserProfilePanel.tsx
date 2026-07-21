import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { User, MapPin, Phone, ShieldCheck, Mail, Award, ShieldAlert, ChevronDown, FileText, Send, HelpCircle } from 'lucide-react';

export default function UserProfilePanel() {
  const { userProfile, currentUser, updateProfile, userRole, addComplaint } = useAppState();
  
  const activeUser = currentUser || userProfile;

  const barangays = [
    'Pilipog',
    'Poblacion',
    'Bangbang',
    'Algeria',
    'Day-as',
    'Buagsong',
    'Dapitan',
    'Cogon',
    'Ibabao',
    'Gilutungan',
    'Catarman',
    'Gabi',
    'San Miguel'
  ];

  const puroks = [
    'Purok 1',
    'Purok 2',
    'Purok 3',
    'Purok 4',
    'Purok 5',
    'Purok 6',
    'Purok 7',
    'Purok 8',
    'Purok 9'
  ];

  // Local state for form input fields
  const [name, setName] = useState(activeUser.name);
  const [email, setEmail] = useState(activeUser.email || '');
  const [address, setAddress] = useState(activeUser.address || '123 Purok Central');
  const [householdId, setHouseholdId] = useState(activeUser.householdId || activeUser.id || 'HH-2026-904');
  const [contactInfo, setContactInfo] = useState(activeUser.phone || activeUser.contactInfo || '0912345678');
  const [selectedBarangay, setSelectedBarangay] = useState('Poblacion');
  const [selectedPurok, setSelectedPurok] = useState('Purok 4');

  // Address Correction Request states
  const [correctionBarangay, setCorrectionBarangay] = useState('Poblacion');
  const [correctionPurok, setCorrectionPurok] = useState('Purok 4');
  const [correctionAddress, setCorrectionAddress] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionSuccess, setCorrectionSuccess] = useState('');
  const [correctionError, setCorrectionError] = useState('');
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);

  const [notif, setNotif] = useState('');
  const [error, setError] = useState('');

  // Dynamically initialize fields when user state is ready
  useEffect(() => {
    const active = currentUser || userProfile;
    if (active) {
      setName(active.name);
      setEmail(active.email || 'test@household.com');
      setAddress(active.address || '123 Purok Central');
      setHouseholdId(active.householdId || active.id || 'HH-2026-904');
      setContactInfo(active.phone || active.contactInfo || '0912345678');
      setCorrectionAddress(active.address || '123 Purok Central');
      
      const rawZone = active.communalZone || 'Purok 4 communal zone';
      let p = 'Purok 4';
      let b = 'Poblacion';
      
      const matchingPurok = puroks.find(pk => rawZone.toLowerCase().includes(pk.toLowerCase()));
      const matchingBgy = barangays.find(bgy => rawZone.toLowerCase().includes(bgy.toLowerCase()));
      
      if (matchingPurok) p = matchingPurok;
      if (matchingBgy) b = matchingBgy;
      
      setSelectedPurok(p);
      setSelectedBarangay(b);
      setCorrectionPurok(p);
      setCorrectionBarangay(b);
    }
  }, [currentUser, userProfile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotif('');

    // Input Validation
    if (!name.trim() || !email.trim() || !contactInfo.trim()) {
      setError('Please fill in all required fields (Name, Email, and Mobile).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid email format (e.g. name@domain.com).');
      return;
    }

    updateProfile({
      name: name.trim(),
      email: email.trim(),
      address: address.trim(),
      householdId: householdId.trim(),
      contactInfo: contactInfo.trim(),
      communalZone: `${selectedPurok}, ${selectedBarangay}`,
      phone: contactInfo.trim() // update phone
    });

    setNotif('Profile updated successfully! Welcome back banner has been synchronized.');
    setTimeout(() => setNotif(''), 4000);
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCorrectionError('');
    setCorrectionSuccess('');

    if (!correctionAddress.trim()) {
      setCorrectionError('Please provide the physical delivery address you want to change to.');
      return;
    }
    if (!correctionReason.trim()) {
      setCorrectionError('Please explain why this correction is needed so the Purok Leader can review it.');
      return;
    }

    addComplaint({
      type: 'Address & Zone Correction',
      purok: selectedPurok,
      description: `[Address Correction Request]
Requested Barangay: ${correctionBarangay}
Requested Purok: ${correctionPurok}
Requested Physical Address: ${correctionAddress.trim()}
Reason: ${correctionReason.trim()}`,
      creator: name,
      phone: contactInfo,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'Pending Review'
    });

    setCorrectionSuccess('Correction request successfully filed! Your Purok Leader & Admin have been notified. They can approve and automatically apply this change.');
    setCorrectionReason('');
    
    // Clear success message after 6 seconds
    setTimeout(() => setCorrectionSuccess(''), 6000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 md:pb-0">
      <div>
        <span className="text-emerald-600 font-extrabold text-[10px] uppercase tracking-[0.2em] block mb-1">Household Settings</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">My Profile</h1>
        <p className="text-slate-500 text-xs mt-1">Manage environmental credentials, contact numbers, and bin zones.</p>
      </div>

      {notif && (
        <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 px-6 py-4 rounded-[1.8rem] flex items-center gap-3 shadow-md animate-bounce">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-black">{notif}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-150 text-rose-800 px-6 py-4 rounded-[1.8rem] flex items-center gap-3 shadow-md">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-xs font-black">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8 space-y-8">
        
        {/* Profile Avatar Card */}
        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-2xl border-2 border-emerald-500/20 shadow-inner">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-lg font-black text-slate-800 leading-none">{name}</h3>
            <p className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest">{selectedPurok}, {selectedBarangay}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {householdId}</p>
          </div>
        </div>

        {/* Editable Form */}
        <form onSubmit={handleSave} className="space-y-6 text-xs font-semibold">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1.5">
              <label className="text-slate-450 font-black uppercase tracking-widest block ml-1">Household Owner Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-extrabold focus:ring-2 focus:ring-emerald-500/10 focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-450 font-black uppercase tracking-widest block ml-1">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-extrabold focus:ring-2 focus:ring-emerald-500/10 focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-450 font-black uppercase tracking-widest block ml-1">Contact Mobile Number</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-4 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={contactInfo} 
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-extrabold focus:ring-2 focus:ring-emerald-500/10 focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-slate-450 font-black uppercase tracking-widest block">Communal Zone Assignment</label>
                {userRole === 'household' && (
                  <span className="text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">Locked</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative flex items-center">
                  <MapPin className="absolute left-4 w-4 h-4 text-slate-400" />
                  <select 
                    value={selectedBarangay} 
                    onChange={(e) => setSelectedBarangay(e.target.value)}
                    disabled={userRole === 'household'}
                    className={`w-full pl-11 pr-10 py-3.5 border rounded-2xl text-xs font-extrabold focus:ring-2 focus:ring-emerald-500/10 focus:outline-none focus:border-emerald-500 transition-all appearance-none ${
                      userRole === 'household'
                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200 text-slate-800 cursor-pointer'
                    }`}
                  >
                    {barangays.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {userRole !== 'household' && <ChevronDown className="absolute right-4 w-4 h-4 text-slate-400 pointer-events-none" />}
                </div>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-4 w-4 h-4 text-slate-400" />
                  <select 
                    value={selectedPurok} 
                    onChange={(e) => setSelectedPurok(e.target.value)}
                    disabled={userRole === 'household'}
                    className={`w-full pl-11 pr-10 py-3.5 border rounded-2xl text-xs font-extrabold focus:ring-2 focus:ring-emerald-500/10 focus:outline-none focus:border-emerald-500 transition-all appearance-none ${
                      userRole === 'household'
                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200 text-slate-800 cursor-pointer'
                    }`}
                  >
                    {puroks.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {userRole !== 'household' && <ChevronDown className="absolute right-4 w-4 h-4 text-slate-400 pointer-events-none" />}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-450 font-black uppercase tracking-widest block ml-1">Household ID Code (Read Only)</label>
              <div className="relative flex items-center">
                <Award className="absolute left-4 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={householdId} 
                  disabled
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-bold cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-slate-450 font-black uppercase tracking-widest block">Physical Delivery Address</label>
                {userRole === 'household' && (
                  <span className="text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">Locked</span>
                )}
              </div>
              <div className="relative flex items-center">
                <MapPin className="absolute left-4 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={userRole === 'household'}
                  className={`w-full pl-11 pr-4 py-3.5 border rounded-2xl font-extrabold focus:ring-2 focus:ring-emerald-500/10 focus:outline-none focus:border-emerald-500 transition-all ${
                    userRole === 'household'
                      ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  required
                />
              </div>
            </div>

          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-800/10 cursor-pointer border-none"
          >
            Save Profile Credentials
          </button>
        </form>

        {userRole === 'household' && (
          <div className="pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCorrectionForm(!showCorrectionForm)}
              className="w-full flex items-center justify-between p-4 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 rounded-2xl text-left cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-tight">Mistake in your Address or Zone?</h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">Submit an official correction report to your Purok Leader or Admin.</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCorrectionForm ? 'rotate-180' : ''}`} />
            </button>

            {showCorrectionForm && (
              <form onSubmit={handleCorrectionSubmit} className="mt-4 p-5 bg-slate-50 border border-slate-150 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-slate-700 font-black text-[10px] uppercase tracking-wider pb-2 border-b border-slate-200">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Official Correction Ticket
                </div>

                {correctionSuccess && (
                  <div className="bg-emerald-50 border border-emerald-150 text-emerald-850 p-4 rounded-xl flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[10px] font-bold">{correctionSuccess}</span>
                  </div>
                )}

                {correctionError && (
                  <div className="bg-rose-50 border border-rose-150 text-rose-850 p-4 rounded-xl flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="text-[10px] font-bold">{correctionError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block ml-1">Requested Barangay</label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                      <select 
                        value={correctionBarangay} 
                        onChange={(e) => setCorrectionBarangay(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-extrabold focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                      >
                        {barangays.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block ml-1">Requested Purok</label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                      <select 
                        value={correctionPurok} 
                        onChange={(e) => setCorrectionPurok(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-extrabold focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                      >
                        {puroks.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block ml-1">Requested Physical Delivery Address</label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. 123 Purok Central, Brgy. Poblacion"
                      value={correctionAddress} 
                      onChange={(e) => setCorrectionAddress(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block ml-1">Reason for Address Correction</label>
                  <textarea 
                    placeholder="Describe the reason for change (e.g., typos in name, mistaken zone assignment on registration, relocation inside Barangay, etc.)"
                    value={correctionReason} 
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    rows={3}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-wider text-[10px] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <Send className="w-3.5 h-3.5" />
                  File Correction Report
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
