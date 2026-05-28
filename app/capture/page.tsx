'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBooth } from '@/lib/boothContext';
import { ArrowLeft, Camera, RotateCcw, Video } from 'lucide-react';

export default function CapturePage() {
  const router = useRouter();
  const { selectedFrame, capturedPhotos, setCapturedPhotos } = useBooth();

  // Camera & Capture states
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(0);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [isFlash, setIsFlash] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Refs to prevent state closure capture bugs during async timeouts
  const photosRef = useRef<string[]>([]);
  const activeIndexRef = useRef<number>(0);
  const isCountingRef = useRef<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Required snaps count
  const requiredSnaps = selectedFrame.layoutType === 'photostrip' ? 4 : 
                         selectedFrame.layoutType === 'grid' ? 6 : 1;

  useEffect(() => {
    // Populate cameras list
    detectCameras();

    // Reset local capture arrays
    setCapturedPhotos([]);
    photosRef.current = [];
    activeIndexRef.current = 0;
    setActivePhotoIndex(0);

    return () => {
      stopCamera();
    };
  }, []);

  const detectCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        const firstCam = videoDevices[0].deviceId;
        setSelectedCameraId(firstCam);
        startCamera(firstCam);
      }
    } catch (err) {
      console.error('Gagal mendeteksi kamera:', err);
    }
  };

  const startCamera = async (camId: string) => {
    stopCamera();
    try {
      setCameraActive(true);
      const constraints = {
        video: camId ? { deviceId: { exact: camId } } : { facingMode: 'user' },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error starting video stream:', err);
      alert('Gagal mengakses kamera. Silakan periksa izin kamera peramban Anda.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Sound Synthesizer
  const playSound = (type: 'beep' | 'camera_shutter' | 'cheer') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    } catch (_) {}
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
          router.push('/editor');
        }, 800);
      }
    }
  };

  const handleBack = () => {
    stopCamera();
    router.push('/select-frame');
  };

  return (
    <div className="min-h-screen bg-game-pattern flex flex-col justify-between items-center p-4 md:p-6 select-none">
      
      {/* Header */}
      <header className="w-full max-w-5xl flex items-center justify-between bg-white border border-slate-200/80 shadow-sm rounded-2xl px-5 py-3.5 mb-2 z-10">
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
            Langkah 2 dari 4 • Foto {activePhotoIndex + 1} dari {requiredSnaps}
          </span>
        </div>

        {/* Camera Selector */}
        <div className="relative">
          <select
            value={selectedCameraId}
            onChange={(e) => {
              setSelectedCameraId(e.target.value);
              startCamera(e.target.value);
            }}
            className="bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl pl-3.5 pr-8 py-2 appearance-none cursor-pointer focus:outline-none focus:bg-white"
          >
            {cameras.map(cam => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
              </option>
            ))}
          </select>
          <Video className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </header>

      {/* Main Panel */}
      <main className="w-full max-w-5xl flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 my-4 z-10 items-center">
        
        {/* Webcam View */}
        <div className="lg:col-span-8 relative bg-slate-950 border border-slate-200 shadow-md rounded-3xl aspect-[4/3] overflow-hidden flex items-center justify-center order-2 lg:order-1">
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover scale-x-[-1] ${
              cameraActive ? 'block' : 'hidden'
            }`}
          ></video>

          {!cameraActive && (
            <div className="text-center flex flex-col items-center gap-3">
              <Video className="w-8 h-8 text-slate-400 animate-pulse" />
              <p className="text-slate-500 font-bold text-xs">Menghubungkan ke Stream Kamera...</p>
            </div>
          )}

          {isFlash && (
            <div className="absolute inset-0 bg-white z-40 animate-flash"></div>
          )}

          {isCounting && (
            <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center">
              <div className="text-9xl font-black text-yellow-400 select-none animate-bounce">
                {countdown}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4 md:gap-5 justify-between self-stretch bg-white border border-slate-200 shadow-sm rounded-3xl p-4 md:p-5 order-1 lg:order-2">
          
          {/* Captured list */}
          <div className="flex-1">
            <p className="text-[10px] text-slate-450 font-bold uppercase text-center mb-3 tracking-wider">
              Snap Photo Queue
            </p>
            
            <div className={`grid gap-2 pr-1 custom-scrollbar overflow-y-auto max-h-[220px] ${
              requiredSnaps === 4 ? 'grid-cols-4' : 
              requiredSnaps === 6 ? 'grid-cols-3' : 'grid-cols-1'
            }`}>
              {Array.from({ length: requiredSnaps }).map((_, idx) => (
                <div 
                  key={idx}
                  className={`aspect-square bg-slate-100 border rounded-xl overflow-hidden relative flex items-center justify-center ${
                    activePhotoIndex === idx 
                      ? 'border-blue-500 ring-2 ring-blue-500/15' 
                      : 'border-slate-200'
                  }`}
                >
                  {capturedPhotos[idx] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={capturedPhotos[idx]} 
                      alt={`Snap ${idx + 1}`}
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                  )}
                  
                  {activePhotoIndex === idx && !isCounting && (
                    <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Capture Trigger */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleCaptureSequence}
              disabled={isCounting || !cameraActive}
              className={`w-full py-4 flex justify-center items-center gap-2 text-white font-bold text-md cursor-pointer ${
                isCounting || !cameraActive 
                  ? 'bg-slate-300 text-slate-100 shadow-none cursor-not-allowed' 
                  : 'btn-google-blue'
              }`}
            >
              <Camera className="w-5 h-5" />
              {isCounting ? 'MENGAMBIL FOTO...' : 'MULAI AMBIL FOTO'}
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
              className="w-full py-2.5 flex justify-center items-center gap-1.5 text-slate-600 font-bold text-xs btn-google-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ulang Dari Awal
            </button>
          </div>

        </div>

      </main>

      {/* Hidden canvas helper */}
      <canvas ref={canvasRef} className="hidden"></canvas>

      {/* Footer */}
      <footer className="text-center text-slate-400 text-xs font-semibold z-10">
        <p>© 2026 TAKE YOUR TIME BOOTH. ALL RIGHTS RESERVED.</p>
      </footer>

    </div>
  );
}
