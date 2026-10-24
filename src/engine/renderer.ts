/**
 * Super Meat Boy - 60Hz Canvas 2D Renderer
 *
 * Handles:
 * - Camera: Smooth lerping following Meat Boy, clamped to level bounding box,
 *   velocity look-ahead, screen-shake support on death/landing.
 * - Parallax Background: Multi-layered background rendering with parallax scroll factors (0.2x - 0.5x).
 * - Tilemap Rendering: Background & foreground tilesets with rich procedural fallback tiles.
 * - Entities:
 *   - Meat Boy: Red cube sprite with squash & stretch transforms, facial expressions
 *     (determined/smiling when running, startled in air, panicked near saws), meat striations.
 *   - Bandage Girl: Cute pink cube with ribbon, waving animation at level goal.
 *   - Buzzsaws: Spinning metallic circular sawblades with teeth, blood stains, and center axle.
 *   - Crumble blocks: Shaking and cracking animation before falling.
 *   - Spikes / needles: Sharp blood-dipped hazards.
 * - Multi-ghost replay visualization.
 * - Responsive scaling: Pixel aspect ratio preservation and crisp `image-rendering: pixelated`.
 */

import {
  Rect,
  PlayerState,
  PlayerRenderState,
  PlayerExpression,
  SawBladeEntity,
  SpikeEntity,
  CrumbleBlockEntity,
  BandageGirlEntity,
  LevelData,
  LevelRenderData,
  TileType,
  Entity,
} from './types';
import { BloodDecalManager } from './bloodDecals';
import { ParticleSystem } from './particles';
import { ReplayEngine } from './replayEngine';
import { drawAutotiledLevel, TileAtlas, getLayoutForTheme, getThemeTilesetPath, getThemeBackgroundPath } from './tileAutotiler';

export class Camera {
  public x: number = 0;
  public y: number = 0;
  public viewportWidth: number = 480;
  public viewportHeight: number = 270;
  public targetX: number = 0;
  public targetY: number = 0;
  public lerpSpeed: number = 10.0;
  public leadAheadDistance: number = 28;
  // Fraction of the viewport height the player is anchored at. The original
  // framing places Meat Boy slightly below centre (~59-60%), leaving more
  // sky visible above him.
  public verticalAnchor: number = 0.6;

  public bounds: Rect = { x: 0, y: 0, width: 1920, height: 1080 };

  // Screen shake
  private shakeIntensity: number = 0;
  private shakeTimer: number = 0;
  private shakeDuration: number = 0;
  public shakeOffsetX: number = 0;
  public shakeOffsetY: number = 0;

  constructor(viewportWidth: number = 480, viewportHeight: number = 270) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  public setBounds(bounds: Rect | { minX: number; minY: number; maxX: number; maxY: number }): void {
    if ('minX' in bounds) {
      this.bounds = {
        x: bounds.minX,
        y: bounds.minY,
        width: Math.max(1, bounds.maxX - bounds.minX),
        height: Math.max(1, bounds.maxY - bounds.minY),
      };
    } else {
      this.bounds = { ...bounds };
    }
  }

  /**
   * Adds trauma / screen shake on landing or violent death.
   */
  public addShake(duration: number = 0.25, intensity: number = 6): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  public triggerScreenShake(duration: number = 0.25, intensity: number = 6): void {
    this.addShake(duration, intensity);
  }

  /**
   * Snaps camera immediately to player without lerping (e.g. on respawn).
   */
  public snapTo(targetX: number, targetY: number): void {
    this.targetX = targetX - this.viewportWidth / 2;
    this.targetY = targetY - this.viewportHeight * this.verticalAnchor;
    this.clampTarget();
    this.x = this.targetX;
    this.y = this.targetY;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  private clampTarget(): void {
    const maxX = Math.max(this.bounds.x, this.bounds.x + this.bounds.width - this.viewportWidth);
    const maxY = Math.max(this.bounds.y, this.bounds.y + this.bounds.height - this.viewportHeight);

    if (this.bounds.width <= this.viewportWidth) {
      this.targetX = this.bounds.x + (this.bounds.width - this.viewportWidth) / 2;
    } else {
      this.targetX = Math.max(this.bounds.x, Math.min(maxX, this.targetX));
    }

    if (this.bounds.height <= this.viewportHeight) {
      this.targetY = this.bounds.y + (this.bounds.height - this.viewportHeight) / 2;
    } else {
      this.targetY = Math.max(this.bounds.y, Math.min(maxY, this.targetY));
    }
  }

  public update(dt: number, player: { x: number; y: number; vx?: number; vy?: number }): void {
    const leadX = (player.vx ? Math.sign(player.vx) : 0) * this.leadAheadDistance;
    this.targetX = player.x + leadX - this.viewportWidth / 2;
    this.targetY = player.y - this.viewportHeight * this.verticalAnchor;

    this.clampTarget();

    // Smooth lerp following Meat Boy
    const t = 1 - Math.exp(-this.lerpSpeed * Math.min(dt, 0.1));
    this.x += (this.targetX - this.x) * t;
    this.y += (this.targetY - this.y) * t;

    // Update screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = Math.max(0, this.shakeTimer / this.shakeDuration);
      const currentIntensity = this.shakeIntensity * progress;
      this.shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
    } else {
      this.shakeIntensity = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  public getRenderX(): number {
    return Math.round(this.x + this.shakeOffsetX);
  }

  public getRenderY(): number {
    return Math.round(this.y + this.shakeOffsetY);
  }
}

export class GameRenderer {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public camera: Camera;

  // Internal virtual retro resolution
  public readonly virtualWidth: number;
  public readonly virtualHeight: number;

  // World -> screen zoom. Physics levels are authored at 20px per tile and the
  // reference (640x360) shows a 20px tile period with a 14x14 Meat Boy, i.e.
  // 1 world unit = 1 screen pixel at the internal resolution (32x18 tiles).
  // The scale is kept explicit so every world pass shares one transform and
  // the viewport can be tuned in one place without touching physics.
  public readonly worldScale: number;
  public readonly worldViewWidth: number;
  public readonly worldViewHeight: number;

  // Texture image cache
  private textures: Map<string, HTMLImageElement> = new Map();
  private texturesLoaded: Map<string, boolean> = new Map();
  private spritesheets: Record<string, Array<{ u: number; v: number; w: number; h: number; rot: number }>> = {};
  private spritesheetsLoaded: boolean = false;

  // Systems
  public bloodDecals: BloodDecalManager;
  public particles: ParticleSystem;

  private globalTime: number = 0;
  private prevGrounded: boolean = false;
  private prevVy: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    virtualWidth: number = 480,
    virtualHeight: number = 270,
    worldScale: number = 1
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Failed to acquire 2D canvas context');
    }
    this.ctx = context;

    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;
    this.worldScale = worldScale > 0 ? worldScale : 1;
    this.worldViewWidth = virtualWidth / this.worldScale;
    this.worldViewHeight = virtualHeight / this.worldScale;

    this.canvas.width = virtualWidth;
    this.canvas.height = virtualHeight;

    this.setupCanvasQuality();

    this.camera = new Camera(this.worldViewWidth, this.worldViewHeight);
    this.bloodDecals = new BloodDecalManager(1920, 1080);
    this.particles = new ParticleSystem();

    this.preloadTextures();
    this.loadSpritesheetData();
  }

  private setupCanvasQuality(): void {
    this.ctx.imageSmoothingEnabled = false;
    this.canvas.style.imageRendering = 'pixelated';
  }

  public triggerScreenShake(duration: number = 0.25, intensity: number = 6): void {
    this.camera.addShake(duration, intensity);
  }

  /**
   * Applies the world -> screen zoom to a context. Every world-space pass
   * (tiles, entities, particles, decals, player, boss) must use this so they
   * share one transform. HUD/DOM overlays stay outside it.
   */
  public applyWorldTransform(ctx: CanvasRenderingContext2D = this.ctx): void {
    ctx.scale(this.worldScale, this.worldScale);
  }

  /**
   * Preloads textures used across SMB chapters and entities.
   */
  private preloadTextures(): void {
    const textureList = [
      '/assets/textures/LevelPalettes/forestbg.png',
      '/assets/textures/LevelPalettes/foresttiles01.png',
      '/assets/textures/LevelPalettes/Forest_tile_setbackup.png',
      '/assets/textures/LevelPalettes/Forest_tile_set.png',
      '/assets/textures/LevelPalettes/hospitalbg.png',
      '/assets/textures/LevelPalettes/hospitaltiles01.png',
      '/assets/textures/LevelPalettes/factoryp01.png',
      '/assets/textures/LevelPalettes/factorytiles01.png',
      '/assets/textures/LevelPalettes/hellp.png',
      '/assets/textures/LevelPalettes/helltiles01.png',
      '/assets/textures/LevelPalettes/rapturetiles01_1.png',
      '/assets/textures/LevelPalettes/rapturetiles01.png',
      '/assets/textures/LevelPalettes/endtiles01_1.png',
      '/assets/textures/LevelPalettes/endtiles01.png',
      '/assets/textures/LevelPalettes/retropara01.png',
      '/assets/textures/LevelPalettes/retrotiles01.png',
      '/assets/textures/LevelPalettes/forestset1.png',
      '/assets/textures/LevelPalettes/obstacles.png',
      '/assets/textures/Animations/meatboyanim.png',
      '/assets/textures/Animations/bandagegirl.png',
      '/assets/textures/Bosses/forestboss.png',
      '/assets/textures/Bosses/boss2.png',
    ];

    if (typeof Image === 'undefined') return;

    for (const src of textureList) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.texturesLoaded.set(src, true);
      };
      img.onerror = () => {
        this.texturesLoaded.set(src, false);
      };
      this.textures.set(src, img);
    }
  }

  public getTexture(src: string): HTMLImageElement | null {
    if (this.texturesLoaded.get(src)) {
      return this.textures.get(src) || null;
    }
    return null;
  }

  private loadSpritesheetData(): void {
    if (typeof fetch === 'function') {
      fetch('/assets/data/spritesheets.json')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            this.spritesheets = data;
            this.spritesheetsLoaded = true;
          }
        })
        .catch(() => {
          // Gracefully continue with procedural fallbacks
        });
    }
  }

  /**
   * Blits a sprite frame from a texture atlas using normalized ITX coordinates.
   * Accurately un-rotates 90-degree rotated frames (rot = 1.5708) and applies horizontal flip.
   */
  public drawSprite(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    frame: { u: number; v: number; w: number; h: number; rot: number },
    destX: number,
    destY: number,
    destW: number,
    destH: number,
    flipX: boolean = false
  ): void {
    const imgW = img.naturalWidth || img.width || 1000;
    const imgH = img.naturalHeight || img.height || 1000;

    const sx = frame.u * imgW;
    const sy = frame.v * imgH;
    const sw = frame.w * imgW;
    const sh = frame.h * imgH;

    ctx.save();
    ctx.translate(destX + destW / 2, destY + destH / 2);
    if (flipX) {
      ctx.scale(-1, 1);
    }

    if (Math.abs(frame.rot - 1.5708) < 0.1) {
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(img, sx, sy, sw, sh, -destH / 2, -destW / 2, destH, destW);
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, -destW / 2, -destH / 2, destW, destH);
    }
    ctx.restore();
  }

  /**
   * Resizes display canvas to container or window while preserving crisp pixel aspect ratio.
   */
  public resizeDisplay(containerWidth: number, containerHeight: number): { scale: number; offsetX: number; offsetY: number } {
    const scale = Math.max(1, Math.min(
      Math.floor(containerWidth / this.virtualWidth),
      Math.floor(containerHeight / this.virtualHeight)
    ));

    const displayW = this.virtualWidth * scale;
    const displayH = this.virtualHeight * scale;
    const offsetX = Math.floor((containerWidth - displayW) / 2);
    const offsetY = Math.floor((containerHeight - displayH) / 2);

    this.canvas.style.width = `${displayW}px`;
    this.canvas.style.height = `${displayH}px`;
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = `${offsetX}px`;
    this.canvas.style.top = `${offsetY}px`;

    this.setupCanvasQuality();

    return { scale, offsetX, offsetY };
  }

  /**
   * Update step for camera & particles.
   */
  public update(
    dt: number,
    player: PlayerState | PlayerRenderState,
    level?: LevelData | LevelRenderData
  ): void {
    this.globalTime += dt;

    if (level) {
      this.camera.setBounds(level.bounds);
    }
    this.camera.update(dt, player);

    // Particle emissions based on player state transitions
    const isGrounded = 'isGrounded' in player ? player.isGrounded : player.onGround;
    const footY = player.y + player.height;
    const footX = player.x + player.width / 2;

    // Landing dust puff
    if (!this.prevGrounded && isGrounded && this.prevVy > 120) {
      this.particles.emitLandingDust(footX, footY, Math.min(12, Math.floor(this.prevVy / 35)));
      this.bloodDecals.addLandingSplatter(footX, footY, this.prevVy);
      if (this.prevVy > 550) {
        this.camera.addShake(0.12, 3);
      }
    }

    // Walking / Running blood smear
    if (isGrounded && Math.abs(player.vx) > 30) {
      const isRunning = Math.abs(player.vx) > 220;
      this.bloodDecals.addWalkSmear(footX, footY, player.vx, isRunning);
    }

    // Wall slide smear
    const isWallSliding = 'isWallSliding' in player ? player.isWallSliding : player.isSliding;
    if (isWallSliding && player.wallDir !== 0) {
      const wallX = player.wallDir === -1 ? player.x : player.x + player.width;
      this.bloodDecals.addWallSlideSmear(wallX, player.y + player.height / 2, player.wallDir as -1 | 1, player.vy);
    }

    // Dynamic tile collision query
    const tileCollider = (px: number, py: number) => {
      if (!level) return false;
      const ts = level.tileSize || 16;
      const col = Math.floor(px / ts);
      const row = Math.floor(py / ts);

      if ('tileGrid' in level) {
        if (row < 0 || row >= level.height || col < 0 || col >= level.width) return false;
        const t = level.tileGrid[row]?.[col];
        return Boolean(t && t !== TileType.EMPTY);
      } else {
        if (row < 0 || row >= level.tileRows || col < 0 || col >= level.tileCols) return false;
        const idx = row * level.tileCols + col;
        const t = Array.isArray(level.foregroundTiles[0])
          ? (level.foregroundTiles as number[][])[row]?.[col]
          : (level.foregroundTiles as number[])[idx];
        return Boolean(t && t > 0);
      }
    };

    // Death explosion trigger (30+ chunks spraying with gravity and surface bounces)
    if (player.isDead && (player.deathTimer ?? 0) < dt * 1.5) {
      this.bloodDecals.addDeathExplosion(player.x + player.width / 2, player.y + player.height / 2, 'saw', undefined, tileCollider);
      this.particles.emitDeathMeatChunks(player.x + player.width / 2, player.y + player.height / 2, 36, this.bloodDecals);
      this.camera.addShake(0.35, 8);
    }

    this.prevGrounded = isGrounded;
    this.prevVy = player.vy;

    this.particles.update(dt, tileCollider, this.bloodDecals);
    this.bloodDecals.update(dt, level, tileCollider);
  }

  /**
   * Main Render Pass
   */
  public render(
    level: LevelData | LevelRenderData,
    player: PlayerState | PlayerRenderState,
    blood?: BloodDecalManager,
    replay?: ReplayEngine,
    time?: number
  ): void {
    if (time !== undefined) {
      this.globalTime = time;
    }

    const camX = this.camera.getRenderX();
    const camY = this.camera.getRenderY();
    const activeBlood = blood || this.bloodDecals;

    // 1. Clear Screen (device space, unaffected by world zoom)
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#080808';
    this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    // All world-space passes share the same zoom transform.
    this.ctx.save();
    this.applyWorldTransform(this.ctx);

    // 2. Parallax Background
    const chapterName = typeof level.chapter === 'string'
      ? level.chapter
      : ('theme' in level ? level.theme : 'forest');
    this.renderParallaxBackground(chapterName, camX, camY, level);

    // 3. Persistent Blood Decals (single drawImage call)
    activeBlood.draw(this.ctx, camX, camY, this.worldViewWidth, this.worldViewHeight);

    // 4. Tiles (Solid and Hazards)
    this.renderTiles(level, camX, camY);

    // 5. Entities (Saws, Spikes, Crumble Blocks, Bandage Girl)
    this.renderEntities(level, camX, camY);

    // 6. Dynamic Active Particles
    this.particles.draw(this.ctx, camX, camY);

    // 7. Multi-Ghost Replay Playback or Player
    if (replay && replay.isReplaying) {
      this.renderReplayGhosts(replay, camX, camY);
    } else if (!player.isDead) {
      this.renderMeatBoy(player, level, camX, camY);
    }

    this.ctx.restore();
  }

  /**
   * Parallax Background with 0.2x - 0.5x scroll factor and procedural fallback.
   */
  private renderParallaxBackground(
    chapter: string,
    camX: number,
    camY: number,
    level?: LevelData | LevelRenderData
  ): void {
    const ctx = this.ctx;
    const bgPath = getThemeBackgroundPath(chapter);
    const bgImage = this.getTexture(bgPath) || this.getTexture('/assets/textures/LevelPalettes/forestbg.png');

    // `.smbl` layer descriptors carry the palette's sky colour. The first
    // opaque non-white/non-black entry is the clear colour (e.g. 1-1 uses
    // 220,245,245). Fall back to the background texture's own colours.
    let skyColor: string | null = null;
    if (level && 'parallaxLayers' in level && level.parallaxLayers) {
      const sky = level.parallaxLayers.find(({ color: [r, g, b, a] }) => {
        const white = r > 0.98 && g > 0.98 && b > 0.98;
        const black = r < 0.02 && g < 0.02 && b < 0.02;
        return a > 0.5 && !white && !black;
      });
      if (sky) {
        const [r, g, b, a] = sky.color;
        const toByte = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255);
        skyColor = `rgba(${toByte(r)}, ${toByte(g)}, ${toByte(b)}, ${a})`;
      }
    }

    if (skyColor) {
      ctx.fillStyle = skyColor;
      ctx.fillRect(0, 0, this.worldViewWidth, this.worldViewHeight);
    }

    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
      const scrollX = (camX * 0.25) % bgImage.width;
      const scrollY = (camY * 0.15) % bgImage.height;

      const startX = -scrollX - (scrollX > 0 ? 0 : bgImage.width);
      const startY = -scrollY - (scrollY > 0 ? 0 : bgImage.height);

      ctx.save();
      if (skyColor) ctx.globalAlpha = 0.3;
      for (let x = startX; x < this.worldViewWidth + bgImage.width; x += bgImage.width) {
        for (let y = startY; y < this.worldViewHeight + bgImage.height; y += bgImage.height) {
          ctx.drawImage(bgImage, Math.floor(x), Math.floor(y));
        }
      }
      ctx.restore();
    } else {
      // Procedural Atmospheric Fallback per chapter
      const norm = (chapter || 'forest').toLowerCase();
      const grad = ctx.createLinearGradient(0, 0, 0, this.worldViewHeight);
      if (norm.includes('hosp') || norm === '2') {
        grad.addColorStop(0, '#101618');
        grad.addColorStop(0.5, '#1b2426');
        grad.addColorStop(1, '#0e1416');
      } else if (norm.includes('fact') || norm.includes('salt') || norm === '3') {
        grad.addColorStop(0, '#1e1b18');
        grad.addColorStop(0.5, '#2e241c');
        grad.addColorStop(1, '#18120c');
      } else if (norm.includes('hell') || norm === '4') {
        grad.addColorStop(0, '#260a0a');
        grad.addColorStop(0.5, '#3b1212');
        grad.addColorStop(1, '#1a0505');
      } else if (norm.includes('rapt') || norm === '5') {
        grad.addColorStop(0, '#1c1424');
        grad.addColorStop(0.5, '#281a36');
        grad.addColorStop(1, '#120c18');
      } else if (norm.includes('end') || norm === '6') {
        grad.addColorStop(0, '#0a0a14');
        grad.addColorStop(0.5, '#121226');
        grad.addColorStop(1, '#05050e');
      } else if (norm.includes('retro') || norm.includes('cotton') || norm === '7') {
        grad.addColorStop(0, '#051205');
        grad.addColorStop(0.5, '#0b1f0b');
        grad.addColorStop(1, '#030a03');
      } else {
        grad.addColorStop(0, '#0c1514');
        grad.addColorStop(0.4, '#152422');
        grad.addColorStop(1, '#1b2e2b');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.worldViewWidth, this.worldViewHeight);
    }
  }

  /**
   * Renders level tile grid with procedural fallback tiles.
   */
  private renderTiles(level: LevelData | LevelRenderData, camX: number, camY: number): void {
    const ctx = this.ctx;
    const ts = level.tileSize || 16;
    const rawTheme = 'theme' in level ? level.theme : (typeof level.chapter === 'string' ? level.chapter : `chapter${level.chapter}`);
    const theme = (rawTheme || 'forest').toLowerCase();
    const tilesetPath = getThemeTilesetPath(theme);
    const tileImg =
      this.getTexture(tilesetPath) ||
      this.getTexture('/assets/textures/LevelPalettes/foresttiles01.png') ||
      this.getTexture('/assets/textures/LevelPalettes/Forest_tile_setbackup.png') ||
      this.getTexture('/assets/textures/LevelPalettes/Forest_tile_set.png');

    if (tileImg && 'layers' in level && level.layers?.foreground) {
      const overlay = (level.layers as any).overlay as number[][] | undefined;
      // Layer 1 is authored background detail, layer 0 is the active terrain,
      // layer 2 is foreground detail. Draw them back-to-front using the exact
      // tile ids stored in the .smbl instead of guessing an autotile mask.
      if (level.layers.background) {
        this.drawRawTileLayer(tileImg, level.layers.background, ts, camX, camY, 0.85);
      }
      this.drawRawTileLayer(tileImg, level.layers.foreground, ts, camX, camY, 1);
      if (overlay) {
        this.drawRawTileLayer(tileImg, overlay, ts, camX, camY, 1);
      }
      return;
    }

    if (tileImg && 'tileGrid' in level && level.tileGrid) {
      const layout = getLayoutForTheme(theme);
      const atlas: TileAtlas = {
        width: tileImg.naturalWidth || tileImg.width || 600,
        height: tileImg.naturalHeight || tileImg.height || 600,
        tileSize: 60,
        numTiles: 100,
      };
      drawAutotiledLevel(ctx, tileImg, level.tileGrid, atlas, camX, camY, { layout, worldTileSize: ts });
      return;
    }

    if ('tileGrid' in level) {
      const grid = level.tileGrid;
      const rows = grid.length;
      const cols = grid[0]?.length || 0;

      const startCol = Math.max(0, Math.floor(camX / ts));
      const endCol = Math.min(cols - 1, Math.floor((camX + this.worldViewWidth) / ts) + 1);
      const startRow = Math.max(0, Math.floor(camY / ts));
      const endRow = Math.min(rows - 1, Math.floor((camY + this.worldViewHeight) / ts) + 1);

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const tile = grid[r][c];
          if (!tile || tile === TileType.EMPTY) continue;

          const screenX = Math.round(c * ts - camX);
          const screenY = Math.round(r * ts - camY);

          this.drawProceduralTile(ctx, screenX, screenY, ts, tile, theme);
        }
      }
    } else {
      // LevelRenderData fallback
      const cols = level.tileCols;
      const rows = level.tileRows;
      const is2D = Array.isArray(level.foregroundTiles[0]);

      const startCol = Math.max(0, Math.floor(camX / ts));
      const endCol = Math.min(cols - 1, Math.floor((camX + this.worldViewWidth) / ts) + 1);
      const startRow = Math.max(0, Math.floor(camY / ts));
      const endRow = Math.min(rows - 1, Math.floor((camY + this.worldViewHeight) / ts) + 1);

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const tile = is2D
            ? (level.foregroundTiles as number[][])[r]?.[c]
            : (level.foregroundTiles as number[])[r * cols + c];

          if (!tile || tile <= 0) continue;

          const screenX = Math.round(c * ts - camX);
          const screenY = Math.round(r * ts - camY);

          this.drawProceduralTile(ctx, screenX, screenY, ts, TileType.SOLID, theme);
        }
      }
    }
  }

  /**
   * Draw an authored .smbl tile layer using the exact 12-bit tile index stored
   * in each cell. This preserves the original terrain artwork instead of
   * approximating it with an autotile mask.
   */
  private drawRawTileLayer(
    image: HTMLImageElement,
    grid: number[][],
    worldTileSize: number,
    camX: number,
    camY: number,
    alpha: number
  ): void {
    const ctx = this.ctx;
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    const srcSize = 60;
    const atlasCols = Math.max(1, Math.floor((image.naturalWidth || image.width || 600) / srcSize));
    const startCol = Math.max(0, Math.floor(camX / worldTileSize));
    const endCol = Math.min(cols - 1, Math.floor((camX + this.worldViewWidth) / worldTileSize) + 1);
    const startRow = Math.max(0, Math.floor(camY / worldTileSize));
    const endRow = Math.min(rows - 1, Math.floor((camY + this.worldViewHeight) / worldTileSize) + 1);

    ctx.save();
    ctx.globalAlpha = alpha;
    for (let r = startRow; r <= endRow; r++) {
      const row = grid[r];
      if (!row) continue;
      for (let c = startCol; c <= endCol; c++) {
        const value = row[c];
        if (!value) continue;
        const index = value & 0xfff;
        if (index === 0) continue;
        const sx = (index % atlasCols) * srcSize;
        const sy = Math.floor(index / atlasCols) * srcSize;
        if (sx + srcSize > (image.naturalWidth || image.width)) continue;
        if (sy + srcSize > (image.naturalHeight || image.height)) continue;
        const dx = Math.round(c * worldTileSize - camX);
        const dy = Math.round(r * worldTileSize - camY);
        ctx.drawImage(
          image,
          sx,
          sy,
          srcSize,
          srcSize,
          dx,
          dy,
          worldTileSize + 1,
          worldTileSize + 1
        );
      }
    }
    ctx.restore();
  }

  /**
   * Procedural pixel-art tiles matching SMB theme.
   */
  private drawProceduralTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    tileType: number,
    theme: string
  ): void {
    if (tileType === TileType.SOLID) {
      if (theme === 'hospital') {
        // Steel industrial panel
        ctx.fillStyle = '#394043';
        ctx.fillRect(x, y, size, size);

        ctx.fillStyle = '#566064';
        ctx.fillRect(x, y, size, 1);
        ctx.fillRect(x, y, 1, size);

        ctx.fillStyle = '#222729';
        ctx.fillRect(x, y + size - 1, size, 1);
        ctx.fillRect(x + size - 1, y, 1, size);

        ctx.fillStyle = '#1c2022';
        ctx.fillRect(x + 2, y + 2, 2, 2);
        ctx.fillRect(x + size - 4, y + 2, 2, 2);
        ctx.fillRect(x + 2, y + size - 4, 2, 2);
        ctx.fillRect(x + size - 4, y + size - 4, 2, 2);
      } else {
        // Forest soil block with grass top
        ctx.fillStyle = '#3d2518';
        ctx.fillRect(x, y, size, size);

        ctx.fillStyle = '#2d1b11';
        ctx.fillRect(x + 3, y + 4, 3, 2);
        ctx.fillRect(x + 10, y + 8, 3, 3);

        // Vibrant grass top
        ctx.fillStyle = '#2b7a3e';
        ctx.fillRect(x, y, size, 3);
        ctx.fillStyle = '#38b000';
        ctx.fillRect(x, y, size, 1);

        // Hanging grass blades
        ctx.fillRect(x + 2, y + 3, 2, 2);
        ctx.fillRect(x + 7, y + 3, 2, 3);
        ctx.fillRect(x + 12, y + 3, 2, 2);

        // Shadow bottom
        ctx.fillStyle = '#1c100a';
        ctx.fillRect(x, y + size - 1, size, 1);
      }
    } else if (tileType >= TileType.SPIKE_UP && tileType <= TileType.SPIKE_RIGHT) {
      const dirMap: Record<number, 'up' | 'down' | 'left' | 'right'> = {
        [TileType.SPIKE_UP]: 'up',
        [TileType.SPIKE_DOWN]: 'down',
        [TileType.SPIKE_LEFT]: 'left',
        [TileType.SPIKE_RIGHT]: 'right',
      };
      this.drawSpikeNeedles(ctx, x, y, size, size, dirMap[tileType] || 'up');
    }
  }

  /**
   * Entities: Saws, Spikes, Crumble Blocks, Bandage Girl.
   */
  private renderEntities(level: LevelData | LevelRenderData, camX: number, camY: number): void {
    const ctx = this.ctx;

    // Bandage Girl at goal
    const goalPos = 'goalPos' in level ? level.goalPos : level.bandageGirl;
    if (goalPos) {
      this.renderBandageGirl(
        {
          x: goalPos.x,
          y: goalPos.y,
          width: 16,
          height: 18,
          rescued: false,
          animTime: this.globalTime,
        },
        camX,
        camY
      );
    }

    // Entities in LevelData
    if ('entities' in level) {
      for (const ent of level.entities) {
        if (ent.type === 'saw') {
          this.renderSawBlade(
            {
              id: ent.id,
              x: ent.x,
              y: ent.y,
              radius: ent.radius || ent.width / 2 || 20,
              angle: (ent.rotation || 0) + this.globalTime * (ent.speed || 12),
              rotSpeed: ent.speed || 12,
              bloodStain: 0.65,
            },
            camX,
            camY
          );
        } else if (ent.type === 'bandage_girl') {
          this.renderBandageGirl(
            {
              x: ent.x,
              y: ent.y,
              width: ent.width || 16,
              height: ent.height || 18,
              rescued: false,
              animTime: this.globalTime,
            },
            camX,
            camY
          );
        } else if (ent.type === 'crumble_block') {
          this.renderCrumbleBlock(
            {
              id: ent.id,
              x: ent.x,
              y: ent.y,
              width: ent.width || 20,
              height: ent.height || 20,
              state: (ent.state as any) || 'idle',
              timer: ent.timer || 0,
            },
            camX,
            camY
          );
        }
      }
    }

    // Explicit LevelRenderData entities
    if ('saws' in level && level.saws) {
      for (const saw of level.saws) {
        saw.angle += saw.rotSpeed * 0.016;
        this.renderSawBlade(saw, camX, camY);
      }
    }
    if ('spikes' in level && level.spikes) {
      for (const sp of level.spikes) {
        const sx = Math.round(sp.x - camX);
        const sy = Math.round(sp.y - camY);
        this.drawSpikeNeedles(ctx, sx, sy, sp.width, sp.height, sp.direction);
      }
    }
  }

  /**
   * Buzzsaw: Rotating metallic circular sawblades with teeth, blood stains, and center axle.
   */
  private renderSawBlade(saw: SawBladeEntity, camX: number, camY: number): void {
    const ctx = this.ctx;
    const screenX = saw.x - camX;
    const screenY = saw.y - camY;
    const r = saw.radius;

    if (
      screenX + r < 0 ||
      screenX - r > this.worldViewWidth ||
      screenY + r < 0 ||
      screenY - r > this.worldViewHeight
    ) {
      return;
    }

    // Use authentic obstacles.png buzzsaw sprite when loaded
    const obsImg = this.getTexture('/assets/textures/LevelPalettes/obstacles.png');
    const obsCoords = this.spritesheets['obstacles_coords.itx'];
    if (obsImg && obsCoords && obsCoords.length > 126) {
      const spinIndex = 120 + (Math.floor(Math.abs(saw.angle) * 3.5) % 7);
      const frame = obsCoords[spinIndex];
      if (frame) {
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(saw.angle);
        const diameter = r * 2.2;
        this.drawSprite(ctx, obsImg, frame, -diameter / 2, -diameter / 2, diameter, diameter);
        ctx.restore();
        return;
      }
    }

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(saw.angle);

    // 1. Sharp Jagged Saw Teeth
    const teethCount = Math.max(14, Math.floor(r * 0.7));
    const innerR = r * 0.82;

    ctx.beginPath();
    for (let i = 0; i < teethCount; i++) {
      const theta1 = (i / teethCount) * Math.PI * 2;
      const theta2 = ((i + 0.6) / teethCount) * Math.PI * 2;
      const theta3 = ((i + 1) / teethCount) * Math.PI * 2;

      const tipX = Math.cos(theta2) * r;
      const tipY = Math.sin(theta2) * r;
      const v1X = Math.cos(theta1) * innerR;
      const v1Y = Math.sin(theta1) * innerR;
      const v2X = Math.cos(theta3) * innerR;
      const v2Y = Math.sin(theta3) * innerR;

      if (i === 0) ctx.moveTo(v1X, v1Y);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(v2X, v2Y);
    }
    ctx.closePath();

    // Metallic gradient
    const bladeGrad = ctx.createRadialGradient(0, 0, innerR * 0.2, 0, 0, r);
    bladeGrad.addColorStop(0, '#ced4da');
    bladeGrad.addColorStop(0.7, '#6c757d');
    bladeGrad.addColorStop(1, '#495057');
    ctx.fillStyle = bladeGrad;
    ctx.fill();

    ctx.strokeStyle = '#212529';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 2. Concentric blade ring & cutouts
    ctx.strokeStyle = '#343a40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Blood stains on rotating blade
    const bloodCoverage = saw.bloodStain !== undefined ? saw.bloodStain : 0.65;
    if (bloodCoverage > 0.1) {
      ctx.fillStyle = '#800016';
      ctx.beginPath();
      ctx.arc(r * 0.35, -r * 0.2, r * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#5c000e';
      ctx.beginPath();
      ctx.arc(-r * 0.25, r * 0.3, r * 0.35, 0.4, 2.8);
      ctx.lineTo(-r * 0.1, r * 0.1);
      ctx.closePath();
      ctx.fill();

      // Rim spray
      ctx.fillStyle = '#9e011a';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0.2, 1.2);
      ctx.lineTo(Math.cos(1.2) * (r * 0.7), Math.sin(1.2) * (r * 0.7));
      ctx.arc(0, 0, r * 0.7, 1.2, 0.2, true);
      ctx.closePath();
      ctx.fill();
    }

    // 4. Center Axle & Mounting Bolt
    const axleR = Math.max(3, r * 0.24);
    ctx.fillStyle = '#1b1e23';
    ctx.beginPath();
    ctx.arc(0, 0, axleR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, axleR * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#6c757d';
    ctx.fillRect(-axleR * 0.3, -axleR * 0.3, axleR * 0.6, axleR * 0.6);

    ctx.restore();
  }

  /**
   * Crumble Block with shaking and cracking animation.
   */
  private renderCrumbleBlock(b: CrumbleBlockEntity, camX: number, camY: number): void {
    if (b.state === 'destroyed') return;

    const ctx = this.ctx;
    let offsetX = 0;
    let offsetY = 0;

    if (b.state === 'shaking') {
      offsetX = Math.sin(b.timer * 45) * 2.2;
      offsetY = (Math.random() - 0.5) * 0.8;
    } else if (b.state === 'falling') {
      offsetY = (b.fallSpeed || 150) * b.timer;
    }

    const screenX = Math.round(b.x + offsetX - camX);
    const screenY = Math.round(b.y + offsetY - camY);

    ctx.fillStyle = '#4a4e52';
    ctx.fillRect(screenX, screenY, b.width, b.height);

    ctx.fillStyle = '#61676c';
    ctx.fillRect(screenX, screenY, b.width, 1);
    ctx.fillRect(screenX, screenY, 1, b.height);

    ctx.fillStyle = '#2d3033';
    ctx.fillRect(screenX, screenY + b.height - 1, b.width, 1);
    ctx.fillRect(screenX + b.width - 1, screenY, 1, b.height);

    if (b.state === 'shaking' || b.state === 'falling') {
      ctx.strokeStyle = '#1b1d1f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenX + b.width * 0.25, screenY);
      ctx.lineTo(screenX + b.width * 0.45, screenY + b.height * 0.5);
      ctx.lineTo(screenX + b.width * 0.35, screenY + b.height);
      ctx.stroke();
    }
  }

  /**
   * Spikes / Needles: Sharp blood-dipped hazards.
   */
  private drawSpikeNeedles(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    direction: 'up' | 'down' | 'left' | 'right'
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const toothCount = Math.max(1, Math.floor(width / 8));
    const toothWidth = width / toothCount;

    for (let i = 0; i < toothCount; i++) {
      const tx = i * toothWidth;

      ctx.beginPath();
      if (direction === 'up') {
        ctx.moveTo(tx, height);
        ctx.lineTo(tx + toothWidth / 2, 0);
        ctx.lineTo(tx + toothWidth, height);
      } else if (direction === 'down') {
        ctx.moveTo(tx, 0);
        ctx.lineTo(tx + toothWidth / 2, height);
        ctx.lineTo(tx + toothWidth, 0);
      } else if (direction === 'left') {
        ctx.moveTo(width, tx);
        ctx.lineTo(0, tx + toothWidth / 2);
        ctx.lineTo(width, tx + toothWidth);
      } else {
        ctx.moveTo(0, tx);
        ctx.lineTo(width, tx + toothWidth / 2);
        ctx.lineTo(0, tx + toothWidth);
      }
      ctx.closePath();

      ctx.fillStyle = '#8d99ae';
      ctx.fill();
      ctx.strokeStyle = '#1b1d1f';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Blood-dipped tip
      ctx.fillStyle = '#9e011a';
      ctx.beginPath();
      if (direction === 'up') {
        ctx.moveTo(tx + toothWidth * 0.3, height * 0.4);
        ctx.lineTo(tx + toothWidth / 2, 0);
        ctx.lineTo(tx + toothWidth * 0.7, height * 0.4);
      } else {
        ctx.moveTo(tx + toothWidth * 0.3, height * 0.6);
        ctx.lineTo(tx + toothWidth / 2, height);
        ctx.lineTo(tx + toothWidth * 0.7, height * 0.6);
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Bandage Girl: Cute pink cube with ribbon, anime eyes, waving animation at level goal.
   */
  private renderBandageGirl(bg: BandageGirlEntity, camX: number, camY: number): void {
    const ctx = this.ctx;
    const screenX = Math.round(bg.x - camX);
    const screenY = Math.round(bg.y - camY);

    ctx.save();
    ctx.translate(screenX, screenY);

    const bobOffset = Math.sin(this.globalTime * 5) * 1.5;
    ctx.translate(0, bobOffset);

    const w = bg.width;
    const h = bg.height;

    // Use authentic Bandage Girl sprite from bandagegirl.png when available
    const bgImg = this.getTexture('/assets/textures/Animations/bandagegirl.png');
    const bgCoords = this.spritesheets['bandagegirl_coords.itx'];
    if (bgImg && bgCoords && bgCoords.length > 2) {
      const frame = bgCoords[2]; // Full body authentic Bandage Girl frame
      if (frame) {
        const drawW = w;
        const drawH = h;
        this.drawSprite(ctx, bgImg, frame, (w - drawW) / 2, (h - drawH) / 2, drawW, drawH);
        ctx.restore();
        return;
      }
    }

    // Body
    ctx.fillStyle = '#ff758f';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#a4133c';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(0, 0, w, h);

    ctx.fillStyle = '#ffccd5';
    ctx.fillRect(1, 1, w - 2, 2);

    // Cross Bandage
    ctx.fillStyle = '#fff0f3';
    ctx.fillRect(w * 0.22, h * 0.18, 3, 7);
    ctx.fillRect(w * 0.22 - 2, h * 0.18 + 2, 7, 3);

    // Ribbon bow
    ctx.fillStyle = '#ff4d6d';
    const bowX = w * 0.78;
    const bowY = -1;
    ctx.beginPath();
    ctx.ellipse(bowX - 3, bowY, 3, 2, -0.4, 0, Math.PI * 2);
    ctx.ellipse(bowX + 3, bowY, 3, 2, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Eyes with shine
    const eyeY = h * 0.48;
    ctx.fillStyle = '#2b0914';
    ctx.beginPath();
    ctx.ellipse(w * 0.38, eyeY, 2, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(w * 0.65, eyeY, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w * 0.38 - 1, eyeY - 2, 1.5, 1.5);
    ctx.fillRect(w * 0.65 - 1, eyeY - 2, 1.5, 1.5);

    // Blush
    ctx.fillStyle = '#ff4d6d';
    ctx.globalAlpha = 0.6;
    ctx.fillRect(w * 0.22, eyeY + 3, 3, 1.5);
    ctx.fillRect(w * 0.74, eyeY + 3, 3, 1.5);
    ctx.globalAlpha = 1.0;

    // Smile
    ctx.strokeStyle = '#590d22';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w * 0.52, eyeY + 2.5, 2, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Waving hand
    const waveAngle = Math.sin(this.globalTime * 8) * 0.45;
    ctx.save();
    ctx.translate(w, h * 0.5);
    ctx.rotate(waveAngle);
    ctx.fillStyle = '#ff758f';
    ctx.fillRect(0, -2, 4, 3);
    ctx.strokeStyle = '#a4133c';
    ctx.strokeRect(0, -2, 4, 3);
    ctx.restore();

    ctx.restore();
  }

  /**
   * Meat Boy: Red cube with squash & stretch transforms, facial expressions,
   * proximity panic near saws/spikes, and meat striations.
   */
  private renderMeatBoy(
    player: PlayerState | PlayerRenderState,
    level: LevelData | LevelRenderData,
    camX: number,
    camY: number,
    overrideAlpha: number = 1.0
  ): void {
    const ctx = this.ctx;
    const cx = Math.round(player.x + player.width / 2 - camX);
    const cy = Math.round(player.y + player.height / 2 - camY);

    ctx.save();
    ctx.globalAlpha = overrideAlpha;
    ctx.translate(cx, cy);

    // Facing direction
    const facing = 'facing' in player ? player.facing : (player.facingRight ? 1 : -1);

    // Squash & Stretch
    let sX = player.squashX || 1.0;
    let sY = player.squashY || 1.0;

    const isGrounded = 'isGrounded' in player ? player.isGrounded : player.onGround;
    if (isGrounded && Math.abs(player.vx) > 30) {
      const wobble = Math.sin(this.globalTime * 22) * 0.08;
      sX += wobble;
      sY -= wobble;
    }

    ctx.scale(facing * sX, sY);

    // Use authentic Meat Boy sprite atlas from meatboyanim.png when available
    const mbImg = this.getTexture('/assets/textures/Animations/meatboyanim.png');
    const mbCoords = this.spritesheets['meatboyanim_coords.itx'];

    if (mbImg && mbCoords && mbCoords.length > 105) {
      let frameIdx = 14; // Default idle frame

      const isDead = 'isDead' in player ? player.isDead : false;
      const isWallSliding = 'isWallSliding' in player ? player.isWallSliding : false;
      const isRunning = isGrounded && Math.abs(player.vx) > 30;

      if (isDead) {
        const deathT = typeof (player as any).timeSinceDeath === 'number' ? (player as any).timeSinceDeath : 0;
        frameIdx = 105 + Math.min(10, Math.floor(deathT * 24));
      } else if (isWallSliding) {
        frameIdx = 101 + Math.floor((this.globalTime * 12) % 3);
      } else if (!isGrounded) {
        frameIdx = player.vy < -50 ? 90 : (player.vy > 50 ? 12 : 9);
      } else if (isRunning) {
        frameIdx = 72 + Math.floor((this.globalTime * 24) % 9);
      } else {
        frameIdx = 14;
      }

      const frame = mbCoords[frameIdx];
      if (frame) {
        // Draw the sprite at its authored world size (14x14); the 1.5x
        // upscale made Meat Boy noticeably larger than the reference.
        const drawW = player.width;
        const drawH = player.height;
        this.drawSprite(ctx, mbImg, frame, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
        return;
      }
    }

    const halfW = player.width / 2;
    const halfH = player.height / 2;

    // Body
    const bodyColor = ('color' in player && player.color) ? player.color : '#cf1b2b';
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-halfW, -halfH, player.width, player.height);

    ctx.strokeStyle = '#52030d';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-halfW, -halfH, player.width, player.height);

    // Highlights & shadow
    ctx.fillStyle = '#e63946';
    ctx.fillRect(-halfW + 1, -halfH + 1, player.width - 2, 2);
    ctx.fillRect(-halfW + 1, -halfH + 1, 2, player.height - 2);

    ctx.fillStyle = '#7a0510';
    ctx.fillRect(-halfW + 1, halfH - 2, player.width - 2, 2);
    ctx.fillRect(halfW - 2, -halfH + 1, 2, player.height - 2);

    // Meat striation / vein details
    ctx.fillStyle = '#940e1b';
    ctx.fillRect(-halfW + 3, halfH - 5, 4, 1.5);
    ctx.fillRect(halfW - 6, -halfH + 4, 3, 1.5);

    // Forehead sweat / glisten
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-halfW + 3, -halfH + 3, 2, 2);

    // Facial Expression
    let expr: PlayerExpression = 'normal';

    // Proximity check to hazards -> panic!
    let minHazardDist = 9999;
    if ('entities' in level) {
      for (const ent of level.entities) {
        if (ent.type === 'saw') {
          const dx = ent.x - player.x;
          const dy = ent.y - player.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minHazardDist) minHazardDist = d;
        }
      }
    }
    if ('saws' in level && level.saws) {
      for (const saw of level.saws) {
        const dx = saw.x - player.x;
        const dy = saw.y - player.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minHazardDist) minHazardDist = d;
      }
    }

    if (minHazardDist < 75) {
      expr = 'panicked';
    } else if (isGrounded && Math.abs(player.vx) > 100) {
      expr = 'determined';
    } else if (!isGrounded && Math.abs(player.vy) > 180) {
      expr = 'startled';
    }

    this.renderMeatBoyFace(ctx, player.width, player.height, expr);

    ctx.restore();
  }

  private renderMeatBoyFace(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    expression: PlayerExpression
  ): void {
    const eyeY = -h * 0.12;

    if (expression === 'panicked') {
      // Bulging eyes & screaming mouth
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-w * 0.2, eyeY, 4, 0, Math.PI * 2);
      ctx.arc(w * 0.22, eyeY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2b0006';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#0d0003';
      ctx.fillRect(-w * 0.2 - 0.5, eyeY - 0.5, 1.5, 1.5);
      ctx.fillRect(w * 0.22 - 0.5, eyeY - 0.5, 1.5, 1.5);

      ctx.fillStyle = '#2b0006';
      ctx.beginPath();
      ctx.ellipse(0, h * 0.26, 4, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, h * 0.26 - 3, 4, 1.5);
    } else if (expression === 'determined') {
      // Confident brow & sharp grin
      ctx.strokeStyle = '#2b0006';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-w * 0.35, eyeY - 3);
      ctx.lineTo(-w * 0.1, eyeY - 1);
      ctx.moveTo(w * 0.35, eyeY - 3);
      ctx.lineTo(w * 0.1, eyeY - 1);
      ctx.stroke();

      ctx.fillStyle = '#1a0104';
      ctx.fillRect(-w * 0.25, eyeY - 0.5, 3, 3);
      ctx.fillRect(w * 0.15, eyeY - 0.5, 3, 3);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-w * 0.25 + 1.5, eyeY - 0.5, 1, 1);
      ctx.fillRect(w * 0.15 + 1.5, eyeY - 0.5, 1, 1);

      ctx.fillStyle = '#1a0104';
      ctx.fillRect(-w * 0.2, h * 0.22, w * 0.45, 2.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-w * 0.15, h * 0.22, w * 0.35, 1.2);
    } else if (expression === 'startled') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-w * 0.2, eyeY, 3, 0, Math.PI * 2);
      ctx.arc(w * 0.2, eyeY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1a0104';
      ctx.fillRect(-w * 0.2 - 0.5, eyeY - 0.5, 1.5, 1.5);
      ctx.fillRect(w * 0.2 - 0.5, eyeY - 0.5, 1.5, 1.5);

      ctx.beginPath();
      ctx.arc(0, h * 0.24, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Classic Normal
      ctx.fillStyle = '#1a0104';
      ctx.fillRect(-w * 0.28, eyeY - 1, 3.5, 4);
      ctx.fillRect(w * 0.12, eyeY - 1, 3.5, 4);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-w * 0.28 + 1.5, eyeY - 1, 1.5, 1.5);
      ctx.fillRect(w * 0.12 + 1.5, eyeY - 1, 1.5, 1.5);

      ctx.fillStyle = '#2b0006';
      ctx.fillRect(-w * 0.18, h * 0.24, w * 0.4, 1.5);
    }
  }

  /**
   * Simultaneous Multi-Ghost Replay Renderer:
   * Renders all historical attempts with translucent trails,
   * and the winning run fully opaque.
   */
  private renderReplayGhosts(replay: ReplayEngine, camX: number, camY: number): void {
    const ghosts = replay.getActiveGhostFrames();

    for (const ghost of ghosts) {
      const f = ghost.frame;
      const alpha = ghost.isWinning ? 1.0 : 0.45;

      const dummyPlayer: PlayerRenderState = {
        x: f.x,
        y: f.y,
        vx: f.vx,
        vy: f.vy,
        width: 14,
        height: 14,
        facingRight: f.facing === 1,
        onGround: f.state === 'running' || f.state === 'idle',
        onWall: f.state === 'wall_sliding',
        wallDir: 0,
        isDead: f.state === 'dead',
        isJumping: f.state === 'jumping',
        isFalling: f.state === 'falling',
        isSliding: f.state === 'wall_sliding',
        squashX: f.squashX || 1.0,
        squashY: f.squashY || 1.0,
        stateTime: f.t,
        deathTimer: 0,
        color: ghost.isWinning ? '#cf1b2b' : '#ff9999',
      };

      this.renderMeatBoy(dummyPlayer, { bounds: { minX: 0, minY: 0, maxX: 9999, maxY: 9999 } } as any, camX, camY, alpha);
    }
  }
}

export { GameRenderer as Renderer };
