import * as T from 'three';
import type { Exhibit } from '../types';
export class Interaction {
  current: Exhibit | null = null; ray = new T.Raycaster(); private point = new T.Vector3(); private fade = 0;
  constructor(private exhibits: Exhibit[], private label: HTMLButtonElement, private line: SVGLineElement) {}
  update(camera: T.PerspectiveCamera, dt: number, enabled: boolean) {
    this.ray.setFromCamera(new T.Vector2(0, 0), camera);
    const images = this.exhibits.filter(e => e.group.visible).map(e => e.image);
    const hit = enabled ? this.ray.intersectObjects(images, false)[0] : undefined;
    this.current = hit && hit.distance < 8.5 ? this.exhibits.find(e => e.image === hit.object)! : null;
    this.fade += ((this.current ? 1 : 0) - this.fade) * (1 - Math.exp(-10 * dt));
    this.label.style.opacity = `${this.fade}`; this.line.parentElement!.style.opacity = `${this.fade}`;
    this.label.style.pointerEvents = this.current ? 'auto' : 'none';
    if (!this.current) return;
    const { work, group } = this.current;
    this.label.textContent = `${work.title}  ↗  E`;
    const width = innerWidth, height = innerHeight;
    // Pick the screen side with more space; start at the artwork's outside edge.
    const center = group.getWorldPosition(new T.Vector3()).project(camera);
    const right = center.x <= 0;
    this.point.set((right ? 1 : -1) * (work.displayWidth / 2 + .13), .1, .16);
    group.localToWorld(this.point); this.point.project(camera);
    const ax = (this.point.x * .5 + .5) * width, ay = (-this.point.y * .5 + .5) * height;
    const labelWidth = Math.min(290, width * .34);
    const x = right ? Math.min(width - labelWidth - 20, ax + 60) : Math.max(20, ax - labelWidth - 60);
    const y = Math.max(90, Math.min(height - 120, ay - 80));
    this.label.style.width = `${labelWidth}px`; this.label.style.left = `${x}px`; this.label.style.top = `${y}px`;
    this.line.setAttribute('x1', `${ax}`); this.line.setAttribute('y1', `${ay}`);
    this.line.setAttribute('x2', `${right ? x : x + labelWidth}`); this.line.setAttribute('y2', `${y + 20}`);
  }
}
