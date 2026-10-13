import * as T from 'three';
import type { Exhibit } from '../types';
import { placeLabel } from './labels';
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
    this.label.tabIndex = this.current ? 0 : -1;
    this.label.setAttribute('aria-hidden', String(!this.current));
    if (!this.current) return;
    const { work, group } = this.current;
    this.label.textContent = `${work.title}  ↗  E`;
    const width = innerWidth, height = innerHeight;
    const corners = [-1, 1].flatMap(x => [-1, 1].map(y => {
      const p = group.localToWorld(new T.Vector3(x * (work.displayWidth / 2 + .13), y * (work.displayHeight / 2 + .13), .16)).project(camera);
      return { x: (p.x * .5 + .5) * width, y: (-p.y * .5 + .5) * height };
    }));
    const bounds = { left: Math.min(...corners.map(p => p.x)), right: Math.max(...corners.map(p => p.x)), top: Math.min(...corners.map(p => p.y)), bottom: Math.max(...corners.map(p => p.y)) };
    const placement = placeLabel(bounds, width, height);
    const { x, y, width: labelWidth, edge } = placement;
    this.point.set(edge === 'right' ? work.displayWidth / 2 + .13 : edge === 'left' ? -work.displayWidth / 2 - .13 : 0, edge === 'top' ? work.displayHeight / 2 + .13 : edge === 'bottom' ? -work.displayHeight / 2 - .13 : .1, .16);
    group.localToWorld(this.point); this.point.project(camera);
    const ax = (this.point.x * .5 + .5) * width, ay = (-this.point.y * .5 + .5) * height;
    this.label.style.width = `${labelWidth}px`; this.label.style.left = `${x}px`; this.label.style.top = `${y}px`;
    this.line.setAttribute('x1', `${ax}`); this.line.setAttribute('y1', `${ay}`);
    this.line.setAttribute('x2', `${edge === 'right' ? x : edge === 'left' ? x + labelWidth : x + labelWidth / 2}`);
    this.line.setAttribute('y2', `${edge === 'top' ? y + 64 : edge === 'bottom' ? y : y + 20}`);
  }
}
