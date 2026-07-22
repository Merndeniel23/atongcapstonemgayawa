import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppState } from '../context/AppStateContext';
import { GoogleLogin } from '@react-oauth/google';
import {
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  Leaf, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function Registration() {
  const { loginUser, registerUser, registeredUsers } = useAppState();
  
  // Tab state: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration fields
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBarangay, setRegBarangay] = useState('Poblacion');
  const [regPurok, setRegPurok] = useState('Purok 4');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  // Feedback states
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

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

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setError('');
  setSuccessMessage('');

  if (!loginEmail.trim() || !loginPassword) {
    setError('Please fill in all credentials.');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: loginEmail.trim(),
        password: loginPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || 'Login failed.');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('token', data.token);
    } else {
      sessionStorage.setItem('token', data.token);
    }

    const result = loginUser(
      loginEmail.trim(),
      loginPassword,
      rememberMe
    );

    if (!result.success) {
      setError(
        result.error ||
          'Database login succeeded, but the app session could not start.'
      );
      return;
    }

    setSuccessMessage('Login successful! Entering dashboard...');
  } catch (error) {
    console.error(error);
    setError('Cannot connect to the server.');
  }
};
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!regFullName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword || !regConfirmPassword) {
      setError('Please fill in all registration fields.');
      return;
    }

    if (!validateEmail(regEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const res = registerUser({
      name: regFullName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      communalZone: `${regPurok}, ${regBarangay}`,
      password: regPassword
    });

    if (!res.success) {
      setError(res.error || 'Registration failed.');
    } else {
      setSuccessMessage('Account registered successfully! Redirecting...');
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) return;
    
    // Simulate finding user
    const found = registeredUsers.some(u => u.email.toLowerCase() === forgotPasswordEmail.trim().toLowerCase());
    
    if (found) {
      alert(`Simulation: Reset link sent successfully to ${forgotPasswordEmail}. Since this is a local sandbox environment, your password is 'password123'.`);
    } else {
      alert(`Simulation: That email is not registered in our local sandbox database. Try test@household.com`);
    }
    
    setShowForgotModal(false);
    setForgotPasswordEmail('');
  };


  return (
    <div className="min-h-screen w-full bg-[#FAFBF9] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-stone-900 relative">
      {/* Absolute top decoration */}
      <div className="absolute top-0 inset-x-0 h-2 bg-emerald-700" />
      
      {/* Decorative blurred spots */}
      <div className="absolute top-[15%] left-[10%] w-[350px] h-[350px] bg-emerald-700/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] bg-emerald-700/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* APP LOGO & HEADER */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-700 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-700/20">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-stone-850 tracking-tight leading-none uppercase">
              Smart Garbage
            </h1>
            <p className="text-[10px] font-extrabold tracking-[0.25em] text-emerald-700 uppercase mt-1">
              Monitoring System
            </p>
          </div>
        </div>

        {/* MAIN AUTH CONTAINER */}
        <div className="bg-white rounded-3xl border border-stone-200/60 shadow-xl overflow-hidden p-6 sm:p-8 transition-all">
          
          {/* TAB SEGMENT */}
          <div className="flex border-b border-stone-100 pb-5 mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setError(''); setSuccessMessage(''); }}
              className={`flex-1 text-center pb-2 text-xs uppercase font-extrabold tracking-wider transition-all relative ${
                activeTab === 'login' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              Sign In
              {activeTab === 'login' && (
                <motion.div layoutId="authUnderline" className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-700" />
              )}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setError(''); setSuccessMessage(''); }}
              className={`flex-1 text-center pb-2 text-xs uppercase font-extrabold tracking-wider transition-all relative ${
                activeTab === 'register' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              Create Account
              {activeTab === 'register' && (
                <motion.div layoutId="authUnderline" className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-700" />
              )}
            </button>
          </div>

          {/* STATUS NOTIFICATIONS */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 p-3.5 bg-rose-50 border border-rose-200/50 text-rose-700 rounded-xl text-xs flex items-start gap-2.5"
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5"
              >
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORMS */}
          {activeTab === 'login' ? (
            /* LOGIN SCREEN */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-stone-500 block ml-1">
                  Email or Household ID
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="test@household.com or HH-2026-904"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#FAFBF9] border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-700/10 focus:border-emerald-700 transition-all text-xs font-semibold text-stone-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-stone-500 block ml-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter account password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-[#FAFBF9] border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-700/10 focus:border-emerald-700 transition-all text-xs font-semibold text-stone-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 p-1 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-emerald-750 border-stone-300 rounded focus:ring-emerald-700/20 accent-emerald-700"
                  />
                  <span className="text-[11px] font-semibold text-stone-500">Remember Me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

             <>
  <button
    type="submit"
    className="w-full mt-4 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-extrabold uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-emerald-800/10 transition-all cursor-pointer border-none"
  >
    Authenticate & Enter Console
  </button>

  <div className="flex items-center my-4">
    <div className="flex-1 border-t border-gray-300"></div>
    <span className="px-3 text-xs text-gray-500 font-semibold">OR</span>
    <div className="flex-1 border-t border-gray-300"></div>
  </div>

  <div className="flex justify-center">
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        try {
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              credential: credentialResponse.credential,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            setError(data.message || 'Google login failed.');
            return;
          }

          localStorage.setItem('token', data.token);
          setSuccessMessage('Google login successful!');
        } catch (err) {
          console.error(err);
          setError('Unable to connect to the server.');
        }
      }}
      onError={() => {
        setError('Google Sign-In failed.');
      }}
    />
  </div>
</>
            </form>
          ) : (
            /* REGISTRATION SCREEN */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-stone-500 block ml-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-4 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g., Mark Rallos"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-[#FAFBF9] border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-700/10 focus:border-emerald-700 transition-all text-xs font-semibold text-stone-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-stone-500 block ml-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g., mark@household.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-[#FAFBF9] border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-700/10 focus:border-emerald-700 transition-all text-xs font-semibold text-stone-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-stone-500 block ml-1">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-4 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g., +63 912 345 6789"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-[#FAFBF9] border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-700/10 focus:border-emerald-700 transition-all text-xs font-semibold text-stone-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-stone-500 block ml-1">
                  Assigned Communal Zone (Barangay & Purok)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-4 w-4 h-4 text-stone-400" />
                    <select
                      value={regBarangay}
                      onChange={(e) => setRegBarangay(e.target.value)}
                      className="w-full pl-11 pr-10 py-2.5 bg-[#FAFBF9] border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-700/10 focus:border-emerald-700 transition-all text-xs font-semibold text-stone-800 appearance-none cursor-pointer"
                    >
                      {barangays.map((bgy) => (
                        <option key={bgy} value={bgy}>
                          {bgy}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>

                  <div className="relative flex items-center">
                    <MapPin className="absolute left-4 w-4 h-4 text-stone-400" />
                    <select
                      value={regPurok}
                      onChange={(e) => setRegPurok(e.target.value)}
                      className="w-full pl-11 pr-10 py-2.5 bg-[#FAFBF9] border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-700/10 focus:border-emerald-700 transition-all text-xs font-semibold text-stone-800 appearance-none cursor-pointer"
                    >
                      {puroks.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-stone-500 block ml-1">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#FAFBF9] border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-700/10 focus:border-emerald-700 transition-all text-xs font-semibold text-stone-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-stone-500 block ml-1">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#FAFBF9] border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-700/10 focus:border-emerald-700 transition-all text-xs font-semibold text-stone-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-bold text-stone-500 hover:text-stone-700 flex items-center gap-1"
                >
                  {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                </button>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-emerald-750 hover:bg-emerald-800 active:scale-[0.98] text-white font-extrabold uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-emerald-800/10 transition-all cursor-pointer border-none bg-emerald-700"
              >
                Register & Join Network
              </button>
            </form>
          )}

          {/* TOGGLE BOTTOM LINK */}
          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            {activeTab === 'login' ? (
              <p className="text-[11px] text-stone-500 font-semibold">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setError(''); setSuccessMessage(''); }}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p className="text-[11px] text-stone-500 font-semibold">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setError(''); setSuccessMessage(''); }}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>



        {/* FOOTER */}
        <p className="text-[9px] font-extrabold tracking-widest text-stone-400 uppercase text-center">
          Barangay Environmental Sinks System • Powered by EcoTrack
        </p>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                <HelpCircle className="w-5 h-5" />
              </span>
              <h3 className="text-sm font-black text-stone-800 uppercase tracking-tight">Forgot Password?</h3>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
              Enter your registered email address and we will provide you with options to reset your password instantly.
            </p>
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#FAFBF9] border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-700/10 focus:border-emerald-700 transition-all text-xs font-semibold text-stone-800"
              />
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(false); setForgotPasswordEmail(''); }}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[10px] font-extrabold text-stone-500 hover:bg-stone-50 transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[10px] font-extrabold transition-colors uppercase tracking-wider border-none cursor-pointer"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
