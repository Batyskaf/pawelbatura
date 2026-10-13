import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { moveWithCollisions, floorAt, intersects } from '../src/world/collision';
import { activationState, progressStep } from '../src/effects/materialization';
import artworks from '../src/data/artworks.json';
test('All original artworks, metadata and exact external links survive', async () => {
  const source = await readFile('gallery.html', 'utf8');
  const blocks = [...source.matchAll(/<div class="art">([\s\S]*?)(?=<div class="art">|<\/section>)/g)];
  assert.equal(artworks.length, 18); assert.equal(blocks.length, artworks.length);
  assert.equal(new Set(artworks.map(w => w.id)).size, 18);
  for (const [i, match] of blocks.entries()) {
    const work = artworks[i];
    assert.equal(match[1].match(/<h3>([\s\S]*?)<\/h3>/)![1], work.title);
    assert.equal(match[1].match(/href="(https:[^"]+)"/)![1], work.externalUrl);
    assert.equal(createHash('sha256').update(await readFile(work.image)).digest('hex'), work.sha256);
    assert.ok(Math.abs(work.displayWidth / work.displayHeight - work.pixelWidth / work.pixelHeight) < .0001);
    for (const path of [work.image, work.texture, work.thumbnail]) await access(path);
  }
});
test('Original external destinations and static functions stay reachable', async () => {
  const links = JSON.parse(await readFile('docs/original-links.json', 'utf8'));
  for (const [page, urls] of Object.entries(links) as [string, string[]][]) {
    const current = await readFile(page === 'index.html' ? 'artist.html' : page, 'utf8');
    for (const url of urls.filter(u => u.startsWith('https:') && !u.startsWith('https://pawelbatura.art/'))) assert.ok(current.includes(url), `${page}: ${url}`);
  }
  assert.ok((await readFile('contact.html', 'utf8')).includes('https://formspree.io/f/xpqbpjgl'));
  for (let i = 1; i <= 10; i++) await access(`audio/${String(i).padStart(2, '0')}.mp3`);
});
test('Collision prevents tunnelling and slides along a wall', () => {
  const wall = { minX: 2, maxX: 2.3, minZ: -20, maxZ: 20 };
  const result = moveWithCollisions(0, 0, 30, 3, .28, [wall]);
  assert.ok(result.x < 1.73); assert.ok(Math.abs(result.z - 3) < .00001);
  assert.equal(intersects(result.x, result.z, .28, wall), false);
});
test('Blocked movement creates no travelled distance for footsteps', () => {
  const wall = { minX: 2, maxX: 2.3, minZ: -20, maxZ: 20 };
  const first = moveWithCollisions(0, 0, 10, 0, .28, [wall]);
  const stopped = moveWithCollisions(first.x, first.z, .1, 0, .28, [wall]);
  assert.equal(stopped.x, first.x); assert.equal(stopped.z, first.z);
});
test('Floors distinguish all four surfaces and shallow stairs', () => {
  assert.equal(floorAt(0, 0).material, 'stone');
  assert.equal(floorAt(0, -12).material, 'wood');
  assert.equal(floorAt(0, -26).material, 'metal');
  assert.equal(floorAt(0, -51).material, 'digital');
  assert.equal(floorAt(7, -26).height, .6);
});
test('Activation hysteresis eliminates threshold flapping', () => {
  assert.equal(activationState(10.1, false, 10, 2), false);
  assert.equal(activationState(10.1, true, 10, 2), true);
  assert.equal(activationState(12.1, true, 10, 2), false);
});
test('Materialization duration is independent of refresh rate', () => {
  const advance = (fps: number) => { let p = 0; for (let i = 0; i < fps * 2; i++) p = progressStep(p, 1, 1 / fps, 4); return p; };
  assert.ok(Math.abs(advance(30) - .5) < .00001); assert.ok(Math.abs(advance(144) - .5) < .00001);
  assert.equal(progressStep(.99, 1, 1, 2), 1); assert.equal(progressStep(.01, 0, 1, 2), 0);
});
