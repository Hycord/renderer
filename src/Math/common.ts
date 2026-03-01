export const PI = Math.PI;
export const TAU = 2 * PI;
export const HALF_PI = PI / 2;

export const MAX_DISTANCE = Number.POSITIVE_INFINITY;
export const MIN_DISTANCE = Number.NEGATIVE_INFINITY;

export const EPSILON = 1e-6;

export function degToRad(degrees: number): number {
  return degrees * (PI / 180);
}

export function radToDeg(radians: number): number {
  return radians * (180 / PI);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + t * (end - start);
}

export function inverseLerp(start: number, end: number, value: number): number {
  if (start === end) return 0; // Avoid division by zero
  return (value - start) / (end - start);
}

export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function epsilonEquals(
  a: number,
  b: number,
  epsilon: number = 1e-6,
): boolean {
  return Math.abs(a - b) < epsilon;
}

export function max(...values: number[]): number {
  return Math.max(...values);
}

export function min(...values: number[]): number {
  return Math.min(...values);
}

export function hueToRGB(a:number,b:number,hue: number): number {
  if (hue < 0) hue += 1;
  if (hue > 1) hue -= 1;
  if (hue < 1 / 6) return a + (b - a) * 6 * hue;
  if (hue < 1 / 2) return b;
  if (hue < 2 / 3) return a + (b - a) * (2 / 3 - hue) * 6;
  return a;
}

export function binomialCoefficient(n: number): number[] {
  const coeffs: number[] = [];
  for (let k = 0; k <= n; k++) {
    coeffs.push(factorial(n) / (factorial(k) * factorial(n - k)));
  }
  return coeffs;
}

function factorial(num: number): number {
  if (num === 0 || num === 1) return 1;
  let result = 1;
  for (let i = 2; i <= num; i++) {
    result *= i;
  }
  return result;
}

export function grad2D(hash: number, x: number, y: number): number {
  const h = hash & 3;
  return ((h & 1) === 0 ? x : -x) + ((h & 2) === 0 ? y : -y);
}

export function grad3D(
  hash: number,
  x: number,
  y: number,
  z: number,
): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) !== 0 ? -u : u) + ((h & 2) !== 0 ? -v : v);
}