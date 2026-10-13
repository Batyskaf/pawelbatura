import './museum.css';
import { defaultSettings } from './config';
import type { Settings } from './types';
import { UI } from './ui/ui';
const settings: Settings = { ...defaultSettings };
try {
  const saved = JSON.parse(localStorage.getItem('museum-settings') || '{}');
  for (const key of ['master', 'steps', 'ambient', 'fx', 'sensitivity'] as const) if (typeof saved[key] === 'number' && Number.isFinite(saved[key])) settings[key] = Math.max(key === 'sensitivity' ? .2 : 0, Math.min(key === 'sensitivity' ? 2.5 : 1, saved[key]));
  for (const key of ['muted', 'effects', 'reducedMotion', 'diagnostics'] as const) if (typeof saved[key] === 'boolean') settings[key] = saved[key];
  if (saved.quality === 'low' || saved.quality === 'high') settings.quality = saved.quality;
} catch { /* defaults work without local storage */ }
const ui = new UI(settings);
const coarse = matchMedia('(pointer: coarse)').matches;
if (coarse) {
  document.querySelector('#load-status')!.textContent = ui.text('Na ekranie dotykowym polecamy katalog wszystkich prac.', 'On a touch screen, explore the full artwork catalogue.');
}
import('./scene').then(({ Museum }) => {
  const museum = new Museum(ui, settings);
  // Read-only diagnostics are intentionally public for acceptance checks.
  Object.defineProperty(window, 'museum', { value: museum, configurable: true });
}).catch(error => {
  console.error('Museum initialization failed', error); ui.setMode('failed');
  document.querySelectorAll<HTMLButtonElement>('[data-enter]').forEach(b => { b.disabled = true; });
});
