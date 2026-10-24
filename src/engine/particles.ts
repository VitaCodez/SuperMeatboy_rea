/**
 * Super Meat Boy - High-Performance Particle Engine
 *
 * Handles dynamic transient particles:
 * - Dust puffs on landing, running skids, and wall jumps.
 * - Flying buzzsaw blood sprays and metallic sparks.
 * - Meat chunks with gravity, floor bouncing, wall bouncing, and decal-stamping upon death.
 */

import { BloodDecalManager } from './bloodDecals';

export type ParticleType = 'dust' | 'spark' | 'blood_spray' | 'meat_chunk' | 'debris';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: ParticleType;
  gravity: number;
  drag: number;
  rotation: number;
  vRot: number;
  bounces: number;
  maxBounces: number;
  restitution: number;
  scale: number;
  scaleGrowth: number;
  bloodDecalsRef?: BloodDecalManager | null;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private readonly maxParticles = 600;

  // Particle color palettes
  private readonly dustColors = ['#eae4db', '#d5cbbe', '#b5a796', '#908372'];
  private readonly sparkColors = ['#ffffff', '#fff8b0', '#ffc107', '#ff5722'];
  private readonly bloodColors = ['#4a0008', '#730012', '#9e011a', '#cc0b2b', '#e61e38'];
  private readonly meatColors = ['#5e0413', '#800016', '#a80c24', '#cc1b38', '#40020d'];

  constructor() {}

  public getCount(): number {
    return this.particles.length;
  }

  public clear(): void {
    this.particles = [];
  }

  /**
   * Emits dust puffs when Meat Boy lands on the ground.
   */
  public emitLandingDust(x: number, y: number, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const dir = Math.random() > 0.5 ? 1 : -1;
      const speed = 25 + Math.random() * 75;
      const color = this.dustColors[Math.floor(Math.random() * this.dustColors.length)];

      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y - 1,
        vx: dir * speed,
        vy: -(10 + Math.random() * 25),
        size: 2.5 + Math.random() * 2.5,
        color,
        alpha: 0.8 + Math.random() * 0.2,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
        type: 'dust',
        gravity: 15,
        drag: 0.88,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 4,
        bounces: 0,
        maxBounces: 0,
        restitution: 0,
        scale: 0.6,
        scaleGrowth: 2.4,
      });
    }
  }

  /**
   * Emits skid dust when Meat Boy suddenly changes direction or slides to a stop.
   */
  public emitSkidDust(x: number, y: number, facingDir: number): void {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      // Dust flies opposite to facing direction
      const oppDir = facingDir > 0 ? -1 : 1;
      const color = this.dustColors[Math.floor(Math.random() * this.dustColors.length)];

      this.particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y - 1,
        vx: oppDir * (30 + Math.random() * 60),
        vy: -(15 + Math.random() * 30),
        size: 2 + Math.random() * 2,
        color,
        alpha: 0.7,
        life: 0,
        maxLife: 0.2 + Math.random() * 0.15,
        type: 'dust',
        gravity: 25,
        drag: 0.85,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 5,
        bounces: 0,
        maxBounces: 0,
        restitution: 0,
        scale: 0.5,
        scaleGrowth: 2.0,
      });
    }
  }

  /**
   * Emits dust puffs when Meat Boy jumps off a vertical wall.
   */
  public emitWallJumpDust(x: number, y: number, wallDir: -1 | 1): void {
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      // Puffs shoot away from the wall
      const color = this.dustColors[Math.floor(Math.random() * this.dustColors.length)];

      this.particles.push({
        x: x + (wallDir === -1 ? -1 : 1),
        y: y + (Math.random() - 0.5) * 8,
        vx: wallDir * (35 + Math.random() * 65),
        vy: (Math.random() - 0.5) * 50,
        size: 2 + Math.random() * 2.5,
        color,
        alpha: 0.75,
        life: 0,
        maxLife: 0.22 + Math.random() * 0.18,
        type: 'dust',
        gravity: 30,
        drag: 0.86,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 4,
        bounces: 0,
        maxBounces: 0,
        restitution: 0,
        scale: 0.6,
        scaleGrowth: 2.2,
      });
    }
  }

  /**
   * Emits high-velocity blood spray tangentially from a spinning buzzsaw.
   */
  public emitSawBladeBloodSpray(
    x: number,
    y: number,
    tangentAngle: number,
    speed: number = 320,
    count: number = 4
  ): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angleSpread = tangentAngle + (Math.random() - 0.5) * 0.45;
      const velocity = speed * (0.7 + Math.random() * 0.6);
      const color = this.bloodColors[Math.floor(Math.random() * this.bloodColors.length)];

      this.particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angleSpread) * velocity,
        vy: Math.sin(angleSpread) * velocity,
        size: 1.5 + Math.random() * 1.5,
        color,
        alpha: 0.95,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        type: 'blood_spray',
        gravity: 480,
        drag: 0.96,
        rotation: angleSpread,
        vRot: 0,
        bounces: 0,
        maxBounces: 1,
        restitution: 0.2,
        scale: 1.0,
        scaleGrowth: 0.3,
      });
    }
  }

  /**
   * Emits bright metallic sparks from buzzsaws or hard impacts.
   */
  public emitSparks(
    x: number,
    y: number,
    normalX: number = 0,
    normalY: number = -1,
    count: number = 10
  ): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const baseAngle = Math.atan2(normalY, normalX);
      const angle = baseAngle + (Math.random() - 0.5) * 1.6;
      const speed = 140 + Math.random() * 260;
      const color = this.sparkColors[Math.floor(Math.random() * this.sparkColors.length)];

      this.particles.push({
        x: x + (Math.random() - 0.5) * 2,
        y: y + (Math.random() - 0.5) * 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.2 + Math.random() * 1.0,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: 0.15 + Math.random() * 0.15,
        type: 'spark',
        gravity: 550,
        drag: 0.94,
        rotation: angle,
        vRot: 0,
        bounces: 0,
        maxBounces: 2,
        restitution: 0.45,
        scale: 1.0,
        scaleGrowth: -0.5,
      });
    }
  }

  /**
   * Emits fleshy meat chunks upon Meat Boy's death with full physics,
   * gravity, rotation, floor bounces, wall bounces, and blood decal stamping!
   */
  /**
   * Emits dust puff particles at a specified velocity.
   */
  public emitDust(
    x: number,
    y: number,
    count: number = 4,
    vxBias: number = 0,
    vyBias: number = -50
  ): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const color = this.dustColors[Math.floor(Math.random() * this.dustColors.length)];
      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: vxBias + (Math.random() - 0.5) * 40,
        vy: vyBias + (Math.random() - 0.5) * 40,
        size: 3 + Math.random() * 3,
        color,
        alpha: 0.8,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        type: 'dust',
        gravity: 20,
        drag: 0.9,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 4,
        bounces: 0,
        maxBounces: 0,
        restitution: 0,
        scale: 0.8,
        scaleGrowth: 1.5,
      });
    }
  }

  /**
   * Emits fiery sparks/bursts for boss smoke stacks and damage states.
   */
  public emitFire(x: number, y: number, count: number = 3): void {
    const fireColors = ['#ffeb3b', '#ff9800', '#f44336', '#ff5722'];
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const color = fireColors[Math.floor(Math.random() * fireColors.length)];
      this.particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 30 - 30,
        vy: -70 - Math.random() * 60,
        size: 2.5 + Math.random() * 2.5,
        color,
        alpha: 0.95,
        life: 0,
        maxLife: 0.2 + Math.random() * 0.15,
        type: 'spark',
        gravity: -10,
        drag: 0.88,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 5,
        bounces: 0,
        maxBounces: 0,
        restitution: 0,
        scale: 1.0,
        scaleGrowth: -0.4,
      });
    }
  }

  /**
   * Emits explosive bursts of sparks and debris.
   */
  public emitExplosion(x: number, y: number, count: number = 20): void {
    this.emitSparks(x, y, 0, 0, count);
    this.emitDust(x, y, Math.floor(count / 2), 0, -30);
  }

  public emitDeathMeatChunks(
    x: number,
    y: number,
    count: number = 36,
    bloodDecals?: BloodDecalManager
  ): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 320;
      const color = this.meatColors[Math.floor(Math.random() * this.meatColors.length)];

      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120, // Initial upward bias
        size: 2.8 + Math.random() * 3.5,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8,
        type: 'meat_chunk',
        gravity: 850,
        drag: 0.985,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 25,
        bounces: 0,
        maxBounces: 2 + Math.floor(Math.random() * 2), // 2-3 bounces
        restitution: 0.4 + Math.random() * 0.2,
        scale: 1.0,
        scaleGrowth: 0,
        bloodDecalsRef: bloodDecals ?? null,
      });
    }
  }

  /**
   * Updates all active particles with physics, collisions, bounces, and lifetimes.
   *
   * @param dt Delta time in seconds
   * @param tileCollider Optional solid collision checker
   * @param bloodDecals Optional blood decal manager to stamp on impact
   */
  public update(
    dt: number,
    tileCollider?: (x: number, y: number) => boolean,
    bloodDecals?: BloodDecalManager
  ): void {
    const clampedDt = Math.min(dt, 0.05); // Prevent tunneling on large frame spikes

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.life += clampedDt;
      if (p.life >= p.maxLife) {
        // Stamp final settle decal if meat chunk dies
        if (p.type === 'meat_chunk' && (p.bloodDecalsRef || bloodDecals)) {
          const mgr = p.bloodDecalsRef || bloodDecals;
          mgr?.addMeatChunkSplatter(p.x, p.y, p.size * 0.9, 'floor');
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.vy += p.gravity * clampedDt;
      p.vx *= Math.pow(p.drag, clampedDt * 60);
      p.vy *= Math.pow(p.drag, clampedDt * 60);
      p.rotation += p.vRot * clampedDt;

      const nextX = p.x + p.vx * clampedDt;
      const nextY = p.y + p.vy * clampedDt;

      // Handle collision and bounce if collider provided
      if (tileCollider && (p.type === 'meat_chunk' || p.type === 'spark')) {
        const isSolidFloor = tileCollider(nextX, nextY + p.size / 2);
        const isSolidWall = tileCollider(nextX + Math.sign(p.vx) * (p.size / 2), p.y);

        if (isSolidFloor && p.vy > 0) {
          // Floor bounce
          p.bounces++;
          p.vy = -p.vy * p.restitution;
          p.vx *= 0.7; // Floor friction
          p.y = Math.floor(nextY);

          // Stamp blood splatter on meat chunk bounce!
          const mgr = p.bloodDecalsRef || bloodDecals;
          if (p.type === 'meat_chunk' && mgr) {
            mgr.addMeatChunkSplatter(p.x, p.y, p.size * 0.7, 'floor');
          }

          if (p.bounces >= p.maxBounces) {
            if (p.type === 'meat_chunk' && mgr) {
              mgr.addMeatChunkSplatter(p.x, p.y, p.size, 'floor');
            }
            this.particles.splice(i, 1);
            continue;
          }
        } else if (isSolidWall) {
          // Wall bounce
          p.bounces++;
          p.vx = -p.vx * p.restitution;
          p.x = nextX;
          p.y = nextY;

          // Stamp blood splatter on meat chunk wall bounce!
          const mgr = p.bloodDecalsRef || bloodDecals;
          if (p.type === 'meat_chunk' && mgr) {
            mgr.addMeatChunkSplatter(p.x, p.y, p.size * 0.7, 'wall');
          }

          if (p.bounces >= p.maxBounces) {
            if (p.type === 'meat_chunk' && mgr) {
              mgr.addMeatChunkSplatter(p.x, p.y, p.size, 'wall');
            }
            this.particles.splice(i, 1);
            continue;
          }
        } else {
          p.x = nextX;
          p.y = nextY;
        }
      } else {
        p.x = nextX;
        p.y = nextY;
      }

      // Trail drips for flying meat chunks
      if (p.type === 'meat_chunk' && Math.random() > 0.85) {
        const mgr = p.bloodDecalsRef || bloodDecals;
        mgr?.addWalkSmear(p.x, p.y, p.vx, false);
      }
    }
  }

  /**
   * Renders all active particles smoothly to the main canvas.
   */
  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (this.particles.length === 0) return;

    ctx.save();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const screenX = p.x - cameraX;
      const screenY = p.y - cameraY;

      const progress = p.life / p.maxLife;
      const currentAlpha = Math.max(0, p.alpha * (1 - progress));

      ctx.save();
      ctx.globalAlpha = currentAlpha;

      if (p.type === 'dust') {
        const currentScale = p.scale + p.scaleGrowth * progress;
        const currentRadius = Math.max(0.5, p.size * currentScale);

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Secondary soft halo ring
        ctx.globalAlpha = currentAlpha * 0.45;
        ctx.beginPath();
        ctx.arc(screenX, screenY, currentRadius * 1.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        // High-speed spark streak oriented along velocity vector
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const streakLen = Math.min(8, Math.max(2, speed * 0.02));

        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX - (p.vx / speed) * streakLen, screenY - (p.vy / speed) * streakLen);
        ctx.stroke();
      } else if (p.type === 'blood_spray') {
        // Elongated droplet streak
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const len = Math.min(6, Math.max(2, speed * 0.015));

        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX - (p.vx / (speed || 1)) * len, screenY - (p.vy / (speed || 1)) * len);
        ctx.stroke();
      } else if (p.type === 'meat_chunk') {
        // Fleshy red square with dark border and rotation
        ctx.translate(screenX, screenY);
        ctx.rotate(p.rotation);

        const s = p.size;
        ctx.fillStyle = '#260005';
        ctx.fillRect(-s / 2 - 0.5, -s / 2 - 0.5, s + 1, s + 1);

        ctx.fillStyle = p.color;
        ctx.fillRect(-s / 2, -s / 2, s, s);

        // Core highlight
        ctx.fillStyle = '#ff334b';
        ctx.fillRect(-s / 4, -s / 4, s / 2, s / 2);
      }

      ctx.restore();
    }

    ctx.restore();
  }
}
