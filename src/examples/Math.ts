/**
 * Comprehensive example showcasing every module in the Math package.
 *
 * Run with:  bun run src/examples/Math.ts
 */

import {
  // ── Common utilities ──────────────────────────────────────
  Common,

  // ── Vectors ───────────────────────────────────────────────
  Vector,
  Vector2D,
  Vector3D,
  Vector4D,

  // ── Matrices ──────────────────────────────────────────────
  Matrix,
  Matrix2D,
  Matrix3D,
  Matrix4D,

  // ── Quaternion & Transform ────────────────────────────────
  Quaternion,
  Transform,

  // ── Color ─────────────────────────────────────────────────
  Color,

  // ── Geometry ──────────────────────────────────────────────
  AxisAlignedBoundingBox,
  Circle,
  Sphere,
  Plane,
  Ray,
  Intersections,

  // ── Noise ─────────────────────────────────────────────────
  PerlinNoise,
  SimplexNoise,

  // ── Interpolation ─────────────────────────────────────────
  Easing,
  CubicBezier2D,
  CubicBezier3D,
  QuadraticBezier2D,
  QuadraticBezier3D,
  CatmullRomSegment,
  CatmullRomChain,
} from "@hycord/math";

// ═══════════════════════════════════════════════════════════════
//  Helper
// ═══════════════════════════════════════════════════════════════

function section(title: string) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);
}

// ═══════════════════════════════════════════════════════════════
//  1. Common Utilities
// ═══════════════════════════════════════════════════════════════
section("1. Common Utilities");

console.log("PI:", Common.PI);
console.log("TAU (2π):", Common.TAU);
console.log("HALF_PI:", Common.HALF_PI);
console.log("EPSILON:", Common.EPSILON);

console.log("\ndegToRad(180):", Common.degToRad(180));
console.log("radToDeg(π):", Common.radToDeg(Common.PI));

console.log("\nclamp(15, 0, 10):", Common.clamp(15, 0, 10));
console.log("lerp(0, 100, 0.25):", Common.lerp(0, 100, 0.25));
console.log("inverseLerp(0, 100, 25):", Common.inverseLerp(0, 100, 25));
console.log("map(5, 0, 10, 0, 100):", Common.map(5, 0, 10, 0, 100));

console.log("\nsmoothStep(0, 1, 0.5):", Common.smoothStep(0, 1, 0.5));
console.log("epsilonEquals(1.0000001, 1.0):", Common.epsilonEquals(1.0000001, 1.0));

// ═══════════════════════════════════════════════════════════════
//  2. N-Dimensional Vector
// ═══════════════════════════════════════════════════════════════
section("2. N-Dimensional Vector");

const v5 = new Vector(1, 2, 3, 4, 5);
console.log("5D vector:", v5.toString());
console.log("Magnitude:", v5.magnitude());
console.log("Normalized:", v5.normalize().toString());

const vA = new Vector(1, 0, 0);
const vB = new Vector(0, 1, 0);
console.log("\nDot product (orthogonal):", vA.dot(vB));
console.log("Angle between (rad):", vA.angleTo(vB));

const vPolar = Vector.fromPolar(5, Common.degToRad(45));
console.log("\nFrom polar (r=5, θ=45°):", vPolar.toString());

// ═══════════════════════════════════════════════════════════════
//  3. Vector2D
// ═══════════════════════════════════════════════════════════════
section("3. Vector2D");

const v2a = new Vector2D(3, 4);
const v2b = new Vector2D(1, 2);

console.log("v2a:", v2a.toString());
console.log("v2b:", v2b.toString());
console.log("Add:", v2a.add(v2b).toString());
console.log("Subtract:", v2a.subtract(v2b).toString());
console.log("Scale x3:", v2a.scale(3).toString());
console.log("Length:", v2a.length);
console.log("Normalized:", v2a.normalize().toString());
console.log("Perpendicular:", v2a.perpendicular().toString());
console.log("Cross (scalar):", v2a.cross(v2b));
console.log("Dot:", v2a.dot(v2b));
console.log("Angle (rad):", v2a.angle);
console.log("Distance:", v2a.distance(v2b));

const rotated = v2a.rotateRadians(Common.HALF_PI);
console.log("Rotated 90°:", rotated.toString());

console.log("\nRandom unit vector:", Vector2D.core.random().toString());
console.log("From angle 30°:", Vector2D.core.fromAngleDegrees(30).toString());

// ═══════════════════════════════════════════════════════════════
//  4. Vector3D
// ═══════════════════════════════════════════════════════════════
section("4. Vector3D");

const v3a = new Vector3D(1, 2, 3);
const v3b = new Vector3D(4, 5, 6);

console.log("v3a:", v3a.toString());
console.log("v3b:", v3b.toString());
console.log("Add:", v3a.add(v3b).toString());
console.log("Cross:", v3a.cross(v3b).toString());
console.log("Dot:", v3a.dot(v3b));
console.log("Length:", v3a.length);
console.log("Normalized:", v3a.normalize().toString());

const normal = new Vector3D(0, 1, 0);
const incoming = new Vector3D(1, -1, 0).normalize();
console.log("\nReflect", incoming.toString(), "across", normal.toString());
console.log("Result:", incoming.reflect(normal).toString());

console.log("\nDirection constants:");
console.log("  Up:", Vector3D.core.up().toString());
console.log("  Forward:", Vector3D.core.forward().toString());
console.log("  Right:", Vector3D.core.right().toString());

// ═══════════════════════════════════════════════════════════════
//  5. Vector4D
// ═══════════════════════════════════════════════════════════════
section("5. Vector4D");

const v4 = new Vector4D(2, 4, 6, 2);
console.log("v4:", `Vector4D(${v4.x}, ${v4.y}, ${v4.z}, ${v4.w})`);
console.log("To Vector3D (perspective divide):", v4.toVector3D().toString());

// ═══════════════════════════════════════════════════════════════
//  6. Matrix (generic)
// ═══════════════════════════════════════════════════════════════
section("6. Matrix (generic NxN)");

const m = new Matrix(2, 2, [
  [1, 2],
  [3, 4],
]);
console.log("2x2 Matrix:\n" + m.toString());
console.log("Determinant:", m.determinant());
console.log("Transpose:\n" + m.transpose().toString());
console.log("Inverse:\n" + m.inverse().toString());

const mIdentity = Matrix.identity(3);
console.log("\n3x3 Identity:\n" + mIdentity.toString());

// ═══════════════════════════════════════════════════════════════
//  7. Matrix2D
// ═══════════════════════════════════════════════════════════════
section("7. Matrix2D");

const rot2d = Matrix2D.core.rotation(Common.degToRad(45));
console.log("45° rotation matrix:\n" + rot2d.toString());

const scale2d = Matrix2D.core.scaling(2, 3);
console.log("Scaling (2, 3):\n" + scale2d.toString());

const shear2d = Matrix2D.core.shearing(0.5, 0);
console.log("Shearing (0.5, 0):\n" + shear2d.toString());

console.log("Reflection X:\n" + Matrix2D.core.reflectionX().toString());
console.log("Reflection Y:\n" + Matrix2D.core.reflectionY().toString());

// ═══════════════════════════════════════════════════════════════
//  8. Matrix3D
// ═══════════════════════════════════════════════════════════════
section("8. Matrix3D");

const rotX = Matrix3D.core.rotationX(Common.degToRad(90));
console.log("RotationX(90°):\n" + rotX.toString());

const rotY = Matrix3D.core.rotationY(Common.degToRad(45));
console.log("RotationY(45°):\n" + rotY.toString());

const translate3 = Matrix3D.core.translation(10, 20);
console.log("Translation(10, 20):\n" + translate3.toString());

// ═══════════════════════════════════════════════════════════════
//  9. Matrix4D
// ═══════════════════════════════════════════════════════════════
section("9. Matrix4D");

const eye = new Vector3D(0, 5, 10);
const target = Vector3D.core.zero();
const up = Vector3D.core.up();
const lookAtMat = Matrix4D.core.lookAt(eye, target, up);
console.log("LookAt matrix:\n" + lookAtMat.toString());

const perspective = Matrix4D.core.perspective(
  Common.degToRad(60),
  16 / 9,
  0.1,
  1000,
);
console.log("Perspective matrix:\n" + perspective.toString());

const ortho = Matrix4D.core.orthographic(-10, 10, -10, 10, 0.1, 100);
console.log("Orthographic matrix:\n" + ortho.toString());

const point = new Vector3D(1, 2, 3);
const translated = Matrix4D.core.translation(5, 0, 0).transformPoint(point);
console.log("\nTranslate (1,2,3) by (5,0,0):", translated.toString());

const trs = Matrix4D.core.trs(
  new Vector3D(10, 0, 0),
  Quaternion.core.fromAxisAngle(Vector3D.core.up(), Common.degToRad(45)),
  new Vector3D(2, 2, 2),
);
const { translation, rotation, scale } = trs.decompose();
console.log("\nTRS decompose:");
console.log("  Translation:", translation.toString());
console.log("  Rotation:", rotation.toString());
console.log("  Scale:", scale.toString());

// ═══════════════════════════════════════════════════════════════
//  10. Quaternion
// ═══════════════════════════════════════════════════════════════
section("10. Quaternion");

const qIdentity = Quaternion.core.identity();
console.log("Identity:", qIdentity.toString());

const qAxisAngle = Quaternion.core.fromAxisAngle(
  Vector3D.core.up(),
  Common.degToRad(90),
);
console.log("From axis-angle (Y, 90°):", qAxisAngle.toString());
console.log("Magnitude:", qAxisAngle.magnitude);

const qEuler = Quaternion.core.fromEulerAngles(
  Common.degToRad(30), // pitch
  Common.degToRad(45), // yaw
  Common.degToRad(0),  // roll
);
console.log("From Euler (30° pitch, 45° yaw):", qEuler.toString());

const q1 = Quaternion.core.identity();
const q2 = Quaternion.core.fromAxisAngle(Vector3D.core.up(), Common.degToRad(180));
const qSlerp = Quaternion.core.slerp(q1, q2, 0.5);
console.log("\nSlerp (identity → 180° Y, t=0.5):", qSlerp.toString());

console.log("Equals identity?", qIdentity.equals(Quaternion.core.identity()));

// ═══════════════════════════════════════════════════════════════
//  11. Transform
// ═══════════════════════════════════════════════════════════════
section("11. Transform");

const transform = new Transform(
  new Vector3D(0, 5, -10),
  Quaternion.core.identity(),
  new Vector3D(1, 1, 1),
);

console.log("Position:", transform.position.toString());
console.log("Forward:", transform.forward().toString());
console.log("Right:", transform.right().toString());
console.log("Up:", transform.up().toString());

transform.translate(new Vector3D(3, 0, 0));
console.log("\nAfter translate(3,0,0):", transform.position.toString());

transform.rotate(Vector3D.core.up(), Common.degToRad(45));
console.log("After rotate 45° around Y:", transform.rotation.toString());

transform.lookAt(Vector3D.core.zero());
console.log("After lookAt(origin):", transform.rotation.toString());
console.log("Forward after lookAt:", transform.forward().toString());

console.log("\nLocal matrix:\n" + transform.localMatrix().toString());

// ═══════════════════════════════════════════════════════════════
//  12. Color
// ═══════════════════════════════════════════════════════════════
section("12. Color");

const red = Color.core.rgb(255, 0, 0);
console.log("Red RGBA:", red.toRGBAString());
console.log("Red Hex:", red.toHexString());
console.log("Red HSL:", red.toHSL());

const fromHex = Color.core.hex("#3498db");
console.log("\nFrom hex #3498db:", fromHex.toRGBAString());

const fromHSL = Color.core.hsl(0.6, 0.7, 0.5);
console.log("From HSL(0.6, 0.7, 0.5):", fromHSL.toRGBAString());
console.log("  → back to HSL:", fromHSL.toHSL());

const blended = Color.core.colors.red().lerp(Color.core.colors.blue(), 0.5);
console.log("\nLerp red → blue at 0.5:", blended.toRGBAString());

const multiplied = Color.core.colors.white().multiply(Color.core.colors.green());
console.log("White × Green:", multiplied.toRGBAString());

const added = Color.core.colors.red().add(Color.core.colors.blue());
console.log("Red + Blue:", added.toRGBAString());

console.log("\nAs Vector4D:", red.toVec4().toString());

console.log("\nPredefined colors:");
for (const [name, color] of Object.entries(Color.core.colors)){
  console.log(`  ${name}: ${color().toHexString()}`);
}

// ═══════════════════════════════════════════════════════════════
//  13. Geometry — Circle
// ═══════════════════════════════════════════════════════════════
section("13. Geometry — Circle");

const circle = new Circle(new Vector2D(0, 0), 5);
console.log("Center:", circle.center.toString());
console.log("Radius:", circle.radius);
console.log("Area:", circle.area().toFixed(4));
console.log("Circumference:", circle.circumference().toFixed(4));
console.log("Contains (2,2)?", circle.containsPoint(new Vector2D(2, 2)));
console.log("Contains (6,0)?", circle.containsPoint(new Vector2D(6, 0)));

// ═══════════════════════════════════════════════════════════════
//  14. Geometry — Sphere
// ═══════════════════════════════════════════════════════════════
section("14. Geometry — Sphere");

const sphere = new Sphere(Vector3D.core.zero(), 3);
console.log("Center:", sphere.center.toString());
console.log("Radius:", sphere.radius);
console.log("Surface area:", sphere.surfaceArea().toFixed(4));
console.log("Volume:", sphere.volume().toFixed(4));
console.log("Contains (1,1,1)?", sphere.containsPoint(new Vector3D(1, 1, 1)));
console.log("Contains (5,0,0)?", sphere.containsPoint(new Vector3D(5, 0, 0)));

// ═══════════════════════════════════════════════════════════════
//  15. Geometry — Plane
// ═══════════════════════════════════════════════════════════════
section("15. Geometry — Plane");

const plane = new Plane(new Vector3D(0, 1, 0), 0);
const testPoint = new Vector3D(3, 5, -2);
console.log("Plane normal:", plane.normal.toString());
console.log("Distance to", testPoint.toString() + ":", plane.distanceToPoint(testPoint));
console.log("Side:", plane.side(testPoint));
console.log("Projected:", plane.projectPoint(testPoint).toString());

const belowPoint = new Vector3D(0, -3, 0);
console.log("Side of (0,-3,0):", plane.side(belowPoint));

// ═══════════════════════════════════════════════════════════════
//  16. Geometry — Ray
// ═══════════════════════════════════════════════════════════════
section("16. Geometry — Ray");

const ray = new Ray(new Vector3D(0, 0, 0), new Vector3D(0, 0, 1));
console.log("Origin:", ray.origin.toString());
console.log("Direction:", ray.direction.toString());
console.log("Point at t=5:", ray.pointAt(5).toString());
console.log("Point at t=10:", ray.pointAt(10).toString());

// ═══════════════════════════════════════════════════════════════
//  17. Geometry — AABB
// ═══════════════════════════════════════════════════════════════
section("17. Geometry — AxisAlignedBoundingBox");

const aabb = new AxisAlignedBoundingBox(
  new Vector3D(-2, -2, -2),
  new Vector3D(2, 2, 2),
);
console.log("Min:", aabb.min.toString());
console.log("Max:", aabb.max.toString());
console.log("Center:", aabb.center().toString());
console.log("Extents:", aabb.extents().toString());
console.log("Contains (1,1,1)?", aabb.contains(new Vector3D(1, 1, 1)));
console.log("Contains (5,0,0)?", aabb.contains(new Vector3D(5, 0, 0)));

aabb.expand(new Vector3D(5, 0, 0));
console.log("\nAfter expand(5,0,0):");
console.log("  Max:", aabb.max.toString());

// ═══════════════════════════════════════════════════════════════
//  18. Geometry — Intersections
// ═══════════════════════════════════════════════════════════════
section("18. Geometry — Intersections");

const intersections = new Intersections();

// Ray → Sphere
const intRay = new Ray(new Vector3D(0, 0, -10), new Vector3D(0, 0, 1));
const intSphere = new Sphere(Vector3D.core.zero(), 3);
const raySphereHit = intersections.raySphere(intRay, intSphere);
console.log("Ray → Sphere:", raySphereHit ? `Hit at t=${raySphereHit.t.toFixed(4)}, point=${raySphereHit.point.toString()}` : "Miss");

// Ray → Plane
const intPlane = new Plane(new Vector3D(0, 1, 0), 0);
const rayDown = new Ray(new Vector3D(0, 10, 0), new Vector3D(0, -1, 0));
const rayPlaneHit = intersections.rayPlane(rayDown, intPlane);
console.log("Ray → Plane:", rayPlaneHit ? `Hit at t=${rayPlaneHit.t.toFixed(4)}, point=${rayPlaneHit.point.toString()}` : "Miss");

// Ray → AABB
const intAABB = new AxisAlignedBoundingBox(
  new Vector3D(-1, -1, -1),
  new Vector3D(1, 1, 1),
);
const rayAABBHit = Intersections.RayAxisAlignedBoundingBox(
  new Ray(new Vector3D(-5, 0, 0), new Vector3D(1, 0, 0)),
  intAABB,
);
console.log("Ray → AABB:", rayAABBHit ? `Hit at t=${rayAABBHit.t.toFixed(4)}, point=${rayAABBHit.point.toString()}` : "Miss");

// Sphere → Sphere
const s1 = new Sphere(new Vector3D(0, 0, 0), 2);
const s2 = new Sphere(new Vector3D(3, 0, 0), 2);
const s3 = new Sphere(new Vector3D(10, 0, 0), 1);
console.log("Sphere ↔ Sphere (overlapping):", intersections.sphereSphere(s1, s2));
console.log("Sphere ↔ Sphere (separated):", intersections.sphereSphere(s1, s3));

// ═══════════════════════════════════════════════════════════════
//  19. Noise — Perlin
// ═══════════════════════════════════════════════════════════════
section("19. Noise — Perlin");

const perlin = new PerlinNoise(42);
console.log("Seed:", perlin.seed);
console.log("sample2D(1.5, 2.3):", perlin.sample2D(1.5, 2.3).toFixed(6));
console.log("sample3D(1.0, 2.0, 3.0):", perlin.sample3D(1.0, 2.0, 3.0).toFixed(6));
console.log("fbm2D(0.5, 0.5):", perlin.fbm2D(0.5, 0.5, 4).toFixed(6));
console.log("turbulence2D(0.5, 0.5):", perlin.turbulence2D(0.5, 0.5, 4).toFixed(6));
console.log("ridged2D(0.5, 0.5):", perlin.ridged2D(0.5, 0.5, 4).toFixed(6));

// Small 2D noise map
console.log("\n8x8 Perlin noise map (scaled 0-9):");
for (let y = 0; y < 8; y++) {
  let row = "  ";
  for (let x = 0; x < 8; x++) {
    const val = (perlin.sample2D(x * 0.3, y * 0.3) + 1) * 0.5; // normalize to [0,1]
    row += Math.floor(val * 9).toString() + " ";
  }
  console.log(row);
}

// ═══════════════════════════════════════════════════════════════
//  20. Noise — Simplex
// ═══════════════════════════════════════════════════════════════
section("20. Noise — Simplex");

const simplex = new SimplexNoise(42);
console.log("Seed:", simplex.seed);
console.log("sample2D(1.5, 2.3):", simplex.sample2D(1.5, 2.3).toFixed(6));
console.log("sample3D(1.0, 2.0, 3.0):", simplex.sample3D(1.0, 2.0, 3.0).toFixed(6));
console.log("fbm3D(0.5, 0.5, 0.5):", simplex.fbm3D(0.5, 0.5, 0.5, 4).toFixed(6));
console.log("turbulence3D(0.5, 0.5, 0.5):", simplex.turbulence3D(0.5, 0.5, 0.5, 4).toFixed(6));
console.log("ridged3D(0.5, 0.5, 0.5):", simplex.ridged3D(0.5, 0.5, 0.5, 4).toFixed(6));

// ═══════════════════════════════════════════════════════════════
//  21. Interpolation — Easing
// ═══════════════════════════════════════════════════════════════
section("21. Interpolation — Easing");

const t = 0.5;
console.log(`Easing functions at t=${t}:`);
console.log("  linear:", Easing.linear(t).toFixed(4));
console.log("  In.Quadratic:", Easing.In.Quadratic(t).toFixed(4));
console.log("  Out.Quadratic:", Easing.Out.Quadratic(t).toFixed(4));
console.log("  InOut.Quadratic:", Easing.InOut.Quadratic(t).toFixed(4));
console.log("  In.Cubic:", Easing.In.Cubic(t).toFixed(4));
console.log("  Out.Cubic:", Easing.Out.Cubic(t).toFixed(4));
console.log("  InOut.Cubic:", Easing.InOut.Cubic(t).toFixed(4));
console.log("  In.Sine:", Easing.In.Sine(t).toFixed(4));
console.log("  Out.Sine:", Easing.Out.Sine(t).toFixed(4));
console.log("  InOut.Sine:", Easing.InOut.Sine(t).toFixed(4));
console.log("  In.Exponential:", Easing.In.Exponential(t).toFixed(4));
console.log("  Out.Exponential:", Easing.Out.Exponential(t).toFixed(4));
console.log("  In.Elastic:", Easing.In.Elastic(t).toFixed(4));
console.log("  Out.Elastic:", Easing.Out.Elastic(t).toFixed(4));

const customEase = Easing.cubicBezier(0, 0.42, 0.58, 1);
console.log("\n  Custom cubic-bezier(0.42, 0.58):", customEase(t).toFixed(4));

// ═══════════════════════════════════════════════════════════════
//  22. Interpolation — Quadratic Bézier
// ═══════════════════════════════════════════════════════════════
section("22. Interpolation — Quadratic Bézier");

const qBez2D = new QuadraticBezier2D(
  new Vector2D(0, 0),
  new Vector2D(5, 10),
  new Vector2D(10, 0),
);
console.log("2D Quadratic Bézier (parabolic arc):");
for (let i = 0; i <= 4; i++) {
  const ti = i / 4;
  const p = qBez2D.getPoint(ti);
  console.log(`  t=${ti.toFixed(2)} → ${p.toString()}`);
}
const qBezCurv = qBez2D.curvature(0.5);
console.log("Curvature at t=0.5:", qBezCurv?.toFixed(6));

const qBez3D = new QuadraticBezier3D(
  new Vector3D(0, 0, 0),
  new Vector3D(5, 10, 5),
  new Vector3D(10, 0, 10),
);
console.log("\n3D Quadratic Bézier:");
console.log("  t=0.5 →", qBez3D.getPoint(0.5).toString());
console.log("  Velocity at 0.5:", qBez3D.velocity(0.5).toString());

// ═══════════════════════════════════════════════════════════════
//  23. Interpolation — Cubic Bézier
// ═══════════════════════════════════════════════════════════════
section("23. Interpolation — Cubic Bézier");

const cBez2D = new CubicBezier2D(
  new Vector2D(0, 0),
  new Vector2D(2, 10),
  new Vector2D(8, 10),
  new Vector2D(10, 0),
);
console.log("2D Cubic Bézier (S-curve):");
for (let i = 0; i <= 4; i++) {
  const ti = i / 4;
  const p = cBez2D.getPoint(ti);
  console.log(`  t=${ti.toFixed(2)} → ${p.toString()}`);
}
console.log("Velocity at t=0.5:", cBez2D.velocity(0.5).toString());
console.log("Acceleration at t=0.5:", cBez2D.acceleration(0.5).toString());
console.log("Jolt (constant):", cBez2D.jolt().toString());
console.log("Curvature at t=0.5:", cBez2D.curvature(0.5)?.toFixed(6));

const cBez3D = new CubicBezier3D(
  new Vector3D(0, 0, 0),
  new Vector3D(1, 5, 2),
  new Vector3D(4, 5, 8),
  new Vector3D(5, 0, 10),
);
console.log("\n3D Cubic Bézier:");
console.log("  t=0.0 →", cBez3D.getPoint(0).toString());
console.log("  t=0.5 →", cBez3D.getPoint(0.5).toString());
console.log("  t=1.0 →", cBez3D.getPoint(1).toString());
console.log("  Curvature at t=0.5:", cBez3D.curvature(0.5)?.toFixed(6));

// ═══════════════════════════════════════════════════════════════
//  24. Interpolation — Catmull-Rom Spline
// ═══════════════════════════════════════════════════════════════
section("24. Interpolation — Catmull-Rom Spline");

// Single segment
const crSeg = new CatmullRomSegment(
  new Vector(0, 0),
  new Vector(1, 2),
  new Vector(3, 3),
  new Vector(4, 0),
);
console.log("Single segment:");
for (let i = 0; i <= 4; i++) {
  const ti = i / 4;
  console.log(`  t=${ti.toFixed(2)} → ${crSeg.getPoint(ti).toString()}`);
}
console.log("  Velocity at t=0.5:", crSeg.velocity(0.5).toString());

// Chain (natural endpoint mode, centripetal)
const chainPoints = [
  new Vector(0, 0),
  new Vector(1, 3),
  new Vector(3, 4),
  new Vector(5, 2),
  new Vector(7, 5),
  new Vector(9, 1),
];
const chain = new CatmullRomChain(chainPoints, "natural", 0.5);

console.log(`\nCatmull-Rom chain (${chain.segmentCount} segments, centripetal, natural):`);
const samples = chain.getPoints(9);
for (let i = 0; i < samples.length; i++) {
  const ti = i / (samples.length - 1);
  console.log(`  t=${ti.toFixed(2)} → ${samples[i]!.toString()}`);
}

console.log("  Approx arc length:", chain.approximateLength(100).toFixed(4));
console.log("  Velocity at t=0.5:", chain.velocity(0.5).toString());

// Closed loop
const closedChain = new CatmullRomChain(
  [
    new Vector(0, 0),
    new Vector(2, 3),
    new Vector(5, 3),
    new Vector(7, 0),
  ],
  "closed",
  0.5,
);
console.log(`\nClosed chain (${closedChain.segmentCount} segments):`);
console.log("  Start:", closedChain.getPoint(0).toString());
console.log("  Mid:", closedChain.getPoint(0.5).toString());
console.log("  End:", closedChain.getPoint(1).toString());

// ═══════════════════════════════════════════════════════════════
//  Summary
// ═══════════════════════════════════════════════════════════════
section("Done!");
console.log("All Math package modules demonstrated successfully.");
