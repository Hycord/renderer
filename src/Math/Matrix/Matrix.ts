import * as Common from "../common";
export class Matrix {
  // X*X matrix stored in column-major order
  private _data: Float32Array;

  constructor(
    private _rows: number,
    private _cols: number,
    values: number[][] = [],
  ) {
    this._data = new Float32Array(_rows * _cols);
    for (let i = 0; i < _rows; i++) {
      for (let j = 0; j < _cols; j++) {
        this.set(i, j, values[i]?.[j] ?? 0);
      }
    }
  }

  static identity(size: number): Matrix {
    const result = new Matrix(size, size);
    for (let i = 0; i < size; i++) {
      result.set(i, i, 1);
    }
    return result;
  }

  get rows(): number {
    return this._rows;
  }

  get cols(): number {
    return this._cols;
  }

  getIndex(index: number): number | undefined {
    return this._data[index];
  }
  get(row: number, col: number): number | undefined {
    const index = col * this.cols + row;
    return this._data[index];
  }

  set(row: number, col: number, value: number): Matrix {
    const index = col * this.cols + row;
    this._data[index] = value;
    return this;
  }

  toArray(): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < this.cols; j++) {
        row.push(this.get(i, j)!);
      }
      result.push(row);
    }
    return result;
  }

  get data(): Readonly<Float32Array> {
    return this._data;
  }

  multiply(other: Matrix): Matrix {
    if (this.cols !== other.rows) {
      throw new Error(
        `Cannot multiply: ${this.cols} cols in A but ${other.rows} rows in B.`,
      );
    }
    const result = new Matrix(this.rows, other.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        let sum = 0;
        for (let k = 0; k < this.cols; k++) {
          sum += this.get(i, k)! * other.get(k, j)!;
        }
        result.set(i, j, sum);
      }
    }
    return result;
  }

  transpose(): Matrix {
    const result = new Matrix(this.cols, this.rows);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.set(j, i, this.get(i, j)!);
      }
    }
    return result;
  }

  multiplyMutable(other: Matrix): this {
    const result = this.multiply(other);
    this._data = result._data;
    this._rows = result._rows;
    this._cols = result._cols;
    return this;
  }

  transposeMutable(): this {
    const result = this.transpose();
    this._data = result._data;
    this._rows = result._rows;
    this._cols = result._cols;
    return this;
  }

  determinant(): number {
    if (this.rows !== this.cols) {
      throw new Error("Determinant is only defined for square matrices.");
    }
    if (this.rows === 2) {
      return (
        this.get(0, 0)! * this.get(1, 1)! - this.get(0, 1)! * this.get(1, 0)!
      );
    }
    // For larger matrices, we would need to implement a more complex algorithm.
    throw new Error("Determinant calculation not implemented for size > 2.");
  }

  inverse(): Matrix {
    if (this.rows !== this.cols) {
      throw new Error("Inverse is only defined for square matrices.");
    }
    if (this.rows === 2) {
      const det = this.determinant();
      if (det === 0) {
        throw new Error("Matrix is singular and cannot be inverted.");
      }
      const invDet = 1 / det;
      return new Matrix(2, 2, [
        [this.get(1, 1)! * invDet, -this.get(0, 1)! * invDet],
        [-this.get(1, 0)! * invDet, this.get(0, 0)! * invDet],
      ]);
    }
    // For larger matrices, we would need to implement a more complex algorithm.
    throw new Error("Inverse calculation not implemented for size > 2.");
  }

  clone(): Matrix {
    const result = new Matrix(this.rows, this.cols);
    result._data.set(this._data);
    return result;
  }

  toString(): string {
    return (
      `Matrix(${this.rows}x${this.cols}):\n` +
      this.toArray()
        .map((row) => row.join("\t"))
        .join("\n")
    );
  }

  equals(other: Matrix, epsilon: number = Common.EPSILON): boolean {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      return false;
    }

    for (let i = 0; i < this._data.length; i++) {
      const a = this.getIndex(i);
      const b = other.getIndex(i);
      if (a === undefined || b === undefined) {
        throw new Error(`Index ${i} is out of bounds for one of the matrices.`);
      }

      if (!Common.epsilonEquals(a, b, epsilon)) {
        return false;
      }
    }
    return true;
  }

  toArrayFlat(): number[] {
    return Array.from(this._data);
  }
}
