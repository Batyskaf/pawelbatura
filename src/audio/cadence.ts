export const cadenceConfig = { walkStride: 1.35, fastStride: 1.65, minimumInterval: .46 };
export class StepCadence {
  private distance = 0; private elapsed = 0;
  reset() { this.distance = this.elapsed = 0; }
  update(distance: number, dt: number, active: boolean) {
    if (!active || distance <= .0001 || dt <= 0) { this.reset(); return false; }
    this.distance += distance; this.elapsed += dt;
    const speed = distance / dt;
    const blend = Math.max(0, Math.min(1, (speed - 2.4) / 1.4));
    const stride = cadenceConfig.walkStride + (cadenceConfig.fastStride - cadenceConfig.walkStride) * blend;
    if (this.distance < stride || this.elapsed < cadenceConfig.minimumInterval) return false;
    this.distance = 0; this.elapsed = 0;
    return true;
  }
}
