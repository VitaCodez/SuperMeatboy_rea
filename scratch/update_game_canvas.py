with open('src/components/GameCanvas.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import BossLilSlugger
old_import = "import { CharacterProps, LevelData, ReplayAttempt } from '../engine/types';"
new_import = "import { CharacterProps, LevelData, ReplayAttempt } from '../engine/types';\nimport { BossLilSlugger } from '../engine/bossLilSlugger';"
content = content.replace(old_import, new_import)

# 2. Add ref
old_ref = "  const replayEngineRef = useRef<ReplayEngine>(new ReplayEngine());"
new_ref = "  const replayEngineRef = useRef<ReplayEngine>(new ReplayEngine());\n  const bossLilSluggerRef = useRef<BossLilSlugger | null>(null);"
content = content.replace(old_ref, new_ref)

# 3. In setupLevel
old_setup = """    // Start a fresh replay recording session
    replayEngineRef.current.resetLevelSession(level.id);"""

new_setup = """    // Initialize Lil Slugger for Chapter 1 Boss
    if (level.id === '1-21' || level.id === 'boss1' || level.name.toLowerCase().includes('slugger') || (level.chapter === 1 && level.id.includes('21'))) {
      if (!bossLilSluggerRef.current) {
        bossLilSluggerRef.current = new BossLilSlugger(40, 260);
      } else {
        bossLilSluggerRef.current.reset(40, 260);
      }
    } else {
      bossLilSluggerRef.current = null;
    }

    // Start a fresh replay recording session
    replayEngineRef.current.resetLevelSession(level.id);"""
content = content.replace(old_setup, new_setup)

# 4. In respawn handling
old_respawn = """            // Respawn Meat Boy at spawn point
            const startX = level.startPos ? level.startPos.x : 48;
            const startY = level.startPos ? level.startPos.y : 100;
            player.reset(startX, startY);
            renderer.camera.snapTo(startX, startY);"""

new_respawn = """            // Respawn Meat Boy at spawn point
            const startX = level.startPos ? level.startPos.x : 48;
            const startY = level.startPos ? level.startPos.y : 100;
            player.reset(startX, startY);
            renderer.camera.snapTo(startX, startY);
            if (bossLilSluggerRef.current) {
              bossLilSluggerRef.current.reset(40, 260);
            }"""
content = content.replace(old_respawn, new_respawn)

# 5. In game loop update
old_update_loop = """        // Update camera position, lerp, and particles
        renderer.update(dt, player.state, level);"""

new_update_loop = """        // Update Lil Slugger Boss if active in level
        if (bossLilSluggerRef.current) {
          const boss = bossLilSluggerRef.current;
          boss.update(
            dt,
            player.state,
            renderer.camera,
            renderer.particles,
            () => {
              if (!player.state.isDead) {
                player.kill(
                  (x, y, count, speed) => renderer.bloodDecals.addLandingSplatter(x, y, speed),
                  () => soundManager.playSfx(SMB_SOUNDS.DEATH)
                );
                renderer.bloodDecals.addDeathExplosion(player.state.x + 7, player.state.y + 7, 'saw');
                renderer.particles.emitDeathMeatChunks(player.state.x + 7, player.state.y + 7, 36, renderer.bloodDecals);
              }
            },
            () => {
              player.state.isWin = true;
            }
          );
        }

        // Update camera position, lerp, and particles
        renderer.update(dt, player.state, level);"""
content = content.replace(old_update_loop, new_update_loop)

# 6. In render pass
old_render = """      // Render world with authentic camera view, parallax backgrounds, decals, and entities
      renderer.render(level, player.state, renderer.bloodDecals, undefined, levelTimerRef.current);"""

new_render = """      // Render world with authentic camera view, parallax backgrounds, decals, and entities
      renderer.render(level, player.state, renderer.bloodDecals, undefined, levelTimerRef.current);

      // Render Boss if present
      if (bossLilSluggerRef.current) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          bossLilSluggerRef.current.render(ctx, renderer.camera.getRenderX(), renderer.camera.getRenderY());
        }
      }"""
content = content.replace(old_render, new_render)

with open('src/components/GameCanvas.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated GameCanvas.tsx successfully!')
