// Unified Input Manager for Super Meat Boy
// Supports Keyboard, Gamepad API, and Virtual Touch Controls

import { InputState } from './types';

export class InputManager {
  private static instance: InputManager;

  private keyboardState: { [key: string]: boolean } = {};
  private touchState: Partial<InputState> = {};
  private prevJumpHeld: boolean = false;
  private prevPauseHeld: boolean = false;
  private prevRestartHeld: boolean = false;

  private gamepadIndex: number | null = null;
  private onPauseCallbacks: Set<() => void> = new Set();
  private onRestartCallbacks: Set<() => void> = new Set();

  private constructor() {
    this.setupKeyboardListeners();
    this.setupGamepadListeners();
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling on game control keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      this.keyboardState[e.code] = true;

      if ((e.code === 'Escape' || e.code === 'KeyP') && !this.prevPauseHeld) {
        this.prevPauseHeld = true;
        this.triggerPause();
      }
      if (e.code === 'KeyR' && !this.prevRestartHeld) {
        this.prevRestartHeld = true;
        this.triggerRestart();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keyboardState[e.code] = false;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.prevPauseHeld = false;
      }
      if (e.code === 'KeyR') {
        this.prevRestartHeld = false;
      }
    });

    // Reset inputs if window loses focus
    window.addEventListener('blur', () => {
      this.keyboardState = {};
    });
  }

  private setupGamepadListeners() {
    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      console.log(`[InputManager] Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}`);
      this.gamepadIndex = e.gamepad.index;
    });

    window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
      console.log(`[InputManager] Gamepad disconnected from index ${e.gamepad.index}`);
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
      }
    });
  }

  public onPause(callback: () => void) {
    this.onPauseCallbacks.add(callback);
    return () => this.onPauseCallbacks.delete(callback);
  }

  public onRestart(callback: () => void) {
    this.onRestartCallbacks.add(callback);
    return () => this.onRestartCallbacks.delete(callback);
  }

  private triggerPause() {
    this.onPauseCallbacks.forEach((cb) => cb());
  }

  private triggerRestart() {
    this.onRestartCallbacks.forEach((cb) => cb());
  }

  public setTouchInput(key: keyof InputState, value: boolean) {
    this.touchState[key] = value;
  }

  public isGamepadConnected(): boolean {
    if (this.gamepadIndex !== null) return true;
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const gamepads = navigator.getGamepads();
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          this.gamepadIndex = i;
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Reads raw gamepad state if connected
   */
  private readGamepad(): Partial<InputState> {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return {};

    const gamepads = navigator.getGamepads();
    let pad: Gamepad | null = null;

    if (this.gamepadIndex !== null && gamepads[this.gamepadIndex]) {
      pad = gamepads[this.gamepadIndex];
    } else {
      // Find first active gamepad
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          pad = gamepads[i];
          this.gamepadIndex = i;
          break;
        }
      }
    }

    if (!pad) return {};

    const DEADZONE = 0.25;
    const axisX = pad.axes[0] ?? 0;
    const axisY = pad.axes[1] ?? 0;

    // Standard Gamepad Buttons:
    // 0: A (Jump)
    // 1: B
    // 2: X (Sprint)
    // 3: Y
    // 7: RT (Right Trigger - Sprint)
    // 8: Back / Select (Restart)
    // 9: Start (Pause)
    // 12: D-Pad Up
    // 13: D-Pad Down
    // 14: D-Pad Left
    // 15: D-Pad Right

    const btn = (index: number) => {
      const b = pad?.buttons[index];
      if (!b) return false;
      return typeof b === 'object' ? b.pressed || b.value > 0.5 : false;
    };

    const gpLeft = axisX < -DEADZONE || btn(14);
    const gpRight = axisX > DEADZONE || btn(15);
    const gpUp = axisY < -DEADZONE || btn(12);
    const gpDown = axisY > DEADZONE || btn(13);
    const gpJump = btn(0) || btn(12); // A button or D-pad Up
    const gpSprint = btn(2) || btn(7) || btn(5); // X button, RT, or RB
    const gpPause = btn(9); // Start
    const gpRestart = btn(8); // Select / Back

    if (gpPause && !this.prevPauseHeld) {
      this.prevPauseHeld = true;
      this.triggerPause();
    } else if (!gpPause && !this.keyboardState['Escape'] && !this.keyboardState['KeyP']) {
      this.prevPauseHeld = false;
    }

    if (gpRestart && !this.prevRestartHeld) {
      this.prevRestartHeld = true;
      this.triggerRestart();
    } else if (!gpRestart && !this.keyboardState['KeyR']) {
      this.prevRestartHeld = false;
    }

    return {
      left: gpLeft,
      right: gpRight,
      up: gpUp,
      down: gpDown,
      jump: gpJump,
      sprint: gpSprint,
      pause: gpPause,
      restart: gpRestart,
    };
  }

  /**
   * Returns current consolidated input state across Keyboard, Gamepad, and Touch.
   */
  public poll(): InputState {
    const k = this.keyboardState;
    const gp = this.readGamepad();
    const t = this.touchState;

    const left = Boolean(k['ArrowLeft'] || k['KeyA'] || gp.left || t.left);
    const right = Boolean(k['ArrowRight'] || k['KeyD'] || gp.right || t.right);
    const up = Boolean(k['ArrowUp'] || k['KeyW'] || gp.up || t.up);
    const down = Boolean(k['ArrowDown'] || k['KeyS'] || gp.down || t.down);
    const jumpHeld = Boolean(k['Space'] || k['KeyZ'] || k['ArrowUp'] || gp.jump || t.jump);
    const sprint = Boolean(k['ShiftLeft'] || k['ShiftRight'] || k['KeyX'] || gp.sprint || t.sprint);
    const pause = Boolean(k['Escape'] || k['KeyP'] || gp.pause || t.pause);
    const restart = Boolean(k['KeyR'] || gp.restart || t.restart);

    // Compute jump edge (just pressed this frame)
    const jumpPressed = jumpHeld && !this.prevJumpHeld;
    this.prevJumpHeld = jumpHeld;

    return {
      left,
      right,
      up,
      down,
      jump: jumpHeld,
      jumpPressed,
      sprint,
      pause,
      restart,
    };
  }

  /**
   * Resets internal edge triggers (useful when starting a level)
   */
  public resetEdges() {
    this.prevJumpHeld = false;
  }
}

export const inputManager = InputManager.getInstance();
