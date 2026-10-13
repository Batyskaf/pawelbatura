import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { movement, rooms } from './config';
import { Architecture } from './world/architecture';
import { Controller } from './world/controller';
import { Exhibits } from './art/exhibits';
import { Interaction } from './art/interaction';
import { Materialization } from './effects/materialization';
import { FieldEmergence } from './effects/fieldEmergence';
import { ProximityWorld } from './effects/proximityWorld';
import { SoundSystem } from './audio/sound';
import type { UI } from './ui/ui';
import type { Settings } from './types';
export class Museum {
  scene = new T.Scene(); camera = new T.PerspectiveCamera(movement.fov, innerWidth / innerHeight, .08, 75);
  renderer: T.WebGLRenderer; architecture: Architecture; controller: Controller; exhibits: Exhibits; interaction: Interaction;
  effects: Materialization; fields: FieldEmergence; proximity: ProximityWorld; sound: SoundSystem; state: 'welcome' | 'exploring' | 'paused' = 'welcome';
  metrics = { fps: 60, calls: 0, triangles: 0, geometries: 0, textures: 0, estimatedTextureMB: 0, effects: 0, particles: 0, resolutionScale: 1, renderMs: 0 };
  private abort = new AbortController(); private lastTime = 0; private elapsed = 0; private slowTime = 0; private measureTime = 0;
  private composer: EffectComposer; private blendScene = new T.Scene(); private blendCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private autoScale = 1; private direction = new T.Vector3(); private disposed = false;
  constructor(private ui: UI, private settings: Settings) {
    const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = T.SRGBColorSpace; this.renderer.toneMapping = T.NoToneMapping;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.scene.background = new T.Color('#020505'); this.scene.fog = new T.Fog('#020505', 16, 62);
    this.scene.add(new T.HemisphereLight('#ebdfc3', '#374540', .45));
    const sun = new T.DirectionalLight('#ffe2b2', .65); sun.position.set(2, 8, 4); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -12; sun.shadow.camera.right = 12; sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12; sun.shadow.camera.far = 30; sun.shadow.bias = -.0006;
    this.scene.add(sun);
    const demo = new URLSearchParams(location.search).has('demo');
    this.architecture = new Architecture(this.scene, demo); this.exhibits = new Exhibits(this.scene, demo);
    this.effects = new Materialization(this.scene, this.architecture.effectTargets.filter(target => !target.id.startsWith('observatory-wall')));
    this.fields = new FieldEmergence(this.scene, this.architecture.effectTargets.filter(target => target.id.startsWith('observatory-wall')), this.exhibits.exhibits.filter(exhibit => exhibit.work.room === 'observatory'));
    this.proximity = new ProximityWorld(this.scene);
    this.controller = new Controller(this.camera, canvas, this.architecture.colliders, settings);
    this.interaction = new Interaction(this.exhibits.exhibits, document.querySelector('#art-label')!, document.querySelector('#leader')!);
    this.sound = new SoundSystem(settings);
    this.scene.traverse(object => {
      if (object instanceof T.Mesh) {
        const m = object.material as T.MeshStandardMaterial;
        if (m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) object.layers.enable(1);
      }
    });
    this.composer = new EffectComposer(this.renderer); this.composer.renderToScreen = false;
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth / 2, innerHeight / 2), .22, .5, .8));
    const blend = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({
      uniforms: { bloom: { value: this.composer.readBuffer.texture } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: 'uniform sampler2D bloom; varying vec2 vUv; void main(){gl_FragColor=vec4(texture2D(bloom,vUv).rgb,1.);}',
      transparent: true, blending: T.AdditiveBlending, depthTest: false, depthWrite: false, toneMapped: false
    })); this.blendScene.add(blend);
    const signal = this.abort.signal;
    ui.onEnter = () => void this.enter(); ui.onPause = () => this.pause(); ui.onSettings = () => this.applySettings();
    ui.onTour = id => this.tour(id);
    const interact = () => { if (this.state === 'exploring' && this.interaction.current) ui.artwork(this.interaction.current.work); };
    document.querySelector('#art-label')!.addEventListener('click', () => { if (this.interaction.current) ui.artwork(this.interaction.current.work); }, { signal });
    canvas.addEventListener('click', interact, { signal });
    document.addEventListener('keydown', e => { if (e.code === 'KeyE' && !e.repeat && !ui.panel.open) interact(); }, { signal });
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === canvas && !ui.panel.open) { this.state = 'exploring'; this.controller.enabled = true; ui.setMode('exploring'); }
      else if (this.state === 'exploring') this.pause();
    }, { signal });
    document.addEventListener('pointerlockerror', () => { this.pause(); this.message(ui.text('Blokada myszy jest niedostępna. Skorzystaj z katalogu lub spróbuj ponownie.', 'Pointer lock is unavailable. Use the catalogue or try again.')); }, { signal });
    window.addEventListener('resize', () => this.resize(), { signal });
    document.addEventListener('visibilitychange', () => { this.lastTime = 0; if (document.hidden) this.pause(); }, { signal });
    window.addEventListener('blur', () => { if (this.state === 'exploring') this.pause(); }, { signal });
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.pause(); this.message(ui.text('Utracono grafikę 3D. Odśwież stronę lub otwórz katalog.', '3D context lost. Reload the page or open the catalogue.')); ui.setMode('failed'); }, { signal });
    window.addEventListener('pagehide', () => this.dispose(), { signal });
    this.applySettings(); this.resize(); ui.setMode('welcome'); this.renderer.setAnimationLoop(time => this.frame(time));
  }
  message(text: string) { document.querySelector('#notice')!.textContent = text; }
  async enter() {
    if (this.ui.panel.open) this.ui.close();
    const canvas = this.renderer.domElement;
    // Both calls originate directly from the click; do not await audio before pointer lock.
    const audio = this.sound.unlock().catch(() => this.message(this.ui.text('Dźwięk jest niedostępny; zwiedzanie działa dalej.', 'Audio is unavailable; the visit can continue.')));
    try { await canvas.requestPointerLock(); await audio; } catch { this.pause(); this.sound.pause(); this.message(this.ui.text('Kliknij ponownie, aby włączyć sterowanie myszą.', 'Click again to enable mouse controls.')); }
  }
  pause() {
    this.controller.stop(); this.sound.pause();
    if (document.pointerLockElement) document.exitPointerLock();
    if (this.state !== 'welcome') { this.state = 'paused'; this.ui.setMode('paused'); }
  }
  tour(id: string) {
    const room = rooms.find(r => r.id === id); if (!room || !this.architecture.groups.has(id)) return;
    this.pause(); this.state = 'paused'; this.ui.setMode('paused');
    this.controller.face(new T.Vector3(0, movement.eyeHeight, room.center + 6), new T.Vector3(0, movement.eyeHeight, room.center - 5));
  }
  applySettings() { this.autoScale = 1; this.slowTime = 0; this.sound.apply(); this.renderer.shadowMap.enabled = this.settings.quality === 'high'; this.resize(); }
  resize() {
    const dpr = Math.min(devicePixelRatio, this.settings.quality === 'high' ? 1.5 : 1) * this.autoScale;
    this.metrics.resolutionScale = dpr;
    this.renderer.setPixelRatio(dpr); this.renderer.setSize(innerWidth, innerHeight);
    this.composer?.setPixelRatio(Math.min(dpr, 1)); this.composer?.setSize(innerWidth / 2, innerHeight / 2);
    this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix();
  }
  frame(time: number) {
    if (this.disposed || document.hidden) return;
    const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, .05) : 1 / 60; this.lastTime = time; this.elapsed += dt;
    const start = performance.now();
    const result = this.controller.update(dt);
    this.camera.getWorldDirection(this.direction);
    this.sound.update(result.distance, result.surface, this.state === 'exploring', this.camera.position, this.direction, dt);
    this.architecture.update(this.camera, this.elapsed, this.settings.reducedMotion);
    this.exhibits.update(this.camera);
    const effectiveSettings = this.autoScale < .8 ? { ...this.settings, quality: 'low' as const } : this.settings;
    this.effects.update(dt, this.elapsed, this.camera, effectiveSettings, position => { if (this.state === 'exploring') this.sound.materialize(position); });
    this.fields.update(dt, this.elapsed, this.camera, this.settings, position => { if (this.state === 'exploring') this.sound.materialize(position); });
    this.proximity.update(this.camera, this.settings);
    this.scene.updateMatrixWorld(true);
    this.interaction.update(this.camera, dt, this.state === 'exploring');
    this.renderer.info.autoReset = false; this.renderer.info.reset();
    const bloomEnabled = this.settings.quality === 'high' && this.settings.effects && !this.settings.reducedMotion && this.autoScale >= .8;
    if (bloomEnabled) {
      const background = this.scene.background; this.scene.background = new T.Color('#000000'); this.camera.layers.set(1); this.composer.render(dt); this.scene.background = background; this.camera.layers.set(0);
    }
    this.renderer.setRenderTarget(null); this.renderer.render(this.scene, this.camera);
    if (bloomEnabled) {
      this.renderer.autoClear = false;
      const material = (this.blendScene.children[0] as T.Mesh).material as T.ShaderMaterial; material.uniforms.bloom.value = this.composer.readBuffer.texture;
      this.renderer.render(this.blendScene, this.blendCamera); this.renderer.autoClear = true;
    }
    this.metrics.renderMs = performance.now() - start;
    this.metrics.fps += (1 / dt - this.metrics.fps) * .03;
    this.metrics.calls = this.renderer.info.render.calls; this.metrics.triangles = this.renderer.info.render.triangles;
    this.metrics.geometries = this.renderer.info.memory.geometries; this.metrics.textures = this.renderer.info.memory.textures;
    this.metrics.effects = this.effects.activeCount + Number(this.fields.phase > .01 && this.fields.phase < .99); this.metrics.particles = this.effects.particles;
    this.metrics.estimatedTextureMB = this.exhibits.exhibits.filter(e => e.loaded).reduce((sum, e) => sum + (e.work.aspect > 1 ? 1536 * 1536 / e.work.aspect : 1536 * 1536 * e.work.aspect) * 4 * 1.33 / 1048576, 0);
    this.slowTime = this.metrics.fps < 42 ? this.slowTime + dt : Math.max(0, this.slowTime - dt);
    if (this.slowTime > 5 && this.autoScale > .55) { this.autoScale = Math.max(.55, this.autoScale - .15); this.slowTime = 0; this.resize(); if (this.autoScale < .75) { this.renderer.shadowMap.enabled = false; } }
    this.measureTime += dt;
    if (this.measureTime > .35) {
      this.measureTime = 0;
      const room = rooms.reduce((best, r) => Math.abs(this.camera.position.z - r.center) < Math.abs(this.camera.position.z - best.center) ? r : best);
      document.querySelector('#room-name')!.textContent = room.name[this.ui.lang];
      const status = document.querySelector('#field-status');
      if (status) status.textContent = room.id !== 'observatory' ? '' : this.fields.critical ? this.ui.text('Próg przejścia · kolekcja wyłoniona', 'Transition threshold · collection emerged') : this.fields.phase > .42 ? this.ui.text('Formy zyskują trwałość', 'Forms gain stability') : this.ui.text('Pola w rezonansie', 'Fields in resonance');
      const metrics = document.querySelector<HTMLElement>('#metrics')!; metrics.hidden = !this.settings.diagnostics;
      metrics.textContent = `${this.metrics.fps.toFixed(0)} FPS · ${this.metrics.renderMs.toFixed(1)} ms CPU · ${this.metrics.calls} draw calls · ${this.metrics.triangles.toLocaleString()} triangles · ${this.metrics.geometries} geometries · ~${this.metrics.estimatedTextureMB.toFixed(0)} MB textures · ${this.metrics.effects} effects / ${this.metrics.particles} particles · DPR ${this.metrics.resolutionScale.toFixed(2)}`;
    }
  }
  dispose() {
    if (this.disposed) return; this.disposed = true; this.abort.abort(); this.renderer.setAnimationLoop(null);
    this.controller.dispose(); this.sound.dispose(); this.exhibits.dispose(); this.architecture.dispose();
    this.scene.traverse(object => { if (object instanceof T.Mesh) { object.geometry.dispose(); object.customDepthMaterial?.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(m => m.dispose()); } });
    this.composer.passes.forEach(p => p.dispose()); this.composer.dispose(); this.renderer.dispose();
  }
}
