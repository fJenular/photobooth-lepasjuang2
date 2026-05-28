'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBooth } from '@/lib/boothContext';
import { FRAMES, Frame } from '@/lib/framesData';
import { ArrowLeft, ArrowRight, Camera, Grid, Layout } from 'lucide-react';

export default function SelectFramePage() {
  const router = useRouter();
  const { selectedFrame, setSelectedFrame } = useBooth();
  const [filter, setFilter] = useState<'ALL' | 'RETRO' | 'CUTE' | 'FOOTBALL' | 'AESTHETIC'>('ALL');

  const handleNext = () => {
    router.push('/capture');
  };

  const handleBack = () => {
    router.push('/');
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
            PILIH TEMPLATE FRAME
          </h2>
          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">
            Langkah 1 dari 4
          </span>
        </div>
        <div className="w-9"></div> {/* spacer */}
      </header>

      {/* Main Grid */}
      <main className="w-full max-w-5xl flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 my-4 z-10">
        
        {/* Left list options */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-white/90 border border-slate-200 shadow-sm rounded-3xl p-4 md:p-5 order-2 lg:order-1">
          
          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
            {(['ALL', 'RETRO', 'CUTE', 'FOOTBALL', 'AESTHETIC'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                  filter === cat 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Scrolling List */}
          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
            {FRAMES.filter(f => filter === 'ALL' || f.category === filter).map(frame => (
              <button
                key={frame.id}
                onClick={() => setSelectedFrame(frame)}
                className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                  selectedFrame.id === frame.id 
                    ? 'bg-blue-50/50 border-blue-600 text-slate-800 shadow-sm' 
                    : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-xl border border-slate-200 flex-shrink-0 flex items-center justify-center text-lg shadow-inner"
                  style={{ backgroundColor: frame.bgColor }}
                >
                  {frame.id === 'lepas-juang-bazma' ? '🎓' : '📸'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs md:text-sm truncate">{frame.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {frame.layoutType === 'photostrip' ? 'Strip (4)' : 
                       frame.layoutType === 'grid' ? 'Grid (6)' : 
                       frame.layoutType === 'square' ? 'Square (1)' : 'Polaroid (1)'}
                    </span>
                  </div>
                </div>

                {frame.accentBadge && (
                  <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border ${
                    selectedFrame.id === frame.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-amber-400 border-amber-400 text-black'
                  }`}>
                    {frame.accentBadge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Preview */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between bg-white border border-slate-200 shadow-sm rounded-3xl p-4 md:p-6 order-1 lg:order-2">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">
            Pratinjau Layout Template
          </span>

          {/* Interactive render */}
          <div 
            className={`border border-slate-200 shadow-md rounded-2xl p-4 flex flex-col justify-between items-center transition-all relative overflow-hidden ${
              selectedFrame.layoutType === 'photostrip' ? 'w-36 aspect-[1/3]' : 
              selectedFrame.layoutType === 'grid' ? 'w-52 aspect-[7/10]' : 
              selectedFrame.layoutType === 'square' ? 'w-52 aspect-square' :
              'w-48 aspect-[2/3]'
            }`}
            style={{ backgroundColor: selectedFrame.bgColor }}
          >
            {/* Special logo decoration on frame preview */}
            {selectedFrame.id === 'lepas-juang-bazma' && (
              <div className="absolute inset-0 pointer-events-none z-0">
                {/* Top left graduation shapes */}
                <div className="absolute top-0 left-0 w-8 h-8 bg-orange-500 rounded-br-full"></div>
                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-pink-500 rounded-full"></div>
                <div className="absolute top-1.5 left-8 text-[6px] font-bold text-green-600">BAZMA</div>
                <div className="absolute top-1.5 right-6 text-[5px] font-bold text-slate-800">SMK BAZMA</div>
                {/* Bottom geometric block */}
                <div className="absolute bottom-6 left-2.5 w-6 h-4.5 bg-orange-600 flex items-center justify-center text-[6px] text-white font-mono rounded">
                  &lt;/&gt;
                </div>
              </div>
            )}

            {/* Checkered preview overlay */}
            {selectedFrame.patternClass && (
              <div className={`absolute inset-0 opacity-10 pointer-events-none ${selectedFrame.patternClass}`}></div>
            )}

            <div className="w-full flex-1 flex flex-col justify-center gap-2 relative z-10">
              {selectedFrame.layoutType === 'photostrip' && (
                <div className="flex flex-col gap-1.5 w-full h-full justify-between py-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex-1 bg-slate-900/10 border border-slate-900/20 rounded-md flex items-center justify-center">
                      <Camera className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
              {selectedFrame.layoutType === 'grid' && (
                <div className="grid grid-cols-2 gap-1.5 w-full h-full py-1">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-slate-900/10 border border-slate-900/20 rounded-md aspect-square flex items-center justify-center">
                      <Camera className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
              {selectedFrame.layoutType === 'polaroid' && (
                <div className="w-full h-[85%] bg-slate-900/10 border border-slate-900/20 rounded-md flex items-center justify-center">
                  <Camera className="w-7 h-7 text-slate-400" />
                </div>
              )}
              {selectedFrame.layoutType === 'square' && (
                <div className="w-full aspect-square bg-slate-900/10 border border-slate-900/20 rounded-md flex items-center justify-center mt-2.5">
                  <Camera className="w-7 h-7 text-slate-400" />
                </div>
              )}
            </div>

            {selectedFrame.id === 'lepas-juang-bazma' ? (
              <div className="text-center font-extrabold mt-2 text-[7px] uppercase tracking-tighter text-blue-600 z-10">
                LEPAS JUANG #2 • 2 JUNE 2025
              </div>
            ) : selectedFrame.accentText ? (
              <div 
                className="text-center font-bold mt-1 text-[9px] uppercase truncate w-full select-none"
                style={{ color: selectedFrame.textColor }}
              >
                {selectedFrame.accentText}
              </div>
            ) : null}
          </div>

          {/* Action */}
          <div className="w-full max-w-xs mt-5">
            <button
              onClick={handleNext}
              className="w-full py-3.5 flex justify-center items-center gap-2 text-white font-bold text-md btn-google-blue cursor-pointer"
            >
              LANJUT KE KAMERA
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-slate-400 text-xs font-semibold z-10">
        <p>© 2026 TAKE YOUR TIME BOOTH. ALL RIGHTS RESERVED.</p>
      </footer>

    </div>
  );
}
