import * as T from 'three';
import data from '../data/artworks.json';
import type { Artwork, Exhibit } from '../types';
import { paintingCenterHeight } from './layout';
export const artworks = data as Artwork[];
export class Exhibits {
  exhibits: Exhibit[] = []; private loader = new T.TextureLoader(); private disposed = false;
  private pending = 0; private queue: Exhibit[] = []; private textures = new Set<T.Texture>();
  constructor(scene: T.Scene, demo = false) {
    for (const work of demo ? artworks.filter(a => a.room === 'cabinet') : artworks) {
      const group = new T.Group(); group.position.fromArray(work.position); group.rotation.y = work.rotation; scene.add(group);
      group.position.y = paintingCenterHeight(work.displayHeight);
      const w = work.displayWidth, h = work.displayHeight;
      const gold = new T.MeshStandardMaterial({ color: work.frame === 'minimal' ? '#769a95' : '#b7995f', metalness: .7, roughness: .38 });
      const dark = new T.MeshStandardMaterial({ color: '#302920', roughness: .7 });
      const back = new T.Mesh(new T.BoxGeometry(w + .1, h + .1, .06), dark); group.add(back);
      for (const edge of [-1, 1]) {
        for (const inset of [0, .022]) {
          const vertical = new T.Mesh(new T.BoxGeometry(.018, h + .1 - inset * 2, .032), gold);
          vertical.position.set(edge * (w / 2 + .04 - inset), 0, .052); group.add(vertical);
          const horizontal = new T.Mesh(new T.BoxGeometry(w + .1 - inset * 2, .018, .032), gold);
          horizontal.position.set(0, edge * (h / 2 + .04 - inset), .052); group.add(horizontal);
        }
      }
      // Unlit sRGB works: exhibition lights and bloom never alter pigment colors.
      const imageWidth = Math.min(w, h * work.aspect), imageHeight = imageWidth / work.aspect;
      const image = new T.Mesh(new T.PlaneGeometry(imageWidth, imageHeight), new T.MeshBasicMaterial({ color: '#6a6a5a', toneMapped: false })); image.position.z = .075; group.add(image);
      const label = new T.Mesh(new T.BoxGeometry(.24, .065, .025), new T.MeshStandardMaterial({ color: '#d2bc8a', metalness: .5 }));
      label.position.set(w / 2 + .21, -h / 2 + .035, .065); group.add(label);
      this.exhibits.push({ work, group, image, loaded: false });
    }
  }
  update(camera: T.Camera) {
    for (const exhibit of this.exhibits) {
      const distance = camera.position.distanceTo(exhibit.group.position);
      exhibit.group.visible = distance < 30;
      if (distance < 24 && !exhibit.loaded) { exhibit.loaded = true; this.queue.push(exhibit); }
    }
    while (this.pending < 3 && this.queue.length) {
      const exhibit = this.queue.shift()!; this.pending++;
      this.loader.load(exhibit.work.texture, texture => {
        this.pending--;
        if (this.disposed) { texture.dispose(); return; }
        texture.colorSpace = T.SRGBColorSpace; texture.anisotropy = 4; this.textures.add(texture);
        const material = exhibit.image.material as T.MeshBasicMaterial; material.map = texture; material.color.set('#ffffff'); material.needsUpdate = true;
      }, undefined, () => { this.pending--; exhibit.loaded = false; });
    }
  }
  dispose() { this.disposed = true; this.textures.forEach(t => t.dispose()); }
}
