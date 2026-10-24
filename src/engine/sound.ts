// Sound Engine for Super Meat Boy React Rewrite

class SoundManager {
  private static instance: SoundManager;
  private ctx: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private isMuted: boolean = false;
  private sfxVolume: number = 0.7;
  private musicVolume: number = 0.5;
  private currentBgmSource: AudioBufferSourceNode | null = null;
  private currentBgmGain: GainNode | null = null;
  private isUnlocked: boolean = false;

  private constructor() {
    // Lazy audio context initialization on first interaction
    const unlock = () => {
      this.init();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {});
    } else if (this.ctx) {
      this.isUnlocked = true;
    }
  }

  public async preloadSound(url: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(url)) return this.buffers.get(url)!;
    try {
      this.init();
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      if (!this.ctx) return null;
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers.set(url, audioBuffer);
      return audioBuffer;
    } catch {
      return null;
    }
  }

  public async playSfx(url: string, volumeScale: number = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      let buffer = this.buffers.get(url);
      if (!buffer) {
        buffer = (await this.preloadSound(url)) || undefined;
      }
      if (!buffer || !this.ctx) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const gain = this.ctx.createGain();
      gain.gain.value = Math.max(0, Math.min(1, this.sfxVolume * volumeScale));

      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(0);
    } catch {
      // Audio playback fails gracefully if uninitialized
    }
  }

  public async playMusic(url: string, loop: boolean = true) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    this.stopMusic();

    try {
      let buffer = this.buffers.get(url);
      if (!buffer) {
        buffer = (await this.preloadSound(url)) || undefined;
      }
      if (!buffer || !this.ctx) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = loop;

      const gain = this.ctx.createGain();
      gain.gain.value = this.musicVolume;

      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(0);

      this.currentBgmSource = source;
      this.currentBgmGain = gain;
    } catch {
      // Ignore background music load failure
    }
  }

  public stopMusic() {
    if (this.currentBgmSource) {
      try {
        this.currentBgmSource.stop();
        this.currentBgmSource.disconnect();
      } catch {
        // Source might already be stopped
      }
      this.currentBgmSource = null;
      this.currentBgmGain = null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopMusic();
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.isMuted) {
      this.stopMusic();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.currentBgmGain && this.ctx) {
      this.currentBgmGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }
}

export const soundManager = SoundManager.getInstance();

export const SMB_SOUNDS = {
  NAVIGATE: '/assets/audio/mouse-over_meat0.wav',
  PAGE_TURN: '/assets/audio/Book Page Turn 08.wav',
  SELECT: '/assets/audio/pushbuttons.wav',
  CURTAIN: '/assets/audio/CharacterSelect_Curtain.wav',
  CHAR_LEFT: '/assets/audio/character_select_left.wav',
  CHAR_RIGHT: '/assets/audio/character_select_right.wav',
  UNLOCK: '/assets/audio/Choir_unlock.wav',
  JUMP: '/assets/audio/Meat_jumps0.wav',
  DEATH: '/assets/audio/meat_death0.wav',
  SPLATTER: '/assets/audio/splatter00.wav',
  LEVEL_WIN: '/assets/audio/Level_Complete_Boom0.wav',
  RETRO_BOOP: '/assets/audio/retro boop.wav',
  BANDAGE: '/assets/audio/Unlock00.wav',
  TITLE_LOOP: '/assets/audio/smbtitleloop.wav',
  WORLD_LOOP: '/assets/audio/smbworldloop.wav',
  FOREST_LOOP: '/assets/audio/smbforest5.wav',
  HELL_LOOP: '/assets/audio/hell.wav',
  HOSPITAL_LOOP: '/assets/audio/ch2track.wav',
  FACTORY_LOOP: '/assets/audio/factory.wav',
};
