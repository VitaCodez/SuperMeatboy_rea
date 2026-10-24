/**
 * Super Meat Boy - Multi-Death Simultaneous Replay Engine
 *
 * Implements Super Meat Boy's signature multi-death replay system:
 * - Records player attempts frame-by-frame (position, velocity, squash/stretch, facing, state, timestamp).
 * - Stores all failed attempts (with exact death time, position and cause) across a level session.
 * - When the player reaches Bandage Girl, all prior ghosts + the winning run play SIMULTANEOUSLY from t=0.
 * - Ghosts explode into gore/particles at the exact moment and position they died.
 * - Playback controls: pause, speed (0.5x, 1x, 2x), restart, seek, scrub.
 * - Ghost rendering helper: translucent red/white tinted ghosts (alpha = 0.45) with glowing outlines.
 * - JSON serializer/deserializer for speedrun sharing and analysis.
 */

import { ReplayAttempt, ReplayFrame, PlayerState, DeathCause } from './types';

export type ReplayState = 'idle' | 'running' | 'jumping' | 'falling' | 'wall_sliding' | 'dead' | 'won';
export type GhostTint = 'red' | 'white';
export type GhostTintMode = GhostTint | 'alternating';

export interface ReplayGhost {
  attemptId: number;
  characterId: string;
  isWinning: boolean;
  isDead: boolean;
  justDied: boolean;
  hasDiedThisFrame: boolean; // Backwards-compatibility alias
  frame: ReplayFrame;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  squashX: number;
  squashY: number;
  state: ReplayState;
  alpha: number;
  color: string;
  outlineColor: string;
  tint: GhostTint;
  progress: number;
  /** 0 while alive, ramps 0 -> 1 across the death burst, after which the ghost is gone. */
  deathProgress: number;
  deathCause: DeathCause | null;
  deathPosition: { x: number; y: number } | null;
}

export interface ReplayGhostDeathEvent {
  attemptId: number;
  time: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  characterId: string;
  cause: DeathCause;
}

/**
 * A single exact death location + cause for a failed run. Mirrors SMB's
 * per-attempt death markers used to spawn the ghost explosion.
 */
export interface ReplayDeathMarker {
  attemptId: number;
  characterId: string;
  time: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  position: { x: number; y: number };
  cause: DeathCause;
}

export interface ReplaySessionData {
  version: number;
  format: 'SMB_REPLAY_V1';
  levelId?: string;
  characterId: string;
  totalAttempts: number;
  recordedAt: string;
  duration: number;
  winningAttemptId: number | null;
  attempts: ReplayAttempt[];
}

export interface GhostRenderOptions {
  baseAlpha?: number;         // Default 0.45 for ghosts
  winningAlpha?: number;      // Default 1.0 for winner
  showWinner?: boolean;       // Default true
  showOutlines?: boolean;     // Default true
  glowBlur?: number;          // Default 4
  paletteVariation?: boolean; // Default true
  tintMode?: GhostTintMode;   // Default 'alternating' (red / white)
  burstDuration?: number;     // Default 0.35s
  showDeathBurst?: boolean;   // Default true
  customGhostColor?: string;
  customWinnerColor?: string;
}

export interface ReplayUpdateResult {
  finished: boolean;
  deathsThisFrame: ReplayGhostDeathEvent[];
  replayTime: number;
  duration: number;
}

/** Default length of the ghost death-burst animation, in seconds. */
export const DEFAULT_BURST_DURATION = 0.35;
/** Extra time the winner keeps celebrating after the longest attempt ends. */
export const POST_REPLAY_BUFFER = 2.0;

// Curated spectral meat palettes for red / white ghost variations.
const GHOST_RED_PALETTE = [
  '#b82020', // Arterial crimson
  '#c72c48', // Carnation meat
  '#991b1b', // Dark venous blood
  '#a82d58', // Spectral magenta flesh
  '#d63031', // Bright meat red
  '#8e1616', // Coagulated gore
  '#c2410c', // Charred orange-red
  '#b91c1c', // Ruby flesh
  '#e11d48', // Vivid rose meat
  '#7f1d1d', // Deep bruised maroon
  '#be123c', // Ethereal crimson
  '#9f1239', // Spectral burgundy
];

const GHOST_WHITE_PALETTE = [
  '#ffffff', // Bone white
  '#ffe0e0', // Pale flesh
  '#ffcdd2', // Ghost blush
  '#f6e7e7', // Spirit mist
  '#ffb8c0', // Wraith rose
  '#ececec', // Ash white
];

const GHOST_RED_OUTLINES = [
  'rgba(255, 90, 90, 0.75)',
  'rgba(255, 120, 160, 0.75)',
  'rgba(220, 60, 60, 0.75)',
  'rgba(240, 100, 180, 0.75)',
  'rgba(255, 140, 100, 0.75)',
];

const GHOST_WHITE_OUTLINES = [
  'rgba(255, 255, 255, 0.85)',
  'rgba(255, 230, 230, 0.8)',
  'rgba(235, 245, 255, 0.8)',
];

const WINNER_COLOR = '#c41d1d';
const WINNER_OUTLINE = '#ffd700';

/**
 * Maps a physics hazard type onto the replay system's death-cause taxonomy.
 */
export function hazardTypeToDeathCause(hazard?: string): DeathCause {
  switch (hazard) {
    case 'saw':
      return 'saw';
    case 'spike':
    case 'needles':
      return 'needles';
    case 'lava':
      return 'lava';
    case 'crumble':
      return 'crumble';
    case 'generic':
    case 'fall':
      return 'fall';
    default:
      return 'unknown';
  }
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * Finds the index of the last frame whose timestamp is <= `time`.
 * Frames are expected to be sorted ascending by `t`.
 */
function lowerBoundFrameIndex(frames: ReplayFrame[], time: number): number {
  let low = 0;
  let high = frames.length - 1;
  let idx = 0;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (frames[mid].t <= time) {
      idx = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return idx;
}

function deathTimeOf(attempt: ReplayAttempt): number {
  return attempt.deathTime ?? attempt.duration;
}

export class ReplayEngine {
  public attempts: ReplayAttempt[] = [];
  public currentAttemptFrames: ReplayFrame[] = [];
  public currentAttemptId: number = 1;
  public characterId: string = 'meatboy';
  public levelId: string = '';

  // State flags
  public isRecording: boolean = false;
  public isReplaying: boolean = false;
  public isPaused: boolean = false;

  // Timing & Speed
  public replayTime: number = 0;
  public replaySpeed: number = 1.0;
  public maxReplayDuration: number = 0;

  // Internal tracking
  private explodedAttemptIds: Set<number> = new Set<number>();
  private deathListeners: Array<(event: ReplayGhostDeathEvent) => void> = [];

  // Explicit death marker captured before an attempt is finalized.
  private pendingDeath: {
    time: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    cause: DeathCause;
  } | null = null;

  // Per-attempt frame cursor so sequential playback is amortized O(1) per frame.
  private frameCursor: Map<number, number> = new Map<number, number>();

  constructor(characterId: string = 'meatboy', levelId: string = '') {
    this.characterId = characterId;
    this.levelId = levelId;
  }

  // ==========================================
  // RECORDING API
  // ==========================================

  /**
   * Starts recording a new attempt.
   */
  public startRecording(characterId: string = 'meatboy', levelId?: string): void {
    this.characterId = characterId;
    if (levelId) this.levelId = levelId;
    this.currentAttemptFrames = [];
    this.pendingDeath = null;
    this.isRecording = true;
    this.isReplaying = false;
    this.isPaused = false;
  }

  /**
   * Records a frame for the active attempt.
   * Supports:
   * 1. recordFrame(time, playerState)
   * 2. recordFrame(replayFrame)
   * 3. recordFrame(time, x, y, vx, vy, facing, squashX, squashY, state)
   */
  public recordFrame(
    timeOrFrame: number | ReplayFrame,
    playerOrX?: PlayerState | number | null,
    y?: number,
    vx?: number,
    vy?: number,
    facing?: 1 | -1,
    squashX?: number,
    squashY?: number,
    state?: ReplayState
  ): void {
    if (!this.isRecording) return;
    if (timeOrFrame === null || timeOrFrame === undefined) return;

    if (typeof timeOrFrame === 'object') {
      // ReplayFrame object passed directly
      this.currentAttemptFrames.push({ ...timeOrFrame });
      return;
    }

    const t = timeOrFrame;

    if (playerOrX && typeof playerOrX === 'object') {
      // PlayerState object passed
      const p = playerOrX;
      let deducedState: ReplayState = 'idle';

      if (p.isDead) deducedState = 'dead';
      else if (p.isWin) deducedState = 'won';
      else if (p.isWallSliding) deducedState = 'wall_sliding';
      else if (p.vy < -20 || p.isJumping) deducedState = 'jumping';
      else if (p.vy > 20) deducedState = 'falling';
      else if (Math.abs(p.vx) > 10) deducedState = 'running';

      this.currentAttemptFrames.push({
        t,
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        facing: p.facing,
        squashX: p.squashX ?? 1,
        squashY: p.squashY ?? 1,
        state: deducedState,
      });
      return;
    }

    if (typeof playerOrX === 'number' && y !== undefined) {
      // Direct coordinate parameters passed
      this.currentAttemptFrames.push({
        t,
        x: playerOrX,
        y,
        vx: vx ?? 0,
        vy: vy ?? 0,
        facing: facing ?? 1,
        squashX: squashX ?? 1,
        squashY: squashY ?? 1,
        state: state ?? 'idle',
      });
    }
  }

  /**
   * Captures the exact moment/location a run died, before the attempt is
   * finalized (respawn may happen some frames later). This is what makes the
   * stored death timestamp precise rather than inflated by the respawn delay.
   */
  public markDeath(
    time: number,
    x: number,
    y: number,
    cause: DeathCause = 'unknown',
    vx: number = 0,
    vy: number = 0
  ): void {
    this.pendingDeath = { time, x, y, vx, vy, cause };
  }

  /**
   * Finalizes the current attempt and saves it to the attempts array.
   *
   * @param outcome   'died' | 'won'
   * @param totalTime Optional explicit duration (seconds)
   * @param deathCause Optional explicit death cause (overrides inferred cause)
   */
  public finishAttempt(outcome: 'died' | 'won', totalTime?: number, deathCause?: DeathCause): void {
    if (!this.isRecording && this.currentAttemptFrames.length === 0) return;
    this.isRecording = false;

    const frames = this.currentAttemptFrames;
    const lastFrame = frames.length > 0 ? frames[frames.length - 1] : null;

    let duration: number;
    let deathPosition: { x: number; y: number } | undefined;
    let deathCause2: DeathCause | undefined;

    if (outcome === 'died') {
      const pending = this.pendingDeath;
      // Prefer the exact recorded death time; fall back to the supplied total.
      duration = pending
        ? pending.time
        : (totalTime !== undefined ? totalTime : (lastFrame ? lastFrame.t : 0));

      deathPosition = pending
        ? { x: pending.x, y: pending.y }
        : (lastFrame ? { x: lastFrame.x, y: lastFrame.y } : undefined);

      deathCause2 = deathCause ?? pending?.cause ?? 'unknown';
    } else {
      duration = totalTime !== undefined ? totalTime : (lastFrame ? lastFrame.t : 0);
    }

    this.attempts.push({
      attemptId: this.currentAttemptId++,
      characterId: this.characterId,
      frames: frames.slice(),
      outcome,
      duration,
      deathPosition,
      deathTime: outcome === 'died' ? duration : undefined,
      deathCause: deathCause2,
    });

    this.currentAttemptFrames = [];
    this.pendingDeath = null;
    this.frameCursor.delete(this.currentAttemptId - 1);
    this.recomputeDuration();
  }

  /**
   * Resets all recorded attempts for a fresh level session.
   */
  public resetLevelSession(levelId?: string): void {
    if (levelId) this.levelId = levelId;
    this.attempts = [];
    this.currentAttemptFrames = [];
    this.currentAttemptId = 1;
    this.isRecording = false;
    this.isReplaying = false;
    this.isPaused = false;
    this.replayTime = 0;
    this.maxReplayDuration = 0;
    this.pendingDeath = null;
    this.explodedAttemptIds.clear();
    this.frameCursor.clear();
  }

  // ==========================================
  // PLAYBACK & REPLAY CONTROLS
  // ==========================================

  /**
   * Starts multi-ghost simultaneous replay mode from t=0.
   */
  public startReplay(): void {
    this.isReplaying = true;
    this.isRecording = false;
    this.isPaused = false;
    this.replayTime = 0;
    this.recomputeDuration();
    this.explodedAttemptIds.clear();
    this.frameCursor.clear();
  }

  /**
   * Stops replay mode.
   */
  public stopReplay(): void {
    this.isReplaying = false;
    this.isPaused = false;
  }

  /**
   * Restarts the replay from t=0 and re-arms ghost explosions.
   */
  public restart(): void {
    this.replayTime = 0;
    this.explodedAttemptIds.clear();
    this.frameCursor.clear();
    this.isPaused = false;
  }

  public restartReplay(): void {
    this.startReplay();
  }

  /**
   * Pauses replay playback.
   */
  public pause(): void {
    this.isPaused = true;
  }

  /**
   * Resumes replay playback.
   */
  public resume(): void {
    this.isPaused = false;
  }

  /**
   * Toggles pause/play state. Returns the new paused state.
   */
  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  /**
   * Sets playback speed multiplier (e.g. 0.5x, 1x, 2x).
   */
  public setSpeed(speed: number): void {
    this.replaySpeed = Math.max(0.1, Math.min(speed, 10.0));
  }

  public getSpeed(): number {
    return this.replaySpeed;
  }

  /**
   * Seeks (scrubs) to a specific playback time.
   */
  public seek(time: number): void {
    this.replayTime = Math.max(0, Math.min(time, this.maxReplayDuration + POST_REPLAY_BUFFER));
    // Cursors are invalid after a scrub; explosion state is re-evaluated.
    this.frameCursor.clear();
    this.explodedAttemptIds.clear();
    for (const attempt of this.attempts) {
      if (attempt.outcome === 'died' && deathTimeOf(attempt) <= this.replayTime) {
        this.explodedAttemptIds.add(attempt.attemptId);
      }
    }
  }

  public getReplayTime(): number {
    return this.replayTime;
  }

  public getDuration(): number {
    return this.maxReplayDuration;
  }

  public getProgress(): number {
    if (this.maxReplayDuration <= 0) return 1.0;
    return clamp01(this.replayTime / this.maxReplayDuration);
  }

  /**
   * Registers a listener triggered when a ghost reaches its death time and explodes.
   * Returns an unsubscribe function.
   */
  public onGhostDeath(listener: (event: ReplayGhostDeathEvent) => void): () => void {
    this.deathListeners.push(listener);
    return () => {
      this.deathListeners = this.deathListeners.filter(l => l !== listener);
    };
  }

  /**
   * Advances the simultaneous replay clock and detects ghost explosions.
   */
  public updateReplay(dt: number): ReplayUpdateResult {
    if (!this.isReplaying || this.isPaused) {
      return {
        finished: false,
        deathsThisFrame: [],
        replayTime: this.replayTime,
        duration: this.maxReplayDuration,
      };
    }

    this.replayTime += dt * this.replaySpeed;
    const deathsThisFrame: ReplayGhostDeathEvent[] = [];

    // Detect ghost explosions during this tick.
    for (const attempt of this.attempts) {
      if (attempt.outcome !== 'died' || this.explodedAttemptIds.has(attempt.attemptId)) continue;
      const deathTime = deathTimeOf(attempt);
      if (this.replayTime < deathTime) continue;

      this.explodedAttemptIds.add(attempt.attemptId);

      const lastFrame = attempt.frames.length > 0 ? attempt.frames[attempt.frames.length - 1] : null;
      const px = attempt.deathPosition ? attempt.deathPosition.x : (lastFrame ? lastFrame.x : 0);
      const py = attempt.deathPosition ? attempt.deathPosition.y : (lastFrame ? lastFrame.y : 0);

      const deathEvent: ReplayGhostDeathEvent = {
        attemptId: attempt.attemptId,
        time: deathTime,
        x: px,
        y: py,
        vx: lastFrame ? lastFrame.vx : 0,
        vy: lastFrame ? lastFrame.vy : 0,
        characterId: attempt.characterId,
        cause: attempt.deathCause ?? 'unknown',
      };

      deathsThisFrame.push(deathEvent);

      for (const listener of this.deathListeners) {
        try {
          listener(deathEvent);
        } catch (err) {
          console.error('Error in replay ghost death listener', err);
        }
      }
    }

    // Playback finishes after all ghosts finish + celebration buffer.
    const finished = this.replayTime >= this.maxReplayDuration + POST_REPLAY_BUFFER;

    return {
      finished,
      deathsThisFrame,
      replayTime: this.replayTime,
      duration: this.maxReplayDuration,
    };
  }

  // ==========================================
  // GHOST QUERY & INTERPOLATION
  // ==========================================

  /**
   * Retrieves all replay ghosts with interpolated positions, squash/stretch,
   * alpha, red/white tint variations, death progress and death statuses at the
   * current replayTime.
   */
  public getReplayGhosts(options: GhostRenderOptions = {}): ReplayGhost[] {
    if (this.attempts.length === 0) return [];

    const baseAlpha = options.baseAlpha ?? 0.45;
    const winningAlpha = options.winningAlpha ?? 1.0;
    const burstDuration = options.burstDuration ?? DEFAULT_BURST_DURATION;
    const tintMode: GhostTintMode = options.tintMode ?? 'alternating';
    const ghosts: ReplayGhost[] = [];

    for (const attempt of this.attempts) {
      const frames = attempt.frames;
      if (frames.length === 0) continue;

      const isWinning = attempt.outcome === 'won';
      const deathTime = deathTimeOf(attempt);
      const hasDied = attempt.outcome === 'died' && this.replayTime >= deathTime;
      const timeSinceDeath = this.replayTime - deathTime;
      const justDied = hasDied && timeSinceDeath <= burstDuration;
      const deathProgress = hasDied ? clamp01(timeSinceDeath / burstDuration) : 0;

      const tint = this.resolveTint(tintMode, attempt.attemptId);

      const color = isWinning
        ? (options.customWinnerColor ?? WINNER_COLOR)
        : (options.customGhostColor ??
            (tint === 'white'
              ? GHOST_WHITE_PALETTE[(attempt.attemptId - 1) % GHOST_WHITE_PALETTE.length]
              : GHOST_RED_PALETTE[(attempt.attemptId - 1) % GHOST_RED_PALETTE.length]));

      const outlineColor = isWinning
        ? WINNER_OUTLINE
        : (tint === 'white'
            ? GHOST_WHITE_OUTLINES[(attempt.attemptId - 1) % GHOST_WHITE_OUTLINES.length]
            : GHOST_RED_OUTLINES[(attempt.attemptId - 1) % GHOST_RED_OUTLINES.length]);

      const lastFrame = frames[frames.length - 1];

      // --- Attempt has ended (won, or died and exploded) ---
      if (this.replayTime >= attempt.duration) {
        if (isWinning) {
          // Winning Meat Boy stays cheering at the goal position.
          ghosts.push({
            attemptId: attempt.attemptId,
            characterId: attempt.characterId,
            isWinning: true,
            isDead: false,
            justDied: false,
            hasDiedThisFrame: false,
            frame: lastFrame,
            x: lastFrame.x,
            y: lastFrame.y,
            vx: 0,
            vy: 0,
            facing: lastFrame.facing,
            squashX: 1.0,
            squashY: 1.0,
            state: 'won',
            alpha: winningAlpha,
            color,
            outlineColor,
            tint,
            progress: 1.0,
            deathProgress: 0,
            deathCause: null,
            deathPosition: null,
          });
        } else {
          // Dead ghost: its death burst plays out, then it vanishes (alpha 0).
          ghosts.push({
            attemptId: attempt.attemptId,
            characterId: attempt.characterId,
            isWinning: false,
            isDead: true,
            justDied,
            hasDiedThisFrame: justDied,
            frame: lastFrame,
            x: lastFrame.x,
            y: lastFrame.y,
            vx: lastFrame.vx,
            vy: lastFrame.vy,
            facing: lastFrame.facing,
            squashX: lastFrame.squashX,
            squashY: lastFrame.squashY,
            state: 'dead',
            alpha: 0,
            color,
            outlineColor,
            tint,
            progress: 1.0,
            deathProgress,
            deathCause: attempt.deathCause ?? 'unknown',
            deathPosition: attempt.deathPosition ?? { x: lastFrame.x, y: lastFrame.y },
          });
        }
        continue;
      }

      // --- Smooth frame interpolation (amortized O(1) with per-attempt cursor) ---
      let idx = this.frameCursor.get(attempt.attemptId);
      if (idx === undefined || idx < 0 || idx >= frames.length || frames[idx].t > this.replayTime) {
        idx = lowerBoundFrameIndex(frames, this.replayTime);
      } else {
        while (idx + 1 < frames.length && frames[idx + 1].t <= this.replayTime) idx++;
      }
      this.frameCursor.set(attempt.attemptId, idx);

      const f0 = frames[idx];
      const f1 = frames[Math.min(frames.length - 1, idx + 1)];

      let interpolatedX = f0.x;
      let interpolatedY = f0.y;
      let interpolatedVx = f0.vx;
      let interpolatedVy = f0.vy;
      let interpolatedSquashX = f0.squashX;
      let interpolatedSquashY = f0.squashY;

      if (f1 && f1 !== f0 && f1.t > f0.t) {
        const factor = clamp01((this.replayTime - f0.t) / (f1.t - f0.t));
        interpolatedX = f0.x + (f1.x - f0.x) * factor;
        interpolatedY = f0.y + (f1.y - f0.y) * factor;
        interpolatedVx = f0.vx + (f1.vx - f0.vx) * factor;
        interpolatedVy = f0.vy + (f1.vy - f0.vy) * factor;
        interpolatedSquashX = f0.squashX + (f1.squashX - f0.squashX) * factor;
        interpolatedSquashY = f0.squashY + (f1.squashY - f0.squashY) * factor;
      }

      const progress = attempt.duration > 0 ? clamp01(this.replayTime / attempt.duration) : 0;

      ghosts.push({
        attemptId: attempt.attemptId,
        characterId: attempt.characterId,
        isWinning,
        isDead: hasDied,
        justDied,
        hasDiedThisFrame: justDied,
        frame: f0,
        x: interpolatedX,
        y: interpolatedY,
        vx: interpolatedVx,
        vy: interpolatedVy,
        facing: f0.facing,
        squashX: interpolatedSquashX,
        squashY: interpolatedSquashY,
        state: f0.state,
        alpha: isWinning ? winningAlpha : baseAlpha,
        color,
        outlineColor,
        tint,
        progress,
        deathProgress,
        deathCause: deathProgress > 0 ? (attempt.deathCause ?? 'unknown') : null,
        deathPosition: attempt.deathPosition ?? null,
      });
    }

    return ghosts;
  }

  /**
   * Backwards-compatible helper returning active ghost frames matching renderer.ts.
   */
  public getActiveGhostFrames(): Array<{
    attemptId: number;
    frame: ReplayFrame;
    isWinning: boolean;
    hasDiedThisFrame: boolean;
  }> {
    const ghosts = this.getReplayGhosts();
    return ghosts
      .filter(g => !g.isDead || g.justDied)
      .map(g => ({
        attemptId: g.attemptId,
        frame: {
          t: this.replayTime,
          x: g.x,
          y: g.y,
          vx: g.vx,
          vy: g.vy,
          facing: g.facing,
          squashX: g.squashX,
          squashY: g.squashY,
          state: g.state,
        },
        isWinning: g.isWinning,
        hasDiedThisFrame: g.hasDiedThisFrame,
      }));
  }

  /**
   * Returns exact death markers (time, position, cause) for every failed run.
   * Used by HUDs, analysis tools and the ghost death-burst spawner.
   */
  public getDeathMarkers(): ReplayDeathMarker[] {
    const markers: ReplayDeathMarker[] = [];
    for (const attempt of this.attempts) {
      if (attempt.outcome !== 'died') continue;
      const lastFrame = attempt.frames.length > 0 ? attempt.frames[attempt.frames.length - 1] : null;
      const position = attempt.deathPosition
        ? { x: attempt.deathPosition.x, y: attempt.deathPosition.y }
        : { x: lastFrame ? lastFrame.x : 0, y: lastFrame ? lastFrame.y : 0 };
      markers.push({
        attemptId: attempt.attemptId,
        characterId: attempt.characterId,
        time: deathTimeOf(attempt),
        x: position.x,
        y: position.y,
        vx: lastFrame ? lastFrame.vx : 0,
        vy: lastFrame ? lastFrame.vy : 0,
        position,
        cause: attempt.deathCause ?? 'unknown',
      });
    }
    return markers;
  }

  public getDeathMarker(attemptId: number): ReplayDeathMarker | null {
    return this.getDeathMarkers().find(m => m.attemptId === attemptId) ?? null;
  }

  // ==========================================
  // GHOST RENDERING HELPER
  // ==========================================

  /**
   * Renders all active ghosts in the current frame to the canvas context.
   * Translucent red/white ghosts (alpha = 0.45) with glowing outlines, plus
   * death bursts when a ghost reaches its death frame.
   */
  public renderGhosts(
    ctx: CanvasRenderingContext2D,
    cameraX: number = 0,
    cameraY: number = 0,
    options: GhostRenderOptions = {}
  ): void {
    const ghosts = this.getReplayGhosts(options);
    // Render ghosts first, winning Meat Boy last (on top).
    const sorted = ghosts
      .filter(g => (!g.isDead || g.justDied) && (options.showWinner !== false || !g.isWinning))
      .sort((a, b) => (a.isWinning ? 1 : 0) - (b.isWinning ? 1 : 0));

    for (const ghost of sorted) {
      renderGhost(ctx, ghost, cameraX, cameraY, options);
    }
  }

  // ==========================================
  // SERIALIZER / DESERIALIZER (JSON)
  // ==========================================

  /**
   * Exports the entire replay session data to a JSON string.
   */
  public exportToJSON(pretty: boolean = false): string {
    const data = this.exportReplayData();
    return JSON.stringify(data, null, pretty ? 2 : 0);
  }

  /**
   * Exports structured replay session data object.
   */
  public exportReplayData(): ReplaySessionData {
    const winningAttempt = this.attempts.find(a => a.outcome === 'won');

    return {
      version: 1,
      format: 'SMB_REPLAY_V1',
      levelId: this.levelId,
      characterId: this.characterId,
      totalAttempts: this.attempts.length,
      recordedAt: new Date().toISOString(),
      duration: Number(this.maxReplayDuration.toFixed(3)),
      winningAttemptId: winningAttempt ? winningAttempt.attemptId : null,
      attempts: this.attempts.map(a => ({
        attemptId: a.attemptId,
        characterId: a.characterId,
        outcome: a.outcome,
        duration: Number(a.duration.toFixed(3)),
        deathPosition: a.deathPosition,
        deathTime: a.deathTime !== undefined ? Number(a.deathTime.toFixed(3)) : undefined,
        deathCause: a.deathCause,
        frames: a.frames.map(f => ({
          t: Number(f.t.toFixed(3)),
          x: Number(f.x.toFixed(1)),
          y: Number(f.y.toFixed(1)),
          vx: Number(f.vx.toFixed(1)),
          vy: Number(f.vy.toFixed(1)),
          facing: f.facing,
          squashX: Number(f.squashX.toFixed(2)),
          squashY: Number(f.squashY.toFixed(2)),
          state: f.state,
        })),
      })),
    };
  }

  /**
   * Imports and validates a replay session from a JSON string.
   * Returns true if loaded successfully.
   */
  public importFromJSON(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      return this.importReplayData(parsed);
    } catch (err) {
      console.error('Failed to parse replay JSON:', err);
      return false;
    }
  }

  /**
   * Imports structured replay session data object into the engine.
   */
  public importReplayData(data: ReplaySessionData | any): boolean {
    if (!data || typeof data !== 'object') {
      console.error('Invalid replay data: root is not an object');
      return false;
    }

    if (!Array.isArray(data.attempts)) {
      console.error('Invalid replay data: missing attempts array');
      return false;
    }

    const validAttempts: ReplayAttempt[] = [];
    let maxAttemptId = 0;

    for (const raw of data.attempts) {
      if (!raw || typeof raw !== 'object' || !Array.isArray(raw.frames)) {
        continue;
      }

      const frames: ReplayFrame[] = [];
      for (const f of raw.frames) {
        if (typeof f.t !== 'number' || typeof f.x !== 'number' || typeof f.y !== 'number') {
          continue;
        }
        frames.push({
          t: f.t,
          x: f.x,
          y: f.y,
          vx: f.vx ?? 0,
          vy: f.vy ?? 0,
          facing: f.facing === -1 ? -1 : 1,
          squashX: f.squashX ?? 1,
          squashY: f.squashY ?? 1,
          state: f.state ?? 'idle',
        });
      }

      const outcome = raw.outcome === 'won' ? 'won' : 'died';
      const duration = typeof raw.duration === 'number'
        ? raw.duration
        : (frames.length > 0 ? frames[frames.length - 1].t : 0);
      const attemptId = typeof raw.attemptId === 'number' ? raw.attemptId : (validAttempts.length + 1);

      validAttempts.push({
        attemptId,
        characterId: raw.characterId ?? data.characterId ?? 'meatboy',
        frames,
        outcome,
        duration,
        deathPosition: raw.deathPosition,
        deathTime: outcome === 'died'
          ? (typeof raw.deathTime === 'number' ? raw.deathTime : duration)
          : undefined,
        deathCause: outcome === 'died'
          ? (typeof raw.deathCause === 'string' ? raw.deathCause : 'unknown')
          : undefined,
      });

      if (attemptId > maxAttemptId) maxAttemptId = attemptId;
    }

    if (validAttempts.length === 0) {
      console.warn('Replay data contained no valid attempts');
      return false;
    }

    this.attempts = validAttempts;
    this.characterId = data.characterId ?? 'meatboy';
    if (data.levelId) this.levelId = data.levelId;
    this.currentAttemptId = maxAttemptId + 1;
    this.currentAttemptFrames = [];
    this.pendingDeath = null;
    this.recomputeDuration();
    this.replayTime = 0;
    this.explodedAttemptIds.clear();
    this.frameCursor.clear();

    return true;
  }

  /**
   * Static factory method to create an instance directly from JSON.
   */
  public static fromJSON(jsonString: string): ReplayEngine | null {
    const engine = new ReplayEngine();
    const success = engine.importFromJSON(jsonString);
    return success ? engine : null;
  }

  /**
   * Static helper to serialize an engine's attempts to JSON.
   */
  public static toJSON(engine: ReplayEngine, pretty: boolean = false): string {
    return engine.exportToJSON(pretty);
  }

  /**
   * Quick statistics summary for speedruns / HUD.
   */
  public getStats(): {
    totalAttempts: number;
    failedAttempts: number;
    hasWon: boolean;
    winningTime: number | null;
    totalSessionTime: number;
  } {
    let failedAttempts = 0;
    let totalSessionTime = 0;
    let winAttempt: ReplayAttempt | undefined;

    for (const attempt of this.attempts) {
      if (attempt.outcome === 'died') failedAttempts++;
      else if (!winAttempt) winAttempt = attempt;
      totalSessionTime += attempt.duration;
    }

    return {
      totalAttempts: this.attempts.length,
      failedAttempts,
      hasWon: !!winAttempt,
      winningTime: winAttempt ? winAttempt.duration : null,
      totalSessionTime,
    };
  }

  // ==========================================
  // INTERNAL HELPERS
  // ==========================================

  private recomputeDuration(): void {
    let max = 0;
    for (const attempt of this.attempts) {
      if (attempt.duration > max) max = attempt.duration;
    }
    this.maxReplayDuration = max;
  }

  private resolveTint(mode: GhostTintMode, attemptId: number): GhostTint {
    if (mode === 'red' || mode === 'white') return mode;
    // 'alternating': stable per attempt so a ghost keeps its tint across frames.
    return attemptId % 2 === 0 ? 'white' : 'red';
  }
}

// ==========================================
// STANDALONE GHOST RENDERING HELPERS
// ==========================================

/**
 * Renders an individual translucent ghost copy (alpha = 0.45) with glowing outline,
 * subtle red/white tint variations, meat marbling, and animated facial expressions.
 * When the ghost reaches its death frame, an expanding death burst is rendered instead.
 */
export function renderGhost(
  ctx: CanvasRenderingContext2D,
  ghost: ReplayGhost,
  cameraX: number = 0,
  cameraY: number = 0,
  options: GhostRenderOptions = {}
): void {
  if (ghost.isDead) {
    // Ghost has fully exploded and vanished.
    if (ghost.deathProgress >= 1) return;
    if (options.showDeathBurst !== false) {
      renderDeathBurst(ctx, ghost, cameraX, cameraY);
    }
    return;
  }

  const alpha = ghost.isWinning
    ? (options.winningAlpha ?? 1.0)
    : (options.baseAlpha ?? 0.45);

  ctx.save();
  ctx.globalAlpha = alpha;

  const cx = Math.round(ghost.x + 7 - cameraX);
  const cy = Math.round(ghost.y + 7 - cameraY);

  ctx.translate(cx, cy);
  ctx.scale(ghost.facing * ghost.squashX, ghost.squashY);

  // Glowing outline for ghosts / winner
  if (options.showOutlines !== false) {
    ctx.shadowColor = ghost.isWinning ? WINNER_OUTLINE : ghost.outlineColor;
    ctx.shadowBlur = options.glowBlur ?? (ghost.isWinning ? 8 : 5);
  }

  // Meat Boy Ghost Body (14x14 cube)
  ctx.fillStyle = ghost.color;
  ctx.fillRect(-7, -7, 14, 14);

  // Meat Marbling / Highlights
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fillRect(-6, -6, 12, 3);
  ctx.fillRect(-5, -2, 3, 2);

  // Darker muscle bottom shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.fillRect(-6, 5, 12, 2);

  // Disable shadow blur for facial detail sharpness
  ctx.shadowBlur = 0;

  // Eyes (White sclera)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(1, -3, 4, 5);  // Right eye
  ctx.fillRect(-5, -3, 3, 4); // Left eye

  // Pupils (Looking in facing direction)
  ctx.fillStyle = '#000000';
  ctx.fillRect(2, -2, 2, 3);
  ctx.fillRect(-4, -2, 2, 2);

  // State-Dependent Expressions
  if (ghost.state === 'won') {
    // Joyful celebration open mouth + tooth shine
    ctx.fillStyle = '#5c0000';
    ctx.fillRect(-2, 2, 5, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, 2, 3, 1);
  } else if (ghost.state === 'wall_sliding') {
    // Scared / grimacing 'O' mouth
    ctx.fillStyle = '#5c0000';
    ctx.fillRect(-2, 1, 4, 3);
  } else if (ghost.state === 'jumping') {
    // Determined clenched teeth
    ctx.fillStyle = '#400000';
    ctx.fillRect(-1, 2, 4, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 2, 2, 1);
  } else if (ghost.state === 'falling') {
    // Startled drop mouth
    ctx.fillStyle = '#5c0000';
    ctx.fillRect(-2, 2, 4, 2);
  } else if (ghost.state === 'running') {
    // Gritting teeth running fast
    ctx.fillStyle = '#400000';
    ctx.fillRect(-1, 2, 4, 1.5);
  } else {
    // Neutral idle mouth
    ctx.fillStyle = '#5c0000';
    ctx.fillRect(-1, 3, 3, 1);
  }

  ctx.restore();
}

/**
 * Renders the gory death burst a ghost produces when it reaches its death frame:
 * an expanding shockwave ring, a white flash, and flying meat chunks that fade
 * out as `deathProgress` approaches 1. Deterministic per attempt for repeatable
 * scrubbing.
 */
export function renderDeathBurst(
  ctx: CanvasRenderingContext2D,
  ghost: ReplayGhost,
  cameraX: number = 0,
  cameraY: number = 0
): void {
  const p = clamp01(ghost.deathProgress);
  const cx = ghost.x + 7 - cameraX;
  const cy = ghost.y + 7 - cameraY;
  const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
  const radius = 6 + ease * 26;
  const fade = 1 - p;

  ctx.save();
  ctx.globalAlpha = fade;

  // Expanding shockwave ring
  ctx.strokeStyle = ghost.isWinning
    ? 'rgba(255, 215, 0, 0.9)'
    : (ghost.tint === 'white' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 80, 80, 0.9)');
  ctx.lineWidth = 0.5 + 2.5 * fade;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Central white flash during the first 40% of the burst
  if (p < 0.4) {
    ctx.globalAlpha = 0.85 * (1 - p / 0.4);
    ctx.fillStyle = '#fff2f2';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0, 9 * (1 - p * 1.6)), 0, Math.PI * 2);
    ctx.fill();
  }

  // Flying meat chunks (deterministic per attempt)
  const chunkCount = 10;
  const seed = ghost.attemptId * 0.7;
  for (let i = 0; i < chunkCount; i++) {
    const angle = (i / chunkCount) * Math.PI * 2 + seed;
    const dist = radius * (0.55 + 0.45 * Math.abs(Math.sin(seed + i * 1.7)));
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist * 0.8;
    const size = 1 + 3 * fade;
    ctx.globalAlpha = fade;
    ctx.fillStyle = i % 2 === 0 ? ghost.color : '#7f1d1d';
    ctx.fillRect(px - size / 2, py - size / 2, size, size);
  }

  ctx.restore();
}

/**
 * Standalone batch ghost renderer for any canvas rendering engine.
 */
export function renderReplayGhosts(
  ctx: CanvasRenderingContext2D,
  ghosts: ReplayGhost[],
  cameraX: number = 0,
  cameraY: number = 0,
  options: GhostRenderOptions = {}
): void {
  const activeGhosts = ghosts
    .filter(g => !g.isDead || g.justDied)
    .sort((a, b) => (a.isWinning ? 1 : 0) - (b.isWinning ? 1 : 0));

  for (const ghost of activeGhosts) {
    renderGhost(ctx, ghost, cameraX, cameraY, options);
  }
}
