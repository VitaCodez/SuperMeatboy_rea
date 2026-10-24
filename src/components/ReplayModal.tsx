import React, { useState, useEffect, useRef } from 'react';
import { soundManager, SMB_SOUNDS } from '../engine/sound';
import { formatTimer } from './HUD';
import { ReplayAttempt } from '../engine/types';

interface ReplayModalProps {
  levelName: string;
  clearTime: number; // in seconds
  parTime: number;   // in seconds
  deathCount: number;
  bandageCollected: boolean;
  attempts?: ReplayAttempt[];
  onNextLevel: () => void;
  onRetryLevel: () => void;
  onLevelSelect: () => void;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({
  levelName,
  clearTime,
  parTime,
  deathCount,
  bandageCollected,
  attempts = [],
  onNextLevel,
  onRetryLevel,
  onLevelSelect,
}) => {
  const isAPlus = parTime > 0 && clearTime <= parTime;
  const [isReplaying, setIsReplaying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [playbackTime, setPlaybackTime] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    soundManager.playSfx(SMB_SOUNDS.LEVEL_WIN);
  }, []);

  const maxDuration = Math.max(
    clearTime,
    ...attempts.map((a) => a.duration || (a.frames[a.frames.length - 1]?.t ?? 0))
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isReplaying) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          soundManager.playSfx(SMB_SOUNDS.SELECT);
          onNextLevel();
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          soundManager.playSfx(SMB_SOUNDS.SELECT);
          setIsReplaying(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          soundManager.playSfx(SMB_SOUNDS.PAGE_TURN);
          onLevelSelect();
        }
      } else {
        if (e.key === 'Escape' || e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          setIsReplaying(false);
        } else if (e.key === ' ') {
          e.preventDefault();
          setIsPlaying((p) => !p);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReplaying, onNextLevel, onLevelSelect]);

  // Ghost Replay Animation Loop
  useEffect(() => {
    if (!isReplaying) return;

    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const dt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlaying) {
        setPlaybackTime((prev) => {
          const next = prev + dt * playbackSpeed;
          if (next >= maxDuration + 1.0) {
            return 0;
          }
          return next;
        });
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f0505';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Grid backdrop
          ctx.strokeStyle = '#220808';
          ctx.lineWidth = 1;
          for (let x = 0; x < canvas.width; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = 0; y < canvas.height; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }

          // Ground line
          ctx.fillStyle = '#440f0f';
          ctx.fillRect(0, canvas.height - 32, canvas.width, 32);

          // Bandage Girl Goal
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(canvas.width - 60, canvas.height - 60, 24, 28);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(canvas.width - 54, canvas.height - 54, 4, 4);

          // Draw ghosts
          attempts.forEach((attempt) => {
            const isWinner = attempt.outcome === 'won';
            const frames = attempt.frames;
            if (!frames || frames.length === 0) return;

            let frame = frames[0];
            for (let i = 0; i < frames.length; i++) {
              if (frames[i].t <= playbackTime) {
                frame = frames[i];
              } else {
                break;
              }
            }

            const isDeadAtCurrentTime = attempt.outcome === 'died' && playbackTime > attempt.duration;

            if (isDeadAtCurrentTime) {
              const deathFrame = frames[frames.length - 1];
              ctx.save();
              ctx.fillStyle = 'rgba(220, 38, 38, 0.7)';
              ctx.beginPath();
              ctx.arc(deathFrame.x, deathFrame.y, 8, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            } else {
              ctx.save();
              ctx.globalAlpha = isWinner ? 1.0 : 0.45;
              ctx.fillStyle = isWinner ? '#ff2222' : '#b91c1c';
              const w = 20 * (frame.squashX || 1);
              const h = 20 * (frame.squashY || 1);
              ctx.fillRect(frame.x - w / 2, frame.y - h / 2, w, h);

              ctx.fillStyle = '#ffffff';
              const eyeOffset = (frame.facing || 1) * 3;
              ctx.fillRect(frame.x + eyeOffset - 3, frame.y - 4, 3, 5);
              ctx.fillRect(frame.x + eyeOffset + 2, frame.y - 4, 3, 5);
              ctx.fillStyle = '#000000';
              ctx.fillRect(frame.x + eyeOffset - 2, frame.y - 2, 2, 3);
              ctx.fillRect(frame.x + eyeOffset + 3, frame.y - 2, 2, 3);
              ctx.restore();
            }
          });
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isReplaying, isPlaying, playbackSpeed, playbackTime, maxDuration, attempts]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-2xl bg-black border-4 border-red-700 shadow-[0_0_50px_rgba(239,68,68,0.7)] flex flex-col">
        {/* Banner Header */}
        <div className="bg-[#1c0404] border-b-4 border-red-800 p-4 text-center">
          <div className="text-xl uppercase font-black tracking-widest text-amber-300">
            LEVEL CLEARED!
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-wider text-white uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] mt-1">
            {levelName}
          </h1>
        </div>

        {/* Content Body */}
        <div className="p-8 flex flex-col items-center">
          {!isReplaying ? (
            <div className="w-full flex flex-col items-center space-y-6">
              {/* Giant Red A+ Stamp / Cleared Rank */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-28 h-28 flex items-center justify-center border-4 shadow-2xl ${
                    isAPlus
                      ? 'bg-red-950/80 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.9)] rotate-[-6deg] animate-pulse'
                      : 'bg-stone-950 border-stone-700 text-stone-400'
                  }`}
                >
                  <span className="text-6xl font-black tracking-tighter">
                    {isAPlus ? 'A+' : 'A'}
                  </span>
                </div>
                <span className="text-sm font-black uppercase mt-3 tracking-widest text-amber-300">
                  {isAPlus ? '★ A+ RANK ACHIEVED! DARK WORLD UNLOCKED! ★' : 'LEVEL CLEAR'}
                </span>
              </div>

              {/* Stats Card */}
              <div className="w-full max-w-md bg-[#120505] border-2 border-stone-800 p-5 text-base uppercase tracking-wider space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 font-bold">CLEAR TIME:</span>
                  <span className="text-2xl font-black text-amber-300">
                    {formatTimer(clearTime)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-400 font-bold">A+ PAR TIME:</span>
                  <span className="text-xl font-black text-stone-300">
                    {parTime.toFixed(2)}s
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-stone-800 pt-2">
                  <span className="text-stone-400 font-bold">DEATHS THIS LEVEL:</span>
                  <span className="text-xl font-black text-red-500">{deathCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-400 font-bold">BANDAGE:</span>
                  <span className={`font-black text-lg ${bandageCollected ? 'text-amber-400' : 'text-stone-600'}`}>
                    {bandageCollected ? 'SAVED 🩹' : 'NONE / MISSED'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full max-w-md space-y-2 mt-2">
                <button
                  onClick={() => {
                    soundManager.playSfx(SMB_SOUNDS.SELECT);
                    onNextLevel();
                  }}
                  className="w-full py-3 bg-red-700 hover:bg-red-600 text-amber-300 text-2xl font-black uppercase tracking-widest border-2 border-amber-300 shadow-[0_0_20px_rgba(239,68,68,0.8)] transition transform active:scale-95"
                >
                  NEXT LEVEL [ENTER]
                </button>

                <button
                  onClick={() => {
                    soundManager.playSfx(SMB_SOUNDS.SELECT);
                    setIsReplaying(true);
                  }}
                  className="w-full py-2.5 bg-black hover:bg-stone-900 text-stone-200 text-xl font-black uppercase tracking-wider border-2 border-stone-700 hover:border-amber-400 transition"
                >
                  WATCH REPLAY [R]
                </button>

                <button
                  onClick={() => {
                    soundManager.playSfx(SMB_SOUNDS.PAGE_TURN);
                    onLevelSelect();
                  }}
                  className="w-full py-2 bg-black hover:bg-stone-900 text-stone-400 hover:text-white text-lg font-black uppercase tracking-wider border-2 border-stone-800 hover:border-red-600 transition"
                >
                  LEVEL SELECT [ESC]
                </button>
              </div>
            </div>
          ) : (
            /* Multi-Ghost Replay Playback Canvas */
            <div className="w-full flex flex-col items-center">
              <div className="w-full relative border-4 border-stone-800 shadow-2xl bg-black">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  className="w-full h-auto block"
                />

                <div className="absolute top-3 left-3 bg-black/85 border border-red-900 px-3 py-1 text-sm font-black uppercase text-amber-300">
                  REPLAY • {attempts.length} ATTEMPTS
                </div>

                <div className="absolute bottom-3 right-3 bg-black/85 border border-stone-800 px-3 py-1 text-base font-black text-amber-300">
                  {formatTimer(playbackTime)} / {formatTimer(maxDuration)}
                </div>
              </div>

              {/* Controls */}
              <div className="w-full flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPlaying((p) => !p)}
                    className="px-4 py-1.5 bg-red-700 text-white font-black uppercase border border-amber-300 text-sm"
                  >
                    {isPlaying ? 'PAUSE' : 'PLAY'}
                  </button>

                  <button
                    onClick={() => setPlaybackTime(0)}
                    className="px-4 py-1.5 bg-black text-stone-300 font-black uppercase border border-stone-700 text-sm"
                  >
                    RESTART
                  </button>

                  <button
                    onClick={() => setPlaybackSpeed((s) => (s === 1.0 ? 2.0 : s === 2.0 ? 0.5 : 1.0))}
                    className="px-4 py-1.5 bg-black text-amber-400 font-black uppercase border border-stone-700 text-sm"
                  >
                    {playbackSpeed}X SPEED
                  </button>
                </div>

                <button
                  onClick={() => setIsReplaying(false)}
                  className="px-4 py-1.5 bg-black text-stone-300 hover:text-white font-black uppercase border border-stone-700 hover:border-red-500 text-sm"
                >
                  BACK [ESC]
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
