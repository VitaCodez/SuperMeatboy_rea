# 1. Update particles.ts
with open('src/engine/particles.ts', 'r', encoding='utf-8') as f:
    p_code = f.read()

target_p = "  public emitDeathMeatChunks("
new_methods = """  /**
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

  public emitDeathMeatChunks("""

p_code = p_code.replace(target_p, new_methods)
with open('src/engine/particles.ts', 'w', encoding='utf-8') as f:
    f.write(p_code)
print("Updated particles.ts")

# 2. Update bossLilSlugger.ts
with open('src/engine/bossLilSlugger.ts', 'r', encoding='utf-8') as f:
    b_code = f.read()

b_code = b_code.replace("SMB_SOUNDS.LAND_SPLAT", "SMB_SOUNDS.SPLATTER")
b_code = b_code.replace("SMB_SOUNDS.SAW_HIT", "SMB_SOUNDS.DEATH")
b_code = b_code.replace("SMB_SOUNDS.EXPLOSION", "SMB_SOUNDS.LEVEL_WIN")
b_code = b_code.replace("if (sawFrontX >= 1820 && this.phase !== BossPhase.DEFEATED)", "if (sawFrontX >= 1820)")

with open('src/engine/bossLilSlugger.ts', 'w', encoding='utf-8') as f:
    f.write(b_code)
print("Updated bossLilSlugger.ts")
