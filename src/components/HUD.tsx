import React, { useState, useEffect } from 'react';

export interface HUDProps {
  levelName: string;
  chapterNumber?: number;
  isDarkWorld?: boolean;
  elapsedTime?: number;
  time?: number;
  parTime: number;
  deathCount?: number;
  deaths?: number;
  hasBandage?: boolean;
  bandageCollected?: boolean;
  isPaused?: boolean;
  isReplay?: boolean;
  showSpeedrunTimer?: boolean;
  onPauseToggle?: () => void;
  onRestart?: () => void;
  onMenu?: () => void;
}

export const formatTimer = (timeInSeconds: number): string => {
  const safeTime = Math.max(0, timeInSeconds);
  const minutes = Math.floor(safeTime / 60);
  const seconds = Math.floor(safeTime % 60);
  const hundredths = Math.floor((safeTime % 1) * 100);

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  const xx = hundredths.toString().padStart(2, '0');

  return `${mm}:${ss}.${xx}`;
};

const formatLevelTimer = (timeInSeconds: number): string => {
  const safeTime = Math.max(0, timeInSeconds);
  const minutes = Math.floor(safeTime / 60);
  const seconds = Math.floor(safeTime % 60);
  const hundredths = Math.floor((safeTime % 1) * 100);
  const ss = seconds.toString().padStart(2, '0');
  const xx = hundredths.toString().padStart(2, '0');

  return minutes > 0 ? `${minutes}:${ss}.${xx}` : `${seconds}.${xx}`;
};

export const HUD: React.FC<HUDProps> = ({
  levelName,
  elapsedTime = 0,
  time,
  bandageCollected = false,
  showSpeedrunTimer = false,
}) => {
  const [showBandageToast, setShowBandageToast] = useState(false);

  useEffect(() => {
    if (bandageCollected) {
      setShowBandageToast(true);
      const timer = setTimeout(() => {
        setShowBandageToast(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [bandageCollected]);

  const finalTime = time ?? elapsedTime ?? 0;
  const displayName = levelName.replace(/^\d+-\d+x?:\s*/, '');

  return (
    <div className="pointer-events-none select-none">
      <div className="absolute top-2 left-0 right-0 z-20 flex flex-col items-center">
        <div className="text-xl md:text-2xl font-black text-white uppercase tracking-[0.12em] [text-shadow:2px_2px_0_#000,-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000]">
          {displayName}
        </div>
        <div className="text-lg md:text-xl font-black text-red-500 tabular-nums [text-shadow:2px_2px_0_#000,-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000]">
          {formatLevelTimer(finalTime)}
        </div>
      </div>

      {showBandageToast && (
        <div className="absolute top-24 left-0 right-0 z-30 flex justify-center transition-all duration-300 animate-bounce">
          <div className="bg-amber-400 text-stone-950 font-black px-6 py-2 border-2 border-white text-xl uppercase tracking-widest shadow-[0_0_25px_rgba(251,191,36,0.9)]">
            BANDAGE SAVED!
          </div>
        </div>
      )}

      {/* Optional Minimalist Speedrun Timer (disabled by default for clean SMB gameplay) */}
      {showSpeedrunTimer && (
        <div className="absolute top-4 right-6 z-20 bg-black/60 px-3 py-1 border border-stone-800 text-amber-300 font-black text-lg tracking-widest">
          {formatTimer(finalTime)}
        </div>
      )}
    </div>
  );
};
