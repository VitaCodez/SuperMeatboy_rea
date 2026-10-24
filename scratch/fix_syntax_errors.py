# Fix tileAutotiler.ts
with open('src/engine/tileAutotiler.ts', 'r', encoding='utf-8') as f:
    tat = f.read()

tat = tat.replace(
    "ctx.translate(dx + worldTileSize / 2, dy + worldTileSize / 2);\\n        ctx.rotate(rect.rot);",
    "ctx.translate(dx + worldTileSize / 2, dy + worldTileSize / 2);\n        ctx.rotate(rect.rot);"
)
with open('src/engine/tileAutotiler.ts', 'w', encoding='utf-8') as f:
    f.write(tat)
print("Fixed tileAutotiler.ts")

# Fix renderer.ts
with open('src/engine/renderer.ts', 'r', encoding='utf-8') as f:
    rend = f.read()

old_decl = """  private renderTiles(level: LevelData | LevelRenderData, camX: number, camY: number): void {
    const ctx = this.ctx;
    const ts = level.tileSize || 16;
    const theme = 'theme' in level ? level.theme : level.chapter;

    // Use authentic Chapter texture atlas & autotiler when available
    const rawTheme = 'theme' in level ? level.theme : (typeof level.chapter === 'string' ? level.chapter : `chapter${level.chapter}`);
    const theme = rawTheme || 'forest';"""

new_decl = """  private renderTiles(level: LevelData | LevelRenderData, camX: number, camY: number): void {
    const ctx = this.ctx;
    const ts = level.tileSize || 16;
    const rawTheme = 'theme' in level ? level.theme : (typeof level.chapter === 'string' ? level.chapter : `chapter${level.chapter}`);
    const theme = (rawTheme || 'forest').toLowerCase();"""

rend = rend.replace(old_decl, new_decl)
with open('src/engine/renderer.ts', 'w', encoding='utf-8') as f:
    f.write(rend)
print("Fixed renderer.ts")
