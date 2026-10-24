/**
 * Super Meat Boy Web Engine - Authentic Audio Registry & Mapping
 *
 * Mapped from authentic Super Meat Boy sound assets (547 WAV files in /assets/audio/)
 * and level/chapter definitions in /assets/data/chapters.json.
 *
 * Provides typed sound effect IDs, music track references per chapter, calibrated volume
 * balances, pitch variance ranges, cooldown debounces, and looping rules.
 */

export type SoundCategory =
  | 'jump'
  | 'movement'
  | 'hazard'
  | 'death'
  | 'collectible'
  | 'completion'
  | 'music'
  | 'ui';

export interface SoundDefinition {
  /** Unique typed identifier */
  readonly id: AudioSoundId;
  /** High-level audio category */
  readonly category: SoundCategory;
  /** Human-readable description of in-game trigger event */
  readonly description: string;
  /** Pool of authentic SMB WAV filenames (randomized when triggered) */
  readonly files: readonly string[];
  /** Calibrated base volume multiplier (0.0 to 1.0) for optimal master headroom */
  readonly defaultVolume: number;
  /** Whether the audio should loop continuously */
  readonly loop: boolean;
  /** Optional pitch playback rate variance [min, max] (e.g. [0.95, 1.05]) */
  readonly pitchVariance?: readonly [number, number];
  /** Minimum interval in milliseconds between triggers to prevent stacking / phasing */
  readonly cooldownMs?: number;
  /** Whether this sound participates in spatial 2D panning and distance attenuation */
  readonly spatial?: boolean;
}

// ============================================================================
// Typed Sound & Music IDs
// ============================================================================

export const AUDIO_IDS = {
  // 1. Jump & Landing SFX
  SFX_JUMP_STANDARD: 'sfx_jump_standard',
  SFX_JUMP_SPRINT: 'sfx_jump_sprint',
  SFX_JUMP_WALL: 'sfx_jump_wall',
  SFX_JUMP_RETRO: 'sfx_jump_retro',
  SFX_LAND_SOFT: 'sfx_land_soft',
  SFX_LAND_HARD: 'sfx_land_hard',
  SFX_LAND_SPLAT: 'sfx_land_splat',

  // 2. Movement & Wall SFX
  SFX_STEP_WALK: 'sfx_step_walk',
  SFX_STEP_SPRINT: 'sfx_step_sprint',
  SFX_STEP_CEMENT: 'sfx_step_cement',
  SFX_STEP_SCAMPER: 'sfx_step_scamper',
  SFX_SKID: 'sfx_skid',
  SFX_WALL_SLIDE_LOOP: 'sfx_wall_slide_loop',

  // 3. Hazard & Death SFX
  SFX_SAW_BUZZ_LOOP: 'sfx_saw_buzz_loop',
  SFX_SAW_BUZZ_PROXIMITY: 'sfx_saw_buzz_proximity',
  SFX_SAW_CUT: 'sfx_saw_cut',
  SFX_SAW_BREAK: 'sfx_saw_break',
  SFX_SPIKE_PUNCTURE: 'sfx_spike_puncture',
  SFX_MEAT_EXPLOSION_SPLAT: 'sfx_meat_explosion_splat',
  SFX_DEATH_RETRO: 'sfx_death_retro',
  SFX_CHUNK_BOUNCE: 'sfx_chunk_bounce',

  // 4. Collectibles & Completion
  SFX_BANDAGE_PICKUP: 'sfx_bandage_pickup',
  SFX_BANDAGE_GIRL_CHEER: 'sfx_bandage_girl_cheer',
  SFX_LEVEL_COMPLETE_FANFARE: 'sfx_level_complete_fanfare',
  SFX_GRADE_A_PLUS_CHIME: 'sfx_grade_a_plus_chime',

  // 5. Music Tracks - Chapters (Light & Dark World, Menus, Retro Warps)
  MUSIC_CH1_FOREST_LIGHT: 'music_ch1_forest_light',
  MUSIC_CH1_FOREST_DARK: 'music_ch1_forest_dark',
  MUSIC_CH1_FOREST_WARP: 'music_ch1_forest_warp',
  MUSIC_CH1_FOREST_MENU: 'music_ch1_forest_menu',
  MUSIC_CH1_FOREST_MENU_DARK: 'music_ch1_forest_menu_dark',
  MUSIC_CH1_BOSS: 'music_ch1_boss',

  MUSIC_CH2_HOSPITAL_LIGHT: 'music_ch2_hospital_light',
  MUSIC_CH2_HOSPITAL_DARK: 'music_ch2_hospital_dark',
  MUSIC_CH2_HOSPITAL_WARP: 'music_ch2_hospital_warp',
  MUSIC_CH2_HOSPITAL_MENU: 'music_ch2_hospital_menu',
  MUSIC_CH2_HOSPITAL_MENU_DARK: 'music_ch2_hospital_menu_dark',
  MUSIC_CH2_BOSS: 'music_ch2_boss',

  MUSIC_CH3_FACTORY_LIGHT: 'music_ch3_factory_light',
  MUSIC_CH3_FACTORY_DARK: 'music_ch3_factory_dark',
  MUSIC_CH3_FACTORY_WARP: 'music_ch3_factory_warp',
  MUSIC_CH3_FACTORY_MENU: 'music_ch3_factory_menu',
  MUSIC_CH3_FACTORY_MENU_DARK: 'music_ch3_factory_menu_dark',
  MUSIC_CH3_BOSS: 'music_ch3_boss',

  MUSIC_CH4_HELL_LIGHT: 'music_ch4_hell_light',
  MUSIC_CH4_HELL_DARK: 'music_ch4_hell_dark',
  MUSIC_CH4_HELL_WARP: 'music_ch4_hell_warp',
  MUSIC_CH4_HELL_MENU: 'music_ch4_hell_menu',
  MUSIC_CH4_HELL_MENU_DARK: 'music_ch4_hell_menu_dark',
  MUSIC_CH4_BOSS: 'music_ch4_boss',

  MUSIC_CH5_RAPTURE_LIGHT: 'music_ch5_rapture_light',
  MUSIC_CH5_RAPTURE_DARK: 'music_ch5_rapture_dark',
  MUSIC_CH5_RAPTURE_WARP: 'music_ch5_rapture_warp',
  MUSIC_CH5_RAPTURE_MENU: 'music_ch5_rapture_menu',
  MUSIC_CH5_RAPTURE_MENU_DARK: 'music_ch5_rapture_menu_dark',
  MUSIC_CH5_BOSS: 'music_ch5_boss',

  MUSIC_CH6_THE_END_LIGHT: 'music_ch6_the_end_light',
  MUSIC_CH6_THE_END_DARK: 'music_ch6_the_end_dark',
  MUSIC_CH6_THE_END_WARP: 'music_ch6_the_end_warp',
  MUSIC_CH6_THE_END_MENU: 'music_ch6_the_end_menu',
  MUSIC_CH6_THE_END_MENU_DARK: 'music_ch6_the_end_menu_dark',
  MUSIC_CH6_BOSS: 'music_ch6_boss',

  MUSIC_CH7_COTTON_ALLEY_LIGHT: 'music_ch7_cotton_alley_light',
  MUSIC_CH7_COTTON_ALLEY_DARK: 'music_ch7_cotton_alley_dark',
  MUSIC_CH7_COTTON_ALLEY_MENU: 'music_ch7_cotton_alley_menu',
  MUSIC_CH7_COTTON_ALLEY_MENU_DARK: 'music_ch7_cotton_alley_menu_dark',

  MUSIC_SUPER_MEAT_WORLD: 'music_super_meat_world',
  MUSIC_SUPER_MEAT_WORLD_MENU: 'music_super_meat_world_menu',

  // Warp Zone Guest Tracks
  MUSIC_WARP_COMMANDER_VIDEO: 'music_warp_commander_video',
  MUSIC_WARP_FLYWRENCH: 'music_warp_flywrench',
  MUSIC_WARP_4BIT: 'music_warp_4bit',
  MUSIC_WARP_HAUNTED: 'music_warp_haunted',

  // Global Frontend & Meta Tracks
  MUSIC_TITLE_LOOP: 'music_title_loop',
  MUSIC_WORLD_MAP: 'music_world_map',
  MUSIC_CREDITS: 'music_credits',
  MUSIC_SCORE_REPLAY: 'music_score_replay',

  // UI Sound Effects
  SFX_UI_NAVIGATE: 'sfx_ui_navigate',
  SFX_UI_CLICK: 'sfx_ui_click',
  SFX_UI_PAGE_TURN: 'sfx_ui_page_turn',
  SFX_UI_CURTAIN: 'sfx_ui_curtain',
  SFX_UI_CHAR_SELECT: 'sfx_ui_char_select',
  SFX_UI_RETRO_BOOP: 'sfx_ui_retro_boop'
} as const;

export type AudioSoundId = (typeof AUDIO_IDS)[keyof typeof AUDIO_IDS];

// ============================================================================
// Audio Registry Database
// ============================================================================

export const AUDIO_REGISTRY: Record<AudioSoundId, SoundDefinition> = {
  // --------------------------------------------------------------------------
  // 1. Jump & Landing SFX
  // --------------------------------------------------------------------------
  [AUDIO_IDS.SFX_JUMP_STANDARD]: {
    id: AUDIO_IDS.SFX_JUMP_STANDARD,
    category: 'jump',
    description: 'Standard jump kickoff sound with authentic meaty squelch and launch transient',
    files: [
      'Meat_jumps0.wav',
      'Meat_jumps1.wav',
      'Meat_jumps2.wav',
      'Meat_jumps3.wav',
      'Meat_jumps4.wav',
      'SMB_jumps4.wav'
    ],
    defaultVolume: 0.72,
    loop: false,
    pitchVariance: [0.95, 1.05],
    cooldownMs: 80
  },

  [AUDIO_IDS.SFX_JUMP_SPRINT]: {
    id: AUDIO_IDS.SFX_JUMP_SPRINT,
    category: 'jump',
    description: 'High-velocity sprint jump air whoosh layered over jump transient',
    files: [
      'Whoosh_high0.L.wav',
      'Whoosh_high1.L.wav',
      'Whoosh_high2.L.wav',
      'woosh2.wav',
      'woosh3.wav',
      'meatboy_wave_whoosh0.wav',
      'meatboy_wave_whoosh1.wav'
    ],
    defaultVolume: 0.58,
    loop: false,
    pitchVariance: [0.93, 1.07],
    cooldownMs: 90
  },

  [AUDIO_IDS.SFX_JUMP_WALL]: {
    id: AUDIO_IDS.SFX_JUMP_WALL,
    category: 'jump',
    description: 'Wall jump kickoff peel-off and rebound impact',
    files: [
      'Meat_impacts_3.wav',
      'Meat_jumps1.wav',
      'Meat_impacts_0.wav',
      'goostick0.wav',
      'goostick1.wav',
      'retro_whoosh0.wav',
      'retro_whoosh1.wav'
    ],
    defaultVolume: 0.7,
    loop: false,
    pitchVariance: [0.96, 1.04],
    cooldownMs: 80
  },

  [AUDIO_IDS.SFX_JUMP_RETRO]: {
    id: AUDIO_IDS.SFX_JUMP_RETRO,
    category: 'jump',
    description: 'Retro 8-bit / 16-bit warp zone jump sound',
    files: [
      'Retro_jump0.wav',
      'Retro_jump1.wav',
      'Retro_jump2.wav',
      'Retro_jump3.wav',
      'Retro_jump4.wav',
      'Retro_jump5.wav'
    ],
    defaultVolume: 0.65,
    loop: false,
    pitchVariance: [0.98, 1.02],
    cooldownMs: 80
  },

  [AUDIO_IDS.SFX_LAND_SOFT]: {
    id: AUDIO_IDS.SFX_LAND_SOFT,
    category: 'jump',
    description: 'Light landing from low vertical drop with subtle flesh dampening',
    files: [
      'Land_soft.wav',
      'Meat_Landing1.wav'
    ],
    defaultVolume: 0.55,
    loop: false,
    pitchVariance: [0.95, 1.05],
    cooldownMs: 60
  },

  [AUDIO_IDS.SFX_LAND_HARD]: {
    id: AUDIO_IDS.SFX_LAND_HARD,
    category: 'jump',
    description: 'Heavy high-altitude landing with visceral ground slap',
    files: [
      'Meat_Landing0.wav',
      'Meat_impacts_1.wav',
      'Meat_impacts_2.wav',
      'Meat_impacts_6.wav'
    ],
    defaultVolume: 0.78,
    loop: false,
    pitchVariance: [0.94, 1.06],
    cooldownMs: 70
  },

  [AUDIO_IDS.SFX_LAND_SPLAT]: {
    id: AUDIO_IDS.SFX_LAND_SPLAT,
    category: 'jump',
    description: 'High-speed downward impact creating wet blood splat decal',
    files: [
      'splat 2.wav',
      'animal_squish0.wav',
      'animal_squish1.wav',
      'animal_squish2.wav',
      'splatter00.wav',
      'splatter01.wav',
      'splatter02.wav'
    ],
    defaultVolume: 0.74,
    loop: false,
    pitchVariance: [0.92, 1.08],
    cooldownMs: 70
  },

  // --------------------------------------------------------------------------
  // 2. Movement & Wall SFX
  // --------------------------------------------------------------------------
  [AUDIO_IDS.SFX_STEP_WALK]: {
    id: AUDIO_IDS.SFX_STEP_WALK,
    category: 'movement',
    description: 'Rhythmic meat footstep sounds during standard running/walking',
    files: [
      'Meat_Feet_slow0.wav',
      'Meat_Feet_slow1.wav',
      'Meat_Feet_slow2.wav',
      'Meat_Feet_slow3.wav'
    ],
    defaultVolume: 0.42,
    loop: false,
    pitchVariance: [0.93, 1.07],
    cooldownMs: 110
  },

  [AUDIO_IDS.SFX_STEP_SPRINT]: {
    id: AUDIO_IDS.SFX_STEP_SPRINT,
    category: 'movement',
    description: 'Rapid, energetic squishy footsteps during maximum sprint',
    files: [
      'Meat_feet_fast0.wav',
      'Meat_feet_fast1.wav',
      'Meat_feet_fast2.wav',
      'Meat_feet_fast3.wav'
    ],
    defaultVolume: 0.48,
    loop: false,
    pitchVariance: [0.94, 1.06],
    cooldownMs: 85
  },

  [AUDIO_IDS.SFX_STEP_CEMENT]: {
    id: AUDIO_IDS.SFX_STEP_CEMENT,
    category: 'movement',
    description: 'Drier solid footstep impact on hospital / factory cement terrain',
    files: [
      'cement_feet0.wav',
      'cement_feet1.wav',
      'cement_feet2.wav'
    ],
    defaultVolume: 0.44,
    loop: false,
    pitchVariance: [0.95, 1.05],
    cooldownMs: 95
  },

  [AUDIO_IDS.SFX_STEP_SCAMPER]: {
    id: AUDIO_IDS.SFX_STEP_SCAMPER,
    category: 'movement',
    description: 'Rapid scampering footsteps for small critters and foliage/grass terrain',
    files: [
      'scamper0.wav',
      'scamper1.wav',
      'grass_scamper0.wav',
      'grass_scamper1.wav'
    ],
    defaultVolume: 0.4,
    loop: false,
    pitchVariance: [0.96, 1.04],
    cooldownMs: 90
  },

  [AUDIO_IDS.SFX_SKID]: {
    id: AUDIO_IDS.SFX_SKID,
    category: 'movement',
    description: 'Rapid velocity reversal and friction screech on turning around',
    files: [
      'Whoosh_low0.L.wav',
      'Whoosh_low1.L.wav',
      'Whoosh_low2.wav',
      'Whoosh_low3.L.wav',
      'WhooshSplat_fast.wav',
      'Swirl 01.wav',
      'Swirl 02.wav'
    ],
    defaultVolume: 0.58,
    loop: false,
    pitchVariance: [0.92, 1.08],
    cooldownMs: 140
  },

  [AUDIO_IDS.SFX_WALL_SLIDE_LOOP]: {
    id: AUDIO_IDS.SFX_WALL_SLIDE_LOOP,
    category: 'movement',
    description: 'Continuous visceral flesh friction and gooey slide against vertical walls',
    files: [
      'goostick0.wav',
      'goostick1.wav',
      'goostick2.wav',
      'gooattach00.wav',
      'gooattach01.wav',
      'gooattach02.wav',
      'SMB_licks_1.wav',
      'SMB_licks_2.wav',
      'SMB_licks_3.wav'
    ],
    defaultVolume: 0.35,
    loop: true,
    pitchVariance: [0.97, 1.03],
    cooldownMs: 60
  },

  // --------------------------------------------------------------------------
  // 3. Hazard & Death SFX
  // --------------------------------------------------------------------------
  [AUDIO_IDS.SFX_SAW_BUZZ_LOOP]: {
    id: AUDIO_IDS.SFX_SAW_BUZZ_LOOP,
    category: 'hazard',
    description: 'Continuous mechanical rotating circular saw buzz loop',
    files: [
      'Retro_saw01.wav'
    ],
    defaultVolume: 0.45,
    loop: true,
    spatial: true
  },

  [AUDIO_IDS.SFX_SAW_BUZZ_PROXIMITY]: {
    id: AUDIO_IDS.SFX_SAW_BUZZ_PROXIMITY,
    category: 'hazard',
    description: 'Doppler / flyby buzz when player swings near a circular saw blade',
    files: [
      'Retro_buzzby0.wav',
      'Retro_buzzby1.wav',
      'Retro_buzzby2.wav',
      'Retro_buzzby3.wav',
      'Retro_buzzby4.wav'
    ],
    defaultVolume: 0.55,
    loop: false,
    pitchVariance: [0.94, 1.06],
    cooldownMs: 120,
    spatial: true
  },

  [AUDIO_IDS.SFX_SAW_CUT]: {
    id: AUDIO_IDS.SFX_SAW_CUT,
    category: 'hazard',
    description: 'Visceral meat shredded by circular saw teeth on fatal contact',
    files: [
      'SawDeath0.wav',
      'boss1_squirrel_sawhits0.wav',
      'boss1_squirrel_sawhits1.wav',
      'boss1_squirrel_sawhits2.wav',
      'boss1_squirrel_sawhits3.wav'
    ],
    defaultVolume: 0.85,
    loop: false,
    pitchVariance: [0.95, 1.05],
    cooldownMs: 150
  },

  [AUDIO_IDS.SFX_SAW_BREAK]: {
    id: AUDIO_IDS.SFX_SAW_BREAK,
    category: 'hazard',
    description: 'Saw blade destruction or ricochet snap',
    files: [
      'saw_break0.wav',
      'saw_break1.wav',
      'saw_break2.wav'
    ],
    defaultVolume: 0.65,
    loop: false,
    pitchVariance: [0.95, 1.05]
  },

  [AUDIO_IDS.SFX_SPIKE_PUNCTURE]: {
    id: AUDIO_IDS.SFX_SPIKE_PUNCTURE,
    category: 'hazard',
    description: 'Sharp impalement and bone crack upon colliding with stationary spikes',
    files: [
      'neck_snap.wav',
      'minehurt.wav',
      'slaphard.wav',
      'slapsoft.wav'
    ],
    defaultVolume: 0.8,
    loop: false,
    pitchVariance: [0.96, 1.04],
    cooldownMs: 150
  },

  [AUDIO_IDS.SFX_MEAT_EXPLOSION_SPLAT]: {
    id: AUDIO_IDS.SFX_MEAT_EXPLOSION_SPLAT,
    category: 'death',
    description: 'Catastrophic Meat Boy explosion into bloody chunks and decals',
    files: [
      'meat_death0.wav',
      'meat_death1.wav',
      'meat_death2.wav',
      'meat_death3.wav',
      'meat_death4.wav',
      'meat_death5.wav',
      'meat_death6.wav',
      'meat_death7.wav',
      'splat 2.wav',
      'splatter00.wav',
      'splatter01.wav',
      'splatter02.wav',
      'splatter03.wav',
      'splatter04.wav',
      'splatter05.wav',
      'DEATH_RATTLE.wav',
      'WhooshSplat_fast.wav'
    ],
    defaultVolume: 0.88,
    loop: false,
    pitchVariance: [0.94, 1.06],
    cooldownMs: 150
  },

  [AUDIO_IDS.SFX_DEATH_RETRO]: {
    id: AUDIO_IDS.SFX_DEATH_RETRO,
    category: 'death',
    description: 'Retro warp zone chip death sound',
    files: [
      'Retro_death0.wav',
      'Retro_death1.wav',
      'Retro_death2.wav',
      'Retro_death3.wav',
      'Retro_death4.wav',
      'retro_pop01.wav',
      'retro_pop02.wav',
      'retro_pop03.wav'
    ],
    defaultVolume: 0.78,
    loop: false,
    pitchVariance: [0.98, 1.02]
  },

  [AUDIO_IDS.SFX_CHUNK_BOUNCE]: {
    id: AUDIO_IDS.SFX_CHUNK_BOUNCE,
    category: 'death',
    description: 'Secondary meat gib / chunk bouncing off walls and floors',
    files: [
      'Meat_impacts_0.wav',
      'Meat_impacts_1.wav',
      'Meat_impacts_2.wav',
      'Meat_impacts_3.wav',
      'Meat_impacts_4.wav',
      'Meat_impacts_5.wav',
      'Meat_impacts_6.wav',
      'Meat_impacts_7.wav',
      'Meat_impacts_8.wav',
      'animal_squish0.wav',
      'animal_squish1.wav',
      'animal_squish2.wav',
      'splatter03.wav',
      'splatter04.wav',
      'splatter05.wav'
    ],
    defaultVolume: 0.46,
    loop: false,
    pitchVariance: [0.9, 1.1],
    cooldownMs: 35
  },

  // --------------------------------------------------------------------------
  // 4. Collectibles & Completion
  // --------------------------------------------------------------------------
  [AUDIO_IDS.SFX_BANDAGE_PICKUP]: {
    id: AUDIO_IDS.SFX_BANDAGE_PICKUP,
    category: 'collectible',
    description: 'Crisp, rewarding bandage pickup sound with high-frequency chime',
    files: [
      'band aid pick up.wav',
      'tarballpickup.wav',
      'Unlock00.wav',
      'Unlock01.wav',
      'Retro_Keypickup.wav'
    ],
    defaultVolume: 0.75,
    loop: false,
    pitchVariance: [0.98, 1.02],
    cooldownMs: 100
  },

  [AUDIO_IDS.SFX_BANDAGE_GIRL_CHEER]: {
    id: AUDIO_IDS.SFX_BANDAGE_GIRL_CHEER,
    category: 'completion',
    description: 'Bandage Girl cheering or shouting when Meat Boy reaches the goal',
    files: [
      'Bandaid_Girl_Angryscream.wav',
      'bgirl.wav',
      'bgirldark.wav',
      'kiss_lips0.wav',
      'kiss_lips1.wav',
      'kiss_lips2.wav'
    ],
    defaultVolume: 0.76,
    loop: false,
    pitchVariance: [0.96, 1.04],
    cooldownMs: 200
  },

  [AUDIO_IDS.SFX_LEVEL_COMPLETE_FANFARE]: {
    id: AUDIO_IDS.SFX_LEVEL_COMPLETE_FANFARE,
    category: 'completion',
    description: 'Heavy bass boom and level complete fanfare sting',
    files: [
      'Level_Complete_Boom0.wav',
      'Level_Complete_Boom1.wav',
      'chapterend.wav',
      'theend.wav'
    ],
    defaultVolume: 0.85,
    loop: false
  },

  [AUDIO_IDS.SFX_GRADE_A_PLUS_CHIME]: {
    id: AUDIO_IDS.SFX_GRADE_A_PLUS_CHIME,
    category: 'completion',
    description: 'Sparkling celestial unlock chime awarded when achieving A+ grade',
    files: [
      'Choir_unlock.wav',
      'dittie.wav',
      'Unlock00.wav',
      'Unlock01.wav',
      'retroriff1.wav',
      'retro powerup.wav'
    ],
    defaultVolume: 0.82,
    loop: false
  },

  // --------------------------------------------------------------------------
  // 5. Music Tracks per Chapter (Authentic mapping from chapters.json)
  // --------------------------------------------------------------------------
  // Chapter 1: The Forest
  [AUDIO_IDS.MUSIC_CH1_FOREST_LIGHT]: {
    id: AUDIO_IDS.MUSIC_CH1_FOREST_LIGHT,
    category: 'music',
    description: 'Chapter 1 Forest Light World theme (smbforest5.wav / "Forest Funk")',
    files: ['smbforest5.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH1_FOREST_DARK]: {
    id: AUDIO_IDS.MUSIC_CH1_FOREST_DARK,
    category: 'music',
    description: 'Chapter 1 Forest Dark World remix (smbforestalt.wav)',
    files: ['smbforestalt.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH1_FOREST_WARP]: {
    id: AUDIO_IDS.MUSIC_CH1_FOREST_WARP,
    category: 'music',
    description: 'Chapter 1 Retro Warp Zone theme (forestretro3.wav)',
    files: ['forestretro3.wav'],
    defaultVolume: 0.52,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH1_FOREST_MENU]: {
    id: AUDIO_IDS.MUSIC_CH1_FOREST_MENU,
    category: 'music',
    description: 'Chapter 1 Forest Light World map menu theme (forestmenuloop.wav)',
    files: ['forestmenuloop.wav'],
    defaultVolume: 0.5,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH1_FOREST_MENU_DARK]: {
    id: AUDIO_IDS.MUSIC_CH1_FOREST_MENU_DARK,
    category: 'music',
    description: 'Chapter 1 Forest Dark World map menu theme (evilforestmenuloop.wav)',
    files: ['evilforestmenuloop.wav'],
    defaultVolume: 0.5,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH1_BOSS]: {
    id: AUDIO_IDS.MUSIC_CH1_BOSS,
    category: 'music',
    description: 'Chapter 1 Boss: Lil Slugger theme (bawsslewp.wav)',
    files: ['bawsslewp.wav'],
    defaultVolume: 0.58,
    loop: true
  },

  // Chapter 2: The Hospital
  [AUDIO_IDS.MUSIC_CH2_HOSPITAL_LIGHT]: {
    id: AUDIO_IDS.MUSIC_CH2_HOSPITAL_LIGHT,
    category: 'music',
    description: 'Chapter 2 Hospital Light World theme (ch2track.wav / "Betus Blues")',
    files: ['ch2track.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH2_HOSPITAL_DARK]: {
    id: AUDIO_IDS.MUSIC_CH2_HOSPITAL_DARK,
    category: 'music',
    description: 'Chapter 2 Hospital Dark World remix (ch2trackalt.wav)',
    files: ['ch2trackalt.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH2_HOSPITAL_WARP]: {
    id: AUDIO_IDS.MUSIC_CH2_HOSPITAL_WARP,
    category: 'music',
    description: 'Chapter 2 Retro Warp Zone theme (ch2retro.wav)',
    files: ['ch2retro.wav'],
    defaultVolume: 0.52,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH2_HOSPITAL_MENU]: {
    id: AUDIO_IDS.MUSIC_CH2_HOSPITAL_MENU,
    category: 'music',
    description: 'Chapter 2 Hospital Light World map menu theme (hmenuloop.wav)',
    files: ['hmenuloop.wav'],
    defaultVolume: 0.5,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH2_HOSPITAL_MENU_DARK]: {
    id: AUDIO_IDS.MUSIC_CH2_HOSPITAL_MENU_DARK,
    category: 'music',
    description: 'Chapter 2 Hospital Dark World map menu theme (hevilmenuloop.wav)',
    files: ['hevilmenuloop.wav'],
    defaultVolume: 0.5,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH2_BOSS]: {
    id: AUDIO_IDS.MUSIC_CH2_BOSS,
    category: 'music',
    description: 'Chapter 2 Boss: C.H.A.D. theme (boss2.wav)',
    files: ['boss2.wav'],
    defaultVolume: 0.58,
    loop: true
  },

  // Chapter 3: The Salt Factory
  [AUDIO_IDS.MUSIC_CH3_FACTORY_LIGHT]: {
    id: AUDIO_IDS.MUSIC_CH3_FACTORY_LIGHT,
    category: 'music',
    description: 'Chapter 3 Salt Factory Light World theme (factory.wav / "Can O\' Salt")',
    files: ['factory.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH3_FACTORY_DARK]: {
    id: AUDIO_IDS.MUSIC_CH3_FACTORY_DARK,
    category: 'music',
    description: 'Chapter 3 Salt Factory Dark World remix (altfactory.wav)',
    files: ['altfactory.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH3_FACTORY_WARP]: {
    id: AUDIO_IDS.MUSIC_CH3_FACTORY_WARP,
    category: 'music',
    description: 'Chapter 3 Retro Warp Zone theme (retrofactory32khz_music.wav)',
    files: ['retrofactory32khz_music.wav', 'retrofactory32khz.wav'],
    defaultVolume: 0.52,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH3_FACTORY_MENU]: {
    id: AUDIO_IDS.MUSIC_CH3_FACTORY_MENU,
    category: 'music',
    description: 'Chapter 3 Salt Factory Light World map menu theme (factorymenu.wav)',
    files: ['factorymenu.wav'],
    defaultVolume: 0.5,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH3_FACTORY_MENU_DARK]: {
    id: AUDIO_IDS.MUSIC_CH3_FACTORY_MENU_DARK,
    category: 'music',
    description: 'Chapter 3 Salt Factory Dark World map menu theme (evilfactorymenu.wav)',
    files: ['evilfactorymenu.wav'],
    defaultVolume: 0.5,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH3_BOSS]: {
    id: AUDIO_IDS.MUSIC_CH3_BOSS,
    category: 'music',
    description: 'Chapter 3 Boss: Brownie race theme (boss3.wav)',
    files: ['boss3.wav'],
    defaultVolume: 0.58,
    loop: true
  },

  // Chapter 4: Hell
  [AUDIO_IDS.MUSIC_CH4_HELL_LIGHT]: {
    id: AUDIO_IDS.MUSIC_CH4_HELL_LIGHT,
    category: 'music',
    description: 'Chapter 4 Hell Light World theme (hell.wav / "Hot Damned")',
    files: ['hell.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH4_HELL_DARK]: {
    id: AUDIO_IDS.MUSIC_CH4_HELL_DARK,
    category: 'music',
    description: 'Chapter 4 Hell Dark World remix (hardhell.wav)',
    files: ['hardhell.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH4_HELL_WARP]: {
    id: AUDIO_IDS.MUSIC_CH4_HELL_WARP,
    category: 'music',
    description: 'Chapter 4 Retro Warp Zone theme (retrohell_music.wav)',
    files: ['retrohell_music.wav', 'retrohell.wav'],
    defaultVolume: 0.52,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH4_HELL_MENU]: {
    id: AUDIO_IDS.MUSIC_CH4_HELL_MENU,
    category: 'music',
    description: 'Chapter 4 Hell Light World map menu theme (menunormalhell.wav)',
    files: ['menunormalhell.wav'],
    defaultVolume: 0.5,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH4_HELL_MENU_DARK]: {
    id: AUDIO_IDS.MUSIC_CH4_HELL_MENU_DARK,
    category: 'music',
    description: 'Chapter 4 Hell Dark World map menu theme (menuhardhell.wav)',
    files: ['menuhardhell.wav'],
    defaultVolume: 0.5,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH4_BOSS]: {
    id: AUDIO_IDS.MUSIC_CH4_BOSS,
    category: 'music',
    description: 'Chapter 4 Boss: Little Horn theme (boss4.wav)',
    files: ['boss4.wav'],
    defaultVolume: 0.58,
    loop: true
  },

  // Chapter 5: The Rapture
  [AUDIO_IDS.MUSIC_CH5_RAPTURE_LIGHT]: {
    id: AUDIO_IDS.MUSIC_CH5_RAPTURE_LIGHT,
    category: 'music',
    description: 'Chapter 5 The Rapture Light World theme (ch5.wav / "Carbide")',
    files: ['ch5.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH5_RAPTURE_DARK]: {
    id: AUDIO_IDS.MUSIC_CH5_RAPTURE_DARK,
    category: 'music',
    description: 'Chapter 5 The Rapture Dark World remix (ch5hard.wav / ch5alt.wav)',
    files: ['ch5hard.wav', 'ch5alt.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH5_RAPTURE_WARP]: {
    id: AUDIO_IDS.MUSIC_CH5_RAPTURE_WARP,
    category: 'music',
    description: 'Chapter 5 Retro Warp Zone theme (ch5retro_music.wav)',
    files: ['ch5retro_music.wav', 'ch5retro.wav'],
    defaultVolume: 0.52,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH5_RAPTURE_MENU]: {
    id: AUDIO_IDS.MUSIC_CH5_RAPTURE_MENU,
    category: 'music',
    description: 'Chapter 5 The Rapture Light World map menu theme (ch5menu.wav)',
    files: ['ch5menu.wav'],
    defaultVolume: 0.5,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH5_RAPTURE_MENU_DARK]: {
    id: AUDIO_IDS.MUSIC_CH5_RAPTURE_MENU_DARK,
    category: 'music',
    description: 'Chapter 5 The Rapture Dark World map menu theme (ch5menuhard.wav)',
    files: ['ch5menuhard.wav'],
    defaultVolume: 0.5,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH5_BOSS]: {
    id: AUDIO_IDS.MUSIC_CH5_BOSS,
    category: 'music',
    description: 'Chapter 5 Boss: The Larries theme (boss5.wav)',
    files: ['boss5.wav'],
    defaultVolume: 0.58,
    loop: true
  },

  // Chapter 6: The End
  [AUDIO_IDS.MUSIC_CH6_THE_END_LIGHT]: {
    id: AUDIO_IDS.MUSIC_CH6_THE_END_LIGHT,
    category: 'music',
    description: 'Chapter 6 The End Light World theme (ch6.wav / "The Battle of Lil Slugger")',
    files: ['ch6.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH6_THE_END_DARK]: {
    id: AUDIO_IDS.MUSIC_CH6_THE_END_DARK,
    category: 'music',
    description: 'Chapter 6 The End Dark World remix (ch6dark.wav)',
    files: ['ch6dark.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH6_THE_END_WARP]: {
    id: AUDIO_IDS.MUSIC_CH6_THE_END_WARP,
    category: 'music',
    description: 'Chapter 6 Retro Warp Zone theme (theend_music.wav / retrohell_music.wav)',
    files: ['theend_music.wav', 'retrohell_music.wav'],
    defaultVolume: 0.52,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH6_THE_END_MENU]: {
    id: AUDIO_IDS.MUSIC_CH6_THE_END_MENU,
    category: 'music',
    description: 'Chapter 6 The End Light World map menu theme (ch6normalmenu.wav)',
    files: ['ch6normalmenu.wav'],
    defaultVolume: 0.5,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH6_THE_END_MENU_DARK]: {
    id: AUDIO_IDS.MUSIC_CH6_THE_END_MENU_DARK,
    category: 'music',
    description: 'Chapter 6 The End Dark World map menu theme (ch6hardmenu.wav)',
    files: ['ch6hardmenu.wav'],
    defaultVolume: 0.5,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH6_BOSS]: {
    id: AUDIO_IDS.MUSIC_CH6_BOSS,
    category: 'music',
    description: 'Chapter 6 Boss: Dr. Fetus Mech / Lil Fetus theme (boss6.wav)',
    files: ['boss6.wav'],
    defaultVolume: 0.6,
    loop: true
  },

  // Chapter 7: Cotton Alley (Bandage Girl)
  [AUDIO_IDS.MUSIC_CH7_COTTON_ALLEY_LIGHT]: {
    id: AUDIO_IDS.MUSIC_CH7_COTTON_ALLEY_LIGHT,
    category: 'music',
    description: 'Chapter 7 Cotton Alley Light World theme (bgirl.wav)',
    files: ['bgirl.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH7_COTTON_ALLEY_DARK]: {
    id: AUDIO_IDS.MUSIC_CH7_COTTON_ALLEY_DARK,
    category: 'music',
    description: 'Chapter 7 Cotton Alley Dark World remix (bgirldark.wav)',
    files: ['bgirldark.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH7_COTTON_ALLEY_MENU]: {
    id: AUDIO_IDS.MUSIC_CH7_COTTON_ALLEY_MENU,
    category: 'music',
    description: 'Chapter 7 Cotton Alley Light World menu theme (bmenu.wav)',
    files: ['bmenu.wav'],
    defaultVolume: 0.5,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CH7_COTTON_ALLEY_MENU_DARK]: {
    id: AUDIO_IDS.MUSIC_CH7_COTTON_ALLEY_MENU_DARK,
    category: 'music',
    description: 'Chapter 7 Cotton Alley Dark World menu theme (bmenuhard.wav)',
    files: ['bmenuhard.wav'],
    defaultVolume: 0.5,
    loop: true
  },

  // Super Meat World (The Internets)
  [AUDIO_IDS.MUSIC_SUPER_MEAT_WORLD]: {
    id: AUDIO_IDS.MUSIC_SUPER_MEAT_WORLD,
    category: 'music',
    description: 'Super Meat World / The Internets custom chapter theme (internets.wav)',
    files: ['internets.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_SUPER_MEAT_WORLD_MENU]: {
    id: AUDIO_IDS.MUSIC_SUPER_MEAT_WORLD_MENU,
    category: 'music',
    description: 'Super Meat World portal menu theme (internetsmenu.wav)',
    files: ['internetsmenu.wav'],
    defaultVolume: 0.5,
    loop: true
  },

  // Character Warp Zones
  [AUDIO_IDS.MUSIC_WARP_COMMANDER_VIDEO]: {
    id: AUDIO_IDS.MUSIC_WARP_COMMANDER_VIDEO,
    category: 'music',
    description: 'Commander Video Bit.Trip warp zone music (commandervideo_music.wav)',
    files: ['commandervideo_music.wav'],
    defaultVolume: 0.52,
    loop: true
  },
  [AUDIO_IDS.MUSIC_WARP_FLYWRENCH]: {
    id: AUDIO_IDS.MUSIC_WARP_FLYWRENCH,
    category: 'music',
    description: 'Flywrench retro warp zone music (flywrench_music.wav)',
    files: ['flywrench_music.wav'],
    defaultVolume: 0.52,
    loop: true
  },
  [AUDIO_IDS.MUSIC_WARP_4BIT]: {
    id: AUDIO_IDS.MUSIC_WARP_4BIT,
    category: 'music',
    description: 'Original 4-bit / 8-bit retro theme (4bittitle_music.wav, 4bittitle.wav)',
    files: ['4bittitle_music.wav', '4bittitle.wav'],
    defaultVolume: 0.52,
    loop: true
  },
  [AUDIO_IDS.MUSIC_WARP_HAUNTED]: {
    id: AUDIO_IDS.MUSIC_WARP_HAUNTED,
    category: 'music',
    description: 'Spooky / haunted retro warp zone music (hauntedopen_music.wav)',
    files: ['hauntedopen_music.wav'],
    defaultVolume: 0.52,
    loop: true
  },

  // Global & Meta Music
  [AUDIO_IDS.MUSIC_TITLE_LOOP]: {
    id: AUDIO_IDS.MUSIC_TITLE_LOOP,
    category: 'music',
    description: 'Main game title screen music (smbtitleloop.wav)',
    files: ['smbtitleloop.wav', 'intro_music.wav'],
    defaultVolume: 0.58,
    loop: true
  },
  [AUDIO_IDS.MUSIC_WORLD_MAP]: {
    id: AUDIO_IDS.MUSIC_WORLD_MAP,
    category: 'music',
    description: 'Overworld chapter selection map loop (smbworldloop.wav)',
    files: ['smbworldloop.wav'],
    defaultVolume: 0.52,
    loop: true
  },
  [AUDIO_IDS.MUSIC_CREDITS]: {
    id: AUDIO_IDS.MUSIC_CREDITS,
    category: 'music',
    description: 'End credits music (credits_music.wav)',
    files: ['credits_music.wav'],
    defaultVolume: 0.55,
    loop: true
  },
  [AUDIO_IDS.MUSIC_SCORE_REPLAY]: {
    id: AUDIO_IDS.MUSIC_SCORE_REPLAY,
    category: 'music',
    description: 'Replay theater & score review music (demoscore_music.wav)',
    files: ['demoscore_music.wav'],
    defaultVolume: 0.52,
    loop: true
  },

  // --------------------------------------------------------------------------
  // UI Sound Effects
  // --------------------------------------------------------------------------
  [AUDIO_IDS.SFX_UI_NAVIGATE]: {
    id: AUDIO_IDS.SFX_UI_NAVIGATE,
    category: 'ui',
    description: 'Subtle squishy hover blip when navigating menu options',
    files: [
      'mouse-over_meat0.wav',
      'mouse-over_meat1.wav',
      'mouse-over_meat2.wav'
    ],
    defaultVolume: 0.5,
    loop: false,
    pitchVariance: [0.96, 1.04],
    cooldownMs: 50
  },

  [AUDIO_IDS.SFX_UI_CLICK]: {
    id: AUDIO_IDS.SFX_UI_CLICK,
    category: 'ui',
    description: 'Snappy button click / confirm trigger',
    files: [
      'mouse-over_clicks0.wav',
      'mouse-over_clicks1.wav',
      'pushbuttons.wav',
      'Seatbelt_click.wav',
      'beep.wav'
    ],
    defaultVolume: 0.6,
    loop: false,
    cooldownMs: 50
  },

  [AUDIO_IDS.SFX_UI_PAGE_TURN]: {
    id: AUDIO_IDS.SFX_UI_PAGE_TURN,
    category: 'ui',
    description: 'Paper booklet page flip sound for level & chapter selection',
    files: [
      'Book Page Turn 08.wav',
      'Book Page Turn 09.wav',
      'Book Page Turn 12.wav',
      'Book Page Turn 13.wav'
    ],
    defaultVolume: 0.62,
    loop: false,
    cooldownMs: 80
  },

  [AUDIO_IDS.SFX_UI_CURTAIN]: {
    id: AUDIO_IDS.SFX_UI_CURTAIN,
    category: 'ui',
    description: 'Theater curtain sliding back on character select screen',
    files: ['CharacterSelect_Curtain.wav'],
    defaultVolume: 0.7,
    loop: false
  },

  [AUDIO_IDS.SFX_UI_CHAR_SELECT]: {
    id: AUDIO_IDS.SFX_UI_CHAR_SELECT,
    category: 'ui',
    description: 'Character roster cycling tick',
    files: [
      'character_select_left.wav',
      'character_select_right.wav'
    ],
    defaultVolume: 0.55,
    loop: false,
    cooldownMs: 60
  },

  [AUDIO_IDS.SFX_UI_RETRO_BOOP]: {
    id: AUDIO_IDS.SFX_UI_RETRO_BOOP,
    category: 'ui',
    description: 'Retro 8-bit cursor chirp for retro warp menus',
    files: [
      'retro boop.wav',
      'retro boop2.wav'
    ],
    defaultVolume: 0.55,
    loop: false,
    cooldownMs: 50
  }
};

// ============================================================================
// Chapter Metadata Table (Derived from public/assets/data/chapters.json)
// ============================================================================

export interface ChapterAudioConfig {
  readonly chapterNumber: number;
  readonly chapterKey: string;
  readonly name: string;
  readonly normalMusic: AudioSoundId;
  readonly altMusic: AudioSoundId;
  readonly warpMusic: AudioSoundId;
  readonly menuNormalMusic: AudioSoundId;
  readonly menuRetroMusic: AudioSoundId;
  readonly bossMusic: AudioSoundId;
}

export const CHAPTER_AUDIO_CONFIGS: Record<number, ChapterAudioConfig> = {
  1: {
    chapterNumber: 1,
    chapterKey: 'Forest',
    name: 'The Forest',
    normalMusic: AUDIO_IDS.MUSIC_CH1_FOREST_LIGHT,
    altMusic: AUDIO_IDS.MUSIC_CH1_FOREST_DARK,
    warpMusic: AUDIO_IDS.MUSIC_CH1_FOREST_WARP,
    menuNormalMusic: AUDIO_IDS.MUSIC_CH1_FOREST_MENU,
    menuRetroMusic: AUDIO_IDS.MUSIC_CH1_FOREST_MENU_DARK,
    bossMusic: AUDIO_IDS.MUSIC_CH1_BOSS
  },
  2: {
    chapterNumber: 2,
    chapterKey: 'Hospital',
    name: 'The Hospital',
    normalMusic: AUDIO_IDS.MUSIC_CH2_HOSPITAL_LIGHT,
    altMusic: AUDIO_IDS.MUSIC_CH2_HOSPITAL_DARK,
    warpMusic: AUDIO_IDS.MUSIC_CH2_HOSPITAL_WARP,
    menuNormalMusic: AUDIO_IDS.MUSIC_CH2_HOSPITAL_MENU,
    menuRetroMusic: AUDIO_IDS.MUSIC_CH2_HOSPITAL_MENU_DARK,
    bossMusic: AUDIO_IDS.MUSIC_CH2_BOSS
  },
  3: {
    chapterNumber: 3,
    chapterKey: 'SaltFactory',
    name: 'The Salt Factory',
    normalMusic: AUDIO_IDS.MUSIC_CH3_FACTORY_LIGHT,
    altMusic: AUDIO_IDS.MUSIC_CH3_FACTORY_DARK,
    warpMusic: AUDIO_IDS.MUSIC_CH3_FACTORY_WARP,
    menuNormalMusic: AUDIO_IDS.MUSIC_CH3_FACTORY_MENU,
    menuRetroMusic: AUDIO_IDS.MUSIC_CH3_FACTORY_MENU_DARK,
    bossMusic: AUDIO_IDS.MUSIC_CH3_BOSS
  },
  4: {
    chapterNumber: 4,
    chapterKey: 'Hell',
    name: 'Hell',
    normalMusic: AUDIO_IDS.MUSIC_CH4_HELL_LIGHT,
    altMusic: AUDIO_IDS.MUSIC_CH4_HELL_DARK,
    warpMusic: AUDIO_IDS.MUSIC_CH4_HELL_WARP,
    menuNormalMusic: AUDIO_IDS.MUSIC_CH4_HELL_MENU,
    menuRetroMusic: AUDIO_IDS.MUSIC_CH4_HELL_MENU_DARK,
    bossMusic: AUDIO_IDS.MUSIC_CH4_BOSS
  },
  5: {
    chapterNumber: 5,
    chapterKey: 'Rapture',
    name: 'The Rapture',
    normalMusic: AUDIO_IDS.MUSIC_CH5_RAPTURE_LIGHT,
    altMusic: AUDIO_IDS.MUSIC_CH5_RAPTURE_DARK,
    warpMusic: AUDIO_IDS.MUSIC_CH5_RAPTURE_WARP,
    menuNormalMusic: AUDIO_IDS.MUSIC_CH5_RAPTURE_MENU,
    menuRetroMusic: AUDIO_IDS.MUSIC_CH5_RAPTURE_MENU_DARK,
    bossMusic: AUDIO_IDS.MUSIC_CH5_BOSS
  },
  6: {
    chapterNumber: 6,
    chapterKey: 'DrFetus',
    name: 'The End',
    normalMusic: AUDIO_IDS.MUSIC_CH6_THE_END_LIGHT,
    altMusic: AUDIO_IDS.MUSIC_CH6_THE_END_DARK,
    warpMusic: AUDIO_IDS.MUSIC_CH6_THE_END_WARP,
    menuNormalMusic: AUDIO_IDS.MUSIC_CH6_THE_END_MENU,
    menuRetroMusic: AUDIO_IDS.MUSIC_CH6_THE_END_MENU_DARK,
    bossMusic: AUDIO_IDS.MUSIC_CH6_BOSS
  },
  7: {
    chapterNumber: 7,
    chapterKey: 'Bandage',
    name: 'Cotton Alley',
    normalMusic: AUDIO_IDS.MUSIC_CH7_COTTON_ALLEY_LIGHT,
    altMusic: AUDIO_IDS.MUSIC_CH7_COTTON_ALLEY_DARK,
    warpMusic: AUDIO_IDS.MUSIC_CH3_FACTORY_WARP,
    menuNormalMusic: AUDIO_IDS.MUSIC_CH7_COTTON_ALLEY_MENU,
    menuRetroMusic: AUDIO_IDS.MUSIC_CH7_COTTON_ALLEY_MENU_DARK,
    bossMusic: AUDIO_IDS.MUSIC_CH2_HOSPITAL_WARP
  }
};

// ============================================================================
// Utility / Query Functions
// ============================================================================

/**
 * Returns the full definition for a given sound ID.
 */
export function getSoundDefinition(id: AudioSoundId): SoundDefinition {
  const def = AUDIO_REGISTRY[id];
  if (!def) {
    throw new Error(`Audio ID "${id}" is not registered in AUDIO_REGISTRY.`);
  }
  return def;
}

/**
 * Picks a random authentic Super Meat Boy audio filename from the registered pool.
 */
export function getRandomSoundFile(id: AudioSoundId): string {
  const def = getSoundDefinition(id);
  const files = def.files;
  if (files.length === 0) {
    throw new Error(`Sound definition "${id}" has no registered audio files.`);
  }
  const index = Math.floor(Math.random() * files.length);
  return files[index];
}

/**
 * Resolves a filename or path to a browser-loadable web asset URL.
 */
export function getAudioUrl(filename: string): string {
  if (filename.startsWith('/') || filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  return `/assets/audio/${filename}`;
}

/**
 * Resolves the in-game BGM sound ID for a given chapter and Light/Dark World variant.
 */
export function getChapterMusic(chapter: number | string, isDarkWorld = false): AudioSoundId {
  const num = typeof chapter === 'number' ? chapter : parseInt(chapter, 10);
  const config = CHAPTER_AUDIO_CONFIGS[num];
  if (config) {
    return isDarkWorld ? config.altMusic : config.normalMusic;
  }
  return isDarkWorld ? AUDIO_IDS.MUSIC_CH1_FOREST_DARK : AUDIO_IDS.MUSIC_CH1_FOREST_LIGHT;
}

/**
 * Resolves the retro warp zone BGM sound ID for a given chapter.
 */
export function getChapterWarpMusic(chapter: number | string): AudioSoundId {
  const num = typeof chapter === 'number' ? chapter : parseInt(chapter, 10);
  const config = CHAPTER_AUDIO_CONFIGS[num];
  return config ? config.warpMusic : AUDIO_IDS.MUSIC_CH1_FOREST_WARP;
}

/**
 * Resolves the chapter map menu BGM sound ID for a given chapter.
 */
export function getChapterMenuMusic(chapter: number | string, isDarkWorld = false): AudioSoundId {
  const num = typeof chapter === 'number' ? chapter : parseInt(chapter, 10);
  const config = CHAPTER_AUDIO_CONFIGS[num];
  if (config) {
    return isDarkWorld ? config.menuRetroMusic : config.menuNormalMusic;
  }
  return isDarkWorld ? AUDIO_IDS.MUSIC_CH1_FOREST_MENU_DARK : AUDIO_IDS.MUSIC_CH1_FOREST_MENU;
}

/**
 * Resolves the boss battle BGM sound ID for a given chapter.
 */
export function getChapterBossMusic(chapter: number | string): AudioSoundId {
  const num = typeof chapter === 'number' ? chapter : parseInt(chapter, 10);
  const config = CHAPTER_AUDIO_CONFIGS[num];
  return config ? config.bossMusic : AUDIO_IDS.MUSIC_CH1_BOSS;
}
