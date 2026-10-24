import React, { useState, useEffect } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { ChapterSelect, CHAPTERS } from './components/ChapterSelect';
import { LevelGrid, LevelRecord, getChapterLevels } from './components/LevelGrid';
import { CharacterSelect, CHARACTER_ROSTER, CharacterRosterEntry } from './components/CharacterSelect';
import { HUD } from './components/HUD';
import { GameCanvas } from './components/GameCanvas';
import { ReplayModal } from './components/ReplayModal';
import { TouchOverlay } from './components/TouchOverlay';
import { SettingsModal } from './components/SettingsModal';
import { PauseMenu } from './components/PauseMenu';
import { inputManager } from './engine/input';
import { soundManager, SMB_SOUNDS } from './engine/sound';
import { CharacterProps, ReplayAttempt } from './engine/types';

export type ScreenState = 'TITLE' | 'CHAPTER_SELECT' | 'LEVEL_SELECT' | 'GAMEPLAY' | 'REPLAY';

export const App: React.FC = () => {
  // Screen state
  const [screen, setScreen] = useState<ScreenState>('TITLE');

  // Modals & Overlays
  const [isCharacterSelectOpen, setIsCharacterSelectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [bezelEnabled, setBezelEnabled] = useState(true);

  // Active progression & level
  const [chapterId, setChapterId] = useState(1);
  const [isDarkWorld, setIsDarkWorld] = useState(false);
  const [levelId, setLevelId] = useState('1-1');
  const [levelName, setLevelName] = useState('1-1: Hello World');
  const [parTime, setParTime] = useState(7.2);
  const [hasBandage, setHasBandage] = useState(true);
  const [bandageCollected, setBandageCollected] = useState(false);

  // Level runtime metrics
  const [elapsedTime, setElapsedTime] = useState(0);
  const [deathCount, setDeathCount] = useState(0);
  const [clearTime, setClearTime] = useState(0);
  const [recordedAttempts, setRecordedAttempts] = useState<ReplayAttempt[]>([]);

  // Selected Character
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterRosterEntry>(CHARACTER_ROSTER[0]);
  const [characterProps, setCharacterProps] = useState<CharacterProps>({
    id: 'meatboy',
    name: 'Meat Boy',
    runSpeed: 300,
    sprintSpeed: 350,
    acceleration: 1800,
    airAcceleration: 1200,
    jumpImpulse: -550,
    jumpHoldGravity: 900,
    normalGravity: 1800,
    maxFallSpeed: 800,
    wallSlideSpeed: 120,
    wallJumpX: 380,
    wallJumpY: -500,
    wallJumpControlLockout: 0.15,
    color: '#ef4444',
    unlocked: true,
  });

  // Global pause and restart listeners from InputManager
  useEffect(() => {
    const unsubPause = inputManager.onPause(() => {
      if (screen === 'GAMEPLAY') {
        setIsPaused((prev) => !prev);
        soundManager.playSfx(SMB_SOUNDS.RETRO_BOOP);
      }
    });

    return () => {
      unsubPause();
    };
  }, [screen]);

  // Handle Starting a specific level
  const startLevel = (lvlId: string, lvlRec: LevelRecord) => {
    setLevelId(lvlId);
    setLevelName(lvlRec.name);
    setParTime(lvlRec.parTime);
    setHasBandage(lvlRec.hasBandage);
    setBandageCollected(false);
    setDeathCount(0);
    setElapsedTime(0);
    setRecordedAttempts([]);
    setIsPaused(false);
    setScreen('GAMEPLAY');

    // Play chapter track
    if (chapterId === 1) soundManager.playMusic(SMB_SOUNDS.FOREST_LOOP);
    else if (chapterId === 2) soundManager.playMusic(SMB_SOUNDS.HOSPITAL_LOOP);
    else if (chapterId === 3) soundManager.playMusic(SMB_SOUNDS.FACTORY_LOOP);
    else if (chapterId === 4) soundManager.playMusic(SMB_SOUNDS.HELL_LOOP);
    else soundManager.playMusic(SMB_SOUNDS.WORLD_LOOP);
  };

  // Handle Quick Start Game from Title
  const handleQuickStart = () => {
    const chLevels = getChapterLevels(1, false);
    startLevel('1-1', chLevels[0]);
  };

  // Handle Chapter selection
  const handleSelectChapter = (selectedChId: number, darkWorld: boolean) => {
    setChapterId(selectedChId);
    setIsDarkWorld(darkWorld);
    setScreen('LEVEL_SELECT');
    soundManager.playMusic(SMB_SOUNDS.WORLD_LOOP);
  };

  // Handle Level Win
  const handleLevelWin = (finalClearTime: number, attempts: ReplayAttempt[]) => {
    setClearTime(finalClearTime);
    setRecordedAttempts(attempts);
    setScreen('REPLAY');
  };

  // Advance to next level
  const handleNextLevel = () => {
    const currentNum = parseInt(levelId.split('-')[1]?.replace('x', '') || '1');
    const nextNum = currentNum + 1;
    const nextId = `${chapterId}-${nextNum}${isDarkWorld ? 'x' : ''}`;
    const chLevels = getChapterLevels(chapterId, isDarkWorld);
    const nextRec = chLevels.find((l) => l.levelNumber === nextNum) || chLevels[0];
    startLevel(nextId, nextRec);
  };

  // Retry same level
  const handleRetryLevel = () => {
    const chLevels = getChapterLevels(chapterId, isDarkWorld);
    const lvlRec = chLevels.find((l) => l.id === levelId) || chLevels[0];
    startLevel(levelId, lvlRec);
  };

  const currentChapterInfo = CHAPTERS.find((c) => c.id === chapterId) || CHAPTERS[0];

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center ${
        crtEnabled ? 'crt-active' : ''
      }`}
    >
      {/* CRT Scanline Overlay */}
      {crtEnabled && <div className="crt-overlay" />}

      {/* 16:9 Screen Fit Box with Curved Bezel */}
      <div
        className={`relative flex flex-col justify-between overflow-hidden bg-black ${
          bezelEnabled ? 'crt-bezel' : ''
        }`}
        style={{
          width: 'min(100vw, calc(100vh * 16 / 9))',
          height: 'min(100vh, calc(100vw * 9 / 16))',
        }}
      >
        {/* 1. Title Screen */}
        {screen === 'TITLE' && (
          <TitleScreen
            onStartGame={handleQuickStart}
            onOpenChapters={() => {
              setScreen('CHAPTER_SELECT');
              soundManager.playMusic(SMB_SOUNDS.WORLD_LOOP);
            }}
            onOpenCharacters={() => setIsCharacterSelectOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* 2. Chapter Select Screen */}
        {screen === 'CHAPTER_SELECT' && (
          <ChapterSelect
            initialChapterId={chapterId}
            initialDarkWorld={isDarkWorld}
            onSelectChapter={handleSelectChapter}
            onBackToTitle={() => {
              setScreen('TITLE');
              soundManager.playMusic(SMB_SOUNDS.TITLE_LOOP);
            }}
            onOpenCharacterSelect={() => setIsCharacterSelectOpen(true)}
          />
        )}

        {/* 3. Level Grid Screen */}
        {screen === 'LEVEL_SELECT' && (
          <LevelGrid
            chapterId={chapterId}
            chapterName={currentChapterInfo.name}
            isDarkWorld={isDarkWorld}
            onSelectLevel={startLevel}
            onBackToChapters={() => setScreen('CHAPTER_SELECT')}
            onToggleDarkWorld={() => setIsDarkWorld((prev) => !prev)}
          />
        )}

        {/* 4. Active Gameplay Screen - Pure Clean 16:9 Immersion */}
        {screen === 'GAMEPLAY' && (
          <div className="relative w-full h-full bg-black">
            {/* Game Canvas Container - Fullscreen */}
            <div className="absolute inset-0 w-full h-full">
              <GameCanvas
                levelId={levelId}
                levelName={levelName}
                chapterNumber={chapterId}
                isDarkWorld={isDarkWorld}
                characterProps={characterProps}
                isPaused={isPaused}
                onTimeUpdate={(t) => setElapsedTime(t)}
                onDeath={(d) => setDeathCount(d)}
                onWin={handleLevelWin}
                onCollectBandage={() => setBandageCollected(true)}
              />
            </div>

            {/* In-Game Floating HUD (Level splash & bandage toast) */}
            <HUD
              levelName={levelName}
              chapterNumber={chapterId}
              isDarkWorld={isDarkWorld}
              elapsedTime={elapsedTime}
              parTime={parTime}
              deathCount={deathCount}
              hasBandage={hasBandage}
              bandageCollected={bandageCollected}
              isPaused={isPaused}
            />

            {/* In-Game Pause Menu */}
            {isPaused && (
              <PauseMenu
                onResume={() => setIsPaused(false)}
                onRestart={() => {
                  setIsPaused(false);
                  handleRetryLevel();
                }}
                onOpenCharacters={() => setIsCharacterSelectOpen(true)}
                onLevelSelect={() => {
                  setIsPaused(false);
                  setScreen('LEVEL_SELECT');
                }}
                onChapterSelect={() => {
                  setIsPaused(false);
                  setScreen('CHAPTER_SELECT');
                }}
                onQuitToTitle={() => {
                  setIsPaused(false);
                  setScreen('TITLE');
                  soundManager.playMusic(SMB_SOUNDS.TITLE_LOOP);
                }}
              />
            )}
          </div>
        )}

        {/* 5. Level Complete Replay Modal */}
        {screen === 'REPLAY' && (
          <ReplayModal
            levelName={levelName}
            clearTime={clearTime}
            parTime={parTime}
            deathCount={deathCount}
            bandageCollected={bandageCollected}
            attempts={recordedAttempts}
            onNextLevel={handleNextLevel}
            onRetryLevel={() => {
              handleRetryLevel();
              setScreen('GAMEPLAY');
            }}
            onLevelSelect={() => {
              setScreen('LEVEL_SELECT');
              soundManager.playMusic(SMB_SOUNDS.WORLD_LOOP);
            }}
          />
        )}

        {/* Character Roster Modal */}
        <CharacterSelect
          isOpen={isCharacterSelectOpen}
          selectedCharacterId={selectedCharacter.id}
          onSelectCharacter={(char, charProps) => {
            setSelectedCharacter(char);
            setCharacterProps(charProps);
            setIsCharacterSelectOpen(false);
          }}
          onClose={() => setIsCharacterSelectOpen(false)}
        />

        {/* Settings & Options Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          crtEnabled={crtEnabled}
          onToggleCrt={() => setCrtEnabled((prev) => !prev)}
          bezelEnabled={bezelEnabled}
          onToggleBezel={() => setBezelEnabled((prev) => !prev)}
        />

        {/* Touch overlay for mobile devices */}
        <TouchOverlay />
      </div>
    </div>
  );
};

export default App;
