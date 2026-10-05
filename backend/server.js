// ============================================================
// server.js — API REST (aucune dépendance, modules natifs Node.js)
//
//   GET    /api/<ressource>       liste
//   POST   /api/<ressource>       création
//   PATCH  /api/<ressource>/:id   modification
//   DELETE /api/<ressource>/:id   suppression
//
// Ressources : todos, events (agenda), pomodoros (historique)
// ============================================================
const http = require('http');
const { data, save } = require('./store');

const PORT = process.env.PORT || 4000;
// Origine du front autorisée à appeler l'API (CORS)
const FRONT_ORIGIN = process.env.FRONT_ORIGIN || 'http://localhost:3000';

const CORS = {
  'Access-Control-Allow-Origin': FRONT_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ---------- Validation ----------
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s); // 2026-10-05
const isTime = (s) => /^\d{2}:\d{2}$/.test(s);       // 14:30

// ---------- Définition des ressources ----------
// create(body) renvoie l'objet à stocker, ou null si les données sont invalides.
// update(item, body) modifie l'objet existant (absent = ressource non modifiable).
const resources = {
  todos: {
    create: (b) => (b.text && b.text.trim() ? { text: b.text.trim(), done: false } : null),
    update: (item, b) => {
      if (typeof b.done === 'boolean') item.done = b.done;
      if (typeof b.text === 'string' && b.text.trim()) item.text = b.text.trim();
    },
  },
  events: {
    create: (b) =>
      b.title && b.title.trim() && isDate(b.date)
        ? { title: b.title.trim(), date: b.date, time: isTime(b.time) ? b.time : '' }
        : null,
    update: (item, b) => {
      if (typeof b.title === 'string' && b.title.trim()) item.title = b.title.trim();
      if (isDate(b.date)) item.date = b.date;
      if (typeof b.time === 'string' && (b.time === '' || isTime(b.time))) item.time = b.time;
    },
  },
  pomodoros: {
    // Une session terminée : type 'focus' ou 'break', durée en minutes
    create: (b) =>
      ['focus', 'break'].includes(b.type) && Number(b.minutes) > 0
        ? { type: b.type, minutes: Number(b.minutes), at: new Date().toISOString() }
        : null,
  },
};

// ---------- Utilitaires HTTP ----------
function sendJson(res, status, payload) {
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('JSON invalide'));
      }
    });
  });
}

// ---------- Routeur générique ----------
async function handleApi(req, res, pathname) {
  const [, , name, idPart] = pathname.split('/'); // /api/todos/12 -> ['', 'api', 'todos', '12']
  const resource = resources[name];
  if (!resource) return sendJson(res, 404, { error: 'Ressource inconnue' });
  const list = data[name];

  // Routes sans id : liste et création
  if (!idPart) {
    if (req.method === 'GET') return sendJson(res, 200, list);
    if (req.method === 'POST') {
      const item = resource.create(await readBody(req));
      if (!item) return sendJson(res, 400, { error: 'Données invalides' });
      item.id = Date.now();
      list.push(item);
      save();
      return sendJson(res, 201, item);
    }
  }

  // Routes avec id : modification et suppression
  const index = list.findIndex((i) => i.id === Number(idPart));
  if (idPart && index === -1) return sendJson(res, 404, { error: 'Élément introuvable' });

  if (idPart && req.method === 'PATCH' && resource.update) {
    resource.update(list[index], await readBody(req));
    save();
    return sendJson(res, 200, list[index]);
  }
  if (idPart && req.method === 'DELETE') {
    list.splice(index, 1);
    save();
    res.writeHead(204, CORS);
    return res.end();
  }

  sendJson(res, 405, { error: 'Méthode non autorisée' });
}

// ---------- Serveur ----------
function createServer() {
  return http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'OPTIONS') { // "preflight" CORS envoyé par le navigateur
      res.writeHead(204, CORS);
      return res.end();
    }
    try {
      if (pathname.startsWith('/api/')) await handleApi(req, res, pathname);
      else sendJson(res, 404, { error: 'Route inconnue' });
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => console.log(`API lancée sur http://localhost:${PORT}`));
}

module.exports = { createServer, handleApi, resources, isDate, isTime };
