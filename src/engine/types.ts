/**
 * Super Meat Boy Web Engine - Shared Core Types
 * Used across physics, rendering, particles, audio, and level management.
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Tile classifications for collision detection and level rendering.
 */
export enum TileType {
  EMPTY = 0,
  SOLID = 1,
  ONE_WAY = 2,
  CRUMBLED = 3,
  HAZARD = 4,
  LAVA = 5,
  SPIKE = 6,
  // Directional & slope variants
  SPIKE_UP = 6,
  SPIKE_DOWN = 7,
  SPIKE_LEFT = 8,
  SPIKE_RIGHT = 9,
  SLOPE_UP_RIGHT = 10,
  SLOPE_UP_LEFT = 11,
  SLOPE_CEIL_RIGHT = 12,
  SLOPE_CEIL_LEFT = 13,
}

/**
 * Entity types supported in the Super Meat Boy engine.
 */
export type EntityType = 
  | 'meatboy_start'
  | 'bandage_girl'
  | 'saw'
  | 'crumble_block'
  | 'key'
  | 'lock'
  | 'warp_zone'
  | 'bandage'
  | 'boss';

/**
 * Entity properties specifying behavior, motion paths, and visual parameters.
 */
export interface EntityProperties {
  radius?: number;
  patrolPoints?: Array<{ x: number; y: number }>;
  speed?: number;
  angle?: number;
  rotation?: number;
  rotSpeed?: number;
  bladeSize?: 'small' | 'medium' | 'large';
  respawnTimer?: number;
  targetId?: string;
  count?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  [key: string]: any;
}

/**
 * Core entity definition with both structured sub-objects and flat properties.
 */
export interface Entity {
  id: string;
  type: EntityType;
  position?: { x: number; y: number };
  dimensions?: { width: number; height: number };
  properties?: EntityProperties;

  // Direct accessors for physics engine and renderer backwards compatibility
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  rotation?: number;
  speed?: number;
  angle?: number;
  patrolPoints?: { x: number; y: number }[];
  active?: boolean;
  collected?: boolean;
  state?: string;
  timer?: number;
  [key: string]: any;
}

/**
 * Bounding rectangle for level containment and camera panning limits.
 */
export interface LevelBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Multi-layer tile grids for rendering and collision.
 */
export interface LevelLayers {
  foreground?: number[][];
  background?: number[][];
  collision: number[][]; // [row / y][col / x] -> TileType
}

/**
 * Complete level dataset defining tilemaps, entities, bounds, and par times.
 */
export interface ParallaxLayer {
  color: [number, number, number, number];
  speed: number;
}

export interface LevelData {
  id: string;
  name: string;
  chapter: number | string;
  theme: string; // 'forest', 'hospital', 'salt_factory', 'hell', 'rapture', 'the_end', 'retro'
  isDarkWorld: boolean;
  width: number;  // in tiles
  height: number; // in tiles
  tileSize: number; // usually 16 or 20
  layers?: LevelLayers;
  parallaxLayers?: ParallaxLayer[];
  tileGrid: number[][]; // [y][x] -> TileType (direct alias for layers.collision)
  entities: Entity[];
  startPos: { x: number; y: number };
  goalPos: { x: number; y: number };
  bounds: LevelBounds;
  targetTime?: number; // in seconds (for A+ grade)
  parTime: number; // direct alias for targetTime
}

export type CharacterSpecial =
  | 'double_jump'
  | 'float'
  | 'wall_stick'
  | 'gravity_flip'
  | 'multi_flap'
  | 'sticky'
  | 'none';

/**
 * Character movement physics parameters.
 */
export interface CharacterProps {
  id: string;
  name: string;
  runSpeed: number;         // Primary movement speed (e.g. 250)
  maxSpeed?: number;        // Maximum horizontal speed (e.g. 350)
  jumpImpulse: number;      // Vertical impulse upon jump trigger (e.g. -550)
  jumpHoldGravity: number;  // Gravity acceleration while holding jump button
  wallFriction?: number;    // Vertical friction / slide speed reduction on walls
  wallJumpX: number;        // Horizontal impulse on wall kick-off (e.g. 380)
  wallJumpY: number;        // Vertical impulse on wall kick-off (e.g. -500)

  // Extended engine parameters
  sprintSpeed: number;
  acceleration: number;
  airAcceleration: number;
  normalGravity: number;
  maxFallSpeed: number;
  wallSlideSpeed: number;
  wallJumpControlLockout: number;
  color: string;
  unlocked: boolean;
  specialAbility?: CharacterSpecial;
  maxAirJumps?: number;
  floatTimerMax?: number;
}

/**
 * Comprehensive player runtime state for physics calculations and animation.
 */
export interface PlayerState {
  // Structured vector and direction fields
  pos?: { x: number; y: number };
  vel?: { x: number; y: number };
  squashStretch?: { x: number; y: number };
  wallDirection?: -1 | 0 | 1;
  runTimer?: number;

  // Flat aliases for physics engine and player controller compatibility
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  isGrounded: boolean;
  isWallSliding: boolean;
  wallDir: -1 | 0 | 1;
  isSprinting: boolean;
  isJumping: boolean;
  jumpHeld: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  wallJumpLockoutTimer: number;
  squashX: number;
  squashY: number;
  isDead: boolean;
  isWin: boolean;
  deathTimer: number;
  /** Cause recorded when `isDead` becomes true (used by the replay system). */
  deathCause?: DeathCause;
  airJumpsLeft?: number;
  floatTimer?: number;
  gravityInverted?: boolean;
}

/**
 * Helper to construct an initialized PlayerState instance.
 */
export function createPlayerState(startX: number = 0, startY: number = 0): PlayerState {
  return {
    pos: { x: startX, y: startY },
    vel: { x: 0, y: 0 },
    squashStretch: { x: 1.0, y: 1.0 },
    wallDirection: 0,
    runTimer: 0,

    x: startX,
    y: startY,
    vx: 0,
    vy: 0,
    width: 14,
    height: 16,
    facing: 1,
    isGrounded: false,
    isWallSliding: false,
    wallDir: 0,
    isSprinting: false,
    isJumping: false,
    jumpHeld: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    wallJumpLockoutTimer: 0,
    squashX: 1.0,
    squashY: 1.0,
    isDead: false,
    isWin: false,
    deathTimer: 0,
  };
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  jumpPressed: boolean;
  sprint: boolean;
  restart: boolean;
  pause: boolean;
}

export interface ReplayFrame {
  t: number; // time in seconds
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  squashX: number;
  squashY: number;
  state: 'idle' | 'running' | 'jumping' | 'falling' | 'wall_sliding' | 'dead' | 'won';
}

/**
 * Reason a run attempt ended in death. Drives the death-burst visual and
 * the death-marker metadata in the multi-ghost replay system.
 */
export type DeathCause =
  | 'saw'      // spinning buzzsaw
  | 'needles'  // spikes / needles
  | 'crumble'  // crushed / dropped by a crumbling block
  | 'lava'     // lava / fire hazard
  | 'fall'     // fell out of the level
  | 'unknown'; // manual reset or unrecognized hazard

export interface ReplayAttempt {
  attemptId: number;
  characterId: string;
  frames: ReplayFrame[];
  outcome: 'died' | 'won';
  duration: number;
  deathPosition?: { x: number; y: number };
  /** Exact timestamp (seconds) at which this failed attempt died. */
  deathTime?: number;
  /** Cause of death for this failed attempt. */
  deathCause?: DeathCause;
}

// Rendering types
export type PlayerExpression = 'normal' | 'determined' | 'startled' | 'panicked' | 'smiling' | 'dead';

export interface PlayerRenderState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facingRight: boolean;
  onGround: boolean;
  onWall: boolean;
  wallDir: -1 | 1 | 0;
  isDead: boolean;
  deathTimer?: number;
  isJumping: boolean;
  isFalling: boolean;
  isSliding: boolean;
  squashX: number; // 1.0 = normal, >1 = horizontal stretch/squash
  squashY: number; // 1.0 = vertical stretch
  expression?: PlayerExpression;
  stateTime: number;
  color?: string; // default red #d62828
}

export interface SawBladeEntity {
  id: string | number;
  x: number;
  y: number;
  radius: number;
  angle: number;
  rotSpeed: number; // rad/s
  bloodStain?: number; // 0.0 to 1.0
  path?: Vector2[];
}

export type SpikeDirection = 'up' | 'down' | 'left' | 'right';

export interface SpikeEntity {
  id?: string | number;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: SpikeDirection;
  count?: number; // number of spike teeth along length
}

export type CrumbleBlockState = 'idle' | 'shaking' | 'falling' | 'destroyed' | 'respawning';

export interface CrumbleBlockEntity {
  id: string | number;
  x: number;
  y: number;
  width: number;
  height: number;
  state: CrumbleBlockState;
  timer: number;
  shakeOffset?: Vector2;
  fallSpeed?: number;
}

export interface BandageGirlEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  rescued: boolean;
  animTime: number;
  facingLeft?: boolean;
}

export interface CameraConfig {
  viewportWidth: number;
  viewportHeight: number;
  lerpSpeed: number; // default 8 - 12
  leadAheadDistance: number; // horizontal look-ahead based on player velocity
}

export interface TilemapLayer {
  tiles: number[]; // 1D array of width * height
  width: number; // columns
  height: number; // rows
  tileSize: number;
}

export interface LevelRenderData {
  id: string;
  name: string;
  chapter: string; // 'forest' | 'hospital' | 'factory' | 'hell' | 'rapture' | 'end'
  width: number; // pixel width
  height: number; // pixel height
  tileSize: number;
  foregroundTiles: number[] | number[][]; // tile grid
  backgroundTiles?: number[] | number[][]; // background tile grid
  tileCols: number;
  tileRows: number;
  saws: SawBladeEntity[];
  spikes: SpikeEntity[];
  crumbleBlocks: CrumbleBlockEntity[];
  bandageGirl: BandageGirlEntity;
  spawnPoint: Vector2;
  bounds: Rect;
}
