import type { Collider } from '../types';
export function intersects(x: number, z: number, radius: number, c: Collider) {
  const dx = x - Math.max(c.minX, Math.min(x, c.maxX));
  const dz = z - Math.max(c.minZ, Math.min(z, c.maxZ));
  return dx * dx + dz * dz < radius * radius;
}
// Axis separation allows sliding; fixed small substeps prevent tunnelling.
export function moveWithCollisions(x: number, z: number, dx: number, dz: number, radius: number, colliders: Collider[]) {
  const count = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (radius * .5)));
  for (let i = 0; i < count; i++) {
    if (!colliders.some(c => intersects(x + dx / count, z, radius, c))) x += dx / count;
    if (!colliders.some(c => intersects(x, z + dz / count, radius, c))) z += dz / count;
  }
  return { x, z };
}
export function floorAt(x: number, z: number) {
  if (z < -8 && z > -18) return { height: 0, material: 'wood' as const };
  if (z < -34 && z > -42) return { height: 0, material: 'digital' as const };
  if (z <= -42) return { height: 0, material: 'digital' as const };
  if (z <= -18) {
    // Four shallow steps and the accessible observation platform on the east side.
    const height = x > 4 && z < -22 && z > -30 ? Math.min(.6, Math.floor((x - 4) / .65 + 1) * .15) : 0;
    return { height, material: 'metal' as const };
  }
  return { height: 0, material: 'stone' as const };
}
