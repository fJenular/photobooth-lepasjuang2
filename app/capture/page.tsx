'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBooth } from '@/lib/boothContext';
import { AlertCircle, ArrowLeft, Camera, RefreshCw, Video } from 'lucide-react';

type WebkitAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export default function CapturePage() {
  const router = useRouter();
  const { capturedPhotos, setCapturedPhotos } = useBooth();

  // Camera & Capture states
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [isDetectingCamera, setIsDetectingCamera] = useState<boolean>(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(0);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [isFlash, setIsFlash] = useState<boolean>(false);
  const [soundEnabled] = useState<boolean>(true);
  const [mirrorEnabled, setMirrorEnabled] = useState<boolean>(true);
  const [flashEnabled, setFlashEnabled] = useState<boolean>(true);
  const [liveMode, setLiveMode] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  // Refs to prevent state closure capture bugs during async timeouts
  const photosRef = useRef<string[]>([]);
  const activeIndexRef = useRef<number>(0);
  const isCountingRef = useRef<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Required snaps count
  const requiredSnaps = 6;
  const capturedCount = capturedPhotos.filter(Boolean).length;
  const isInsecureLanAccess = () => {
    if (typeof window === 'undefined') return false;
    const localhostHosts = ['localhost', '127.0.0.1', '[::1]', '::1'];
    return !window.isSecureContext && !localhostHosts.includes(window.location.hostname);
  };

  async function detectCameras() {
    setIsDetectingCamera(true);
    setCameraError('');

    try {
      if (isInsecureLanAccess()) {
        setCameras([]);
        setCameraError('Safari/iPad tidak mengizinkan kamera dari HTTP IP lokal. Buka dari HTTPS tunnel/domain, atau akses langsung dari perangkat host lewat localhost.');
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameras([]);
        setCameraError('Akses kamera tidak tersedia di browser ini. Jika memakai iPad via IP LAN, gunakan HTTPS karena Safari memblokir kamera di HTTP.');
        return;
      }

      if (!navigator.mediaDevices.enumerateDevices) {
        await startCamera('', cameraFacing);
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        const firstCam = videoDevices[0].deviceId;
        setSelectedCameraId(firstCam);
        startCamera(firstCam);
      } else {
        setCameraError('Kamera tidak terdeteksi. Pastikan webcam tersambung, tidak dipakai aplikasi lain, lalu coba lagi.');
      }
    } catch (err) {
      console.error('Gagal mendeteksi kamera:', err);
      setCameras([]);
      setCameraError('Gagal mendeteksi kamera. Periksa izin kamera di browser dan pastikan halaman dibuka lewat HTTPS atau localhost.');
    } finally {
      setIsDetectingCamera(false);
    }
  }

  async function startCamera(camId: string = '', facing: 'user' | 'environment' = cameraFacing) {
    stopCamera();
    setCameraError('');

    try {
      if (isInsecureLanAccess()) {
        setCameraError('Safari/iPad tidak mengizinkan kamera dari HTTP IP lokal. Gunakan HTTPS tunnel/domain seperti ngrok/Cloudflare Tunnel, bukan http://192.168.x.x.');
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Akses kamera tidak tersedia di browser ini. Jika memakai iPad via IP LAN, gunakan HTTPS karena Safari memblokir kamera di HTTP.');
        return;
      }

      const constraints = {
        video: camId ? { deviceId: { exact: camId } } : { facingMode: facing },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Error starting video stream:', err);
      let message = 'Gagal mengakses kamera. Silakan periksa izin kamera peramban Anda.';

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          message = 'Izin kamera ditolak. Klik ikon kamera/gembok di address bar lalu izinkan akses kamera.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message = 'Kamera tidak ditemukan. Sambungkan webcam atau gunakan perangkat yang memiliki kamera.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          message = 'Kamera sedang dipakai aplikasi lain. Tutup Zoom/Meet/aplikasi kamera lain, lalu coba lagi.';
        } else if (err.name === 'OverconstrainedError') {
          message = 'Kamera yang dipilih tidak tersedia. Coba pilih kamera lain atau gunakan tombol coba lagi.';
        } else if (err.name === 'SecurityError') {
          message = 'Akses kamera diblokir. Buka halaman melalui HTTPS atau localhost.';
        }
      }

      setCameraError(message);
      setCameraActive(false);
    }
  }

  const handleRetryCamera = () => {
    detectCameras();
  };

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      detectCameras();
      setCapturedPhotos([]);
      photosRef.current = [];
      activeIndexRef.current = 0;
      setMounted(true);
    });

    return () => {
      cancelled = true;
      stopCamera();
    };
    // Runs once on mount to initialize camera and reset transient capture state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFlipCamera = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    setSelectedCameraId('');
    startCamera('', nextFacing);
  };

  // Sound Synthesizer
  const playSound = (type: 'beep' | 'camera_shutter' | 'cheer') => {
    if (!soundEnabled) return;
    try {
      const AudioContextCtor = window.AudioContext || (window as WebkitAudioWindow).webkitAudioContext;
      if (!AudioContextCtor) return;

      const ctx = new AudioContextCtor();
      if (type === 'beep') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'camera_shutter') {
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
      } else if (type === 'cheer') {
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
          gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + i * 0.08 + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.08);
          osc.stop(ctx.currentTime + i * 0.08 + 0.18);
        });
      }
    } catch {}
  };

  const handleCaptureSequence = () => {
    if (isCountingRef.current || !cameraActive) return;

    // Reset snaps array
    setCapturedPhotos([]);
    photosRef.current = [];
    
    setActivePhotoIndex(0);
    activeIndexRef.current = 0;
    
    setIsCounting(false);
    isCountingRef.current = false;

    // Run first countdown
    runSingleCountdown();
  };

  const runSingleCountdown = () => {
    if (isCountingRef.current) return;

    setIsCounting(true);
    isCountingRef.current = true;

    let count = 3;
    setCountdown(count);
    playSound('beep');

    const intervalId = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        playSound('beep');
      } else {
        clearInterval(intervalId);
        setIsCounting(false);
        isCountingRef.current = false;
        
        // Trigger capture
        takePhotoSnapshot();
      }
    }, 1000);
  };

  const takePhotoSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Trigger flash & sound
    playSound('camera_shutter');
    setIsFlash(true);
    setTimeout(() => setIsFlash(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Mirror capture image
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const newPhoto = canvas.toDataURL('image/png');
      
      const currentPhotos = [...photosRef.current];
      const currentIndex = activeIndexRef.current;
      currentPhotos[currentIndex] = newPhoto;
      
      // Update ref and state
      photosRef.current = currentPhotos;
      setCapturedPhotos(currentPhotos);

      const nextIndex = currentIndex + 1;
      if (nextIndex < requiredSnaps) {
        activeIndexRef.current = nextIndex;
        setActivePhotoIndex(nextIndex);

        // Wait 1.5 seconds and capture next photo
        setTimeout(() => {
          if (activeIndexRef.current === nextIndex) {
            runSingleCountdown();
          }
        }, 1500);
      } else {
        // Finished captures sequence
        setTimeout(() => {
          playSound('cheer');
          stopCamera();
          router.push('/result');
        }, 800);
      }
    }
  };

  const handleBack = () => {
    stopCamera();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-game-pattern flex flex-col items-center px-4 py-4 md:px-6 md:py-5 select-none">
      
      {/* Header */}
      <header className="w-full max-w-6xl flex items-center justify-between bg-white/95 border border-slate-200/80 shadow-sm rounded-2xl px-4 py-3 md:px-5 md:py-3.5 z-10 backdrop-blur">
        <button 
          onClick={handleBack}
          className="p-2 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-lg md:text-xl font-extrabold text-blue-600 tracking-tight">
            AMBIL FOTO SNAPSHOT
          </h2>
          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">
            Foto {activePhotoIndex + 1} dari {requiredSnaps}
          </span>
        </div>

        <div className="w-9"></div>
      </header>

      {/* Main Panel */}
      <main className="w-full max-w-6xl flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_340px] gap-4 md:gap-5 py-4 md:py-5 z-10 items-start">
        <section className="order-1 flex flex-col gap-3 md:gap-4 min-w-0">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">Progress</p>
                <p className="text-sm font-bold text-slate-700">Foto {activePhotoIndex + 1} dari {requiredSnaps}</p>
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">
                {Math.round((capturedCount / requiredSnaps) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${Math.round((capturedCount / requiredSnaps) * 100)}%` }}
              />
            </div>
          </div>

          <div className="relative bg-slate-950 border border-slate-200 shadow-md rounded-3xl aspect-[4/3] md:aspect-[16/10] overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_30%)]" />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.04),rgba(255,255,255,0.04)_1px,transparent_1px,transparent_3px)] opacity-30" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_30%,rgba(0,0,0,0.2))]" />
            </div>

            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              className={
                mounted
                  ? `w-full h-full object-cover ${mirrorEnabled ? 'scale-x-[-1]' : 'scale-x-[1]'} ${cameraActive ? 'block' : 'hidden'}`
                  : 'w-full h-full object-cover hidden'
              }
            ></video>

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-4">
                {cameraError ? (
                  <div className="max-w-md rounded-3xl border border-rose-400/30 bg-rose-950/80 p-5 shadow-2xl backdrop-blur-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-300">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-black text-white">Kamera tidak tersedia</h3>
                    <p className="mt-2 text-xs font-semibold leading-6 text-rose-100">
                      {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={handleRetryCamera}
                      className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-extrabold text-slate-900 shadow-sm transition hover:bg-rose-50 active:scale-95"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Coba Deteksi Lagi
                    </button>
                  </div>
                ) : (
                  <>
                    <Video className="w-10 h-10 text-slate-400 animate-pulse" />
                    <p className="text-slate-300 font-bold text-xs">
                      {isDetectingCamera ? 'Mendeteksi kamera...' : 'Menghubungkan ke Stream Kamera...'}
                    </p>
                  </>
                )}
              </div>
            )}

            {flashEnabled && isFlash && (
              <div className="absolute inset-0 bg-white z-40 animate-flash"></div>
            )}

            {isCounting && (
              <div className="absolute inset-0 bg-black/75 z-30 flex items-center justify-center">
                <div className="text-7xl md:text-[6rem] font-black text-yellow-400 select-none animate-bounce">
                  {countdown}
                </div>
              </div>
            )}

            <div className="absolute inset-x-0 top-3 px-3 md:top-4 md:px-4 flex flex-wrap items-center justify-between gap-2 z-20">
              <div className="bg-red-600 text-white rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                REC
              </div>
              <div className="flex max-w-[calc(100%-4.5rem)] flex-wrap justify-end items-center gap-1.5 md:gap-2">
                <button
                  type="button"
                  onClick={() => setMirrorEnabled(prev => !prev)}
                  className={`rounded-full px-2.5 py-2 text-[9px] md:px-3 md:text-[10px] font-bold uppercase tracking-[0.16em] md:tracking-[0.2em] transition ${mirrorEnabled ? 'bg-cyan-400 text-slate-900' : 'bg-slate-100 text-slate-700'}`}>
                  Mirror
                </button>
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="rounded-full px-2.5 py-2 md:px-3 bg-slate-100 text-slate-700 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.16em] md:tracking-[0.2em] transition">
                  Flip
                </button>
                <button
                  type="button"
                  onClick={() => setFlashEnabled(prev => !prev)}
                  className={`rounded-full px-2.5 py-2 md:px-3 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.16em] md:tracking-[0.2em] transition ${flashEnabled ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 text-slate-700'}`}>
                  Flash
                </button>
                <button
                  type="button"
                  onClick={() => setLiveMode(prev => !prev)}
                  className={`rounded-full px-2.5 py-2 md:px-3 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.16em] md:tracking-[0.2em] transition ${liveMode ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-white'}`}>
                  Live
                </button>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-24 h-24 rounded-full border border-white/20">
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/20" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
              </div>
            </div>

            <div className="absolute bottom-4 left-4 bg-black/40 text-emerald-300 text-[10px] uppercase tracking-[0.3em] font-bold px-3 py-1 rounded-full backdrop-blur-sm">
              ISO 800
            </div>
            <div className="absolute bottom-4 right-4 bg-black/40 text-slate-100 text-[10px] uppercase tracking-[0.3em] font-bold px-3 py-1 rounded-full backdrop-blur-sm">
              [ FACE ]
            </div>

            {cameras.length > 0 && (
              <div className="absolute top-20 left-4 bg-slate-900/90 text-slate-100 rounded-full px-3 py-1 text-[10px] font-bold border border-white/10">
                <select
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value);
                    startCamera(e.target.value);
                  }}
                  className="bg-transparent text-[10px] font-bold outline-none appearance-none"
                >
                  {cameras.map((cam, idx) => (
                    <option key={cam.deviceId} value={cam.deviceId} className="bg-slate-900 text-white">
                      {cam.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        <aside className="order-2 md:sticky md:top-5 flex flex-col gap-3 md:gap-4 bg-white/95 border border-slate-200 shadow-sm rounded-3xl p-4 md:p-5 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400">Frame Preview</div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-blue-600">
              6 Shots
            </span>
          </div>
          <div className="mx-auto w-full max-w-[180px] md:max-w-[220px] border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <img
              src="/frame.png"
              alt="Frame Preview"
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-3 md:p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400 mb-3">Snap Photo Queue</p>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: requiredSnaps }).map((_, idx) => (
                <div key={idx} className="aspect-square rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                  {capturedPhotos[idx] ? (
                    <img src={capturedPhotos[idx]} alt={`Snap ${idx + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">{idx + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2.5 md:gap-3">
            <button
              onClick={handleCaptureSequence}
              disabled={isCounting || !cameraActive}
              className={`w-full py-4 flex justify-center items-center gap-2 text-white font-bold text-sm rounded-full transition ${
                isCounting || !cameraActive
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}>
              <Camera className="w-5 h-5" />
              {isCounting ? 'MENGAMBIL FOTO...' : 'AMBIL FOTO'}
            </button>
            <button
              onClick={() => {
                setCapturedPhotos([]);
                photosRef.current = [];
                setActivePhotoIndex(0);
                activeIndexRef.current = 0;
                setIsCounting(false);
                isCountingRef.current = false;
              }}
              className="w-full py-3 rounded-full bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition"
            >
              Mulai Ulang
            </button>
          </div>
        </aside>
      </main>

      {/* Hidden canvas helper */}
      <canvas ref={canvasRef} className="hidden"></canvas>

      {/* Footer */}
      <footer className="pb-2 text-center text-slate-400 text-xs font-semibold z-10">
        <p>© 2026 TAKE YOUR TIME BOOTH. ALL RIGHTS RESERVED.</p>
      </footer>

    </div>
  );
}
