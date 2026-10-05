// ============================================================
// pomodoro.js — minuteur Pomodoro + statistiques du jour
// ============================================================
import { api, json } from './api.js';

// Durées en minutes et type de session enregistré côté back
const MODES = {
  focus: { minutes: 25, type: 'focus' },
  short: { minutes: 5, type: 'break' },
  long: { minutes: 15, type: 'break' },
};

const display = document.getElementById('pomo-time');
const toggleBtn = document.getElementById('pomo-toggle');
const resetBtn = document.getElementById('pomo-reset');
const stats = document.getElementById('pomo-stats');
const modeButtons = document.querySelectorAll('#pomo-modes button');

let mode = 'focus';
let remaining = MODES[mode].minutes * 60; // secondes restantes
let endAt = null;                          // heure de fin prévue (ms), quand le minuteur tourne
let timerId = null;

// ----- Affichage -----
function show() {
  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  display.textContent = `${m}:${s}`;
  document.title = timerId ? `${m}:${s} — Focus` : 'Focus — productivité';
}

// ----- Contrôle du minuteur -----
function start() {
  endAt = Date.now() + remaining * 1000; // heure réelle : pas de dérive si l'onglet est en arrière-plan
  timerId = setInterval(tick, 250);
  toggleBtn.textContent = 'Pause';
}

function pause() {
  clearInterval(timerId);
  timerId = null;
  toggleBtn.textContent = 'Reprendre';
  show();
}

function reset() {
  clearInterval(timerId);
  timerId = null;
  remaining = MODES[mode].minutes * 60;
  toggleBtn.textContent = 'Démarrer';
  show();
}

function tick() {
  remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  show();
  if (remaining === 0) finish();
}

// Fin de session : on l'enregistre, on prévient l'utilisateur
async function finish() {
  const { minutes, type } = MODES[mode];
  reset();
  beep();
  await api('/api/pomodoros', json('POST', { type, minutes }));
  loadStats();
}

// Petit bip généré par le navigateur (pas de fichier audio)
function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

// ----- Statistiques : sessions de concentration terminées aujourd'hui -----
async function loadStats() {
  const sessions = await api('/api/pomodoros');
  const today = new Date().toDateString();
  const done = sessions.filter((s) => s.type === 'focus' && new Date(s.at).toDateString() === today);
  const total = done.reduce((sum, s) => sum + s.minutes, 0);
  stats.textContent = `Aujourd'hui : ${done.length} session${done.length > 1 ? 's' : ''} de concentration, ${total} min.`;
}

export function initPomodoro() {
  toggleBtn.addEventListener('click', () => (timerId ? pause() : start()));
  resetBtn.addEventListener('click', reset);

  modeButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode;
      modeButtons.forEach((b) => b.classList.toggle('active', b === btn));
      reset();
    })
  );

  show();
  loadStats();
}
