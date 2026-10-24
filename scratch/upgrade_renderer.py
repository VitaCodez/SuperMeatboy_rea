import sys

with open('src/engine/renderer.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
imp_target = "import { ReplayEngine } from './replayEngine';"
imp_replacement = "import { ReplayEngine } from './replayEngine';\nimport { drawAutotiledLevel, TileAtlas } from './tileAutotiler';"
if imp_target not in content:
    print('Error: imp_target not found')
    sys.exit(1)
content = content.replace(imp_target, imp_replacement, 1)

# 2. Properties
prop_target = "  private texturesLoaded: Map<string, boolean> = new Map();"
prop_replacement = "  private texturesLoaded: Map<string, boolean> = new Map();\n  private spritesheets: Record<string, Array<{ u: number; v: number; w: number; h: number; rot: number }>> = {};\n  private spritesheetsLoaded: boolean = false;"
if prop_target not in content:
    print('Error: prop_target not found')
    sys.exit(1)
content = content.replace(prop_target, prop_replacement, 1)

# 3. Constructor
ctor_target = "    this.preloadTextures();"
ctor_replacement = "    this.preloadTextures();\n    this.loadSpritesheetData();"
if ctor_target not in content:
    print('Error: ctor_target not found')
    sys.exit(1)
content = content.replace(ctor_target, ctor_replacement, 1)

# 4. preloadTextures list
tex_target = "      '/assets/textures/LevelPalettes/forestbg.png',"
tex_replacement = "      '/assets/textures/LevelPalettes/forestbg.png',\n      '/assets/textures/LevelPalettes/Forest_tile_setbackup.png',\n      '/assets/textures/LevelPalettes/Forest_tile_set.png',"
if tex_target not in content:
    print('Error: tex_target not found')
    sys.exit(1)
content = content.replace(tex_target, tex_replacement, 1)

# 5. Add loadSpritesheetData and drawSprite right after getTexture
gettex_target = "    return null;\n  }"
gettex_replacement = """    return null;
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
  }"""
if gettex_target not in content:
    print('Error: gettex_target not found')
    sys.exit(1)
content = content.replace(gettex_target, gettex_replacement, 1)

# 6. renderTiles autotiler injection
tiles_target = "    const ts = level.tileSize || 16;\n    const theme = 'theme' in level ? level.theme : level.chapter;"
tiles_replacement = """    const ts = level.tileSize || 16;
    const theme = 'theme' in level ? level.theme : level.chapter;

    // Use authentic Forest texture atlas & autotiler when available
    const forestImg =
      this.getTexture('/assets/textures/LevelPalettes/Forest_tile_setbackup.png') ||
      this.getTexture('/assets/textures/LevelPalettes/Forest_tile_set.png');
    if (forestImg && 'tileGrid' in level && level.tileGrid) {
      const atlas: TileAtlas = {
        width: forestImg.naturalWidth || forestImg.width || 768,
        height: forestImg.naturalHeight || forestImg.height || 768,
        tileSize: 60,
        numTiles: 100,
      };
      drawAutotiledLevel(ctx, forestImg, level.tileGrid, atlas, camX, camY, { worldTileSize: ts });
      return;
    }"""
if tiles_target not in content:
    print('Error: tiles_target not found')
    sys.exit(1)
content = content.replace(tiles_target, tiles_replacement, 1)

# 7. renderSawBlade sprite injection
saw_target = "    ctx.save();\n    ctx.translate(screenX, screenY);\n    ctx.rotate(saw.angle);"
saw_replacement = """    // Use authentic obstacles.png buzzsaw sprite when loaded
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
    ctx.rotate(saw.angle);"""
if saw_target not in content:
    print('Error: saw_target not found')
    sys.exit(1)
content = content.replace(saw_target, saw_replacement, 1)

# 8. renderBandageGirl sprite injection
bg_target = "    const w = bg.width;\n    const h = bg.height;"
bg_replacement = """    const w = bg.width;
    const h = bg.height;

    // Use authentic Bandage Girl sprite from bandagegirl.png when available
    const bgImg = this.getTexture('/assets/textures/Animations/bandagegirl.png');
    const bgCoords = this.spritesheets['bandagegirl_coords.itx'];
    if (bgImg && bgCoords && bgCoords.length > 2) {
      const frame = bgCoords[2]; // Full body authentic Bandage Girl frame
      if (frame) {
        const drawW = w * 1.5;
        const drawH = h * 1.5;
        this.drawSprite(ctx, bgImg, frame, (w - drawW) / 2, (h - drawH) / 2, drawW, drawH);
        ctx.restore();
        return;
      }
    }"""
if bg_target not in content:
    print('Error: bg_target not found')
    sys.exit(1)
content = content.replace(bg_target, bg_replacement, 1)

# 9. renderMeatBoy sprite injection
mb_target = "    const halfW = player.width / 2;\n    const halfH = player.height / 2;"
mb_replacement = """    // Use authentic Meat Boy sprite atlas from meatboyanim.png when available
    const mbImg = this.getTexture('/assets/textures/Animations/meatboyanim.png');
    const mbCoords = this.spritesheets['meatboyanim_coords.itx'];

    if (mbImg && mbCoords && mbCoords.length > 105) {
      let frameIdx = 14; // Default idle frame

      const isDead = 'isDead' in player ? player.isDead : false;
      const isWallSliding = 'isWallSliding' in player ? player.isWallSliding : false;
      const isRunning = isGrounded && Math.abs(player.vx) > 30;

      if (isDead) {
        const deathT = 'timeSinceDeath' in player ? player.timeSinceDeath : 0;
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
        const drawW = player.width * 1.5;
        const drawH = player.height * 1.5;
        this.drawSprite(ctx, mbImg, frame, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
        return;
      }
    }

    const halfW = player.width / 2;
    const halfH = player.height / 2;"""
if mb_target not in content:
    print('Error: mb_target not found')
    sys.exit(1)
content = content.replace(mb_target, mb_replacement, 1)

with open('src/engine/renderer.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully upgraded src/engine/renderer.ts!')
