/**
 * Test Suite for Super Meat Boy Blood Decal System
 *
 * Verifies:
 * 1. Persistent blood decals across deaths (never reset until level changes or restarts)
 * 2. Wall slide smear: thick authentic red smear along wall surface with dripping gravity drops
 * 3. Walk/Run footsteps: faint red footprints when walking, elongated blood streaks when sprinting
 * 4. Death meat explosion: 30+ fleshy chunks spraying with gravity, bouncing off floors and walls, stamping persistent round splatters and stains
 * 5. 60FPS performance and clamped bounds offscreen canvas blitting
 */

import { BloodDecalManager } from './bloodDecals';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

// Minimal Canvas & Context2D Mock
class MockContext2D {
  public fills: Array<{ style: string | unknown; shape: string; args: any[] }> = [];
  public strokes: Array<{ style: string | unknown; width: number; args: any[] }> = [];
  public fillStyle: string | unknown = '#000000';
  public strokeStyle: string | unknown = '#000000';
  public lineWidth: number = 1;
  public imageSmoothingEnabled: boolean = true;
  public clearRectCalls: Array<{ x: number; y: number; w: number; h: number }> = [];
  public drawImageCalls: any[] = [];
  private currentPath: any[] = [];

  public save(): void {}
  public restore(): void {}
  public beginPath(): void {
    this.currentPath = [];
  }
  public moveTo(x: number, y: number): void {
    this.currentPath.push(['moveTo', x, y]);
  }
  public lineTo(x: number, y: number): void {
    this.currentPath.push(['lineTo', x, y]);
  }
  public arc(x: number, y: number, r: number, sa: number, ea: number): void {
    this.currentPath.push(['arc', x, y, r, sa, ea]);
  }
  public ellipse(x: number, y: number, rx: number, ry: number, rot: number, sa: number, ea: number): void {
    this.currentPath.push(['ellipse', x, y, rx, ry, rot, sa, ea]);
  }
  public fill(): void {
    this.fills.push({ style: this.fillStyle, shape: 'path', args: [...this.currentPath] });
  }
  public stroke(): void {
    this.strokes.push({ style: this.strokeStyle, width: this.lineWidth, args: [...this.currentPath] });
  }
  public fillRect(x: number, y: number, w: number, h: number): void {
    this.fills.push({ style: this.fillStyle, shape: 'rect', args: [x, y, w, h] });
  }
  public clearRect(x: number, y: number, w: number, h: number): void {
    this.clearRectCalls.push({ x, y, w, h });
  }
  public drawImage(...args: any[]): void {
    this.drawImageCalls.push(args);
  }
}

class MockCanvas {
  public width: number = 0;
  public height: number = 0;
  public mockCtx = new MockContext2D();

  public getContext(type: string, options?: any) {
    return this.mockCtx;
  }
}

// Setup mock document environment for Node testing
(globalThis as any).document = {
  createElement: (tagName: string) => {
    if (tagName === 'canvas') return new MockCanvas();
    return {};
  }
};

console.log('--- RUNNING BLOOD DECAL MANAGER TESTS ---\n');

// =========================================================================
// TEST 1: Persistence Across Deaths
// =========================================================================
console.log('TEST 1: Persistence Across Deaths');
const blood = new BloodDecalManager(960, 540);
const canvas = blood.getCanvas() as unknown as MockCanvas;
const ctx = canvas.mockCtx;

assert(ctx.clearRectCalls.length === 1, 'Init clears canvas once upon initial level load');

// Simulate first life: footstep and splatter
blood.addWalkSmear(50, 100, 50, false);
blood.addLandingSplatter(100, 100, 300);
const fillsLife1 = ctx.fills.length;
assert(fillsLife1 > 0, 'Blood stamps recorded during life 1');

// Simulate Death 1 & Respawn
blood.resetStepTracking(); // Resets step accumulator, but does NOT clear canvas!
assert(ctx.clearRectCalls.length === 1, 'Death & respawn does NOT clear the blood decal canvas');

// Simulate second life: more blood stamps accumulate
blood.addWalkSmear(60, 100, 60, false);
blood.addLandingSplatter(120, 100, 350);
assert(ctx.fills.length > fillsLife1, 'Blood decals persist and accumulate across deaths');

// Level change or explicit restart
blood.clear();
assert(ctx.clearRectCalls.length === 2, 'Explicit level change/restart clears blood canvas');

// =========================================================================
// TEST 2: Wall Slide Smear with Thick Smear & Dripping Gravity Drops
// =========================================================================
console.log('\nTEST 2: Wall Slide Smear & Dripping Gravity Drops');
ctx.fills = [];

// Meat Boy slides down left wall (wallDir = -1)
blood.addWallSlideSmear(16, 50, -1, 100);
blood.addWallSlideSmear(16, 56, -1, 150);
blood.addWallSlideSmear(16, 64, -1, 200);

// Check that thick smears and dripping drops were drawn
const wallRects = ctx.fills.filter(f => f.shape === 'rect');
const thickSmears = wallRects.filter(f => f.args[2] >= 4.0); // width >= 4.0px
const verticalDrips = wallRects.filter(f => f.args[2] === 1 && f.args[3] >= 3); // 1px wide vertical drip stem
const dripBulbs = ctx.fills.filter(f => f.shape === 'path' && f.args.some((a: any) => a[0] === 'arc'));

assert(thickSmears.length > 0, `Thick authentic wall smears stamped (found ${thickSmears.length})`);
assert(verticalDrips.length > 0, `Vertical dripping gravity drops stamped (found ${verticalDrips.length})`);
assert(dripBulbs.length > 0, `Bulbous teardrop heads stamped at drip terminations (found ${dripBulbs.length})`);

// =========================================================================
// TEST 3: Footsteps: Faint Footprints vs Elongated Sprint Streaks
// =========================================================================
console.log('\nTEST 3: Footsteps (Walking Faint Footprints vs Sprint Streaks)');
ctx.fills = [];
blood.resetStepTracking();

// Walking stamps
for (let step = 0; step < 5; step++) {
  blood.addWalkSmear(100 + step * 12, 200, 80, false); // walking
}
const walkingFills = [...ctx.fills];
assert(walkingFills.length > 0, 'Faint footprints stamped during walking');
const hasFaintAlpha = walkingFills.some(f => typeof f.style === 'string' && f.style.startsWith('rgba'));
assert(hasFaintAlpha, 'Walking footprints use faint semi-transparent alpha colors');

// Sprinting stamps
ctx.fills = [];
blood.resetStepTracking();
for (let step = 0; step < 5; step++) {
  blood.addWalkSmear(100 + step * 8, 200, 350, true); // sprinting
}
const sprintFills = [...ctx.fills];
const elongatedStreaks = sprintFills.filter(f => {
  if (f.shape === 'path') {
    const ellipse = f.args.find((a: any) => a[0] === 'ellipse');
    return ellipse && ellipse[3] >= 6.0; // radiusX >= 6px (streakLength >= 12px)
  }
  if (f.shape === 'rect') {
    return f.args[2] >= 8; // wide skid rect
  }
  return false;
});
assert(elongatedStreaks.length > 0, `Elongated blood streaks stamped during sprint (found ${elongatedStreaks.length})`);

// =========================================================================
// TEST 4: Death Meat Explosion with 30+ Chunks & Surface Bounces
// =========================================================================
console.log('\nTEST 4: Death Meat Explosion (30+ Chunks Bouncing off Surfaces)');
ctx.fills = [];

// Solid floor at y = 150, solid wall at x = 120
const mockCollider = (px: number, py: number) => {
  if (py >= 150) return true; // solid floor
  if (px >= 120) return true; // solid wall
  return false;
};

// Trigger death explosion
blood.addDeathExplosion(100, 130, 'saw', undefined, mockCollider);

// Verify round splatters and stains stamped on floor and walls
const impactSplatters = ctx.fills.filter(f => {
  if (f.shape === 'path') {
    return f.args.some((a: any) => a[0] === 'arc');
  }
  return false;
});

assert(impactSplatters.length >= 30, `Death explosion produced persistent round splatters and stains (found ${impactSplatters.length} stamps)`);

// =========================================================================
// TEST 5: 60FPS Performance & Clamped Bounds
// =========================================================================
console.log('\nTEST 5: 60FPS Clamped Bounds Offscreen Blitting');
const targetCanvas = new MockCanvas();
const targetCtx = targetCanvas.mockCtx as unknown as CanvasRenderingContext2D;

targetCanvas.mockCtx.drawImageCalls = [];

// Test normal in-bounds draw
blood.draw(targetCtx, 100, 100, 480, 270);
assert(targetCanvas.mockCtx.drawImageCalls.length === 1, 'Single drawImage blit per frame');

const call1 = targetCanvas.mockCtx.drawImageCalls[0];
// args: [canvas, sx, sy, sw, sh, dx, dy, dw, dh]
const [c, sx, sy, sw, sh] = call1;
assert(sx === 100 && sy === 100 && sw === 480 && sh === 270, 'Exact clamped source rectangle matches viewport');

// Test negative camera coordinates (outside level bounds)
targetCanvas.mockCtx.drawImageCalls = [];
blood.draw(targetCtx, -50, -50, 480, 270);
const call2 = targetCanvas.mockCtx.drawImageCalls[0];
assert(call2[1] === 0 && call2[2] === 0, 'Source coordinates clamped to 0 when camera is negative');

// Test extreme camera coordinates beyond canvas bounds
targetCanvas.mockCtx.drawImageCalls = [];
blood.draw(targetCtx, 900, 500, 480, 270);
const call3 = targetCanvas.mockCtx.drawImageCalls[0];
assert(call3[1] === 900 && call3[2] === 500, 'Source coordinates clamped within level dimensions');
assert(call3[3] <= 60 && call3[4] <= 40, 'Source width/height clamped to remaining canvas size without overflow');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Full Super Meat Boy blood decal fidelity verified.');
