'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBooth } from '@/lib/boothContext';
import { STICKERS, FILTERS } from '@/lib/framesData';
import { ArrowLeft, ArrowRight, Layers, Sparkles, Smile } from 'lucide-react';

export default function EditorPage() {
  const router = useRouter();
  const { selectedFrame, capturedPhotos, photoFilter, setPhotoFilter, placedStickers, setPlacedStickers } = useBooth();
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  
  const stickerBoardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Redirect back to select if no photos captured
    if (capturedPhotos.length === 0) {
      router.push('/select-frame');
    }
  }, [capturedPhotos]);

  const handleNext = () => {
    router.push('/share');
  };

  const handleBack = () => {
    router.push('/capture');
  };

  const addSticker = (emoji: string) => {
    const newSticker = {
      id: Math.random().toString(36).substring(2, 9),
      stickerId: emoji,
      emoji: emoji,
      x: 40 + Math.random() * 20,
      y: 40 + Math.random() * 20,
      scale: 1.0
    };
    setPlacedStickers([...placedStickers, newSticker]);
    setActiveStickerId(newSticker.id);
  };

  const removeSticker = (id: string) => {
    setPlacedStickers(placedStickers.filter(s => s.id !== id));
    if (activeStickerId === id) setActiveStickerId(null);
  };

  const updateStickerScale = (id: string, delta: number) => {
    setPlacedStickers(placedStickers.map(s => {
      if (s.id === id) {
        return { ...s, scale: Math.max(0.4, Math.min(3.0, s.scale + delta)) };
      }
      return s;
    }));
  };

  const handleStickerDragStart = (e: React.DragEvent, emoji: string) => {
    e.dataTransfer.setData('text/plain', emoji);
  };

  const handleStickerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!stickerBoardRef.current) return;
    
    const emoji = e.dataTransfer.getData('text/plain');
    const boardRect = stickerBoardRef.current.getBoundingClientRect();
    
    const x = ((e.clientX - boardRect.left) / boardRect.width) * 100;
    const y = ((e.clientY - boardRect.top) / boardRect.height) * 100;

    const newSticker = {
      id: Math.random().toString(36).substring(2, 9),
      stickerId: emoji,
      emoji: emoji,
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
      scale: 1.0
    };

    setPlacedStickers([...placedStickers, newSticker]);
    setActiveStickerId(newSticker.id);
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    if (!stickerBoardRef.current) return;
    const touch = e.touches[0];
    const boardRect = stickerBoardRef.current.getBoundingClientRect();
    
    const x = Math.max(5, Math.min(95, ((touch.clientX - boardRect.left) / boardRect.width) * 100));
    const y = Math.max(5, Math.min(95, ((touch.clientY - boardRect.top) / boardRect.height) * 100));

    setPlacedStickers(placedStickers.map(s => {
      if (s.id === id) {
        return { ...s, x, y };
      }
      return s;
    }));
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
            DEKORASI & FILTER FOTO
          </h2>
          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">
            Langkah 3 dari 4
          </span>
        </div>
        <div className="w-9"></div>
      </header>

      {/* Main editor area */}
      <main className="w-full max-w-5xl flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 my-4 z-10">
        
        {/* Left decoration selectors */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-white/90 border border-slate-200 shadow-sm rounded-3xl p-4 md:p-5 order-2 lg:order-1">
          
          {/* Filters */}
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-2">
              ✨ Pilih Filter Retro
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setPhotoFilter(filter.class)}
                  className={`p-2 font-bold text-[10px] rounded-xl border transition-all cursor-pointer truncate ${
                    photoFilter === filter.class 
                      ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>

          {/* Stickers grid */}
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">
              🍥 Tambahkan Stiker
            </span>
            <span className="text-[9px] text-slate-500 font-bold mb-2">
              Klik stiker untuk menempel, atau seret ke atas foto.
            </span>
            
            <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-[160px] pr-1.5 custom-scrollbar">
              {STICKERS.map(sticker => (
                <button
                  key={sticker.id}
                  draggable
                  onDragStart={(e) => handleStickerDragStart(e, sticker.emoji)}
                  onClick={() => addSticker(sticker.emoji)}
                  className="aspect-square flex items-center justify-center text-2xl p-1 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 active:scale-95 transition-all"
                  title={sticker.label}
                >
                  {sticker.emoji}
                </button>
              ))}
            </div>

            {/* Sticker Scale tools */}
            {activeStickerId && (
              <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-250 flex items-center justify-between gap-3">
                <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wide">Ukuran Stiker:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateStickerScale(activeStickerId, -0.15)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-extrabold border border-slate-200 rounded-lg cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    onClick={() => updateStickerScale(activeStickerId, 0.15)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-extrabold border border-slate-200 rounded-lg cursor-pointer"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeSticker(activeStickerId)}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold border border-red-200 rounded-lg cursor-pointer text-xs"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right editor viewport */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between bg-white border border-slate-200 shadow-sm rounded-3xl p-4 md:p-6 order-1 lg:order-2">
          
          {/* Sticker board container */}
          <div 
            ref={stickerBoardRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleStickerDrop}
            className={`border border-slate-200 shadow-lg rounded-2xl p-4 relative overflow-hidden select-none ${
              selectedFrame.layoutType === 'photostrip' ? 'w-36 aspect-[1/3]' : 
              selectedFrame.layoutType === 'grid' ? 'w-52 aspect-[7/10]' : 
              selectedFrame.layoutType === 'square' ? 'w-52 aspect-square' :
              'w-48 aspect-[2/3]'
            }`}
            style={{ backgroundColor: selectedFrame.bgColor }}
          >
            {/* Checked layout bg patterns */}
            {selectedFrame.patternClass && (
              <div className={`absolute inset-0 opacity-10 pointer-events-none ${selectedFrame.patternClass}`}></div>
            )}

            {/* Special graphics for Bazma Frame */}
            {selectedFrame.id === 'lepas-juang-bazma' && (
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-10 h-10 bg-orange-500 rounded-br-full"></div>
                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-pink-500 rounded-full"></div>
                <div className="absolute top-2.5 left-10 text-[7px] font-bold text-green-600">BAZMA</div>
                <div className="absolute top-2.5 right-8 text-[6px] font-bold text-slate-800">SMK BAZMA</div>
                <div className="absolute bottom-12 left-2.5 w-6 h-4.5 bg-orange-600 flex items-center justify-center text-[6px] text-white font-mono rounded">
                  &lt;/&gt;
                </div>
                <div className="absolute bottom-12 right-2.5 w-6 h-6 bg-blue-600 flex items-center justify-center text-[7px] text-white rounded-sm">
                  ✒
                </div>
              </div>
            )}

            {/* Photos listing inside template */}
            <div className="w-full h-full flex flex-col justify-between items-center relative z-10">
              
              <div className="w-full flex-1 flex flex-col justify-center gap-2">
                {selectedFrame.layoutType === 'photostrip' && (
                  <div className="flex flex-col gap-1.5 w-full h-full justify-between py-1">
                    {[0, 1, 2, 3].map(idx => (
                      <div key={idx} className="flex-1 bg-slate-950 border border-slate-900 rounded overflow-hidden relative">
                        {capturedPhotos[idx] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={capturedPhotos[idx]} 
                            alt="Capture" 
                            className={`w-full h-full object-cover scale-x-[-1] ${photoFilter}`}
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 animate-pulse"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedFrame.layoutType === 'grid' && (
                  <div className="grid grid-cols-2 gap-1.5 w-full h-full py-1">
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <div key={idx} className="bg-slate-950 border border-slate-900 rounded aspect-square overflow-hidden relative">
                        {capturedPhotos[idx] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={capturedPhotos[idx]} 
                            alt="Capture" 
                            className={`w-full h-full object-cover scale-x-[-1] ${photoFilter}`}
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 animate-pulse"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedFrame.layoutType === 'polaroid' && (
                  <div className="w-full h-[85%] bg-slate-950 border border-slate-900 rounded overflow-hidden relative">
                    {capturedPhotos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={capturedPhotos[0]} 
                        alt="Capture" 
                        className={`w-full h-full object-cover scale-x-[-1] ${photoFilter}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 animate-pulse"></div>
                    )}
                  </div>
                )}

                {selectedFrame.layoutType === 'square' && (
                  <div className="w-full aspect-square bg-slate-950 border border-slate-900 rounded overflow-hidden relative mt-4">
                    {capturedPhotos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={capturedPhotos[0]} 
                        alt="Capture" 
                        className={`w-full h-full object-cover scale-x-[-1] ${photoFilter}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 animate-pulse"></div>
                    )}
                  </div>
                )}
              </div>

              {selectedFrame.id === 'lepas-juang-bazma' ? (
                <div className="text-center font-extrabold mt-2 text-[7px] uppercase tracking-tighter text-blue-600 z-10">
                  LEPAS JUANG #2 • 2 JUNE 2025
                </div>
              ) : selectedFrame.accentText ? (
                <div 
                  className="text-center font-bold mt-1 text-[8px] uppercase truncate w-full select-none"
                  style={{ color: selectedFrame.textColor }}
                >
                  {selectedFrame.accentText}
                </div>
              ) : null}
            </div>

            {/* Placed stickers list */}
            {placedStickers.map(placed => (
              <div
                key={placed.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStickerId(placed.id);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setActiveStickerId(placed.id);
                }}
                onTouchMove={(e) => handleTouchMove(e, placed.id)}
                className={`absolute z-35 cursor-move flex items-center justify-center p-0.5 rounded ${
                  activeStickerId === placed.id ? 'border border-dashed border-blue-600 bg-blue-50/10' : ''
                }`}
                style={{
                  left: `${placed.x}%`,
                  top: `${placed.y}%`,
                  transform: `translate(-50%, -50%) scale(${placed.scale})`,
                  fontSize: selectedFrame.layoutType === 'photostrip' ? '18px' : '26px'
                }}
              >
                {placed.emoji}
              </div>
            ))}
          </div>

          {/* Action */}
          <div className="w-full max-w-xs mt-5">
            <button
              onClick={handleNext}
              className="w-full py-3.5 flex justify-center items-center gap-2 text-white font-bold text-md btn-google-blue cursor-pointer"
            >
              PROSES FOTO AKHIR
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
