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
    const m = window.museum; m.camera.position.set(4, 1.7, 0); m.controller.yaw = -Math.PI / 2; m.controller.pitch = .2; m.controller.applyLook();
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
