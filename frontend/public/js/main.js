// ============================================================
// main.js — point d'entrée : navigation par onglets + démarrage
// ============================================================
import { initTodos } from './todos.js';
import { initPomodoro } from './pomodoro.js';
import { initCalendar } from './calendar.js';

// ----- Onglets : on affiche une section, on masque les autres -----
const tabButtons = document.querySelectorAll('#tabs button');
tabButtons.forEach((btn) =>
  btn.addEventListener('click', () => {
    tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('main > section').forEach((s) => {
      s.hidden = s.id !== `tab-${btn.dataset.tab}`;
    });
  })
);

// ----- Affichage des erreurs (API injoignable, données invalides…) -----
const errorBox = document.getElementById('error');
window.addEventListener('unhandledrejection', (e) => {
  errorBox.textContent = e.reason.message;
  errorBox.hidden = false;
  setTimeout(() => (errorBox.hidden = true), 5000);
});

initTodos();
initPomodoro();
initCalendar();
