'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getLocalCapture, LocalCapture } from '@/lib/localDb';
import { getSupabaseClient } from '@/lib/supabase';
import { Download, AlertCircle, Camera, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function DownloadPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState<string>('Online Storage');

  useEffect(() => {
    if (!id) return;

    const fetchPhoto = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1. Try loading from Supabase if client is initialized
        const client = getSupabaseClient();
        if (client) {
          const { data, error } = await client
            .from('captures')
            .select('image_url')
            .eq('id', id)
            .single();

          if (data?.image_url) {
            setPhotoUrl(data.image_url);
            setOrigin('Supabase Cloud Cloud Storage');
            setLoading(false);
            return;
          }
        }

        // 2. Try loading from local IndexedDB (if the user scanned on the same device or has it locally cached)
        const localCapture = await getLocalCapture(id);
        if (localCapture?.image_url) {
          setPhotoUrl(localCapture.image_url);
          setOrigin('IndexedDB Local Cache');
          setLoading(false);
          return;
        }

        // 3. If nothing works, check if we can fetch by public storage URL directly (in case row was missed but image exists)
        if (client) {
          const fileName = `${id}.png`;
          const { data: urlData } = client.storage
            .from('photos')
            .getPublicUrl(fileName);
          
          if (urlData?.publicUrl) {
            // Verify if image actually exists
            const res = await fetch(urlData.publicUrl, { method: 'HEAD' });
            if (res.ok) {
              setPhotoUrl(urlData.publicUrl);
              setOrigin('Supabase File Storage');
              setLoading(false);
              return;
            }
          }
        }

        throw new Error('Foto tidak ditemukan di cloud storage maupun database lokal.');
      } catch (err: any) {
        console.error('Fetch error:', err);
        setErrorMsg(err.message || 'Gagal memuat foto.');
        setLoading(false);
      }
    };

    fetchPhoto();
  }, [id]);

  const handleDownload = async () => {
    if (!photoUrl) return;

    try {
      // For local blobs/base64, trigger direct download
      if (photoUrl.startsWith('data:') || photoUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = photoUrl;
        link.download = `take-your-time-${id.substring(0, 8)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // For external URLs, we fetch as blob to bypass CORS download issues
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `take-your-time-${id.substring(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // Fallback: open in new tab
      window.open(photoUrl, '_blank');
    }
  };

  const copyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-game-pattern flex flex-col justify-between items-center p-6 select-none">
      
      {/* Game Header */}
      <header className="text-center mt-4">
        <h1 className="text-4xl md:text-5xl font-black text-white text-outline-md tracking-wider uppercase mb-1">
          Take Your Time
        </h1>
        <p className="text-yellow-400 font-bold text-outline-sm tracking-wide text-sm bg-black/40 px-4 py-1.5 rounded-full border border-yellow-400/20 inline-block">
          ✨ RETRO PHOTOBOOTH PORTAL ✨
        </p>
      </header>

      {/* Main card */}
      <main className="w-full max-w-md my-auto flex flex-col items-center">
        
        {loading ? (
          <div className="bg-slate-900 border-cartoony shadow-cartoony rounded-3xl p-8 w-full text-center flex flex-col items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin"></div>
              <Camera className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-yellow-400 font-bold text-xl tracking-wide animate-pulse">
              MEMUAT FOTO ANDA...
            </p>
            <p className="text-slate-400 text-xs">Mencari di penyimpanan awan dan database lokal</p>
          </div>
        ) : errorMsg ? (
          <div className="bg-rose-950 border-cartoony shadow-cartoony rounded-3xl p-8 w-full text-center flex flex-col items-center gap-4">
            <div className="bg-rose-500/20 p-4 rounded-full border-2 border-rose-500">
              <AlertCircle className="w-10 h-10 text-rose-400" />
            </div>
            <h2 className="text-rose-400 font-bold text-2xl tracking-wide">FOTO TIDAK DITEMUKAN</h2>
            <p className="text-slate-200 text-sm leading-relaxed">
              Foto dengan ID ini tidak dapat ditemukan. Jika menggunakan mode offline, pastikan Anda memindai menggunakan perangkat yang sama atau berada dalam jaringan Wi-Fi lokal photobooth yang sama.
            </p>
            <div className="w-full pt-4 border-t border-rose-500/20">
              <Link
                href="/"
                className="w-full py-3.5 flex justify-center items-center gap-2 text-white font-bold btn-cartoony-red text-outline-sm"
              >
                KEMBALI KE BERANDA
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-6">
            
            {/* Visual Frame wrapper */}
            <div className="bg-black border-cartoony shadow-cartoony rounded-2xl p-4 overflow-hidden relative group">
              <div className="absolute top-2 right-2 bg-green-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full border border-black z-10">
                READY
              </div>

              {/* Image Preview Container */}
              <div className="relative bg-slate-900 border-2 border-black rounded-lg overflow-hidden flex items-center justify-center aspect-[2/3] max-h-[480px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl || ''}
                  alt="Captured photobooth snapshot"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Source Badge */}
              <div className="mt-3 text-center">
                <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
                  Sumber: {origin}
                </span>
              </div>
            </div>

            {/* Actions list */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDownload}
                className="w-full py-4 flex justify-center items-center gap-2 text-white font-black text-xl btn-cartoony-green text-outline-sm cursor-pointer"
              >
                <Download className="w-6 h-6 stroke-[3]" />
                SIMPAN FOTO (PNG)
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyLink}
                  className="py-3.5 flex justify-center items-center gap-2 text-white font-bold text-sm btn-cartoony-blue text-outline-sm cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                  {copied ? 'Tautan Disalin!' : 'Bagikan Link'}
                </button>

                <Link
                  href="/"
                  className="py-3.5 flex justify-center items-center gap-2 text-white font-bold text-sm btn-cartoony-slate text-outline-sm text-center"
                >
                  <Camera className="w-4 h-4" />
                  Mulai Baru
                </Link>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center mt-8 text-slate-500 text-xs font-semibold">
        <p>© 2026 TAKE YOUR TIME BOOTH. ALL RIGHTS RESERVED.</p>
      </footer>

    </div>
  );
}
