'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBooth } from '@/lib/boothContext';
import { saveLocalCapture } from '@/lib/localDb';
import { getSupabaseConfig, insertCaptureRecord, uploadCaptureToSupabase } from '@/lib/supabase';
import { ArrowLeft, Download, Home, Printer, QrCode, RotateCcw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PHOTO_SLOTS = [
  { left: 0.04, top: 0.0, width: 0.45, height: 0.25 },
  { left: 0.04, top: 0.28, width: 0.45, height: 0.25 },
  { left: 0.04, top: 0.50, width: 0.45, height: 0.25 },
  { left: 0.54, top: 0.0, width: 0.45, height: 0.25 },
  { left: 0.52, top: 0.28, width: 0.45, height: 0.25 },
  { left: 0.52, top: 0.50, width: 0.45, height: 0.25 },
];

const FRAME_ID = 'frame.png';
const FRAME_PATH = '/frame.png';

export default function SharePage() {
  const router = useRouter();
  const { capturedPhotos, resetBooth } = useBooth();

  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [finalImagePng, setFinalImagePng] = useState<string | null>(null);
  const [shareId, setShareId] = useState('');
  const [localIp] = useState(() => {
    if (typeof window === 'undefined') return 'localhost';
    return localStorage.getItem('local_ip') || 'localhost';
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const compiledCanvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = src;
      image.onload = () => resolve(image);
      image.onerror = reject;
    });
  }, []);

  const uploadToCloud = useCallback(async (id: string, base64: string) => {
    try {
      setIsUploading(true);
      setUploadError(null);

      const publicUrl = await uploadCaptureToSupabase(id, base64);
      if (!publicUrl) {
        setUploadError('Gagal unggah ke Cloud Storage. Cek bucket "photos" di Supabase.');
        return;
      }

      const success = await insertCaptureRecord({
        id,
        image_url: publicUrl,
        layout_type: 'frame',
        frame_id: FRAME_ID,
      });

      if (!success) {
        setUploadError('Foto diunggah, tetapi gagal menyimpan record database.');
      }
    } catch {
      setUploadError('Terjadi kesalahan saat upload. Coba lagi atau gunakan offline.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const generateCompositeImage = useCallback(async () => {
    const canvas = compiledCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    try {
      const frameImage = await loadImage(FRAME_PATH);
      const width = frameImage.naturalWidth || frameImage.width;
      const height = frameImage.naturalHeight || frameImage.height;

      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      const drawCoverPhoto = (
        image: HTMLImageElement,
        dx: number,
        dy: number,
        dw: number,
        dh: number
      ) => {
        const imageAspect = image.width / image.height;
        const slotAspect = dw / dh;
        let sx = 0;
        let sy = 0;
        let sw = image.width;
        let sh = image.height;

        if (imageAspect > slotAspect) {
          sw = image.height * slotAspect;
          sx = (image.width - sw) / 2;
        } else {
          sh = image.width / slotAspect;
          sy = (image.height - sh) / 2;
        }

        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
      };

      for (const [index, slot] of PHOTO_SLOTS.entries()) {
        const photo = capturedPhotos[index];
        if (!photo) continue;

        try {
          const photoImage = await loadImage(photo);
          drawCoverPhoto(
            photoImage,
            slot.left * width,
            slot.top * height,
            slot.width * width,
            slot.height * height
          );
        } catch {
          // Skip unreadable photo data and keep generating the final frame.
        }
      }

      ctx.drawImage(frameImage, 0, 0, width, height);

      const compiledUrlPng = canvas.toDataURL('image/png');
      const compiledUrlJpeg = canvas.toDataURL('image/jpeg', 0.85);
      const uniqueId = crypto.randomUUID();

      setFinalImage(compiledUrlJpeg);
      setFinalImagePng(compiledUrlPng);
      setShareId(uniqueId);

      await saveLocalCapture({
        id: uniqueId,
        created_at: new Date().toISOString(),
        image_url: compiledUrlJpeg,
        layout_type: 'frame',
        frame_id: FRAME_ID,
        is_local: true,
      });

      const config = getSupabaseConfig();
      if (config.url && config.anonKey) {
        uploadToCloud(uniqueId, compiledUrlJpeg);
      }
    } catch {
      setUploadError('Gagal membuat gambar final dari frame.png.');
    }
  }, [capturedPhotos, loadImage, uploadToCloud]);

  useEffect(() => {
    if (capturedPhotos.length === 0) {
      router.push('/capture');
      return;
    }

    generateCompositeImage();
  }, [capturedPhotos, generateCompositeImage, router]);

  const syncToCloudManually = async () => {
    if (!finalImage || !shareId) return;

    const config = getSupabaseConfig();
    if (!config.url || !config.anonKey) {
      alert('Kunci Supabase belum dikonfigurasi. Silakan kembali ke Beranda untuk setup database.');
      return;
    }

    await uploadToCloud(shareId, finalImage);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !finalImagePng) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Photobooth</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            @page { size: auto; margin: 0mm; }
          </style>
        </head>
        <body>
          <img src="${finalImagePng}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = async () => {
    if (!finalImage) return;

    const isJpeg = finalImage.startsWith('data:image/jpeg');
    const extension = isJpeg ? 'jpg' : 'png';
    const mimeType = isJpeg ? 'image/jpeg' : 'image/png';

    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Mobile Web Share API support ONLY on Mobile/Tablet devices
    if (isMobile && typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        const response = await fetch(finalImage);
        const blob = await response.blob();
        const file = new File([blob], `lepas-juang-${shareId.substring(0, 8)}.${extension}`, { type: mimeType });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Lepas Juang Photobooth',
            text: 'Unduh hasil foto dari Lepas Juang Photobooth!',
          });
          return;
        }
      } catch (err) {
        console.warn('Web Share failed, trying direct download fallback:', err);
      }
    }

    const link = document.createElement('a');
    link.href = finalImage;
    link.download = `lepas-juang-${shareId.substring(0, 8)}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDownloadUrl = () => {
    if (typeof window === 'undefined') return '';

    // Check if the current hostname is a local offline address
    const hostname = window.location.hostname;
    const isLocalNetwork = hostname === 'localhost' || 
                           hostname === '127.0.0.1' || 
                           hostname.startsWith('192.168.') || 
                           hostname.startsWith('10.') || 
                           hostname.startsWith('172.');

    // If hosted online (on Vercel or any public domain), always use the website's live URL origin
    if (!isLocalNetwork || hostname.includes('vercel.app')) {
      return `${window.location.origin}/download/${shareId}`;
    }

    // If Supabase is configured even in local testing, we can also use the origin
    const config = getSupabaseConfig();
    if (config.url && config.anonKey) {
      return `${window.location.origin}/download/${shareId}`;
    }

    // Offline Local Mode: Use the local IP so other devices in the same Wi-Fi can connect
    const port = window.location.port ? `:${window.location.port}` : '';
    return `http://${localIp}${port}/download/${shareId}`;
  };

  const handleRestart = () => {
    resetBooth();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-game-pattern flex flex-col items-center px-4 py-4 md:px-6 md:py-5 select-none">
      <header className="w-full max-w-6xl flex items-center justify-between bg-white/95 border border-slate-200/80 shadow-sm rounded-2xl px-4 py-3 md:px-5 md:py-3.5 z-10 backdrop-blur">
        <button
          onClick={() => router.push('/result')}
          className="p-2 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-lg md:text-xl font-extrabold text-blue-600 tracking-tight">
            CETAK & BAGIKAN FOTO
          </h2>
          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">
            Langkah 4 dari 4
          </span>
        </div>
        <div className="w-9" />
      </header>

      <main className="w-full max-w-6xl flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_380px] gap-4 md:gap-5 py-4 md:py-5 z-10 items-start">
        <div className="order-1 flex flex-col items-center md:sticky md:top-5">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-3">
            Hasil Akhir Photobooth Anda
          </span>

          {finalImage ? (
            <div className="bg-white border border-slate-200/80 shadow-md rounded-[2rem] p-3 md:p-4 overflow-hidden w-full max-w-[min(82vw,300px)] md:max-w-[min(48vw,380px)] mx-auto relative">
              <img
                src={finalImage}
                alt="Final compiled frame"
                className="w-full h-auto object-contain rounded-lg border border-slate-200"
              />
            </div>
          ) : (
            <div className="w-40 aspect-[1/2] bg-slate-100 border border-dashed border-slate-300 animate-pulse rounded-2xl flex items-center justify-center">
              <span className="text-[10px] text-slate-400">Memproses canvas...</span>
            </div>
          )}
        </div>

        <div className="order-2 flex flex-col gap-4 md:gap-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur md:rounded-[2.5rem] md:p-5">
            <div className="mb-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-green-600">Final Output</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 md:text-2xl">Siap cetak & bagikan</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Download JPG, cetak, atau pindai QR untuk ambil hasil dari HP.
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
            <button
              onClick={handleDownload}
              disabled={!finalImage}
              className="w-full py-4 flex justify-center items-center gap-2 text-white font-bold text-md btn-google-green cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              DOWNLOAD GAMBAR (JPG)
            </button>

            <button
              onClick={handlePrint}
              disabled={!finalImagePng}
              className="w-full py-3.5 flex justify-center items-center gap-2 text-white font-bold text-sm btn-google-blue cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              CETAK / PRINT FOTO
            </button>
            </div>
          </div>

          <div className="bg-white/95 border border-slate-200 shadow-sm rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-5 flex flex-col items-center gap-4 backdrop-blur">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 w-full justify-center">
              <QrCode className="w-4 h-4 text-blue-600" />
              <span className="text-[11px] font-extrabold uppercase text-blue-600 tracking-wide">
                PINDAI QR UNTUK DOWNLOAD HP
              </span>
            </div>

            {shareId ? (
              <div className="flex flex-col items-center gap-4 w-full justify-center">
                <div className="p-2.5 bg-white border border-slate-200 rounded-2xl shadow-inner">
                  <QRCodeSVG value={getDownloadUrl()} size={110} level="H" />
                </div>

                <div className="w-full text-left flex flex-col gap-1.5">
                  <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                    Arahkan kamera ponsel ke QR Code untuk mengunduh hasil frame final.
                  </p>

                  <div className="bg-slate-50 border border-slate-250 rounded-xl px-2.5 py-1.5 break-all w-full">
                    <span className="text-[9px] text-slate-450 font-mono select-all">
                      {getDownloadUrl()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {isUploading ? (
                      <span className="text-[9px] text-amber-500 animate-pulse font-bold">
                        Mengunggah ke Cloud Storage...
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span className="text-[9px] text-green-600 font-bold uppercase tracking-wider">
                          Ready Online & Offline
                        </span>
                      </div>
                    )}

                    {uploadError && (
                      <div className="text-[9px] text-rose-500 font-bold mt-1">
                        {uploadError}
                      </div>
                    )}

                    <button
                      onClick={syncToCloudManually}
                      disabled={isUploading}
                      className="text-[9px] text-blue-600 hover:text-blue-500 font-bold underline text-left cursor-pointer disabled:opacity-50"
                    >
                      Unggah Ulang Ke Cloud Database
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 bg-slate-100 animate-pulse border border-slate-200 rounded flex items-center justify-center">
                <span className="text-[9px] text-slate-400">Memproses QR...</span>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur flex flex-col gap-2">
            <button
              onClick={handleRestart}
              className="w-full py-3 flex justify-center items-center gap-2 text-white font-bold text-xs btn-google-red cursor-pointer rounded-full hover:shadow-lg active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              AMBIL FOTO BARU
            </button>
            <button
              onClick={() => {
                resetBooth();
                router.push('/');
              }}
              className="w-full py-3 flex justify-center items-center gap-2 text-blue-600 font-bold text-xs border border-blue-600 btn-google-white cursor-pointer rounded-full hover:shadow-lg active:scale-95 transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              KEMBALI KE BERANDA
            </button>
          </div>
        </div>
      </main>

      <canvas ref={compiledCanvasRef} className="hidden" />

      <footer className="pb-2 text-center text-slate-400 text-xs font-semibold z-10">
        <p>© 2026 TAKE YOUR TIME BOOTH. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}
