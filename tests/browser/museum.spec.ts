import { test, expect } from '@playwright/test';
import type { Museum } from '../../src/scene';
declare global { interface Window { museum: Museum } }
test('Demo hall enters, pauses and resumes with independent collision and footsteps', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?demo');
  await page.waitForFunction(() => !!window.museum);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Wunder');
  await page.getByRole('button', { name: 'Wejdź do galerii', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id)).toBe('world');
  await expect.poll(() => page.evaluate(() => window.museum.sound.context?.state)).toBe('running');
  await expect.poll(() => page.evaluate(() => window.museum.sound.loadedRecordings)).toBe(15);
  await page.keyboard.down('KeyW'); await page.waitForTimeout(1400); await page.keyboard.up('KeyW');
  expect(await page.evaluate(() => window.museum.camera.position.z)).toBeLessThan(4);
  expect(await page.evaluate(() => window.museum.sound.stepCount)).toBeGreaterThan(0);
  await page.waitForTimeout(350); const stopped = await page.evaluate(() => window.museum.sound.stepCount);
  await page.waitForTimeout(1000); expect(await page.evaluate(() => window.museum.sound.stepCount)).toBe(stopped);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Wróć do zwiedzania →', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  await expect.poll(() => page.evaluate(() => window.museum.sound.context?.state)).toBe('suspended');
  await page.getByRole('button', { name: 'Ustawienia', exact: true }).click();
  await page.getByLabel('Ogranicz ruch i animacje').check();
  await expect.poll(() => page.evaluate(() => window.museum.effects.transforms.every(fx => fx.progress === 1))).toBe(true);
  await page.getByRole('button', { name: 'Zamknij / Close' }).click();
  await page.getByRole('button', { name: 'Wróć do zwiedzania →', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id)).toBe('world');
  // Controlled acceptance viewpoint; movement itself is tested using actual keyboard events.
  await page.evaluate(() => {
    const m = window.museum; m.camera.position.set(1.6, 1.7, 0); m.controller.yaw = -Math.PI / 2; m.controller.pitch = 0; m.controller.applyLook();
  });
  await page.keyboard.down('KeyW'); await page.waitForTimeout(4000); await page.keyboard.up('KeyW');
  expect(await page.evaluate(() => window.museum.camera.position.x)).toBeLessThan(7.6);
  await page.waitForTimeout(400); const blocked = await page.evaluate(() => window.museum.sound.stepCount);
  await page.keyboard.down('KeyW'); await page.waitForTimeout(1200); await page.keyboard.up('KeyW');
  expect(await page.evaluate(() => window.museum.sound.stepCount)).toBe(blocked);
  expect(errors).toEqual([]);
});
test('All rooms, labels, artwork panel and safe source links work', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await page.waitForFunction(() => !!window.museum);
  expect(await page.evaluate(() => window.museum.exhibits.exhibits.length)).toBe(18);
  await page.getByRole('button', { name: 'Wejdź do galerii', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id)).toBe('world');
  await page.evaluate(() => {
    const m = window.museum; m.camera.position.set(4, 1.7, 0); m.controller.yaw = -Math.PI / 2; m.controller.pitch = 0; m.controller.applyLook();
  });
  await expect(page.locator('#art-label')).toHaveText(/Anisotropy II/);
  await expect.poll(() => page.locator('#art-label').evaluate(e => Number(getComputedStyle(e).opacity))).toBeGreaterThan(.8);
  await page.keyboard.press('KeyE');
  await expect(page.locator('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  const link = page.getByRole('link', { name: 'Zobacz na Saatchi Art ↗' });
  await expect(link).toHaveAttribute('href', 'https://www.saatchiart.com/en-pl/art/Painting-Anisotropy-II-The-Relativity-of-Boundary-Conditions/860524/13501935');
  await expect(link).toHaveAttribute('target', '_blank'); await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await page.getByRole('button', { name: 'Zamknij / Close' }).click();
  await page.getByRole('button', { name: 'Plan muzeum', exact: true }).click();
  await page.getByRole('button', { name: /Ⅱ.*Obserwatorium/ }).click();
  expect(await page.evaluate(() => window.museum.camera.position.z)).toBe(-20);
  await page.getByRole('button', { name: 'Wróć do zwiedzania →', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.museum.controller.enabled && document.pointerLockElement?.id === 'world')).toBe(true);
  await page.evaluate(() => { const m = window.museum; m.camera.position.set(.8, 1.7, -31); m.controller.yaw = 0; m.controller.pitch = 0; m.controller.applyLook(); });
  await page.keyboard.down('KeyW'); await page.keyboard.down('ShiftLeft'); await page.waitForTimeout(6500); await page.keyboard.up('KeyW'); await page.keyboard.up('ShiftLeft');
  expect(await page.evaluate(() => window.museum.camera.position.z)).toBeLessThan(-44);
  await expect.poll(() => page.evaluate(() => window.museum.exhibits.exhibits.filter(e => e.work.room === 'archive').every(e => !!(e.image.material as any).map))).toBe(true);
  await page.screenshot({ path: 'test-results/archive.png' });
  expect(errors).toEqual([]);
});
test('Fallback catalogue, translation and mobile layout', async ({ page }) => {
  await page.goto('/'); await page.waitForFunction(() => !!window.museum);
  await page.getByRole('button', { name: 'Oglądaj bez 3D →', exact: true }).click();
  await expect(page.locator('.work-card')).toHaveCount(18);
  await page.getByRole('button', { name: 'Pygmalion', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Zobacz na Saatchi Art ↗' })).toHaveAttribute('href', 'https://www.saatchiart.com/en-pl/art/Painting-Pygmalion-Sold/860524/8499574');
  await page.goto('/'); await page.getByRole('button', { name: 'Change language' }).click();
  await expect(page.getByRole('button', { name: 'Enter the gallery', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Explore without 3D →', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});
test('Static portfolio works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  await page.goto('http://127.0.0.1:5174/gallery.html');
  await expect(page.locator('.art')).toHaveCount(18);
  // Legacy metadata used empty translated elements: this check guards a real no-JS fallback.
  await expect(page.locator('.art .caption p').first()).toContainText('2026');
  await context.close();
});
test('WebGL failure leaves catalogue available', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, kind: any, ...args: any[]) { if (String(kind).startsWith('webgl')) return null; return original.call(this, kind, ...args as [any]); } as any;
  });
  await page.goto('/'); await expect(page.locator('body')).toHaveAttribute('data-mode', 'failed');
  await page.getByRole('button', { name: 'Oglądaj bez 3D →', exact: true }).click();
  await expect(page.locator('.work-card')).toHaveCount(18);
});
test('All reconstruction effects respect particle budgets and keep collision geometry stable', async ({ page }) => {
  await page.goto('/'); await page.waitForFunction(() => !!window.museum);
  const report = await page.evaluate(() => {
    const m = window.museum; const collision = JSON.stringify(m.architecture.colliders);
    for (const fx of m.effects.transforms) { fx.config.activation = 1000; fx.progress = .5; }
    return { before: collision, max: m.effects.transforms.reduce((sum, fx) => sum + fx.config.maxParticles, 0), targets: m.effects.transforms.map(fx => ({ id: fx.target.id, sameObject: fx.surface === fx.target.object, size: fx.size.toArray(), pieces: fx.pieces.length })) };
  });
  expect(report.targets.some(t => t.id === 'corridor--13-wall-1' && t.size[2] >= 10 && t.size[1] >= 5.4 && t.sameObject)).toBe(true);
  expect(report.targets.some(t => t.id === 'observatory-stairs-platform' && t.pieces > 4)).toBe(true);
  await page.waitForTimeout(350);
  const after = await page.evaluate(() => ({ collision: JSON.stringify(window.museum.architecture.colliders), particles: window.museum.effects.particles, calls: window.museum.metrics.calls, triangles: window.museum.metrics.triangles, renderMs: window.museum.metrics.renderMs, fps: window.museum.metrics.fps }));
  expect(after.collision).toBe(report.before); expect(after.particles).toBeLessThanOrEqual(report.max);
  expect(after.calls).toBeLessThan(350); expect(after.triangles).toBeLessThan(300000);
  console.log('Scene budget:', JSON.stringify({ particles: after.particles, calls: after.calls, triangles: after.triangles, renderMs: after.renderMs, fps: after.fps }));
  await page.screenshot({ path: 'test-results/welcome.png' });
});
test('Canvas size uses actual centimetres while photographs keep their own aspect ratio', async ({ page }) => {
  await page.goto('/'); await page.waitForFunction(() => !!window.museum);
  const works = await page.evaluate(() => window.museum.exhibits.exhibits.map(e => {
    const plane = e.image.geometry as any; return { id: e.work.id, widthCm: e.work.widthCm, heightCm: e.work.heightCm, width: e.work.displayWidth, height: e.work.displayHeight, planeWidth: plane.parameters.width, planeHeight: plane.parameters.height, photoAspect: e.work.aspect, center: e.group.position.y, frameBottom: e.group.position.y - e.work.displayHeight / 2 - .04 };
  }));
  for (const work of works) {
    expect(work.width).toBe(work.widthCm / 100); expect(work.height).toBe(work.heightCm / 100);
    expect(work.planeWidth).toBeLessThanOrEqual(work.width + .00001); expect(work.planeHeight).toBeLessThanOrEqual(work.height + .00001);
    expect(work.planeWidth / work.planeHeight).toBeCloseTo(work.photoAspect, 5);
    expect(work.center).toBe(1.7); expect(work.frameBottom - 1.02).toBeGreaterThanOrEqual(.08);
  }
  expect(works.find(w => w.id === 'anisotropy2')!.width).toBe(.4);
  expect(works.find(w => w.id === 'bifurcation')!.width).toBe(1.4);
});
test('Overlapping fields stabilize walls and frames before the critical artwork transition', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('/'); await page.waitForFunction(() => !!window.museum);
  expect(await page.evaluate(() => window.museum.fields.exhibits.every(e => !e.image.visible))).toBe(true);
  await page.getByRole('button', { name: 'Wejdź do galerii', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id)).toBe('world');
  const state = await page.evaluate(() => {
    const m = window.museum; m.camera.position.set(0, 1.7, -20); m.controller.yaw = 0; m.controller.pitch = 0; m.controller.applyLook(); m.fields.phase = .54;
    return JSON.stringify(m.architecture.colliders);
  });
  await expect.poll(() => page.evaluate(() => window.museum.fields.phase)).toBeGreaterThan(.6);
  expect(await page.evaluate(() => window.museum.fields.critical)).toBe(false);
  expect(await page.evaluate(() => window.museum.fields.exhibits.every(e => !e.image.visible))).toBe(true);
  await page.screenshot({ path: 'test-results/field-emergence.png' });
  await expect.poll(() => page.evaluate(() => window.museum.fields.critical), { timeout: 10000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => window.museum.fields.reveal), { timeout: 5000 }).toBe(1);
  expect(await page.evaluate(() => window.museum.fields.exhibits.every(e => e.image.visible))).toBe(true);
  expect(await page.evaluate(() => JSON.stringify(window.museum.architecture.colliders))).toBe(state);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/field-stable.png' });
});

test('All wall surfaces vanish before crystallization, including end walls and corner panels', async ({ page }) => {
  await page.goto('/'); await page.waitForFunction(() => !!window.museum);
  const result = await page.evaluate(() => {
    const m = window.museum;
    const settings = { effects: true, reducedMotion: false, quality: 'high' } as any;
    m.effects.transforms.forEach(fx => { fx.progress = 0; fx.active = false; fx.update(0, 0, 100, settings); });
    m.fields.phase = 0; m.camera.position.set(0, 1.7, 5); m.fields.update(0, 0, m.camera, settings, () => {});
    const targets = m.architecture.effectTargets.filter(t => t.id.includes('-wall'));
    return { hidden: targets.every(t => !t.object.visible), ids: targets.map(t => t.id), particlesHidden: m.effects.transforms.every(fx => !fx.particles.visible) };
  });
  expect(result.hidden).toBe(true); expect(result.particlesHidden).toBe(true);
  for (const room of ['cabinet', 'observatory', 'archive']) for (const end of [-1, 1]) expect(result.ids).toContain(`${room}-wall-end-${end}`);
  expect(result.ids.filter(id => id.includes('wall-corner'))).toHaveLength(4);
});
