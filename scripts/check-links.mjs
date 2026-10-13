import { readFile, writeFile } from 'node:fs/promises';
const works = JSON.parse(await readFile('src/data/artworks.json', 'utf8'));
const urls = [...new Set(works.map(w => w.externalUrl))];
const results = [];
for (let i = 0; i < urls.length; i += 4) {
  results.push(...await Promise.all(urls.slice(i, i + 4).map(async url => {
    try {
      const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(12000) });
      return { source: url, status: response.status, destination: response.url, note: response.status === 403 ? 'Remote service blocks automated verification; source URL remains preserved.' : 'HTTP check only; does not verify artwork identity.' };
    } catch (e) { return { source: url, status: null, error: e.message }; }
  })));
}
await writeFile('docs/external-link-check.json', JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2) + '\n');
console.log(JSON.stringify(results.map(r => ({status:r.status, source:r.source, error:r.error})), null, 2));
