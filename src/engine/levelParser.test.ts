/**
 * Test Suite for Super Meat Boy Level Parser & Fallback Levels
 * Verifies .smbl binary decoding, header/footer validation, palette extraction,
 * and confirms that all 20 Chapter 1 fallback levels are valid and playable.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  parseSMBL,
  loadLevel,
  getLevel,
  getPrebakedChapter1Levels,
  CHAPTER_1_FALLBACK_LEVELS,
  SMBL_MAGIC_TL02,
  SMBL_MAGIC_TL01,
  SMBL_FOOTER_TEND,
} from './levelParser';
import { TileType, createPlayerState } from './types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

async function runTests() {
  console.log('========================================================');
  console.log('Running Level Parser & Types Verification Suite');
  console.log('========================================================\n');

  // --- Test 1: Verify types & factories ---
  console.log('--- Test Group 1: Types & Runtime Factories ---');
  assert(TileType.EMPTY === 0, 'TileType.EMPTY is 0');
  assert(TileType.SOLID === 1, 'TileType.SOLID is 1');
  assert(TileType.CRUMBLED === 3, 'TileType.CRUMBLED is 3');
  assert(TileType.ONE_WAY === 2, 'TileType.ONE_WAY is 2');
  assert(TileType.HAZARD === 4, 'TileType.HAZARD is 4');
  assert(TileType.LAVA === 5, 'TileType.LAVA is 5');
  assert(TileType.SPIKE === 6, 'TileType.SPIKE is 6');

  const pState = createPlayerState(100, 200);
  assert(pState.x === 100 && pState.y === 200, 'createPlayerState initializes x and y');
  assert(pState.pos.x === 100 && pState.pos.y === 200, 'createPlayerState initializes pos vector');
  assert(pState.vel.x === 0 && pState.vel.y === 0, 'createPlayerState initializes vel vector');
  assert(pState.isDead === false && pState.isWin === false, 'Player starts alive and un-won');

  // --- Test 2: Binary .smbl Parser with Real Level Files ---
  console.log('\n--- Test Group 2: Binary .smbl Parsing ---');
  const level1Path = path.resolve(process.cwd(), 'public', 'assets', 'levels', '1-1.smbl');
  if (fs.existsSync(level1Path)) {
    const rawBuffer = fs.readFileSync(level1Path);
    const level1 = parseSMBL(rawBuffer, '1-1: Hello World');

    assert(level1.id === '1-1', `Parsed level ID is '1-1' (got: ${level1.id})`);
    assert(level1.theme === 'forest', `Parsed theme is 'forest' (got: ${level1.theme})`);
    assert(level1.width === 38 && level1.height === 40, `Authentic 1-1 dimensions: ${level1.width}x${level1.height}`);
    assert(level1.tileGrid.length === level1.height, 'tileGrid row count matches height');
    assert(level1.tileGrid[0].length === level1.width, 'tileGrid column count matches width');
    assert(level1.startPos.x >= 130 && level1.startPos.x <= 160, `1-1 start x near left edge (${level1.startPos.x})`);
    assert(level1.startPos.y >= 550 && level1.startPos.y <= 580, `1-1 start y near bottom (${level1.startPos.y})`);
    assert(level1.goalPos.x >= 350 && level1.goalPos.x <= 380, `1-1 goal x on central pillar (${level1.goalPos.x})`);
    assert(level1.goalPos.y >= 420 && level1.goalPos.y <= 450, `1-1 goal y on pillar top (${level1.goalPos.y})`);
    assert(!level1.entities.some((e) => e.type === 'saw'), '1-1 has no lethal saws');
    assert(level1.entities.length >= 2, 'Entities include at least start and Bandage Girl');

    const hasStart = level1.entities.some((e) => e.type === 'meatboy_start');
    const hasGoal = level1.entities.some((e) => e.type === 'bandage_girl');
    assert(hasStart, 'Contains meatboy_start entity');
    assert(hasGoal, 'Contains bandage_girl entity');

    // Test TL01 format file
    const level4Path = path.resolve(process.cwd(), 'public', 'assets', 'levels', '1-4.smbl');
    if (fs.existsSync(level4Path)) {
      const raw4 = fs.readFileSync(level4Path);
      const level4 = parseSMBL(raw4, '1-4: The Catch');
      assert(level4.id === '1-4', `Parsed 1-4 level ID is '1-4'`);
      assert(level4.theme === 'forest', `1-4 theme is 'forest'`);
    }

    // Vertical "Levee" room: 44x54, goal above the bottom spawn.
    const level10Path = path.resolve(process.cwd(), 'public', 'assets', 'levels', '1-10.smbl');
    if (fs.existsSync(level10Path)) {
      const level10 = parseSMBL(fs.readFileSync(level10Path), '1-10: The Levee');
      assert(level10.width === 44 && level10.height === 54, `Authentic 1-10 dimensions: ${level10.width}x${level10.height}`);
      assert(level10.entities.filter((e) => e.type === 'saw').length === 11, '1-10 has 11 wall saws');
      assert(level10.goalPos.y < level10.startPos.y, '1-10 goal is above the bottom spawn');
    }
  } else {
    console.warn('public/assets/levels/1-1.smbl not found locally, skipping binary disk test.');
  }

  // --- Test 3: Invalid SMBL Error Handling ---
  console.log('\n--- Test Group 3: Error Handling ---');
  let threwBadMagic = false;
  try {
    const badBuffer = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    parseSMBL(badBuffer);
  } catch (err: any) {
    threwBadMagic = true;
  }
  assert(threwBadMagic, 'parseSMBL rejects invalid magic header');

  // --- Test 4: Pre-baked Chapter 1 Levels (1-1 to 1-21) ---
  console.log('\n--- Test Group 4: Pre-baked Chapter 1 Levels (1-1 to 1-21) ---');
  const allChapter1 = getPrebakedChapter1Levels();
  assert(allChapter1.length === 21, `Exactly 21 Chapter 1 levels loaded (got: ${allChapter1.length})`);

  for (let i = 1; i <= 21; i++) {
    const levelId = `1-${i}`;
    const level = CHAPTER_1_FALLBACK_LEVELS[levelId];
    assert(!!level, `Level ${levelId} exists in catalog`);
    assert(level.id === levelId, `Level ${levelId} ID is correct`);
    assert(level.chapter === 1, `Level ${levelId} belongs to chapter 1`);
    assert(level.theme === 'forest', `Level ${levelId} theme is 'forest'`);
    assert(level.width >= 20, `Level ${levelId} width is >= 20 (got: ${level.width})`);
    assert(level.height >= 15, `Level ${levelId} height is >= 15 (got: ${level.height})`);
    assert(level.tileGrid.length === level.height, `Level ${levelId} tileGrid height matches`);
    assert(level.tileGrid[0].length === level.width, `Level ${levelId} tileGrid width matches`);
    assert(level.parTime > 0, `Level ${levelId} has target parTime (${level.parTime}s)`);

    const hasStart = level.entities.some((e) => e.type === 'meatboy_start');
    const hasGoal = level.entities.some((e) => e.type === 'bandage_girl');
    assert(hasStart, `Level ${levelId} has meatboy_start entity`);
    assert(hasGoal, `Level ${levelId} has bandage_girl entity`);

    // Verify bounds containment
    assert(
      level.bounds.maxX === level.width * level.tileSize &&
        level.bounds.maxY === level.height * level.tileSize,
      `Level ${levelId} bounds match width/height * tileSize`
    );
  }

  // Verify specific hazard levels
  const level1_4 = getLevel('1-4');
  assert(level1_4.entities.some((e) => e.type === 'saw'), '1-4 contains buzzsaw hazard');

  const level1_8 = getLevel('1-8');
  assert(
    level1_8.entities.some((e) => e.type === 'crumble_block'),
    '1-8 contains crumbling block entity'
  );

  const level1_21 = getLevel('1-21');
  assert(level1_21.entities.some((e) => e.type === 'boss'), '1-21 contains Lil Slugger boss entity');

  // --- Test 5: Asynchronous loadLevel ---
  console.log('\n--- Test Group 5: Asynchronous loadLevel ---');
  const loadedAsync = await loadLevel(1, 1);
  assert(loadedAsync.id === '1-1', `loadLevel(1, 1) resolved level 1-1`);
  assert(loadedAsync.name.includes('Hello World'), `loadLevel(1, 1) contains 'Hello World'`);

  console.log('\n========================================================');
  console.log('🎉 ALL LEVEL PARSER & TYPES TESTS PASSED CLEANLY! 🎉');
  console.log('========================================================');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
