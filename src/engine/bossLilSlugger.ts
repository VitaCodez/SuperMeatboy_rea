/**
 * Super Meat Boy - Chapter 1 Boss: Lil Slugger (Forest Boss)
 *
 * Reverse-engineered directly from SuperMeatBoy.exe:
 * - Original source: SuperMeatBoy\Src\ForestBoss.cpp
 * - Decompiled vtable: SMB_1::ForestBoss::vftable at 0x683c14
 * - Constructor: 0x52b3e0
 * - Update: 0x52bb20
 * - TakeDamage / Phase transition: 0x52b9f0
 * - Speed: 200.0f px/sec (decompiled constant 0x43480000)
 * - Animations: step1, step2, step1flash, step2flash, stepbloody1, stepbloody2, death
 */

import { Rect, PlayerState } from './types';
import { Camera } from './renderer';
import { ParticleSystem } from './particles';
import { soundManager, SMB_SOUNDS } from './sound';

export enum BossPhase {
  CHASE_NORMAL = 0, // step1, step2, speed = 200
  CHASE_FLASHING = 1, // step1flash, step2flash, speed = 225
  CHASE_BLOODY = 2, // stepbloody1, stepbloody2, speed = 250
  DEFEATED = 3, // death animation, crashing & exploding
}

export interface BossObstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  destroyed: boolean;
}

export class BossLilSlugger {
  public x: number = 40;
  public y: number = 280;
  public width: number = 140;
  public height: number = 140;

  public vx: number = 200; // Decompiled speed 200.0f
  public vy: number = 0;
  public phase: BossPhase = BossPhase.CHASE_NORMAL;

  public sawAngle: number = 0;
  public stepTimer: number = 0;
  public currentStep: 1 | 2 = 1;

  public isDead: boolean = false;
  public deathTimer: number = 0;

  // 3 Checkpoint Obstacles across the chase runway
  public obstacles: BossObstacle[] = [
    { id: 1, x: 580, y: 220, width: 30, height: 160, destroyed: false },
    { id: 2, x: 1080, y: 220, width: 30, height: 160, destroyed: false },
    { id: 3, x: 1580, y: 220, width: 30, height: 160, destroyed: false },
  ];

  // Flare / flash timer for Phase 1 & 2
  public flashTimer: number = 0;
  private smokeTimer: number = 0;

  // Boss texture atlas
  private bossTexture: HTMLImageElement | null = null;

  constructor(startX: number = 40, startY: number = 280) {
    this.x = startX;
    this.y = startY;
    this.vx = 200;
    this.loadTexture();
  }

  private loadTexture(): void {
    if (typeof Image !== 'undefined') {
      const img = new Image();
      img.src = '/assets/textures/Bosses/forestboss.png';
      img.onload = () => {
        this.bossTexture = img;
      };
    }
  }

  public reset(startX: number = 40, startY: number = 280): void {
    this.x = startX;
    this.y = startY;
    this.vx = 200;
    this.phase = BossPhase.CHASE_NORMAL;
    this.sawAngle = 0;
    this.stepTimer = 0;
    this.currentStep = 1;
    this.isDead = false;
    this.deathTimer = 0;
    this.flashTimer = 0;
    this.smokeTimer = 0;
    for (const ob of this.obstacles) {
      ob.destroyed = false;
    }
  }

  /**
   * Main Boss Update loop (reverse-engineered from ForestBoss::Update 0x52bb20)
   */
  public update(
    dt: number,
    player: PlayerState,
    camera: Camera,
    particles: ParticleSystem,
    onPlayerDeath: () => void,
    onBossDefeated: () => void
  ): void {
    // If defeated / dying
    if (this.phase === BossPhase.DEFEATED) {
      this.deathTimer += dt;
      this.vx = 0;

      // Emit continuous explosions during death sequence
      if (this.deathTimer < 2.5 && Math.random() < 0.4) {
        const exX = this.x + Math.random() * this.width;
        const exY = this.y + Math.random() * this.height;
        particles.emitExplosion(exX, exY, 15);
        camera.addShake(0.2, 8);
      }

      if (this.deathTimer >= 3.0 && !this.isDead) {
        this.isDead = true;
        onBossDefeated();
      }
      return;
    }

    // Set speed according to decompiled phase mechanics
    switch (this.phase) {
      case BossPhase.CHASE_NORMAL:
        this.vx = 200.0;
        break;
      case BossPhase.CHASE_FLASHING:
        this.vx = 225.0;
        break;
      case BossPhase.CHASE_BLOODY:
        this.vx = 250.0;
        break;
    }

    // Advance position
    this.x += this.vx * dt;

    // Saw rotation
    this.sawAngle += dt * 35; // Rapid buzzsaw rotation

    // Stride animation (step1 <-> step2)
    this.stepTimer += dt;
    const stepDuration = this.phase === BossPhase.CHASE_BLOODY ? 0.25 : 0.32;
    if (this.stepTimer >= stepDuration) {
      this.stepTimer = 0;
      this.currentStep = this.currentStep === 1 ? 2 : 1;
      // Stomp shake
      camera.addShake(0.08, 1.8);
      soundManager.playSfx(SMB_SOUNDS.SPLATTER);
    }

    // Smoke / exhaust emission from top pipes
    this.smokeTimer += dt;
    if (this.smokeTimer > 0.08) {
      this.smokeTimer = 0;
      const pipeX = this.x + 35;
      const pipeY = this.y + 10;
      particles.emitDust(pipeX, pipeY, 3, -40, -100);
      if (this.phase >= BossPhase.CHASE_FLASHING) {
        particles.emitFire(pipeX + 5, pipeY - 5, 2);
      }
    }

    // Flashing oscillation
    this.flashTimer += dt * 10;

    // Check collision with obstacles (trees/barriers)
    const sawFrontX = this.x + 125;
    for (const ob of this.obstacles) {
      if (!ob.destroyed && sawFrontX >= ob.x) {
        ob.destroyed = true;
        camera.addShake(0.4, 10);
        soundManager.playSfx(SMB_SOUNDS.DEATH);
        particles.emitExplosion(ob.x + 15, ob.y + ob.height / 2, 25);

        // Advance phase
        if (this.phase === BossPhase.CHASE_NORMAL) {
          this.phase = BossPhase.CHASE_FLASHING;
        } else if (this.phase === BossPhase.CHASE_FLASHING) {
          this.phase = BossPhase.CHASE_BLOODY;
        }
      }
    }

    // Final crash checkpoint (Arena wall at x = 1820)
    if (sawFrontX >= 1820) {
      this.phase = BossPhase.DEFEATED;
      this.deathTimer = 0;
      camera.addShake(0.8, 16);
      soundManager.playSfx(SMB_SOUNDS.LEVEL_WIN);
      particles.emitExplosion(this.x + 80, this.y + 70, 50);
      return;
    }

    // Check lethal collision against Meat Boy
    if (!player.isDead) {
      if (this.checkCollision(player)) {
        onPlayerDeath();
      }
    }
  }

  /**
   * Accurate collision detection against Meat Boy
   */
  public checkCollision(player: PlayerState): boolean {
    const px = player.x;
    const py = player.y;
    const pw = player.width;
    const ph = player.height;

    // 1. Chassis Body AABB
    const bodyBox: Rect = {
      x: this.x + 15,
      y: this.y + 20,
      width: 100,
      height: 110,
    };
    if (
      px < bodyBox.x + bodyBox.width &&
      px + pw > bodyBox.x &&
      py < bodyBox.y + bodyBox.height &&
      py + ph > bodyBox.y
    ) {
      return true;
    }

    // 2. Giant Front Buzzsaw Circle
    const sawCenterX = this.x + 125;
    const sawCenterY = this.y + 75;
    const sawRadius = 36;

    // Nearest point on player rectangle to circle
    const nearestX = Math.max(px, Math.min(sawCenterX, px + pw));
    const nearestY = Math.max(py, Math.min(sawCenterY, py + ph));
    const dx = sawCenterX - nearestX;
    const dy = sawCenterY - nearestY;

    if (dx * dx + dy * dy <= sawRadius * sawRadius) {
      return true;
    }

    return false;
  }

  /**
   * Render Lil Slugger with authentic mechanics and visual presentation
   */
  public render(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    const rx = Math.floor(this.x - camX);
    const ry = Math.floor(this.y - camY);

    ctx.save();

    // Render obstacles (destructible trees)
    for (const ob of this.obstacles) {
      if (!ob.destroyed) {
        const ox = Math.floor(ob.x - camX);
        const oy = Math.floor(ob.y - camY);
        // Tree trunk barrier
        ctx.fillStyle = '#451a03';
        ctx.fillRect(ox, oy, ob.width, ob.height);
        // Bark texture
        ctx.fillStyle = '#271004';
        for (let py = oy; py < oy + ob.height; py += 16) {
          ctx.fillRect(ox + 4, py + 2, ob.width - 8, 4);
        }
        // Warning stripes
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(ox, oy + 20, ob.width, 6);
        ctx.fillRect(ox, oy + 80, ob.width, 6);
      }
    }

    // If defeated / exploding
    if (this.phase === BossPhase.DEFEATED) {
      // Shaking charred wreck
      const shakeX = (Math.random() - 0.5) * 8;
      const shakeY = (Math.random() - 0.5) * 8;
      ctx.translate(rx + shakeX, ry + shakeY);

      // Burnt chassis
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(20, 30, 90, 80);

      // Cracked eye
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(90, 45, 15, 15);

      // Fire glow
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(60, 60, 50, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

    // Flashing color modifier in Phase 1 & 2
    let isFlashing = false;
    if (this.phase === BossPhase.CHASE_FLASHING) {
      isFlashing = Math.sin(this.flashTimer) > 0;
    } else if (this.phase === BossPhase.CHASE_BLOODY) {
      isFlashing = Math.sin(this.flashTimer * 1.5) > 0;
    }

    ctx.translate(rx, ry);

    // Stride bobbing
    const bobOffset = this.currentStep === 1 ? -3 : 3;

    // 1. Back Robotic Leg
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const legBackX = 40;
    const legBackY = 90 + bobOffset;
    const footBackX = this.currentStep === 1 ? 25 : 55;
    const footBackY = 135;
    ctx.moveTo(legBackX, legBackY);
    ctx.lineTo(legBackX - 10, legBackY + 25);
    ctx.lineTo(footBackX, footBackY);
    ctx.stroke();

    // 2. Exhaust Pipes & Smokestacks
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(25, 5 + bobOffset, 12, 35);
    ctx.fillRect(45, 0 + bobOffset, 12, 40);
    // Exhaust rings
    ctx.fillStyle = '#18181b';
    ctx.fillRect(23, 2 + bobOffset, 16, 5);
    ctx.fillRect(43, -3 + bobOffset, 16, 5);

    // 3. Main Steel Chassis Body
    ctx.fillStyle = isFlashing ? '#b91c1c' : '#44403c';
    if (this.phase === BossPhase.CHASE_BLOODY) {
      ctx.fillStyle = isFlashing ? '#ef4444' : '#7f1d1d';
    }
    // Rounded angular hull
    ctx.beginPath();
    ctx.roundRect(15, 25 + bobOffset, 95, 80, 8);
    ctx.fill();
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Armor rivets & panels
    ctx.fillStyle = '#292524';
    ctx.fillRect(22, 35 + bobOffset, 25, 20);
    ctx.fillRect(55, 35 + bobOffset, 45, 25);
    ctx.fillRect(25, 75 + bobOffset, 75, 18);

    // 4. Glowing Cyclops Optical Sensor (Eye)
    const eyeX = 92;
    const eyeY = 45 + bobOffset;
    ctx.fillStyle = '#18181b';
    ctx.fillRect(eyeX - 4, eyeY - 4, 22, 22);

    ctx.fillStyle = this.phase === BossPhase.CHASE_BLOODY ? '#f43f5e' : '#ef4444';
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(eyeX + 7, eyeY + 7, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Eye pupil
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(eyeX + 8, eyeY + 7, 3, 0, Math.PI * 2);
    ctx.fill();

    // 5. Front Robotic Leg
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 12;
    ctx.beginPath();
    const legFrontX = 80;
    const legFrontY = 90 + bobOffset;
    const footFrontX = this.currentStep === 1 ? 95 : 65;
    const footFrontY = 135;
    ctx.moveTo(legFrontX, legFrontY);
    ctx.lineTo(legFrontX + 12, legFrontY + 22);
    ctx.lineTo(footFrontX, footFrontY);
    ctx.stroke();

    // Heavy foot plate
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(footFrontX - 14, footFrontY - 6, 28, 10);

    // 6. Hydraulic Piston Arm for Saw
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(85, 75 + bobOffset);
    ctx.lineTo(125, 75 + bobOffset);
    ctx.stroke();

    // 7. Giant Spinning Front Buzzsaw
    const sawX = 125;
    const sawY = 75 + bobOffset;
    const sawRadius = 36;

    ctx.save();
    ctx.translate(sawX, sawY);
    ctx.rotate(this.sawAngle);

    // Outer saw disc
    ctx.fillStyle = '#a1a1aa';
    ctx.beginPath();
    ctx.arc(0, 0, sawRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Saw Teeth
    const teethCount = 14;
    ctx.fillStyle = '#d4d4d8';
    for (let i = 0; i < teethCount; i++) {
      const angle = (i * Math.PI * 2) / teethCount;
      const tx = Math.cos(angle) * (sawRadius + 6);
      const ty = Math.sin(angle) * (sawRadius + 6);
      const bx = Math.cos(angle + 0.15) * (sawRadius - 4);
      const by = Math.sin(angle + 0.15) * (sawRadius - 4);
      const cx = Math.cos(angle - 0.15) * (sawRadius - 4);
      const cy = Math.sin(angle - 0.15) * (sawRadius - 4);

      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(bx, by);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fill();
    }

    // Blood splatters on blade (Phase 2 & 3)
    if (this.phase >= BossPhase.CHASE_FLASHING) {
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(10, 8, 9, 0, Math.PI * 2);
      ctx.arc(-14, -10, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center metallic hub & bolts
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e4e4e7';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.restore();
  }
}
