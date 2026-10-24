import React, { useState, useEffect } from 'react';
import { CHAPTER_METADATA } from '../engine/chapterMetadata';
import { soundManager, SMB_SOUNDS } from '../engine/sound';

export interface LevelRecord {
  id: string;
  levelNumber: number;
  chapterNumber: number;
  name: string;
  isDarkWorld: boolean;
  parTime: number; // in seconds for A+
  bestTime?: number;
  isCompleted: boolean;
  hasBandage: boolean;
  bandageCollected: boolean;
  isUnlocked: boolean;
}

export const getChapterLevels = (chapterId: number, isDarkWorld: boolean): LevelRecord[] => {
  const levels: LevelRecord[] = [];
  const chapter = CHAPTER_METADATA[chapterId] ?? CHAPTER_METADATA[1];

  for (let i = 1; i <= 21; i++) {
    const isBoss = i === 21;
    const meta = isBoss ? chapter.boss : chapter.levels[i - 1];
    const basePar = meta?.par ?? 10;

    levels.push({
      id: `${chapterId}-${i}${isDarkWorld ? 'x' : ''}`,
      levelNumber: i,
      chapterNumber: chapterId,
      name: isBoss ? meta.name : `${chapterId}-${i}: ${meta.name}`,
      isDarkWorld,
      parTime: basePar,
      bestTime: undefined,
      isCompleted: false,
      hasBandage: !isBoss && i % 3 === 0,
      bandageCollected: false,
      isUnlocked: true,
    });
  }

  return levels;
};

interface LevelGridProps {
  chapterId: number;
  chapterName: string;
  isDarkWorld: boolean;
  onSelectLevel: (levelId: string, levelRecord: LevelRecord) => void;
  onBackToChapters: () => void;
  onToggleDarkWorld: () => void;
}

export const LevelGrid: React.FC<LevelGridProps> = ({
  chapterId,
  chapterName,
  isDarkWorld,
  onSelectLevel,
  onBackToChapters,
  onToggleDarkWorld,
}) => {
  const [levels, setLevels] = useState<LevelRecord[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    const loaded = getChapterLevels(chapterId, isDarkWorld);
    setLevels(loaded);
    setFocusedIndex(0);
  }, [chapterId, isDarkWorld]);

  const focusedLevel = levels[focusedIndex] || levels[0];

  const handleLevelClick = (lvl: LevelRecord, idx: number) => {
    soundManager.playSfx(SMB_SOUNDS.SELECT);
    onSelectLevel(lvl.id, lvl);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const COLS = 7;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        soundManager.playSfx(SMB_SOUNDS.NAVIGATE);
        setFocusedIndex((prev) => (prev < levels.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        soundManager.playSfx(SMB_SOUNDS.NAVIGATE);
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : levels.length - 1));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        soundManager.playSfx(SMB_SOUNDS.NAVIGATE);
        setFocusedIndex((prev) => (prev + COLS < levels.length ? prev + COLS : prev));
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        soundManager.playSfx(SMB_SOUNDS.NAVIGATE);
        setFocusedIndex((prev) => (prev - COLS >= 0 ? prev - COLS : prev));
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (levels[focusedIndex]) {
          handleLevelClick(levels[focusedIndex], focusedIndex);
        }
      } else if (e.key === 'Tab' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        onToggleDarkWorld();
      } else if (e.key === 'Escape') {
        soundManager.playSfx(SMB_SOUNDS.PAGE_TURN);
        onBackToChapters();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [levels, focusedIndex]);

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none transition-colors duration-500 ${
        isDarkWorld ? 'bg-[#080310]' : 'bg-[#100606]'
      }`}
    >
      {/* Background Palette graphic */}
      <div
        className="absolute inset-0 bg-cover bg-center filter brightness-35 contrast-125 pointer-events-none"
        style={{
          backgroundImage: `url(/assets/textures/Menus/${
            chapterId === 1
              ? 'flevelmenu.png'
              : chapterId === 2
              ? 'hlevelmenu.png'
              : chapterId === 4
              ? 'helllevelmenu.png'
              : 'levelmenu.png'
          })`,
          backgroundColor: isDarkWorld ? '#0e021a' : '#140303',
        }}
      />
      <div
        className={`absolute inset-0 pointer-events-none ${
          isDarkWorld
            ? 'bg-gradient-to-t from-purple-950/90 via-black/60 to-purple-950/80'
            : 'bg-gradient-to-t from-black via-black/60 to-[#2b0000]/80'
        }`}
      />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b-4 border-red-950 bg-black/80">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              soundManager.playSfx(SMB_SOUNDS.PAGE_TURN);
              onBackToChapters();
            }}
            className="px-4 py-1.5 bg-black border-2 border-stone-700 hover:border-red-500 text-stone-300 hover:text-white text-base font-black uppercase transition tracking-wider"
          >
            [ESC] CHAPTERS
          </button>

          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            CH {chapterId}: {chapterName}
          </h2>
        </div>

        <button
          onClick={onToggleDarkWorld}
          className={`px-4 py-1.5 border-2 text-base font-black uppercase tracking-wider transition ${
            isDarkWorld
              ? 'bg-purple-950 text-purple-200 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.7)]'
              : 'bg-black text-amber-300 border-amber-600 hover:border-amber-400'
          }`}
        >
          [TAB] {isDarkWorld ? 'DARK WORLD' : 'LIGHT WORLD'}
        </button>
      </header>

      {/* Main Levels Grid (7 columns x 3 rows = 21 levels) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-7 gap-3 w-full bg-black/85 p-6 border-4 border-stone-900 shadow-2xl">
          {levels.map((lvl, idx) => {
            const isSelected = focusedIndex === idx;
            const isBoss = lvl.levelNumber === 21;
            const hasAPlus = lvl.bestTime !== undefined && lvl.bestTime <= lvl.parTime;

            return (
              <button
                key={lvl.id}
                onClick={() => handleLevelClick(lvl, idx)}
                onMouseEnter={() => {
                  if (focusedIndex !== idx) {
                    soundManager.playSfx(SMB_SOUNDS.NAVIGATE);
                    setFocusedIndex(idx);
                  }
                }}
                className={`relative flex flex-col items-center justify-center h-20 border-2 font-black transition-all duration-100 ${
                  isSelected
                    ? isDarkWorld
                      ? 'bg-purple-700 text-white scale-110 border-white shadow-[0_0_20px_rgba(168,85,247,0.9)] z-20 ring-2 ring-purple-300'
                      : 'bg-red-700 text-amber-300 scale-110 border-amber-300 shadow-[0_0_20px_rgba(239,68,68,0.9)] z-20 ring-2 ring-red-400'
                    : isBoss
                    ? 'bg-stone-900 border-red-900 text-red-500 hover:border-red-600'
                    : lvl.isCompleted
                    ? 'bg-stone-900 text-stone-200 border-stone-700 hover:border-red-500'
                    : 'bg-black text-stone-400 border-stone-800 hover:border-stone-600 hover:text-white'
                }`}
              >
                {/* Level Number */}
                <span className="text-xl md:text-2xl font-black">
                  {isBoss ? 'BOSS' : `${lvl.levelNumber}${isDarkWorld ? 'X' : ''}`}
                </span>

                {/* Sub status icons */}
                <div className="flex items-center gap-1 mt-1 text-xs">
                  {hasAPlus && <span className="text-amber-400 font-extrabold">A+</span>}
                  {lvl.hasBandage && (
                    <span className={lvl.bandageCollected ? 'opacity-100' : 'opacity-40'}>
                      🩹
                    </span>
                  )}
                  {lvl.isCompleted && !hasAPlus && <span className="text-emerald-400">✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Level Info Panel (Authentic SMB Level Details Bar) */}
        {focusedLevel && (
          <div className="w-full mt-4 bg-black/90 p-4 border-2 border-stone-800 flex items-center justify-between text-stone-200 font-black uppercase tracking-wider">
            <div>
              <div className="text-2xl md:text-3xl text-amber-300 drop-shadow">
                {focusedLevel.name}
              </div>
              <div className="text-sm text-stone-400 mt-0.5">
                {isDarkWorld ? 'DARK WORLD HAZARDS' : 'STANDARD COURSE'}
              </div>
            </div>

            <div className="flex items-center gap-6 text-right">
              <div>
                <div className="text-xs text-stone-400 uppercase">A+ PAR TIME</div>
                <div className="text-xl text-amber-400">{focusedLevel.parTime.toFixed(2)}s</div>
              </div>

              <div>
                <div className="text-xs text-stone-400 uppercase">BEST TIME</div>
                <div className="text-xl text-white">
                  {focusedLevel.bestTime ? `${focusedLevel.bestTime.toFixed(2)}s` : '--:--'}
                </div>
              </div>

              <div>
                <div className="text-xs text-stone-400 uppercase">BANDAGE</div>
                <div className="text-xl text-amber-400">
                  {focusedLevel.hasBandage
                    ? focusedLevel.bandageCollected
                      ? 'SAVED'
                      : 'AVAILABLE'
                    : 'NONE'}
                </div>
              </div>

              <button
                onClick={() => handleLevelClick(focusedLevel, focusedIndex)}
                className="px-6 py-2 bg-red-700 hover:bg-red-600 text-amber-300 text-xl font-black border-2 border-amber-300 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse"
              >
                PLAY [ENTER]
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation Bar */}
      <footer className="relative z-10 flex items-center justify-between px-8 py-4 bg-black/80 border-t-4 border-red-950 text-sm font-black uppercase tracking-widest text-stone-400">
        <div>
          [ARROWS] SELECT LEVEL    [ENTER] START RUN    [TAB] TOGGLE DARK WORLD
        </div>
        <div>
          [ESC] RETURN TO CHAPTERS
        </div>
      </footer>
    </div>
  );
};
