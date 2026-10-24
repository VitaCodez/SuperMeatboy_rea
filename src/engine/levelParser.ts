/**
 * Super Meat Boy Binary Level (.smbl) Parser & Loader
 *
 * Implements the real TL02 ("20LT") / TL01 ("10LT") level container:
 *
 *   magic (u32) | version (u32) | palette block (0xFF + 256 bytes)
 *   spawnX (f32) | spawnY (f32) | width (u16) | height (u16)
 *   8 x layer descriptor (4 f32 + i32)
 *   3 x RLE layer word counts (i32)
 *   3 x RLE layer payload (u32 entries: 10-bit run, 22-bit tile value)
 *   8 x object-group counts (i32)
 *   objects (50 bytes each: x,y,z,w,h f32, A,B,C,D i32, E,F,G f32, H u16)
 *   4 x f32 design bounds (unused for camera clamping)
 *
 * Coordinates in the file use a centre origin with +Y up. The engine uses a
 * top-left origin with +Y down, so tiles and objects are converted here.
 *
 * Level dimensions are stored as width then height; tile rows are stored
 * bottom-to-top, so row 0 of the file is the bottom of the level.
 */

import { LevelData, TileType, Entity, LevelLayers, ParallaxLayer } from './types';
import { getLevelMeta } from './chapterMetadata';
import { CHAPTER_1_FALLBACK_LEVELS, getAllChapter1Levels } from './levels/chapter1';
import { getOtherChapterLevel } from './levels/otherChapters';

/** Magic numbers for Super Meat Boy level files (little-endian) */
export const SMBL_MAGIC_TL02 = 0x544c3032; // "20LT"
export const SMBL_MAGIC_TL01 = 0x544c3031; // "10LT"
export const SMBL_FOOTER_TEND = 0x54454e44; // "DNET"

/** Palette name mappings to normalized game theme identifiers */
const PALETTE_THEME_MAP: Record<string, string> = {
  forest: 'forest',
  hospital: 'hospital',
  factory: 'salt_factory',
  salt: 'salt_factory',
  hell: 'hell',
  rapture: 'rapture',
  end: 'the_end',
  the_end: 'the_end',
  retro1: 'retro',
  retro2: 'retro',
  retro3: 'retro',
  retro4: 'retro',
  retro5: 'retro',
  retro6: 'retro',
  retro7: 'retro',
  '4bit1': 'retro',
  '4bit2': 'retro',
  '4bit3': 'retro',
  '4bit4': 'retro',
  glitch: 'forest',
};

const TILE_SIZE = 20;
const PALETTE_BLOB_SIZE = 256;
const OBJECT_SIZE = 50;
const OBJECT_CAP = 400;

class Reader {
  private readonly view: DataView;
  private readonly bytes: Uint8Array;
  public pos = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get length(): number {
    return this.bytes.length;
  }

  get remaining(): number {
    return this.bytes.length - this.pos;
  }

  private need(n: number): void {
    if (this.pos + n > this.bytes.length) {
      throw new Error(`SMBL truncated: need ${n} bytes at 0x${this.pos.toString(16)}`);
    }
  }

  u8(): number {
    this.need(1);
    return this.bytes[this.pos++];
  }

  u16(): number {
    this.need(2);
    const v = this.view.getUint16(this.pos, true);
    this.pos += 2;
    return v;
  }

  u32(): number {
    this.need(4);
    const v = this.view.getUint32(this.pos, true);
    this.pos += 4;
    return v;
  }

  i32(): number {
    this.need(4);
    const v = this.view.getInt32(this.pos, true);
    this.pos += 4;
    return v;
  }

  f32(): number {
    this.need(4);
    const v = this.view.getFloat32(this.pos, true);
    this.pos += 4;
    return v;
  }

  take(n: number): Uint8Array {
    this.need(n);
    const v = this.bytes.subarray(this.pos, this.pos + n);
    this.pos += n;
    return v;
  }
}

interface RawObject {
  group: number;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  hBits: number;
}

interface ParsedBinary {
  isTL01: boolean;
  theme: string;
  width: number;
  height: number;
  spawnWorld: { x: number; y: number };
  layers: number[][];
  parallaxLayers: ParallaxLayer[];
  objects: RawObject[];
  boundsWorld: { minX: number; minY: number; maxX: number; maxY: number } | null;
}

function readPalette(r: Reader): string {
  // Real files use a 0xFF marker followed by a fixed 256-byte block whose
  // first bytes are the null-terminated palette filename (e.g. "forest.lp").
  const marker = r.u8();
  if (marker === 0xff) {
    const blob = r.take(PALETTE_BLOB_SIZE);
    let end = 0;
    while (end < blob.length && blob[end] !== 0) end++;
    return String.fromCharCode(...Array.from(blob.subarray(0, end))).trim().toLowerCase();
  }

  // Legacy/alternate variant: length-prefixed name.
  const length = marker;
  const name = r.take(Math.max(0, length)).subarray(0, length);
  let end = 0;
  while (end < name.length && name[end] !== 0) end++;
  return String.fromCharCode(...Array.from(name.subarray(0, end))).trim().toLowerCase();
}

function decodeRleLayer(r: Reader, count: number, expectedCells: number): number[] {
  const cells: number[] = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const word = r.u32();
    const run = word >>> 22;
    const value = word & 0x3fffff;
    if (run === 0) continue;
    total += run;
    if (total > expectedCells) {
      throw new Error(`SMBL RLE overflow: ${total} > ${expectedCells}`);
    }
    for (let k = 0; k < run; k++) cells.push(value);
  }
  if (cells.length !== expectedCells) {
    throw new Error(`SMBL RLE size mismatch: ${cells.length} != ${expectedCells}`);
  }
  return cells;
}

function parseBinary(bytes: Uint8Array): ParsedBinary {
  if (bytes.length < 16) {
    throw new Error(`Invalid SMBL file: byte length (${bytes.length}) too short.`);
  }
  const r = new Reader(bytes);

  const magic = r.u32();
  const isTL02 = magic === SMBL_MAGIC_TL02;
  const isTL01 = magic === SMBL_MAGIC_TL01;
  if (!isTL02 && !isTL01) {
    const ascii = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    if (ascii !== '20LT' && ascii !== '10LT') {
      throw new Error(
        `Invalid SMBL magic header: 0x${magic.toString(16)} ('${ascii}'). Expected '20LT' or '10LT'.`
      );
    }
  }

  const version = r.u32();
  if (version !== 7) {
    // Version 7 is what the shipped PC levels use. Be lenient for mods but
    // keep parsing, because the payload layout has been stable.
  }

  const palette = readPalette(r);
  const cleanPal = palette.replace(/\.lp$/, '');
  const theme = PALETTE_THEME_MAP[cleanPal] || (cleanPal.includes('forest') ? 'forest' : 'forest');

  const spawnX = r.f32();
  const spawnY = r.f32();
  const width = r.u16();
  const height = r.u16();

  if (width < 5 || width > 512 || height < 5 || height > 512) {
    throw new Error(`SMBL invalid dimensions ${width}x${height}`);
  }

  const parallaxLayers: ParallaxLayer[] = [];
  for (let i = 0; i < 8; i++) {
    const red = r.f32();
    const green = r.f32();
    const blue = r.f32();
    const alpha = r.f32();
    const speed = r.f32();
    parallaxLayers.push({ color: [red, green, blue, alpha], speed });
  }

  const layerCounts = [r.i32(), r.i32(), r.i32()];
  const expectedCells = width * height;
  for (const count of layerCounts) {
    if (count < 0 || count > expectedCells) {
      throw new Error(`SMBL invalid layer RLE count ${count}`);
    }
  }

  const layers: number[][] = [];
  for (let i = 0; i < 3; i++) {
    layers.push(decodeRleLayer(r, layerCounts[i], expectedCells));
  }

  const groupCounts = [0, 0, 0, 0, 0, 0, 0, 0];
  let totalObjects = 0;
  for (let i = 0; i < 8; i++) {
    groupCounts[i] = r.i32();
    if (groupCounts[i] < 0) throw new Error(`SMBL invalid object count ${groupCounts[i]}`);
    totalObjects += groupCounts[i];
  }
  if (totalObjects > OBJECT_CAP) {
    throw new Error(`SMBL object count ${totalObjects} exceeds cap ${OBJECT_CAP}`);
  }

  const objects: RawObject[] = [];
  for (let group = 0; group < 8; group++) {
    for (let i = 0; i < groupCounts[group]; i++) {
      const x = r.f32();
      const y = r.f32();
      const z = r.f32();
      const w = r.f32();
      const h = r.f32();
      // A is a float (rotation/angle); B is the integer entity type id.
      const a = r.f32();
      const b = r.i32();
      const c = r.i32();
      const d = r.i32();
      const e = r.f32();
      const f = r.f32();
      const g = r.f32();
      const hBits = r.u16();
      objects.push({ group, x, y, z, w, h, a, b, c, d, e, f, g, hBits });
    }
  }

  // Design bounds are stored as (minX, minY, maxX, maxY) in world units.
  let boundsWorld: ParsedBinary['boundsWorld'] = null;
  if (r.remaining >= 16) {
    boundsWorld = { minX: r.f32(), minY: r.f32(), maxX: r.f32(), maxY: r.f32() };
  }

  return {
    isTL01,
    theme,
    width,
    height,
    spawnWorld: { x: spawnX, y: spawnY },
    layers,
    parallaxLayers,
    objects,
    boundsWorld,
  };
}

/** Convert a file-space world coordinate (centre origin, +Y up) to engine space. */
function worldToEngine(x: number, y: number, width: number, height: number): { x: number; y: number } {
  return {
    x: x + (width * TILE_SIZE) / 2,
    y: (height * TILE_SIZE) / 2 - y,
  };
}

const SAW_TYPE_MIN = 17;
const SAW_TYPE_MAX = 29;

function isSawObject(o: RawObject): boolean {
  if (o.w < 40 || o.h < 40) return false;
  // Group 4 is the editor's active layer and holds the normal saws. Groups
  // 0/1/3/6 also contain background saw sprites that must not be lethal.
  if (o.group === 4) {
    if (o.b >= SAW_TYPE_MIN && o.b <= SAW_TYPE_MAX) return true;
    if (o.b >= 5 && o.b <= 8) return true;
  }
  // "The Levee" (1-10) embeds its wall saws in the mid layer with 308x ids.
  if (o.group === 2 && o.b >= 3080 && o.b <= 3099) return true;
  return false;
}

function isCrumbleObject(o: RawObject): boolean {
  return o.group === 4 && o.w >= 40 && o.h >= 40 && o.b >= 1030 && o.b <= 1050;
}

// Small "trigger" ids that appear next to saws/particles and are not exits.
const GOAL_IGNORED_IDS = new Set([12308, 12317, 12329, 12332, 12333, 12337, 12345]);

function isGoalObject(o: RawObject): boolean {
  if (o.w > 3 || o.h > 3) return false;
  if (o.b === 12300) return true;
  if (o.group === 4) {
    if (o.b >= 12288 && o.b <= 12399 && !GOAL_IGNORED_IDS.has(o.b)) return true;
    if (o.b >= 13300 && o.b <= 13399) return true;
    if (o.b >= 14350 && o.b <= 14399) return true;
  }
  // Some exits are emitted on the general layer instead of the active layer.
  if (o.group === 0) {
    if (o.b >= 12288 && o.b <= 12399 && !GOAL_IGNORED_IDS.has(o.b)) return true;
    if (o.b === 13324 || o.b === 13340 || o.b === 13342) return true;
  }
  return false;
}

function goalTypeScore(o: RawObject): number {
  if (o.b === 12300) return 0;
  if (o.b >= 12290 && o.b <= 12399) return 10 + Math.abs(o.b - 12300);
  if (o.b >= 13300 && o.b <= 13399) return 200 + Math.abs(o.b - 13324);
  return 400 + Math.abs(o.b - 14364);
}

function isBandageObject(o: RawObject): boolean {
  return o.b === 512 && (Math.abs(o.x) > 1 || Math.abs(o.y) > 1);
}

/**
 * Parses raw binary .smbl data into typed LevelData.
 *
 * @param buffer Raw ArrayBuffer or Uint8Array containing .smbl binary data
 * @param levelName Optional override name for the level (e.g. "1-1: Hello World")
 * @returns Fully populated and validated LevelData structure
 */
export function parseSMBL(buffer: ArrayBuffer | Uint8Array, levelName?: string): LevelData {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const binary = parseBinary(bytes);
  const { width, height, layers, objects } = binary;

  // Determine level ID from levelName or default
  const levelIdMatch = levelName ? levelName.match(/(\d+-\d+[x]?)/i) : null;
  const levelId = levelIdMatch ? levelIdMatch[1].toLowerCase() : 'custom';
  const isDarkWorld = levelId.includes('x');

  // Convert the three stored tile layers from bottom-up file rows to top-down
  // engine rows. Layer 0 is the active/collision layer; 1 and 2 are decor.
  const toGrid = (flat: number[]): number[][] => {
    const grid: number[][] = [];
    for (let row = 0; row < height; row++) {
      const fileRow = height - 1 - row;
      const line: number[] = new Array(width);
      for (let col = 0; col < width; col++) {
        line[col] = flat[fileRow * width + col];
      }
      grid.push(line);
    }
    return grid;
  };

  const rawForeground = toGrid(layers[0]);
  const rawBackground = toGrid(layers[1]);
  const rawOverlay = toGrid(layers[2]);

  const collision: number[][] = [];
  for (let row = 0; row < height; row++) {
    const line: number[] = new Array(width);
    for (let col = 0; col < width; col++) {
      const value = rawForeground[row][col];
      line[col] = value === 0 ? TileType.EMPTY : TileType.SOLID;
    }
    collision.push(line);
  }

  // Spawn: the header stores the world-space centre of Meat Boy. The engine
  // positions the player by top-left corner (14x16 collision box).
  const spawn = worldToEngine(binary.spawnWorld.x, binary.spawnWorld.y, width, height);
  const startPos = { x: spawn.x - 7, y: spawn.y - 8 };

  const entities: Entity[] = [];
  entities.push({
    id: `start-${levelId}`,
    type: 'meatboy_start',
    position: { ...startPos },
    dimensions: { width: 14, height: 16 },
    x: startPos.x,
    y: startPos.y,
    width: 14,
    height: 16,
  });

  const goalCandidates = objects.filter(isGoalObject).sort((a, b) => {
    // Prefer the active layer, the canonical 12300 exit, then other exit ids.
    const score = (o: RawObject) => (o.group === 4 ? 0 : 1000) + goalTypeScore(o);
    return score(a) - score(b);
  });
  const goalObject = goalCandidates[0] ?? null;
  const goalCenter = goalObject
    ? worldToEngine(goalObject.x, goalObject.y, width, height)
    : { x: (width - 4) * TILE_SIZE, y: (height - 4) * TILE_SIZE };

  const goalPos = { x: goalCenter.x - 8, y: goalCenter.y - 18 };
  entities.push({
    id: `goal-${levelId}`,
    type: 'bandage_girl',
    position: { ...goalPos },
    dimensions: { width: 16, height: 18 },
    x: goalPos.x,
    y: goalPos.y,
    width: 16,
    height: 18,
  });

  let sawIndex = 0;
  let crumbleIndex = 0;
  for (const o of objects) {
    if (isGoalObject(o)) continue;
    const center = worldToEngine(o.x, o.y, width, height);

    if (isSawObject(o)) {
      sawIndex++;
      const radius = Math.max(8, Math.min(o.w, o.h) / 2);
      entities.push({
        id: `saw-${levelId}-${sawIndex}`,
        type: 'saw',
        position: { x: center.x, y: center.y },
        dimensions: { width: o.w, height: o.h },
        x: center.x,
        y: center.y,
        width: o.w,
        height: o.h,
        radius,
        rotation: o.a,
        speed: 12,
      });
    } else if (isCrumbleObject(o)) {
      crumbleIndex++;
      entities.push({
        id: `crumble-${levelId}-${crumbleIndex}`,
        type: 'crumble_block',
        position: { x: center.x - o.w / 2, y: center.y - o.h / 2 },
        dimensions: { width: o.w, height: o.h },
        x: center.x - o.w / 2,
        y: center.y - o.h / 2,
        width: o.w,
        height: o.h,
        state: 'idle',
        timer: 0,
      });
    } else if (isBandageObject(o)) {
      entities.push({
        id: `bandage-${levelId}-${entities.length}`,
        type: 'bandage',
        position: { x: center.x - 8, y: center.y - 8 },
        dimensions: { width: 16, height: 16 },
        x: center.x - 8,
        y: center.y - 8,
        width: 16,
        height: 16,
        collected: false,
      });
    }
  }

  const layersOut: LevelLayers = {
    collision,
    foreground: rawForeground,
    background: rawBackground,
    // Overlay is stored on the object so mods can render it without changing
    // the public LevelLayers contract.
  };
  (layersOut as any).overlay = rawOverlay;

  const fallback = CHAPTER_1_FALLBACK_LEVELS[levelId];
  const parTime = fallback?.parTime ?? 10;

  return {
    id: levelId,
    name: levelName || fallback?.name || `${levelId}: Custom Level`,
    chapter: parseInt(levelId.split('-')[0], 10) || 1,
    theme: binary.theme,
    isDarkWorld,
    width,
    height,
    tileSize: TILE_SIZE,
    layers: layersOut,
    parallaxLayers: binary.parallaxLayers,
    tileGrid: collision,
    entities,
    startPos,
    goalPos,
    bounds: {
      minX: 0,
      minY: 0,
      maxX: width * TILE_SIZE,
      maxY: height * TILE_SIZE,
    },
    targetTime: parTime,
    parTime,
  };
}

/**
 * Loads a level asynchronously, checking for local .smbl files first and
 * falling back to pre-baked layouts if in a browser sandbox.
 *
 * @param chapter Chapter number (e.g. 1)
 * @param level Level number (e.g. 1 to 20)
 * @param isDark Whether to load Dark World variant
 * @returns Promise resolving to the loaded LevelData
 */
export async function loadLevel(
  chapter: number | string,
  level: number | string,
  isDark: boolean = false
): Promise<LevelData> {
  const chNum = typeof chapter === 'number' ? chapter : parseInt(chapter, 10) || 1;
  const lvlNum = typeof level === 'number' ? level : parseInt(level, 10) || 1;
  const isBoss = lvlNum === 21 || level === 'boss' || level === 'boss1';
  const levelId = isBoss && chNum === 1 ? '1-21' : `${chapter}-${level}${isDark ? 'x' : ''}`;
  const filename = isBoss ? `boss${chNum}.smbl` : `${levelId}.smbl`;

  try {
    if (typeof fetch === 'function' && typeof window !== 'undefined') {
      const response = await fetch(`/assets/levels/${filename}`);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const meta = getLevelMeta(chNum, isBoss ? 21 : lvlNum, isDark);
        const displayName = isBoss ? meta.name : `${chNum}-${lvlNum}: ${meta.name}`;
        return parseSMBL(buffer, displayName);
      }
      console.warn(`[levelParser] Failed to fetch ${filename} (${response.status}); using offline fallback.`);
    }
  } catch (err) {
    console.warn(`[levelParser] Failed to load ${filename}; using offline fallback.`, err);
  }

  return getLevel(levelId);
}

/**
 * Synchronous level retrieval from pre-baked catalog.
 * Guarantees instantaneous, non-blocking return of valid LevelData.
 *
 * @param id Level ID (e.g. "1-1", "1-20")
 * @returns LevelData instance
 */
export function getLevel(id: string): LevelData {
  const cleanId = id.trim().toLowerCase();
  const found = CHAPTER_1_FALLBACK_LEVELS[cleanId];
  if (found) {
    return found;
  }

  if (cleanId === '1-21' || cleanId === 'boss1') {
    return CHAPTER_1_FALLBACK_LEVELS['1-21'];
  }

  const match = cleanId.match(/^(\d+)-(\d+)/);
  if (match) {
    const ch = parseInt(match[1], 10);
    const lvl = parseInt(match[2], 10);
    if (ch >= 2 && ch <= 7) {
      return getOtherChapterLevel(ch, lvl);
    }
  }

  return CHAPTER_1_FALLBACK_LEVELS['1-1'];
}

/**
 * Returns all 20 pre-baked Chapter 1 levels in sequential order.
 */
export function getPrebakedChapter1Levels(): LevelData[] {
  return getAllChapter1Levels();
}

export { CHAPTER_1_FALLBACK_LEVELS };
export { getAllChapter1Levels };
