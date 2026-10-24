with open('src/engine/levels/chapter1.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = "  return buildLevel('1-20', '1-20: The End', w, h, g, 2, h - 2, 46, 11, saws, 7.5);\n}"

addition = """  return buildLevel('1-20', '1-20: The End', w, h, g, 2, h - 2, 46, 11, saws, 7.5);
}

// ---------------------------------------------------------------------------
// 1-21: Lil Slugger (Chapter 1 Boss Fight)
// High-octane sprint escaping the giant robotic buzzsaw boss across the forest!
// ---------------------------------------------------------------------------
function create1_21(): LevelData {
  const w = 100;
  const h = 22;
  const g = createGrid(w, h);
  addBorders(g, w, h);

  // Main runway floor
  for (let x = 0; x < w; x++) {
    g[h - 2][x] = TileType.SOLID;
  }

  // Obstacle hurdle 1 (x: 28)
  g[h - 3][28] = TileType.SOLID;
  g[h - 4][28] = TileType.SOLID;
  g[h - 5][28] = TileType.SOLID;

  // Obstacle hurdle 2 (x: 52)
  g[h - 3][52] = TileType.SOLID;
  g[h - 4][52] = TileType.SOLID;
  g[h - 5][52] = TileType.SOLID;
  g[h - 6][52] = TileType.SOLID;

  // Obstacle hurdle 3 (x: 74)
  g[h - 3][74] = TileType.SOLID;
  g[h - 4][74] = TileType.SOLID;

  // Saws between hurdles
  const saws: Entity[] = [
    {
      id: 'saw-boss-1',
      type: 'saw',
      position: { x: 38 * 20, y: (h - 3) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 38 * 20,
      y: (h - 3) * 20,
      width: 32,
      height: 32,
      radius: 16,
      speed: 15,
    },
    {
      id: 'saw-boss-2',
      type: 'saw',
      position: { x: 62 * 20, y: (h - 3) * 20 },
      dimensions: { width: 32, height: 32 },
      x: 62 * 20,
      y: (h - 3) * 20,
      width: 32,
      height: 32,
      radius: 16,
      speed: -15,
    },
  ];

  // Final wall barrier where Lil Slugger crashes (x: 90)
  for (let y = 6; y < h - 2; y++) {
    g[y][90] = TileType.SOLID;
    g[y][91] = TileType.SOLID;
  }

  // Bandage Girl sanctuary platform on top of the barrier
  for (let x = 90; x < 98; x++) {
    g[6][x] = TileType.SOLID;
  }

  return buildLevel('1-21', '1-21: Lil Slugger (BOSS)', w, h, g, 4, h - 2, 94, 6, saws, 22.0);
}"""

if target in content:
    content = content.replace(target, addition)
    content = content.replace("'1-20': create1_20(),", "'1-20': create1_20(),\n  '1-21': create1_21(),\n  'boss1': create1_21(),")
    content = content.replace("CHAPTER_1_FALLBACK_LEVELS['1-20'],", "CHAPTER_1_FALLBACK_LEVELS['1-20'],\n    CHAPTER_1_FALLBACK_LEVELS['1-21'],")
    with open('src/engine/levels/chapter1.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated chapter1.ts successfully!')
else:
    print('Target not found in chapter1.ts')
