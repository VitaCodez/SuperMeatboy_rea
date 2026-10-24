import React, { useState, useEffect } from 'react';
import { soundManager, SMB_SOUNDS } from '../engine/sound';

export interface ChapterInfo {
  id: number;
  name: string;
  subtitle: string;
  theme: string;
  bgImage: string;
  darkBgImage: string;
  color: string;
  darkColor: string;
  accent: string;
  totalLevels: number;
  bossName: string;
}

export const CHAPTERS: ChapterInfo[] = [
  {
    id: 1,
    name: 'The Forest',
    subtitle: 'Chapter 1',
    theme: 'forest',
    bgImage: '/assets/textures/Menus/fworldmenu.png',
    darkBgImage: '/assets/textures/Menus/fworldmenu.png',
    color: '#34d399',
    darkColor: '#059669',
    accent: '#10b981',
    totalLevels: 20,
    bossName: 'Lil Slugger',
  },
  {
    id: 2,
    name: 'The Hospital',
    subtitle: 'Chapter 2',
    theme: 'hospital',
    bgImage: '/assets/textures/Menus/hworldmenu.png',
    darkBgImage: '/assets/textures/Menus/hworldmenu.png',
    color: '#38bdf8',
    darkColor: '#0284c7',
    accent: '#0ea5e9',
    totalLevels: 20,
    bossName: 'C.H.A.D.',
  },
  {
    id: 3,
    name: 'The Salt Factory',
    subtitle: 'Chapter 3',
    theme: 'salt_factory',
    bgImage: '/assets/textures/Menus/bworldmenu.png',
    darkBgImage: '/assets/textures/Menus/bworldmenu.png',
    color: '#fbbf24',
    darkColor: '#d97706',
    accent: '#f59e0b',
    totalLevels: 20,
    bossName: 'Brownie',
  },
  {
    id: 4,
    name: 'Hell',
    subtitle: 'Chapter 4',
    theme: 'hell',
    bgImage: '/assets/textures/Menus/hellworldmenu.png',
    darkBgImage: '/assets/textures/Menus/hellworldmenu.png',
    color: '#ef4444',
    darkColor: '#991b1b',
    accent: '#dc2626',
    totalLevels: 20,
    bossName: 'Little Horn',
  },
  {
    id: 5,
    name: 'Rapture',
    subtitle: 'Chapter 5',
    theme: 'rapture',
    bgImage: '/assets/textures/Menus/rworldmenu.png',
    darkBgImage: '/assets/textures/Menus/rworldmenu.png',
    color: '#a855f7',
    darkColor: '#7e22ce',
    accent: '#9333ea',
    totalLevels: 20,
    bossName: 'Larries',
  },
  {
    id: 6,
    name: 'The End',
    subtitle: 'Chapter 6',
    theme: 'the_end',
    bgImage: '/assets/textures/Menus/eworldmenu.png',
    darkBgImage: '/assets/textures/Menus/eworldmenu.png',
    color: '#f43f5e',
    darkColor: '#881337',
    accent: '#e11d48',
    totalLevels: 5,
    bossName: 'Dr. Fetus',
  },
  {
    id: 7,
    name: 'Cotton Alley',
    subtitle: 'Chapter 7',
    theme: 'cotton_alley',
    bgImage: '/assets/textures/Menus/demoworld.png',
    darkBgImage: '/assets/textures/Menus/demoworld.png',
    color: '#f472b6',
    darkColor: '#db2777',
    accent: '#ec4899',
    totalLevels: 20,
    bossName: 'Bandage Girl',
  },
];

export interface ChapterProgress {
  [chapterId: number]: {
    light: { completed: number; aPlus: number; bandages: number };
    dark: { completed: number; aPlus: number; bandages: number };
  };
}

interface ChapterSelectProps {
  initialChapterId?: number;
  initialDarkWorld?: boolean;
  progress?: ChapterProgress;
  onSelectChapter: (chapterId: number, isDarkWorld: boolean) => void;
  onBackToTitle?: () => void;
  onOpenCharacterSelect?: () => void;
}

export const ChapterSelect: React.FC<ChapterSelectProps> = ({
  initialChapterId = 1,
  initialDarkWorld = false,
  progress,
  onSelectChapter,
  onBackToTitle,
  onOpenCharacterSelect,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(
    Math.max(0, CHAPTERS.findIndex((c) => c.id === initialChapterId))
  );
  const [isDarkWorld, setIsDarkWorld] = useState(initialDarkWorld);

  const currentChapter = CHAPTERS[selectedIndex];

  const stats = progress?.[currentChapter.id]?.[isDarkWorld ? 'dark' : 'light'] || {
    completed: currentChapter.id === 1 ? 7 : 0,
    aPlus: currentChapter.id === 1 ? 5 : 0,
    bandages: currentChapter.id === 1 ? 3 : 0,
  };

  const handlePrev = () => {
    soundManager.playSfx(SMB_SOUNDS.PAGE_TURN);
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : CHAPTERS.length - 1));
  };

  const handleNext = () => {
    soundManager.playSfx(SMB_SOUNDS.PAGE_TURN);
    setSelectedIndex((prev) => (prev < CHAPTERS.length - 1 ? prev + 1 : 0));
  };

  const toggleDarkWorld = () => {
    soundManager.playSfx(SMB_SOUNDS.RETRO_BOOP);
    setIsDarkWorld((prev) => !prev);
  };

  const handleConfirm = () => {
    soundManager.playSfx(SMB_SOUNDS.SELECT);
    onSelectChapter(currentChapter.id, isDarkWorld);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleNext();
      } else if (e.key === 'Tab' || e.key === 'x' || e.key === 'X' || e.key === 'Shift') {
        e.preventDefault();
        toggleDarkWorld();
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape' && onBackToTitle) {
        soundManager.playSfx(SMB_SOUNDS.PAGE_TURN);
        onBackToTitle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, isDarkWorld]);

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none transition-colors duration-500 ${
        isDarkWorld ? 'bg-[#0a0512]' : 'bg-[#100808]'
      }`}
    >
      {/* Dynamic Background Image with Grunge Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500 filter brightness-40 contrast-125"
        style={{
          backgroundImage: `url(${isDarkWorld ? currentChapter.darkBgImage : currentChapter.bgImage})`,
          backgroundColor: '#0a0505',
        }}
      />
      <div
        className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
          isDarkWorld
            ? 'bg-gradient-to-t from-purple-950/90 via-black/70 to-purple-950/80'
            : 'bg-gradient-to-t from-black via-black/50 to-[#220000]/80'
        }`}
      />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b-4 border-red-950 bg-black/75">
        <div className="flex items-center gap-4">
          {onBackToTitle && (
            <button
              onClick={() => {
                soundManager.playSfx(SMB_SOUNDS.PAGE_TURN);
                onBackToTitle();
              }}
              className="px-4 py-1.5 bg-black border-2 border-stone-700 hover:border-red-500 text-stone-300 hover:text-white text-base font-black uppercase transition tracking-wider"
            >
              [ESC] TITLE
            </button>
          )}

          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            SUPER MEAT BOY - CHAPTER SELECT
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkWorld}
            className={`px-4 py-1.5 border-2 text-base font-black uppercase tracking-wider transition ${
              isDarkWorld
                ? 'bg-purple-950 text-purple-200 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.7)]'
                : 'bg-black text-amber-300 border-amber-600 hover:border-amber-400'
            }`}
          >
            [TAB] {isDarkWorld ? 'DARK WORLD' : 'LIGHT WORLD'}
          </button>

          {onOpenCharacterSelect && (
            <button
              onClick={() => {
                soundManager.playSfx(SMB_SOUNDS.SELECT);
                onOpenCharacterSelect();
              }}
              className="px-4 py-1.5 bg-black border-2 border-stone-700 hover:border-amber-400 text-stone-300 hover:text-amber-300 text-base font-black uppercase transition tracking-wider"
            >
              ROSTER
            </button>
          )}
        </div>
      </header>

      {/* Center Hero Chapter Display */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="flex items-center justify-center gap-6 max-w-5xl w-full">
          {/* Left Arrow Button */}
          <button
            onClick={handlePrev}
            className="w-16 h-20 flex items-center justify-center bg-black/80 hover:bg-red-900 border-2 border-stone-700 hover:border-red-400 text-stone-300 hover:text-white text-4xl font-black transition active:scale-95"
          >
            ◄
          </button>

          {/* Center Chapter Card */}
          <div
            onClick={handleConfirm}
            className={`flex-1 max-w-xl flex flex-col items-center bg-black/90 p-8 border-4 cursor-pointer transition-all duration-200 shadow-2xl ${
              isDarkWorld
                ? 'border-purple-600 shadow-[0_0_30px_rgba(147,51,234,0.6)]'
                : 'border-red-700 shadow-[0_0_30px_rgba(220,38,38,0.7)]'
            }`}
          >
            {/* Chapter Subtitle / Number */}
            <div
              className={`text-xl font-black uppercase tracking-widest ${
                isDarkWorld ? 'text-purple-400' : 'text-amber-400'
              }`}
            >
              {currentChapter.subtitle} {isDarkWorld ? '• DARK WORLD' : ''}
            </div>

            {/* Chapter Main Title */}
            <h1 className="text-4xl md:text-5xl font-black text-white mt-1 uppercase tracking-wider text-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              {currentChapter.name}
            </h1>

            {/* Chapter Graphic Frame */}
            <div
              className="w-full h-44 my-5 bg-cover bg-center border-2 border-stone-800 shadow-inner"
              style={{
                backgroundImage: `url(${isDarkWorld ? currentChapter.darkBgImage : currentChapter.bgImage})`,
                filter: isDarkWorld ? 'hue-rotate(270deg) contrast(140%)' : 'contrast(120%)',
              }}
            />

            {/* Chapter World Stats */}
            <div className="w-full grid grid-cols-3 gap-3 text-center py-2 border-y-2 border-stone-800">
              <div className="bg-black/60 p-2 border border-stone-900">
                <div className="text-xs text-stone-500 uppercase">CLEARED</div>
                <div className="text-2xl font-black text-white">
                  {stats.completed} / {currentChapter.totalLevels}
                </div>
              </div>
              <div className="bg-black/60 p-2 border border-stone-900">
                <div className="text-xs text-amber-500 uppercase">A+ RANKS</div>
                <div className="text-2xl font-black text-amber-300">
                  {stats.aPlus}
                </div>
              </div>
              <div className="bg-black/60 p-2 border border-stone-900">
                <div className="text-xs text-stone-400 uppercase">BANDAGES</div>
                <div className="text-2xl font-black text-amber-400">
                  {stats.bandages} / {currentChapter.totalLevels}
                </div>
              </div>
            </div>

            {/* Boss Identifier */}
            <div className="mt-4 text-stone-400 text-sm font-bold uppercase tracking-widest">
              GUARDIAN: <span className="text-red-500 font-black">{currentChapter.bossName}</span>
            </div>

            {/* Enter Prompt */}
            <div className="mt-4 px-8 py-2 bg-red-700 hover:bg-red-600 text-amber-300 font-black text-xl uppercase tracking-widest border-2 border-amber-300 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse">
              ENTER CHAPTER [ENTER]
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            className="w-16 h-20 flex items-center justify-center bg-black/80 hover:bg-red-900 border-2 border-stone-700 hover:border-red-400 text-stone-300 hover:text-white text-4xl font-black transition active:scale-95"
          >
            ►
          </button>
        </div>
      </main>

      {/* Footer Navigation Bar */}
      <footer className="relative z-10 flex items-center justify-between px-8 py-4 bg-black/80 border-t-4 border-red-950 text-sm font-black uppercase tracking-widest text-stone-400">
        <div>
          [◄ / ►] CHOOSE CHAPTER    [ENTER] SELECT    [TAB] TOGGLE DARK WORLD
        </div>
        <div>
          [ESC] RETURN TO TITLE
        </div>
      </footer>
    </div>
  );
};
