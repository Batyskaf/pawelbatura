import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
const works = JSON.parse(await readFile('src/data/artworks.json', 'utf8'));
await mkdir('img/museum', { recursive: true });
for (const work of works) await sharp(work.image).resize({ width: 1536, height: 1536, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toFile(work.texture);
console.log('Utworzono 18 tekstur WebP; oryginały zachowane.');
