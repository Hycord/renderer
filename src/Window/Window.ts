import { Canvas, type CanvasRenderingContext2D } from "@napi-rs/canvas";
import sdl2, {
  SDL_INIT_VIDEO,
  SDL_WINDOWPOS_CENTERED,
  SDL_WINDOW_SHOWN,
  SDL_WINDOW_RESIZABLE,
  SDL_RENDERER_ACCELERATED,
  SDL_RENDERER_PRESENTVSYNC,
  SDL_PIXELFORMAT_ABGR8888,
  SDL_TEXTUREACCESS_STREAMING,
  SDL_QUIT,
  SDL_KEYDOWN,
  SDL_KEYUP,
  SDL_TEXTEDITING,
  SDL_TEXTINPUT,
  SDL_MOUSEMOTION,
  SDL_MOUSEBUTTONDOWN,
  SDL_MOUSEBUTTONUP,
  SDL_MOUSEWHEEL,
  SDL_WINDOWEVENT,
  SDL_WINDOWEVENT_RESIZED,
  SDLK_RETURN,
  SDLK_ESCAPE,
  SDLK_BACKSPACE,
  KMOD_SHIFT,
  SDL_TRUE,
  SDL_FALSE,
  sdlError,
  sdlKeyName,
} from "./SDL2";

// ── Public types ────────────────────────────────────────────────────────────

/**
 * Controls how the mouse cursor behaves.
 *
 * - `free`     – normal cursor, moves freely, absolute position reported.
 * - `locked`   – cursor hidden & locked to window center; only deltas reported.
 *                Ideal for FPS-style camera control.
 * - `confined` – cursor visible but cannot leave the window bounds.
 */
export type MouseMode = "free" | "locked" | "confined";

/**
 * Describes how events are handled in a particular state.
 *
 * - `keyboard`  – fire key events & track `isKeyDown()` (default: true).
 * - `mouse`     – fire mouse move / button / wheel events (default: true).
 * - `mouseMode` – cursor behaviour while this state is active (default: "free").
 */
export interface StateOptions {
  keyboard?: boolean;
  mouse?: boolean;
  mouseMode?: MouseMode;
}

export interface WindowOptions {
  /** Window title (default: "Render") */
  title?: string;
  /** Canvas / window width in pixels (default: 512) */
  width?: number;
  /** Canvas / window height in pixels (default: 512) */
  height?: number;
  /** Allow the user to resize the window (default: true) */
  resizable?: boolean;
  /** Log SDL events to the console (default: false) */
  debug?: boolean;
}

export type KeyCallback = (key: string, scancode: number) => void;
export type MouseMoveCallback = (
  x: number,
  y: number,
  dx: number,
  dy: number,
) => void;
export type MouseButtonCallback = (
  button: number,
  x: number,
  y: number,
) => void;
export type MouseWheelCallback = (dx: number, dy: number) => void;
export type ResizeCallback = (width: number, height: number) => void;

/** Called each frame while input mode is active with the current buffer. */
export type InputChangeCallback = (text: string) => void;
/** Called when the user commits the input (Enter). */
export type InputSubmitCallback = (text: string) => void;
/** Called when the user cancels the input (Escape). */
export type InputCancelCallback = (text: string) => void;

/** Callback fired when the active state changes. */
export type StateChangeCallback = (newState: string, oldState: string) => void;

// ── Window ──────────────────────────────────────────────────────────────────

/**
 * A native OS window backed by SDL2.
 *
 * Drawing happens on the same `@napi-rs/canvas` `Canvas` you already use –
 * every frame the pixel data is blitted to an SDL2 texture and presented.
 *
 * ```ts
 * const win = new Window({ title: "My Engine", width: 800, height: 600 });
 * const camera = new Camera(win.canvas, world);
 *
 * win.run((dt) => {
 *   world.update(dt);
 *   camera.render();
 * });
 * ```
 */
export class Window {
  // ── Canvas ──────────────────────────────────────────────────────────────
  private _canvas: Canvas;
  private _ctx: CanvasRenderingContext2D;

  // ── SDL handles (typed as `any` – Bun FFI returns numbers but expects
  //    the opaque Pointer branded type in function arguments) ──────────────
  private _sdlWindow: any = null;
  private _sdlRenderer: any = null;
  private _sdlTexture: any = null;

  // ── State ───────────────────────────────────────────────────────────────
  private _isOpen = false;
  private _width: number;
  private _height: number;

  // ── Debug ───────────────────────────────────────────────────────────────
  private _debug: boolean;

  // ── Input state ─────────────────────────────────────────────────────────
  private _keysDown = new Set<string>();
  private _mouseX = 0;
  private _mouseY = 0;

  // ── Event callbacks ─────────────────────────────────────────────────────
  private _onKeyDown: KeyCallback[] = [];
  private _onKeyUp: KeyCallback[] = [];
  private _onMouseMove: MouseMoveCallback[] = [];
  private _onMouseDown: MouseButtonCallback[] = [];
  private _onMouseUp: MouseButtonCallback[] = [];
  private _onMouseWheel: MouseWheelCallback[] = [];
  private _onResize: ResizeCallback[] = [];
  private _onClose: (() => void)[] = [];
  private _onStateChange: StateChangeCallback[] = [];

  // ── State management ────────────────────────────────────────────────────
  private _states = new Map<string, StateOptions>();
  private _activeState = "default";
  private _currentMouseMode: MouseMode = "free";

  // ── Text input mode ─────────────────────────────────────────────────────
  private _inputActive = false;
  private _inputBuffer = "";
  private _onInputChange: InputChangeCallback[] = [];
  private _onInputSubmit: InputSubmitCallback[] = [];
  private _onInputCancel: InputCancelCallback[] = [];

  // ── Event buffer (SDL_Event is 56 bytes; 64 for safety) ────────────────
  private _eventBuf = new Uint8Array(64);
  private _eventView = new DataView(this._eventBuf.buffer);

  constructor(options: WindowOptions = {}) {
    const {
      title = "Render",
      width = 512,
      height = 512,
      resizable = true,
      debug = false,
    } = options;

    this._width = width;
    this._height = height;
    this._debug = debug;

    // Initialise SDL2 video subsystem
    if (sdl2.symbols.SDL_Init(SDL_INIT_VIDEO) < 0) {
      throw new Error(`SDL_Init failed: ${sdlError()}`);
    }

    // Create the OS window
    let flags = SDL_WINDOW_SHOWN;
    if (resizable) flags |= SDL_WINDOW_RESIZABLE;

    const titleBuf = Buffer.from(title + "\0");

    this._sdlWindow = sdl2.symbols.SDL_CreateWindow(
      titleBuf,
      SDL_WINDOWPOS_CENTERED,
      SDL_WINDOWPOS_CENTERED,
      width,
      height,
      flags,
    ) as number;

    if (!this._sdlWindow) {
      sdl2.symbols.SDL_Quit();
      throw new Error(`SDL_CreateWindow failed: ${sdlError()}`);
    }

    // Hardware-accelerated renderer with vsync
    this._sdlRenderer = sdl2.symbols.SDL_CreateRenderer(
      this._sdlWindow,
      -1,
      SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC,
    ) as number;

    if (!this._sdlRenderer) {
      sdl2.symbols.SDL_DestroyWindow(this._sdlWindow);
      sdl2.symbols.SDL_Quit();
      throw new Error(`SDL_CreateRenderer failed: ${sdlError()}`);
    }

    // Streaming texture matching canvas dimensions
    this._sdlTexture = this.createTexture(width, height);

    // Canvas that the user draws on (same API as before)
    this._canvas = new Canvas(width, height);
    this._ctx = this._canvas.getContext("2d");

    this._isOpen = true;

    // Register the built-in "default" state (everything enabled, free mouse)
    this._states.set("default", { keyboard: true, mouse: true, mouseMode: "free" });
  }

  // ── State management ───────────────────────────────────────────────────

  /**
   * Register a named state with its input options.
   *
   * ```ts
   * window.addState("playing",  { keyboard: true, mouse: true, mouseMode: "locked" });
   * window.addState("paused",   { keyboard: true, mouse: false, mouseMode: "free" });
   * window.addState("chatting", { keyboard: false, mouse: false, mouseMode: "free" });
   * ```
   */
  addState(name: string, options: StateOptions): void {
    this._states.set(name, options);
  }

  /**
   * Switch to a named state. Immediately applies the state's mouse mode.
   *
   * When switching states the held-key set is cleared so stale keys
   * don't bleed between states.
   */
  setState(name: string): void {
    const opts = this._states.get(name);
    if (!opts) throw new Error(`Unknown window state: "${name}"`);
    const old = this._activeState;
    this._activeState = name;
    this._keysDown.clear();
    this.applyMouseMode(opts.mouseMode ?? "free");
    if (this._debug) console.log(`[SDL] STATE  "${old}" → "${name}"`);
    for (const cb of this._onStateChange) cb(name, old);
  }

  /** The name of the currently active state. */
  get state(): string {
    return this._activeState;
  }

  /** The resolved options for the current state. */
  private get stateOpts(): Required<StateOptions> {
    const raw = this._states.get(this._activeState) ?? {};
    return {
      keyboard: raw.keyboard ?? true,
      mouse: raw.mouse ?? true,
      mouseMode: raw.mouseMode ?? "free",
    };
  }

  /** Register a callback for state transitions. */
  onStateChange(cb: StateChangeCallback): void {
    this._onStateChange.push(cb);
  }

  /** The current mouse mode (derived from the active state). */
  get mouseMode(): MouseMode {
    return this._currentMouseMode;
  }

  // ── Accessors ───────────────────────────────────────────────────────────

  /** The `@napi-rs/canvas` Canvas — pass this to your Camera. */
  get canvas(): Canvas {
    return this._canvas;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  /** Current mouse X in window coordinates. */
  get mouseX(): number {
    return this._mouseX;
  }

  /** Current mouse Y in window coordinates. */
  get mouseY(): number {
    return this._mouseY;
  }

  /** Returns true while the named key is held down (event mode only). */
  isKeyDown(key: string): boolean {
    return this._keysDown.has(key);
  }

  /** Whether text input mode is currently active. */
  get inputActive(): boolean {
    return this._inputActive;
  }

  /** The current text buffer while input mode is active. */
  get inputBuffer(): string {
    return this._inputBuffer;
  }

  // ── Text input mode ────────────────────────────────────────────────────

  /**
   * Begin text input mode.
   *
   * While active **all** keyboard events are captured into a text buffer
   * instead of firing `onKeyDown` / `onKeyUp` callbacks.
   *
   * - **Enter** submits the buffer (fires `onInputSubmit`).
   * - **Shift+Enter** inserts a newline.
   * - **Escape** cancels (fires `onInputCancel`).
   * - **Backspace** deletes the last character.
   *
   * @param initial Optional starting text for the buffer.
   */
  beginInput(initial = ""): void {
    this._inputActive = true;
    this._inputBuffer = initial;
    this._keysDown.clear();
    if (this._debug) console.log(`[SDL] INPUT_BEGIN  initial="${initial}"`);
  }

  /** Programmatically cancel text input mode. */
  cancelInput(): void {
    if (!this._inputActive) return;
    this._inputActive = false;
    const text = this._inputBuffer;
    this._inputBuffer = "";
    if (this._debug) console.log(`[SDL] INPUT_CANCEL  text="${text}"`);
    for (const cb of this._onInputCancel) cb(text);
  }

  /** Register a callback for every buffer change during input mode. */
  onInputChange(cb: InputChangeCallback): void {
    this._onInputChange.push(cb);
  }

  /** Register a callback for when the user submits the input (Enter). */
  onInputSubmit(cb: InputSubmitCallback): void {
    this._onInputSubmit.push(cb);
  }

  /** Register a callback for when the user cancels the input (Escape). */
  onInputCancel(cb: InputCancelCallback): void {
    this._onInputCancel.push(cb);
  }

  // ── Event registration (event mode) ────────────────────────────────────

  onKeyDown(cb: KeyCallback): void {
    this._onKeyDown.push(cb);
  }
  onKeyUp(cb: KeyCallback): void {
    this._onKeyUp.push(cb);
  }
  onMouseMove(cb: MouseMoveCallback): void {
    this._onMouseMove.push(cb);
  }
  onMouseDown(cb: MouseButtonCallback): void {
    this._onMouseDown.push(cb);
  }
  onMouseUp(cb: MouseButtonCallback): void {
    this._onMouseUp.push(cb);
  }
  onMouseWheel(cb: MouseWheelCallback): void {
    this._onMouseWheel.push(cb);
  }
  onResize(cb: ResizeCallback): void {
    this._onResize.push(cb);
  }
  onClose(cb: () => void): void {
    this._onClose.push(cb);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  /** Signal the window to close at the end of the current frame. */
  close(): void {
    this._isOpen = false;
  }

  /**
   * Run the real-time render loop.
   *
   * `update(dt)` is called every frame with `dt` in **seconds** since the
   * previous frame.  After your callback returns the canvas contents are
   * automatically presented to the window.
   *
   * The loop exits when the user closes the window or you call `close()`.
   */
  run(update: (dt: number) => void): void {
    let lastTime = performance.now();

    while (this._isOpen) {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      this.pollEvents();
      if (!this._isOpen) break;

      update(dt);
      this.present();
    }

    this.destroy();
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private createTexture(w: number, h: number): number {
    const tex = sdl2.symbols.SDL_CreateTexture(
      this._sdlRenderer,
      SDL_PIXELFORMAT_ABGR8888,
      SDL_TEXTUREACCESS_STREAMING,
      w,
      h,
    ) as number;

    if (!tex) {
      throw new Error(`SDL_CreateTexture failed: ${sdlError()}`);
    }
    return tex;
  }

  /** Poll all pending SDL events and dispatch callbacks. */
  private pollEvents(): void {
    while (sdl2.symbols.SDL_PollEvent(this._eventBuf)) {
      const type = this._eventView.getUint32(0, true);

      switch (type) {
        case SDL_QUIT: {
          if (this._debug) console.log("[SDL] QUIT");
          for (const cb of this._onClose) cb();
          this._isOpen = false;
          break;
        }

        // ── Keyboard ───────────────────────────────────────────────────
        case SDL_KEYDOWN: {
          const sym = this._eventView.getInt32(20, true);
          const mod = this._eventView.getUint16(24, true);
          const name = sdlKeyName(sym);
          if (this._debug) console.log(`[SDL] KEY_DOWN  key=${name} sym=${sym} mod=0x${mod.toString(16)}`);

          if (this._inputActive) {
            // ── Input mode key handling ─────────────────────────────
            if (sym === SDLK_ESCAPE) {
              this.cancelInput();
            } else if (sym === SDLK_RETURN) {
              if (mod & KMOD_SHIFT) {
                this._inputBuffer += "\n";
                for (const cb of this._onInputChange) cb(this._inputBuffer);
              } else {
                const text = this._inputBuffer;
                this._inputActive = false;
                this._inputBuffer = "";
                if (this._debug) console.log(`[SDL] INPUT_SUBMIT  text="${text}"`);
                for (const cb of this._onInputSubmit) cb(text);
              }
            } else if (sym === SDLK_BACKSPACE) {
              if (this._inputBuffer.length > 0) {
                this._inputBuffer = this._inputBuffer.slice(0, -1);
                for (const cb of this._onInputChange) cb(this._inputBuffer);
              }
            }
          } else if (this.stateOpts.keyboard) {
            // ── Event mode (state allows keyboard) ──────────────────
            this._keysDown.add(name);
            for (const cb of this._onKeyDown) cb(name, sym);
          }
          break;
        }
        case SDL_KEYUP: {
          const sym = this._eventView.getInt32(20, true);
          const name = sdlKeyName(sym);
          if (this._debug) console.log(`[SDL] KEY_UP    key=${name} sym=${sym}`);

          if (!this._inputActive && this.stateOpts.keyboard) {
            this._keysDown.delete(name);
            for (const cb of this._onKeyUp) cb(name, sym);
          }
          break;
        }

        // ── Mouse ──────────────────────────────────────────────────────
        case SDL_MOUSEMOTION: {
          const x = this._eventView.getInt32(20, true);
          const y = this._eventView.getInt32(24, true);
          const dx = this._eventView.getInt32(28, true);
          const dy = this._eventView.getInt32(32, true);
          if (this._debug) console.log(`[SDL] MOUSE_MOTION  x=${x} y=${y} dx=${dx} dy=${dy}`);
          this._mouseX = x;
          this._mouseY = y;
          if (this.stateOpts.mouse) {
            for (const cb of this._onMouseMove) cb(x, y, dx, dy);
          }
          break;
        }
        case SDL_MOUSEBUTTONDOWN: {
          const button = this._eventBuf[16] ?? 0;
          const x = this._eventView.getInt32(20, true);
          const y = this._eventView.getInt32(24, true);
          if (this._debug) console.log(`[SDL] MOUSE_DOWN  button=${button} x=${x} y=${y}`);
          if (this.stateOpts.mouse) {
            for (const cb of this._onMouseDown) cb(button, x, y);
          }
          break;
        }
        case SDL_MOUSEBUTTONUP: {
          const button = this._eventBuf[16] ?? 0;
          const x = this._eventView.getInt32(20, true);
          const y = this._eventView.getInt32(24, true);
          if (this._debug) console.log(`[SDL] MOUSE_UP    button=${button} x=${x} y=${y}`);
          if (this.stateOpts.mouse) {
            for (const cb of this._onMouseUp) cb(button, x, y);
          }
          break;
        }
        case SDL_MOUSEWHEEL: {
          const dx = this._eventView.getInt32(16, true);
          const dy = this._eventView.getInt32(20, true);
          if (this._debug) console.log(`[SDL] MOUSE_WHEEL  dx=${dx} dy=${dy}`);
          if (this.stateOpts.mouse) {
            for (const cb of this._onMouseWheel) cb(dx, dy);
          }
          break;
        }

        // ── Window ─────────────────────────────────────────────────────
        case SDL_WINDOWEVENT: {
          const subtype = this._eventBuf[12];
          if (this._debug) console.log(`[SDL] WINDOW_EVENT  subtype=${subtype}`);
          if (subtype === SDL_WINDOWEVENT_RESIZED) {
            const w = this._eventView.getInt32(16, true);
            const h = this._eventView.getInt32(20, true);
            if (this._debug) console.log(`[SDL] WINDOW_RESIZED  ${w}x${h}`);
            this._width = w;
            this._height = h;

            // Recreate texture at the new size
            if (this._sdlTexture) {
              sdl2.symbols.SDL_DestroyTexture(this._sdlTexture);
            }
            this._sdlTexture = this.createTexture(w, h);

            // Resize canvas to match
            (this._canvas as any).width = w;
            (this._canvas as any).height = h;
            this._ctx = this._canvas.getContext("2d");

            for (const cb of this._onResize) cb(w, h);
          }
          break;
        }

        // ── Text input (fired alongside key events) ─────────────────────
        case SDL_TEXTINPUT: {
          if (this._inputActive) {
            // SDL_TextInputEvent.text starts at byte 12, null-terminated UTF-8
            const textBytes = this._eventBuf.slice(12);
            const nullIdx = textBytes.indexOf(0);
            const text = new TextDecoder().decode(
              textBytes.subarray(0, nullIdx === -1 ? undefined : nullIdx),
            );
            if (this._debug) console.log(`[SDL] TEXT_INPUT  text="${text}"`);
            this._inputBuffer += text;
            for (const cb of this._onInputChange) cb(this._inputBuffer);
          } else {
            if (this._debug) console.log("[SDL] TEXT_INPUT (ignored, event mode)");
          }
          break;
        }
        case SDL_TEXTEDITING: {
          if (this._debug) console.log("[SDL] TEXT_EDITING");
          break;
        }

        default: {
          if (this._debug) console.log(`[SDL] UNKNOWN event type=0x${type.toString(16)}`);
          break;
        }
      }
    }
  }

  /** Copy canvas pixels → SDL texture → screen. */
  private present(): void {
    const imageData = this._ctx.getImageData(
      0,
      0,
      this._width,
      this._height,
    );

    // imageData.data is RGBA byte-order — matches SDL_PIXELFORMAT_ABGR8888
    // on little-endian systems.
    const pixels = new Uint8Array(
      imageData.data.buffer,
      imageData.data.byteOffset,
      imageData.data.byteLength,
    );

    sdl2.symbols.SDL_UpdateTexture(
      this._sdlTexture,
      null, // entire texture
      pixels,
      this._width * 4, // pitch
    );

    sdl2.symbols.SDL_RenderClear(this._sdlRenderer);
    sdl2.symbols.SDL_RenderCopy(
      this._sdlRenderer,
      this._sdlTexture,
      null,
      null,
    );
    sdl2.symbols.SDL_RenderPresent(this._sdlRenderer);
  }

  /** Release all SDL resources. Called automatically when `run()` exits. */
  private destroy(): void {
    // Restore the mouse before tearing down
    this.applyMouseMode("free");

    if (this._sdlTexture) {
      sdl2.symbols.SDL_DestroyTexture(this._sdlTexture);
      this._sdlTexture = null;
    }
    if (this._sdlRenderer) {
      sdl2.symbols.SDL_DestroyRenderer(this._sdlRenderer);
      this._sdlRenderer = null;
    }
    if (this._sdlWindow) {
      sdl2.symbols.SDL_DestroyWindow(this._sdlWindow);
      this._sdlWindow = null;
    }
    sdl2.symbols.SDL_Quit();
  }

  /** Apply an SDL mouse mode (free / locked / confined). */
  private applyMouseMode(mode: MouseMode): void {
    if (mode === this._currentMouseMode) return;
    this._currentMouseMode = mode;

    switch (mode) {
      case "locked":
        sdl2.symbols.SDL_SetRelativeMouseMode(SDL_TRUE);
        break;
      case "confined":
        // SDL doesn't have a "confine" mode without relative.
        // We keep the cursor visible and just warp it back each frame
        // if it leaves — but for now, treat it as free + visible.
        sdl2.symbols.SDL_SetRelativeMouseMode(SDL_FALSE);
        sdl2.symbols.SDL_ShowCursor(SDL_TRUE);
        break;
      case "free":
      default:
        sdl2.symbols.SDL_SetRelativeMouseMode(SDL_FALSE);
        sdl2.symbols.SDL_ShowCursor(SDL_TRUE);
        break;
    }

    if (this._debug) console.log(`[SDL] MOUSE_MODE  ${mode}`);
  }
}
