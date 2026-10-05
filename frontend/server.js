// ============================================================
// server.js — sert uniquement les fichiers du dossier public/
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

http
  .createServer((req, res) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const file = pathname === '/' ? '/index.html' : pathname;

    // Empêche de sortir du dossier public (ex. /../server.js)
    const fullPath = path.normalize(path.join(PUBLIC_DIR, file));
    if (!fullPath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('Accès refusé');
    }

    fs.readFile(fullPath, (err, content) => {
      if (err) {
        res.writeHead(404);
        return res.end('Page introuvable');
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fullPath)] || 'text/plain' });
      res.end(content);
    });
  })
  .listen(PORT, () => console.log(`Front lancé sur http://localhost:${PORT}`));
