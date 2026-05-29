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
          let fileName = `${id}.jpg`;
          let { data: urlData } = client.storage
            .from('photos')
            .getPublicUrl(fileName);
          
          let res = await fetch(urlData.publicUrl, { method: 'HEAD' });
          if (!res.ok) {
            // Fallback to check if it was stored as PNG
            fileName = `${id}.png`;
            const fallbackUrlData = client.storage
              .from('photos')
              .getPublicUrl(fileName);
            
            if (fallbackUrlData?.data?.publicUrl) {
              const fallbackRes = await fetch(fallbackUrlData.data.publicUrl, { method: 'HEAD' });
              if (fallbackRes.ok) {
                res = fallbackRes;
                urlData = fallbackUrlData.data;
              }
            }
          }
          
          if (res.ok && urlData?.publicUrl) {
            setPhotoUrl(urlData.publicUrl);
            setOrigin('Supabase File Storage');
            setLoading(false);
            return;
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

    const isJpeg = photoUrl.toLowerCase().includes('.jpg') || photoUrl.toLowerCase().includes('.jpeg') || photoUrl.startsWith('data:image/jpeg');
    const extension = isJpeg ? 'jpg' : 'png';
    const mimeType = isJpeg ? 'image/jpeg' : 'image/png';

    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // 1. Try Mobile Web Share API first (Highly recommended for iOS Safari, Chrome Android, and in-app browsers on mobile/tablet)
    if (isMobile && typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        const file = new File([blob], `take-your-time-${id.substring(0, 8)}.${extension}`, { type: mimeType });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Take Your Time Photobooth',
            text: 'Unduh hasil foto dari Take Your Time Photobooth!',
          });
          return;
        }
      } catch (shareError) {
        console.warn('Web Share failed or was cancelled, trying other methods:', shareError);
      }
    }

    // 2. If it is a Supabase URL, use server-side ?download parameter to bypass CORS & in-app browser limitations
    if (photoUrl.includes('supabase.co/storage/v1/object/public')) {
      try {
        const downloadUrl = `${photoUrl}?download=take-your-time-${id.substring(0, 8)}.${extension}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `take-your-time-${id.substring(0, 8)}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      } catch (err) {
        console.error('Supabase direct download failed:', err);
      }
    }

    // 3. For local blobs/base64, trigger direct download
    if (photoUrl.startsWith('data:') || photoUrl.startsWith('blob:')) {
      try {
        const link = document.createElement('a');
        link.href = photoUrl;
        link.download = `take-your-time-${id.substring(0, 8)}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      } catch (err) {
        console.error('Local blob download failed:', err);
      }
    }

    // 4. Default fallback: fetch as blob and download (standard desktop method)
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `take-your-time-${id.substring(0, 8)}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('All download methods failed, navigating to image:', error);
      // Final resilient fallback: navigate directly to image (never blocked by popup blockers)
      window.location.href = photoUrl;
    }
  };

  const copyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-game-pattern flex flex-col justify-between items-center p-4 md:p-6 select-none">
      
      {/* Navbar/Header */}
      <nav className="w-full max-w-md flex justify-between items-center bg-white border border-slate-200/80 shadow-sm rounded-2xl px-5 py-3 z-10 animate-fade-in">
        <div className="flex items-center gap-3 mx-auto">
          <div className="bg-blue-600 rounded-lg p-1.5 text-white shadow-sm">
            <Camera className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-extrabold text-blue-600 tracking-tight leading-none">
              LEPAS JUANG #2
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              SMK TI BAZMA • PORTAL UNDUH
            </span>
          </div>
        </div>
      </nav>

      {/* Main card */}
      <main className="w-full max-w-md my-auto flex flex-col items-center py-6 animate-fade-in animate-delay-100">
        
        {loading ? (
          <div className="bg-white border border-slate-200/80 shadow-md rounded-[2rem] p-8 w-full text-center flex flex-col items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              <Camera className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
            <p className="text-blue-600 font-extrabold text-lg tracking-wide animate-pulse">
              MEMUAT FOTO ANDA...
            </p>
            <p className="text-slate-400 text-xs font-semibold">Mencari di penyimpanan cloud dan cache lokal</p>
          </div>
        ) : errorMsg ? (
          <div className="bg-white border border-slate-200/80 shadow-md rounded-[2rem] p-8 w-full text-center flex flex-col items-center gap-4">
            <div className="bg-rose-500/10 p-4 rounded-full border border-rose-200">
              <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-rose-500 font-extrabold text-xl tracking-tight">FOTO TIDAK DITEMUKAN</h2>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Foto dengan ID ini tidak dapat ditemukan. Jika menggunakan mode offline, pastikan Anda memindai menggunakan perangkat yang sama atau berada dalam jaringan Wi-Fi lokal photobooth yang sama.
            </p>
            <div className="w-full pt-4 border-t border-slate-100">
              <Link
                href="/"
                className="w-full py-3 flex justify-center items-center gap-2 text-white font-bold text-sm btn-google-red cursor-pointer"
              >
                KEMBALI KE BERANDA
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-5">
            
            {/* Visual Frame wrapper */}
            <div className="bg-white border border-slate-200/80 shadow-md rounded-[2rem] p-4 overflow-hidden relative flex flex-col gap-3">
              <div className="absolute top-6 right-6 bg-green-500 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full border border-white shadow-sm z-10 tracking-widest uppercase">
                READY
              </div>

              {/* Image Preview Container */}
              <div className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center aspect-[2/3] max-h-[480px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl || ''}
                  alt="Captured photobooth snapshot"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Source Badge */}
              <div className="text-center">
                <span className="text-[9px] bg-slate-50 text-slate-500 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-widest font-extrabold">
                  Sumber: {origin}
                </span>
              </div>
            </div>

            {/* Actions list */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDownload}
                className="w-full py-4 flex justify-center items-center gap-2 text-white font-bold text-md btn-google-green cursor-pointer shadow-md hover:shadow-lg active:scale-95 transition-all"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                DOWNLOAD FOTO (JPG)
              </button>

              <p className="text-[10px] text-slate-400 text-center font-semibold px-2 leading-relaxed">
                💡 <strong>Tips HP:</strong> Jika tombol tidak merespon (terutama di dalam browser Instagram/WhatsApp), silakan <strong>tekan lama gambar di atas</strong> lalu pilih <strong>"Simpan Gambar"</strong>.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  onClick={copyLink}
                  className="py-3 flex justify-center items-center gap-2 text-white font-bold text-xs btn-google-blue cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                  {copied ? 'Link Disalin!' : 'Bagikan Link'}
                </button>

                <Link
                  href="/"
                  className="py-3 flex justify-center items-center gap-2 text-slate-700 font-bold text-xs btn-google-white text-center cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  Mulai Baru
                </Link>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-slate-400 text-xs font-semibold z-10">
        <p>© 2026 TAKE YOUR TIME BOOTH. ALL RIGHTS RESERVED.</p>
      </footer>

    </div>
  );
}
