export class Easing {
  static In = {
    Quadratic(t: number): number {
      return t * t;
    },
    Cubic(t: number): number {
      return t * t * t;
    },
    Sine(t: number): number {
      return 1 - Math.cos((t * Math.PI) / 2);
    },
    Exponential(t: number): number {
      return t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
    },
    Elastic(t: number): number {
      if (t === 0) return 0;
      if (t === 1) return 1;
      const p = 0.3;
      const s = p / 4;
      return -Math.pow(2, 10 * (t - 1)) * Math.sin(((t - 1 - s) * (2 * Math.PI)) / p);
    }
  };
  static Out = {
    Quadratic(t: number): number {
      return t * (2 - t);
    },
    Cubic(t: number): number {
      return --t * t * t + 1;
    },
    Sine(t: number): number {
      return Math.sin((t * Math.PI) / 2);
    },
    Exponential(t: number): number {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    },
    Elastic(t: number): number {
      if (t === 0) return 0;
      if (t === 1) return 1;
      const p = 0.3;
      const s = p / 4;
      return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
    }
  };
  static InOut = {
    Quadratic(t: number): number {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    Cubic(t: number): number {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    Sine(t: number): number {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    },
    Exponential(t: number): number {
      if (t === 0) return 0;
      if (t === 1) return 1;
      if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
      return (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
    Elastic(t: number): number {
      if (t === 0) return 0;
      if (t === 1) return 1;
      const p = 0.45;
      const s = p / 4;
      if (t < 0.5) {
        return -(Math.pow(2, 20 * t - 10) * Math.sin(((20 * t - 11 - s) * (2 * Math.PI)) / p)) / 2;
      }
      return (Math.pow(2, -20 * t + 10) * Math.sin(((20 * t - 11 - s) * (2 * Math.PI)) / p)) / 2 + 1;
    }
  };

  static linear(t: number): number {
    return t;
  }

  static cubicBezier(p0: number, p1: number, p2: number, p3: number): (t: number) => number {
    return (t: number) => {
      const u = 1 - t;
      return (
        u * u * u * p0 +
        3 * u * u * t * p1 +
        3 * u * t * t * p2 +
        t * t * t * p3
      );
    };
  };
}
