'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBooth } from '@/lib/boothContext';
import { saveLocalCapture } from '@/lib/localDb';
import { getSupabaseConfig, uploadCaptureToSupabase, insertCaptureRecord } from '@/lib/supabase';
import { ArrowLeft, Download, Home, Printer, QrCode, RefreshCw, RotateCcw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SharePage() {
  const router = useRouter();
  const { selectedFrame, capturedPhotos, photoFilter, placedStickers, resetBooth } = useBooth();

  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string>('');
  const [localIp, setLocalIp] = useState('localhost');
  const [isUploading, setIsUploading] = useState(false);

  const compiledCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (capturedPhotos.length === 0) {
      router.push('/select-frame');
      return;
    }

    // Load configs
    if (typeof window !== 'undefined') {
      const savedIp = localStorage.getItem('local_ip') || 'localhost';
      setLocalIp(savedIp);
    }

    // Compile canvas
    generateCompositeImage();
  }, [capturedPhotos]);

  // Canvas drawing functions helper (mirrors drawing logic for BAZMA)
  const drawBazmaLogos = (ctx: CanvasRenderingContext2D, width: number) => {
    ctx.save();
    // Green text BAZMA
    ctx.font = 'bold 13px var(--font-plus-jakarta), sans-serif';
    ctx.fillStyle = '#16a34a';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(50, 30, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText('BAZMA', 65, 34);

    // SMK TI BAZMA
    ctx.font = 'bold 10px var(--font-plus-jakarta), sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('SMK TI', width - 110, 26);
    ctx.font = '800 11px var(--font-plus-jakarta), sans-serif';
    ctx.fillText('BAZMA', width - 110, 38);
    
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(width - 130, 22, 14, 16);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(width - 126, 26, 6, 8);
    ctx.restore();
  };

  const drawGeometricDecorations = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    
    // Orange circles/shapes top-left
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.fill();

    // Small blue grid blocks top-left
    ctx.fillStyle = '#2563eb';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        ctx.fillRect(70 + i * 8, 12 + j * 8, 4, 4);
      }
    }

    // Yellow star shape top-left
    ctx.fillStyle = '#facc15';
    ctx.fillRect(110, 45, 12, 12);

    // Blue circle
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(45, 130, 10, 0, Math.PI * 2);
    ctx.fill();

    // Pink geometric circle bottom-right border
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(width - 80, 50, 14, 0, Math.PI * 2);
    ctx.fill();

    // Blue block top-right
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(width - 45, 45, 30, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('★', width - 38, 66);

    // Bottom-left orange block with code icon '</>'
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(20, height - 70, 45, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('</>', 30, height - 44);

    // Bottom-right blue blocks with fountain pen icon
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(width - 80, height - 85, 35, 35);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(width - 62, height - 78);
    ctx.lineTo(width - 70, height - 60);
    ctx.lineTo(width - 55, height - 60);
    ctx.closePath();
    ctx.fill();

    // Colorful diagonal lines block
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(width - 130 + i * 8, height - 20);
      ctx.lineTo(width - 150 + i * 8, height - 70);
      ctx.stroke();
    }

    // Orange dots bottom-right
    ctx.fillStyle = '#f97316';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        ctx.fillRect(width - 50 + i * 8, height - 40 + j * 8, 4, 4);
      }
    }

    ctx.restore();
  };

  const generateCompositeImage = () => {
    const canvas = compiledCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const layout = selectedFrame.layoutType;
    let width = 600;
    let height = 900;

    if (layout === 'photostrip') {
      width = 400;
      height = 1200;
    } else if (layout === 'grid') {
      width = 700;
      height = 1000;
    } else if (layout === 'square') {
      width = 650;
      height = 650;
    }

    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = selectedFrame.bgColor;
    ctx.fillRect(0, 0, width, height);

    // Background checkered pattern
    if (selectedFrame.patternClass) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      const step = 20;
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          if ((x / step + y / step) % 2 === 0) {
            ctx.fillRect(x, y, step, step);
          }
        }
      }
    }

    // Draw Bazma custom graphic decorations if this frame is active
    if (selectedFrame.id === 'lepas-juang-bazma') {
      drawGeometricDecorations(ctx, width, height);
      drawBazmaLogos(ctx, width);
    }

    // Draw images
    const drawPhoto = (imgSrc: string, dx: number, dy: number, dw: number, dh: number): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imgSrc;
        img.onload = () => {
          ctx.save();
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#000000';
          ctx.strokeRect(dx, dy, dw, dh);
          
          // Photo filter
          if (photoFilter === 'filter-grayscale') {
            ctx.filter = 'grayscale(100%)';
          } else if (photoFilter === 'filter-vintage') {
            ctx.filter = 'sepia(30%) contrast(110%) brightness(105%)';
          } else if (photoFilter === 'filter-warm') {
            ctx.filter = 'sepia(20%) saturate(130%) brightness(102%)';
          } else if (photoFilter === 'filter-cool') {
            ctx.filter = 'saturate(120%) hue-rotate(15deg) contrast(105%)';
          } else if (photoFilter === 'filter-contrast') {
            ctx.filter = 'contrast(140%) brightness(105%)';
          }

          const imgAspect = img.width / img.height;
          const slotAspect = dw / dh;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          
          if (imgAspect > slotAspect) {
            sw = img.height * slotAspect;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / slotAspect;
            sy = (img.height - sh) / 2;
          }

          ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
      });
    };

    const processSequence = async () => {
      if (layout === 'photostrip') {
        const itemW = width - 40;
        const itemH = (height - 180) / 4;
        const gap = 16;
        for (let i = 0; i < 4; i++) {
          const photo = capturedPhotos[i] || '';
          if (photo) {
            await drawPhoto(photo, 20, 40 + i * (itemH + gap), itemW, itemH);
          }
        }
      } 
      else if (layout === 'grid') {
        const itemW = (width - 60) / 2;
        const itemH = (height - 180) / 3;
        const gap = 20;
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 2; col++) {
            const index = row * 2 + col;
            const photo = capturedPhotos[index] || '';
            if (photo) {
              await drawPhoto(photo, 20 + col * (itemW + gap), 40 + row * (itemH + gap), itemW, itemH);
            }
          }
        }
      } 
      else if (layout === 'polaroid') {
        const photo = capturedPhotos[0] || '';
        if (photo) {
          await drawPhoto(photo, 30, 30, width - 60, height - 160);
        }
      }
      else if (layout === 'square') {
        const photo = capturedPhotos[0] || '';
        if (photo) {
          await drawPhoto(photo, 70, 100, width - 140, width - 140);
        }
      }

      // Draw bottom text
      if (selectedFrame.id === 'lepas-juang-bazma') {
        ctx.save();
        ctx.fillStyle = '#2563eb';
        ctx.font = '800 48px var(--font-plus-jakarta), sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.strokeText('LEPAS JUANG #2', width / 2, height - 70);
        ctx.fillText('LEPAS JUANG #2', width / 2, height - 70);
        
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 22px var(--font-plus-jakarta), sans-serif';
        ctx.strokeText('2 JUNE 2025', width / 2, height - 26);
        ctx.fillText('2 JUNE 2025', width / 2, height - 26);
        ctx.restore();
      } 
      else if (selectedFrame.accentText) {
        ctx.fillStyle = selectedFrame.textColor;
        ctx.font = `900 ${layout === 'photostrip' ? '18px' : '26px'} var(--font-plus-jakarta), sans-serif`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        const textY = height - (layout === 'photostrip' ? 50 : 60);
        ctx.strokeText(selectedFrame.accentText, width / 2, textY);
        ctx.fillText(selectedFrame.accentText, width / 2, textY);
      }

      // Draw stickers
      for (const placed of placedStickers) {
        ctx.save();
        const emojiX = (placed.x / 100) * width;
        const emojiY = (placed.y / 100) * height;
        const size = Math.floor((layout === 'photostrip' ? 36 : 48) * placed.scale);
        ctx.translate(emojiX, emojiY);
        ctx.font = `${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(placed.emoji, 0, 0);
        ctx.restore();
      }

      const compiledUrl = canvas.toDataURL('image/png');
      setFinalImage(compiledUrl);

      // Save locally to IndexedDB & trigger upload
      const uniqueId = crypto.randomUUID();
      setShareId(uniqueId);

      const localData = {
        id: uniqueId,
        created_at: new Date().toISOString(),
        image_url: compiledUrl,
        layout_type: selectedFrame.layoutType,
        frame_id: selectedFrame.id,
        is_local: true
      };

      saveLocalCapture(localData);

      // Automatic upload if credentials present
      const config = getSupabaseConfig();
      if (config.url && config.anonKey) {
        uploadToCloud(uniqueId, compiledUrl);
      }
    };

    processSequence();
  };

const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadToCloud = async (id: string, base64: string) => {
    try {
      setIsUploading(true);
      setUploadError(null);
      const publicUrl = await uploadCaptureToSupabase(id, base64);
      if (publicUrl) {
        const success = await insertCaptureRecord({
          id,
          image_url: publicUrl,
          layout_type: selectedFrame.layoutType,
          frame_id: selectedFrame.id,
        });
        if (!success) {
          setUploadError('Foto diunggah, tetapi gagal menyimpan ke database.');
        }
      } else {
        setUploadError('⚠️ Gagal unggah ke Cloud Storage. Cek konfigurasi bucket "photos" di Supabase.');
      }
    } catch (e) {
      // Silently handle errors - error message already shown via state
      setUploadError('Terjadi kesalahan saat upload. Coba lagi atau gunakan offline.');
    } finally {
      setIsUploading(false);
    }
  };
  const syncToCloudManually = async () => {
    if (!finalImage || !shareId) return;
    const config = getSupabaseConfig();
    if (!config.url || !config.anonKey) {
      alert('Kunci Supabase belum dikonfigurasi. Silakan kembali ke Beranda untuk setup database.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    const publicUrl = await uploadCaptureToSupabase(shareId, finalImage);
    if (publicUrl) {
      const success = await insertCaptureRecord({
        id: shareId,
        image_url: publicUrl,
        layout_type: selectedFrame.layoutType,
        frame_id: selectedFrame.id
      });
      if (success) {
        alert('✅ Foto sukses disinkronkan ke Cloud Database!');
        setUploadError(null);
      } else {
        setUploadError('⚠️ Foto diunggah, tetapi gagal menyimpan record database.');
      }
    } else {
      setUploadError('⚠️ Gagal unggah ke Cloud Storage. Pastikan bucket "photos" sudah dibuat di Supabase dan berstatus Publik.');
    }
    setIsUploading(false);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !finalImage) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Photobooth</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
            @page { size: auto; margin: 0mm; }
          </style>
        </head>
        <body>
          <img src="${finalImage}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!finalImage) return;
    const link = document.createElement('a');
    link.href = finalImage;
    link.download = `lepas-juang-${shareId.substring(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDownloadUrl = () => {
    if (typeof window === 'undefined') return '';
    const config = getSupabaseConfig();
    if (config.url && config.anonKey) {
      return `${window.location.origin}/download/${shareId}`;
    } else {
      const port = window.location.port ? `:${window.location.port}` : '';
      return `http://${localIp}${port}/download/${shareId}`;
    }
  };

  const handleRestart = () => {
    resetBooth();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-game-pattern flex flex-col justify-between items-center p-4 md:p-6 select-none">
      
      {/* Header */}
      <header className="w-full max-w-5xl flex items-center justify-between bg-white border border-slate-200/80 shadow-sm rounded-2xl px-5 py-3.5 mb-2 z-10">
        <button 
          onClick={() => router.push('/editor')}
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
        <div className="w-9"></div>
      </header>

      {/* Body */}
      <main className="w-full max-w-5xl flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 my-4 z-10 items-start md:items-center">
        
        {/* Preview compiled picture */}
        <div className="lg:col-span-6 flex flex-col items-center order-2 lg:order-1">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-3">
            Hasil Akhir Photobooth Anda
          </span>

          {finalImage ? (
            <div className="bg-white border border-slate-200/80 shadow-md rounded-2xl p-3 md:p-4 overflow-hidden max-w-[230px] mx-auto relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={finalImage} 
                alt="Final compiled strip"
                className="w-full h-auto object-contain rounded-lg border border-slate-200"
              />
            </div>
          ) : (
            <div className="w-40 aspect-[1/2] bg-slate-100 border border-dashed border-slate-300 animate-pulse rounded-2xl flex items-center justify-center">
              <span className="text-[10px] text-slate-400">Memproses canvas...</span>
            </div>
          )}
        </div>

        {/* Share and actions column */}
        <div className="lg:col-span-6 flex flex-col gap-4 md:gap-5 order-1 lg:order-2">
          
          {/* Main buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleDownload}
              className="w-full py-4 flex justify-center items-center gap-2 text-white font-bold text-md btn-google-green cursor-pointer"
            >
              <Download className="w-5 h-5" />
              DOWNLOAD GAMBAR (PNG)
            </button>

            <button
              onClick={handlePrint}
              className="w-full py-3.5 flex justify-center items-center gap-2 text-white font-bold text-sm btn-google-blue cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              CETAK / PRINT FOTO
            </button>
          </div>

          {/* QR sharing code */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-4 flex flex-col items-center gap-4">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 w-full justify-center">
              <QrCode className="w-4 h-4 text-blue-600" />
              <span className="text-[11px] font-extrabold uppercase text-blue-600 tracking-wide">
                PINDAI QR UNTUK DOWNLOAD HP
              </span>
            </div>

            {shareId ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <div className="p-2.5 bg-white border border-slate-200 rounded-2xl shadow-inner">
                  <QRCodeSVG 
                    value={getDownloadUrl()} 
                    size={110} 
                    level="H" 
                  />
                </div>
                
                <div className="flex-1 text-left flex flex-col gap-1.5">
                  <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                    Arahkan kamera ponsel Anda ke QR Code untuk mengunduh fotostrip kelulusan langsung ke galeri HP!
                  </p>
                  
                  <div className="bg-slate-50 border border-slate-250 rounded px-2.5 py-1.5 break-all max-w-[210px]">
                    <span className="text-[9px] text-slate-450 font-mono select-all">
                      {getDownloadUrl()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {isUploading ? (
                      <span className="text-[9px] text-amber-500 animate-pulse font-bold">
                        ⌛ Mengunggah ke Cloud Storage...
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        <span className="text-[9px] text-green-600 font-bold uppercase tracking-wider">
                          Ready Online & Offline
                        </span>
                      </div>
                    )}
                    
                    {uploadError && (
                      <div className="text-[9px] text-rose-500 font-bold mt-1">
                        ⚠️ {uploadError}
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

          {/* Reset and Home buttons */}
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
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

      <canvas ref={compiledCanvasRef} className="hidden"></canvas>

      {/* Footer */}
      <footer className="text-center text-slate-400 text-xs font-semibold z-10">
        <p>© 2026 TAKE YOUR TIME BOOTH. ALL RIGHTS RESERVED.</p>
      </footer>

    </div>
  );
}
