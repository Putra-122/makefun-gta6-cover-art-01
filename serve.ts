// Neon Coast Cover Studio — local static server (dev + screenshots).
// Node standard library only. Serves app/ at / and screenshots/ at /shots/.
// Usage: node serve.ts [port]   (default 8080)

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const port = Number(process.argv[2] || process.env.PORT || 8080);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    let rel = decodeURIComponent(url.pathname);
    if (rel.startsWith('/shots/')) rel = 'screenshots/' + rel.slice('/shots/'.length);
    else rel = 'app' + (rel === '/' ? '/index.html' : rel);
    const file = resolve(root, normalize(rel));
    if (!file.startsWith(root + '/') && file !== root) {
      res.writeHead(403); res.end('forbidden'); return;
    }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

server.listen(port, () => {
  console.log(`Neon Coast Cover Studio at http://localhost:${port}/`);
});
