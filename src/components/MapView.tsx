import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Navigation, 
  X, 
  Info, 
  Camera, 
  Image as ImageIcon, 
  Truck, 
  Play, 
  Pause, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Compass, 
  Sliders, 
  Eye, 
  RefreshCw, 
  HelpCircle,
  FileCheck,
  Flag
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';

interface CommunalPoint {
  id: number;
  location: string;
  bins: number;
  urgency: string;
  time: string;
  collected: boolean;
  x: number;
  y: number;
  image: string;
  desc: string;
}

export default function MapView() {
  const { schedules, updateScheduleStatus } = useAppState();

  // Local storage coordination for communal points (synced with CollectorDashboard)
  const [communalPoints, setCommunalPoints] = useState<CommunalPoint[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sg_communal_points') : null;
    return saved ? JSON.parse(saved) : [
      { id: 1, location: 'Purok 4 - Main Road', bins: 3, urgency: 'High', time: '10m away', collected: false, x: 30, y: 40, image: 'https://media.istockphoto.com/id/1323762998/photo/garbage-crisis-in-sector-1-bucharest.jpg?s=612x612&w=0&k=20&c=dlHXHjBYWnI2KMKIoeNNfXS35LypTQ9legUOz3-Iehw=', desc: 'Located near the community basketball court.' },
      { id: 2, location: 'Purok 1 - Barangay Hall', bins: 5, urgency: 'Medium', time: '25m away', collected: false, x: 65, y: 25, image: 'https://media.istockphoto.com/id/2151562183/photo/the-man-throwing-garbage-into-the-trash-bin.jpg?s=612x612&w=0&k=20&c=JFws0xs9pPNHDc5voGR0bOLO4SEEqY6yxzDW2KQrjXo=', desc: 'Located near the Barangay Hall crossing.' },
      { id: 3, location: 'Purok 7 - Market Area', bins: 8, urgency: 'Very High', time: '2m away', collected: false, x: 50, y: 70, image: 'https://media.istockphoto.com/id/2151575593/photo/trash-on-the-sidewalk.jpg?s=612x612&w=0&k=20&c=Ypy2z8Aj4CrI7TRonNlHdsttTZuLu4zeMpHk6nUdRSA=', desc: 'Located near the local pharmacy and fresh food market.' }
    ];
  });

  // Save to localStorage when communal points change
  useEffect(() => {
    localStorage.setItem('sg_communal_points', JSON.stringify(communalPoints));
  }, [communalPoints]);

  // Map Filter state
  const [filterType, setFilterType] = useState<'all' | 'resident' | 'communal'>('all');

  // Selected Pin coordinates & metadata
  const [selectedPin, setSelectedPin] = useState<{ id: string | number; type: 'resident' | 'communal' } | null>(null);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0); // 0 to 1
  const [simSpeed, setSimSpeed] = useState<1 | 3 | 10>(3); // Multiplier
  const [activeTarget, setActiveTarget] = useState<{ id: string | number; type: 'resident' | 'communal'; x: number; y: number; name: string } | null>(null);
  
  // Proof Photo Uploader mock state
  const [uploadedProof, setUploadedProof] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Success Feedback state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Starting Depot Coordinates
  const depot = { x: 15, y: 85, name: 'Barangay central Depot' };

  // Combine and normalize all locations on the map
  // Map schedules to dynamic coordinates based on location/purok
  const mapLocations = [
    ...communalPoints.map(p => ({
      id: p.id,
      key: `communal-${p.id}`,
      type: 'communal' as const,
      x: p.x,
      y: p.y,
      purok: p.location.split(' - ')[0],
      title: p.location,
      status: p.collected ? 'Collected' : 'Pending Ready',
      urgency: p.urgency,
      image: p.image,
      desc: p.desc,
      extraInfo: `${p.bins} bins present`,
      collected: p.collected
    })),
    ...schedules.map((s, index) => {
      // Predictable coordinates based on Purok/index to make them look beautifully spread out on the grid
      let defaultX = 40;
      let defaultY = 45;
      if (s.location.includes('Purok 4')) {
        defaultX = 35 + (index * 4) % 15;
        defaultY = 42 + (index * 3) % 12;
      } else if (s.location.includes('Purok 1')) {
        defaultX = 68 - (index * 5) % 15;
        defaultY = 28 + (index * 2) % 10;
      } else if (s.location.includes('Purok 7')) {
        defaultX = 46 + (index * 4) % 12;
        defaultY = 72 - (index * 4) % 12;
      } else {
        defaultX = 25 + (index * 12) % 50;
        defaultY = 30 + (index * 8) % 40;
      }

      return {
        id: s.id,
        key: `resident-${s.id}`,
        type: 'resident' as const,
        x: defaultX,
        y: defaultY,
        purok: s.location.split(' ')[0] || 'Resident',
        title: `${s.location} (${s.type})`,
        status: s.status === 'Completed' ? 'Collected' : s.status,
        urgency: s.status === 'Completed' ? 'Collected' : 'Standard',
        image: s.type === 'Recyclable' 
          ? 'https://media.istockphoto.com/id/2151562183/photo/the-man-throwing-garbage-into-the-trash-bin.jpg?s=612x612&w=0&k=20&c=JFws0xs9pPNHDc5voGR0bOLO4SEEqY6yxzDW2KQrjXo=' 
          : s.type === 'Hazardous'
          ? 'https://media.istockphoto.com/id/1154378752/photo/hazardous-waste-sign-on-barrels.jpg?s=612x612&w=0&k=20&c=h7e8m2G6mre1H_0H0G9e2A6_tIu_FqBfS6hP_g9M_0s='
          : 'https://media.istockphoto.com/id/1323762998/photo/garbage-crisis-in-sector-1-bucharest.jpg?s=612x612&w=0&k=20&c=dlHXHjBYWnI2KMKIoeNNfXS35LypTQ9legUOz3-Iehw=',
        desc: `Scheduled household pick-up request for ${s.type}. Time Slot: ${s.time}.`,
        extraInfo: `Scheduled: ${s.date}`,
        collected: s.status === 'Completed'
      };
    })
  ];

  // Filtering list
  const filteredLocations = mapLocations.filter(loc => {
    if (filterType === 'resident') return loc.type === 'resident';
    if (filterType === 'communal') return loc.type === 'communal';
    return true;
  });

  // Find currently selected location details
  const selectedLocationDetails = mapLocations.find(
    loc => selectedPin && loc.id === selectedPin.id && loc.type === selectedPin.type
  );

  // Simulation timer hook
  useEffect(() => {
    let interval: any;
    if (isSimulating && activeTarget) {
      interval = setInterval(() => {
        setSimProgress(prev => {
          const step = (0.015 * simSpeed);
          if (prev + step >= 1) {
            setIsSimulating(false);
            return 1;
          }
          return prev + step;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isSimulating, activeTarget, simSpeed]);

  // Start route towards a targeted location
  const handleStartRoute = (loc: typeof mapLocations[0]) => {
    setActiveTarget({
      id: loc.id,
      type: loc.type,
      x: loc.x,
      y: loc.y,
      name: loc.title
    });
    setSimProgress(0);
    setIsSimulating(true);
    setUploadedProof(null); // Clear any previous proof
  };

  // Skip simulation instantly to destination
  const handleSkipToDestination = () => {
    if (activeTarget) {
      setSimProgress(1);
      setIsSimulating(false);
    }
  };

  // Complete clean up & submit
  const handleConfirmCollection = () => {
    if (!activeTarget) return;

    if (activeTarget.type === 'resident') {
      // Update AppStateContext with proof photo
      updateScheduleStatus(activeTarget.id as string, 'Completed', uploadedProof || undefined);
      setSuccessMessage(`Resident booking from ${activeTarget.name} has been marked as COLLECTED successfully!`);
    } else {
      // Update local storage communal points with proof photo
      setCommunalPoints(prev =>
        prev.map(p => p.id === activeTarget.id ? { ...p, collected: true, urgency: 'Collected', proofPhotoUrl: uploadedProof || undefined } : p)
      );
      setSuccessMessage(`Communal collection point at ${activeTarget.name} has been processed successfully!`);
    }

    setShowSuccessNotification(true);
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 4000);

    // Clear active target & selection
    setActiveTarget(null);
    setSimProgress(0);
    setUploadedProof(null);
    setSelectedPin(null);
  };

  // Turn by turn directions generator
  const getRouteInstruction = () => {
    if (!activeTarget) return 'Select a destination point to start dispatching.';
    if (simProgress === 0) return 'Preparing dispatch vehicle and crew at central Depot...';
    if (simProgress < 0.25) return 'Leaving Central Depot. Heading north-east on main boulevard.';
    if (simProgress < 0.5) return `Entering ${activeTarget.purok} corridor. Proceeding past municipal borders.`;
    if (simProgress < 0.75) return 'Slowing down near community intersections. Navigating to collection site.';
    if (simProgress < 1) return 'Approaching collection zone. Spotting garbage terminals...';
    return 'Arrived! Vehicle is parked safely. Ready to collect and verify waste.';
  };

  // Mock File Upload handler
  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedProof(event.target.result as string);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Interpolated Truck Coordinates for animation
  const truckX = activeTarget ? depot.x + (activeTarget.x - depot.x) * simProgress : depot.x;
  const truckY = activeTarget ? depot.y + (activeTarget.y - depot.y) * simProgress : depot.y;

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 relative">
      
      {/* Toast Notification for Success */}
      <AnimatePresence>
        {showSuccessNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-sm">Task Completed Successfully</p>
              <p className="text-xs text-emerald-100 mt-0.5">{successMessage}</p>
            </div>
            <button 
              onClick={() => setShowSuccessNotification(false)}
              className="ml-auto p-1 text-white hover:bg-white/10 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight">Interactive Route Map</h1>
          <p className="text-slate-500 text-sm">Targeting: Barangay Central • Area A dispatch zone</p>
        </div>
        
        {/* Filters and Controls */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              filterType === 'all' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({mapLocations.length})
          </button>
          <button
            onClick={() => setFilterType('resident')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              filterType === 'resident' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resident ({schedules.length})
          </button>
          <button
            onClick={() => setFilterType('communal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              filterType === 'communal' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Communal ({communalPoints.length})
          </button>
        </div>
      </header>

      {/* Main Two Column Dashboard */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Side: Dynamic Map View */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-3 relative h-[500px] lg:h-auto min-h-[400px]">
          <div className="flex-1 relative bg-slate-100 rounded-[1.8rem] overflow-hidden border-4 border-white shadow-inner">
            
            {/* Map Photo Underlay */}
            <div className="absolute inset-0 opacity-25">
              <img 
                src="https://media.istockphoto.com/id/578108630/photo/push-pins-on-a-road-map.jpg?s=612x612&w=0&k=20&c=Mf67L3jm7Ydq8FgJWGRiVJjFqpIwdZjBhjwPIB0Ba0E=" 
                className="w-full h-full object-cover filter brightness-90 saturate-150 grayscale-20" 
                referrerPolicy="no-referrer" 
                alt="map grid underlay"
              />
            </div>
            
            {/* Fine Grid Lines overlay */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-20 pointer-events-none">
              {[...Array(144)].map((_, i) => <div key={i} className="border border-slate-300" />)}
            </div>

            {/* Simulated Active Route Path Line */}
            {activeTarget && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                
                {/* Full Route Line */}
                <line 
                  x1={`${depot.x}%`} 
                  y1={`${depot.y}%`} 
                  x2={`${activeTarget.x}%`} 
                  y2={`${activeTarget.y}%`} 
                  stroke="url(#routeGradient)" 
                  strokeWidth="5" 
                  strokeLinecap="round"
                  className="opacity-40"
                />

                {/* Animated Dashed Path Overlay */}
                <line 
                  x1={`${depot.x}%`} 
                  y1={`${depot.y}%`} 
                  x2={`${activeTarget.x}%`} 
                  y2={`${activeTarget.y}%`} 
                  stroke="#10b981" 
                  strokeWidth="5" 
                  strokeDasharray="10,8"
                  className="opacity-80"
                  style={{
                    strokeDashoffset: isSimulating ? -simProgress * 100 : 0,
                    transition: 'stroke-dashoffset 0.1s linear'
                  }}
                />
              </svg>
            )}

            {/* Central Depot Location Pin */}
            <div 
              style={{ left: `${depot.x}%`, top: `${depot.y}%`, transform: 'translate(-50%, -50%)' }}
              className="absolute z-20 flex flex-col items-center group cursor-pointer"
            >
              <div className="bg-slate-900 text-white p-2 rounded-2xl shadow-xl border-2 border-white flex items-center justify-center hover:scale-110 transition-transform">
                <Truck className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="absolute -bottom-6 bg-slate-900/90 text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded shadow-md whitespace-nowrap tracking-wider">
                Depot Terminal
              </span>
            </div>

            {/* Interactive Garbage Target Pins */}
            {filteredLocations.map((loc) => {
              const isSelected = selectedPin?.id === loc.id && selectedPin?.type === loc.type;
              const isActiveTarget = activeTarget?.id === loc.id && activeTarget?.type === loc.type;
              
              return (
                <motion.button
                  key={loc.key}
                  initial={{ scale: 0 }}
                  animate={{ scale: isSelected ? 1.3 : 1 }}
                  whileHover={{ scale: 1.25, zIndex: 30 }}
                  onClick={() => {
                    setSelectedPin({ id: loc.id, type: loc.type });
                    // Automatically view the location
                  }}
                  style={{ 
                    left: `${loc.x}%`, 
                    top: `${loc.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute z-10 p-2.5 rounded-full shadow-lg border-2 border-white transition-colors duration-300 cursor-pointer ${
                    loc.collected 
                      ? 'bg-slate-400 text-white opacity-60' 
                      : isSelected 
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-125' 
                      : isActiveTarget
                      ? 'bg-blue-600 text-white animate-pulse'
                      : loc.urgency === 'Very High' 
                      ? 'bg-rose-500 text-white hover:bg-rose-600' 
                      : loc.urgency === 'High'
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-indigo-500 text-white hover:bg-indigo-600'
                  }`}
                >
                  {loc.collected ? (
                    <Check className="w-4 h-4 font-extrabold" />
                  ) : loc.type === 'communal' ? (
                    <MapPin className="w-4.5 h-4.5" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}

                  {/* Tiny count indicator for bins */}
                  {loc.type === 'communal' && !loc.collected && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                      B
                    </span>
                  )}
                </motion.button>
              );
            })}

            {/* LIVE ANIMATING TRUCK OVERLAY */}
            {activeTarget && (
              <motion.div
                style={{ 
                  left: `${truckX}%`, 
                  top: `${truckY}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className="absolute z-30 bg-emerald-600 text-white p-2.5 rounded-2xl shadow-2xl border-2 border-white flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Truck className="w-5 h-5 text-white" />
                <span className="absolute -top-7 bg-emerald-600 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap text-white uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Active Truck
                </span>
              </motion.div>
            )}

            {/* Floating Quick Stats Over the Map */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
              <Compass className="w-5 h-5 text-emerald-600 animate-spin" style={{ animationDuration: '8s' }} />
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Compass heading</p>
                <p className="text-xs font-black text-slate-800 uppercase mt-0.5">Barangay Sector A</p>
              </div>
            </div>

            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{mapLocations.filter(l => !l.collected).length} Active Targets Left</span>
            </div>

            {/* Detail Popup Overlay */}
            <AnimatePresence>
              {selectedLocationDetails && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  className="absolute bottom-4 left-4 right-4 z-20"
                >
                  <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row max-h-[300px]">
                     <div className="relative w-full md:w-5/12 h-28 md:h-auto shrink-0 overflow-hidden">
                        <img 
                          src={selectedLocationDetails.image} 
                          alt={selectedLocationDetails.title} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Real Photo Proof
                        </div>
                     </div>
                     <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">
                                {selectedLocationDetails.purok} • {selectedLocationDetails.type.toUpperCase()}
                              </p>
                              <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                                {selectedLocationDetails.title}
                              </h3>
                            </div>
                            <button 
                              onClick={() => setSelectedPin(null)}
                              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors border-none cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {selectedLocationDetails.desc}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                              {selectedLocationDetails.extraInfo}
                            </span>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                              selectedLocationDetails.collected 
                                ? 'bg-emerald-50 text-emerald-600' 
                                : selectedLocationDetails.urgency === 'Very High' 
                                ? 'bg-rose-50 text-rose-600' 
                                : 'bg-slate-50 text-slate-600'
                            }`}>
                              {selectedLocationDetails.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex gap-2">
                          {selectedLocationDetails.collected ? (
                            <div className="flex-1 bg-emerald-50 text-emerald-700 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-emerald-100">
                              <CheckCircle2 className="w-4 h-4" />
                              Waste Fully Collected
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleStartRoute(selectedLocationDetails)}
                              className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all border-none cursor-pointer shadow-md"
                            >
                              <Navigation className="w-4 h-4" />
                              Start Collection Route
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedPin(null);
                              // Highlight or center it
                            }}
                            className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors bg-white cursor-pointer"
                            title="Inspect details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Map Legend Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-3 px-2">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Resident Booking</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-amber-500 rounded-full" />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Communal Bin (High)</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Overflowing (Critical)</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-slate-400 rounded-full" />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Collected</span>
                </div>
             </div>
             <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase italic tracking-wider">
                <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Photos updated every 30 mins</span>
             </div>
          </div>
        </div>

        {/* Right Side: Active Route Dispatch Controller & List Checklist */}
        <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
          
          {/* Active Navigation Panel */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">Route Control HUD</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">GPS Simulation Controller</p>
                </div>
              </div>
              {activeTarget && (
                <span className="text-[9px] bg-emerald-500 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Routing
                </span>
              )}
            </div>

            <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
              {activeTarget ? (
                <div className="space-y-4">
                  {/* Active Destination info */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Dispatch Target</p>
                    <h4 className="font-black text-slate-800 text-sm">{activeTarget.name}</h4>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Coordinates: {activeTarget.x}°N, {activeTarget.y}°E
                    </p>
                  </div>

                  {/* Meter / ETA Indicator */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Distance Left</p>
                      <p className="text-lg font-black text-slate-800">
                        {simProgress === 1 ? '0 m' : `${Math.round((1 - simProgress) * 780)} meters`}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Est. ETA</p>
                      <p className="text-lg font-black text-slate-800">
                        {simProgress === 1 ? 'Arrived' : `${Math.ceil((1 - simProgress) * 15 / simSpeed)} seconds`}
                      </p>
                    </div>
                  </div>

                  {/* Route progress slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Progress</span>
                      <span>{Math.round(simProgress * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${simProgress * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Live turn by turn directions */}
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2 text-emerald-800">
                    <Sliders className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 animate-pulse" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700">Dispatch Log</p>
                      <p className="text-[11px] font-bold leading-relaxed mt-0.5">{getRouteInstruction()}</p>
                    </div>
                  </div>

                  {/* Speed Modifier Controls */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sim Speed</span>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                      {([1, 3, 10] as const).map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setSimSpeed(spd)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black ${
                            simSpeed === spd 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {spd === 1 ? '1x' : spd === 3 ? '3x' : 'INST'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Simulation playback button controls */}
                  <div className="grid grid-cols-2 gap-2">
                    {simProgress < 1 ? (
                      <>
                        <button
                          onClick={() => setIsSimulating(!isSimulating)}
                          className="py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
                        >
                          {isSimulating ? (
                            <>
                              <Pause className="w-4 h-4 text-slate-500" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 text-slate-500" /> Resume
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleSkipToDestination}
                          className="py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 border-none cursor-pointer"
                        >
                          Skip Simulation
                        </button>
                      </>
                    ) : (
                      /* Arrived state: Need verification or can mark complete */
                      <div className="col-span-2 space-y-3">
                        <p className="text-[10px] font-bold text-center text-slate-500 uppercase tracking-widest bg-slate-50 p-2 rounded-lg border border-slate-100">
                          📍 Arrived! Proof of collection is recommended.
                        </p>

                        {/* Upload Proof Box */}
                        {!uploadedProof ? (
                          <div 
                            onClick={handleTriggerUpload}
                            className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-1"
                          >
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleFileChange} 
                              className="hidden" 
                              accept="image/*"
                            />
                            {isUploading ? (
                              <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
                            ) : (
                              <Camera className="w-6 h-6 text-slate-400" />
                            )}
                            <p className="text-xs font-black text-slate-700 mt-1">Upload Photo Proof</p>
                            <p className="text-[9px] text-slate-400 uppercase font-medium">Click to select clean photo</p>
                          </div>
                        ) : (
                          <div className="relative rounded-2xl overflow-hidden h-24 border border-slate-200">
                            <img src={uploadedProof} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Uploaded proof" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white bg-emerald-600/90 px-3 py-1 rounded-full flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Proof Ready
                              </span>
                            </div>
                            <button 
                              onClick={() => setUploadedProof(null)}
                              className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full border-none cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={handleConfirmCollection}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 border-none cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm Garbage Pickup
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Unactive state */
                <div className="text-center py-8 space-y-3">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Compass className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">No Active Dispatch Route</h4>
                    <p className="text-xs text-slate-400 max-w-[220px] mx-auto mt-1 leading-relaxed">
                      Select any point marker on the map view or from the active points list below, then trigger "Start Route" to deploy the truck.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick List of Active Points */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col">
             <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                   <FileCheck className="w-4 h-4 text-emerald-600" />
                   Active Targets Queue
                </h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-black uppercase border border-emerald-100">
                  {filteredLocations.filter(l => !l.collected).length} left
                </span>
             </div>

             <div className="divide-y divide-slate-100 overflow-y-auto max-h-[250px] flex-1">
                {filteredLocations.map((loc) => (
                  <div 
                    key={loc.key}
                    onClick={() => {
                      setSelectedPin({ id: loc.id, type: loc.type });
                    }}
                    className={`p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer ${
                      selectedPin?.id === loc.id && selectedPin?.type === loc.type ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                     <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          loc.collected 
                            ? 'bg-slate-100 text-slate-400' 
                            : loc.type === 'communal' 
                            ? 'bg-amber-50 text-amber-600' 
                            : 'bg-indigo-50 text-indigo-600'
                        }`}>
                           {loc.collected ? (
                             <Check className="w-4 h-4" />
                           ) : loc.type === 'communal' ? (
                             <Sliders className="w-4 h-4" />
                           ) : (
                             <MapPin className="w-4 h-4" />
                           )}
                        </div>
                        <div className="min-w-0">
                           <h4 className="font-extrabold text-slate-800 text-xs truncate">{loc.title}</h4>
                           <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                             {loc.purok} • {loc.type.toUpperCase()}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-1.5 shrink-0">
                       {loc.collected ? (
                         <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase">
                           Collected
                         </span>
                       ) : (
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             setSelectedPin({ id: loc.id, type: loc.type });
                             handleStartRoute(loc);
                           }}
                           className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border-none cursor-pointer"
                         >
                           Route
                         </button>
                       )}
                     </div>
                  </div>
                ))}
                {filteredLocations.length === 0 && (
                  <div className="p-8 text-center text-slate-400 space-y-1">
                     <AlertTriangle className="w-6 h-6 mx-auto text-slate-300" />
                     <p className="font-bold text-xs">No Active Targets Found</p>
                     <p className="text-[10px] text-slate-400">All targets under this filter are completed!</p>
                  </div>
                )}
             </div>
          </div>

        </div>

      </div>

    </div>
  );
}
