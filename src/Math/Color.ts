import * as Common from "./common";
import { Vector4D } from "./Vector";

export class Color {
  private _data: Uint8ClampedArray;

  constructor() {
    this._data = new Uint8ClampedArray(4);
  }

  set(r: number = 0, g: number = 0, b: number = 0, a: number = 255): Color {
    this._data[0] = r;
    this._data[1] = g;
    this._data[2] = b;
    this._data[3] = a;
    return this;
  }

  get r(): number {
    return this._data[0]!;
  }

  get g(): number {
    return this._data[1]!;
  }

  get b(): number {
    return this._data[2]!;
  }

  get a(): number {
    return this._data[3]!;
  }

  set r(value: number) {
    this._data[0] = value;
  }

  set g(value: number) {
    this._data[1] = value;
  }

  set b(value: number) {
    this._data[2] = value;
  }

  set a(value: number) {
    this._data[3] = value;
  }

  toRGBAString(): string {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a / 255})`;
  }

  get data(): Readonly<Uint8ClampedArray> {
    return this._data;
  }

  static core = {
    rgb(r: number, g: number, b: number): Color {
      return new Color().set(r, g, b, 255);
    },
    rgba(r: number, g: number, b: number, a: number): Color {
      return new Color().set(r, g, b, a);
    },
    hex(hex: string): Color {
      if (hex.startsWith("#")) {
        hex = hex.slice(1);
      }
      if (hex.length === 3) {
        hex = hex
          .split("")
          .map((c) => c + c)
          .join("");
      }
      if (hex.length !== 6) {
        throw new Error("Invalid hex color format. Expected #RRGGBB or #RGB.");
      }
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return new Color().set(r, g, b, 255);
    },
    hsl(h: number, s: number, l: number): Color {
      return this.hsla(h, s, l, 255);
    },
    hsla(h: number, s: number, l: number, a: number = 255): Color {
      let r, g, b;

      if (s === 0) {
        r = g = b = l; // achromatic
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = Common.hueToRGB(p, q, h + 1 / 3);
        g = Common.hueToRGB(p, q, h);
        b = Common.hueToRGB(p, q, h - 1 / 3);
      }

      return new Color().set(
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
        a,
      );
    },
    colors: {
      white: new Color().set(255, 255, 255, 255),
      black: new Color().set(0, 0, 0, 255),
      red: new Color().set(255, 0, 0, 255),
      orange: new Color().set(255, 165, 0, 255),
      yellow: new Color().set(255, 255, 0, 255),
      green: new Color().set(0, 255, 0, 255),
      blue: new Color().set(0, 0, 255, 255),
      purple: new Color().set(128, 0, 128, 255),
      transparent: new Color().set(0, 0, 0, 0),
    },
  };

  toHexString(): string {
    const rHex = this.r.toString(16).padStart(2, "0");
    const gHex = this.g.toString(16).padStart(2, "0");
    const bHex = this.b.toString(16).padStart(2, "0");
    return `#${rHex}${gHex}${bHex}`;
  }

  toHSL(): { h: number; s: number; l: number } {
    const [r, g, b] = this.toRGBA01();
    const vmax = Common.max(r, g, b);
    const vmin = Common.min(r, g, b);

    let h,
      s,
      l = (vmax + vmin) / 2;

    if (vmax === vmin) {
      return { h: 0, s: 0, l }; // achromatic
    }

    const d = vmax - vmin;
    s = l > 0.5 ? d / (2 - vmax - vmin) : d / (vmax + vmin);
    if (vmax === r) h = (g - b) / d + (g < b ? 6 : 0);
    if (vmax === g) h = (b - r) / d + 2;
    if (vmax === b) h = (r - g) / d + 4;
    if (h == undefined) h = 0;
    h /= 6;

    return { h, s, l };
  }

  toRGBA255(): [number, number, number, number] {
    return [this.r, this.g, this.b, this.a];
  }

  toRGBA01(): [number, number, number, number] {
    return [this.r / 255, this.g / 255, this.b / 255, this.a / 255];
  }

  toVec4(): Vector4D {
    return new Vector4D(this.r, this.g, this.b, this.a);
  }

  lerp(target: Color, t: number): Color {
    const r = Common.lerp(this.r, target.r, t);
    const g = Common.lerp(this.g, target.g, t);
    const b = Common.lerp(this.b, target.b, t);
    const a = Common.lerp(this.a, target.a, t);
    return new Color().set(r, g, b, a);
  }

  multiply(other: Color): Color {
    const r = (this.r * other.r) / 255;
    const g = (this.g * other.g) / 255;
    const b = (this.b * other.b) / 255;
    const a = (this.a * other.a) / 255;
    return new Color().set(r, g, b, a);
  }

  add(other: Color): Color {
    const r = Math.min(this.r + other.r, 255);
    const g = Math.min(this.g + other.g, 255);
    const b = Math.min(this.b + other.b, 255);
    const a = Math.min(this.a + other.a, 255);
    return new Color().set(r, g, b, a);
  }

  clamp(): Color {
    const r = Common.clamp(this.r, 0, 255);
    const g = Common.clamp(this.g, 0, 255);
    const b = Common.clamp(this.b, 0, 255);
    const a = Common.clamp(this.a, 0, 255);
    return new Color().set(r, g, b, a);
  }
}
