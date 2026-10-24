import React, { useState, useEffect } from 'react';
import { soundManager, SMB_SOUNDS } from '../engine/sound';
import { CharacterProps } from '../engine/types';

export interface CharacterRosterEntry {
  id: string;
  name: string;
  propsFile: string;
  title: string;
  ability: string;
  color: string;
  spriteUrl: string;
  badgeUrl: string;
  runSpeed: number;
  sprintSpeed: number;
  jumpImpulse: number;
  unlocked: boolean;
  unlockCondition: string;
}

export const CHARACTER_ROSTER: CharacterRosterEntry[] = [
  {
    id: 'meatboy',
    name: 'Meat Boy',
    propsFile: 'meatboyanim.props',
    title: 'The Meat Hero',
    ability: 'Balanced speed, exceptional traction, tight responsive wall jumps.',
    color: '#ef4444',
    spriteUrl: '/assets/textures/Animations/meatboyanim.png',
    badgeUrl: '/assets/textures/HUD/meathuds.png',
    runSpeed: 300,
    sprintSpeed: 350,
    jumpImpulse: -550,
    unlocked: true,
    unlockCondition: 'Unlocked by default',
  },
  {
    id: 'bandagegirl',
    name: 'Bandage Girl',
    propsFile: 'bandagegirl.props',
    title: 'Nimble & Quick',
    ability: 'Nimble, high acceleration and slightly reduced air drag.',
    color: '#f472b6',
    spriteUrl: '/assets/textures/Animations/bandagegirl.png',
    badgeUrl: '/assets/textures/HUD/bgirlunlocked.png',
    runSpeed: 300,
    sprintSpeed: 350,
    jumpImpulse: -550,
    unlocked: true,
    unlockCondition: 'Beat the game or cheat',
  },
  {
    id: 'commandervideo',
    name: 'Commander Video',
    propsFile: 'commander_video.props',
    title: 'BIT.TRIP Runner',
    ability: 'Hover Jump: Hold Jump while airborne to hover horizontally.',
    color: '#fbbf24',
    spriteUrl: '/assets/textures/Animations/commander_video.png',
    badgeUrl: '/assets/textures/HUD/cvunlocked.png',
    runSpeed: 300,
    sprintSpeed: 350,
    jumpImpulse: -600,
    unlocked: true,
    unlockCondition: 'Find Warp Zone in Chapter 1',
  },
  {
    id: 'flywrench',
    name: 'Flywrench',
    propsFile: 'flywrench.props',
    title: 'Aerodynamic Flapper',
    ability: 'Multi-Flap Air Jump: Tap jump repeatedly in air to flap upward.',
    color: '#38bdf8',
    spriteUrl: '/assets/textures/Animations/flywrench.png',
    badgeUrl: '/assets/textures/HUD/flyunlocked.png',
    runSpeed: 400,
    sprintSpeed: 300,
    jumpImpulse: -800,
    unlocked: true,
    unlockCondition: 'Find Warp Zone in Chapter 4',
  },
  {
    id: 'kid',
    name: 'The Kid',
    propsFile: 'kid.props',
    title: 'I Wanna Be The Guy',
    ability: 'Double Jump: Jump a second time in mid-air with high precision.',
    color: '#a855f7',
    spriteUrl: '/assets/textures/Animations/kid.png',
    badgeUrl: '/assets/textures/HUD/kidunlocked.png',
    runSpeed: 270,
    sprintSpeed: 300,
    jumpImpulse: -550,
    unlocked: true,
    unlockCondition: 'Complete The Kid Warp Zone in Chapter 5',
  },
  {
    id: 'ogmo',
    name: 'Ogmo',
    propsFile: 'ogmo.props',
    title: 'Jumper Hero',
    ability: 'Double Jump + Air Float: Jump twice and float on air.',
    color: '#4ade80',
    spriteUrl: '/assets/textures/Animations/ogmo.png',
    badgeUrl: '/assets/textures/HUD/ogmounlocked.png',
    runSpeed: 290,
    sprintSpeed: 330,
    jumpImpulse: -530,
    unlocked: true,
    unlockCondition: 'Find Warp Zone in Chapter 3',
  },
  {
    id: 'headfuk',
    name: 'Headfuk',
    propsFile: 'headfuk.props',
    title: 'Glitched Head',
    ability: 'Inverted gravity impulses and glitch trajectory shifts.',
    color: '#94a3b8',
    spriteUrl: '/assets/textures/Animations/headfuk.png',
    badgeUrl: '/assets/textures/HUD/meathuds.png',
    runSpeed: 310,
    sprintSpeed: 360,
    jumpImpulse: -570,
    unlocked: true,
    unlockCondition: 'Glitch level secret',
  },
  {
    id: 'tofu',
    name: 'Tofu Boy',
    propsFile: 'tofu.props',
    title: 'Weak Soy Substitute',
    ability: 'Crippled: Extremely slow, feeble jumps, completely pathetic.',
    color: '#fef08a',
    spriteUrl: '/assets/textures/Animations/tofu.png',
    badgeUrl: '/assets/textures/HUD/meathuds.png',
    runSpeed: 160,
    sprintSpeed: 180,
    jumpImpulse: -320,
    unlocked: true,
    unlockCondition: 'Cheat code: petaphile',
  },
];

interface CharacterSelectProps {
  isOpen?: boolean;
  selectedCharacterId: string;
  onSelectCharacter: (char: CharacterRosterEntry, props: CharacterProps) => void;
  onClose: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  isOpen = true,
  selectedCharacterId,
  onSelectCharacter,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const idx = CHARACTER_ROSTER.findIndex((c) => c.id === selectedCharacterId);
    return idx >= 0 ? idx : 0;
  });

  if (!isOpen) return null;

  const currentChar = CHARACTER_ROSTER[selectedIndex];

  useEffect(() => {
    soundManager.playSfx(SMB_SOUNDS.CURTAIN);
  }, []);

  const handlePrev = () => {
    soundManager.playSfx(SMB_SOUNDS.CHAR_LEFT);
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : CHARACTER_ROSTER.length - 1));
  };

  const handleNext = () => {
    soundManager.playSfx(SMB_SOUNDS.CHAR_RIGHT);
    setSelectedIndex((prev) => (prev < CHARACTER_ROSTER.length - 1 ? prev + 1 : 0));
  };

  const handleConfirm = () => {
    soundManager.playSfx(SMB_SOUNDS.SELECT);
    const props: CharacterProps = {
      id: currentChar.id,
      name: currentChar.name,
      runSpeed: currentChar.runSpeed,
      sprintSpeed: currentChar.sprintSpeed,
      acceleration: 1800,
      airAcceleration: 1200,
      jumpImpulse: currentChar.jumpImpulse,
      jumpHoldGravity: 900,
      normalGravity: 1800,
      maxFallSpeed: 800,
      wallSlideSpeed: 120,
      wallJumpX: 380,
      wallJumpY: -500,
      wallJumpControlLockout: 0.15,
      color: currentChar.color,
      unlocked: currentChar.unlocked,
    };
    onSelectCharacter(currentChar, props);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleNext();
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        soundManager.playSfx(SMB_SOUNDS.PAGE_TURN);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, currentChar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-2xl bg-black border-4 border-red-700 shadow-[0_0_50px_rgba(239,68,68,0.7)] flex flex-col">
        {/* Curtains Graphic & Top Bar */}
        <div className="relative bg-[#1c0404] border-b-4 border-red-800 px-6 py-3 flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-widest text-amber-300 drop-shadow">
            CHARACTER ROSTER
          </h2>
          <button
            onClick={() => {
              soundManager.playSfx(SMB_SOUNDS.PAGE_TURN);
              onClose();
            }}
            className="px-3 py-1 bg-black border border-stone-700 hover:border-red-500 text-stone-300 hover:text-white font-black text-sm uppercase"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Carousel Content */}
        <div className="p-6 flex items-center justify-between gap-6">
          <button
            onClick={handlePrev}
            className="w-14 h-20 bg-black hover:bg-red-900 border-2 border-stone-700 hover:border-red-400 text-stone-300 hover:text-white text-3xl font-black transition active:scale-95 flex items-center justify-center"
          >
            ◄
          </button>

          {/* Character Spotlight Box */}
          <div className="flex-1 flex flex-col items-center text-center">
            {/* Character Sprite Display */}
            <div className="relative w-36 h-36 bg-[#120505] border-2 border-stone-800 flex items-center justify-center p-3 shadow-inner">
              <div
                className="w-20 h-20 border-2 border-white/20 shadow-lg flex items-center justify-center text-3xl font-black text-white"
                style={{ backgroundColor: currentChar.color }}
              >
                {currentChar.name.substring(0, 2).toUpperCase()}
              </div>
            </div>

            {/* Character Info */}
            <h3
              className="text-3xl font-black uppercase tracking-wider mt-3 drop-shadow"
              style={{ color: currentChar.color }}
            >
              {currentChar.name}
            </h3>
            <span className="text-sm text-stone-400 uppercase tracking-widest mt-0.5 font-bold">
              {currentChar.title}
            </span>

            {/* Special Ability Box */}
            <div className="mt-3 px-4 py-2 bg-[#140606] border border-stone-800 text-sm text-stone-300 max-w-md">
              <span className="text-amber-400 font-black mr-1">ABILITY:</span>
              {currentChar.ability}
            </div>

            {/* Select Button */}
            <button
              onClick={handleConfirm}
              className="mt-6 px-8 py-2.5 bg-red-700 hover:bg-red-600 text-amber-300 text-xl font-black uppercase tracking-widest border-2 border-amber-300 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse"
            >
              SELECT HERO [ENTER]
            </button>
          </div>

          <button
            onClick={handleNext}
            className="w-14 h-20 bg-black hover:bg-red-900 border-2 border-stone-700 hover:border-red-400 text-stone-300 hover:text-white text-3xl font-black transition active:scale-95 flex items-center justify-center"
          >
            ►
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#120404] border-t-2 border-red-950 flex items-center justify-between text-xs font-black text-stone-400 uppercase tracking-widest">
          <div>[◄ / ►] BROWSE HEROES</div>
          <div>[ENTER] CONFIRM SELECTION</div>
        </div>
      </div>
    </div>
  );
};
