import * as T from 'three';
import { effectPresets } from '../config';
import type { EffectTarget, Settings } from '../types';
export function activationState(distance: number, active: boolean, range: number, hysteresis: number) {
  return active ? distance <= range + hysteresis : distance < range;
}
export function progressStep(progress: number, target: number, dt: number, duration: number) {
  return Math.max(0, Math.min(1, progress + Math.sign(target - progress) * Math.min(Math.abs(target - progress), dt / duration)));
}
interface Triangle { a: T.Vector3; b: T.Vector3; c: T.Vector3; normal: T.Vector3; totalArea: number }
interface Piece { mesh: T.Mesh; position: T.Vector3; scale: T.Vector3; bottom: number }
class Transformation {
  group = new T.Group(); active = false; progress = 0; particles: T.InstancedMesh;
  surface: T.Group; uniform = { value: 0 }; dummy = new T.Object3D(); points: T.Vector3[] = []; offsets: T.Vector3[] = [];
  pieces: Piece[] = []; config; lastSound = -10; bounds: T.Box3; center: T.Vector3; size: T.Vector3;
  constructor(public target: EffectTarget, scene: T.Scene) {
    this.config = { ...effectPresets[target.kind] }; this.surface = target.object;
    this.surface.updateWorldMatrix(true, true); this.bounds = new T.Box3().setFromObject(this.surface);
    this.center = this.bounds.getCenter(new T.Vector3()); this.size = this.bounds.getSize(new T.Vector3());
    this.group.position.copy(this.center); this.group.name = `${target.id}-particles`; scene.add(this.group);
    const triangles: Triangle[] = []; let totalArea = 0;
    this.surface.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      this.pieces.push({ mesh: object, position: object.position.clone(), scale: object.scale.clone(), bottom: new T.Box3().setFromObject(object).min.y });
      const original = Array.isArray(object.material) ? object.material : [object.material];
      const materials = original.map(material => {
        const clone = material.clone();
        if (target.kind !== 'structure') this.addDissolve(clone);
        return clone;
      });
      object.material = Array.isArray(object.material) ? materials : materials[0];
      if (target.kind !== 'structure') {
        const depth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking }); this.addDissolve(depth); object.customDepthMaterial = depth;
      }
      // Sample actual transformed mesh triangles, not a substitute box or a decorative panel.
      const attribute = object.geometry.getAttribute('position'), index = object.geometry.index;
      const count = index ? index.count : attribute.count;
      for (let i = 0; i < count; i += 3) {
        const a = new T.Vector3().fromBufferAttribute(attribute, index ? index.getX(i) : i).applyMatrix4(object.matrixWorld);
        const b = new T.Vector3().fromBufferAttribute(attribute, index ? index.getX(i + 1) : i + 1).applyMatrix4(object.matrixWorld);
        const c = new T.Vector3().fromBufferAttribute(attribute, index ? index.getX(i + 2) : i + 2).applyMatrix4(object.matrixWorld);
        const normal = b.clone().sub(a).cross(c.clone().sub(a)); const area = normal.length() / 2;
        if (area < .000001) continue;
        totalArea += area; triangles.push({ a, b, c, normal: normal.normalize(), totalArea });
      }
    });
    this.pieces.sort((a, b) => a.bottom - b.bottom || a.position.x - b.position.x);
    const count = this.config.maxParticles;
    this.particles = new T.InstancedMesh(new T.BoxGeometry(this.config.size, this.config.size, this.config.size), new T.MeshStandardMaterial({ color: '#81cfc4', emissive: '#50ab9e', emissiveIntensity: this.config.glow, metalness: .4, roughness: .4 }), count);
    this.particles.frustumCulled = false; this.group.add(this.particles);
    for (let i = 0; i < count; i++) {
      const random = (n: number) => { const value = Math.sin((i + 1) * n * 127.1) * 43758.5453; return value - Math.floor(value); };
      const sample = random(1) * totalArea;
      let lo = 0, hi = triangles.length - 1;
      while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (triangles[mid].totalArea < sample) lo = mid + 1; else hi = mid; }
      const tri = triangles[lo];
      const u = Math.sqrt(random(2)), v = random(3);
      this.points.push(tri.a.clone().multiplyScalar(1 - u).addScaledVector(tri.b, u * (1 - v)).addScaledVector(tri.c, u * v).sub(this.center));
      const offset = tri.normal.clone().multiplyScalar(this.config.randomness * (.5 + random(4)));
      offset.add(new T.Vector3((random(5) - .5) * 1.4, (random(6) - .5) * 2, (random(7) - .5) * 1.4)); this.offsets.push(offset);
    }
    this.update(0, 0, 100, { effects: true, reducedMotion: false, quality: 'high' } as Settings);
  }
  private addDissolve(material: T.Material) {
    material.onBeforeCompile = shader => {
      shader.uniforms.uAssembly = this.uniform;
      shader.vertexShader = 'varying vec3 vAssemblyPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvAssemblyPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      const threshold = this.target.kind === 'dissolve' ? 'noise' : `clamp((vAssemblyPosition.y - ${this.bounds.min.y.toFixed(4)}) / ${Math.max(.01, this.size.y).toFixed(4)}, 0.0, 1.0) * .75 + noise * .25`;
      shader.fragmentShader = 'uniform float uAssembly; varying vec3 vAssemblyPosition;\n' + shader.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        vec3 cell = floor(vAssemblyPosition * ${this.config.density.toFixed(1)});
        float noise = fract(sin(dot(cell, vec3(12.9898,78.233,37.719))) * 43758.5453);
        float threshold = ${threshold};
        if (threshold > uAssembly) discard;`);
    };
    material.customProgramCacheKey = () => `full-object-${this.target.id}-${material.type}`;
  }
  update(dt: number, time: number, distance: number, settings: Settings) {
    this.active = activationState(distance, this.active, this.config.activation, this.config.hysteresis);
    const target = !settings.effects || settings.reducedMotion ? 1 : Number(this.active);
    this.progress = settings.reducedMotion || !settings.effects ? 1 : progressStep(this.progress, target, dt, this.config.duration);
    const p = this.progress, config = this.config; this.uniform.value = p;
    this.group.visible = distance < 24;
    this.particles.visible = settings.effects && !settings.reducedMotion && p < .995;
    const count = settings.quality === 'low' ? Math.floor(config.maxParticles / 2) : config.maxParticles; this.particles.count = count;
    if (this.group.visible && this.particles.visible) {
      for (let i = 0; i < count; i++) {
        const order = this.target.kind === 'dissolve' ? ((i * .618033) % 1) : T.MathUtils.clamp((this.points[i].y + this.size.y / 2) / Math.max(.01, this.size.y), 0, 1);
        const t = T.MathUtils.smoothstep(p, order * .65, .35 + order * .65);
        this.dummy.position.copy(this.points[i]).addScaledVector(this.offsets[i], 1 - t);
        this.dummy.position.y += Math.sin(time * .55 + i) * .07 * (1 - t);
        this.dummy.rotation.set((1 - t) * i * .1, (1 - t) * 2, 0);
        this.dummy.scale.setScalar(p > .85 ? Math.max(0, (1 - p) / .15) : .65 + .35 * t);
        this.dummy.updateMatrix(); this.particles.setMatrixAt(i, this.dummy.matrix);
      }
      this.particles.instanceMatrix.needsUpdate = true;
    }
    if (this.target.kind === 'structure') this.pieces.forEach((piece, i) => {
      const t = T.MathUtils.smoothstep(p, i / this.pieces.length * .75, (i + 1) / this.pieces.length * .75 + .25);
      piece.mesh.visible = t > .001;
      piece.mesh.position.copy(piece.position); piece.mesh.position.y += (1 - t) * .35;
      piece.mesh.scale.copy(piece.scale).multiplyScalar(Math.max(.001, t));
    });
    return p > .05 && p < .95;
  }
}
export class Materialization {
  transforms: Transformation[]; activeCount = 0; particles = 0;
  private nearest = new T.Vector3();
  constructor(scene: T.Scene, targets: EffectTarget[]) { this.transforms = targets.map(target => new Transformation(target, scene)); }
  update(dt: number, time: number, camera: T.Camera, settings: Settings, sound: (position: T.Vector3) => void) {
    this.activeCount = this.particles = 0;
    for (const fx of this.transforms) {
      const wasActive = fx.active;
      const distance = fx.bounds.clampPoint(camera.position, this.nearest).distanceTo(camera.position);
      const transitioning = fx.update(dt, time, distance, settings);
      if (transitioning && fx.group.visible) this.activeCount++;
      if (fx.particles.visible && fx.group.visible) this.particles += fx.particles.count;
      if (wasActive !== fx.active && time - fx.lastSound > 3 && settings.effects && !settings.reducedMotion) { sound(fx.center); fx.lastSound = time; }
    }
  }
}
