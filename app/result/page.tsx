'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, CheckCircle2, Download, RotateCcw } from 'lucide-react';
import { useBooth } from '@/lib/boothContext';

const PHOTO_SLOTS = [
    { left: 0.04, top: 0.0, width: 0.45, height: 0.25 },
  { left: 0.04, top: 0.28, width: 0.45, height: 0.25 },
  { left: 0.04, top: 0.50, width: 0.45, height: 0.25 },
  { left: 0.54, top: 0.0, width: 0.45, height: 0.25 },
  { left: 0.52, top: 0.28, width: 0.45, height: 0.25 },
  { left: 0.52, top: 0.50, width: 0.45, height: 0.25 },
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

  const handleRetake = () => {
    resetBooth();
    router.push('/capture');
  };

  const handleContinue = () => {
    router.push('/share');
  };

  return (
    <div className="min-h-screen bg-game-pattern flex flex-col items-center px-4 py-4 text-slate-900 sm:px-5 md:px-6 md:py-5">
      <header className="z-10 w-full max-w-6xl flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/90 px-3 py-3 shadow-sm backdrop-blur md:rounded-[2rem] md:px-5 md:py-4">
        <button
          onClick={handleBack}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 sm:px-4 sm:text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali ke Home</span>
          <span className="sm:hidden">Home</span>
        </button>
        <div className="min-w-0 text-right">
          <p className="text-[9px] uppercase tracking-[0.28em] text-slate-400 font-bold md:text-[10px]">Hasil Foto</p>
          <h1 className="truncate text-base font-extrabold text-slate-900 sm:text-xl md:text-2xl">Preview Frame</h1>
        </div>
      </header>

      <main className="z-10 grid w-full max-w-6xl flex-1 items-start gap-4 py-4 md:grid-cols-[minmax(0,1fr)_300px] md:gap-5 md:py-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="order-1 flex min-h-0 items-center justify-center md:sticky md:top-5">
          <div className="w-full max-w-[min(92vw,430px)] md:max-w-[min(58vw,620px)]">
            <div className="relative rounded-[2rem] border border-white bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)] md:rounded-[2.75rem] md:p-3">
              <div className="pointer-events-none absolute -left-3 top-10 hidden h-20 w-20 rounded-3xl bg-blue-500/10 blur-2xl md:block" />
              <div className="pointer-events-none absolute -right-4 bottom-8 hidden h-24 w-24 rounded-full bg-amber-400/20 blur-2xl md:block" />
              <div className="relative overflow-hidden rounded-[1.55rem] border border-slate-200 bg-slate-950 md:rounded-[2.2rem]">
                <div className="absolute inset-0">
                  {PHOTO_SLOTS.map((slot, index) => (
                    <div
                      key={index}
                      className="absolute overflow-hidden rounded-xl border border-white/10 bg-slate-900 md:rounded-3xl"
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
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-900 text-[10px] font-bold text-slate-600">
                          {index + 1}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <img
                  src="/frame.png"
                  alt="Final Frame"
                  className="relative z-10 block h-auto w-full"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="order-2 w-full rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur md:sticky md:top-5 md:rounded-[2.5rem] md:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600 ring-1 ring-green-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-green-600">Siap Dipakai</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 md:text-2xl">Cek hasilnya dulu</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Pastikan semua foto masuk ke frame dengan rapi sebelum lanjut ke download, QR, atau print.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 rounded-3xl bg-slate-50 p-2 text-center">
            <div className="rounded-2xl bg-white px-2 py-3 shadow-sm">
              <p className="text-lg font-black text-blue-600">{capturedPhotos.length}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Foto</p>
            </div>
            <div className="rounded-2xl bg-white px-2 py-3 shadow-sm">
              <p className="text-lg font-black text-amber-500">1</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Frame</p>
            </div>
            <div className="rounded-2xl bg-white px-2 py-3 shadow-sm">
              <p className="text-lg font-black text-green-600">PNG</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Output</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              onClick={handleContinue}
              className="btn-google-blue flex min-h-12 w-full items-center justify-center gap-2 px-4 py-3 text-sm font-extrabold active:scale-95"
            >
              <Download className="h-4 w-4" />
              Lanjut Download / QR
            </button>
            <button
              onClick={handleRetake}
              className="btn-google-white flex min-h-12 w-full items-center justify-center gap-2 px-4 py-3 text-sm font-extrabold text-slate-700 active:scale-95"
            >
              <RotateCcw className="h-4 w-4 text-rose-500" />
              Ambil Ulang Foto
            </button>
            <button
              onClick={() => router.push('/capture')}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 transition hover:bg-slate-100 active:scale-95"
            >
              <Camera className="h-4 w-4" />
              Tambah / ulang sesi capture
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
