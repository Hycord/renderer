import { dlopen, FFIType, CString } from "bun:ffi";
import { existsSync } from "fs";

// ── SDL2 Constants ──────────────────────────────────────────────────────────

export const SDL_INIT_VIDEO = 0x00000020;

export const SDL_WINDOWPOS_CENTERED = 0x2fff0000;
export const SDL_WINDOW_SHOWN = 0x00000004;
export const SDL_WINDOW_RESIZABLE = 0x00000020;

export const SDL_RENDERER_ACCELERATED = 0x00000002;
export const SDL_RENDERER_PRESENTVSYNC = 0x00000004;

/**
 * SDL_PIXELFORMAT_ABGR8888 — packed as A(31:24) B(23:16) G(15:8) R(7:0).
 * On little-endian systems the byte order in memory is R, G, B, A — matching
 * the RGBA layout returned by CanvasRenderingContext2D.getImageData().
 */
export const SDL_PIXELFORMAT_ABGR8888 = 0x16762004;
export const SDL_TEXTUREACCESS_STREAMING = 1;

// Event types
export const SDL_QUIT = 0x100;
export const SDL_WINDOWEVENT = 0x200;
export const SDL_KEYDOWN = 0x300;
export const SDL_KEYUP = 0x301;
export const SDL_TEXTEDITING = 0x302;
export const SDL_TEXTINPUT = 0x303;
export const SDL_MOUSEMOTION = 0x400;
export const SDL_MOUSEBUTTONDOWN = 0x401;
export const SDL_MOUSEBUTTONUP = 0x402;
export const SDL_MOUSEWHEEL = 0x403;

// Window event subtypes
export const SDL_WINDOWEVENT_RESIZED = 5;

// Key codes (SDLK_*)
export const SDLK_RETURN    = 0x0D;
export const SDLK_ESCAPE    = 0x1B;
export const SDLK_BACKSPACE = 0x08;

// Keyboard modifier mask bits (SDL_Keymod)
export const KMOD_LSHIFT = 0x0001;
export const KMOD_RSHIFT = 0x0002;
export const KMOD_SHIFT  = KMOD_LSHIFT | KMOD_RSHIFT;

// Boolean constants
export const SDL_TRUE  = 1;
export const SDL_FALSE = 0;

// ── Library resolution ──────────────────────────────────────────────────────

function findSDL2Library(): string {
  const candidates =
    process.platform === "darwin"
      ? [
          "/opt/homebrew/lib/libSDL2.dylib", // macOS ARM (Homebrew)
          "/usr/local/lib/libSDL2.dylib", // macOS Intel (Homebrew)
        ]
      : [
          "/usr/lib/x86_64-linux-gnu/libSDL2-2.0.so.0",
          "/usr/lib/libSDL2-2.0.so.0",
        ];

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }

  throw new Error(
    `SDL2 not found. Install it with:\n` +
      `  macOS:  brew install sdl2\n` +
      `  Linux:  sudo apt install libsdl2-dev`,
  );
}

// ── FFI bindings ────────────────────────────────────────────────────────────

const sdl2 = dlopen(findSDL2Library(), {
  // Lifecycle
  SDL_Init: { args: [FFIType.u32], returns: FFIType.i32 },
  SDL_Quit: { args: [], returns: FFIType.void },
  SDL_GetError: { args: [], returns: FFIType.ptr },

  // Window
  SDL_CreateWindow: {
    args: [
      FFIType.ptr, // title
      FFIType.i32, // x
      FFIType.i32, // y
      FFIType.i32, // w
      FFIType.i32, // h
      FFIType.u32, // flags
    ],
    returns: FFIType.ptr,
  },
  SDL_DestroyWindow: { args: [FFIType.ptr], returns: FFIType.void },

  // Renderer
  SDL_CreateRenderer: {
    args: [FFIType.ptr, FFIType.i32, FFIType.u32],
    returns: FFIType.ptr,
  },
  SDL_DestroyRenderer: { args: [FFIType.ptr], returns: FFIType.void },
  SDL_RenderClear: { args: [FFIType.ptr], returns: FFIType.i32 },
  SDL_RenderCopy: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  SDL_RenderPresent: { args: [FFIType.ptr], returns: FFIType.void },

  // Texture
  SDL_CreateTexture: {
    args: [FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32],
    returns: FFIType.ptr,
  },
  SDL_DestroyTexture: { args: [FFIType.ptr], returns: FFIType.void },
  SDL_UpdateTexture: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },

  // Events
  SDL_PollEvent: { args: [FFIType.ptr], returns: FFIType.i32 },

  // Timing
  SDL_Delay: { args: [FFIType.u32], returns: FFIType.void },
  SDL_GetTicks: { args: [], returns: FFIType.u32 },

  // Keyboard
  SDL_GetKeyName: { args: [FFIType.i32], returns: FFIType.ptr },

  // Mouse
  SDL_SetRelativeMouseMode: { args: [FFIType.i32], returns: FFIType.i32 },
  SDL_ShowCursor: { args: [FFIType.i32], returns: FFIType.i32 },
  SDL_WarpMouseInWindow: {
    args: [FFIType.ptr, FFIType.i32, FFIType.i32],
    returns: FFIType.void,
  },
});

export default sdl2;

// ── Helpers ─────────────────────────────────────────────────────────────────

export function sdlError(): string {
  const ptr = sdl2.symbols.SDL_GetError();
  if (!ptr) return "Unknown SDL error";
  return new CString(ptr).toString();
}

export function sdlKeyName(keycode: number): string {
  const ptr = sdl2.symbols.SDL_GetKeyName(keycode);
  if (!ptr) return "Unknown";
  return new CString(ptr).toString();
}
