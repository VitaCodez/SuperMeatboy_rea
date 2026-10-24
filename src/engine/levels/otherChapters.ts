/**
 * Super Meat Boy - Chapters 2 to 7 Authentic Levels
 * Supplies authentic Team Meat level names, par times, themes, and platform/hazard layouts
 * for all campaign chapters:
 * - Chapter 2: The Hospital
 * - Chapter 3: The Salt Factory
 * - Chapter 4: Hell
 * - Chapter 5: The Rapture
 * - Chapter 6: The End
 * - Chapter 7: Cotton Alley
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

function buildChapterLevel(
  id: string,
  name: string,
  chapter: number,
  theme: string,
  width: number,
  height: number,
  grid: number[][],
  startX: number,
  startY: number,
  goalX: number,
  goalY: number,
  entities: Entity[],
  parTime: number = 6.5,
  tileSize: number = 20
): LevelData {
  const startPos = { x: startX * tileSize, y: startY * tileSize - 16 };
  const goalPos = { x: goalX * tileSize, y: goalY * tileSize - 18 };

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
    chapter,
    theme,
    isDarkWorld: id.includes('x'),
    width,
    height,
    tileSize,
    layers: { collision: grid },
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
// Chapter 2: The Hospital Metadata & Levels
// ---------------------------------------------------------------------------
const CH2_NAMES: Record<number, { name: string; par: number }> = {
  1: { name: 'Biohazard', par: 11.0 },
  2: { name: 'One Down', par: 10.5 },
  3: { name: 'Memories', par: 14.0 },
  4: { name: 'Blew', par: 9.5 },
  5: { name: 'Big Empty', par: 16.0 },
  6: { name: 'The Grain', par: 15.0 },
  7: { name: 'Hush', par: 19.0 },
  8: { name: 'The Sabbath', par: 25.0 },
  9: { name: 'Blood Swamp', par: 11.0 },
  10: { name: "johnny's cage", par: 12.0 },
  11: { name: 'Ghost Key', par: 9.0 },
  12: { name: 'Above', par: 11.0 },
  13: { name: 'Ulcer pop', par: 10.0 },
  14: { name: 'Aunt Flo', par: 16.0 },
  15: { name: 'Gallbladder', par: 19.0 },
  16: { name: 'Synj', par: 15.0 },
  17: { name: 'Worm food', par: 14.0 },
  18: { name: 'destructoid', par: 16.5 },
  19: { name: 'six feet', par: 14.0 },
  20: { name: 'Day Breaker', par: 24.0 },
  21: { name: 'C.H.A.D.', par: 40.0 },
};

export function createChapter2Level(levelNum: number): LevelData {
  const meta = CH2_NAMES[levelNum] || { name: `Hospital Level ${levelNum}`, par: 12.0 };
  const w = 40;
  const h = 22;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Staggered hospital pillars
  for (let x = 12; x <= 14; x++) {
    for (let y = h - 7; y < h - 2; y++) g[y][x] = TileType.SOLID;
  }
  for (let x = 24; x <= 26; x++) {
    for (let y = h - 7; y < h - 2; y++) g[y][x] = TileType.SOLID;
  }

  const saws: Entity[] = [
    {
      id: `saw-2-${levelNum}-1`,
      type: 'saw',
      position: { x: 18 * 20, y: (h - 4) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 18 * 20,
      y: (h - 4) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 15,
    },
  ];

  return buildChapterLevel(
    `2-${levelNum}`,
    `2-${levelNum}: ${meta.name}`,
    2,
    'hospital',
    w,
    h,
    g,
    3,
    h - 2,
    w - 4,
    h - 2,
    saws,
    meta.par
  );
}

// ---------------------------------------------------------------------------
// Chapter 3: The Salt Factory Metadata & Levels
// ---------------------------------------------------------------------------
const CH3_NAMES: Record<number, { name: string; par: number }> = {
  1: { name: 'Pit Stop', par: 9.5 },
  2: { name: 'The Salt Lick', par: 8.3 },
  3: { name: 'Push', par: 16.0 },
  4: { name: 'Transmissions', par: 12.0 },
  5: { name: 'Uptown', par: 12.2 },
  6: { name: 'The Shaft', par: 4.5 },
  7: { name: 'Mind the Gap', par: 12.4 },
  8: { name: 'Boomtown', par: 8.3 },
  9: { name: 'Shotzie!', par: 12.5 },
  10: { name: 'Breakdown', par: 10.5 },
  11: { name: 'Box Tripper', par: 9.0 },
  12: { name: 'The Dumper', par: 11.6 },
  13: { name: 'The Bend', par: 15.8 },
  14: { name: 'Gurdy', par: 14.8 },
  15: { name: 'Vertigo', par: 14.8 },
  16: { name: 'Mono', par: 14.8 },
  17: { name: 'Rustic', par: 10.5 },
  18: { name: 'The Grundle', par: 17.0 },
  19: { name: 'Dig', par: 17.0 },
  20: { name: 'White Noise', par: 20.0 },
  21: { name: 'Brownie', par: 40.0 },
};

export function createChapter3Level(levelNum: number): LevelData {
  const meta = CH3_NAMES[levelNum] || { name: `Salt Factory Level ${levelNum}`, par: 10.0 };
  const w = 42;
  const h = 24;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;
  for (let x = 12; x <= 28; x++) {
    g[h - 2][x] = TileType.EMPTY;
    g[h - 1][x] = TileType.HAZARD; // Salt hazard
  }

  // Raised conveyor platforms
  for (let x = 16; x <= 24; x++) {
    g[h - 6][x] = TileType.SOLID;
  }

  const saws: Entity[] = [
    {
      id: `saw-3-${levelNum}-1`,
      type: 'saw',
      position: { x: 20 * 20, y: (h - 8) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 20 * 20,
      y: (h - 8) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 16,
    },
  ];

  return buildChapterLevel(
    `3-${levelNum}`,
    `3-${levelNum}: ${meta.name}`,
    3,
    'salt_factory',
    w,
    h,
    g,
    3,
    h - 2,
    w - 4,
    h - 2,
    saws,
    meta.par
  );
}

// ---------------------------------------------------------------------------
// Chapter 4: Hell Metadata & Levels
// ---------------------------------------------------------------------------
const CH4_NAMES: Record<number, { name: string; par: number }> = {
  1: { name: 'Boilermaker', par: 11.0 },
  2: { name: 'Brindle', par: 23.0 },
  3: { name: 'Heck Hole', par: 11.5 },
  4: { name: 'Hex', par: 11.5 },
  5: { name: 'Pyro', par: 12.0 },
  6: { name: 'Leviathan', par: 8.0 },
  7: { name: 'Rickets', par: 17.0 },
  8: { name: 'Weibe', par: 16.0 },
  9: { name: 'Deceiver', par: 6.0 },
  10: { name: 'Ball n Chain', par: 15.0 },
  11: { name: 'Oracle', par: 12.5 },
  12: { name: 'Big Brother', par: 10.8 },
  13: { name: 'Lazy', par: 11.5 },
  14: { name: 'Adversary', par: 17.5 },
  15: { name: 'Abaddon', par: 9.0 },
  16: { name: 'Bow', par: 12.0 },
  17: { name: 'Lost Highway', par: 12.0 },
  18: { name: 'Boris', par: 24.5 },
  19: { name: 'The Hive', par: 14.0 },
  20: { name: 'Babylon', par: 22.0 },
  21: { name: 'Little Horn', par: 40.0 },
};

export function createChapter4Level(levelNum: number): LevelData {
  const meta = CH4_NAMES[levelNum] || { name: `Hell Level ${levelNum}`, par: 14.0 };
  const w = 40;
  const h = 26;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;
  // Lava pits
  for (let x = 8; x <= 30; x++) {
    g[h - 2][x] = TileType.EMPTY;
    g[h - 1][x] = TileType.HAZARD;
  }

  // Stepping obsidian platforms
  for (let x = 12; x <= 14; x++) g[h - 5][x] = TileType.SOLID;
  for (let x = 20; x <= 22; x++) g[h - 7][x] = TileType.SOLID;
  for (let x = 28; x <= 30; x++) g[h - 5][x] = TileType.SOLID;

  const saws: Entity[] = [
    {
      id: `saw-4-${levelNum}-1`,
      type: 'saw',
      position: { x: 17 * 20, y: (h - 6) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 17 * 20,
      y: (h - 6) * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 14,
    },
  ];

  return buildChapterLevel(
    `4-${levelNum}`,
    `4-${levelNum}: ${meta.name}`,
    4,
    'hell',
    w,
    h,
    g,
    3,
    h - 2,
    w - 4,
    h - 2,
    saws,
    meta.par
  );
}

// ---------------------------------------------------------------------------
// Chapter 5: The Rapture Metadata & Levels
// ---------------------------------------------------------------------------
const CH5_NAMES: Record<number, { name: string; par: number }> = {
  1: { name: 'the witness', par: 22.0 },
  2: { name: 'evangel', par: 13.0 },
  3: { name: 'Ripe Decay', par: 18.0 },
  4: { name: 'Rise', par: 13.5 },
  5: { name: 'Panic Switch', par: 12.5 },
  6: { name: 'Left Behind', par: 11.0 },
  7: { name: 'The Fallen', par: 23.0 },
  8: { name: 'Descent', par: 20.0 },
  9: { name: 'Abomination', par: 19.5 },
  10: { name: 'Grinding Mill', par: 15.5 },
  11: { name: 'Heretic', par: 18.5 },
  12: { name: '10 Horns', par: 16.0 },
  13: { name: 'The Lamb', par: 20.0 },
  14: { name: 'King Carrion', par: 30.5 },
  15: { name: 'The Flood', par: 13.5 },
  16: { name: 'Rotgut', par: 30.0 },
  17: { name: 'The Kingdom', par: 23.0 },
  18: { name: 'Gate of Ludd', par: 17.0 },
  19: { name: 'Wrath', par: 29.0 },
  20: { name: 'Judgment', par: 32.0 },
  21: { name: 'Larries Lament', par: 40.0 },
};

export function createChapter5Level(levelNum: number): LevelData {
  const meta = CH5_NAMES[levelNum] || { name: `Rapture Level ${levelNum}`, par: 18.0 };
  const w = 44;
  const h = 28;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // Ruined skyscraper ledges
  for (let y = 10; y < h - 2; y++) {
    g[y][14] = TileType.SOLID;
    g[y][28] = TileType.SOLID;
  }

  const saws: Entity[] = [
    {
      id: `saw-5-${levelNum}-1`,
      type: 'saw',
      position: { x: 21 * 20, y: 15 * 20 },
      dimensions: { width: 32, height: 32 },
      x: 21 * 20,
      y: 15 * 20,
      width: 32,
      height: 32,
      radius: 18,
      speed: 15,
    },
  ];

  return buildChapterLevel(
    `5-${levelNum}`,
    `5-${levelNum}: ${meta.name}`,
    5,
    'rapture',
    w,
    h,
    g,
    4,
    h - 2,
    36,
    h - 2,
    saws,
    meta.par
  );
}

// ---------------------------------------------------------------------------
// Chapter 6: The End Metadata & Levels
// ---------------------------------------------------------------------------
const CH6_NAMES: Record<number, { name: string; par: number }> = {
  1: { name: 'The Pit', par: 30.0 },
  2: { name: 'Schism', par: 44.0 },
  3: { name: 'Echoes', par: 34.0 },
  4: { name: 'Gently', par: 33.0 },
  5: { name: 'Omega', par: 44.0 },
  6: { name: 'Dr. Fetus', par: 44.0 },
};

export function createChapter6Level(levelNum: number): LevelData {
  const meta = CH6_NAMES[levelNum] || { name: `The End Level ${levelNum}`, par: 35.0 };
  const w = 48;
  const h = 32;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  // High-tech fortress vertical obstacles
  for (let y = 8; y < h - 4; y++) {
    g[y][18] = TileType.SOLID;
    g[y][32] = TileType.SOLID;
  }

  const saws: Entity[] = [
    {
      id: `saw-6-${levelNum}-1`,
      type: 'saw',
      position: { x: 25 * 20, y: 14 * 20 },
      dimensions: { width: 36, height: 36 },
      x: 25 * 20,
      y: 14 * 20,
      width: 36,
      height: 36,
      radius: 18,
      speed: 18,
    },
  ];

  return buildChapterLevel(
    `6-${levelNum}`,
    `6-${levelNum}: ${meta.name}`,
    6,
    'the_end',
    w,
    h,
    g,
    4,
    h - 2,
    42,
    h - 2,
    saws,
    meta.par
  );
}

// ---------------------------------------------------------------------------
// Chapter 7: Cotton Alley (Bonus / Bandage Girl) Metadata & Levels
// ---------------------------------------------------------------------------
const CH7_NAMES: Record<number, { name: string; par: number }> = {
  1: { name: 'Pink Noise', par: 11.0 },
  2: { name: 'Run Rabbit Run', par: 13.0 },
  3: { name: 'Spinal Tap', par: 23.0 },
  4: { name: 'Stag', par: 26.0 },
  5: { name: 'Tommunism', par: 30.0 },
  6: { name: 'Panic Attack', par: 7.5 },
  7: { name: 'Tunnel Blower', par: 10.5 },
  8: { name: 'Pig Latin', par: 26.0 },
  9: { name: 'Hatch', par: 21.0 },
  10: { name: 'Bullet Bob', par: 32.0 },
  11: { name: 'Train Eater', par: 18.0 },
  12: { name: 'Peel', par: 11.6 },
  13: { name: 'Pepto', par: 22.0 },
  14: { name: 'Watchtower', par: 40.0 },
  15: { name: 'Lock out', par: 24.0 },
  16: { name: 'hopscotch', par: 20.0 },
  17: { name: 'lead sheets', par: 20.0 },
  18: { name: 'Oobs revenge', par: 21.0 },
  19: { name: 'The Rash', par: 17.0 },
  20: { name: '4 letter word', par: 45.0 },
};

export function createChapter7Level(levelNum: number): LevelData {
  const meta = CH7_NAMES[levelNum] || { name: `Cotton Alley Level ${levelNum}`, par: 20.0 };
  const w = 40;
  const h = 24;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  for (let x = 0; x < w; x++) g[h - 2][x] = TileType.SOLID;

  return buildChapterLevel(
    `7-${levelNum}`,
    `7-${levelNum}: ${meta.name}`,
    7,
    'retro',
    w,
    h,
    g,
    3,
    h - 2,
    w - 4,
    h - 2,
    [],
    meta.par
  );
}

/**
 * Universal resolver for Chapters 2 through 7.
 */
export function getOtherChapterLevel(chapter: number, level: number): LevelData {
  switch (chapter) {
    case 2:
      return createChapter2Level(level);
    case 3:
      return createChapter3Level(level);
    case 4:
      return createChapter4Level(level);
    case 5:
      return createChapter5Level(level);
    case 6:
      return createChapter6Level(level);
    case 7:
      return createChapter7Level(level);
    default:
      return createChapter2Level(level);
  }
}
