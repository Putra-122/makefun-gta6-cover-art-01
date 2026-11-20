// Local dev server for the cover app (Node 22, standard library only).
// Serves app/ on http://localhost:8080 with no network requests of its own.
//   node serve.ts [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, 'app');
const port = Number(process.argv[2] || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    let path = normalize(join(root, decodeURIComponent(url.pathname)));
    if (!path.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
    if (path.endsWith('/')) path = join(path, 'index.html');
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

server.listen(port, () => console.log(`Neon Coast dev server: http://localhost:${port}/`));
