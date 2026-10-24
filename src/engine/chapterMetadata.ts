export interface ChapterLevelMeta {
  file: string;
  name: string;
  par: number;
}

export interface ChapterMeta {
  name: string;
  levels: ChapterLevelMeta[];
  boss: ChapterLevelMeta;
}

export const CHAPTER_METADATA: Record<number, ChapterMeta> = {
  1: {
    name: 'Forest',
    levels: [
      { file: '1-1', name: 'Hello World', par: 3 },
      { file: '1-2', name: 'Upward', par: 5 },
      { file: '1-3', name: 'The Gap', par: 9 },
      { file: '1-4', name: 'Nutshell', par: 9 },
      { file: '1-5', name: 'Holy Mountain', par: 11 },
      { file: '1-6', name: 'Bladecatcher', par: 7 },
      { file: '1-7', name: 'Diverge', par: 5 },
      { file: '1-8', name: 'The Bit', par: 4.5 },
      { file: '1-9', name: 'Safety Third', par: 8 },
      { file: '1-10', name: 'The Levee', par: 7.5 },
      { file: '1-11', name: 'Fired', par: 8 },
      { file: '1-12', name: 'Revolve', par: 7 },
      { file: '1-13', name: "Tommy's Cabin", par: 7 },
      { file: '1-14', name: 'Blood Mountain', par: 8 },
      { file: '1-15', name: 'Cactus Jumper', par: 10 },
      { file: '1-16', name: 'Sidewinder', par: 9 },
      { file: '1-17', name: 'MorningStar', par: 9 },
      { file: '1-18', name: 'Altamont', par: 4 },
      { file: '1-19', name: 'Intermission', par: 20 },
      { file: '1-20', name: 'The Test', par: 22 },
    ],
    boss: { file: 'boss1', name: 'Lil Slugger', par: 40 },
  },
  2: {
    name: 'Hospital',
    levels: [
      { file: '2-1', name: 'Biohazard', par: 11 },
      { file: '2-2', name: 'One Down', par: 10.5 },
      { file: '2-3', name: 'Memories', par: 14 },
      { file: '2-4', name: 'Blew', par: 9.5 },
      { file: '2-5', name: 'Big Empty', par: 16 },
      { file: '2-6', name: 'The Grain', par: 15 },
      { file: '2-7', name: 'Hush', par: 19 },
      { file: '2-8', name: 'The Sabbath', par: 25 },
      { file: '2-9', name: 'Blood Swamp', par: 11 },
      { file: '2-10', name: "johnny's cage", par: 12 },
      { file: '2-11', name: 'Ghost Key', par: 9 },
      { file: '2-12', name: 'Above', par: 11 },
      { file: '2-13', name: 'Ulcer pop', par: 10 },
      { file: '2-14', name: 'Aunt Flo', par: 16 },
      { file: '2-15', name: 'Gallbladder', par: 19 },
      { file: '2-16', name: 'Synj', par: 15 },
      { file: '2-17', name: 'Worm food', par: 14 },
      { file: '2-18', name: 'destructoid', par: 16.5 },
      { file: '2-19', name: 'six feet', par: 14 },
      { file: '2-20', name: 'Day Breaker', par: 24 },
    ],
    boss: { file: 'boss2', name: 'C.H.A.D.', par: 40 },
  },
  3: {
    name: 'Factory',
    levels: [
      { file: '3-1', name: 'Pit Stop', par: 9.5 },
      { file: '3-2', name: 'The Salt Lick', par: 8.3 },
      { file: '3-3', name: 'Push', par: 16 },
      { file: '3-4', name: 'Transmissions', par: 12 },
      { file: '3-5', name: 'Uptown', par: 12.2 },
      { file: '3-6', name: 'The Shaft', par: 4.5 },
      { file: '3-7', name: 'Mind the Gap', par: 12.4 },
      { file: '3-8', name: 'Boomtown', par: 8.3 },
      { file: '3-9', name: 'Shotzie!', par: 12.5 },
      { file: '3-10', name: 'Breakdown', par: 10.5 },
      { file: '3-11', name: 'Box Tripper', par: 9 },
      { file: '3-12', name: 'The Dumper', par: 11.6 },
      { file: '3-13', name: 'The Bend', par: 15.8 },
      { file: '3-14', name: 'Gurdy', par: 14.8 },
      { file: '3-15', name: 'Vertigo', par: 14.8 },
      { file: '3-16', name: 'Mono', par: 14.8 },
      { file: '3-17', name: 'Rustic', par: 10.5 },
      { file: '3-18', name: 'The Grundle', par: 17 },
      { file: '3-19', name: 'Dig', par: 17 },
      { file: '3-20', name: 'White Noise', par: 20 },
    ],
    boss: { file: 'boss3', name: 'Brownie', par: 40 },
  },
  4: {
    name: 'Hell',
    levels: [
      { file: '4-1', name: 'Boilermaker', par: 11 },
      { file: '4-2', name: 'Brindle', par: 23 },
      { file: '4-3', name: 'Heck Hole', par: 11.5 },
      { file: '4-4', name: 'Hex', par: 11.5 },
      { file: '4-5', name: 'Pyro', par: 12 },
      { file: '4-6', name: 'Leviathan', par: 8 },
      { file: '4-7', name: 'Rickets', par: 17 },
      { file: '4-8', name: 'Weibe', par: 16 },
      { file: '4-9', name: 'Deceiver', par: 6 },
      { file: '4-10', name: 'Ball n Chain', par: 15 },
      { file: '4-11', name: 'Oracle', par: 12.5 },
      { file: '4-12', name: 'Big Brother', par: 10.8 },
      { file: '4-13', name: 'Lazy', par: 11.5 },
      { file: '4-14', name: 'Adversary', par: 17.5 },
      { file: '4-15', name: 'Abaddon', par: 9 },
      { file: '4-16', name: 'Bow', par: 12 },
      { file: '4-17', name: 'Lost Highway', par: 12 },
      { file: '4-18', name: 'Boris', par: 24.5 },
      { file: '4-19', name: 'The Hive', par: 14 },
      { file: '4-20', name: 'Babylon', par: 22 },
    ],
    boss: { file: 'boss4', name: 'Little Horn', par: 40 },
  },
  5: {
    name: 'The Rapture',
    levels: [
      { file: '5-1', name: 'the witness', par: 22 },
      { file: '5-2', name: 'evangel', par: 13 },
      { file: '5-3', name: 'Ripe Decay', par: 18 },
      { file: '5-4', name: 'Rise', par: 13.5 },
      { file: '5-5', name: 'Panic Switch', par: 12.5 },
      { file: '5-6', name: 'Left Behind', par: 11 },
      { file: '5-7', name: 'The Fallen', par: 23 },
      { file: '5-8', name: 'Descent', par: 20 },
      { file: '5-9', name: 'Abomination', par: 19.5 },
      { file: '5-10', name: 'Grinding Mill', par: 15.5 },
      { file: '5-11', name: 'Heretic', par: 18.5 },
      { file: '5-12', name: '10 Horns', par: 16 },
      { file: '5-13', name: 'The Lamb', par: 20 },
      { file: '5-14', name: 'King Carrion', par: 30.5 },
      { file: '5-15', name: 'The Flood', par: 13.5 },
      { file: '5-16', name: 'Rotgut', par: 30 },
      { file: '5-17', name: 'The Kingdom', par: 23 },
      { file: '5-18', name: 'Gate of Ludd', par: 17 },
      { file: '5-19', name: 'Wrath', par: 29 },
      { file: '5-20', name: 'Judgment', par: 32 },
    ],
    boss: { file: 'boss5', name: 'Larries Lament', par: 40 },
  },
};

export function getLevelMeta(
  chapterId: number,
  levelNumber: number,
  isDarkWorld = false
): ChapterLevelMeta {
  const chapter = CHAPTER_METADATA[chapterId] ?? CHAPTER_METADATA[1];
  const entry = levelNumber >= 21 ? chapter.boss : chapter.levels[levelNumber - 1];
  if (!entry) return { file: '', name: `Level ${chapterId}-${levelNumber}`, par: 10 };
  return {
    ...entry,
    file: isDarkWorld ? `${entry.file}x` : entry.file,
  };
}
