import * as T from 'three';
import { effectPresets } from '../config';
import type { Settings } from '../types';
export function activationState(distance: number, active: boolean, range: number, hysteresis: number) {
  return active ? distance <= range + hysteresis : distance < range;
}
export function progressStep(progress: number, target: number, dt: number, duration: number) {
  return Math.max(0, Math.min(1, progress + Math.sign(target - progress) * Math.min(Math.abs(target - progress), dt / duration)));
}
type Kind = keyof typeof effectPresets;
class Transformation {
  group = new T.Group(); active = false; progress = 0; particles: T.InstancedMesh;
  surface: T.Mesh; uniform = { value: 0 }; dummy = new T.Object3D(); points: T.Vector3[] = []; offsets: T.Vector3[] = [];
  pieces: T.Mesh[] = []; config; lastSound = -10;
  constructor(public kind: Kind, position: T.Vector3, scene: T.Scene) {
    this.config = { ...effectPresets[kind] }; this.group.position.copy(position); scene.add(this.group);
    const c = this.config;
    const material = new T.MeshStandardMaterial({ color: kind === 'dissolve' ? '#71928c' : '#9c8b69', metalness: .35, roughness: .65 });
    material.onBeforeCompile = shader => {
      shader.uniforms.uAssembly = this.uniform;
      shader.vertexShader = 'varying vec3 vLocal;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;');
      shader.fragmentShader = 'uniform float uAssembly; varying vec3 vLocal;\n' + shader.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        vec3 cell = floor(vLocal * ${c.density.toFixed(1)});
        float noise = fract(sin(dot(cell, vec3(12.9898,78.233,37.719))) * 43758.5453);
        float threshold = ${kind === 'dissolve' ? 'noise' : '(vLocal.y + 1.5) / 3.0 * .8 + noise * .2'};
        if (threshold > uAssembly) discard;`);
    };
    material.customProgramCacheKey = () => `assembly-${kind}`;
    this.surface = new T.Mesh(new T.BoxGeometry(.12, 3, 3.6), material); this.group.add(this.surface);
    const count = c.maxParticles;
    this.particles = new T.InstancedMesh(new T.BoxGeometry(c.size, c.size, c.size), new T.MeshStandardMaterial({ color: '#81cfc4', emissive: '#50ab9e', emissiveIntensity: c.glow, metalness: .4, roughness: .4 }), count);
    this.particles.frustumCulled = false; this.group.add(this.particles);
    for (let i = 0; i < count; i++) {
      const seeded = (n: number) => { const v = Math.sin((i + 1) * n * 127.1) * 43758.5453; return v - Math.floor(v); };
      this.points.push(new T.Vector3(0, (Math.floor(i / 20) / Math.ceil(count / 20) - .5) * 3, (i % 20 / 19 - .5) * 3.6));
      this.offsets.push(new T.Vector3((seeded(1) - .5) * c.randomness, (seeded(2) - .5) * 3, (seeded(3) - .5) * 4));
    }
    if (kind === 'structure') {
      this.surface.visible = false;
      for (let i = 0; i < 12; i++) {
        const piece = new T.Mesh(new T.BoxGeometry(.22, .22, 3.8), new T.MeshStandardMaterial({ color: '#bda676', metalness: .65, roughness: .35 }));
        piece.position.y = -1.4 + i * .255; this.group.add(piece); this.pieces.push(piece);
      }
    }
    this.update(0, 0, 100, { effects: true, reducedMotion: false, quality: 'high' } as Settings);
  }
  update(dt: number, time: number, distance: number, settings: Settings) {
    this.active = activationState(distance, this.active, this.config.activation, this.config.hysteresis);
    const target = !settings.effects || settings.reducedMotion ? 1 : Number(this.active);
    this.progress = settings.reducedMotion || !settings.effects ? 1 : progressStep(this.progress, target, dt, this.config.duration);
    const p = this.progress, c = this.config;
    this.uniform.value = p;
    this.group.visible = distance < 32;
    if (this.kind !== 'structure') this.surface.visible = p > 0;
    this.particles.visible = settings.effects && !settings.reducedMotion && p < .995;
    const count = settings.quality === 'low' ? Math.floor(c.maxParticles / 2) : c.maxParticles;
    this.particles.count = count;
    for (let i = 0; i < count; i++) {
      const order = this.kind === 'dissolve' ? ((i * .618033) % 1) : (c.direction === 1 ? i / count : 1 - i / count);
      const t = T.MathUtils.smoothstep(p, order * .65, .35 + order * .65);
      this.dummy.position.copy(this.points[i]).addScaledVector(this.offsets[i], 1 - t);
      this.dummy.position.y += Math.sin(time * .55 + i) * .08 * (1 - t);
      this.dummy.rotation.set((1 - t) * i * .1, (1 - t) * 2, 0);
      const scale = p > .82 ? Math.max(0, (1 - p) / .18) : .65 + .35 * t;
      this.dummy.scale.setScalar(scale); this.dummy.updateMatrix(); this.particles.setMatrixAt(i, this.dummy.matrix);
    }
    this.particles.instanceMatrix.needsUpdate = true;
    this.pieces.forEach((piece, i) => {
      const t = T.MathUtils.smoothstep(p, i / this.pieces.length * .8, (i + 1) / this.pieces.length * .8 + .2);
      piece.visible = t > .01; piece.scale.z = Math.max(.001, t); piece.position.x = (1 - t) * .8;
    });
    return p > .05 && p < .95;
  }
}
export class Materialization {
  transforms: Transformation[]; activeCount = 0; particles = 0;
  constructor(scene: T.Scene, demo = false) {
    this.transforms = [
      new Transformation('voxel', new T.Vector3(1.82, 2.4, -12), scene),
      new Transformation('dissolve', new T.Vector3(-1.82, 2.4, -15), scene),
      new Transformation('structure', new T.Vector3(1.72, 2.4, -17), scene)
    ];
    if (!demo) {
      this.transforms.push(new Transformation('voxel', new T.Vector3(1.82, 2.4, -37), scene));
      this.transforms.push(new Transformation('dissolve', new T.Vector3(-1.82, 2.4, -40), scene));
      this.transforms.push(new Transformation('structure', new T.Vector3(-8.8, 5.1, -51), scene));
    }
  }
  update(dt: number, time: number, camera: T.Camera, settings: Settings, sound: (position: T.Vector3) => void) {
    this.activeCount = this.particles = 0;
    for (const fx of this.transforms) {
      const wasActive = fx.active;
      const transitioning = fx.update(dt, time, camera.position.distanceTo(fx.group.position), settings);
      if (transitioning && fx.group.visible) this.activeCount++;
      if (fx.particles.visible && fx.group.visible) this.particles += fx.particles.count;
      if (wasActive !== fx.active && time - fx.lastSound > 3 && settings.effects && !settings.reducedMotion) { sound(fx.group.position); fx.lastSound = time; }
    }
  }
}
