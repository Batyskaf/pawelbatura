import type { Room, Settings } from './types';
export const movement = { eyeHeight: 1.7, fov: 72, speed: 2.4, fastSpeed: 3.8, radius: .28, lookSensitivity: .002, acceleration: 12 };
export const rooms: Room[] = [
  { id: 'cabinet', name: { pl: 'Gabinet osobliwości', en: 'Cabinet of curiosities' }, center: 0, width: 16, length: 16, height: 8.4, material: 'stone', palette: ['#273c39', '#87755b', '#bfa572'] },
  { id: 'observatory', name: { pl: 'Obserwatorium form', en: 'Observatory of forms' }, center: -26, width: 18, length: 16, height: 6.7, material: 'metal', palette: ['#303736', '#75664f', '#bca376'] },
  { id: 'archive', name: { pl: 'Archiwum granic', en: 'Archive of boundaries' }, center: -51, width: 20, length: 18, height: 7.5, material: 'digital', palette: ['#193333', '#375456', '#75c8be'] }
];
export const defaultSettings: Settings = {
  quality: 'high', sensitivity: 1, reducedMotion: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  effects: true, master: .65, steps: .5, ambient: .25, fx: .35, muted: false, diagnostics: false
};
export const effectPresets = {
  voxel: { activation: 10, hysteresis: 2.5, duration: 3.5, direction: 1, size: .18, density: 9, glow: .55, randomness: 1.8, maxParticles: 320 },
  dissolve: { activation: 9, hysteresis: 2, duration: 2.8, direction: -1, size: .1, density: 12, glow: .4, randomness: 2.2, maxParticles: 240 },
  structure: { activation: 13, hysteresis: 3, duration: 4.5, direction: 1, size: .24, density: 8, glow: .3, randomness: .6, maxParticles: 160 }
};
