import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  X, 
  QrCode, 
  RefreshCw, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Info,
  Trash2,
  Volume2,
  VolumeX,
  HelpCircle,
  Cpu
} from 'lucide-react';
import jsQR from 'jsqr';

interface BinQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (level: number, binId: string) => void;
}

export default function BinQRScanner({ isOpen, onClose, onScanSuccess }: BinQRScannerProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<{ level: number; binId: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isOpenRef = useRef<boolean>(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Play synthetic scanner audio feedback (beep)
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // High pitch success chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch (A5)
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      
      osc.start();
      // Fast exponential ramp-down to simulate a tight electronic beep
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
      console.warn('AudioContext failed to play beep:', e);
    }
  };

  // Turn on camera and start scanning loop
  const startCamera = async () => {
    setErrorMsg('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Constraints for standard back camera
      const constraints = {
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // If the scanner was closed during stream initialization, discard the new tracks immediately
      if (!isOpenRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;
      setHasCameraPermission(true);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Prevents iOS native fullscreen player
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Camera playback request was interrupted or prevented:', err);
          });
        }
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setHasCameraPermission(false);
      setIsCameraActive(false);
      setErrorMsg('Camera access is locked or unsupported in this window. Try using our simulation deck below.');
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (err) {
        console.warn('Error pausing video in stopCamera:', err);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Core Scanning Loop
  useEffect(() => {
    if (isCameraActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { willReadFrequently: true });

      const scanLoop = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code) {
            console.log('Found QR code:', code.data);
            // Parse content. E.g.: "sg-bin-level:45%" or "BIN-401:85"
            const dataStr = code.data;
            let levelValue = -1;
            let binId = 'BIN-101';

            // Match various formatting variations
            const levelMatch = dataStr.match(/level[:=]\s*(\d+)/i) || dataStr.match(/bin-level[:=]\s*(\d+)/i) || dataStr.match(/(\d+)%/);
            const idMatch = dataStr.match(/id[:=]\s*([a-zA-Z0-9-]+)/i) || dataStr.match(/(BIN-[0-9]+)/i);

            if (levelMatch) {
              levelValue = parseInt(levelMatch[1]);
            } else {
              // Fallback: search for any number in the code
              const fallbackNum = dataStr.match(/\d+/);
              if (fallbackNum) levelValue = parseInt(fallbackNum[0]);
            }

            if (idMatch) {
              binId = idMatch[1];
            }

            if (levelValue >= 0 && levelValue <= 100) {
              // Succeeded! Stop scanning, play beep, handle callback
              stopCamera();
              playBeep();
              setScannedResult({ level: levelValue, binId });
              setIsProcessing(true);

              // Wait 1.5 seconds for visual feedback before closing and submitting
              setTimeout(() => {
                onScanSuccess(levelValue, binId);
                onClose();
              }, 1800);
              return; // Break scan loop
            }
          }
        }
        animationFrameId.current = requestAnimationFrame(scanLoop);
      };

      animationFrameId.current = requestAnimationFrame(scanLoop);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraActive]);

  // Handle open/close state transitions
  useEffect(() => {
    if (isOpen) {
      startCamera();
      setScannedResult(null);
      setIsProcessing(false);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  // Simulated scan triggers for direct user interactions
  const handleSimulatedScan = (level: number, binId: string) => {
    stopCamera();
    playBeep();
    setScannedResult({ level, binId });
    setIsProcessing(true);

    setTimeout(() => {
      onScanSuccess(level, binId);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-150 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        
        {/* Header bar */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Physical Bin QR Scan</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Garbage Level Recorder HUD</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 hover:bg-slate-150 rounded-xl text-slate-400 hover:text-slate-700 transition-colors border-none cursor-pointer bg-transparent"
              title={soundEnabled ? 'Mute Scanned Sound' : 'Unmute Scanned Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-150 rounded-xl text-slate-400 hover:text-slate-700 transition-colors border-none cursor-pointer bg-transparent"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Scanner Stage */}
          <div className="relative aspect-video rounded-3xl bg-slate-950 overflow-hidden border-4 border-slate-200 shadow-inner flex flex-col items-center justify-center text-white">
            
            {/* Live stream element */}
            <video 
              ref={videoRef}
              className={`w-full h-full object-cover ${scannedResult ? 'filter brightness-50' : ''}`}
            />
            
            {/* Hidden capture canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Target overlay overlay */}
            <AnimatePresence>
              {!scannedResult && isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Neon laser scan line */}
                  <div className="absolute w-full h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] top-0 animate-bounce" style={{ animationDuration: '3s' }} />
                  
                  {/* Targeting frame corners */}
                  <div className="w-40 h-40 border-2 border-dashed border-emerald-400/70 rounded-2xl relative flex items-center justify-center">
                    <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400" />
                    <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400" />
                    <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400" />
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400" />
                    
                    {/* Centered target dot */}
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Camera Lockout / Permission State */}
            {!isCameraActive && !scannedResult && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 text-slate-500 shadow-md">
                  <Camera className="w-8 h-8 animate-pulse text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-200">Device Camera Offline</h4>
                  <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto mt-1 leading-relaxed">
                    {errorMsg || 'Initiating secure local camera stream for garbage code validation...'}
                  </p>
                </div>
                {!hasCameraPermission && (
                  <button 
                    onClick={startCamera}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer"
                  >
                    Authorize Camera
                  </button>
                )}
              </div>
            )}

            {/* Scanned Result success screen */}
            <AnimatePresence>
              {scannedResult && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-emerald-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 space-y-4 text-center z-10"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                    className="w-20 h-20 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-xl border-4 border-emerald-100"
                  >
                    <Check className="w-10 h-10 stroke-[3]" />
                  </motion.div>
                  <div>
                    <span className="text-[9px] font-black uppercase bg-emerald-500 text-emerald-100 px-3 py-1 rounded-full border border-emerald-400 tracking-wider">
                      Match Code: {scannedResult.binId}
                    </span>
                    <h4 className="font-black text-2xl mt-2 tracking-tight">QR CODE VALIDATED!</h4>
                    <p className="text-sm font-extrabold text-emerald-50 mt-1">
                      Logged Fill Level: <span className="underline font-black text-white text-base">{scannedResult.level}% Full</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-bold bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                    <span>Synchronizing ledger levels live...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick instructions */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5 text-slate-600">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
            <div className="text-xs space-y-0.5 leading-relaxed">
              <p className="font-extrabold text-slate-800">How to log levels instantly:</p>
              <p>Point your camera at the QR code decal attached to your physical household bin. The laser scanner will automatically read and record the garbage height metrics.</p>
            </div>
          </div>

          {/* Simulation Deck Section */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                QR Code Simulation Deck
              </span>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase">
                Mock QR Codes
              </span>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              If your browser has locked permissions, or if you don't have a bin QR code printed, click any of our pre-configured bin labels below to <strong>simulate the scan instantly</strong>:
            </p>

            <div className="grid grid-cols-3 gap-3.5">
              {[
                { label: 'Green Bin (Clean)', id: 'BIN-101', level: 15, color: 'emerald', text: '15% fill' },
                { label: 'Amber Bin (Half)', id: 'BIN-202', level: 53, color: 'amber', text: '53% fill' },
                { label: 'Red Bin (Full)', id: 'BIN-303', level: 92, color: 'rose', text: '92% fill' }
              ].map((mock, i) => (
                <button
                  key={i}
                  disabled={isProcessing}
                  onClick={() => handleSimulatedScan(mock.level, mock.id)}
                  className={`p-3 bg-white border border-slate-200 hover:border-${mock.color}-400 rounded-2xl text-left flex flex-col justify-between transition-all group hover:bg-slate-50 cursor-pointer text-slate-700`}
                >
                  {/* Generated QR Mock graphic using neat CSS cells */}
                  <div className={`aspect-square w-full rounded-xl bg-slate-100 p-2 flex items-center justify-center border border-slate-200/50 mb-3 group-hover:bg-${mock.color}-50/50 relative overflow-hidden`}>
                    
                    {/* Standard barcode block styling */}
                    <div className="grid grid-cols-4 grid-rows-4 w-10 h-10 gap-0.5 opacity-60">
                      <div className="bg-slate-900 rounded-xs" />
                      <div className="bg-slate-900 rounded-xs" />
                      <div className="bg-transparent" />
                      <div className="bg-slate-900 rounded-xs" />

                      <div className="bg-transparent" />
                      <div className="bg-slate-900 rounded-xs" />
                      <div className="bg-slate-900 rounded-xs" />
                      <div className="bg-transparent" />

                      <div className="bg-slate-900 rounded-xs" />
                      <div className="bg-transparent" />
                      <div className="bg-slate-900 rounded-xs" />
                      <div className="bg-slate-900 rounded-xs" />

                      <div className="bg-slate-900 rounded-xs" />
                      <div className="bg-slate-900 rounded-xs" />
                      <div className="bg-transparent" />
                      <div className="bg-slate-900 rounded-xs" />
                    </div>

                    <div className={`absolute top-1 left-1 w-2.5 h-2.5 border-2 border-slate-900 bg-transparent`} />
                    <div className={`absolute top-1 right-1 w-2.5 h-2.5 border-2 border-slate-900 bg-transparent`} />
                    <div className={`absolute bottom-1 left-1 w-2.5 h-2.5 border-2 border-slate-900 bg-transparent`} />
                    
                    {/* Hover text indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/95 backdrop-blur-xs transition-opacity rounded-xl">
                      <QrCode className={`w-5 h-5 text-${mock.color}-600 animate-pulse`} />
                    </div>
                  </div>
                  
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{mock.id}</p>
                    <p className="text-[11px] font-extrabold text-slate-800 tracking-tight leading-none truncate">{mock.label}</p>
                    <span className={`inline-block text-[9px] font-black text-${mock.color}-600 uppercase mt-1`}>
                      {mock.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-slate-100 p-3 rounded-xl flex items-center gap-2 text-[10px] text-slate-500 font-medium justify-center">
              <Cpu className="w-3.5 h-3.5 text-slate-450" />
              <span>Real QR values can contain raw numbers like <code>45%</code> or <code>level:80%</code></span>
            </div>
          </div>

        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors border-none cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </motion.div>
    </div>
  );
}
