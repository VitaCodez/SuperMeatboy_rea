with open('src/engine/renderer.ts', 'r', encoding='utf-8') as f:
    c = f.read()

target = "const deathT = 'timeSinceDeath' in player ? player.timeSinceDeath : 0;"
replacement = "const deathT = typeof (player as any).timeSinceDeath === 'number' ? (player as any).timeSinceDeath : 0;"
if target in c:
    c = c.replace(target, replacement, 1)
    with open('src/engine/renderer.ts', 'w', encoding='utf-8') as f:
        f.write(c)
    print('Fixed line 1120 in renderer.ts')
else:
    print('Target not found')
