import { cp, copyFile, mkdir } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const dir of ['img', 'audio']) await cp(dir, `dist/${dir}`, { recursive: true });
for (const file of ['app.js', 'sound-map.js', 'CNAME', 'robots.txt', 'sitemap.xml', 'favicon.svg']) await copyFile(file, `dist/${file}`);
