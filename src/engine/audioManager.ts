/**
 * Super Meat Boy Web Engine - Web Audio Sound & Music Manager
 * 
 * Features:
 * - Full Web Audio API graph with Master, SFX, Music, and Ambient Saw gain nodes.
 * - Browser autoplay policy handler (unlocks audio context on first user click/keypress/touch).
 * - AudioBuffer caching, preloading, and pool variation selection (616 extracted SMB WAV assets).
 * - High-fidelity Procedural Synthesizer fallback for 100% audio reliability (jump, land, squish,
 *   wallslide, walljump, death splatter, saw buzz, cheer, bandage pickup, menu clicks).
 * - Music / OST manager with seamless looping and smooth crossfades between chapters and cutscenes.
 * - Spatial audio & distance attenuation for proximity buzzsaws (stereo panning + volume curve).
 * - Volume persistence via localStorage with change event listeners.
 */

export interface AudioSettings {
  masterVolume: number; // 0.0 - 1.0
  sfxVolume: number;    // 0.0 - 1.0
  musicVolume: number;  // 0.0 - 1.0
  muted: boolean;
}

export interface PlaySfxOptions {
  volume?: number;      // 0.0 - 1.0 multiplier
  pitch?: number;       // Playback rate multiplier (default 1.0, e.g. 0.95 - 1.05 for natural variance)
  pan?: number;         // Stereo pan -1.0 (left) to 1.0 (right)
  detune?: number;      // Detune in cents
}

export interface SpatialAudioOptions {
  sourcePos: { x: number; y: number };
  listenerPos: { x: number; y: number };
  maxDistance?: number;
  volumeMultiplier?: number;
}

export type SoundEffectName =
  | 'jump'
  | 'meatjump'
  | 'land'
  | 'squish'
  | 'meatland'
  | 'wallslide'
  | 'walljump'
  | 'death'
  | 'splat'
  | 'splatter'
  | 'meatdeath'
  | 'saw_buzz'
  | 'saw'
  | 'bandage_girl'
  | 'bgirl'
  | 'cheer'
  | 'yay'
  | 'button_click'
  | 'menuclick'
  | 'click'
  | 'bandage'
  | 'win'
  | (string & {});

export type MusicTrackName =
  | 'forest'
  | 'smbforest5'
  | 'hospital'
  | 'ch2track'
  | 'factory'
  | 'altfactory'
  | 'hell'
  | 'rapture'
  | 'ch5'
  | 'the_end'
  | 'ch6'
  | 'title'
  | 'menu'
  | 'smbtitleloop'
  | (string & {});

// Sound pool configurations mapping logical keys to real extracted Super Meat Boy WAV filenames
const SFX_POOLS: Record<string, string[]> = {
  jump: [
    'Meat_jumps0.wav',
    'Meat_jumps1.wav',
    'Meat_jumps2.wav',
    'Meat_jumps3.wav',
    'Meat_jumps4.wav',
    'SMB_jumps4.wav',
    'jump.wav',
    'meatjump.wav'
  ],
  meatjump: [
    'Meat_jumps0.wav',
    'Meat_jumps1.wav',
    'Meat_jumps2.wav',
    'Meat_jumps3.wav',
    'Meat_jumps4.wav'
  ],
  land: [
    'Meat_Landing0.wav',
    'Meat_Landing1.wav',
    'animal_squish0.wav',
    'animal_squish1.wav',
    'meatland.wav',
    'squish.wav'
  ],
  meatland: [
    'Meat_Landing0.wav',
    'Meat_Landing1.wav'
  ],
  squish: [
    'animal_squish0.wav',
    'animal_squish1.wav',
    'animal_squish2.wav',
    'splat 2.wav',
    'squish.wav'
  ],
  wallslide: [
    'Meat_impacts_0.wav',
    'Meat_impacts_1.wav',
    'Meat_impacts_2.wav',
    'goostick0.wav',
    'goostick1.wav',
    'wallslide.wav'
  ],
  walljump: [
    'Meat_jumps1.wav',
    'Meat_impacts_3.wav',
    'SMB_jumps4.wav',
    'walljump.wav'
  ],
  death: [
    'meat_death0.wav',
    'meat_death1.wav',
    'meat_death2.wav',
    'meat_death3.wav',
    'meat_death4.wav',
    'meat_death5.wav',
    'meat_death6.wav',
    'meat_death7.wav',
    'splatter00.wav',
    'splatter01.wav',
    'splatter02.wav',
    'DEATH_RATTLE.wav',
    'meatdeath.wav',
    'splat.wav'
  ],
  splat: [
    'splatter00.wav',
    'splatter01.wav',
    'splatter02.wav',
    'splatter03.wav',
    'splat 2.wav'
  ],
  splatter: [
    'splatter00.wav',
    'splatter01.wav',
    'splatter02.wav',
    'splatter04.wav',
    'splatter05.wav'
  ],
  meatdeath: [
    'meat_death0.wav',
    'meat_death1.wav',
    'meat_death2.wav',
    'meat_death3.wav'
  ],
  saw_buzz: [
    'Retro_saw01.wav',
    'Retro_buzzby0.wav',
    'Retro_buzzby1.wav',
    'Retro_buzzby2.wav',
    'saw_buzz.wav'
  ],
  saw: [
    'Retro_saw01.wav',
    'Retro_buzzby0.wav'
  ],
  bandage_girl: [
    'bgirl.wav',
    'Bandaid_Girl_Angryscream.wav',
    'Choir_unlock.wav',
    'Level_Complete_Boom0.wav',
    'yay.wav'
  ],
  bgirl: [
    'bgirl.wav',
    'Bandaid_Girl_Angryscream.wav'
  ],
  cheer: [
    'Choir_unlock.wav',
    'Level_Complete_Boom0.wav',
    'chapterend.wav',
    'yay.wav'
  ],
  yay: [
    'Choir_unlock.wav',
    'Level_Complete_Boom0.wav'
  ],
  win: [
    'Choir_unlock.wav',
    'Level_Complete_Boom0.wav',
    'chapterend.wav'
  ],
  button_click: [
    'mouse-over_clicks0.wav',
    'mouse-over_clicks1.wav',
    'Seatbelt_click.wav',
    'beep.wav',
    'menuclick.wav'
  ],
  menuclick: [
    'mouse-over_clicks0.wav',
    'mouse-over_clicks1.wav',
    'Seatbelt_click.wav'
  ],
  click: [
    'mouse-over_clicks0.wav',
    'mouse-over_clicks1.wav',
    'beep.wav'
  ],
  bandage: [
    'band aid pick up.wav',
    'Unlock00.wav',
    'Unlock01.wav',
    'tarballpickup.wav'
  ]
};

// Music tracks mapped to real extracted SMB music WAVs
const MUSIC_TRACKS: Record<string, string[]> = {
  forest: ['smbforest5.wav', 'smbforestalt.wav', 'forestmenuloop.wav'],
  smbforest5: ['smbforest5.wav'],
  hospital: ['ch2track.wav', 'ch2trackalt.wav', 'ch2retro.wav'],
  ch2track: ['ch2track.wav'],
  factory: ['altfactory.wav', 'retrofactory32khz_music.wav', 'factorymenu.wav'],
  altfactory: ['altfactory.wav'],
  hell: ['hell.wav', 'hardhell.wav', 'retrohell.wav'],
  rapture: ['ch5.wav', 'ch5alt.wav', 'ch5hard.wav'],
  ch5: ['ch5.wav'],
  the_end: ['ch6.wav', 'ch6dark.wav', 'theend_music.wav'],
  ch6: ['ch6.wav'],
  title: ['smbtitleloop.wav', 'smbworldloop.wav', '4bittitle_music.wav', 'intro_music.wav'],
  menu: ['forestmenuloop.wav', 'smbtitleloop.wav'],
  smbtitleloop: ['smbtitleloop.wav']
};

const STORAGE_KEYS = {
  MASTER_VOLUME: 'smb_audio_master_volume',
  SFX_VOLUME: 'smb_audio_sfx_volume',
  MUSIC_VOLUME: 'smb_audio_music_volume',
  MUTED: 'smb_audio_muted'
};

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.8,
  musicVolume: 0.6,
  muted: false
};

/**
 * High-quality Procedural Web Audio Synthesizer
 * Guarantees zero latency and 100% audio uptime even if network fails or audio files are loading.
 */
class ProceduralSynth {
  private static noiseBufferCache: AudioBuffer | null = null;

  private static getOrCreateNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBufferCache && this.noiseBufferCache.sampleRate === ctx.sampleRate) {
      return this.noiseBufferCache;
    }
    const bufferSize = ctx.sampleRate * 1.0; // 1 second of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBufferCache = buffer;
    return buffer;
  }

  /**
   * Classic punchy Meat Boy jump chirp: rapid upward square/triangle pitch sweep
   */
  public static playJump(ctx: AudioContext, destination: AudioNode, volume: number, pitch = 1.0) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'square';
    const baseFreq = 145 * pitch;
    const targetFreq = 380 * pitch;

    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25 * volume, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  /**
   * Heavy meaty ground impact thud with low-frequency resonant slap
   */
  public static playLand(ctx: AudioContext, destination: AudioNode, volume: number, intensity = 1.0) {
    const now = ctx.currentTime;

    // Sub-bass meaty drop
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110 * intensity, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.09);

    oscGain.gain.setValueAtTime(0.32 * volume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(destination);
    osc.start(now);
    osc.stop(now + 0.1);

    // Filtered noise slap (flesh impact)
    const noise = ctx.createBufferSource();
    noise.buffer = this.getOrCreateNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.07);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3 * volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(destination);

    noise.start(now);
    noise.stop(now + 0.08);
  }

  /**
   * Wet squishy flesh sound
   */
  public static playSquish(ctx: AudioContext, destination: AudioNode, volume: number) {
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.getOrCreateNoiseBuffer(ctx);

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.Q.setValueAtTime(3.5, now);
    bandpass.frequency.setValueAtTime(680, now);
    bandpass.frequency.exponentialRampToValueAtTime(210, now + 0.14);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(destination);

    noise.start(now);
    noise.stop(now + 0.16);
  }

  /**
   * Wall kick with energetic transient snap
   */
  public static playWallJump(ctx: AudioContext, destination: AudioNode, volume: number, pitch = 1.0) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(540 * pitch, now + 0.13);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28 * volume, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Catastrophic meat explosion: crunch noise burst + pitch bomb + visceral squelch
   */
  public static playDeath(ctx: AudioContext, destination: AudioNode, volume: number) {
    const now = ctx.currentTime;

    // 1. Crunch noise burst
    const noise = ctx.createBufferSource();
    noise.buffer = this.getOrCreateNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.0, now);
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + 0.32);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55 * volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(destination);
    noise.start(now);
    noise.stop(now + 0.33);

    // 2. Heavy low-end impact drop
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(260, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.35);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(320, now);
    lowpass.frequency.exponentialRampToValueAtTime(60, now + 0.35);

    subGain.gain.setValueAtTime(0.48 * volume, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    subOsc.connect(lowpass);
    lowpass.connect(subGain);
    subGain.connect(destination);
    subOsc.start(now);
    subOsc.stop(now + 0.36);
  }

  /**
   * Menacing industrial circular saw hum using detuned sawtooths and resonant filtering
   */
  public static createSawBuzzNodes(ctx: AudioContext, destination: AudioNode): {
    gain: GainNode;
    start: () => void;
    stop: () => void;
  } {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const masterSawGain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(64, ctx.currentTime);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(65.8, ctx.currentTime);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(24, ctx.currentTime); // Rapid 24Hz mechanical spin wobble
    lfoGain.gain.setValueAtTime(14, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.0, ctx.currentTime);
    filter.frequency.setValueAtTime(750, ctx.currentTime);

    masterSawGain.gain.setValueAtTime(0, ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterSawGain);
    masterSawGain.connect(destination);

    return {
      gain: masterSawGain,
      start: () => {
        const t = ctx.currentTime;
        osc1.start(t);
        osc2.start(t);
        lfo.start(t);
      },
      stop: () => {
        try {
          const t = ctx.currentTime;
          osc1.stop(t);
          osc2.stop(t);
          lfo.stop(t);
        } catch {}
      }
    };
  }

  /**
   * Cheerful Bandage Girl chime / Level win fanfare
   */
  public static playCheer(ctx: AudioContext, destination: AudioNode, volume: number) {
    const now = ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.07;
      const duration = 0.35;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.22 * volume, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  }

  /**
   * Crisp UI button click blip
   */
  public static playClick(ctx: AudioContext, destination: AudioNode, volume: number) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.025);

    gain.gain.setValueAtTime(0.16 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * Bandage collectible pickup ping
   */
  public static playBandage(ctx: AudioContext, destination: AudioNode, volume: number) {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.51, now + 0.06); // E6

    gain.gain.setValueAtTime(0.24 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(destination);

    osc1.start(now);
    osc1.stop(now + 0.1);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.28);
  }
}

/**
 * Main Web Audio Sound & Music Manager for Super Meat Boy
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Spatial Saw Ambient Buzz Nodes
  private sawGainNode: GainNode | null = null;
  private sawPannerNode: StereoPannerNode | PannerNode | null = null;
  private sawSynthHandle: { gain: GainNode; start: () => void; stop: () => void } | null = null;
  private sawBufferSource: AudioBufferSourceNode | null = null;
  private isSawLoopRunning: boolean = false;

  // Wall slide continuous noise state
  private wallSlideSource: AudioBufferSourceNode | null = null;
  private wallSlideGain: GainNode | null = null;

  // Caching
  private audioBufferCache: Map<string, AudioBuffer | null> = new Map();
  private pendingFetches: Map<string, Promise<AudioBuffer | null>> = new Map();

  // Music System (Dual-channel crossfade)
  private currentMusicSource: AudioBufferSourceNode | HTMLAudioElement | null = null;
  private currentMusicGainNode: GainNode | null = null;
  private currentMusicTrackName: string | null = null;
  private isMusicTransitioning: boolean = false;

  // Settings
  private settings: AudioSettings;
  private settingsListeners: Set<(settings: AudioSettings) => void> = new Set();
  private isUnlocked: boolean = false;

  // Compatibility getters/setters for existing components
  public get sfxVolume(): number {
    return this.settings.sfxVolume;
  }
  public set sfxVolume(val: number) {
    this.setSfxVolume(val);
  }

  public get musicVolume(): number {
    return this.settings.musicVolume;
  }
  public set musicVolume(val: number) {
    this.setMusicVolume(val);
  }

  public get isMuted(): boolean {
    return this.settings.muted;
  }
  public set isMuted(val: boolean) {
    this.setMuted(val);
  }

  constructor() {
    this.settings = this.loadSettings();
    if (typeof window !== 'undefined') {
      this.setupAutoplayUnlock();
    }
  }

  // ==========================================
  // Initialization & Autoplay Handling
  // ==========================================

  private loadSettings(): AudioSettings {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_SETTINGS };
    }
    try {
      const master = localStorage.getItem(STORAGE_KEYS.MASTER_VOLUME);
      const sfx = localStorage.getItem(STORAGE_KEYS.SFX_VOLUME);
      const music = localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME);
      const muted = localStorage.getItem(STORAGE_KEYS.MUTED);

      return {
        masterVolume: master !== null ? Math.max(0, Math.min(1, parseFloat(master))) : DEFAULT_SETTINGS.masterVolume,
        sfxVolume: sfx !== null ? Math.max(0, Math.min(1, parseFloat(sfx))) : DEFAULT_SETTINGS.sfxVolume,
        musicVolume: music !== null ? Math.max(0, Math.min(1, parseFloat(music))) : DEFAULT_SETTINGS.musicVolume,
        muted: muted !== null ? muted === 'true' : DEFAULT_SETTINGS.muted
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private saveSettings(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(STORAGE_KEYS.MASTER_VOLUME, this.settings.masterVolume.toString());
      localStorage.setItem(STORAGE_KEYS.SFX_VOLUME, this.settings.sfxVolume.toString());
      localStorage.setItem(STORAGE_KEYS.MUSIC_VOLUME, this.settings.musicVolume.toString());
      localStorage.setItem(STORAGE_KEYS.MUTED, this.settings.muted.toString());
    } catch {}
  }

  /**
   * Initializes the Web Audio graph. Safe to call repeatedly.
   */
  public init(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    if (typeof window === 'undefined') return null;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      this.ctx = new AudioCtx();

      // Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.settings.muted ? 0 : this.settings.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.settings.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Ambient Saw Gain & Panning Bus
      this.sawGainNode = this.ctx.createGain();
      this.sawGainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      if (typeof this.ctx.createStereoPanner === 'function') {
        this.sawPannerNode = this.ctx.createStereoPanner();
        this.sawGainNode.connect(this.sawPannerNode);
        this.sawPannerNode.connect(this.sfxGain);
      } else {
        // Fallback for older browsers
        this.sawGainNode.connect(this.sfxGain);
      }

      return this.ctx;
    } catch (e) {
      console.warn('AudioContext initialization failed:', e);
      return null;
    }
  }

  private setupAutoplayUnlock(): void {
    const unlock = () => {
      if (this.isUnlocked) return;
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else {
        this.isUnlocked = true;
      }

      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    window.addEventListener('click', unlock, { once: true, passive: true });
  }

  // ==========================================
  // Buffer Loading & Caching
  // ==========================================

  /**
   * Resolves a file URL given an asset filename or path.
   */
  private resolveAudioUrl(filename: string): string {
    const fn = String(filename);
    if (fn.startsWith('/') || fn.startsWith('http://') || fn.startsWith('https://')) {
      return fn;
    }
    return `/assets/audio/${fn}`;
  }

  /**
   * Loads and decodes an audio buffer from the network, with in-memory caching.
   */
  public async loadBuffer(filename: string): Promise<AudioBuffer | null> {
    const url = this.resolveAudioUrl(filename);
    if (this.audioBufferCache.has(url)) {
      return this.audioBufferCache.get(url) || null;
    }

    if (this.pendingFetches.has(url)) {
      return this.pendingFetches.get(url)!;
    }

    const fetchPromise = (async () => {
      const ctx = this.init();
      if (!ctx) return null;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          this.audioBufferCache.set(url, null);
          return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.audioBufferCache.set(url, audioBuffer);
        return audioBuffer;
      } catch {
        // Failed to load or decode (file may not exist or network unavailable)
        this.audioBufferCache.set(url, null);
        return null;
      } finally {
        this.pendingFetches.delete(url);
      }
    })();

    this.pendingFetches.set(url, fetchPromise);
    return fetchPromise;
  }

  /**
   * Asynchronously preloads an array of audio filenames or sound keys.
   */
  public async preloadSounds(filenamesOrKeys: string[]): Promise<void> {
    const promises: Promise<unknown>[] = [];
    for (const key of filenamesOrKeys) {
      const pool = SFX_POOLS[key];
      if (pool) {
        // Preload first 2 variations in the pool
        pool.slice(0, 2).forEach(f => promises.push(this.loadBuffer(f)));
      } else {
        promises.push(this.loadBuffer(key));
      }
    }
    await Promise.allSettled(promises);
  }

  /**
   * Preload core gameplay sound effects on startup
   */
  public preloadCoreSounds(): void {
    this.preloadSounds([
      'jump',
      'land',
      'walljump',
      'death',
      'saw_buzz',
      'bandage_girl',
      'button_click'
    ]).catch(() => {});
  }

  // ==========================================
  // Sound Effects (SFX) Playback
  // ==========================================

  /**
   * Universal play method compatible with existing code: `play(name)`
   */
  public play(name: SoundEffectName, options?: PlaySfxOptions): void {
    this.playSfx(name, options);
  }

  /**
   * Plays a sound effect with caching, procedural fallback, and randomized pitch variance.
   */
  public playSfx(name: SoundEffectName, options: PlaySfxOptions = {}): void {
    if (this.settings.muted) return;
    const ctx = this.init();
    if (!ctx) return;

    const volume = (options.volume ?? 1.0);
    // Slight random pitch variation (±4%) for authentic Super Meat Boy arcade feel
    const naturalPitchVariance = 0.96 + Math.random() * 0.08;
    const pitch = (options.pitch ?? 1.0) * naturalPitchVariance;
    const pan = options.pan ?? 0;

    // 1. Check if a pool exists for this key
    const pool = SFX_POOLS[name];
    const nameStr = String(name);
    const candidateFiles = pool || [nameStr.endsWith('.wav') ? nameStr : `${nameStr}.wav`];
    const randomFile = candidateFiles[Math.floor(Math.random() * candidateFiles.length)];

    const url = this.resolveAudioUrl(randomFile);
    const cachedBuffer = this.audioBufferCache.get(url);

    if (cachedBuffer) {
      // Play decoded audio buffer
      this.playBufferSource(cachedBuffer, volume, pitch, pan);
    } else {
      // Audio buffer not cached yet: trigger background load and execute instant procedural fallback!
      this.loadBuffer(randomFile).catch(() => {});
      this.playProceduralFallback(nameStr, volume, pitch, pan);
    }
  }

  /**
   * Internal helper to play an AudioBuffer through the SFX bus with optional panning
   */
  private playBufferSource(buffer: AudioBuffer, volume: number, pitch: number, pan: number): void {
    if (!this.ctx || !this.sfxGain) return;

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.setValueAtTime(pitch, this.ctx.currentTime);

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

      if (pan !== 0 && typeof this.ctx.createStereoPanner === 'function') {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime);
        source.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.sfxGain);
      } else {
        source.connect(gainNode);
        gainNode.connect(this.sfxGain);
      }

      source.start(this.ctx.currentTime);
    } catch {}
  }

  /**
   * Executes procedural synthesis fallback matching the requested sound name
   */
  private playProceduralFallback(name: string, volume: number, pitch: number, pan: number): void {
    if (!this.ctx || !this.sfxGain) return;

    let targetNode: AudioNode = this.sfxGain;
    if (pan !== 0 && typeof this.ctx.createStereoPanner === 'function') {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime);
      panner.connect(this.sfxGain);
      targetNode = panner;
    }

    try {
      switch (name) {
        case 'jump':
        case 'meatjump':
          ProceduralSynth.playJump(this.ctx, targetNode, volume, pitch);
          break;

        case 'land':
        case 'meatland':
          ProceduralSynth.playLand(this.ctx, targetNode, volume, pitch);
          break;

        case 'squish':
        case 'splat':
        case 'splatter':
          ProceduralSynth.playSquish(this.ctx, targetNode, volume);
          break;

        case 'walljump':
          ProceduralSynth.playWallJump(this.ctx, targetNode, volume, pitch);
          break;

        case 'death':
        case 'meatdeath':
          ProceduralSynth.playDeath(this.ctx, targetNode, volume);
          break;

        case 'bandage_girl':
        case 'bgirl':
        case 'cheer':
        case 'yay':
        case 'win':
          ProceduralSynth.playCheer(this.ctx, targetNode, volume);
          break;

        case 'button_click':
        case 'menuclick':
        case 'click':
          ProceduralSynth.playClick(this.ctx, targetNode, volume);
          break;

        case 'bandage':
          ProceduralSynth.playBandage(this.ctx, targetNode, volume);
          break;

        default:
          // Default subtle blip for unknown sounds
          ProceduralSynth.playClick(this.ctx, targetNode, volume * 0.7);
          break;
      }
    } catch {}
  }

  // ==========================================
  // Direct Gameplay Sound Helpers
  // ==========================================

  public playJump(): void {
    this.playSfx('jump');
  }

  public playLand(intensity: number = 1.0): void {
    this.playSfx('land', { volume: Math.min(1.0, 0.6 + intensity * 0.4) });
  }

  public playSquish(): void {
    this.playSfx('squish');
  }

  public playWallJump(): void {
    this.playSfx('walljump');
  }

  public playDeath(): void {
    this.playSfx('death');
  }

  public playBandageGirl(): void {
    this.playSfx('bandage_girl');
  }

  public playButtonClick(): void {
    this.playSfx('button_click');
  }

  public playBandage(): void {
    this.playSfx('bandage');
  }

  /**
   * Continuous wall slide friction sound
   */
  public playWallSlide(active: boolean): void {
    if (!active) {
      if (this.wallSlideGain && this.ctx) {
        this.wallSlideGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);
      }
      return;
    }

    if (this.settings.muted) return;
    const ctx = this.init();
    if (!ctx || !this.sfxGain) return;

    if (!this.wallSlideGain) {
      this.wallSlideGain = ctx.createGain();
      this.wallSlideGain.connect(this.sfxGain);
    }

    this.wallSlideGain.gain.setValueAtTime(0.18, ctx.currentTime);

    // If source isn't running, start filtered noise friction
    if (!this.wallSlideSource) {
      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.Q.setValueAtTime(2.0, ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.wallSlideGain);
      noise.start();
      this.wallSlideSource = noise;
    }
  }

  // ==========================================
  // Spatial Audio & Saw Proximity Manager
  // ==========================================

  /**
   * Plays a one-shot spatial sound effect with distance attenuation and panning.
   */
  public playSpatialSfx(
    sfxName: SoundEffectName,
    options: SpatialAudioOptions
  ): void {
    const { sourcePos, listenerPos, maxDistance = 600, volumeMultiplier = 1.0 } = options;

    const dx = sourcePos.x - listenerPos.x;
    const dy = sourcePos.y - listenerPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= maxDistance) return;

    // Attenuation curve: quadratic drop-off
    const normDist = dist / maxDistance;
    const distFactor = Math.max(0, 1 - normDist);
    const volume = Math.pow(distFactor, 1.4) * volumeMultiplier;

    // Panning -1.0 to 1.0 based on relative horizontal distance
    const pan = Math.max(-1.0, Math.min(1.0, dx / (maxDistance * 0.7)));

    this.playSfx(sfxName, { volume, pan });
  }

  /**
   * Updates dynamic spatial proximity buzz for all circular saws on screen.
   * Finds the closest saw blade, calculates volume and stereo pan, and seamlessly modulates the saw buzz.
   */
  public updateSawProximity(
    saws: Array<{ x: number; y: number }>,
    player: { x: number; y: number } | null,
    maxDistance = 500
  ): void {
    if (this.settings.muted || !player || !saws || saws.length === 0) {
      this.stopSawProximity();
      return;
    }

    const ctx = this.init();
    if (!ctx || !this.sawGainNode) return;

    // Find nearest saw
    let minDistanceSq = Infinity;
    let closestSaw = saws[0];

    for (const saw of saws) {
      const dx = saw.x - player.x;
      const dy = saw.y - player.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestSaw = saw;
      }
    }

    const minDist = Math.sqrt(minDistanceSq);
    if (minDist >= maxDistance) {
      // Fade out saw loop smoothly
      this.sawGainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      return;
    }

    // Ensure saw loop is actively playing
    this.ensureSawLoopRunning();

    // Calculate volume based on distance (punchy quadratic curve)
    const factor = 1.0 - (minDist / maxDistance);
    const targetVolume = Math.pow(factor, 1.8) * 0.55;

    // Calculate horizontal pan (-1.0 to 1.0)
    const dx = closestSaw.x - player.x;
    const targetPan = Math.max(-0.9, Math.min(0.9, dx / (maxDistance * 0.65)));

    const now = ctx.currentTime;
    this.sawGainNode.gain.linearRampToValueAtTime(targetVolume, now + 0.05);

    if (this.sawPannerNode && 'pan' in this.sawPannerNode) {
      (this.sawPannerNode as StereoPannerNode).pan.linearRampToValueAtTime(targetPan, now + 0.05);
    }
  }

  /**
   * Ensures the continuous ambient saw buzz source is initialized and active.
   */
  private ensureSawLoopRunning(): void {
    if (this.isSawLoopRunning || !this.ctx || !this.sawGainNode) return;

    const sawWavUrl = this.resolveAudioUrl('Retro_saw01.wav');
    const cachedBuffer = this.audioBufferCache.get(sawWavUrl);

    if (cachedBuffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = cachedBuffer;
        source.loop = true;
        source.connect(this.sawGainNode);
        source.start();
        this.sawBufferSource = source;
        this.isSawLoopRunning = true;
        return;
      } catch {}
    }

    // If Retro_saw01.wav not loaded, use procedural saw buzz generator
    if (!this.sawSynthHandle) {
      this.sawSynthHandle = ProceduralSynth.createSawBuzzNodes(this.ctx, this.sawGainNode);
      this.sawSynthHandle.start();
      this.isSawLoopRunning = true;

      // Also trigger background load of real saw wav
      this.loadBuffer('Retro_saw01.wav').catch(() => {});
    }
  }

  /**
   * Immediately stops proximity saw buzzing
   */
  public stopSawProximity(): void {
    if (this.sawGainNode && this.ctx) {
      this.sawGainNode.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);
    }
  }

  // ==========================================
  // Music & OST Manager (Looping & Crossfading)
  // ==========================================

  /**
   * Compatibility alias for playing background music
   */
  public playBGM(trackName: MusicTrackName = 'forest', crossfadeDuration = 1.0): void {
    this.playMusic(trackName, crossfadeDuration);
  }

  /**
   * Compatibility alias for stopping background music
   */
  public stopBGM(fadeDuration = 0.5): void {
    this.stopMusic(fadeDuration);
  }

  /**
   * Plays a background music track with seamless looping and smooth crossfades.
   * Resolves track names to real extracted Super Meat Boy music assets.
   */
  public playMusic(
    trackName: MusicTrackName,
    crossfadeDuration = 1.0,
    loop = true
  ): void {
    if (this.currentMusicTrackName === trackName && !this.isMusicTransitioning) {
      return; // Already playing this track
    }

    const ctx = this.init();
    if (!ctx || !this.musicGain) return;

    const trackNameStr = String(trackName);
    const candidates = MUSIC_TRACKS[trackNameStr] || [
      trackNameStr.endsWith('.wav') ? trackNameStr : `${trackNameStr}.wav`
    ];
    const chosenFile = candidates[0];
    const url = this.resolveAudioUrl(chosenFile);

    this.isMusicTransitioning = true;
    const oldSource = this.currentMusicSource;
    const oldGain = this.currentMusicGainNode;

    // Create a new gain node for the incoming track
    const newTrackGain = ctx.createGain();
    newTrackGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    newTrackGain.connect(this.musicGain);

    // Crossfade old track out
    if (oldGain && ctx) {
      const now = ctx.currentTime;
      oldGain.gain.linearRampToValueAtTime(0.0001, now + crossfadeDuration);
      setTimeout(() => {
        try {
          if (oldSource instanceof AudioBufferSourceNode) {
            oldSource.stop();
            oldSource.disconnect();
          } else if (oldSource instanceof HTMLAudioElement) {
            oldSource.pause();
            oldSource.src = '';
          }
          oldGain.disconnect();
        } catch {}
      }, crossfadeDuration * 1000 + 100);
    }

    // Attempt Web Audio buffer playback for seamless looping, or stream with HTMLAudioElement
    const cachedBuffer = this.audioBufferCache.get(url);
    if (cachedBuffer) {
      // Decode cached buffer
      const source = ctx.createBufferSource();
      source.buffer = cachedBuffer;
      source.loop = loop;
      source.connect(newTrackGain);
      source.start(ctx.currentTime);

      this.currentMusicSource = source;
      this.currentMusicGainNode = newTrackGain;
      this.currentMusicTrackName = trackNameStr;

      // Fade in
      newTrackGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + crossfadeDuration);
      this.isMusicTransitioning = false;
    } else {
      // Stream via HTMLAudioElement through Web Audio graph
      try {
        const audioEl = new Audio(url);
        audioEl.loop = loop;
        audioEl.crossOrigin = 'anonymous';

        const elementSource = ctx.createMediaElementSource(audioEl);
        elementSource.connect(newTrackGain);

        this.currentMusicSource = audioEl;
        this.currentMusicGainNode = newTrackGain;
        this.currentMusicTrackName = trackNameStr;

        audioEl.play().catch(() => {});
        newTrackGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + crossfadeDuration);
        this.isMusicTransitioning = false;

        // Also asynchronously load into buffer cache for subsequent instant seamless replays
        this.loadBuffer(chosenFile).catch(() => {});
      } catch {
        this.isMusicTransitioning = false;
      }
    }
  }

  /**
   * Smoothly stops the currently playing music track.
   */
  public stopMusic(fadeDuration = 0.5): void {
    if (!this.ctx || !this.currentMusicGainNode) {
      this.currentMusicTrackName = null;
      return;
    }

    const now = this.ctx.currentTime;
    const oldSource = this.currentMusicSource;
    const oldGain = this.currentMusicGainNode;

    oldGain.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);
    this.currentMusicTrackName = null;
    this.currentMusicSource = null;
    this.currentMusicGainNode = null;

    setTimeout(() => {
      try {
        if (oldSource instanceof AudioBufferSourceNode) {
          oldSource.stop();
          oldSource.disconnect();
        } else if (oldSource instanceof HTMLAudioElement) {
          oldSource.pause();
          oldSource.src = '';
        }
        oldGain.disconnect();
      } catch {}
    }, fadeDuration * 1000 + 100);
  }

  public getCurrentTrack(): string | null {
    return this.currentMusicTrackName;
  }

  // ==========================================
  // Volume Controls & Persistence
  // ==========================================

  public setMasterVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.settings.masterVolume = clamped;
    this.saveSettings();

    if (this.masterGain && this.ctx && !this.settings.muted) {
      this.masterGain.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + 0.05);
    }
    this.notifySettingsChange();
  }

  public setSfxVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.settings.sfxVolume = clamped;
    this.saveSettings();

    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + 0.05);
    }
    this.notifySettingsChange();
  }

  public setMusicVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.settings.musicVolume = clamped;
    this.saveSettings();

    if (this.musicGain && this.ctx) {
      this.musicGain.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + 0.05);
    }
    this.notifySettingsChange();
  }

  public setMuted(muted: boolean): void {
    this.settings.muted = muted;
    this.saveSettings();

    if (this.masterGain && this.ctx) {
      const target = muted ? 0.0001 : this.settings.masterVolume;
      this.masterGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.05);
    }

    if (muted) {
      this.stopSawProximity();
    }
    this.notifySettingsChange();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.settings.muted);
    return this.settings.muted;
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public onSettingsChange(callback: (settings: AudioSettings) => void): () => void {
    this.settingsListeners.add(callback);
    return () => this.settingsListeners.delete(callback);
  }

  private notifySettingsChange(): void {
    const current = this.getSettings();
    this.settingsListeners.forEach(listener => {
      try {
        listener(current);
      } catch {}
    });
  }
}

// Global Singleton Instance
export const audioManager = new AudioManager();
