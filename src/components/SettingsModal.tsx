import React from 'react';
import { soundManager, SMB_SOUNDS } from '../engine/sound';

interface SettingsModalProps {
  isOpen?: boolean;
  crtEnabled: boolean;
  onToggleCrt: () => void;
  bezelEnabled: boolean;
  onToggleBezel: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen = true,
  crtEnabled,
  onToggleCrt,
  bezelEnabled,
  onToggleBezel,
  onClose,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getIsMuted());
  const [sfxVol, setSfxVol] = React.useState(soundManager.getSfxVolume());
  const [musicVol, setMusicVol] = React.useState(soundManager.getMusicVolume());

  if (!isOpen) return null;

  const handleMuteToggle = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSfxVol(val);
    soundManager.setSfxVolume(val);
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMusicVol(val);
    soundManager.setMusicVolume(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-xl bg-black border-4 border-red-700 shadow-[0_0_40px_rgba(239,68,68,0.7)] flex flex-col">
        {/* Header */}
        <div className="bg-[#1c0404] border-b-4 border-red-800 px-6 py-3 flex items-center justify-between">
          <h2 className="text-2xl font-black text-amber-300 uppercase tracking-widest">
            SETTINGS & OPTIONS
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

        {/* Content */}
        <div className="p-6 space-y-6 text-stone-300">
          {/* Visual Display */}
          <div className="space-y-3">
            <h3 className="text-lg font-black text-red-500 uppercase tracking-wider">
              DISPLAY EMULATION
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onToggleCrt}
                className={`py-2 px-4 border-2 font-black text-base flex items-center justify-between transition ${
                  crtEnabled
                    ? 'bg-red-950 border-red-500 text-amber-300 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                    : 'bg-black border-stone-800 text-stone-500'
                }`}
              >
                <span>CRT SCANLINES</span>
                <span>{crtEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={onToggleBezel}
                className={`py-2 px-4 border-2 font-black text-base flex items-center justify-between transition ${
                  bezelEnabled
                    ? 'bg-red-950 border-red-500 text-amber-300 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                    : 'bg-black border-stone-800 text-stone-500'
                }`}
              >
                <span>CURVED BEZEL</span>
                <span>{bezelEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Audio Section */}
          <div className="space-y-4 border-t-2 border-stone-900 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-red-500 uppercase tracking-wider">
                AUDIO VOLUME
              </h3>
              <button
                onClick={handleMuteToggle}
                className="px-3 py-1 bg-black border border-stone-700 hover:border-amber-400 text-stone-300 text-xs font-black uppercase"
              >
                {isMuted ? 'UNMUTE ALL' : 'MUTE ALL'}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm uppercase font-bold text-stone-400 mb-1">
                  <span>SFX VOLUME:</span>
                  <span className="text-amber-300">{Math.round(sfxVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVol}
                  onChange={handleSfxChange}
                  className="w-full accent-red-600 bg-stone-900"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm uppercase font-bold text-stone-400 mb-1">
                  <span>MUSIC VOLUME:</span>
                  <span className="text-amber-300">{Math.round(musicVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVol}
                  onChange={handleMusicChange}
                  className="w-full accent-red-600 bg-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Controls Reference */}
          <div className="space-y-2 border-t-2 border-stone-900 pt-4 text-xs font-bold text-stone-400">
            <h3 className="text-sm font-black text-red-500 uppercase tracking-wider mb-2">
              KEYBOARD CONTROLS
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>LEFT / RIGHT: <span className="text-white">A / D or ARROWS</span></div>
              <div>JUMP / WALL JUMP: <span className="text-amber-300">SPACE / W / UP</span></div>
              <div>SPRINT / RUN: <span className="text-amber-300">SHIFT / X</span></div>
              <div>QUICK RESTART: <span className="text-red-400">R</span></div>
              <div>PAUSE MENU: <span className="text-white">ESC / P</span></div>
              <div>TOGGLE DARK WORLD: <span className="text-purple-400">TAB</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#120404] border-t-2 border-red-950 flex justify-end">
          <button
            onClick={() => {
              soundManager.playSfx(SMB_SOUNDS.PAGE_TURN);
              onClose();
            }}
            className="px-6 py-2 bg-red-700 hover:bg-red-600 text-amber-300 text-lg font-black uppercase tracking-wider border-2 border-amber-300"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
