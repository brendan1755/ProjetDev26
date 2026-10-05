// ============================================================
// calendar.js — agenda mensuel : grille + événements du jour
// ============================================================
import { api, json } from './api.js';

const title = document.getElementById('cal-title');
const grid = document.getElementById('cal-grid');
const dayTitle = document.getElementById('day-title');
const dayList = document.getElementById('day-events');
const form = document.getElementById('event-form');
const titleInput = document.getElementById('event-title');
const timeInput = document.getElementById('event-time');

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const pad = (n) => String(n).padStart(2, '0');
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`; // m : 0-11 -> "2026-10-05"

const now = new Date();
let year = now.getFullYear();
let month = now.getMonth();
let selected = toISO(year, month, now.getDate()); // jour sélectionné
let events = [];

// ----- Grille du mois -----
function renderGrid() {
  title.textContent = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  grid.innerHTML = '';

  // En-têtes des jours de la semaine
  DAYS.forEach((d) => {
    const h = document.createElement('div');
    h.className = 'cal-dow';
    h.textContent = d;
    grid.appendChild(h);
  });

  // Cases vides avant le 1er (la semaine commence le lundi)
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  for (let i = 0; i < offset; i++) grid.appendChild(document.createElement('div'));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = toISO(now.getFullYear(), now.getMonth(), now.getDate());

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISO(year, month, d);
    const count = events.filter((e) => e.date === iso).length;

    const cell = document.createElement('button');
    cell.className = 'cal-day' + (iso === selected ? ' selected' : '') + (iso === todayISO ? ' today' : '');
    cell.innerHTML = `<span>${d}</span>` + (count ? `<small>${count}</small>` : '');
    cell.addEventListener('click', () => {
      selected = iso;
      render();
    });
    grid.appendChild(cell);
  }
}

// ----- Événements du jour sélectionné -----
function renderDay() {
  const [y, m, d] = selected.split('-').map(Number);
  dayTitle.textContent = new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const todays = events.filter((e) => e.date === selected).sort((a, b) => a.time.localeCompare(b.time));
  dayList.innerHTML = '';
  if (!todays.length) dayList.innerHTML = '<li class="empty">Rien de prévu ce jour-là.</li>';

  todays.forEach((ev) => {
    const li = document.createElement('li');
    li.className = 'item';

    const label = document.createElement('span');
    label.textContent = (ev.time ? ev.time + ' · ' : '') + ev.title;

    const del = document.createElement('button');
    del.className = 'danger';
    del.textContent = 'Supprimer';
    del.addEventListener('click', async () => {
      await api(`/api/events/${ev.id}`, { method: 'DELETE' });
      events = events.filter((e) => e.id !== ev.id);
      render();
    });

    li.append(label, del);
    dayList.appendChild(li);
  });
}

function render() {
  renderGrid();
  renderDay();
}

// Change de mois (delta = -1 ou +1) en gérant le passage d'année
function shiftMonth(delta) {
  month += delta;
  if (month < 0) { month = 11; year--; }
  if (month > 11) { month = 0; year++; }
  render();
}

export async function initCalendar() {
  document.getElementById('cal-prev').addEventListener('click', () => shiftMonth(-1));
  document.getElementById('cal-next').addEventListener('click', () => shiftMonth(1));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    events.push(await api('/api/events', json('POST', { title: titleInput.value, date: selected, time: timeInput.value })));
    titleInput.value = '';
    timeInput.value = '';
    render();
  });

  events = await api('/api/events');
  render();
}
