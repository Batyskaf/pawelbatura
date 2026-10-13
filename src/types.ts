import type { Group, Mesh } from 'three';
export type Surface = 'stone' | 'wood' | 'metal' | 'digital';
export type Quality = 'high' | 'low';
export interface Artwork {
  id: string; title: string; author: string; description: string | null;
  metadata: { pl: string; en: string }; image: string; thumbnail: string; texture: string;
  pixelWidth: number; pixelHeight: number; aspect: number; widthCm: number; heightCm: number; displayHeight: number; displayWidth: number;
  position: number[]; rotation: number; room: string; frame: string; externalUrl: string; linkStatus: string;
}
export interface Room {
  id: string; name: { pl: string; en: string }; center: number; width: number; length: number; height: number;
  material: Surface; palette: string[];
}
export interface Collider { minX: number; maxX: number; minZ: number; maxZ: number }
export type EffectKind = 'voxel' | 'dissolve' | 'structure';
export interface EffectTarget { id: string; kind: EffectKind; object: Group }
export interface Exhibit { work: Artwork; group: Group; image: Mesh; loaded: boolean }
export interface Settings {
  quality: Quality; sensitivity: number; reducedMotion: boolean; effects: boolean;
  master: number; steps: number; ambient: number; fx: number; muted: boolean; diagnostics: boolean;
}
