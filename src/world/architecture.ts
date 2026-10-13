import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rooms, architectureLevels } from '../config';
import type { Collider, Room, EffectTarget, EffectKind } from '../types';
export class Architecture {
  groups = new Map<string, T.Group>(); colliders: Collider[] = []; mechanisms: T.Group[] = [];
  effectTargets: EffectTarget[] = [];
  private box = new T.BoxGeometry(1, 1, 1);
  private cylinder = new T.CylinderGeometry(1, 1, 1, 20);
  private sphere = new T.SphereGeometry(1, 24, 16);
  private materials = new Map<string, T.MeshStandardMaterial>();
  private grain = this.surfaceTexture();
  private surfaceTexture() {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d')!; const pixels = context.createImageData(256, 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const vein = Math.sin(x * .075 + Math.sin(y * .025) * 4 + Math.sin(x * .014 + y * .035) * 3);
      const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const value = 218 + vein * 14 + (seed - Math.floor(seed)) * 20;
      const offset = (y * 256 + x) * 4; pixels.data[offset] = pixels.data[offset + 1] = pixels.data[offset + 2] = value; pixels.data[offset + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
    const texture = new T.CanvasTexture(canvas); texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.repeat.set(2, 2); return texture;
  }
  constructor(public scene: T.Scene, public demo = false) {
    for (const room of demo ? rooms.slice(0, 1) : rooms) this.room(room);
    this.corridor(-13, 10, 'wood');
    if (!demo) this.corridor(-38, 8, 'digital');
    if (demo) this.obstacle(-2, 2, -18.3, -17.9);
  }
  material(color: string, metalness = 0, roughness = .8) {
    const key = `${color}/${metalness}/${roughness}`;
    if (!this.materials.has(key)) this.materials.set(key, new T.MeshStandardMaterial({ color, metalness, roughness, bumpMap: this.grain, bumpScale: metalness > .3 ? .025 : .07 }));
    return this.materials.get(key)!;
  }
  mesh(group: T.Group, geometry: T.BufferGeometry, material: T.Material, pos: number[], scale: number[]) {
    const mesh = new T.Mesh(geometry, material); mesh.position.set(pos[0], pos[1], pos[2]); mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
  }
  block(g: T.Group, pos: number[], scale: number[], color: string, metalness = 0) { return this.mesh(g, this.box, this.material(color, metalness), pos, scale); }
  obstacle(minX: number, maxX: number, minZ: number, maxZ: number) { this.colliders.push({ minX, maxX, minZ, maxZ }); }
  captureTarget(parent: T.Group, start: number, id: string, kind: EffectKind) {
    const object = new T.Group(); object.name = id;
    parent.children.slice(start).forEach(child => object.add(child)); parent.add(object);
    if (kind !== 'structure') this.batch(object);
    this.effectTargets.push({ id, kind, object });
    return object;
  }
  arch(g: T.Group, x: number, y: number, z: number, radius: number, rotation = 0, color = '#bca376') {
    const group = new T.Group(); group.position.set(x, y, z); group.rotation.y = rotation;
    const geo = new T.TorusGeometry(radius, .12, 8, 36, Math.PI);
    const ring = new T.Mesh(geo, this.material(color, .35)); group.add(ring); g.add(group);
    for (const side of [-1, 1]) this.block(group, [side * radius, -y / 2, 0], [.19, y, .22], color, .35);
  }
  room(room: Room) {
    const g = new T.Group(); g.position.z = room.center; this.scene.add(g); this.groups.set(room.id, g);
    const w = room.width / 2, l = room.length / 2, h = room.height;
    const [wall, stone, brass] = room.palette;
    this.block(g, [0, -.2, 0], [room.width, .4, room.length], stone);
    // Instanced inlaid floor: shared geometry and only two draw calls.
    for (const parity of [0, 1]) {
      const coords: number[][] = [];
      for (let x = -w + .5; x < w; x++) for (let z = -l + .5; z < l; z++) if ((Math.round(x + w - .5) + Math.round(z + l - .5)) % 2 === parity) coords.push([x, .006, z]);
      const tiles = new T.InstancedMesh(this.box, this.material(parity ? '#514f43' : stone, .08, .58), coords.length);
      const dummy = new T.Object3D(); dummy.scale.set(.985, .015, .985);
      coords.forEach((p, i) => { dummy.position.set(p[0], p[1], p[2]); dummy.updateMatrix(); tiles.setMatrixAt(i, dummy.matrix); });
      tiles.receiveShadow = true; g.add(tiles);
    }
    this.block(g, [0, h + .12, 0], [room.width + .4, .3, room.length + .4], '#21302d');
    for (const side of [-1, 1]) {
      const wallStart = g.children.length;
      this.block(g, [side * w, h / 2, 0], [.35, h, room.length], wall);
      this.obstacle(side * w - .18, side * w + .18, room.center - l, room.center + l);
      this.block(g, [side * (w - .21), .62, 0], [.18, 1.2, room.length], room.material === 'stone' ? '#342d23' : '#394642');
      for (const y of [.1, architectureLevels.dadoCenter, h - .55, h - .3]) this.block(g, [side * (w - .2), y, 0], [.22, architectureLevels.trimThickness, room.length], brass, .45);
      for (const z of [-7, -2.35, 2.35, 7]) {
        const x = side * (w - .65);
        this.mesh(g, this.cylinder, this.material(stone), [x, h / 2 - .2, z], [.23, h - .4, .23]);
        this.block(g, [x, .16, z], [.68, .3, .68], stone);
        this.block(g, [x, h - .35, z], [.7, .3, .7], brass, .35);
        this.obstacle(x - .35, x + .35, room.center + z - .35, room.center + z + .35);
      }
      for (const z of [-4.7, 0, 4.7]) {
        this.arch(g, side * (w - .25), 3.3, z, 1.75, Math.PI / 2, brass);
        const lamp = this.block(g, [side * (w - .9), 4.75, z], [.4, .08, .5], brass, .5);
        lamp.material = new T.MeshStandardMaterial({ color: '#ffdeb2', emissive: '#ffd397', emissiveIntensity: 1.5 });
      }
      if (room.id === 'archive' || room.id === 'observatory') this.captureTarget(g, wallStart, `${room.id}-wall-${side}`, side < 0 ? 'voxel' : 'dissolve');
    }
    for (const end of [-1, 1]) {
      const door = (end === -1 && room.id !== 'archive') || (end === 1 && room.id !== 'cabinet');
      if (door) {
        for (const side of [-1, 1]) {
          this.block(g, [side * (w / 2 + 1), h / 2, end * l], [w - 2, h, .35], wall);
          this.obstacle(side === -1 ? -w : 2, side === -1 ? -2 : w, room.center + end * l - .18, room.center + end * l + .18);
        }
        this.block(g, [0, h - 1.2, end * l], [4, 2.4, .35], wall);
        this.arch(g, 0, 3.2, end * (l - .2), 2, 0, brass);
      } else {
        this.block(g, [0, h / 2, end * l], [room.width, h, .35], wall);
        this.obstacle(-w, w, room.center + end * l - .18, room.center + end * l + .18);
        this.arch(g, 0, 3.2, end * (l - .25), 2.6, 0, brass);
      }
    }
    // Coffered roof, cross-ribs, central suspended celestial mechanism.
    for (const z of [-5, 0, 5]) {
      this.block(g, [0, h - .45, z], [room.width, .25, .25], brass, .35);
      const rib = new T.Mesh(new T.TorusGeometry(w - .55, .09, 8, 48, Math.PI), this.material(brass, .4));
      rib.position.set(0, h - w * .5, z); rib.scale.y = .5; g.add(rib);
    }
    if (room.id === 'cabinet') this.orrery(g, 0, -1, brass);
    else if (room.id === 'observatory') this.observatory(g, brass);
    else this.digitalArchive(g, brass);
    this.obstacle(-1.45, 1.45, room.center - (room.id === 'cabinet' ? 1 : 0) - 1.45, room.center - (room.id === 'cabinet' ? 1 : 0) + 1.45);
    // Glass specimen cabinets in two corner niches.
    for (const side of [-1, 1]) {
      const x = side * (w - 2), z = -l + 1.4;
      this.block(g, [x, .65, z], [1.1, 1.3, .9], '#352f26');
      const glass = new T.MeshPhysicalMaterial({ color: '#97b8af', transparent: true, opacity: .13, roughness: .18, depthWrite: false });
      this.mesh(g, this.box, glass, [x, 1.8, z], [1, 1, .8]);
      const specimen = this.mesh(g, new T.IcosahedronGeometry(.34, 1), this.material(brass, .65, .3), [x, 1.8, z], [1, 1.2, 1]); specimen.rotation.z = .35;
      this.obstacle(x - .6, x + .6, room.center + z - .5, room.center + z + .5);
    }
    const light = new T.PointLight('#ffd8a2', 65, 23, 2); light.position.set(0, h - 2, 2); g.add(light);
    const cool = new T.PointLight('#89c8c3', 28, 20, 2); cool.position.set(0, 4, -5); g.add(cool);
    if (room.id === 'observatory') this.platform(g, room.center);
    this.batch(g);
  }
  orrery(g: T.Group, x: number, z: number, brass: string) {
    this.mesh(g, this.cylinder, this.material('#302e26'), [x, .3, z], [1.4, .6, 1.4]);
    this.mesh(g, this.cylinder, this.material(brass, .65), [x, .65, z], [1.3, .12, 1.3]);
    this.mesh(g, this.cylinder, this.material(brass, .65), [x, 1.1, z], [.12, .8, .12]);
    const instrument = new T.Group(); instrument.position.set(x, 2.3, z); g.add(instrument); this.mechanisms.push(instrument);
    for (let i = 0; i < 4; i++) {
      const ring = new T.Mesh(new T.TorusGeometry(.85 + i * .15, .022, 6, 64), this.material(brass, .7, .28));
      ring.rotation.set(i * .7, i * .6, i * .35); instrument.add(ring);
      const globe = this.mesh(instrument, this.sphere, this.material(i % 2 ? '#6a9890' : brass, .5), [Math.cos(i * 1.7), Math.sin(i * 1.7), 0], [.13, .13, .13]); globe.rotation.x = i;
    }
    this.mesh(instrument, this.sphere, new T.MeshStandardMaterial({ color: '#a4d4c5', emissive: '#5eada7', emissiveIntensity: .45, metalness: .35, roughness: .3 }), [0, 0, 0], [.32, .32, .32]);
  }
  observatory(g: T.Group, brass: string) {
    const apparatus = new T.Group(); apparatus.position.y = 2; g.add(apparatus); this.mechanisms.push(apparatus);
    this.mesh(g, this.cylinder, this.material('#463f30'), [0, .55, 0], [1.3, 1.1, 1.3]);
    this.mesh(g, this.cylinder, this.material(brass, .6), [0, 1.35, 0], [.15, 1.1, .15]);
    const telescope = this.mesh(apparatus, this.cylinder, this.material(brass, .75, .27), [0, .2, 0], [.22, 2.5, .22]); telescope.rotation.z = .95;
    const dial = new T.Mesh(new T.TorusGeometry(1.05, .045, 8, 64), this.material(brass, .6)); dial.rotation.y = Math.PI / 2; apparatus.add(dial);
    for (let i = 0; i < 24; i++) {
      const marker = this.block(apparatus, [0, Math.cos(i / 24 * Math.PI * 2) * 1.1, Math.sin(i / 24 * Math.PI * 2) * 1.1], [.045, .12, .045], brass, .5); marker.rotation.x = -i / 24 * Math.PI * 2;
    }
    // Octagonal corners and a domed scientific ceiling distinguish this chamber.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const chamfer = this.block(g, [sx * 7.85, 3, sz * 6.85], [3.1, 6, .25], '#303736'); chamfer.rotation.y = sx * sz * Math.PI / 4;
      this.obstacle(sx > 0 ? 6.5 : -9, sx > 0 ? 9 : -6.5, -26 + (sz > 0 ? 5.55 : -8), -26 + (sz > 0 ? 8 : -5.55));
    }
    for (let i = 0; i < 8; i++) {
      const rib = new T.Mesh(new T.TorusGeometry(4.4, .045, 8, 48, Math.PI), this.material(brass, .55));
      rib.rotation.y = i * Math.PI / 8; rib.position.y = 3.8; rib.scale.y = .62; g.add(rib);
    }
    for (const side of [-1, 1]) {
      this.mesh(g, this.cylinder, this.material(brass, .65), [side * 8.6, 5.4, 0], [.075, 13, .075]).rotation.x = Math.PI / 2;
      for (const z of [-5, 0, 5]) {
        const wheel = new T.Mesh(new T.TorusGeometry(.3, .035, 8, 24), this.material(brass, .65)); wheel.position.set(side * 8.5, 5.4, z); wheel.rotation.y = Math.PI / 2; g.add(wheel);
      }
    }
  }
  digitalArchive(g: T.Group, brass: string) {
    this.mesh(g, this.cylinder, this.material('#21403d', .4), [0, .3, 0], [1.4, .6, 1.4]);
    const sculpture = new T.Group(); sculpture.position.y = 2.2; g.add(sculpture); this.mechanisms.push(sculpture);
    const shell = new T.Mesh(new T.TorusKnotGeometry(.72, .16, 96, 12, 2, 3), this.material(brass, .7, .25)); sculpture.add(shell);
    const wire = new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(1.35, 1)), new T.LineBasicMaterial({ color: '#80dbca', transparent: true, opacity: .5 })); sculpture.add(wire);
    const glow = new T.MeshStandardMaterial({ color: '#6ecab8', emissive: '#4fb29b', emissiveIntensity: .55 });
    for (const x of [-3.5, 3.5]) this.mesh(g, this.box, glow, [x, .025, 0], [.018, .035, 16]);
    // Suspended perforated catwalk: visual architecture only, above visitor height.
    for (const x of [-3.5, 3.5]) {
      this.block(g, [x, 5.25, 0], [1.1, .16, 15], '#294f49', .6);
      for (const z of [-6, -3, 0, 3, 6]) this.mesh(g, this.cylinder, this.material(brass, .5), [x, 6.3, z], [.028, 2.2, .028]);
    }
    for (const z of [-6, 0, 6]) {
      const ring = new T.Mesh(new T.TorusGeometry(3.4, .04, 8, 64), this.material(brass, .6)); ring.rotation.x = Math.PI / 2; ring.position.set(0, 6.15, z); g.add(ring);
    }
    const grid = new T.GridHelper(18, 36, '#5e9588', '#345b52'); grid.position.y = .027; (grid.material as T.Material).transparent = true; (grid.material as T.Material).opacity = .25; g.add(grid);
  }
  corridor(center: number, length: number, surface: string) {
    const g = new T.Group(); g.position.z = center; this.scene.add(g); this.groups.set(`corridor${center}`, g);
    this.block(g, [0, -.15, 0], [4, .3, length], surface === 'wood' ? '#5b4632' : '#284d4b');
    for (const side of [-1, 1]) {
      const wallStart = g.children.length;
      this.block(g, [side * 2, 2.7, 0], [.25, 5.4, length], '#2a3c38');
      this.obstacle(side * 2 - .13, side * 2 + .13, center - length / 2, center + length / 2);
      this.captureTarget(g, wallStart, `corridor-${center}-wall-${side}`, side < 0 ? 'dissolve' : 'voxel');
      this.block(g, [side * 1.85, .06, 0], [.035, .03, length], '#89c8bc', .5);
    }
    for (let z = -length / 2 + .25; z < length / 2; z += .5) this.block(g, [0, .005, z], [3.8, .025, .018], '#2d2b24');
    this.block(g, [0, 5.5, 0], [4.3, .25, length], '#1d2d2b');
    for (let z = -length / 2 + 1; z < length / 2; z += 3) {
      const start = g.children.length; this.arch(g, 0, 3.1, z, 1.8);
      if (z >= length / 2 - 3) this.captureTarget(g, start, `corridor-${center}-portal`, 'structure');
    }
    const lamp = new T.PointLight('#a0cdc6', 26, 14); lamp.position.set(0, 3, 0); g.add(lamp);
    this.batch(g);
  }
  // Merge static opaque architecture by material; movable instruments and glass remain separate.
  batch(group: T.Group) {
    const batches = new Map<T.Material, T.Mesh[]>();
    for (const child of [...group.children]) {
      if (!(child instanceof T.Mesh) || child instanceof T.InstancedMesh || Array.isArray(child.material) || child.material.transparent) continue;
      const list = batches.get(child.material) || []; list.push(child); batches.set(child.material, list);
    }
    for (const [material, meshes] of batches) {
      if (meshes.length < 2) continue;
      const geometries = meshes.map(mesh => { mesh.updateMatrix(); return mesh.geometry.clone().applyMatrix4(mesh.matrix); });
      const merged = mergeGeometries(geometries); geometries.forEach(geo => geo.dispose());
      if (!merged) continue;
      const mesh = new T.Mesh(merged, material); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
      meshes.forEach(original => group.remove(original));
    }
  }
  platform(g: T.Group, center: number) {
    const platformStart = g.children.length;
    for (let i = 0; i < 4; i++) this.block(g, [4.325 + i * .65, .075 * (i + 1), 0], [.65, .15 * (i + 1), 8], '#62594a', .6);
    this.block(g, [7.5, .3, 0], [1.8, .6, 8], '#62594a', .6);
    for (const z of [-4, 4]) {
      this.block(g, [6.2, 1.5, z], [4.4, .055, .055], '#bca376', .6);
      for (const x of [4, 5.5, 7, 8.4]) this.mesh(g, this.cylinder, this.material('#bca376', .6), [x, .8, z], [.035, 1.4, .035]);
      this.obstacle(4, 8.6, center + z - .05, center + z + .05);
    }
    const platform = this.captureTarget(g, platformStart, 'observatory-stairs-platform', 'structure');
    // Keep a permanent luminous outline of all walkable steps when their surfaces dissolve.
    platform.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      const outline = new T.LineSegments(new T.EdgesGeometry(object.geometry), new T.LineBasicMaterial({ color: '#79b9a5', transparent: true, opacity: .3 }));
      outline.position.copy(object.position); outline.rotation.copy(object.rotation); outline.scale.copy(object.scale); g.add(outline);
    });
  }
  update(camera: T.Camera, time: number, reducedMotion: boolean) {
    for (const [id, group] of this.groups) {
      const distance = Math.abs(camera.position.z - group.position.z);
      group.visible = distance < (id.startsWith('corridor') ? 30 : 35);
    }
    if (!reducedMotion) this.mechanisms.forEach((g, i) => { g.rotation.y = time * .09 * (i + 1); });
  }
  dispose() { this.box.dispose(); this.cylinder.dispose(); this.sphere.dispose(); this.grain.dispose(); this.materials.forEach(m => m.dispose()); }
}
