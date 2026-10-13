import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const html = await readFile('gallery.html', 'utf8');
const artworks = [];
for (const match of html.matchAll(/<div class="art">([\s\S]*?)(?=<div class="art">|<\/section>)/g)) {
  const block = match[1];
  const image = block.match(/data-full="([^"]+)"/)[1];
  const thumb = block.match(/src="([^"]+)"/)[1];
  const id = image.split('/').pop().replace('.jpg', '');
  const meta = block.match(/<p data-pl="([^"]+)" data-en="([^"]+)"/);
  const { width, height } = await sharp(image).metadata();
  const i = artworks.length;
  const room = ['cabinet', 'observatory', 'archive'][Math.floor(i / 6)];
  const center = [0, -26, -51][Math.floor(i / 6)];
  const side = i % 6 < 3 ? -1 : 1;
  const half = [8, 9, 10][Math.floor(i / 6)];
  const [, rawWidth, rawHeight] = meta[1].match(/(\d+)\s*×\s*(\d+)\s*cm/);
  const widthCm = Number(rawWidth), heightCm = Number(rawHeight);
  artworks.push({
    id, title: block.match(/<h3>([\s\S]*?)<\/h3>/)[1], author: 'Paweł Batura',
    description: null, metadata: { pl: meta[1], en: meta[2] },
    image, thumbnail: thumb, texture: `img/museum/${id}.webp`,
    pixelWidth: width, pixelHeight: height, aspect: width / height,
    widthCm, heightCm, displayHeight: heightCm / 100, displayWidth: widthCm / 100,
    position: [side * (half - .24), 1.4 + heightCm / 200, center + 4.7 - (i % 3) * 4.7],
    rotation: side === -1 ? Math.PI / 2 : -Math.PI / 2,
    room, frame: ['gilded', 'mechanical', 'minimal'][Math.floor(i / 6)],
    category: 'oil painting', effects: [],
    externalUrl: block.match(/href="(https:[^"]+)"/)[1],
    linkStatus: id === 'emergence' ? 'source-mismatch' : 'preserved',
    sha256: createHash('sha256').update(await readFile(image)).digest('hex')
  });
}
await mkdir('src/data', { recursive: true });
await mkdir('docs', { recursive: true });
await writeFile('src/data/artworks.json', JSON.stringify(artworks, null, 2) + '\n');
const links = {};
for (const file of ['index.html', 'gallery.html', 'contact.html', 'sound-map.html']) {
  const content = await readFile(file, 'utf8');
  links[file] = [...new Set([...content.matchAll(/(?:href|action)="([^"]+)"/g)].map(m => m[1]))];
}
await writeFile('docs/original-links.json', JSON.stringify(links, null, 2) + '\n');
await writeFile('docs/inventory.md', '# Inwentaryzacja oryginalnej kolekcji\n\n' +
  '| ID | Tytuł | Metadane | Piksele | Oryginalny URL |\n|---|---|---|---|---|\n' + artworks.map(a => `| ${a.id} | ${a.title} | ${a.metadata.pl} | ${a.pixelWidth} × ${a.pixelHeight} | ${a.externalUrl} |`).join('\n') +
  '\n\nBrak opisów poszczególnych prac i modeli ram w oryginale. Emergence ma w źródle adres Fractures; zachowany bez zgadywania.\n');
console.log(`Zinwentaryzowano ${artworks.length} prac i oryginalne linki.`);
