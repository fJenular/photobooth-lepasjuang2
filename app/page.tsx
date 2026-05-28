'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBooth } from '@/lib/boothContext';
import { getAllLocalCaptures, LocalCapture } from '@/lib/localDb';
import { getSupabaseClient } from '@/lib/supabase';
import { Camera, Database, Layers, Info, QrCode, ArrowRight, Shield, PhoneCall } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { resetBooth } = useBooth();
  const [galleryPhotos, setGalleryPhotos] = useState<LocalCapture[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState<string | null>(null);

  // Settings states
  const [dbConfig, setDbConfig] = useState({ url: '', anonKey: '' });
  const [localIp, setLocalIp] = useState('localhost');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Reset any previous photobooth state when returning to home
    resetBooth();
    
    // Load local captures
    getAllLocalCaptures().then(setGalleryPhotos);

    // Load configs
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('supabase_url') || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const savedKey = localStorage.getItem('supabase_anon_key') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const savedIp = localStorage.getItem('local_ip') || 'localhost';
      
      setDbConfig({ url: savedUrl, anonKey: savedKey });
      setLocalIp(savedIp);
    }
  }, []);

  const handleStart = () => {
    router.push('/select-frame');
  };

  const handleSaveSettings = () => {
    localStorage.setItem('supabase_url', dbConfig.url);
    localStorage.setItem('supabase_anon_key', dbConfig.anonKey);
    localStorage.setItem('local_ip', localIp);
    setShowSettingsModal(false);
    setTestResult(null);
    alert('Konfigurasi berhasil disimpan!');
    // Hard reload page states
    window.location.reload();
  };

  const handleTestConnection = async () => {
    if (!dbConfig.url || !dbConfig.anonKey) {
      setTestResult({ success: false, message: 'URL dan Anon Key tidak boleh kosong.' });
      return;
    }
    setIsTesting(true);
    const { testSupabaseConnection } = await import('@/lib/supabase');
    const res = await testSupabaseConnection(dbConfig.url, dbConfig.anonKey);
    setTestResult(res);
    setIsTesting(false);
  };

  return (
    <div className="h-auto lg:min-h-screen bg-game-pattern flex flex-col justify-between items-center py-auto p-4 md:p-6 select-none">
      
      {/* Navbar */}
      <nav className="w-full max-w-5xl flex justify-between items-center bg-white border border-slate-200/80 shadow-sm rounded-2xl px-5 py-3 z-10 animate-fade-in animate-delay-050">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 rounded-lg p-1.5 text-white shadow-sm">
            <Camera className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold text-blue-600 tracking-tight leading-none">
              LEPAS JUANG #2
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              SMK TI BAZMA • TAKE YOUR TIME
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer text-slate-600"
            title="Database"
          >
            <Database className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Hero Container */}
      <main className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center text-center md:gap-6 lg:mt-1  -my-6 z-10">
        
        {/* Logos & Branding */}
        <div className="flex flex-col items-center max-w-md w-full gap-0 animate-fade-in animate-delay-100">

          {/* Logo Lepas Juang */}
          <img 
            src="/Graduation.svg" 
            alt="Graduation Logo" 
            className="w-full h-auto block  animate-float animate-fade-in animate-delay-200"
            style={{ maxWidth: '100%', height: 'auto' }}
          />

          {/* Central Logo Box */}
          <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-5 md:p-8 w-full flex flex-col items-center gap-2 -mt-6 md:-mt-8 animate-fade-in animate-pop animate-delay-300">
               <div className="bg-amber-400 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-sm uppercase tracking-widest rotate-[-1deg]">
              2 June 2025
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-blue-600 tracking-tight leading-tight">
              Take Your Time
            </h1>
            
            <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-2 leading-relaxed">
              Selamat Datang di Photobooth Lepas Juang #2 SMK TI Bazma. Abadikan momen kelulusan secara online & offline!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm flex flex-col gap-3 mt-1 md:mt-2 px-4 animate-fade-in animate-delay-400">
          <button
            onClick={handleStart}
            className="w-full py-3 sm:py-4 px-4 flex justify-center items-center gap-2 text-white font-bold text-base sm:text-lg btn-google-blue cursor-pointer rounded-full hover:shadow-lg active:scale-95 transition-all duration-200 animate-fade-in animate-delay-400"
          >
            START PHOTO BOOTH
            <ArrowRight className="w-5 h-5 flex-shrink-0" />
          </button>

          <div className="grid grid-cols-2 gap-3 px-0">
            <button
              onClick={() => setShowGallery(true)}
              className="py-3 sm:py-3.5 px-2 font-bold btn-google-white flex items-center justify-center gap-1.5 cursor-pointer text-xs hover:shadow-md active:scale-95 transition-all"
            >
              <Layers className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="truncate">Galeri Foto</span>
            </button>
            <button
              onClick={() => setShowInfoModal('ABOUT')}
              className="py-3 sm:py-3.5 px-2 font-bold btn-google-white flex items-center justify-center gap-1.5 cursor-pointer text-xs hover:shadow-md active:scale-95 transition-all"
            >
              <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="truncate">Info Aplikasi</span>
            </button>
          </div>
        </div>

        {/* Mini links */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-xs font-bold text-slate-400 mb-8 animate-fade-in animate-delay-450">
          <button onClick={() => setShowInfoModal('PRIVACY')} className="hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap">
            Kebijakan Privasi
          </button>
          <span className="hidden sm:inline">•</span>
          <button onClick={() => setShowInfoModal('CONTACT')} className="hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap">
            Hubungi Kami
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-slate-400 text-xs font-semibold z-10">
        <p>© 2026 TAKE YOUR TIME BOOTH. ALL RIGHTS RESERVED.</p>
      </footer>

      {/* ======================================================= */}
      {/* 1. DATABASE SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 shadow-xl rounded-3xl w-full max-w-md p-6 flex flex-col gap-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-blue-600">
                <Database className="w-5 h-5" />
                <h3 className="text-lg font-bold">Pengaturan Database</h3>
              </div>
              <button 
                onClick={() => { setShowSettingsModal(false); setTestResult(null); }}
                className="text-slate-400 hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs leading-normal">
              <p className="text-slate-500 font-semibold">
                Konfigurasikan kunci Supabase Anda agar gambar disimpan di cloud storage secara online dan QR code dapat diakses publik.
              </p>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600">Supabase Project URL</label>
                <input 
                  type="text" 
                  value={dbConfig.url} 
                  onChange={(e) => setDbConfig({ ...dbConfig, url: e.target.value })}
                  placeholder="https://your-project-id.supabase.co"
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600">Supabase Anon/Publishable Key</label>
                <input 
                  type="password" 
                  value={dbConfig.anonKey} 
                  onChange={(e) => setDbConfig({ ...dbConfig, anonKey: e.target.value })}
                  placeholder="sb_publishable_..."
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-655">IP Lokal Komputer (Offline WiFi)</label>
                <input 
                  type="text" 
                  value={localIp} 
                  onChange={(e) => setLocalIp(e.target.value)}
                  placeholder="192.168.1.10"
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {testResult && (
                <div className={`p-2.5 rounded-xl border font-semibold text-xs ${
                  testResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {testResult.message}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
              >
                {isTesting ? 'Menguji...' : 'Uji Koneksi'}
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Simpan Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 2. GALLERY MODAL */}
      {showGallery && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 shadow-xl rounded-3xl w-full max-w-3xl p-6 flex flex-col gap-4 text-slate-800 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-blue-600">
                <Layers className="w-5 h-5" />
                <h3 className="text-lg font-bold">Galeri Foto Lokal</h3>
              </div>
              <button 
                onClick={() => setShowGallery(false)}
                className="text-slate-400 hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {galleryPhotos.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center gap-2">
                  <Camera className="w-10 h-10 text-slate-300 animate-pulse" />
                  <p className="text-slate-400 font-semibold text-xs">Belum ada foto yang tersimpan di perangkat ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-1">
                  {galleryPhotos.map((photo) => (
                    <div 
                      key={photo.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-2 relative flex flex-col justify-between hover:scale-[1.01] transition-transform"
                    >
                      <div className="relative aspect-[2/3] w-full bg-slate-900 rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={photo.image_url} 
                          alt="Gallery capture"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between px-1">
                        <span className="text-[8px] text-slate-400 font-bold">
                          {new Date(photo.created_at).toLocaleDateString('id-ID')}
                        </span>
                        
                        <button
                          onClick={() => {
                            window.open(`/download/${photo.id}`, '_blank');
                          }}
                          className="p-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer text-slate-700"
                        >
                          <QrCode className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowGallery(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 3. INFO MODAL */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 shadow-xl rounded-3xl w-full max-w-md p-6 flex flex-col gap-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-blue-600">
                {showInfoModal === 'ABOUT' ? <Info className="w-5 h-5 text-amber-500" /> : 
                 showInfoModal === 'PRIVACY' ? <Shield className="w-5 h-5 text-green-600" /> : <PhoneCall className="w-5 h-5 text-blue-600" />}
                <h3 className="text-lg font-bold">
                  {showInfoModal === 'ABOUT' ? 'Tentang Aplikasi' : 
                   showInfoModal === 'PRIVACY' ? 'Kebijakan Privasi' : 'Hubungi Kami'}
                </h3>
              </div>
              <button 
                onClick={() => setShowInfoModal(null)}
                className="text-slate-400 hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs leading-relaxed text-slate-600 font-semibold py-1">
              {showInfoModal === 'ABOUT' && (
                <div className="flex flex-col gap-2">
                  <p>
                    <strong className="text-slate-800">Take Your Time</strong> adalah aplikasi photobooth berbasis Next.js untuk acara kelulusan <strong className="text-blue-600">Lepas Juang #2 SMK TI Bazma</strong>.
                  </p>
                  <p>
                    Tamu dapat berfoto, menghias foto dengan filter & stiker, serta mencetak langsung atau memindai QR Code untuk mengunduh fotonya.
                  </p>
                  <p className="text-[10px] text-slate-450 mt-1">
                    Versi: 2.0.0 • SMK TI BAZMA Edition.
                  </p>
                </div>
              )}

              {showInfoModal === 'PRIVACY' && (
                <div className="flex flex-col gap-2">
                  <p>
                    Kamera diproses secara lokal di browser Anda. Jika online database aktif, foto akan diunggah ke storage awan untuk dibagikan. Jika mati, data hanya disimpan di memori perangkat Anda.
                  </p>
                </div>
              )}

              {showInfoModal === 'CONTACT' && (
                <div className="flex flex-col gap-2">
                  <p>Butuh bantuan integrasi printer, konfigurasi jaringan wifi lokal, atau setup database?</p>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center font-mono text-blue-600 font-bold mt-1">
                    support@takeyourtimebooth.com
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowInfoModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
