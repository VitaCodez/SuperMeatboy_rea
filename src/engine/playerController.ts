// 1:1 Super Meat Boy Player Controller & State Machine
// Movement physics accurately derived from binary .props and SMB specs
import { PlayerState, InputState, LevelData, CharacterProps, Entity, DeathCause } from './types';
import { PhysicsEngine, Box } from './physics';

// Preset characters with exact SMB binary proportions
export const CHARACTER_PRESETS: Record<string, CharacterProps> = {
  meatboy: {
    id: 'meatboy',
    name: 'Meat Boy',
    runSpeed: 250.0,
    sprintSpeed: 350.0,
    acceleration: 1800.0,
    airAcceleration: 1400.0,
    jumpImpulse: -550.0,
    jumpHoldGravity: 900.0,
    normalGravity: 1850.0,
    maxFallSpeed: 800.0,
    wallSlideSpeed: 120.0,
    wallJumpX: 380.0,
    wallJumpY: -500.0,
    wallJumpControlLockout: 0.15, // ~9 frames
    color: '#c41d1d',
    unlocked: true,
    specialAbility: 'none'
  },
  bandagegirl: {
    id: 'bandagegirl',
    name: 'Bandage Girl',
    runSpeed: 250.0,
    sprintSpeed: 350.0,
    acceleration: 1850.0,
    airAcceleration: 1450.0,
    jumpImpulse: -550.0,
    jumpHoldGravity: 850.0,
    normalGravity: 1800.0,
    maxFallSpeed: 800.0,
    wallSlideSpeed: 120.0,
    wallJumpX: 380.0,
    wallJumpY: -500.0,
    wallJumpControlLockout: 0.14,
    color: '#ff7597',
    unlocked: true,
    specialAbility: 'none'
  },
  commander_video: {
    id: 'commander_video',
    name: 'Commander Video',
    runSpeed: 250.0,
    sprintSpeed: 350.0,
    acceleration: 1700.0,
    airAcceleration: 1300.0,
    jumpImpulse: -600.0,
    jumpHoldGravity: 800.0,
    normalGravity: 1850.0,
    maxFallSpeed: 800.0,
    wallSlideSpeed: 120.0,
    wallJumpX: 380.0,
    wallJumpY: -500.0,
    wallJumpControlLockout: 0.15,
    color: '#ffd166',
    unlocked: true,
    specialAbility: 'float',
    floatTimerMax: 1.1 // Hover/float glide for ~1.1s
  },
  flywrench: {
    id: 'flywrench',
    name: 'Flywrench',
    runSpeed: 260.0,
    sprintSpeed: 400.0,
    acceleration: 1900.0,
    airAcceleration: 1600.0,
    jumpImpulse: -550.0,
    jumpHoldGravity: 900.0,
    normalGravity: 1850.0,
    maxFallSpeed: 800.0,
    wallSlideSpeed: 120.0,
    wallJumpX: 380.0,
    wallJumpY: -500.0,
    wallJumpControlLockout: 0.15,
    color: '#06d6a0',
    unlocked: true,
    specialAbility: 'multi_flap',
    maxAirJumps: 8 // Multi-flap wing jumps in mid-air
  },
  kid: {
    id: 'kid',
    name: 'The Kid',
    runSpeed: 240.0,
    sprintSpeed: 300.0,
    acceleration: 1800.0,
    airAcceleration: 1500.0,
    jumpImpulse: -550.0,
    jumpHoldGravity: 900.0,
    normalGravity: 1850.0,
    maxFallSpeed: 800.0,
    wallSlideSpeed: 120.0,
    wallJumpX: 380.0,
    wallJumpY: -500.0,
    wallJumpControlLockout: 0.15,
    color: '#118ab2',
    unlocked: true,
    specialAbility: 'double_jump',
    maxAirJumps: 1
  },
  ogmo: {
    id: 'ogmo',
    name: 'Ogmo',
    runSpeed: 230.0,
    sprintSpeed: 300.0,
    acceleration: 2000.0,
    airAcceleration: 1600.0,
    jumpImpulse: -500.0,
    jumpHoldGravity: 850.0,
    normalGravity: 1800.0,
    maxFallSpeed: 800.0,
    wallSlideSpeed: 120.0,
    wallJumpX: 380.0,
    wallJumpY: -500.0,
    wallJumpControlLockout: 0.14,
    color: '#a05195',
    unlocked: true,
    specialAbility: 'double_jump',
    maxAirJumps: 1
  },
  vvvvvv: {
    id: 'vvvvvv',
    name: 'Captain Viridian',
    runSpeed: 250.0,
    sprintSpeed: 350.0,
    acceleration: 1800.0,
    airAcceleration: 1400.0,
    jumpImpulse: -550.0,
    jumpHoldGravity: 900.0,
    normalGravity: 1850.0,
    maxFallSpeed: 800.0,
    wallSlideSpeed: 120.0,
    wallJumpX: 380.0,
    wallJumpY: -500.0,
    wallJumpControlLockout: 0.15,
    color: '#4cc9f0',
    unlocked: true,
    specialAbility: 'gravity_flip'
  },
  gish: {
    id: 'gish',
    name: 'Gish',
    runSpeed: 250.0,
    sprintSpeed: 350.0,
    acceleration: 1800.0,
    airAcceleration: 1400.0,
    jumpImpulse: -550.0,
    jumpHoldGravity: 900.0,
    normalGravity: 1850.0,
    maxFallSpeed: 800.0,
    wallSlideSpeed: 75.0, // Sticky wall slide
    wallJumpX: 380.0,
    wallJumpY: -500.0,
    wallJumpControlLockout: 0.15,
    color: '#432818',
    unlocked: true,
    specialAbility: 'sticky'
  },
  tofuboy: {
    id: 'tofuboy',
    name: 'Tofu Boy',
    runSpeed: 130.0,
    sprintSpeed: 200.0,
    acceleration: 1000.0,
    airAcceleration: 700.0,
    jumpImpulse: -350.0,
    jumpHoldGravity: 1200.0,
    normalGravity: 1900.0,
    maxFallSpeed: 800.0,
    wallSlideSpeed: 160.0,
    wallJumpX: 200.0,
    wallJumpY: -350.0,
    wallJumpControlLockout: 0.2,
    color: '#eae2b7',
    unlocked: true,
    specialAbility: 'none'
  }
};

export const DEFAULT_MEATBOY_PROPS = CHARACTER_PRESETS.meatboy;

/**
 * Parses raw float props array from character_props.json into typed CharacterProps
 */
export function parseCharacterProps(
  id: string,
  name: string,
  floats: number[],
  color: string = '#c41d1d'
): CharacterProps {
  const walkSpeed = floats[3] || 250;
  const sprintSpeed = floats[4] || 350;
  const jumpImpulse = floats[8] || -550;

  return {
    id,
    name,
    runSpeed: walkSpeed,
    sprintSpeed: sprintSpeed,
    acceleration: 1800,
    airAcceleration: 1400,
    jumpImpulse: jumpImpulse,
    jumpHoldGravity: 900,
    normalGravity: 1850,
    maxFallSpeed: 800,
    wallSlideSpeed: 120,
    wallJumpX: 380,
    wallJumpY: -500,
    wallJumpControlLockout: 0.15,
    color,
    unlocked: true,
    specialAbility: id === 'commander_video' ? 'float' :
      id === 'flywrench' ? 'multi_flap' :
      id === 'kid' || id === 'ogmo' ? 'double_jump' :
      id === 'vvvvvv' ? 'gravity_flip' : 'none',
    maxAirJumps: id === 'flywrench' ? 8 : (id === 'kid' || id === 'ogmo' ? 1 : 0),
    floatTimerMax: id === 'commander_video' ? 1.1 : undefined
  };
}

export class PlayerController {
  public state: PlayerState;
  public props: CharacterProps;

  // Constants for timing
  public static readonly COYOTE_FRAMES = 6;
  public static readonly JUMP_BUFFER_FRAMES = 6;
  public static readonly COYOTE_DURATION = (1 / 60) * 6; // ~0.10s
  public static readonly JUMP_BUFFER_DURATION = (1 / 60) * 6; // ~0.10s

  constructor(startX: number, startY: number, props: CharacterProps = DEFAULT_MEATBOY_PROPS) {
    this.props = props;
    this.state = this.createInitialState(startX, startY);
  }

  public reset(startX: number, startY: number): void {
    this.state = this.createInitialState(startX, startY);
  }

  public setCharacter(characterOrId: string | CharacterProps): void {
    if (typeof characterOrId === 'string') {
      const found = CHARACTER_PRESETS[characterOrId.toLowerCase()] ?? DEFAULT_MEATBOY_PROPS;
      this.props = found;
    } else {
      this.props = characterOrId;
    }

    // Reset character-specific abilities
    this.state.airJumpsLeft = this.props.maxAirJumps ?? 0;
    this.state.floatTimer = this.props.floatTimerMax ?? 0;
    this.state.gravityInverted = false;
  }

  private createInitialState(x: number, y: number): PlayerState {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      width: 14,
      height: 14,
      facing: 1,
      isGrounded: false,
      isWallSliding: false,
      wallDir: 0,
      isSprinting: false,
      isJumping: false,
      jumpHeld: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      wallJumpLockoutTimer: 0,
      squashX: 1,
      squashY: 1,
      isDead: false,
      isWin: false,
      deathTimer: 0,
      airJumpsLeft: this.props.maxAirJumps ?? 0,
      floatTimer: this.props.floatTimerMax ?? 0,
      gravityInverted: false
    };
  }

  /**
   * Main 60Hz Physics & Movement update tick
   */
  public update(
    input: InputState,
    level: LevelData,
    onBloodSplatter?: (x: number, y: number, count: number, speed: number) => void,
    onSound?: (sfx: string) => void,
    onSkidDust?: (x: number, y: number, dir: number) => void
  ): void {
    const dt = PhysicsEngine.DT;

    if (this.state.isDead) {
      this.state.deathTimer += dt;
      return;
    }

    if (this.state.isWin) {
      return;
    }

    // 1. TIMERS (Jump Buffer & Coyote Time)
    if (input.jumpPressed) {
      this.state.jumpBufferTimer = PlayerController.JUMP_BUFFER_DURATION;
    } else {
      this.state.jumpBufferTimer = Math.max(0, this.state.jumpBufferTimer - dt);
    }

    if (this.state.isGrounded) {
      this.state.coyoteTimer = PlayerController.COYOTE_DURATION;
      this.state.airJumpsLeft = this.props.maxAirJumps ?? 0;
      this.state.floatTimer = this.props.floatTimerMax ?? 0;
    } else {
      this.state.coyoteTimer = Math.max(0, this.state.coyoteTimer - dt);
    }

    this.state.wallJumpLockoutTimer = Math.max(0, this.state.wallJumpLockoutTimer - dt);
    this.state.isSprinting = input.sprint;
    this.state.jumpHeld = input.jump;

    // 2. HORIZONTAL MOVEMENT & SKID FRICTION
    const targetMaxSpeed = input.sprint ? this.props.sprintSpeed : this.props.runSpeed;
    const accel = this.state.isGrounded ? this.props.acceleration : this.props.airAcceleration;

    if (this.state.wallJumpLockoutTimer <= 0) {
      let moveDir = 0;
      if (input.left) moveDir -= 1;
      if (input.right) moveDir += 1;

      if (moveDir !== 0) {
        this.state.facing = moveDir as 1 | -1;
        const targetVx = moveDir * targetMaxSpeed;

        // Snappy Skid Friction when reversing direction
        const isReversing = Math.sign(this.state.vx) !== 0 && Math.sign(this.state.vx) !== moveDir;
        if (isReversing) {
          // Sharp skid deceleration (accel * 2.6)
          const skidDecel = accel * 2.6;
          this.state.vx = this.approach(this.state.vx, targetVx, skidDecel * dt);

          // Skid dust / blood scraping hook
          if (this.state.isGrounded && Math.abs(this.state.vx) > 90) {
            onBloodSplatter?.(this.state.x + 7, this.state.y + 14, 2, 40);
            onSkidDust?.(this.state.x + (moveDir > 0 ? 0 : 14), this.state.y + 14, -moveDir);
          }
        } else {
          // Normal acceleration towards target speed
          this.state.vx = this.approach(this.state.vx, targetVx, accel * dt);
        }
      } else {
        // Natural friction deceleration when no input held
        const friction = this.state.isGrounded ? this.props.acceleration * 1.5 : this.props.airAcceleration * 0.45;
        this.state.vx = this.approach(this.state.vx, 0, friction * dt);
      }
    }

    // 3. JUMP LOGIC (Ground Jump & Coyote Time)
    const canGroundJump = (this.state.isGrounded || this.state.coyoteTimer > 0) && !this.state.isJumping;
    if (this.state.jumpBufferTimer > 0 && canGroundJump) {
      const impulse = this.state.gravityInverted ? -this.props.jumpImpulse : this.props.jumpImpulse;
      this.state.vy = impulse;
      this.state.isGrounded = false;
      this.state.isJumping = true;
      this.state.coyoteTimer = 0;
      this.state.jumpBufferTimer = 0;

      // Vertical stretch on jump takeoff
      this.state.squashX = 0.65;
      this.state.squashY = 1.45;

      onSound?.('jump');
      onBloodSplatter?.(this.state.x + 7, this.state.y + 14, 4, 60);
    }
    // SPECIAL AIR ABILITIES (Double Jump / Multi-Flap / Float / Gravity Flip)
    else if (this.state.jumpBufferTimer > 0 && !this.state.isGrounded && this.state.coyoteTimer <= 0) {
      if (this.props.specialAbility === 'double_jump' && (this.state.airJumpsLeft ?? 0) > 0) {
        // The Kid / Ogmo Double Jump
        this.state.vy = this.props.jumpImpulse * 0.95;
        this.state.airJumpsLeft = (this.state.airJumpsLeft ?? 1) - 1;
        this.state.jumpBufferTimer = 0;
        this.state.isJumping = true;
        this.state.squashX = 0.7;
        this.state.squashY = 1.4;
        onSound?.('jump');
        onBloodSplatter?.(this.state.x + 7, this.state.y + 14, 3, 50);
      } else if (this.props.specialAbility === 'multi_flap' && (this.state.airJumpsLeft ?? 0) > 0) {
        // Flywrench Multi-Flap
        this.state.vy = Math.min(this.state.vy * 0.25, 0) - 390;
        this.state.airJumpsLeft = (this.state.airJumpsLeft ?? 1) - 1;
        this.state.jumpBufferTimer = 0;
        this.state.isJumping = true;
        this.state.squashX = 0.6;
        this.state.squashY = 1.5;
        onSound?.('flap');
      } else if (this.props.specialAbility === 'gravity_flip') {
        // Captain Viridian Gravity Flip
        this.state.gravityInverted = !this.state.gravityInverted;
        this.state.vy = this.state.gravityInverted ? -200 : 200;
        this.state.jumpBufferTimer = 0;
        this.state.squashX = 0.75;
        this.state.squashY = 1.35;
        onSound?.('flip');
      }
    }

    // 4. WALL SLIDE & WALL JUMP
    if (!this.state.isGrounded && this.state.wallDir !== 0) {
      // Wall slide downward friction
      const isFalling = this.state.vy > 0;
      if (isFalling) {
        this.state.isWallSliding = true;
        this.state.vy = Math.min(this.state.vy, this.props.wallSlideSpeed);

        // Wall slide scraping blood / dust
        if (Math.random() < 0.3) {
          const bloodX = this.state.wallDir === -1 ? this.state.x : this.state.x + this.state.width;
          onBloodSplatter?.(bloodX, this.state.y + Math.random() * 12, 1, 20);
        }
      }

      // Wall Jump Impulse
      if (this.state.jumpBufferTimer > 0) {
        // Powerful diagonal push-off away from the wall
        this.state.vx = -this.state.wallDir * this.props.wallJumpX;
        this.state.vy = this.props.wallJumpY;
        this.state.facing = -this.state.wallDir as 1 | -1;

        // Lock horizontal steering temporarily so Meat Boy cleanly kicks off
        this.state.wallJumpLockoutTimer = this.props.wallJumpControlLockout;
        this.state.jumpBufferTimer = 0;
        this.state.isJumping = true;
        this.state.isWallSliding = false;

        // Squash & stretch on wall jump
        this.state.squashX = 0.7;
        this.state.squashY = 1.4;

        onSound?.('walljump');
        const wallKickX = this.state.wallDir === -1 ? this.state.x : this.state.x + this.state.width;
        onBloodSplatter?.(wallKickX, this.state.y + 7, 5, 80);
      }
    } else {
      this.state.isWallSliding = false;
    }

    // 5. VARIABLE JUMP GRAVITY & COMMANDER VIDEO FLOAT
    if (!this.state.isGrounded) {
      // Commander Video Float Jump
      const isFloating =
        this.props.specialAbility === 'float' &&
        this.state.jumpHeld &&
        (this.state.floatTimer ?? 0) > 0 &&
        this.state.vy > -150;

      if (isFloating) {
        this.state.floatTimer = Math.max(0, (this.state.floatTimer ?? 0) - dt);
        this.state.vy = 20; // gentle slow glide
      } else if (this.state.isWallSliding) {
        // While wall sliding, cap downward fall speed to wallSlideSpeed
        this.state.vy = Math.min(this.state.vy, this.props.wallSlideSpeed);
      } else {
        let gravity = this.props.normalGravity;
        // Rising jump hold bonus: Holding jump while ascending lowers gravity for higher reach
        if (this.state.isJumping && this.state.jumpHeld && this.state.vy < 0) {
          gravity = this.props.jumpHoldGravity;
        }

        const effectiveGravity = this.state.gravityInverted ? -gravity : gravity;
        this.state.vy += effectiveGravity * dt;

        // Snappy terminal fall velocity
        if (!this.state.gravityInverted) {
          this.state.vy = Math.min(this.state.vy, this.props.maxFallSpeed); if (this.state.isWallSliding) { this.state.vy = Math.min(this.state.vy, this.props.wallSlideSpeed); }
        } else {
          this.state.vy = Math.max(this.state.vy, -this.props.maxFallSpeed);
        }
      }
    }

    // Dynamic Vertical Stretch during fast falling
    if (this.state.vy > 400) {
      const fallRatio = Math.min(1, (this.state.vy - 400) / 400);
      this.state.squashY = Math.max(this.state.squashY, 1 + fallRatio * 0.25);
      this.state.squashX = Math.min(this.state.squashX, 1 - fallRatio * 0.15);
    }

    // 6. EXECUTE 4 SUB-STEPS OF SEPARATE AXIS PHYSICS
    this.executeSubsteps(level, onBloodSplatter, onSound);

    // 7. SQUASH & STRETCH SPRING RECOVERY
    this.state.squashX = this.approach(this.state.squashX, 1.0, 3.8 * dt);
    this.state.squashY = this.approach(this.state.squashY, 1.0, 3.8 * dt);
  }

  /**
   * Executes 4 sub-steps per frame to prevent tunneling
   */
  private executeSubsteps(
    level: LevelData,
    onBloodSplatter?: (x: number, y: number, count: number, speed: number) => void,
    onSound?: (sfx: string) => void
  ): void {
    const subDt = PhysicsEngine.SUB_DT;

    for (let step = 0; step < PhysicsEngine.SUB_STEPS; step++) {
      const box: Box = {
        x: this.state.x,
        y: this.state.y,
        width: this.state.width,
        height: this.state.height
      };

      const preVy = this.state.vy;
      const wasAirborne = !this.state.isGrounded;

      const result = PhysicsEngine.stepMovement(
        box,
        this.state.vx,
        this.state.vy,
        subDt,
        level,
        level.entities
      );

      this.state.x = result.x;
      this.state.y = result.y;
      this.state.vx = result.vx;
      this.state.vy = result.vy;
      this.state.wallDir = result.wallDir;

      // Ground landing resolution & squash impact
      if (result.isGrounded) {
        if (wasAirborne && preVy > 180) {
          // Landing impact squash
          this.state.squashX = 1.35;
          this.state.squashY = 0.68;
          onBloodSplatter?.(this.state.x + 7, this.state.y + 14, 3, 50);
          onSound?.('land');
        }
        this.state.isGrounded = true;
        this.state.isJumping = false;
      } else {
        this.state.isGrounded = false;
      }

      // Wall impact squash
      if (result.wallDir !== 0 && Math.abs(this.state.vx) > 150) {
        this.state.squashX = 0.8;
        this.state.squashY = 1.2;
      }

      // Hazard deaths (saws, spikes, lava)
      if (result.hazardHit) {
        this.kill(onBloodSplatter, onSound, this.mapHazardToDeathCause(result.hazardType));
        return;
      }

      // Level goal reached
      if (result.goalHit) {
        this.win(onSound);
        return;
      }

      // Bandage collected
      if (result.collectedBandage) {
        result.collectedBandage.collected = true;
        onSound?.('bandage');
      }

      // Crumble block stepped on
      if (result.crumbleHit) {
        if (result.crumbleHit.state === undefined || result.crumbleHit.state === 'idle') {
          result.crumbleHit.state = 'shaking';
          result.crumbleHit.timer = 0;
        }
      }
    }
  }

  /**
   * Meat Boy Gory Death: Massive crimson chunk explosion
   */
  public kill(
    onBloodSplatter?: (x: number, y: number, count: number, speed: number) => void,
    onSound?: (sfx: string) => void,
    cause: DeathCause = 'unknown'
  ): void {
    if (this.state.isDead) return;
    this.state.isDead = true;
    this.state.deathCause = cause;
    this.state.deathTimer = 0;
    this.state.vx = 0;
    this.state.vy = 0;
    onSound?.('death');

    // Massive 50-chunk gory splatter explosion
    onBloodSplatter?.(this.state.x + 7, this.state.y + 7, 50, 240);
  }

  /**
   * Maps a physics hazard type onto the replay system's death-cause taxonomy.
   */
  private mapHazardToDeathCause(hazard?: string): DeathCause {
    switch (hazard) {
      case 'saw':
        return 'saw';
      case 'spike':
      case 'needles':
        return 'needles';
      case 'lava':
        return 'lava';
      case 'generic':
        return 'fall';
      default:
        return 'unknown';
    }
  }

  /**
   * Meat Boy Goal Win
   */
  public win(onSound?: (sfx: string) => void): void {
    if (this.state.isWin) return;
    this.state.isWin = true;
    this.state.vx = 0;
    this.state.vy = 0;
    this.state.squashX = 1.25;
    this.state.squashY = 1.25;
    onSound?.('win');
  }

  private approach(current: number, target: number, maxDelta: number): number {
    if (current < target) {
      return Math.min(current + maxDelta, target);
    }
    return Math.max(current - maxDelta, target);
  }
}
