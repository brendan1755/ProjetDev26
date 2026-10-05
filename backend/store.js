// ============================================================
// store.js — persistance simple dans un fichier JSON
// Pour passer à une vraie base plus tard, seul ce fichier change.
// ============================================================
const fs = require('fs');
const path = require('path');

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');

// Données en mémoire : une liste par ressource
let data = { todos: [], events: [], pomodoros: [] };

// Chargement au démarrage (si le fichier n'existe pas, on garde les listes vides)
try {
  data = { ...data, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
} catch {}

// Écrit l'état courant sur le disque
function save() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = { data, save };
