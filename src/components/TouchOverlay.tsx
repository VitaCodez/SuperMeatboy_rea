import React, { useState, useEffect } from 'react';
import { inputManager } from '../engine/input';
import { RotateCcw, Pause, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Zap } from 'lucide-react';

interface TouchOverlayProps {
  enabled?: boolean;
}

export const TouchOverlay: React.FC<TouchOverlayProps> = ({ enabled = true }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        setIsTouchDevice(true);
      }
    };
    checkTouch();
    window.addEventListener('touchstart', () => setIsTouchDevice(true), { once: true });
  }, []);

  if (!enabled || !isTouchDevice) {
    return null;
  }

  const handleTouch = (key: 'left' | 'right' | 'up' | 'down' | 'jump' | 'sprint' | 'restart' | 'pause', active: boolean) => {
    inputManager.setTouchInput(key, active);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none flex flex-col justify-between p-4">
      {/* Top Touch Shortcuts */}
      <div className="flex justify-end gap-3 pointer-events-auto">
        <button
          onTouchStart={(e) => { e.preventDefault(); handleTouch('restart', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouch('restart', false); }}
          onMouseDown={() => handleTouch('restart', true)}
          onMouseUp={() => handleTouch('restart', false)}
          className="w-12 h-12 rounded-full bg-black/60 active:bg-red-800 border-2 border-stone-700 active:border-red-400 text-white flex items-center justify-center shadow-lg backdrop-blur-sm transition"
          title="Restart"
        >
          <RotateCcw className="w-5 h-5 text-red-400" />
        </button>

        <button
          onTouchStart={(e) => { e.preventDefault(); handleTouch('pause', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouch('pause', false); }}
          onMouseDown={() => handleTouch('pause', true)}
          onMouseUp={() => handleTouch('pause', false)}
          className="w-12 h-12 rounded-full bg-black/60 active:bg-amber-800 border-2 border-stone-700 active:border-amber-400 text-white flex items-center justify-center shadow-lg backdrop-blur-sm transition"
          title="Pause"
        >
          <Pause className="w-5 h-5 text-amber-400" />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="flex justify-between items-end pointer-events-auto pb-4">
        {/* D-Pad on Left */}
        <div className="grid grid-cols-3 gap-2 w-44 h-44">
          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouch('up', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouch('up', false); }}
            onMouseDown={() => handleTouch('up', true)}
            onMouseUp={() => handleTouch('up', false)}
            className="rounded-lg bg-black/60 active:bg-red-900 border-2 border-stone-700 active:border-red-400 flex items-center justify-center text-white backdrop-blur-sm"
          >
            <ChevronUp className="w-8 h-8" />
          </button>
          <div />

          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouch('left', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouch('left', false); }}
            onMouseDown={() => handleTouch('left', true)}
            onMouseUp={() => handleTouch('left', false)}
            className="rounded-lg bg-black/60 active:bg-red-900 border-2 border-stone-700 active:border-red-400 flex items-center justify-center text-white backdrop-blur-sm"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <div className="rounded-lg bg-black/30 border border-stone-800" />
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouch('right', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouch('right', false); }}
            onMouseDown={() => handleTouch('right', true)}
            onMouseUp={() => handleTouch('right', false)}
            className="rounded-lg bg-black/60 active:bg-red-900 border-2 border-stone-700 active:border-red-400 flex items-center justify-center text-white backdrop-blur-sm"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouch('down', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouch('down', false); }}
            onMouseDown={() => handleTouch('down', true)}
            onMouseUp={() => handleTouch('down', false)}
            className="rounded-lg bg-black/60 active:bg-red-900 border-2 border-stone-700 active:border-red-400 flex items-center justify-center text-white backdrop-blur-sm"
          >
            <ChevronDown className="w-8 h-8" />
          </button>
          <div />
        </div>

        {/* Action Buttons on Right (Sprint & Jump) */}
        <div className="flex items-center gap-4">
          {/* Sprint Button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouch('sprint', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouch('sprint', false); }}
            onMouseDown={() => handleTouch('sprint', true)}
            onMouseUp={() => handleTouch('sprint', false)}
            className="w-20 h-20 rounded-full bg-amber-950/80 active:bg-amber-700 border-4 border-amber-600 active:border-amber-300 text-amber-200 flex flex-col items-center justify-center shadow-2xl backdrop-blur-sm transition-transform active:scale-95"
          >
            <Zap className="w-6 h-6" />
            <span className="text-[10px] font-mono font-black mt-0.5">RUN</span>
          </button>

          {/* Jump Button (Bigger) */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouch('jump', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouch('jump', false); }}
            onMouseDown={() => handleTouch('jump', true)}
            onMouseUp={() => handleTouch('jump', false)}
            className="w-24 h-24 rounded-full bg-red-950/90 active:bg-red-700 border-4 border-red-600 active:border-red-300 text-white flex flex-col items-center justify-center shadow-2xl backdrop-blur-sm transition-transform active:scale-95"
          >
            <span className="text-2xl font-black font-mono">JUMP</span>
            <span className="text-[9px] font-mono text-red-200">A / SPACE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
