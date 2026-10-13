import { Vector3 } from 'three';
import type { Settings, Surface } from '../types';
export class SoundSystem {
  context: AudioContext | null = null; master!: GainNode; steps!: GainNode; ambient!: GainNode; fx!: GainNode;
  private distance = 0; private nodes = new Set<AudioScheduledSourceNode>(); private hum: OscillatorNode | null = null;
  private randomBuffers = new Map<Surface, AudioBuffer[]>(); private reverb!: ConvolverNode; private lastSurface: Surface = 'stone';
  stepCount = 0;
  constructor(private settings: Settings) {}
  async unlock() {
    if (!this.context) {
      const ctx = this.context = new AudioContext();
      this.master = ctx.createGain(); this.master.connect(ctx.destination);
      this.steps = ctx.createGain(); this.ambient = ctx.createGain(); this.fx = ctx.createGain();
      for (const node of [this.steps, this.ambient, this.fx]) node.connect(this.master);
      const impulse = ctx.createBuffer(2, ctx.sampleRate * 1.2, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = impulse.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3) * .22; }
      this.reverb = ctx.createConvolver(); this.reverb.buffer = impulse; this.reverb.connect(this.master);
      const wet = ctx.createGain(); wet.gain.value = .18; this.steps.connect(wet); wet.connect(this.reverb);
      for (const surface of ['stone', 'wood', 'metal', 'digital'] as Surface[]) {
        const variants: AudioBuffer[] = [];
        for (let variant = 0; variant < 4; variant++) {
          const duration = surface === 'metal' ? .24 : .13, buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
          const d = buffer.getChannelData(0);
          for (let i = 0; i < d.length; i++) {
            const t = i / ctx.sampleRate, decay = Math.exp(-t * (surface === 'metal' ? 22 : 36));
            const noise = (Math.random() * 2 - 1) * Math.exp(-t * 90);
            d[i] = surface === 'digital' ? Math.sin(2 * Math.PI * (600 - t * 1800 + variant * 18) * t) * decay * .22 :
              surface === 'metal' ? (Math.sin(t * 2 * Math.PI * (240 + variant * 15)) + Math.sin(t * 2 * Math.PI * 693) * .4) * decay * .15 + noise * .2 :
              surface === 'wood' ? Math.sin(t * 2 * Math.PI * (105 + variant * 8)) * decay * .3 + noise * .15 : noise * .5 + Math.sin(t * 2 * Math.PI * 180) * decay * .14;
          }
          variants.push(buffer);
        }
        this.randomBuffers.set(surface, variants);
      }
      this.hum = ctx.createOscillator(); this.hum.frequency.value = 58;
      const gain = ctx.createGain(); gain.gain.value = .032;
      const pan = ctx.createPanner(); pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = 4;
      pan.positionX.value = 0; pan.positionY.value = 3; pan.positionZ.value = -26;
      this.hum.connect(gain); gain.connect(pan); pan.connect(this.ambient); this.hum.start();
    }
    await this.context.resume(); this.apply();
  }
  apply() {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(this.settings.muted ? 0 : this.settings.master, now, .03);
    this.steps.gain.setTargetAtTime(this.settings.steps, now, .03);
    this.ambient.gain.setTargetAtTime(this.settings.ambient, now, .03);
    this.fx.gain.setTargetAtTime(this.settings.fx, now, .03);
  }
  update(distance: number, surface: Surface, active: boolean, position: Vector3, direction: Vector3) {
    if (!this.context || !active) { this.distance = 0; return; }
    const listener = this.context.listener;
    listener.positionX.value = position.x; listener.positionY.value = position.y; listener.positionZ.value = position.z;
    listener.forwardX.value = direction.x; listener.forwardY.value = direction.y; listener.forwardZ.value = direction.z;
    listener.upX.value = 0; listener.upY.value = 1; listener.upZ.value = 0;
    if (surface !== this.lastSurface) { this.distance = 0; this.lastSurface = surface; }
    this.distance += distance;
    if (distance > .0001 && this.distance >= .72) {
      this.distance %= .72; this.stepCount++;
      const src = this.context.createBufferSource(); const gain = this.context.createGain();
      src.buffer = this.randomBuffers.get(surface)![Math.floor(Math.random() * 4)]; src.playbackRate.value = .94 + Math.random() * .12;
      gain.gain.value = .65 + Math.random() * .15; src.connect(gain); gain.connect(this.steps); this.play(src, undefined, [gain]);
    }
  }
  materialize(position: Vector3) {
    if (!this.context || this.context.state !== 'running') return;
    const ctx = this.context, src = ctx.createOscillator(), gain = ctx.createGain(), pan = ctx.createPanner();
    src.type = 'sine'; src.frequency.setValueAtTime(240, ctx.currentTime); src.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + .5);
    gain.gain.setValueAtTime(.025, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .65);
    pan.panningModel = 'HRTF'; pan.refDistance = 2; pan.positionX.value = position.x; pan.positionY.value = position.y; pan.positionZ.value = position.z;
    src.connect(gain); gain.connect(pan); pan.connect(this.fx); this.play(src, .7, [gain, pan]);
  }
  private play(src: AudioScheduledSourceNode, duration?: number, connected: AudioNode[] = []) {
    this.nodes.add(src); src.addEventListener('ended', () => { this.nodes.delete(src); src.disconnect(); connected.forEach(node => node.disconnect()); }, { once: true });
    src.start(); if (duration) src.stop(this.context!.currentTime + duration);
  }
  pause() { this.distance = 0; for (const node of this.nodes) { try { node.stop(); } catch { /* already ended */ } } this.nodes.clear(); void this.context?.suspend(); }
  dispose() { this.pause(); this.hum?.stop(); void this.context?.close(); }
}
