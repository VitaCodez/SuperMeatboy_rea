with open('src/engine/levelParser.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  // Node.js local filesystem read attempt (for CLI, test runners, or SSR)
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const candidatePaths = [
        path.resolve(process.cwd(), 'public', 'assets', 'levels', filename),
        path.resolve(process.cwd(), '..', 'public', 'assets', 'levels', filename),
      ];

      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          const fileBuf = fs.readFileSync(p);
          return parseSMBL(fileBuf, CHAPTER_1_FALLBACK_LEVELS[levelId]?.name || `Level ${levelId}`);
        }
      }
    } catch {
      // Continue to pre-baked fallback
    }
  }"""

replacement = """  // Synchronous pre-baked fallback if offline or not found via HTTP"""

if target in content:
    content = content.replace(target, replacement, 1)
    with open('src/engine/levelParser.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Cleaned levelParser.ts!')
else:
    print('Target not found in levelParser.ts')
