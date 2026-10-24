import React, { useEffect, useRef } from 'react';
import { GameRenderer } from '../engine/renderer';
import { PlayerController } from '../engine/playerController';
import { loadLevel, getLevel } from '../engine/levelParser';
import { ReplayEngine } from '../engine/replayEngine';
import { inputManager } from '../engine/input';
import { soundManager, SMB_SOUNDS } from '../engine/sound';
import { CharacterProps, LevelData, ReplayAttempt } from '../engine/types';
import { BossLilSlugger } from '../engine/bossLilSlugger';

interface GameCanvasProps {
  levelId: string;
  levelName: string;
  chapterNumber: number;
  isDarkWorld: boolean;
  characterProps: CharacterProps;
  isPaused: boolean;
  onTimeUpdate: (time: number) => void;
  onDeath: (totalDeaths: number) => void;
  onWin: (clearTime: number, attempts: ReplayAttempt[]) => void;
  onCollectBandage: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  levelId,
  levelName,
  chapterNumber,
  isDarkWorld,
  characterProps,
  isPaused,
  onTimeUpdate,
  onDeath,
  onWin,
  onCollectBandage,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Engine systems
  const rendererRef = useRef<GameRenderer | null>(null);
  const playerControllerRef = useRef<PlayerController | null>(null);
  const levelRef = useRef<LevelData | null>(null);
  const replayEngineRef = useRef<ReplayEngine>(new ReplayEngine());
  const bossLilSluggerRef = useRef<BossLilSlugger | null>(null);

  // Timing and attempt session state
  const levelTimerRef = useRef<number>(0);
  const lastReportedTimeRef = useRef<number>(0);
  const attemptStartTimeRef = useRef<number>(0);
  const totalDeathsRef = useRef<number>(0);
  const respawnTimerRef = useRef<number>(0);
  const deathMarkedRef = useRef<boolean>(false);
  const isWinPendingRef = useRef<boolean>(false);
  const winDelayTimerRef = useRef<number>(0);

  // 1. Setup / Initialize Level and Systems
  const setupLevel = (level: LevelData) => {
    levelRef.current = level;
    levelTimerRef.current = 0;
    lastReportedTimeRef.current = 0;
    attemptStartTimeRef.current = 0;
    respawnTimerRef.current = 0;
    deathMarkedRef.current = false;
    isWinPendingRef.current = false;
    winDelayTimerRef.current = 0;

    const startX = level.startPos ? level.startPos.x : 48;
    const startY = level.startPos ? level.startPos.y : 100;

    // Initialize or reset PlayerController
    if (!playerControllerRef.current) {
      playerControllerRef.current = new PlayerController(startX, startY, characterProps);
    } else {
      playerControllerRef.current.setCharacter(characterProps);
      playerControllerRef.current.reset(startX, startY);
    }

    // Configure camera & decals in GameRenderer
    if (rendererRef.current) {
      const bounds = level.bounds || {
        minX: 0,
        minY: 0,
        maxX: level.width * (level.tileSize || 16),
        maxY: level.height * (level.tileSize || 16),
      };
      rendererRef.current.camera.setBounds(bounds);
      rendererRef.current.camera.snapTo(startX, startY);
      rendererRef.current.bloodDecals.init(
        Math.max(1920, bounds.maxX || 1920),
        Math.max(1080, bounds.maxY || 1080)
      );
      rendererRef.current.particles.clear();
    }

    // Initialize Lil Slugger for Chapter 1 Boss
    if (level.id === '1-21' || level.id === 'boss1' || level.name.toLowerCase().includes('slugger') || (level.chapter === 1 && level.id.includes('21'))) {
      if (!bossLilSluggerRef.current) {
        bossLilSluggerRef.current = new BossLilSlugger(40, 260);
      } else {
        bossLilSluggerRef.current.reset(40, 260);
      }
    } else {
      bossLilSluggerRef.current = null;
    }

    // Start a fresh replay recording session
    replayEngineRef.current.resetLevelSession(level.id);
    replayEngineRef.current.startRecording(characterProps.id || 'meatboy', level.id);
  };

  // 2. Load level on levelId, chapterNumber, or isDarkWorld changes
  useEffect(() => {
    let isCancelled = false;

    // Parse level number (e.g. '1-2' -> 2, '1-10' -> 10, '1-2x' -> 2)
    const levelNumStr = levelId.split('-')[1]?.replace('x', '') || '1';
    const levelNum = parseInt(levelNumStr, 10) || 1;

    // Load the real .smbl binary first; only use the baked catalog if the
    // fetch/parse fails (offline mode or a malformed mod file).
    loadLevel(chapterNumber, levelNum, isDarkWorld)
      .then((loaded) => {
        if (!isCancelled && loaded) {
          setupLevel(loaded);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('Fallback to prebaked level for', levelId, err);
          setupLevel(getLevel(levelId));
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [levelId, chapterNumber, isDarkWorld]);

  // Update character props if changed in Character Select
  useEffect(() => {
    if (playerControllerRef.current) {
      playerControllerRef.current.setCharacter(characterProps);
    }
  }, [characterProps]);

  // 3. Main 60Hz Physics & Rendering Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!rendererRef.current) {
      rendererRef.current = new GameRenderer(canvas, 640, 360, 0.8);
    }

    // If level is already loaded, snap camera & initialize decals
    if (levelRef.current) {
      const level = levelRef.current;
      const startX = level.startPos ? level.startPos.x : 48;
      const startY = level.startPos ? level.startPos.y : 100;
      rendererRef.current.camera.setBounds(level.bounds);
      rendererRef.current.camera.snapTo(startX, startY);
    }

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);

      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      // Fixed deterministic timestep clamped to avoid spiral of death
      const dt = Math.min(0.033, rawDt || 0.0166);

      const renderer = rendererRef.current;
      const player = playerControllerRef.current;
      const level = levelRef.current;
      const replay = replayEngineRef.current;

      if (!renderer || !player || !level) return;

      if (!isPaused) {
        levelTimerRef.current += dt;

        // Throttle React state update to ~20Hz to keep main thread smooth and responsive
        if (Math.abs(levelTimerRef.current - lastReportedTimeRef.current) >= 0.05) {
          lastReportedTimeRef.current = levelTimerRef.current;
          onTimeUpdate(levelTimerRef.current);
        }

        const input = inputManager.poll();

        // Quick restart on R or controller button
        if (input.restart && !player.state.isDead && !player.state.isWin) {
          player.kill(
            (x, y, count, speed) => renderer.bloodDecals.addLandingSplatter(x, y, speed),
            (sfx) => soundManager.playSfx(SMB_SOUNDS.DEATH)
          );
        }

        // --- 1. HANDLING DEATH & RESPAWN ---
        if (player.state.isDead) {
          respawnTimerRef.current += dt;

          // Capture the exact death timestamp / position / cause on the first
          // dead frame so the stored marker isn't inflated by the respawn delay.
          if (!deathMarkedRef.current) {
            deathMarkedRef.current = true;
            const deathTime = levelTimerRef.current - attemptStartTimeRef.current;
            replay.markDeath(
              deathTime,
              player.state.x,
              player.state.y,
              player.state.deathCause ?? 'unknown',
              player.state.vx,
              player.state.vy
            );
          }

          if (respawnTimerRef.current >= 0.5 || input.jumpPressed) {
            // Save failed run in multi-ghost replay system
            const attemptDuration = levelTimerRef.current - attemptStartTimeRef.current;
            replay.finishAttempt('died', attemptDuration);

            totalDeathsRef.current += 1;
            onDeath(totalDeathsRef.current);

            // Respawn Meat Boy at spawn point
            const startX = level.startPos ? level.startPos.x : 48;
            const startY = level.startPos ? level.startPos.y : 100;
            player.reset(startX, startY);
            renderer.camera.snapTo(startX, startY);
            if (bossLilSluggerRef.current) {
              bossLilSluggerRef.current.reset(40, 260);
            }

            // Start new recording attempt (blood decals persist!)
            replay.startRecording(characterProps.id || 'meatboy', level.id);
            respawnTimerRef.current = 0;
            deathMarkedRef.current = false;
            attemptStartTimeRef.current = levelTimerRef.current;
          }
        }
        // --- 2. HANDLING GOAL REACHED (WIN) ---
        else if (player.state.isWin) {
          if (!isWinPendingRef.current) {
            isWinPendingRef.current = true;
            winDelayTimerRef.current = 0;

            const clearTime = levelTimerRef.current - attemptStartTimeRef.current;
            replay.finishAttempt('won', clearTime);
            soundManager.playSfx(SMB_SOUNDS.LEVEL_WIN);
          }

          winDelayTimerRef.current += dt;
          if (winDelayTimerRef.current >= 0.75) {
            onWin(levelTimerRef.current, [...replay.attempts]);
            return;
          }
        }
        // --- 3. ACTIVE KINEMATICS & INPUT ---
        else {
          player.update(
            input,
            level,
            (x, y, count, speed) => {
              renderer.bloodDecals.addLandingSplatter(x, y, speed);
            },
            (sfx) => {
              if (sfx === 'jump') soundManager.playSfx(SMB_SOUNDS.JUMP);
              else if (sfx === 'land') soundManager.playSfx(SMB_SOUNDS.SPLATTER);
              else if (sfx === 'death') {
                soundManager.playSfx(SMB_SOUNDS.DEATH);
                renderer.triggerScreenShake(0.35, 9);
                renderer.bloodDecals.addDeathExplosion(player.state.x + 7, player.state.y + 7, 'saw');
                renderer.particles.emitDeathMeatChunks(
                  player.state.x + 7,
                  player.state.y + 7,
                  36,
                  renderer.bloodDecals
                );
              } else if (sfx === 'win') {
                soundManager.playSfx(SMB_SOUNDS.LEVEL_WIN);
              } else if (sfx === 'bandage') {
                soundManager.playSfx(SMB_SOUNDS.BANDAGE);
                onCollectBandage();
              }
            },
            (x, y, dir) => {
              renderer.particles.emitSkidDust(x, y, dir);
            }
          );

          // Record trajectory keyframe for simultaneous replay
          const attemptTime = levelTimerRef.current - attemptStartTimeRef.current;
          replay.recordFrame(attemptTime, player.state);
        }

        // Update Lil Slugger Boss if active in level
        if (bossLilSluggerRef.current) {
          const boss = bossLilSluggerRef.current;
          boss.update(
            dt,
            player.state,
            renderer.camera,
            renderer.particles,
            () => {
              if (!player.state.isDead) {
                player.kill(
                  (x, y, count, speed) => renderer.bloodDecals.addLandingSplatter(x, y, speed),
                  () => soundManager.playSfx(SMB_SOUNDS.DEATH)
                );
                renderer.bloodDecals.addDeathExplosion(player.state.x + 7, player.state.y + 7, 'saw');
                renderer.particles.emitDeathMeatChunks(player.state.x + 7, player.state.y + 7, 36, renderer.bloodDecals);
              }
            },
            () => {
              player.state.isWin = true;
            }
          );
        }

        // Update camera position, lerp, and particles
        renderer.update(dt, player.state, level);
        (window as any).__smb = { level, player: player.state, camera: renderer.camera };
      }

      // Render world with authentic camera view, parallax backgrounds, decals, and entities
      renderer.render(level, player.state, renderer.bloodDecals, undefined, levelTimerRef.current);

      // Render Boss if present
      if (bossLilSluggerRef.current) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Boss is world-space art; reuse the renderer's world->screen zoom.
          ctx.save();
          renderer.applyWorldTransform(ctx);
          bossLilSluggerRef.current.render(ctx, renderer.camera.getRenderX(), renderer.camera.getRenderY());
          ctx.restore();
        }
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPaused]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none"
    >
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="w-full h-full max-w-full max-h-full aspect-video object-contain shadow-2xl [image-rendering:pixelated]"
      />
    </div>
  );
};

