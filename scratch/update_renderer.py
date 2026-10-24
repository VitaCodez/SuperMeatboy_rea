with open('src/engine/renderer.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update import
old_import = "import { drawAutotiledLevel, TileAtlas } from './tileAutotiler';"
new_import = "import { drawAutotiledLevel, TileAtlas, getLayoutForTheme, getThemeTilesetPath, getThemeBackgroundPath } from './tileAutotiler';"
content = content.replace(old_import, new_import)

# 2. Update preloadTextures
old_preload = """    const textureList = [
      '/assets/textures/LevelPalettes/forestbg.png',
      '/assets/textures/LevelPalettes/Forest_tile_setbackup.png',
      '/assets/textures/LevelPalettes/Forest_tile_set.png',
      '/assets/textures/LevelPalettes/hospitalbg.png',
      '/assets/textures/LevelPalettes/Forest_tile_set.png',
      '/assets/textures/LevelPalettes/forestset1.png',
      '/assets/textures/LevelPalettes/hospitaltiles01.png',
      '/assets/textures/LevelPalettes/obstacles.png',
      '/assets/textures/Animations/meatboyanim.png',
      '/assets/textures/Animations/bandagegirl.png',
    ];"""

new_preload = """    const textureList = [
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
    ];"""
content = content.replace(old_preload, new_preload)

# 3. Update renderParallaxBackground
old_bg = """  private renderParallaxBackground(chapter: string, camX: number, camY: number): void {
    const ctx = this.ctx;
    const bgPath = chapter === 'hospital'
      ? '/assets/textures/LevelPalettes/hospitalbg.png'
      : '/assets/textures/LevelPalettes/forestbg.png';

    const bgImage = this.getTexture(bgPath);

    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
      const scrollX = (camX * 0.25) % bgImage.width;
      const scrollY = (camY * 0.15) % bgImage.height;

      const startX = -scrollX - (scrollX > 0 ? 0 : bgImage.width);
      const startY = -scrollY - (scrollY > 0 ? 0 : bgImage.height);

      for (let x = startX; x < this.virtualWidth + bgImage.width; x += bgImage.width) {
        for (let y = startY; y < this.virtualHeight + bgImage.height; y += bgImage.height) {
          ctx.drawImage(bgImage, Math.floor(x), Math.floor(y));
        }
      }
    } else {
      // Procedural Atmospheric Fallback
      if (chapter === 'hospital') {
        const grad = ctx.createLinearGradient(0, 0, 0, this.virtualHeight);
        grad.addColorStop(0, '#101618');
        grad.addColorStop(0.5, '#1b2426');
        grad.addColorStop(1, '#0e1416');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

        ctx.fillStyle = '#151d20';
        const pillarSpacing = 80;
        const pillarOffset = -(camX * 0.2) % pillarSpacing;
        for (let x = pillarOffset; x < this.virtualWidth + pillarSpacing; x += pillarSpacing) {
          ctx.fillRect(Math.floor(x), 0, 16, this.virtualHeight);
        }
      } else {
        // Forest
        const grad = ctx.createLinearGradient(0, 0, 0, this.virtualHeight);
        grad.addColorStop(0, '#0c1514');
        grad.addColorStop(0.4, '#152422');
        grad.addColorStop(1, '#1b2e2b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

        // Distant pine tree silhouettes (0.2x parallax)
        ctx.fillStyle = '#0f1a18';
        const treeSpacing = 64;
        const t1Offset = -(camX * 0.2) % treeSpacing;
        for (let x = t1Offset - treeSpacing; x < this.virtualWidth + treeSpacing; x += treeSpacing) {
          ctx.fillRect(Math.floor(x), this.virtualHeight - 90, 8, 90);
          ctx.beginPath();
          ctx.moveTo(x + 4, this.virtualHeight - 140);
          ctx.lineTo(x - 18, this.virtualHeight - 85);
          ctx.lineTo(x + 26, this.virtualHeight - 85);
          ctx.fill();
        }
      }
    }
  }"""

new_bg = """  private renderParallaxBackground(chapter: string, camX: number, camY: number): void {
    const ctx = this.ctx;
    const bgPath = getThemeBackgroundPath(chapter);
    const bgImage = this.getTexture(bgPath) || this.getTexture('/assets/textures/LevelPalettes/forestbg.png');

    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
      const scrollX = (camX * 0.25) % bgImage.width;
      const scrollY = (camY * 0.15) % bgImage.height;

      const startX = -scrollX - (scrollX > 0 ? 0 : bgImage.width);
      const startY = -scrollY - (scrollY > 0 ? 0 : bgImage.height);

      for (let x = startX; x < this.virtualWidth + bgImage.width; x += bgImage.width) {
        for (let y = startY; y < this.virtualHeight + bgImage.height; y += bgImage.height) {
          ctx.drawImage(bgImage, Math.floor(x), Math.floor(y));
        }
      }
    } else {
      // Procedural Atmospheric Fallback per chapter
      const norm = (chapter || 'forest').toLowerCase();
      const grad = ctx.createLinearGradient(0, 0, 0, this.virtualHeight);
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
      ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
    }
  }"""
content = content.replace(old_bg, new_bg)

# 4. Update renderTiles
old_tiles = """    // Use authentic Forest texture atlas & autotiler when available
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

new_tiles = """    // Use authentic Chapter texture atlas & autotiler when available
    const rawTheme = 'theme' in level ? level.theme : (typeof level.chapter === 'string' ? level.chapter : `chapter${level.chapter}`);
    const theme = rawTheme || 'forest';
    const tilesetPath = getThemeTilesetPath(theme);
    const tileImg =
      this.getTexture(tilesetPath) ||
      this.getTexture('/assets/textures/LevelPalettes/foresttiles01.png') ||
      this.getTexture('/assets/textures/LevelPalettes/Forest_tile_setbackup.png') ||
      this.getTexture('/assets/textures/LevelPalettes/Forest_tile_set.png');

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
    }"""
content = content.replace(old_tiles, new_tiles)

with open('src/engine/renderer.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated renderer.ts successfully!')
