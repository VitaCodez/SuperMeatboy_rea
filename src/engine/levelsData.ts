// Levels Data for Super Meat Boy: Chapter 1 (The Forest) and beyond
import { LevelData, TileType } from './types';

// Helper to create empty grid
function createEmptyGrid(width: number, height: number): number[][] {
  const grid: number[][] = [];
  for (let y = 0; y < height; y++) {
    grid.push(new Array(width).fill(TileType.EMPTY));
  }
  return grid;
}

// 1-1: Hello World (Start on left, flat terrain with two small steps, Bandage Girl on right)
function createLevel1_1(): LevelData {
  const width = 30;
  const height = 18;
  const grid = createEmptyGrid(width, height);

  // Outer border & floor
  for (let x = 0; x < width; x++) {
    grid[height - 1][x] = TileType.SOLID;
    grid[height - 2][x] = TileType.SOLID;
    grid[0][x] = TileType.SOLID;
  }
  for (let y = 0; y < height; y++) {
    grid[y][0] = TileType.SOLID;
    grid[y][width - 1] = TileType.SOLID;
  }

  // Small steps in middle
  grid[height - 3][12] = TileType.SOLID;
  grid[height - 3][13] = TileType.SOLID;
  grid[height - 3][18] = TileType.SOLID;
  grid[height - 4][18] = TileType.SOLID;
  grid[height - 3][19] = TileType.SOLID;
  grid[height - 4][19] = TileType.SOLID;

  return {
    id: '1-1',
    name: '1-1: Hello World',
    chapter: 1,
    theme: 'forest',
    isDarkWorld: false,
    width,
    height,
    tileSize: 20,
    tileGrid: grid,
    startPos: { x: 3 * 20, y: (height - 3) * 20 - 14 },
    goalPos: { x: (width - 4) * 20, y: (height - 3) * 20 - 14 },
    entities: [
      {
        id: 'bg-1',
        type: 'bandage_girl',
        x: (width - 4) * 20,
        y: (height - 3) * 20 - 18,
        width: 16,
        height: 18
      }
    ],
    bounds: { minX: 0, minY: 0, maxX: width * 20, maxY: height * 20 },
    parTime: 1.8
  };
}

// 1-2: The Grip (Wall jumping intro - tall wall in center)
function createLevel1_2(): LevelData {
  const width = 32;
  const height = 22;
  const grid = createEmptyGrid(width, height);

  for (let x = 0; x < width; x++) {
    grid[height - 1][x] = TileType.SOLID;
    grid[height - 2][x] = TileType.SOLID;
    grid[0][x] = TileType.SOLID;
  }
  for (let y = 0; y < height; y++) {
    grid[y][0] = TileType.SOLID;
    grid[y][width - 1] = TileType.SOLID;
  }

  // High barrier wall requiring wall jumps
  for (let y = 7; y < height - 2; y++) {
    grid[y][14] = TileType.SOLID;
    grid[y][15] = TileType.SOLID;
  }

  // Left wall jump kick-off pillar
  for (let y = 11; y < height - 2; y++) {
    grid[y][8] = TileType.SOLID;
  }

  return {
    id: '1-2',
    name: '1-2: The Grip',
    chapter: 1,
    theme: 'forest',
    isDarkWorld: false,
    width,
    height,
    tileSize: 20,
    tileGrid: grid,
    startPos: { x: 3 * 20, y: (height - 3) * 20 - 14 },
    goalPos: { x: 26 * 20, y: (height - 3) * 20 - 14 },
    entities: [
      {
        id: 'bg-2',
        type: 'bandage_girl',
        x: 26 * 20,
        y: (height - 3) * 20 - 18,
        width: 16,
        height: 18
      }
    ],
    bounds: { minX: 0, minY: 0, maxX: width * 20, maxY: height * 20 },
    parTime: 3.2
  };
}

// 1-3: Elevator (Narrow tall shaft with alternating wall jumps)
function createLevel1_3(): LevelData {
  const width = 24;
  const height = 36;
  const grid = createEmptyGrid(width, height);

  for (let x = 0; x < width; x++) {
    grid[height - 1][x] = TileType.SOLID;
    grid[0][x] = TileType.SOLID;
  }
  for (let y = 0; y < height; y++) {
    grid[y][0] = TileType.SOLID;
    grid[y][width - 1] = TileType.SOLID;
    // Central shaft walls
    if (y > 4 && y < height - 2) {
      grid[y][7] = TileType.SOLID;
      grid[y][16] = TileType.SOLID;
    }
  }

  // Top platform for Bandage Girl
  for (let x = 8; x < 16; x++) {
    grid[5][x] = TileType.SOLID;
  }

  return {
    id: '1-3',
    name: '1-3: Elevator',
    chapter: 1,
    theme: 'forest',
    isDarkWorld: false,
    width,
    height,
    tileSize: 20,
    tileGrid: grid,
    startPos: { x: 11 * 20, y: (height - 2) * 20 - 14 },
    goalPos: { x: 11 * 20, y: 4 * 20 - 18 },
    entities: [
      {
        id: 'bg-3',
        type: 'bandage_girl',
        x: 11 * 20,
        y: 4 * 20 - 18,
        width: 16,
        height: 18
      }
    ],
    bounds: { minX: 0, minY: 0, maxX: width * 20, maxY: height * 20 },
    parTime: 4.5
  };
}

// 1-4: The Catch (First spinning buzzsaws!)
function createLevel1_4(): LevelData {
  const width = 34;
  const height = 20;
  const grid = createEmptyGrid(width, height);

  for (let x = 0; x < width; x++) {
    grid[height - 1][x] = TileType.SOLID;
    grid[height - 2][x] = TileType.SOLID;
    grid[0][x] = TileType.SOLID;
  }
  for (let y = 0; y < height; y++) {
    grid[y][0] = TileType.SOLID;
    grid[y][width - 1] = TileType.SOLID;
  }

  // Pit in center
  for (let x = 12; x <= 20; x++) {
    grid[height - 1][x] = TileType.HAZARD;
    grid[height - 2][x] = TileType.EMPTY;
  }

  return {
    id: '1-4',
    name: '1-4: The Catch',
    chapter: 1,
    theme: 'forest',
    isDarkWorld: false,
    width,
    height,
    tileSize: 20,
    tileGrid: grid,
    startPos: { x: 4 * 20, y: (height - 3) * 20 - 14 },
    goalPos: { x: 27 * 20, y: (height - 3) * 20 - 14 },
    entities: [
      {
        id: 'bg-4',
        type: 'bandage_girl',
        x: 27 * 20,
        y: (height - 3) * 20 - 18,
        width: 16,
        height: 18
      },
      {
        id: 'saw-1',
        type: 'saw',
        x: 16 * 20,
        y: (height - 5) * 20,
        width: 32,
        height: 32,
        radius: 18,
        speed: 12
      }
    ],
    bounds: { minX: 0, minY: 0, maxX: width * 20, maxY: height * 20 },
    parTime: 3.0
  };
}

// 1-5: The Gap (Long sprint leap over three spinning buzzsaws)
function createLevel1_5(): LevelData {
  const width = 40;
  const height = 20;
  const grid = createEmptyGrid(width, height);

  for (let x = 0; x < width; x++) {
    grid[height - 1][x] = TileType.SOLID;
    grid[0][x] = TileType.SOLID;
  }
  for (let y = 0; y < height; y++) {
    grid[y][0] = TileType.SOLID;
    grid[y][width - 1] = TileType.SOLID;
  }

  // Large saw pit
  for (let x = 12; x <= 26; x++) {
    grid[height - 1][x] = TileType.HAZARD;
  }

  // Left launch platform
  for (let x = 0; x < 12; x++) {
    grid[height - 2][x] = TileType.SOLID;
    grid[height - 3][x] = TileType.SOLID;
  }

  // Right landing platform
  for (let x = 27; x < width; x++) {
    grid[height - 2][x] = TileType.SOLID;
    grid[height - 3][x] = TileType.SOLID;
  }

  return {
    id: '1-5',
    name: '1-5: The Gap',
    chapter: 1,
    theme: 'forest',
    isDarkWorld: false,
    width,
    height,
    tileSize: 20,
    tileGrid: grid,
    startPos: { x: 3 * 20, y: (height - 4) * 20 - 14 },
    goalPos: { x: 34 * 20, y: (height - 4) * 20 - 14 },
    entities: [
      {
        id: 'bg-5',
        type: 'bandage_girl',
        x: 34 * 20,
        y: (height - 4) * 20 - 18,
        width: 16,
        height: 18
      },
      {
        id: 'saw-1',
        type: 'saw',
        x: 15 * 20,
        y: (height - 4) * 20,
        width: 32,
        height: 32,
        radius: 18,
        speed: 15
      },
      {
        id: 'saw-2',
        type: 'saw',
        x: 19 * 20,
        y: (height - 4) * 20,
        width: 32,
        height: 32,
        radius: 18,
        speed: -15
      },
      {
        id: 'saw-3',
        type: 'saw',
        x: 23 * 20,
        y: (height - 4) * 20,
        width: 32,
        height: 32,
        radius: 18,
        speed: 15
      }
    ],
    bounds: { minX: 0, minY: 0, maxX: width * 20, maxY: height * 20 },
    parTime: 2.8
  };
}

export const CHAPTER_1_LEVELS: LevelData[] = [
  createLevel1_1(),
  createLevel1_2(),
  createLevel1_3(),
  createLevel1_4(),
  createLevel1_5()
];

export function getLevelById(id: string): LevelData {
  const found = CHAPTER_1_LEVELS.find(lvl => lvl.id === id);
  return found || CHAPTER_1_LEVELS[0];
}
