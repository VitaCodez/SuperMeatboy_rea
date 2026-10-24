with open('src/engine/levelParser.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
old_import = "import { CHAPTER_1_FALLBACK_LEVELS, getAllChapter1Levels } from './levels/chapter1';"
new_import = "import { CHAPTER_1_FALLBACK_LEVELS, getAllChapter1Levels } from './levels/chapter1';\nimport { getOtherChapterLevel } from './levels/otherChapters';"
content = content.replace(old_import, new_import)

# Update getLevel
old_get_level = """export function getLevel(id: string): LevelData {
  const cleanId = id.trim().toLowerCase();
  const found = CHAPTER_1_FALLBACK_LEVELS[cleanId];
  if (found) {
    return found;
  }

  // Return default 1-1 if not found
  return CHAPTER_1_FALLBACK_LEVELS['1-1'];
}"""

new_get_level = """export function getLevel(id: string): LevelData {
  const cleanId = id.trim().toLowerCase();
  const found = CHAPTER_1_FALLBACK_LEVELS[cleanId];
  if (found) {
    return found;
  }

  if (cleanId === '1-21' || cleanId === 'boss1') {
    return CHAPTER_1_FALLBACK_LEVELS['1-21'];
  }

  // Parse chapter and level number
  const match = cleanId.match(/^(\\d+)-(\\d+)/);
  if (match) {
    const ch = parseInt(match[1], 10);
    const lvl = parseInt(match[2], 10);
    if (ch >= 2 && ch <= 7) {
      return getOtherChapterLevel(ch, lvl);
    }
  }

  // Return default 1-1 if not found
  return CHAPTER_1_FALLBACK_LEVELS['1-1'];
}"""
content = content.replace(old_get_level, new_get_level)

# Update loadLevel
old_load_level = """export async function loadLevel(
  chapter: number | string,
  level: number | string,
  isDark: boolean = false
): Promise<LevelData> {
  const levelId = `${chapter}-${level}${isDark ? 'x' : ''}`;
  const filename = `${levelId}.smbl`;

  // Try fetching from public/assets/levels/
  try {
    if (typeof fetch === 'function') {
      const response = await fetch(`/assets/levels/${filename}`);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        return parseSMBL(buffer, CHAPTER_1_FALLBACK_LEVELS[levelId]?.name || `Level ${levelId}`);
      }
    }
  } catch {
    // In Node.js or offline browser environment, continue to fallback
  }

  // Synchronous pre-baked fallback if offline or not found via HTTP

  // Return pre-baked fallback level
  return getLevel(levelId);
}"""

new_load_level = """export async function loadLevel(
  chapter: number | string,
  level: number | string,
  isDark: boolean = false
): Promise<LevelData> {
  const chNum = typeof chapter === 'number' ? chapter : parseInt(chapter, 10) || 1;
  const lvlNum = typeof level === 'number' ? level : parseInt(level, 10) || 1;
  const isBoss = lvlNum === 21 || level === 'boss' || level === 'boss1';
  const levelId = isBoss && chNum === 1 ? '1-21' : `${chapter}-${level}${isDark ? 'x' : ''}`;
  const filename = isBoss ? `boss${chNum}.smbl` : `${levelId}.smbl`;

  // Try fetching from public/assets/levels/
  try {
    if (typeof fetch === 'function') {
      const response = await fetch(`/assets/levels/${filename}`);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        return parseSMBL(buffer, CHAPTER_1_FALLBACK_LEVELS[levelId]?.name || `Level ${levelId}`);
      }
    }
  } catch {
    // In Node.js or offline browser environment, continue to fallback
  }

  // Return pre-baked fallback level
  return getLevel(levelId);
}"""
content = content.replace(old_load_level, new_load_level)

with open('src/engine/levelParser.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated levelParser.ts successfully!')
