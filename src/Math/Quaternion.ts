import * as Common from "./common";
import type { Matrix3D } from "./Matrix/Matrix3D";
import type { Vector3D } from "./Vector";

export class Quaternion {
    private _data: Float32Array;

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
        this._data = new Float32Array([x, y, z, w]);
    }

    get x(): number {
        return this._data[0]!;
    }

    set x(value: number) {
        this._data[0] = value;
    }

    get y(): number {
        return this._data[1]!;
    }

    set y(value: number) {
        this._data[1] = value;
    }

    get z(): number {
        return this._data[2]!;
    }

    set z(value: number) {
        this._data[2] = value;
    }

    get w(): number {
        return this._data[3]!;
    }

    set w(value: number) {
        this._data[3] = value;
    }

    static core = {
        identity(): Quaternion {
            return new Quaternion(0, 0, 0, 1);
        },

        fromAxisAngle(axis: Vector3D, angleRadians: number): Quaternion {
            const halfAngle = angleRadians / 2;
            const s = Math.sin(halfAngle);
            return new Quaternion(
                axis.x * s,
                axis.y * s,
                axis.z * s,
                Math.cos(halfAngle),
            );
        },

        fromEulerAngles(pitch: number, yaw: number, roll: number): Quaternion {
            const halfPitch = pitch / 2;
            const halfYaw = yaw / 2;
            const halfRoll = roll / 2;

            const sinPitch = Math.sin(halfPitch);
            const cosPitch = Math.cos(halfPitch);
            const sinYaw = Math.sin(halfYaw);
            const cosYaw = Math.cos(halfYaw);
            const sinRoll = Math.sin(halfRoll);
            const cosRoll = Math.cos(halfRoll);

            return new Quaternion(
                cosYaw * sinPitch * cosRoll + sinYaw * cosPitch * sinRoll,
                sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll,
                cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll,
                cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll,
            );
        },

        fromMatrix3D(matrix: Matrix3D): Quaternion {
            const m = matrix.toArray();
            const trace = m[0][0] + m[1][1] + m[2][2];
            let x, y, z, w;

            if (trace > 0) {
                const s = 0.5 / Math.sqrt(trace + 1.0);
                w = 0.25 / s;
                x = (m[1][2] - m[2][1]) * s;
                y = (m[2][0] - m[0][2]) * s;
                z = (m[0][1] - m[1][0]) * s;
            } else {
                if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) {
                    const s = 2.0 * Math.sqrt(1.0 + m[0][0] - m[1][1] - m[2][2]);
                    w = (m[1][2] - m[2][1]) / s;
                    x = 0.25 * s;
                    y = (m[1][0] + m[0][1]) / s;
                    z = (m[2][0] + m[0][2]) / s;
                } else if (m[1][1] > m[2][2]) {
                    const s = 2.0 * Math.sqrt(1.0 + m[1][1] - m[0][0] - m[2][2]);
                    w = (m[2][0] - m[0][2]) / s;
                    x = (m[1][0] + m[0][1]) / s;
                    y = 0.25 * s;
                    z = (m[2][1] + m[1][2]) / s;
                } else {
                    const s = 2.0 * Math.sqrt(1.0 + m[2][2] - m[0][0] - m[1][1]);
                    w = (m[0][1] - m[1][0]) / s;
                    x = (m[2][0] + m[0][2]) / s;
                    y = (m[2][1] + m[1][2]) / s;
                    z = 0.25 * s;
                }
            }

            return new Quaternion(x, y, z, w);
        },

        slerp(q1: Quaternion, q2: Quaternion, t: number): Quaternion {
            let cosHalfTheta = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;

            if (Math.abs(cosHalfTheta) >= 1.0) {
                return new Quaternion(q1.x, q1.y, q1.z, q1.w);
            }

            const halfTheta = Math.acos(cosHalfTheta);
            const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

            if (Math.abs(sinHalfTheta) < 0.001) {
                return new Quaternion(
                    (q1.x * 0.5 + q2.x * 0.5),
                    (q1.y * 0.5 + q2.y * 0.5),
                    (q1.z * 0.5 + q2.z * 0.5),
                    (q1.w * 0.5 + q2.w * 0.5),
                );
            }

            const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
            const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

            return new Quaternion(
                q1.x * ratioA + q2.x * ratioB,
                q1.y * ratioA + q2.y * ratioB,
                q1.z * ratioA + q2.z * ratioB,
                q1.w * ratioA + q2.w * ratioB,
            );
        },

        lookRotation(forward: Vector3D, up: Vector3D): Quaternion {
            const z = forward;
            const x = up.cross(z).normalize();
            const y = z.cross(x);

            const m00 = x.x, m01 = y.x, m02 = z.x;
            const m10 = x.y, m11 = y.y, m12 = z.y;
            const m20 = x.z, m21 = y.z, m22 = z.z;

            const trace = m00 + m11 + m22;
            let xq, yq, zq, wq;

            if (trace > 0) {
                const s = 0.5 / Math.sqrt(trace + 1.0);
                wq = 0.25 / s;
                xq = (m21 - m12) * s;
                yq = (m02 - m20) * s;
                zq = (m10 - m01) * s;
            } else {
                if (m00 > m11 && m00 > m22) {
                    const s = 2.0 * Math.sqrt(1.0 + m00 - m11 - m22);
                    wq = (m21 - m12) / s;
                    xq = 0.25 * s;
                    yq = (m01 + m10) / s;
                    zq = (m02 + m20) / s;
                } else if (m11 > m22) {
                    const s = 2.0 * Math.sqrt(1.0 + m11 - m00 - m22);
                    wq = (m02 - m20) / s;
                    xq = (m01 + m10) / s;
                    yq = 0.25 * s;
                    zq = (m12 + m21) / s;
                } else {
                    const s = 2.0 * Math.sqrt(1.0 + m22 - m00 - m11);
                    wq = (m10 - m01) / s;
                    xq = (m02 + m20) / s;
                    yq = (m12 + m21) / s;
                    zq = 0.25 * s;
                }
            }

            return new Quaternion(xq, yq, zq, wq);
        },
    }

    get magnitude(): number {
        return Math.sqrt(this.magnitudeSquared);
    }

    get magnitudeSquared(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    }

    equals(other: Quaternion, epsilon: number = Common.EPSILON): boolean {
        return (
            Common.epsilonEquals(this.x, other.x, epsilon) &&
            Common.epsilonEquals(this.y, other.y, epsilon) &&
            Common.epsilonEquals(this.z, other.z, epsilon) &&
            Common.epsilonEquals(this.w, other.w, epsilon)
        );
    }

    clone(): Quaternion {
        return new Quaternion(this.x, this.y, this.z, this.w);
    }

    toString(): string {
        return `Quaternion(x: ${this.x}, y: ${this.y}, z: ${this.z}, w: ${this.w})`;
    }
    
    
}