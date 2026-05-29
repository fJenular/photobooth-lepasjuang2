'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Frame, FRAMES } from './framesData';

interface PlacedSticker {
  id: string;
  stickerId: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
}

interface BoothContextType {
  selectedFrame: Frame;
  setSelectedFrame: (frame: Frame) => void;
  capturedPhotos: string[];
  setCapturedPhotos: (photos: string[]) => void;
  photoFilter: string;
  setPhotoFilter: (filter: string) => void;
  placedStickers: PlacedSticker[];
  setPlacedStickers: (stickers: PlacedSticker[]) => void;
  resetBooth: () => void;
}

const BoothContext = createContext<BoothContextType | undefined>(undefined);

export function BoothProvider({ children }: { children: React.ReactNode }) {
  const [selectedFrame, setSelectedFrameState] = useState<Frame>(FRAMES[0]);
  const [capturedPhotos, setCapturedPhotosState] = useState<string[]>([]);
  const [photoFilter, setPhotoFilterState] = useState<string>('');
  const [placedStickers, setPlacedStickersState] = useState<PlacedSticker[]>([]);

  // Load initial states from sessionStorage on mount (to support soft refresh/reloads)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFrame = sessionStorage.getItem('booth_frame');
      // NOTE: we intentionally do NOT load `booth_photos` from sessionStorage here.
      // Storing large base64 image data in sessionStorage/localStorage easily exceeds
      // browser quotas and causes QuotaExceededError. Captured photos are kept in-memory
      // during the session and the final compiled image is persisted to IndexedDB
      // via `lib/localDb.ts` when needed.
      const savedFilter = sessionStorage.getItem('booth_filter');
      const savedStickers = sessionStorage.getItem('booth_stickers');

      if (savedFrame) {
        try {
          const parsed = JSON.parse(savedFrame);
          setSelectedFrameState(parsed);
        } catch (_) {}
      }
      if (savedFilter) {
        setPhotoFilterState(savedFilter);
      }
      if (savedStickers) {
        try {
          const parsed = JSON.parse(savedStickers);
          setPlacedStickersState(parsed);
        } catch (_) {}
      }
    }
  }, []);

  const setSelectedFrame = (frame: Frame) => {
    setSelectedFrameState(frame);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('booth_frame', JSON.stringify(frame));
    }
  };

  const setCapturedPhotos = (photos: string[]) => {
    setCapturedPhotosState(photos);
    // IMPORTANT: do NOT persist raw base64 images to sessionStorage/localStorage.
    // This prevents exceeding storage quotas on the browser. Use IndexedDB
    // (`lib/localDb.ts`) for storing final compiled captures instead.
  };

  const setPhotoFilter = (filter: string) => {
    setPhotoFilterState(filter);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('booth_filter', filter);
    }
  };

  const setPlacedStickers = (stickers: PlacedSticker[]) => {
    setPlacedStickersState(stickers);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('booth_stickers', JSON.stringify(stickers));
    }
  };

  const resetBooth = () => {
    setSelectedFrameState(FRAMES[0]);
    setCapturedPhotosState([]);
    setPhotoFilterState('');
    setPlacedStickersState([]);
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('booth_frame');
      sessionStorage.removeItem('booth_photos');
      sessionStorage.removeItem('booth_filter');
      sessionStorage.removeItem('booth_stickers');
    }
  };

  return (
    <BoothContext.Provider
      value={{
        selectedFrame,
        setSelectedFrame,
        capturedPhotos,
        setCapturedPhotos,
        photoFilter,
        setPhotoFilter,
        placedStickers,
        setPlacedStickers,
        resetBooth,
      }}
    >
      {children}
    </BoothContext.Provider>
  );
}

export function useBooth() {
  const context = useContext(BoothContext);
  if (context === undefined) {
    throw new Error('useBooth must be used within a BoothProvider');
  }
  return context;
}
