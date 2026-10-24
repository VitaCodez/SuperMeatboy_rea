import React, { useState, useEffect } from 'react';
import { soundManager, SMB_SOUNDS } from '../engine/sound';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenCharacters: () => void;
  onLevelSelect: () => void;
  onChapterSelect: () => void;
  onQuitToTitle: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onOpenCharacters,
  onLevelSelect,
  onChapterSelect,
  onQuitToTitle,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuOptions = [
    { label: 'CONTINUE', action: onResume },
    { label: 'RESTART LEVEL', action: onRestart },
    { label: 'CHARACTER ROSTER', action: onOpenCharacters },
    { label: 'LEVEL SELECT', action: onLevelSelect },
    { label: 'CHAPTER SELECT', action: onChapterSelect },
    { label: 'QUIT TO TITLE', action: onQuitToTitle },
  ];

  const handleSelect = (idx: number) => {
    soundManager.playSfx(SMB_SOUNDS.SELECT);
    menuOptions[idx].action();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        soundManager.playSfx(SMB_SOUNDS.NAVIGATE);
        setSelectedIndex((prev) => (prev < menuOptions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        soundManager.playSfx(SMB_SOUNDS.NAVIGATE);
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : menuOptions.length - 1));
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        handleSelect(selectedIndex);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        soundManager.playSfx(SMB_SOUNDS.RETRO_BOOP);
        onResume();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm select-none">
      <div
        className="w-full max-w-md bg-cover bg-center p-8 border-4 border-red-900 shadow-[0_0_50px_rgba(0,0,0,0.95)]"
        style={{
          backgroundImage: 'url(/assets/textures/Menus/pausemenu.png)',
          backgroundColor: '#0d0202',
        }}
      >
        {/* Header */}
        <h2 className="text-5xl font-black text-center text-red-600 uppercase tracking-widest drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] mb-6">
          PAUSED
        </h2>

        {/* Options list */}
        <div className="space-y-2">
          {menuOptions.map((opt, idx) => {
            const isSelected = selectedIndex === idx;

            return (
              <button
                key={opt.label}
                onClick={() => {
                  setSelectedIndex(idx);
                  handleSelect(idx);
                }}
                onMouseEnter={() => {
                  if (selectedIndex !== idx) {
                    soundManager.playSfx(SMB_SOUNDS.NAVIGATE);
                    setSelectedIndex(idx);
                  }
                }}
                className={`w-full py-2 px-6 flex items-center justify-between text-xl md:text-2xl font-black uppercase tracking-wider transition-transform duration-100 ${
                  isSelected
                    ? 'bg-red-700 text-amber-300 border-2 border-amber-300 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.8)] translate-x-1'
                    : 'bg-black/85 text-stone-300 border-2 border-stone-800 hover:border-red-600 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isSelected ? 'text-amber-300' : 'text-stone-600'}>
                    {isSelected ? '►' : ' '}
                  </span>
                  <span>{opt.label}</span>
                </div>
                {isSelected && (
                  <span className="text-xs text-amber-300 font-bold">[ENTER]</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer controls prompt */}
        <div className="text-center text-xs font-black text-stone-500 uppercase tracking-widest mt-6">
          [W / S] NAVIGATE    [ENTER] SELECT    [ESC] RESUME
        </div>
      </div>
    </div>
  );
};
