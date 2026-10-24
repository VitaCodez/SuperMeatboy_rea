// Comprehensive Test Suite for PhysicsEngine and PlayerController
import { PhysicsEngine, Box } from './physics';
import { PlayerController } from './playerController';
import { LevelData, TileType, InputState } from './types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

function createDummyLevel(grid?: number[][]): LevelData {
  let g = grid;
  if (!g) {
    // 80 columns by 9 rows level with floor and ceiling
    g = Array.from({ length: 9 }, (_, r) =>
      Array.from({ length: 80 }, (_, c) => (r === 0 || r === 8 || c === 0 || c === 79 ? 1 : 0))
    );
  }

  return {
    id: 'test-1',
    name: 'Test Level',
    chapter: 1,
    theme: 'forest',
    isDarkWorld: false,
    width: g[0].length,
    height: g.length,
    tileSize: 16,
    tileGrid: g,
    entities: [],
    startPos: { x: 32, y: 32 },
    goalPos: { x: 80, y: 32 },
    bounds: { minX: 0, minY: 0, maxX: g[0].length * 16, maxY: g.length * 16 },
    parTime: 10
  };
}

function emptyInput(): InputState {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpPressed: false,
    sprint: false,
    restart: false,
    pause: false
  };
}

console.log('=== RUNNING SUPER MEAT BOY PHYSICS & PLAYER TESTS ===\n');

// 1. CIRCLE & BUZZSAW COLLISION TESTS
{
  assert(PhysicsEngine.pointCircle(10, 10, 10, 10, 5), 'Point inside circle detects collision');
  assert(!PhysicsEngine.pointCircle(20, 20, 10, 10, 5), 'Point outside circle does not collide');

  const box: Box = { x: 0, y: 0, width: 14, height: 14 };
  assert(PhysicsEngine.boxCircle(box, 10, 10, 8), 'Box overlapping circle center detects collision');
  assert(!PhysicsEngine.boxCircle(box, 50, 50, 8), 'Far box does not collide with circle');

  const sawNearMiss = PhysicsEngine.checkSawCollision(box, 21.5, 7, 8, 0.88);
  assert(!sawNearMiss.hit, 'Forgiving buzzsaw radius prevents unfair collision on near edge miss');

  const sawDirectHit = PhysicsEngine.checkSawCollision(box, 15, 7, 8, 0.88);
  assert(sawDirectHit.hit, 'Direct hit on buzzsaw blade triggers kill');
}

// 2. SPIKE DIRECTIONAL COLLISION TESTS
{
  const ts = 16;
  const boxOverTip: Box = { x: 2, y: 3, width: 12, height: 12 };
  const spikeUpCheck = PhysicsEngine.checkSpikeCollision(boxOverTip, 0, 0, ts, TileType.SPIKE_UP);
  assert(spikeUpCheck.hit && spikeUpCheck.normal.y === -1, 'SPIKE_UP triggers hazard with upward normal');

  const boxBesideTip: Box = { x: 15, y: 1, width: 12, height: 12 };
  const spikeUpSide = PhysicsEngine.checkSpikeCollision(boxBesideTip, 0, 0, ts, TileType.SPIKE_UP);
  assert(!spikeUpSide.hit, 'Airborne skimming past spike tip does not trigger unfair death');
}

// 3. SLOPE & ONE-WAY PLATFORM TESTS
{
  // SLOPE_UP_RIGHT: floor rises towards right
  const slopeGrid = [
    [0, 0, 0],
    [0, TileType.SLOPE_UP_RIGHT, 0],
    [1, 1, 1]
  ];
  const levelWithSlope = createDummyLevel(slopeGrid);
  const playerOnSlope: Box = { x: 16 + 4, y: 16, width: 8, height: 14 };
  const slopeCol = PhysicsEngine.checkTileCollision(playerOnSlope, levelWithSlope);
  assert(slopeCol.isSlope && slopeCol.slopeFloorY !== undefined, 'SLOPE_UP_RIGHT calculates dynamic floor height');

  // ONE-WAY: only solid when landing from above
  const oneWayGrid = [
    [0, 0, 0],
    [0, TileType.ONE_WAY, 0],
    [0, 0, 0]
  ];
  const levelWithOneWay = createDummyLevel(oneWayGrid);
  // Platform is at row 1 (y = 16). Player height is 14.
  // When falling from y=0, prevBottom = 14 (above platform top 16).
  // Current y=4, currentBottom = 18 (crossed platform top 16).
  const fallingBox: Box = { x: 16, y: 4, width: 14, height: 14 };
  const oneWayHit = PhysicsEngine.checkTileCollision(fallingBox, levelWithOneWay, 0, 100);
  assert(oneWayHit.solid && oneWayHit.isOneWay, 'ONE_WAY platform blocks falling player from above');

  // Ascending through platform from below (prevY=20, vy=-100)
  const risingBox: Box = { x: 16, y: 14, width: 14, height: 14 };
  const oneWayPass = PhysicsEngine.checkTileCollision(risingBox, levelWithOneWay, 20, -100);
  assert(!oneWayPass.solid, 'ONE_WAY platform lets ascending player jump up through');
}

// 4. RUN SPEED & ACCELERATION (WALK vs SPRINT)
{
  const level = createDummyLevel();
  const player = new PlayerController(32, 100); // on ground at y=114 (above row 8)

  // Settle onto ground
  for (let i = 0; i < 20; i++) {
    player.update(emptyInput(), level);
  }
  assert(player.state.isGrounded, 'Player settles firmly on solid ground');

  // Walk Right (top speed = 250 px/s)
  const walkInput = { ...emptyInput(), right: true };
  for (let i = 0; i < 20; i++) {
    player.update(walkInput, level);
  }
  assert(player.state.vx > 200 && player.state.vx <= 250, `Player walk speed caps near 250 px/s (current: ${player.state.vx})`);

  // Sprint Right (top speed = 350 px/s)
  const sprintInput = { ...emptyInput(), right: true, sprint: true };
  for (let i = 0; i < 20; i++) {
    player.update(sprintInput, level);
  }
  assert(player.state.vx > 300 && player.state.vx <= 350.1, `Player sprint speed reaches 350 px/s (current: ${player.state.vx})`);

  // Skid Reversal
  let skidTriggered = false;
  const reverseInput = { ...emptyInput(), left: true, sprint: true };
  player.update(reverseInput, level, () => {
    skidTriggered = true;
  });
  assert(skidTriggered, 'Sharp direction reversal triggers skid deceleration hook');
}

// 5. COYOTE TIME TEST
{
  const level = createDummyLevel();
  const player = new PlayerController(32, 100);
  for (let i = 0; i < 10; i++) {
    player.update(emptyInput(), level);
  }

  // Force airborne state to simulate walking off ledge
  player.state.isGrounded = false;
  player.state.coyoteTimer = PlayerController.COYOTE_DURATION;

  // Jump within coyote window
  const jumpInput = { ...emptyInput(), jumpPressed: true, jump: true };
  player.update(jumpInput, level);
  assert(player.state.vy <= -500, `Coyote time allows valid jump after leaving ledge (vy: ${player.state.vy})`);
}

// 6. JUMP BUFFERING TEST
{
  const level = createDummyLevel();
  const player = new PlayerController(32, 50); // falling in mid air
  player.state.isGrounded = false;
  player.state.vy = 200;

  // Press jump 3 frames before landing
  const bufferInput = { ...emptyInput(), jumpPressed: true };
  player.update(bufferInput, level);
  assert(player.state.jumpBufferTimer > 0, 'Jump input queued in buffer');

  // Next frame player lands
  player.state.isGrounded = true;
  player.update({ ...emptyInput(), jump: true }, level);
  assert(player.state.vy <= -500, `Buffered jump executes immediately upon landing (vy: ${player.state.vy})`);
}

// 7. VARIABLE JUMP HEIGHT TEST
{
  const level = createDummyLevel();
  const playerHold = new PlayerController(32, 100);
  const playerTap = new PlayerController(32, 100);

  // Settle onto ground first
  for (let i = 0; i < 20; i++) {
    playerHold.update(emptyInput(), level);
    playerTap.update(emptyInput(), level);
  }

  // Both jump from ground
  const jumpPress = { ...emptyInput(), jumpPressed: true, jump: true };
  playerHold.update(jumpPress, level);
  playerTap.update(jumpPress, level);

  // playerHold keeps holding jump, playerTap releases immediately
  for (let f = 0; f < 15; f++) {
    playerHold.update({ ...emptyInput(), jump: true }, level);
    playerTap.update(emptyInput(), level);
  }

  assert(playerHold.state.y < playerTap.state.y, `Holding jump grants higher jump apex (Hold Y: ${playerHold.state.y}, Tap Y: ${playerTap.state.y})`);
}

// 8. WALL SLIDE & WALL JUMP TEST
{
  const level = createDummyLevel();
  const player = new PlayerController(17, 40); // right against left wall (x=16)
  player.state.isGrounded = false;
  player.state.wallDir = -1;
  player.state.vy = 400; // falling fast

  // Slide against left wall
  const slideInput = { ...emptyInput(), left: true };
  player.update(slideInput, level);
  assert(player.state.isWallSliding && player.state.vy <= 120.1, `Wall slide caps downward fall to ~120 px/s (vy: ${player.state.vy})`);

  // Wall Jump
  const wallJumpInput = { ...emptyInput(), jumpPressed: true, jump: true };
  player.update(wallJumpInput, level);
  assert(
    player.state.vx >= 350 && player.state.vy <= -480,
    `Wall jump kicks off horizontally (vx: ${player.state.vx}) and upwards (vy: ${player.state.vy})`
  );
  assert(player.state.wallJumpLockoutTimer > 0, 'Wall jump initiates steering lockout frames');
}

// 9. SQUASH & STRETCH DYNAMICS
{
  const level = createDummyLevel();
  const player = new PlayerController(32, 100);
  for (let i = 0; i < 10; i++) player.update(emptyInput(), level);

  // Jump takeoff stretch
  player.update({ ...emptyInput(), jumpPressed: true, jump: true }, level);
  assert(player.state.squashY > 1.2 && player.state.squashX < 0.9, 'Jump stretches character vertically');

  // Decay back towards 1.0
  const prevY = player.state.squashY;
  for (let i = 0; i < 5; i++) {
    player.update(emptyInput(), level);
  }
  assert(player.state.squashY < prevY, 'Squash & stretch springs back smoothly to 1.0');
}

// 10. CHARACTER SWITCHING & SPECIAL ABILITIES
{
  const level = createDummyLevel();
  const player = new PlayerController(32, 50);

  // Commander Video Float
  player.setCharacter('commander_video');
  assert(player.props.specialAbility === 'float', 'Switched to Commander Video with float ability');
  player.state.isGrounded = false;
  player.state.vy = 0;
  player.update({ ...emptyInput(), jump: true }, level);
  assert(player.state.vy === 20, 'Commander Video floats mid-air with held jump');

  // The Kid Double Jump
  player.setCharacter('kid');
  assert(player.props.specialAbility === 'double_jump', 'Switched to The Kid with double jump ability');
  player.state.isGrounded = false;
  player.state.airJumpsLeft = 1;
  player.update({ ...emptyInput(), jumpPressed: true, jump: true }, level);
  assert(player.state.vy < -500 && player.state.airJumpsLeft === 0, 'The Kid performs mid-air double jump');

  // Flywrench Multi-Flap
  player.setCharacter('flywrench');
  assert(player.props.specialAbility === 'multi_flap', 'Switched to Flywrench with multi-flap ability');
  player.state.isGrounded = false;
  player.state.airJumpsLeft = 8;
  player.update({ ...emptyInput(), jumpPressed: true, jump: true }, level);
  assert(player.state.vy < -350 && player.state.airJumpsLeft === 7, 'Flywrench flaps wings upwards mid-air');
}

console.log('\n🎉 ALL 10 TESTS PASSED FLAWLESSLY! SUPER MEAT BOY PHYSICS READY!');
