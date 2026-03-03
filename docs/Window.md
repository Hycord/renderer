# Window Module

The **Window** module creates a native OS window using **SDL2** via Bun FFI and renders frames from a `@napi-rs/canvas` `Canvas` to it each tick.  The canvas pixel data is blitted to a streaming SDL2 texture every frame.

---

## Table of Contents

- [Window](#window)
- [SDL2 bindings](#sdl2-bindings)

---

## Window

`src/Window/Window.ts`

### Constructor

```ts
new Window(options?: WindowOptions)
```

### WindowOptions

| Option       | Type      | Default    | Description                                |
|--------------|-----------|------------|--------------------------------------------|
| `title`      | `string`  | `"Render"` | OS window title bar text                   |
| `width`      | `number`  | `512`      | Initial canvas / window width in pixels    |
| `height`     | `number`  | `512`      | Initial canvas / window height in pixels   |
| `resizable`  | `boolean` | `true`     | Allow user to resize the window            |
| `debug`      | `boolean` | `false`    | Log raw SDL event structs to the console   |

### Properties

| Property   | Type                      | Description                            |
|------------|---------------------------|----------------------------------------|
| `canvas`   | `Canvas`                  | The `@napi-rs/canvas` drawing surface  |
| `context`  | `CanvasRenderingContext2D`| 2D drawing context                     |
| `width`    | `number`                  | Current canvas width in pixels         |
| `height`   | `number`                  | Current canvas height in pixels        |
| `isOpen`   | `boolean`                 | False once the window has been closed  |

---

### State management

Named states let you configure different input modes (e.g. playing, paused, chatting).

```ts
win.addState("playing",  { keyboard: true, mouse: true, mouseMode: "locked" });
win.addState("paused",   { keyboard: true, mouse: false });
win.setState("playing");
```

#### StateOptions

| Option      | Type         | Default  | Description                                    |
|-------------|--------------|----------|------------------------------------------------|
| `keyboard`  | `boolean`    | `true`   | Enable keyboard callbacks and `isKeyDown()`    |
| `mouse`     | `boolean`    | `true`   | Enable mouse callbacks                         |
| `mouseMode` | `MouseMode`  | `"free"` | `"free" \| "locked" \| "confined"`             |

#### MouseMode

| Value       | Description                                                              |
|-------------|--------------------------------------------------------------------------|
| `"free"`    | Normal cursor; absolute position reported                                |
| `"locked"`  | Cursor hidden and locked to window centre; only deltas reported          |
| `"confined"`| Cursor visible but cannot leave the window                               |

#### Methods

| Method              | Description                                                   |
|---------------------|---------------------------------------------------------------|
| `addState(name, opts)` | Register a named state                                     |
| `setState(name)`    | Switch to a state; clears held keys                           |
| `getState()`        | Returns the active state name                                 |
| `onStateChange(cb)` | Fired when the active state changes                           |

---

### Input

#### Keyboard

| Method                    | Description                                        |
|---------------------------|----------------------------------------------------|
| `onKeyDown(cb)`           | Fired on key press                                 |
| `onKeyUp(cb)`             | Fired on key release                               |
| `isKeyDown(key)`          | True while the key is held                         |

Callback signature: `(key: string, scancode: number) => void`

#### Mouse

| Method                  | Description                                       |
|-------------------------|---------------------------------------------------|
| `onMouseMove(cb)`       | `(x, y, dx, dy) => void`                         |
| `onMouseDown(cb)`       | `(button, x, y) => void`                         |
| `onMouseUp(cb)`         | `(button, x, y) => void`                         |
| `onMouseWheel(cb)`      | `(dx, dy) => void`                               |
| `mouseX / mouseY`       | Current cursor position in pixels                 |

#### Text input mode

Activates SDL2's text-input API for composing Unicode strings.

| Method                                | Description                                         |
|---------------------------------------|-----------------------------------------------------|
| `startTextInput()`                    | Open input mode                                     |
| `stopTextInput()`                     | Close input mode                                    |
| `onInputChange(cb)`                   | Fired each frame while typing                       |
| `onInputSubmit(cb)`                   | Fired on Enter                                      |
| `onInputCancel(cb)`                   | Fired on Escape                                     |

---

### Window events

| Method             | Description                            |
|--------------------|----------------------------------------|
| `onResize(cb)`     | `(width, height) => void`              |
| `onClose(cb)`      | Fired when the user closes the window  |

---

### Main loop

```ts
win.run((dt: number) => {
  // dt = seconds since last frame
  world.update(dt);
  camera.render();
});
```

`run(callback)` enters the SDL2 event loop.  Each iteration:
1. Polls all pending SDL2 events and fires the appropriate callbacks.
2. Calls your `callback(dt)`.
3. Copies the canvas pixel data to the SDL texture and presents the renderer.
4. Repeats until the window is closed.

Call `win.close()` to programmatically end the loop.

---

### Example

```ts
const win = new Window({ title: "My App", width: 900, height: 600 });

win.addState("running", { keyboard: true, mouse: true, mouseMode: "free" });
win.setState("running");

win.onKeyDown((key) => {
  if (key === "Escape") win.close();
});

win.onResize(() => {
  camera.resize(win.width, win.height);
});

win.run((dt) => {
  world.update(dt);
  camera.render();
});
```

---

## SDL2 bindings

`src/Window/SDL2.ts`

Low-level Bun FFI bindings for the SDL2 shared library.  Not intended for direct use — `Window` wraps everything needed.

The file exports:
- SDL2 initialise/event/window/renderer/texture symbol names and constants.
- Helper functions: `sdlError()` (retrieve last SDL error string), `sdlKeyName(scancode)`.
- The lazily-loaded FFI library object (`sdl2`).
