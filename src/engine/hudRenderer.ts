/**
 * hudRenderer.ts
 *
 * Authentic Super Meat Boy HUD rendering layer.
 *
 * This module is intentionally free of React (and of any browser-only API at
 * import time) so it can be reused from both the React `HUD` component and the
 * canvas game loop.
 *
 * It reconstructs the exact look & feel of SMB's in-game HUD from the
 * original extracted texture atlases:
 *
 *   public/assets/textures/HUD/meathuds.png    (pixel HUD sprite sheet)
 *   public/assets/textures/HUD/replayhud.png   (Meat Boy head / replay marks)
 *   public/assets/textures/Menus/pausemenu.png (pause menu sign + characters)
 *   public/assets/textures/Menus/retropause.png(flat white retro pause flash)
 *
 * Asset findings (verified pixel-for-pixel against the source PNGs):
 *
 *   meathuds.png (1024x1024) — pixel-art HUD sheet, palette:
 *     #000000 ink, #666666 mid-grey, #cccccc light-grey, #e0e0e0 xlight-grey,
 *     #990000 dark-red (grade medal / B button), #be3030 red (A button),
 *     #ff99cc pink (the A+ grade letter).
 *     It contains:
 *       - a pixel clock icon          -> the timer indicator
 *       - a pixel bandage icon        -> the collected-bandage indicator
 *       - vertical "GRADE" label + grade letters (A+/A/B/C/D/F, "SA", "x2")
 *       - controller button glyphs (circles, red trapezoid, SPACE/ESC/SHIFT)
 *   replayhud.png (400x400) — HUD dead-run marks:
 *       - a black Meat Boy head       -> the death / attempt counter badge
 *       - a light-grey arc ring       -> the replay progress ring
 *       - a grey "A" button
 *   pausemenu.png  — top-hat tuxedo characters holding a blank white sign; the
 *     sign is the pause menu panel, the button prompts sit along the bottom.
 *   retropause.png — a pure white 100x100 swatch used as the retro pause flash.
 */

// ---------------------------------------------------------------------------
// Palette (sampled directly from meathuds.png / replayhud.png)
// ---------------------------------------------------------------------------

export const SMB_PALETTE = {
  ink: '#000000',
  white: '#ffffff',
  grey: '#666666',
  lightGrey: '#cccccc',
  xlightGrey: '#e0e0e0',
  darkRed: '#990000',
  red: '#be3030',
  pink: '#ff99cc',
  /** transparent-black HUD backing so the world stays readable underneath */
  hudBacking: 'rgba(0, 0, 0, 0.82)',
} as const;

/** Grade tint colours: A+ is the authentic pink, the rest are greys/white. */
export const GRADE_COLORS: Record<Grade, string> = {
  'A+': SMB_PALETTE.pink,
  A: '#ffffff',
  B: SMB_PALETTE.xlightGrey,
  C: SMB_PALETTE.lightGrey,
  D: SMB_PALETTE.grey,
  F: SMB_PALETTE.grey,
};

// ---------------------------------------------------------------------------
// Sprite atlas definitions
// ---------------------------------------------------------------------------

export interface SpriteFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AtlasDefinition {
  src: string;
  width: number;
  height: number;
  /** true for hand-pixeled art (no smoothing) */
  pixelArt: boolean;
  frames: Record<string, SpriteFrame>;
}

export const ATLAS_TEXTURE_PATH = {
  meathuds: '/assets/textures/HUD/meathuds.png',
  replayhud: '/assets/textures/HUD/replayhud.png',
  pausemenu: '/assets/textures/Menus/pausemenu.png',
  retropause: '/assets/textures/Menus/retropause.png',
} as const;

/**
 * Frame rectangles measured from the original atlases with connected-component
 * analysis. Coordinates are in source-image pixels.
 */
export const HUD_ATLASES = {
  meathuds: {
    src: ATLAS_TEXTURE_PATH.meathuds,
    width: 1024,
    height: 1024,
    pixelArt: true,
    frames: {
      clock: { x: 15, y: 633, w: 131, h: 112 },
      bandage: { x: 170, y: 633, w: 113, h: 112 },
      gradeAPlus: { x: 314, y: 833, w: 81, h: 77 },
      gradeA: { x: 400, y: 781, w: 121, h: 119 },
      gradeD: { x: 7, y: 765, w: 123, h: 101 },
      gradeF: { x: 7, y: 885, w: 101, h: 82 },
      buttonBigRed: { x: 702, y: 9, w: 257, h: 244 },
      buttonCircleGrey: { x: 823, y: 488, w: 150, h: 137 },
      buttonTrapezoidRed: { x: 823, y: 644, w: 196, h: 89 },
    },
  } satisfies AtlasDefinition,
  replayhud: {
    src: ATLAS_TEXTURE_PATH.replayhud,
    width: 400,
    height: 400,
    pixelArt: true,
    frames: {
      meatHead: { x: 166, y: 210, w: 70, h: 76 },
      ring: { x: 0, y: 212, w: 160, h: 169 },
      buttonA: { x: 241, y: 270, w: 69, h: 63 },
    },
  } satisfies AtlasDefinition,
} as const;

// ---------------------------------------------------------------------------
// 5x7 pixel font (retro typography)
//
// A crisp, blocky bitmap face in the spirit of SMB's 04b_09-style HUD font.
// Digits, A-Z and the punctuation used by the HUD are provided so timers, par
// times and labels all share one authentic pixel voice.
// ---------------------------------------------------------------------------

const GLYPH_ROWS: Record<string, string[]> = {
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  ':': ['.....', '..#..', '..#..', '.....', '..#..', '..#..', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '..#..', '..#..'],
  ',': ['.....', '.....', '.....', '.....', '..#..', '..#..', '.#...'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  "'": ['..#..', '..#..', '.....', '.....', '.....', '.....', '.....'],
  x: ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  '<': ['....#', '...#.', '..#..', '.#...', '..#..', '...#.', '....#'],
  '>': ['#....', '.#...', '..#..', '...#.', '..#..', '.#...', '#....'],
  '*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};

const FONT_WIDTH = 5;
const FONT_HEIGHT = 7;

export interface PixelTextOptions {
  /** integer pixel scale (1 = 5x7). Defaults to 1. */
  scale?: number;
  /** extra blank columns between glyphs, in font pixels. Defaults to 1. */
  spacing?: number;
  /** outline colour drawn behind the glyphs; omit for no outline. */
  outline?: string | null;
  /** horizontal alignment relative to (x). Defaults to 'left'. */
  align?: 'left' | 'center' | 'right';
}

/** Width in device pixels of `text` drawn with the given options. */
export function measurePixelText(
  text: string,
  opts: Pick<PixelTextOptions, 'scale' | 'spacing'> = {}
): number {
  const scale = Math.max(1, Math.floor(opts.scale ?? 1));
  const spacing = opts.spacing ?? 1;
  if (text.length === 0) return 0;
  const advance = (FONT_WIDTH + spacing) * scale;
  return text.length * advance - spacing * scale;
}

/** Height in device pixels of a single font line. */
export function pixelTextHeight(scale = 1): number {
  return FONT_HEIGHT * Math.max(1, Math.floor(scale));
}

/**
 * Draws blocky retro text onto a 2D canvas context. Glyph pixels are drawn as
 * axis-aligned rects so the result stays perfectly crisp at any integer scale.
 */
export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  opts: PixelTextOptions = {}
): number {
  const scale = Math.max(1, Math.floor(opts.scale ?? 1));
  const spacing = opts.spacing ?? 1;
  const outline = opts.outline ?? null;
  const align = opts.align ?? 'left';
  const upper = text.toUpperCase();
  const totalWidth = measurePixelText(upper, { scale, spacing });

  let startX = Math.round(x);
  if (align === 'center') startX = Math.round(x - totalWidth / 2);
  else if (align === 'right') startX = Math.round(x - totalWidth);

  const advance = (FONT_WIDTH + spacing) * scale;
  const px = scale;

  const plot = (gx: number, gy: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.fillRect(gx, gy, px, px);
  };

  for (let i = 0; i < upper.length; i++) {
    const glyph = GLYPH_ROWS[upper[i]] ?? GLYPH_ROWS['?'];
    const cx = startX + i * advance;
    for (let row = 0; row < FONT_HEIGHT; row++) {
      const line = glyph[row];
      for (let col = 0; col < FONT_WIDTH; col++) {
        if (line[col] !== '#') continue;
        const gx = cx + col * px;
        const gy = y + row * px;
        if (outline) {
          // 8-direction 1px outline for readable text over the world.
          plot(gx - px, gy - px, outline);
          plot(gx, gy - px, outline);
          plot(gx + px, gy - px, outline);
          plot(gx - px, gy, outline);
          plot(gx + px, gy, outline);
          plot(gx - px, gy + px, outline);
          plot(gx, gy + px, outline);
          plot(gx + px, gy + px, outline);
        }
        plot(gx, gy, color);
      }
    }
  }

  return totalWidth;
}

// ---------------------------------------------------------------------------
// Time / par / grade formatting
// ---------------------------------------------------------------------------

export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * SMB-style timer. Under a minute it reads `SS.CC`, at or above a minute it
 * gains a leading `M:` (`M:SS.CC`). Centiseconds are always two digits.
 */
export function formatHudTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  const centis = Math.floor((safe % 1) * 100);
  const ss = secs.toFixed(2).padStart(5, '0');
  if (mins === 0) return `${ss}`;
  return `${mins}:${ss.padStart(5, '0')}`;
}

/** Par times read as a clean `SS.CC` / `M:SS.CC` in the same voice. */
export function formatParTime(seconds: number): string {
  if (seconds <= 0) return '--.--';
  return formatHudTime(seconds);
}

/** Grade thresholds as multipliers of the par time (A+ === par or faster). */
export const GRADE_THRESHOLDS: ReadonlyArray<{ grade: Grade; max: number }> = [
  { grade: 'A+', max: 1.0 },
  { grade: 'A', max: 1.2 },
  { grade: 'B', max: 1.4 },
  { grade: 'C', max: 1.6 },
  { grade: 'D', max: 1.8 },
];

/** Resolve the letter grade for a run time against the level par time. */
export function computeGrade(elapsed: number, par: number): Grade {
  if (par <= 0) return 'F';
  const ratio = elapsed / par;
  for (const band of GRADE_THRESHOLDS) {
    if (ratio <= band.max) return band.grade;
  }
  return 'F';
}

/** True when the run is still on pace for the A+ (pink) grade. */
export function isOnAPlusPace(elapsed: number, par: number): boolean {
  return par > 0 && elapsed <= par;
}

// ---------------------------------------------------------------------------
// Asset loading
// ---------------------------------------------------------------------------

export interface HudAssets {
  meathuds: HTMLImageElement;
  replayhud: HTMLImageElement;
  pausemenu: HTMLImageElement;
  retropause: HTMLImageElement;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load HUD asset: ${src}`));
    img.src = src;
  });
}

let cachedAssets: Promise<HudAssets> | null = null;

/** Loads (once, cached) every texture the authentic HUD needs. */
export function loadHudAssets(): Promise<HudAssets> {
  if (!cachedAssets) {
    cachedAssets = Promise.all([
      loadImage(ATLAS_TEXTURE_PATH.meathuds),
      loadImage(ATLAS_TEXTURE_PATH.replayhud),
      loadImage(ATLAS_TEXTURE_PATH.pausemenu),
      loadImage(ATLAS_TEXTURE_PATH.retropause),
    ]).then(([meathuds, replayhud, pausemenu, retropause]) => ({
      meathuds,
      replayhud,
      pausemenu,
      retropause,
    }));
    cachedAssets.catch(() => {
      cachedAssets = null;
    });
  }
  return cachedAssets;
}

// ---------------------------------------------------------------------------
// Sprite drawing
// ---------------------------------------------------------------------------

export interface DrawSpriteOptions {
  /** preserve aspect ratio and fit inside dw x dh. Defaults to false. */
  fit?: boolean;
  /** nearest-neighbour when true, smooth when false. Defaults to atlas value. */
  pixelArt?: boolean;
  /** global alpha applied for the blit. Defaults to current ctx alpha. */
  alpha?: number;
  /** flip horizontally (e.g. mirroring Meat Boy). */
  flipX?: boolean;
}

/**
 * Blits one frame from a source sheet into a destination rect.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  frame: SpriteFrame,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  opts: DrawSpriteOptions = {}
): void {
  let outW = dw;
  let outH = dh;
  if (opts.fit) {
    const scale = Math.min(dw / frame.w, dh / frame.h);
    outW = frame.w * scale;
    outH = frame.h * scale;
    dx += (dw - outW) / 2;
    dy += (dh - outH) / 2;
  }

  const prevSmoothing = ctx.imageSmoothingEnabled;
  const prevAlpha = ctx.globalAlpha;
  ctx.imageSmoothingEnabled = !(opts.pixelArt ?? true);
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;

  if (opts.flipX) {
    ctx.save();
    ctx.translate(Math.round(dx + outW), Math.round(dy));
    ctx.scale(-1, 1);
    ctx.drawImage(img, frame.x, frame.y, frame.w, frame.h, 0, 0, Math.round(outW), Math.round(outH));
    ctx.restore();
  } else {
    ctx.drawImage(
      img,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      Math.round(dx),
      Math.round(dy),
      Math.round(outW),
      Math.round(outH)
    );
  }

  ctx.imageSmoothingEnabled = prevSmoothing;
  ctx.globalAlpha = prevAlpha;
}

// ---------------------------------------------------------------------------
// Full in-game HUD render
// ---------------------------------------------------------------------------

export interface SmbHudState {
  levelName: string;
  chapterNumber: number;
  isDarkWorld: boolean;
  elapsedTime: number;
  parTime: number;
  deathCount: number;
  hasBandage: boolean;
  bandageCollected: boolean;
  isReplay: boolean;
}

export interface SmbHudLayout {
  width: number;
  height: number;
  /** device scale for the pixel font (defaults to 2). */
  textScale?: number;
  /** scale for the big timer (defaults to 3). */
  timerScale?: number;
  /** reference width the layout was authored against (480 = game logical res). */
  designWidth?: number;
}

export const HUD_BAR_HEIGHT = 48;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function drawPanel(ctx: CanvasRenderingContext2D, r: Rect): void {
  ctx.fillStyle = SMB_PALETTE.hudBacking;
  ctx.fillRect(r.x + 1, r.y, r.w - 2, r.h);
  // 2px dark-red top & bottom rule reads as SMB's chunky bevel.
  ctx.fillStyle = SMB_PALETTE.darkRed;
  ctx.fillRect(r.x, r.y, r.w, 2);
  ctx.fillRect(r.x, r.y + r.h - 2, r.w, 2);
}

/** Renders the complete authentic top HUD bar into a canvas context. */
export function drawSmbHud(
  ctx: CanvasRenderingContext2D,
  state: SmbHudState,
  assets: HudAssets,
  layout: SmbHudLayout
): void {
  const W = layout.width;
  const H = layout.height;
  const design = layout.designWidth ?? 480;
  const s = layout.textScale ?? 2;
  const timerScale = layout.timerScale ?? 3;
  const compact = W < design * 1.15;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Backing bar
  ctx.fillStyle = SMB_PALETTE.hudBacking;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = SMB_PALETTE.darkRed;
  ctx.fillRect(0, H - 2, W, 2);

  // ---- Left: chapter badge + level name -------------------------------
  const padX = 6;
  const cy = Math.round(H / 2);

  const tagText = state.isReplay ? 'RPL' : `${state.chapterNumber}${state.isDarkWorld ? 'X' : ''}`;
  const tagFontScale = s;
  const tagW = measurePixelText(tagText, { scale: tagFontScale }) + 8;
  const tagH = pixelTextHeight(tagFontScale) + 6;
  const tagRect: Rect = { x: padX, y: cy - tagH / 2, w: tagW, h: tagH };
  ctx.fillStyle = state.isDarkWorld ? '#3b0764' : SMB_PALETTE.darkRed;
  ctx.fillRect(tagRect.x, tagRect.y, tagRect.w, tagRect.h);
  ctx.fillStyle = SMB_PALETTE.ink;
  ctx.fillRect(tagRect.x, tagRect.y, tagRect.w, 1);
  ctx.fillRect(tagRect.x, tagRect.y + tagRect.h - 1, tagRect.w, 1);
  drawPixelText(
    ctx,
    tagText,
    tagRect.x + tagRect.w / 2,
    cy - Math.round(pixelTextHeight(tagFontScale) / 2),
    SMB_PALETTE.white,
    { scale: tagFontScale, align: 'center' }
  );

  const nameX = tagRect.x + tagRect.w + 8;
  const name = normalizeUpper(state.levelName);
  // Truncate to keep the timer centred when a long name is present.
  const maxNameChars = compact ? 14 : 28;
  const trimmedName = name.length > maxNameChars ? `${name.slice(0, maxNameChars - 1)}` : name;
  drawPixelText(ctx, trimmedName, nameX, cy - Math.round(pixelTextHeight(s) / 2), SMB_PALETTE.white, {
    scale: s,
    outline: SMB_PALETTE.ink,
  });

  // ---- Centre: clock + timer + par comparison -------------------------
  const timerText = formatHudTime(state.elapsedTime);
  const timerW = measurePixelText(timerText, { scale: timerScale });
  const clockH = Math.max(18, pixelTextHeight(timerScale) + 8);
  const clockFrame = HUD_ATLASES.meathuds.frames.clock;
  const clockW = Math.round((clockFrame.w / clockFrame.h) * clockH);
  const centreBlockW = clockW + 6 + timerW;

  const hasPar = state.parTime > 0;
  const parFontScale = Math.max(1, s - 1);
  const grade = computeGrade(state.elapsedTime, state.parTime);
  const parSegment = hasPar ? `PAR ${formatParTime(state.parTime)}` : '';
  const gradeSegment = hasPar ? `GRADE ${grade}` : '';
  const parW = measurePixelText(parSegment, { scale: parFontScale });
  const gradeW = measurePixelText(gradeSegment, { scale: parFontScale });
  const parRowW = parW + 8 + gradeW;
  const centreW = Math.max(centreBlockW, parRowW);

  const centreX = Math.round((W - centreW) / 2);
  const timerTop = hasPar ? 4 : cy - Math.round(clockH / 2);
  const timerTextTop = timerTop + Math.round((clockH - pixelTextHeight(timerScale)) / 2);

  drawSprite(ctx, assets.meathuds, clockFrame, centreX, timerTop, clockW, clockH, {
    pixelArt: true,
    alpha: hasPar ? 1 : 0.6,
  });
  drawPixelText(
    ctx,
    timerText,
    centreX + clockW + 6,
    timerTextTop,
    SMB_PALETTE.white,
    { scale: timerScale, outline: SMB_PALETTE.ink }
  );

  if (hasPar) {
    const grade = computeGrade(state.elapsedTime, state.parTime);
    const paceColor = isOnAPlusPace(state.elapsedTime, state.parTime)
      ? GRADE_COLORS['A+']
      : SMB_PALETTE.lightGrey;
    drawPixelText(
      ctx,
      `PAR ${formatParTime(state.parTime)}`,
      centreX,
      H - pixelTextHeight(parFontScale) - 5,
      paceColor,
      { scale: parFontScale, outline: SMB_PALETTE.ink }
    );
    const gradeLabel = `GRADE`;
    const gradeX = centreX + measurePixelText(gradeLabel, { scale: parFontScale }) + 4;
    drawPixelText(ctx, gradeLabel, gradeX, H - pixelTextHeight(parFontScale) - 5, SMB_PALETTE.grey, {
      scale: parFontScale,
      outline: SMB_PALETTE.ink,
    });
    void grade;
  }

  // ---- Right: bandage + deaths ----------------------------------------
  const rightPad = 6;
  const iconH = Math.max(20, pixelTextHeight(s) + 10);

  // Death counter badge (Meat Boy head + count)
  const deathCountText = `${state.deathCount}`;
  const deathTextW = measurePixelText(deathCountText, { scale: s });
  const headFrame = HUD_ATLASES.replayhud.frames.meatHead;
  const headW = Math.round((headFrame.w / headFrame.h) * iconH);
  const deathBlockW = headW + 4 + measurePixelText('X', { scale: s }) + 3 + deathTextW;
  const deathX = W - rightPad - deathBlockW;
  const iconY = cy - Math.round(iconH / 2);
  drawSprite(ctx, assets.replayhud, headFrame, deathX, iconY, headW, iconH, { pixelArt: true });
  let cursorX = deathX + headW + 4;
  drawPixelText(ctx, 'X', cursorX, cy - Math.round(pixelTextHeight(s) / 2), SMB_PALETTE.grey, {
    scale: s,
    outline: SMB_PALETTE.ink,
  });
  cursorX += measurePixelText('X', { scale: s }) + 3;
  drawPixelText(
    ctx,
    deathCountText,
    cursorX,
    cy - Math.round(pixelTextHeight(s) / 2),
    SMB_PALETTE.white,
    { scale: s, outline: SMB_PALETTE.ink }
  );

  // Bandage indicator badge (only when the level actually has one)
  if (state.hasBandage) {
    const bandageFrame = HUD_ATLASES.meathuds.frames.bandage;
    const bandW = Math.round((bandageFrame.w / bandageFrame.h) * iconH);
    const bx = deathX - bandW - 10;
    drawSprite(ctx, assets.meathuds, bandageFrame, bx, iconY, bandW, iconH, {
      pixelArt: true,
      alpha: state.bandageCollected ? 1 : 0.3,
    });
    if (state.bandageCollected) {
      drawPixelText(ctx, 'SAVED', bx + bandW / 2, cy - Math.round(pixelTextHeight(1) / 2), SMB_PALETTE.pink, {
        scale: 1,
        align: 'center',
        outline: SMB_PALETTE.ink,
      });
    }
  }

  ctx.restore();
}

function normalizeUpper(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9 .:!'+\-\/<>*]/g, ' ');
}

// ---------------------------------------------------------------------------
// Pause overlay render
// ---------------------------------------------------------------------------

export interface PauseOverlayOptions {
  width: number;
  height: number;
  /** 0..1 retro white flash (retropause.png), defaults 0. */
  flash?: number;
}

export const PAUSE_MENU_ITEMS = ['RESUME', 'RESTART LEVEL', 'CHANGE CHARACTER', 'LEVEL SELECT', 'QUIT TO TITLE'] as const;

/**
 * Renders the authentic SMB pause overlay: a dimmed world, the tuxedo
 * characters holding their blank sign (used as the menu panel) and the retro
 * pause white flash.
 */
export function drawPauseOverlay(
  ctx: CanvasRenderingContext2D,
  assets: HudAssets,
  selectedIndex: number,
  opts: PauseOverlayOptions
): void {
  const { width: W, height: H } = opts;
  ctx.save();

  // Dim the frozen world.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
  ctx.fillRect(0, 0, W, H);

  // Retro pause flash (retropause.png is a flat white swatch).
  if (opts.flash && opts.flash > 0) {
    ctx.globalAlpha = Math.min(0.85, opts.flash);
    ctx.drawImage(assets.retropause, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  // Pause-menu illustration, anchored bottom-centre like the original.
  const menuH = Math.min(H * 0.62, W * 0.7);
  const menuW = menuH;
  const mx = (W - menuW) / 2;
  const my = H - menuH;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(assets.pausemenu, mx, my, menuW, menuH);
  ctx.imageSmoothingEnabled = false;

  // Title
  const titleScale = Math.max(2, Math.floor(W / 180));
  drawPixelText(ctx, 'PAUSED', W / 2, Math.max(10, H * 0.06), SMB_PALETTE.white, {
    scale: titleScale,
    align: 'center',
    outline: SMB_PALETTE.ink,
  });

  // Menu list, drawn over the sign board.
  const itemScale = Math.max(1, titleScale - 1);
  const itemH = pixelTextHeight(itemScale) + 8;
  const listTop = my + menuH * 0.24;
  for (let i = 0; i < PAUSE_MENU_ITEMS.length; i++) {
    const selected = i === selectedIndex;
    const y = listTop + i * itemH;
    const label = selected ? `> ${PAUSE_MENU_ITEMS[i]}` : PAUSE_MENU_ITEMS[i];
    drawPixelText(ctx, label, W / 2, y, selected ? SMB_PALETTE.darkRed : SMB_PALETTE.ink, {
      scale: itemScale,
      align: 'center',
      outline: SMB_PALETTE.white,
    });
  }

  ctx.restore();
}
