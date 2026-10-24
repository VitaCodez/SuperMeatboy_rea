/**
 * Super Meat Boy - Tile Palette & Blob Autotiler
 *
 * -----------------------------------------------------------------------------
 * ASSET / FORMAT FINDINGS (see ARCHITECTURE + tools/extract_all.py)
 * -----------------------------------------------------------------------------
 * `.smbl` levels store a plain 2-D grid of tile ids (0 = empty). The visual
 * tileset for a theme comes from the theme palette (`.lp`), e.g. `forest.lp`:
 *
 *     tiles {
 *         texturepackage="foresttiles01.tp";   // -> textures/.../foresttiles01.png
 *         packageindex=0;
 *         tilesize=60;                         // pixel size of one tile in the atlas
 *         numtiles=100;                        // 10 x 10 grid
 *     }
 *
 * The tiles texture is a uniform 600x600 grid (100 tiles, 10x10): tile index N
 * lives at (N % columns, floor(N / columns)).
 *
 * -----------------------------------------------------------------------------
 * AUTOTILING
 * -----------------------------------------------------------------------------
 * Reconstructs authentic chapter terrain autotiling:
 * Bit order (fixed):  N = 1, E = 2, S = 4, W = 8.
 * `cardinal` = bitmask of neighbouring solid tiles (closed sides).
 * `open`     = complement of `cardinal` (sides the tile is exposed on).
 */

import { TileType } from './types';

/** Pixel sub-rectangle sampled from a tileset texture. */
export interface TileRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** radians; 0 or Math.PI / 2 for SMB `.itx` atlases. */
  rot: number;
}

/** Normalised rectangle from an `.itx` coordinate table. */
export interface ItxEntry {
  u: number;
  v: number;
  w: number;
  h: number;
  rot: number;
}

/**
 * Geometry of a uniform tileset atlas. Every palette theme declares
 * `tilesize` + `numtiles`; texture dimensions are read at load time.
 */
export interface TileAtlas {
  /** texture width in pixels */
  width: number;
  /** texture height in pixels */
  height: number;
  /** palette `tilesize` */
  tileSize: number;
  /** palette `numtiles` */
  numTiles: number;
  /** columns in the grid; defaults to floor(width / tileSize) */
  columns?: number;
  /** rows in the grid; defaults to ceil(numTiles / columns) */
  rows?: number;
}

/** Neighbour lookup result for one cell. */
export interface NeighborInfo {
  n: boolean;
  e: boolean;
  s: boolean;
  w: boolean;
  ne: boolean;
  se: boolean;
  sw: boolean;
  nw: boolean;
  /** 4-bit mask of solid cardinal neighbours (N=1,E=2,S=4,W=8). */
  cardinal: number;
  /** 8-bit mask of solid neighbours (N=1,E=2,S=4,W=8,NE=16,SE=32,SW=64,NW=128). */
  full: number;
  /** 4-bit mask of exposed sides (complement of `cardinal`). */
  open: number;
}

/** True when a raw grid value should be treated as collidable terrain. */
export type SolidPredicate = (value: number) => boolean;

/** Semantic tile names used to map a mask to a sheet index. */
export type TileSemantic =
  | 'interior'
  | 'grassTop'
  | 'dirtBottom'
  | 'rockLeft'
  | 'rockRight'
  | 'cornerTopLeft'
  | 'cornerTopRight'
  | 'cornerBottomLeft'
  | 'cornerBottomRight'
  | 'verticalColumn'
  | 'horizontalRow'
  | 'topEdge'
  | 'bottomEdge'
  | 'leftEdge'
  | 'rightEdge'
  | 'isolated';

/**
 * Mapping from the 4-bit open-side mask to a tile index in the sheet.
 * `cardinal` = N|E<<1|S<<2|W<<3; `open` = (~cardinal) & 0xF.
 */
export interface AutotileLayout {
  name: string;
  /** open-side mask (0-15) -> sheet tile index */
  open: Record<number, number>;
  /** optional full 8-bit mask (0-255) -> sheet tile index (overrides `open`) */
  corners?: Partial<Record<number, number>>;
}

/**
 * Canonical open-side -> semantic mapping (bit order N=1,E=2,S=4,W=8).
 * Every combination of exposed sides resolves to exactly one semantic.
 */
export const OPEN_MASK_SEMANTICS: Readonly<Record<number, TileSemantic>> = {
  0b0000: 'interior',
  0b0001: 'grassTop',
  0b0010: 'rockRight',
  0b0011: 'cornerTopRight',
  0b0100: 'dirtBottom',
  0b0101: 'verticalColumn',
  0b0110: 'cornerBottomRight',
  0b0111: 'rightEdge',
  0b1000: 'rockLeft',
  0b1001: 'cornerTopLeft',
  0b1010: 'horizontalRow',
  0b1011: 'topEdge',
  0b1100: 'cornerBottomLeft',
  0b1101: 'leftEdge',
  0b1110: 'bottomEdge',
  0b1111: 'isolated',
};

/** Chapter 1: The Forest Layout (foresttiles01.png) */
export const FOREST_TILE_LAYOUT: AutotileLayout = {
  name: 'forest',
  open: {
    0b0000: 1,  // interior           -> solid dirt centre
    0b0001: 2,  // grassTop           -> grass top, sides/bottom closed
    0b0100: 3,  // dirtBottom         -> dirt underside cap
    0b1000: 4,  // rockLeft           -> rocky left border
    0b0010: 5,  // rockRight          -> rocky right border
    0b0101: 6,  // verticalColumn     -> grass top over dirt bottom
    0b1010: 7,  // horizontalRow      -> thin platform (top+bottom closed)
    0b1011: 8,  // topEdge            -> 1-wide floor row
    0b1110: 9,  // bottomEdge         -> 1-wide ceiling row
    0b1101: 10, // leftEdge          -> 1-wide column, opens right
    0b0111: 11, // rightEdge         -> 1-wide column, opens left
    0b1001: 12, // cornerTopLeft     -> convex, opens N+W
    0b0011: 13, // cornerTopRight    -> convex, opens N+E
    0b1100: 14, // cornerBottomLeft  -> convex, opens S+W
    0b0110: 15, // cornerBottomRight -> convex, opens S+E
    0b1111: 16, // isolated          -> free-standing rock
  },
  corners: {},
};

/** Chapter 2: The Hospital Layout (hospitaltiles01.png) */
export const HOSPITAL_TILE_LAYOUT: AutotileLayout = {
  name: 'hospital',
  open: {
    0b0000: 1,  // steel beam interior
    0b0001: 2,  // clinical white tile top
    0b0100: 3,  // rusted underside
    0b1000: 4,  // left metal plating
    0b0010: 5,  // right metal plating
    0b0101: 6,  // narrow column
    0b1010: 7,  // thin catwalk
    0b1011: 8,  // platform top
    0b1110: 9,  // ceiling beam
    0b1101: 10, // left post
    0b0111: 11, // right post
    0b1001: 12, // top-left corner
    0b0011: 13, // top-right corner
    0b1100: 14, // bottom-left corner
    0b0110: 15, // bottom-right corner
    0b1111: 16, // isolated block
  },
  corners: {},
};

/** Chapter 3: The Salt Factory Layout (factorytiles01.png) */
export const SALT_FACTORY_TILE_LAYOUT: AutotileLayout = {
  name: 'salt_factory',
  open: {
    0b0000: 1,  // dark rusty steel interior
    0b0001: 2,  // salt-crusted industrial surface
    0b0100: 3,  // underside girder
    0b1000: 4,  // industrial left wall
    0b0010: 5,  // industrial right wall
    0b0101: 6,  // vertical pipe / pole
    0b1010: 7,  // conveyor rail
    0b1011: 8,  // factory floor
    0b1110: 9,  // factory ceiling
    0b1101: 10, // left edge girder
    0b0111: 11, // right edge girder
    0b1001: 12, // top-left factory corner
    0b0011: 13, // top-right factory corner
    0b1100: 14, // bottom-left corner
    0b0110: 15, // bottom-right corner
    0b1111: 16, // isolated girder block
  },
  corners: {},
};

/** Chapter 4: Hell Layout (helltiles01.png) */
export const HELL_TILE_LAYOUT: AutotileLayout = {
  name: 'hell',
  open: {
    0b0000: 1,  // obsidian core interior
    0b0001: 2,  // brimstone charred surface
    0b0100: 3,  // volcanic rock bottom
    0b1000: 4,  // hell rock left
    0b0010: 5,  // hell rock right
    0b0101: 6,  // molten rock column
    0b1010: 7,  // thin bridge of bone/rock
    0b1011: 8,  // fiery ledge
    0b1110: 9,  // stalactite ceiling
    0b1101: 10, // jagged left wall
    0b0111: 11, // jagged right wall
    0b1001: 12, // top-left brimstone corner
    0b0011: 13, // top-right brimstone corner
    0b1100: 14, // bottom-left corner
    0b0110: 15, // bottom-right corner
    0b1111: 16, // isolated skull rock
  },
  corners: {},
};

/** Chapter 5: Rapture Layout (rapturetiles01.png) */
export const RAPTURE_TILE_LAYOUT: AutotileLayout = {
  name: 'rapture',
  open: {
    0b0000: 1,  // crumbling city concrete interior
    0b0001: 2,  // broken asphalt street surface
    0b0100: 3,  // exposed rebar underside
    0b1000: 4,  // cracked skyscraper left facade
    0b0010: 5,  // cracked skyscraper right facade
    0b0101: 6,  // shattered pillar
    0b1010: 7,  // crumbling overpass beam
    0b1011: 8,  // rooftop edge
    0b1110: 9,  // crumbling underhang
    0b1101: 10, // window frame wall
    0b0111: 11, // window frame wall
    0b1001: 12, // top-left rubble corner
    0b0011: 13, // top-right rubble corner
    0b1100: 14, // bottom-left corner
    0b0110: 15, // bottom-right corner
    0b1111: 16, // isolated concrete chunk
  },
  corners: {},
};

/** Chapter 6: The End Layout (endtiles01.png) */
export const THE_END_TILE_LAYOUT: AutotileLayout = {
  name: 'the_end',
  open: {
    0b0000: 1,  // crystalline dark void interior
    0b0001: 2,  // cybernetic neon techno surface
    0b0100: 3,  // techno underside
    0b1000: 4,  // digital left boundary
    0b0010: 5,  // digital right boundary
    0b0101: 6,  // neon pillar
    0b1010: 7,  // digital platform
    0b1011: 8,  // glowing ledge
    0b1110: 9,  // techno ceiling
    0b1101: 10, // matrix column
    0b0111: 11, // matrix column
    0b1001: 12, // top-left void corner
    0b0011: 13, // top-right void corner
    0b1100: 14, // bottom-left corner
    0b0110: 15, // bottom-right corner
    0b1111: 16, // isolated glitch cube
  },
  corners: {},
};

/** Chapter 7: Cotton Alley / Retro Layout (retrotiles01.png) */
export const RETRO_TILE_LAYOUT: AutotileLayout = {
  name: 'retro',
  open: {
    0b0000: 1,  // retro block interior
    0b0001: 2,  // 8-bit grass / brick top
    0b0100: 3,  // 8-bit bottom
    0b1000: 4,  // 8-bit left
    0b0010: 5,  // 8-bit right
    0b0101: 6,  // 8-bit column
    0b1010: 7,  // 8-bit bridge
    0b1011: 8,  // 8-bit floor
    0b1110: 9,  // 8-bit ceiling
    0b1101: 10, // 8-bit wall
    0b0111: 11, // 8-bit wall
    0b1001: 12, // top-left corner
    0b0011: 13, // top-right corner
    0b1100: 14, // bottom-left corner
    0b0110: 15, // bottom-right corner
    0b1111: 16, // single retro block
  },
  corners: {},
};

/** Helper to resolve layout for any theme name */
export function getLayoutForTheme(theme: string): AutotileLayout {
  const norm = (theme || 'forest').toLowerCase();
  if (norm.includes('hosp') || norm === '2') return HOSPITAL_TILE_LAYOUT;
  if (norm.includes('fact') || norm.includes('salt') || norm === '3') return SALT_FACTORY_TILE_LAYOUT;
  if (norm.includes('hell') || norm === '4') return HELL_TILE_LAYOUT;
  if (norm.includes('rapt') || norm === '5') return RAPTURE_TILE_LAYOUT;
  if (norm.includes('end') || norm === '6') return THE_END_TILE_LAYOUT;
  if (norm.includes('retro') || norm.includes('cotton') || norm === '7') return RETRO_TILE_LAYOUT;
  return FOREST_TILE_LAYOUT;
}

/** Returns the canonical texture path for a chapter/theme */
export function getThemeTilesetPath(theme: string): string {
  const norm = (theme || 'forest').toLowerCase();
  if (norm.includes('hosp') || norm === '2') return '/assets/textures/LevelPalettes/hospitaltiles01.png';
  if (norm.includes('fact') || norm.includes('salt') || norm === '3') return '/assets/textures/LevelPalettes/factorytiles01.png';
  if (norm.includes('hell') || norm === '4') return '/assets/textures/LevelPalettes/helltiles01.png';
  if (norm.includes('rapt') || norm === '5') return '/assets/textures/LevelPalettes/rapturetiles01.png';
  if (norm.includes('end') || norm === '6') return '/assets/textures/LevelPalettes/endtiles01.png';
  if (norm.includes('retro') || norm.includes('cotton') || norm === '7') return '/assets/textures/LevelPalettes/retrotiles01.png';
  return '/assets/textures/LevelPalettes/foresttiles01.png';
}

/** Returns the canonical parallax background path for a chapter/theme */
export function getThemeBackgroundPath(theme: string): string {
  const norm = (theme || 'forest').toLowerCase();
  if (norm.includes('hosp') || norm === '2') return '/assets/textures/LevelPalettes/hospitalbg.png';
  if (norm.includes('fact') || norm.includes('salt') || norm === '3') return '/assets/textures/LevelPalettes/factoryp01.png';
  if (norm.includes('hell') || norm === '4') return '/assets/textures/LevelPalettes/hellp.png';
  if (norm.includes('rapt') || norm === '5') return '/assets/textures/LevelPalettes/rapturetiles01_1.png';
  if (norm.includes('end') || norm === '6') return '/assets/textures/LevelPalettes/endtiles01_1.png';
  if (norm.includes('retro') || norm.includes('cotton') || norm === '7') return '/assets/textures/LevelPalettes/retropara01.png';
  return '/assets/textures/LevelPalettes/forestbg.png';
}

/** Palette definitions */
export const PALETTE_TILES_CONFIG = {
  forest: { texturePackage: 'foresttiles01.png', tileSize: 60, numTiles: 100 },
  hospital: { texturePackage: 'hospitaltiles01.png', tileSize: 60, numTiles: 100 },
  salt_factory: { texturePackage: 'factorytiles01.png', tileSize: 60, numTiles: 100 },
  hell: { texturePackage: 'helltiles01.png', tileSize: 60, numTiles: 100 },
  rapture: { texturePackage: 'rapturetiles01.png', tileSize: 60, numTiles: 100 },
  the_end: { texturePackage: 'endtiles01.png', tileSize: 60, numTiles: 100 },
  retro: { texturePackage: 'retrotiles01.png', tileSize: 60, numTiles: 100 },
} as const;

/** Default predicate: only `TileType.SOLID` autotiles. */
export function defaultSolidPredicate(value: number): boolean {
  return value === TileType.SOLID;
}

/** Build a `TileAtlas` from a palette entry plus the loaded texture size. */
export function atlasFromPalette(
  palette: { tileSize: number; numTiles: number },
  textureWidth: number,
  textureHeight: number
): TileAtlas {
  return {
    width: textureWidth,
    height: textureHeight,
    tileSize: palette.tileSize,
    numTiles: palette.numTiles,
  };
}

/** Columns implied by the atlas geometry. */
export function atlasColumns(atlas: TileAtlas): number {
  if (atlas.columns && atlas.columns > 0) return atlas.columns;
  const derived = Math.floor(atlas.width / atlas.tileSize);
  return Math.max(1, derived);
}

/** Rows implied by the atlas geometry. */
export function atlasRows(atlas: TileAtlas): number {
  if (atlas.rows && atlas.rows > 0) return atlas.rows;
  const cols = atlasColumns(atlas);
  return Math.max(1, Math.ceil(atlas.numTiles / cols));
}

/**
 * Sub-rectangle of tile `index` inside a uniform grid atlas.
 * Out-of-range indices clamp to the last cell so a bad layout never samples
 * outside the texture.
 */
export function tileRect(atlas: TileAtlas, index: number): TileRect {
  const cols = atlasColumns(atlas);
  const rows = atlasRows(atlas);
  const maxIndex = cols * rows - 1;
  const i = Math.max(0, Math.min(maxIndex, Math.floor(index)));
  const col = i % cols;
  const row = Math.floor(i / cols);
  return {
    sx: col * atlas.tileSize,
    sy: row * atlas.tileSize,
    sw: atlas.tileSize,
    sh: atlas.tileSize,
    rot: 0,
  };
}

/**
 * Sub-rectangle of a packed `.itx` atlas entry, in pixels.
 * `u, v` are the top-left corner and `w, h` the (pre-rotation) size, all
 * normalised [0,1] against the texture. `rot` is 0 or PI/2.
 */
export function itxRect(entry: ItxEntry, textureWidth: number, textureHeight: number): TileRect {
  return {
    sx: entry.u * textureWidth,
    sy: entry.v * textureHeight,
    sw: entry.w * textureWidth,
    sh: entry.h * textureHeight,
    rot: entry.rot,
  };
}

/** Sample the 8 neighbours of `(col, row)` and derive both masks. */
export function sampleNeighbors(
  grid: number[][],
  col: number,
  row: number,
  isSolid: SolidPredicate = defaultSolidPredicate,
  outOfBoundsSolid: boolean = true
): NeighborInfo {
  const solid = (c: number, r: number): boolean => {
    if (r < 0 || r >= grid.length) return outOfBoundsSolid;
    const line = grid[r];
    if (!line || c < 0 || c >= line.length) return outOfBoundsSolid;
    return isSolid(line[c]);
  };

  const n = solid(col, row - 1);
  const e = solid(col + 1, row);
  const s = solid(col, row + 1);
  const w = solid(col - 1, row);
  const ne = solid(col + 1, row - 1);
  const se = solid(col + 1, row + 1);
  const sw = solid(col - 1, row + 1);
  const nw = solid(col - 1, row - 1);

  const cardinal = (n ? 1 : 0) | (e ? 2 : 0) | (s ? 4 : 0) | (w ? 8 : 0);
  const full =
    cardinal |
    (ne ? 16 : 0) |
    (se ? 32 : 0) |
    (sw ? 64 : 0) |
    (nw ? 128 : 0);

  return {
    n,
    e,
    s,
    w,
    ne,
    se,
    sw,
    nw,
    cardinal,
    full,
    open: (~cardinal) & 0xf,
  };
}

/** Semantic label for a 4-bit open-side mask. */
export function semanticForOpenMask(open: number): TileSemantic {
  return OPEN_MASK_SEMANTICS[open & 0xf];
}

/**
 * Choose a sheet tile index for a cell. Uses the 8-bit concave override when a
 * diagonal notch is present and the layout supplies one, otherwise the 4-bit
 * cardinal entry.
 */
export function resolveAutotileIndex(info: NeighborInfo, layout: AutotileLayout): number {
  const override = layout.corners ? layout.corners[info.full] : undefined;
  if (override !== undefined) return override;
  const idx = layout.open[info.open];
  return idx === undefined ? layout.open[0] ?? 0 : idx;
}

/**
 * Compute the source sub-rectangle for a *solid* cell, or `null` when the cell
 * is empty / not terrain. This is the primary entry point.
 */
export function resolveTileRect(
  grid: number[][],
  col: number,
  row: number,
  atlas: TileAtlas,
  options: { layout?: AutotileLayout; isSolid?: SolidPredicate; outOfBoundsSolid?: boolean } = {}
): TileRect | null {
  const isSolid = options.isSolid ?? defaultSolidPredicate;
  if (row < 0 || row >= grid.length) return null;
  const line = grid[row];
  if (!line || col < 0 || col >= line.length) return null;
  if (!isSolid(line[col])) return null;

  const layout = options.layout ?? FOREST_TILE_LAYOUT;
  const info = sampleNeighbors(grid, col, row, isSolid, options.outOfBoundsSolid ?? true);
  const index = resolveAutotileIndex(info, layout);
  return tileRect(atlas, index);
}

/**
 * Precompute the source rect for every solid cell in the grid.
 * Result is indexed `[row][col]`; `null` for empty / non-terrain cells.
 */
export function computeAutotileGrid(
  grid: number[][],
  atlas: TileAtlas,
  options: { layout?: AutotileLayout; isSolid?: SolidPredicate; outOfBoundsSolid?: boolean } = {}
): (TileRect | null)[][] {
  const out: (TileRect | null)[][] = [];
  for (let r = 0; r < grid.length; r++) {
    const line = grid[r] ?? [];
    const rowOut: (TileRect | null)[] = new Array(line.length).fill(null);
    for (let c = 0; c < line.length; c++) {
      rowOut[c] = resolveTileRect(grid, c, r, atlas, options);
    }
    out.push(rowOut);
  }
  return out;
}

/**
 * Draw the tileset for a viewport. Handles the `.itx` 90-degree rotation case
 * as well as plain grid rects. Not tied to the engine's Camera: pass the camera
 * offset in pixels.
 */
export function drawAutotiledLevel(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  grid: number[][],
  atlas: TileAtlas,
  cameraX: number,
  cameraY: number,
  options: {
    layout?: AutotileLayout;
    isSolid?: SolidPredicate;
    outOfBoundsSolid?: boolean;
    worldTileSize?: number;
  } = {}
): void {
  const layout = options.layout ?? FOREST_TILE_LAYOUT;
  const isSolid = options.isSolid ?? defaultSolidPredicate;
  const oob = options.outOfBoundsSolid ?? true;
  const worldTileSize = options.worldTileSize ?? atlas.tileSize;

  for (let r = 0; r < grid.length; r++) {
    const line = grid[r] ?? [];
    for (let c = 0; c < line.length; c++) {
      if (!isSolid(line[c])) continue;

      const info = sampleNeighbors(grid, c, r, isSolid, oob);
      const rect = tileRect(atlas, resolveAutotileIndex(info, layout));
      const dx = Math.round(c * worldTileSize - cameraX);
      const dy = Math.round(r * worldTileSize - cameraY);

      if (rect.rot) {
        // Atlas stores the tile rotated 90 degrees; draw through a transform.
        ctx.save();
        ctx.translate(dx + worldTileSize / 2, dy + worldTileSize / 2);
        ctx.rotate(rect.rot);
        ctx.drawImage(
          image,
          rect.sx,
          rect.sy,
          rect.sw,
          rect.sh,
          -worldTileSize / 2,
          -worldTileSize / 2,
          worldTileSize,
          worldTileSize
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          image,
          rect.sx,
          rect.sy,
          rect.sw,
          rect.sh,
          dx,
          dy,
          worldTileSize,
          worldTileSize
        );
      }
    }
  }
}
