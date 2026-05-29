'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useBooth } from '@/lib/boothContext';

const PHOTO_SLOTS = [
  { left: 0.06, top: 0.08, width: 0.42, height: 0.22 },
  { left: 0.06, top: 0.34, width: 0.42, height: 0.22 },
  { left: 0.06, top: 0.60, width: 0.42, height: 0.22 },
  { left: 0.52, top: 0.08, width: 0.42, height: 0.22 },
  { left: 0.52, top: 0.34, width: 0.42, height: 0.22 },
  { left: 0.52, top: 0.60, width: 0.42, height: 0.22 },
];

export default function ResultPage() {
  const router = useRouter();
  const { capturedPhotos, resetBooth } = useBooth();

  useEffect(() => {
    if (!capturedPhotos || capturedPhotos.length === 0) {
      router.replace('/capture');
    }
  }, [capturedPhotos, router]);

  const handleBack = () => {
    resetBooth();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-game-pattern flex flex-col items-center p-4 md:p-6 text-slate-900">
      <div className="w-full max-w-5xl flex items-center justify-between mb-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Home
        </button>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">Hasil Foto</p>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Galeri 6 Foto dengan Frame</h1>
        </div>
      </div>

      <div className="w-full max-w-4xl rounded-[2.5rem] overflow-hidden border border-slate-200 bg-slate-900 shadow-2xl">
        <div className="relative w-full">
          <div className="absolute inset-0">
            {PHOTO_SLOTS.map((slot, index) => (
              <div
                key={index}
                className="absolute overflow-hidden rounded-3xl border border-white/10 bg-slate-950"
                style={{
                  left: `${slot.left * 100}%`,
                  top: `${slot.top * 100}%`,
                  width: `${slot.width * 100}%`,
                  height: `${slot.height * 100}%`,
                }}
              >
                {capturedPhotos[index] ? (
                  <img
                    src={capturedPhotos[index]}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
            ))}
          </div>

          <img
            src="/frame.png"
            alt="Final Frame"
            className="relative z-10 w-full h-auto block"
          />
        </div>
      </div>

      <div className="w-full max-w-5xl mt-6 rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
        <p className="text-sm text-slate-600 leading-7">
          Foto Anda sudah ditempatkan langsung ke dalam frame. Gunakan tombol kembali untuk mengulang atau kembali
          ke halaman utama.
        </p>
      </div>
    </div>
  );
}
