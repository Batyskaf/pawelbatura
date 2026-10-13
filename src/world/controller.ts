import { PerspectiveCamera, Vector3, Euler } from 'three';
import { movement } from '../config';
import { floorAt, moveWithCollisions } from './collision';
import type { Collider, Settings } from '../types';
export class Controller {
  keys = new Set<string>(); yaw = 0; pitch = 0; velocity = { x: 0, z: 0 }; enabled = false;
  private abort = new AbortController();
  constructor(public camera: PerspectiveCamera, public canvas: HTMLCanvasElement, private colliders: Collider[], private settings: Settings) {
    const signal = this.abort.signal;
    document.addEventListener('keydown', e => {
      if (this.enabled && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) { e.preventDefault(); this.keys.add(e.code); }
    }, { signal });
    document.addEventListener('keyup', e => this.keys.delete(e.code), { signal });
    window.addEventListener('blur', () => this.stop(), { signal });
    document.addEventListener('mousemove', e => {
      if (!this.enabled || document.pointerLockElement !== canvas) return;
      this.yaw -= e.movementX * movement.lookSensitivity * settings.sensitivity;
      this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch - e.movementY * movement.lookSensitivity * settings.sensitivity));
      this.applyLook();
    }, { signal });
    camera.position.set(0, movement.eyeHeight, 6);
  }
  applyLook() { this.camera.quaternion.setFromEuler(new Euler(this.pitch, this.yaw, 0, 'YXZ')); }
  stop() { this.keys.clear(); this.velocity.x = this.velocity.z = 0; this.enabled = false; }
  update(dt: number) {
    if (!this.enabled) return { distance: 0, surface: floorAt(this.camera.position.x, this.camera.position.z).material };
    const forward = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
    const side = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    const length = Math.hypot(forward, side) || 1;
    const speed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? movement.fastSpeed : movement.speed;
    const targetX = (side * Math.cos(this.yaw) - forward * Math.sin(this.yaw)) / length * speed;
    const targetZ = (-side * Math.sin(this.yaw) - forward * Math.cos(this.yaw)) / length * speed;
    const blend = 1 - Math.exp(-movement.acceleration * dt);
    this.velocity.x += (targetX - this.velocity.x) * blend;
    this.velocity.z += (targetZ - this.velocity.z) * blend;
    const before = this.camera.position.clone();
    const next = moveWithCollisions(before.x, before.z, this.velocity.x * dt, this.velocity.z * dt, movement.radius, this.colliders);
    const floor = floorAt(next.x, next.z);
    this.camera.position.set(next.x, floor.height + movement.eyeHeight, next.z);
    return { distance: Math.hypot(next.x - before.x, next.z - before.z), surface: floor.material };
  }
  face(position: Vector3, target: Vector3) {
    this.stop(); this.camera.position.copy(position); this.camera.lookAt(target);
    const e = new Euler().setFromQuaternion(this.camera.quaternion, 'YXZ'); this.pitch = e.x; this.yaw = e.y;
  }
  dispose() { this.abort.abort(); }
}
