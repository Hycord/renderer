import { Vector3D } from "../Vector";
import type { AxisAlignedBoundingBox } from "./AxisAlignedBoundingBox";
import type { Circle } from "./Circle";
import type { Plane } from "./Plane";
import type { Ray } from "./Ray";
import type { Sphere } from "./Sphere";

export interface Intersection {
  hit: true;
  t: number;
  point: Vector3D;
}

export class Intersections {
  static RayAxisAlignedBoundingBox(
    ray: Ray,
    boundingBox: AxisAlignedBoundingBox,
  ): Intersection | undefined {
    let tmin = (boundingBox.min.x - ray.origin.x) / ray.direction.x;
    let tmax = (boundingBox.max.x - ray.origin.x) / ray.direction.x;

    if (tmin > tmax) {
      [tmin, tmax] = [tmax, tmin];
    }

    let tymin = (boundingBox.min.y - ray.origin.y) / ray.direction.y;
    let tymax = (boundingBox.max.y - ray.origin.y) / ray.direction.y;

    if (tymin > tymax) {
      [tymin, tymax] = [tymax, tymin];
    }

    if (tmin > tymax || tymin > tmax) {
      return undefined;
    }

    if (tymin > tmin) {
      tmin = tymin;
    }

    if (tymax < tmax) {
      tmax = tymax;
    }

    let tzmin = (boundingBox.min.z - ray.origin.z) / ray.direction.z;
    let tzmax = (boundingBox.max.z - ray.origin.z) / ray.direction.z;

    if (tzmin > tzmax) {
      [tzmin, tzmax] = [tzmax, tzmin];
    }

    if (tmin > tzmax || tzmin > tmax) {
      return undefined;
    }

    if (tzmin > tmin) {
      tmin = tzmin;
    }

    if (tzmax < tmax) {
      tmax = tzmax;
    }

    if (tmin < 0 && tmax < 0) {
      return undefined; // Both intersections are behind the ray origin
    }

    const t = tmin >= 0 ? tmin : tmax; // If tmin is negative, use tmax

    return {
      hit: true,
      t,
      point: ray.pointAt(t),
    };
  }

  rayPlane(ray: Ray, plane: Plane): Intersection | undefined {
    const denominator =
      plane.normal.x * ray.direction.x +
      plane.normal.y * ray.direction.y +
      plane.normal.z * ray.direction.z;

    if (Math.abs(denominator) < 1e-6) {
      return undefined; // Ray is parallel to the plane
    }

    const t =
      (plane.distance -
        (plane.normal.x * ray.origin.x +
          plane.normal.y * ray.origin.y +
          plane.normal.z * ray.origin.z)) /
      denominator;

    if (t < 0) {
      return undefined; // Intersection is behind the ray origin
    }

    return {
      hit: true,
      t,
      point: ray.pointAt(t),
    };
  }

  raySphere(ray: Ray, sphere: Sphere): Intersection | undefined {
    const oc = new Vector3D(
      ray.origin.x - sphere.center.x,
      ray.origin.y - sphere.center.y,
      ray.origin.z - sphere.center.z,
    );
    const a =
      ray.direction.x * ray.direction.x +
      ray.direction.y * ray.direction.y +
      ray.direction.z * ray.direction.z;
    const b =
      2 *
      (oc.x * ray.direction.x +
        oc.y * ray.direction.y +
        oc.z * ray.direction.z);
    const c =
      oc.x * oc.x + oc.y * oc.y + oc.z * oc.z - sphere.radius * sphere.radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return undefined; // No intersection
    }

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDiscriminant) / (2 * a);
    const t2 = (-b + sqrtDiscriminant) / (2 * a);

    const t = t1 >= 0 ? t1 : t2; // Use the closest positive intersection

    if (t < 0) {
      return undefined; // Both intersections are behind the ray origin
    }

    return {
      hit: true,
      t,
      point: ray.pointAt(t),
    };
  }

  AxisAlignedBoundingBoxAxisAlignedBoundingBox(
    box1: AxisAlignedBoundingBox,
    box2: AxisAlignedBoundingBox,
  ): boolean {
    return !(
      box1.max.x < box2.min.x ||
      box1.min.x > box2.max.x ||
      box1.max.y < box2.min.y ||
      box1.min.y > box2.max.y ||
      box1.max.z < box2.min.z ||
      box1.min.z > box2.max.z
    );
  }

  sphereSphere(sphere1: Sphere, sphere2: Sphere): boolean {
    const distanceSquared = sphere1.center
      .subtract(sphere2.center)
      .magnitudeSquared();
    const radiusSum = sphere1.radius + sphere2.radius;
    return distanceSquared <= radiusSum * radiusSum;
  }

  rayCircle(ray: Ray, circle: Circle): Intersection | undefined {
    // This is a 2D Intersection test so Z components are ignored
    const oc = new Vector3D(
      ray.origin.x - circle.center.x,
      ray.origin.y - circle.center.y,
      0,
    );
    const a =
      ray.direction.x * ray.direction.x + ray.direction.y * ray.direction.y;
    const b = 2 * (oc.x * ray.direction.x + oc.y * ray.direction.y);
    const c = oc.x * oc.x + oc.y * oc.y - circle.radius * circle.radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return undefined; // No intersection
    }

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDiscriminant) / (2 * a);
    const t2 = (-b + sqrtDiscriminant) / (2 * a);

    const t = t1 >= 0 ? t1 : t2; // Use the closest positive intersection

    if (t < 0) {
      return undefined; // Both intersections are behind the ray origin
    }

    return {
      hit: true,
      t,
      point: ray.pointAt(t),
    };
  }
}
