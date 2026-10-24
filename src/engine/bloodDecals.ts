/**
 * Super Meat Boy - Persistent Blood Decal System
 *
 * Maintains a persistent offscreen canvas matching level dimensions.
 * Decals accumulate across runs, deaths, wall slides, and footstep smears
 * for the entire session, creating the iconic blood-soaked look.
 *
 * Requirements:
 * 1. Persistent blood decals across deaths (never reset until level changes or restarts)
 * 2. Wall slide smear: thick authentic red smear along the wall surface with dripping gravity drops
 * 3. Walk/Run footsteps: faint red footprints when walking, elongated blood streaks when sprinting
 * 4. Death meat explosion: 30+ fleshy chunks spraying outwards with gravity, bouncing off floors
 *    and walls, stamping persistent round splatters and stains on impact
 * 5. Ensure performance remains 60FPS using an offscreen canvas with clamped bounds.
 */

export interface BloodDecalConfig {
  maxDripDistance?: number;
  enableDrips?: boolean;
}

export type BloodSurfaceType = 'floor' | 'wall' | 'ceiling' | 'generic';

export interface ActiveMeatChunk {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  bounces: number;
  maxBounces: number;
  restitution: number;
  life: number;
  maxLife: number;
}

export class BloodDecalManager {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 0;
  private height: number = 0;

  // Step and slide smear tracking
  private lastWalkX: number = -9999;
  private lastWalkY: number = -9999;
  private lastSlideY: number = -9999;
  private lastSlideX: number = -9999;
  private lastSlideDir: number = 0;
  private stepDistanceAccumulator: number = 0;
  private slideDistanceAccumulator: number = 0;
  private footstepToggle: boolean = false;

  // Optional stored tile collider for collision queries
  private tileCollider: ((px: number, py: number) => boolean) | null = null;

  // Active in-flight meat chunks (animated before settling into decals)
  private activeChunks: ActiveMeatChunk[] = [];
  private readonly maxActiveChunks: number = 120;

  // Rich Super Meat Boy crimson palette
  private readonly bloodColors = [
    '#250005', // Deep coagulated clot / dried blood crust
    '#3d0008', // Dark coagulated / dry blood
    '#5c000e', // Deep venous red
    '#800016', // Medium crimson
    '#9e011a', // Arterial red
    '#b80c23', // Bright fresh blood
    '#d61a35', // Meat highlight
    '#f02b48', // Specular flesh glint
  ];

  // Semi-transparent footprint washes for walking
  private readonly footprintColors = [
    'rgba(65, 2, 10, 0.40)',
    'rgba(95, 4, 15, 0.45)',
    'rgba(135, 8, 22, 0.50)',
    'rgba(165, 12, 28, 0.42)',
  ];

  // Saturated high-velocity sprint skid colors
  private readonly streakColors = [
    '#3d0008',
    '#6b0013',
    '#940118',
    '#b80c23',
    '#d61a35',
  ];

  constructor(width: number = 1920, height: number = 1080) {
    if (typeof document !== 'undefined') {
      this.init(width, height);
    }
  }

  /**
   * Initializes or resizes the persistent offscreen blood buffer matching level dimensions.
   * This is called on level load. Canvas contents are retained across deaths and runs.
   */
  public init(width: number, height: number): void {
    if (typeof document === 'undefined') return;

    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
    }

    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false });

    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.clearRect(0, 0, this.width, this.height);
    }

    this.activeChunks = [];
    this.resetStepTracking();
  }

  /**
   * Clears all blood decals (strictly on new level load or explicit restart).
   * Note: Decals NEVER clear on Meat Boy's death or respawn.
   */
  public clear(): void {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.activeChunks = [];
    this.resetStepTracking();
  }

  public reset(width?: number, height?: number): void {
    if (width && height) {
      this.init(width, height);
    } else {
      this.clear();
    }
  }

  /**
   * Resets step and slide position tracking to prevent spurious cross-screen smears
   * when Meat Boy respawns at the start point.
   */
  public resetStepTracking(): void {
    this.lastWalkX = -9999;
    this.lastWalkY = -9999;
    this.lastSlideY = -9999;
    this.lastSlideX = -9999;
    this.lastSlideDir = 0;
    this.stepDistanceAccumulator = 0;
    this.slideDistanceAccumulator = 0;
    this.footstepToggle = false;
  }

  public setTileCollider(collider: ((px: number, py: number) => boolean) | null): void {
    this.tileCollider = collider;
  }

  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public getRandomBloodColor(): string {
    const idx = Math.floor(Math.random() * this.bloodColors.length);
    return this.bloodColors[idx];
  }

  private getRandomFootprintColor(): string {
    const idx = Math.floor(Math.random() * this.footprintColors.length);
    return this.footprintColors[idx];
  }

  private getRandomStreakColor(): string {
    const idx = Math.floor(Math.random() * this.streakColors.length);
    return this.streakColors[idx];
  }

  /**
   * Stamped when Meat Boy walks or runs along the ground.
   * - Walking: faint red footprints alternating foot positions.
   * - Sprinting: elongated thick arterial blood streaks with trailing speed flecks.
   */
  public addWalkSmear(x: number, y: number, vx: number, isRunning: boolean = false): void {
    if (!this.ctx || !Number.isFinite(x) || !Number.isFinite(y)) return;

    // Detect teleport / respawn jump across map and reset tracking
    if (Math.hypot(x - this.lastWalkX, y - this.lastWalkY) > 48) {
      this.lastWalkX = x;
      this.lastWalkY = y;
      this.stepDistanceAccumulator = 0;
      return;
    }

    const dx = x - this.lastWalkX;
    const dy = y - this.lastWalkY;
    const dist = Math.hypot(dx, dy);

    this.stepDistanceAccumulator += dist;
    this.lastWalkX = x;
    this.lastWalkY = y;

    // Sprinting stamps frequently (every 6px) to form a continuous skid trail.
    // Walking paces out footsteps every 10px.
    const stampInterval = isRunning ? 6 : 10;
    if (this.stepDistanceAccumulator < stampInterval) {
      return;
    }
    this.stepDistanceAccumulator = 0;

    const ctx = this.ctx;
    const dir = vx >= 0 ? 1 : -1;

    // Bounds safety clamp
    const safeX = Math.max(2, Math.min(this.width - 2, x));
    const safeY = Math.max(2, Math.min(this.height - 2, y));

    ctx.save();

    if (isRunning) {
      // -------------------------------------------------------------
      // SPRINTING: Elongated, high-velocity blood streaks
      // -------------------------------------------------------------
      const streakLength = 12 + Math.random() * 12; // 12px - 24px elongated smear
      const streakThickness = 2.5 + Math.random() * 2.0; // 2.5px - 4.5px thick
      const streakStart = safeX;
      const streakEnd = safeX - dir * streakLength;

      // Dark coagulated skid foundation
      ctx.fillStyle = this.streakColors[0];
      ctx.beginPath();
      ctx.ellipse(
        (streakStart + streakEnd) / 2,
        safeY - 0.5,
        streakLength / 2,
        streakThickness / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Arterial crimson inner core streak
      ctx.fillStyle = this.getRandomStreakColor();
      const innerLen = streakLength * 0.75;
      ctx.fillRect(
        Math.floor(Math.min(streakStart, streakStart - dir * innerLen)),
        Math.floor(safeY - streakThickness * 0.4),
        Math.ceil(innerLen),
        Math.ceil(streakThickness * 0.8)
      );

      // Trailing speed flecks / skid splatter kicked backward
      const fleckCount = 1 + Math.floor(Math.random() * 3);
      for (let f = 0; f < fleckCount; f++) {
        const fleckDist = streakLength + 2 + Math.random() * 10;
        const fleckX = safeX - dir * fleckDist;
        const fleckY = safeY - 1.5 + Math.random() * 3;
        ctx.fillStyle = this.getRandomBloodColor();
        ctx.fillRect(Math.floor(fleckX), Math.floor(fleckY), 1, 1);
      }
    } else {
      // -------------------------------------------------------------
      // WALKING: Faint red footprints with rhythmic foot impressions
      // -------------------------------------------------------------
      this.footstepToggle = !this.footstepToggle;

      // Alternate left / right foot lateral offset
      const footOffsetX = this.footstepToggle ? -2.5 : 2.5;
      const footX = safeX + footOffsetX;
      const footY = safeY - 0.5;

      const footWidth = 3.2 + Math.random() * 0.8;
      const footHeight = 1.6 + Math.random() * 0.6;

      // Faint semi-transparent foot stamp
      ctx.fillStyle = this.getRandomFootprintColor();
      ctx.beginPath();
      ctx.ellipse(footX, footY, footWidth / 2, footHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Occasional faint heel/toe speckle
      if (Math.random() > 0.45) {
        ctx.fillStyle = this.getRandomFootprintColor();
        const speckleX = footX - dir * (footWidth * 0.6);
        const speckleY = footY + (Math.random() - 0.5) * 1.5;
        ctx.fillRect(Math.floor(speckleX), Math.floor(speckleY), 1, 1);
      }
    }

    ctx.restore();
  }

  /**
   * Stamped when Meat Boy slides down a wall.
   * Creates a thick authentic red smear along the wall surface with dripping gravity drops.
   *
   * @param x Wall contact x position
   * @param y Meat Boy vertical position
   * @param wallDir -1 for wall on left, 1 for wall on right
   * @param vy Vertical sliding velocity
   */
  public addWallSlideSmear(x: number, y: number, wallDir: -1 | 1, _vy: number): void {
    if (!this.ctx || !Number.isFinite(x) || !Number.isFinite(y)) return;

    // Detect jump/detach across map
    if (Math.abs(y - this.lastSlideY) > 36 || this.lastSlideDir !== wallDir) {
      this.lastSlideY = y;
      this.lastSlideX = x;
      this.lastSlideDir = wallDir;
      this.slideDistanceAccumulator = 0;
      return;
    }

    const dy = Math.abs(y - this.lastSlideY);
    this.slideDistanceAccumulator += dy;
    this.lastSlideY = y;
    this.lastSlideX = x;

    // Minimum distance threshold to avoid redundant over-drawing
    if (this.slideDistanceAccumulator < 3.0) return;
    this.slideDistanceAccumulator = 0;

    const ctx = this.ctx;
    ctx.save();

    // 1. Thick authentic wall smear
    // Meat Boy is 16px wide/tall; smear clings heavily to wall face (4.5px - 7.5px wide)
    const smearWidth = 4.5 + Math.random() * 3.0;
    const smearHeight = Math.max(dy, 4) + Math.random() * 4.0;

    // Align smear flush with the wall edge:
    // When wall is on the left (wallDir === -1), wall surface is at x. Smear hugs wall edge.
    // When wall is on the right (wallDir === 1), wall surface is at x. Smear hugs wall edge.
    const wallX = wallDir === -1 ? x - 1 : x - smearWidth + 1;
    const wallY = y - smearHeight;

    const safeX = Math.max(0, Math.min(this.width - smearWidth, wallX));
    const safeY = Math.max(0, Math.min(this.height - smearHeight, wallY));

    // Base coat: dark coagulated crimson backing
    ctx.fillStyle = '#3d0008';
    ctx.fillRect(Math.floor(safeX), Math.floor(safeY), Math.ceil(smearWidth), Math.ceil(smearHeight));

    // Core coat: rich arterial red with organic ragged edges
    ctx.fillStyle = this.getRandomBloodColor();
    const coreInset = 1.0;
    const coreWidth = Math.max(2, smearWidth - coreInset * 2);
    ctx.fillRect(
      Math.floor(safeX + (wallDir === -1 ? 0 : coreInset)),
      Math.floor(safeY + 1),
      Math.ceil(coreWidth),
      Math.max(1, Math.ceil(smearHeight - 2))
    );

    // Jagged flesh clumps along the slide surface
    const clumps = 2 + Math.floor(Math.random() * 3);
    for (let c = 0; c < clumps; c++) {
      ctx.fillStyle = this.getRandomBloodColor();
      const clumpX = safeX + Math.random() * smearWidth;
      const clumpY = safeY + Math.random() * smearHeight;
      const clumpSize = 1.5 + Math.random() * 2.0;
      ctx.fillRect(Math.floor(clumpX), Math.floor(clumpY), Math.ceil(clumpSize), Math.ceil(clumpSize));
    }

    // 2. Dripping gravity drops down the wall
    // Distinct vertical droplet streaks trailing downward under gravity with teardrop bulbs
    const dripCount = 1 + (Math.random() > 0.4 ? 1 : 0) + (Math.random() > 0.8 ? 1 : 0);
    for (let d = 0; d < dripCount; d++) {
      const dripX = wallDir === -1
        ? safeX + 1 + Math.random() * 2.5
        : safeX + smearWidth - 2.5 - Math.random() * 2.5;

      // Realistic drip lengths: short micro-drips (4-8px) to long gravity trickles (12-22px)
      const isLongDrip = Math.random() > 0.65;
      const dripLength = isLongDrip ? 12 + Math.random() * 10 : 4 + Math.random() * 6;
      const dripStartY = safeY + smearHeight * 0.7;
      const dripEndY = Math.min(this.height - 3, dripStartY + dripLength);
      const actualLength = dripEndY - dripStartY;

      if (actualLength > 2) {
        // Vertical dripping stream
        ctx.fillStyle = this.getRandomBloodColor();
        ctx.fillRect(Math.floor(dripX), Math.floor(dripStartY), 1, Math.ceil(actualLength));

        // Teardrop bulb at the terminus of the drip
        const bulbRadius = 1.2 + Math.random() * 1.0;
        ctx.fillStyle = '#5c000e'; // Dark pooled droplet
        ctx.beginPath();
        ctx.arc(dripX + 0.5, dripEndY, bulbRadius, 0, Math.PI * 2);
        ctx.fill();

        // Arterial specular highlight inside drip bulb
        ctx.fillStyle = '#b80c23';
        ctx.fillRect(Math.floor(dripX), Math.floor(dripEndY - 0.5), 1, 1);

        // Detached gravity micro-droplet falling further down
        if (isLongDrip && Math.random() > 0.4) {
          const detachedY = dripEndY + 3 + Math.random() * 6;
          if (detachedY < this.height - 2) {
            ctx.fillStyle = this.getRandomBloodColor();
            ctx.fillRect(Math.floor(dripX), Math.floor(detachedY), 1, 1);
          }
        }
      }
    }

    ctx.restore();
  }

  /**
   * Splatters blood droplets when Meat Boy lands on the ground.
   */
  public addLandingSplatter(x: number, y: number, impactSpeed: number = 300): void {
    if (!this.ctx || !Number.isFinite(x) || !Number.isFinite(y)) return;

    const ctx = this.ctx;
    ctx.save();

    const normalizedImpact = Math.min(1.8, Math.max(0.4, impactSpeed / 400));
    const dropletCount = Math.floor(9 * normalizedImpact + Math.random() * 6);

    // Central landing splat pool
    const centralRadius = 2.5 + normalizedImpact * 2.5;
    ctx.fillStyle = '#3d0008';
    ctx.beginPath();
    ctx.ellipse(x, y - 0.5, centralRadius, centralRadius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.getRandomBloodColor();
    ctx.beginPath();
    ctx.ellipse(x, y - 0.5, centralRadius * 0.7, centralRadius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Droplets splashing out laterally to left and right
    for (let i = 0; i < dropletCount; i++) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      const spreadDist = (4 + Math.random() * 20) * normalizedImpact;
      const dropX = x + dir * spreadDist;
      const dropY = y + (Math.random() - 0.5) * 2.5;
      const radius = 0.8 + Math.random() * 1.5;

      ctx.fillStyle = this.getRandomBloodColor();
      ctx.beginPath();
      ctx.ellipse(dropX, dropY, radius * 1.4, radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Splatters blood droplets when Meat Boy kicks off a wall.
   */
  public addWallJumpSplatter(x: number, y: number, wallDir: -1 | 1): void {
    if (!this.ctx || !Number.isFinite(x) || !Number.isFinite(y)) return;

    const ctx = this.ctx;
    ctx.save();

    const dropletCount = 6 + Math.floor(Math.random() * 5);
    const wallX = wallDir === -1 ? x : x - 2;

    // Contact wall patch
    ctx.fillStyle = '#5c000e';
    ctx.fillRect(Math.floor(wallX - 1), Math.floor(y - 4), 3, 8);
    ctx.fillStyle = this.getRandomBloodColor();
    ctx.fillRect(Math.floor(wallX), Math.floor(y - 3), 2, 6);

    // Spray outward away from the wall
    for (let i = 0; i < dropletCount; i++) {
      const sprayX = wallX + wallDir * (2 + Math.random() * 14);
      const sprayY = y + (Math.random() - 0.5) * 16;
      const size = 1 + Math.random() * 1.5;

      ctx.fillStyle = this.getRandomBloodColor();
      ctx.fillRect(Math.floor(sprayX), Math.floor(sprayY), Math.ceil(size), Math.ceil(size));
    }

    ctx.restore();
  }

  /**
   * Stamps a persistent round splatter and stain upon meat chunk impact.
   * Creates authentic Super Meat Boy round impact pools with concentric stains,
   * irregular perimeter lobes, satellite droplets, and gravity drips if on vertical surfaces.
   */
  public addMeatChunkSplatter(
    x: number,
    y: number,
    radius: number = 2.5,
    surfaceType: BloodSurfaceType = 'generic'
  ): void {
    if (!this.ctx || !Number.isFinite(x) || !Number.isFinite(y)) return;

    const safeX = Math.max(3, Math.min(this.width - 3, x));
    const safeY = Math.max(3, Math.min(this.height - 3, y));
    const rad = Math.max(1.2, radius);

    const ctx = this.ctx;
    ctx.save();

    // 1. Concentric soaked halo stain
    ctx.fillStyle = 'rgba(60, 0, 8, 0.45)';
    ctx.beginPath();
    ctx.arc(safeX, safeY, rad * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Main saturated round impact splatter
    ctx.fillStyle = this.getRandomBloodColor();
    ctx.beginPath();
    ctx.arc(safeX, safeY, rad, 0, Math.PI * 2);
    ctx.fill();

    // 3. Deep coagulated clot core
    ctx.fillStyle = '#260005';
    ctx.beginPath();
    ctx.arc(safeX, safeY, rad * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Irregular round perimeter lobes
    const lobeCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < lobeCount; i++) {
      const angle = (i / lobeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const dist = rad * (0.8 + Math.random() * 0.6);
      const lobeRad = Math.max(0.7, rad * (0.3 + Math.random() * 0.3));
      const lobeX = safeX + Math.cos(angle) * dist;
      const lobeY = safeY + Math.sin(angle) * dist;

      ctx.fillStyle = this.getRandomBloodColor();
      ctx.beginPath();
      ctx.arc(lobeX, lobeY, lobeRad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Satellite micro-droplets
    const satelliteCount = 3 + Math.floor(Math.random() * 5);
    for (let s = 0; s < satelliteCount; s++) {
      const satAngle = Math.random() * Math.PI * 2;
      const satDist = rad + 2 + Math.random() * 8;
      const satX = safeX + Math.cos(satAngle) * satDist;
      const satY = safeY + Math.sin(satAngle) * satDist;

      if (satX >= 0 && satX < this.width && satY >= 0 && satY < this.height) {
        ctx.fillStyle = this.getRandomBloodColor();
        ctx.fillRect(Math.floor(satX), Math.floor(satY), 1, 1);
      }
    }

    // 6. Gravity drip if on a wall surface or vertical impact
    if (surfaceType === 'wall' || Math.random() > 0.6) {
      const dripLength = 4 + Math.random() * 10;
      const dripEndY = Math.min(this.height - 2, safeY + dripLength);

      ctx.fillStyle = '#5c000e';
      ctx.fillRect(Math.floor(safeX), Math.floor(safeY + rad * 0.8), 1, Math.ceil(dripEndY - safeY));

      // Terminal teardrop bulb
      ctx.beginPath();
      ctx.arc(safeX + 0.5, dripEndY, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  public addSplatter(x: number, y: number, count: number = 10, speed: number = 100): void {
    if (!this.ctx || !Number.isFinite(x) || !Number.isFinite(y)) return;

    const ctx = this.ctx;
    ctx.save();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = (Math.random() * speed) / 8;
      const splatX = x + Math.cos(angle) * dist;
      const splatY = y + Math.sin(angle) * dist;
      const radius = 1 + Math.random() * 2;

      ctx.fillStyle = this.getRandomBloodColor();
      ctx.beginPath();
      ctx.arc(splatX, splatY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Triggered upon Meat Boy's death (hitting buzzsaw, spikes, or hazard).
   * Sprays 30+ fleshy chunks outwards with gravity, bouncing off floors and walls,
   * stamping persistent round splatters and stains on impact.
   *
   * @param x Death origin x
   * @param y Death origin y
   * @param source Death cause ('saw' | 'spike' | 'generic')
   * @param normal Optional surface normal at point of death
   * @param tileCollider Optional solid collision query (px, py) => boolean
   */
  public addDeathExplosion(
    x: number,
    y: number,
    _source: 'saw' | 'spike' | 'generic' = 'saw',
    normal?: { x: number; y: number },
    tileCollider?: (px: number, py: number) => boolean
  ): void {
    if (!this.ctx || !Number.isFinite(x) || !Number.isFinite(y)) return;

    const ctx = this.ctx;
    ctx.save();

    const collider = tileCollider || this.tileCollider;

    // 1. Central violent death impact pool & shredded flesh rays
    const centralPools = 6 + Math.floor(Math.random() * 4);
    for (let p = 0; p < centralPools; p++) {
      const ox = (Math.random() - 0.5) * 14;
      const oy = (Math.random() - 0.5) * 14;
      const r = 4 + Math.random() * 6;
      ctx.fillStyle = this.getRandomBloodColor();
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Directional meat shred rays
    const rayCount = 10 + Math.floor(Math.random() * 6);
    for (let r = 0; r < rayCount; r++) {
      const angle = (r / rayCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const rayLen = 8 + Math.random() * 16;
      ctx.strokeStyle = this.getRandomBloodColor();
      ctx.lineWidth = 1.5 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * rayLen, y + Math.sin(angle) * rayLen);
      ctx.stroke();
    }

    // 2. 35 to 50+ fleshy chunks spraying outwards with gravity,
    // bouncing off floors and walls, stamping persistent round splatters and stains on impact!
    const chunkCount = 36 + Math.floor(Math.random() * 16); // 36 - 51 fleshy chunks

    for (let i = 0; i < chunkCount; i++) {
      let angle = Math.random() * Math.PI * 2;

      // Hazard normal bias if available
      if (normal && (normal.x !== 0 || normal.y !== 0)) {
        const baseAngle = Math.atan2(normal.y, normal.x);
        angle = baseAngle + (Math.random() - 0.5) * Math.PI * 1.35;
      }

      const speed = 130 + Math.random() * 260; // Initial spray velocity
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed - (80 + Math.random() * 140); // Upward blast bias
      let chunkX = x + (Math.random() - 0.5) * 6;
      let chunkY = y + (Math.random() - 0.5) * 6;
      const radius = 1.8 + Math.random() * 2.6;

      const gravity = 760; // SMB gravity acceleration
      const restitution = 0.40 + Math.random() * 0.20;
      const maxBounces = 2 + Math.floor(Math.random() * 3); // 2 to 4 bounces
      let bounces = 0;

      // Ballistic physics trajectory simulation step-by-step
      const simDt = 0.016; // 60Hz physics step
      const maxSteps = 70; // Simulate up to ~1.1s of flight

      for (let step = 0; step < maxSteps; step++) {
        vy += gravity * simDt;
        vx *= 0.985;
        vy *= 0.985;

        const nextX = chunkX + vx * simDt;
        const nextY = chunkY + vy * simDt;

        let hit = false;
        let surface: BloodSurfaceType = 'floor';

        if (collider) {
          const hitFloor = collider(nextX, nextY + radius) && vy > 0;
          const hitCeil = collider(nextX, nextY - radius) && vy < 0;
          const hitWall = collider(nextX + Math.sign(vx) * radius, chunkY);

          if (hitFloor) {
            hit = true;
            surface = 'floor';
            chunkX = nextX;
            chunkY = Math.floor(nextY);
            vy = -vy * restitution;
            vx *= 0.65; // Floor friction
            bounces++;
          } else if (hitWall) {
            hit = true;
            surface = 'wall';
            chunkX = nextX;
            chunkY = nextY;
            vx = -vx * restitution;
            vy *= 0.85; // Wall friction
            bounces++;
          } else if (hitCeil) {
            hit = true;
            surface = 'ceiling';
            chunkX = nextX;
            chunkY = nextY;
            vy = -vy * restitution;
            bounces++;
          }
        } else {
          // Fallback bounds check if no custom tileCollider provided
          if (nextY >= this.height - 4 && vy > 0) {
            hit = true;
            surface = 'floor';
            chunkX = nextX;
            chunkY = this.height - 4;
            vy = -vy * restitution;
            vx *= 0.65;
            bounces++;
          } else if ((nextX <= 4 && vx < 0) || (nextX >= this.width - 4 && vx > 0)) {
            hit = true;
            surface = 'wall';
            chunkX = Math.max(4, Math.min(this.width - 4, nextX));
            chunkY = nextY;
            vx = -vx * restitution;
            bounces++;
          }
        }

        if (hit) {
          // Stamp persistent round splatters and stains on impact!
          this.addMeatChunkSplatter(chunkX, chunkY, radius * (0.8 + bounces * 0.2), surface);

          // Stop simulating if energy depleted or max bounces reached
          if (bounces >= maxBounces || Math.hypot(vx, vy) < 30) {
            // Settle final rest stain
            this.addMeatChunkSplatter(chunkX, chunkY, radius * 1.2, surface);
            break;
          }
        } else {
          chunkX = nextX;
          chunkY = nextY;
        }

        // Out-of-bounds containment
        if (chunkX < 0 || chunkX >= this.width || chunkY >= this.height) {
          break;
        }
      }

      // Also queue into active chunks for dynamic in-flight rendering if animated frames occur
      if (this.activeChunks.length < this.maxActiveChunks) {
        this.activeChunks.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (80 + Math.random() * 120),
          radius,
          color: this.getRandomBloodColor(),
          bounces: 0,
          maxBounces: 2 + Math.floor(Math.random() * 2),
          restitution: 0.45,
          life: 0,
          maxLife: 0.8 + Math.random() * 0.6,
        });
      }
    }

    // 3. Fine aerosolized blood spray mist
    const sprayDroplets = 24 + Math.floor(Math.random() * 16);
    for (let s = 0; s < sprayDroplets; s++) {
      const sprayAngle = Math.random() * Math.PI * 2;
      const sprayDist = 6 + Math.random() * 45;
      const spX = x + Math.cos(sprayAngle) * sprayDist;
      const spY = y + Math.sin(sprayAngle) * sprayDist;

      if (spX >= 0 && spX < this.width && spY >= 0 && spY < this.height) {
        ctx.fillStyle = this.getRandomBloodColor();
        ctx.fillRect(Math.floor(spX), Math.floor(spY), 1, 1);
      }
    }

    ctx.restore();
  }

  /**
   * Game loop update tick.
   * Simulates active in-flight meat chunks and stamps their impacts into the persistent canvas.
   */
  public update(
    dt: number,
    _level?: unknown,
    tileCollider?: (px: number, py: number) => boolean
  ): void {
    if (tileCollider) {
      this.tileCollider = tileCollider;
    }

    if (this.activeChunks.length === 0) return;

    const collider = this.tileCollider;
    const clampedDt = Math.min(dt, 0.05);

    for (let i = this.activeChunks.length - 1; i >= 0; i--) {
      const chunk = this.activeChunks[i];
      chunk.life += clampedDt;

      if (chunk.life >= chunk.maxLife) {
        this.addMeatChunkSplatter(chunk.x, chunk.y, chunk.radius * 0.9, 'floor');
        this.activeChunks.splice(i, 1);
        continue;
      }

      chunk.vy += 760 * clampedDt;
      chunk.vx *= Math.pow(0.985, clampedDt * 60);
      chunk.vy *= Math.pow(0.985, clampedDt * 60);

      const nextX = chunk.x + chunk.vx * clampedDt;
      const nextY = chunk.y + chunk.vy * clampedDt;

      let hit = false;
      let surface: BloodSurfaceType = 'floor';

      if (collider) {
        const isFloor = collider(nextX, nextY + chunk.radius) && chunk.vy > 0;
        const isWall = collider(nextX + Math.sign(chunk.vx) * chunk.radius, chunk.y);

        if (isFloor) {
          hit = true;
          surface = 'floor';
          chunk.bounces++;
          chunk.vy = -chunk.vy * chunk.restitution;
          chunk.vx *= 0.65;
          chunk.x = nextX;
          chunk.y = Math.floor(nextY);
        } else if (isWall) {
          hit = true;
          surface = 'wall';
          chunk.bounces++;
          chunk.vx = -chunk.vx * chunk.restitution;
          chunk.x = nextX;
          chunk.y = nextY;
        } else {
          chunk.x = nextX;
          chunk.y = nextY;
        }
      } else {
        chunk.x = nextX;
        chunk.y = nextY;
      }

      if (hit) {
        this.addMeatChunkSplatter(chunk.x, chunk.y, chunk.radius * 0.7, surface);

        if (chunk.bounces >= chunk.maxBounces) {
          this.addMeatChunkSplatter(chunk.x, chunk.y, chunk.radius, surface);
          this.activeChunks.splice(i, 1);
        }
      }
    }
  }

  public render(
    targetCtx: CanvasRenderingContext2D,
    cameraX: number = 0,
    cameraY: number = 0,
    viewportWidth?: number,
    viewportHeight?: number
  ): void {
    this.draw(targetCtx, cameraX, cameraY, viewportWidth, viewportHeight);
  }

  /**
   * Fast rendering: Blits the persistent offscreen blood canvas onto the target canvas.
   * Clamped bounds ensure exact viewport containment and guaranteed 60FPS performance.
   */
  public draw(
    targetCtx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth?: number,
    viewportHeight?: number
  ): void {
    if (!this.canvas || this.width <= 0 || this.height <= 0) return;

    if (viewportWidth !== undefined && viewportHeight !== undefined) {
      // 1. Calculate and strictly clamp source bounds within [0, 0, this.width, this.height]
      const sx = Math.max(0, Math.min(this.width, Math.floor(cameraX)));
      const sy = Math.max(0, Math.min(this.height, Math.floor(cameraY)));
      const maxAvailableWidth = Math.max(0, this.width - sx);
      const maxAvailableHeight = Math.max(0, this.height - sy);
      const sw = Math.min(maxAvailableWidth, Math.ceil(viewportWidth));
      const sh = Math.min(maxAvailableHeight, Math.ceil(viewportHeight));

      if (sw > 0 && sh > 0) {
        // Destination matches camera translation
        const dx = sx - cameraX;
        const dy = sy - cameraY;
        targetCtx.drawImage(this.canvas, sx, sy, sw, sh, dx, dy, sw, sh);
      }
    } else {
      targetCtx.drawImage(this.canvas, -cameraX, -cameraY);
    }

    // Render any active in-flight meat chunks before they settle
    if (this.activeChunks.length > 0) {
      targetCtx.save();
      for (let i = 0; i < this.activeChunks.length; i++) {
        const c = this.activeChunks[i];
        const screenX = c.x - cameraX;
        const screenY = c.y - cameraY;

        if (
          viewportWidth !== undefined &&
          (screenX < -10 || screenX > viewportWidth + 10 || screenY < -10 || screenY > (viewportHeight ?? 270) + 10)
        ) {
          continue;
        }

        targetCtx.fillStyle = c.color;
        targetCtx.beginPath();
        targetCtx.arc(screenX, screenY, c.radius, 0, Math.PI * 2);
        targetCtx.fill();
      }
      targetCtx.restore();
    }
  }
}

export { BloodDecalManager as BloodSystem };
