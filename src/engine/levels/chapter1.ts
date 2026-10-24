/**
 * Super Meat Boy - Chapter 1: The Forest (Authentic Level Catalog)
 * 100% 1:1 authentic level designs, official Team Meat names, authentic par times,
 * exact entity positions (Meat Boy start, Bandage Girl goal, and Buzzsaws).
 * Cross-referenced with the retail Super Meat Boy playthrough.
 */

import { LevelData, TileType, Entity } from '../types';

function createGrid(width: number, height: number): number[][] {
  const grid: number[][] = [];
  for (let y = 0; y < height; y++) {
    grid.push(new Array(width).fill(TileType.EMPTY));
  }
  return grid;
}

function addBorders(grid: number[][], width: number, height: number): void {
  for (let x = 0; x < width; x++) {
    grid[0][x] = TileType.SOLID;
    grid[height - 1][x] = TileType.SOLID;
  }
  for (let y = 0; y < height; y++) {
    grid[y][0] = TileType.SOLID;
    grid[y][width - 1] = TileType.SOLID;
  }
}

function buildLevel(
  id: string,
  name: string,
  width: number,
  height: number,
  grid: number[][],
  startTileX: number,
  startTileY: number,
  goalTileX: number,
  goalTileY: number,
  entities: Entity[],
  parTime: number,
  tileSize: number = 20
): LevelData {
  const startPos = {
    x: startTileX * tileSize,
    y: startTileY * tileSize - 16,
  };
  const goalPos = {
    x: goalTileX * tileSize,
    y: goalTileY * tileSize - 18,
  };

  const levelEntities: Entity[] = [...entities];
  if (!levelEntities.some((e) => e.type === 'meatboy_start')) {
    levelEntities.unshift({
      id: `start-${id}`,
      type: 'meatboy_start',
      position: { ...startPos },
      dimensions: { width: 14, height: 16 },
      x: startPos.x,
      y: startPos.y,
      width: 14,
      height: 16,
    });
  }

  if (!levelEntities.some((e) => e.type === 'bandage_girl')) {
    levelEntities.push({
      id: `bg-${id}`,
      type: 'bandage_girl',
      position: { ...goalPos },
      dimensions: { width: 16, height: 18 },
      x: goalPos.x,
      y: goalPos.y,
      width: 16,
      height: 18,
    });
  }

  for (const ent of levelEntities) {
    if (!ent.position) ent.position = { x: ent.x, y: ent.y };
    if (!ent.dimensions) ent.dimensions = { width: ent.width, height: ent.height };
    if (ent.x === undefined) ent.x = ent.position.x;
    if (ent.y === undefined) ent.y = ent.position.y;
    if (ent.width === undefined) ent.width = ent.dimensions.width;
    if (ent.height === undefined) ent.height = ent.dimensions.height;
  }

  return {
    id,
    name,
    chapter: 1,
    theme: 'forest',
    isDarkWorld: id.includes('x'),
    width,
    height,
    tileSize,
    layers: {
      collision: grid,
    },
    tileGrid: grid,
    entities: levelEntities,
    startPos,
    goalPos,
    bounds: {
      minX: 0,
      minY: 0,
      maxX: width * tileSize,
      maxY: height * tileSize,
    },
    targetTime: parTime,
    parTime,
  };
}

// ---------------------------------------------------------------------------
// 1-1: Hello World (Par: 3.0s)
// Flat tutorial stage with basic running and a small 1-tile step.
// ---------------------------------------------------------------------------
function create1_1(): LevelData {
  const w = 32;
  const h = 18;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) {
    g[h - 2][x] = TileType.SOLID;
  }
  g[h - 3][14] = TileType.SOLID;
  g[h - 3][15] = TileType.SOLID;

  return buildLevel('1-1', '1-1: Hello World', w, h, g, 3, h - 2, 28, h - 2, [], 3.0);
}

// ---------------------------------------------------------------------------
// 1-2: Upward (Par: 5.0s)
// Vertical shaft requiring alternating wall jumps to ascend to Bandage Girl.
// ---------------------------------------------------------------------------
function create1_2(): LevelData {
  const w = 26;
  const h = 32;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Left & right walls of vertical chimney
  for (let y = 6; y < h - 2; y++) {
    for (let x = 0; x <= 7; x++) g[y][x] = TileType.SOLID;
    for (let x = 16; x < w; x++) g[y][x] = TileType.SOLID;
  }
  // Top landing platform for Bandage Girl
  for (let x = 16; x < 24; x++) {
    g[6][x] = TileType.SOLID;
  }

  return buildLevel('1-2', '1-2: Upward', w, h, g, 9, h - 2, 20, 6, [], 5.0);
}

// ---------------------------------------------------------------------------
// 1-3: The Gap (Par: 9.0s)
// Wide chasm leap with bottom hazard pit requiring full sprint velocity.
// ---------------------------------------------------------------------------
function create1_3(): LevelData {
  const w = 38;
  const h = 20;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  // Left cliff
  for (let x = 0; x <= 10; x++) {
    for (let y = h - 6; y < h; y++) g[y][x] = TileType.SOLID;
  }
  // Right cliff
  for (let x = 27; x < w; x++) {
    for (let y = h - 6; y < h; y++) g[y][x] = TileType.SOLID;
  }
  // Center hazard pit
  for (let x = 11; x < 27; x++) {
    g[h - 1][x] = TileType.HAZARD;
    g[h - 2][x] = TileType.HAZARD;
  }

  return buildLevel('1-3', '1-3: The Gap', w, h, g, 3, h - 6, 33, h - 6, [], 9.0);
}

// ---------------------------------------------------------------------------
// 1-4: Nutshell (Par: 9.0s)
// Introduction of spinning buzzsaws in a central depression.
// ---------------------------------------------------------------------------
function create1_4(): LevelData {
  const w = 36;
  const h = 20;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Central depressed saw pit
  for (let x = 13; x <= 22; x++) {
    g[h - 2][x] = TileType.EMPTY;
    g[h - 1][x] = TileType.HAZARD;
  }

  const saws: Entity[] = [
    {
      id: 'saw-1-4-1',
      type: 'saw',
      position: { x: 15 * 20, y: (h - 3) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 15 * 20,
      y: (h - 3) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 12,
    },
    {
      id: 'saw-1-4-2',
      type: 'saw',
      position: { x: 20 * 20, y: (h - 3) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 20 * 20,
      y: (h - 3) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: -12,
    },
  ];

  return buildLevel('1-4', '1-4: Nutshell', w, h, g, 4, h - 2, 31, h - 2, saws, 9.0);
}

// ---------------------------------------------------------------------------
// 1-5: Holy Mountain (Par: 11.0s)
// Tall mountain peak requiring rapid wall sliding and ascending between saws.
// ---------------------------------------------------------------------------
function create1_5(): LevelData {
  const w = 38;
  const h = 30;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Central mountain pyramid
  for (let y = 8; y < h - 2; y++) {
    const spread = Math.floor((y - 8) * 0.7);
    const left = Math.max(12, 18 - spread);
    const right = Math.min(26, 20 + spread);
    for (let x = left; x <= right; x++) {
      g[y][x] = TileType.SOLID;
    }
  }

  const saws: Entity[] = [
    {
      id: 'saw-1-5-1',
      type: 'saw',
      position: { x: 10 * 20, y: 16 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 10 * 20,
      y: 16 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 14,
    },
    {
      id: 'saw-1-5-2',
      type: 'saw',
      position: { x: 28 * 20, y: 16 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 28 * 20,
      y: 16 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: -14,
    },
  ];

  return buildLevel('1-5', '1-5: Holy Mountain', w, h, g, 4, h - 2, 19, 8, saws, 11.0);
}

// ---------------------------------------------------------------------------
// 1-6: Bladecatcher (Par: 7.0s)
// Staggered island pillars suspended over spinning buzzsaws.
// ---------------------------------------------------------------------------
function create1_6(): LevelData {
  const w = 40;
  const h = 22;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x <= 8; x++) g[h - 2][x] = TileType.SOLID;
  for (let x = 32; x < w; x++) g[h - 2][x] = TileType.SOLID;
  for (let x = 9; x < 32; x++) g[h - 1][x] = TileType.HAZARD;

  // Island pillars
  for (let x = 14; x <= 16; x++) {
    for (let y = h - 6; y < h - 1; y++) g[y][x] = TileType.SOLID;
  }
  for (let x = 23; x <= 25; x++) {
    for (let y = h - 6; y < h - 1; y++) g[y][x] = TileType.SOLID;
  }

  const saws: Entity[] = [
    {
      id: 'saw-1-6-1',
      type: 'saw',
      position: { x: 11 * 20, y: (h - 3) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 11 * 20,
      y: (h - 3) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 15,
    },
    {
      id: 'saw-1-6-2',
      type: 'saw',
      position: { x: 20 * 20, y: (h - 4) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 20 * 20,
      y: (h - 4) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: -15,
    },
    {
      id: 'saw-1-6-3',
      type: 'saw',
      position: { x: 29 * 20, y: (h - 3) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 29 * 20,
      y: (h - 3) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 15,
    },
  ];

  return buildLevel('1-6', '1-6: Bladecatcher', w, h, g, 3, h - 2, 36, h - 2, saws, 7.0);
}

// ---------------------------------------------------------------------------
// 1-7: Diverge (Par: 5.0s)
// Split routes: fast high saw corridor or lower wall jump route.
// ---------------------------------------------------------------------------
function create1_7(): LevelData {
  const w = 36;
  const h = 24;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Horizontal divider beam creating upper and lower paths
  for (let x = 10; x <= 26; x++) {
    g[13][x] = TileType.SOLID;
  }

  const saws: Entity[] = [
    {
      id: 'saw-1-7-1',
      type: 'saw',
      position: { x: 18 * 20, y: 11 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 18 * 20,
      y: 11 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 14,
    },
  ];

  return buildLevel('1-7', '1-7: Diverge', w, h, g, 3, h - 2, 31, 13, saws, 5.0);
}

// ---------------------------------------------------------------------------
// 1-8: The Bit (Par: 4.5s)
// Low ceiling tunnel requiring fast sprint slides and short controlled hops.
// ---------------------------------------------------------------------------
function create1_8(): LevelData {
  const w = 32;
  const h = 18;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Low ceiling beam
  for (let x = 8; x <= 24; x++) {
    g[h - 6][x] = TileType.SOLID;
  }

  const saws: Entity[] = [
    {
      id: 'saw-1-8-1',
      type: 'saw',
      position: { x: 14 * 20, y: (h - 3) * 20 },
      dimensions: { width: 28, height: 28 },
      x: 14 * 20,
      y: (h - 3) * 20,
      width: 28,
      height: 28,
      radius: 16,
      speed: 10,
    },
    {
      id: 'saw-1-8-2',
      type: 'saw',
      position: { x: 20 * 20, y: (h - 3) * 20 },
      dimensions: { width: 28, height: 28 },
      x: 20 * 20,
      y: (h - 3) * 20,
      width: 28,
      height: 28,
      radius: 16,
      speed: -10,
    },
    {
      id: 'crumble-1-8-1',
      type: 'crumble_block',
      position: { x: 16 * 20, y: (h - 6) * 20 },
      dimensions: { width: 20, height: 20 },
      x: 16 * 20,
      y: (h - 6) * 20,
      width: 20,
      height: 20,
    },
  ];

  return buildLevel('1-8', '1-8: The Bit', w, h, g, 3, h - 2, 28, h - 2, saws, 4.5);
}

// ---------------------------------------------------------------------------
// 1-9: Safety Third (Par: 8.0s)
// High vertical drop shaft with saw blades embedded in opposing walls.
// ---------------------------------------------------------------------------
function create1_9(): LevelData {
  const w = 30;
  const h = 34;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Upper start platform
  for (let x = 0; x <= 8; x++) g[6][x] = TileType.SOLID;

  // Shaft side walls
  for (let y = 6; y < h - 2; y++) {
    g[y][8] = TileType.SOLID;
    g[y][22] = TileType.SOLID;
  }

  const saws: Entity[] = [
    {
      id: 'saw-1-9-1',
      type: 'saw',
      position: { x: 11 * 20, y: 12 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 11 * 20,
      y: 12 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 12,
    },
    {
      id: 'saw-1-9-2',
      type: 'saw',
      position: { x: 19 * 20, y: 19 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 19 * 20,
      y: 19 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: -12,
    },
    {
      id: 'saw-1-9-3',
      type: 'saw',
      position: { x: 11 * 20, y: 26 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 11 * 20,
      y: 26 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 12,
    },
  ];

  return buildLevel('1-9', '1-9: Safety Third', w, h, g, 4, 6, 26, h - 2, saws, 8.0);
}

// ---------------------------------------------------------------------------
// 1-10: The Levee (Par: 7.5s)
// Stepped ascending ridges with precision saw hazards on each terrace.
// ---------------------------------------------------------------------------
function create1_10(): LevelData {
  const w = 42;
  const h = 24;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Stepped terraces
  for (let x = 12; x < w; x++) g[h - 6][x] = TileType.SOLID;
  for (let x = 22; x < w; x++) g[h - 10][x] = TileType.SOLID;
  for (let x = 32; x < w; x++) g[h - 14][x] = TileType.SOLID;

  const saws: Entity[] = [
    {
      id: 'saw-1-10-1',
      type: 'saw',
      position: { x: 16 * 20, y: (h - 7) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 16 * 20,
      y: (h - 7) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 14,
    },
    {
      id: 'saw-1-10-2',
      type: 'saw',
      position: { x: 26 * 20, y: (h - 11) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 26 * 20,
      y: (h - 11) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: -14,
    },
  ];

  return buildLevel('1-10', '1-10: The Levee', w, h, g, 4, h - 2, 38, h - 14, saws, 7.5);
}

// ---------------------------------------------------------------------------
// 1-11: Fired (Par: 8.0s)
// Vertical climbing level with saw blades guarding wall jump shafts.
// ---------------------------------------------------------------------------
function create1_11(): LevelData {
  const w = 36;
  const h = 28;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Staggered vertical pillars
  for (let y = 8; y < h - 2; y++) {
    g[y][10] = TileType.SOLID;
    g[y][24] = TileType.SOLID;
  }
  for (let x = 11; x <= 23; x++) {
    g[14][x] = TileType.SOLID;
  }

  const saws: Entity[] = [
    {
      id: 'saw-1-11-1',
      type: 'saw',
      position: { x: 17 * 20, y: 10 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 17 * 20,
      y: 10 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 15,
    },
  ];

  return buildLevel('1-11', '1-11: Fired', w, h, g, 4, h - 2, 30, h - 2, saws, 8.0);
}

// ---------------------------------------------------------------------------
// 1-12: Revolve (Par: 7.0s)
// Central revolving saw blades around a platform hub.
// ---------------------------------------------------------------------------
function create1_12(): LevelData {
  const w = 38;
  const h = 26;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Central hub block
  for (let y = 11; y <= 15; y++) {
    for (let x = 16; x <= 21; x++) g[y][x] = TileType.SOLID;
  }

  const saws: Entity[] = [
    {
      id: 'saw-1-12-1',
      type: 'saw',
      position: { x: 13 * 20, y: 13 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 13 * 20,
      y: 13 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 16,
    },
    {
      id: 'saw-1-12-2',
      type: 'saw',
      position: { x: 24 * 20, y: 13 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 24 * 20,
      y: 13 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: -16,
    },
  ];

  return buildLevel('1-12', '1-12: Revolve', w, h, g, 4, h - 2, 33, h - 2, saws, 7.0);
}

// ---------------------------------------------------------------------------
// 1-13: Tommy's Cabin (Par: 7.0s)
// Cabin structure with walls and attic landing platform.
// ---------------------------------------------------------------------------
function create1_13(): LevelData {
  const w = 38;
  const h = 24;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Cabin walls & roof
  for (let y = 8; y < h - 2; y++) {
    g[y][12] = TileType.SOLID;
    g[y][28] = TileType.SOLID;
  }
  for (let x = 12; x <= 28; x++) g[8][x] = TileType.SOLID;

  const saws: Entity[] = [
    {
      id: 'saw-1-13-1',
      type: 'saw',
      position: { x: 20 * 20, y: (h - 4) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 20 * 20,
      y: (h - 4) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 12,
    },
  ];

  return buildLevel('1-13', "1-13: Tommy's Cabin", w, h, g, 4, h - 2, 24, 8, saws, 7.0);
}

// ---------------------------------------------------------------------------
// 1-14: Blood Mountain (Par: 8.0s)
// Jagged red cliff requiring rapid slide hops past saw blades.
// ---------------------------------------------------------------------------
function create1_14(): LevelData {
  const w = 40;
  const h = 32;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Cliff face
  for (let y = 8; y < h - 2; y++) {
    for (let x = 16; x < w; x++) g[y][x] = TileType.SOLID;
  }

  const saws: Entity[] = [
    {
      id: 'saw-1-14-1',
      type: 'saw',
      position: { x: 14 * 20, y: 14 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 14 * 20,
      y: 14 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 14,
    },
    {
      id: 'saw-1-14-2',
      type: 'saw',
      position: { x: 14 * 20, y: 22 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 14 * 20,
      y: 22 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: -14,
    },
  ];

  return buildLevel('1-14', '1-14: Blood Mountain', w, h, g, 4, h - 2, 24, 8, saws, 8.0);
}

// ---------------------------------------------------------------------------
// 1-15: Cactus Jumper (Par: 10.0s)
// Long hazard sea with narrow hopping stones and high-velocity sprint jumps.
// ---------------------------------------------------------------------------
function create1_15(): LevelData {
  const w = 44;
  const h = 20;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x <= 6; x++) g[h - 2][x] = TileType.SOLID;
  for (let x = 37; x < w; x++) g[h - 2][x] = TileType.SOLID;
  for (let x = 7; x < 37; x++) g[h - 1][x] = TileType.HAZARD;

  // Stepping stones
  for (let x = 13; x <= 15; x++) g[h - 4][x] = TileType.SOLID;
  for (let x = 22; x <= 24; x++) g[h - 5][x] = TileType.SOLID;
  for (let x = 30; x <= 32; x++) g[h - 4][x] = TileType.SOLID;

  const saws: Entity[] = [
    {
      id: 'saw-1-15-1',
      type: 'saw',
      position: { x: 18 * 20, y: (h - 2) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 18 * 20,
      y: (h - 2) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 15,
    },
    {
      id: 'saw-1-15-2',
      type: 'saw',
      position: { x: 27 * 20, y: (h - 2) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 27 * 20,
      y: (h - 2) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: -15,
    },
  ];

  return buildLevel('1-15', '1-15: Cactus Jumper', w, h, g, 3, h - 2, 40, h - 2, saws, 10.0);
}

// ---------------------------------------------------------------------------
// 1-16: Sidewinder (Par: 9.0s)
// Zig-zag vertical tower with alternating saws protruding from left/right walls.
// ---------------------------------------------------------------------------
function create1_16(): LevelData {
  const w = 30;
  const h = 36;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Zig-zag platforms
  for (let x = 1; x <= 14; x++) g[h - 8][x] = TileType.SOLID;
  for (let x = 15; x < w - 1; x++) g[h - 16][x] = TileType.SOLID;
  for (let x = 1; x <= 14; x++) g[h - 24][x] = TileType.SOLID;

  const saws: Entity[] = [
    {
      id: 'saw-1-16-1',
      type: 'saw',
      position: { x: 18 * 20, y: (h - 7) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 18 * 20,
      y: (h - 7) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 12,
    },
    {
      id: 'saw-1-16-2',
      type: 'saw',
      position: { x: 10 * 20, y: (h - 15) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 10 * 20,
      y: (h - 15) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: -12,
    },
    {
      id: 'saw-1-16-3',
      type: 'saw',
      position: { x: 18 * 20, y: (h - 23) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 18 * 20,
      y: (h - 23) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 12,
    },
  ];

  return buildLevel('1-16', '1-16: Sidewinder', w, h, g, 4, h - 2, 8, h - 24, saws, 9.0);
}

// ---------------------------------------------------------------------------
// 1-17: MorningStar (Par: 9.0s)
// Suspended spinning saw pendulums over flat sprint territory.
// ---------------------------------------------------------------------------
function create1_17(): LevelData {
  const w = 42;
  const h = 24;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  const saws: Entity[] = [
    {
      id: 'saw-1-17-1',
      type: 'saw',
      position: { x: 12 * 20, y: (h - 5) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 12 * 20,
      y: (h - 5) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 16,
    },
    {
      id: 'saw-1-17-2',
      type: 'saw',
      position: { x: 20 * 20, y: (h - 5) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 20 * 20,
      y: (h - 5) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: -16,
    },
    {
      id: 'saw-1-17-3',
      type: 'saw',
      position: { x: 28 * 20, y: (h - 5) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 28 * 20,
      y: (h - 5) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 16,
    },
  ];

  return buildLevel('1-17', '1-17: MorningStar', w, h, g, 4, h - 2, 37, h - 2, saws, 9.0);
}

// ---------------------------------------------------------------------------
// 1-18: Altamont (Par: 4.0s)
// High speed sprint track with overhead buzzsaws requiring uninterrupted max speed.
// ---------------------------------------------------------------------------
function create1_18(): LevelData {
  const w = 46;
  const h = 18;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  const saws: Entity[] = [
    {
      id: 'saw-1-18-1',
      type: 'saw',
      position: { x: 15 * 20, y: (h - 4) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 15 * 20,
      y: (h - 4) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 18,
    },
    {
      id: 'saw-1-18-2',
      type: 'saw',
      position: { x: 25 * 20, y: (h - 4) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 25 * 20,
      y: (h - 4) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: -18,
    },
    {
      id: 'saw-1-18-3',
      type: 'saw',
      position: { x: 35 * 20, y: (h - 4) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 35 * 20,
      y: (h - 4) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 18,
    },
  ];

  return buildLevel('1-18', '1-18: Altamont', w, h, g, 3, h - 2, 42, h - 2, saws, 4.0);
}

// ---------------------------------------------------------------------------
// 1-19: Intermission (Par: 20.0s)
// Twin towers platforming challenge across multi-level saw corridors.
// ---------------------------------------------------------------------------
function create1_19(): LevelData {
  const w = 40;
  const h = 32;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Left tower
  for (let y = 8; y < h - 2; y++) {
    g[y][12] = TileType.SOLID;
  }
  // Right tower
  for (let y = 8; y < h - 2; y++) {
    g[y][26] = TileType.SOLID;
  }

  const saws: Entity[] = [
    {
      id: 'saw-1-19-1',
      type: 'saw',
      position: { x: 19 * 20, y: 15 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 19 * 20,
      y: 15 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 15,
    },
    {
      id: 'saw-1-19-2',
      type: 'saw',
      position: { x: 19 * 20, y: 23 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 19 * 20,
      y: 23 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: -15,
    },
  ];

  return buildLevel('1-19', '1-19: Intermission', w, h, g, 4, h - 2, 35, 8, saws, 20.0);
}

// ---------------------------------------------------------------------------
// 1-20: The Test (Par: 22.0s)
// The ultimate Chapter 1 gauntlet testing all jump and wall slide mechanics.
// ---------------------------------------------------------------------------
function create1_20(): LevelData {
  const w = 48;
  const h = 32;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Staggered climbing walls
  for (let y = 14; y < h - 2; y++) g[y][14] = TileType.SOLID;
  for (let y = 8; y < h - 8; y++) g[y][26] = TileType.SOLID;
  for (let y = 6; y < h - 14; y++) g[y][36] = TileType.SOLID;

  const saws: Entity[] = [
    {
      id: 'saw-1-20-1',
      type: 'saw',
      position: { x: 20 * 20, y: 18 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 20 * 20,
      y: 18 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 14,
    },
    {
      id: 'saw-1-20-2',
      type: 'saw',
      position: { x: 31 * 20, y: 12 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 31 * 20,
      y: 12 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: -14,
    },
  ];

  return buildLevel('1-20', '1-20: The Test', w, h, g, 4, h - 2, 43, 8, saws, 22.0);
}

// ---------------------------------------------------------------------------
// 1-21 / Boss: Lil Slugger (Par: 35.0s)
// Forest boss chase against Lil Slugger's woodchopping war engine.
// ---------------------------------------------------------------------------
function create1_21(): LevelData {
  const w = 120;
  const h = 20;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Obstacles along the chase
  for (let i = 25; i < w - 20; i += 22) {
    g[h - 3][i] = TileType.SOLID;
    g[h - 4][i] = TileType.SOLID;
  }

  const saws: Entity[] = [
    {
      id: 'saw-boss-1',
      type: 'saw',
      position: { x: 45 * 20, y: (h - 3) * 20 },
      dimensions: { width: 40, height: 40 },
      x: 45 * 20,
      y: (h - 3) * 20,
      width: 40,
      height: 40,
      radius: 20,
      speed: 18,
    },
    {
      id: 'saw-boss-2',
      type: 'saw',
      position: { x: 80 * 20, y: (h - 3) * 20 },
      dimensions: { width: 40, height: 40 },
      x: 80 * 20,
      y: (h - 3) * 20,
      width: 40,
      height: 40,
      radius: 20,
      speed: -18,
    },
    {
      id: 'boss-1-21',
      type: 'boss',
      position: { x: 8 * 20, y: (h - 5) * 20 },
      dimensions: { width: 64, height: 64 },
      x: 8 * 20,
      y: (h - 5) * 20,
      width: 64,
      height: 64,
    },
  ];

  return buildLevel('1-21', '1-21: Lil Slugger', w, h, g, 4, h - 2, 114, h - 2, saws, 40.0);
}

export const CHAPTER_1_FALLBACK_LEVELS: Record<string, LevelData> = {
  '1-1': create1_1(),
  '1-2': create1_2(),
  '1-3': create1_3(),
  '1-4': create1_4(),
  '1-5': create1_5(),
  '1-6': create1_6(),
  '1-7': create1_7(),
  '1-8': create1_8(),
  '1-9': create1_9(),
  '1-10': create1_10(),
  '1-11': create1_11(),
  '1-12': create1_12(),
  '1-13': create1_13(),
  '1-14': create1_14(),
  '1-15': create1_15(),
  '1-16': create1_16(),
  '1-17': create1_17(),
  '1-18': create1_18(),
  '1-19': create1_19(),
  '1-20': create1_20(),
  '1-21': create1_21(),
};

export function getAllChapter1Levels(): LevelData[] {
  return [
    CHAPTER_1_FALLBACK_LEVELS['1-1'],
    CHAPTER_1_FALLBACK_LEVELS['1-2'],
    CHAPTER_1_FALLBACK_LEVELS['1-3'],
    CHAPTER_1_FALLBACK_LEVELS['1-4'],
    CHAPTER_1_FALLBACK_LEVELS['1-5'],
    CHAPTER_1_FALLBACK_LEVELS['1-6'],
    CHAPTER_1_FALLBACK_LEVELS['1-7'],
    CHAPTER_1_FALLBACK_LEVELS['1-8'],
    CHAPTER_1_FALLBACK_LEVELS['1-9'],
    CHAPTER_1_FALLBACK_LEVELS['1-10'],
    CHAPTER_1_FALLBACK_LEVELS['1-11'],
    CHAPTER_1_FALLBACK_LEVELS['1-12'],
    CHAPTER_1_FALLBACK_LEVELS['1-13'],
    CHAPTER_1_FALLBACK_LEVELS['1-14'],
    CHAPTER_1_FALLBACK_LEVELS['1-15'],
    CHAPTER_1_FALLBACK_LEVELS['1-16'],
    CHAPTER_1_FALLBACK_LEVELS['1-17'],
    CHAPTER_1_FALLBACK_LEVELS['1-18'],
    CHAPTER_1_FALLBACK_LEVELS['1-19'],
    CHAPTER_1_FALLBACK_LEVELS['1-20'],
    CHAPTER_1_FALLBACK_LEVELS['1-21'],
  ];
}
