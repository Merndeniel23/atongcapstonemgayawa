import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  History, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  PlusCircle, 
  Search, 
  Filter, 
  Check, 
  X, 
  Sparkles, 
  Database,
  ArrowDownToLine,
  ThumbsDown,
  UserCheck,
  AlertOctagon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppState } from '../context/AppStateContext';

export interface PaymentRecord {
  id: string;
  date: string;
  billingPeriod: string;
  amount: number;
  method: string;
  referenceNo: string;
  category: 'Weekly Fee' | 'Special Heavy Trash' | 'Hazardous Disposal';
  status: 'Paid' | 'Pending Verification' | 'Flagged';
  householdName: string;
  purok: string;
  householdId?: string;
}

const INITIAL_PAYMENTS: PaymentRecord[] = [];

interface PaymentPortalProps {
  role?: 'household' | 'collector' | 'leader' | 'admin';
}

export default function PaymentPortal({ role = 'household' }: PaymentPortalProps) {
  const { currentUser, userProfile } = useAppState();
  const activeUser = currentUser || userProfile;
  const displayName = activeUser?.name || 'Household';
  const displayZone = activeUser?.communalZone || 'Purok 4';
  
  const getPurokName = (zoneStr: string) => {
    if (!zoneStr) return 'Purok 4';
    const match = zoneStr.match(/Purok\s*\d+/i);
    return match ? match[0] : zoneStr;
  };
  const userPurok = getPurokName(displayZone);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'Weekly Fee' | 'Special Heavy Trash' | 'Hazardous Disposal'>('Weekly Fee');
  const [paymentMethod, setPaymentMethod] = useState('G-Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [amountInput, setAmountInput] = useState('5');
  const [notification, setNotification] = useState('');
  
  // Auditing filters & search
  const [purokFilter, setPurokFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const isNameMatch = (paymentName: string, userName: string) => {
    if (!paymentName || !userName) return false;
    const pName = paymentName.toLowerCase().trim();
    const uName = userName.toLowerCase().trim();
    if (pName === uName) return true;
    
    // Clean common words to compare core names
    const clean = (s: string) => s.replace(/\b(family|household|residence|house|home|purok\s*\d*)\b/gi, '').replace(/[^a-z0-9]/gi, '').trim();
    const pClean = clean(pName);
    const uClean = clean(uName);
    
    if (pClean && uClean) {
      return pClean === uClean || pClean.includes(uClean) || uClean.includes(pClean);
    }
    return false;
  };

  const isUserPayment = (p: PaymentRecord) => {
    if (!p) return false;
    if (p.householdId && activeUser?.householdId) {
      return p.householdId === activeUser.householdId;
    }
    return isNameMatch(p.householdName, displayName);
  };

  const migratePayments = (rawList: any[]): PaymentRecord[] => {
    return rawList.map((p: any) => {
      let updated = { ...p };
      if (p.category === 'Monthly Fee') {
        updated.category = 'Weekly Fee';
      }
      if (updated.category === 'Weekly Fee' && updated.amount === 30) {
        updated.amount = 5;
      }
      return updated;
    });
  };

  // Synchronized state fetcher
  const loadPayments = () => {
    const saved = localStorage.getItem('sg_payment_history');
    const version = localStorage.getItem('sg_payment_version_v3');
    
    if (saved && version === 'v3') {
      try {
        const parsed = JSON.parse(saved);
        const migrated = migratePayments(parsed);
        if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
          localStorage.setItem('sg_payment_history', JSON.stringify(migrated));
        }
        setPayments(migrated);
      } catch (e) {
        setPayments([]);
      }
    } else {
      // Force clean start with NO transactions first for the user as requested
      localStorage.setItem('sg_payment_history', JSON.stringify([]));
      localStorage.setItem('sg_payment_version_v3', 'v3');
      setPayments([]);
    }
  };

  useEffect(() => {
    loadPayments();
    // Watch for cross-storage shifts
    const handleStorageChange = () => {
      loadPayments();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNo.trim()) {
      alert('Please enter your transaction reference number.');
      return;
    }

    const newPayment: PaymentRecord = {
      id: `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      billingPeriod: selectedCategory === 'Weekly Fee' ? 'May 2026' : 'Ad-hoc Request',
      amount: Number(amountInput) || 150,
      method: paymentMethod,
      referenceNo: referenceNo.trim(),
      category: selectedCategory,
      status: 'Pending Verification',
      householdName: displayName,
      purok: userPurok,
      householdId: activeUser?.householdId
    };

    const updated = [newPayment, ...payments];
    setPayments(updated);
    localStorage.setItem('sg_payment_history', JSON.stringify(updated));

    setShowPayModal(false);
    setReferenceNo('');
    setNotification('Payment slip submitted successfully! Awaiting Leader or Admin verification.');
    setTimeout(() => setNotification(''), 4000);
  };

  // Change action for Review Desk
  const updatePaymentStatus = (id: string, newStatus: 'Paid' | 'Flagged') => {
    const updated = payments.map(p => {
      if (p.id === id) {
        return { ...p, status: newStatus };
      }
      return p;
    });
    setPayments(updated);
    localStorage.setItem('sg_payment_history', JSON.stringify(updated));

    // Also toggle the Member compliance status in MembersList
    const targetTxn = payments.find(p => p.id === id);
    if (targetTxn) {
      const savedMembers = localStorage.getItem('sg_purok_members');
      if (savedMembers) {
        try {
          const mList = JSON.parse(savedMembers);
          const updatedM = mList.map((m: any) => {
            const matchesName = (m.name || '').toLowerCase().includes((targetTxn.householdName || '').toLowerCase()) ||
                                (targetTxn.householdName || '').toLowerCase().includes((m.name || '').toLowerCase());
            if (matchesName) {
              return { ...m, status: newStatus === 'Paid' ? 'Compliant' : 'Warning' };
            }
            return m;
          });
          localStorage.setItem('sg_purok_members', JSON.stringify(updatedM));
        } catch (e) {
          console.error(e);
        }
      }
    }

    setNotification(`Transaction ${id} is successfully updated to [${newStatus}]!`);
    setTimeout(() => setNotification(''), 4000);
  };

  // Simulation of dynamic resident payment to showcase live reactive feedback
  const handleSimulatePayment = () => {
    const names = ['Delacruz Household', 'Daro Family', 'Deatras Residence', 'Estrella Family', 'Salvador Household'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomPurok = `Purok ${Math.floor(1 + Math.random() * 4)}`;
    const randomCategory = Math.random() > 0.6 ? 'Special Heavy Trash' : 'Weekly Fee';
    const randomAmount = randomCategory === 'Weekly Fee' ? 5 : 80;
    
    const simulated: PaymentRecord = {
      id: `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      billingPeriod: randomCategory === 'Weekly Fee' ? 'May 2026' : 'Ad-hoc Request',
      amount: randomAmount,
      method: Math.random() > 0.5 ? 'G-Cash' : 'PayMaya',
      referenceNo: `SIM-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: randomCategory as any,
      status: 'Pending Verification',
      householdName: randomName,
      purok: randomPurok,
    };

    const updated = [simulated, ...payments];
    setPayments(updated);
    localStorage.setItem('sg_payment_history', JSON.stringify(updated));
    setNotification(`🔔 Simulated incoming payment check from ${randomName} (${randomPurok})!`);
    setTimeout(() => setNotification(''), 4000);
  };

  const isCurrentMonthPaid = payments.some(
    (p) => p && isUserPayment(p) && p.billingPeriod === 'May 2026' && p.status === 'Paid'
  );
  
  const isCurrentMonthPending = payments.some(
    (p) => p && isUserPayment(p) && p.billingPeriod === 'May 2026' && p.status === 'Pending Verification'
  );

  const getStatusText = () => {
    if (isCurrentMonthPaid) return 'Paid';
    if (isCurrentMonthPending) return 'Pending Verification';
    return 'Unpaid';
  };

  // Audit Metrics Calculations
  const verifiedTotal = payments.filter(p => p && p.status === 'Paid').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingCount = payments.filter(p => p && p.status === 'Pending Verification').length;
  const flaggedCount = payments.filter(p => p && p.status === 'Flagged').length;

  // Filter computation
  const filteredPayments = payments.filter(p => {
    if (!p) return false;
    const matchesPurok = purokFilter === 'All' || p.purok === purokFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesSearch = (p.householdName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.referenceNo || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPurok && matchesStatus && matchesSearch;
  });

  const handleResetHistory = () => {
    localStorage.setItem('sg_payment_history', JSON.stringify([]));
    setPayments([]);
    setNotification('Ledger Database Reset: All payment logs cleared successfully.');
    setTimeout(() => setNotification(''), 4000);
  };

  const isAuditor = role === 'leader' || role === 'admin';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20 md:pb-0">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-[10px] uppercase tracking-[0.2em] mb-1">
            <Database className="w-3.5 h-3.5" />
            <span>{isAuditor ? 'Bookkeeper Audit Console' : 'Resident Sinking Ledger'}</span>
          </div>
          <h1 className="text-3.5xl font-black text-slate-9 tracking-tight leading-none">
            {isAuditor ? (role === 'admin' ? 'Financial Control Center' : 'Sector 4 Payment Hub') : 'My Bills & Payments'}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {isAuditor 
              ? 'Authorize GCash/PayMaya reference claims, inspect billing coverage schedules, and certify Purok compliance status.' 
              : 'Keep track of local environment conservation fees, query payment slips, and confirm clearance compliance status.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAuditor && (
            <button 
              onClick={handleSimulatePayment}
              className="px-5 py-3.5 bg-indigo-50 font-black text-xs text-indigo-700 uppercase tracking-wider rounded-2xl hover:bg-indigo-100 flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-indigo-200"
            >
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span>Simulate Citizen Payment →</span>
            </button>
          )}

          <button 
            onClick={handleResetHistory}
            className="px-5 py-3.5 bg-rose-50 font-black text-xs text-rose-700 uppercase tracking-wider rounded-2xl hover:bg-rose-100 flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-rose-200"
            title="Wipe payments for testing a blank state"
          >
            <span>✕ Clear All Receipts</span>
          </button>
        </div>
      </header>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 px-6 py-4 rounded-[1.8rem] flex items-center gap-3 shadow-md animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-black">{notification}</span>
        </div>
      )}

      {/* RENDER VIEW ACCORDING TO USER ROLE */}
      {!isAuditor ? (
        /* RESIDENT / HOUSEHOLD VIEW */
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Status Settle Card */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between md:col-span-2 relative overflow-hidden">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest block mb-1">CURRENT HOUSEHOLD STATUS</span>
                    <p className="text-2xl font-black text-slate-800">Weekly Environment Fee</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    getStatusText() === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    getStatusText() === 'Pending Verification' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-rose-50 text-rose-500 border-rose-200'
                  }`}>
                    {getStatusText() === 'Paid' ? 'Verified (Paid)' : getStatusText() === 'Pending Verification' ? 'Under Audit' : 'Unpaid'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-black text-slate-900">₱5.00</span>
                  <span className="text-xs text-slate-400 font-semibold">/ weekly community rate</span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Environmental compliance fees support waste collection trucks, local trash-bin optimization audits, and community recycling systems. Kindly declare reference numbers before billing periods terminate.
                </p>
              </div>

              {getStatusText() === 'Unpaid' ? (
                <button
                  onClick={() => {
                    setAmountInput('5');
                    setSelectedCategory('Weekly Fee');
                    setShowPayModal(true);
                  }}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  Settle Weekly Environment Fee
                </button>
              ) : getStatusText() === 'Pending Verification' ? (
                <div className="bg-amber-50/50 text-amber-800 p-5 rounded-2xl text-xs font-bold flex items-center gap-3 border border-amber-100/85">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-spin-slow" />
                  <div>
                    <h5 className="font-extrabold text-amber-900">Payment receipt is currently awaiting Leader Audit</h5>
                    <p className="text-[10px] text-amber-700 font-medium mt-1">Status will auto-confirm once your Purok Leader authorizes the G-Cash ledger reference.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/50 text-emerald-800 p-5 rounded-2xl text-xs font-bold flex items-center gap-3 border border-emerald-110">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="font-extrabold text-emerald-950">You are certified Environmental-Paid & Compliant!</h5>
                    <p className="text-[10px] text-emerald-700 mt-1">Your May 2026 credentials are verified and locked. Barangay clearance endorsement is active.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Total Payments Side Wallet */}
            <div className="bg-gradient-to-br from-[#059669] to-emerald-800 text-white p-6 rounded-[2.5rem] shadow-lg flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-800/50 to-transparent pointer-events-none" />
              <div className="relative z-10 space-y-6">
                <div>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">CERTIFIED CONTRIBUTIONS</p>
                  <p className="text-4xl font-black">
                    ₱{payments.filter(p => p && isUserPayment(p) && p.status === 'Paid').reduce((acc, curr) => acc + (curr.amount || 0), 0)}.00
                  </p>
                </div>
                
                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-xs leading-relaxed">
                  <p className="font-bold mb-1">Compliance Status Verification</p>
                  <p className="text-white/80">Certified <strong className="text-white">Eco-Compliant</strong>. Perfect calendar dump history has maintained your record safely.</p>
                </div>
              </div>
              <div className="text-[10px] text-emerald-200/80 font-black tracking-widest mt-6 relative z-10 flex items-center justify-between">
                <span>BARANGAY CENTRAL LEDGER</span>
                <TrendingUp className="w-4 h-4 text-emerald-200" />
              </div>
            </div>
          </div>

          {/* Citizen Log Table */}
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-black text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-600" />
                Receipt Tracking Ledger
              </h2>
              <button 
                onClick={() => {
                  setSelectedCategory('Special Heavy Trash');
                  setAmountInput('80');
                  setShowPayModal(true);
                }} 
                className="text-xs bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Declare Ad-hoc Fee
              </button>
            </div>

            {/* Visual horizontal scroll indicator guide for mobile */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-emerald-50/40 border-b border-slate-100/60 lg:hidden">
              <span className="text-[10px] font-extrabold text-emerald-700 tracking-wide uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                Ledger View Details
              </span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 animate-pulse-slide">
                ← Swipe horizontally to see full row data →
              </span>
            </div>

            <div className="overflow-x-auto pb-2 scrollbar-visible">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="text-[9px] font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest bg-slate-50">
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Settle Area</th>
                    <th className="px-6 py-4">Reference No</th>
                    <th className="px-6 py-4">Payment Sump</th>
                    <th className="px-6 py-4">Mode & Date</th>
                    <th className="px-6 py-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {payments.filter(p => p && isUserPayment(p)).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 font-mono text-slate-450 font-black">{p.id}</td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-extrabold text-slate-800">{p.category}</p>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">{p.billingPeriod}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-mono text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded-md font-bold">
                          {p.referenceNo}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-800">₱{p.amount}.00</p>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-bold text-slate-700">{p.method}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{p.date}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          p.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-150' :
                          p.status === 'Pending Verification' ? 'bg-amber-50 text-amber-600 border-amber-150' :
                          'bg-rose-50 text-rose-500 border-rose-150'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payments.filter(p => p && isUserPayment(p)).length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-bold text-xs uppercase">No receipts logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        /* AUDITOR / LEADER & ADMIN WORKSPACE */
        <>
          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 leading-none">₱{verifiedTotal}.00</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Verified Settle Sump</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 leading-none">{pendingCount}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Receipt Audit Queue</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 leading-none">{flaggedCount}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Flagged Receipts</p>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-white leading-none">
                  {payments.length > 0 ? Math.round((payments.filter(p => p.status === 'Paid').length / payments.length) * 100) : 100}%
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Collection Clearance %</p>
              </div>
            </div>
          </div>

          {/* Integrated Ledger Audit Queue */}
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            
            {/* Control Bar Filters */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
              <div>
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  Barangay Payments Verifier Space
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase">Showing {filteredPayments.length} of {payments.length} declared entries</p>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                
                {/* Search query box */}
                <div className="relative flex-1 md:w-60 min-w-[200px]">
                  <Search className="absolute left-3 w-4 h-4 text-slate-400 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Household or TxID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Purok filter dropdown */}
                <select
                  value={purokFilter}
                  onChange={(e) => setPurokFilter(e.target.value)}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black cursor-pointer"
                >
                  <option value="All">All Puroks</option>
                  <option value="Purok 1">Purok 1</option>
                  <option value="Purok 2">Purok 2</option>
                  <option value="Purok 3">Purok 3</option>
                  <option value="Purok 4">Purok 4</option>
                </select>

                {/* Status filter dropdown */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Pending Verification">Pending verification</option>
                  <option value="Paid">Verified Paid</option>
                  <option value="Flagged">Flagged / Recalled</option>
                </select>
              </div>
            </div>

            {/* Visual horizontal scroll indicator guide for administrator */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-emerald-50/40 border-b border-slate-100/60 xl:hidden">
              <span className="text-[10px] font-extrabold text-emerald-700 tracking-wide uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                Auditor Ledger Board
              </span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 animate-pulse-slide">
                ← Swipe horizontally to see all columns & choices →
              </span>
            </div>

            <div className="overflow-x-auto pb-2 scrollbar-visible">
              <table className="w-full text-left min-w-[950px]">
                <thead>
                  <tr className="text-[9px] font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest bg-slate-50/50">
                    <th className="px-6 py-4">Household & Purok</th>
                    <th className="px-6 py-4">Billing Category</th>
                    <th className="px-6 py-4">Receipt Details</th>
                    <th className="px-6 py-4">Declared Amount</th>
                    <th className="px-6 py-4">Status Log</th>
                    <th className="px-6 py-4 text-center">Decisions Console</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-700 flex items-center justify-center font-black rounded-xl text-xs border border-emerald-100">
                            {(p.householdName || '').charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-sm">{p.householdName || 'Environmental Contributor'}</p>
                            <p className="text-[10px] text-emerald-600 font-extrabold uppercase mt-0.5 tracking-wider">{p.purok}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-black text-slate-700">{p.category}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{p.billingPeriod}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <span className="font-mono text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded-md font-extrabold select-all" title="Click to copy">
                            {p.referenceNo}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1 font-bold">Via {p.method} • On {p.date}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-black text-slate-900 text-sm">₱{p.amount}.00</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          p.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-150' :
                          p.status === 'Pending Verification' ? 'bg-amber-50 text-amber-600 border-amber-150' :
                          'bg-rose-50 text-rose-500 border-rose-150'
                        }`}>
                          {p.status === 'Pending Verification' ? 'Awaiting Sign' : p.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center gap-2">
                          {p.status === 'Pending Verification' ? (
                            <>
                              <button
                                onClick={() => updatePaymentStatus(p.id, 'Paid')}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-605 active:scale-95 text-white font-black uppercase text-[10px] tracking-widest rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-sm hover:scale-105"
                                title="Authorize Deposit"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => updatePaymentStatus(p.id, 'Flagged')}
                                className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 border border-rose-200 font-black uppercase text-[10px] tracking-widest rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                                title="Reject Reference Number"
                              >
                                <X className="w-3.5 h-3.5" />
                                Flag Ref
                              </button>
                            </>
                          ) : p.status === 'Flagged' ? (
                            <button
                              onClick={() => updatePaymentStatus(p.id, 'Paid')}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-black uppercase text-[9px] tracking-wider rounded-lg hover:bg-emerald-120 cursor-pointer transition-all"
                            >
                              Overrule & Approve
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px]">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              Synced Ledger Locks
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-bold text-xs uppercase">No relevant receipts found matching search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* RETAIN DIALOG OR PAY MODAL FOR THE CITIZEN SUBMISSION */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-900">Declare Settle Receipt</h3>
                <button 
                  onClick={() => setShowPayModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-105 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer border border-transparent hover:scale-105 duration-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePay} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-slate-600 font-extrabold text-xs uppercase tracking-wider block">Billing Directory Category</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setSelectedCategory(val);
                      if (val === 'Weekly Fee') setAmountInput('5');
                      else if (val === 'Special Heavy Trash') setAmountInput('80');
                      else setAmountInput('120');
                    }}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500/20 text-sm"
                  >
                    <option value="Weekly Fee">Weekly Purok Maintenance Fee (₱5)</option>
                    <option value="Special Heavy Trash">Special Construction/Heavy Trash Pickup (₱80)</option>
                    <option value="Hazardous Disposal">E-Waste / Electronic hazardous disposal (₱120)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-600 font-extrabold text-xs uppercase tracking-wider block">Amount Settled (PHP)</label>
                  <input 
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-250 rounded-2xl text-xl font-black focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-600 font-extrabold text-xs uppercase tracking-wider block">Submitting Gateway Partner</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['G-Cash', 'PayMaya', 'Over-the-Counter'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`p-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          paymentMethod === method 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-600 font-bold' 
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl text-xs text-slate-600 leading-relaxed">
                  <p className="font-extrabold text-slate-800 mb-1">GC-MONITOR Ledger Memo:</p>
                  <p>Send exactly ₱{amountInput}.00 to CG-MONITOR at GCash/PayMaya. Save the reference number from your receipt and insert it below.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-600 font-extrabold text-xs uppercase tracking-wider block">Gateway Transaction Reference Number</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. GC-991204128"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 uppercase"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white font-extrabold uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10 cursor-pointer"
                >
                  Submit Payment Settle Request
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
