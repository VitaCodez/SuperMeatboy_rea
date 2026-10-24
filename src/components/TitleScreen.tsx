import React, { useState, useEffect } from 'react';
import { soundManager, SMB_SOUNDS } from '../engine/sound';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenChapters: () => void;
  onOpenCharacters: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenChapters,
  onOpenCharacters,
  onOpenSettings,
}) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = [
    { label: 'GAME START', action: onStartGame },
    { label: 'CHAPTER SELECT', action: onOpenChapters },
    { label: 'CHARACTER ROSTER', action: onOpenCharacters },
    { label: 'SETTINGS & AUDIO', action: onOpenSettings },
  ];

  const handleSelect = (idx: number) => {
    soundManager.playSfx(SMB_SOUNDS.SELECT);
    menuItems[idx].action();
  };

  const handlePressStart = () => {
    soundManager.playSfx(SMB_SOUNDS.SPLATTER);
    setHasStarted(true);
  };

  useEffect(() => {
    soundManager.playMusic(SMB_SOUNDS.TITLE_LOOP);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasStarted) {
        if (
          e.key === 'Enter' ||
          e.key === ' ' ||
          e.key === 'z' ||
          e.key === 'Z' ||
          e.key === 'x' ||
          e.key === 'X' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown'
        ) {
          e.preventDefault();
          handlePressStart();
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        soundManager.playSfx(SMB_SOUNDS.NAVIGATE);
        setSelectedIndex((prev) => (prev < menuItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        soundManager.playSfx(SMB_SOUNDS.NAVIGATE);
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : menuItems.length - 1));
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        handleSelect(selectedIndex);
      } else if (e.key === 'Escape') {
        soundManager.playSfx(SMB_SOUNDS.RETRO_BOOP);
        setHasStarted(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, selectedIndex]);

  return (
    <div
      onClick={() => {
        if (!hasStarted) handlePressStart();
      }}
      className="relative w-full h-full overflow-hidden bg-black select-none cursor-pointer"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/assets/textures/HUD/titlescreen.png)',
          backgroundColor: '#1a0505',
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10 pointer-events-none" />

      <div className="relative z-10 flex h-full flex-col items-center justify-end pb-10 md:pb-14">
        {!hasStarted ? (
          <div className="flex flex-col items-center animate-smb-blink">
            <div className="text-2xl md:text-4xl font-black text-white uppercase tracking-[0.2em] [text-shadow:3px_3px_0_#000,-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000]">
              PRESS START
            </div>
            <div className="mt-2 text-xs md:text-sm font-bold text-stone-300 tracking-widest uppercase">
              [ SPACE OR ENTER ]
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-2 px-4">
            {menuItems.map((item, idx) => {
              const isSelected = selectedIndex === idx;

              return (
                <button
                  key={item.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(idx);
                    handleSelect(idx);
                  }}
                  onMouseEnter={() => {
                    if (selectedIndex !== idx) {
                      soundManager.playSfx(SMB_SOUNDS.NAVIGATE);
                      setSelectedIndex(idx);
                    }
                  }}
                  className={`w-full py-2 px-5 flex items-center justify-between text-lg md:text-xl font-black uppercase tracking-wider transition-transform duration-100 ${
                    isSelected
                      ? 'bg-red-700/95 text-amber-300 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.8)] border-2 border-amber-300 translate-x-2'
                      : 'bg-black/80 text-stone-300 border-2 border-stone-800 hover:border-red-600 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isSelected ? 'text-amber-300' : 'text-stone-600'}>
                      {isSelected ? '>' : ' '}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {isSelected && (
                    <span className="text-sm text-amber-300 tracking-normal font-bold">
                      [ENTER]
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <footer className="absolute bottom-2 left-4 right-4 z-10 flex items-center justify-between text-[10px] md:text-xs font-bold text-stone-400/90 uppercase tracking-widest">
        <div>
          {hasStarted ? '[W / S] NAVIGATE    [ENTER] SELECT    [ESC] BACK' : '[SPACE / ENTER] TO PLAY'}
        </div>
        <div className="text-stone-500">&copy; 2010 TEAM MEAT</div>
      </footer>
    </div>
  );
};
